const DocumentAccessLog = require('../models/DocumentAccessLog');
const { v4: uuidv4 } = require('uuid');

/**
 * Module 27: DocumentAccessService
 * RBAC, Patient Isolation, Confidentiality & Audit Logging
 * (27_DOCUMENT_GENERATION.md Section 28-34, 68, 69, 102, 103, 104)
 */
class DocumentAccessService {
  /**
   * Authorize a user's access to a document
   * @param {Object} document - GeneratedDocument
   * @param {Object} user - Authenticated user object from req.user
   * @param {String} action - 'VIEW' | 'DOWNLOAD' | 'PREVIEW'
   * @returns {{ allowed: Boolean, reason?: String }}
   */
  static verifyAccess(document, user = {}, action = 'VIEW') {
    if (!user || !user.role) {
      return { allowed: false, reason: 'Authentication required' };
    }

    const role = user.role.toUpperCase();

    // 1. SYSTEM_ADMIN has full administrative privileges
    if (role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN') {
      return { allowed: true };
    }

    // 2. PATIENT PORTAL ACCESS RULES (Section 28-33, 103)
    if (role === 'PATIENT') {
      // Must be the owner patient
      const userPatientId = user.patientId || user.nationalId || user.userId || user.id;
      const isOwner = document.patientId && String(document.patientId) === String(userPatientId);

      if (!isOwner) {
        return {
          allowed: false,
          reason: 'Access denied: Patient cannot access another patient’s documents.'
        };
      }

      // Unreleased documents gate (Section 31)
      if (document.status !== 'RELEASED') {
        return {
          allowed: false,
          reason: 'Access denied: Document is not in RELEASED status.'
        };
      }

      // Confidentiality gate (Section 34)
      if (document.confidentiality && document.confidentiality !== 'NORMAL') {
        return {
          allowed: false,
          reason: 'Access denied: Restricted confidentiality level.'
        };
      }

      // Internal document categories prohibition (Section 32)
      const internalCategories = ['HR', 'RPA', 'OPERATIONS', 'PROCUREMENT', 'VENDOR', 'ADMINISTRATION'];
      if (internalCategories.includes(document.category)) {
        return {
          allowed: false,
          reason: 'Access denied: Internal hospital documents are not accessible to patients.'
        };
      }

      return { allowed: true };
    }

    // 3. STAFF / EMPLOYEE ROLE & DEPARTMENT RULES (Section 33, 104)
    // Confidentiality gate: HIGHLY_RESTRICTED (Section 34)
    if (document.confidentiality === 'HIGHLY_RESTRICTED') {
      const allowedRoles = ['SYSTEM_ADMIN', 'MEDICAL_DIRECTOR', 'HOSPITAL_ADMIN'];
      if (!allowedRoles.includes(role)) {
        return {
          allowed: false,
          reason: 'Access denied: Document is highly restricted.'
        };
      }
    }

    // Confidentiality gate: RESTRICTED (Section 34)
    if (document.confidentiality === 'RESTRICTED') {
      const userDept = user.department ? user.department.toUpperCase() : '';
      const docDept = document.department ? document.department.toUpperCase() : '';
      const privilegedRoles = ['DOCTOR', 'DEPARTMENT_HEAD', 'ADMIN', 'SYSTEM_ADMIN', 'MEDICAL_DIRECTOR'];

      if (!privilegedRoles.includes(role) && userDept !== docDept) {
        return {
          allowed: false,
          reason: `Access denied: Document is restricted to ${docDept || 'authorized'} department.`
        };
      }
    }

    // Check specific access roles if explicitly configured on document
    if (Array.isArray(document.accessRoles) && document.accessRoles.length > 0) {
      if (!document.accessRoles.includes(role) && !document.accessRoles.includes('*')) {
        return {
          allowed: false,
          reason: 'Access denied: Your role is not in the authorized access list for this document.'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Log document access / download attempt (Section 68, 97)
   */
  static async logAccess({
    documentId,
    documentType = '',
    title = '',
    user = {},
    action = 'VIEWED',
    status = 'SUCCESS',
    ipAddress = '127.0.0.1',
    userAgent = '',
    details = ''
  }) {
    try {
      const logId = `LOG-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

      const log = new DocumentAccessLog({
        logId,
        documentId,
        documentType,
        title,
        userId: user.username || user.userId || user.id || 'ANONYMOUS',
        userName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.username || 'System User'),
        role: user.role || 'GUEST',
        department: user.department || 'GENERAL',
        action,
        status,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || '',
        details,
        timestamp: new Date()
      });

      await log.save();
      return log;
    } catch (err) {
      console.error('[DocumentAccessService Log Error]:', err.message);
      return null;
    }
  }
}

module.exports = DocumentAccessService;
