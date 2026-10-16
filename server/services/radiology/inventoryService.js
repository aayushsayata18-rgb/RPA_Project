const InventoryMovement = require('../../models/InventoryMovement');
const InventoryBatch = require('../../models/InventoryBatch');
const InventoryItem = require('../../models/InventoryItem');
const AuditService = require('../AuditService');

class RadiologyInventoryService {
  /**
   * Record consumable/contrast usage for a completed radiology study
   */
  static async recordConsumableUsage({ study, consumables = [], user = null }) {
    if (!study) {
      throw new Error('Study is required to record consumable usage.');
    }

    const recordedMovements = [];

    for (const item of consumables) {
      const { inventoryItemId, itemId, batchId, quantity = 1, itemCode = 'RAD-SUPPLY', itemName = 'Radiology Supply' } = item;
      const targetItemId = inventoryItemId || itemId;

      // 1. Idempotency Check: Don't deduct twice for same study and item
      const existingMovement = await InventoryMovement.findOne({
        referenceType: 'RADIOLOGY_PROCEDURE',
        referenceId: String(study._id)
      });

      if (existingMovement) {
        recordedMovements.push({
          isDuplicate: true,
          isDuplicatePrevented: true,
          movement: existingMovement
        });
        continue;
      }

      // 2. Perform Stock Movement
      let resolvedItem = null;
      if (targetItemId && String(targetItemId).match(/^[0-9a-fA-F]{24}$/)) {
        resolvedItem = await InventoryItem.findById(targetItemId);
      } else if (itemCode) {
        resolvedItem = await InventoryItem.findOne({ $or: [{ itemCode }, { inventoryItemId: targetItemId }] });
      }

      const movementId = `MOV-RAD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const finalItemId = resolvedItem ? (resolvedItem.inventoryItemId || String(resolvedItem._id)) : String(targetItemId || `INV-RAD-${Date.now().toString().slice(-4)}`);
      const finalItemName = resolvedItem ? resolvedItem.name : itemName;

      const movement = new InventoryMovement({
        movementId,
        inventoryItemId: finalItemId,
        itemName: finalItemName,
        batchId: batchId ? String(batchId) : null,
        movementType: 'CONSUMPTION',
        referenceType: 'RADIOLOGY_PROCEDURE',
        referenceId: String(study._id),
        quantity: Number(quantity) || 1,
        unit: resolvedItem?.unitOfMeasure || 'UNIT',
        reason: `Radiology consumable usage for Accession ${study.accessionNumber}`,
        performedBy: user ? (user.userId || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()) : 'SYSTEM',
        timestamp: new Date()
      });

      await movement.save();

      // Deduct from batch if provided
      if (batchId) {
        try {
          await InventoryBatch.findByIdAndUpdate(batchId, {
            $inc: { quantity: -Number(quantity) }
          });
        } catch (e) {}
      }

      recordedMovements.push({
        isDuplicatePrevented: false,
        movement
      });
    }

    await AuditService.logAction({
      user,
      action: 'RECORD_RADIOLOGY_CONSUMABLE_USAGE',
      entity: 'RadiologyStudy',
      entityId: study._id,
      description: `Recorded ${recordedMovements.length} consumable inventory movements for study ${study.accessionNumber}`
    });

    return recordedMovements;
  }
}

module.exports = RadiologyInventoryService;
