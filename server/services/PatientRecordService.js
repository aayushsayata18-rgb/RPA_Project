const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Appointment = require('../models/Appointment');
const OPDToken = require('../models/OPDToken');
const Admission = require('../models/Admission');
const BedAssignment = require('../models/BedAssignment');
const Discharge = require('../models/Discharge');
const Invoice = require('../models/Invoice');
const PaymentTransaction = require('../models/PaymentTransaction');
const GeneratedDocument = require('../models/GeneratedDocument');
const Notification = require('../models/Notification');
const RecordAccessLog = require('../models/RecordAccessLog');
const PatientProfileHistory = require('../models/PatientProfileHistory');
const LabRecord = require('../models/LabRecord');
const RadiologyRecord = require('../models/RadiologyRecord');
const PharmacyRecord = require('../models/PharmacyRecord');
const InsurancePolicy = require('../models/InsurancePolicy');
const InsuranceClaim = require('../models/InsuranceClaim');
const AuditService = require('./AuditService');
const IdGeneratorService = require('./IdGeneratorService');

class PatientRecordService {
  /**
   * Log patient record access attempt (both granted and denied)
   */
  async logAccess({
    patientId,
    user,
    action,
    resourceType,
    resourceId = '',
    purpose = 'ADMINISTRATION',
    status = 'GRANTED',
    denialReason = '',
    req = null,
    correlationId = '',
    metadata = {}
  }) {
    try {
      const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
      const userRole = user?.role || 'SYSTEM';
      const userId = user?.userId || user?._id || 'ANONYMOUS';
      const userName = user?.fullName || user?.name || userRole;

      const log = new RecordAccessLog({
        patientId,
        userId: String(userId),
        userName,
        role: userRole,
        resourceType,
        resourceId,
        action,
        purpose: userRole === 'PATIENT' ? 'PATIENT_PORTAL' : purpose,
        status,
        denialReason,
        ipAddress,
        correlationId: correlationId || req?.headers?.['x-correlation-id'] || `CORR-REC-${Date.now()}`,
        metadata,
        timestamp: new Date()
      });

      await log.save();

      // Mirror denied access or critical modifications to Central Audit Service
      if (status === 'DENIED' || action === 'RECORD_ACCESS_DENIED') {
        await AuditService.logEvent({
          action: 'RECORD_ACCESS_DENIED',
          module: 'PATIENT_RECORDS',
          userId: String(userId),
          role: userRole,
          entityType: resourceType || 'PATIENT',
          entityId: String(patientId),
          correlationId: log.correlationId,
          status: 'WARNING',
          details: {
            resourceType,
            resourceId,
            action,
            denialReason,
            ipAddress
          }
        });
      }
    } catch (err) {
      console.error('[PatientRecordService] logAccess error:', err.message);
    }
  }

  /**
   * Validate patient ownership for PATIENT role
   */
  assertPatientOwnership(patientId, user, req = null, resourceType = 'PATIENT_SUMMARY') {
    if (user?.role === 'PATIENT') {
      const linkedId = user.linkedEntityId || user.patientId;
      if (linkedId && linkedId !== patientId) {
        this.logAccess({
          patientId,
          user,
          action: 'RECORD_ACCESS_DENIED',
          resourceType,
          status: 'DENIED',
          denialReason: `Patient ${linkedId} attempted to access unauthorized patient record ${patientId}`,
          req
        });

        const error = new Error('Access denied. You may only access your own patient records.');
        error.statusCode = 403;
        error.errorCode = 'RECORD_ACCESS_DENIED';
        throw error;
      }
    }
  }

  /**
   * Calculate Age from Date of Birth
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }

  /**
   * Mask sensitive policy or identity information for restricted roles
   */
  maskSensitiveString(str, visibleEndChars = 4) {
    if (!str || typeof str !== 'string') return str;
    if (str.length <= visibleEndChars) return '****';
    return '*'.repeat(str.length - visibleEndChars) + str.slice(-visibleEndChars);
  }

  /**
   * GET /api/patients/:patientId/records/summary
   * Aggregates patient master, last visit, active admission, current bed, outstanding balance, active insurance, and recent documents
   */
  async getPatientSummary(patientId, user, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'PATIENT_SUMMARY');

    const patient = await Patient.findOne({ patientId }).lean();
    if (!patient) {
      const error = new Error(`Patient record with ID ${patientId} not found.`);
      error.statusCode = 404;
      error.errorCode = 'PATIENT_NOT_FOUND';
      throw error;
    }

    // 1. Last Visit
    const lastVisit = await Visit.findOne({ patientId }).sort({ visitDate: -1, createdAt: -1 }).lean();

    // 2. Active Admission & Current Bed
    const activeAdmission = await Admission.findOne({
      patientId,
      status: { $in: ['ADMITTED', 'ACTIVE', 'DISCHARGE_REQUESTED', 'BILLING_CLEARED'] }
    }).sort({ admissionDate: -1, createdAt: -1 }).lean();

    const currentBedAssignment = await BedAssignment.findOne({
      patientId,
      status: 'ACTIVE'
    }).sort({ assignedAt: -1 }).lean();

    // 3. Outstanding Balance across finalized invoices
    const invoices = await Invoice.find({ patientId }).lean();
    let grossTotal = 0;
    let payableTotal = 0;
    let paidTotal = 0;
    let outstandingBalance = 0;

    for (const inv of invoices) {
      grossTotal += inv.grossTotal || inv.grossAmount || 0;
      payableTotal += inv.payableAmount || 0;
      paidTotal += inv.paidAmount || 0;
      outstandingBalance += (inv.outstandingBalance !== undefined ? inv.outstandingBalance : (inv.payableAmount - inv.paidAmount));
    }

    // 4. Active Insurance
    let activeInsurance = await InsurancePolicy.findOne({
      patientId,
      verificationStatus: { $in: ['VERIFIED', 'PENDING'] }
    }).sort({ createdAt: -1 }).lean();

    // Mask policy number if role is not billing/insurance/admin
    if (activeInsurance && !['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'SYSTEM_ADMIN', 'ADMIN_MANAGER'].includes(user?.role)) {
      activeInsurance = {
        ...activeInsurance,
        policyNumber: this.maskSensitiveString(activeInsurance.policyNumber)
      };
    }

    // 5. Recent Documents (last 5)
    const recentDocuments = await GeneratedDocument.find({
      entityId: patientId
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Log the access
    await this.logAccess({
      patientId,
      user,
      action: 'PATIENT_RECORD_VIEWED',
      resourceType: 'PATIENT_SUMMARY',
      resourceId: patientId,
      purpose: req?.query?.purpose || 'ADMINISTRATION',
      req
    });

    return {
      patient: {
        ...patient,
        age: this.calculateAge(patient.dateOfBirth)
      },
      lastVisit: lastVisit || null,
      activeAdmission: activeAdmission || null,
      currentBed: currentBedAssignment
        ? {
            bedId: currentBedAssignment.bedId,
            bedNumber: currentBedAssignment.bedNumber,
            wardName: currentBedAssignment.wardName,
            status: currentBedAssignment.status,
            assignedAt: currentBedAssignment.assignedAt
          }
        : (activeAdmission?.assignedBedNumber ? {
            bedId: activeAdmission.assignedBedId,
            bedNumber: activeAdmission.assignedBedNumber,
            wardName: activeAdmission.assignedWardName,
            status: 'OCCUPIED',
            assignedAt: activeAdmission.admissionDate
          } : null),
      financialOverview: {
        totalInvoices: invoices.length,
        grossTotal,
        payableTotal,
        paidTotal,
        outstandingBalance: Math.max(0, outstandingBalance)
      },
      activeInsurance: activeInsurance || null,
      recentDocuments: recentDocuments || []
    };
  }

  /**
   * GET /api/patients/:patientId/timeline
   * Aggregates a comprehensive, chronological, longitudinal timeline across all hospital systems
   */
  async getPatientTimeline(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'TIMELINE');

    const patient = await Patient.findOne({ patientId }).lean();
    if (!patient) {
      const error = new Error(`Patient record with ID ${patientId} not found.`);
      error.statusCode = 404;
      error.errorCode = 'PATIENT_NOT_FOUND';
      throw error;
    }

    const {
      eventType,
      sourceModule,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sort = 'desc'
    } = query;

    const events = [];

    // 1. Patient Registration Event
    events.push({
      eventId: `EVT-REG-${patient._id}`,
      patientId,
      eventType: 'REGISTRATION',
      sourceModule: 'PATIENT_REGISTRATION',
      referenceType: 'PATIENT',
      referenceId: patient.patientId,
      eventDate: patient.createdAt || new Date(),
      title: 'Patient Registered in Hospital Master',
      summary: `Patient ${patient.fullName} (${patient.patientId}) registered via ${patient.registrationSource || 'FRONT_DESK'}. Verification: ${patient.identityVerificationStatus}.`,
      visibility: 'ALL',
      metadata: {
        registrationSource: patient.registrationSource,
        gender: patient.gender,
        mobile: patient.mobile
      }
    });

    // 2. Visits
    const visits = await Visit.find({ patientId }).lean();
    for (const v of visits) {
      events.push({
        eventId: `EVT-VIS-${v._id}`,
        patientId,
        eventType: 'OPD_VISIT',
        sourceModule: 'VISIT_MANAGEMENT',
        referenceType: 'VISIT',
        referenceId: v.visitId,
        eventDate: v.visitDate || v.createdAt,
        title: `Hospital Visit ${v.visitId} (${v.visitType || 'OPD'})`,
        summary: `Department: ${v.departmentName || v.department || 'General OPD'}, Doctor: ${v.doctorName || 'Assigned Specialist'}, Status: ${v.status}`,
        visibility: 'ALL',
        metadata: {
          visitType: v.visitType,
          status: v.status,
          tokenNumber: v.tokenNumber
        }
      });
    }

    // 3. Appointments
    const appointments = await Appointment.find({ patientId }).lean();
    for (const app of appointments) {
      events.push({
        eventId: `EVT-APP-${app._id}`,
        patientId,
        eventType: 'APPOINTMENT',
        sourceModule: 'APPOINTMENT_MANAGEMENT',
        referenceType: 'APPOINTMENT',
        referenceId: app.appointmentId,
        eventDate: app.appointmentDate || app.createdAt,
        title: `Appointment with ${app.doctorName || 'Doctor'}`,
        summary: `Specialty: ${app.departmentName || 'Clinic'}, Slot: ${app.timeSlot || app.slotTime || 'Scheduled'}, Status: ${app.status}`,
        visibility: 'ALL',
        metadata: {
          appointmentId: app.appointmentId,
          status: app.status,
          timeSlot: app.timeSlot || app.slotTime
        }
      });
    }

    // 4. OPD Tokens / Encounters
    const opdTokens = await OPDToken.find({ patientId }).lean();
    for (const token of opdTokens) {
      events.push({
        eventId: `EVT-OPD-${token._id}`,
        patientId,
        eventType: 'OPD_ENCOUNTER',
        sourceModule: 'OPD_MANAGEMENT',
        referenceType: 'OPD_TOKEN',
        referenceId: token.tokenId || token.tokenNumber,
        eventDate: token.consultationStartTime || token.issuedAt || token.createdAt,
        title: `OPD Queue Token #${token.tokenNumber}`,
        summary: `Doctor: ${token.doctorName}, Room: ${token.roomNumber || 'Consultation Room'}, Queue Status: ${token.status}`,
        visibility: 'ALL',
        metadata: {
          tokenId: token.tokenId,
          tokenNumber: token.tokenNumber,
          status: token.status
        }
      });
    }

    // 5. Admissions
    const admissions = await Admission.find({ patientId }).lean();
    for (const adm of admissions) {
      events.push({
        eventId: `EVT-ADM-${adm._id}`,
        patientId,
        eventType: 'ADMISSION',
        sourceModule: 'ADMISSION_MANAGEMENT',
        referenceType: 'ADMISSION',
        referenceId: adm.admissionId,
        eventDate: adm.admissionDate || adm.createdAt,
        title: `Inpatient Admission ${adm.admissionId}`,
        summary: `Ward: ${adm.assignedWardName || adm.assignedWardId}, Bed: ${adm.assignedBedNumber || adm.assignedBedId}, Doctor: ${adm.admittingDoctorName}, Status: ${adm.status}`,
        visibility: 'ALL',
        metadata: {
          admissionId: adm.admissionId,
          status: adm.status,
          ward: adm.assignedWardName
        }
      });
    }

    // 6. Bed Assignments & Transfers
    const bedAssignments = await BedAssignment.find({ patientId }).lean();
    for (const ba of bedAssignments) {
      events.push({
        eventId: `EVT-BED-${ba._id}`,
        patientId,
        eventType: 'BED_ASSIGNMENT',
        sourceModule: 'BED_MANAGEMENT',
        referenceType: 'BED_ASSIGNMENT',
        referenceId: ba.assignmentId || ba.bedId,
        eventDate: ba.assignedAt || ba.createdAt,
        title: `Bed Allocation: ${ba.bedNumber || ba.bedId}`,
        summary: `Ward: ${ba.wardName || ba.wardId}, Status: ${ba.status}${ba.releasedAt ? ` (Released: ${new Date(ba.releasedAt).toLocaleDateString()})` : ''}`,
        visibility: 'ALL',
        metadata: {
          bedId: ba.bedId,
          bedNumber: ba.bedNumber,
          wardName: ba.wardName,
          status: ba.status
        }
      });
    }

    // 7. Discharges
    const discharges = await Discharge.find({ patientId }).lean();
    for (const dis of discharges) {
      events.push({
        eventId: `EVT-DIS-${dis._id}`,
        patientId,
        eventType: 'DISCHARGE',
        sourceModule: 'DISCHARGE_PROCESSING',
        referenceType: 'DISCHARGE',
        referenceId: dis.dischargeNumber || dis._id,
        eventDate: dis.dischargeDate || dis.effectiveDischargeDate || dis.createdAt,
        title: `Inpatient Discharge ${dis.dischargeNumber}`,
        summary: `Type: ${dis.dischargeType || 'PLANNED'}, Status: ${dis.status}, Payment Status: ${dis.paymentStatus || 'SETTLED'}`,
        visibility: 'ALL',
        metadata: {
          dischargeNumber: dis.dischargeNumber,
          status: dis.status,
          grossAmount: dis.grossAmount,
          payableAmount: dis.payableAmount
        }
      });
    }

    // 8. Invoices & Billing
    const invoices = await Invoice.find({ patientId }).lean();
    for (const inv of invoices) {
      events.push({
        eventId: `EVT-INV-${inv._id}`,
        patientId,
        eventType: 'BILL_GENERATED',
        sourceModule: 'BILLING',
        referenceType: 'INVOICE',
        referenceId: inv.invoiceId,
        eventDate: inv.invoiceDate || inv.createdAt,
        title: `Invoice Generated #${inv.invoiceId}`,
        summary: `Gross: ₹${inv.grossTotal || inv.grossAmount || 0}, Payable: ₹${inv.payableAmount || 0}, Status: ${inv.status}`,
        visibility: 'FINANCIAL',
        metadata: {
          invoiceId: inv.invoiceId,
          status: inv.status,
          grossAmount: inv.grossTotal || inv.grossAmount,
          payableAmount: inv.payableAmount,
          paidAmount: inv.paidAmount
        }
      });
    }

    // 9. Payment Transactions
    const payments = await PaymentTransaction.find({ patientId }).lean();
    for (const pay of payments) {
      events.push({
        eventId: `EVT-PAY-${pay._id}`,
        patientId,
        eventType: 'PAYMENT',
        sourceModule: 'BILLING_PAYMENTS',
        referenceType: 'PAYMENT_TRANSACTION',
        referenceId: pay.transactionId,
        eventDate: pay.paymentDate || pay.createdAt,
        title: `Payment Received: ₹${pay.amount}`,
        summary: `Method: ${pay.paymentMethod || 'ONLINE'}, Invoice: ${pay.invoiceId || 'Deposit/Bill'}, Status: ${pay.status}`,
        visibility: 'FINANCIAL',
        metadata: {
          transactionId: pay.transactionId,
          amount: pay.amount,
          method: pay.paymentMethod,
          status: pay.status
        }
      });
    }

    // 10. Laboratory Records
    const labRecords = await LabRecord.find({ patientId }).lean();
    for (const lab of labRecords) {
      events.push({
        eventId: `EVT-LAB-${lab._id}`,
        patientId,
        eventType: 'LAB_RESULT',
        sourceModule: 'LABORATORY',
        referenceType: 'LAB_ORDER',
        referenceId: lab.orderId,
        eventDate: lab.reportDate || lab.orderDate || lab.createdAt,
        title: `Lab Report: ${lab.testName}`,
        summary: `Category: ${lab.category}, Sample: ${lab.sampleStatus}, Result Status: ${lab.resultStatus}`,
        visibility: 'CLINICAL',
        metadata: {
          orderId: lab.orderId,
          testCode: lab.testCode,
          resultStatus: lab.resultStatus,
          documentUrl: lab.documentUrl
        }
      });
    }

    // 11. Radiology Records
    const radRecords = await RadiologyRecord.find({ patientId }).lean();
    for (const rad of radRecords) {
      events.push({
        eventId: `EVT-RAD-${rad._id}`,
        patientId,
        eventType: 'RADIOLOGY_REPORT',
        sourceModule: 'RADIOLOGY',
        referenceType: 'RADIOLOGY_ORDER',
        referenceId: rad.orderId,
        eventDate: rad.reportDate || rad.orderDate || rad.createdAt,
        title: `Radiology Report: ${rad.procedureName} (${rad.modality})`,
        summary: `Status: ${rad.status}, Radiologist: ${rad.radiologistName || 'Department Staff'}`,
        visibility: 'CLINICAL',
        metadata: {
          orderId: rad.orderId,
          modality: rad.modality,
          status: rad.status
        }
      });
    }

    // 12. Pharmacy Records
    const pharmRecords = await PharmacyRecord.find({ patientId }).lean();
    for (const ph of pharmRecords) {
      events.push({
        eventId: `EVT-PHARM-${ph._id}`,
        patientId,
        eventType: 'PHARMACY_DISPENSE',
        sourceModule: 'PHARMACY',
        referenceType: 'PHARMACY_DISPENSE',
        referenceId: ph.dispenseId,
        eventDate: ph.dispenseDate || ph.createdAt,
        title: `Pharmacy Dispensed (#${ph.dispenseId})`,
        summary: `Items: ${ph.medications?.length || 0} medications, Status: ${ph.status}`,
        visibility: 'CLINICAL',
        metadata: {
          dispenseId: ph.dispenseId,
          prescriptionId: ph.prescriptionId,
          itemCount: ph.medications?.length
        }
      });
    }

    // 13. Generated Documents
    const docs = await GeneratedDocument.find({ entityId: patientId }).lean();
    for (const doc of docs) {
      events.push({
        eventId: `EVT-DOC-${doc._id}`,
        patientId,
        eventType: 'DOCUMENT_GENERATED',
        sourceModule: 'DOCUMENT_SERVICE',
        referenceType: 'DOCUMENT',
        referenceId: doc.documentId,
        eventDate: doc.createdAt,
        title: `Document: ${doc.title || doc.documentType}`,
        summary: `Type: ${doc.documentType}, Version: ${doc.version || 1}`,
        visibility: 'ALL',
        metadata: {
          documentId: doc.documentId,
          documentType: doc.documentType,
          fileUrl: doc.fileUrl
        }
      });
    }

    // 14. Profile Updates
    const profileHistory = await PatientProfileHistory.find({ patientId }).lean();
    for (const ph of profileHistory) {
      events.push({
        eventId: `EVT-HIST-${ph._id}`,
        patientId,
        eventType: 'PROFILE_UPDATED',
        sourceModule: 'PATIENT_RECORDS',
        referenceType: 'PROFILE_HISTORY',
        referenceId: String(ph._id),
        eventDate: ph.timestamp || ph.createdAt,
        title: `Profile Field Updated: ${ph.field}`,
        summary: `Changed by ${ph.changedByRole} (${ph.reason || 'Demographic edit'})`,
        visibility: 'ADMIN',
        metadata: {
          field: ph.field,
          isSensitive: ph.isSensitive
        }
      });
    }

    // Apply filtering
    let filteredEvents = events;

    if (eventType) {
      filteredEvents = filteredEvents.filter((e) => e.eventType === eventType);
    }
    if (sourceModule) {
      filteredEvents = filteredEvents.filter((e) => e.sourceModule === sourceModule);
    }
    if (startDate) {
      const sDate = new Date(startDate);
      filteredEvents = filteredEvents.filter((e) => new Date(e.eventDate) >= sDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      filteredEvents = filteredEvents.filter((e) => new Date(e.eventDate) <= eDate);
    }
    if (search) {
      const q = search.toLowerCase();
      filteredEvents = filteredEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q)
      );
    }

    // Sort
    filteredEvents.sort((a, b) => {
      const timeA = new Date(a.eventDate).getTime();
      const timeB = new Date(b.eventDate).getTime();
      return sort === 'asc' ? timeA - timeB : timeB - timeA;
    });

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const totalEvents = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Audit the timeline retrieval
    await this.logAccess({
      patientId,
      user,
      action: 'PATIENT_RECORD_VIEWED',
      resourceType: 'TIMELINE',
      resourceId: patientId,
      purpose: req?.query?.purpose || 'ADMINISTRATION',
      req,
      metadata: { totalEvents, query }
    });

    return {
      patientId,
      patientName: patient.fullName,
      total: totalEvents,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalEvents / limitNum),
      events: paginatedEvents
    };
  }

  /**
   * GET /api/patients/:patientId/visits
   */
  async getPatientVisits(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'VISIT');

    const visits = await Visit.find({ patientId }).sort({ visitDate: -1, createdAt: -1 }).lean();

    await this.logAccess({
      patientId,
      user,
      action: 'PATIENT_RECORD_VIEWED',
      resourceType: 'VISIT',
      req
    });

    return {
      patientId,
      total: visits.length,
      visits
    };
  }

  /**
   * GET /api/patients/:patientId/appointments
   */
  async getPatientAppointments(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'APPOINTMENT');

    const appointments = await Appointment.find({ patientId }).sort({ appointmentDate: -1, createdAt: -1 }).lean();

    await this.logAccess({
      patientId,
      user,
      action: 'PATIENT_RECORD_VIEWED',
      resourceType: 'APPOINTMENT',
      req
    });

    return {
      patientId,
      total: appointments.length,
      appointments
    };
  }

  /**
   * GET /api/patients/:patientId/admissions
   */
  async getPatientAdmissions(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'ADMISSION');

    const admissions = await Admission.find({ patientId }).sort({ admissionDate: -1, createdAt: -1 }).lean();

    await this.logAccess({
      patientId,
      user,
      action: 'PATIENT_RECORD_VIEWED',
      resourceType: 'ADMISSION',
      req
    });

    return {
      patientId,
      total: admissions.length,
      admissions
    };
  }

  /**
   * GET /api/patients/:patientId/beds
   */
  async getPatientBedHistory(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'BED_HISTORY');

    const assignments = await BedAssignment.find({ patientId }).sort({ assignedAt: -1 }).lean();

    await this.logAccess({
      patientId,
      user,
      action: 'PATIENT_RECORD_VIEWED',
      resourceType: 'BED_HISTORY',
      req
    });

    return {
      patientId,
      total: assignments.length,
      bedHistory: assignments
    };
  }

  /**
   * GET /api/patients/:patientId/discharges
   */
  async getPatientDischarges(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'DISCHARGE');

    const discharges = await Discharge.find({ patientId }).sort({ dischargeDate: -1, createdAt: -1 }).lean();

    await this.logAccess({
      patientId,
      user,
      action: 'PATIENT_RECORD_VIEWED',
      resourceType: 'DISCHARGE',
      req
    });

    return {
      patientId,
      total: discharges.length,
      discharges
    };
  }

  /**
   * GET /api/patients/:patientId/billing
   */
  async getPatientBilling(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'BILLING');

    const invoices = await Invoice.find({ patientId }).sort({ invoiceDate: -1, createdAt: -1 }).lean();
    const payments = await PaymentTransaction.find({ patientId }).sort({ paymentDate: -1, createdAt: -1 }).lean();

    await this.logAccess({
      patientId,
      user,
      action: 'BILLING_RECORD_VIEWED',
      resourceType: 'BILLING',
      req
    });

    return {
      patientId,
      totalInvoices: invoices.length,
      totalPayments: payments.length,
      invoices,
      payments
    };
  }

  /**
   * GET /api/patients/:patientId/insurance
   */
  async getPatientInsurance(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'INSURANCE');

    let policies = await InsurancePolicy.find({ patientId }).sort({ createdAt: -1 }).lean();
    const claims = await InsuranceClaim.find({ patientId }).sort({ submissionDate: -1, createdAt: -1 }).lean();

    // Mask policy number if role is restricted
    if (!['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE', 'SYSTEM_ADMIN', 'ADMIN_MANAGER'].includes(user?.role)) {
      policies = policies.map((p) => ({
        ...p,
        policyNumber: this.maskSensitiveString(p.policyNumber)
      }));
    }

    await this.logAccess({
      patientId,
      user,
      action: 'INSURANCE_RECORD_VIEWED',
      resourceType: 'INSURANCE',
      req
    });

    return {
      patientId,
      policies,
      claims
    };
  }

  /**
   * GET /api/patients/:patientId/laboratory
   */
  async getPatientLaboratory(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'LABORATORY');

    const labOrders = await LabRecord.find({ patientId }).sort({ orderDate: -1, createdAt: -1 }).lean();

    await this.logAccess({
      patientId,
      user,
      action: 'LAB_REPORT_VIEWED',
      resourceType: 'LABORATORY',
      req
    });

    return {
      patientId,
      total: labOrders.length,
      laboratoryOrders: labOrders
    };
  }

  /**
   * GET /api/patients/:patientId/radiology
   */
  async getPatientRadiology(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'RADIOLOGY');

    const radiologyOrders = await RadiologyRecord.find({ patientId }).sort({ orderDate: -1, createdAt: -1 }).lean();

    await this.logAccess({
      patientId,
      user,
      action: 'RADIOLOGY_REPORT_VIEWED',
      resourceType: 'RADIOLOGY',
      req
    });

    return {
      patientId,
      total: radiologyOrders.length,
      radiologyOrders
    };
  }

  /**
   * GET /api/patients/:patientId/pharmacy
   */
  async getPatientPharmacy(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'PHARMACY');

    const pharmacyDispenses = await PharmacyRecord.find({ patientId }).sort({ dispenseDate: -1, createdAt: -1 }).lean();

    await this.logAccess({
      patientId,
      user,
      action: 'PHARMACY_RECORD_VIEWED',
      resourceType: 'PHARMACY',
      req
    });

    return {
      patientId,
      total: pharmacyDispenses.length,
      pharmacyDispenses
    };
  }

  /**
   * GET /api/patients/:patientId/documents
   */
  async getPatientDocuments(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'DOCUMENT');

    const { category, documentType, search } = query;
    const filter = { entityId: patientId };

    if (documentType) {
      filter.documentType = documentType;
    }

    const documents = await GeneratedDocument.find(filter).sort({ createdAt: -1 }).lean();

    // Grouping into intuitive categories
    const categories = {
      ADMINISTRATIVE: [],
      CLINICAL: [],
      INSURANCE: [],
      DISCHARGE: [],
      OTHER: []
    };

    for (const doc of documents) {
      const type = doc.documentType || '';
      if (['REGISTRATION_RECEIPT', 'INVOICE', 'PAYMENT_RECEIPT', 'ID_CARD'].includes(type)) {
        categories.ADMINISTRATIVE.push(doc);
      } else if (['DISCHARGE_SUMMARY', 'DISCHARGE_CLEARANCE', 'GATE_PASS'].includes(type)) {
        categories.DISCHARGE.push(doc);
      } else if (['INSURANCE_PREAUTH', 'CLAIM_FORM', 'INSURANCE_APPROVAL'].includes(type)) {
        categories.INSURANCE.push(doc);
      } else if (['LAB_REPORT', 'RADIOLOGY_REPORT', 'PRESCRIPTION', 'CLINICAL_NOTE'].includes(type)) {
        categories.CLINICAL.push(doc);
      } else {
        categories.OTHER.push(doc);
      }
    }

    await this.logAccess({
      patientId,
      user,
      action: 'DOCUMENT_VIEWED',
      resourceType: 'DOCUMENT',
      req
    });

    return {
      patientId,
      total: documents.length,
      documents,
      categories
    };
  }

  /**
   * GET /api/documents/:documentId/download
   * Verified authorized document streaming / download
   */
  async downloadDocument(documentId, user, req = null) {
    const doc = await GeneratedDocument.findOne({ documentId }).lean();
    if (!doc) {
      const error = new Error(`Document with ID ${documentId} not found.`);
      error.statusCode = 404;
      error.errorCode = 'DOCUMENT_NOT_FOUND';
      throw error;
    }

    const patientId = doc.entityId;

    // Check RBAC ownership if PATIENT
    if (user?.role === 'PATIENT') {
      const linkedId = user.linkedEntityId || user.patientId;
      if (linkedId && linkedId !== patientId) {
        await this.logAccess({
          patientId,
          user,
          action: 'RECORD_ACCESS_DENIED',
          resourceType: 'DOCUMENT_DOWNLOAD',
          resourceId: documentId,
          status: 'DENIED',
          denialReason: `Patient ${linkedId} attempted unauthorized download of document ${documentId} belonging to ${patientId}`,
          req
        });

        const error = new Error('Access denied. You may only download your own authorized documents.');
        error.statusCode = 403;
        error.errorCode = 'RECORD_ACCESS_DENIED';
        throw error;
      }
    }

    // Log authorized download
    await this.logAccess({
      patientId,
      user,
      action: 'DOCUMENT_DOWNLOADED',
      resourceType: 'DOCUMENT_DOWNLOAD',
      resourceId: documentId,
      req
    });

    return {
      documentId: doc.documentId,
      title: doc.title,
      documentType: doc.documentType,
      fileUrl: doc.fileUrl,
      htmlContent: doc.htmlContent,
      createdAt: doc.createdAt
    };
  }

  /**
   * GET /api/patients/:patientId/access-history
   */
  async getPatientAccessHistory(patientId, query = {}, user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'ACCESS_LOG');

    const logs = await RecordAccessLog.find({ patientId }).sort({ timestamp: -1 }).limit(100).lean();

    return {
      patientId,
      total: logs.length,
      accessLogs: logs
    };
  }

  /**
   * PATCH /api/patients/:patientId/profile
   * Audited patient profile update with history tracking
   */
  async updatePatientProfileWithAudit(patientId, updates, reason = 'Demographic update', user = null, req = null) {
    this.assertPatientOwnership(patientId, user, req, 'PROFILE_HISTORY');

    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      const error = new Error(`Patient record with ID ${patientId} not found.`);
      error.statusCode = 404;
      error.errorCode = 'PATIENT_NOT_FOUND';
      throw error;
    }

    const sensitiveFields = ['firstName', 'lastName', 'fullName', 'dateOfBirth', 'gender', 'identityDocuments'];
    const allowedFields = [
      'mobile',
      'email',
      'address',
      'emergencyContact',
      'communicationPreferences',
      'bloodGroup',
      'notes',
      ...sensitiveFields
    ];

    const changedFields = [];
    const correlationId = req?.headers?.['x-correlation-id'] || `CORR-PROF-${Date.now()}`;

    for (const key of Object.keys(updates)) {
      if (!allowedFields.includes(key)) continue;

      const isSensitive = sensitiveFields.includes(key);

      // If user is PATIENT attempting to change sensitive identity fields without verification
      if (isSensitive && user?.role === 'PATIENT') {
        const error = new Error(`Modifications to legal identity field '${key}' require hospital staff identity verification.`);
        error.statusCode = 400;
        error.errorCode = 'SENSITIVE_IDENTITY_CHANGE_RESTRICTED';
        throw error;
      }

      const prevVal = patient[key];
      const newVal = updates[key];

      if (JSON.stringify(prevVal) !== JSON.stringify(newVal)) {
        patient[key] = newVal;
        changedFields.push(key);

        // Record in Profile History
        await PatientProfileHistory.create({
          patientId,
          patientRef: patient._id,
          field: key,
          previousValue: prevVal,
          newValue: newVal,
          reason,
          changedByUserId: user?.userId || 'SYSTEM',
          changedByName: user?.fullName || user?.name || user?.role || 'Staff',
          changedByRole: user?.role || 'SYSTEM',
          isSensitive,
          correlationId,
          timestamp: new Date()
        });
      }
    }

    if (changedFields.length > 0) {
      if (user?._id && require('mongoose').isValidObjectId(user._id)) {
        patient.updatedBy = user._id;
      }
      await patient.save();

      await this.logAccess({
        patientId,
        user,
        action: 'PATIENT_PROFILE_UPDATED',
        resourceType: 'PROFILE_HISTORY',
        resourceId: patientId,
        purpose: 'ADMINISTRATION',
        correlationId,
        metadata: { changedFields, reason },
        req
      });

      await AuditService.logEvent({
        action: 'PATIENT_PROFILE_UPDATED',
        module: 'PATIENT_RECORDS',
        userId: user?.userId || 'SYSTEM',
        role: user?.role || 'SYSTEM',
        entityType: 'PATIENT',
        entityId: patientId,
        correlationId,
        details: { changedFields, reason }
      });
    }

    return {
      patientId: patient.patientId,
      fullName: patient.fullName,
      updatedFields: changedFields,
      patient
    };
  }
}

module.exports = new PatientRecordService();
