const BillingService = require('../services/BillingService');
const DischargeBillingService = require('../services/DischargeBillingService');
const Invoice = require('../models/Invoice');
const BillableItem = require('../models/BillableItem');
const BillingCharge = require('../models/BillingCharge');
const RateCard = require('../models/RateCard');
const Deposit = require('../models/Deposit');
const FinancialAdjustment = require('../models/FinancialAdjustment');
const BillingQuery = require('../models/BillingQuery');
const IdGeneratorService = require('../services/IdGeneratorService');

class BillingController {
  // ==========================================
  // BILLABLE ITEMS / CHARGES
  // ==========================================

  /**
   * List billable items with filters
   */
  static async listBillableItems(req, res) {
    try {
      const { patientId, admissionId, visitId, sourceModule, status, page = 1, limit = 50 } = req.query;
      const query = {};
      if (patientId) query.patientId = patientId;
      if (admissionId) query.admissionId = admissionId;
      if (visitId) query.visitId = visitId;
      if (sourceModule) query.sourceModule = sourceModule.toUpperCase();
      if (status) query.status = status.toUpperCase();

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        BillableItem.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        BillableItem.countDocuments(query)
      ]);

      const mapped = items.map(c => ({
        ...c,
        serviceName: c.serviceName || c.description,
        totalPrice: c.netAmount !== undefined ? c.netAmount : c.grossAmount
      }));

      return res.json({
        success: true,
        data: mapped,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'BILLABLE_ITEMS_LIST_FAILED', message: err.message }
      });
    }
  }

  /**
   * Ingest / Record a billable item
   */
  static async addBillableItem(req, res) {
    try {
      const item = await BillingService.addBillableItem({
        ...req.body,
        description: req.body.description || req.body.serviceName,
        unitPrice: req.body.unitPrice !== undefined ? req.body.unitPrice : req.body.unitRate,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      const obj = item.toJSON ? item.toJSON() : item;
      obj.totalPrice = obj.netAmount !== undefined ? obj.netAmount : obj.grossAmount;
      obj.serviceName = obj.serviceName || obj.description;

      return res.status(201).json({
        success: true,
        message: 'Billable item recorded successfully.',
        data: obj
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'BILLABLE_ITEM_CREATE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get billable item by ID
   */
  static async getBillableItemById(req, res) {
    try {
      const { id } = req.params;
      const item = await BillableItem.findOne({
        $or: [{ chargeId: id }, { _id: (id && id.match(/^[0-9a-fA-F]{24}$/)) ? id : null }]
      }).lean();

      if (!item) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHARGE_NOT_FOUND', message: `Billable item ${id} not found.` }
        });
      }

      return res.json({ success: true, data: { ...item, totalPrice: item.netAmount } });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'CHARGE_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * Validate a billable item
   */
  static async validateBillableItem(req, res) {
    try {
      const { id } = req.params;
      const item = await BillableItem.findOne({
        $or: [{ chargeId: id }, { _id: (id && id.match(/^[0-9a-fA-F]{24}$/)) ? id : null }]
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHARGE_NOT_FOUND', message: `Billable item ${id} not found.` }
        });
      }

      item.status = 'VALIDATED';
      await item.save();

      return res.json({
        success: true,
        message: `Charge ${item.chargeId} validated for billing.`,
        data: item
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'CHARGE_VALIDATION_FAILED', message: err.message }
      });
    }
  }

  // Backward-compatible endpoints for charges
  static async getAdmissionCharges(req, res) {
    try {
      const { admissionId } = req.params;
      const { patientId } = req.query;
      const charges = await DischargeBillingService.getAdmissionCharges({ admissionId, patientId });
      const mapped = charges.map ? charges.map(c => ({ ...c, totalPrice: c.totalAmount || c.totalPrice })) : charges;
      return res.json({ success: true, data: mapped });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'BILLING_CHARGES_FETCH_FAILED', message: err.message }
      });
    }
  }

  static async getChargesList(req, res) {
    try {
      const { admissionId, patientId, status } = req.query;
      const query = {};
      if (admissionId) query.admissionId = admissionId;
      if (patientId) query.patientId = patientId;
      if (status) query.status = status;
      const [bCharges, bItems] = await Promise.all([
        BillingCharge.find(query).sort({ createdAt: -1 }).lean(),
        BillableItem.find(query).sort({ createdAt: -1 }).lean()
      ]);
      const combined = [
        ...bItems.map(c => ({ ...c, totalPrice: c.netAmount })),
        ...bCharges.map(c => ({ ...c, totalPrice: c.totalAmount }))
      ];
      return res.json({ success: true, data: combined });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'CHARGES_FETCH_FAILED', message: err.message }
      });
    }
  }

  static async addCharge(req, res) {
    // Forward to addBillableItem logic
    return BillingController.addBillableItem(req, res);
  }

  // ==========================================
  // INVOICES
  // ==========================================

  /**
   * Create draft invoice
   */
  static async createInvoice(req, res) {
    try {
      const invoice = await BillingService.createDraftInvoice({
        ...req.body,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.status(201).json({
        success: true,
        message: 'Draft invoice created successfully.',
        data: invoice
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVOICE_CREATE_FAILED', message: err.message }
      });
    }
  }

  /**
   * List invoices with comprehensive filters
   */
  static async listInvoices(req, res) {
    try {
      const { patientId, admissionId, visitId, status, invoiceType, page = 1, limit = 50 } = req.query;
      const query = {};
      if (patientId) query.patientId = patientId;
      if (admissionId) query.admissionId = admissionId;
      if (visitId) query.visitId = visitId;
      if (status) query.status = status.toUpperCase();
      if (invoiceType) query.invoiceType = invoiceType.toUpperCase();

      const skip = (Number(page) - 1) * Number(limit);
      const [invoices, total] = await Promise.all([
        Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        Invoice.countDocuments(query)
      ]);

      const mapped = invoices.map(inv => ({
        ...inv,
        invoiceNumber: inv.invoiceNumber || inv.invoiceId,
        grossAmount: inv.grossAmount !== undefined ? inv.grossAmount : inv.grossTotal,
        netPayable: inv.netPayable !== undefined ? inv.netPayable : inv.payableAmount,
        lineItems: inv.lineItems || inv.items
      }));

      return res.json({
        success: true,
        data: mapped,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'INVOICE_LIST_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(req, res) {
    try {
      const { id } = req.params;
      const invoice = await Invoice.findOne({
        $or: [{ invoiceId: id }, { invoiceNumber: id }, { _id: (id && id.match(/^[0-9a-fA-F]{24}$/)) ? id : null }]
      }).lean();

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: { code: 'INVOICE_NOT_FOUND', message: `Invoice ${id} not found.` }
        });
      }

      invoice.invoiceNumber = invoice.invoiceNumber || invoice.invoiceId;
      invoice.grossAmount = invoice.grossAmount !== undefined ? invoice.grossAmount : invoice.grossTotal;
      invoice.netPayable = invoice.netPayable !== undefined ? invoice.netPayable : invoice.payableAmount;
      invoice.lineItems = invoice.lineItems || invoice.items;

      return res.json({
        success: true,
        data: invoice
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'INVOICE_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * Finalize invoice by ID
   */
  static async finalizeInvoiceById(req, res) {
    try {
      const { id } = req.params;
      const result = await BillingService.finalizeInvoice({
        invoiceId: id,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: result.message,
        data: result.invoice
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVOICE_FINALIZE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Finalize invoice (body-based, backwards compatible with Discharge workflow)
   */
  static async finalizeInvoice(req, res) {
    try {
      if (req.body.invoiceId) {
        return BillingController.finalizeInvoiceById(
          { ...req, params: { id: req.body.invoiceId } },
          res
        );
      }

      const result = await DischargeBillingService.finalizeInvoice({
        ...req.body,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: result.isExisting ? 'Invoice already finalized.' : 'Final invoice generated successfully.',
        data: result.invoice
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVOICE_FINALIZE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Cancel invoice
   */
  static async cancelInvoice(req, res) {
    try {
      const { id } = req.params;
      const { cancellationReason } = req.body;
      const invoice = await BillingService.cancelInvoice({
        invoiceId: id,
        cancellationReason,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: `Invoice ${invoice.invoiceId} cancelled.`,
        data: invoice
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVOICE_CANCEL_FAILED', message: err.message }
      });
    }
  }

  // ==========================================
  // DEPOSITS
  // ==========================================

  /**
   * List deposits
   */
  static async listDeposits(req, res) {
    try {
      const { patientId, admissionId, status } = req.query;
      const query = {};
      if (patientId) query.patientId = patientId;
      if (admissionId) query.admissionId = admissionId;
      if (status) query.status = status.toUpperCase();

      const deposits = await Deposit.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, data: deposits });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DEPOSITS_LIST_FAILED', message: err.message }
      });
    }
  }

  /**
   * Record patient deposit
   */
  static async recordDeposit(req, res) {
    try {
      const deposit = await BillingService.recordDeposit({
        ...req.body,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.status(201).json({
        success: true,
        message: 'Deposit recorded successfully.',
        data: deposit
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'DEPOSIT_RECORD_FAILED', message: err.message }
      });
    }
  }

  /**
   * Apply deposit to invoice
   */
  static async applyDeposit(req, res) {
    try {
      const { id } = req.params;
      const { depositId, amount } = req.body;

      // Handle both /deposits/:id/apply (with invoiceId in body) or /invoices/:id/apply-deposit (with depositId/amount in body)
      const targetInvoiceId = req.body.invoiceId || id;
      const targetDepositId = depositId || id;

      const result = await BillingService.applyDepositToInvoice({
        depositId: targetDepositId,
        invoiceId: targetInvoiceId,
        amount,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: `Deposit applied to invoice successfully.`,
        data: result
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'APPLY_DEPOSIT_FAILED', message: err.message }
      });
    }
  }

  // ==========================================
  // FINANCIAL ADJUSTMENTS
  // ==========================================

  /**
   * List adjustments
   */
  static async listAdjustments(req, res) {
    try {
      const { invoiceId, patientId, status } = req.query;
      const query = {};
      if (invoiceId) query.invoiceId = invoiceId;
      if (patientId) query.patientId = patientId;
      if (status) query.status = status.toUpperCase();

      const adjustments = await FinancialAdjustment.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, data: adjustments });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'ADJUSTMENTS_LIST_FAILED', message: err.message }
      });
    }
  }

  /**
   * Request adjustment
   */
  static async requestAdjustment(req, res) {
    try {
      const adjustment = await BillingService.requestAdjustment({
        ...req.body,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.status(201).json({
        success: true,
        message: 'Adjustment request submitted for manager review.',
        data: adjustment
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'ADJUSTMENT_REQUEST_FAILED', message: err.message }
      });
    }
  }

  /**
   * Approve adjustment (Authorized Manager only)
   */
  static async approveAdjustment(req, res) {
    try {
      const { id } = req.params;
      const result = await BillingService.reviewAdjustment({
        adjustmentNumber: id,
        approved: true,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: 'Financial adjustment approved and applied.',
        data: result
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'ADJUSTMENT_APPROVE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Reject adjustment
   */
  static async rejectAdjustment(req, res) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const adjustment = await BillingService.reviewAdjustment({
        adjustmentNumber: id,
        approved: false,
        rejectionReason,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: 'Adjustment request rejected.',
        data: adjustment
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'ADJUSTMENT_REJECT_FAILED', message: err.message }
      });
    }
  }

  // ==========================================
  // BILLING QUERIES / DISPUTES
  // ==========================================

  /**
   * List queries
   */
  static async listQueries(req, res) {
    try {
      const { invoiceId, patientId, status } = req.query;
      const query = {};
      if (invoiceId) query.invoiceId = invoiceId;
      if (patientId) query.patientId = patientId;
      if (status) query.status = status.toUpperCase();

      const queries = await BillingQuery.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, data: queries });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'QUERIES_LIST_FAILED', message: err.message }
      });
    }
  }

  /**
   * Create billing query / dispute
   */
  static async createQuery(req, res) {
    try {
      const bQuery = await BillingService.createBillingQuery({
        ...req.body,
        description: req.body.description || req.body.disputeReason,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.status(201).json({
        success: true,
        message: 'Billing query submitted for review.',
        data: bQuery
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'QUERY_CREATE_FAILED', message: err.message }
      });
    }
  }

  static async raiseDispute(req, res) {
    return BillingController.createQuery(req, res);
  }

  /**
   * Resolve query
   */
  static async resolveQuery(req, res) {
    try {
      const { id } = req.params;
      const { resolution } = req.body;
      const bQuery = await BillingService.resolveBillingQuery({
        queryNumber: id,
        resolution,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: 'Billing query resolved.',
        data: bQuery
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'QUERY_RESOLVE_FAILED', message: err.message }
      });
    }
  }

  // ==========================================
  // RATE CARDS
  // ==========================================

  /**
   * List rates
   */
  static async listRates(req, res) {
    try {
      const { category, active } = req.query;
      const query = {};
      if (category) query.category = category.toUpperCase();
      if (active !== undefined) query.active = active === 'true';

      const rates = await RateCard.find(query).sort({ category: 1, serviceName: 1 }).lean();
      return res.json({ success: true, data: rates });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'RATES_LIST_FAILED', message: err.message }
      });
    }
  }

  /**
   * Create rate card entry
   */
  static async createRate(req, res) {
    try {
      const { serviceCode, serviceName, category, unit, totalPrice, rate, price, basePrice, taxRate, effectiveFrom, effectiveTo, description } = req.body;
      const rateId = await IdGeneratorService.generateRateId();
      const resolvedPrice = Number(basePrice !== undefined ? basePrice : (totalPrice || rate || price || 0));

      const newRate = new RateCard({
        rateId,
        serviceCode: (serviceCode || `SRV-${Date.now()}`).toUpperCase().trim(),
        serviceName,
        category: (category || 'OTHER').toUpperCase(),
        unit: unit || 'PER_SERVICE',
        basePrice: resolvedPrice,
        taxRate: Number(taxRate || 0),
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        active: true,
        description: description || ''
      });

      await newRate.save();

      return res.status(201).json({
        success: true,
        message: 'Rate card entry created.',
        data: newRate
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'RATE_CREATE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Update rate card entry
   */
  static async updateRate(req, res) {
    try {
      const { id } = req.params;
      const rate = await RateCard.findOne({
        $or: [{ rateId: id }, { _id: (id && id.match(/^[0-9a-fA-F]{24}$/)) ? id : null }]
      });

      if (!rate) {
        return res.status(404).json({
          success: false,
          error: { code: 'RATE_NOT_FOUND', message: `Rate card entry ${id} not found.` }
        });
      }

      const updates = req.body;
      if (updates.basePrice !== undefined) rate.basePrice = Number(updates.basePrice);
      if (updates.taxRate !== undefined) rate.taxRate = Number(updates.taxRate);
      if (updates.serviceName) rate.serviceName = updates.serviceName;
      if (updates.active !== undefined) rate.active = updates.active;
      if (updates.effectiveTo !== undefined) rate.effectiveTo = updates.effectiveTo ? new Date(updates.effectiveTo) : null;

      await rate.save();

      return res.json({
        success: true,
        message: 'Rate card updated.',
        data: rate
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'RATE_UPDATE_FAILED', message: err.message }
      });
    }
  }

  // ==========================================
  // DASHBOARD & REPORTS
  // ==========================================

  /**
   * Executive billing summary
   */
  static async getDashboardSummary(req, res) {
    try {
      const summary = await BillingService.getDashboardSummary();
      return res.json({ success: true, data: summary });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DASHBOARD_SUMMARY_FAILED', message: err.message }
      });
    }
  }

  /**
   * Reconcile payment gateway settlement records
   */
  static async reconcileGateway(req, res) {
    try {
      const { settlementRecords } = req.body;
      const result = await BillingService.reconcileGatewaySettlement(settlementRecords || [], req.user);
      return res.json({
        success: true,
        message: 'Settlement reconciliation executed.',
        data: result
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'RECONCILIATION_FAILED', message: err.message }
      });
    }
  }
}

module.exports = BillingController;
