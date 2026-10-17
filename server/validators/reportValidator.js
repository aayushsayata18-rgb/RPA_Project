/**
 * Module 28: ReportValidator
 * Validates report executions, filter parameters, schedules, and analytics alert rules
 * Prevents NoSQL injection and enforces date range bounds (28_REPORTS_ANALYTICS.md Section 150-153)
 */

const ALLOWED_FORMATS = ['CSV', 'XLSX', 'PDF', 'JSON'];
const ALLOWED_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'];
const ALLOWED_OPERATORS = ['>', '>=', '<', '<=', '==', '!='];
const ALLOWED_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'];
const MAX_DATE_RANGE_DAYS = 366; // Max 12 months (Section 153)

class ReportValidator {
  /**
   * Sanitizes filter object to prevent NoSQL query operator injection ($where, $gt, etc.)
   */
  static sanitizeFilters(filters) {
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
      return {};
    }
    const clean = {};
    for (const [key, val] of Object.entries(filters)) {
      if (key.startsWith('$')) continue; // Reject raw mongo operators
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val instanceof Date) {
        clean[key] = val;
      } else if (Array.isArray(val)) {
        clean[key] = val.filter((item) => typeof item === 'string' || typeof item === 'number');
      }
    }
    return clean;
  }

  /**
   * Validates execution payload
   */
  static validateExecutionPayload(payload = {}) {
    const errors = [];
    const { format = 'CSV', filters = {} } = payload;

    if (format && !ALLOWED_FORMATS.includes(format.toUpperCase())) {
      errors.push(`Invalid format '${format}'. Allowed formats: ${ALLOWED_FORMATS.join(', ')}`);
    }

    if (filters.dateFrom && filters.dateTo) {
      const from = new Date(filters.dateFrom);
      const to = new Date(filters.dateTo);

      if (isNaN(from.getTime())) {
        errors.push('dateFrom must be a valid date');
      }
      if (isNaN(to.getTime())) {
        errors.push('dateTo must be a valid date');
      }
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        if (from > to) {
          errors.push('dateFrom cannot be greater than dateTo');
        }
        const diffDays = Math.ceil(Math.abs(to - from) / (1000 * 60 * 60 * 24));
        if (diffDays > MAX_DATE_RANGE_DAYS) {
          errors.push(`Date range exceeds maximum allowed limit of ${MAX_DATE_RANGE_DAYS} days (12 months)`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters: this.sanitizeFilters(filters)
    };
  }

  /**
   * Validates report schedule creation/update
   */
  static validateSchedulePayload(payload = {}) {
    const errors = [];
    const { reportCode, frequency, format, recipients } = payload;

    if (!reportCode || typeof reportCode !== 'string') {
      errors.push('reportCode is required');
    }
    if (frequency && !ALLOWED_FREQUENCIES.includes(frequency.toUpperCase())) {
      errors.push(`Invalid frequency '${frequency}'. Allowed: ${ALLOWED_FREQUENCIES.join(', ')}`);
    }
    if (format && !ALLOWED_FORMATS.includes(format.toUpperCase())) {
      errors.push(`Invalid format '${format}'. Allowed: ${ALLOWED_FORMATS.join(', ')}`);
    }
    if (recipients && !Array.isArray(recipients)) {
      errors.push('recipients must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates alert rule payload
   */
  static validateAlertRulePayload(payload = {}) {
    const errors = [];
    const { metricCode, operator, threshold, severity } = payload;

    if (!metricCode || typeof metricCode !== 'string') {
      errors.push('metricCode is required');
    }
    if (!operator || !ALLOWED_OPERATORS.includes(operator)) {
      errors.push(`Invalid operator. Allowed: ${ALLOWED_OPERATORS.join(', ')}`);
    }
    if (threshold === undefined || threshold === null || isNaN(Number(threshold))) {
      errors.push('threshold must be a valid numeric value');
    }
    if (severity && !ALLOWED_SEVERITIES.includes(severity.toUpperCase())) {
      errors.push(`Invalid severity. Allowed: ${ALLOWED_SEVERITIES.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ReportValidator;
