const Admission = require('../models/Admission');
const RPAJob = require('../models/RPAJob');
const RPAExecution = require('../models/RPAExecution');
const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');

class AdmissionSyncService {
  /**
   * Synchronize an admitted patient episode with external legacy hospital systems / RPA
   */
  static async syncAdmissionWithExternalSystem({ admissionId, actorUser, correlationId, forceFail = false }) {
    const admission = await Admission.findOne({ admissionId });
    if (!admission) {
      throw new Error(`Admission ${admissionId} not found.`);
    }

    const corrId = correlationId || admission.correlationId;

    // Create an RPA Job entry
    const rpaJob = await RPAJob.create({
      jobId: `JOB-SYNC-${admissionId}-${Date.now().toString().slice(-4)}`,
      jobName: 'ADMISSION_SYNC',
      module: 'ADMISSION',
      targetSystem: 'LEGACY_HIS_PORTAL',
      action: 'SYNC_INPATIENT_ADMISSION',
      entityType: 'ADMISSION',
      entityId: admission.admissionId,
      status: 'RUNNING',
      payload: {
        admissionId: admission.admissionId,
        patientId: admission.patientId,
        wardId: admission.assignedWardId,
        bedId: admission.assignedBedId,
        doctor: admission.admittingDoctorName,
        admissionDate: admission.admissionDate
      }
    });

    const executionStart = new Date();

    if (forceFail) {
      // Simulate external sync failure
      rpaJob.status = 'FAILED';
      rpaJob.errorMessage = 'Legacy HIS system connection timeout on admission entry API.';
      await rpaJob.save();

      admission.externalSyncStatus = 'FAILED';
      await admission.save();

      await RPAExecution.create({
        executionId: `EXEC-${rpaJob.jobId}-1`,
        jobId: rpaJob.jobId,
        attemptNumber: 1,
        status: 'FAILED',
        startedAt: executionStart,
        finishedAt: new Date(),
        errorMessage: rpaJob.errorMessage
      });

      // Raise Exception
      const exc = await ExceptionService.createException({
        exceptionType: 'ADMISSION_EXTERNAL_SYNC_FAILURE',
        severity: 'HIGH',
        category: 'RPA',
        referenceId: admission.admissionId,
        patientId: admission.patientId,
        description: `External HIS synchronization failed for Admission ${admission.admissionId}: ${rpaJob.errorMessage}`,
        correlationId: corrId,
        actorUser
      });

      return {
        success: false,
        syncStatus: 'FAILED',
        exceptionCaseId: exc?.exceptionId || null,
        error: rpaJob.errorMessage
      };
    }

    // Successful External Sync
    const extAdmissionNum = `EXT-ADM-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    rpaJob.status = 'SUCCESS';
    rpaJob.result = {
      externalAdmissionId: extAdmissionNum,
      syncedAt: new Date()
    };
    await rpaJob.save();

    await RPAExecution.create({
      executionId: `EXEC-${rpaJob.jobId}-1`,
      jobId: rpaJob.jobId,
      attemptNumber: 1,
      status: 'SUCCESS',
      startedAt: executionStart,
      finishedAt: new Date()
    });

    admission.externalSyncStatus = 'SYNCED';
    admission.externalAdmissionId = extAdmissionNum;
    await admission.save();

    await AuditService.logEvent({
      action: 'ADMISSION_EXTERNAL_SYNC_COMPLETED',
      category: 'RPA',
      patientId: admission.patientId,
      actorUserId: actorUser?.id || 'SYSTEM_RPA',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { admissionId: admission.admissionId, externalAdmissionId: extAdmissionNum },
      correlationId: corrId
    });

    return {
      success: true,
      syncStatus: 'SYNCED',
      externalAdmissionId: extAdmissionNum
    };
  }
}

module.exports = AdmissionSyncService;
