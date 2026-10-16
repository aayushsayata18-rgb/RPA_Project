const RPAJobService = require('../RPAJobService');
const RPAJob = require('../../models/RPAJob');
const LisIntegrationService = require('./lisIntegrationService');
const LabOrder = require('../../models/LabOrder');

class LaboratoryRpaService {
  /**
   * Dispatch an RPA job for external lab integration
   */
  static async triggerLabRpaJob({
    action,
    orderId,
    payload = {},
    user = null
  }) {
    let order = null;
    if (orderId) {
      const oIdStr = String(orderId || '');
      order = await LabOrder.findOne({
        $or: [{ orderId: oIdStr }, { _id: oIdStr.match(/^[0-9a-fA-F]{24}$/) ? oIdStr : null }]
      });
    }
    if (!order) {
      order = await LabOrder.findOne().sort({ createdAt: -1 });
    }

    const orderIdStr = order ? order.orderId : 'ALL_ORDERS';
    const idempotencyKey = `LAB-RPA-${action}-${orderIdStr}-${Date.now()}`;

    const job = await RPAJobService.createJob({
      jobName: `Laboratory ${action} for ${orderIdStr}`,
      module: 'LABORATORY',
      targetSystem: 'EXTERNAL_LIS',
      action,
      entityType: 'LabOrder',
      entityId: orderIdStr,
      payload: {
        orderId: orderIdStr,
        patientCode: order ? order.patientCode : 'SYSTEM',
        priority: order ? order.priority : 'ROUTINE',
        ...payload
      },
      idempotencyKey,
      createdBy: user?.userId || 'SYSTEM'
    });

    return job;
  }

  /**
   * Run or simulate completion of an RPA job
   */
  static async executeLabRpaJob({ jobId, simulateFailure = false, simulateMismatch = false, user = null }) {
    const job = await RPAJob.findOne({ jobId });
    if (!job) {
      throw new Error(`RPA Job '${jobId}' not found.`);
    }

    await RPAJobService.updateJobStatus({
      jobId,
      status: 'RUNNING',
      logs: [`Started worker execution for action ${job.action}`]
    });

    try {
      let resultData = null;

      if (job.action === 'LAB_LIS_ORDER_ENTRY' || job.action === 'LAB_ORDER_EXTERNAL_SYNC') {
        resultData = await LisIntegrationService.syncOrderToExternalLis({
          orderIdentifier: job.entityId,
          simulateFailure,
          simulateMismatch,
          user
        });
      } else if (job.action === 'LAB_LIS_RESULT_RETRIEVAL' || job.action === 'LAB_REPORT_DOWNLOAD') {
        resultData = await LisIntegrationService.fetchResultsFromExternalLis({
          orderIdentifier: job.entityId,
          simulateMismatch,
          user
        });
      } else {
        resultData = {
          success: true,
          message: `RPA action ${job.action} completed successfully.`
        };
      }

      if (resultData && resultData.success === false) {
        const exceptionJob = await RPAJobService.updateJobStatus({
          jobId,
          status: 'EXCEPTION',
          error: resultData.error || 'Exception encountered during laboratory RPA operation',
          logs: ['Exception created and routed for human verification']
        });
        return { job: exceptionJob, result: resultData };
      }

      const updatedJob = await RPAJobService.updateJobStatus({
        jobId,
        status: 'SUCCESS',
        result: resultData,
        logs: [`Completed laboratory automation successfully`]
      });

      return { job: updatedJob, result: resultData };
    } catch (err) {
      await RPAJobService.updateJobStatus({
        jobId,
        status: 'FAILED',
        error: err.message,
        logs: [`Execution failed: ${err.message}`]
      });
      throw err;
    }
  }

  /**
   * List RPA jobs for laboratory
   */
  static async listLabRpaJobs({ status = '', page = 1, limit = 50 }) {
    const filter = { module: 'LABORATORY' };
    if (status) {
      filter.status = status;
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [jobs, total] = await Promise.all([
      RPAJob.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      RPAJob.countDocuments(filter)
    ]);

    return {
      jobs,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }
}

module.exports = LaboratoryRpaService;
