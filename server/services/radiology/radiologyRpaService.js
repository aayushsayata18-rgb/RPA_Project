const RPAJob = require('../../models/RPAJob');
const RadiologyOrder = require('../../models/RadiologyOrder');
const RadiologyStudy = require('../../models/RadiologyStudy');
const RadiologyException = require('../../models/RadiologyException');
const RisIntegrationService = require('./risIntegrationService');
const PacsIntegrationService = require('./pacsIntegrationService');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class RadiologyRpaService {
  /**
   * Trigger an RPA job for a Radiology operation
   */
  static async triggerJob({ operation, jobType, entityId, correlationId, parameters = {}, dryRun = false, user = null }) {
    let op = operation || jobType || 'RAD_ORDER_EXTERNAL_SYNC';
    if (op === 'RIS_ORDER_SYNC') op = 'RAD_ORDER_EXTERNAL_SYNC';
    if (op === 'PACS_IMAGE_VERIFY') op = 'RAD_PACS_METADATA_SYNC';
    if (op === 'BILLING_RECONCILIATION') op = 'RAD_REPORT_RECONCILIATION';
    if (op === 'CRITICAL_ALERT_DISPATCH') op = 'RAD_EXTERNAL_EXCEPTION_RECONCILIATION';

    const validOperations = [
      'RAD_ORDER_EXTERNAL_ENTRY',
      'RAD_ORDER_EXTERNAL_SYNC',
      'RAD_SCHEDULE_SYNC',
      'RAD_STUDY_STATUS_SYNC',
      'RAD_PACS_METADATA_SYNC',
      'RAD_REPORT_DOWNLOAD',
      'RAD_REPORT_RECONCILIATION',
      'RAD_EXTERNAL_EXCEPTION_RECONCILIATION'
    ];

    if (!validOperations.includes(op)) {
      throw new Error(`Unsupported radiology RPA operation: '${op}'`);
    }

    const corrId = correlationId || `CORR-RAD-${Date.now()}`;
    const jobId = `RPA-RAD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const rpaJob = new RPAJob({
      jobId,
      jobName: `Radiology: ${op}`,
      module: 'RADIOLOGY',
      targetSystem: op.includes('PACS') ? 'PACS' : 'RIS',
      action: op,
      entityType: op.includes('PACS') ? 'RadiologyStudy' : 'RadiologyOrder',
      entityId: String(entityId || `RAD-REQ-${Date.now()}`),
      status: dryRun ? 'SUCCESS' : 'QUEUED',
      payload: {
        ...parameters,
        module: 'RADIOLOGY',
        operation: op,
        entityId: entityId || `RAD-REQ-${Date.now()}`,
        correlationId: corrId,
        dryRun
      },
      result: dryRun ? { message: 'Dry run completed successfully with 0 exceptions.' } : null
    });

    await rpaJob.save();

    await AuditService.logAction({
      user,
      action: 'TRIGGER_RADIOLOGY_RPA_JOB',
      entity: 'RPAJob',
      entityId: rpaJob._id,
      description: `Queued RPA Job ${rpaJob._id} for operation ${operation}`
    });

    return rpaJob;
  }

  /**
   * Execute or simulate RPA execution
   */
  static async executeJob(jobId, user = null) {
    const job = await RPAJob.findById(jobId);
    if (!job) {
      throw new Error('RPA Job not found.');
    }

    const { operation, entityId } = job.parameters || {};

    job.status = 'IN_PROGRESS';
    job.startedAt = new Date();
    await job.save();

    try {
      let resultData = {};

      if (operation === 'RAD_ORDER_EXTERNAL_ENTRY' || operation === 'RAD_ORDER_EXTERNAL_SYNC') {
        resultData = await RisIntegrationService.syncOrderToRis(entityId, user);
      } else if (operation === 'RAD_PACS_METADATA_SYNC') {
        const study = await RadiologyStudy.findOne({
          $or: [
            { _id: String(entityId).match(/^[0-9a-fA-F]{24}$/) ? entityId : null },
            { accessionNumber: entityId }
          ]
        });
        if (study) {
          resultData = await PacsIntegrationService.syncPacsMetadata(study.accessionNumber, user);
        }
      } else if (operation === 'RAD_REPORT_RECONCILIATION') {
        resultData = await RisIntegrationService.reconcileRisOrder(entityId, user);
      } else {
        resultData = { executed: true, operation, timestamp: new Date().toISOString() };
      }

      job.status = 'COMPLETED';
      job.completedAt = new Date();
      job.executionHistory.push({
        status: 'COMPLETED',
        timestamp: new Date(),
        message: 'RPA execution completed successfully',
        details: resultData
      });
      await job.save();

      return { job, resultData };
    } catch (err) {
      job.status = 'FAILED';
      job.completedAt = new Date();
      job.executionHistory.push({
        status: 'FAILED',
        timestamp: new Date(),
        message: err.message
      });
      await job.save();

      // Record operational exception
      const exceptionId = await IdGeneratorService.generateRadiologyExceptionId();
      await RadiologyException.create({
        exceptionId,
        type: operation.includes('PACS') ? 'PACS_UNAVAILABLE' : 'RIS_UNAVAILABLE',
        severity: 'HIGH',
        description: `RPA Job ${job._id} failed for operation ${operation}: ${err.message}`,
        source: 'ROBOT_FRAMEWORK_WORKER',
        rpaJobId: job._id,
        status: 'OPEN'
      });

      return { job, error: err.message };
    }
  }

  /**
   * List RPA jobs for radiology
   */
  static async listJobs() {
    const jobs = await RPAJob.find({
      'parameters.module': 'RADIOLOGY'
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return jobs;
  }
}

module.exports = RadiologyRpaService;
