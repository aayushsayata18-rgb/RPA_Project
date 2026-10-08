const PatientService = require('../services/PatientService');
const PatientMatchingService = require('../services/PatientMatchingService');

/**
 * Search patients in Patient Master
 */
const searchPatients = async (req, res, next) => {
  try {
    const result = await PatientService.searchPatients(req.query);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check potential duplicate matches for given patient attributes
 */
const checkDuplicates = async (req, res, next) => {
  try {
    const matchResult = await PatientMatchingService.findMatches(req.body);
    res.json({
      success: true,
      data: matchResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient by ID
 */
const getPatientById = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // RBAC: If requester is PATIENT, can only view own profile
    if (req.user.role === 'PATIENT' && req.user.linkedEntityId && req.user.linkedEntityId !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patients may only access their own profile.',
        errorCode: 'FORBIDDEN_PROFILE_ACCESS'
      });
    }

    const patient = await PatientService.getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${patientId} not found.`,
        errorCode: 'PATIENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new patient directly
 */
const createPatient = async (req, res, next) => {
  try {
    const patient = await PatientService.createPatient(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Patient created successfully in Patient Master.',
      data: {
        patientId: patient.patientId,
        fullName: patient.fullName,
        mobile: patient.mobile,
        status: patient.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient demographic / permitted details
 */
const updatePatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // RBAC check: Patient can only update own profile
    if (req.user.role === 'PATIENT' && req.user.linkedEntityId && req.user.linkedEntityId !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patients can only update their own profile.',
        errorCode: 'FORBIDDEN_PROFILE_UPDATE'
      });
    }

    const updated = await PatientService.updatePatient(patientId, req.body, req.user);
    res.json({
      success: true,
      message: 'Patient details updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchPatients,
  checkDuplicates,
  getPatientById,
  createPatient,
  updatePatient
};
