import api from './api';
import axios from 'axios';

/**
 * Module 28: ReportClientService
 * Frontend API client for Reports Catalog, Executions, Dashboards, KPIs, and Alert Rules
 */
export const reportClientService = {
  // Catalog
  getCatalog: (params = {}) => api.get('/reports/catalog', { params }),
  getReportDefinition: (reportId) => api.get(`/reports/catalog/${reportId}`),

  // Execution
  executeReport: (reportId, params = {}) => api.post(`/reports/execute/${reportId}`, params),
  getExecutions: (params = {}) => api.get('/reports/executions', { params }),
  getExecutionStatus: (executionId) => api.get(`/reports/executions/${executionId}`),

  // File Download with Auth Header
  downloadReportFile: async (executionId, format = 'csv', fileName = null) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/reports/executions/${executionId}/download`, {
      params: { format },
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      responseType: 'blob'
    });

    const isPdf = format.toLowerCase() === 'pdf';
    const blob = new Blob([response.data], {
      type: isPdf ? 'application/pdf' : 'text/csv;charset=utf-8;'
    });
    const defaultName = `report_${executionId}.${isPdf ? 'pdf' : 'csv'}`;
    const downloadName = fileName || defaultName;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Dashboards
  getManagementDashboard: () => api.get('/reports/dashboard/management'),
  getOperationsDashboard: () => api.get('/reports/dashboard/operations'),
  getFinanceDashboard: () => api.get('/reports/dashboard/finance'),
  getHRDashboard: () => api.get('/reports/dashboard/hr'),
  getRPADashboard: () => api.get('/reports/dashboard/rpa'),
  getDashboard: (type) => api.get(`/reports/dashboard/${type}`),

  // KPIs
  listKPIs: () => api.get('/reports/kpis'),
  calculateKPIs: () => api.post('/reports/kpis/calculate'),
  getKPITrend: (code) => api.get(`/reports/kpis/${code}/trend`),

  // Schedules
  listSchedules: () => api.get('/reports/schedules'),
  createSchedule: (payload) => api.post('/reports/schedules', payload),
  updateSchedule: (id, payload) => api.patch(`/reports/schedules/${id}`, payload),

  // Alerts
  listAlerts: () => api.get('/reports/alerts'),
  acknowledgeAlert: (id) => api.post(`/reports/alerts/${id}/acknowledge`),
  resolveAlert: (id, note) => api.post(`/reports/alerts/${id}/resolve`, { note }),

  // Advanced Analytics & Data Quality
  getMetricTrend: (params = {}) => api.get('/reports/analytics/trends', { params }),
  getPeriodComparison: (params = {}) => api.get('/reports/analytics/comparison', { params }),
  getBedDrillDown: () => api.get('/reports/analytics/drilldown/beds'),
  getManagementInsights: () => api.get('/reports/analytics/insights'),
  getDataQualityAudit: () => api.get('/reports/quality/audit')
};

export default reportClientService;
