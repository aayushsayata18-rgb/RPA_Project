const mongoose = require('mongoose');

/**
 * Module 28: DataQualityService
 * Surveillance engine for detecting anomalies, orphan records, missing references,
 * and creating audited exception cases without modifying source data (Section 95-97, 134)
 */
class DataQualityService {
  static getModel(modelName) {
    if (mongoose.models[modelName]) return mongoose.models[modelName];
    const modelMap = {
      Patient: 'Patient',
      Appointment: 'Appointment',
      Admission: 'Admission',
      Bed: 'Bed',
      Invoice: 'Invoice',
      Payment: 'PaymentTransaction',
      PaymentTransaction: 'PaymentTransaction',
      InventoryItem: 'InventoryItem',
      ExceptionCase: 'ExceptionCase'
    };
    const target = modelMap[modelName] || modelName;
    try {
      return require(`../models/${target}`);
    } catch (e) {
      return mongoose.model(modelName);
    }
  }

  /**
   * Run comprehensive data quality assessment across operational modules
   */
  static async runQualityAudit() {
    const findings = [];

    // 1. Check for negative inventory quantities
    try {
      const InventoryItem = this.getModel('InventoryItem');
      const negativeStock = await InventoryItem.find({ currentStock: { $lt: 0 } }).lean();
      for (const item of negativeStock) {
        findings.push({
          category: 'CALCULATION_ERROR',
          module: 'INVENTORY',
          severity: 'HIGH',
          recordId: item.itemCode || item._id,
          description: `Inventory item ${item.name || item.itemCode} has negative stock balance (${item.currentStock})`
        });
      }
    } catch (err) {
      // Ignored if model not present
    }

    // 2. Check for admissions without valid patient reference
    try {
      const Admission = this.getModel('Admission');
      const orphanAdmissions = await Admission.find({
        $or: [{ patientId: null }, { patientId: { $exists: false } }]
      }).lean();
      for (const adm of orphanAdmissions) {
        findings.push({
          category: 'MISSING_REFERENCE',
          module: 'ADMISSION',
          severity: 'CRITICAL',
          recordId: adm.admissionId || adm._id,
          description: `Inpatient admission ${adm.admissionId || adm._id} has no associated patient reference`
        });
      }
    } catch (err) {}

    // 3. Check for appointments without doctor reference
    try {
      const Appointment = this.getModel('Appointment');
      const orphanAppts = await Appointment.find({
        $or: [{ doctorId: null }, { doctorId: { $exists: false } }]
      }).lean();
      for (const appt of orphanAppts) {
        findings.push({
          category: 'MISSING_REFERENCE',
          module: 'APPOINTMENT',
          severity: 'MEDIUM',
          recordId: appt.appointmentId || appt._id,
          description: `Appointment ${appt.appointmentId || appt._id} has no assigned clinician/doctor`
        });
      }
    } catch (err) {}

    // 4. Check for beds marked OCCUPIED without active admission
    try {
      const Bed = this.getModel('Bed');
      const occupiedBeds = await Bed.find({
        status: 'OCCUPIED',
        $or: [{ currentAdmissionId: null }, { currentPatientId: null }]
      }).lean();
      for (const bed of occupiedBeds) {
        findings.push({
          category: 'ORPHAN_RECORD',
          module: 'BED',
          severity: 'HIGH',
          recordId: bed.bedNumber || bed._id,
          description: `Bed ${bed.bedNumber} is marked OCCUPIED without an active patient or admission ID`
        });
      }
    } catch (err) {}

    // 5. Check for invoices with negative total amount
    try {
      const Invoice = this.getModel('Invoice');
      const negativeInvoices = await Invoice.find({ totalAmount: { $lt: 0 } }).lean();
      for (const inv of negativeInvoices) {
        findings.push({
          category: 'CALCULATION_ERROR',
          module: 'BILLING',
          severity: 'CRITICAL',
          recordId: inv.invoiceNumber || inv._id,
          description: `Invoice ${inv.invoiceNumber} has an invalid negative total amount: INR ${inv.totalAmount}`
        });
      }
    } catch (err) {}

    return {
      auditTimestamp: new Date(),
      totalFindings: findings.length,
      criticalCount: findings.filter((f) => f.severity === 'CRITICAL').length,
      highCount: findings.filter((f) => f.severity === 'HIGH').length,
      mediumCount: findings.filter((f) => f.severity === 'MEDIUM').length,
      findings
    };
  }

  /**
   * Log an exception case for human investigation without modifying the source record
   */
  static async flagDataQualityException(finding, user = {}) {
    try {
      const ExceptionCase = this.getModel('ExceptionCase');
      const exception = new ExceptionCase({
        module: finding.module,
        caseType: 'DATA_QUALITY_ANOMALY',
        severity: finding.severity,
        title: `[Data Quality] ${finding.category} in ${finding.module}`,
        description: finding.description,
        recordReference: String(finding.recordId),
        status: 'OPEN',
        assignedTo: null,
        createdBy: user.userId || user._id || 'DATA_QUALITY_ENGINE'
      });
      await exception.save();
      return exception;
    } catch (err) {
      console.warn('[DataQualityService] Exception case creation failed:', err.message);
      return null;
    }
  }
}

module.exports = DataQualityService;
