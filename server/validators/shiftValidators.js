/**
 * Shift Management Validators
 * Self-contained native validation middleware
 */

const validateCreateShift = (req, res, next) => {
  const { shiftCode, shiftName, startTime, endTime, breakMinutes } = req.body;
  if (!shiftCode || !shiftCode.trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Shift code is required' });
  }
  if (!shiftName || !shiftName.trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Shift name is required' });
  }
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!startTime || !timeRegex.test(startTime)) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Start time must be HH:mm format' });
  }
  if (!endTime || !timeRegex.test(endTime)) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'End time must be HH:mm format' });
  }
  if (breakMinutes !== undefined && (isNaN(breakMinutes) || Number(breakMinutes) < 0)) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Break minutes must be non-negative integer' });
  }
  next();
};

const validateCreateRoster = (req, res, next) => {
  const { rosterName, departmentId, periodStart, periodEnd } = req.body;
  if (!rosterName || !rosterName.trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Roster name is required' });
  }
  if (!departmentId || !String(departmentId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Department ID is required' });
  }
  if (!periodStart || isNaN(new Date(periodStart).getTime())) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Valid periodStart date is required' });
  }
  if (!periodEnd || isNaN(new Date(periodEnd).getTime())) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Valid periodEnd date is required' });
  }
  next();
};

const validateCreateAssignment = (req, res, next) => {
  const { employeeId, shiftId, assignmentDate } = req.body;
  if (!employeeId || !String(employeeId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Employee ID is required' });
  }
  if (!shiftId || !String(shiftId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Shift ID or code is required' });
  }
  if (!assignmentDate || isNaN(new Date(assignmentDate).getTime())) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Valid assignment date is required' });
  }
  next();
};

const validateChangeRequest = (req, res, next) => {
  const { assignmentId, requestedShiftId, reason } = req.body;
  if (!assignmentId || !String(assignmentId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Assignment ID is required' });
  }
  if (!requestedShiftId || !String(requestedShiftId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Requested shift ID is required' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Reason for change is required' });
  }
  next();
};

const validateSwapRequest = (req, res, next) => {
  const { requesterAssignmentId, targetEmployeeId, targetAssignmentId, reason } = req.body;
  if (!requesterAssignmentId || !String(requesterAssignmentId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Requester assignment ID is required' });
  }
  if (!targetEmployeeId || !String(targetEmployeeId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Target employee ID is required' });
  }
  if (!targetAssignmentId || !String(targetAssignmentId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Target assignment ID is required' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Reason for swap is required' });
  }
  next();
};

module.exports = {
  validateCreateShift,
  validateCreateRoster,
  validateCreateAssignment,
  validateChangeRequest,
  validateSwapRequest
};
