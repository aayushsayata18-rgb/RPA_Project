const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Registration = require('../models/Registration');
const EmergencyTemporaryRecord = require('../models/EmergencyTemporaryRecord');
const IdGeneratorService = require('./IdGeneratorService');
const PatientMatchingService = require('./PatientMatchingService');
const PatientService = require('./PatientService');
const NotificationService = require('./NotificationService');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');
const { validateRegistrationPayload } = require('../validators/registrationValidator');

class RegistrationService {
  /**
   * Main registration pipeline orchestrating validation, duplicate check, visit creation, notification & audit
   */
  static async processRegistration(payload, actor = null) {
    const validation = validateRegistrationPayload(payload);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    const { sanitized } = validation;
    const correlationId = IdGeneratorService.generateCorrelationId();

    // 1. If explicit existingPatientId is provided (e.g., front-desk selected existing patient)
    if (sanitized.existingPatientId) {
      const existingPatient = await Patient.findOne({ patientId: sanitized.existingPatientId });
      if (!existingPatient) {
        const err = new Error(`Patient with ID ${sanitized.existingPatientId} not found.`);
        err.statusCode = 404;
        throw err;
      }

      // Generate Visit & Registration IDs
      const visitId = await IdGeneratorService.generateVisitId();
      const registrationId = await IdGeneratorService.generateRegistrationId();

      const newVisit = new Visit({
        visitId,
        patientId: existingPatient.patientId,
        patientRef: existingPatient._id,
        visitType: sanitized.visitType,
        registrationId,
        appointmentId: sanitized.appointmentId,
        department: sanitized.department,
        chiefComplaint: sanitized.chiefComplaint,
        priority: sanitized.priority,
        registrationSource: sanitized.source,
        createdBy: actor?._id || null
      });
      await newVisit.save();

      const newRegistration = new Registration({
        registrationId,
        patientId: existingPatient.patientId,
        patientRef: existingPatient._id,
        visitId,
        visitRef: newVisit._id,
        source: sanitized.source,
        status: 'REGISTERED',
        identityMatchStatus: 'VERIFIED_MANUAL',
        submittedData: sanitized.patientData,
        submittedBy: actor?._id || null,
        submittedByName: actor?.name || actor?.email || 'Self / FrontDesk',
        correlationId
      });
      await newRegistration.save();

      // Non-blocking notification dispatch
      NotificationService.sendNotification({
        recipientPhone: existingPatient.mobile,
        recipientEmail: existingPatient.email,
        channel: 'SMS',
        event: 'PATIENT_REGISTRATION_COMPLETED',
        templateCode: 'PATIENT_REGISTRATION_COMPLETED',
        message: `Welcome back ${existingPatient.fullName}! New encounter visit ${visitId} created for Patient ID ${existingPatient.patientId}.`,
        variables: {
          patientName: existingPatient.fullName,
          patientId: existingPatient.patientId,
          visitId
        },
        entityType: 'REGISTRATION',
        entityId: registrationId,
        correlationId
      }).catch((e) => console.error('[Notification Dispatch Error]:', e.message));

      // Audit Logging
      await AuditService.logEvent({
        userId: actor?.userId || actor?.email || 'PATIENT_PORTAL',
        userEmail: actor?.email || null,
        role: actor?.role || 'PATIENT',
        action: 'REGISTRATION_COMPLETED',
        module: 'PATIENT_REGISTRATION',
        entityType: 'REGISTRATION',
        entityId: registrationId,
        correlationId,
        newValue: { patientId: existingPatient.patientId, visitId, isExistingPatient: true }
      });

      return {
        success: true,
        patientId: existingPatient.patientId,
        patientName: existingPatient.fullName,
        visitId,
        registrationId,
        status: 'REGISTERED',
        isExistingPatient: true,
        correlationId
      };
    }

    // 2. No explicit patient ID -> Perform Patient Master Duplicate Matching
    const matchResult = await PatientMatchingService.findMatches(sanitized.patientData);

    // Case A: High Confidence Match -> Reuse permanent Patient ID
    if (matchResult.matchStatus === 'HIGH_CONFIDENCE_MATCH' && matchResult.bestMatch) {
      const best = matchResult.bestMatch;
      const visitId = await IdGeneratorService.generateVisitId();
      const registrationId = await IdGeneratorService.generateRegistrationId();

      const newVisit = new Visit({
        visitId,
        patientId: best.patientId,
        patientRef: best._id,
        visitType: sanitized.visitType,
        registrationId,
        appointmentId: sanitized.appointmentId,
        department: sanitized.department,
        chiefComplaint: sanitized.chiefComplaint,
        priority: sanitized.priority,
        registrationSource: sanitized.source,
        createdBy: actor?._id || null
      });
      await newVisit.save();

      const newRegistration = new Registration({
        registrationId,
        patientId: best.patientId,
        patientRef: best._id,
        visitId,
        visitRef: newVisit._id,
        source: sanitized.source,
        status: 'REGISTERED',
        identityMatchStatus: 'HIGH_CONFIDENCE_MATCH',
        potentialMatches: matchResult.matches,
        submittedData: sanitized.patientData,
        submittedBy: actor?._id || null,
        submittedByName: actor?.name || actor?.email || 'Self / FrontDesk',
        correlationId
      });
      await newRegistration.save();

      NotificationService.sendNotification({
        recipientPhone: best.mobile,
        recipientEmail: best.email,
        channel: 'SMS',
        event: 'PATIENT_REGISTRATION_COMPLETED',
        templateCode: 'PATIENT_REGISTRATION_COMPLETED',
        message: `Welcome back ${best.fullName}! Your new visit encounter ${visitId} has been created under Patient ID ${best.patientId}.`,
        variables: {
          patientName: best.fullName,
          patientId: best.patientId,
          visitId
        },
        entityType: 'REGISTRATION',
        entityId: registrationId,
        correlationId
      }).catch((e) => console.error('[Notification Dispatch Error]:', e.message));

      await AuditService.logEvent({
        userId: actor?.userId || actor?.email || 'SYSTEM',
        userEmail: actor?.email || null,
        role: actor?.role || 'SYSTEM',
        action: 'REGISTRATION_COMPLETED',
        module: 'PATIENT_REGISTRATION',
        entityType: 'REGISTRATION',
        entityId: registrationId,
        correlationId,
        newValue: { patientId: best.patientId, visitId, isExistingPatient: true, matchScore: best.matchScore }
      });

      return {
        success: true,
        patientId: best.patientId,
        patientName: best.fullName,
        visitId,
        registrationId,
        status: 'REGISTERED',
        isExistingPatient: true,
        matchScore: best.matchScore,
        correlationId
      };
    }

    // Case B: Possible Match -> Stop & Create ExceptionCase for Human Review
    if (matchResult.matchStatus === 'POSSIBLE_MATCH') {
      const registrationId = await IdGeneratorService.generateRegistrationId();

      const newRegistration = new Registration({
        registrationId,
        patientId: 'PENDING_VERIFICATION',
        visitId: 'PENDING_VERIFICATION',
        source: sanitized.source,
        status: 'IDENTITY_VERIFICATION_REQUIRED',
        identityMatchStatus: 'POSSIBLE_MATCH',
        potentialMatches: matchResult.matches,
        submittedData: sanitized.patientData,
        submittedBy: actor?._id || null,
        submittedByName: actor?.name || actor?.email || 'Self / FrontDesk',
        correlationId
      });
      await newRegistration.save();

      // Create Exception Case
      await ExceptionService.createExceptionCase({
        type: 'PATIENT_IDENTITY_AMBIGUITY',
        severity: 'HIGH',
        priority: 'HIGH',
        module: 'PATIENT_REGISTRATION',
        entityType: 'REGISTRATION',
        entityId: registrationId,
        correlationId,
        details: `Ambiguous match found during registration for ${sanitized.patientData.firstName} ${sanitized.patientData.lastName} (Mobile: ${sanitized.patientData.mobile}). ${matchResult.matches.length} possible matching records detected. Requires human verification before Patient ID assignment.`
      });

      await AuditService.logEvent({
        userId: actor?.userId || actor?.email || 'SYSTEM',
        userEmail: actor?.email || null,
        role: actor?.role || 'SYSTEM',
        action: 'IDENTITY_REVIEW_CREATED',
        module: 'PATIENT_REGISTRATION',
        entityType: 'REGISTRATION',
        entityId: registrationId,
        correlationId,
        details: `Potential duplicate matches: ${matchResult.matches.map((m) => m.patientId).join(', ')}`
      });

      return {
        success: true,
        status: 'IDENTITY_VERIFICATION_REQUIRED',
        registrationId,
        potentialMatches: matchResult.matches,
        correlationId,
        message: 'Potential existing patient record(s) detected. Submission routed to Front-Desk Identity Review.'
      };
    }

    // Case C: No Match -> Create New Permanent Patient ID & Record
    const newPatient = await PatientService.createPatient(sanitized.patientData, actor);
    const visitId = await IdGeneratorService.generateVisitId();
    const registrationId = await IdGeneratorService.generateRegistrationId();

    const newVisit = new Visit({
      visitId,
      patientId: newPatient.patientId,
      patientRef: newPatient._id,
      visitType: sanitized.visitType,
      registrationId,
      appointmentId: sanitized.appointmentId,
      department: sanitized.department,
      chiefComplaint: sanitized.chiefComplaint,
      priority: sanitized.priority,
      registrationSource: sanitized.source,
      createdBy: actor?._id || null
    });
    await newVisit.save();

    const newRegistration = new Registration({
      registrationId,
      patientId: newPatient.patientId,
      patientRef: newPatient._id,
      visitId,
      visitRef: newVisit._id,
      source: sanitized.source,
      status: 'REGISTERED',
      identityMatchStatus: 'NO_MATCH',
      submittedData: sanitized.patientData,
      submittedBy: actor?._id || null,
      submittedByName: actor?.name || actor?.email || 'Self / FrontDesk',
      correlationId
    });
    await newRegistration.save();

    NotificationService.sendNotification({
      recipientPhone: newPatient.mobile,
      recipientEmail: newPatient.email,
      channel: 'SMS',
      event: 'PATIENT_REGISTRATION_COMPLETED',
      templateCode: 'PATIENT_REGISTRATION_COMPLETED',
      message: `Welcome to Hospital Administrative Platform, ${newPatient.fullName}! Your permanent Patient ID is ${newPatient.patientId}, and initial Visit ID is ${visitId}.`,
      variables: {
        patientName: newPatient.fullName,
        patientId: newPatient.patientId,
        visitId
      },
      entityType: 'REGISTRATION',
      entityId: registrationId,
      correlationId
    }).catch((e) => console.error('[Notification Dispatch Error]:', e.message));

    await AuditService.logEvent({
      userId: actor?.userId || actor?.email || 'SYSTEM',
      userEmail: actor?.email || null,
      role: actor?.role || 'SYSTEM',
      action: 'REGISTRATION_COMPLETED',
      module: 'PATIENT_REGISTRATION',
      entityType: 'REGISTRATION',
      entityId: registrationId,
      correlationId,
      newValue: { patientId: newPatient.patientId, visitId, isExistingPatient: false }
    });

    return {
      success: true,
      patientId: newPatient.patientId,
      patientName: newPatient.fullName,
      visitId,
      registrationId,
      status: 'REGISTERED',
      isExistingPatient: false,
      correlationId
    };
  }

  /**
   * Human review of ambiguous registration match
   */
  static async reviewAmbiguousRegistration(registrationId, { decision, selectedPatientId, reviewNotes }, actor) {
    const registration = await Registration.findOne({ registrationId });
    if (!registration) {
      const err = new Error(`Registration ${registrationId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (registration.status !== 'IDENTITY_VERIFICATION_REQUIRED') {
      const err = new Error(`Registration is not in IDENTITY_VERIFICATION_REQUIRED status (current: ${registration.status}).`);
      err.statusCode = 400;
      throw err;
    }

    let resolvedPatientId = null;
    let resolvedVisitId = null;

    if (decision === 'CONFIRM_EXISTING') {
      if (!selectedPatientId) {
        const err = new Error('selectedPatientId is required when decision is CONFIRM_EXISTING.');
        err.statusCode = 400;
        throw err;
      }
      const existing = await Patient.findOne({ patientId: selectedPatientId });
      if (!existing) {
        const err = new Error(`Patient ${selectedPatientId} not found.`);
        err.statusCode = 404;
        throw err;
      }

      resolvedPatientId = existing.patientId;
      resolvedVisitId = await IdGeneratorService.generateVisitId();

      const newVisit = new Visit({
        visitId: resolvedVisitId,
        patientId: existing.patientId,
        patientRef: existing._id,
        visitType: 'OPD',
        registrationId,
        registrationSource: registration.source,
        createdBy: actor?._id || null
      });
      await newVisit.save();

      registration.patientId = resolvedPatientId;
      registration.patientRef = existing._id;
      registration.visitId = resolvedVisitId;
      registration.visitRef = newVisit._id;
      registration.status = 'REGISTERED';
      registration.identityMatchStatus = 'VERIFIED_MANUAL';
      registration.reviewedBy = actor?._id || null;
      registration.reviewedByName = actor?.name || actor?.email || 'Staff Reviewer';
      registration.reviewedAt = new Date();
      registration.reviewNotes = reviewNotes || 'Confirmed existing patient identity during human review.';
      await registration.save();

      await AuditService.logEvent({
        userId: actor?.userId || actor?.email || 'STAFF',
        userEmail: actor?.email || null,
        role: actor?.role || 'STAFF',
        action: 'IDENTITY_REVIEW_APPROVED',
        module: 'PATIENT_REGISTRATION',
        entityType: 'REGISTRATION',
        entityId: registrationId,
        correlationId: registration.correlationId,
        details: `Linked to existing patient ${resolvedPatientId}. Notes: ${reviewNotes || ''}`
      });
    } else if (decision === 'CREATE_NEW') {
      const newPatient = await PatientService.createPatient(registration.submittedData, actor);
      resolvedPatientId = newPatient.patientId;
      resolvedVisitId = await IdGeneratorService.generateVisitId();

      const newVisit = new Visit({
        visitId: resolvedVisitId,
        patientId: newPatient.patientId,
        patientRef: newPatient._id,
        visitType: 'OPD',
        registrationId,
        registrationSource: registration.source,
        createdBy: actor?._id || null
      });
      await newVisit.save();

      registration.patientId = resolvedPatientId;
      registration.patientRef = newPatient._id;
      registration.visitId = resolvedVisitId;
      registration.visitRef = newVisit._id;
      registration.status = 'REGISTERED';
      registration.identityMatchStatus = 'VERIFIED_MANUAL';
      registration.reviewedBy = actor?._id || null;
      registration.reviewedByName = actor?.name || actor?.email || 'Staff Reviewer';
      registration.reviewedAt = new Date();
      registration.reviewNotes = reviewNotes || 'Approved as distinct new patient during human review.';
      await registration.save();

      await AuditService.logEvent({
        userId: actor?.userId || actor?.email || 'STAFF',
        userEmail: actor?.email || null,
        role: actor?.role || 'STAFF',
        action: 'IDENTITY_REVIEW_APPROVED',
        module: 'PATIENT_REGISTRATION',
        entityType: 'REGISTRATION',
        entityId: registrationId,
        correlationId: registration.correlationId,
        details: `Created new patient ${resolvedPatientId}. Notes: ${reviewNotes || ''}`
      });
    } else if (decision === 'REJECT') {
      registration.status = 'CANCELLED';
      registration.reviewedBy = actor?._id || null;
      registration.reviewedByName = actor?.name || actor?.email || 'Staff Reviewer';
      registration.reviewedAt = new Date();
      registration.reviewNotes = reviewNotes || 'Registration rejected during identity review.';
      await registration.save();

      await AuditService.logEvent({
        userId: actor?.userId || actor?.email || 'STAFF',
        userEmail: actor?.email || null,
        role: actor?.role || 'STAFF',
        action: 'IDENTITY_REVIEW_REJECTED',
        module: 'PATIENT_REGISTRATION',
        entityType: 'REGISTRATION',
        entityId: registrationId,
        correlationId: registration.correlationId,
        details: `Registration rejected. Reason: ${reviewNotes || ''}`
      });
    } else {
      const err = new Error(`Unsupported review decision: ${decision}. Use CONFIRM_EXISTING, CREATE_NEW, or REJECT.`);
      err.statusCode = 400;
      throw err;
    }

    return {
      success: true,
      decision,
      registrationId,
      patientId: resolvedPatientId,
      visitId: resolvedVisitId,
      status: registration.status
    };
  }

  /**
   * Emergency Registration workflow (with automatic Patient Master check and Temporary ID issuance)
   */
  static async processEmergencyRegistration(payload, actor = null) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const { provisionalName, estimatedAge, gender, apparentCondition, broughtBy, priority = 'EMERGENCY', notes } = payload;

    // Check if phone or exact identity information is provided
    if (payload.mobile) {
      const matchResult = await PatientMatchingService.findMatches({
        mobile: payload.mobile,
        firstName: provisionalName?.split(' ')[0] || '',
        lastName: provisionalName?.split(' ')[1] || ''
      });

      if (matchResult.matchStatus === 'HIGH_CONFIDENCE_MATCH' && matchResult.bestMatch) {
        const best = matchResult.bestMatch;
        const emergencyVisitId = await IdGeneratorService.generateVisitId();

        const visit = new Visit({
          visitId: emergencyVisitId,
          patientId: best.patientId,
          patientRef: best._id,
          visitType: 'EMERGENCY',
          priority: 'EMERGENCY',
          department: 'EMERGENCY_AND_TRAUMA',
          chiefComplaint: apparentCondition || 'Emergency trauma intake',
          registrationSource: 'EMERGENCY',
          notes: notes || '',
          createdBy: actor?._id || null
        });
        await visit.save();

        await AuditService.logEvent({
          userId: actor?.userId || actor?.email || 'EMERGENCY_DESK',
          userEmail: actor?.email || null,
          role: actor?.role || 'RECEPTIONIST',
          action: 'VISIT_CREATED',
          module: 'PATIENT_REGISTRATION',
          entityType: 'VISIT',
          entityId: emergencyVisitId,
          correlationId,
          newValue: { patientId: best.patientId, visitType: 'EMERGENCY', isExistingPatient: true }
        });

        return {
          success: true,
          isTemporary: false,
          patientId: best.patientId,
          patientName: best.fullName,
          visitId: emergencyVisitId,
          status: 'REGISTERED',
          correlationId
        };
      }
    }

    // No confident match -> Create Temporary Emergency ID
    const temporaryEmergencyId = await IdGeneratorService.generateTemporaryEmergencyId();
    const temporaryId = `TEMPREC-${Date.now()}`;
    const emergencyVisitId = await IdGeneratorService.generateVisitId();

    const emergencyRecord = new EmergencyTemporaryRecord({
      temporaryId,
      temporaryEmergencyId,
      provisionalName: provisionalName || 'Unknown Emergency Patient',
      estimatedAge: estimatedAge ? Number(estimatedAge) : null,
      gender: gender || 'UNDISCLOSED',
      apparentCondition: apparentCondition || '',
      broughtBy: broughtBy || { name: '', relationship: '', contact: '' },
      emergencyVisitId,
      status: 'ACTIVE',
      identityVerificationStatus: 'PENDING',
      correlationId,
      notes: notes || '',
      createdBy: actor?._id || null
    });
    await emergencyRecord.save();

    const emergencyVisit = new Visit({
      visitId: emergencyVisitId,
      patientId: temporaryEmergencyId,
      visitType: 'EMERGENCY',
      priority: 'EMERGENCY',
      department: 'EMERGENCY_AND_TRAUMA',
      chiefComplaint: apparentCondition || 'Emergency intake under temporary identity',
      registrationSource: 'EMERGENCY',
      notes: `Temporary Emergency Encounter: ${temporaryEmergencyId}. Patient: ${provisionalName || 'Unknown'}`,
      createdBy: actor?._id || null
    });
    await emergencyVisit.save();

    await AuditService.logEvent({
      userId: actor?.userId || actor?.email || 'EMERGENCY_DESK',
      userEmail: actor?.email || null,
      role: actor?.role || 'RECEPTIONIST',
      action: 'TEMPORARY_EMERGENCY_CREATED',
      module: 'PATIENT_REGISTRATION',
      entityType: 'EMERGENCY_RECORD',
      entityId: temporaryEmergencyId,
      correlationId,
      newValue: { temporaryEmergencyId, emergencyVisitId, provisionalName: emergencyRecord.provisionalName }
    });

    return {
      success: true,
      isTemporary: true,
      temporaryEmergencyId,
      provisionalName: emergencyRecord.provisionalName,
      visitId: emergencyVisitId,
      status: 'TEMPORARY_EMERGENCY_CREATED',
      correlationId
    };
  }

  /**
   * Link an Emergency Temporary Record to a permanent Patient Master identity
   */
  static async linkEmergencyRecord(temporaryEmergencyId, { targetPatientId, newPatientData }, actor = null) {
    const tempRecord = await EmergencyTemporaryRecord.findOne({ temporaryEmergencyId });
    if (!tempRecord) {
      const err = new Error(`Emergency Temporary Record with ID ${temporaryEmergencyId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (tempRecord.status === 'LINKED') {
      const err = new Error(`Emergency Temporary Record ${temporaryEmergencyId} is already linked to Patient ${tempRecord.linkedPatientId}.`);
      err.statusCode = 400;
      throw err;
    }

    let targetPatient = null;
    if (targetPatientId) {
      targetPatient = await Patient.findOne({ patientId: targetPatientId });
      if (!targetPatient) {
        const err = new Error(`Target Patient ID ${targetPatientId} not found in Patient Master.`);
        err.statusCode = 404;
        throw err;
      }
    } else if (newPatientData) {
      targetPatient = await PatientService.createPatient(newPatientData, actor);
    } else {
      const err = new Error('Either targetPatientId or newPatientData must be provided to link temporary record.');
      err.statusCode = 400;
      throw err;
    }

    // Link temporary record
    tempRecord.linkedPatientId = targetPatient.patientId;
    tempRecord.linkedPatientRef = targetPatient._id;
    tempRecord.status = 'LINKED';
    tempRecord.identityVerificationStatus = 'VERIFIED';
    tempRecord.linkedAt = new Date();
    tempRecord.linkedBy = actor?._id || null;
    await tempRecord.save();

    // Re-link the corresponding visit to point to permanent patientId while preserving history
    await Visit.updateMany(
      { patientId: temporaryEmergencyId },
      {
        $set: {
          patientId: targetPatient.patientId,
          patientRef: targetPatient._id,
          notes: `Linked from temporary identity ${temporaryEmergencyId}`
        }
      }
    );

    await AuditService.logEvent({
      userId: actor?.userId || actor?.email || 'STAFF',
      userEmail: actor?.email || null,
      role: actor?.role || 'STAFF',
      action: 'TEMPORARY_EMERGENCY_LINKED',
      module: 'PATIENT_REGISTRATION',
      entityType: 'EMERGENCY_RECORD',
      entityId: temporaryEmergencyId,
      newValue: { temporaryEmergencyId, permanentPatientId: targetPatient.patientId }
    });

    return {
      success: true,
      temporaryEmergencyId,
      permanentPatientId: targetPatient.patientId,
      permanentPatientName: targetPatient.fullName,
      linkedAt: tempRecord.linkedAt,
      message: `Emergency record ${temporaryEmergencyId} successfully linked to permanent Patient ID ${targetPatient.patientId}.`
    };
  }

  /**
   * Get registration list with filters & pagination
   */
  static async getRegistrations({ status, source, page = 1, limit = 20 }) {
    const filter = {};
    if (status) filter.status = status;
    if (source) filter.source = source;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [registrations, total] = await Promise.all([
      Registration.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Registration.countDocuments(filter)
    ]);

    return {
      registrations,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }
}

module.exports = RegistrationService;
