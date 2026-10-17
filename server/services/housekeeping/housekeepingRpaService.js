const RPAJob = require('../../models/RPAJob');
const Bed = require('../../models/Bed');
const HousekeepingTask = require('../../models/HousekeepingTask');
const BedIntegrationService = require('./bedIntegrationService');
const ExceptionService = require('./exceptionService');
const AuditService = require('../AuditService');

class HousekeepingRpaService {
  /**
   * RPA sync of turnover tasks from beds requiring cleaning
   */
  static async syncTurnovers(actorUser) {
    const bedsNeedingCleaning = await Bed.find({
      $or: [{ status: 'CLEANING_REQUIRED' }, { housekeepingStatus: 'CLEANING_REQUIRED' }]
    }).lean();

    const createdTasks = [];
    const skippedTasks = [];

    for (const bed of bedsNeedingCleaning) {
      const res = await BedIntegrationService.triggerBedTurnover(
        {
          bedId: bed.bedId || String(bed._id),
          bedNumber: bed.bedNumber,
          roomId: bed.roomId || '',
          roomNumber: bed.roomNumber || '',
          wardId: bed.wardId || '',
          wardName: bed.wardName || '',
          sourceModule: 'RPA'
        },
        actorUser
      );

      if (res.isDuplicate) {
        skippedTasks.push(res.task.taskId);
      } else {
        createdTasks.push(res.task.taskId);
      }
    }

    return {
      totalBedsScanned: bedsNeedingCleaning.length,
      createdCount: createdTasks.length,
      skippedCount: skippedTasks.length,
      createdTasks,
      skippedTasks
    };
  }

  /**
   * Trigger an RPA automation job for Housekeeping operations
   */
  static async triggerRpaJob(data, actorUser) {
    const { action = 'SYNC_TURNOVER_TASKS', entityType = 'TURNOVER_QUEUE', entityId = 'ALL', payload = {} } = data;
    const jobId = `RPA-HK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const rpaJob = new RPAJob({
      jobId,
      jobName: `Housekeeping RPA: ${action}`,
      module: 'HOUSEKEEPING',
      targetSystem: 'FACILITIES_PORTAL',
      action,
      entityType,
      entityId,
      status: 'QUEUED',
      payload
    });
    await rpaJob.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_RPA_JOB_TRIGGERED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { jobId, action, entityId }
    });

    return rpaJob;
  }

  /**
   * Reconcile external facility status with MERN Housekeeping
   */
  static async syncExternalTaskStatus(taskId, externalStatus, actorUser) {
    const task = await HousekeepingTask.findOne({
      $or: [{ taskId }, { taskNumber: taskId }]
    });
    if (!task) {
      throw new Error(`Housekeeping task ${taskId} not found.`);
    }

    const statusMap = {
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'CLEANING_COMPLETED',
      VERIFIED: 'VERIFIED',
      ON_HOLD: 'ON_HOLD'
    };

    const mappedStatus = statusMap[externalStatus];
    if (!mappedStatus) {
      // Flag exception for unknown external status
      const exception = await ExceptionService.createException(
        {
          type: 'UNKNOWN_EXTERNAL_STATE',
          severity: 'MEDIUM',
          taskId: task._id,
          taskNumber: task.taskId,
          description: `Unknown external status received: "${externalStatus}" for task ${task.taskId}. Needs manual review.`
        },
        actorUser
      );
      return { success: false, exceptionCreated: true, exception };
    }

    task.status = mappedStatus;
    if (mappedStatus === 'IN_PROGRESS' && !task.actualStart) task.actualStart = new Date();
    if (mappedStatus === 'CLEANING_COMPLETED' && !task.actualEnd) task.actualEnd = new Date();
    await task.save();

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_EXTERNAL_STATUS_SYNCED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId, externalStatus, mappedStatus }
    });

    return { success: true, task };
  }
}

module.exports = HousekeepingRpaService;
