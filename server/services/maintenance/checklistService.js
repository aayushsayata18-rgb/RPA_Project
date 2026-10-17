const MaintenanceChecklist = require('../../models/MaintenanceChecklist');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class ChecklistService {
  /**
   * Create Checklist
   */
  static async createChecklist(data, userId) {
    const payload = { ...data };
    if (!payload.checklistId) {
      payload.checklistId = payload.checklistCode || (await IdGeneratorService.generateMaintenanceChecklistId());
    }
    if (!payload.checklistCode) {
      payload.checklistCode = payload.checklistId;
    }
    if (!payload.name) {
      payload.name = payload.title || 'Standard Maintenance Checklist';
    }
    if (!payload.title) {
      payload.title = payload.name;
    }

    if (payload.steps && (!payload.items || payload.items.length === 0)) {
      payload.items = payload.steps.map((s, idx) => ({
        itemId: `CHK-ITEM-${s.stepNumber || idx + 1}`,
        description: s.instruction || s.description || `Step ${idx + 1}`,
        required: s.mandatory !== undefined ? s.mandatory : true,
        responseType: s.responseType || 'PASS_FAIL'
      }));
    } else if (payload.items && (!payload.steps || payload.steps.length === 0)) {
      payload.steps = payload.items.map((it, idx) => ({
        stepNumber: idx + 1,
        instruction: it.description,
        mandatory: it.required !== undefined ? it.required : true,
        responseType: it.responseType || 'PASS_FAIL'
      }));
    }

    payload.createdBy = userId;
    payload.updatedBy = userId;

    const checklist = new MaintenanceChecklist(payload);
    await checklist.save();

    await AuditService.logEvent({
      action: 'MAINTENANCE_CHECKLIST_CREATED',
      module: 'MAINTENANCE',
      entityId: checklist.checklistId,
      performedBy: userId,
      details: { checklistId: checklist.checklistId, name: checklist.name }
    });

    return checklist;
  }

  /**
   * Get all checklists
   */
  static async getChecklists(query = {}) {
    const { category, status = 'ACTIVE' } = query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    return await MaintenanceChecklist.find(filter).sort({ name: 1 }).lean();
  }

  /**
   * Get single checklist
   */
  static async getChecklistById(id) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { checklistId: id };

    const checklist = await MaintenanceChecklist.findOne(query).lean();
    if (!checklist) {
      const err = new Error('Checklist not found');
      err.statusCode = 404;
      throw err;
    }
    return checklist;
  }

  /**
   * Update checklist
   */
  static async updateChecklist(id, updateData, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { checklistId: id };

    updateData.updatedBy = userId;
    const checklist = await MaintenanceChecklist.findOneAndUpdate(query, updateData, { new: true });
    if (!checklist) {
      const err = new Error('Checklist not found');
      err.statusCode = 404;
      throw err;
    }
    return checklist;
  }
}

module.exports = ChecklistService;
