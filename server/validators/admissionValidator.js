const validateAdmissionRequest = (req, res, next) => {
  const { patientId, visitId, clinicalRequirementReference } = req.body;
  const errors = [];

  if (!patientId || typeof patientId !== 'string' || patientId.trim() === '') {
    errors.push('patientId is required and must be a valid string.');
  }

  if (!visitId || typeof visitId !== 'string' || visitId.trim() === '') {
    errors.push('visitId is required and must be a valid string.');
  }

  if (!clinicalRequirementReference || typeof clinicalRequirementReference !== 'string' || clinicalRequirementReference.trim() === '') {
    errors.push('clinicalRequirementReference is required and must reference an authorized clinical order.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid admission request payload.',
        details: errors
      }
    });
  }

  next();
};

const validateAdmissionApproval = (req, res, next) => {
  // Can optionally provide notes/reason
  next();
};

const validateAdmissionRejection = (req, res, next) => {
  const { reason } = req.body;
  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A clear administrative rejection reason is required.'
      }
    });
  }
  next();
};

const validateBedAssignment = (req, res, next) => {
  const { bedId } = req.body;
  if (!bedId || typeof bedId !== 'string' || bedId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'bedId is required to assign physical bed.'
      }
    });
  }
  next();
};

module.exports = {
  validateAdmissionRequest,
  validateAdmissionApproval,
  validateAdmissionRejection,
  validateBedAssignment
};
