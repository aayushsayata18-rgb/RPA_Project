const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const { validatePatientPayload } = require('../validators/patientValidator');

class PatientService {
  /**
   * Search patients with flexible criteria and pagination
   */
  static async searchPatients({
    query = '',
    patientId = '',
    mobile = '',
    email = '',
    name = '',
    dateOfBirth = '',
    status = '',
    page = 1,
    limit = 20
  }) {
    const filter = {};

    if (patientId) {
      filter.patientId = { $regex: new RegExp(`^${patientId.trim()}$`, 'i') };
    } else if (mobile) {
      filter.mobile = { $regex: new RegExp(mobile.trim(), 'i') };
    } else if (email) {
      filter.email = { $regex: new RegExp(email.trim(), 'i') };
    } else if (name) {
      filter.$or = [
        { fullName: { $regex: new RegExp(name.trim(), 'i') } },
        { firstName: { $regex: new RegExp(name.trim(), 'i') } },
        { lastName: { $regex: new RegExp(name.trim(), 'i') } }
      ];
    } else if (query) {
      const q = query.trim();
      filter.$or = [
        { patientId: { $regex: new RegExp(`^${q}`, 'i') } },
        { mobile: { $regex: new RegExp(q, 'i') } },
        { email: { $regex: new RegExp(q, 'i') } },
        { fullName: { $regex: new RegExp(q, 'i') } }
      ];
    }

    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (!isNaN(d.getTime())) {
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.dateOfBirth = { $gte: d, $lt: nextDay };
      }
    }

    if (status) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [patients, total] = await Promise.all([
      Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Patient.countDocuments(filter)
    ]);

    return {
      patients,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  /**
   * Get single patient by permanent patientId with visits and active record
   */
  static async getPatientById(patientId) {
    const patient = await Patient.findOne({ patientId }).lean();
    if (!patient) return null;

    const visits = await Visit.find({ patientId }).sort({ visitDate: -1 }).limit(20).lean();

    return {
      ...patient,
      visits
    };
  }

  /**
   * Create a new patient record
   */
  static async createPatient(patientData, actor = null) {
    const validation = validatePatientPayload(patientData);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    const patientId = await IdGeneratorService.generatePatientId();
    const newPatient = new Patient({
      ...validation.sanitized,
      patientId,
      createdBy: actor?._id || null,
      updatedBy: actor?._id || null
    });

    await newPatient.save();

    await AuditService.logEvent({
      userId: actor?.userId || actor?.email || 'SYSTEM',
      userEmail: actor?.email || null,
      role: actor?.role || 'SYSTEM',
      action: 'PATIENT_CREATED',
      module: 'PATIENT_REGISTRATION',
      entityType: 'PATIENT',
      entityId: patientId,
      newValue: { patientId, fullName: newPatient.fullName, mobile: newPatient.mobile }
    });

    return newPatient;
  }

  /**
   * Update patient demographic / permitted fields with field-level RBAC & audit
   */
  static async updatePatient(patientId, updateData, actor = null) {
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      const err = new Error(`Patient with ID ${patientId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const isPatientSelf = actor && actor.role === 'PATIENT';
    const isStaffOrAdmin = actor && ['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN'].includes(actor.role);

    // Patients can only update mobile, email, address, communicationPreferences
    const allowedFieldsForPatient = ['mobile', 'email', 'address', 'communicationPreferences', 'emergencyContact'];
    const allowedFieldsForStaff = [
      'firstName',
      'middleName',
      'lastName',
      'dateOfBirth',
      'gender',
      'bloodGroup',
      'mobile',
      'email',
      'address',
      'emergencyContact',
      'identityDocuments',
      'communicationPreferences',
      'notes',
      'status'
    ];

    const permittedFields = isPatientSelf ? allowedFieldsForPatient : isStaffOrAdmin ? allowedFieldsForStaff : allowedFieldsForPatient;

    const validation = validatePatientPayload(updateData, true);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    const oldValue = patient.toObject();
    const sanitized = validation.sanitized;

    for (const key of permittedFields) {
      if (sanitized[key] !== undefined) {
        patient[key] = sanitized[key];
      }
    }

    patient.updatedBy = actor?._id || null;
    await patient.save();

    await AuditService.logEvent({
      userId: actor?.userId || actor?.email || 'SYSTEM',
      userEmail: actor?.email || null,
      role: actor?.role || 'SYSTEM',
      action: 'PATIENT_UPDATED',
      module: 'PATIENT_REGISTRATION',
      entityType: 'PATIENT',
      entityId: patientId,
      oldValue: { mobile: oldValue.mobile, email: oldValue.email, address: oldValue.address },
      newValue: { mobile: patient.mobile, email: patient.email, address: patient.address }
    });

    return patient;
  }
}

module.exports = PatientService;
