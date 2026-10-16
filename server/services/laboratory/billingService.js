const BillingCharge = require('../../models/BillingCharge');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class LaboratoryBillingService {
  /**
   * Create an idempotent billing charge for a laboratory test order item
   */
  static async createChargeForOrderItem({ order, orderItem, user = null }) {
    if (!orderItem) {
      throw new Error('Order item is required for charge creation.');
    }

    const serviceReferenceId = orderItem.orderItemId;

    // Strict Idempotency Check: check if a charge already exists for this order item
    const existingCharge = await BillingCharge.findOne({
      serviceType: 'LABORATORY',
      serviceReferenceId
    });

    if (existingCharge) {
      return {
        isDuplicate: true,
        charge: existingCharge,
        message: `Existing billing charge ${existingCharge.chargeId} returned (idempotency preserved).`
      };
    }

    const price = orderItem.priceSnapshot || 0;
    if (price <= 0) {
      return {
        isDuplicate: false,
        charge: null,
        message: 'Test has zero price reference. No billing charge generated.'
      };
    }

    const chargeId = await IdGeneratorService.generateBillableItemId();
    const charge = new BillingCharge({
      chargeId,
      patientId: order.patientCode || String(order.patientId),
      admissionId: order.admissionIdString || (order.visitIdString ? `VIS-${order.visitIdString}` : 'OUTPATIENT'),
      serviceType: 'LABORATORY',
      serviceName: `${orderItem.testNameSnapshot} (${orderItem.testCodeSnapshot})`,
      serviceReferenceId,
      quantity: 1,
      unitPrice: price,
      totalAmount: price,
      status: 'PENDING',
      chargeDate: new Date()
    });

    await charge.save();

    await AuditService.logAction({
      action: 'LAB_BILLING_CHARGE_CREATED',
      module: 'LABORATORY',
      entityId: charge.chargeId,
      entityType: 'BillingCharge',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Generated lab billing charge ${charge.chargeId} for test ${orderItem.testCodeSnapshot} (₹${price})`
    });

    return {
      isDuplicate: false,
      charge,
      message: `Billing charge ${charge.chargeId} created successfully.`
    };
  }

  /**
   * Process billing charges for an entire order according to configured policy
   */
  static async createChargesForOrder({ order, orderItems, user = null }) {
    const results = [];
    for (const item of orderItems) {
      const res = await this.createChargeForOrderItem({ order, orderItem: item, user });
      results.push(res);
    }
    return results;
  }

  /**
   * Reconcile laboratory charges against order items
   */
  static async reconcileCharges({ orderIdString }) {
    const charges = await BillingCharge.find({
      serviceType: 'LABORATORY',
      serviceReferenceId: new RegExp(`^LOI-`)
    }).lean();

    return {
      totalCharges: charges.length,
      charges
    };
  }
}

module.exports = LaboratoryBillingService;
