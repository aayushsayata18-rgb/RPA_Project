const TaskService = require('./taskService');
const AuditService = require('../AuditService');

class MaintenanceIntegrationService {
  /**
   * Automatically generate post-maintenance cleaning task
   */
  static async handleMaintenanceCompletion(maintenanceData, actorUser) {
    const { ticketId, assetId, assetName, areaId, areaName, priority = 'ROUTINE' } = maintenanceData;

    const { task } = await TaskService.createTask(
      {
        taskType: 'POST_MAINTENANCE_CLEANING',
        priority,
        sourceModule: 'MAINTENANCE',
        sourceEntityId: String(ticketId || assetId || ''),
        areaId: areaId || null,
        areaName: areaName || '',
        description: `Post-maintenance cleaning after servicing asset ${assetName || assetId || ticketId}.`,
        inspectionRequired: true
      },
      actorUser
    );

    await AuditService.logEvent({
      action: 'HOUSEKEEPING_POST_MAINTENANCE_CLEANING_CREATED',
      category: 'HOUSEKEEPING',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { taskId: task.taskId, ticketId, assetId }
    });

    return task;
  }
}

module.exports = MaintenanceIntegrationService;
