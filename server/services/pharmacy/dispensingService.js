const DispensingRecord = require('../../models/DispensingRecord');
const PharmacyOrder = require('../../models/PharmacyOrder');
const Prescription = require('../../models/Prescription');
const Medicine = require('../../models/Medicine');
const InventoryBatch = require('../../models/InventoryBatch');
const PharmacyRecord = require('../../models/PharmacyRecord');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');
const NotificationService = require('../NotificationService');
const PharmacyBillingService = require('./pharmacyBillingService');

class DispensingService {
  /**
   * Complete dispensing of pharmacy order items
   */
  static async dispenseOrder({
    pharmacyOrderId,
    pharmacistId,
    pharmacistName = '',
    items = [],
    notes = '',
    idempotencyKey = null,
    controlledMedicineApproval = false,
    actorUser = null
  }) {
    if (!pharmacyOrderId || !items || items.length === 0) {
      throw new Error('pharmacyOrderId and at least one item to dispense are required.');
    }

    // 1. Idempotency Check (Section 81 & 91)
    if (idempotencyKey) {
      const existingRecord = await DispensingRecord.findOne({ idempotencyKey });
      if (existingRecord) {
        console.log(`[DispensingService] Idempotent hit: Record ${existingRecord.dispensingRecordId} returned.`);
        return existingRecord;
      }
    }

    // 2. Load and validate PharmacyOrder
    const order = await PharmacyOrder.findOne({ pharmacyOrderId });
    if (!order) {
      throw new Error(`Pharmacy order '${pharmacyOrderId}' not found.`);
    }

    if (order.status === 'COMPLETED' || order.status === 'DISPENSED') {
      // Duplicate dispensing protection (Section 50)
      const existing = await DispensingRecord.findOne({ pharmacyOrderId }).sort({ createdAt: -1 });
      if (existing) {
        return existing;
      }
      throw new Error(`Order ${pharmacyOrderId} has already been completed and dispensed.`);
    }

    if (order.status === 'CANCELLED') {
      throw new Error(`Cannot dispense cancelled pharmacy order.`);
    }

    // 3. Load and validate Prescription
    const prescription = await Prescription.findOne({ prescriptionId: order.prescriptionId });
    if (!prescription) {
      throw new Error(`Associated prescription '${order.prescriptionId}' not found.`);
    }

    if (new Date(prescription.validUntil) < new Date()) {
      prescription.status = 'EXPIRED';
      await prescription.save();
      throw new Error(`Prescription ${prescription.prescriptionId} has expired. Dispensing is blocked.`);
    }

    if (prescription.status === 'CANCELLED') {
      throw new Error(`Prescription ${prescription.prescriptionId} has been cancelled.`);
    }

    const resolvedPharmacistId = pharmacistId || actorUser?.userId || 'PHARMACIST';
    const resolvedPharmacistName = pharmacistName || actorUser?.name || actorUser?.username || 'Attending Pharmacist';

    const dispensedItems = [];
    let totalGrossAmount = 0;
    const now = new Date();

    // 4. Validate and process each item
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const {
        prescriptionItemId,
        medicineId,
        inventoryBatchId,
        batchId,
        dispensedQuantity,
        quantity,
        scannedBarcode = null,
        substitution = false,
        originalMedicineId = null,
        substitutionReason = '',
        approvedBy = null
      } = it;

      const resolvedBatchId = inventoryBatchId || batchId;
      const rawQty = it.dispensedQuantity !== undefined
        ? it.dispensedQuantity
        : (it.quantityDispensed !== undefined ? it.quantityDispensed : it.quantity);
      const qty = parseInt(rawQty, 10) || 0;
      if (qty <= 0) continue;

      // Find item in prescription
      const pItem = prescription.items.find((p) => p.prescriptionItemId === prescriptionItemId || p.medicineId === medicineId);
      if (!pItem) {
        throw new Error(`Prescription item '${prescriptionItemId || medicineId}' not found in prescription.`);
      }

      // Find item in order
      const oItem = order.items.find((o) => o.prescriptionItemId === prescriptionItemId || o.medicineId === medicineId);

      // Verify medicine master
      const medicine = await Medicine.findOne({ medicineId });
      if (!medicine) {
        throw new Error(`Medicine '${medicineId}' not found.`);
      }

      // Barcode verification (Section 47 & 90)
      if (scannedBarcode && scannedBarcode.trim()) {
        const cleanScan = scannedBarcode.trim();
        const expectedBarcode = medicine.barcode || medicine.sku || medicine.medicineId;
        if (cleanScan !== expectedBarcode && cleanScan !== medicine.medicineId) {
          await ExceptionService.raiseException({
            module: 'PHARMACY',
            entityType: 'PharmacyOrder',
            entityId: pharmacyOrderId,
            exceptionType: 'MEDICINE_MISMATCH',
            description: `Barcode mismatch: scanned '${cleanScan}' does not match medicine '${medicine.medicineId}' (${medicine.genericName}).`,
            severity: 'HIGH',
            source: 'BARCODE_SCANNER',
            metadata: { pharmacyOrderId, scannedBarcode: cleanScan, expectedBarcode, medicineId }
          });
          throw new Error(`MEDICINE_MISMATCH: Scanned barcode '${cleanScan}' does not match prescribed medicine '${medicine.genericName}' (${medicine.medicineId}).`);
        }
      }

      // Controlled medicine verification (Section 33)
      if (medicine.controlledMedicine) {
        if (!controlledMedicineApproval && !actorUser?.permissions?.includes('PHARMACY_CONTROLLED_REVIEW') && actorUser?.role !== 'SYSTEM_ADMIN') {
          await ExceptionService.raiseException({
            module: 'PHARMACY',
            entityType: 'Medicine',
            entityId: medicineId,
            exceptionType: 'CONTROLLED_MEDICINE_APPROVAL_REQUIRED',
            description: `Dispensing of controlled medicine ${medicine.genericName} (${medicineId}) requires senior pharmacist approval.`,
            severity: 'HIGH',
            source: 'MANUAL',
            metadata: { medicineId, pharmacyOrderId, pharmacistId: resolvedPharmacistId }
          });
          throw new Error(`CONTROLLED_MEDICINE: Dispensing '${medicine.genericName}' requires authorized senior pharmacist approval.`);
        }
      }

      // Substitution verification (Section 29)
      if (substitution) {
        if (!substitutionReason || !approvedBy) {
          throw new Error(`Substitution of medicine '${medicine.genericName}' requires an authorized approval and clinical reason.`);
        }
      }

      // Verify physical inventory batch & expiry date (Section 25 & 89)
      const batch = await InventoryBatch.findOne({ batchId: resolvedBatchId });
      if (!batch) {
        throw new Error(`Inventory batch '${resolvedBatchId}' not found.`);
      }

      if (batch.status === 'EXPIRED' || new Date(batch.expiryDate) <= now) {
        await ExceptionService.raiseException({
          module: 'PHARMACY',
          entityType: 'InventoryBatch',
          entityId: resolvedBatchId,
          exceptionType: 'EXPIRED_BATCH',
          description: `Attempted to dispense expired batch ${resolvedBatchId} for medicine ${medicineId}. Dispensing BLOCKED.`,
          severity: 'CRITICAL',
          source: 'MANUAL',
          metadata: { batchId: resolvedBatchId, expiryDate: batch.expiryDate, pharmacyOrderId }
        });
        throw new Error(`EXPIRED_BATCH: Batch '${resolvedBatchId}' expired on ${batch.expiryDate.toISOString().slice(0, 10)}. Dispensing blocked.`);
      }

      // Check available quantity (including reserved stock)
      const currentAvailable = batch.availableQuantity + (batch.reservedQuantity || 0);
      if (currentAvailable < qty) {
        throw new Error(`Insufficient batch stock: batch ${resolvedBatchId} only has ${currentAvailable} available, requested ${qty}.`);
      }

      // Deduct stock atomically
      const deductReserved = Math.min(batch.reservedQuantity || 0, qty);
      const deductAvailable = qty - deductReserved;

      await InventoryBatch.updateOne(
        { batchId: resolvedBatchId },
        {
          $inc: {
            reservedQuantity: -deductReserved,
            availableQuantity: -deductAvailable
          }
        }
      );

      // Check if batch is now depleted
      const updatedBatch = await InventoryBatch.findOne({ batchId: resolvedBatchId }).lean();
      if (updatedBatch && updatedBatch.availableQuantity <= 0 && updatedBatch.reservedQuantity <= 0) {
        await InventoryBatch.updateOne({ batchId: resolvedBatchId }, { status: 'DEPLETED' });
      }

      const unitPrice = Number(batch.unitPrice || medicine.unitPrice || 0);
      const itemTotal = Math.round(qty * unitPrice * 100) / 100;
      totalGrossAmount += itemTotal;

      // Update prescription item dispensed count
      pItem.dispensedQuantity = (pItem.dispensedQuantity || 0) + qty;
      if (pItem.dispensedQuantity >= pItem.quantity) {
        pItem.status = 'DISPENSED';
      } else {
        pItem.status = 'PARTIALLY_DISPENSED';
      }

      // Update order item dispensed count
      if (oItem) {
        oItem.dispensedQuantity = (oItem.dispensedQuantity || 0) + qty;
        if (oItem.dispensedQuantity >= oItem.prescribedQuantity) {
          oItem.status = 'DISPENSED';
        } else {
          oItem.status = 'PARTIALLY_DISPENSED';
        }
      }

      dispensedItems.push({
        prescriptionItemId: pItem.prescriptionItemId,
        medicineId: medicine.medicineId,
        medicineName: medicine.genericName,
        inventoryBatchId: resolvedBatchId,
        batchExpiryDate: batch.expiryDate,
        prescribedQuantity: pItem.quantity,
        dispensedQuantity: qty,
        unit: pItem.unit || medicine.unit || 'Tablet',
        unitPrice,
        totalPrice: itemTotal,
        dispensingStatus: pItem.dispensedQuantity >= pItem.quantity ? 'DISPENSED' : 'PARTIALLY_DISPENSED',
        substitution: Boolean(substitution),
        originalMedicineId: substitution ? originalMedicineId : undefined,
        originalMedicineName: substitution ? (await Medicine.findOne({ medicineId: originalMedicineId }).lean())?.genericName : undefined,
        substitutionReason: substitution ? substitutionReason : undefined,
        approvedBy: substitution ? approvedBy : undefined,
        approvedAt: substitution ? new Date() : undefined,
        instructions: pItem.instructions || ''
      });
    }

    if (dispensedItems.length === 0) {
      throw new Error('No items were successfully prepared for dispensing.');
    }

    // 5. Determine Order and Prescription completion status
    const allPrescriptionItemsCompleted = prescription.items.every((it) => it.dispensedQuantity >= it.quantity);
    prescription.status = allPrescriptionItemsCompleted ? 'DISPENSED' : 'PARTIALLY_DISPENSED';
    prescription.updatedBy = actorUser?.userId || resolvedPharmacistId;
    await prescription.save();

    const allOrderItemsCompleted = order.items.every((it) => it.dispensedQuantity >= it.prescribedQuantity);
    order.status = allOrderItemsCompleted ? 'COMPLETED' : 'PARTIALLY_FULFILLED';
    order.completedAt = allOrderItemsCompleted ? new Date() : null;
    order.processedAt = new Date();
    order.pharmacistId = resolvedPharmacistId;
    order.pharmacistName = resolvedPharmacistName;
    order.updatedBy = actorUser?.userId || resolvedPharmacistId;
    await order.save();

    // 6. Create Dispensing Record
    const dispensingRecordId = await IdGeneratorService.generateDispensingRecordId();

    const record = new DispensingRecord({
      dispensingRecordId,
      pharmacyOrderId,
      prescriptionId: order.prescriptionId,
      patientId: order.patientId,
      patientName: order.patientName,
      visitId: order.visitId,
      admissionId: order.admissionId,
      pharmacistId: resolvedPharmacistId,
      pharmacistName: resolvedPharmacistName,
      dispensedAt: new Date(),
      status: 'COMPLETED',
      items: dispensedItems,
      totalAmount: Math.round(totalGrossAmount * 100) / 100,
      idempotencyKey: idempotencyKey || dispensingRecordId,
      notes,
      correlationId: order.correlationId || dispensingRecordId
    });

    await record.save();

    // 7. Post Billing Charges (Section 37 & 38)
    try {
      const billingResult = await PharmacyBillingService.createBillingForDispensing({
        dispensingRecordId,
        pharmacyOrderId,
        prescriptionId: order.prescriptionId,
        patientId: order.patientId,
        patientName: order.patientName,
        visitId: order.visitId,
        admissionId: order.admissionId,
        items: dispensedItems,
        actorUser,
        correlationId: record.correlationId
      });

      if (billingResult && billingResult.billableCharges.length > 0) {
        record.billingReferenceId = billingResult.billableCharges[0].chargeId;
        await record.save();
      }
    } catch (billingErr) {
      console.error('[DispensingService] Billing integration warning:', billingErr.message);
      await ExceptionService.raiseException({
        module: 'PHARMACY',
        entityType: 'DispensingRecord',
        entityId: dispensingRecordId,
        exceptionType: 'BILLING_SYNC_FAILURE',
        description: `Failed to post billing charge for dispensing ${dispensingRecordId}: ${billingErr.message}`,
        severity: 'MEDIUM',
        source: 'DISPENSING',
        metadata: { dispensingRecordId, error: billingErr.message }
      });
    }

    // 8. Longitudinal Patient Record Synchronization (Module 7)
    try {
      await PharmacyRecord.create({
        dispenseId: dispensingRecordId,
        prescriptionId: order.prescriptionId,
        patientId: order.patientId,
        patientName: order.patientName,
        admissionId: order.admissionId,
        visitId: order.visitId,
        prescribedByDoctorId: prescription.doctorId,
        prescribedByDoctorName: prescription.doctorName,
        dispensedByPharmacist: resolvedPharmacistName,
        dispenseDate: new Date(),
        status: allOrderItemsCompleted ? 'DISPENSED' : 'PARTIALLY_DISPENSED',
        medications: dispensedItems.map((d) => ({
          medicineName: d.medicineName,
          quantity: d.dispensedQuantity,
          unitPrice: d.unitPrice,
          totalPrice: d.totalPrice,
          batchNumber: d.inventoryBatchId,
          expiryDate: d.batchExpiryDate,
          instructions: d.instructions
        })),
        totalAmount: record.totalAmount,
        billingReferenceId: record.billingReferenceId,
        correlationId: record.correlationId
      });
    } catch (recordErr) {
      console.warn('[DispensingService] Longitudinal record sync note:', recordErr.message);
    }

    // 9. Patient Notification (Section 41 & 42)
    try {
      await NotificationService.sendNotification({
        recipientId: order.patientId,
        channel: 'IN_APP',
        event: 'PHARMACY_ORDER_DISPENSED',
        title: 'Medication Ready / Dispensed',
        message: `Your pharmacy order ${pharmacyOrderId} has been dispensed and is ready.`,
        entityType: 'PharmacyOrder',
        entityId: pharmacyOrderId,
        correlationId: record.correlationId
      });
    } catch (notifErr) {
      console.warn('[DispensingService] Notification note:', notifErr.message);
    }

    // 10. Audit Logging
    await AuditService.logEvent({
      userId: actorUser?.userId || resolvedPharmacistId,
      role: actorUser?.role || 'PHARMACIST',
      action: 'DISPENSING_COMPLETED',
      module: 'PHARMACY',
      entityType: 'DispensingRecord',
      entityId: dispensingRecordId,
      patientId: order.patientId,
      details: `Pharmacist ${resolvedPharmacistName} dispensed ${dispensedItems.length} items (Total ₹${record.totalAmount.toFixed(2)}) for Order ${pharmacyOrderId}. Status: ${order.status}`
    });

    return record;
  }

  /**
   * Get dispensing records with filtering
   */
  static async getDispensingRecords({ patientId, pharmacyOrderId, pharmacistId, page = 1, limit = 50 }) {
    const query = {};

    if (patientId) query.patientId = patientId;
    if (pharmacyOrderId) query.pharmacyOrderId = pharmacyOrderId;
    if (pharmacistId) query.pharmacistId = pharmacistId;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [records, total] = await Promise.all([
      DispensingRecord.find(query).sort({ dispensedAt: -1 }).skip(skip).limit(parseInt(limit, 10)).lean(),
      DispensingRecord.countDocuments(query)
    ]);

    return {
      records,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get single dispensing record by ID
   */
  static async getDispensingRecordById(dispensingRecordId) {
    const record = await DispensingRecord.findOne({ dispensingRecordId }).lean();
    if (!record) {
      throw new Error(`Dispensing record '${dispensingRecordId}' not found.`);
    }
    return record;
  }
}

module.exports = DispensingService;
