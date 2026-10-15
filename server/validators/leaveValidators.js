const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      details: errors.array().map(e => `${e.param || e.path}: ${e.msg}`).join(', ')
    });
  }
  next();
};

const validateCreateLeaveType = [
  body('code').trim().notEmpty().withMessage('Leave type code is required'),
  body('name').trim().notEmpty().withMessage('Leave type name is required'),
  body('unit').optional().isIn(['DAYS', 'HOURS']).withMessage('Unit must be DAYS or HOURS'),
  handleValidationErrors
];

const validateCreatePolicy = [
  body('leaveTypeId').trim().notEmpty().withMessage('Leave type ID is required'),
  body('annualEntitlement').isFloat({ min: 0 }).withMessage('Annual entitlement must be non-negative number'),
  body('accrualMethod').optional().isIn(['MONTHLY', 'QUARTERLY', 'YEARLY', 'MANUAL', 'NONE']),
  handleValidationErrors
];

const validateCreateLeaveRequest = [
  body('leaveTypeId').trim().notEmpty().withMessage('Leave type ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('dayType').optional().isIn(['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF', 'PARTIAL_DAY']),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  handleValidationErrors
];

const validateApproveRejectLeave = [
  param('id').trim().notEmpty().withMessage('Leave request ID is required'),
  handleValidationErrors
];

const validateAdjustBalance = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('leaveTypeId').trim().notEmpty().withMessage('Leave type ID is required'),
  body('adjustmentAmount').isFloat().withMessage('Valid numeric adjustment amount is required'),
  body('reason').trim().isLength({ min: 3 }).withMessage('Adjustment reason is required (min 3 chars)'),
  handleValidationErrors
];

const validateCancellationRequest = [
  param('id').trim().notEmpty().withMessage('Leave request ID is required'),
  body('reason').trim().isLength({ min: 3 }).withMessage('Cancellation reason is required'),
  handleValidationErrors
];

module.exports = {
  validateCreateLeaveType,
  validateCreatePolicy,
  validateCreateLeaveRequest,
  validateApproveRejectLeave,
  validateAdjustBalance,
  validateCancellationRequest
};
