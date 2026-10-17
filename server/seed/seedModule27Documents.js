require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const GeneratedDocument = require('../models/GeneratedDocument');
const DocumentTemplate = require('../models/DocumentTemplate');
const DocumentPackage = require('../models/DocumentPackage');
const DocumentAccessLog = require('../models/DocumentAccessLog');
const PdfRenderer = require('../renderers/PdfRenderer');
const storage = require('../storage/storageImplementation');

/**
 * Module 27: Document Generation & Management Master Seed
 * (27_DOCUMENT_GENERATION.md Section 119)
 */
const seedModule27Documents = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
      console.log('[Seed Documents] Connected to MongoDB.');
    }

    console.log('[Seed Documents] Seeding Document Templates (10+ types)...');

    // 1. Seed 10 Document Templates (Section 5, 13, 119)
    const templates = [
      {
        templateId: 'TPL-2026-000001',
        templateCode: 'FINAL_INVOICE_V1',
        name: 'Final Hospital Billing Invoice Template',
        description: 'Standardized patient discharge and final billing invoice',
        documentType: 'FINAL_INVOICE',
        category: 'FINANCIAL',
        language: 'en-IN',
        version: 1,
        format: 'PDF',
        headerText: 'CITY GENERAL HOSPITAL & MEDICAL RESEARCH CENTER - BILLING',
        footerText: 'This is a computer generated invoice. Contact billing desk for queries.',
        variables: [
          { name: 'patientName', type: 'String', required: true, description: 'Full Patient Name' },
          { name: 'patientId', type: 'String', required: true, description: 'Unique Patient ID' },
          { name: 'invoiceNumber', type: 'String', required: true, description: 'Invoice ID' },
          { name: 'totalAmount', type: 'Number', required: true, description: 'Total Payable Amount' },
          { name: 'paidAmount', type: 'Number', required: false, description: 'Amount Paid' },
          { name: 'dueAmount', type: 'Number', required: false, description: 'Balance Due' }
        ],
        sampleData: {
          patientName: 'Aarav Patel',
          patientId: 'P10001',
          invoiceNumber: 'INV-2026-10001',
          totalAmount: 18500,
          paidAmount: 18500,
          dueAmount: 0
        },
        enabled: true,
        isActive: true,
        approvalRequired: false
      },
      {
        templateId: 'TPL-2026-000002',
        templateCode: 'PAYMENT_RECEIPT_V1',
        name: 'Official Cashier Payment Receipt',
        description: 'Instant receipt for patient OPD/IPD counter payments',
        documentType: 'PAYMENT_RECEIPT',
        category: 'FINANCIAL',
        language: 'en-IN',
        version: 1,
        format: 'PDF',
        headerText: 'CITY GENERAL HOSPITAL - TREASURY & ACCOUNTS',
        footerText: 'Payment receipt valid for tax exemptions under Section 80D.',
        variables: [
          { name: 'patientName', type: 'String', required: true },
          { name: 'patientId', type: 'String', required: true },
          { name: 'receiptNumber', type: 'String', required: true },
          { name: 'amountPaid', type: 'Number', required: true },
          { name: 'paymentMode', type: 'String', required: true }
        ],
        sampleData: {
          patientName: 'Aarav Patel',
          patientId: 'P10001',
          receiptNumber: 'RCP-2026-00101',
          amountPaid: 2500,
          paymentMode: 'UPI'
        },
        enabled: true,
        isActive: true,
        approvalRequired: false
      },
      {
        templateId: 'TPL-2026-000003',
        templateCode: 'LAB_REPORT_V1',
        name: 'Clinical Pathology Laboratory Test Report',
        description: 'Standard verified diagnostic laboratory results certificate',
        documentType: 'LAB_REPORT',
        category: 'LABORATORY',
        language: 'en-IN',
        version: 1,
        format: 'PDF',
        headerText: 'DEPARTMENT OF LABORATORY MEDICINE & PATHOLOGY',
        footerText: 'Results correlate with clinical findings. Certified by Pathologist.',
        variables: [
          { name: 'patientName', type: 'String', required: true },
          { name: 'patientId', type: 'String', required: true },
          { name: 'testName', type: 'String', required: true },
          { name: 'specimen', type: 'String', required: true },
          { name: 'resultSummary', type: 'String', required: true }
        ],
        sampleData: {
          patientName: 'Meera Sharma',
          patientId: 'P10002',
          testName: 'Complete Blood Count (CBC) with ESR',
          specimen: 'Whole Blood (EDTA)',
          resultSummary: 'Hemoglobin: 13.8 g/dL, WBC: 6,800 /mcL, Platelets: 240,000 /mcL (Normal limits)'
        },
        enabled: true,
        isActive: true,
        approvalRequired: true
      },
      {
        templateId: 'TPL-2026-000004',
        templateCode: 'RADIOLOGY_REPORT_V1',
        name: 'Diagnostic Imaging & Radiology Findings Report',
        description: 'Detailed report with radiologist impression and findings',
        documentType: 'RADIOLOGY_REPORT',
        category: 'RADIOLOGY',
        language: 'en-IN',
        version: 1,
        format: 'PDF',
        headerText: 'DEPARTMENT OF RADIODIAGNOSIS & INTERVENTIONAL IMAGING',
        footerText: 'Verified and signed by Consultant Radiologist.',
        variables: [
          { name: 'patientName', type: 'String', required: true },
          { name: 'patientId', type: 'String', required: true },
          { name: 'modality', type: 'String', required: true },
          { name: 'bodyPart', type: 'String', required: true },
          { name: 'impression', type: 'String', required: true }
        ],
        sampleData: {
          patientName: 'Vikram Malhotra',
          patientId: 'P10003',
          modality: 'X-RAY',
          bodyPart: 'Chest PA View',
          impression: 'Lungs are clear. Cardiothoracic ratio is normal. No focal lesion.'
        },
        enabled: true,
        isActive: true,
        approvalRequired: true
      },
      {
        templateId: 'TPL-2026-000005',
        templateCode: 'DISCHARGE_SUMMARY_V1',
        name: 'Inpatient Clinical Discharge Summary',
        description: 'Comprehensive clinical synopsis, diagnosis, medications, and advice',
        documentType: 'DISCHARGE_SUMMARY',
        category: 'CLINICAL',
        language: 'en-IN',
        version: 1,
        format: 'PDF',
        headerText: 'CLINICAL CARE DIVISION - INPATIENT DISCHARGE SUMMARY',
        footerText: 'Follow medication instructions strictly. Contact emergency if symptoms worsen.',
        variables: [
          { name: 'patientName', type: 'String', required: true },
          { name: 'patientId', type: 'String', required: true },
          { name: 'admissionDate', type: 'String', required: true },
          { name: 'dischargeDate', type: 'String', required: true },
          { name: 'primaryDiagnosis', type: 'String', required: true },
          { name: 'dischargeAdvice', type: 'String', required: true }
        ],
        sampleData: {
          patientName: 'Aarav Patel',
          patientId: 'P10001',
          admissionDate: '2026-10-10',
          dischargeDate: '2026-10-14',
          primaryDiagnosis: 'Acute Gastroenteritis with moderate dehydration - Resolved',
          dischargeAdvice: 'High fluid intake, tab Pantoprazole 40mg OD x 5 days, review in OPD after 7 days.'
        },
        enabled: true,
        isActive: true,
        approvalRequired: true
      },
      {
        templateId: 'TPL-2026-000006',
        templateCode: 'PATIENT_REGISTRATION_RECEIPT_V1',
        name: 'Patient Registration & Identity Card',
        description: 'Initial UHID allocation card and hospital registration proof',
        documentType: 'PATIENT_REGISTRATION_RECEIPT',
        category: 'PATIENT',
        language: 'en-IN',
        version: 1,
        format: 'PDF',
        headerText: 'PATIENT REGISTRATION & MEDICAL RECORDS',
        footerText: 'Please preserve your UHID number for all future hospital visits.',
        variables: [
          { name: 'patientName', type: 'String', required: true },
          { name: 'patientId', type: 'String', required: true },
          { name: 'contactNumber', type: 'String', required: true },
          { name: 'registrationDate', type: 'String', required: true }
        ],
        sampleData: {
          patientName: 'Aarav Patel',
          patientId: 'P10001',
          contactNumber: '+91 98765 43210',
          registrationDate: '2026-10-01'
        },
        enabled: true,
        isActive: true,
        approvalRequired: false
      },
      {
        templateId: 'TPL-2026-000007',
        templateCode: 'ADMISSION_CONFIRMATION_V1',
        name: 'Inpatient Admission & Bed Allocation Confirmation',
        description: 'Proof of admission, ward allotment, and attending physician assignment',
        documentType: 'ADMISSION_CONFIRMATION',
        category: 'OPERATIONS',
        language: 'en-IN',
        version: 1,
        format: 'PDF',
        headerText: 'CENTRAL ADMISSION OFFICE & BED MANAGEMENT',
        footerText: 'Visitors strictly restricted to official visiting hours (5 PM - 7 PM).',
        variables: [
          { name: 'patientName', type: 'String', required: true },
          { name: 'patientId', type: 'String', required: true },
          { name: 'wardName', type: 'String', required: true },
          { name: 'bedNumber', type: 'String', required: true },
          { name: 'attendingDoctor', type: 'String', required: true }
        ],
        sampleData: {
          patientName: 'Meera Sharma',
          patientId: 'P10002',
          wardName: 'General Medical Ward 3',
          bedNumber: 'GMW-304',
          attendingDoctor: 'Dr. Suresh Rao (MD Internal Medicine)'
        },
        enabled: true,
        isActive: true,
        approvalRequired: false
      },
      {
        templateId: 'TPL-2026-000008',
        templateCode: 'PURCHASE_ORDER_V1',
        name: 'Official Procurement Purchase Order',
        description: 'Vendor purchase order contract for medical supplies and pharmaceuticals',
        documentType: 'PURCHASE_ORDER',
        category: 'PROCUREMENT',
        language: 'en-IN',
        version: 1,
        format: 'PDF',
        headerText: 'SUPPLY CHAIN & PROCUREMENT DIRECTORATE',
        footerText: 'Delivery terms: FOB Hospital Central Warehouse. Payment net 30 days.',
        variables: [
          { name: 'poNumber', type: 'String', required: true },
          { name: 'vendorName', type: 'String', required: true },
          { name: 'orderDate', type: 'String', required: true },
          { name: 'totalAmount', type: 'Number', required: true },
          { name: 'deliveryDate', type: 'String', required: true }
        ],
        sampleData: {
          poNumber: 'PO-2026-000101',
          vendorName: 'Apex Meditech Solutions Pvt Ltd',
          orderDate: '2026-10-12',
          totalAmount: 145000,
          deliveryDate: '2026-10-25'
        },
        enabled: true,
        isActive: true,
        approvalRequired: true
      },
      {
        templateId: 'TPL-2026-000009',
        templateCode: 'FEEDBACK_ACKNOWLEDGEMENT_V1',
        name: 'Patient Feedback & Grievance Official Acknowledgement',
        description: 'Formal acknowledgement letter issued to patient with grievance ticket tracking',
        documentType: 'FEEDBACK_ACKNOWLEDGEMENT',
        category: 'ADMINISTRATION',
        language: 'en-IN',
        version: 1,
        format: 'PDF',
        headerText: 'PATIENT ADVOCACY & QUALITY ASSURANCE CELL',
        footerText: 'Our quality team investigates all concerns with highest priority.',
        variables: [
          { name: 'patientName', type: 'String', required: true },
          { name: 'grievanceId', type: 'String', required: true },
          { name: 'category', type: 'String', required: true },
          { name: 'expectedResolution', type: 'String', required: true }
        ],
        sampleData: {
          patientName: 'Vikram Malhotra',
          grievanceId: 'FB-2026-00001',
          category: 'Staff Courteousness',
          expectedResolution: 'Within 48 business hours'
        },
        enabled: true,
        isActive: true,
        approvalRequired: false
      },
      {
        templateId: 'TPL-2026-000010',
        templateCode: 'ATTENDANCE_REPORT_V1',
        name: 'Monthly Employee Shift & Attendance Summary',
        description: 'Certified payroll and HR staff biometric attendance report',
        documentType: 'ATTENDANCE_REPORT',
        category: 'HR',
        language: 'en-IN',
        version: 1,
        format: 'PDF',
        headerText: 'HUMAN RESOURCES MANAGEMENT & BIOMETRIC AUDIT',
        footerText: 'Internal confidential HR audit report.',
        variables: [
          { name: 'employeeName', type: 'String', required: true },
          { name: 'employeeId', type: 'String', required: true },
          { name: 'month', type: 'String', required: true },
          { name: 'presentDays', type: 'Number', required: true },
          { name: 'leaveDays', type: 'Number', required: true }
        ],
        sampleData: {
          employeeName: 'Dr. Neha Kapoor',
          employeeId: 'E10001',
          month: 'October 2026',
          presentDays: 22,
          leaveDays: 2
        },
        enabled: true,
        isActive: true,
        approvalRequired: false
      }
    ];

    for (const t of templates) {
      await DocumentTemplate.findOneAndUpdate(
        { templateCode: t.templateCode },
        t,
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed Documents] Successfully seeded ${templates.length} templates.`);

    // 2. Seed 20 Generated Documents covering statuses (Section 119)
    console.log('[Seed Documents] Seeding 20 Generated Documents across lifecycle states...');

    const sampleDocs = [
      // 1-5 Released Patient / Clinical Documents
      {
        documentId: 'DOC-2026-000001',
        documentType: 'FINAL_INVOICE',
        category: 'FINANCIAL',
        title: 'Final Inpatient Invoice - Aarav Patel',
        patientId: 'P10001',
        patientName: 'Aarav Patel',
        version: 2,
        status: 'RELEASED',
        confidentiality: 'NORMAL',
        supersedesDocumentId: 'DOC-2026-000002',
        metadata: {
          patientName: 'Aarav Patel',
          patientId: 'P10001',
          invoiceNumber: 'INV-2026-10001',
          totalAmount: 18500,
          paidAmount: 18500,
          dueAmount: 0
        }
      },
      {
        documentId: 'DOC-2026-000002',
        documentType: 'FINAL_INVOICE',
        category: 'FINANCIAL',
        title: 'Final Inpatient Invoice v1 (Superseded)',
        patientId: 'P10001',
        patientName: 'Aarav Patel',
        version: 1,
        status: 'SUPERSEDED',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Aarav Patel',
          patientId: 'P10001',
          invoiceNumber: 'INV-2026-10001',
          totalAmount: 19500,
          paidAmount: 18500,
          dueAmount: 1000
        }
      },
      {
        documentId: 'DOC-2026-000003',
        documentType: 'PAYMENT_RECEIPT',
        category: 'FINANCIAL',
        title: 'Official Payment Receipt - Aarav Patel',
        patientId: 'P10001',
        patientName: 'Aarav Patel',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Aarav Patel',
          patientId: 'P10001',
          receiptNumber: 'RCP-2026-00101',
          amountPaid: 2500,
          paymentMode: 'UPI'
        }
      },
      {
        documentId: 'DOC-2026-000004',
        documentType: 'DISCHARGE_SUMMARY',
        category: 'CLINICAL',
        title: 'Discharge Summary - Aarav Patel',
        patientId: 'P10001',
        patientName: 'Aarav Patel',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Aarav Patel',
          patientId: 'P10001',
          admissionDate: '2026-10-10',
          dischargeDate: '2026-10-14',
          primaryDiagnosis: 'Acute Gastroenteritis',
          dischargeAdvice: 'High fluid intake, tab Pantoprazole 40mg OD x 5 days.'
        }
      },
      {
        documentId: 'DOC-2026-000005',
        documentType: 'PATIENT_REGISTRATION_RECEIPT',
        category: 'PATIENT',
        title: 'Patient UHID Registration Card - Aarav Patel',
        patientId: 'P10001',
        patientName: 'Aarav Patel',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Aarav Patel',
          patientId: 'P10001',
          contactNumber: '+91 98765 43210',
          registrationDate: '2026-10-01'
        }
      },

      // 6-10 Patient Meera Sharma & Clinical Diagnostic Reports
      {
        documentId: 'DOC-2026-000006',
        documentType: 'LAB_REPORT',
        category: 'LABORATORY',
        title: 'Pathology Report: CBC - Meera Sharma',
        patientId: 'P10002',
        patientName: 'Meera Sharma',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Meera Sharma',
          patientId: 'P10002',
          testName: 'Complete Blood Count (CBC)',
          specimen: 'Whole Blood (EDTA)',
          resultSummary: 'Hemoglobin: 13.8 g/dL, WBC: 6,800 /mcL (Normal)'
        }
      },
      {
        documentId: 'DOC-2026-000007',
        documentType: 'LAB_REPORT',
        category: 'LABORATORY',
        title: 'Pathology Report: Lipid Profile (Draft/Unreleased)',
        patientId: 'P10002',
        patientName: 'Meera Sharma',
        version: 1,
        status: 'DRAFT',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Meera Sharma',
          patientId: 'P10002',
          testName: 'Lipid Profile',
          specimen: 'Serum'
        }
      },
      {
        documentId: 'DOC-2026-000008',
        documentType: 'ADMISSION_CONFIRMATION',
        category: 'OPERATIONS',
        title: 'Admission Confirmation - Meera Sharma',
        patientId: 'P10002',
        patientName: 'Meera Sharma',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Meera Sharma',
          patientId: 'P10002',
          wardName: 'Medical Ward 3',
          bedNumber: 'GMW-304',
          attendingDoctor: 'Dr. Suresh Rao'
        }
      },
      {
        documentId: 'DOC-2026-000009',
        documentType: 'FINAL_INVOICE',
        category: 'FINANCIAL',
        title: 'OPD Consultation Invoice - Meera Sharma',
        patientId: 'P10002',
        patientName: 'Meera Sharma',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Meera Sharma',
          patientId: 'P10002',
          invoiceNumber: 'INV-2026-10045',
          totalAmount: 1200,
          paidAmount: 1200,
          dueAmount: 0
        }
      },
      {
        documentId: 'DOC-2026-000010',
        documentType: 'FEEDBACK_ACKNOWLEDGEMENT',
        category: 'ADMINISTRATION',
        title: 'Feedback Grievance Letter - Meera Sharma',
        patientId: 'P10002',
        patientName: 'Meera Sharma',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Meera Sharma',
          grievanceId: 'FB-2026-00002',
          category: 'Catering Services',
          expectedResolution: 'Within 24 business hours'
        }
      },

      // 11-15 Patient Vikram Malhotra & Radiology/Approval Documents
      {
        documentId: 'DOC-2026-000011',
        documentType: 'RADIOLOGY_REPORT',
        category: 'RADIOLOGY',
        title: 'Chest X-Ray Imaging Report - Vikram Malhotra',
        patientId: 'P10003',
        patientName: 'Vikram Malhotra',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Vikram Malhotra',
          patientId: 'P10003',
          modality: 'X-RAY',
          bodyPart: 'Chest PA View',
          impression: 'Lungs clear. Normal cardiothoracic ratio.'
        }
      },
      {
        documentId: 'DOC-2026-000012',
        documentType: 'RADIOLOGY_REPORT',
        category: 'RADIOLOGY',
        title: 'Lumbar Spine MRI (Pending Review)',
        patientId: 'P10003',
        patientName: 'Vikram Malhotra',
        version: 1,
        status: 'PENDING_REVIEW',
        confidentiality: 'RESTRICTED',
        department: 'RADIOLOGY',
        metadata: {
          patientName: 'Vikram Malhotra',
          patientId: 'P10003',
          modality: 'MRI',
          bodyPart: 'Lumbar Spine',
          impression: 'Mild disc desiccation at L4-L5 without nerve impingement.'
        }
      },
      {
        documentId: 'DOC-2026-000013',
        documentType: 'DISCHARGE_SUMMARY',
        category: 'CLINICAL',
        title: 'Clinical Summary - Approved (Pending Release)',
        patientId: 'P10003',
        patientName: 'Vikram Malhotra',
        version: 1,
        status: 'APPROVED',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Vikram Malhotra',
          patientId: 'P10003',
          admissionDate: '2026-10-12',
          dischargeDate: '2026-10-15',
          primaryDiagnosis: 'Hypertensive Emergency - Stabilized',
          dischargeAdvice: 'Low sodium diet, tab Amlodipine 5mg OD.'
        }
      },
      {
        documentId: 'DOC-2026-000014',
        documentType: 'FINAL_INVOICE',
        category: 'FINANCIAL',
        title: 'Interim Billing Estimate (Draft)',
        patientId: 'P10003',
        patientName: 'Vikram Malhotra',
        version: 1,
        status: 'DRAFT',
        confidentiality: 'NORMAL',
        metadata: {
          patientName: 'Vikram Malhotra',
          patientId: 'P10003',
          invoiceNumber: 'INV-2026-10089',
          totalAmount: 32000
        }
      },
      {
        documentId: 'DOC-2026-000015',
        documentType: 'FINAL_INVOICE',
        category: 'FINANCIAL',
        title: 'Cancelled Duplicate Bill - Vikram Malhotra',
        patientId: 'P10003',
        patientName: 'Vikram Malhotra',
        version: 1,
        status: 'CANCELLED',
        confidentiality: 'NORMAL',
        failureReason: 'System generated duplicate record on retry',
        metadata: {
          patientName: 'Vikram Malhotra',
          patientId: 'P10003',
          invoiceNumber: 'INV-2026-10090'
        }
      },

      // 16-20 Procurement, HR, RPA & Archived Administrative Documents
      {
        documentId: 'DOC-2026-000016',
        documentType: 'PURCHASE_ORDER',
        category: 'PROCUREMENT',
        title: 'Purchase Order - Apex Meditech Supplies',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'RESTRICTED',
        department: 'PROCUREMENT',
        metadata: {
          poNumber: 'PO-2026-000101',
          vendorName: 'Apex Meditech Solutions Pvt Ltd',
          orderDate: '2026-10-12',
          totalAmount: 145000,
          deliveryDate: '2026-10-25'
        }
      },
      {
        documentId: 'DOC-2026-000017',
        documentType: 'ATTENDANCE_REPORT',
        category: 'HR',
        title: 'Monthly Biometric Attendance Audit - October 2026',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'HIGHLY_RESTRICTED',
        department: 'HR',
        metadata: {
          employeeName: 'Dr. Neha Kapoor',
          employeeId: 'E10001',
          month: 'October 2026',
          presentDays: 22,
          leaveDays: 2
        }
      },
      {
        documentId: 'DOC-2026-000018',
        documentType: 'RPA_EXECUTION_REPORT',
        category: 'RPA',
        title: 'Automated Nightly Reconciliation Run Report',
        version: 1,
        status: 'RELEASED',
        confidentiality: 'RESTRICTED',
        department: 'OPERATIONS',
        metadata: {
          botName: 'NightlyBedReconciliationBot',
          executionTime: '2026-10-16 02:00:00',
          recordsProcessed: 450,
          discrepanciesFound: 0
        }
      },
      {
        documentId: 'DOC-2026-000019',
        documentType: 'MANAGEMENT_REPORT',
        category: 'REPORTING',
        title: 'Executive Hospital Occupancy & Revenue Summary (Archived)',
        version: 1,
        status: 'ARCHIVED',
        isArchived: true,
        confidentiality: 'HIGHLY_RESTRICTED',
        archivedAt: new Date(Date.now() - 365 * 24 * 3600 * 1000),
        metadata: {
          reportPeriod: 'Q3 2025',
          bedOccupancyRate: '88.5%',
          grossRevenue: 14500000
        }
      },
      {
        documentId: 'DOC-2026-000020',
        documentType: 'INSURANCE_CLAIM_PACKAGE',
        category: 'INSURANCE',
        title: 'Corrupted Batch Transfer (Failed Integrity Test)',
        version: 1,
        status: 'FAILED',
        confidentiality: 'NORMAL',
        failureReason: 'Renderer failed: Socket timeout during remote image rendering',
        metadata: {
          claimNumber: 'CLM-2026-00045'
        }
      }
    ];

    for (const d of sampleDocs) {
      // Generate actual sample PDF and store with checksum
      const pdfBuffer = await PdfRenderer.renderToBuffer({
        document: d,
        hospitalConfig: {
          name: 'CITY GENERAL HOSPITAL & MEDICAL RESEARCH CENTER',
          address: '100 Healthcare Boulevard, Metro City, India',
          phone: '+91 11 2345 6789',
          email: 'admin@hospital.local'
        },
        template: {
          name: d.title,
          headerText: `${d.category} - OFFICIAL RECORD`,
          footerText: 'Official Certified Hospital Document'
        },
        data: d.metadata || {}
      });

      const fileName = `${d.documentId}-v${d.version}.pdf`;
      const stored = await storage.upload({
        fileName,
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
        subDir: d.category.toLowerCase()
      });

      const docPayload = {
        ...d,
        entityReference: {
          entityType: d.category === 'FINANCIAL' ? 'Invoice' : 'Patient',
          entityId: d.metadata?.invoiceNumber || d.patientId || d.documentId,
          module: d.category
        },
        storage: {
          provider: stored.provider,
          path: stored.path,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          size: stored.size,
          checksum: stored.checksum
        },
        fileUrl: `/api/documents/${d.documentId}/download`,
        generatedBy: 'SYSTEM_SEED',
        generatedAt: new Date(),
        releasedAt: d.status === 'RELEASED' ? new Date() : null,
        releasedBy: d.status === 'RELEASED' ? 'SYSTEM_ADMIN' : null
      };

      await GeneratedDocument.findOneAndUpdate(
        { documentId: d.documentId },
        docPayload,
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed Documents] Successfully seeded ${sampleDocs.length} Generated Documents.`);

    // 3. Seed 2 Document Packages (Section 59, 119)
    console.log('[Seed Documents] Seeding 2 Document Packages...');
    const samplePackages = [
      {
        packageId: 'PKG-2026-000001',
        packageType: 'INSURANCE_CLAIM_PACKAGE',
        title: 'Comprehensive Insurance Claim Package - Aarav Patel',
        description: 'Combined dossier with Final Invoice, Payment Receipt and Discharge Summary',
        patientId: 'P10001',
        patientName: 'Aarav Patel',
        documents: [
          { documentId: 'DOC-2026-000001', title: 'Final Inpatient Invoice', documentType: 'FINAL_INVOICE', order: 1, status: 'RELEASED' },
          { documentId: 'DOC-2026-000003', title: 'Official Payment Receipt', documentType: 'PAYMENT_RECEIPT', order: 2, status: 'RELEASED' },
          { documentId: 'DOC-2026-000004', title: 'Discharge Summary', documentType: 'DISCHARGE_SUMMARY', order: 3, status: 'RELEASED' }
        ],
        status: 'RELEASED',
        manifest: {
          totalDocuments: 3,
          includedTypes: ['FINAL_INVOICE', 'PAYMENT_RECEIPT', 'DISCHARGE_SUMMARY'],
          generatedAt: new Date()
        }
      },
      {
        packageId: 'PKG-2026-000002',
        packageType: 'DISCHARGE_PACKAGE',
        title: 'Inpatient Complete Discharge Dossier - Meera Sharma',
        description: 'Discharge dossier with Lab Reports, Admission Confirmation, and Invoices',
        patientId: 'P10002',
        patientName: 'Meera Sharma',
        documents: [
          { documentId: 'DOC-2026-000008', title: 'Admission Confirmation', documentType: 'ADMISSION_CONFIRMATION', order: 1, status: 'RELEASED' },
          { documentId: 'DOC-2026-000006', title: 'Pathology Report: CBC', documentType: 'LAB_REPORT', order: 2, status: 'RELEASED' },
          { documentId: 'DOC-2026-000009', title: 'OPD Consultation Invoice', documentType: 'FINAL_INVOICE', order: 3, status: 'RELEASED' }
        ],
        status: 'RELEASED',
        manifest: {
          totalDocuments: 3,
          includedTypes: ['ADMISSION_CONFIRMATION', 'LAB_REPORT', 'FINAL_INVOICE'],
          generatedAt: new Date()
        }
      }
    ];

    for (const pkg of samplePackages) {
      const pkgBuffer = await PdfRenderer.renderToBuffer({
        document: {
          documentId: pkg.packageId,
          documentType: pkg.packageType,
          title: pkg.title,
          category: 'INSURANCE',
          generatedAt: new Date(),
          status: pkg.status
        },
        hospitalConfig: {
          name: 'CITY GENERAL HOSPITAL & MEDICAL RESEARCH CENTER'
        },
        template: {
          name: pkg.title,
          footerText: 'Certified Document Package'
        },
        data: {
          packageId: pkg.packageId,
          packageType: pkg.packageType,
          patientName: pkg.patientName,
          totalDocuments: pkg.documents.length
        }
      });

      const stored = await storage.upload({
        fileName: `${pkg.packageId}.pdf`,
        buffer: pkgBuffer,
        mimeType: 'application/pdf',
        subDir: 'packages'
      });

      await DocumentPackage.findOneAndUpdate(
        { packageId: pkg.packageId },
        {
          ...pkg,
          storage: {
            provider: stored.provider,
            path: stored.path,
            fileName: stored.fileName,
            mimeType: stored.mimeType,
            size: stored.size,
            checksum: stored.checksum
          }
        },
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed Documents] Successfully seeded ${samplePackages.length} Document Packages.`);

    // 4. Seed Document Access Logs (Section 68, 119)
    console.log('[Seed Documents] Seeding Sample Document Access Logs...');
    const accessLogs = [
      {
        logId: 'LOG-2026-000001',
        documentId: 'DOC-2026-000001',
        documentType: 'FINAL_INVOICE',
        title: 'Final Inpatient Invoice - Aarav Patel',
        userId: 'P10001',
        userName: 'Aarav Patel',
        role: 'PATIENT',
        department: 'PATIENT_PORTAL',
        action: 'DOWNLOADED',
        status: 'SUCCESS',
        ipAddress: '192.168.1.105',
        details: 'Downloaded via Patient Portal'
      },
      {
        logId: 'LOG-2026-000002',
        documentId: 'DOC-2026-000007',
        documentType: 'LAB_REPORT',
        title: 'Pathology Report: Lipid Profile (Draft/Unreleased)',
        userId: 'P10002',
        userName: 'Meera Sharma',
        role: 'PATIENT',
        department: 'PATIENT_PORTAL',
        action: 'ACCESS_DENIED',
        status: 'DENIED',
        ipAddress: '192.168.1.112',
        details: 'Access denied: Document is not in RELEASED status.'
      },
      {
        logId: 'LOG-2026-000003',
        documentId: 'DOC-2026-000017',
        documentType: 'ATTENDANCE_REPORT',
        title: 'Monthly Biometric Attendance Audit - October 2026',
        userId: 'ADM-001',
        userName: 'Dr. Rajesh Sharma',
        role: 'SYSTEM_ADMIN',
        department: 'ADMINISTRATION',
        action: 'VIEWED',
        status: 'SUCCESS',
        ipAddress: '10.0.0.12',
        details: 'Admin viewed confidential HR report'
      }
    ];

    for (const log of accessLogs) {
      await DocumentAccessLog.findOneAndUpdate(
        { logId: log.logId },
        log,
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed Documents] Successfully seeded ${accessLogs.length} Access Logs.`);

    console.log('[Seed Documents] Module 27 Document Master Seeding Completed Successfully.');
  } catch (error) {
    console.error('[Seed Documents Error]:', error);
    throw error;
  }
};

module.exports = seedModule27Documents;

if (require.main === module) {
  seedModule27Documents().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}
