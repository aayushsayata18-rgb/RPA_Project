const BillingService = require('../BillingService');
const BillableItem = require('../../models/BillableItem');
const AuditService = require('../AuditService');

class PharmacyBillingService {
  /**
   * Post billable charge for dispensed medication items (Section 37 & 38)
   */
  static async createBillingForDispensing({
    dispensingRecordId,
    pharmacyOrderId,
    prescriptionId,
    patientId,
    patientName,
    visitId,
    admissionId,
    items = [],
    actorUser = null,
    correlationId = null
  }) {
    const billableCharges = [];
    let totalGross = 0;

    for (const item of items) {
      if (!item.dispensedQuantity || item.dispensedQuantity <= 0) {
        continue;
      }

      const sourceId = `${dispensingRecordId}_${item.prescriptionItemId || item.medicineId}`;

      // Idempotency check: prevent duplicate billing charge
      const existingCharge = await BillableItem.findOne({
        sourceModule: 'PHARMACY',
        sourceType: 'PHARMACY_DISPENSING',
        sourceId
      });

      if (existingCharge) {
        billableCharges.push(existingCharge);
        totalGross += existingCharge.grossAmount;
        continue;
      }

      const unitPrice = Number(item.unitPrice || 0);
      const quantity = Number(item.dispensedQuantity || 1);
      const grossAmount = Math.round(quantity * unitPrice * 100) / 100;
      totalGross += grossAmount;

      const charge = await BillingService.addBillableItem({
        patientId,
        patientName,
        visitId,
        admissionId,
        sourceModule: 'PHARMACY',
        sourceType: 'PHARMACY_DISPENSING',
        sourceId,
        serviceCode: `MED-${item.medicineId}`,
        description: `Medication: ${item.medicineName} (Qty: ${quantity} ${item.unit || 'unit'})`,
        quantity,
        unitPrice,
        serviceDate: new Date(),
        notes: `Dispensed in Record ${dispensingRecordId} (Batch: ${item.inventoryBatchId})`,
        actorUser,
        correlationId
      });

      billableCharges.push(charge);
    }

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'PHARMACIST',
      action: 'PHARMACY_BILLING_POSTED',
      module: 'PHARMACY',
      entityType: 'DispensingRecord',
      entityId: dispensingRecordId,
      patientId,
      details: `Posted ${billableCharges.length} billable items totaling ₹${totalGross.toFixed(2)} for Dispensing ${dispensingRecordId}.`
    });

    return {
      dispensingRecordId,
      billableCharges,
      totalAmount: totalGross
    };
  }
}

module.exports = PharmacyBillingService;
