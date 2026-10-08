const RegistrationService = require('../services/RegistrationService');
const Registration = require('../models/Registration');
const EmergencyTemporaryRecord = require('../models/EmergencyTemporaryRecord');

/**
 * Submit patient registration (Online self-registration or Front-Desk)
 */
const submitRegistration = async (req, res, next) => {
  try {
    const actor = req.user || null;
    const result = await RegistrationService.processRegistration(req.body, actor);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Emergency Patient Registration
 */
const submitEmergencyRegistration = async (req, res, next) => {
  try {
    const actor = req.user || null;
    const result = await RegistrationService.processEmergencyRegistration(req.body, actor);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link Emergency Temporary Record to permanent patient
 */
const linkEmergencyRecord = async (req, res, next) => {
  try {
    const { temporaryEmergencyId } = req.params;
    const actor = req.user || null;
    const result = await RegistrationService.linkEmergencyRecord(temporaryEmergencyId, req.body, actor);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Human review of ambiguous registration matches
 */
const reviewRegistration = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const actor = req.user || null;
    const result = await RegistrationService.reviewAmbiguousRegistration(registrationId, req.body, actor);
    res.json({
      success: true,
      message: 'Registration review decision processed successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get registration by ID
 */
const getRegistrationById = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registration.findOne({ registrationId })
      .populate('patientRef')
      .populate('visitRef')
      .lean();

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: `Registration with ID ${registrationId} not found.`,
        errorCode: 'REGISTRATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all registrations
 */
const listRegistrations = async (req, res, next) => {
  try {
    const result = await RegistrationService.getRegistrations(req.query);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List Emergency Temporary Records
 */
const listEmergencyRecords = async (req, res, next) => {
  try {
    const { status = 'ACTIVE' } = req.query;
    const query = {};
    if (status && status !== 'ALL') query.status = status;

    const records = await EmergencyTemporaryRecord.find(query).sort({ createdAt: -1 }).limit(50).lean();
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitRegistration,
  submitEmergencyRegistration,
  linkEmergencyRecord,
  reviewRegistration,
  getRegistrationById,
  listRegistrations,
  listEmergencyRecords
};
