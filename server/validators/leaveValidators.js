/**
 * Leave Management Validators
 * Self-contained native validation middleware
 */

const validateCreateLeaveType = (req, res, next) => {
  const { code, name, unit } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Leave type code is required' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Leave type name is required' });
  }
  if (unit && !['DAYS', 'HOURS'].includes(unit)) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Unit must be DAYS or HOURS' });
  }
  next();
};

const validateCreatePolicy = (req, res, next) => {
  const { leaveTypeId, annualEntitlement, accrualMethod } = req.body;
  if (!leaveTypeId || !String(leaveTypeId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Leave type ID is required' });
  }
  if (annualEntitlement === undefined || isNaN(annualEntitlement) || Number(annualEntitlement) < 0) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Annual entitlement must be non-negative number' });
  }
  if (accrualMethod && !['MONTHLY', 'QUARTERLY', 'YEARLY', 'MANUAL', 'NONE'].includes(accrualMethod)) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Invalid accrual method' });
  }
  next();
};

const validateCreateLeaveRequest = (req, res, next) => {
  const { leaveTypeId, startDate, endDate, dayType, reason } = req.body;
  if (!leaveTypeId || !String(leaveTypeId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Leave type ID is required' });
  }
  if (!startDate || isNaN(new Date(startDate).getTime())) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Valid start date is required' });
  }
  if (!endDate || isNaN(new Date(endDate).getTime())) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Valid end date is required' });
  }
  if (dayType && !['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF', 'PARTIAL_DAY'].includes(dayType)) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Invalid dayType' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Reason is required' });
  }
  next();
};

const validateApproveRejectLeave = (req, res, next) => {
  const { id } = req.params;
  if (!id || !String(id).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Leave request ID is required' });
  }
  next();
};

const validateAdjustBalance = (req, res, next) => {
  const { employeeId, leaveTypeId, adjustmentAmount, reason } = req.body;
  if (!employeeId || !String(employeeId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Employee ID is required' });
  }
  if (!leaveTypeId || !String(leaveTypeId).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Leave type ID is required' });
  }
  if (adjustmentAmount === undefined || isNaN(adjustmentAmount)) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Valid numeric adjustment amount is required' });
  }
  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Adjustment reason is required (min 3 chars)' });
  }
  next();
};

const validateCancellationRequest = (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!id || !String(id).trim()) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Leave request ID is required' });
  }
  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: 'Cancellation reason is required' });
  }
  next();
};

module.exports = {
  validateCreateLeaveType,
  validateCreatePolicy,
  validateCreateLeaveRequest,
  validateApproveRejectLeave,
  validateAdjustBalance,
  validateCancellationRequest
};
