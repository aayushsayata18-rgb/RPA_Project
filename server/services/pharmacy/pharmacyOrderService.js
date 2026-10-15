const PharmacyOrder = require('../../models/PharmacyOrder');
const Prescription = require('../../models/Prescription');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');

class PharmacyOrderService {
  /**
   * Create a Pharmacy Order from an issued/validated prescription
   */
  static async createOrderFromPrescription({
    prescriptionId,
    orderType = 'OUTPATIENT',
    priority = 'NORMAL',
    notes = '',
    actorUser = null
  }) {
    const prescription = await Prescription.findOne({ prescriptionId });
    if (!prescription) {
      throw new Error(`Prescription '${prescriptionId}' not found.`);
    }

    if (['CANCELLED', 'EXPIRED', 'REJECTED'].includes(prescription.status)) {
      throw new Error(`Cannot create pharmacy order: prescription status is ${prescription.status}.`);
    }

    // Check duplicate order for same prescription
    const existingOrder = await PharmacyOrder.findOne({
      prescriptionId,
      status: { $nin: ['CANCELLED'] }
    });

    if (existingOrder) {
      return existingOrder;
    }

    const pharmacyOrderId = await IdGeneratorService.generatePharmacyOrderId();

    const orderItems = prescription.items.map((it) => ({
      prescriptionItemId: it.prescriptionItemId,
      medicineId: it.medicineId,
      medicineName: it.medicineNameSnapshot,
      dosageForm: it.dosageFormSnapshot,
      strength: it.strengthSnapshot,
      prescribedQuantity: it.quantity,
      reservedQuantity: 0,
      dispensedQuantity: it.dispensedQuantity || 0,
      unit: it.unit,
      unitPrice: it.unitPriceSnapshot || 0,
      batchReservations: [],
      status: 'PENDING'
    }));

    // Auto-escalate priority if orderType is EMERGENCY
    let resolvedPriority = priority;
    if (orderType === 'EMERGENCY' && priority === 'NORMAL') {
      resolvedPriority = 'URGENT';
    }

    const order = new PharmacyOrder({
      pharmacyOrderId,
      prescriptionId,
      patientId: prescription.patientId,
      patientName: prescription.patientName,
      visitId: prescription.visitId,
      admissionId: prescription.admissionId,
      doctorId: prescription.doctorId,
      doctorName: prescription.doctorName,
      orderType,
      priority: resolvedPriority,
      status: 'NEW',
      items: orderItems,
      requestedAt: new Date(),
      notes,
      createdBy: actorUser?.userId || 'SYSTEM',
      updatedBy: actorUser?.userId || 'SYSTEM',
      correlationId: prescription.correlationId || pharmacyOrderId
    });

    await order.save();

    // Mark prescription as SENT_TO_PHARMACY if it was ISSUED
    if (prescription.status === 'ISSUED') {
      prescription.status = 'SENT_TO_PHARMACY';
      await prescription.save();
    }

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'SYSTEM',
      action: 'ORDER_CREATED',
      module: 'PHARMACY',
      entityType: 'PharmacyOrder',
      entityId: pharmacyOrderId,
      details: `Pharmacy Order ${pharmacyOrderId} created from Prescription ${prescriptionId} (${orderType}, ${resolvedPriority}).`
    });

    return order;
  }

  /**
   * Receive and start processing an order in the pharmacy
   */
  static async receiveOrder(pharmacyOrderId, actorUser = null) {
    const order = await PharmacyOrder.findOne({ pharmacyOrderId });
    if (!order) {
      throw new Error(`Pharmacy order '${pharmacyOrderId}' not found.`);
    }

    if (order.status === 'CANCELLED') {
      throw new Error(`Cannot receive cancelled order.`);
    }

    order.status = 'VALIDATING';
    order.receivedAt = new Date();
    order.pharmacistId = actorUser?.userId || 'PHARMACIST';
    order.pharmacistName = actorUser?.name || actorUser?.username || 'Pharmacist';
    order.updatedBy = actorUser?.userId || 'SYSTEM';

    await order.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'PHARMACIST',
      action: 'ORDER_VALIDATING',
      module: 'PHARMACY',
      entityType: 'PharmacyOrder',
      entityId: pharmacyOrderId,
      details: `Pharmacist ${order.pharmacistName} received order ${pharmacyOrderId} for validation.`
    });

    return order;
  }

  /**
   * Search / filter pharmacy orders queue
   */
  static async getOrders({
    patientId,
    status,
    orderType,
    priority,
    isToday = false,
    search = '',
    page = 1,
    limit = 50
  }) {
    const query = {};

    if (patientId) query.patientId = patientId;
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    if (priority) query.priority = priority;

    if (isToday) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      query.requestedAt = { $gte: startOfDay, $lte: endOfDay };
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { pharmacyOrderId: regex },
        { prescriptionId: regex },
        { patientId: regex },
        { patientName: regex },
        { doctorName: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    // Sort priority URGENT/STAT/EMERGENCY first, then by requestedAt desc
    const [orders, total] = await Promise.all([
      PharmacyOrder.find(query)
        .sort({ priority: -1, requestedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      PharmacyOrder.countDocuments(query)
    ]);

    return {
      orders,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get order by ID
   */
  static async getOrderById(pharmacyOrderId) {
    const order = await PharmacyOrder.findOne({ pharmacyOrderId }).lean();
    if (!order) {
      throw new Error(`Pharmacy order '${pharmacyOrderId}' not found.`);
    }
    return order;
  }

  /**
   * Hold order with reason
   */
  static async holdOrder(pharmacyOrderId, reason, actorUser = null) {
    const order = await PharmacyOrder.findOne({ pharmacyOrderId });
    if (!order) {
      throw new Error(`Pharmacy order '${pharmacyOrderId}' not found.`);
    }

    order.status = 'ON_HOLD';
    order.holdReason = reason || 'Held by pharmacist';
    order.updatedBy = actorUser?.userId || 'SYSTEM';

    await order.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'PHARMACIST',
      action: 'ORDER_HELD',
      module: 'PHARMACY',
      entityType: 'PharmacyOrder',
      entityId: pharmacyOrderId,
      details: `Pharmacy order ${pharmacyOrderId} put ON_HOLD: ${reason}`
    });

    return order;
  }

  /**
   * Cancel order
   */
  static async cancelOrder(pharmacyOrderId, reason, actorUser = null) {
    const order = await PharmacyOrder.findOne({ pharmacyOrderId });
    if (!order) {
      throw new Error(`Pharmacy order '${pharmacyOrderId}' not found.`);
    }

    if (order.status === 'COMPLETED' || order.status === 'DISPENSED') {
      throw new Error(`Cannot cancel an already completed or dispensed order.`);
    }

    order.status = 'CANCELLED';
    order.cancellationReason = reason || 'Cancelled by staff';
    order.updatedBy = actorUser?.userId || 'SYSTEM';

    await order.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'PHARMACIST',
      action: 'ORDER_CANCELLED',
      module: 'PHARMACY',
      entityType: 'PharmacyOrder',
      entityId: pharmacyOrderId,
      details: `Pharmacy order ${pharmacyOrderId} CANCELLED: ${reason}`
    });

    return order;
  }
}

module.exports = PharmacyOrderService;
