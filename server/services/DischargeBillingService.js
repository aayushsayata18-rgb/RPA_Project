const BillingCharge = require('../models/BillingCharge');
const Invoice = require('../models/Invoice');
const BedAssignment = require('../models/BedAssignment');
const Bed = require('../models/Bed');
const AccommodationCategory = require('../models/AccommodationCategory');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');

class DischargeBillingService {
  /**
   * Retrieve all charges and bed accommodation history for an admission
   */
  static async getAdmissionCharges({ admissionId, patientId }) {
    // 1. Fetch all assigned bed periods from BedAssignment
    const bedAssignments = await BedAssignment.find({
      admissionId
    }).sort({ assignedAt: 1 }).lean();

    let roomCharges = [];
    let roomChargesTotal = 0;

    for (const assignment of bedAssignments) {
      const bed = await Bed.findOne({ bedId: assignment.bedId }).lean();
      let dailyRate = bed?.dailyRate || 1500;
      
      // Calculate duration in days (minimum 1 day)
      const startDate = new Date(assignment.assignedAt);
      const endDate = assignment.vacatedAt ? new Date(assignment.vacatedAt) : new Date();
      const diffTime = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
      const totalRate = dailyRate * diffTime;

      roomCharges.push({
        bedId: assignment.bedId,
        bedNumber: assignment.bedNumber || bed?.bedNumber || assignment.bedId,
        wardName: assignment.wardName || bed?.wardName || 'Ward',
        days: diffTime,
        dailyRate,
        totalAmount: totalRate,
        assignedAt: assignment.assignedAt,
        vacatedAt: assignment.vacatedAt
      });
      roomChargesTotal += totalRate;
    }

    // 2. Fetch recorded service charges from BillingCharge
    const serviceCharges = await BillingCharge.find({
      admissionId
    }).lean();

    const categorized = {
      roomAccommodation: roomChargesTotal,
      consultation: 0,
      laboratory: 0,
      pharmacy: 0,
      radiology: 0,
      nursing: 0,
      other: 0
    };

    let serviceChargesTotal = 0;
    for (const chg of serviceCharges) {
      serviceChargesTotal += chg.totalAmount || 0;
      if (chg.serviceType === 'CONSULTATION') categorized.consultation += chg.totalAmount;
      else if (chg.serviceType === 'LABORATORY') categorized.laboratory += chg.totalAmount;
      else if (chg.serviceType === 'PHARMACY') categorized.pharmacy += chg.totalAmount;
      else if (chg.serviceType === 'RADIOLOGY') categorized.radiology += chg.totalAmount;
      else if (chg.serviceType === 'NURSING') categorized.nursing += chg.totalAmount;
      else categorized.other += chg.totalAmount;
    }

    const grossTotal = roomChargesTotal + serviceChargesTotal;

    return {
      admissionId,
      patientId,
      roomCharges,
      roomChargesTotal,
      serviceCharges,
      serviceChargesTotal,
      categorized,
      grossTotal
    };
  }

  /**
   * Reconcile charges and generate final invoice
   */
  static async finalizeInvoice({
    admissionId,
    patientId,
    patientName,
    dischargeId,
    coveredAmount = 0,
    depositAmount = 0,
    discountAmount = 0,
    taxAmount = 0,
    actorUser,
    correlationId
  }) {
    // Check if invoice already finalized for this discharge/admission
    let invoice = await Invoice.findOne({
      admissionId,
      dischargeId,
      status: { $in: ['FINALIZED', 'PAID', 'PARTIALLY_PAID'] }
    });

    if (invoice) {
      return {
        invoice,
        isExisting: true
      };
    }

    // Retrieve full charges
    const chargeData = await this.getAdmissionCharges({ admissionId, patientId });
    const invoiceId = await IdGeneratorService.generateInvoiceId();

    const invoiceItems = [];

    // Add room charges as line items
    if (chargeData.roomCharges && chargeData.roomCharges.length > 0) {
      for (const rc of chargeData.roomCharges) {
        invoiceItems.push({
          category: 'ROOM_ACCOMMODATION',
          description: `Room & Bed Stay - ${rc.wardName} (${rc.bedNumber}) - ${rc.days} day(s)`,
          quantity: rc.days,
          unitPrice: rc.dailyRate,
          totalPrice: rc.totalAmount,
          serviceDate: rc.assignedAt,
          serviceReferenceId: rc.bedId
        });
      }
    } else if (chargeData.roomChargesTotal > 0) {
      invoiceItems.push({
        category: 'ROOM_ACCOMMODATION',
        description: 'Hospital Inpatient Room Accommodation',
        quantity: 1,
        unitPrice: chargeData.roomChargesTotal,
        totalPrice: chargeData.roomChargesTotal,
        serviceDate: new Date()
      });
    }

    // Add individual service charges
    for (const sc of chargeData.serviceCharges) {
      invoiceItems.push({
        category: sc.serviceType || 'OTHER',
        description: sc.serviceName,
        quantity: sc.quantity || 1,
        unitPrice: sc.unitPrice || sc.totalAmount,
        totalPrice: sc.totalAmount,
        serviceDate: sc.chargeDate || new Date(),
        serviceReferenceId: sc.chargeId
      });
    }

    // If no charges recorded at all, provide a baseline consultation charge
    if (invoiceItems.length === 0) {
      invoiceItems.push({
        category: 'CONSULTATION',
        description: 'Inpatient Medical Care & Consultation',
        quantity: 1,
        unitPrice: 1500,
        totalPrice: 1500,
        serviceDate: new Date()
      });
    }

    const calculatedGross = invoiceItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const netPayable = Math.max(0, calculatedGross + taxAmount - coveredAmount - depositAmount - discountAmount);

    invoice = new Invoice({
      invoiceId,
      patientId,
      patientName: patientName || '',
      admissionId,
      dischargeId,
      invoiceDate: new Date(),
      items: invoiceItems,
      grossTotal: calculatedGross,
      taxAmount,
      discountAmount,
      coveredAmount,
      depositAmount,
      payableAmount: netPayable,
      paidAmount: 0,
      outstandingBalance: netPayable,
      status: netPayable === 0 ? 'PAID' : 'FINALIZED',
      correlationId: correlationId || IdGeneratorService.generateCorrelationId()
    });

    await invoice.save();

    // Mark billing charges as INVOICED
    await BillingCharge.updateMany(
      { admissionId, status: { $in: ['PENDING', 'RECONCILED'] } },
      { $set: { status: 'INVOICED', invoiceId } }
    );

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      action: 'FINAL_INVOICE_GENERATED',
      module: 'DISCHARGE_BILLING',
      entityType: 'Invoice',
      entityId: invoiceId,
      details: `Generated final invoice ${invoiceId} for admission ${admissionId}. Gross: ${calculatedGross}, Payable: ${netPayable}`,
      correlationId: invoice.correlationId
    });

    return {
      invoice,
      isExisting: false
    };
  }

  /**
   * Raise a billing query or dispute
   */
  static async raiseBillingQuery({ invoiceId, disputeReason, raisedBy, actorUser, correlationId }) {
    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found.`);
    }

    invoice.status = 'DISPUTED';
    invoice.disputeReason = disputeReason;
    invoice.disputeStatus = 'RAISED';
    await invoice.save();

    await ExceptionService.createException({
      code: 'BILLING_MISMATCH',
      module: 'DISCHARGE_BILLING',
      severity: 'MEDIUM',
      message: `Billing dispute raised for invoice ${invoiceId}: ${disputeReason}`,
      referenceType: 'Invoice',
      referenceId: invoiceId,
      correlationId,
      reportedBy: actorUser?.userId || raisedBy || 'PATIENT'
    });

    await AuditService.logEvent({
      userId: actorUser?.userId || raisedBy || 'PATIENT',
      action: 'BILLING_DISPUTE_RAISED',
      module: 'DISCHARGE_BILLING',
      entityType: 'Invoice',
      entityId: invoiceId,
      details: `Billing dispute raised for invoice ${invoiceId}: ${disputeReason}`,
      correlationId
    });

    return invoice;
  }

  /**
   * Finalize discharge billing from discharge workflow
   */
  static async finalizeDischargeBilling({ dischargeId, admissionId, discountAmount = 0, actorUser, correlationId }) {
    const Discharge = require('../models/Discharge');
    const discharge = await Discharge.findOne({
      $or: [{ dischargeId }, { dischargeNumber: dischargeId }]
    });
    const admId = admissionId || discharge?.admissionId;
    const patId = discharge?.patientId;

    const result = await this.finalizeInvoice({
      admissionId: admId,
      patientId: patId,
      dischargeId: discharge?.dischargeNumber || dischargeId,
      discountAmount,
      actorUser,
      correlationId
    });

    if (discharge && result.invoice) {
      discharge.finalInvoiceId = result.invoice._id;
      discharge.finalInvoiceNumber = result.invoice.invoiceId;
      discharge.grossAmount = result.invoice.grossTotal;
      discharge.netPayable = result.invoice.payableAmount;
      if (discharge.status === 'PENDING_BILLING' || discharge.status === 'REQUESTED' || discharge.status === 'PENDING_SERVICES') {
        discharge.status = result.invoice.payableAmount === 0 ? 'READY_FOR_DISCHARGE' : 'PENDING_PAYMENT';
      }
      await discharge.save();
    }

    const invObj = result.invoice.toJSON ? result.invoice.toJSON() : result.invoice.toObject ? result.invoice.toObject() : result.invoice;
    invObj.invoiceNumber = invObj.invoiceNumber || invObj.invoiceId;
    invObj.grossAmount = invObj.grossAmount !== undefined ? invObj.grossAmount : invObj.grossTotal;
    invObj.netPayable = invObj.netPayable !== undefined ? invObj.netPayable : invObj.payableAmount;
    invObj.lineItems = invObj.lineItems || invObj.items;

    return {
      invoice: invObj,
      isExisting: result.isExisting
    };
  }
}

module.exports = DischargeBillingService;

