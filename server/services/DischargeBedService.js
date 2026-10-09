const BedManagementService = require('./BedManagementService');
const Bed = require('../models/Bed');
const BedAssignment = require('../models/BedAssignment');
const ExceptionService = require('./ExceptionService');
const AuditService = require('./AuditService');

class DischargeBedService {
  /**
   * Release physical bed on discharge completion and trigger housekeeping
   */
  static async releaseBedOnDischarge({
    admissionId,
    bedId = null,
    dischargeId,
    actorUser,
    correlationId
  }) {
    // 1. Locate current bed assignment if bedId not provided
    let targetBedId = bedId;
    if (!targetBedId) {
      const currentAssignment = await BedAssignment.findOne({
        admissionId,
        status: 'ACTIVE'
      }).lean();

      if (currentAssignment) {
        targetBedId = currentAssignment.bedId;
      }
    }

    if (!targetBedId) {
      // Check if bed was already vacated or no bed was assigned
      return {
        success: true,
        message: 'No active bed assignment found to release.',
        bedReleased: false
      };
    }

    try {
      const releaseResult = await BedManagementService.releaseBedOnDischarge({
        bedId: targetBedId,
        admissionId,
        releaseReason: `Patient Discharged (Discharge #${dischargeId})`,
        actorUser: actorUser || { userId: 'DISCHARGE_SERVICE', role: 'SYSTEM' },
        correlationId
      });

      // Verify bed is now in CLEANING_REQUIRED state
      const verifiedBed = await Bed.findOne({ bedId: targetBedId }).lean();

      await AuditService.logEvent({
        userId: actorUser?.userId || 'SYSTEM',
        action: 'BED_RELEASE_REQUESTED',
        module: 'DISCHARGE_BED',
        entityType: 'Bed',
        entityId: targetBedId,
        details: `Bed ${targetBedId} released on discharge of admission ${admissionId}. State: ${verifiedBed?.status}`,
        correlationId
      });

      return {
        success: true,
        bedReleased: true,
        bedId: targetBedId,
        bedStatus: verifiedBed?.status || 'CLEANING_REQUIRED',
        housekeepingTaskId: releaseResult?.housekeepingTask?.taskId || null,
        releaseResult
      };
    } catch (err) {
      await ExceptionService.createException({
        code: 'BED_RELEASE_FAILED',
        module: 'DISCHARGE_BED',
        severity: 'HIGH',
        message: `Failed to release bed ${targetBedId} for admission ${admissionId}: ${err.message}`,
        referenceType: 'Bed',
        referenceId: targetBedId,
        correlationId,
        reportedBy: actorUser?.userId || 'SYSTEM'
      });

      throw err;
    }
  }
}

module.exports = DischargeBedService;
