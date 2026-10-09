const mongoose = require('mongoose');
const AdmissionRequest = require('../models/AdmissionRequest');
const Admission = require('../models/Admission');
const AdmissionChecklist = require('../models/AdmissionChecklist');
const AdmissionHistory = require('../models/AdmissionHistory');
const Bed = require('../models/Bed');
const Ward = require('../models/Ward');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const EmergencyTemporaryRecord = require('../models/EmergencyTemporaryRecord');
const IdGeneratorService = require('./IdGeneratorService');
const BedManagementService = require('./BedManagementService');
const AdmissionChecklistService = require('./AdmissionChecklistService');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');
const NotificationService = require('./NotificationService');
const DocumentService = require('./DocumentService');

class AdmissionService {
  /**
   * Check if patient currently has an active admission episode
   */
  static async getActiveAdmission(patientId) {
    if (!patientId) return null;
    const activeAdmission = await Admission.findOne({
      patientId,
      status: { $in: ['REQUESTED', 'APPROVED', 'BED_PENDING', 'BED_ASSIGNED', 'ADMITTED', 'TRANSFER_PENDING'] }
    }).lean();
    return activeAdmission;
  }

  /**
   * 1. CREATE ADMISSION REQUEST (OPD or Emergency)
   */
  static async createAdmissionRequest(data, actorUser) {
    const {
      patientId,
      visitId,
      source = 'OPD',
      requestedBy,
      requestingDoctorId,
      requestingDepartmentId,
      clinicalRequirementReference,
      clinicalRequiredCategory = 'GENERAL_WARD',
      accommodationPreference = 'GENERAL_WARD',
      priority = 'NORMAL',
      notes = '',
      correlationId: providedCorrId
    } = data;

    const correlationId = providedCorrId || IdGeneratorService.generateCorrelationId();

    if (!patientId || !visitId || !clinicalRequirementReference) {
      throw new Error('Missing required fields: patientId, visitId, and clinicalRequirementReference are mandatory.');
    }

    // Step 1: Verify patient or emergency temporary identity
    let patient = await Patient.findOne({ patientId });
    let tempRecord = null;
    let patientName = '';

    if (patient) {
      patientName = patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.patientId;
    } else {
      tempRecord = await EmergencyTemporaryRecord.findOne({
        $or: [{ temporaryId: patientId }, { temporaryEmergencyId: patientId }]
      });
      if (tempRecord) {
        patientName = tempRecord.provisionalName || `Emergency Patient (${tempRecord.temporaryEmergencyId})`;
      } else {
        throw new Error(`Patient record for ID "${patientId}" was not found.`);
      }
    }

    // Step 2: Verify visit
    const visit = await Visit.findOne({ visitId });
    if (!visit) {
      throw new Error(`Visit record for ID "${visitId}" was not found.`);
    }

    // Step 3: Check Active Admission Prevention
    const existingActiveAdmission = await this.getActiveAdmission(patientId);
    if (existingActiveAdmission) {
      // Raise duplicate active admission exception
      const exc = await ExceptionService.createException({
        exceptionType: 'DUPLICATE_ACTIVE_ADMISSION',
        severity: 'HIGH',
        category: 'ADMISSION',
        referenceId: existingActiveAdmission.admissionId,
        patientId,
        description: `Patient ${patientId} (${patientName}) already has an active admission ${existingActiveAdmission.admissionId} (${existingActiveAdmission.status}).`,
        correlationId,
        actorUser
      });

      throw new Error(
        `DUPLICATE_ACTIVE_ADMISSION: Patient ${patientId} already has an active admission (${existingActiveAdmission.admissionId}). Exception ${exc?.exceptionId || ''} raised for administrative review.`
      );
    }

    // Check for existing pending request (Idempotency)
    const existingPendingReq = await AdmissionRequest.findOne({
      patientId,
      visitId,
      status: { $in: ['SUBMITTED', 'VALIDATING', 'PENDING_APPROVAL', 'APPROVED', 'BED_SEARCH', 'BED_PENDING', 'BED_ASSIGNED'] }
    });

    if (existingPendingReq) {
      return {
        isExisting: true,
        admissionRequest: existingPendingReq,
        message: 'An active admission request for this patient and visit already exists.'
      };
    }

    // Lookup Doctor details if requestedBy is a doctor
    let doctorName = '';
    const doctor = await Doctor.findOne({ doctorId: requestingDoctorId || requestedBy });
    if (doctor) {
      doctorName = doctor.name;
    }

    const admissionRequestId = await IdGeneratorService.generateAdmissionRequestId();

    // Create AdmissionRequest
    const admissionRequest = await AdmissionRequest.create({
      admissionRequestId,
      patientId,
      patientRef: patient?._id || null,
      patientName,
      visitId,
      visitRef: visit._id,
      source,
      requestedBy: requestedBy || actorUser?.userId || actorUser?.id || 'CLINICAL_STAFF',
      requestingDoctorId: requestingDoctorId || (doctor ? doctor.doctorId : null),
      requestingDoctorName: doctorName || actorUser?.name || 'Authorized Doctor',
      requestingDepartmentId: requestingDepartmentId || visit.department || 'DEP-GMED',
      clinicalRequirementReference,
      clinicalRequiredCategory,
      accommodationPreference,
      priority,
      status: source === 'EMERGENCY' ? 'APPROVED' : 'PENDING_APPROVAL',
      approvalStatus: source === 'EMERGENCY' ? 'APPROVED' : 'PENDING',
      approvedBy: source === 'EMERGENCY' ? (actorUser?.name || 'Emergency Protocol') : null,
      approvedAt: source === 'EMERGENCY' ? new Date() : null,
      correlationId,
      notes,
      createdBy: actorUser?._id || null
    });

    // Initialize Checklist
    const checklist = await AdmissionChecklistService.initializeChecklist({
      admissionRequestId,
      patientId,
      isEmergency: source === 'EMERGENCY',
      correlationId
    });

    // Record History
    await AdmissionHistory.create({
      admissionRequestId,
      patientId,
      previousStatus: null,
      newStatus: admissionRequest.status,
      action: 'ADMISSION_REQUEST_CREATED',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      actorName: actorUser?.name || 'Staff',
      details: { admissionRequestId, source, clinicalRequiredCategory, accommodationPreference },
      correlationId
    });

    // Audit Log
    await AuditService.logEvent({
      action: 'ADMISSION_REQUEST_CREATED',
      category: 'ADMISSION',
      patientId,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { admissionRequestId, visitId, source, accommodationPreference },
      correlationId
    });

    return {
      isExisting: false,
      admissionRequest,
      checklist
    };
  }

  /**
   * 2. APPROVE ADMISSION REQUEST (Role-based: DOCTOR, ADMIN_MANAGER, SYSTEM_ADMIN)
   */
  static async approveAdmissionRequest({ admissionRequestId, reason = 'Approved by authorized clinical/admin workflow', actorUser }) {
    const request = await AdmissionRequest.findOne({ admissionRequestId });
    if (!request) {
      throw new Error(`Admission request ${admissionRequestId} not found.`);
    }

    if (request.status === 'APPROVED' || request.status === 'BED_ASSIGNED' || request.status === 'ADMITTED') {
      return request;
    }

    if (request.status === 'REJECTED' || request.status === 'CANCELLED') {
      throw new Error(`Cannot approve admission request with status "${request.status}".`);
    }

    const prevStatus = request.status;
    request.status = 'APPROVED';
    request.approvalStatus = 'APPROVED';
    request.approvedBy = actorUser?.name || actorUser?.role || 'Authorized Approver';
    request.approvedAt = new Date();
    request.approvalNotes = reason;
    await request.save();

    await AdmissionHistory.create({
      admissionRequestId,
      patientId: request.patientId,
      previousStatus: prevStatus,
      newStatus: 'APPROVED',
      action: 'ADMISSION_REQUEST_APPROVED',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      actorName: actorUser?.name || 'Approver',
      reason,
      correlationId: request.correlationId
    });

    await AuditService.logEvent({
      action: 'ADMISSION_REQUEST_APPROVED',
      category: 'ADMISSION',
      patientId: request.patientId,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { admissionRequestId, reason },
      correlationId: request.correlationId
    });

    return request;
  }

  /**
   * 3. REJECT ADMISSION REQUEST
   * Note: Administrative rejection must never override an emergency clinical care requirement.
   */
  static async rejectAdmissionRequest({ admissionRequestId, reason, actorUser }) {
    if (!reason || reason.trim().length < 3) {
      throw new Error('Rejection reason is required.');
    }

    const request = await AdmissionRequest.findOne({ admissionRequestId });
    if (!request) {
      throw new Error(`Admission request ${admissionRequestId} not found.`);
    }

    if (request.source === 'EMERGENCY' && actorUser?.role !== 'DOCTOR' && actorUser?.role !== 'SYSTEM_ADMIN') {
      throw new Error('Administrative rejection cannot override an active emergency clinical admission.');
    }

    const prevStatus = request.status;
    request.status = 'REJECTED';
    request.approvalStatus = 'REJECTED';
    request.rejectionReason = reason;

    // Release any reserved bed
    if (request.assignedBedId) {
      await BedManagementService.releaseBedReservation({
        bedId: request.assignedBedId,
        admissionRequestId,
        actorUser,
        correlationId: request.correlationId
      });
      request.assignedBedId = null;
      request.assignedBedNumber = null;
    }

    await request.save();

    await AdmissionHistory.create({
      admissionRequestId,
      patientId: request.patientId,
      previousStatus: prevStatus,
      newStatus: 'REJECTED',
      action: 'ADMISSION_REQUEST_REJECTED',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      actorName: actorUser?.name || 'Staff',
      reason,
      correlationId: request.correlationId
    });

    await AuditService.logEvent({
      action: 'ADMISSION_REQUEST_REJECTED',
      category: 'ADMISSION',
      patientId: request.patientId,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { admissionRequestId, reason },
      correlationId: request.correlationId
    });

    return request;
  }

  /**
   * 4. CANCEL ADMISSION REQUEST
   */
  static async cancelAdmissionRequest({ admissionRequestId, reason = 'Cancelled by user', actorUser }) {
    const request = await AdmissionRequest.findOne({ admissionRequestId });
    if (!request) {
      throw new Error(`Admission request ${admissionRequestId} not found.`);
    }

    if (request.status === 'ADMITTED') {
      throw new Error('Cannot cancel an already completed admission episode. Use discharge workflow.');
    }

    const prevStatus = request.status;
    request.status = 'CANCELLED';
    request.cancellationReason = reason;

    if (request.assignedBedId) {
      await BedManagementService.releaseBedReservation({
        bedId: request.assignedBedId,
        admissionRequestId,
        actorUser,
        correlationId: request.correlationId
      });
      request.assignedBedId = null;
      request.assignedBedNumber = null;
    }

    await request.save();

    await AdmissionHistory.create({
      admissionRequestId,
      patientId: request.patientId,
      previousStatus: prevStatus,
      newStatus: 'CANCELLED',
      action: 'ADMISSION_REQUEST_CANCELLED',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      actorName: actorUser?.name || 'Staff',
      reason,
      correlationId: request.correlationId
    });

    await AuditService.logEvent({
      action: 'ADMISSION_REQUEST_CANCELLED',
      category: 'ADMISSION',
      patientId: request.patientId,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { admissionRequestId, reason },
      correlationId: request.correlationId
    });

    return request;
  }

  /**
   * 5. ASSIGN BED TO ADMISSION REQUEST
   * Reserves the physical bed and updates request status
   */
  static async assignBedToRequest({ admissionRequestId, bedId, actorUser }) {
    const request = await AdmissionRequest.findOne({ admissionRequestId });
    if (!request) {
      throw new Error(`Admission request ${admissionRequestId} not found.`);
    }

    if (['REJECTED', 'CANCELLED', 'ADMITTED'].includes(request.status)) {
      throw new Error(`Cannot assign bed to admission request with status "${request.status}".`);
    }

    const bed = await Bed.findOne({ bedId });
    if (!bed) {
      throw new Error(`Bed ${bedId} not found.`);
    }

    // Reserve the bed concurrency-safely
    const reservedBed = await BedManagementService.reserveBed({
      bedId,
      patientId: request.patientId,
      admissionRequestId,
      reservationDurationMinutes: 120,
      actorUser,
      correlationId: request.correlationId
    });

    const prevStatus = request.status;
    request.assignedWardId = reservedBed.wardId;
    request.assignedBedId = reservedBed.bedId;
    request.assignedBedNumber = reservedBed.bedNumber;
    request.status = 'BED_ASSIGNED';
    await request.save();

    // Update checklist item
    const checklist = await AdmissionChecklist.findOne({ admissionRequestId });
    if (checklist) {
      await AdmissionChecklistService.updateItemStatus({
        checklistId: checklist.checklistId,
        code: 'BED_ASSIGNED',
        status: 'COMPLETED',
        notes: `Assigned Bed ${reservedBed.bedNumber} in Ward ${reservedBed.wardId}`,
        actorUser,
        correlationId: request.correlationId
      });
    }

    await AdmissionHistory.create({
      admissionRequestId,
      patientId: request.patientId,
      previousStatus: prevStatus,
      newStatus: 'BED_ASSIGNED',
      action: 'ADMISSION_BED_ASSIGNED',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      actorName: actorUser?.name || 'Staff',
      details: { bedId: reservedBed.bedId, bedNumber: reservedBed.bedNumber, wardId: reservedBed.wardId },
      correlationId: request.correlationId
    });

    return { request, bed: reservedBed };
  }

  /**
   * 6. COMPLETE ADMISSION (Create Inpatient Episode)
   * Transactional coordination:
   * - Create Admission record
   * - Occupy Bed
   * - Update Visit to ADMITTED
   * - Finalize Checklist
   * - Generate Confirmation Document
   * - Dispatch Notifications
   * - Audit log
   */
  static async completeAdmission({ admissionRequestId, insuranceDetails = {}, billingAccountId = '', actorUser }) {
    const request = await AdmissionRequest.findOne({ admissionRequestId });
    if (!request) {
      throw new Error(`Admission request ${admissionRequestId} not found.`);
    }

    if (request.status === 'ADMITTED' && request.admissionId) {
      const existingAdmission = await Admission.findOne({ admissionId: request.admissionId });
      return existingAdmission;
    }

    if (!request.assignedBedId) {
      throw new Error('Cannot complete admission: No bed has been assigned to this admission request.');
    }

    if (request.status === 'REJECTED' || request.status === 'CANCELLED') {
      throw new Error(`Cannot complete admission for a ${request.status} request.`);
    }

    // Active admission safety check
    const activeCheck = await this.getActiveAdmission(request.patientId);
    if (activeCheck && activeCheck.admissionRequestId !== admissionRequestId) {
      throw new Error(`Patient ${request.patientId} already has an active admission (${activeCheck.admissionId}).`);
    }

    const bed = await Bed.findOne({ bedId: request.assignedBedId });
    if (!bed) {
      throw new Error(`Assigned bed ${request.assignedBedId} was not found.`);
    }

    const ward = await Ward.findOne({ wardId: bed.wardId });

    // Generate unique Admission ID
    const admissionId = await IdGeneratorService.generateAdmissionId();
    const now = new Date();
    const admissionDateStr = now.toISOString().slice(0, 10);
    const admissionTime = now.toTimeString().slice(0, 5);

    // Identity status check
    const isTemp = request.patientId.startsWith('TEMP-');
    const identityStatus = isTemp ? 'TEMPORARY' : 'VERIFIED';

    // Occupy the bed
    await BedManagementService.occupyBed({
      bedId: bed.bedId,
      patientId: request.patientId,
      patientName: request.patientName,
      admissionId,
      admissionRequestId,
      actorUser,
      correlationId: request.correlationId
    });

    // Determine Insurance Status
    const hasInsurance = insuranceDetails?.policyNumber && insuranceDetails.policyNumber.trim() !== '';
    const insuranceStatus = hasInsurance ? 'VERIFIED' : 'NOT_APPLICABLE';

    // Checklist reference
    const checklist = await AdmissionChecklist.findOne({ admissionRequestId });
    if (checklist) {
      checklist.admissionId = admissionId;
      await AdmissionChecklistService.updateItemStatus({
        checklistId: checklist.checklistId,
        code: 'BILLING_ACCOUNT_INITIALIZED',
        status: 'COMPLETED',
        notes: `Billing encounter active for Admission ${admissionId}`,
        actorUser,
        correlationId: request.correlationId
      });
      await AdmissionChecklistService.updateItemStatus({
        checklistId: checklist.checklistId,
        code: 'ADMISSION_DOCUMENTS_READY',
        status: 'COMPLETED',
        notes: `Admission Confirmation Document generated`,
        actorUser,
        correlationId: request.correlationId
      });
      await AdmissionChecklistService.updateItemStatus({
        checklistId: checklist.checklistId,
        code: 'NOTIFICATIONS_DISPATCHED',
        status: 'COMPLETED',
        notes: `Inpatient Admission notification sent`,
        actorUser,
        correlationId: request.correlationId
      });
    }

    // Create Admission
    const admission = await Admission.create({
      admissionId,
      patientId: request.patientId,
      patientRef: request.patientRef,
      patientName: request.patientName,
      visitId: request.visitId,
      visitRef: request.visitRef,
      admissionRequestId,
      admissionRequestRef: request._id,
      admissionType: request.source === 'EMERGENCY' ? 'EMERGENCY' : 'INPATIENT',
      source: request.source,
      admissionDate: now,
      admissionDateStr,
      admissionTime,
      status: 'ADMITTED',
      admittingDoctorId: request.requestingDoctorId || request.requestedBy,
      admittingDoctorName: request.requestingDoctorName,
      admittingDepartmentId: request.requestingDepartmentId,
      admittingDepartmentName: request.requestingDepartmentName,
      clinicalRequirementReference: request.clinicalRequirementReference,
      accommodationPreference: request.accommodationPreference,
      assignedWardId: bed.wardId,
      assignedWardName: ward?.name || bed.wardId,
      assignedBedId: bed.bedId,
      assignedBedNumber: bed.bedNumber,
      identityStatus,
      temporaryEmergencyId: isTemp ? request.patientId : null,
      insuranceStatus,
      insuranceDetails: {
        provider: insuranceDetails.provider || '',
        policyNumber: insuranceDetails.policyNumber || '',
        preAuthStatus: insuranceDetails.preAuthStatus || 'NOT_SUBMITTED',
        approvedAmount: insuranceDetails.approvedAmount || 0
      },
      billingStatus: 'ACTIVE',
      billingAccountId: billingAccountId || `BILL-ADM-${admissionId}`,
      dischargeStatus: 'NOT_DISCHARGED',
      checklistStatus: checklist?.allRequiredCompleted ? 'COMPLETED' : 'OVERRIDDEN',
      checklistId: checklist?.checklistId || null,
      externalSyncStatus: 'NOT_REQUIRED',
      correlationId: request.correlationId,
      createdBy: actorUser?._id || null
    });

    // Update AdmissionRequest
    request.status = 'ADMITTED';
    request.admissionId = admissionId;
    await request.save();

    // Update Visit status
    await Visit.findOneAndUpdate(
      { visitId: request.visitId },
      { status: 'ADMITTED', notes: `Admitted under Admission ID: ${admissionId}` }
    );

    // Generate Admission Confirmation Document
    try {
      await DocumentService.generateDocument({
        documentType: 'ADMISSION_CONFIRMATION',
        title: `Inpatient Admission Confirmation - ${admissionId}`,
        entityType: 'ADMISSION',
        entityId: admissionId,
        templateCode: 'ADMISSION_CONFIRMATION_SLIP',
        data: {
          admissionId,
          patientId: request.patientId,
          patientName: request.patientName,
          wardName: ward?.name || bed.wardId,
          bedNumber: bed.bedNumber,
          doctorName: request.requestingDoctorName,
          admissionDate: admissionDateStr,
          admissionTime,
          source: request.source
        },
        actorUser,
        correlationId: request.correlationId
      });
    } catch (docErr) {
      console.warn('[AdmissionService] Document generation warning:', docErr.message);
    }

    // Send Inpatient Notifications
    try {
      await NotificationService.sendNotification({
        templateCode: 'PATIENT_ADMISSION_CONFIRMED',
        event: 'ADMISSION_CONFIRMED',
        recipientId: request.patientId,
        channel: 'SMS',
        entityType: 'ADMISSION',
        entityId: admissionId,
        variables: {
          patientName: request.patientName,
          admissionId,
          wardName: ward?.name || bed.wardId,
          bedNumber: bed.bedNumber
        },
        correlationId: request.correlationId
      });
    } catch (notifErr) {
      console.warn('[AdmissionService] Notification dispatch warning:', notifErr.message);
    }

    // Record History & Audit
    await AdmissionHistory.create({
      admissionId,
      admissionRequestId,
      patientId: request.patientId,
      previousStatus: 'BED_ASSIGNED',
      newStatus: 'ADMITTED',
      action: 'ADMISSION_COMPLETED',
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      actorName: actorUser?.name || 'Staff',
      details: { admissionId, bedId: bed.bedId, bedNumber: bed.bedNumber, wardId: bed.wardId },
      correlationId: request.correlationId
    });

    await AuditService.logEvent({
      action: 'ADMISSION_COMPLETED',
      category: 'ADMISSION',
      patientId: request.patientId,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { admissionId, admissionRequestId, bedId: bed.bedId, bedNumber: bed.bedNumber },
      correlationId: request.correlationId
    });

    return admission;
  }

  /**
   * 7. EMERGENCY ADMISSION SHORTCUT / PIPELINE
   * Supports immediate administrative creation for emergency patients (existing or temp)
   */
  static async createEmergencyAdmission({
    patientId,
    provisionalName,
    estimatedAge,
    gender,
    apparentCondition,
    broughtBy,
    requestingDoctorId = 'DOC1001',
    clinicalRequirementReference = 'EMERGENCY-ADMIT-ORDER',
    clinicalRequiredCategory = 'EMERGENCY_BED',
    accommodationPreference = 'EMERGENCY_BED',
    assignedBedId = null,
    actorUser
  }) {
    const correlationId = IdGeneratorService.generateCorrelationId();

    let targetPatientId = patientId;
    let tempRecord = null;

    // If no existing patient provided, create Temporary Emergency Record
    if (!targetPatientId || targetPatientId.trim() === '') {
      const tempEmergencyId = await IdGeneratorService.generateTemporaryEmergencyId();
      const emergencyVisitId = await IdGeneratorService.generateVisitId();

      tempRecord = await EmergencyTemporaryRecord.create({
        temporaryId: tempEmergencyId,
        temporaryEmergencyId: tempEmergencyId,
        provisionalName: provisionalName || 'Unknown Emergency Patient',
        estimatedAge: estimatedAge || null,
        gender: gender || 'UNDISCLOSED',
        apparentCondition: apparentCondition || 'Emergency trauma / critical care',
        broughtBy: broughtBy || { name: 'Ambulance / Emergency Service', relationship: 'First Responder', contact: '' },
        emergencyVisitId,
        identityVerificationStatus: 'PENDING',
        status: 'ACTIVE',
        correlationId,
        createdBy: actorUser?._id || null
      });

      targetPatientId = tempEmergencyId;

      // Create Emergency Visit
      await Visit.create({
        visitId: emergencyVisitId,
        patientId: tempEmergencyId,
        visitType: 'EMERGENCY',
        registrationSource: 'EMERGENCY',
        priority: 'EMERGENCY',
        department: 'EMERGENCY',
        consultingDoctorId: requestingDoctorId,
        status: 'IN_PROGRESS',
        chiefComplaint: apparentCondition || 'Emergency inpatient admission',
        createdBy: actorUser?._id || null
      });
    }

    // Get or Create visit for the patient
    let visit = await Visit.findOne({ patientId: targetPatientId, status: { $in: ['IN_PROGRESS', 'SCHEDULED'] } });
    if (!visit) {
      const visitId = await IdGeneratorService.generateVisitId();
      visit = await Visit.create({
        visitId,
        patientId: targetPatientId,
        visitType: 'EMERGENCY',
        registrationSource: 'EMERGENCY',
        priority: 'EMERGENCY',
        department: 'EMERGENCY',
        consultingDoctorId: requestingDoctorId,
        status: 'IN_PROGRESS',
        chiefComplaint: apparentCondition || 'Emergency inpatient care',
        createdBy: actorUser?._id || null
      });
    }

    // Create Emergency Admission Request
    const reqResult = await this.createAdmissionRequest(
      {
        patientId: targetPatientId,
        visitId: visit.visitId,
        source: 'EMERGENCY',
        requestedBy: requestingDoctorId,
        requestingDoctorId,
        clinicalRequirementReference,
        clinicalRequiredCategory,
        accommodationPreference,
        priority: 'EMERGENCY',
        correlationId
      },
      actorUser
    );

    const admissionRequest = reqResult.admissionRequest;

    // If specific or auto bed provided, assign bed immediately
    let targetBedId = assignedBedId;
    if (!targetBedId) {
      const suitable = await BedManagementService.findSuitableBeds({
        clinicalRequirementCategory: clinicalRequiredCategory,
        accommodationPreference
      });
      if (suitable.availableBeds.length > 0) {
        targetBedId = suitable.availableBeds[0].bedId;
      }
    }

    if (targetBedId) {
      await this.assignBedToRequest({
        admissionRequestId: admissionRequest.admissionRequestId,
        bedId: targetBedId,
        actorUser
      });

      const admission = await this.completeAdmission({
        admissionRequestId: admissionRequest.admissionRequestId,
        actorUser
      });

      return {
        admissionRequest,
        admission,
        temporaryRecord: tempRecord
      };
    }

    return {
      admissionRequest,
      admission: null,
      temporaryRecord: tempRecord,
      message: 'Emergency admission request created. Bed pending allocation.'
    };
  }

  /**
   * 8. LINK EMERGENCY TEMPORARY IDENTITY TO PERMANENT PATIENT MASTER
   * Preserves all history, audits, visits, and admission episodes
   */
  static async linkEmergencyTemporaryIdentity({ temporaryEmergencyId, permanentPatientId, actorUser }) {
    const tempRecord = await EmergencyTemporaryRecord.findOne({
      $or: [{ temporaryId: temporaryEmergencyId }, { temporaryEmergencyId }]
    });

    if (!tempRecord) {
      throw new Error(`Temporary Emergency Record "${temporaryEmergencyId}" was not found.`);
    }

    const permanentPatient = await Patient.findOne({ patientId: permanentPatientId });
    if (!permanentPatient) {
      throw new Error(`Permanent Patient Master record "${permanentPatientId}" was not found.`);
    }

    const patientFullName = permanentPatient.fullName || `${permanentPatient.firstName} ${permanentPatient.lastName}`;

    // Update EmergencyTemporaryRecord
    tempRecord.discoveredPatientId = permanentPatient.patientId;
    tempRecord.linkedPatientId = permanentPatient.patientId;
    tempRecord.linkedPatientRef = permanentPatient._id;
    tempRecord.identityVerificationStatus = 'VERIFIED';
    tempRecord.status = 'LINKED';
    tempRecord.linkedAt = new Date();
    tempRecord.linkedBy = actorUser?._id || null;
    await tempRecord.save();

    // Link all Admission Requests
    await AdmissionRequest.updateMany(
      { patientId: temporaryEmergencyId },
      {
        patientId: permanentPatient.patientId,
        patientRef: permanentPatient._id,
        patientName: patientFullName
      }
    );

    // Link all Admissions
    await Admission.updateMany(
      { patientId: temporaryEmergencyId },
      {
        patientId: permanentPatient.patientId,
        patientRef: permanentPatient._id,
        patientName: patientFullName,
        identityStatus: 'VERIFIED'
      }
    );

    // Link Checklists
    await AdmissionChecklist.updateMany(
      { patientId: temporaryEmergencyId },
      { patientId: permanentPatient.patientId }
    );

    // Update Bed occupancy patient IDs
    await Bed.updateMany(
      { currentPatientId: temporaryEmergencyId },
      { currentPatientId: permanentPatient.patientId, currentPatientName: patientFullName }
    );

    // Audit and History
    await AuditService.logEvent({
      action: 'TEMPORARY_EMERGENCY_LINKED',
      category: 'PATIENT',
      patientId: permanentPatient.patientId,
      actorUserId: actorUser?.userId || actorUser?.id || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { temporaryEmergencyId, permanentPatientId: permanentPatient.patientId },
      correlationId: tempRecord.correlationId
    });

    return {
      success: true,
      temporaryEmergencyId,
      permanentPatientId: permanentPatient.patientId,
      patientName: patientFullName,
      message: 'Emergency temporary identity successfully linked with permanent patient master.'
    };
  }

  /**
   * 9. GET ADMISSIONS & REQUESTS LISTINGS
   */
  static async listAdmissionRequests(filter = {}, page = 1, limit = 50) {
    const query = {};
    if (filter.status) query.status = filter.status;
    if (filter.source) query.source = filter.source;
    if (filter.patientId) query.patientId = filter.patientId;
    if (filter.priority) query.priority = filter.priority;
    if (filter.requestingDoctorId) query.requestingDoctorId = filter.requestingDoctorId;

    const skip = (page - 1) * limit;
    const total = await AdmissionRequest.countDocuments(query);
    const requests = await AdmissionRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return { total, page, limit, requests };
  }

  static async listAdmissions(filter = {}, page = 1, limit = 50) {
    const query = {};
    if (filter.status) query.status = filter.status;
    if (filter.patientId) query.patientId = filter.patientId;
    if (filter.assignedWardId) query.assignedWardId = filter.assignedWardId;
    if (filter.admissionType) query.admissionType = filter.admissionType;
    if (filter.source) query.source = filter.source;

    const skip = (page - 1) * limit;
    const total = await Admission.countDocuments(query);
    const admissions = await Admission.find(query)
      .sort({ admissionDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return { total, page, limit, admissions };
  }

  static async getAdmissionById(admissionId) {
    const admission = await Admission.findOne({ admissionId }).lean();
    if (!admission) return null;

    const request = await AdmissionRequest.findOne({ admissionRequestId: admission.admissionRequestId }).lean();
    const checklist = await AdmissionChecklist.findOne({ admissionId }).lean();
    const history = await AdmissionHistory.find({ admissionId }).sort({ timestamp: 1 }).lean();
    const bed = await Bed.findOne({ bedId: admission.assignedBedId }).lean();

    return {
      admission,
      request,
      checklist,
      history,
      bed
    };
  }

  static async getAdmissionRequestById(admissionRequestId) {
    const request = await AdmissionRequest.findOne({ admissionRequestId }).lean();
    if (!request) return null;

    const checklist = await AdmissionChecklist.findOne({ admissionRequestId }).lean();
    const history = await AdmissionHistory.find({ admissionRequestId }).sort({ timestamp: 1 }).lean();
    let bed = null;
    if (request.assignedBedId) {
      bed = await Bed.findOne({ bedId: request.assignedBedId }).lean();
    }

    return {
      request,
      checklist,
      history,
      bed
    };
  }
}

module.exports = AdmissionService;
