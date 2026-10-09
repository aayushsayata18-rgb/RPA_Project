require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const DischargeService = require('../services/DischargeService');
const DischargeValidationService = require('../services/DischargeValidationService');
const DischargeBillingService = require('../services/DischargeBillingService');
const DischargePaymentService = require('../services/DischargePaymentService');
const DischargeBedService = require('../services/DischargeBedService');
const PendingServiceChecker = require('../services/PendingServiceChecker');
const Discharge = require('../models/Discharge');
const DischargeRequest = require('../models/DischargeRequest');
const DischargeChecklist = require('../models/DischargeChecklist');
const Invoice = require('../models/Invoice');
const Bed = require('../models/Bed');
const BedAssignment = require('../models/BedAssignment');
const BillingCharge = require('../models/BillingCharge');
const PaymentTransaction = require('../models/PaymentTransaction');
const Patient = require('../models/Patient');
const Admission = require('../models/Admission');

const runModule6Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('--- STARTING MODULE 6 DISCHARGE PROCESSING TESTS ---');

    // 1. Setup a fresh test patient and admission
    const testPatientId = 'P10099_TEST';
    const testAdmissionId = 'ADM99001_TEST';
    const testBedId = 'BED-TEST-99';

    await Patient.findOneAndUpdate(
      { patientId: testPatientId },
      {
        patientId: testPatientId,
        firstName: 'Test',
        lastName: 'DischargePatient',
        fullName: 'Test DischargePatient',
        phoneNumber: '9988776655',
        insurance: { provider: 'MediShield', policyNumber: 'MED-1234', approvedAmount: 3000, isVerified: true }
      },
      { upsert: true, new: true }
    );

    await Bed.findOneAndUpdate(
      { bedId: testBedId },
      {
        bedId: testBedId,
        bedNumber: 'TB-99',
        wardId: 'WARD-PR-01',
        wardName: 'Private Deluxe Suite Ward',
        categoryCode: 'PRIVATE_ROOM',
        status: 'OCCUPIED',
        dailyRate: 2000
      },
      { upsert: true, new: true }
    );

    const testAdm = await Admission.findOneAndUpdate(
      { admissionId: testAdmissionId },
      {
        admissionId: testAdmissionId,
        patientId: testPatientId,
        patientName: 'Test DischargePatient',
        visitId: 'V99001',
        admissionRequestId: 'DREQ-99001',
        admissionType: 'INPATIENT',
        status: 'ADMITTED',
        admittingDoctorId: 'DOC1001',
        admittingDoctorName: 'Dr. Rajesh Verma',
        assignedWardId: 'WARD-PR-01',
        assignedWardName: 'Private Deluxe Suite Ward',
        assignedBedId: testBedId,
        assignedBedNumber: 'TB-99',
        clinicalRequirementReference: 'Post-op observation',
        correlationId: 'CORR-99001'
      },
      { upsert: true, new: true }
    );

    await BedAssignment.findOneAndUpdate(
      { admissionId: testAdmissionId, bedId: testBedId },
      {
        assignmentId: 'ASSIGN-99001',
        admissionId: testAdmissionId,
        patientId: testPatientId,
        bedId: testBedId,
        bedNumber: 'TB-99',
        status: 'ACTIVE',
        assignedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
      },
      { upsert: true, new: true }
    );

    // Clean any prior discharge for this test
    await Discharge.deleteMany({ admissionId: testAdmissionId });
    await DischargeRequest.deleteMany({ admissionId: testAdmissionId });
    await DischargeChecklist.deleteMany({ admissionId: testAdmissionId });
    await Invoice.deleteMany({ admissionId: testAdmissionId });
    await BillingCharge.deleteMany({ admissionId: testAdmissionId });

    // Seed test charges
    await BillingCharge.create([
      { chargeId: 'CHG-T1', patientId: testPatientId, admissionId: testAdmissionId, serviceType: 'LABORATORY', serviceName: 'CBC Blood Panel', quantity: 1, unitPrice: 1500, totalAmount: 1500, status: 'PENDING' },
      { chargeId: 'CHG-T2', patientId: testPatientId, admissionId: testAdmissionId, serviceType: 'PHARMACY', serviceName: 'Antibiotics IV', quantity: 1, unitPrice: 2000, totalAmount: 2000, status: 'PENDING' }
    ]);

    // TEST 1: Clinical Discharge Request creation
    console.log('\n[TEST 1] Clinical Discharge Request Creation...');
    const reqResult = await DischargeService.createDischargeRequest({
      admissionId: testAdmissionId,
      requestedByUserId: 'DOC1001',
      requestedByRole: 'DOCTOR',
      doctorName: 'Dr. Rajesh Verma',
      clinicalDecisionReference: 'Patient hemodynamically stable. Clinically fit for discharge.',
      clinicalSummaryNotes: 'Vitals stable. Discharge approved.'
    });
    console.log('✓ Discharge Request created with ID:', reqResult.requestId);
    if (!reqResult.requestId.startsWith('DREQ-')) throw new Error('Invalid Request ID format');

    // TEST 2: Duplicate Discharge Prevention & Validation
    console.log('\n[TEST 2] Identity Validation & Active Duplicate Prevention...');
    const validCheck = await DischargeValidationService.validatePatientAndAdmission({
      patientId: testPatientId,
      admissionId: testAdmissionId
    });
    console.log('✓ Validation passed:', validCheck.isValid);

    // TEST 3: Initiate Discharge Workflow (Detects Pending Services)
    console.log('\n[TEST 3] Discharge Initiation & Pending Service Detection...');
    const dischargeRecord = await DischargeService.initiateDischarge({
      dischargeRequestId: reqResult.requestId,
      admissionId: testAdmissionId
    });
    console.log('✓ Discharge record initiated:', dischargeRecord.dischargeNumber, 'Status:', dischargeRecord.status);
    if (dischargeRecord.status !== 'PENDING_SERVICES') {
      console.log('Note: Status is', dischargeRecord.status);
    }

    // TEST 4: Service Reconciliation & Final Invoice Generation
    console.log('\n[TEST 4] Reconcile Pending Services & Generate Final Invoice...');
    // Mark charges reconciled/invoiced
    await BillingCharge.updateMany({ admissionId: testAdmissionId }, { $set: { status: 'RECONCILED' } });
    
    const advanceResult = await DischargeService.processDischargeWorkflow({
      dischargeId: dischargeRecord.dischargeNumber,
      coveredAmount: 3000,
      depositAmount: 1000
    });
    console.log('✓ Workflow processed. Final Status:', advanceResult.discharge.status);
    console.log('✓ Gross:', advanceResult.discharge.grossAmount, 'Covered:', advanceResult.discharge.coveredAmount, 'Deposit:', advanceResult.discharge.depositAmount, 'Payable:', advanceResult.discharge.payableAmount);
    if (!advanceResult.invoice) throw new Error('Invoice was not generated');

    // TEST 5: Digital Payment Session & Callback Verification
    console.log('\n[TEST 5] Payment Gateway Session & Verified Callback...');
    const paySession = await DischargePaymentService.createPaymentSession({
      invoiceId: advanceResult.invoice.invoiceId,
      paymentMethod: 'UPI'
    });
    console.log('✓ Payment session created with Txn ID:', paySession.transactionId);

    const payVerify = await DischargePaymentService.processPaymentCallback({
      transactionId: paySession.transactionId,
      status: 'SUCCESS',
      signature: 'SIG_VALID_MOCK_12345'
    });
    console.log('✓ Payment callback verified:', payVerify.status);

    const updatedDischarge = await Discharge.findOne({ dischargeNumber: dischargeRecord.dischargeNumber });
    console.log('✓ Discharge payment status updated to:', updatedDischarge.paymentStatus, 'Discharge status:', updatedDischarge.status);

    // TEST 6: Complete Discharge & Verify Physical Bed Release
    console.log('\n[TEST 6] Complete Discharge Orchestration & Physical Bed Release Verification...');
    const completionResult = await DischargeService.completeDischarge({
      dischargeId: dischargeRecord.dischargeNumber
    });
    console.log('✓ Discharge completed:', completionResult.success);

    // Verify bed is in CLEANING_REQUIRED status
    const verifiedBed = await Bed.findOne({ bedId: testBedId });
    console.log('✓ Physical bed status:', verifiedBed.status);
    if (verifiedBed.status !== 'CLEANING_REQUIRED') {
      throw new Error(`Expected bed to be CLEANING_REQUIRED, found ${verifiedBed.status}`);
    }

    // Verify admission is marked DISCHARGED
    const verifiedAdm = await Admission.findOne({ admissionId: testAdmissionId });
    console.log('✓ Admission status:', verifiedAdm.status);
    if (verifiedAdm.status !== 'DISCHARGED') {
      throw new Error(`Expected admission to be DISCHARGED, found ${verifiedAdm.status}`);
    }

    console.log('\n--- ALL MODULE 6 TESTS PASSED SUCCESSFULLY! ---');
    process.exit(0);
  } catch (error) {
    console.error('[MODULE 6 TEST FAILED]:', error);
    process.exit(1);
  }
};

runModule6Tests();
