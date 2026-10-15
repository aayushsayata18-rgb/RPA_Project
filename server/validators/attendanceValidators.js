const validatePunchEvent = (req, res, next) => {
  const { employeeIdCode, employeeId, eventDateTime } = req.body;
  const errors = [];

  const emp = employeeIdCode || employeeId;
  if (!emp || typeof emp !== 'string' || emp.trim() === '') {
    errors.push('employeeIdCode is required and must be a valid string (e.g. EMP10001).');
  }

  if (eventDateTime && isNaN(new Date(eventDateTime).getTime())) {
    errors.push('eventDateTime must be a valid ISO Date string.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Invalid punch event payload.',
      details: errors
    });
  }

  next();
};

const validateManualAttendance = (req, res, next) => {
  const { employeeIdCode, employeeId, date, reason, checkInTime, checkOutTime } = req.body;
  const errors = [];

  const emp = employeeIdCode || employeeId;
  if (!emp || typeof emp !== 'string' || emp.trim() === '') {
    errors.push('employeeIdCode is required.');
  }

  if (!date || isNaN(new Date(date).getTime())) {
    errors.push('date is required and must be a valid date.');
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    errors.push('reason is required and must be at least 5 characters explaining the manual entry justification.');
  }

  if (checkInTime && isNaN(new Date(checkInTime).getTime())) {
    errors.push('checkInTime must be a valid timestamp.');
  }

  if (checkOutTime && isNaN(new Date(checkOutTime).getTime())) {
    errors.push('checkOutTime must be a valid timestamp.');
  }

  if (checkInTime && checkOutTime) {
    if (new Date(checkOutTime) < new Date(checkInTime)) {
      errors.push('checkOutTime cannot precede checkInTime.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Validation failed for manual attendance entry.',
      details: errors
    });
  }

  next();
};

const validateCorrectionRequest = (req, res, next) => {
  const { reason, requestedCheckIn, requestedCheckOut } = req.body;
  const errors = [];

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    errors.push('A valid reason of at least 5 characters is required for correction submission.');
  }

  if (requestedCheckIn && isNaN(new Date(requestedCheckIn).getTime())) {
    errors.push('requestedCheckIn must be a valid date string.');
  }

  if (requestedCheckOut && isNaN(new Date(requestedCheckOut).getTime())) {
    errors.push('requestedCheckOut must be a valid date string.');
  }

  if (requestedCheckIn && requestedCheckOut) {
    if (new Date(requestedCheckOut) < new Date(requestedCheckIn)) {
      errors.push('requestedCheckOut cannot precede requestedCheckIn.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Correction request validation failed.',
      details: errors
    });
  }

  next();
};

const validateCorrectionRejection = (req, res, next) => {
  const { reviewerComments } = req.body;
  if (!reviewerComments || typeof reviewerComments !== 'string' || reviewerComments.trim().length < 3) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'reviewerComments is mandatory when rejecting a correction request (minimum 3 characters).'
    });
  }
  next();
};

const validateImportBatch = (req, res, next) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'records must be a non-empty array of attendance rows.'
    });
  }
  next();
};

module.exports = {
  validatePunchEvent,
  validateManualAttendance,
  validateCorrectionRequest,
  validateCorrectionRejection,
  validateImportBatch
};
