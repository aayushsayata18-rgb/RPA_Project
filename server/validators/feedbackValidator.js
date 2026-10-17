// Validator for Feedback Module (00_MASTER.md & 25_PATIENT_FEEDBACK.md)

const VALID_TYPES = [
  'COMPLAINT',
  'SUGGESTION',
  'COMPLIMENT',
  'SERVICE_FEEDBACK',
  'STAFF_FEEDBACK',
  'FACILITY_FEEDBACK',
  'BILLING_FEEDBACK',
  'PHARMACY_FEEDBACK',
  'LAB_FEEDBACK',
  'RADIOLOGY_FEEDBACK',
  'HOUSEKEEPING_FEEDBACK',
  'MAINTENANCE_FEEDBACK',
  'OTHER'
];

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'];

const VALID_STATUS_TRANSITIONS = {
  DRAFT: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['ACKNOWLEDGED', 'ASSIGNED', 'UNDER_REVIEW', 'WITHDRAWN', 'REJECTED'],
  ACKNOWLEDGED: ['ASSIGNED', 'UNDER_REVIEW', 'WAITING_FOR_INFORMATION', 'WITHDRAWN'],
  ASSIGNED: ['UNDER_REVIEW', 'INVESTIGATION', 'ESCALATED', 'WITHDRAWN'],
  UNDER_REVIEW: ['INVESTIGATION', 'WAITING_FOR_INFORMATION', 'RESPONSE_DRAFT', 'ESCALATED', 'RESOLVED', 'CLOSED', 'WITHDRAWN'],
  INVESTIGATION: ['WAITING_FOR_INFORMATION', 'RESPONSE_DRAFT', 'ESCALATED', 'RESOLVED', 'WITHDRAWN'],
  WAITING_FOR_INFORMATION: ['UNDER_REVIEW', 'INVESTIGATION', 'WITHDRAWN'],
  RESPONSE_DRAFT: ['RESPONSE_PENDING_APPROVAL', 'RESPONSE_SENT', 'UNDER_REVIEW'],
  RESPONSE_PENDING_APPROVAL: ['RESPONSE_DRAFT', 'RESPONSE_SENT'],
  RESPONSE_SENT: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['UNDER_REVIEW', 'ASSIGNED', 'INVESTIGATION'],
  ESCALATED: ['INVESTIGATION', 'UNDER_REVIEW', 'RESPONSE_DRAFT'],
  WITHDRAWN: ['REOPENED'],
  REJECTED: ['REOPENED']
};

class FeedbackValidator {
  static validateSubmission(data) {
    const errors = [];

    if (!data.subject || !String(data.subject).trim()) {
      errors.push('Subject is required.');
    }

    if (!data.description || !String(data.description).trim()) {
      errors.push('Description is required.');
    }

    if (!data.category || !String(data.category).trim()) {
      errors.push('Category is required.');
    }

    if (data.type && !VALID_TYPES.includes(data.type)) {
      errors.push(`Invalid feedback type. Valid types are: ${VALID_TYPES.join(', ')}`);
    }

    if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
      errors.push(`Invalid priority. Valid priorities are: ${VALID_PRIORITIES.join(', ')}`);
    }

    if (data.rating !== undefined && data.rating !== null && data.rating !== '') {
      const num = Number(data.rating);
      if (isNaN(num) || num < 1 || num > 5) {
        errors.push('Rating must be an integer between 1 and 5.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateStatusTransition(currentStatus, nextStatus, userRole = null) {
    if (!currentStatus || !nextStatus) {
      return { isValid: false, message: 'Current and target status must be specified.' };
    }

    if (currentStatus === nextStatus) {
      return { isValid: true };
    }

    // Admins and Hospital Management have override permission for exceptional workflow
    const administrativeRoles = ['ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'SYSTEM_ADMIN'];
    if (userRole && administrativeRoles.includes(userRole)) {
      return { isValid: true };
    }

    const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(nextStatus)) {
      return {
        isValid: false,
        message: `Invalid status transition from ${currentStatus} to ${nextStatus}. Allowed: ${allowed ? allowed.join(', ') : 'none'}`
      };
    }

    return { isValid: true };
  }

  static canAccessFeedback(feedback, user) {
    if (!feedback || !user) return false;

    // System admin & hospital management can view all
    if (['SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT', 'ADMIN_MANAGER'].includes(user.role)) {
      return true;
    }

    // Patient can only view their own non-anonymous feedback or if matched
    if (user.role === 'PATIENT') {
      const patientId = user.linkedEntityId || user.userId;
      return feedback.patientId === patientId || feedback.patientId === user.userId;
    }

    // Confidentiality checking
    const confLevel = feedback.confidentiality?.level || 'NORMAL';
    if (confLevel === 'HIGHLY_RESTRICTED') {
      return ['HOSPITAL_MANAGEMENT', 'SYSTEM_ADMIN'].includes(user.role);
    }

    if (confLevel === 'RESTRICTED') {
      return ['ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'SYSTEM_ADMIN'].includes(user.role);
    }

    // Department match
    if (user.departmentId && feedback.assignedDepartmentId) {
      if (user.departmentId === feedback.assignedDepartmentId) return true;
    }

    // Staff match
    if (feedback.assignedTo && feedback.assignedTo === user.userId) {
      return true;
    }

    // Operations roles can view normal departmental feedback
    const operationalRoles = [
      'RECEPTIONIST',
      'HOUSEKEEPING',
      'MAINTENANCE',
      'PHARMACIST',
      'LAB_TECHNICIAN',
      'RADIOLOGY_TECHNICIAN',
      'BILLING_STAFF',
      'DOCTOR',
      'NURSE'
    ];
    if (operationalRoles.includes(user.role)) {
      return true;
    }

    return false;
  }
}

module.exports = FeedbackValidator;
