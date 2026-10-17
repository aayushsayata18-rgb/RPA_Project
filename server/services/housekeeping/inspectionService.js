const mongoose = require('mongoose');
const HousekeepingInspection = require('../../models/HousekeepingInspection');
const HousekeepingTask = require('../../models/HousekeepingTask');
const HousekeepingArea = require('../../models/HousekeepingArea');
const TaskService = require('./taskService');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class InspectionService {
  static async performInspection(data, actorUser) {
    const {
      taskId,
      areaId,
      score = 100,
      passed,
      findings = '',
      rectificationRequired = false,
      rating = 5,
      checklistResults = [],
      deficiencies = [],
      reworkInstructions = '',
      notes = ''
    } = data;

    const isObjectId = mongoose.Types.ObjectId.isValid(taskId);
    const task = await HousekeepingTask.findOne(
      isObjectId ? { $or: [{ _id: taskId }, { taskId }] } : { taskId }
    );
    if (!task) throw new Error(`Housekeeping task ${taskId} not found.`);

    const isPassed = passed !== undefined ? Boolean(passed) : Number(score) >= 75 && Number(rating) >= 3;
    const inspectionId = await IdGeneratorService.generateHousekeepingInspectionId();

    const inspection = new HousekeepingInspection({
      inspectionId,
      taskId: task._id,
      taskNumber: task.taskNumber || task.taskId,
      areaId: areaId || task.areaId || null,
      areaName: task.areaName || '',
      inspectorUserId: actorUser?.userId || actorUser?.id || 'SUPERVISOR',
      inspectorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim() || actorUser?.name || 'Supervisor',
      inspectionDate: new Date(),
      status: isPassed ? 'PASSED' : 'FAILED',
      passed: isPassed,
      score: Number(score),
      rating: Number(rating),
      findings: findings || notes || '',
      rectificationRequired: Boolean(rectificationRequired),
      checklistResults: Array.isArray(checklistResults) ? checklistResults : [],
      deficiencies: Array.isArray(deficiencies) ? deficiencies : [],
      reworkInstructions: reworkInstructions || findings || '',
      notes: notes || findings || ''
    });

    task.inspectionId = inspection._id;

    if (isPassed && !rectificationRequired) {
      task.inspectionStatus = 'PASSED';
      await task.save();

      if (task.areaId) {
        await HousekeepingArea.findByIdAndUpdate(task.areaId, { status: 'AVAILABLE' });
      }
    } else {
      task.inspectionStatus = 'FAILED';
      task.reopenCount = (task.reopenCount || 0) + 1;
      task.reopenReason = reworkInstructions || findings || 'Failed quality inspection';
      await task.save();

      // Automatically create a REWORK task
      try {
        const reworkRes = await TaskService.createTask(
          {
            taskType: 'REWORK',
            priority: 'HIGH',
            areaId: task.areaId,
            areaCode: task.areaCode,
            areaName: task.areaName,
            bedId: task.bedId,
            bedNumber: task.bedNumber,
            description: `Rework task for ${task.taskNumber || task.taskId}: ${findings || 'Rectification required.'}`,
            notes: reworkInstructions || findings
          },
          actorUser
        );
        inspection.reworkTaskId = reworkRes.task._id;
      } catch (err) {
        console.warn(`[Housekeeping] Rework task auto-create: ${err.message}`);
      }
    }

    await inspection.save();

    await AuditService.logEvent({
      action: isPassed ? 'HOUSEKEEPING_INSPECTION_PASSED' : 'HOUSEKEEPING_INSPECTION_FAILED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: {
        inspectionId,
        taskId: task.taskId,
        passed: isPassed,
        score,
        findings
      }
    });

    return inspection;
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

module.exports = InspectionService;
