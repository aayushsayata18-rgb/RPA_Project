const Feedback = require('../../models/Feedback');
const RPAJobService = require('../RPAJobService');
const ExceptionService = require('../ExceptionService');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const FeedbackRoutingService = require('./feedbackRoutingService');
const FeedbackSLAService = require('./feedbackSLAService');

class FeedbackRpaService {
  /**
   * Import complaint from external or legacy portal with duplicate protection
   * (Section 63, 73 of 25_PATIENT_FEEDBACK.md)
   */
  static async importExternalComplaint({
    externalSystem = 'LEGACY_HOSPITAL_PORTAL',
    externalReference,
    patientId = null,
    patientName = 'External Submitter',
    subject,
    description,
    category = 'General Care',
    type = 'COMPLAINT',
    priority = 'MEDIUM',
    idempotencyKey = null,
    user = { userId: 'RPA_SERVICE_WORKER', role: 'SYSTEM' }
  }) {
    if (!externalReference) {
      throw new Error('External reference identifier is required for RPA import.');
    }

    // Duplicate detection check
    const existing = await Feedback.findOne({
      'externalReference.system': externalSystem,
      'externalReference.referenceId': externalReference
    });

    if (existing) {
      console.log(`[FeedbackRpaService] Duplicate detected for externalRef ${externalReference}: Existing FB ${existing.feedbackId}`);
      return {
        feedback: existing,
        duplicateDetected: true,
        message: `Existing case ${existing.feedbackId} found for reference ${externalReference}. No duplicate created.`
      };
    }

    // Create tracking RPA Job
    const rpaJob = await RPAJobService.createJob({
      jobName: `Import Complaint ${externalReference}`,
      module: 'PATIENT_FEEDBACK',
      targetSystem: externalSystem,
      action: 'IMPORT_EXTERNAL_COMPLAINT',
      entityType: 'Feedback',
      entityId: externalReference,
      payload: { externalSystem, externalReference, subject, category, priority },
      idempotencyKey: idempotencyKey || `RPA-IMPORT-${externalSystem}-${externalReference}`,
      createdBy: user.userId
    });

    try {
      await RPAJobService.updateJobStatus({
        jobId: rpaJob.jobId,
        status: 'RUNNING'
      });

      const feedbackId = await IdGeneratorService.generateFeedbackId();

      // Resolve departmental routing
      const routing = await FeedbackRoutingService.resolveRouting(category, type);
      const confidentiality = FeedbackRoutingService.assessConfidentiality(category, subject, description);

      const feedback = new Feedback({
        feedbackId,
        patientId,
        patientName,
        type,
        category,
        source: 'LEGACY_HOSPITAL_SYSTEM',
        subject,
        description,
        priority,
        status: 'SUBMITTED',
        assignedDepartmentId: routing.departmentId,
        assignedDepartmentName: routing.departmentName,
        assignedTo: routing.assignedTo,
        assignedToName: routing.assignedToName,
        confidentiality,
        externalReference: {
          system: externalSystem,
          referenceId: externalReference,
          externalStatus: 'IMPORTED',
          lastSyncAt: new Date()
        },
        createdBy: user.userId
      });

      await feedback.save();

      // Initialize SLA timer
      await FeedbackSLAService.initializeSLA(feedbackId, priority, feedback.createdAt);

      await RPAJobService.updateJobStatus({
        jobId: rpaJob.jobId,
        status: 'SUCCESS',
        result: { feedbackId, externalReference, status: 'IMPORTED' }
      });

      await AuditService.logEvent({
        userId: user.userId,
        role: user.role,
        action: 'FEEDBACK_RPA_IMPORTED',
        module: 'PATIENT_FEEDBACK',
        entityType: 'Feedback',
        entityId: feedbackId,
        rpaJobId: rpaJob.jobId,
        details: `Imported external complaint from ${externalSystem} (Ref: ${externalReference}) as ${feedbackId}`
      });

      return {
        feedback,
        duplicateDetected: false,
        rpaJobId: rpaJob.jobId,
        message: 'Successfully imported external complaint.'
      };
    } catch (error) {
      await RPAJobService.updateJobStatus({
        jobId: rpaJob.jobId,
        status: 'FAILED',
        error: error.message
      });

      await ExceptionService.raiseException({
        module: 'PATIENT_FEEDBACK',
        entityType: 'RPAJob',
        entityId: rpaJob.jobId,
        rpaJobId: rpaJob.jobId,
        exceptionType: 'RPA_IMPORT_FAILURE',
        description: `Failed to import external complaint ${externalReference} from ${externalSystem}: ${error.message}`,
        severity: 'HIGH',
        source: 'RPA',
        metadata: { externalSystem, externalReference, error: error.message }
      });

      throw error;
    }
  }

  /**
   * Synchronize status with external complaint system
   */
  static async syncComplaintStatus({ feedbackId, externalStatus, externalNotes = '', user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    const rpaJob = await RPAJobService.createJob({
      jobName: `Sync Status for ${feedbackId}`,
      module: 'PATIENT_FEEDBACK',
      targetSystem: feedback.externalReference?.system || 'EXTERNAL_PORTAL',
      action: 'SYNC_COMPLAINT_STATUS',
      entityType: 'Feedback',
      entityId: feedbackId,
      payload: { feedbackId, externalStatus, externalNotes },
      createdBy: user.userId
    });

    feedback.externalReference = {
      ...feedback.externalReference,
      externalStatus,
      lastSyncAt: new Date()
    };
    await feedback.save();

    await RPAJobService.updateJobStatus({
      jobId: rpaJob.jobId,
      status: 'SUCCESS',
      result: { feedbackId, externalStatus, syncedAt: new Date() }
    });

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_RPA_STATUS_SYNCED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      rpaJobId: rpaJob.jobId,
      details: `Synced external status "${externalStatus}" for case ${feedbackId}`
    });

    return { feedback, rpaJobId: rpaJob.jobId };
  }

  /**
   * Reconcile external records and identify mismatches
   */
  static async reconcileExternalCases() {
    const externalCases = await Feedback.find({
      'externalReference.referenceId': { $ne: null }
    }).lean();

    let matched = 0;
    let exceptionsRaised = 0;

    for (const c of externalCases) {
      if (!c.externalReference.system) {
        exceptionsRaised++;
        await ExceptionService.raiseException({
          module: 'PATIENT_FEEDBACK',
          entityType: 'Feedback',
          entityId: c.feedbackId,
          exceptionType: 'MISSING_EXTERNAL_SYSTEM_MAPPING',
          description: `Case ${c.feedbackId} has reference ${c.externalReference.referenceId} but no external system mapped.`,
          severity: 'MEDIUM',
          source: 'RPA'
        });
      } else {
        matched++;
      }
    }

    return {
      totalExternalCases: externalCases.length,
      matched,
      exceptionsRaised
    };
  }
}

module.exports = FeedbackRpaService;
