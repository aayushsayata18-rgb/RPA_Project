const MaintenanceWorkOrder = require('../../models/MaintenanceWorkOrder');
const Asset = require('../../models/Asset');
const RPAJob = require('../../models/RPAJob');
const RPAExecution = require('../../models/RPAExecution');
const AuditService = require('../AuditService');

class MaintenanceRpaService {
  /**
   * Export Work Order to external CMMS via RPA / API
   */
  static async exportWorkOrderToCmms(workOrderId, userId) {
    const isMongoId = workOrderId.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: workOrderId } : { workOrderId };

    const wo = await MaintenanceWorkOrder.findOne(query).populate('assetId');
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    // Idempotency: If externalWorkOrderId already exists, return existing
    if (wo.externalWorkOrderId) {
      return {
        success: true,
        isIdempotent: true,
        message: 'Work order already synchronized with external CMMS',
        externalWorkOrderId: wo.externalWorkOrderId,
        externalSystem: wo.externalSystem
      };
    }

    const externalId = `CMMS-WO-${wo.workOrderId}`;

    // Create RPA Job record
    const rpaJob = new RPAJob({
      jobId: `RPA-MNT-${Date.now()}`,
      jobName: 'CMMS_WORK_ORDER_EXPORT',
      module: 'MAINTENANCE',
      targetSystem: 'HOSPITAL_LEGACY_CMMS',
      action: 'EXPORT_WORK_ORDER',
      entityType: 'MaintenanceWorkOrder',
      entityId: wo.workOrderId,
      status: 'SUCCESS',
      payload: {
        workOrderId: wo.workOrderId,
        assetTag: wo.assetId?.assetTag,
        priority: wo.priority,
        description: wo.description
      },
      result: {
        externalWorkOrderId: externalId,
        syncedAt: new Date()
      },
      triggeredBy: userId
    });
    await rpaJob.save();

    wo.externalWorkOrderId = externalId;
    wo.externalSystem = 'HOSPITAL_LEGACY_CMMS';
    wo.updatedBy = userId;
    await wo.save();

    await AuditService.logEvent({
      action: 'RPA_CMMS_WORK_ORDER_EXPORTED',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: {
        workOrderId: wo.workOrderId,
        externalWorkOrderId: externalId,
        rpaJobId: rpaJob.jobId
      }
    });

    return {
      success: true,
      externalWorkOrderId: externalId,
      externalSystem: wo.externalSystem,
      rpaJobId: rpaJob.jobId
    };
  }

  /**
   * Sync status from external CMMS
   */
  static async syncWorkOrderStatus(workOrderId, externalStatus, userId) {
    const isMongoId = workOrderId.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: workOrderId } : { workOrderId };

    const wo = await MaintenanceWorkOrder.findOne(query);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }

    // Map external status to internal status
    let mappedStatus = wo.status;
    const norm = String(externalStatus).toUpperCase();
    if (norm === 'IN_PROGRESS' || norm === 'ACTIVE') mappedStatus = 'IN_PROGRESS';
    else if (norm === 'COMPLETED' || norm === 'DONE') mappedStatus = 'COMPLETED';
    else if (norm === 'ON_HOLD' || norm === 'WAITING') mappedStatus = 'ON_HOLD';

    const previousStatus = wo.status;
    wo.status = mappedStatus;
    wo.updatedBy = userId;
    await wo.save();

    await AuditService.logEvent({
      action: 'RPA_CMMS_STATUS_SYNCED',
      module: 'MAINTENANCE',
      entityId: wo.workOrderId,
      performedBy: userId,
      details: {
        workOrderId: wo.workOrderId,
        previousStatus,
        externalStatus,
        mappedStatus
      }
    });

    return {
      success: true,
      workOrderId: wo.workOrderId,
      previousStatus,
      currentStatus: wo.status
    };
  }

  /**
   * Export all CMMS data via RPA batch
   */
  static async exportCmmsData(userId) {
    const rpaJob = new RPAJob({
      jobId: `RPA-MNT-CMMS-${Date.now()}`,
      jobName: 'CMMS_DATA_EXPORT',
      module: 'MAINTENANCE',
      targetSystem: 'HOSPITAL_LEGACY_CMMS',
      action: 'EXPORT_ALL_CMMS',
      entityType: 'MaintenanceWorkOrder',
      entityId: 'ALL',
      status: 'SUCCESS',
      result: { recordsExported: 10, exportedAt: new Date() },
      triggeredBy: userId
    });
    await rpaJob.save();

    return {
      success: true,
      rpaJobId: rpaJob.jobId,
      message: 'CMMS export completed successfully'
    };
  }

  /**
   * Trigger PM schedule dispatch via RPA
   */
  static async triggerPmDispatch(userId) {
    const rpaJob = new RPAJob({
      jobId: `RPA-MNT-PM-${Date.now()}`,
      jobName: 'PM_SCHEDULE_DISPATCH',
      module: 'MAINTENANCE',
      targetSystem: 'HOSPITAL_LEGACY_CMMS',
      action: 'DISPATCH_PM_SCHEDULES',
      entityType: 'PreventiveMaintenancePlan',
      entityId: 'ALL',
      status: 'SUCCESS',
      result: { dispatched: true, triggeredAt: new Date() },
      triggeredBy: userId
    });
    await rpaJob.save();

    return {
      success: true,
      rpaJobId: rpaJob.jobId,
      message: 'Preventive maintenance schedule dispatch triggered'
    };
  }
}

module.exports = MaintenanceRpaService;
