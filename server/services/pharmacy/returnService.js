const PharmacyReturn = require('../../models/PharmacyReturn');
const DispensingRecord = require('../../models/DispensingRecord');
const InventoryBatch = require('../../models/InventoryBatch');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');

class ReturnService {
  /**
   * Request a pharmacy return
   */
  static async createReturn({
    patientId,
    pharmacyOrderId,
    dispensingRecordId,
    reason,
    reasonDetails = '',
    items = [],
    requestedBy,
    actorUser = null
  }) {
    if (!dispensingRecordId || !reason || !items || items.length === 0) {
      throw new Error('dispensingRecordId, reason, and at least one item are required.');
    }

    const dispensingRecord = await DispensingRecord.findOne({ dispensingRecordId });
    if (!dispensingRecord) {
      throw new Error(`Dispensing record '${dispensingRecordId}' not found.`);
    }

    patientId = patientId || dispensingRecord.patientId;
    if (!patientId) {
      throw new Error('patientId could not be determined for the return.');
    }

    const validReasons = [
      'PATIENT_RETURN',
      'WRONG_MEDICINE',
      'WRONG_QUANTITY',
      'DAMAGED',
      'EXPIRED',
      'CANCELLED_ORDER',
      'DISCHARGE_RETURN',
      'OTHER'
    ];

    if (!validReasons.includes(reason)) {
      throw new Error(`Invalid return reason '${reason}'. Valid reasons: ${validReasons.join(', ')}`);
    }

    const returnItems = [];
    let totalRefund = 0;

    for (const it of items) {
      const dItem = dispensingRecord.items.find((d) => d.medicineId === it.medicineId);
      if (!dItem) {
        throw new Error(`Medicine '${it.medicineId}' was not part of dispensing record '${dispensingRecordId}'.`);
      }

      const qty = parseInt(it.quantity !== undefined ? it.quantity : it.quantityReturned, 10) || 0;
      if (qty <= 0 || qty > dItem.dispensedQuantity) {
        throw new Error(`Invalid return quantity for '${dItem.medicineName}': requested ${qty}, maximum dispensed was ${dItem.dispensedQuantity}.`);
      }

      const itemRefund = Math.round(qty * dItem.unitPrice * 100) / 100;
      totalRefund += itemRefund;

      returnItems.push({
        medicineId: dItem.medicineId,
        medicineName: dItem.medicineName,
        inventoryBatchId: it.inventoryBatchId || dItem.inventoryBatchId,
        quantity: qty,
        unit: dItem.unit,
        unitPrice: dItem.unitPrice,
        refundAmount: itemRefund,
        condition: it.condition || 'UNOPENED',
        disposition: 'QUARANTINE', // By default non-saleable quarantine per Section 36
        notes: it.notes || ''
      });
    }

    const returnId = await IdGeneratorService.generateReturnId();

    const pharmacyReturn = new PharmacyReturn({
      returnId,
      patientId,
      patientName: dispensingRecord.patientName,
      pharmacyOrderId: pharmacyOrderId || dispensingRecord.pharmacyOrderId,
      dispensingRecordId,
      reason,
      reasonDetails,
      status: 'REQUESTED',
      items: returnItems,
      totalRefundAmount: totalRefund,
      requestedBy: requestedBy || actorUser?.userId || 'STAFF',
      correlationId: dispensingRecord.correlationId || returnId
    });

    await pharmacyReturn.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || requestedBy || 'STAFF',
      role: actorUser?.role || 'PHARMACIST',
      action: 'RETURN_CREATED',
      module: 'PHARMACY',
      entityType: 'PharmacyReturn',
      entityId: returnId,
      patientId,
      details: `Return ${returnId} requested for Dispensing ${dispensingRecordId} (Reason: ${reason}, Items: ${returnItems.length}).`
    });

    return pharmacyReturn;
  }

  /**
   * Review return (Approve or Reject by Senior Pharmacist / Manager)
   */
  static async reviewReturn(returnId, { action, reviewNotes = '', approvedBy = null, actorUser = null }) {
    const pharmacyReturn = await PharmacyReturn.findOne({ returnId });
    if (!pharmacyReturn) {
      throw new Error(`Return '${returnId}' not found.`);
    }

    if (pharmacyReturn.status !== 'REQUESTED' && pharmacyReturn.status !== 'UNDER_REVIEW') {
      throw new Error(`Return '${returnId}' is already ${pharmacyReturn.status}.`);
    }

    const resolvedReviewer = approvedBy || actorUser?.userId || 'SENIOR_PHARMACIST';

    if (action === 'APPROVE') {
      pharmacyReturn.status = 'APPROVED';
      pharmacyReturn.approvedBy = resolvedReviewer;
      pharmacyReturn.approvedAt = new Date();
    } else if (action === 'REJECT') {
      pharmacyReturn.status = 'REJECTED';
      pharmacyReturn.approvedBy = resolvedReviewer;
      pharmacyReturn.approvedAt = new Date();
    } else {
      throw new Error(`Invalid action '${action}'. Must be 'APPROVE' or 'REJECT'.`);
    }

    pharmacyReturn.reviewNotes = reviewNotes;
    await pharmacyReturn.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || resolvedReviewer,
      role: actorUser?.role || 'SENIOR_PHARMACIST',
      action: `RETURN_${action}D`,
      module: 'PHARMACY',
      entityType: 'PharmacyReturn',
      entityId: returnId,
      details: `Return ${returnId} ${action}D by ${resolvedReviewer}. Note: ${reviewNotes}`
    });

    return pharmacyReturn;
  }

  /**
   * Process return disposition (QUARANTINE, RETURN_TO_STOCK, DISPOSE, REJECT)
   * Section 36: Returned medicine must NOT automatically become saleable stock.
   */
  static async processReturnDisposition(
    returnId,
    { itemDispositions = [], processedBy = null, actorUser = null }
  ) {
    const pharmacyReturn = await PharmacyReturn.findOne({ returnId });
    if (!pharmacyReturn) {
      throw new Error(`Return '${returnId}' not found.`);
    }

    if (pharmacyReturn.status !== 'APPROVED') {
      throw new Error(`Cannot process return '${returnId}': current status is ${pharmacyReturn.status} (must be APPROVED).`);
    }

    const resolvedProcessor = processedBy || actorUser?.userId || 'PHARMACIST';
    let anyReturnedToStock = false;

    for (const item of pharmacyReturn.items) {
      const match = itemDispositions.find((d) => d.medicineId === item.medicineId);
      const disposition = match?.disposition || 'QUARANTINE';

      item.disposition = disposition;
      if (match?.notes) item.notes = match.notes;

      if (disposition === 'RETURN_TO_STOCK' && item.condition === 'UNOPENED' && item.inventoryBatchId) {
        // Return only unopened, non-expired medicine to available stock
        const batch = await InventoryBatch.findOne({ batchId: item.inventoryBatchId });
        if (batch && new Date(batch.expiryDate) > new Date()) {
          await InventoryBatch.updateOne(
            { batchId: item.inventoryBatchId },
            { $inc: { availableQuantity: item.quantity } }
          );
          anyReturnedToStock = true;
        }
      }
    }

    pharmacyReturn.status = anyReturnedToStock ? 'PROCESSED' : 'QUARANTINED';
    pharmacyReturn.processedBy = resolvedProcessor;
    pharmacyReturn.processedAt = new Date();
    await pharmacyReturn.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || resolvedProcessor,
      role: actorUser?.role || 'PHARMACIST',
      action: 'RETURN_PROCESSED',
      module: 'PHARMACY',
      entityType: 'PharmacyReturn',
      entityId: returnId,
      details: `Return ${returnId} processed by ${resolvedProcessor}. Final status: ${pharmacyReturn.status}`
    });

    return pharmacyReturn;
  }

  /**
   * Search / filter returns
   */
  static async getReturns({ patientId, status, reason, page = 1, limit = 50 }) {
    const query = {};

    if (patientId) query.patientId = patientId;
    if (status) query.status = status;
    if (reason) query.reason = reason;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [returns, total] = await Promise.all([
      PharmacyReturn.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)).lean(),
      PharmacyReturn.countDocuments(query)
    ]);

    return {
      returns,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get return by ID
   */
  static async getReturnById(returnId) {
    const pharmacyReturn = await PharmacyReturn.findOne({ returnId }).lean();
    if (!pharmacyReturn) {
      throw new Error(`Return '${returnId}' not found.`);
    }
    return pharmacyReturn;
  }
}

module.exports = ReturnService;
