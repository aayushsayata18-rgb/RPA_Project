const BillingCharge = require('../../models/BillingCharge');
const BillableItem = require('../../models/BillableItem');
const RadiologyOrder = require('../../models/RadiologyOrder');
const AuditService = require('../AuditService');

class RadiologyBillingService {
  /**
   * Create idempotent billing charge for radiology procedure
   */
  static async createRadiologyCharge({ order, study, user = null }) {
    if (!order) {
      throw new Error('Order is required for radiology billing.');
    }

    // 1. Idempotency Check: Verify if charge already exists for this order/study
    const existingCharge = await BillingCharge.findOne({
      serviceType: 'RADIOLOGY',
      $or: [
        { serviceReferenceId: String(order._id) },
        { serviceReferenceId: String(order.orderId) },
        { serviceReferenceId: study ? String(study._id) : null },
        { serviceReferenceId: study ? String(study.accessionNumber) : null }
      ]
    });

    if (existingCharge) {
      // Return existing charge without duplicating
      if (!order.billingReferenceId) {
        order.billingReferenceId = existingCharge._id;
        await order.save();
      }
      return {
        isDuplicatePrevented: true,
        charge: existingCharge
      };
    }

    // 2. Resolve price reference
    let chargeAmount = 150; // default baseline price
    let chargeDescription = `Radiology: ${order.examNameSnapshot || 'Scan'}`;
    let itemCode = order.examCodeSnapshot || 'RAD-PROC';

    if (order.examId) {
      try {
        const RadiologyExam = require('../../models/RadiologyExam');
        const exam = await RadiologyExam.findById(order.examId);
        if (exam && exam.priceReference > 0) {
          chargeAmount = exam.priceReference;
          chargeDescription = `Radiology Examination: ${exam.name} (${exam.code})`;
          itemCode = exam.code;
        }
      } catch (e) {}
    }

    // 3. Create BillingCharge
    const chargeId = `CHG-RAD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const charge = new BillingCharge({
      chargeId,
      patientId: String(order.patientId?.patientId || order.patientId),
      admissionId: order.admissionId ? String(order.admissionId) : 'OPD-NON-ADMITTED',
      serviceType: 'RADIOLOGY',
      serviceName: chargeDescription,
      serviceReferenceId: String(order._id),
      unitPrice: chargeAmount,
      quantity: 1,
      totalAmount: chargeAmount,
      status: 'PENDING',
      chargeDate: new Date()
    });

    await charge.save();

    // Link charge back to order
    order.billingReferenceId = charge._id;
    await order.save();

    await AuditService.logAction({
      user,
      action: 'CREATE_RADIOLOGY_BILLING_CHARGE',
      entity: 'BillingCharge',
      entityId: charge._id,
      description: `Created billing charge ${charge._id} (${chargeAmount} USD) for Radiology Order ${order.orderId}`
    });

    return {
      isDuplicatePrevented: false,
      charge
    };
  }
}

module.exports = RadiologyBillingService;
