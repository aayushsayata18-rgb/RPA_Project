const RPAJob = require('../models/RPAJob');
const RPAExecution = require('../models/RPAExecution');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');
const { v4: uuidv4 } = require('uuid');

class RPAJobService {
  /**
   * Create an RPA job with idempotency check (00_MASTER.md Section 38)
   */
  static async createJob({
    jobName,
    module,
    targetSystem,
    action,
    entityType,
    entityId,
    payload = {},
    idempotencyKey = null,
    createdBy = 'SYSTEM'
  }) {
    try {
      // Check idempotency if key provided
      if (idempotencyKey) {
        const existingJob = await RPAJob.findOne({ idempotencyKey });
        if (existingJob) {
          console.log(`[RPAJobService] Idempotency match for key ${idempotencyKey}: Job ID ${existingJob.jobId}`);
          return existingJob;
        }
      }

      const jobId = `RPA-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

      const job = new RPAJob({
        jobId,
        jobName,
        module,
        targetSystem,
        action,
        entityType,
        entityId: String(entityId),
        payload,
        idempotencyKey,
        status: 'CREATED',
        createdBy
      });

      await job.save();

      await AuditService.logEvent({
        userId: createdBy,
        action: 'RPA_JOB_CREATED',
        module,
        entityType: 'RPAJob',
        entityId: jobId,
        rpaJobId: jobId,
        newValue: { jobName, targetSystem, action, status: 'CREATED' },
        details: `RPA Job created for ${targetSystem}`
      });

      return job;
    } catch (error) {
      console.error('[RPAJobService Error]:', error.message);
      throw error;
    }
  }

  /**
   * Update RPA Job execution status from worker/robot
   */
  static async updateJobStatus({
    jobId,
    status,
    result = null,
    error = null,
    evidencePaths = [],
    logs = []
  }) {
    const job = await RPAJob.findOne({ jobId });
    if (!job) {
      throw new Error(`RPA Job ${jobId} not found.`);
    }

    const previousStatus = job.status;
    job.status = status;
    if (result) job.result = result;
    if (error) job.error = error;
    if (evidencePaths.length > 0) {
      job.evidencePaths = [...job.evidencePaths, ...evidencePaths];
    }

    if (status === 'RUNNING' && !job.startedAt) {
      job.startedAt = new Date();
    } else if (['SUCCESS', 'FAILED', 'EXCEPTION', 'CANCELLED'].includes(status)) {
      job.completedAt = new Date();
    }

    await job.save();

    // Record execution attempt trace
    const executionId = `EXEC-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    const execution = new RPAExecution({
      executionId,
      jobId,
      attemptNumber: job.retryCount + 1,
      status: status === 'SUCCESS' ? 'SUCCESS' : status === 'FAILED' ? 'FAILED' : 'RUNNING',
      logs: logs.map((l) => ({ level: l.level || 'INFO', message: l.message || l })),
      errorMessage: error,
      screenshots: evidencePaths,
      finishedAt: ['SUCCESS', 'FAILED', 'EXCEPTION'].includes(status) ? new Date() : null
    });
    await execution.save();

    // If job failed, automatically create exception case if max retries exceeded
    if (status === 'FAILED' && job.retryCount >= job.maxRetries) {
      await ExceptionService.raiseException({
        module: job.module,
        entityType: 'RPAJob',
        entityId: jobId,
        rpaJobId: jobId,
        exceptionType: 'RPA_PERMANENT_FAILURE',
        description: `RPA Job ${jobName} permanently failed after ${job.maxRetries} attempts: ${error}`,
        severity: 'HIGH',
        source: 'RPA',
        metadata: { jobId, error, result }
      });
    }

    await AuditService.logEvent({
      action: `RPA_JOB_${status}`,
      module: job.module,
      entityType: 'RPAJob',
      entityId: jobId,
      rpaJobId: jobId,
      oldValue: { status: previousStatus },
      newValue: { status, result, error },
      details: `RPA Job ${jobId} transitioned to ${status}`
    });

    return job;
  }
}

module.exports = RPAJobService;
