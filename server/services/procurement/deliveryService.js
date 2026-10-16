const Delivery = require('../../models/Delivery');
const PurchaseOrder = require('../../models/PurchaseOrder');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');
const ExceptionService = require('../ExceptionService');

class DeliveryService {
  /**
   * Create or register an incoming delivery against a PO
   */
  static async createDelivery(data, user = { userId: 'SYSTEM', role: 'PROCUREMENT_OFFICER' }) {
    if (!data.purchaseOrderId) throw new Error('Purchase Order ID is required');

    const po = await PurchaseOrder.findOne({ purchaseOrderId: data.purchaseOrderId });
    if (!po) throw new Error(`Purchase Order ${data.purchaseOrderId} not found`);

    const deliveryId = await IdGeneratorService.generateDeliveryId();

    const items = (data.items || po.items).map((it) => ({
      inventoryItemId: it.inventoryItemId,
      itemName: it.description || it.itemName || 'Delivered Item',
      orderedQuantity: it.quantity || it.orderedQuantity || 0,
      shippedQuantity: Number(it.shippedQuantity) || Number(it.quantity) || 0,
      receivedQuantity: 0
    }));

    const delivery = new Delivery({
      deliveryId,
      purchaseOrderId: po.purchaseOrderId,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : po.expectedDeliveryDate,
      actualDate: data.actualDate ? new Date(data.actualDate) : null,
      shipmentReference: data.shipmentReference || '',
      carrier: data.carrier || '',
      trackingNumber: data.trackingNumber || '',
      items,
      documents: data.documents || [],
      status: data.status || 'SHIPPED',
      notes: data.notes || ''
    });

    await delivery.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'DELIVERY_REGISTERED',
      module: 'PROCUREMENT',
      entityType: 'Delivery',
      entityId: deliveryId,
      newValue: { purchaseOrderId: po.purchaseOrderId, status: delivery.status },
      details: `Registered Delivery ${deliveryId} for PO ${po.purchaseOrderId}. Reference: ${data.shipmentReference}`
    });

    return delivery;
  }

  /**
   * Update delivery status (e.g. DELIVERED, IN_TRANSIT, DELAYED)
   */
  static async updateDeliveryStatus(id, updateData, user = { userId: 'SYSTEM', role: 'PROCUREMENT_OFFICER' }) {
    const delivery = await Delivery.findOne({ deliveryId: id });
    if (!delivery) throw new Error(`Delivery ${id} not found`);

    const previousStatus = delivery.status;
    if (updateData.status) delivery.status = updateData.status;
    if (updateData.actualDate) delivery.actualDate = new Date(updateData.actualDate);
    if (updateData.shipmentReference) delivery.shipmentReference = updateData.shipmentReference;
    if (updateData.carrier) delivery.carrier = updateData.carrier;
    if (updateData.trackingNumber) delivery.trackingNumber = updateData.trackingNumber;
    if (updateData.goodsReceiptId) delivery.goodsReceiptId = updateData.goodsReceiptId;

    if (delivery.status === 'DELIVERED' && !delivery.actualDate) {
      delivery.actualDate = new Date();
    }

    await delivery.save();

    // Check impact on PO
    const po = await PurchaseOrder.findOne({ purchaseOrderId: delivery.purchaseOrderId });
    if (po) {
      if (delivery.status === 'DELIVERED') {
        // Calculate total shipped across deliveries
        const allDeliveries = await Delivery.find({
          purchaseOrderId: po.purchaseOrderId,
          status: 'DELIVERED'
        }).lean();

        let allDelivered = true;
        po.items.forEach((poItem) => {
          let deliveredQty = 0;
          allDeliveries.forEach((del) => {
            const found = del.items.find((di) => di.inventoryItemId === poItem.inventoryItemId);
            if (found) deliveredQty += (found.shippedQuantity || 0);
          });
          poItem.deliveredQuantity = deliveredQty;
          if (deliveredQty < poItem.quantity) {
            allDelivered = false;
          }
        });

        po.status = allDelivered ? 'DELIVERED' : 'PARTIALLY_DELIVERED';
        await po.save();
      }
    }

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'DELIVERY_STATUS_UPDATED',
      module: 'PROCUREMENT',
      entityType: 'Delivery',
      entityId: id,
      oldValue: { status: previousStatus },
      newValue: { status: delivery.status },
      details: `Updated Delivery ${id} status from ${previousStatus} to ${delivery.status}.`
    });

    return delivery;
  }

  /**
   * Automated scan for late deliveries (Section 46 & 103)
   */
  static async checkDelayedDeliveries() {
    const today = new Date();
    const overdueDeliveries = await Delivery.find({
      status: { $in: ['EXPECTED', 'SHIPPED', 'IN_TRANSIT'] },
      expectedDate: { $lt: today }
    });

    let delayedCount = 0;
    for (const del of overdueDeliveries) {
      const diffMs = today - new Date(del.expectedDate);
      const delayDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      del.status = 'DELAYED';
      del.delayDays = delayDays;
      await del.save();
      delayedCount++;

      // Raise exception for staff follow-up
      await ExceptionService.raiseException({
        module: 'PROCUREMENT',
        entityType: 'Delivery',
        entityId: del.deliveryId,
        exceptionType: 'DELIVERY_DELAY',
        description: `Delivery ${del.deliveryId} for PO ${del.purchaseOrderId} (Vendor: ${del.vendorName}) is delayed by ${delayDays} day(s). Expected: ${del.expectedDate.toLocaleDateString()}`,
        severity: delayDays > 5 ? 'HIGH' : 'MEDIUM',
        source: 'SYSTEM',
        assignedRole: 'PROCUREMENT_OFFICER',
        metadata: { delayDays, purchaseOrderId: del.purchaseOrderId }
      });
    }

    return { delayedCount };
  }

  /**
   * Query deliveries
   */
  static async getDeliveries(query = {}) {
    const filter = {};
    if (query.purchaseOrderId) filter.purchaseOrderId = query.purchaseOrderId;
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { deliveryId: new RegExp(query.search, 'i') },
        { purchaseOrderId: new RegExp(query.search, 'i') },
        { shipmentReference: new RegExp(query.search, 'i') },
        { vendorName: new RegExp(query.search, 'i') }
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [deliveries, total] = await Promise.all([
      Delivery.find(filter).sort({ expectedDate: 1 }).skip(skip).limit(limit).lean(),
      Delivery.countDocuments(filter)
    ]);

    return {
      deliveries,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getDeliveryById(id) {
    const delivery = await Delivery.findOne({ deliveryId: id }).lean();
    if (!delivery) throw new Error(`Delivery ${id} not found`);
    return delivery;
  }
}

module.exports = DeliveryService;
