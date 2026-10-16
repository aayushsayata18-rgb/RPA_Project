const RadiologyStudy = require('../../models/RadiologyStudy');
const RadiologyOrder = require('../../models/RadiologyOrder');
const RadiologyModality = require('../../models/RadiologyModality');
const RadiologySchedule = require('../../models/RadiologySchedule');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const RadiologyBillingService = require('./billingService');
const RadiologyInventoryService = require('./inventoryService');

class StudyService {
  /**
   * Register study and generate atomic Accession Number
   */
  static async createStudy({ orderId, modalityId, room, user = null }) {
    if (!orderId) {
      throw new Error('orderId is required to register a radiology study.');
    }

    const order = await RadiologyOrder.findById(orderId).populate('examId');
    if (!order) {
      throw new Error('Order not found.');
    }

    // Check if study already exists for this order
    let existingStudy = await RadiologyStudy.findOne({ orderId: order._id });
    if (existingStudy) {
      return existingStudy;
    }

    let resolvedModalityId = modalityId;
    let roomName = room || '';

    if (!resolvedModalityId) {
      // Find default modality matching exam modalityType
      const mod = await RadiologyModality.findOne({
        type: order.modalityTypeSnapshot,
        status: { $in: ['AVAILABLE', 'IN_USE'] }
      });
      if (mod) {
        resolvedModalityId = mod._id;
        roomName = roomName || mod.room;
      }
    }

    const studyId = await IdGeneratorService.generateRadiologyStudyId();
    const accessionNumber = await IdGeneratorService.generateRadiologyAccessionNumber();

    const study = new RadiologyStudy({
      studyId,
      accessionNumber,
      orderId: order._id,
      patientId: order.patientId,
      patientName: order.patientName,
      examId: order.examId?._id || order.examId,
      examName: order.examNameSnapshot,
      modalityId: resolvedModalityId,
      modalityType: order.modalityTypeSnapshot,
      room: roomName,
      studyStatus: 'REGISTERED'
    });

    await study.save();

    await AuditService.logAction({
      user,
      action: 'CREATE_RADIOLOGY_STUDY',
      entity: 'RadiologyStudy',
      entityId: study._id,
      description: `Registered study ${study.studyId} with Accession Number ${study.accessionNumber} for order ${order.orderId}`
    });

    return study;
  }

  /**
   * Start examination workflow
   */
  static async startExamination(idOrAccession, { modalityId, room, user = null }) {
    let study = await RadiologyStudy.findOne({
      $or: [
        { _id: String(idOrAccession).match(/^[0-9a-fA-F]{24}$/) ? idOrAccession : null },
        { studyId: idOrAccession },
        { accessionNumber: idOrAccession }
      ]
    });

    if (!study) {
      // Maybe an order ID was passed: auto-create study if needed
      const order = await RadiologyOrder.findOne({
        $or: [{ _id: String(idOrAccession).match(/^[0-9a-fA-F]{24}$/) ? idOrAccession : null }, { orderId: idOrAccession }]
      });
      if (order) {
        study = await this.createStudy({ orderId: order._id, modalityId, room, user });
      }
    }

    if (!study) {
      throw new Error(`Study or Order '${idOrAccession}' not found.`);
    }

    study.studyStatus = 'IN_PROGRESS';
    study.performedDateTime = new Date();
    study.performedBy = user?._id || null;
    study.performedByName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Radiology Technician';
    if (modalityId) study.modalityId = modalityId;
    if (room) study.room = room;

    await study.save();

    // Update order status
    await RadiologyOrder.findByIdAndUpdate(study.orderId, {
      status: 'IN_PROGRESS'
    });

    // Update modality status to IN_USE
    if (study.modalityId) {
      await RadiologyModality.findByIdAndUpdate(study.modalityId, {
        status: 'IN_USE'
      });
    }

    await AuditService.logAction({
      user,
      action: 'START_RADIOLOGY_EXAMINATION',
      entity: 'RadiologyStudy',
      entityId: study._id,
      description: `Started imaging examination for Accession ${study.accessionNumber}`
    });

    return study;
  }

  /**
   * Complete examination workflow
   */
  static async completeExamination(
    idOrAccession,
    {
      externalPacsStudyId = '',
      externalStudyUID = '',
      imageReference = '',
      metadata = {},
      contrastAdministered = false,
      contrastDetails = {},
      technicianNotes = '',
      consumablesUsed = [],
      user = null
    }
  ) {
    const study = await RadiologyStudy.findOne({
      $or: [
        { _id: String(idOrAccession).match(/^[0-9a-fA-F]{24}$/) ? idOrAccession : null },
        { studyId: idOrAccession },
        { accessionNumber: idOrAccession }
      ]
    });

    if (!study) {
      throw new Error(`Study '${idOrAccession}' not found.`);
    }

    study.studyStatus = 'COMPLETED';
    study.completedDateTime = new Date();
    study.externalPacsStudyId = externalPacsStudyId || study.externalPacsStudyId || `PACS-${study.accessionNumber}`;
    study.externalStudyUID = externalStudyUID || study.externalStudyUID || `1.2.840.10008.1.${Date.now()}`;
    study.imageReference = imageReference || `pacs://viewer/study/${study.accessionNumber}`;
    study.metadata = { ...study.metadata, ...metadata };
    study.contrastAdministered = Boolean(contrastAdministered);
    if (contrastDetails) {
      study.contrastDetails = { ...study.contrastDetails, ...contrastDetails };
    }
    study.technicianNotes = technicianNotes || study.technicianNotes || '';

    await study.save();

    // Update order status
    const order = await RadiologyOrder.findById(study.orderId);
    if (order) {
      order.status = 'COMPLETED';
      order.externalPacsStudyId = study.externalPacsStudyId;
      await order.save();
    }

    // Free up modality back to AVAILABLE
    if (study.modalityId) {
      await RadiologyModality.findByIdAndUpdate(study.modalityId, {
        status: 'AVAILABLE'
      });
    }

    // 1. Trigger Billing Integration (Idempotent Charge)
    try {
      if (order) {
        await RadiologyBillingService.createRadiologyCharge({
          order,
          study,
          user
        });
      }
    } catch (billingErr) {
      console.warn('[Radiology Billing Error Isolated]:', billingErr.message);
      // Study remains completed; isolated billing failure
    }

    // 2. Trigger Consumable / Contrast Inventory Integration
    if (consumablesUsed && Array.isArray(consumablesUsed) && consumablesUsed.length > 0) {
      try {
        await RadiologyInventoryService.recordConsumableUsage({
          study,
          consumables: consumablesUsed,
          user
        });
      } catch (invErr) {
        console.warn('[Radiology Inventory Error Isolated]:', invErr.message);
      }
    }

    await AuditService.logAction({
      user,
      action: 'COMPLETE_RADIOLOGY_EXAMINATION',
      entity: 'RadiologyStudy',
      entityId: study._id,
      description: `Completed imaging examination for Accession ${study.accessionNumber} (PACS Ref: ${study.externalPacsStudyId})`
    });

    return study;
  }

  /**
   * List studies
   */
  static async listStudies(filters = {}, pagination = {}) {
    const query = {};

    if (filters.studyStatus) query.studyStatus = filters.studyStatus;
    if (filters.modalityId) query.modalityId = filters.modalityId;
    if (filters.modalityType) query.modalityType = filters.modalityType;
    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [
        { accessionNumber: regex },
        { studyId: regex },
        { patientName: regex },
        { examName: regex },
        { externalPacsStudyId: regex }
      ];
    }

    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [studies, total] = await Promise.all([
      RadiologyStudy.find(query)
        .populate('examId')
        .populate('orderId')
        .populate('modalityId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RadiologyStudy.countDocuments(query)
    ]);

    return {
      studies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single study
   */
  static async getStudyById(id) {
    let study = await RadiologyStudy.findOne({
      $or: [
        { _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { studyId: id },
        { accessionNumber: id }
      ]
    })
      .populate('examId')
      .populate('orderId')
      .populate('modalityId')
      .lean();

    if (!study) {
      throw new Error(`Study '${id}' not found.`);
    }
    return study;
  }
}

module.exports = StudyService;
