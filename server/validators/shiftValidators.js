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

const validateCreateShift = [
  body('shiftCode').trim().notEmpty().withMessage('Shift code is required'),
  body('shiftName').trim().notEmpty().withMessage('Shift name is required'),
  body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Start time must be HH:mm format'),
  body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('End time must be HH:mm format'),
  body('breakMinutes').optional().isInt({ min: 0 }).withMessage('Break minutes must be non-negative integer'),
  handleValidationErrors
];

const validateCreateRoster = [
  body('rosterName').trim().notEmpty().withMessage('Roster name is required'),
  body('departmentId').trim().notEmpty().withMessage('Department ID is required'),
  body('periodStart').isISO8601().withMessage('Valid periodStart date is required'),
  body('periodEnd').isISO8601().withMessage('Valid periodEnd date is required'),
  handleValidationErrors
];

const validateCreateAssignment = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('shiftId').trim().notEmpty().withMessage('Shift ID or code is required'),
  body('assignmentDate').isISO8601().withMessage('Valid assignment date is required'),
  handleValidationErrors
];

const validateChangeRequest = [
  body('assignmentId').trim().notEmpty().withMessage('Assignment ID is required'),
  body('requestedShiftId').trim().notEmpty().withMessage('Requested shift ID is required'),
  body('reason').trim().notEmpty().withMessage('Reason for change is required'),
  handleValidationErrors
];

const validateSwapRequest = [
  body('requesterAssignmentId').trim().notEmpty().withMessage('Requester assignment ID is required'),
  body('targetEmployeeId').trim().notEmpty().withMessage('Target employee ID is required'),
  body('targetAssignmentId').trim().notEmpty().withMessage('Target assignment ID is required'),
  body('reason').trim().notEmpty().withMessage('Reason for swap is required'),
  handleValidationErrors
];

module.exports = {
  validateCreateShift,
  validateCreateRoster,
  validateCreateAssignment,
  validateChangeRequest,
  validateSwapRequest
};
