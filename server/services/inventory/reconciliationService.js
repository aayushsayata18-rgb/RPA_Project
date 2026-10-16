const InventoryReconciliation = require('../../models/InventoryReconciliation');
const InventoryBatch = require('../../models/InventoryBatch');
const InventoryItem = require('../../models/InventoryItem');
const AdjustmentService = require('./adjustmentService');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');

class ReconciliationService {
  /**
   * Run reconciliation against external data feed or report
   */
  static async runReconciliation(payload, user = { userId: 'SYSTEM' }) {
    const {
      source = 'EXTERNAL_ERP',
      locationId = 'LOC-MAIN-001',
      externalRecords = []
    } = payload;

    const reconciliationId = await IdGeneratorService.generateReconciliationId();
    const results = [];

    let matchedCount = 0;
    let mismatchedCount = 0;
    let unknownCount = 0;

    for (const record of externalRecords) {
      // Look for internal item
      let item = null;
      if (record.itemId) {
        item = await InventoryItem.findOne({ inventoryItemId: record.itemId }).lean();
      }
      if (!item) {
        item = await InventoryItem.findOne({
          $or: [
            { sku: record.sku || record.itemId },
            { barcode: record.barcode || record.itemId },
            { name: record.itemName }
          ]
        }).lean();
      }

      if (!item) {
        unknownCount++;
        results.push({
          inventoryItemId: record.itemId || 'UNKNOWN',
          itemName: record.itemName || 'Unknown Item',
          batchId: '',
          batchNumber: record.batchNumber || '',
          systemQuantity: 0,
          externalQuantity: Number(record.quantity || 0),
          difference: Number(record.quantity || 0),
          status: 'UNKNOWN_ITEM',
          resolution: 'Requires item registration'
        });
        continue;
      }

      // Look for internal batch
      let batch = null;
      if (record.batchNumber) {
        batch = await InventoryBatch.findOne({
          inventoryItemId: item.inventoryItemId,
          batchNumber: record.batchNumber,
          locationId
        }).lean();
      }

      if (!batch && record.batchNumber) {
        unknownCount++;
        results.push({
          inventoryItemId: item.inventoryItemId,
          itemName: item.name,
          batchId: '',
          batchNumber: record.batchNumber,
          systemQuantity: 0,
          externalQuantity: Number(record.quantity || 0),
          difference: Number(record.quantity || 0),
          status: 'UNKNOWN_BATCH',
          resolution: 'Batch not found in location'
        });
        continue;
      }

      const systemQty = batch ? batch.availableQuantity : 0;
      const externalQty = Number(record.quantity || 0);
      const diff = externalQty - systemQty;

      if (diff === 0) {
        matchedCount++;
        results.push({
          inventoryItemId: item.inventoryItemId,
          itemName: item.name,
          batchId: batch ? batch.batchId : '',
          batchNumber: batch ? batch.batchNumber : '',
          systemQuantity: systemQty,
          externalQuantity: externalQty,
          difference: 0,
          status: 'MATCHED',
          resolution: 'Exact match'
        });
      } else {
        mismatchedCount++;
        results.push({
          inventoryItemId: item.inventoryItemId,
          itemName: item.name,
          batchId: batch ? batch.batchId : '',
          batchNumber: batch ? batch.batchNumber : '',
          systemQuantity: systemQty,
          externalQuantity: externalQty,
          difference: diff,
          status: 'MISMATCH',
          resolution: 'Pending investigation'
        });

        await ExceptionService.raiseException({
          module: 'MEDICAL_INVENTORY',
          entityType: 'InventoryReconciliation',
          entityId: reconciliationId,
          exceptionType: 'STOCK_MISMATCH',
          description: `Reconciliation stock mismatch for ${item.name} (${batch ? batch.batchNumber : 'N/A'}): System has ${systemQty}, External has ${externalQty} (Variance: ${diff})`,
          severity: 'HIGH',
          source: 'RPA_OR_MANUAL',
          metadata: { reconciliationId, inventoryItemId: item.inventoryItemId, systemQty, externalQty, difference: diff }
        });
      }
    }

    const overallStatus = mismatchedCount > 0 || unknownCount > 0 ? 'PENDING_REVIEW' : 'MATCHED';

    const reconciliation = new InventoryReconciliation({
      reconciliationId,
      source,
      locationId,
      startedAt: new Date(),
      completedAt: new Date(),
      status: overallStatus,
      totalItems: externalRecords.length,
      matchedItems: matchedCount,
      mismatchedItems: mismatchedCount,
      unknownItems: unknownCount,
      results,
      createdBy: user.userId
    });

    await reconciliation.save();

    await AuditService.logEvent({
      eventType: 'RECONCILIATION_CREATED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryReconciliation',
      targetId: reconciliationId,
      details: {
        source,
        totalItems: externalRecords.length,
        matched: matchedCount,
        mismatched: mismatchedCount,
        unknown: unknownCount
      }
    });

    return reconciliation;
  }

  /**
   * Resolve an individual reconciliation discrepancy
   */
  static async resolveDiscrepancy(reconciliationId, resolutionData, user = { userId: 'SYSTEM' }) {
    const { batchNumber, inventoryItemId, action, notes = '' } = resolutionData;

    const recon = await InventoryReconciliation.findOne({ reconciliationId });
    if (!recon) {
      throw new Error(`Reconciliation '${reconciliationId}' not found.`);
    }

    const itemResult = recon.results.find(
      (r) => (r.batchNumber === batchNumber || !batchNumber) && r.inventoryItemId === inventoryItemId
    );

    if (!itemResult) {
      throw new Error('Discrepancy item not found in reconciliation.');
    }

    let createdAdjustment = null;

    if (action === 'CREATE_ADJUSTMENT' && itemResult.batchId) {
      createdAdjustment = await AdjustmentService.createAdjustment(
        {
          inventoryItemId: itemResult.inventoryItemId,
          batchId: itemResult.batchId,
          locationId: recon.locationId,
          physicalQuantity: itemResult.externalQuantity,
          reason: 'DATA_CORRECTION',
          notes: `Reconciliation resolution: ${notes}`,
          autoApprove: true
        },
        user
      );
      itemResult.status = 'RESOLVED';
      itemResult.resolution = `Adjusted system quantity to external (${itemResult.externalQuantity}): ${notes}`;
    } else if (action === 'MARK_MATCHED') {
      itemResult.status = 'RESOLVED';
      itemResult.resolution = `Accepted discrepancy explanation: ${notes}`;
    } else {
      itemResult.resolution = notes;
    }

    itemResult.resolvedBy = user.userId;
    itemResult.resolvedAt = new Date();

    // Check if all are resolved
    const remainingUnresolved = recon.results.filter(
      (r) => r.status === 'MISMATCH' || r.status === 'UNKNOWN_ITEM' || r.status === 'UNKNOWN_BATCH'
    );
    if (remainingUnresolved.length === 0) {
      recon.status = 'RESOLVED';
    }

    await recon.save();

    await AuditService.logEvent({
      eventType: 'RECONCILIATION_RESOLVED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryReconciliation',
      targetId: reconciliationId,
      details: { inventoryItemId, batchNumber, action, notes }
    });

    return {
      reconciliation: recon,
      adjustment: createdAdjustment
    };
  }

  /**
   * Get list of reconciliations
   */
  static async getReconciliations(query = {}) {
    const { page = 1, limit = 20, locationId, status, source } = query;

    const filter = {};
    if (locationId) filter.locationId = locationId;
    if (status) filter.status = status;
    if (source) filter.source = source;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await InventoryReconciliation.countDocuments(filter);
    const reconciliations = await InventoryReconciliation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return {
      reconciliations,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get single reconciliation by ID
   */
  static async getReconciliationById(reconciliationId) {
    const recon = await InventoryReconciliation.findOne({ reconciliationId }).lean();
    if (!recon) {
      throw new Error(`Reconciliation '${reconciliationId}' not found.`);
    }
    return recon;
  }
}

module.exports = ReconciliationService;
