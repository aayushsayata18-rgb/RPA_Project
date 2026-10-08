const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');

class VisitService {
  /**
   * Create a new visit for an existing patient
   */
  static async createVisit(visitData, actor = null) {
    const { patientId, visitType = 'OPD', department = 'GENERAL_MEDICINE', appointmentId = null, chiefComplaint = '', priority = 'NORMAL', notes = '' } = visitData;

    if (!patientId) {
      const err = new Error('patientId is required to create a visit.');
      err.statusCode = 400;
      throw err;
    }

    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      const err = new Error(`Patient with ID ${patientId} not found in Patient Master.`);
      err.statusCode = 404;
      throw err;
    }

    const visitId = await IdGeneratorService.generateVisitId();
    const newVisit = new Visit({
      visitId,
      patientId: patient.patientId,
      patientRef: patient._id,
      visitType,
      department,
      appointmentId,
      chiefComplaint,
      priority,
      notes,
      registrationSource: actor?.role === 'PATIENT' ? 'ONLINE_SELF_REGISTRATION' : 'FRONT_DESK',
      createdBy: actor?._id || null
    });

    await newVisit.save();

    await AuditService.logEvent({
      userId: actor?.userId || actor?.email || 'SYSTEM',
      userEmail: actor?.email || null,
      role: actor?.role || 'SYSTEM',
      action: 'VISIT_CREATED',
      module: 'PATIENT_REGISTRATION',
      entityType: 'VISIT',
      entityId: visitId,
      newValue: { visitId, patientId: patient.patientId, visitType }
    });

    return newVisit;
  }

  /**
   * Get visit by Visit ID
   */
  static async getVisitById(visitId) {
    const visit = await Visit.findOne({ visitId }).populate('patientRef').lean();
    return visit;
  }

  /**
   * Get all visits for a specific patient
   */
  static async getVisitsByPatientId(patientId) {
    return await Visit.find({ patientId }).sort({ visitDate: -1 }).lean();
  }

  /**
   * List all visits with filtering and pagination
   */
  static async listVisits({ patientId, visitType, status, page = 1, limit = 20 }) {
    const query = {};
    if (patientId) query.patientId = patientId;
    if (visitType) query.visitType = visitType;
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [visits, total] = await Promise.all([
      Visit.find(query).sort({ visitDate: -1 }).skip(skip).limit(limitNum).populate('patientRef').lean(),
      Visit.countDocuments(query)
    ]);

    return {
      visits,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }
}

module.exports = VisitService;
