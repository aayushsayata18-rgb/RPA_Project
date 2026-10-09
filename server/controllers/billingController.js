const DischargeBillingService = require('../services/DischargeBillingService');
const Invoice = require('../models/Invoice');
const BillingCharge = require('../models/BillingCharge');
const IdGeneratorService = require('../services/IdGeneratorService');

class BillingController {
  /**
   * Get itemized charges for an admission
   */
  static async getAdmissionCharges(req, res) {
    try {
      const { admissionId } = req.params;
      const { patientId } = req.query;
      const charges = await DischargeBillingService.getAdmissionCharges({
        admissionId,
        patientId
      });
      const mapped = charges.map(c => ({ ...c, totalPrice: c.totalAmount || c.totalPrice }));
      return res.json({
        success: true,
        data: mapped
      });
    } catch (err) {
      console.error('[BillingController.getAdmissionCharges Error]:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'BILLING_CHARGES_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * List charges query
   */
  static async getChargesList(req, res) {
    try {
      const { admissionId, patientId, status } = req.query;
      const query = {};
      if (admissionId) query.admissionId = admissionId;
      if (patientId) query.patientId = patientId;
      if (status) query.status = status;
      const charges = await BillingCharge.find(query).sort({ createdAt: -1 }).lean();
      const mapped = charges.map(c => ({ ...c, totalPrice: c.totalAmount }));
      return res.json({
        success: true,
        data: mapped
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'CHARGES_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * Finalize and generate invoice
   */
  static async finalizeInvoice(req, res) {
    try {
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
      console.error('[BillingController.finalizeInvoice Error]:', err);
      return res.status(400).json({
        success: false,
        error: { code: 'INVOICE_FINALIZE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get invoice by ID or invoiceNumber
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
   * List invoices
   */
  static async listInvoices(req, res) {
    try {
      const { patientId, admissionId, status, page = 1, limit = 20 } = req.query;
      const query = {};
      if (patientId) query.patientId = patientId;
      if (admissionId) query.admissionId = admissionId;
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);
      const [invoices, total] = await Promise.all([
        Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        Invoice.countDocuments(query)
      ]);

      return res.json({
        success: true,
        data: invoices,
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
   * Add a billing charge
   */
  static async addCharge(req, res) {
    try {
      const chargeId = `CHG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const {
        patientId,
        admissionId,
        serviceType,
        department,
        serviceName,
        quantity = 1,
        unitPrice,
        rate,
        totalPrice,
        notes
      } = req.body;
      const price = Number(unitPrice !== undefined ? unitPrice : (rate || 0));
      const qty = Number(quantity || 1);
      const totalAmount = Number(totalPrice !== undefined ? totalPrice : qty * price);
      const rawType = (serviceType || department || 'OTHER').toUpperCase();
      const mappedServiceType = ['ROOM_ACCOMMODATION', 'CONSULTATION', 'LABORATORY', 'PHARMACY', 'RADIOLOGY', 'NURSING', 'PROCEDURE'].includes(rawType)
        ? rawType
        : 'OTHER';

      const charge = new BillingCharge({
        chargeId,
        patientId,
        admissionId,
        serviceType: mappedServiceType,
        serviceName: serviceName || 'Service Charge',
        quantity: qty,
        unitPrice: price,
        totalAmount,
        status: 'PENDING',
        notes: notes || ''
      });

      await charge.save();
      const obj = charge.toObject();
      obj.totalPrice = totalAmount;

      return res.status(201).json({
        success: true,
        message: 'Billing charge recorded.',
        data: obj
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'CHARGE_CREATE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Raise billing query / dispute
   */
  static async raiseDispute(req, res) {
    try {
      const { invoiceId, disputeReason } = req.body;
      const invoice = await DischargeBillingService.raiseBillingQuery({
        invoiceId,
        disputeReason,
        raisedBy: req.user?.userId || req.user?.username,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: 'Billing dispute submitted for review.',
        data: invoice
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'DISPUTE_SUBMIT_FAILED', message: err.message }
      });
    }
  }

  /**
   * Apply deposit adjustment to invoice
   */
  static async applyDeposit(req, res) {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      const invoice = await Invoice.findOne({
        $or: [{ invoiceId: id }, { invoiceNumber: id }]
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: { code: 'INVOICE_NOT_FOUND', message: `Invoice ${id} not found.` }
        });
      }

      invoice.depositAmount = Number(amount || 0);
      invoice.netPayable = Math.max(0, invoice.grossAmount - invoice.coveredAmount - invoice.depositAmount - invoice.discountAmount);
      await invoice.save();

      return res.json({
        success: true,
        message: 'Deposit applied to invoice.',
        data: invoice
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'APPLY_DEPOSIT_FAILED', message: err.message }
      });
    }
  }
}

module.exports = BillingController;
