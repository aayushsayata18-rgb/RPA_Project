const InventoryMovement = require('../../models/InventoryMovement');
const InventoryItem = require('../../models/InventoryItem');
const InventoryBatch = require('../../models/InventoryBatch');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class LaboratoryInventoryService {
  /**
   * Deduct consumable used in lab testing with duplicate consumption prevention
   */
  static async consumeConsumable({
    orderItemId,
    inventoryItemId,
    quantity = 1,
    batchId = null,
    user = null,
    reason = 'Laboratory test consumable usage'
  }) {
    if (!orderItemId || !inventoryItemId) {
      throw new Error('orderItemId and inventoryItemId are required.');
    }

    // Duplicate consumption check
    const existingMovement = await InventoryMovement.findOne({
      referenceType: 'LAB_PROCEDURE',
      referenceId: orderItemId,
      inventoryItemId
    });

    if (existingMovement) {
      return {
        isDuplicate: true,
        movement: existingMovement,
        message: `Consumable movement ${existingMovement.movementId} already recorded for order item ${orderItemId} (duplicate consumption prevented).`
      };
    }

    // Verify item
    const item = await InventoryItem.findOne({ inventoryItemId });
    const itemName = item ? item.name : 'Lab Consumable / Reagent';

    let batchNumber = '';
    if (batchId) {
      const batch = await InventoryBatch.findOne({ batchId });
      if (batch) {
        batchNumber = batch.batchNumber;
        if (batch.quantityAvailable >= quantity) {
          batch.quantityAvailable -= quantity;
          await batch.save();
        }
      }
    }

    const movementId = await IdGeneratorService.generateMovementId();
    const movement = new InventoryMovement({
      movementId,
      inventoryItemId,
      itemName,
      batchId,
      batchNumber,
      sourceLocationId: 'CENTRAL_LAB_STORE',
      destinationLocationId: null,
      movementType: 'CONSUMPTION',
      quantity,
      unit: item?.unitOfMeasure || 'UNIT',
      referenceType: 'LAB_PROCEDURE',
      referenceId: orderItemId,
      reason,
      performedBy: user?.userId || 'SYSTEM',
      timestamp: new Date()
    });

    await movement.save();

    await AuditService.logAction({
      action: 'LAB_INVENTORY_CONSUMPTION',
      module: 'LABORATORY',
      entityId: movement.movementId,
      entityType: 'InventoryMovement',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Consumed ${quantity} of ${itemName} (${inventoryItemId}) for test item ${orderItemId}`
    });

    return {
      isDuplicate: false,
      movement,
      message: `Consumable ${itemName} consumed successfully.`
    };
  }

  /**
   * Consume reagents configured for a LabTest
   */
  static async consumeReagentsForTest({ orderItem, labTest, user = null }) {
    if (!labTest || !labTest.reagentsRequired || labTest.reagentsRequired.length === 0) {
      return [];
    }

    const results = [];
    for (const reagent of labTest.reagentsRequired) {
      if (reagent.inventoryItemId) {
        const res = await this.consumeConsumable({
          orderItemId: orderItem.orderItemId,
          inventoryItemId: reagent.inventoryItemId,
          quantity: reagent.quantity || 1,
          user,
          reason: `Auto consumption for test ${orderItem.testCodeSnapshot}`
        });
        results.push(res);
      }
    }
    return results;
  }
}

module.exports = LaboratoryInventoryService;
