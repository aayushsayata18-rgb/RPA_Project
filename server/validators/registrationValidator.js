const { validatePatientPayload } = require('./patientValidator');

const validateRegistrationPayload = (body) => {
  const errors = [];
  const sanitized = {};

  // Source
  const validSources = ['ONLINE_SELF_REGISTRATION', 'FRONT_DESK', 'EMERGENCY', 'RPA_EXTERNAL'];
  sanitized.source = validSources.includes(body.source) ? body.source : 'FRONT_DESK';

  // Visit details
  const validVisitTypes = ['OPD', 'EMERGENCY', 'FOLLOW_UP', 'DIAGNOSTIC', 'OTHER'];
  sanitized.visitType = validVisitTypes.includes(body.visitType) ? body.visitType : 'OPD';
  sanitized.department = typeof body.department === 'string' && body.department.trim() ? body.department.trim() : 'GENERAL_MEDICINE';
  sanitized.chiefComplaint = typeof body.chiefComplaint === 'string' ? body.chiefComplaint.trim() : '';
  sanitized.priority = ['NORMAL', 'URGENT', 'EMERGENCY'].includes(body.priority) ? body.priority : 'NORMAL';
  sanitized.appointmentId = body.appointmentId || null;

  // Existing patient ID if supplied
  if (body.existingPatientId) {
    sanitized.existingPatientId = String(body.existingPatientId).trim();
  }

  // Patient payload validation
  const patientValidation = validatePatientPayload(body.patient || body, Boolean(body.existingPatientId));
  if (!body.existingPatientId && !patientValidation.isValid) {
    errors.push(...patientValidation.errors);
  }

  sanitized.patientData = patientValidation.sanitized;

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

module.exports = {
  validateRegistrationPayload
};
