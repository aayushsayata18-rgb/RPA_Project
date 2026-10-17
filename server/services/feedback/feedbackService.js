const Feedback = require('../../models/Feedback');
const FeedbackInternalNote = require('../../models/FeedbackInternalNote');
const FeedbackAssignmentHistory = require('../../models/FeedbackAssignmentHistory');
const FeedbackInvestigation = require('../../models/FeedbackInvestigation');
const FeedbackSLA = require('../../models/FeedbackSLA');
const Department = require('../../models/Department');
const User = require('../../models/User');
const Patient = require('../../models/Patient');

const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

const FeedbackValidator = require('../../validators/feedbackValidator');
const FeedbackRoutingService = require('./feedbackRoutingService');
const FeedbackSLAService = require('./feedbackSLAService');

class FeedbackService {
  /**
   * Submit new feedback or formal complaint
   */
  static async submitFeedback(data, user = null) {
    // 1. Validation
    const validation = FeedbackValidator.validateSubmission(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    const feedbackId = await IdGeneratorService.generateFeedbackId();
    const isAnonymous = Boolean(data.anonymous);

    // Resolve patient details
    let resolvedPatientId = null;
    let resolvedPatientName = isAnonymous ? 'Anonymous Patient' : data.patientName || 'Anonymous';
    let resolvedPatientEmail = isAnonymous ? null : data.patientEmail || null;
    let resolvedPatientPhone = isAnonymous ? null : data.patientPhone || null;

    if (!isAnonymous && user) {
      if (user.role === 'PATIENT') {
        resolvedPatientId = user.linkedEntityId || user.userId;
        resolvedPatientName = `${user.firstName} ${user.lastName}`;
        resolvedPatientEmail = user.email;
        resolvedPatientPhone = user.phoneNumber;
      } else if (data.patientId) {
        resolvedPatientId = data.patientId;
        const patientDoc = await Patient.findOne({ patientId: data.patientId }).lean();
        if (patientDoc) {
          resolvedPatientName = `${patientDoc.firstName} ${patientDoc.lastName}`;
          resolvedPatientEmail = patientDoc.email;
          resolvedPatientPhone = patientDoc.phoneNumber;
        }
      }
    } else if (!isAnonymous && data.patientId) {
      resolvedPatientId = data.patientId;
    }

    const type = data.type || 'SERVICE_FEEDBACK';
    const priority = data.priority || (type === 'COMPLAINT' ? 'MEDIUM' : 'LOW');

    // 2. Automated routing & confidentiality assessment
    const routing = await FeedbackRoutingService.resolveRouting(data.category, type);
    const confidentiality = data.confidentiality || FeedbackRoutingService.assessConfidentiality(
      data.category,
      data.subject,
      data.description
    );

    const feedback = new Feedback({
      feedbackId,
      patientId: resolvedPatientId,
      patientName: resolvedPatientName,
      patientEmail: resolvedPatientEmail,
      patientPhone: resolvedPatientPhone,
      visitId: data.visitId || null,
      appointmentId: data.appointmentId || null,
      admissionId: data.admissionId || null,
      invoiceId: data.invoiceId || null,
      type,
      category: data.category,
      subcategory: data.subcategory || null,
      source: data.source || (user?.role === 'PATIENT' ? 'PATIENT_PORTAL' : 'AUTHORIZED_STAFF_ENTRY'),
      subject: data.subject.trim(),
      description: data.description.trim(),
      rating: data.rating ? Number(data.rating) : null,
      departmentId: data.departmentId || routing.departmentId,
      departmentName: data.departmentName || routing.departmentName,
      assignedDepartmentId: data.assignedDepartmentId || routing.departmentId,
      assignedDepartmentName: data.assignedDepartmentName || routing.departmentName,
      assignedTo: data.assignedTo || routing.assignedTo,
      assignedToName: data.assignedToName || routing.assignedToName,
      priority,
      status: 'SUBMITTED',
      confidentiality,
      anonymous: isAnonymous,
      tags: data.tags || [],
      createdBy: user?.userId || 'GUEST_USER'
    });

    await feedback.save();

    // 3. Initialize SLA record
    await FeedbackSLAService.initializeSLA(feedbackId, priority, feedback.createdAt);

    // 4. Send Acknowledgement Notification to Patient (if not anonymous)
    if (!isAnonymous && (resolvedPatientId || resolvedPatientPhone || resolvedPatientEmail)) {
      await NotificationService.sendNotification({
        recipientId: resolvedPatientId,
        recipientPhone: resolvedPatientPhone,
        recipientEmail: resolvedPatientEmail,
        channel: 'IN_APP',
        event: 'FEEDBACK_RECEIVED',
        title: `Feedback Received: ${feedbackId}`,
        message: `Your feedback regarding "${feedback.subject}" has been registered under Case ID ${feedbackId}. You can track status in the patient portal.`,
        entityType: 'Feedback',
        entityId: feedbackId
      });
    }

    // 5. Notify assigned manager/staff
    if (feedback.assignedTo) {
      await NotificationService.sendNotification({
        recipientId: feedback.assignedTo,
        channel: 'IN_APP',
        event: 'FEEDBACK_ASSIGNED',
        title: `New Case Assigned: ${feedbackId}`,
        message: `A new ${feedback.type} (${feedback.priority}) has been routed to your queue: "${feedback.subject}".`,
        entityType: 'Feedback',
        entityId: feedbackId
      });
    }

    // 6. Audit Trail
    await AuditService.logEvent({
      userId: user?.userId || 'SYSTEM',
      role: user?.role || 'PATIENT',
      action: 'FEEDBACK_SUBMITTED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `${feedback.type} submitted: ${feedback.subject} (ID: ${feedbackId})`
    });

    return feedback;
  }

  /**
   * List feedback with pagination, filtering, and role-based access checks
   */
  static async getFeedbackList({
    page = 1,
    limit = 20,
    status,
    type,
    category,
    departmentId,
    priority,
    assignedTo,
    source,
    slaStatus,
    dateFrom,
    dateTo,
    search,
    user
  }) {
    const query = {};

    // Patient isolation: patients only see their own
    if (user?.role === 'PATIENT') {
      const patientId = user.linkedEntityId || user.userId;
      query.$or = [{ patientId }, { patientId: user.userId }];
    } else if (user) {
      // Confidentiality restrictions for staff
      const administrativeRoles = ['ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'SYSTEM_ADMIN'];
      if (!administrativeRoles.includes(user.role)) {
        // Normal staff can only see NORMAL cases, unless assigned to them
        query.$or = [
          { 'confidentiality.level': 'NORMAL' },
          { assignedTo: user.userId }
        ];
        // If department manager, filter by department
        if (user.departmentId) {
          query.$or.push({ assignedDepartmentId: user.departmentId });
        }
      }
    }

    if (status) query.status = status;
    if (type) query.type = type;
    if (category) query.category = category;
    if (departmentId) query.assignedDepartmentId = departmentId;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (source) query.source = source;
    if (slaStatus) query.slaStatus = slaStatus;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { feedbackId: new RegExp(term, 'i') },
          { subject: new RegExp(term, 'i') },
          { description: new RegExp(term, 'i') },
          { patientName: new RegExp(term, 'i') },
          { category: new RegExp(term, 'i') }
        ]
      });
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      Feedback.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Feedback.countDocuments(query)
    ]);

    return {
      items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get single feedback dossier by feedbackId
   */
  static async getFeedbackById(feedbackId, user) {
    const feedback = await Feedback.findOne({ feedbackId }).lean();
    if (!feedback) {
      const err = new Error(`Feedback case ${feedbackId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    // Access authorization check
    if (user && !FeedbackValidator.canAccessFeedback(feedback, user)) {
      const err = new Error('Access denied: You do not have permission to view this feedback dossier.');
      err.statusCode = 403;
      throw err;
    }

    // Fetch related records
    const isPatient = user?.role === 'PATIENT';
    const isAnonymousLookup = !user;

    // Internal notes are strictly forbidden for patients or public tracking
    let internalNotes = [];
    if (!isPatient && !isAnonymousLookup) {
      internalNotes = await FeedbackInternalNote.find({ feedbackId })
        .sort({ createdAt: -1 })
        .lean();
    }

    const [investigation, assignmentHistory, slaRecord] = await Promise.all([
      FeedbackInvestigation.findOne({ feedbackId }).lean(),
      FeedbackAssignmentHistory.find({ feedbackId }).sort({ assignedAt: -1 }).lean(),
      FeedbackSLA.findOne({ feedbackId }).lean()
    ]);

    // If patient or anonymous, strip internal-only details
    if (isPatient || isAnonymousLookup) {
      return {
        ...feedback,
        internalNotes: [],
        investigation: investigation
          ? {
              status: investigation.status,
              startedAt: investigation.startedAt,
              dueAt: investigation.dueAt
            }
          : null,
        assignmentHistory: []
      };
    }

    return {
      ...feedback,
      internalNotes,
      investigation,
      assignmentHistory,
      slaRecord
    };
  }

  /**
   * Assign or reassign feedback to department / user
   */
  static async assignFeedback({ feedbackId, departmentId, departmentName, assignedTo, assignedToName, reason = '', user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    const assignmentId = await IdGeneratorService.generateAssignmentId();

    const historyRecord = new FeedbackAssignmentHistory({
      assignmentId,
      feedbackId,
      fromDepartmentId: feedback.assignedDepartmentId,
      fromDepartmentName: feedback.assignedDepartmentName,
      toDepartmentId: departmentId || feedback.assignedDepartmentId,
      toDepartmentName: departmentName || feedback.assignedDepartmentName,
      fromUserId: feedback.assignedTo,
      fromUserName: feedback.assignedToName,
      toUserId: assignedTo || feedback.assignedTo,
      toUserName: assignedToName || feedback.assignedToName,
      reason,
      assignedBy: user.userId,
      assignedByName: `${user.firstName} ${user.lastName}`
    });

    await historyRecord.save();

    feedback.assignedDepartmentId = departmentId || feedback.assignedDepartmentId;
    if (departmentName) feedback.assignedDepartmentName = departmentName;
    feedback.assignedTo = assignedTo || feedback.assignedTo;
    if (assignedToName) feedback.assignedToName = assignedToName;
    if (['SUBMITTED', 'DRAFT'].includes(feedback.status)) {
      feedback.status = 'ASSIGNED';
    }

    await feedback.save();

    // Notify assigned staff
    if (assignedTo) {
      await NotificationService.sendNotification({
        recipientId: assignedTo,
        channel: 'IN_APP',
        event: 'FEEDBACK_ASSIGNED',
        title: `Feedback Assigned: ${feedbackId}`,
        message: `Case ${feedbackId} has been reassigned to you. Reason: ${reason || 'Operational routing'}`,
        entityType: 'Feedback',
        entityId: feedbackId
      });
    }

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_REASSIGNED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `Reassigned to ${feedback.assignedToName || feedback.assignedDepartmentName}: ${reason}`
    });

    return feedback;
  }

  /**
   * Change priority and re-adjust SLA
   */
  static async changePriority({ feedbackId, priority, user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    const previousPriority = feedback.priority;
    feedback.priority = priority;

    // Recalculate SLA
    const { dueAt } = await FeedbackSLAService.initializeSLA(feedbackId, priority, feedback.createdAt);
    feedback.dueAt = dueAt;
    await feedback.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_PRIORITY_CHANGED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      oldValue: { priority: previousPriority },
      newValue: { priority, dueAt },
      details: `Priority changed from ${previousPriority} to ${priority} by ${user.firstName}`
    });

    return feedback;
  }

  /**
   * Add private internal note
   */
  static async addInternalNote({ feedbackId, note, visibility = 'INTERNAL', user }) {
    if (!note || !String(note).trim()) {
      throw new Error('Note text cannot be empty.');
    }

    const noteId = await IdGeneratorService.generateFeedbackNoteId();

    const internalNote = new FeedbackInternalNote({
      noteId,
      feedbackId,
      authorId: user.userId,
      authorName: `${user.firstName} ${user.lastName}`,
      authorRole: user.role,
      note: note.trim(),
      visibility
    });

    await internalNote.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_INTERNAL_NOTE_ADDED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'FeedbackInternalNote',
      entityId: noteId,
      details: `Internal note (${visibility}) added to feedback ${feedbackId}`
    });

    return internalNote;
  }

  /**
   * Attach document metadata to feedback
   */
  static async addAttachment({ feedbackId, attachment, user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    const newAttachment = {
      documentId: attachment.documentId || `DOC-${Date.now()}`,
      name: attachment.name || 'Attachment',
      url: attachment.url || '',
      fileType: attachment.fileType || 'application/pdf',
      sizeBytes: attachment.sizeBytes || 0,
      uploadedBy: user.userId,
      uploadedAt: new Date()
    };

    feedback.attachments.push(newAttachment);
    await feedback.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_ATTACHMENT_ADDED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `Attachment ${newAttachment.name} added to feedback ${feedbackId}`
    });

    return feedback;
  }

  /**
   * Escalate complaint manually
   */
  static async escalateFeedback({ feedbackId, reason = 'Administrative escalation', targetRole = 'ADMIN_MANAGER', user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    feedback.status = 'ESCALATED';
    await feedback.save();

    await FeedbackSLA.findOneAndUpdate(
      { feedbackId },
      {
        $push: {
          escalationHistory: {
            escalatedAt: new Date(),
            escalatedBy: user.userId,
            reason,
            targetRole
          }
        }
      }
    );

    // Notify administrators
    await NotificationService.sendNotification({
      recipientId: targetRole,
      channel: 'IN_APP',
      event: 'FEEDBACK_ESCALATED',
      title: `[ESCALATED] Case ${feedbackId}`,
      message: `Case ${feedbackId} has been manually escalated: "${reason}". Immediate review recommended.`,
      entityType: 'Feedback',
      entityId: feedbackId
    });

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_ESCALATED',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `Case ${feedbackId} escalated: ${reason}`
    });

    return feedback;
  }

  /**
   * Withdraw feedback by patient request
   */
  static async withdrawFeedback({ feedbackId, reason = 'Withdrawn by patient', user }) {
    const feedback = await Feedback.findOne({ feedbackId });
    if (!feedback) throw new Error(`Feedback ${feedbackId} not found.`);

    feedback.status = 'WITHDRAWN';
    await feedback.save();

    await AuditService.logEvent({
      userId: user.userId,
      role: user.role,
      action: 'FEEDBACK_WITHDRAWN',
      module: 'PATIENT_FEEDBACK',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: `Feedback ${feedbackId} withdrawn: ${reason}`
    });

    return feedback;
  }
}

module.exports = FeedbackService;
