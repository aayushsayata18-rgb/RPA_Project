const InventoryTransfer = require('../../models/InventoryTransfer');
const InventoryBatch = require('../../models/InventoryBatch');
const InventoryItem = require('../../models/InventoryItem');
const StockService = require('./stockService');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');

class TransferService {
  /**
   * Request inter-store stock transfer
   */
  static async requestTransfer(payload, user = { userId: 'SYSTEM' }) {
    const {
      sourceLocationId,
      destinationLocationId,
      items = [],
      reason = 'Stock Replenishment',
      notes = ''
    } = payload;

    if (!sourceLocationId || !destinationLocationId) {
      throw new Error('Both source and destination locations are required.');
    }
    if (sourceLocationId === destinationLocationId) {
      throw new Error('Source and destination locations cannot be the same.');
    }
    if (!items || items.length === 0) {
      throw new Error('At least one transfer item is required.');
    }

    const transferId = await IdGeneratorService.generateTransferId();
    const validatedItems = [];

    for (const it of items) {
      const item = await InventoryItem.findOne({ inventoryItemId: it.inventoryItemId }).lean();
      if (!item) {
        throw new Error(`Inventory item '${it.inventoryItemId}' not found.`);
      }

      const batch = await InventoryBatch.findOne({ batchId: it.batchId }).lean();
      if (!batch) {
        throw new Error(`Batch '${it.batchId}' not found.`);
      }

      const reqQty = Number(it.requestedQuantity);
      if (reqQty <= 0) {
        throw new Error(`Invalid transfer quantity: ${reqQty}`);
      }
      if (batch.availableQuantity < reqQty) {
        throw new Error(`Insufficient stock in source batch ${batch.batchNumber}. Available: ${batch.availableQuantity}, Requested: ${reqQty}`);
      }

      validatedItems.push({
        inventoryItemId: item.inventoryItemId,
        itemName: item.name,
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        requestedQuantity: reqQty,
        dispatchedQuantity: 0,
        receivedQuantity: 0,
        difference: 0,
        status: 'PENDING'
      });
    }

    const transfer = new InventoryTransfer({
      transferId,
      sourceLocationId,
      destinationLocationId,
      items: validatedItems,
      reason,
      notes,
      requestedBy: user.userId,
      status: 'REQUESTED',
      requestedAt: new Date()
    });

    await transfer.save();

    await AuditService.logEvent({
      eventType: 'TRANSFER_REQUESTED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryTransfer',
      targetId: transferId,
      details: { sourceLocationId, destinationLocationId, itemCount: validatedItems.length }
    });

    return transfer;
  }

  /**
   * Approve stock transfer
   */
  static async approveTransfer(transferId, user = { userId: 'SYSTEM' }) {
    const transfer = await InventoryTransfer.findOne({ transferId });
    if (!transfer) {
      throw new Error(`Transfer '${transferId}' not found.`);
    }
    if (transfer.status !== 'REQUESTED') {
      throw new Error(`Transfer cannot be approved in '${transfer.status}' status.`);
    }

    // Reserve stock at source
    for (const it of transfer.items) {
      const batch = await InventoryBatch.findOne({ batchId: it.batchId });
      if (batch.availableQuantity < it.requestedQuantity) {
        throw new Error(`Source batch ${batch.batchNumber} has insufficient stock for approval. Available: ${batch.availableQuantity}, Requested: ${it.requestedQuantity}`);
      }
      batch.availableQuantity -= it.requestedQuantity;
      batch.reservedQuantity = (batch.reservedQuantity || 0) + it.requestedQuantity;
      await batch.save();
    }

    transfer.status = 'APPROVED';
    transfer.approvedBy = user.userId;
    transfer.approvedAt = new Date();
    await transfer.save();

    await AuditService.logEvent({
      eventType: 'TRANSFER_APPROVED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryTransfer',
      targetId: transferId,
      details: { approvedBy: user.userId }
    });

    return transfer;
  }

  /**
   * Dispatch stock transfer (TRANSFER_OUT)
   */
  static async dispatchTransfer(transferId, user = { userId: 'SYSTEM' }) {
    const transfer = await InventoryTransfer.findOne({ transferId });
    if (!transfer) {
      throw new Error(`Transfer '${transferId}' not found.`);
    }
    if (transfer.status !== 'APPROVED') {
      throw new Error(`Transfer must be in APPROVED status to dispatch. Current: ${transfer.status}`);
    }

    for (const it of transfer.items) {
      const batch = await InventoryBatch.findOne({ batchId: it.batchId });
      if (batch) {
        // Release from reserved and subtract from onHand
        batch.reservedQuantity = Math.max(0, (batch.reservedQuantity || 0) - it.requestedQuantity);
        batch.onHandQuantity = Math.max(0, (batch.onHandQuantity || 0) - it.requestedQuantity);
        if (batch.availableQuantity === 0 && batch.reservedQuantity === 0) {
          batch.status = 'DEPLETED';
        }
        await batch.save();

        it.dispatchedQuantity = it.requestedQuantity;
        it.status = 'DISPATCHED';

        // Record TRANSFER_OUT movement
        await StockService.recordMovement({
          inventoryItemId: it.inventoryItemId,
          itemName: it.itemName,
          batchId: batch.batchId,
          batchNumber: batch.batchNumber,
          sourceLocationId: transfer.sourceLocationId,
          destinationLocationId: transfer.destinationLocationId,
          movementType: 'TRANSFER_OUT',
          quantity: -it.requestedQuantity,
          referenceType: 'TRANSFER',
          referenceId: transferId,
          reason: `Dispatched transfer to ${transfer.destinationLocationId}`,
          performedBy: user.userId
        });
      }
    }

    transfer.status = 'DISPATCHED';
    transfer.issuedBy = user.userId;
    transfer.dispatchedAt = new Date();
    await transfer.save();

    await AuditService.logEvent({
      eventType: 'TRANSFER_DISPATCHED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryTransfer',
      targetId: transferId,
      details: { source: transfer.sourceLocationId, destination: transfer.destinationLocationId }
    });

    return transfer;
  }

  /**
   * Receive stock transfer (TRANSFER_IN) with mismatch check
   */
  static async receiveTransfer(transferId, receivedItems = [], user = { userId: 'SYSTEM' }) {
    const transfer = await InventoryTransfer.findOne({ transferId });
    if (!transfer) {
      throw new Error(`Transfer '${transferId}' not found.`);
    }
    if (transfer.status !== 'DISPATCHED') {
      throw new Error(`Transfer must be in DISPATCHED status to receive. Current: ${transfer.status}`);
    }

    let hasAnyMismatch = false;

    for (const it of transfer.items) {
      const recvSpec = receivedItems.find((r) => r.inventoryItemId === it.inventoryItemId && (r.batchId === it.batchId || !r.batchId));
      const actualReceived = recvSpec !== undefined && recvSpec.receivedQuantity !== undefined
        ? Number(recvSpec.receivedQuantity)
        : it.dispatchedQuantity;

      it.receivedQuantity = actualReceived;
      it.difference = actualReceived - it.dispatchedQuantity;

      if (it.difference !== 0) {
        hasAnyMismatch = true;
        it.status = 'MISMATCH';

        // Raise Exception
        await ExceptionService.raiseException({
          module: 'MEDICAL_INVENTORY',
          entityType: 'InventoryTransfer',
          entityId: transferId,
          exceptionType: 'TRANSFER_MISMATCH',
          description: `Transfer quantity mismatch for item ${it.itemName}: dispatched ${it.dispatchedQuantity}, received ${actualReceived} (variance: ${it.difference})`,
          severity: 'HIGH',
          source: 'API',
          metadata: { transferId, inventoryItemId: it.inventoryItemId, batchId: it.batchId, dispatched: it.dispatchedQuantity, received: actualReceived }
        });
      } else {
        it.status = 'MATCHED';
      }

      // Add actual received quantity to destination location
      if (actualReceived > 0) {
        const sourceBatch = await InventoryBatch.findOne({ batchId: it.batchId }).lean();

        // Check if destination batch exists
        let destBatch = await InventoryBatch.findOne({
          inventoryItemId: it.inventoryItemId,
          batchNumber: it.batchNumber,
          locationId: transfer.destinationLocationId
        });

        if (!destBatch) {
          const newBatchId = await IdGeneratorService.generateBatchId();
          destBatch = new InventoryBatch({
            batchId: newBatchId,
            inventoryItemId: it.inventoryItemId,
            medicineId: sourceBatch?.medicineId || null,
            medicineName: sourceBatch?.medicineName || '',
            itemName: it.itemName,
            batchNumber: it.batchNumber,
            lotNumber: sourceBatch?.lotNumber || it.batchNumber,
            manufacturer: sourceBatch?.manufacturer || '',
            manufacturingDate: sourceBatch?.manufacturingDate || null,
            expiryDate: sourceBatch?.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            receivedDate: new Date(),
            locationId: transfer.destinationLocationId,
            unitCost: sourceBatch?.unitCost || 0,
            sellingPrice: sourceBatch?.sellingPrice || 0,
            initialQuantity: actualReceived,
            receivedQuantity: actualReceived,
            onHandQuantity: actualReceived,
            availableQuantity: actualReceived,
            reservedQuantity: 0,
            status: 'AVAILABLE'
          });
        } else {
          destBatch.availableQuantity += actualReceived;
          destBatch.onHandQuantity = (destBatch.onHandQuantity || 0) + actualReceived;
          if (destBatch.status === 'DEPLETED') destBatch.status = 'AVAILABLE';
        }

        await destBatch.save();

        // Log TRANSFER_IN movement
        await StockService.recordMovement({
          inventoryItemId: it.inventoryItemId,
          itemName: it.itemName,
          batchId: destBatch.batchId,
          batchNumber: destBatch.batchNumber,
          sourceLocationId: transfer.sourceLocationId,
          destinationLocationId: transfer.destinationLocationId,
          movementType: 'TRANSFER_IN',
          quantity: actualReceived,
          referenceType: 'TRANSFER',
          referenceId: transferId,
          reason: `Received from transfer ${transferId}`,
          performedBy: user.userId
        });
      }
    }

    transfer.hasMismatch = hasAnyMismatch;
    transfer.status = hasAnyMismatch ? 'PARTIALLY_RECEIVED' : 'RECEIVED';
    transfer.receivedBy = user.userId;
    transfer.receivedAt = new Date();
    await transfer.save();

    await AuditService.logEvent({
      eventType: 'TRANSFER_RECEIVED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'InventoryTransfer',
      targetId: transferId,
      details: { hasMismatch: hasAnyMismatch, status: transfer.status }
    });

    return transfer;
  }

  /**
   * Get list of transfers
   */
  static async getTransfers(query = {}) {
    const {
      page = 1,
      limit = 20,
      sourceLocationId,
      destinationLocationId,
      status,
      hasMismatch
    } = query;

    const filter = {};
    if (sourceLocationId) filter.sourceLocationId = sourceLocationId;
    if (destinationLocationId) filter.destinationLocationId = destinationLocationId;
    if (status) filter.status = status;
    if (hasMismatch !== undefined) filter.hasMismatch = hasMismatch === 'true' || hasMismatch === true;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await InventoryTransfer.countDocuments(filter);
    const transfers = await InventoryTransfer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return {
      transfers,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get transfer by ID
   */
  static async getTransferById(transferId) {
    const transfer = await InventoryTransfer.findOne({ transferId }).lean();
    if (!transfer) {
      throw new Error(`Transfer '${transferId}' not found.`);
    }
    return transfer;
  }
}

module.exports = TransferService;
