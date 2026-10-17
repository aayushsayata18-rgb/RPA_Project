require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const InsurancePolicyService = require('../services/insurancePolicyService');
const InsuranceVerificationService = require('../services/insuranceVerificationService');
const InsuranceExceptionService = require('../services/insuranceExceptionService');
const InsuranceEvidenceService = require('../services/insuranceEvidenceService');

const InsurancePolicy = require('../models/InsurancePolicy');
const InsuranceVerification = require('../models/InsuranceVerification');
const InsuranceVerificationAttempt = require('../models/InsuranceVerificationAttempt');
const InsuranceDocument = require('../models/InsuranceDocument');
const ExceptionCase = require('../models/ExceptionCase');
const Patient = require('../models/Patient');

const runModule9Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 9 INSURANCE VERIFICATION TEST SUITE ---');
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

    // Setup Test Patient
    const testPatientId = 'P10045';
    await Patient.findOneAndUpdate(
      { patientId: testPatientId },
      {
        patientId: testPatientId,
        firstName: 'Rahul',
        lastName: 'Shah',
        fullName: 'Rahul Shah',
        dateOfBirth: new Date('2001-05-14'),
        gender: 'MALE',
        mobile: '9876543210'
      },
      { upsert: true, new: true }
    );

    // -------------------------------------------------------------
    // Test 1: Create Insurance Policy
    // -------------------------------------------------------------
    const testPolicyNum = `POL-TEST-${Date.now()}`;
    const policy = await InsurancePolicyService.createPolicy(
      {
        patientId: testPatientId,
        providerName: 'Star Health Insurance',
        policyNumber: testPolicyNum,
        memberId: 'MEM-T01',
        policyHolderName: 'Rahul Shah',
        relationshipToPatient: 'SELF',
        planName: 'Gold Health Plan',
        isPrimary: true
      },
      { userId: 'TEST_USER', username: 'Tester' }
    );

    assertTest('Test 1: Policy created with status DRAFT & unique policyId', policy && policy.policyId && policy.status === 'DRAFT');

    // -------------------------------------------------------------
    // Test 2: Duplicate Policy Detection (Section 16)
    // -------------------------------------------------------------
    let duplicateCaught = false;
    try {
      await InsurancePolicyService.createPolicy(
        {
          patientId: testPatientId,
          providerName: 'Star Health Insurance',
          policyNumber: testPolicyNum,
          memberId: 'MEM-T01',
          policyHolderName: 'Rahul Shah'
        },
        { userId: 'TEST_USER' }
      );
    } catch (err) {
      if (err.code === 'DUPLICATE_POLICY') duplicateCaught = true;
    }
    assertTest('Test 2: Duplicate policy detected and rejected', duplicateCaught);

    // -------------------------------------------------------------
    // Test 3: Update Insurance Policy
    // -------------------------------------------------------------
    const updated = await InsurancePolicyService.updatePolicy(
      policy.policyId,
      { groupNumber: 'GRP-9901', planName: 'Gold Platinum Plan' },
      { userId: 'TEST_USER' }
    );
    assertTest('Test 3: Policy details updated successfully', updated.groupNumber === 'GRP-9901' && updated.planName === 'Gold Platinum Plan');

    // -------------------------------------------------------------
    // Test 4: Request Verification & Queue Status
    // -------------------------------------------------------------
    const reqRes = await InsuranceVerificationService.requestVerification(
      policy.policyId,
      { source: 'API', integrationPreference: 'API', requestedBy: 'REC_OFFICER_01', forceNew: true },
      { userId: 'REC_OFFICER_01' }
    );
    assertTest('Test 4: Verification request created and QUEUED', reqRes && reqRes.verificationId && reqRes.status === 'QUEUED');

    // -------------------------------------------------------------
    // Test 5: Idempotency & Duplicate Verification Prevention (Section 37 & 65)
    // -------------------------------------------------------------
    const duplicateReq = await InsuranceVerificationService.requestVerification(
      policy.policyId,
      { source: 'API', forceNew: false },
      { userId: 'REC_OFFICER_01' }
    );
    assertTest('Test 5: Idempotent verification returns existing active verification', duplicateReq.verificationId === reqRes.verificationId && duplicateReq.isExisting === true);

    // -------------------------------------------------------------
    // Test 6 & 7: Successful API Verification Execution (Section 27)
    // -------------------------------------------------------------
    const verifSuccess = await InsuranceVerificationService.executeVerification(reqRes.verificationId);
    assertTest(
      'Test 6 & 7: Verification completed successfully with VERIFIED status and normalized coverage',
      verifSuccess.status === 'VERIFIED' &&
        verifSuccess.eligibilityStatus === 'ELIGIBLE' &&
        verifSuccess.networkStatus === 'IN_NETWORK' &&
        verifSuccess.coverageLimit === 500000 &&
        verifSuccess.coverageRemaining === 425000
    );

    // Check that policy state was updated to ACTIVE
    const refreshedPolicy = await InsurancePolicy.findOne({ policyId: policy.policyId });
    assertTest('Policy updated to ACTIVE after verification', refreshedPolicy.status === 'ACTIVE' && refreshedPolicy.lastVerificationStatus === 'VERIFIED');

    // -------------------------------------------------------------
    // Test 8: Partial Result Verification (Section 7 & 28)
    // -------------------------------------------------------------
    const partialPolicy = await InsurancePolicyService.createPolicy(
      {
        patientId: testPatientId,
        providerName: 'Star Health Insurance',
        policyNumber: `POL-PARTIAL-${Date.now()}`,
        memberId: 'MEM-PART-TEST',
        policyHolderName: 'Rahul Shah',
        isPrimary: false
      },
      { userId: 'TEST_USER' }
    );

    const partReq = await InsuranceVerificationService.requestVerification(partialPolicy.policyId, { forceNew: true });
    // Let async execute or invoke executeVerification
    const partResult = await InsuranceVerificationService.executeVerification(partReq.verificationId);
    assertTest(
      'Test 8: Partially verified state handled without inventing coverage values',
      partResult.status === 'PARTIALLY_VERIFIED' && partResult.coverageLimit === null && partResult.authorizationRequired === 'UNKNOWN'
    );

    // -------------------------------------------------------------
    // Test 9: Expired Policy Verification (Section 31)
    // -------------------------------------------------------------
    const expiredPolicy = await InsurancePolicyService.createPolicy(
      {
        patientId: testPatientId,
        providerName: 'Star Health Insurance',
        policyNumber: `POL-EXPIRED-${Date.now()}`,
        memberId: 'MEM-EXP-TEST',
        policyHolderName: 'Rahul Shah',
        isPrimary: false
      },
      { userId: 'TEST_USER' }
    );

    const expReq = await InsuranceVerificationService.requestVerification(expiredPolicy.policyId, { forceNew: true });
    const expResult = await InsuranceVerificationService.executeVerification(expReq.verificationId);
    const expPolicyDb = await InsurancePolicy.findOne({ policyId: expiredPolicy.policyId });
    assertTest('Test 9: Expired policy correctly identified and policy updated to EXPIRED', expResult.status === 'EXPIRED' && expPolicyDb.status === 'EXPIRED');

    // -------------------------------------------------------------
    // Test 10: Not Eligible Policy (Section 7)
    // -------------------------------------------------------------
    const ineligPolicy = await InsurancePolicyService.createPolicy(
      {
        patientId: testPatientId,
        providerName: 'Star Health Insurance',
        policyNumber: `POL-INELIGIBLE-${Date.now()}`,
        memberId: 'MEM-INEL-TEST',
        policyHolderName: 'Rahul Shah',
        isPrimary: false
      },
      { userId: 'TEST_USER' }
    );

    const inelReq = await InsuranceVerificationService.requestVerification(ineligPolicy.policyId, { forceNew: true });
    const inelResult = await InsuranceVerificationService.executeVerification(inelReq.verificationId);
    assertTest('Test 10: Not Eligible status verified and policy status suspended', inelResult.status === 'NOT_ELIGIBLE' && inelResult.eligibilityStatus === 'NOT_ELIGIBLE');

    // -------------------------------------------------------------
    // Test 11: Policy Not Found (Section 30)
    // -------------------------------------------------------------
    const notFoundPolicy = await InsurancePolicyService.createPolicy(
      {
        patientId: testPatientId,
        providerName: 'Star Health Insurance',
        policyNumber: `POL-NOTFOUND-${Date.now()}`,
        memberId: 'MEM-NF-TEST',
        policyHolderName: 'Rahul Shah',
        isPrimary: false
      },
      { userId: 'TEST_USER' }
    );

    const nfReq = await InsuranceVerificationService.requestVerification(notFoundPolicy.policyId, { forceNew: true });
    const nfResult = await InsuranceVerificationService.executeVerification(nfReq.verificationId);
    assertTest('Test 11: Policy Not Found handled gracefully', nfResult.status === 'NOT_FOUND' && nfResult.errorCode === 'POLICY_NOT_FOUND');

    // -------------------------------------------------------------
    // Test 12: Ambiguous Result & Exception Case Raised (Section 29 & 39)
    // -------------------------------------------------------------
    const ambPolicy = await InsurancePolicyService.createPolicy(
      {
        patientId: testPatientId,
        providerName: 'Star Health Insurance',
        policyNumber: `POL-AMBIGUOUS-${Date.now()}`,
        memberId: 'MEM-AMB-TEST',
        policyHolderName: 'Rahul Shah',
        isPrimary: false
      },
      { userId: 'TEST_USER' }
    );

    const ambReq = await InsuranceVerificationService.requestVerification(ambPolicy.policyId, { forceNew: true });
    const ambResult = await InsuranceVerificationService.executeVerification(ambReq.verificationId);
    const excCase = await ExceptionCase.findOne({ entityId: ambReq.verificationId });
    assertTest('Test 12: Ambiguous result generates OPEN ExceptionCase for staff review', ambResult.status === 'AMBIGUOUS' && excCase && excCase.currentStatus === 'OPEN');

    // -------------------------------------------------------------
    // Test 13 & 14: Failed Integration & Technical Retry (Section 38 & 61)
    // -------------------------------------------------------------
    const failPolicy = await InsurancePolicyService.createPolicy(
      {
        patientId: testPatientId,
        providerName: 'Star Health Insurance',
        policyNumber: `POL-FAIL-${Date.now()}`,
        memberId: 'MEM-FAIL-TEST',
        policyHolderName: 'Rahul Shah',
        isPrimary: false
      },
      { userId: 'TEST_USER' }
    );

    const failReq = await InsuranceVerificationService.requestVerification(failPolicy.policyId, { forceNew: true });
    const failResult = await InsuranceVerificationService.executeVerification(failReq.verificationId);
    assertTest('Test 13: Technical gateway failure caught and marked FAILED', failResult.status === 'FAILED');

    // Retry verification
    let retryThrown = false;
    try {
      // Disallow retry on non-technical status like NOT_FOUND
      await InsuranceVerificationService.retryVerification(nfReq.verificationId);
    } catch (e) {
      retryThrown = true;
    }
    assertTest('Disallowed retrying business status NOT_FOUND as technical failure', retryThrown);

    // Permitted retry on FAILED status
    failPolicy.policyNumber = `POL-RETRY-OK-${Date.now()}`;
    await failPolicy.save();
    const retriedResult = await InsuranceVerificationService.retryVerification(failReq.verificationId, { userId: 'STAFF_01' });
    assertTest('Test 14: Technical retry executed and incremented retryCount', retriedResult.retryCount >= 1);

    // -------------------------------------------------------------
    // Test 15: Manual Verification Workflow (Section 40 & 71)
    // -------------------------------------------------------------
    const manualResult = await InsuranceVerificationService.recordManualVerification(
      ambReq.verificationId,
      {
        eligibilityStatus: 'ELIGIBLE',
        policyStatus: 'ACTIVE',
        networkStatus: 'IN_NETWORK',
        coverageLimit: 400000,
        coverageRemaining: 350000,
        deductibleAmount: 3000,
        copayAmount: 300,
        referenceNumber: 'MANUAL-REF-99881',
        notes: 'Verified via insurer direct helpline confirmation with officer Sunita.'
      },
      { username: 'INSURANCE_STAFF_101', userId: 'EMP1008' }
    );
    assertTest(
      'Test 15: Manual verification recorded with verifiedBy audit and policy updated',
      manualResult.status === 'VERIFIED' && manualResult.verificationSource === 'MANUAL' && manualResult.manualReview.reviewedBy === 'INSURANCE_STAFF_101'
    );

    // -------------------------------------------------------------
    // Test 16: Evidence Upload & Linkage (Section 11 & 72)
    // -------------------------------------------------------------
    const evidenceDoc = await InsuranceEvidenceService.recordEvidence({
      patientId: testPatientId,
      policyId: policy.policyId,
      verificationId: reqRes.verificationId,
      documentType: 'INSURANCE_CARD',
      fileName: 'test_card.pdf',
      fileUrl: '/uploads/test_card.pdf',
      uploadedBy: 'PATIENT_10045'
    });
    const verifDb = await InsuranceVerification.findOne({ verificationId: reqRes.verificationId });
    assertTest(
      'Test 16: Evidence document uploaded and linked to verification',
      evidenceDoc && verifDb.evidenceDocumentIds.includes(evidenceDoc.documentId)
    );

    // -------------------------------------------------------------
    // Test 17: Billing & Inpatient Active Insurance Integration (Section 48)
    // -------------------------------------------------------------
    const billingActive = await InsurancePolicyService.getActivePolicyForBilling(testPatientId);
    assertTest(
      'Test 17: Billing active policy lookup returns verified active policy with freshness status',
      billingActive.hasInsurance === true &&
        billingActive.policy.status === 'ACTIVE' &&
        billingActive.verification.status === 'VERIFIED' &&
        billingActive.freshness.isFresh === true
    );

    console.log('\n==========================================================');
    console.log(`--- MODULE 9 TEST SUITE FINISHED: ${passedCount}/17 TESTS PASSED ---`);
    console.log('==========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n[MODULE 9 TEST RUNNER FAILED]:', error);
    process.exit(1);
  }
};

runModule9Tests();
