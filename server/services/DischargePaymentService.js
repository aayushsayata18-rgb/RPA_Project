const PaymentTransaction = require('../models/PaymentTransaction');
const Invoice = require('../models/Invoice');
const Discharge = require('../models/Discharge');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');
const DocumentService = require('./DocumentService');
const NotificationService = require('./NotificationService');
const crypto = require('crypto');

class DischargePaymentService {
  /**
   * Initialize a digital payment session
   */
  static async createPaymentSession({
    invoiceId,
    paymentMethod = 'ONLINE_GATEWAY',
    amount = null,
    actorUser,
    correlationId
  }) {
    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found.`);
    }

    if (invoice.status === 'PAID') {
      return {
        alreadyPaid: true,
        message: 'Invoice has already been settled and paid.',
        invoice
      };
    }

    const payAmount = amount !== null ? Number(amount) : invoice.outstandingBalance || invoice.payableAmount;
    if (payAmount <= 0) {
      invoice.status = 'PAID';
      invoice.outstandingBalance = 0;
      await invoice.save();
      return {
        alreadyPaid: true,
        message: 'No payable balance outstanding.',
        invoice
      };
    }

    const transactionId = await IdGeneratorService.generatePaymentTransactionId();
    const gatewayReferenceId = `GW-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const transaction = new PaymentTransaction({
      transactionId,
      invoiceId,
      patientId: invoice.patientId,
      admissionId: invoice.admissionId,
      dischargeId: invoice.dischargeId,
      amount: payAmount,
      currency: 'INR',
      paymentMethod,
      gatewayName: 'MOCK_HOSPITAL_GATEWAY',
      gatewayReferenceId,
      status: 'INITIATED',
      correlationId: correlationId || IdGeneratorService.generateCorrelationId(),
      recordedBy: actorUser?.userId || 'PATIENT'
    });

    await transaction.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'PATIENT',
      action: 'PAYMENT_INITIATED',
      module: 'DISCHARGE_PAYMENT',
      entityType: 'PaymentTransaction',
      entityId: transactionId,
      details: `Payment of ₹${payAmount} initiated for invoice ${invoiceId}`,
      correlationId: transaction.correlationId
    });

    return {
      transactionId,
      gatewayReferenceId,
      amount: payAmount,
      currency: 'INR',
      paymentSessionUrl: `/portal/payments/checkout?txnId=${transactionId}&gwRef=${gatewayReferenceId}`
    };
  }

  /**
   * Verify and process gateway payment callback/webhook
   */
  static async processPaymentCallback({
    transactionId,
    gatewayReferenceId,
    status, // 'SUCCESS', 'FAILED'
    signature,
    actorUser,
    correlationId
  }) {
    const transaction = await PaymentTransaction.findOne({
      $or: [{ transactionId }, { gatewayReferenceId }]
    });

    if (!transaction) {
      throw new Error(`Payment transaction not found for ID ${transactionId || gatewayReferenceId}.`);
    }

    // Idempotency: If already finalized, do not process twice
    if (transaction.status === 'SUCCESS' || transaction.status === 'FAILED') {
      return {
        alreadyProcessed: true,
        status: transaction.status,
        transaction
      };
    }

    const finalStatus = (status || 'SUCCESS').toUpperCase();
    if (finalStatus === 'SUCCESS') {
      transaction.status = 'SUCCESS';

      transaction.completedAt = new Date();
      transaction.gatewaySignature = signature || 'MOCK_VERIFIED_SIGNATURE';
      await transaction.save();

      // Update Invoice
      const invoice = await Invoice.findOne({ invoiceId: transaction.invoiceId });
      if (invoice) {
        invoice.paidAmount = (invoice.paidAmount || 0) + transaction.amount;
        invoice.outstandingBalance = Math.max(0, invoice.payableAmount - invoice.paidAmount);
        invoice.status = invoice.outstandingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
        await invoice.save();

        // Update Discharge record if attached
        if (invoice.dischargeId) {
          const discharge = await Discharge.findOne({ dischargeNumber: invoice.dischargeId });
          if (discharge) {
            discharge.paymentStatus = invoice.status;
            discharge.paymentMethod = transaction.paymentMethod;
            discharge.paymentTransactionId = transaction.transactionId;
            discharge.paymentVerifiedAt = new Date();
            if (discharge.status === 'PENDING_PAYMENT') {
              discharge.status = 'READY_FOR_DISCHARGE';
            }
            await discharge.save();
          }
        }

        // Generate Payment Receipt Document
        try {
          const receiptDoc = await DocumentService.generateDocument({
            documentType: 'PAYMENT_RECEIPT',
            title: `Payment Receipt - ${transaction.transactionId}`,
            entityType: 'PaymentTransaction',
            entityId: transaction.transactionId,
            templateCode: 'PAYMENT_RECEIPT',
            data: {
              transactionId: transaction.transactionId,
              invoiceId: invoice.invoiceId,
              patientId: invoice.patientId,
              patientName: invoice.patientName,
              amount: transaction.amount,
              paymentMethod: transaction.paymentMethod,
              paidAt: transaction.completedAt.toLocaleString(),
              balanceRemaining: invoice.outstandingBalance
            },
            createdBy: actorUser?.userId || 'PAYMENT_GATEWAY'
          });
          transaction.receiptId = receiptDoc.documentId;
          await transaction.save();
        } catch (docErr) {
          console.error('[Payment Receipt Doc Generation Error]:', docErr.message);
        }

        // Send confirmation notification
        try {
          await NotificationService.sendNotification({
            recipientId: invoice.patientId,
            channel: 'SMS',
            event: 'PAYMENT_SUCCESS',
            title: 'Payment Successful',
            message: `Your payment of ₹${transaction.amount} for Invoice ${invoice.invoiceId} was received successfully. Receipt ID: ${transaction.transactionId}.`,
            entityType: 'PaymentTransaction',
            entityId: transaction.transactionId,
            correlationId: transaction.correlationId
          });
        } catch (notifErr) {
          console.error('[Payment Notification Error]:', notifErr.message);
        }
      }

      await AuditService.logEvent({
        userId: actorUser?.userId || 'PAYMENT_GATEWAY',
        action: 'PAYMENT_VERIFIED',
        module: 'DISCHARGE_PAYMENT',
        entityType: 'PaymentTransaction',
        entityId: transaction.transactionId,
        details: `Payment of ₹${transaction.amount} successfully verified for invoice ${transaction.invoiceId}`,
        correlationId: correlationId || transaction.correlationId
      });

      return {
        success: true,
        status: 'SUCCESS',
        transaction
      };
    } else {
      // Payment Failed
      transaction.status = 'FAILED';
      transaction.completedAt = new Date();
      transaction.failureReason = 'Gateway reported transaction failure or user cancelled';
      await transaction.save();

      await ExceptionService.createException({
        code: 'PAYMENT_FAILED',
        module: 'DISCHARGE_PAYMENT',
        severity: 'MEDIUM',
        message: `Payment failed for transaction ${transaction.transactionId} on invoice ${transaction.invoiceId}`,
        referenceType: 'PaymentTransaction',
        referenceId: transaction.transactionId,
        correlationId: correlationId || transaction.correlationId,
        reportedBy: actorUser?.userId || 'PAYMENT_GATEWAY'
      });

      // Notify patient of payment failure
      try {
        await NotificationService.sendNotification({
          recipientId: transaction.patientId,
          channel: 'SMS',
          event: 'PAYMENT_FAILED',
          title: 'Payment Attempt Failed',
          message: `Payment attempt of ₹${transaction.amount} for Invoice ${transaction.invoiceId} could not be completed. Please try again or pay at the hospital counter.`,
          entityType: 'PaymentTransaction',
          entityId: transaction.transactionId,
          correlationId: transaction.correlationId
        });
      } catch (notifErr) {
        console.error('[Payment Notification Error]:', notifErr.message);
      }

      await AuditService.logEvent({
        userId: actorUser?.userId || 'PAYMENT_GATEWAY',
        action: 'PAYMENT_FAILED',
        module: 'DISCHARGE_PAYMENT',
        entityType: 'PaymentTransaction',
        entityId: transaction.transactionId,
        details: `Payment attempt failed for invoice ${transaction.invoiceId}`,
        correlationId: correlationId || transaction.correlationId
      });

      return {
        success: false,
        status: 'FAILED',
        transaction
      };
    }
  }

  /**
   * Record a payment made directly at the hospital physical billing counter
   */
  static async recordCounterPayment({
    invoiceId,
    amount,
    paymentMethod = 'COUNTER_CASH', // COUNTER_CASH, COUNTER_CARD, COUNTER_UPI
    notes = '',
    actorUser,
    correlationId
  }) {
    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found.`);
    }

    if (invoice.status === 'PAID') {
      throw new Error('Invoice is already fully settled.');
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new Error('Invalid payment amount.');
    }

    const transactionId = await IdGeneratorService.generatePaymentTransactionId();

    const transaction = new PaymentTransaction({
      transactionId,
      invoiceId,
      patientId: invoice.patientId,
      admissionId: invoice.admissionId,
      dischargeId: invoice.dischargeId,
      amount: payAmount,
      currency: 'INR',
      paymentMethod,
      gatewayName: 'COUNTER_POS',
      gatewayReferenceId: `CTR-${Date.now()}`,
      status: 'SUCCESS',
      completedAt: new Date(),
      correlationId: correlationId || IdGeneratorService.generateCorrelationId(),
      recordedBy: actorUser?.userId || 'STAFF_CASHIER'
    });

    await transaction.save();

    invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
    invoice.outstandingBalance = Math.max(0, invoice.payableAmount - invoice.paidAmount);
    invoice.status = invoice.outstandingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
    await invoice.save();

    if (invoice.dischargeId) {
      const discharge = await Discharge.findOne({ dischargeNumber: invoice.dischargeId });
      if (discharge) {
        discharge.paymentStatus = invoice.status;
        discharge.paymentMethod = paymentMethod;
        discharge.paymentTransactionId = transaction.transactionId;
        discharge.paymentVerifiedAt = new Date();
        if (discharge.status === 'PENDING_PAYMENT') {
          discharge.status = 'READY_FOR_DISCHARGE';
        }
        await discharge.save();
      }
    }

    // Generate Payment Receipt Document
    try {
      const receiptDoc = await DocumentService.generateDocument({
        documentType: 'PAYMENT_RECEIPT',
        title: `Counter Receipt - ${transaction.transactionId}`,
        entityType: 'PaymentTransaction',
        entityId: transaction.transactionId,
        templateCode: 'PAYMENT_RECEIPT',
        data: {
          transactionId: transaction.transactionId,
          invoiceId: invoice.invoiceId,
          patientId: invoice.patientId,
          patientName: invoice.patientName,
          amount: transaction.amount,
          paymentMethod: transaction.paymentMethod,
          paidAt: transaction.completedAt.toLocaleString(),
          balanceRemaining: invoice.outstandingBalance,
          cashier: actorUser?.username || 'Billing Counter'
        },
        createdBy: actorUser?.userId || 'BILLING_STAFF'
      });
      transaction.receiptId = receiptDoc.documentId;
      await transaction.save();
    } catch (docErr) {
      console.error('[Counter Receipt Doc Gen Error]:', docErr.message);
    }

    await AuditService.logEvent({
      userId: actorUser?.userId || 'BILLING_STAFF',
      action: 'PAYMENT_RECORDED_COUNTER',
      module: 'DISCHARGE_PAYMENT',
      entityType: 'PaymentTransaction',
      entityId: transactionId,
      details: `Counter payment of ₹${payAmount} recorded for invoice ${invoiceId}`,
      correlationId: transaction.correlationId
    });

    return {
      success: true,
      transaction,
      invoice
    };
  }
}

module.exports = DischargePaymentService;
