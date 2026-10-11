const BillableItem = require('../models/BillableItem');
const RateCard = require('../models/RateCard');
const Invoice = require('../models/Invoice');
const Deposit = require('../models/Deposit');
const FinancialAdjustment = require('../models/FinancialAdjustment');
const BillingQuery = require('../models/BillingQuery');
const PaymentTransaction = require('../models/PaymentTransaction');
const PaymentAttempt = require('../models/PaymentAttempt');
const BedAssignment = require('../models/BedAssignment');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const Admission = require('../models/Admission');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');
const NotificationService = require('./NotificationService');
const DocumentService = require('./DocumentService');
const crypto = require('crypto');

class BillingService {
  /**
   * Safe financial rounding to exactly 2 decimal places
   */
  static roundMoney(amount) {
    const num = Number(amount || 0);
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  /**
   * Fetch effective rate card for service on a given date (Rate Versioning)
   */
  static async getEffectiveRate(serviceCode, serviceDate = new Date()) {
    const targetDate = new Date(serviceDate);
    const rate = await RateCard.findOne({
      serviceCode: serviceCode.toUpperCase().trim(),
      active: true,
      effectiveFrom: { $lte: targetDate },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: targetDate } }]
    }).sort({ effectiveFrom: -1 }).lean();

    return rate;
  }

  /**
   * Ingest and validate a billable item charge
   */
  static async addBillableItem({
    patientId,
    patientName,
    visitId,
    admissionId,
    sourceModule,
    sourceType = 'MANUAL_ENTRY',
    sourceId,
    serviceCode,
    description,
    quantity = 1,
    unitPrice,
    serviceDate = new Date(),
    notes = '',
    actorUser,
    correlationId
  }) {
    // 1. Prevent duplicate charge ingestion from identical source
    if (sourceId && sourceModule && sourceType) {
      const existing = await BillableItem.findOne({
        sourceModule,
        sourceType,
        sourceId,
        status: { $nin: ['VOID', 'CANCELLED', 'REVERSED'] }
      });

      if (existing) {
        throw new Error(`Duplicate charge: item for source ${sourceModule}:${sourceType}:${sourceId} already recorded (${existing.chargeId}).`);
      }
    }

    // 2. Resolve price and tax from rate card if not explicitly passed
    let resolvedUnitPrice = unitPrice !== undefined ? Number(unitPrice) : null;
    let resolvedTaxRate = 0;
    let resolvedDesc = description;

    if (serviceCode) {
      const rate = await this.getEffectiveRate(serviceCode, serviceDate);
      if (rate) {
        if (resolvedUnitPrice === null) resolvedUnitPrice = rate.basePrice;
        resolvedTaxRate = rate.taxRate || 0;
        if (!resolvedDesc) resolvedDesc = rate.serviceName;
      }
    }

    if (resolvedUnitPrice === null || isNaN(resolvedUnitPrice)) {
      resolvedUnitPrice = 0;
    }

    const qty = Math.max(0.01, Number(quantity || 1));
    const grossAmount = this.roundMoney(qty * resolvedUnitPrice);
    const taxAmount = this.roundMoney(grossAmount * resolvedTaxRate);
    const netAmount = this.roundMoney(grossAmount + taxAmount);

    // Resolve patient name if missing
    let pName = patientName;
    if (!pName && patientId) {
      const p = await Patient.findOne({ patientId }).lean();
      if (p) pName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    }

    const chargeId = await IdGeneratorService.generateBillableItemId();
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    const item = new BillableItem({
      chargeId,
      patientId,
      patientName: pName || '',
      visitId,
      admissionId,
      sourceModule: (sourceModule || 'OTHER').toUpperCase(),
      sourceType: (sourceType || 'MANUAL_ENTRY').toUpperCase(),
      sourceId: sourceId || chargeId,
      serviceCode: serviceCode ? serviceCode.toUpperCase() : 'SRV-GEN',
      description: resolvedDesc || 'Hospital Service Charge',
      quantity: qty,
      unitPrice: resolvedUnitPrice,
      grossAmount,
      taxAmount,
      discountAmount: 0,
      insuranceAmount: 0,
      netAmount,
      status: 'VALIDATED', // validated upon ingestion
      serviceDate: new Date(serviceDate),
      notes,
      correlationId: corrId
    });

    await item.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      action: 'BILLABLE_ITEM_CREATED',
      module: 'BILLING',
      entityType: 'BillableItem',
      entityId: chargeId,
      details: `Charge ${chargeId} added: ${item.description} (₹${netAmount}) for patient ${patientId}`,
      correlationId: corrId
    });

    return item;
  }

  /**
   * Create or update draft invoice aggregating billable items and room stay
   */
  static async createDraftInvoice({
    patientId,
    patientName,
    visitId,
    admissionId,
    invoiceType = 'GENERAL',
    customItems = [],
    depositAmount = 0,
    coveredAmount = 0,
    discountAmount = 0,
    actorUser,
    correlationId
  }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    // 1. Fetch pending/validated billable items
    const query = { status: 'VALIDATED' };
    if (admissionId) query.admissionId = admissionId;
    else if (patientId) query.patientId = patientId;

    const billableItems = await BillableItem.find(query).lean();

    const invoiceItems = [];

    // 2. If admissionId is provided, calculate room accommodation charges
    if (admissionId) {
      const bedAssignments = await BedAssignment.find({ admissionId }).sort({ assignedAt: 1 }).lean();
      for (const assignment of bedAssignments) {
        const bed = await Bed.findOne({ bedId: assignment.bedId }).lean();
        const dailyRate = bed?.dailyRate || 1500;
        const startDate = new Date(assignment.assignedAt);
        const endDate = assignment.vacatedAt ? new Date(assignment.vacatedAt) : new Date();
        const diffTime = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
        const totalStay = this.roundMoney(dailyRate * diffTime);

        invoiceItems.push({
          category: 'ROOM_ACCOMMODATION',
          sourceModule: 'ROOM_ACCOMMODATION',
          sourceType: 'BED_STAY',
          sourceId: assignment.assignmentId || assignment.bedId,
          serviceCode: bed?.categoryCode || 'BED-STAY',
          description: `Room & Bed Accommodation - ${assignment.wardName || bed?.wardName || 'Ward'} (${assignment.bedNumber || bed?.bedNumber || assignment.bedId}) - ${diffTime} day(s)`,
          quantity: diffTime,
          unitPrice: dailyRate,
          grossAmount: totalStay,
          taxAmount: 0,
          discountAmount: 0,
          insuranceAmount: 0,
          netAmount: totalStay,
          totalPrice: totalStay,
          serviceDate: assignment.assignedAt
        });
      }
    }

    // 3. Add billable items
    for (const bi of billableItems) {
      invoiceItems.push({
        category: bi.sourceModule,
        sourceModule: bi.sourceModule,
        sourceType: bi.sourceType,
        sourceId: bi.sourceId || bi.chargeId,
        serviceCode: bi.serviceCode,
        description: bi.description,
        quantity: bi.quantity,
        unitPrice: bi.unitPrice,
        grossAmount: bi.grossAmount,
        taxAmount: bi.taxAmount || 0,
        discountAmount: bi.discountAmount || 0,
        insuranceAmount: bi.insuranceAmount || 0,
        netAmount: bi.netAmount,
        totalPrice: bi.netAmount,
        serviceDate: bi.serviceDate,
        serviceReferenceId: bi.chargeId
      });
    }

    // 4. Append any custom items provided in request
    if (Array.isArray(customItems) && customItems.length > 0) {
      for (const ci of customItems) {
        const qty = Number(ci.quantity || 1);
        const price = Number(ci.unitPrice || ci.totalPrice || 0);
        const tot = this.roundMoney(qty * price);
        invoiceItems.push({
          category: ci.category || 'OTHER',
          sourceModule: ci.sourceModule || ci.category || 'OTHER',
          sourceType: 'MANUAL_ENTRY',
          sourceId: ci.sourceId || `CUST-${Date.now()}`,
          serviceCode: ci.serviceCode || 'CUSTOM',
          description: ci.description || 'Custom Bill Item',
          quantity: qty,
          unitPrice: price,
          grossAmount: tot,
          taxAmount: Number(ci.taxAmount || 0),
          discountAmount: Number(ci.discountAmount || 0),
          insuranceAmount: Number(ci.insuranceAmount || 0),
          netAmount: tot,
          totalPrice: tot,
          serviceDate: ci.serviceDate ? new Date(ci.serviceDate) : new Date()
        });
      }
    }

    // Baseline consultation item if completely empty
    if (invoiceItems.length === 0) {
      invoiceItems.push({
        category: 'CONSULTATION',
        sourceModule: 'CONSULTATION',
        sourceType: 'CONSULTATION_FEE',
        sourceId: `CONS-${Date.now()}`,
        serviceCode: 'CONS-GEN',
        description: 'General Hospital Clinical Consultation',
        quantity: 1,
        unitPrice: 1000,
        grossAmount: 1000,
        taxAmount: 0,
        discountAmount: 0,
        insuranceAmount: 0,
        netAmount: 1000,
        totalPrice: 1000,
        serviceDate: new Date()
      });
    }

    // Resolve patient name
    let pName = patientName;
    if (!pName && patientId) {
      const p = await Patient.findOne({ patientId }).lean();
      if (p) pName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    }

    const calculatedGross = this.roundMoney(invoiceItems.reduce((acc, it) => acc + (it.grossAmount || it.totalPrice), 0));
    const calculatedTax = this.roundMoney(invoiceItems.reduce((acc, it) => acc + (it.taxAmount || 0), 0));

    const depApplied = this.roundMoney(Number(depositAmount || 0));
    const insCovered = this.roundMoney(Number(coveredAmount || 0));
    const discTotal = this.roundMoney(Number(discountAmount || 0));

    const netPayable = Math.max(0, this.roundMoney(calculatedGross + calculatedTax - depApplied - insCovered - discTotal));

    const invoiceId = await IdGeneratorService.generateInvoiceId();

    const invoice = new Invoice({
      invoiceId,
      patientId,
      patientName: pName || '',
      visitId,
      admissionId,
      invoiceType: invoiceType || (admissionId ? 'FINAL_DISCHARGE' : 'GENERAL'),
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default due in 15 days
      items: invoiceItems,
      grossTotal: calculatedGross,
      taxAmount: calculatedTax,
      discountAmount: discTotal,
      coveredAmount: insCovered,
      depositAmount: depApplied,
      payableAmount: netPayable,
      paidAmount: 0,
      outstandingBalance: netPayable,
      status: 'DRAFT',
      createdByUserId: actorUser?.userId || 'SYSTEM',
      correlationId: corrId
    });

    await invoice.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      action: 'INVOICE_CREATED',
      module: 'BILLING',
      entityType: 'Invoice',
      entityId: invoiceId,
      details: `Created draft invoice ${invoiceId} for patient ${patientId}. Gross: ₹${calculatedGross}, Net: ₹${netPayable}`,
      correlationId: corrId
    });

    return invoice;
  }

  /**
   * Finalize invoice: locks financial figures and marks items INVOICED
   * Immutability Rule: Finalized invoices cannot be silently edited.
   */
  static async finalizeInvoice({ invoiceId, actorUser, correlationId }) {
    const invoice = await Invoice.findOne({
      $or: [{ invoiceId }, { _id: (invoiceId && invoiceId.match(/^[0-9a-fA-F]{24}$/)) ? invoiceId : null }]
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found.`);
    }

    // Critical Immutability Check:
    if (['FINALIZED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status)) {
      return {
        invoice,
        isExisting: true,
        message: 'Invoice has already been finalized.'
      };
    }

    if (invoice.status === 'CANCELLED' || invoice.status === 'VOID') {
      throw new Error(`Cannot finalize an invoice with status ${invoice.status}.`);
    }

    invoice.status = invoice.payableAmount === 0 ? 'PAID' : 'FINALIZED';
    invoice.finalizedAt = new Date();
    await invoice.save();

    // Mark referenced billable items as INVOICED
    const referencedChargeIds = invoice.items
      .map(it => it.serviceReferenceId || it.sourceId)
      .filter(Boolean);

    if (referencedChargeIds.length > 0) {
      await BillableItem.updateMany(
        { chargeId: { $in: referencedChargeIds } },
        { $set: { status: 'INVOICED', invoiceId: invoice.invoiceId } }
      );
    }

    const corrId = correlationId || invoice.correlationId || IdGeneratorService.generateCorrelationId();

    // Audit Event
    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      action: 'INVOICE_FINALIZED',
      module: 'BILLING',
      entityType: 'Invoice',
      entityId: invoice.invoiceId,
      details: `Invoice ${invoice.invoiceId} finalized. Payable: ₹${invoice.payableAmount}`,
      correlationId: corrId
    });

    // Notify patient
    try {
      await NotificationService.sendNotification({
        recipientId: invoice.patientId,
        channel: 'SMS',
        event: 'INVOICE_FINALIZED',
        title: 'Hospital Invoice Ready',
        message: `Your hospital invoice ${invoice.invoiceId} for ₹${invoice.payableAmount} is ready. Please view and pay via the portal.`,
        entityType: 'Invoice',
        entityId: invoice.invoiceId,
        correlationId: corrId
      });
    } catch (notifErr) {
      console.error('[Billing Notification Error]:', notifErr.message);
    }

    return {
      invoice,
      isExisting: false,
      message: 'Invoice finalized successfully.'
    };
  }

  /**
   * Cancel an invoice with required reason
   */
  static async cancelInvoice({ invoiceId, cancellationReason, actorUser, correlationId }) {
    const invoice = await Invoice.findOne({
      $or: [{ invoiceId }, { _id: (invoiceId && invoiceId.match(/^[0-9a-fA-F]{24}$/)) ? invoiceId : null }]
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found.`);
    }

    if (invoice.status === 'PAID') {
      throw new Error('Cannot cancel a fully settled/paid invoice directly. Use authorized refund process.');
    }

    invoice.status = 'CANCELLED';
    invoice.cancelledAt = new Date();
    invoice.cancellationReason = cancellationReason || 'Cancelled by authorized staff';
    await invoice.save();

    // Release billable items back to VALIDATED
    await BillableItem.updateMany(
      { invoiceId: invoice.invoiceId },
      { $set: { status: 'VALIDATED', invoiceId: null } }
    );

    const corrId = correlationId || invoice.correlationId || IdGeneratorService.generateCorrelationId();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      action: 'INVOICE_CANCELLED',
      module: 'BILLING',
      entityType: 'Invoice',
      entityId: invoice.invoiceId,
      details: `Invoice ${invoice.invoiceId} cancelled. Reason: ${invoice.cancellationReason}`,
      correlationId: corrId
    });

    return invoice;
  }

  /**
   * Record patient advance/deposit
   */
  static async recordDeposit({
    patientId,
    patientName,
    visitId,
    admissionId,
    amount,
    paymentMethod = 'CASH',
    notes = '',
    actorUser,
    correlationId
  }) {
    const depositAmt = this.roundMoney(Number(amount));
    if (isNaN(depositAmt) || depositAmt <= 0) {
      throw new Error('Valid deposit amount greater than zero is required.');
    }

    // Resolve patient name
    let pName = patientName;
    if (!pName && patientId) {
      const p = await Patient.findOne({ patientId }).lean();
      if (p) pName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    }

    const depositNumber = await IdGeneratorService.generateDepositNumber();
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    const deposit = new Deposit({
      depositNumber,
      patientId,
      patientName: pName || '',
      visitId,
      admissionId,
      amount: depositAmt,
      usedAmount: 0,
      remainingAmount: depositAmt,
      paymentMethod,
      status: 'ACTIVE',
      receivedAt: new Date(),
      notes,
      createdByUserId: actorUser?.userId || 'SYSTEM',
      correlationId: corrId
    });

    await deposit.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      action: 'DEPOSIT_CREATED',
      module: 'BILLING',
      entityType: 'Deposit',
      entityId: depositNumber,
      details: `Deposit of ₹${depositAmt} recorded for patient ${patientId}`,
      correlationId: corrId
    });

    return deposit;
  }

  /**
   * Apply an active deposit to an invoice
   */
  static async applyDepositToInvoice({ depositId, invoiceId, amount, actorUser, correlationId }) {
    const deposit = await Deposit.findOne({
      $or: [{ depositNumber: depositId }, { _id: (depositId && depositId.match(/^[0-9a-fA-F]{24}$/)) ? depositId : null }]
    });

    if (!deposit) {
      throw new Error(`Deposit ${depositId} not found.`);
    }

    if (deposit.status !== 'ACTIVE' && deposit.status !== 'PARTIALLY_APPLIED') {
      throw new Error(`Deposit status is ${deposit.status} and cannot be applied.`);
    }

    const invoice = await Invoice.findOne({
      $or: [{ invoiceId }, { _id: (invoiceId && invoiceId.match(/^[0-9a-fA-F]{24}$/)) ? invoiceId : null }]
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found.`);
    }

    if (invoice.status === 'PAID') {
      throw new Error('Invoice is already fully paid.');
    }

    // Determine application amount
    const available = deposit.remainingAmount;
    const requested = amount ? Number(amount) : available;
    const toApply = this.roundMoney(Math.min(requested, available, invoice.outstandingBalance || invoice.payableAmount));

    if (toApply <= 0) {
      throw new Error('Calculated application amount is zero.');
    }

    // Update Deposit
    deposit.usedAmount = this.roundMoney(deposit.usedAmount + toApply);
    deposit.remainingAmount = this.roundMoney(deposit.amount - deposit.usedAmount);
    deposit.status = deposit.remainingAmount === 0 ? 'FULLY_APPLIED' : 'PARTIALLY_APPLIED';
    deposit.appliedInvoices.push({
      invoiceId: invoice.invoiceId,
      amountApplied: toApply,
      appliedAt: new Date()
    });
    await deposit.save();

    // Update Invoice
    invoice.depositAmount = this.roundMoney((invoice.depositAmount || 0) + toApply);
    invoice.payableAmount = Math.max(0, this.roundMoney(invoice.grossTotal + (invoice.taxAmount || 0) - invoice.coveredAmount - invoice.depositAmount - invoice.discountAmount));
    invoice.outstandingBalance = Math.max(0, this.roundMoney(invoice.payableAmount - invoice.paidAmount));
    if (invoice.outstandingBalance === 0) {
      invoice.status = 'PAID';
    }
    await invoice.save();

    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      action: 'DEPOSIT_APPLIED',
      module: 'BILLING',
      entityType: 'Deposit',
      entityId: deposit.depositNumber,
      details: `Deposit ${deposit.depositNumber} applied ₹${toApply} to invoice ${invoice.invoiceId}`,
      correlationId: corrId
    });

    return {
      deposit,
      invoice,
      appliedAmount: toApply
    };
  }

  /**
   * Request a financial adjustment (Discount, Waiver, Credit)
   */
  static async requestAdjustment({ invoiceId, type, amount, reason, actorUser, correlationId }) {
    const invoice = await Invoice.findOne({
      $or: [{ invoiceId }, { _id: (invoiceId && invoiceId.match(/^[0-9a-fA-F]{24}$/)) ? invoiceId : null }]
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found.`);
    }

    const adjAmt = this.roundMoney(Number(amount));
    if (isNaN(adjAmt) || adjAmt <= 0) {
      throw new Error('Valid adjustment amount greater than zero is required.');
    }

    const adjustmentNumber = await IdGeneratorService.generateAdjustmentNumber();
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    const adjustment = new FinancialAdjustment({
      adjustmentNumber,
      invoiceId: invoice.invoiceId,
      patientId: invoice.patientId,
      type: (type || 'DISCOUNT').toUpperCase(),
      amount: adjAmt,
      reason: reason || 'Authorized billing adjustment',
      status: 'REQUESTED',
      requestedBy: actorUser?.userId || actorUser?.username || 'STAFF',
      requestedAt: new Date(),
      correlationId: corrId
    });

    await adjustment.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'STAFF',
      action: 'ADJUSTMENT_REQUESTED',
      module: 'BILLING',
      entityType: 'FinancialAdjustment',
      entityId: adjustmentNumber,
      details: `Adjustment of ₹${adjAmt} (${type}) requested for invoice ${invoice.invoiceId}`,
      correlationId: corrId
    });

    return adjustment;
  }

  /**
   * Review & approve/reject financial adjustment
   * SAFETY RULE: RPA must NEVER independently approve an adjustment!
   */
  static async reviewAdjustment({ adjustmentNumber, approved, rejectionReason, actorUser, correlationId }) {
    // Financial Safety Principle check:
    if (actorUser?.role === 'RPA_WORKER' || actorUser?.isRpa) {
      throw new Error('RPA agents are strictly prohibited from independently approving financial adjustments.');
    }

    const adjustment = await FinancialAdjustment.findOne({
      $or: [{ adjustmentNumber }, { _id: (adjustmentNumber && adjustmentNumber.match(/^[0-9a-fA-F]{24}$/)) ? adjustmentNumber : null }]
    });

    if (!adjustment) {
      throw new Error(`Financial adjustment ${adjustmentNumber} not found.`);
    }

    if (adjustment.status !== 'REQUESTED' && adjustment.status !== 'UNDER_REVIEW') {
      throw new Error(`Adjustment has status ${adjustment.status} and cannot be reviewed.`);
    }

    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    if (approved) {
      adjustment.status = 'APPROVED';
      adjustment.approvedBy = actorUser?.userId || actorUser?.username || 'FINANCE_MANAGER';
      adjustment.approvedAt = new Date();
      await adjustment.save();

      await AuditService.logEvent({
        userId: actorUser?.userId || 'FINANCE_MANAGER',
        action: 'ADJUSTMENT_APPROVED',
        module: 'BILLING',
        entityType: 'FinancialAdjustment',
        entityId: adjustment.adjustmentNumber,
        details: `Adjustment ${adjustment.adjustmentNumber} for ₹${adjustment.amount} approved by ${adjustment.approvedBy}`,
        correlationId: corrId
      });

      // Automatically apply approved adjustment to invoice
      return await this.applyAdjustment({ adjustmentNumber: adjustment.adjustmentNumber, actorUser, correlationId: corrId });
    } else {
      adjustment.status = 'REJECTED';
      adjustment.rejectionReason = rejectionReason || 'Rejected by finance management';
      await adjustment.save();

      await AuditService.logEvent({
        userId: actorUser?.userId || 'FINANCE_MANAGER',
        action: 'ADJUSTMENT_REJECTED',
        module: 'BILLING',
        entityType: 'FinancialAdjustment',
        entityId: adjustment.adjustmentNumber,
        details: `Adjustment ${adjustment.adjustmentNumber} rejected: ${adjustment.rejectionReason}`,
        correlationId: corrId
      });

      return adjustment;
    }
  }

  /**
   * Apply an already approved adjustment to invoice
   */
  static async applyAdjustment({ adjustmentNumber, actorUser, correlationId }) {
    const adjustment = await FinancialAdjustment.findOne({
      $or: [{ adjustmentNumber }, { _id: (adjustmentNumber && adjustmentNumber.match(/^[0-9a-fA-F]{24}$/)) ? adjustmentNumber : null }]
    });

    if (!adjustment) {
      throw new Error(`Adjustment ${adjustmentNumber} not found.`);
    }

    if (adjustment.status !== 'APPROVED') {
      throw new Error(`Adjustment status is ${adjustment.status}; only APPROVED adjustments can be applied.`);
    }

    const invoice = await Invoice.findOne({ invoiceId: adjustment.invoiceId });
    if (!invoice) {
      throw new Error(`Invoice ${adjustment.invoiceId} not found.`);
    }

    // Apply adjustment
    if (adjustment.type === 'DISCOUNT' || adjustment.type === 'WAIVER') {
      invoice.discountAmount = this.roundMoney((invoice.discountAmount || 0) + adjustment.amount);
    } else {
      invoice.adjustmentTotal = this.roundMoney((invoice.adjustmentTotal || 0) + adjustment.amount);
    }

    invoice.payableAmount = Math.max(0, this.roundMoney(
      invoice.grossTotal + (invoice.taxAmount || 0) - (invoice.coveredAmount || 0) - (invoice.depositAmount || 0) - (invoice.discountAmount || 0) - (invoice.adjustmentTotal || 0)
    ));
    invoice.outstandingBalance = Math.max(0, this.roundMoney(invoice.payableAmount - invoice.paidAmount));
    if (invoice.outstandingBalance === 0) {
      invoice.status = 'PAID';
    }
    await invoice.save();

    adjustment.status = 'APPLIED';
    adjustment.appliedAt = new Date();
    await adjustment.save();

    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      action: 'ADJUSTMENT_APPLIED',
      module: 'BILLING',
      entityType: 'FinancialAdjustment',
      entityId: adjustment.adjustmentNumber,
      details: `Adjustment ${adjustment.adjustmentNumber} of ₹${adjustment.amount} applied to invoice ${invoice.invoiceId}. New balance: ₹${invoice.outstandingBalance}`,
      correlationId: corrId
    });

    return {
      adjustment,
      invoice
    };
  }

  /**
   * Create billing query / dispute
   */
  static async createBillingQuery({
    patientId,
    patientName,
    invoiceId,
    category = 'CHARGE_CLARIFICATION',
    description,
    actorUser,
    correlationId
  }) {
    const queryNumber = await IdGeneratorService.generateBillingQueryNumber();
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    let pName = patientName;
    if (!pName && patientId) {
      const p = await Patient.findOne({ patientId }).lean();
      if (p) pName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    }

    const query = new BillingQuery({
      queryNumber,
      patientId,
      patientName: pName || '',
      invoiceId,
      submittedByUserId: actorUser?.userId || actorUser?.username || 'PATIENT',
      category: category || 'CHARGE_CLARIFICATION',
      description,
      status: 'OPEN',
      correlationId: corrId
    });

    await query.save();

    // Mark invoice dispute status if not already
    const invoice = await Invoice.findOne({ invoiceId });
    if (invoice) {
      invoice.disputeStatus = 'RAISED';
      invoice.disputeReason = description;
      await invoice.save();
    }

    await AuditService.logEvent({
      userId: actorUser?.userId || 'PATIENT',
      action: 'BILLING_QUERY_CREATED',
      module: 'BILLING',
      entityType: 'BillingQuery',
      entityId: queryNumber,
      details: `Billing query ${queryNumber} opened for invoice ${invoiceId}: ${description}`,
      correlationId: corrId
    });

    return query;
  }

  /**
   * Resolve billing query
   */
  static async resolveBillingQuery({ queryNumber, resolution, actorUser, correlationId }) {
    const query = await BillingQuery.findOne({
      $or: [{ queryNumber }, { _id: (queryNumber && queryNumber.match(/^[0-9a-fA-F]{24}$/)) ? queryNumber : null }]
    });

    if (!query) {
      throw new Error(`Billing query ${queryNumber} not found.`);
    }

    query.status = 'RESOLVED';
    query.resolution = resolution || 'Resolved by billing operations team';
    query.resolvedBy = actorUser?.userId || actorUser?.username || 'BILLING_STAFF';
    query.resolvedAt = new Date();
    await query.save();

    // Update invoice dispute status
    const invoice = await Invoice.findOne({ invoiceId: query.invoiceId });
    if (invoice) {
      invoice.disputeStatus = 'RESOLVED';
      await invoice.save();
    }

    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'BILLING_STAFF',
      action: 'BILLING_QUERY_RESOLVED',
      module: 'BILLING',
      entityType: 'BillingQuery',
      entityId: query.queryNumber,
      details: `Billing query ${query.queryNumber} resolved by ${query.resolvedBy}: ${resolution}`,
      correlationId: corrId
    });

    return query;
  }

  /**
   * Reconcile payment gateway settlement records against hospital ledger
   */
  static async reconcileGatewaySettlement(settlementRecords = [], actorUser) {
    const results = {
      totalRecords: settlementRecords.length,
      matched: 0,
      mismatched: 0,
      exceptions: []
    };

    for (const record of settlementRecords) {
      const { transactionId, gatewayReferenceId, amount, status } = record;
      const tx = await PaymentTransaction.findOne({
        $or: [{ transactionId }, { gatewayReferenceId }]
      });

      if (!tx) {
        results.mismatched++;
        const ex = await ExceptionService.createException({
          code: 'PAYMENT_RECONCILIATION_MISMATCH',
          module: 'BILLING',
          severity: 'HIGH',
          message: `Gateway settlement transaction ${transactionId || gatewayReferenceId} not found in hospital ledger.`,
          referenceType: 'PaymentTransaction',
          referenceId: transactionId || gatewayReferenceId,
          reportedBy: actorUser?.userId || 'RECONCILIATION_JOB'
        });
        results.exceptions.push({ record, issue: 'TRANSACTION_NOT_FOUND', exceptionId: ex.exceptionId });
        continue;
      }

      const recAmount = Number(amount);
      if (Math.abs(tx.amount - recAmount) > 0.01) {
        results.mismatched++;
        const ex = await ExceptionService.createException({
          code: 'AMOUNT_MISMATCH',
          module: 'BILLING',
          severity: 'HIGH',
          message: `Amount mismatch for txn ${tx.transactionId}: Gateway=${recAmount}, Hospital Ledger=${tx.amount}`,
          referenceType: 'PaymentTransaction',
          referenceId: tx.transactionId,
          reportedBy: actorUser?.userId || 'RECONCILIATION_JOB'
        });
        results.exceptions.push({ record, issue: 'AMOUNT_MISMATCH', exceptionId: ex.exceptionId });
        continue;
      }

      if (tx.status !== 'SUCCESS' && (status === 'SUCCESS' || status === 'SETTLED')) {
        results.mismatched++;
        const ex = await ExceptionService.createException({
          code: 'PAYMENT_MISMATCH',
          module: 'BILLING',
          severity: 'HIGH',
          message: `Status mismatch for txn ${tx.transactionId}: Gateway=${status}, Hospital Ledger=${tx.status}`,
          referenceType: 'PaymentTransaction',
          referenceId: tx.transactionId,
          reportedBy: actorUser?.userId || 'RECONCILIATION_JOB'
        });
        results.exceptions.push({ record, issue: 'STATUS_MISMATCH', exceptionId: ex.exceptionId });
        continue;
      }

      results.matched++;
    }

    return results;
  }

  /**
   * Get billing dashboard executive summary
   */
  static async getDashboardSummary() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      todayPayments,
      monthPayments,
      invoices,
      openQueriesCount,
      activeDeposits
    ] = await Promise.all([
      PaymentTransaction.find({ status: 'SUCCESS', createdAt: { $gte: todayStart } }).lean(),
      PaymentTransaction.find({ status: 'SUCCESS', createdAt: { $gte: monthStart } }).lean(),
      Invoice.find({ status: { $ne: 'CANCELLED' } }).lean(),
      BillingQuery.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
      Deposit.find({ status: { $in: ['ACTIVE', 'PARTIALLY_APPLIED'] } }).lean()
    ]);

    const todayRevenue = this.roundMoney(todayPayments.reduce((acc, p) => acc + (p.amount || 0), 0));
    const mtdRevenue = this.roundMoney(monthPayments.reduce((acc, p) => acc + (p.amount || 0), 0));

    let grossReceivables = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let paidCount = 0;
    let partiallyPaidCount = 0;
    let finalizedCount = 0;
    let overdueCount = 0;

    for (const inv of invoices) {
      grossReceivables += (inv.payableAmount || 0);
      totalCollected += (inv.paidAmount || 0);
      totalOutstanding += (inv.outstandingBalance || 0);
      if (inv.status === 'PAID') paidCount++;
      else if (inv.status === 'PARTIALLY_PAID') partiallyPaidCount++;
      else if (inv.status === 'FINALIZED') finalizedCount++;
      else if (inv.status === 'OVERDUE') overdueCount++;
    }

    const collectionRate = grossReceivables > 0
      ? this.roundMoney((totalCollected / grossReceivables) * 100)
      : 100;

    const remainingDeposits = this.roundMoney(activeDeposits.reduce((acc, d) => acc + (d.remainingAmount || 0), 0));

    return {
      todayRevenue,
      mtdRevenue,
      totalOutstanding: this.roundMoney(totalOutstanding),
      grossReceivables: this.roundMoney(grossReceivables),
      totalCollected: this.roundMoney(totalCollected),
      collectionRate,
      paidCount,
      partiallyPaidCount,
      finalizedCount,
      overdueCount,
      openQueriesCount,
      remainingDeposits,
      invoicesCount: invoices.length
    };
  }
}

module.exports = BillingService;
