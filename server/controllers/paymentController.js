const DischargePaymentService = require('../services/DischargePaymentService');
const PaymentTransaction = require('../models/PaymentTransaction');
const Invoice = require('../models/Invoice');
const AuditService = require('../services/AuditService');

class PaymentController {
  /**
   * Create digital checkout payment session
   */
  static async createCheckoutSession(req, res) {
    try {
      const invoiceId = req.body.invoiceId || req.body.invoiceNumber;
      const result = await DischargePaymentService.createPaymentSession({
        ...req.body,
        invoiceId,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      const txObj = result.transaction?.toJSON ? result.transaction.toJSON() : (result.transaction || {});

      return res.json({
        success: true,
        message: 'Payment session created.',
        data: {
          sessionId: result.sessionId || result.gatewayReferenceId || txObj.gatewayReferenceId,
          transactionId: txObj.transactionId,
          ...result
        }
      });
    } catch (err) {
      console.error('[PaymentController.createCheckoutSession Error]:', err);
      return res.status(400).json({
        success: false,
        error: { code: 'PAYMENT_SESSION_FAILED', message: err.message }
      });
    }
  }

  /**
   * Verify / Callback webhook from payment gateway
   */
  static async verifyCallback(req, res) {
    try {
      const transactionId = req.params?.id || req.body.transactionId || req.body.gatewayPaymentId || req.body.paymentId;
      const result = await DischargePaymentService.processPaymentCallback({
        ...req.body,
        transactionId,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      const txObj = result.transaction?.toJSON ? result.transaction.toJSON() : (result.transaction || {});

      return res.json({
        success: result.success !== false,
        message: result.alreadyProcessed ? 'Payment already processed.' : 'Payment processed successfully.',
        data: {
          status: result.status || 'PAID',
          transactionId: txObj.transactionId,
          receiptNumber: txObj.transactionId,
          ...result
        }
      });
    } catch (err) {
      console.error('[PaymentController.verifyCallback Error]:', err);
      return res.status(400).json({
        success: false,
        error: { code: 'PAYMENT_VERIFY_FAILED', message: err.message }
      });
    }
  }

  /**
   * Public Webhook handler for gateway providers (Razorpay, Stripe, Mock)
   * Idempotency guarantee: Repeated webhooks must not create duplicate records
   */
  static async handleGatewayWebhook(req, res) {
    try {
      const provider = req.params?.provider || 'MOCK';
      const signature = req.headers['x-razorpay-signature'] || req.headers['stripe-signature'] || req.body.signature || 'MOCK_SIG';
      const eventData = req.body || {};
      const transactionId = eventData.transactionId || eventData.orderId || eventData.paymentId;
      const gatewayReferenceId = eventData.gatewayReferenceId || eventData.id;
      const status = (eventData.status || 'SUCCESS').toUpperCase();

      const result = await DischargePaymentService.processPaymentCallback({
        transactionId,
        gatewayReferenceId,
        status: status === 'PAID' || status === 'CAPTURED' ? 'SUCCESS' : status,
        signature,
        actorUser: { userId: `GATEWAY_${provider.toUpperCase()}` },
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        received: true,
        alreadyProcessed: !!result.alreadyProcessed,
        provider,
        data: result
      });
    } catch (err) {
      console.error('[PaymentController.handleGatewayWebhook Error]:', err);
      return res.status(400).json({
        success: false,
        error: { code: 'WEBHOOK_PROCESSING_FAILED', message: err.message }
      });
    }
  }

  /**
   * Process refund on an existing transaction
   */
  static async processRefund(req, res) {
    try {
      const { id } = req.params;
      const { refundAmount, reason } = req.body;

      const tx = await PaymentTransaction.findOne({
        $or: [{ transactionId: id }, { _id: (id && id.match(/^[0-9a-fA-F]{24}$/)) ? id : null }]
      });

      if (!tx) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRANSACTION_NOT_FOUND', message: `Transaction ${id} not found.` }
        });
      }

      if (tx.status !== 'SUCCESS') {
        return res.status(400).json({
          success: false,
          error: { code: 'REFUND_INVALID_STATUS', message: `Cannot refund transaction with status ${tx.status}.` }
        });
      }

      const amt = Number(refundAmount || tx.amount);
      tx.status = amt < tx.amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED';
      await tx.save();

      // Recalculate invoice
      const invoice = await Invoice.findOne({ invoiceId: tx.invoiceId });
      if (invoice) {
        invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - amt);
        invoice.outstandingBalance = Math.max(0, invoice.payableAmount - invoice.paidAmount);
        invoice.status = invoice.outstandingBalance === invoice.payableAmount ? 'FINALIZED' : 'PARTIALLY_PAID';
        await invoice.save();
      }

      await AuditService.logEvent({
        userId: req.user?.userId || 'SYSTEM',
        action: 'PAYMENT_REFUNDED',
        module: 'PAYMENT',
        entityType: 'PaymentTransaction',
        entityId: tx.transactionId,
        details: `Refund of ₹${amt} processed for txn ${tx.transactionId}. Reason: ${reason || 'Approved refund'}`
      });

      return res.json({
        success: true,
        message: 'Refund processed successfully.',
        data: tx
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'REFUND_FAILED', message: err.message }
      });
    }
  }

  /**
   * Record physical hospital counter payment
   */
  static async recordCounterPayment(req, res) {
    try {
      const invoiceId = req.body.invoiceId || req.body.invoiceNumber;
      const result = await DischargePaymentService.recordCounterPayment({
        ...req.body,
        invoiceId,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      const txObj = result.transaction?.toJSON ? result.transaction.toJSON() : (result.transaction || {});

      return res.json({
        success: true,
        message: 'Counter payment recorded successfully.',
        data: {
          receiptNumber: txObj.transactionId,
          transactionId: txObj.transactionId,
          ...result
        }
      });
    } catch (err) {
      console.error('[PaymentController.recordCounterPayment Error]:', err);
      return res.status(400).json({
        success: false,
        error: { code: 'COUNTER_PAYMENT_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get receipt details by receiptNumber or transactionId
   */
  static async getReceipt(req, res) {
    try {
      const { receiptNumber } = req.params;
      const tx = await PaymentTransaction.findOne({
        $or: [{ transactionId: receiptNumber }, { receiptId: receiptNumber }, { _id: (receiptNumber && receiptNumber.match(/^[0-9a-fA-F]{24}$/)) ? receiptNumber : null }]
      }).lean();

      if (!tx) {
        return res.status(404).json({
          success: false,
          error: { code: 'RECEIPT_NOT_FOUND', message: `Receipt ${receiptNumber} not found.` }
        });
      }

      return res.json({
        success: true,
        data: { ...tx, receiptNumber: tx.transactionId }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'RECEIPT_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get all payments for an invoice
   */
  static async getInvoicePayments(req, res) {
    try {
      const { invoiceNumber } = req.params;
      const invoice = await Invoice.findOne({
        $or: [{ invoiceId: invoiceNumber }, { invoiceNumber }]
      });

      const invId = invoice?.invoiceId || invoiceNumber;
      const transactions = await PaymentTransaction.find({ invoiceId: invId }).sort({ createdAt: -1 }).lean();
      const mapped = transactions.map(t => ({ ...t, receiptNumber: t.transactionId }));

      return res.json({
        success: true,
        data: mapped
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'PAYMENTS_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * List transactions
   */
  static async listTransactions(req, res) {
    try {
      const { patientId, admissionId, invoiceId, status, page = 1, limit = 50 } = req.query;
      const query = {};
      if (patientId) query.patientId = patientId;
      if (admissionId) query.admissionId = admissionId;
      if (invoiceId) query.invoiceId = invoiceId;
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);
      const [transactions, total] = await Promise.all([
        PaymentTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        PaymentTransaction.countDocuments(query)
      ]);

      const mapped = transactions.map(t => ({ ...t, receiptNumber: t.transactionId }));

      return res.json({
        success: true,
        data: mapped,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'TRANSACTION_LIST_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get transaction details by ID
   */
  static async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      const tx = await PaymentTransaction.findOne({
        $or: [{ transactionId: id }, { _id: id }]
      }).lean();

      if (!tx) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRANSACTION_NOT_FOUND', message: `Transaction ${id} not found.` }
        });
      }

      return res.json({ success: true, data: { ...tx, receiptNumber: tx.transactionId } });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'TRANSACTION_FETCH_FAILED', message: err.message }
      });
    }
  }
}

module.exports = PaymentController;
