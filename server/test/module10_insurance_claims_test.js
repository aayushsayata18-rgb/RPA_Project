require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const InsuranceClaimService = require('../services/insuranceClaimService');
const InsuranceClaimValidationService = require('../services/insuranceClaimValidationService');
const InsuranceClaimSubmissionService = require('../services/insuranceClaimSubmissionService');
const InsuranceClaimStatusService = require('../services/insuranceClaimStatusService');
const InsuranceClaimQueryService = require('../services/insuranceClaimQueryService');
const InsuranceClaimSettlementService = require('../services/insuranceClaimSettlementService');

const InsuranceClaim = require('../models/InsuranceClaim');
const InsuranceClaimDocument = require('../models/InsuranceClaimDocument');
const InsuranceClaimStatusHistory = require('../models/InsuranceClaimStatusHistory');
const InsuranceClaimQuery = require('../models/InsuranceClaimQuery');
const InsuranceClaimSettlement = require('../models/InsuranceClaimSettlement');
const InsurancePolicy = require('../models/InsurancePolicy');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const ExceptionCase = require('../models/ExceptionCase');

const runModule10Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 10 INSURANCE CLAIMS TEST SUITE ---');
    console.log('==========================================================\n');

    let passedCount = 0;
    const assertTest = (description, condition) => {
      if (condition) {
        console.log(`[PASS] ${description}`);
        passedCount++;
      } else {
        console.error(`[FAIL] ${description}`);
        throw new Error(`Test assertion failed: ${description}`);
      }
    };

    // 0. Setup Test Data (Patient, Policy, Invoice)
    const testPatientId = `P10045_T_${Date.now()}`;
    await Patient.findOneAndUpdate(
      { patientId: testPatientId },
      {
        patientId: testPatientId,
        firstName: 'Rahul',
        lastName: 'Shah',
        fullName: 'Rahul Shah',
        gender: 'MALE',
        dateOfBirth: new Date('2001-05-14')
      },
      { upsert: true, new: true }
    );

    const testPolicyNum = `POL-CLM-TEST-${Date.now()}`;
    const policy = await InsurancePolicy.create({
      policyId: testPolicyNum,
      patientId: testPatientId,
      policyNumber: testPolicyNum,
      memberId: 'MEM-T10',
      providerName: 'Example Health Insurance',
      providerCode: 'EXAMPLE_HEALTH',
      status: 'ACTIVE',
      isPrimary: true,
      policyHolderName: 'Rahul Shah'
    });

    const testInvoiceId = `INV-TEST-${Date.now()}`;
    const invoice = await Invoice.create({
      invoiceId: testInvoiceId,
      patientId: testPatientId,
      invoiceType: 'FINAL_DISCHARGE',
      grossTotal: 115000,
      netTotal: 115000,
      payableAmount: 115000,
      status: 'FINALIZED',
      admissionId: 'ADM10023',
      dischargeId: 'DIS-20261008-01',
      items: [
        {
          category: 'ROOM_ACCOMMODATION',
          description: 'Deluxe Room Accommodation (2 Nights)',
          quantity: 2,
          unitPrice: 15000,
          totalPrice: 30000
        },
        {
          category: 'PROCEDURE',
          description: 'Surgical Laparoscopic Appendectomy',
          quantity: 1,
          unitPrice: 85000,
          totalPrice: 85000
        }
      ]
    });

    // -------------------------------------------------------------
    // Test 1: Claim Creation in DRAFT Status (Section 7, 14, 15)
    // -------------------------------------------------------------
    const createdClaim = await InsuranceClaimService.createClaim(
      {
        patientId: testPatientId,
        policyId: policy.policyId,
        invoiceId: invoice.invoiceId,
        claimType: 'INPATIENT',
        admissionId: 'ADM10023',
        notes: 'Test inpatient claim dossier creation'
      },
      { userId: 'TEST_BILLING', username: 'BillingTester' }
    );

    assertTest(
      'Test 1: Claim created successfully in DRAFT with unique claimId & line items',
      createdClaim &&
        createdClaim.claimId.startsWith('CLM-') &&
        createdClaim.status === 'DRAFT' &&
        createdClaim.totalClaimAmount === 115000 &&
        createdClaim.items.length === 2
    );

    // -------------------------------------------------------------
    // Test 2: Duplicate Claim Prevention (Section 23)
    // -------------------------------------------------------------
    let duplicateCaught = false;
    try {
      await InsuranceClaimService.createClaim(
        {
          patientId: testPatientId,
          policyId: policy.policyId,
          invoiceId: invoice.invoiceId,
          claimType: 'INPATIENT'
        },
        { userId: 'TEST_BILLING' }
      );
    } catch (err) {
      if (err.code === 'DUPLICATE_CLAIM' || err.statusCode === 409) {
        duplicateCaught = true;
      }
    }
    assertTest('Test 2: Duplicate active claim for same billing event prevented', duplicateCaught);

    // -------------------------------------------------------------
    // Test 3: Document Upload & Checklist Synchronization (Section 20 & 21)
    // -------------------------------------------------------------
    const doc = await InsuranceClaimService.addDocument(
      createdClaim.claimId,
      {
        documentType: 'DISCHARGE_DOCUMENT',
        fileName: 'discharge_summary_verified.pdf',
        fileSize: 15420,
        notes: 'Signed discharge summary'
      },
      { username: 'BillingTester' }
    );

    const reloadedForDoc = await InsuranceClaimService.getClaimById(createdClaim.claimId);
    const dischargeItem = reloadedForDoc.documentChecklist?.find((c) => c.documentType === 'DISCHARGE_DOCUMENT');

    assertTest(
      'Test 3: Supporting document uploaded and checklist item marked available & valid',
      doc && doc.documentId.startsWith('DOC-') && dischargeItem && dischargeItem.available === true
    );

    // -------------------------------------------------------------
    // Test 4: Claim Validation & Transition to READY (Section 22 & 25)
    // -------------------------------------------------------------
    const readyClaim = await InsuranceClaimService.markReady(createdClaim.claimId, { username: 'Supervisor' });
    assertTest(
      'Test 4: Claim validation succeeded and transitioned to READY status',
      readyClaim && readyClaim.status === 'READY'
    );

    // -------------------------------------------------------------
    // Test 5: Authoritative Submission & Insurer Reference Capture (Section 26 & 72)
    // -------------------------------------------------------------
    const subResult = await InsuranceClaimSubmissionService.submitClaim(
      createdClaim.claimId,
      { source: 'API' },
      { username: 'InsuranceOfficer' }
    );

    assertTest(
      'Test 5: Claim submitted with authoritative reference number and status SUBMITTED',
      subResult.success === true &&
        subResult.claimStatus === 'SUBMITTED' &&
        subResult.insurerReferenceNumber &&
        subResult.claim.status === 'SUBMITTED'
    );

    // -------------------------------------------------------------
    // Test 6: Submission Idempotency Protection (Section 69)
    // -------------------------------------------------------------
    const idempotentSub = await InsuranceClaimSubmissionService.submitClaim(
      createdClaim.claimId,
      { source: 'API' },
      { username: 'InsuranceOfficer' }
    );

    assertTest(
      'Test 6: Duplicate submission request returns existing state without creating duplicate submission',
      idempotentSub.isExisting === true &&
        idempotentSub.claim.insurerReferenceNumber === subResult.insurerReferenceNumber
    );

    // -------------------------------------------------------------
    // Test 7: Insurer Status Polling (UNDER_REVIEW) (Section 32, 33 & 34)
    // -------------------------------------------------------------
    const polledStatus = await InsuranceClaimStatusService.checkClaimStatus(
      createdClaim.claimId,
      { simulatedStatus: 'UNDER_REVIEW' },
      { username: 'StatusPoller' }
    );

    assertTest(
      'Test 7: Insurer status check polls successfully and normalizes to UNDER_REVIEW',
      polledStatus.success === true && polledStatus.status === 'UNDER_REVIEW'
    );

    // -------------------------------------------------------------
    // Test 8: Insurer Query Handling & Response Submission (Section 35, 36 & 37)
    // -------------------------------------------------------------
    const query = await InsuranceClaimQueryService.createQuery(
      createdClaim.claimId,
      {
        queryType: 'MISSING_DOCUMENT',
        queryText: 'Please furnish detailed surgical implant certificate and break-up.',
        responsibleDepartment: 'BILLING',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      { username: 'InsurerWebhook' }
    );

    const reloadedAfterQuery = await InsuranceClaimService.getClaimById(createdClaim.claimId);

    assertTest(
      'Test 8a: Query recorded, claim transitions to MORE_INFORMATION_REQUIRED',
      query && query.queryId.startsWith('CQ-') && reloadedAfterQuery.status === 'MORE_INFORMATION_REQUIRED'
    );

    const queryResponse = await InsuranceClaimQueryService.respondToQuery(
      createdClaim.claimId,
      query.queryId,
      {
        responseText: 'Surgical implant certificate attached and attested by treating surgeon.'
      },
      { username: 'MedicalRecordsStaff' }
    );

    const reloadedAfterResponse = await InsuranceClaimService.getClaimById(createdClaim.claimId);

    assertTest(
      'Test 8b: Query response submitted, claim returns to UNDER_REVIEW',
      queryResponse.status === 'SUBMITTED' && reloadedAfterResponse.status === 'UNDER_REVIEW'
    );

    // -------------------------------------------------------------
    // Test 9: Partial Approval Workflow (Section 41 & 80)
    // -------------------------------------------------------------
    const partialApproval = await InsuranceClaimStatusService.checkClaimStatus(
      createdClaim.claimId,
      {
        simulatedStatus: 'PARTIALLY_APPROVED',
        approvedAmount: 95000,
        rejectedAmount: 20000,
        rejectionReason: 'Room nursing charge cap limit exceeded'
      },
      { username: 'Adjudicator' }
    );

    assertTest(
      'Test 9: Partial approval stores approved and rejected amounts per insurer decision',
      partialApproval.status === 'PARTIALLY_APPROVED' &&
        partialApproval.approvedAmount === 95000 &&
        partialApproval.rejectedAmount === 20000
    );

    // -------------------------------------------------------------
    // Test 10: Settlement Recording & Billing Reconciliation (Section 44, 45 & 47)
    // -------------------------------------------------------------
    const settlementResult = await InsuranceClaimSettlementService.recordSettlement(
      createdClaim.claimId,
      {
        settledAmount: 95000,
        paymentReference: `NEFT-CLM-${Date.now()}`,
        settlementDate: new Date(),
        notes: 'Remittance advice received via bank portal'
      },
      { username: 'Cashier' }
    );

    assertTest(
      'Test 10: Claim settlement recorded, claim marked PAID, and reconciled with invoice',
      settlementResult.success === true &&
        settlementResult.claim.status === 'PAID' &&
        settlementResult.claim.settlementAmount === 95000 &&
        settlementResult.settlement.reconciledWithBilling === true
    );

    // -------------------------------------------------------------
    // Test 11: Payment Discrepancy Exception Detection (Section 47 & 57)
    // -------------------------------------------------------------
    // Create separate claim with expected amount 80000, but settled amount 75000
    const discInvId = `INV-DISC-${Date.now()}`;
    await Invoice.create({
      invoiceId: discInvId,
      patientId: testPatientId,
      grossTotal: 80000,
      payableAmount: 80000,
      status: 'FINALIZED',
      coveredAmount: 80000
    });

    const discClaim = await InsuranceClaimService.createClaim(
      {
        patientId: testPatientId,
        policyId: policy.policyId,
        invoiceId: discInvId,
        claimType: 'DAYCARE',
        totalClaimAmount: 80000
      },
      { username: 'Tester' }
    );
    await InsuranceClaimStatusService.updateClaimStatus(discClaim.claimId, 'APPROVED', { approvedAmount: 80000 });

    const discSettlement = await InsuranceClaimSettlementService.recordSettlement(
      discClaim.claimId,
      {
        settledAmount: 75000, // ₹5,000 difference
        paymentReference: `NEFT-SHORT-${Date.now()}`
      },
      { username: 'Cashier' }
    );

    const exc = await ExceptionCase.findOne({ entityId: discClaim.claimId, category: 'PAYMENT_MISMATCH' });

    assertTest(
      'Test 11: Settlement discrepancy (₹5,000 shortfall) creates open PAYMENT_MISMATCH ExceptionCase',
      discSettlement.success === true && exc !== null && exc.metadata?.differenceAmount === 5000
    );

    // -------------------------------------------------------------
    // Test 12: Complete Audit History & Timeline (Section 10 & 67)
    // -------------------------------------------------------------
    const history = await InsuranceClaimStatusService.getStatusHistory(createdClaim.claimId);
    assertTest(
      'Test 12: Status history timeline accurately preserves every state transition',
      history.length >= 5 &&
        history.some((h) => h.newStatus === 'DRAFT') &&
        history.some((h) => h.newStatus === 'READY') &&
        history.some((h) => h.newStatus === 'SUBMITTED') &&
        history.some((h) => h.newStatus === 'PAID')
    );

    // -------------------------------------------------------------
    // Test 13: Dashboard Statistics Aggregation (Section 74)
    // -------------------------------------------------------------
    const stats = await InsuranceClaimService.getDashboardStats();
    assertTest(
      'Test 13: Dashboard statistics aggregates claims and aging buckets accurately',
      stats.totalClaims > 0 &&
        stats.paid > 0 &&
        stats.totalClaimedAmount > 0 &&
        stats.agingBuckets !== undefined
    );

    // -------------------------------------------------------------
    // Test 14: Cancellation Protection (Section 6 & 25)
    // -------------------------------------------------------------
    let paidCancelCaught = false;
    try {
      await InsuranceClaimService.cancelClaim(createdClaim.claimId, 'Attempting to cancel paid claim');
    } catch (err) {
      paidCancelCaught = true;
    }
    assertTest('Test 14: Submitted/Paid claims cannot be cancelled', paidCancelCaught);

    console.log('\n==========================================================');
    console.log(`--- MODULE 10 TEST SUITE COMPLETED: ${passedCount}/14 TESTS PASSED ---`);
    console.log('==========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n[MODULE 10 TEST FAILED]:', error);
    process.exit(1);
  }
};

runModule10Tests();
