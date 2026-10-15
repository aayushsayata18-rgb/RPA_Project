/**
 * Payroll Request Validators for Module 16
 */

const validateCreatePeriod = (req, res, next) => {
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'startDate and endDate are required',
      errorCode: 'MISSING_PERIOD_DATES'
    });
  }
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format for startDate or endDate',
      errorCode: 'INVALID_DATE_FORMAT'
    });
  }
  if (s >= e) {
    return res.status(400).json({
      success: false,
      message: 'startDate must be strictly before endDate',
      errorCode: 'INVALID_DATE_RANGE'
    });
  }
  next();
};

const validateAssignSalary = (req, res, next) => {
  const { employeeId, employeeIdCode, salaryStructureId, baseAmount } = req.body;
  if (!employeeId && !employeeIdCode) {
    return res.status(400).json({
      success: false,
      message: 'employeeId or employeeIdCode is required',
      errorCode: 'MISSING_EMPLOYEE_IDENTIFIER'
    });
  }
  if (!salaryStructureId) {
    return res.status(400).json({
      success: false,
      message: 'salaryStructureId is required',
      errorCode: 'MISSING_SALARY_STRUCTURE'
    });
  }
  if (baseAmount === undefined || isNaN(Number(baseAmount)) || Number(baseAmount) < 0) {
    return res.status(400).json({
      success: false,
      message: 'baseAmount must be a non-negative number',
      errorCode: 'INVALID_BASE_AMOUNT'
    });
  }
  next();
};

const validateCreateSalaryStructure = (req, res, next) => {
  const { code, name } = req.body;
  if (!code || !name) {
    return res.status(400).json({
      success: false,
      message: 'code and name are required for salary structure',
      errorCode: 'MISSING_STRUCTURE_FIELDS'
    });
  }
  next();
};

const validatePayrollQuery = (req, res, next) => {
  const { category, subject, description } = req.body;
  if (!category || !subject || !description) {
    return res.status(400).json({
      success: false,
      message: 'category, subject, and description are required',
      errorCode: 'MISSING_QUERY_FIELDS'
    });
  }
  next();
};

module.exports = {
  validateCreatePeriod,
  validateAssignSalary,
  validateCreateSalaryStructure,
  validatePayrollQuery
};
