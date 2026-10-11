const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const InsuranceClaim = require('../models/InsuranceClaim');
const InsuranceClaimDocument = require('../models/InsuranceClaimDocument');
const InsuranceClaimStatusHistory = require('../models/InsuranceClaimStatusHistory');
const InsuranceClaimQuery = require('../models/InsuranceClaimQuery');
const InsuranceClaimSettlement = require('../models/InsuranceClaimSettlement');

const seedClaims = async () => {
  try {
    const isStandalone = mongoose.connection.readyState === 0;
    if (isStandalone) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
      console.log('[Seed Module 10] Connected to MongoDB');
    }

    console.log('[Seed Module 10] Seeding insurance claims lifecycle scenarios (Section 77 & 78)...');

    // 1. Primary Inpatient Claim for Rahul Shah (P10045) - UNDER_REVIEW (Section 77 & 78)
    const primaryClaim = {
      claimId: 'CLM-2026-00098',
      claimNumber: 'CLM-2026-00098',
      patientId: 'P10045',
      patientName: 'Rahul Shah',
      policyId: 'POL-ABC-45892',
      policyNumber: 'POL-ABC-45892',
      memberId: 'MEM-78291',
      insurerName: 'Example Health Insurance',
      providerName: 'Example Health Insurance',
      providerCode: 'EXAMPLE_HEALTH',
      admissionId: 'ADM10023',
      dischargeId: 'DIS-20261008-01',
      invoiceId: 'INV-2026-001245',
      claimType: 'INPATIENT',
      admissionDate: new Date('2026-10-06T09:00:00Z'),
      dischargeDate: new Date('2026-10-08T11:00:00Z'),
      totalClaimAmount: 115000,
      claimAmount: 115000,
      approvedAmount: 0,
      rejectedAmount: 0,
      patientResponsibilityAmount: 0,
      settlementAmount: 0,
      settledAmount: 0,
      currency: 'INR',
      status: 'UNDER_REVIEW',
      submissionSource: 'API',
      insurerReferenceNumber: 'INS-CLM-778821',
      submittedAt: new Date('2026-10-08T12:00:00Z'),
      submissionDate: new Date('2026-10-08T12:00:00Z'),
      lastStatusCheckedAt: new Date('2026-10-09T08:00:00Z'),
      notes: 'Post-discharge final claim dossier submitted electronically.',
      correlationId: 'CORR-20261008-000098',
      items: [
        {
          serviceType: 'ROOM',
          description: 'Deluxe Private Room Accommodation (2 Nights)',
          quantity: 2,
          unitAmount: 15000,
          claimedAmount: 30000,
          approvedAmount: 0,
          rejectedAmount: 0
        },
        {
          serviceType: 'PROCEDURE',
          description: 'Laparoscopic Appendectomy & Surgical OT Charges',
          quantity: 1,
          unitAmount: 55000,
          claimedAmount: 55000,
          approvedAmount: 0,
          rejectedAmount: 0
        },
        {
          serviceType: 'PHARMACY',
          description: 'Inpatient Surgical Consumables & Antibiotics',
          quantity: 1,
          unitAmount: 18000,
          claimedAmount: 18000,
          approvedAmount: 0,
          rejectedAmount: 0
        },
        {
          serviceType: 'LAB',
          description: 'Histopathology & Pre-op Diagnostic Profile',
          quantity: 1,
          unitAmount: 12000,
          claimedAmount: 12000,
          approvedAmount: 0,
          rejectedAmount: 0
        }
      ],
      documentChecklist: [
        { documentType: 'FINAL_INVOICE', title: 'Hospital Final Bill', required: true, available: true, validated: true, submitted: true },
        { documentType: 'DISCHARGE_DOCUMENT', title: 'Discharge Summary', required: true, available: true, validated: true, submitted: true },
        { documentType: 'INSURANCE_CARD', title: 'Insurance E-Card', required: true, available: true, validated: true, submitted: true },
        { documentType: 'LAB_REPORT', title: 'Pathology Reports', required: false, available: true, validated: true, submitted: true }
      ]
    };

    await InsuranceClaim.findOneAndUpdate({ claimId: primaryClaim.claimId }, primaryClaim, { upsert: true, new: true });

    // Status timeline for CLM-2026-00098
    const clm98History = [
      {
        claimId: 'CLM-2026-00098',
        previousStatus: 'NONE',
        newStatus: 'DRAFT',
        changedBy: 'BILLING_STAFF_01',
        source: 'MANUAL',
        reason: 'Claim dossier prepared following inpatient discharge',
        timestamp: new Date('2026-10-08T11:30:00Z')
      },
      {
        claimId: 'CLM-2026-00098',
        previousStatus: 'DRAFT',
        newStatus: 'READY',
        changedBy: 'INS_OFFICER_01',
        source: 'MANUAL',
        reason: 'Pre-submission checklist verified and approved',
        timestamp: new Date('2026-10-08T11:45:00Z')
      },
      {
        claimId: 'CLM-2026-00098',
        previousStatus: 'READY',
        newStatus: 'SUBMITTED',
        changedBy: 'SYSTEM_RPA',
        source: 'API',
        reason: 'Authoritative electronic transmission to Example Health Insurance',
        insurerReference: 'INS-CLM-778821',
        timestamp: new Date('2026-10-08T12:00:00Z')
      },
      {
        claimId: 'CLM-2026-00098',
        previousStatus: 'SUBMITTED',
        newStatus: 'UNDER_REVIEW',
        changedBy: 'STATUS_POLLER',
        source: 'API',
        reason: 'Insurer confirmed receipt and assigned to adjudication team',
        insurerReference: 'INS-CLM-778821',
        timestamp: new Date('2026-10-09T08:00:00Z')
      }
    ];

    for (const h of clm98History) {
      await InsuranceClaimStatusHistory.findOneAndUpdate(
        { claimId: h.claimId, newStatus: h.newStatus },
        h,
        { upsert: true, new: true }
      );
    }

    // 2. Query Scenario - CLM-2026-00102
    await InsuranceClaim.findOneAndUpdate(
      { claimId: 'CLM-2026-00102' },
      {
        claimId: 'CLM-2026-00102',
        claimNumber: 'CLM-2026-00102',
        patientId: 'P10003',
        patientName: 'Suresh Patel',
        policyId: 'POL-AMBIGUOUS-5501',
        policyNumber: 'POL-AMBIGUOUS-5501',
        insurerName: 'Star Health Insurance',
        invoiceId: 'INV-2026-000412',
        claimType: 'INPATIENT',
        totalClaimAmount: 85000,
        status: 'QUERY',
        submissionSource: 'INSURER_PORTAL_RPA',
        insurerReferenceNumber: 'STAR-CLM-881920',
        submittedAt: new Date('2026-10-07T10:00:00Z'),
        queryReason: 'Clarification requested regarding implant batch and break-up.'
      },
      { upsert: true, new: true }
    );

    await InsuranceClaimQuery.findOneAndUpdate(
      { queryId: 'CQ-2026-000102' },
      {
        queryId: 'CQ-2026-000102',
        claimId: 'CLM-2026-00102',
        queryReference: 'QRY-STAR-4491',
        queryType: 'CLARIFICATION',
        queryText: 'Please submit implant manufacturer invoice and surgical sticker verification.',
        receivedAt: new Date('2026-10-08T09:00:00Z'),
        dueDate: new Date('2026-10-15T18:00:00Z'),
        status: 'OPEN',
        responsibleDepartment: 'BILLING'
      },
      { upsert: true, new: true }
    );

    // 3. Approved Scenario - CLM-2026-00104
    await InsuranceClaim.findOneAndUpdate(
      { claimId: 'CLM-2026-00104' },
      {
        claimId: 'CLM-2026-00104',
        claimNumber: 'CLM-2026-00104',
        patientId: 'P10045',
        patientName: 'Rahul Shah',
        policyId: 'POL-ABC-45892',
        policyNumber: 'POL-ABC-45892',
        insurerName: 'Example Health Insurance',
        invoiceId: 'INV-2026-000991',
        claimType: 'DAYCARE',
        totalClaimAmount: 45000,
        approvedAmount: 45000,
        status: 'APPROVED',
        insurerReferenceNumber: 'INS-CLM-662910',
        submittedAt: new Date('2026-10-05T09:00:00Z'),
        insurerDecisionDate: new Date('2026-10-07T15:00:00Z')
      },
      { upsert: true, new: true }
    );

    // 4. Partially Approved Scenario - CLM-2026-00105
    await InsuranceClaim.findOneAndUpdate(
      { claimId: 'CLM-2026-00105' },
      {
        claimId: 'CLM-2026-00105',
        claimNumber: 'CLM-2026-00105',
        patientId: 'P10002',
        patientName: 'Anita Sharma',
        policyId: 'POL-EXPIRED-9901',
        policyNumber: 'POL-EXPIRED-9901',
        insurerName: 'Star Health Insurance',
        invoiceId: 'INV-2026-000881',
        claimType: 'INPATIENT',
        totalClaimAmount: 100000,
        approvedAmount: 80000,
        rejectedAmount: 20000,
        patientResponsibilityAmount: 20000,
        status: 'PARTIALLY_APPROVED',
        insurerReferenceNumber: 'STAR-CLM-771928',
        submittedAt: new Date('2026-10-04T10:00:00Z'),
        insurerDecisionDate: new Date('2026-10-06T12:00:00Z'),
        rejectionReason: 'Non-medical consumable deductions per standard policy room cap.'
      },
      { upsert: true, new: true }
    );

    // 5. Rejected Scenario - CLM-2026-00106 (Section 79)
    await InsuranceClaim.findOneAndUpdate(
      { claimId: 'CLM-2026-00106' },
      {
        claimId: 'CLM-2026-00106',
        claimNumber: 'CLM-2026-00106',
        patientId: 'P10003',
        patientName: 'Suresh Patel',
        policyId: 'POL-AMBIGUOUS-5501',
        policyNumber: 'POL-AMBIGUOUS-5501',
        insurerName: 'Star Health Insurance',
        invoiceId: 'INV-2026-000771',
        claimType: 'INPATIENT',
        totalClaimAmount: 50000,
        approvedAmount: 0,
        rejectedAmount: 50000,
        status: 'REJECTED',
        insurerReferenceNumber: 'STAR-CLM-559102',
        submittedAt: new Date('2026-10-03T11:00:00Z'),
        insurerDecisionDate: new Date('2026-10-05T14:00:00Z'),
        rejectionReason: 'Pre-existing condition exclusion period not completed.'
      },
      { upsert: true, new: true }
    );

    // 6. Paid & Settled Scenario - CLM-2026-00107 (Section 44 & 47)
    await InsuranceClaim.findOneAndUpdate(
      { claimId: 'CLM-2026-00107' },
      {
        claimId: 'CLM-2026-00107',
        claimNumber: 'CLM-2026-00107',
        patientId: 'P10045',
        patientName: 'Rahul Shah',
        policyId: 'POL-ABC-45892',
        policyNumber: 'POL-ABC-45892',
        insurerName: 'Example Health Insurance',
        invoiceId: 'INV-2026-000551',
        claimType: 'INPATIENT',
        totalClaimAmount: 90000,
        approvedAmount: 90000,
        settlementAmount: 90000,
        settledAmount: 90000,
        status: 'PAID',
        insurerReferenceNumber: 'INS-CLM-330192',
        submittedAt: new Date('2026-09-20T10:00:00Z'),
        insurerDecisionDate: new Date('2026-09-25T11:00:00Z'),
        paidAt: new Date('2026-09-28T14:30:00Z')
      },
      { upsert: true, new: true }
    );

    await InsuranceClaimSettlement.findOneAndUpdate(
      { settlementId: 'STL-2026-000107' },
      {
        settlementId: 'STL-2026-000107',
        claimId: 'CLM-2026-00107',
        invoiceId: 'INV-2026-000551',
        insurerName: 'Example Health Insurance',
        insurerReference: 'INS-CLM-330192',
        approvedAmount: 90000,
        settledAmount: 90000,
        differenceAmount: 0,
        settlementDate: new Date('2026-09-28T14:30:00Z'),
        paymentReference: 'NEFT-20260928-883921',
        status: 'PAID',
        reconciledWithBilling: true,
        recordedBy: 'CASHIER_01'
      },
      { upsert: true, new: true }
    );

    // 7. Draft & Ready Scenarios
    await InsuranceClaim.findOneAndUpdate(
      { claimId: 'CLM-2026-00099' },
      {
        claimId: 'CLM-2026-00099',
        claimNumber: 'CLM-2026-00099',
        patientId: 'P10002',
        patientName: 'Anita Sharma',
        policyId: 'POL-EXPIRED-9901',
        policyNumber: 'POL-EXPIRED-9901',
        insurerName: 'Star Health Insurance',
        invoiceId: 'INV-2026-000301',
        claimType: 'OUTPATIENT',
        totalClaimAmount: 15000,
        status: 'DRAFT',
        submissionSource: 'API'
      },
      { upsert: true, new: true }
    );

    await InsuranceClaim.findOneAndUpdate(
      { claimId: 'CLM-2026-00100' },
      {
        claimId: 'CLM-2026-00100',
        claimNumber: 'CLM-2026-00100',
        patientId: 'P10004',
        patientName: 'Priya Mehta',
        policyId: 'POL-PARTIAL-4401',
        policyNumber: 'POL-PARTIAL-4401',
        insurerName: 'Example Health Insurance',
        invoiceId: 'INV-2026-000201',
        claimType: 'INPATIENT',
        totalClaimAmount: 62000,
        status: 'READY',
        submissionSource: 'API',
        documentChecklist: [
          { documentType: 'FINAL_INVOICE', title: 'Hospital Final Bill', required: true, available: true, validated: true, submitted: false },
          { documentType: 'DISCHARGE_DOCUMENT', title: 'Discharge Summary', required: true, available: true, validated: true, submitted: false },
          { documentType: 'INSURANCE_CARD', title: 'Insurance E-Card', required: true, available: true, validated: true, submitted: false }
        ]
      },
      { upsert: true, new: true }
    );

    console.log('[Seed Module 10] Claims master seeding completed successfully!');
    if (isStandalone) {
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed Module 10 Error]:', err);
    if (mongoose.connection.readyState !== 0) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedClaims();
}

module.exports = seedClaims;
