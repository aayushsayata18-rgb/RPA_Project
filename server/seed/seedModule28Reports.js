const mongoose = require('mongoose');
const ReportDefinition = require('../models/ReportDefinition');
const KPIDefinition = require('../models/KPIDefinition');
const AnalyticsAlertRule = require('../models/AnalyticsAlertRule');
const IdGeneratorService = require('../services/IdGeneratorService');

/**
 * Module 28: Seed Default Report Catalog & KPI Definitions
 * (28_REPORTS_ANALYTICS.md Section 6, 7, 67, 102)
 */
async function seedModule28Reports() {
  console.log('[Seed Module 28] Seeding Report Catalog & KPI Definitions...');

  const reportCatalog = [
    {
      code: 'PATIENT_REGISTRATION_SUMMARY',
      name: 'Patient Registration Summary',
      category: 'PATIENT_ADMINISTRATION',
      description: 'Daily registration volume, source breakdown (online vs front desk), and identity review statistics.',
      sourceModules: ['Patient', 'Visit'],
      columns: [
        { key: 'patientId', label: 'Patient ID', dataType: 'STRING' },
        { key: 'name', label: 'Patient Name', dataType: 'STRING' },
        { key: 'phone', label: 'Phone', dataType: 'STRING' },
        { key: 'gender', label: 'Gender', dataType: 'STRING' },
        { key: 'age', label: 'Age', dataType: 'NUMBER' },
        { key: 'registrationType', label: 'Source', dataType: 'BADGE' },
        { key: 'status', label: 'Status', dataType: 'BADGE' },
        { key: 'registeredAt', label: 'Registered Date', dataType: 'DATE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'RECEPTIONIST']
    },
    {
      code: 'APPOINTMENT_SUMMARY',
      name: 'Appointment Operational Summary',
      category: 'APPOINTMENT',
      description: 'Scheduled appointments, completion rate, cancellations, and no-shows by doctor and department.',
      sourceModules: ['Appointment', 'Doctor'],
      columns: [
        { key: 'appointmentId', label: 'Appointment ID', dataType: 'STRING' },
        { key: 'patientName', label: 'Patient Name', dataType: 'STRING' },
        { key: 'doctorName', label: 'Doctor', dataType: 'STRING' },
        { key: 'department', label: 'Department', dataType: 'STRING' },
        { key: 'appointmentDate', label: 'Date', dataType: 'DATE' },
        { key: 'timeSlot', label: 'Slot', dataType: 'STRING' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR', 'NURSE']
    },
    {
      code: 'OPD_QUEUE_SUMMARY',
      name: 'OPD Queue & Token Summary',
      category: 'OPD',
      description: 'Daily outpatient tokens, wait times, consultation times, and queue throughput.',
      sourceModules: ['OpdQueueToken'],
      columns: [
        { key: 'tokenId', label: 'Token ID', dataType: 'STRING' },
        { key: 'tokenNumber', label: 'Token #', dataType: 'NUMBER' },
        { key: 'patientId', label: 'Patient ID', dataType: 'STRING' },
        { key: 'doctorName', label: 'Doctor', dataType: 'STRING' },
        { key: 'department', label: 'Department', dataType: 'STRING' },
        { key: 'waitTimeMinutes', label: 'Wait (min)', dataType: 'NUMBER' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR', 'NURSE']
    },
    {
      code: 'BED_OCCUPANCY',
      name: 'Bed Occupancy & Census Report',
      category: 'BED',
      description: 'Real-time bed availability, ward census, and sanitization turnover tracking.',
      sourceModules: ['Bed'],
      columns: [
        { key: 'bedId', label: 'Bed ID', dataType: 'STRING' },
        { key: 'bedNumber', label: 'Bed #', dataType: 'STRING' },
        { key: 'ward', label: 'Ward', dataType: 'STRING' },
        { key: 'roomNumber', label: 'Room', dataType: 'STRING' },
        { key: 'category', label: 'Tier', dataType: 'STRING' },
        { key: 'status', label: 'Status', dataType: 'BADGE' },
        { key: 'occupancyState', label: 'Occupancy', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'NURSE']
    },
    {
      code: 'ADMISSION_SUMMARY',
      name: 'Inpatient Admissions Summary',
      category: 'ADMISSION',
      description: 'Inpatient stay requests, current ward admissions, and average length of stay.',
      sourceModules: ['Admission', 'Bed'],
      columns: [
        { key: 'admissionId', label: 'Admission ID', dataType: 'STRING' },
        { key: 'patientName', label: 'Patient', dataType: 'STRING' },
        { key: 'ward', label: 'Ward', dataType: 'STRING' },
        { key: 'bedNumber', label: 'Bed', dataType: 'STRING' },
        { key: 'admittedAt', label: 'Admitted Date', dataType: 'DATE' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR', 'NURSE']
    },
    {
      code: 'DISCHARGE_SUMMARY',
      name: 'Discharge Clearance Summary',
      category: 'DISCHARGE',
      description: 'Discharge clearances, clinical vs billing settlement gate completion.',
      sourceModules: ['Discharge'],
      columns: [
        { key: 'dischargeId', label: 'Discharge ID', dataType: 'STRING' },
        { key: 'patientName', label: 'Patient', dataType: 'STRING' },
        { key: 'dischargeType', label: 'Type', dataType: 'STRING' },
        { key: 'clinicalClearance', label: 'Clinical', dataType: 'BADGE' },
        { key: 'financialClearance', label: 'Financial', dataType: 'BADGE' },
        { key: 'status', label: 'Status', dataType: 'BADGE' },
        { key: 'dischargedAt', label: 'Discharged Date', dataType: 'DATE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'DOCTOR', 'BILLING_OFFICER']
    },
    {
      code: 'BILLING_SUMMARY',
      name: 'Hospital Revenue & Invoicing Summary',
      category: 'BILLING',
      description: 'Multi-service billed amounts, collected receipts, outstanding patient ledger.',
      sourceModules: ['Invoice', 'Payment'],
      columns: [
        { key: 'invoiceNumber', label: 'Invoice #', dataType: 'STRING' },
        { key: 'patientName', label: 'Patient', dataType: 'STRING' },
        { key: 'totalAmount', label: 'Total (INR)', dataType: 'CURRENCY' },
        { key: 'paidAmount', label: 'Paid (INR)', dataType: 'CURRENCY' },
        { key: 'balanceAmount', label: 'Balance (INR)', dataType: 'CURRENCY' },
        { key: 'paymentStatus', label: 'Status', dataType: 'BADGE' },
        { key: 'createdAt', label: 'Date', dataType: 'DATE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'BILLING_OFFICER', 'FINANCE_MANAGER']
    },
    {
      code: 'PAYMENT_SUMMARY',
      name: 'Payment Collections & Gateway Ledger',
      category: 'PAYMENT',
      description: 'Real-time cash, card, UPI, and gateway transactions with reconciliation audit.',
      sourceModules: ['Payment'],
      columns: [
        { key: 'receiptNumber', label: 'Receipt #', dataType: 'STRING' },
        { key: 'invoiceNumber', label: 'Invoice #', dataType: 'STRING' },
        { key: 'amount', label: 'Amount (INR)', dataType: 'CURRENCY' },
        { key: 'paymentMethod', label: 'Method', dataType: 'BADGE' },
        { key: 'transactionId', label: 'Txn Ref', dataType: 'STRING' },
        { key: 'status', label: 'Status', dataType: 'BADGE' },
        { key: 'paidAt', label: 'Timestamp', dataType: 'DATE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'BILLING_OFFICER', 'FINANCE_MANAGER']
    },
    {
      code: 'INSURANCE_VERIFICATION_SUMMARY',
      name: 'Insurance Pre-Auth & Verification Audit',
      category: 'INSURANCE',
      description: 'Policy verification, pre-authorization turnarounds, and rejection tracking.',
      sourceModules: ['InsuranceVerification'],
      columns: [
        { key: 'verificationId', label: 'Verification ID', dataType: 'STRING' },
        { key: 'providerName', label: 'TPA / Insurer', dataType: 'STRING' },
        { key: 'policyNumber', label: 'Policy #', dataType: 'STRING' },
        { key: 'coverageAmount', label: 'Coverage (INR)', dataType: 'CURRENCY' },
        { key: 'status', label: 'Status', dataType: 'BADGE' },
        { key: 'createdAt', label: 'Date', dataType: 'DATE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'INSURANCE_OFFICER']
    },
    {
      code: 'PHARMACY_DISPENSING_SUMMARY',
      name: 'Pharmacy Orders & Dispensing Register',
      category: 'PHARMACY',
      description: 'Prescription fulfillment, stock reservation, and medication dispense turnaround.',
      sourceModules: ['PharmacyOrder'],
      columns: [
        { key: 'orderNumber', label: 'Order #', dataType: 'STRING' },
        { key: 'patientName', label: 'Patient', dataType: 'STRING' },
        { key: 'doctorName', label: 'Prescriber', dataType: 'STRING' },
        { key: 'itemCount', label: 'Medicines', dataType: 'NUMBER' },
        { key: 'totalAmount', label: 'Total (INR)', dataType: 'CURRENCY' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PHARMACIST']
    },
    {
      code: 'INVENTORY_STOCK_SUMMARY',
      name: 'Medical Inventory Valuation & Stock Alert',
      category: 'INVENTORY',
      description: 'Stock levels, valuation, reorder thresholds, and batch expiry monitoring.',
      sourceModules: ['StockItem'],
      columns: [
        { key: 'itemCode', label: 'Item Code', dataType: 'STRING' },
        { key: 'name', label: 'Item Name', dataType: 'STRING' },
        { key: 'category', label: 'Category', dataType: 'STRING' },
        { key: 'currentStock', label: 'Stock Qty', dataType: 'NUMBER' },
        { key: 'reorderLevel', label: 'Reorder Level', dataType: 'NUMBER' },
        { key: 'unitPrice', label: 'Unit Price (INR)', dataType: 'CURRENCY' },
        { key: 'isLowStock', label: 'Low Stock?', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER', 'PHARMACIST']
    },
    {
      code: 'PROCUREMENT_SUMMARY',
      name: 'Procurement Spend & PO Register',
      category: 'PROCUREMENT',
      description: 'Purchase requisitions, purchase orders, vendor quotations, and spend analytics.',
      sourceModules: ['PurchaseOrder'],
      columns: [
        { key: 'poNumber', label: 'PO #', dataType: 'STRING' },
        { key: 'vendorName', label: 'Vendor', dataType: 'STRING' },
        { key: 'itemCount', label: 'Items', dataType: 'NUMBER' },
        { key: 'totalAmount', label: 'Total Spend (INR)', dataType: 'CURRENCY' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'PROCUREMENT_OFFICER']
    },
    {
      code: 'ATTENDANCE_SUMMARY',
      name: 'Staff Biometric Attendance Register',
      category: 'ATTENDANCE',
      description: 'Employee check-in logs, punctuality metrics, overtime hours, and absence rate.',
      sourceModules: ['Attendance'],
      columns: [
        { key: 'attendanceId', label: 'Log ID', dataType: 'STRING' },
        { key: 'employeeName', label: 'Employee', dataType: 'STRING' },
        { key: 'department', label: 'Department', dataType: 'STRING' },
        { key: 'date', label: 'Date', dataType: 'STRING' },
        { key: 'status', label: 'Status', dataType: 'BADGE' },
        { key: 'workHours', label: 'Hours', dataType: 'NUMBER' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'HR_MANAGER']
    },
    {
      code: 'SHIFT_COVERAGE',
      name: 'Shift Coverage & Clinical Rota',
      category: 'SHIFT',
      description: 'Ward nurse and doctor duty shifts, coverage deficiencies, and swap requests.',
      sourceModules: ['ShiftRoster'],
      columns: [
        { key: 'rosterId', label: 'Roster ID', dataType: 'STRING' },
        { key: 'employeeName', label: 'Staff Member', dataType: 'STRING' },
        { key: 'shiftName', label: 'Shift', dataType: 'STRING' },
        { key: 'department', label: 'Department', dataType: 'STRING' },
        { key: 'date', label: 'Date', dataType: 'DATE' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'HR_MANAGER']
    },
    {
      code: 'LEAVE_SUMMARY',
      name: 'Staff Leave Utilization Register',
      category: 'LEAVE',
      description: 'Employee leave requests, entitlement balances, and managerial approval queues.',
      sourceModules: ['LeaveRequest'],
      columns: [
        { key: 'leaveId', label: 'Leave ID', dataType: 'STRING' },
        { key: 'employeeName', label: 'Employee', dataType: 'STRING' },
        { key: 'leaveType', label: 'Type', dataType: 'STRING' },
        { key: 'daysCount', label: 'Days', dataType: 'NUMBER' },
        { key: 'startDate', label: 'Start', dataType: 'DATE' },
        { key: 'endDate', label: 'End', dataType: 'DATE' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'HR_MANAGER']
    },
    {
      code: 'LAB_ORDER_SUMMARY',
      name: 'Diagnostic Laboratory Workload & TAT',
      category: 'LABORATORY',
      description: 'Specimen orders, bench processing queues, pathologist reviews, and TAT compliance.',
      sourceModules: ['LabOrder'],
      columns: [
        { key: 'orderNumber', label: 'Order #', dataType: 'STRING' },
        { key: 'testName', label: 'Test Name', dataType: 'STRING' },
        { key: 'priority', label: 'Priority', dataType: 'BADGE' },
        { key: 'status', label: 'Status', dataType: 'BADGE' },
        { key: 'createdAt', label: 'Ordered At', dataType: 'DATE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'LAB_TECHNICIAN', 'PATHOLOGIST']
    },
    {
      code: 'RADIOLOGY_ORDER_SUMMARY',
      name: 'Radiology Modality & Imaging Throughput',
      category: 'RADIOLOGY',
      description: 'X-Ray, CT, and MRI orders, technician queues, and radiologist verified report turnarounds.',
      sourceModules: ['RadiologyOrder'],
      columns: [
        { key: 'orderNumber', label: 'Order #', dataType: 'STRING' },
        { key: 'examName', label: 'Exam Name', dataType: 'STRING' },
        { key: 'modality', label: 'Modality', dataType: 'STRING' },
        { key: 'status', label: 'Status', dataType: 'BADGE' },
        { key: 'createdAt', label: 'Ordered At', dataType: 'DATE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'RADIOLOGY_TECHNICIAN']
    },
    {
      code: 'MAINTENANCE_SUMMARY',
      name: 'Biomedical Asset Maintenance & SLA',
      category: 'MAINTENANCE',
      description: 'Corrective and preventive work orders, technician dispatch, MTBF, and equipment downtime.',
      sourceModules: ['MaintenanceWorkOrder'],
      columns: [
        { key: 'workOrderId', label: 'Work Order #', dataType: 'STRING' },
        { key: 'assetName', label: 'Equipment', dataType: 'STRING' },
        { key: 'category', label: 'Category', dataType: 'STRING' },
        { key: 'priority', label: 'Priority', dataType: 'BADGE' },
        { key: 'assignedTo', label: 'Technician', dataType: 'STRING' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'MAINTENANCE']
    },
    {
      code: 'HOUSEKEEPING_SUMMARY',
      name: 'Housekeeping & Hygiene Turnover Register',
      category: 'HOUSEKEEPING',
      description: 'Room turnovers, terminal disinfection checklists, and inspection compliance.',
      sourceModules: ['HousekeepingTask'],
      columns: [
        { key: 'taskId', label: 'Task ID', dataType: 'STRING' },
        { key: 'area', label: 'Area / Room', dataType: 'STRING' },
        { key: 'taskType', label: 'Type', dataType: 'STRING' },
        { key: 'assignedTo', label: 'Attendant', dataType: 'STRING' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT']
    },
    {
      code: 'PATIENT_FEEDBACK_SUMMARY',
      name: 'Patient Feedback, Ratings & Grievances',
      category: 'FEEDBACK',
      description: 'Patient satisfaction ratings, departmental grievances, SLA tracking, and resolution times.',
      sourceModules: ['Feedback'],
      columns: [
        { key: 'feedbackId', label: 'Case ID', dataType: 'STRING' },
        { key: 'type', label: 'Type', dataType: 'BADGE' },
        { key: 'category', label: 'Category', dataType: 'STRING' },
        { key: 'rating', label: 'Rating (1-5)', dataType: 'NUMBER' },
        { key: 'assignedDepartment', label: 'Department', dataType: 'STRING' },
        { key: 'slaStatus', label: 'SLA State', dataType: 'BADGE' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT', 'GRIEVANCE_OFFICER']
    },
    {
      code: 'NOTIFICATION_DELIVERY',
      name: 'Central Notification & Communication Audit',
      category: 'NOTIFICATION',
      description: 'SMS, Email, and In-App message volume, delivery success rates, and webhook reconciliations.',
      sourceModules: ['Notification'],
      columns: [
        { key: 'notificationId', label: 'Notification ID', dataType: 'STRING' },
        { key: 'type', label: 'Event', dataType: 'STRING' },
        { key: 'channels', label: 'Channels', dataType: 'STRING' },
        { key: 'priority', label: 'Priority', dataType: 'BADGE' },
        { key: 'status', label: 'Delivery Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT']
    },
    {
      code: 'DOCUMENT_GENERATION',
      name: 'Clinical & Operational Document Manifest',
      category: 'DOCUMENT',
      description: 'Generated certified PDFs, clinical approval states, file checksums, and package downloads.',
      sourceModules: ['GeneratedDocument'],
      columns: [
        { key: 'documentId', label: 'Document ID', dataType: 'STRING' },
        { key: 'documentType', label: 'Type', dataType: 'STRING' },
        { key: 'title', label: 'Title', dataType: 'STRING' },
        { key: 'format', label: 'Format', dataType: 'BADGE' },
        { key: 'fileChecksum', label: 'SHA-256', dataType: 'STRING' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT']
    },
    {
      code: 'RPA_EXECUTION',
      name: 'Robotic Process Automation (RPA) Audit',
      category: 'RPA',
      description: 'Automated background bots, batch ingestion, success/failure rate, and exceptions.',
      sourceModules: ['RPAJob', 'RPAExecution'],
      columns: [
        { key: 'jobId', label: 'Job ID', dataType: 'STRING' },
        { key: 'name', label: 'Bot Task', dataType: 'STRING' },
        { key: 'recordsProcessed', label: 'Records', dataType: 'NUMBER' },
        { key: 'durationMs', label: 'Duration (ms)', dataType: 'NUMBER' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT']
    },
    {
      code: 'EXCEPTION_SUMMARY',
      name: 'Operational & Business Exception Cases',
      category: 'EXCEPTION',
      description: 'Centralized exception tracker, aging unresolved anomalies, and supervisory resolutions.',
      sourceModules: ['ExceptionCase'],
      columns: [
        { key: 'exceptionId', label: 'Exception ID', dataType: 'STRING' },
        { key: 'module', label: 'Module', dataType: 'STRING' },
        { key: 'exceptionType', label: 'Type', dataType: 'STRING' },
        { key: 'severity', label: 'Severity', dataType: 'BADGE' },
        { key: 'status', label: 'Status', dataType: 'BADGE' }
      ],
      permissions: ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT']
    }
  ];

  for (const rpt of reportCatalog) {
    const existing = await ReportDefinition.findOne({ code: rpt.code });
    if (!existing) {
      const reportId = await IdGeneratorService.generateReportDefinitionId();
      await ReportDefinition.create({
        reportId,
        ...rpt,
        exportFormats: ['CSV', 'JSON', 'PDF', 'XLSX'],
        enabled: true,
        version: 1
      });
    }
  }

  // Seed KPI Definitions (Section 67)
  const kpiDefinitions = [
    {
      kpiCode: 'PATIENTS_REGISTERED_TODAY',
      name: 'Patients Registered Today',
      category: 'PATIENT_ADMINISTRATION',
      unit: 'COUNT',
      targetValue: 50,
      direction: 'HIGHER_IS_BETTER'
    },
    {
      kpiCode: 'BED_OCCUPANCY_RATE',
      name: 'Bed Occupancy Rate (%)',
      category: 'BED',
      unit: 'PERCENTAGE',
      targetValue: 85,
      warningThreshold: 90,
      criticalThreshold: 95,
      direction: 'TARGET_IS_BETTER'
    },
    {
      kpiCode: 'APPOINTMENT_COMPLETION_RATE',
      name: 'Appointment Completion Rate (%)',
      category: 'APPOINTMENT',
      unit: 'PERCENTAGE',
      targetValue: 95,
      direction: 'HIGHER_IS_BETTER'
    },
    {
      kpiCode: 'REVENUE_COLLECTED_TODAY',
      name: 'Revenue Collections Today (INR)',
      category: 'BILLING',
      unit: 'CURRENCY_INR',
      targetValue: 100000,
      direction: 'HIGHER_IS_BETTER'
    },
    {
      kpiCode: 'OUTSTANDING_RECEIVABLES',
      name: 'Total Outstanding Receivables (INR)',
      category: 'BILLING',
      unit: 'CURRENCY_INR',
      targetValue: 50000,
      direction: 'LOWER_IS_BETTER'
    },
    {
      kpiCode: 'PATIENT_SATISFACTION_INDEX',
      name: 'Patient Satisfaction Rating (1-5)',
      category: 'FEEDBACK',
      unit: 'RATING',
      targetValue: 4.5,
      warningThreshold: 3.5,
      criticalThreshold: 3.0,
      direction: 'HIGHER_IS_BETTER'
    },
    {
      kpiCode: 'RPA_SUCCESS_RATE',
      name: 'RPA Automation Success Rate (%)',
      category: 'RPA',
      unit: 'PERCENTAGE',
      targetValue: 98,
      warningThreshold: 95,
      criticalThreshold: 90,
      direction: 'HIGHER_IS_BETTER'
    },
    {
      kpiCode: 'CRITICAL_EXCEPTIONS_OPEN',
      name: 'Open Critical Exceptions',
      category: 'EXCEPTION',
      unit: 'COUNT',
      targetValue: 0,
      warningThreshold: 5,
      criticalThreshold: 10,
      direction: 'LOWER_IS_BETTER'
    }
  ];

  for (const kpi of kpiDefinitions) {
    await KPIDefinition.findOneAndUpdate({ kpiCode: kpi.kpiCode }, kpi, { upsert: true, new: true });
  }

  // Seed sample Alert Rule
  const sampleRule = {
    ruleId: 'RULE-2026-000001',
    name: 'Bed Occupancy Warning Alert',
    metricCode: 'BED_OCCUPANCY_RATE',
    operator: 'GTE',
    threshold: 85,
    severity: 'WARNING',
    status: 'ACTIVE',
    enabled: true
  };
  await AnalyticsAlertRule.findOneAndUpdate({ ruleId: sampleRule.ruleId }, sampleRule, { upsert: true, new: true });

  console.log('[Seed Module 28] Successfully seeded 24 Report Definitions and 8 KPI Definitions.');
}

module.exports = seedModule28Reports;
