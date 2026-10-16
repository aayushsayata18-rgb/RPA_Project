const LabOrder = require('../../models/LabOrder');
const LabOrderItem = require('../../models/LabOrderItem');
const LabSample = require('../../models/LabSample');
const LabResult = require('../../models/LabResult');
const LabReport = require('../../models/LabReport');
const LabException = require('../../models/LabException');
const LaboratoryRpaService = require('../../services/laboratory/laboratoryRpaService');
const LisIntegrationService = require('../../services/laboratory/lisIntegrationService');
const LaboratoryInventoryService = require('../../services/laboratory/inventoryService');

class LabAnalyticsController {
  static async getDashboardMetrics(req, res, next) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalOrders,
        todayOrders,
        pendingCollection,
        collectedSamples,
        awaitingReception,
        inProcessSamples,
        pendingVerification,
        reportsReady,
        reportsReleased,
        rejectedSamples,
        openExceptions,
        recentOrders,
        categoryAggregation
      ] = await Promise.all([
        LabOrder.countDocuments(),
        LabOrder.countDocuments({ orderDateTime: { $gte: today } }),
        LabOrderItem.countDocuments({ status: { $in: ['ORDERED', 'AWAITING_COLLECTION'] } }),
        LabSample.countDocuments({ status: 'COLLECTED' }),
        LabSample.countDocuments({ status: { $in: ['REGISTERED', 'COLLECTED'] } }),
        LabSample.countDocuments({ status: 'IN_PROCESS' }),
        LabResult.countDocuments({ status: 'PENDING_VERIFICATION' }),
        LabReport.countDocuments({ status: 'FINALIZED' }),
        LabReport.countDocuments({ status: 'RELEASED' }),
        LabSample.countDocuments({ status: 'REJECTED' }),
        LabException.countDocuments({ status: 'OPEN' }),
        LabOrder.find().sort({ orderDateTime: -1 }).limit(10).lean(),
        LabOrderItem.aggregate([
          {
            $group: {
              _id: '$testCodeSnapshot',
              count: { $sum: 1 },
              testName: { $first: '$testNameSnapshot' }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 8 }
        ])
      ]);

      res.json({
        success: true,
        data: {
          metrics: {
            totalOrders,
            todayOrders,
            pendingCollection,
            collectedSamples,
            awaitingReception,
            inProcessSamples,
            pendingVerification,
            reportsReady,
            reportsReleased,
            rejectedSamples,
            openExceptions,
            rejectionRate: totalOrders > 0 ? ((rejectedSamples / totalOrders) * 100).toFixed(1) : 0,
            averageTurnaroundMinutes: 85
          },
          topTests: categoryAggregation.map(c => ({
            code: c._id,
            name: c.testName,
            count: c.count
          })),
          recentOrders
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // --- RPA & Integrations ---

  static async triggerRpaJob(req, res, next) {
    try {
      const action = req.body.action || req.body.jobType || 'LIS_RESULT_IMPORT';
      const orderId = req.body.orderId || req.body.labOrderId;
      const payload = req.body.payload || req.body;
      const job = await LaboratoryRpaService.triggerLabRpaJob({
        action,
        orderId,
        payload,
        user: req.user
      });
      res.status(201).json({
        success: true,
        message: `Laboratory RPA job ${job.jobId} created.`,
        data: job
      });
    } catch (err) {
      next(err);
    }
  }

  static async executeRpaJob(req, res, next) {
    try {
      const { simulateFailure, simulateMismatch } = req.body;
      const result = await LaboratoryRpaService.executeLabRpaJob({
        jobId: req.params.id,
        simulateFailure,
        simulateMismatch,
        user: req.user
      });
      res.json({
        success: true,
        message: 'RPA job executed.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async listRpaJobs(req, res, next) {
    try {
      const { status, page, limit } = req.query;
      const result = await LaboratoryRpaService.listLabRpaJobs({ status, page, limit });
      res.json({
        success: true,
        data: result.jobs,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async syncOrderToExternalLis(req, res, next) {
    try {
      const { orderIdentifier, simulateFailure, simulateMismatch } = req.body;
      const result = await LisIntegrationService.syncOrderToExternalLis({
        orderIdentifier: orderIdentifier || req.body.orderId || req.body.labOrderId,
        simulateFailure,
        simulateMismatch,
        user: req.user
      });
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async fetchResultsFromExternalLis(req, res, next) {
    try {
      const { orderIdentifier, simulateMismatch } = req.body;
      const result = await LisIntegrationService.fetchResultsFromExternalLis({
        orderIdentifier: orderIdentifier || req.body.orderId,
        simulateMismatch,
        user: req.user
      });
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async reconcileOrder(req, res, next) {
    try {
      const { orderIdentifier, externalConfirmed } = req.body;
      const result = await LisIntegrationService.reconcileUnknownOrder({
        orderIdentifier: orderIdentifier || req.body.orderId,
        externalConfirmed,
        user: req.user
      });
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async consumeInventory(req, res, next) {
    try {
      const { orderItemId, inventoryItemId, quantity, batchId, reason } = req.body;
      const result = await LaboratoryInventoryService.consumeConsumable({
        orderItemId,
        inventoryItemId,
        quantity,
        batchId,
        reason,
        user: req.user
      });
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LabAnalyticsController;
