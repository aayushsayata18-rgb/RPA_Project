const DocumentService = require('./DocumentService');
const GeneratedDocument = require('../models/GeneratedDocument');
const ExceptionService = require('./ExceptionService');

class DischargeDocumentService {
  /**
   * Generate all standard discharge documents for a discharge workflow
   */
  static async generateDischargeDocuments({
    discharge,
    admission,
    patient,
    invoice = null,
    paymentTransaction = null,
    actorUser,
    correlationId
  }) {
    const generatedDocs = [];

    try {
      // 1. Generate Clinical Discharge Summary (using authorized clinical notes)
      const summaryDoc = await DocumentService.generateDocument({
        documentType: 'DISCHARGE_SUMMARY',
        title: `Clinical Discharge Summary - ${patient?.fullName || discharge.patientName}`,
        entityType: 'Discharge',
        entityId: discharge.dischargeNumber,
        templateCode: 'DISCHARGE_SUMMARY',
        data: {
          dischargeNumber: discharge.dischargeNumber,
          patientId: patient?.patientId || discharge.patientId,
          patientName: patient?.fullName || discharge.patientName,
          gender: patient?.gender || '',
          age: patient?.age || '',
          admissionId: admission?.admissionId || discharge.admissionId,
          admissionDate: admission?.admissionDate ? new Date(admission.admissionDate).toLocaleDateString() : '',
          dischargeDate: new Date().toLocaleDateString(),
          admittingDoctor: admission?.admittingDoctorName || discharge.admittingDoctorName || 'Dr. Medical Staff',
          ward: discharge.assignedWardName || admission?.assignedWardName || 'Ward',
          bedNumber: discharge.assignedBedNumber || admission?.assignedBedNumber || '',
          clinicalDecisionReference: discharge.notes || admission?.clinicalRequirementReference || 'Discharge clinically approved'
        },
        accessRoles: ['SYSTEM_ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'],
        createdBy: actorUser?.userId || 'CLINICAL_DISCHARGE_STAFF'
      });
      generatedDocs.push(summaryDoc);

      // 2. Generate Final Invoice Document if invoice provided
      if (invoice) {
        const invoiceDoc = await DocumentService.generateDocument({
          documentType: 'INVOICE',
          title: `Final Hospital Bill - ${invoice.invoiceId}`,
          entityType: 'Invoice',
          entityId: invoice.invoiceId,
          templateCode: 'FINAL_INVOICE',
          data: {
            invoiceId: invoice.invoiceId,
            dischargeNumber: discharge.dischargeNumber,
            patientId: patient?.patientId || discharge.patientId,
            patientName: patient?.fullName || discharge.patientName,
            admissionId: admission?.admissionId || discharge.admissionId,
            grossTotal: invoice.grossTotal,
            taxAmount: invoice.taxAmount,
            discountAmount: invoice.discountAmount,
            coveredAmount: invoice.coveredAmount,
            depositAmount: invoice.depositAmount,
            payableAmount: invoice.payableAmount,
            paidAmount: invoice.paidAmount,
            outstandingBalance: invoice.outstandingBalance,
            status: invoice.status,
            invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString()
          },
          accessRoles: ['SYSTEM_ADMIN', 'BILLING_STAFF', 'RECEPTIONIST', 'PATIENT'],
          createdBy: actorUser?.userId || 'BILLING_STAFF'
        });
        generatedDocs.push(invoiceDoc);
      }

      // 3. Generate Discharge Administrative Clearance Form
      const adminDoc = await DocumentService.generateDocument({
        documentType: 'DISCHARGE_ADMIN_FORM',
        title: `Discharge Administrative Clearance - ${discharge.dischargeNumber}`,
        entityType: 'Discharge',
        entityId: discharge.dischargeNumber,
        templateCode: 'DISCHARGE_ADMIN_FORM',
        data: {
          dischargeNumber: discharge.dischargeNumber,
          patientId: patient?.patientId || discharge.patientId,
          patientName: patient?.fullName || discharge.patientName,
          admissionId: admission?.admissionId || discharge.admissionId,
          dischargeType: discharge.dischargeType,
          paymentStatus: discharge.paymentStatus,
          insuranceStatus: discharge.insuranceStatus,
          clearedBy: actorUser?.username || 'Administrative Officer',
          clearedAt: new Date().toLocaleString()
        },
        accessRoles: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RECEPTIONIST', 'PATIENT'],
        createdBy: actorUser?.userId || 'ADMIN_DISCHARGE_STAFF'
      });
      generatedDocs.push(adminDoc);

      return {
        success: true,
        documents: generatedDocs
      };
    } catch (err) {
      await ExceptionService.createException({
        code: 'DOCUMENT_GENERATION_FAILED',
        module: 'DISCHARGE_DOCUMENTS',
        severity: 'HIGH',
        message: `Discharge document generation failed for ${discharge.dischargeNumber}: ${err.message}`,
        referenceType: 'Discharge',
        referenceId: discharge.dischargeNumber,
        correlationId,
        reportedBy: actorUser?.userId || 'SYSTEM'
      });

      throw err;
    }
  }

  /**
   * Generate single document on-demand
   */
  static async generateDocument({ documentType, dischargeId, admissionId, patientId, actorUser, correlationId }) {
    const Discharge = require('../models/Discharge');
    const Admission = require('../models/Admission');
    const Patient = require('../models/Patient');
    const Invoice = require('../models/Invoice');

    const discharge = await Discharge.findOne({
      $or: [{ dischargeNumber: dischargeId }, { dischargeId }]
    });
    const admission = await Admission.findOne({ admissionId: admissionId || discharge?.admissionId });
    const patient = await Patient.findOne({ patientId: patientId || discharge?.patientId });
    const invoice = discharge?.finalInvoiceId ? await Invoice.findOne({ invoiceId: discharge.finalInvoiceId }) : null;

    const typeUpper = (documentType || 'DISCHARGE_SUMMARY').toUpperCase();

    // Check if doc already generated
    const existing = await GeneratedDocument.findOne({
      entityId: discharge?.dischargeNumber || dischargeId,
      documentType: typeUpper
    }).lean();

    if (existing) {
      return existing;
    }

    let templateCode = 'DISCHARGE_SUMMARY';
    if (typeUpper.includes('INVOICE') || typeUpper === 'FINAL_INVOICE') templateCode = 'FINAL_INVOICE';
    else if (typeUpper.includes('RECEIPT') || typeUpper === 'PAYMENT_RECEIPT') templateCode = 'PAYMENT_RECEIPT';
    else if (typeUpper.includes('CLEARANCE') || typeUpper.includes('ADMIN') || typeUpper === 'CLEARANCE_SLIP') templateCode = 'DISCHARGE_ADMIN_FORM';

    const doc = await DocumentService.generateDocument({
      documentType: typeUpper,
      title: `${typeUpper.replace(/_/g, ' ')} - ${discharge?.dischargeNumber || dischargeId}`,
      entityType: 'Discharge',
      entityId: discharge?.dischargeNumber || dischargeId,
      templateCode,
      data: {
        dischargeNumber: discharge?.dischargeNumber || dischargeId,
        patientId: patient?.patientId || discharge?.patientId || '',
        patientName: patient?.fullName || discharge?.patientName || '',
        admissionId: admission?.admissionId || discharge?.admissionId || '',
        invoiceId: invoice?.invoiceId || '',
        grossTotal: invoice?.grossTotal || 0,
        payableAmount: invoice?.payableAmount || 0,
        paidAmount: invoice?.paidAmount || 0,
        dischargeDate: new Date().toLocaleDateString(),
        clearedAt: new Date().toLocaleString()
      },
      accessRoles: ['SYSTEM_ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'],
      createdBy: actorUser?.userId || 'SYSTEM'
    });

    return doc;
  }

  /**
   * Retrieve all generated documents related to a discharge
   */
  static async getDischargeDocuments(dischargeNumber) {
    const docs = await GeneratedDocument.find({
      entityId: dischargeNumber
    }).sort({ createdAt: -1 }).lean();

    return docs;
  }
}

module.exports = DischargeDocumentService;
