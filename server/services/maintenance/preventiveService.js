const PreventiveMaintenancePlan = require('../../models/PreventiveMaintenancePlan');
const Asset = require('../../models/Asset');
const MaintenanceWorkOrder = require('../../models/MaintenanceWorkOrder');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class PreventiveService {
  /**
   * Helper to calculate next due date based on frequency
   */
  static calculateNextDate(baseDate, frequencyType, intervalValue = 1) {
    const next = new Date(baseDate || Date.now());
    switch (frequencyType) {
      case 'DAILY':
        next.setDate(next.getDate() + intervalValue);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7 * intervalValue);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + intervalValue);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3 * intervalValue);
        break;
      case 'HALF_YEARLY':
        next.setMonth(next.getMonth() + 6 * intervalValue);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + intervalValue);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  /**
   * Create Preventive Plan
   */
  static async createPlan(data, userId) {
    if (!data.assetId) {
      const err = new Error('Asset ID is required for a preventive plan');
      err.statusCode = 400;
      throw err;
    }

    const asset = await Asset.findById(data.assetId);
    if (!asset) {
      const err = new Error('Asset not found');
      err.statusCode = 404;
      throw err;
    }

    if (!data.planId) {
      data.planId = await IdGeneratorService.generatePreventivePlanId();
    }

    if (!data.nextDueDate) {
      data.nextDueDate = this.calculateNextDate(Date.now(), data.frequencyType, data.intervalValue);
    }

    data.createdBy = userId;
    data.updatedBy = userId;

    const plan = new PreventiveMaintenancePlan(data);
    await plan.save();

    // Link plan to asset
    asset.preventiveMaintenancePlanId = plan._id;
    await asset.save();

    await AuditService.logEvent({
      action: 'PREVENTIVE_PLAN_CREATED',
      module: 'MAINTENANCE',
      entityId: plan.planId,
      performedBy: userId,
      details: { planId: plan.planId, assetId: asset.assetId, frequency: plan.frequencyType }
    });

    return plan;
  }

  /**
   * Get all plans
   */
  static async getPlans(query = {}) {
    const { page = 1, limit = 20, assetId, active } = query;
    const filter = {};
    if (assetId) filter.assetId = assetId;
    if (active !== undefined) filter.active = active === 'true' || active === true;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      PreventiveMaintenancePlan.find(filter)
        .populate('assetId', 'name assetId assetTag status criticality')
        .populate('checklistId', 'name checklistId')
        .populate('assignedTechnicianId', 'firstName lastName')
        .populate('vendorId', 'name')
        .sort({ nextDueDate: 1 })
        .skip(skip)
        .limit(take)
        .lean(),
      PreventiveMaintenancePlan.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1
    };
  }

  /**
   * Get single plan by ID
   */
  static async getPlanById(id) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { planId: id };

    const plan = await PreventiveMaintenancePlan.findOne(query)
      .populate('assetId')
      .populate('checklistId')
      .populate('assignedTechnicianId', 'firstName lastName')
      .populate('vendorId', 'name')
      .lean();

    if (!plan) {
      const err = new Error('Preventive maintenance plan not found');
      err.statusCode = 404;
      throw err;
    }

    return plan;
  }

  /**
   * Update plan
   */
  static async updatePlan(id, updateData, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { planId: id };

    updateData.updatedBy = userId;
    const plan = await PreventiveMaintenancePlan.findOneAndUpdate(query, updateData, { new: true });
    if (!plan) {
      const err = new Error('Plan not found');
      err.statusCode = 404;
      throw err;
    }

    return plan;
  }

  /**
   * Generate Work Order from Plan
   */
  static async generateWorkOrderFromPlan(id, userId) {
    const plan = await this.getPlanById(id);

    const workOrderId = await IdGeneratorService.generateMaintenanceWorkOrderId(true);
    const now = new Date();

    const workOrder = new MaintenanceWorkOrder({
      workOrderId,
      assetId: plan.assetId._id,
      departmentId: plan.assetId.departmentId,
      locationId: plan.assetId.locationId,
      maintenanceType: 'PREVENTIVE',
      priority: plan.assetId.criticality === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
      title: `PM: ${plan.title} - ${plan.assetId.name}`,
      description: plan.instructions || `Scheduled preventive maintenance for ${plan.assetId.name} (${plan.assetId.assetTag})`,
      assignedTechnicianId: plan.assignedTechnicianId?._id,
      assignedVendorId: plan.vendorId?._id,
      assignedBy: userId,
      assignedAt: now,
      checklistId: plan.checklistId?._id,
      scheduledStart: plan.nextDueDate || now,
      scheduledEnd: new Date((plan.nextDueDate || now).getTime() + 7200000), // +2h
      status: plan.assignedTechnicianId || plan.vendorId ? 'SCHEDULED' : 'OPEN',
      preventivePlanId: plan._id,
      createdBy: userId,
      updatedBy: userId
    });

    await workOrder.save();

    // Update lastCompleted / nextDueDate
    const nextDate = this.calculateNextDate(plan.nextDueDate, plan.frequencyType, plan.intervalValue);
    await PreventiveMaintenancePlan.findByIdAndUpdate(plan._id, {
      lastCompletedDate: now,
      nextDueDate: nextDate,
      updatedBy: userId
    });

    await AuditService.logEvent({
      action: 'PM_WORK_ORDER_GENERATED',
      module: 'MAINTENANCE',
      entityId: workOrder.workOrderId,
      performedBy: userId,
      details: {
        planId: plan.planId,
        workOrderId: workOrder.workOrderId,
        assetId: plan.assetId.assetId,
        nextDueDate: nextDate
      }
    });

    return workOrder;
  }

  /**
   * Generate Work Orders for all due PM plans
   */
  static async generateDueWorkOrders(userId) {
    const plans = await PreventiveMaintenancePlan.find({
      active: true
    }).populate('assetId');

    const generated = [];
    for (const plan of plans) {
      const existing = await MaintenanceWorkOrder.findOne({
        preventivePlanId: plan._id,
        status: { $in: ['OPEN', 'ASSIGNED', 'SCHEDULED', 'IN_PROGRESS'] }
      });
      if (!existing) {
        const wo = await this.generateWorkOrderFromPlan(plan._id.toString(), userId);
        generated.push(wo);
      }
    }
    return { count: generated.length, workOrders: generated };
  }
}

module.exports = PreventiveService;
