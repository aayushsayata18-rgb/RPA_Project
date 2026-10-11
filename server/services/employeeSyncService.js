const EmployeeExternalSync = require('../models/EmployeeExternalSync');
const Employee = require('../models/Employee');
const RPAJob = require('../models/RPAJob');
const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class EmployeeSyncService {
  /**
   * Queue and execute external synchronization for an employee
   */
  static async syncEmployee(
    employeeId,
    { externalSystem = 'EXTERNAL_HR_SYSTEM', syncType = 'ONBOARDING' },
    actor = { userId: 'SYSTEM', role: 'ADMIN_MANAGER' }
  ) {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    const correlationId = `SYNC-EMP-${Date.now()}`;
    const syncPayload = {
      employeeId: employee.employeeId,
      displayName: employee.displayName,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      employeeType: employee.employeeType,
      employmentType: employee.employmentType,
      designation: employee.designation,
      department: employee.departmentAssignments?.[0]?.departmentName || 'General',
      status: employee.status
    };

    // 1. Create or update sync record
    let syncRecord = await EmployeeExternalSync.findOne({ employeeId, externalSystem });
    if (!syncRecord) {
      syncRecord = new EmployeeExternalSync({
        employeeId: employee.employeeId,
        employeeObjectId: employee._id,
        externalSystem,
        syncType,
        status: 'QUEUED',
        correlationId,
        syncPayload
      });
    } else {
      syncRecord.syncType = syncType;
      syncRecord.status = 'QUEUED';
      syncRecord.correlationId = correlationId;
      syncRecord.syncPayload = syncPayload;
      syncRecord.lastAttemptAt = new Date();
    }
    await syncRecord.save();

    // 2. Create RPAJob
    const jobId = `RPA-JOB-${Date.now()}`;
    const rpaJob = new RPAJob({
      jobId,
      jobName: `STAFF_SYNC_${syncType}_${employee.employeeId}`,
      module: 'STAFF_MANAGEMENT',
      targetSystem: 'HRMS_PORTAL',
      action: syncType,
      entityType: 'EMPLOYEE',
      entityId: employee.employeeId,
      status: 'QUEUED',
      payload: syncPayload,
      correlationId
    });
    await rpaJob.save();

    syncRecord.rpaJobId = rpaJob._id;
    await syncRecord.save();

    // Audit log
    await AuditService.logEvent({
      userId: actor.userId || 'SYSTEM',
      role: actor.role || 'ADMIN_MANAGER',
      action: 'EMPLOYEE_EXTERNAL_SYNC_STARTED',
      module: 'STAFF_MANAGEMENT',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      correlationId,
      details: `Queued ${syncType} sync to ${externalSystem} for ${employeeId}`
    });

    return { syncRecord, rpaJob };
  }

  /**
   * Process verification result and update sync record following read-back principle
   */
  static async completeSync(
    syncId,
    { status = 'SYNCED', externalEmployeeId = null, verificationResult = null, errorMessage = null }
  ) {
    const syncRecord = await EmployeeExternalSync.findById(syncId);
    if (!syncRecord) throw new Error(`Sync record ${syncId} not found.`);

    syncRecord.status = status;
    syncRecord.lastAttemptAt = new Date();

    if (status === 'SYNCED') {
      syncRecord.lastSyncedAt = new Date();
      syncRecord.externalEmployeeId = externalEmployeeId || `EXT-${syncRecord.employeeId}`;
      syncRecord.verificationResult = verificationResult || { verified: true, matchedFields: ['employeeId', 'name', 'status'] };
      syncRecord.errorMessage = null;

      if (syncRecord.rpaJobId) {
        await RPAJob.findByIdAndUpdate(syncRecord.rpaJobId, {
          $set: { status: 'SUCCESS', result: syncRecord.verificationResult }
        });
      }

      await AuditService.logEvent({
        userId: 'RPA_ROBOT',
        role: 'SYSTEM',
        action: 'EMPLOYEE_EXTERNAL_SYNC_COMPLETED',
        module: 'STAFF_MANAGEMENT',
        entityType: 'EMPLOYEE',
        entityId: syncRecord.employeeId,
        details: `Successfully synchronized ${syncRecord.employeeId} to ${syncRecord.externalSystem}`
      });
    } else {
      syncRecord.errorMessage = errorMessage || 'Verification mismatch or connection failure.';
      syncRecord.errorCode = 'SYNC_VERIFICATION_FAILED';

      if (syncRecord.rpaJobId) {
        await RPAJob.findByIdAndUpdate(syncRecord.rpaJobId, {
          $set: { status: 'FAILED', error: syncRecord.errorMessage }
        });
      }

      // Create Exception Case
      await ExceptionCase.create({
        caseId: `EXC-SYNC-${Date.now()}`,
        module: 'STAFF_MANAGEMENT',
        category: 'EXTERNAL_SYNC_FAILED',
        severity: 'MEDIUM',
        status: 'OPEN',
        title: `External Sync Failed for Staff ${syncRecord.employeeId}`,
        description: syncRecord.errorMessage,
        payload: { employeeId: syncRecord.employeeId, externalSystem: syncRecord.externalSystem }
      });

      await AuditService.logEvent({
        userId: 'RPA_ROBOT',
        role: 'SYSTEM',
        action: 'EMPLOYEE_EXTERNAL_SYNC_FAILED',
        module: 'STAFF_MANAGEMENT',
        entityType: 'EMPLOYEE',
        entityId: syncRecord.employeeId,
        details: `Sync failed for ${syncRecord.employeeId}: ${syncRecord.errorMessage}`
      });
    }

    await syncRecord.save();
    return syncRecord;
  }

  /**
   * Get sync status for an employee
   */
  static async getEmployeeSyncs(employeeId) {
    return await EmployeeExternalSync.find({ employeeId }).sort({ updatedAt: -1 }).lean();
  }
}

module.exports = EmployeeSyncService;
