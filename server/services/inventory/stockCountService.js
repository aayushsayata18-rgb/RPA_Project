const StockCountSession = require('../../models/StockCountSession');
const InventoryBatch = require('../../models/InventoryBatch');
const InventoryItem = require('../../models/InventoryItem');
const AdjustmentService = require('./adjustmentService');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class StockCountService {
  /**
   * Initiate a new stock count session and snapshot system quantities
   */
  static async startCountSession(payload, user = { userId: 'SYSTEM' }) {
    const {
      locationId = 'LOC-MAIN-001',
      countType = 'CYCLE_COUNT',
      category = 'ALL'
    } = payload;

    const query = { locationId };
    if (category && category !== 'ALL') {
      // Find items in this category
      const items = await InventoryItem.find({ category }).select('inventoryItemId').lean();
      const itemIds = items.map((i) => i.inventoryItemId);
      query.inventoryItemId = { $in: itemIds };
    }

    // Snapshot active batches in this location
    const batches = await InventoryBatch.find(query).lean();

    const countItems = batches.map((b) => ({
      inventoryItemId: b.inventoryItemId || 'UNKNOWN',
      itemName: b.itemName || b.medicineName || 'Item',
      batchId: b.batchId,
      batchNumber: b.batchNumber,
      systemQuantity: b.availableQuantity,
      countedQuantity: null,
      difference: 0,
      status: 'PENDING',
      notes: ''
    }));

    const countSessionId = await IdGeneratorService.generateCountSessionId();

    const session = new StockCountSession({
      countSessionId,
      locationId,
      countType,
      category,
      status: 'IN_PROGRESS',
      items: countItems,
      totalVarianceItems: 0,
      startedAt: new Date(),
      createdBy: user.userId
    });

    await session.save();

    await AuditService.logEvent({
      eventType: 'COUNT_STARTED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'StockCountSession',
      targetId: countSessionId,
      details: { locationId, countType, totalItemsSnapshot: countItems.length }
    });

    return session;
  }

  /**
   * Submit physical count counts into the session
   */
  static async submitCounts(countSessionId, counts = [], user = { userId: 'SYSTEM' }) {
    const session = await StockCountSession.findOne({ countSessionId });
    if (!session) {
      throw new Error(`Count session '${countSessionId}' not found.`);
    }

    let varianceCount = 0;

    for (const counted of counts) {
      const it = session.items.find(
        (i) => i.batchId === counted.batchId || (i.inventoryItemId === counted.inventoryItemId && !counted.batchId)
      );

      if (it) {
        it.countedQuantity = Number(counted.countedQuantity);
        it.difference = it.countedQuantity - it.systemQuantity;
        it.notes = counted.notes || it.notes;

        if (it.difference === 0) {
          it.status = 'MATCHED';
        } else {
          it.status = 'VARIANCE';
          varianceCount++;
        }
      }
    }

    session.totalVarianceItems = varianceCount;
    session.status = 'PENDING_REVIEW';
    session.completedAt = new Date();
    await session.save();

    await AuditService.logEvent({
      eventType: 'COUNT_COMPLETED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'StockCountSession',
      targetId: countSessionId,
      details: { totalVarianceItems: varianceCount }
    });

    return session;
  }

  /**
   * Approve stock count session and post adjustments
   */
  static async approveAndPostCount(countSessionId, user = { userId: 'SYSTEM' }) {
    const session = await StockCountSession.findOne({ countSessionId });
    if (!session) {
      throw new Error(`Count session '${countSessionId}' not found.`);
    }

    const createdAdjustments = [];

    // For each item with variance, create and process adjustment
    for (const it of session.items) {
      if (it.status === 'VARIANCE' && it.countedQuantity !== null) {
        const adj = await AdjustmentService.createAdjustment(
          {
            inventoryItemId: it.inventoryItemId,
            batchId: it.batchId,
            locationId: session.locationId,
            physicalQuantity: it.countedQuantity,
            reason: 'PHYSICAL_COUNT_DIFFERENCE',
            notes: `Auto adjustment from count session ${countSessionId}`,
            autoApprove: true
          },
          user
        );
        createdAdjustments.push(adj);
      }
    }

    session.status = 'POSTED';
    session.approvedBy = user.userId;
    await session.save();

    await AuditService.logEvent({
      eventType: 'COUNT_POSTED',
      module: 'MEDICAL_INVENTORY',
      performedBy: user.userId,
      targetEntity: 'StockCountSession',
      targetId: countSessionId,
      details: { adjustmentsPosted: createdAdjustments.length }
    });

    return {
      session,
      adjustments: createdAdjustments
    };
  }

  /**
   * Get list of count sessions
   */
  static async getCountSessions(query = {}) {
    const { page = 1, limit = 20, locationId, status } = query;

    const filter = {};
    if (locationId) filter.locationId = locationId;
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await StockCountSession.countDocuments(filter);
    const sessions = await StockCountSession.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return {
      sessions,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get single count session by ID
   */
  static async getCountSessionById(countSessionId) {
    const session = await StockCountSession.findOne({ countSessionId }).lean();
    if (!session) {
      throw new Error(`Count session '${countSessionId}' not found.`);
    }
    return session;
  }
}

module.exports = StockCountService;
