const RadiologyExam = require('../../models/RadiologyExam');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class ExamService {
  /**
   * List exams with filtering and pagination
   */
  static async listExams(filters = {}, pagination = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.modalityType) {
      query.modalityType = filters.modalityType;
    }
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.bodyPart) {
      query.bodyPart = new RegExp(filters.bodyPart, 'i');
    }
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { code: searchRegex },
        { name: searchRegex },
        { description: searchRegex },
        { bodyPart: searchRegex }
      ];
    }

    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [exams, total] = await Promise.all([
      RadiologyExam.find(query)
        .sort({ code: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RadiologyExam.countDocuments(query)
    ]);

    return {
      exams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single exam by ID or code
   */
  static async getExamById(idOrCode) {
    let exam = null;
    if (String(idOrCode).match(/^[0-9a-fA-F]{24}$/)) {
      exam = await RadiologyExam.findById(idOrCode).lean();
    }
    if (!exam) {
      exam = await RadiologyExam.findOne({
        $or: [{ examId: idOrCode }, { code: String(idOrCode).toUpperCase() }]
      }).lean();
    }
    if (!exam) {
      throw new Error(`Radiology Exam '${idOrCode}' not found.`);
    }
    return exam;
  }

  /**
   * Create new exam
   */
  static async createExam(examData, user = null) {
    if (!examData.code || !examData.name || !examData.modalityType) {
      throw new Error('Exam code, name, and modalityType are mandatory.');
    }

    const upperCode = examData.code.trim().toUpperCase();
    const existing = await RadiologyExam.findOne({ code: upperCode });
    if (existing) {
      throw new Error(`Radiology Exam with code '${upperCode}' already exists.`);
    }

    const examId = await IdGeneratorService.generateRadiologyExamId();

    const exam = new RadiologyExam({
      examId,
      code: upperCode,
      name: examData.name.trim(),
      category: examData.category || 'DIAGNOSTIC_XRAY',
      modalityType: examData.modalityType,
      description: examData.description || '',
      bodyPart: examData.bodyPart || '',
      preparationInstructions: examData.preparationInstructions || '',
      fastingRequired: Boolean(examData.fastingRequired),
      appointmentRequired: examData.appointmentRequired !== undefined ? Boolean(examData.appointmentRequired) : true,
      estimatedDurationMinutes: Number(examData.estimatedDurationMinutes) || 30,
      turnaroundTimeMinutes: Number(examData.turnaroundTimeMinutes) || 120,
      chargeCode: examData.chargeCode || upperCode,
      priceReference: Number(examData.priceReference) || 0,
      externalCode: examData.externalCode || '',
      departmentId: examData.departmentId || null,
      status: examData.status || 'ACTIVE',
      createdBy: user?._id || null,
      updatedBy: user?._id || null
    });

    await exam.save();

    await AuditService.logAction({
      user,
      action: 'CREATE_RADIOLOGY_EXAM',
      entity: 'RadiologyExam',
      entityId: exam._id,
      description: `Created Radiology Examination ${exam.code} - ${exam.name}`
    });

    return exam;
  }

  /**
   * Update existing exam
   */
  static async updateExam(id, updateData, user = null) {
    const exam = await RadiologyExam.findOne({
      $or: [
        { _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { examId: id },
        { code: String(id).toUpperCase() }
      ]
    });

    if (!exam) {
      throw new Error(`Radiology exam '${id}' not found.`);
    }

    const previousSnapshot = exam.toObject();

    if (updateData.name) exam.name = updateData.name.trim();
    if (updateData.category) exam.category = updateData.category;
    if (updateData.modalityType) exam.modalityType = updateData.modalityType;
    if (updateData.description !== undefined) exam.description = updateData.description;
    if (updateData.bodyPart !== undefined) exam.bodyPart = updateData.bodyPart;
    if (updateData.preparationInstructions !== undefined) exam.preparationInstructions = updateData.preparationInstructions;
    if (updateData.fastingRequired !== undefined) exam.fastingRequired = Boolean(updateData.fastingRequired);
    if (updateData.appointmentRequired !== undefined) exam.appointmentRequired = Boolean(updateData.appointmentRequired);
    if (updateData.estimatedDurationMinutes) exam.estimatedDurationMinutes = Number(updateData.estimatedDurationMinutes);
    if (updateData.turnaroundTimeMinutes) exam.turnaroundTimeMinutes = Number(updateData.turnaroundTimeMinutes);
    if (updateData.chargeCode) exam.chargeCode = updateData.chargeCode;
    if (updateData.priceReference !== undefined) exam.priceReference = Number(updateData.priceReference);
    if (updateData.externalCode !== undefined) exam.externalCode = updateData.externalCode;
    if (updateData.status) exam.status = updateData.status;

    exam.updatedBy = user?._id || null;
    await exam.save();

    await AuditService.logAction({
      user,
      action: 'UPDATE_RADIOLOGY_EXAM',
      entity: 'RadiologyExam',
      entityId: exam._id,
      previousState: previousSnapshot,
      newState: exam.toObject(),
      description: `Updated examination ${exam.code}`
    });

    return exam;
  }

  /**
   * Update exam status (ACTIVE, INACTIVE, RETIRED, etc.)
   */
  static async updateExamStatus(id, status, user = null) {
    const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'RETIRED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid exam status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
    }

    const exam = await RadiologyExam.findOne({
      $or: [
        { _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { examId: id },
        { code: String(id).toUpperCase() }
      ]
    });

    if (!exam) {
      throw new Error(`Radiology Exam '${id}' not found.`);
    }

    const oldStatus = exam.status;
    exam.status = status;
    if (status === 'INACTIVE' || status === 'RETIRED') {
      exam.inactiveFrom = new Date();
    } else if (status === 'ACTIVE') {
      exam.activeFrom = new Date();
      exam.inactiveFrom = null;
    }

    exam.updatedBy = user?._id || null;
    await exam.save();

    await AuditService.logAction({
      user,
      action: 'UPDATE_EXAM_STATUS',
      entity: 'RadiologyExam',
      entityId: exam._id,
      previousState: { status: oldStatus },
      newState: { status },
      description: `Changed exam ${exam.code} status from ${oldStatus} to ${status}`
    });

    return exam;
  }
}

module.exports = ExamService;
