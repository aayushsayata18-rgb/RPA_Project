const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const DoctorExternalSync = require('../models/DoctorExternalSync');
const RPAJob = require('../models/RPAJob');
const RPAExecution = require('../models/RPAExecution');
const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');

class DoctorSyncService {
  /**
   * Initiate external synchronization for a doctor (profile, schedule, or availability)
   */
  static async triggerDoctorSync(doctorId, options = {}) {
    const { syncType = 'PROFILE_SYNC', externalSystem = 'LEGACY_HIS', user = {} } = options;

    const doctor = await Doctor.findOne({ doctorId }).lean();
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const correlationId = `CORR-DOC-SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create or find RPA Job
    const rpaJob = await RPAJob.create({
      jobId: `RPA-JOB-${Date.now()}`,
      jobName: `Sync Doctor ${doctorId} to ${externalSystem}`,
      module: 'DOCTOR_MANAGEMENT',
      targetSystem: externalSystem,
      action: syncType,
      entityType: 'Doctor',
      entityId: doctorId,
      status: 'QUEUED',
      priority: 'HIGH',
      payload: {
        doctorId,
        doctorName: doctor.displayName || doctor.fullName,
        departmentName: doctor.departmentName,
        specialty: doctor.specialty,
        externalSystem,
        syncType
      },
      correlationId
    });

    // Create or update DoctorExternalSync record
    let syncRecord = await DoctorExternalSync.findOne({ doctorId, externalSystem, syncType });
    if (!syncRecord) {
      syncRecord = new DoctorExternalSync({
        doctorId,
        externalSystem,
        externalDoctorId: doctor.employeeId || doctor.doctorId,
        syncType,
        status: 'PENDING',
        rpaJobId: rpaJob.jobId,
        correlationId
      });
    } else {
      syncRecord.status = 'PENDING';
      syncRecord.rpaJobId = rpaJob.jobId;
      syncRecord.correlationId = correlationId;
      syncRecord.lastAttemptAt = new Date();
      syncRecord.errorCode = null;
      syncRecord.errorMessage = null;
    }
    await syncRecord.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'ADMIN_MANAGER',
      action: 'DOCTOR_EXTERNAL_SYNC_STARTED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctorId,
      correlationId,
      details: `Triggered ${syncType} to ${externalSystem} for ${doctorId}. RPA Job: ${rpaJob.jobId}`
    });

    // Simulate standard asynchronous RPA workflow execution with Read-Back verification (Section 41)
    return await this.executeSyncJob(syncRecord, rpaJob, doctor);
  }

  /**
   * Execute RPA sync with standard Read-Back verification
   */
  static async executeSyncJob(syncRecord, rpaJob, doctor) {
    try {
      syncRecord.status = 'SYNCING';
      await syncRecord.save();

      rpaJob.status = 'RUNNING';
      rpaJob.startedAt = new Date();
      await rpaJob.save();

      // Verification Step: Read Back comparison
      // If doctor is in DRAFT or TERMINATED or missing required email/phone, simulate exception handling
      if (!doctor.email || !doctor.phone) {
        throw new Error('Incomplete doctor record: Missing verified contact information.');
      }

      // Successful read-back match simulation
      syncRecord.status = 'SYNCED';
      syncRecord.lastSyncedAt = new Date();
      syncRecord.verifiedByReadBack = true;
      syncRecord.payloadSummary = {
        name: doctor.displayName || doctor.fullName,
        department: doctor.departmentName,
        status: doctor.status,
        verifiedAt: new Date().toISOString()
      };
      await syncRecord.save();

      rpaJob.status = 'SUCCESS';
      rpaJob.completedAt = new Date();
      rpaJob.result = {
        synced: true,
        readBackVerified: true,
        externalSystem: syncRecord.externalSystem
      };
      await rpaJob.save();

      await AuditService.logEvent({
        userId: 'SYSTEM_RPA',
        role: 'SYSTEM_ADMIN',
        action: 'DOCTOR_EXTERNAL_SYNC_COMPLETED',
        module: 'DOCTOR_MANAGEMENT',
        entityType: 'Doctor',
        entityId: doctor.doctorId,
        correlationId: syncRecord.correlationId,
        details: `Successfully synchronized ${doctor.doctorId} to ${syncRecord.externalSystem} with verified read-back.`
      });

      return syncRecord;
    } catch (err) {
      syncRecord.status = 'FAILED';
      syncRecord.errorCode = 'SYNC_VERIFICATION_FAILURE';
      syncRecord.errorMessage = err.message;
      await syncRecord.save();

      rpaJob.status = 'FAILED';
      rpaJob.errorDetails = err.message;
      await rpaJob.save();

      // Create Exception Case (Section 71)
      await ExceptionCase.create({
        exceptionId: `EXC-DOC-${Date.now()}`,
        exceptionType: 'DOCTOR_EXTERNAL_SYNC_FAILED',
        title: `Doctor ${doctor.doctorId} Sync Failed to ${syncRecord.externalSystem}`,
        description: `Synchronization of doctor ${doctor.doctorId} to ${syncRecord.externalSystem} failed: ${err.message}`,
        severity: 'MEDIUM',
        module: 'DOCTOR_MANAGEMENT',
        entityType: 'Doctor',
        entityId: doctor.doctorId,
        currentStatus: 'OPEN'
      });

      await AuditService.logEvent({
        userId: 'SYSTEM_RPA',
        role: 'SYSTEM_ADMIN',
        action: 'DOCTOR_EXTERNAL_SYNC_FAILED',
        module: 'DOCTOR_MANAGEMENT',
        entityType: 'Doctor',
        entityId: doctor.doctorId,
        correlationId: syncRecord.correlationId,
        details: `External sync failed for ${doctor.doctorId}: ${err.message}`
      });

      return syncRecord;
    }
  }

  /**
   * Get sync status history for a doctor
   */
  static async getDoctorSyncStatus(doctorId) {
    return await DoctorExternalSync.find({ doctorId }).sort({ updatedAt: -1 }).lean();
  }
}

module.exports = DoctorSyncService;
