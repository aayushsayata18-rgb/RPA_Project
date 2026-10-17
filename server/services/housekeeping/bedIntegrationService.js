const mongoose = require('mongoose');
const HousekeepingTask = require('../../models/HousekeepingTask');
const HousekeepingArea = require('../../models/HousekeepingArea');
const Bed = require('../../models/Bed');
const TaskService = require('./taskService');
const AuditService = require('../AuditService');

class BedIntegrationService {
  /**
   * Trigger Patient Discharge Room/Bed Turnover
   */
  static async triggerDischargeTurnover(data, actorUser) {
    const {
      bedId,
      bedNumber = '',
      admissionId = '',
      priority = 'STAT',
      notes = '',
      roomId = '',
      roomNumber = '',
      wardName = ''
    } = data;

    const searchBed = bedId || bedNumber;
    if (!searchBed) {
      throw new Error('Bed ID or Bed Number is required for discharge turnover.');
    }

    // Deduplication / Idempotency check:
    const existingTask = await HousekeepingTask.findOne({
      $or: [{ bedId: searchBed }, { bedId: String(searchBed) }, { sourceEntityId: String(searchBed) }],
      taskType: { $in: ['DISCHARGE_TURNOVER', 'PATIENT_ROOM_TURNOVER', 'BED_CLEANING'] },
      status: { $nin: ['COMPLETED', 'CANCELLED', 'CLOSED'] }
    });

    if (existingTask) {
      return { task: existingTask, isExisting: true };
    }

    // Ensure HousekeepingArea exists
    let area = await HousekeepingArea.findOne({
      $or: [{ bedId: String(searchBed) }, { name: `Bed ${bedNumber || searchBed}` }]
    });

    if (!area) {
      try {
        const AreaService = require('./areaService');
        area = await AreaService.createArea(
          {
            name: `Bed ${bedNumber || searchBed} (${wardName || 'Inpatient'})`,
            areaType: 'PATIENT_ROOM',
            bedId: String(searchBed),
            status: 'CLEANING_REQUIRED',
            cleaningFrequency: 'ON_DISCHARGE'
          },
          actorUser
        );
      } catch (e) {}
    } else {
      await HousekeepingArea.findByIdAndUpdate(area._id, { status: 'CLEANING_REQUIRED' });
    }

    // Create the task with DISCHARGE_TURNOVER taskType
    const { task } = await TaskService.createTask(
      {
        taskType: 'DISCHARGE_TURNOVER',
        priority: priority || 'STAT',
        sourceModule: 'BED_MANAGEMENT',
        sourceEntityId: String(searchBed),
        bedId: searchBed,
        bedNumber: bedNumber || String(searchBed),
        roomId: String(roomId),
        roomNumber,
        areaId: area ? area._id : null,
        areaName: area ? area.name : `Bed ${bedNumber}`,
        description: notes || `Patient discharge turnover for Bed ${bedNumber || searchBed}`,
        inspectionRequired: true
      },
      actorUser
    );

    // Update physical Bed status if present
    try {
      if (Bed) {
        await Bed.findOneAndUpdate(
          { $or: [{ _id: mongoose.Types.ObjectId.isValid(searchBed) ? searchBed : null }, { bedNumber: searchBed }, { bedId: searchBed }] },
          { $set: { status: 'CLEANING_REQUIRED', housekeepingStatus: 'CLEANING_REQUIRED' } }
        );
      }
    } catch (e) {}

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_DISCHARGE_TURNOVER_TRIGGERED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId, bedId: searchBed, admissionId }
    });

    return { task, isExisting: false };
  }

  static async triggerBedTurnover(data, actorUser) {
    return await BedIntegrationService.triggerDischargeTurnover(data, actorUser);
  }

  static async getTurnoverBoard() {
    const activeTurnovers = await HousekeepingTask.find({
      taskType: { $in: ['DISCHARGE_TURNOVER', 'PATIENT_ROOM_TURNOVER', 'BED_CLEANING'] },
      status: { $nin: ['CLOSED', 'CANCELLED'] }
    })
      .populate('areaId')
      .sort({ priority: -1, createdAt: 1 })
      .lean();

    return {
      totalActiveTurnovers: activeTurnovers.length,
      turnovers: activeTurnovers
    };
  }
}

module.exports = BedIntegrationService;
