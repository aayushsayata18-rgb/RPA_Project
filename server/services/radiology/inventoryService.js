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
      const { inventoryItemId, batchId, quantity = 1, itemCode = 'RAD-SUPPLY' } = item;

      // 1. Idempotency Check: Don't deduct twice for same study and item
      const existingMovement = await InventoryMovement.findOne({
        sourceModule: 'RADIOLOGY',
        sourceEntityId: String(study._id),
        ...(inventoryItemId ? { inventoryItemId } : {})
      });

      if (existingMovement) {
        recordedMovements.push({
          isDuplicatePrevented: true,
          movement: existingMovement
        });
        continue;
      }

      // 2. Perform Stock Movement
      let resolvedItem = null;
      if (inventoryItemId) {
        resolvedItem = await InventoryItem.findById(inventoryItemId);
      } else if (itemCode) {
        resolvedItem = await InventoryItem.findOne({ itemCode });
      }

      const movement = new InventoryMovement({
        inventoryItemId: resolvedItem ? resolvedItem._id : null,
        batchId: batchId || null,
        movementType: 'CONSUMPTION',
        sourceModule: 'RADIOLOGY',
        sourceEntityId: String(study._id),
        quantity: Number(quantity) || 1,
        unit: resolvedItem?.unitOfMeasure || 'UNIT',
        notes: `Radiology consumable usage for Accession ${study.accessionNumber}`,
        performedBy: user?._id || null,
        movementDate: new Date()
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
