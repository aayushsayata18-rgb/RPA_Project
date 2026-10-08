const VisitService = require('../services/VisitService');

/**
 * Create a new visit for an existing patient
 */
const createVisit = async (req, res, next) => {
  try {
    const actor = req.user || null;
    const visit = await VisitService.createVisit(req.body, actor);
    res.status(201).json({
      success: true,
      message: 'Visit encounter created successfully.',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get visit by ID
 */
const getVisitById = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const visit = await VisitService.getVisitById(visitId);
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: `Visit with ID ${visitId} not found.`,
        errorCode: 'VISIT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get visits for a specific patient
 */
const getPatientVisits = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // RBAC: If patient role, check linkedEntityId
    if (req.user.role === 'PATIENT' && req.user.linkedEntityId && req.user.linkedEntityId !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patients may only view their own visits.',
        errorCode: 'FORBIDDEN_VISIT_ACCESS'
      });
    }

    const visits = await VisitService.getVisitsByPatientId(patientId);
    res.json({
      success: true,
      data: visits
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List visits with filter
 */
const listVisits = async (req, res, next) => {
  try {
    const result = await VisitService.listVisits(req.query);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVisit,
  getVisitById,
  getPatientVisits,
  listVisits
};
