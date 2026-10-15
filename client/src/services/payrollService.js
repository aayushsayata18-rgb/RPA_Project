import api from './api';

const payrollService = {
  // Periods
  getPeriods: (params) => api.get('/payroll/periods', { params }),
  getPeriodById: (id) => api.get(`/payroll/periods/${id}`),
  createPeriod: (data) => api.post('/payroll/periods', data),
  openPeriod: (id) => api.post(`/payroll/periods/${id}/open`),
  lockPeriod: (id, data) => api.post(`/payroll/periods/${id}/lock`, data),
  validatePeriod: (id) => api.post(`/payroll/periods/${id}/validate`),
  submitForReview: (id, data) => api.post(`/payroll/periods/${id}/submit-review`, data),
  approvePeriod: (id, data) => api.post(`/payroll/periods/${id}/approve`, data),
  processPeriod: (id, data) => api.post(`/payroll/periods/${id}/process`, data),
  finalizePeriod: (id) => api.post(`/payroll/periods/${id}/finalize`),

  // Inputs
  generateInputs: (id, data) => api.post(`/payroll/periods/${id}/generate-inputs`, data),
  getPeriodInputs: (id, params) => api.get(`/payroll/periods/${id}/inputs`, { params }),
  getInputById: (id) => api.get(`/payroll/inputs/${id}`),

  // Salary Configuration
  getSalaryStructures: () => api.get('/payroll/salary-structures'),
  createSalaryStructure: (data) => api.post('/payroll/salary-structures', data),
  assignSalary: (data) => api.post('/payroll/salaries/assign', data),
  getEmployeeSalaryHistory: (employeeId) => api.get(`/payroll/salaries/history/${employeeId}`),

  // Overtime
  getOvertimeRecords: (params) => api.get('/payroll/overtime', { params }),
  createOvertime: (data) => api.post('/payroll/overtime', data),
  approveOvertime: (id, data) => api.post(`/payroll/overtime/${id}/approve`, data),
  rejectOvertime: (id, data) => api.post(`/payroll/overtime/${id}/reject`, data),

  // Results & Reconciliation
  getPeriodResults: (id) => api.get(`/payroll/periods/${id}/results`),
  reconcileInternal: (id) => api.post(`/payroll/periods/${id}/reconcile`),
  reconcileExternal: (id, data) => api.post(`/payroll/periods/${id}/reconcile-external`, data),

  // Payslips
  generatePayslips: (id) => api.post(`/payroll/periods/${id}/generate-payslips`),
  getPayslips: (params) => api.get('/payroll/payslips', { params }),
  getPayslipById: (id) => api.get(`/payroll/payslips/${id}`),

  // Queries
  getQueries: (params) => api.get('/payroll/queries', { params }),
  submitQuery: (data) => api.post('/payroll/queries', data),
  resolveQuery: (id, data) => api.post(`/payroll/queries/${id}/resolve`, data),

  // Employee Self Service (/api/me/payroll)
  getMyPayroll: () => api.get('/payroll/me'),
  getMyPayslips: () => api.get('/payroll/me/payslips'),
  getMyQueries: () => api.get('/payroll/me/queries'),
  submitMyQuery: (data) => api.post('/payroll/me/queries', data)
};

export default payrollService;
