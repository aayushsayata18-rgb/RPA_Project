const Discharge = require('../models/Discharge');
const DischargeRequest = require('../models/DischargeRequest');
const DischargeChecklist = require('../models/DischargeChecklist');
const DischargeHistory = require('../models/DischargeHistory');
const Admission = require('../models/Admission');
const Patient = require('../models/Patient');
const Invoice = require('../models/Invoice');
const BedAssignment = require('../models/BedAssignment');
const DischargeValidationService = require('./DischargeValidationService');
const PendingServiceChecker = require('./PendingServiceChecker');
const DischargeBillingService = require('./DischargeBillingService');
const DischargeInsuranceService = require('./DischargeInsuranceService');
const DischargePaymentService = require('./DischargePaymentService');
const DischargeBedService = require('./DischargeBedService');
const DischargeNotificationService = require('./DischargeNotificationService');
const DischargeDocumentService = require('./DischargeDocumentService');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');

class DischargeService {
  /**
   * 1. Clinical staff creates a Discharge Request
   */
  static async createDischargeRequest({
    admissionId,
    patientId,
    requestedByUserId,
    requestedByRole = 'DOCTOR',
    doctorName = '',
    requestType = 'PLANNED',
    clinicalDecisionReference,
    clinicalSummaryNotes = '',
    notes = '',
    effectiveDischargeDate = null,
    actorUser,
    correlationId
  }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    // 1. Locate admission and patient
    const admission = await Admission.findOne({ admissionId });
    if (!admission) {
      throw new Error(`Admission ${admissionId} not found.`);
    }

    const patient = await Patient.findOne({ patientId: admission.patientId });
    if (!patient) {
      throw new Error(`Patient ${admission.patientId} not found.`);
    }

    // 2. Validate patient and active admission
    const validation = await DischargeValidationService.validatePatientAndAdmission({
      patientId: admission.patientId,
      admissionId,
      correlationId: corrId,
      actorUser
    });

    if (!validation.isValid) {
      throw new Error(`Discharge validation failed: ${validation.message}`);
    }

    // 3. Generate Request ID
    const requestId = await IdGeneratorService.generateDischargeRequestId();

    const dischargeRequest = new DischargeRequest({
      requestId,
      patientId: admission.patientId,
      patientRef: patient._id,
      patientName: patient.fullName || '',
      visitId: admission.visitId,
      admissionId: admission.admissionId,
      admissionRef: admission._id,
      requestedByUserId: requestedByUserId || actorUser?.userId || 'CLINICAL_DOCTOR',
      requestedByRole,
      doctorName: doctorName || admission.admittingDoctorName || '',
      requestType,
      clinicalDecisionReference: clinicalDecisionReference || `CLIN-DEC-${admission.admissionId}-${Date.now()}`,
      clinicalSummaryNotes: clinicalSummaryNotes || notes || '',
      notes,
      status: 'REQUESTED',
      requestedAt: new Date(),
      effectiveDischargeDate: effectiveDischargeDate ? new Date(effectiveDischargeDate) : new Date(),
      correlationId: corrId
    });

    await dischargeRequest.save();

    // Update Admission status to DISCHARGE_REQUESTED
    admission.status = 'DISCHARGE_REQUESTED';
    await admission.save();

    // Audit Log
    await AuditService.logEvent({
      userId: requestedByUserId || actorUser?.userId || 'CLINICAL_DOCTOR',
      action: 'DISCHARGE_REQUEST_CREATED',
      module: 'DISCHARGE',
      entityType: 'DischargeRequest',
      entityId: requestId,
      details: `Discharge requested by ${doctorName || requestedByUserId} for patient ${patient.patientId} (${admission.admissionId})`,
      correlationId: corrId
    });

    // Notify Patient
    await DischargeNotificationService.notifyDischargeEvent({
      event: 'DISCHARGE_REQUESTED',
      patientId: patient.patientId,
      patientName: patient.fullName,
      dischargeId: requestId,
      admissionId: admission.admissionId,
      actorUser,
      correlationId: corrId
    });

    return dischargeRequest;
  }

  /**
   * 2. Initiate Discharge workflow from Request (or Direct Initiation)
   */
  static async initiateDischarge({
    dischargeRequestId = null,
    admissionId = null,
    dischargeType = 'PLANNED',
    notes = '',
    actorUser,
    correlationId
  }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    let reqRecord = null;
    let targetAdmissionId = admissionId;

    if (dischargeRequestId) {
      reqRecord = await DischargeRequest.findOne({ requestId: dischargeRequestId });
      if (!reqRecord) {
        throw new Error(`Discharge Request ${dischargeRequestId} not found.`);
      }
      targetAdmissionId = reqRecord.admissionId;
    }

    if (!targetAdmissionId) {
      throw new Error('Either dischargeRequestId or admissionId must be provided.');
    }

    const admission = await Admission.findOne({ admissionId: targetAdmissionId });
    if (!admission) {
      throw new Error(`Admission ${targetAdmissionId} not found.`);
    }

    const patient = await Patient.findOne({ patientId: admission.patientId });
    if (!patient) {
      throw new Error(`Patient ${admission.patientId} not found.`);
    }

    // Validate duplicate active discharge prevention
    const validation = await DischargeValidationService.validatePatientAndAdmission({
      patientId: admission.patientId,
      admissionId: targetAdmissionId,
      correlationId: corrId,
      actorUser
    });

    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const dischargeNumber = await IdGeneratorService.generateDischargeNumber();

    // 1. Initial Pending items check
    const pendingData = await PendingServiceChecker.checkPendingServices({
      patientId: admission.patientId,
      admissionId: targetAdmissionId
    });

    // 2. Initial Insurance check
    const insuranceData = await DischargeInsuranceService.getInsuranceStatus({
      patientId: admission.patientId,
      admissionId: targetAdmissionId,
      correlationId: corrId,
      actorUser
    });

    // Determine initial status based on pending services
    let initialStatus = 'VALIDATING';
    if (pendingData.hasPendingItems) {
      initialStatus = 'PENDING_SERVICES';
    } else {
      initialStatus = 'PENDING_BILLING';
    }

    const discharge = new Discharge({
      dischargeNumber,
      patientId: admission.patientId,
      patientRef: patient._id,
      patientName: patient.fullName,
      visitId: admission.visitId,
      admissionId: admission.admissionId,
      admissionRef: admission._id,
      dischargeRequestId: reqRecord ? reqRecord.requestId : null,
      dischargeRequestRef: reqRecord ? reqRecord._id : null,
      dischargeType: reqRecord ? reqRecord.requestType : dischargeType,
      status: initialStatus,
      requestedAt: reqRecord ? reqRecord.requestedAt : new Date(),
      processingStartedAt: new Date(),
      dischargeDate: new Date(),
      assignedWardId: admission.assignedWardId,
      assignedWardName: admission.assignedWardName,
      assignedBedId: admission.assignedBedId,
      assignedBedNumber: admission.assignedBedNumber,
      admittingDoctorName: admission.admittingDoctorName,
      insuranceStatus: insuranceData.insuranceStatus,
      bedReleaseStatus: 'PENDING',
      pendingItems: pendingData.allPending.map(p => ({
        serviceType: p.serviceType,
        itemReference: p.itemReference,
        description: p.description,
        status: p.status,
        isBlocking: false,
        detectedAt: new Date()
      })),
      notes: notes || reqRecord?.clinicalSummaryNotes || '',
      correlationId: corrId
    });

    await discharge.save();

    // Initialize Checklist
    const checklist = new DischargeChecklist({
      dischargeId: dischargeNumber,
      dischargeRef: discharge._id,
      admissionId: admission.admissionId,
      patientId: admission.patientId,
      clinicalDecisionRecorded: true,
      patientIdentityVerified: true,
      admissionVerified: true,
      pendingLabChecked: true,
      pendingRadiologyChecked: true,
      pendingPharmacyChecked: true,
      otherServicesChecked: true,
      chargesReconciled: false,
      finalInvoiceGenerated: false,
      insuranceChecked: true,
      paymentSettled: false,
      documentsGenerated: false,
      patientNotified: false,
      bedReleaseRequested: false,
      housekeepingTriggered: false,
      completed: false,
      itemLogs: [
        {
          itemKey: 'CLINICAL_DECISION',
          label: 'Clinical discharge authorization verified',
          status: 'PASSED',
          performedBy: actorUser?.userId || 'SYSTEM',
          details: `Authorized request: ${reqRecord?.requestId || 'Direct Initiation'}`
        },
        {
          itemKey: 'IDENTITY_VALIDATION',
          label: 'Patient and admission identity verified',
          status: 'PASSED',
          performedBy: actorUser?.userId || 'SYSTEM',
          details: `Patient: ${patient.patientId}, Admission: ${admission.admissionId}`
        }
      ]
    });

    await checklist.save();

    // History Log
    const history = new DischargeHistory({
      dischargeId: dischargeNumber,
      admissionId: admission.admissionId,
      patientId: admission.patientId,
      action: 'DISCHARGE_INITIATED',
      previousStatus: 'NONE',
      newStatus: initialStatus,
      changedBy: actorUser?.userId || 'SYSTEM',
      changedByRole: actorUser?.role || 'SYSTEM',
      details: `Discharge #${dischargeNumber} initiated. Initial status: ${initialStatus}`,
      correlationId: corrId
    });
    await history.save();

    if (reqRecord) {
      reqRecord.status = initialStatus;
      await reqRecord.save();
    }

    // Auto-advance if no pending items block billing
    if (!pendingData.hasPendingItems) {
      await this.processDischargeWorkflow({
        dischargeId: dischargeNumber,
        actorUser,
        correlationId: corrId
      });
    }

    return await Discharge.findOne({ dischargeNumber });
  }

  /**
   * 3. Process/Advance Discharge Workflow Orchestration (Step-by-Step or RPA)
   */
  static async processDischargeWorkflow({
    dischargeId,
    coveredAmount = null,
    depositAmount = null,
    discountAmount = 0,
    actorUser,
    correlationId
  }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();
    const discharge = await Discharge.findOne({ dischargeNumber: dischargeId });
    if (!discharge) {
      throw new Error(`Discharge ${dischargeId} not found.`);
    }

    if (discharge.status === 'COMPLETED' || discharge.status === 'CANCELLED') {
      return {
        discharge,
        message: `Discharge is already in terminal state: ${discharge.status}`
      };
    }

    const admission = await Admission.findOne({ admissionId: discharge.admissionId });
    const patient = await Patient.findOne({ patientId: discharge.patientId });
    const checklist = await DischargeChecklist.findOne({ dischargeId });

    // Step A: Check Pending Services
    const pendingData = await PendingServiceChecker.checkPendingServices({
      patientId: discharge.patientId,
      admissionId: discharge.admissionId
    });

    discharge.pendingItems = pendingData.allPending.map(p => ({
      serviceType: p.serviceType,
      itemReference: p.itemReference,
      description: p.description,
      status: p.status,
      isBlocking: false,
      detectedAt: new Date()
    }));

    if (pendingData.hasPendingItems) {
      discharge.status = 'PENDING_SERVICES';
      await discharge.save();
      return {
        discharge,
        pendingServices: pendingData,
        message: 'Pending hospital services detected. Review required before billing.'
      };
    }

    // Step B: Check Insurance
    const insuranceData = await DischargeInsuranceService.getInsuranceStatus({
      patientId: discharge.patientId,
      admissionId: discharge.admissionId,
      correlationId: corrId,
      actorUser
    });
    discharge.insuranceStatus = insuranceData.insuranceStatus;

    // Step C: Reconcile Charges & Finalize Invoice
    const finalCovered = coveredAmount !== null ? coveredAmount : insuranceData.coveredAmount;
    const finalDeposit = depositAmount !== null ? depositAmount : 0;

    const invoiceResult = await DischargeBillingService.finalizeInvoice({
      admissionId: discharge.admissionId,
      patientId: discharge.patientId,
      patientName: discharge.patientName,
      dischargeId: discharge.dischargeNumber,
      coveredAmount: finalCovered,
      depositAmount: finalDeposit,
      discountAmount,
      actorUser,
      correlationId: corrId
    });

    const invoice = invoiceResult.invoice;
    discharge.finalInvoiceId = invoice.invoiceId;
    discharge.finalInvoiceRef = invoice._id;
    discharge.grossAmount = invoice.grossTotal;
    discharge.coveredAmount = invoice.coveredAmount;
    discharge.depositAmount = invoice.depositAmount;
    discharge.discountAmount = invoice.discountAmount;
    discharge.payableAmount = invoice.payableAmount;
    discharge.paymentStatus = invoice.status === 'PAID' ? 'PAID' : (invoice.status === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : 'UNPAID');

    if (checklist) {
      checklist.chargesReconciled = true;
      checklist.finalInvoiceGenerated = true;
      checklist.insuranceChecked = true;
      if (invoice.status === 'PAID') {
        checklist.paymentSettled = true;
      }
      await checklist.save();
    }

    // Step D: Status Determination
    if (invoice.status === 'PAID' || invoice.payableAmount === 0) {
      discharge.status = 'READY_FOR_DISCHARGE';
    } else {
      discharge.status = 'PENDING_PAYMENT';
    }

    await discharge.save();

    // Log history
    await DischargeHistory.create({
      dischargeId: discharge.dischargeNumber,
      admissionId: discharge.admissionId,
      patientId: discharge.patientId,
      action: 'DISCHARGE_PROCESSED',
      newStatus: discharge.status,
      changedBy: actorUser?.userId || 'SYSTEM',
      changedByRole: actorUser?.role || 'SYSTEM',
      details: `Discharge workflow processed. Status updated to ${discharge.status}. Payable: ₹${discharge.payableAmount}`,
      correlationId: corrId
    });

    // Notify patient of bill readiness
    await DischargeNotificationService.notifyDischargeEvent({
      event: 'DISCHARGE_READY',
      patientId: discharge.patientId,
      patientName: discharge.patientName,
      dischargeId: discharge.dischargeNumber,
      admissionId: discharge.admissionId,
      details: { payableAmount: discharge.payableAmount, invoiceId: invoice.invoiceId },
      actorUser,
      correlationId: corrId
    });

    return {
      discharge,
      invoice,
      checklist
    };
  }

  /**
   * 4. Complete Discharge Orchestration (Releases Bed, Triggers Housekeeping, Generates Documents, Completes Flow)
   */
  static async completeDischarge({
    dischargeId,
    overridePaymentCheck = false,
    actorUser,
    correlationId
  }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();
    const discharge = await Discharge.findOne({ dischargeNumber: dischargeId });
    if (!discharge) {
      throw new Error(`Discharge ${dischargeId} not found.`);
    }

    if (discharge.status === 'COMPLETED') {
      return {
        discharge,
        alreadyCompleted: true,
        message: 'Discharge is already marked as COMPLETED.'
      };
    }

    if (discharge.status === 'CANCELLED') {
      throw new Error('Cannot complete a cancelled discharge.');
    }

    const admission = await Admission.findOne({ admissionId: discharge.admissionId });
    const patient = await Patient.findOne({ patientId: discharge.patientId });
    const checklist = await DischargeChecklist.findOne({ dischargeId });
    const invoice = discharge.finalInvoiceId ? await Invoice.findOne({ invoiceId: discharge.finalInvoiceId }) : null;

    // Check payment clearance unless overridden by authorized manager
    if (!overridePaymentCheck && discharge.payableAmount > 0 && discharge.paymentStatus !== 'PAID') {
      throw new Error(`Cannot complete discharge: Outstanding payment balance of ₹${discharge.payableAmount} remains unpaid.`);
    }

    // 1. Release Physical Bed through Bed Management Service
    let bedReleaseResult = null;
    if (discharge.bedReleaseStatus !== 'RELEASED') {
      try {
        bedReleaseResult = await DischargeBedService.releaseBedOnDischarge({
          admissionId: discharge.admissionId,
          bedId: discharge.assignedBedId,
          dischargeId: discharge.dischargeNumber,
          actorUser,
          correlationId: corrId
        });
        discharge.bedReleaseStatus = 'RELEASED';
        discharge.bedReleaseTaskId = bedReleaseResult.housekeepingTaskId || '';
        if (checklist) {
          checklist.bedReleaseRequested = true;
          checklist.housekeepingTriggered = true;
        }
      } catch (bedErr) {
        discharge.bedReleaseStatus = 'FAILED';
        console.error('[Bed Release on Discharge Error]:', bedErr.message);
      }
    }

    // 2. Generate Final Discharge Documents
    let docResult = null;
    try {
      docResult = await DischargeDocumentService.generateDischargeDocuments({
        discharge,
        admission,
        patient,
        invoice,
        actorUser,
        correlationId: corrId
      });
      if (checklist) {
        checklist.documentsGenerated = true;
      }
    } catch (docErr) {
      console.error('[Document Generation on Discharge Error]:', docErr.message);
    }

    // 3. Mark Discharge and Admission COMPLETED
    discharge.status = 'COMPLETED';
    discharge.completedAt = new Date();
    discharge.actualDepartureAt = new Date();
    await discharge.save();

    if (admission) {
      admission.status = 'DISCHARGED';
      admission.dischargeDate = new Date();
      await admission.save();
    }

    if (checklist) {
      checklist.completed = true;
      checklist.completedAt = new Date();
      checklist.patientNotified = true;
      await checklist.save();
    }

    // 4. Send Final Notification
    await DischargeNotificationService.notifyDischargeEvent({
      event: 'DISCHARGE_COMPLETED',
      patientId: discharge.patientId,
      patientName: discharge.patientName,
      dischargeId: discharge.dischargeNumber,
      admissionId: discharge.admissionId,
      actorUser,
      correlationId: corrId
    });

    // 5. Audit Log
    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      action: 'DISCHARGE_COMPLETED',
      module: 'DISCHARGE',
      entityType: 'Discharge',
      entityId: discharge.dischargeNumber,
      details: `Discharge #${discharge.dischargeNumber} completed for admission ${discharge.admissionId}. Bed released & documents generated.`,
      correlationId: corrId
    });

    // 6. History Log
    await DischargeHistory.create({
      dischargeId: discharge.dischargeNumber,
      admissionId: discharge.admissionId,
      patientId: discharge.patientId,
      action: 'DISCHARGE_COMPLETED',
      newStatus: 'COMPLETED',
      changedBy: actorUser?.userId || 'SYSTEM',
      changedByRole: actorUser?.role || 'SYSTEM',
      details: 'Discharge completed successfully. All administrative steps finalized.',
      correlationId: corrId
    });

    return {
      success: true,
      discharge,
      checklist,
      bedReleaseResult,
      documents: docResult?.documents || []
    };
  }

  /**
   * 5. Cancel Discharge
   */
  static async cancelDischarge({
    dischargeId,
    cancellationReason,
    actorUser,
    correlationId
  }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();
    const discharge = await Discharge.findOne({ dischargeNumber: dischargeId });
    if (!discharge) {
      throw new Error(`Discharge ${dischargeId} not found.`);
    }

    if (discharge.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed discharge. A separate authorized clinical review is required.');
    }

    const previousStatus = discharge.status;
    discharge.status = 'CANCELLED';
    discharge.cancelledAt = new Date();
    discharge.cancellationReason = cancellationReason || 'Discharge cancelled by staff';
    discharge.cancelledBy = actorUser?.userId || 'STAFF';
    await discharge.save();

    // Revert Admission status back to ADMITTED
    const admission = await Admission.findOne({ admissionId: discharge.admissionId });
    if (admission && admission.status === 'DISCHARGE_REQUESTED') {
      admission.status = 'ADMITTED';
      await admission.save();
    }

    // Cancel associated request if any
    if (discharge.dischargeRequestId) {
      const dReq = await DischargeRequest.findOne({ requestId: discharge.dischargeRequestId });
      if (dReq) {
        dReq.status = 'CANCELLED';
        dReq.cancelledAt = new Date();
        dReq.cancellationReason = cancellationReason;
        dReq.cancelledBy = actorUser?.userId || 'STAFF';
        await dReq.save();
      }
    }

    await DischargeHistory.create({
      dischargeId: discharge.dischargeNumber,
      admissionId: discharge.admissionId,
      patientId: discharge.patientId,
      action: 'DISCHARGE_CANCELLED',
      previousStatus,
      newStatus: 'CANCELLED',
      changedBy: actorUser?.userId || 'STAFF',
      changedByRole: actorUser?.role || 'STAFF',
      details: `Discharge cancelled: ${cancellationReason}`,
      correlationId: corrId
    });

    await AuditService.logEvent({
      userId: actorUser?.userId || 'STAFF',
      action: 'DISCHARGE_CANCELLED',
      module: 'DISCHARGE',
      entityType: 'Discharge',
      entityId: discharge.dischargeNumber,
      details: `Discharge #${discharge.dischargeNumber} cancelled: ${cancellationReason}`,
      correlationId: corrId
    });

    return discharge;
  }

  /**
   * 6. Query functions
   */
  static async getDischargeById(dischargeNumber) {
    const discharge = await Discharge.findOne({ dischargeNumber }).lean();
    if (!discharge) return null;

    const [checklist, invoice, history, documents] = await Promise.all([
      DischargeChecklist.findOne({ dischargeId: dischargeNumber }).lean(),
      discharge.finalInvoiceId ? Invoice.findOne({ invoiceId: discharge.finalInvoiceId }).lean() : null,
      DischargeHistory.find({ dischargeId: dischargeNumber }).sort({ timestamp: -1 }).lean(),
      DischargeDocumentService.getDischargeDocuments(dischargeNumber)
    ]);

    return {
      ...discharge,
      checklist,
      invoice,
      history,
      documents
    };
  }

  static async listDischarges({
    status,
    patientId,
    admissionId,
    wardId,
    paymentStatus,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20
  } = {}) {
    const query = {};

    if (status) query.status = status;
    if (patientId) query.patientId = patientId;
    if (admissionId) query.admissionId = admissionId;
    if (wardId) query.assignedWardId = wardId;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      query.requestedAt = {};
      if (startDate) query.requestedAt.$gte = new Date(startDate);
      if (endDate) query.requestedAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { dischargeNumber: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { admissionId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [discharges, total] = await Promise.all([
      Discharge.find(query).sort({ requestedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Discharge.countDocuments(query)
    ]);

    return {
      discharges,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    };
  }

  static async getDischargeStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalToday,
      pendingDischarges,
      pendingBilling,
      pendingPayment,
      pendingInsurance,
      pendingServices,
      completedToday,
      cancelledToday
    ] = await Promise.all([
      Discharge.countDocuments({ requestedAt: { $gte: todayStart } }),
      Discharge.countDocuments({ status: { $nin: ['COMPLETED', 'CANCELLED'] } }),
      Discharge.countDocuments({ status: 'PENDING_BILLING' }),
      Discharge.countDocuments({ status: 'PENDING_PAYMENT' }),
      Discharge.countDocuments({ status: 'PENDING_INSURANCE' }),
      Discharge.countDocuments({ status: 'PENDING_SERVICES' }),
      Discharge.countDocuments({ status: 'COMPLETED', completedAt: { $gte: todayStart } }),
      Discharge.countDocuments({ status: 'CANCELLED', cancelledAt: { $gte: todayStart } })
    ]);

    return {
      totalToday,
      pendingDischarges,
      pendingBilling,
      pendingPayment,
      pendingInsurance,
      pendingServices,
      completedToday,
      cancelledToday
    };
  }
}

module.exports = DischargeService;
