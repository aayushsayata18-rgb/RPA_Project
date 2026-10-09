const AdmissionChecklist = require('../models/AdmissionChecklist');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');

class AdmissionChecklistService {
  /**
   * Default checklist definition
   */
  static getDefaultChecklistItems(isEmergency = false) {
    return [
      {
        code: 'PATIENT_IDENTITY_VERIFIED',
        title: 'Patient Identity Verified',
        category: 'IDENTITY',
        type: isEmergency ? 'CONDITIONAL' : 'REQUIRED',
        status: isEmergency ? 'PENDING' : 'COMPLETED',
        notes: isEmergency ? 'Emergency temporary record may require later identity verification' : 'Identity verified via master record'
      },
      {
        code: 'VISIT_VERIFIED',
        title: 'Hospital Visit Encounter Verified',
        category: 'CLINICAL',
        type: 'REQUIRED',
        status: 'COMPLETED',
        notes: 'Active hospital encounter linked'
      },
      {
        code: 'ADMISSION_REQUEST_VERIFIED',
        title: 'Admission Request Authorized by Clinical Staff',
        category: 'CLINICAL',
        type: 'REQUIRED',
        status: 'COMPLETED',
        notes: 'Doctor admission order & clinical requirement present'
      },
      {
        code: 'ACCOMMODATION_PREFERENCE_RECORDED',
        title: 'Accommodation Preference Recorded',
        category: 'ACCOMMODATION',
        type: 'REQUIRED',
        status: 'COMPLETED',
        notes: 'Category preference logged'
      },
      {
        code: 'BED_ASSIGNED',
        title: 'Physical Bed Allocated & Verified',
        category: 'ACCOMMODATION',
        type: 'REQUIRED',
        status: 'PENDING',
        notes: 'Awaiting bed allocation'
      },
      {
        code: 'INSURANCE_DETAILS_CHECKED',
        title: 'Insurance Information Recorded / Pre-Auth Initiated',
        category: 'FINANCIAL',
        type: isEmergency ? 'OPTIONAL' : 'CONDITIONAL',
        status: 'COMPLETED',
        notes: 'Financial & insurance check logged'
      },
      {
        code: 'BILLING_ACCOUNT_INITIALIZED',
        title: 'Inpatient Billing Encounter Initialized',
        category: 'FINANCIAL',
        type: 'REQUIRED',
        status: 'PENDING',
        notes: 'Awaiting final admission activation'
      },
      {
        code: 'ADMISSION_DOCUMENTS_READY',
        title: 'Admission Documentation Generated',
        category: 'DOCUMENTATION',
        type: 'REQUIRED',
        status: 'PENDING',
        notes: 'Admission confirmation document generation'
      },
      {
        code: 'NOTIFICATIONS_DISPATCHED',
        title: 'Patient & Department Notifications Dispatched',
        category: 'NOTIFICATION',
        type: 'REQUIRED',
        status: 'PENDING',
        notes: 'Department and relative notification queue'
      }
    ];
  }

  /**
   * Initialize a new admission checklist
   */
  static async initializeChecklist({ admissionRequestId, patientId, isEmergency = false, correlationId }) {
    const checklistId = await IdGeneratorService.generateChecklistId();
    const items = this.getDefaultChecklistItems(isEmergency);

    const checklist = await AdmissionChecklist.create({
      checklistId,
      admissionRequestId,
      patientId,
      items,
      allRequiredCompleted: false,
      overallStatus: 'PENDING',
      correlationId
    });

    return checklist;
  }

  /**
   * Update or complete a checklist item
   */
  static async updateItemStatus({ checklistId, code, status, notes = '', actorUser, correlationId }) {
    const checklist = await AdmissionChecklist.findOne({ checklistId });
    if (!checklist) {
      throw new Error(`Checklist ${checklistId} not found.`);
    }

    const item = checklist.items.find((i) => i.code === code);
    if (!item) {
      throw new Error(`Checklist item ${code} not found in checklist ${checklistId}.`);
    }

    item.status = status;
    if (status === 'COMPLETED') {
      item.completedBy = actorUser?.name || actorUser?.role || 'Authorized Staff';
      item.completedAt = new Date();
    }
    if (notes) {
      item.notes = notes;
    }

    // Check if all REQUIRED items are completed (or overridden)
    const pendingRequired = checklist.items.filter(
      (i) => i.type === 'REQUIRED' && i.status !== 'COMPLETED' && !i.isOverridden
    );

    checklist.allRequiredCompleted = pendingRequired.length === 0;
    if (checklist.allRequiredCompleted) {
      checklist.overallStatus = 'COMPLETED';
    }

    await checklist.save();

    await AuditService.logEvent({
      action: 'ADMISSION_CHECKLIST_UPDATED',
      category: 'ADMISSION',
      patientId: checklist.patientId,
      actorUserId: actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { checklistId, itemCode: code, status, allRequiredCompleted: checklist.allRequiredCompleted },
      correlationId: correlationId || checklist.correlationId
    });

    return checklist;
  }

  /**
   * Override a blocked or non-clinical checklist item (Authorized Administrative Role Required)
   */
  static async overrideItem({ checklistId, code, overrideReason, actorUser, correlationId }) {
    if (!overrideReason || overrideReason.trim().length < 5) {
      throw new Error('A detailed administrative justification is required to override checklist items.');
    }

    const checklist = await AdmissionChecklist.findOne({ checklistId });
    if (!checklist) {
      throw new Error(`Checklist ${checklistId} not found.`);
    }

    const item = checklist.items.find((i) => i.code === code);
    if (!item) {
      throw new Error(`Item ${code} not found.`);
    }

    item.isOverridden = true;
    item.overrideReason = overrideReason;
    item.overriddenBy = actorUser?.name || actorUser?.id || 'ADMIN_MANAGER';
    item.overriddenAt = new Date();
    item.status = 'COMPLETED';

    const pendingRequired = checklist.items.filter(
      (i) => i.type === 'REQUIRED' && i.status !== 'COMPLETED' && !i.isOverridden
    );

    checklist.allRequiredCompleted = pendingRequired.length === 0;
    if (checklist.allRequiredCompleted) {
      checklist.overallStatus = 'OVERRIDDEN';
    }

    await checklist.save();

    await AuditService.logEvent({
      action: 'ADMISSION_CHECKLIST_OVERRIDDEN',
      category: 'ADMISSION',
      patientId: checklist.patientId,
      actorUserId: actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { checklistId, itemCode: code, overrideReason },
      correlationId: correlationId || checklist.correlationId
    });

    return checklist;
  }
}

module.exports = AdmissionChecklistService;
