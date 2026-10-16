const mongoose = require('mongoose');
const HousekeepingInspection = require('../../models/HousekeepingInspection');
const HousekeepingTask = require('../../models/HousekeepingTask');
const HousekeepingArea = require('../../models/HousekeepingArea');
const HousekeepingException = require('../../models/HousekeepingException');
const BedManagementService = require('../BedManagementService');
const NotificationService = require('../NotificationService');
const AuditService = require('../AuditService');
const IdGeneratorService = require('../IdGeneratorService');

class InspectionService {
  static async performInspection(data, actorUser) {
    const {
      taskId,
      rating = 5,
      checklistResults = [],
      deficiencies = [],
      reworkInstructions = '',
      photos = [],
      notes = ''
    } = data;

    const isObjectId = mongoose.Types.ObjectId.isValid(taskId);
    const task = await HousekeepingTask.findOne(
      isObjectId ? { $or: [{ _id: taskId }, { taskId }] } : { taskId }
    );
    if (!task) throw new Error(`Housekeeping task ${taskId} not found.`);

    // Determine pass/fail: rating >= 3 and no explicit failed checklist items and no severe deficiencies
    const safeDeficiencies = Array.isArray(deficiencies) ? deficiencies : [];
    const safeChecklistResults = Array.isArray(checklistResults) ? checklistResults : [];
    const hasFailedItems = safeChecklistResults.some((r) => r.passed === false);
    const isPassed = Number(rating) >= 3 && !hasFailedItems && safeDeficiencies.length === 0;

    const inspectionId = await IdGeneratorService.generateHousekeepingInspectionId();
    const inspection = new HousekeepingInspection({
      inspectionId,
      taskId: task._id,
      taskNumber: task.taskNumber || task.taskId,
      areaId: task.areaId || null,
      areaName: task.areaName || '',
      bedNumber: task.bedNumber || '',
      roomNumber: task.roomNumber || '',
      inspectorUserId: actorUser?.userId || actorUser?.id || 'SUPERVISOR',
      inspectorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim() || actorUser?.name || 'Supervisor',
      inspectionDate: new Date(),
      status: isPassed ? 'PASSED' : 'FAILED',
      rating: Number(rating) || 5,
      checklistResults: safeChecklistResults,
      deficiencies: safeDeficiencies,
      reworkInstructions: reworkInstructions || '',
      photos: Array.isArray(photos) ? photos : [],
      notes: notes || ''
    });
    await inspection.save();

    task.inspectionId = inspection._id;

    if (isPassed) {
      task.inspectionStatus = 'PASSED';
      task.status = 'VERIFIED';
      task.completedAt = task.completedAt || new Date();
      await task.save();

      // Release Area to AVAILABLE
      if (task.areaId) {
        await HousekeepingArea.findByIdAndUpdate(task.areaId, { status: 'AVAILABLE' });
      }

      // If associated with a physical bed, complete via BedManagementService
      if (task.bedId) {
        try {
          await BedManagementService.completeHousekeepingCleaning({
            taskId: task.taskId,
            bedId: task.bedId,
            actorUser
          });
        } catch (bedErr) {
          console.warn(`[Housekeeping] BedManagementService completeHousekeepingCleaning hook: ${bedErr.message}`);
        }
      }

      // Notifications
      try {
        await NotificationService.sendNotification({
          event: 'HOUSEKEEPING_INSPECTION_PASSED',
          recipientUserId: task.assignedToUserId,
          title: 'Cleaning Inspection Passed',
          message: `Task ${task.taskNumber || task.taskId} passed inspection with rating ${rating}/5.`
        });
      } catch (notifErr) {
        console.warn(`[Housekeeping] Notification error: ${notifErr.message}`);
      }
    } else {
      task.inspectionStatus = 'FAILED';
      task.status = 'REOPENED';
      task.reopenCount = (task.reopenCount || 0) + 1;
      task.reopenReason = reworkInstructions || `Failed inspection with rating ${rating}/5`;
      await task.save();

      // Create Housekeeping Exception for failed inspection
      const exceptionId = await IdGeneratorService.generateHousekeepingExceptionId();
      const exception = new HousekeepingException({
        exceptionId,
        type: 'INSPECTION_FAILED',
        severity: task.priority === 'CRITICAL' || task.priority === 'URGENT' ? 'HIGH' : 'MEDIUM',
        taskId: task._id,
        taskNumber: task.taskNumber || task.taskId,
        areaId: task.areaId || null,
        source: 'INSPECTION_SERVICE',
        description: `Task ${task.taskNumber || task.taskId} failed supervisor inspection: ${reworkInstructions || 'Deficiencies found'}`,
        status: 'OPEN',
        assignedToUserId: task.assignedToUserId
      });
      await exception.save();

      // Notifications
      try {
        await NotificationService.sendNotification({
          event: 'HOUSEKEEPING_INSPECTION_FAILED',
          recipientUserId: task.assignedToUserId,
          title: 'Cleaning Inspection Failed — Rework Required',
          message: `Task ${task.taskNumber || task.taskId} requires rework. Reason: ${reworkInstructions}`
        });
      } catch (notifErr) {
        console.warn(`[Housekeeping] Notification error: ${notifErr.message}`);
      }
    }

    await AuditService.logEvent({
      action: isPassed ? 'HOUSEKEEPING_INSPECTION_PASSED' : 'HOUSEKEEPING_INSPECTION_FAILED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: {
        inspectionId,
        taskId: task.taskId,
        rating,
        status: inspection.status,
        deficienciesCount: deficiencies.length
      }
    });

    return {
      success: true,
      inspection,
      taskStatus: task.status,
      inspectionStatus: task.inspectionStatus
    };
  }

  static async listInspections(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.taskId) filter.taskId = query.taskId;

    return await HousekeepingInspection.find(filter).sort({ createdAt: -1 }).lean();
  }

  static async getInspectionById(id) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const inspection = await HousekeepingInspection.findOne(
      isObjectId ? { $or: [{ _id: id }, { inspectionId: id }] } : { inspectionId: id }
    ).lean();

    if (!inspection) throw new Error(`Housekeeping inspection ${id} not found.`);
    return inspection;
  }
}
