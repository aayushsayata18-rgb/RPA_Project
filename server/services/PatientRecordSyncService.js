const Patient = require('../models/Patient');
const GeneratedDocument = require('../models/GeneratedDocument');
const RPAJob = require('../models/RPAJob');
const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const PatientRecordService = require('./PatientRecordService');

class PatientRecordSyncService {
  /**
   * Synchronize patient record metadata from legacy system (RPA Job workflow)
   */
  async syncLegacyPatientRecord({ legacyPatientId, patientId, syncPayload = {}, user = null, correlationId = '' }) {
    const corrId = correlationId || `CORR-SYNC-${Date.now()}`;

    // 1. Create or update RPA Job conforming to central RPAJob model
    const rpaJob = new RPAJob({
      jobId: `RPA-SYNC-${Date.now()}`,
      jobName: 'Patient Record Legacy Synchronization',
      module: 'PATIENT_RECORDS',
      targetSystem: 'LEGACY_EHR_SYSTEM',
      action: 'SYNC_PATIENT_RECORDS',
      entityType: 'Patient',
      entityId: String(patientId || legacyPatientId || 'PENDING_MATCH'),
      status: 'RUNNING',
      retryCount: 0,
      startedAt: new Date()
    });
    await rpaJob.save();

    try {
      // 2. Validate patient matching
      let query = {};
      if (patientId) {
        query.patientId = patientId;
      } else if (syncPayload.mobile) {
        query.mobile = syncPayload.mobile;
      } else if (syncPayload.fullName) {
        query.fullName = new RegExp(`^${syncPayload.fullName.trim()}$`, 'i');
      }

      const matchingPatients = await Patient.find(query);

      // Ambiguous Matching Protection: Section 55 & 58
      if (matchingPatients.length === 0) {
        rpaJob.status = 'FAILED';
        rpaJob.error = `Legacy patient ${legacyPatientId || patientId} not found in hospital database.`;
        rpaJob.completedAt = new Date();
        await rpaJob.save();

        await ExceptionCase.create({
          exceptionId: `EXC-SYNC-${Date.now()}`,
          module: 'PATIENT_RECORDS',
          entityType: 'Patient',
          entityId: String(legacyPatientId || patientId || 'UNKNOWN'),
          exceptionType: 'PATIENT_NOT_FOUND',
          description: `Legacy patient record ${legacyPatientId || patientId} not found in hospital database for sync.`,
          severity: 'MEDIUM',
          currentStatus: 'OPEN',
          metadata: {
            correlationId: corrId
          }
        });

        return {
          success: false,
          errorCode: 'PATIENT_NOT_FOUND',
          message: rpaJob.errorMessage,
          jobId: rpaJob.jobId
        };
      }

      if (matchingPatients.length > 1) {
        // Stop robot, raise human-review exception!
        rpaJob.status = 'EXCEPTION';
        rpaJob.error = `Multiple patient candidates found (${matchingPatients.map(p => p.patientId).join(', ')}). Ambiguous match stopped for human verification.`;
        rpaJob.completedAt = new Date();
        await rpaJob.save();

        await ExceptionCase.create({
          exceptionId: `EXC-AMBIGUOUS-${Date.now()}`,
          module: 'PATIENT_RECORDS',
          entityType: 'Patient',
          entityId: String(legacyPatientId || matchingPatients[0].patientId || 'AMBIGUOUS_MATCH'),
          exceptionType: 'PATIENT_MATCH_AMBIGUOUS',
          description: `RPA encountered ${matchingPatients.length} possible matching patients for legacy record. Automatic attachment blocked.`,
          severity: 'HIGH',
          currentStatus: 'UNDER_REVIEW',
          metadata: {
            candidatePatientIds: matchingPatients.map(p => p.patientId),
            correlationId: corrId
          }
        });

        return {
          success: false,
          errorCode: 'PATIENT_MATCH_AMBIGUOUS',
          message: rpaJob.error,
          jobId: rpaJob.jobId,
          candidates: matchingPatients.map(p => ({ patientId: p.patientId, fullName: p.fullName, mobile: p.mobile }))
        };
      }

      const matchedPatient = matchingPatients[0];

      // Update authorized demographic / contact fields only (NEVER clinical findings)
      const allowedUpdates = {};
      if (syncPayload.email && !matchedPatient.email) allowedUpdates.email = syncPayload.email;
      if (syncPayload.address && !matchedPatient.address?.line1) allowedUpdates.address = syncPayload.address;
      if (syncPayload.bloodGroup && matchedPatient.bloodGroup === 'UNKNOWN') allowedUpdates.bloodGroup = syncPayload.bloodGroup;

      if (Object.keys(allowedUpdates).length > 0) {
        await PatientRecordService.updatePatientProfileWithAudit(
          matchedPatient.patientId,
          allowedUpdates,
          `RPA Legacy Sync Job ${rpaJob.jobId}`,
          user || { userId: 'RPA_SYSTEM', role: 'SYSTEM' }
        );
      }

      rpaJob.status = 'SUCCESS';
      rpaJob.completedAt = new Date();
      await rpaJob.save();

      await AuditService.logEvent({
        action: 'RECORD_SYNCED',
        module: 'PATIENT_RECORDS',
        userId: user?.userId || 'RPA_SYSTEM',
        role: user?.role || 'SYSTEM',
        entityType: 'PATIENT',
        entityId: matchedPatient.patientId,
        correlationId: corrId,
        details: {
          jobId: rpaJob.jobId,
          updatedFields: Object.keys(allowedUpdates)
        }
      });

      return {
        success: true,
        message: 'Patient record synchronized successfully from legacy source.',
        patientId: matchedPatient.patientId,
        jobId: rpaJob.jobId
      };
    } catch (err) {
      rpaJob.status = 'FAILED';
      rpaJob.errorCode = 'SYNC_EXECUTION_ERROR';
      rpaJob.errorMessage = err.message;
      rpaJob.completedAt = new Date();
      await rpaJob.save();
      throw err;
    }
  }

  /**
   * Import legacy document with duplicate detection and patient linking
   */
  async importLegacyDocument({
    patientId,
    documentType,
    title,
    fileUrl,
    htmlContent = '',
    sourceDocumentId = '',
    checksum = '',
    user = null,
    correlationId = ''
  }) {
    const corrId = correlationId || `CORR-DOC-IMP-${Date.now()}`;

    // 1. Verify target patient exists
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      const error = new Error(`Cannot import document. Patient ${patientId} does not exist.`);
      error.statusCode = 404;
      error.errorCode = 'PATIENT_NOT_FOUND';
      throw error;
    }

    // 2. Duplicate Document Detection: Section 91
    const existingDoc = await GeneratedDocument.findOne({
      entityId: patientId,
      $or: [
        { 'metadata.sourceDocumentId': sourceDocumentId && sourceDocumentId !== '' ? sourceDocumentId : '__NON_EXISTING__' },
        { 'metadata.checksum': checksum && checksum !== '' ? checksum : '__NON_EXISTING__' }
      ]
    });

    if (existingDoc) {
      return {
        success: true,
        duplicateDetected: true,
        message: 'Duplicate document identified. Skipped redundant creation.',
        document: existingDoc
      };
    }

    // 3. Create document record
    const documentId = `DOC-IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newDoc = new GeneratedDocument({
      documentId,
      documentType: documentType || 'CLINICAL_REPORT',
      title: title || `${documentType} for ${patient.fullName}`,
      entityType: 'Patient',
      entityId: patientId,
      version: 1,
      fileUrl: fileUrl || `/uploads/documents/${documentId}.pdf`,
      htmlContent: htmlContent || `<div class="document-container"><h2>${title}</h2><p>Imported historical record for ${patient.fullName} (${patientId}).</p></div>`,
      metadata: {
        sourceDocumentId,
        checksum,
        importedAt: new Date(),
        source: 'RPA_LEGACY_IMPORT'
      },
      createdBy: user?.userId || 'RPA_SYSTEM',
      accessRoles: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']
    });

    await newDoc.save();

    await AuditService.logEvent({
      action: 'DOCUMENT_IMPORTED',
      module: 'PATIENT_RECORDS',
      userId: user?.userId || 'RPA_SYSTEM',
      role: user?.role || 'SYSTEM',
      entityType: 'DOCUMENT',
      entityId: documentId,
      correlationId: corrId,
      details: {
        patientId,
        documentType,
        sourceDocumentId
      }
    });

    return {
      success: true,
      duplicateDetected: false,
      message: 'Document imported and attached to patient record successfully.',
      document: newDoc
    };
  }

  /**
   * Reconcile cross-module references and identify inconsistencies
   */
  async reconcilePatientReferences(patientId) {
    const inconsistencies = [];

    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return { status: 'NOT_FOUND', inconsistencies: [`Patient ${patientId} not found.`] };
    }

    // Check admissions vs bed assignments
    const admissions = await Admission.find({ patientId });
    for (const adm of admissions) {
      if (adm.assignedBedId) {
        const bedAssign = await BedAssignment.findOne({ admissionId: adm.admissionId, bedId: adm.assignedBedId });
        if (!bedAssign) {
          inconsistencies.push({
            type: 'BED_ASSIGNMENT_MISSING',
            admissionId: adm.admissionId,
            bedId: adm.assignedBedId,
            message: `Admission ${adm.admissionId} references bed ${adm.assignedBedId} but no corresponding BedAssignment record exists.`
          });
        }
      }
    }

    // Check invoices vs patient
    const invoices = await Invoice.find({ patientId });
    for (const inv of invoices) {
      if (inv.payableAmount < 0) {
        inconsistencies.push({
          type: 'INVALID_INVOICE_AMOUNT',
          invoiceId: inv.invoiceId,
          message: `Invoice ${inv.invoiceId} has negative payable amount ${inv.payableAmount}`
        });
      }
    }

    return {
      patientId,
      healthy: inconsistencies.length === 0,
      totalInconsistencies: inconsistencies.length,
      inconsistencies
    };
  }
}

module.exports = new PatientRecordSyncService();
