const RadiologyModality = require('../../models/RadiologyModality');
const RadiologySchedule = require('../../models/RadiologySchedule');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class ModalityService {
  /**
   * List all modalities with filtering
   */
  static async listModalities(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.room) query.room = new RegExp(filters.room, 'i');
    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [{ name: regex }, { modalityId: regex }, { room: regex }, { manufacturer: regex }, { model: regex }];
    }

    const modalities = await RadiologyModality.find(query).sort({ type: 1, name: 1 }).lean();
    return modalities;
  }

  /**
   * Get single modality by ID
   */
  static async getModalityById(id) {
    let modality = null;
    if (String(id).match(/^[0-9a-fA-F]{24}$/)) {
      modality = await RadiologyModality.findById(id).lean();
    }
    if (!modality) {
      modality = await RadiologyModality.findOne({ modalityId: id }).lean();
    }
    if (!modality) {
      throw new Error(`Radiology Modality '${id}' not found.`);
    }
    return modality;
  }

  /**
   * Create modality
   */
  static async createModality(data, user = null) {
    if (!data.name || !data.type || !data.room) {
      throw new Error('Modality name, type, and room are required.');
    }

    const modalityId = data.modalityId || (await IdGeneratorService.generateRadiologyModalityId(data.type));

    const modality = new RadiologyModality({
      modalityId,
      name: data.name.trim(),
      type: data.type,
      departmentId: data.departmentId || null,
      location: data.location || 'Radiology Wing, Ground Floor',
      room: data.room.trim(),
      manufacturer: data.manufacturer || '',
      model: data.model || '',
      serialReference: data.serialReference || '',
      status: data.status || 'AVAILABLE',
      operatingHours: {
        start: data.operatingHours?.start || '08:00',
        end: data.operatingHours?.end || '20:00',
        slotDurationMinutes: Number(data.operatingHours?.slotDurationMinutes) || 30,
        bufferMinutes: Number(data.operatingHours?.bufferMinutes) || 10,
        workingDays: data.operatingHours?.workingDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
      },
      maintenanceSchedule: {
        nextMaintenanceDate: data.maintenanceSchedule?.nextMaintenanceDate ? new Date(data.maintenanceSchedule.nextMaintenanceDate) : null,
        lastMaintenanceDate: data.maintenanceSchedule?.lastMaintenanceDate ? new Date(data.maintenanceSchedule.lastMaintenanceDate) : null,
        maintenanceFrequencyDays: Number(data.maintenanceSchedule?.maintenanceFrequencyDays) || 90,
        notes: data.maintenanceSchedule?.notes || ''
      },
      externalSystemId: data.externalSystemId || ''
    });

    await modality.save();

    await AuditService.logAction({
      user,
      action: 'CREATE_RADIOLOGY_MODALITY',
      entity: 'RadiologyModality',
      entityId: modality._id,
      description: `Created Modality ${modality.modalityId} - ${modality.name}`
    });

    return modality;
  }

  /**
   * Update modality
   */
  static async updateModality(id, data, user = null) {
    const modality = await RadiologyModality.findOne({
      $or: [{ _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null }, { modalityId: id }]
    });

    if (!modality) {
      throw new Error(`Modality '${id}' not found.`);
    }

    const previousSnapshot = modality.toObject();

    if (data.name) modality.name = data.name.trim();
    if (data.type) modality.type = data.type;
    if (data.room) modality.room = data.room.trim();
    if (data.location) modality.location = data.location;
    if (data.manufacturer !== undefined) modality.manufacturer = data.manufacturer;
    if (data.model !== undefined) modality.model = data.model;
    if (data.serialReference !== undefined) modality.serialReference = data.serialReference;
    if (data.status) modality.status = data.status;
    if (data.externalSystemId !== undefined) modality.externalSystemId = data.externalSystemId;

    if (data.operatingHours) {
      modality.operatingHours = {
        ...modality.operatingHours.toObject(),
        ...data.operatingHours
      };
    }

    if (data.maintenanceSchedule) {
      modality.maintenanceSchedule = {
        ...modality.maintenanceSchedule.toObject(),
        ...data.maintenanceSchedule
      };
    }

    await modality.save();

    await AuditService.logAction({
      user,
      action: 'UPDATE_RADIOLOGY_MODALITY',
      entity: 'RadiologyModality',
      entityId: modality._id,
      previousState: previousSnapshot,
      newState: modality.toObject(),
      description: `Updated modality ${modality.modalityId}`
    });

    return modality;
  }

  /**
   * Update status with impact check on active bookings
   */
  static async updateModalityStatus(id, newStatus, user = null, reason = '') {
    const validStatuses = ['AVAILABLE', 'RESERVED', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status '${newStatus}'. Must be one of: ${validStatuses.join(', ')}`);
    }

    const modality = await RadiologyModality.findOne({
      $or: [{ _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null }, { modalityId: id }]
    });

    if (!modality) {
      throw new Error(`Modality '${id}' not found.`);
    }

    const oldStatus = modality.status;
    modality.status = newStatus;
    await modality.save();

    // Check affected future bookings if modality is taken offline
    let affectedSchedules = [];
    if (['MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'].includes(newStatus)) {
      affectedSchedules = await RadiologySchedule.find({
        modalityId: modality._id,
        scheduledStart: { $gte: new Date() },
        status: { $in: ['BOOKED', 'CONFIRMED'] }
      }).lean();
    }

    await AuditService.logAction({
      user,
      action: 'UPDATE_MODALITY_STATUS',
      entity: 'RadiologyModality',
      entityId: modality._id,
      previousState: { status: oldStatus },
      newState: { status: newStatus },
      description: `Modality ${modality.modalityId} status changed from ${oldStatus} to ${newStatus}. Reason: ${reason || 'N/A'}`
    });

    return {
      modality,
      affectedBookingsCount: affectedSchedules.length,
      affectedBookings: affectedSchedules
    };
  }
}

module.exports = ModalityService;
