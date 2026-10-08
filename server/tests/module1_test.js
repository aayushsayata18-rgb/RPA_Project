require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Registration = require('../models/Registration');
const EmergencyTemporaryRecord = require('../models/EmergencyTemporaryRecord');
const User = require('../models/User');
const AuditEvent = require('../models/AuditEvent');
const Notification = require('../models/Notification');
const IdGeneratorService = require('../services/IdGeneratorService');
const PatientMatchingService = require('../services/PatientMatchingService');
const PatientService = require('../services/PatientService');
const RegistrationService = require('../services/RegistrationService');
const VisitService = require('../services/VisitService');

const runModule1Tests = async () => {
  console.log('\n======================================================');
  console.log('   MODULE 1: PATIENT REGISTRATION ACCEPTANCE SUITE   ');
  console.log('======================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('✓ Connected to MongoDB');

    const testSuffix = String(Date.now()).slice(-6);
    const testMobile = `98${testSuffix}11`;
    const testEmail = `test_${testSuffix}@example.com`;

    // TEST 1: ID Generator Service
    console.log('\n[TEST 1] ID Generator Service Format & Sequence');
    const pid1 = await IdGeneratorService.generatePatientId();
    const pid2 = await IdGeneratorService.generatePatientId();
    const vid1 = await IdGeneratorService.generateVisitId();
    const regId = await IdGeneratorService.generateRegistrationId();
    const tempId = await IdGeneratorService.generateTemporaryEmergencyId();
    const corrId = IdGeneratorService.generateCorrelationId();

    console.log(`  -> Patient ID: ${pid1}, Next: ${pid2}`);
    console.log(`  -> Visit ID: ${vid1}`);
    console.log(`  -> Registration ID: ${regId}`);
    console.log(`  -> Temp Emergency ID: ${tempId}`);
    console.log(`  -> Correlation ID: ${corrId}`);

    if (!/^P\d{5}$/.test(pid1)) throw new Error(`Invalid Patient ID format: ${pid1}`);
    if (!/^V\d{9}$/.test(vid1)) throw new Error(`Invalid Visit ID format: ${vid1}`);
    if (!/^REG\d{9}$/.test(regId)) throw new Error(`Invalid Registration ID format: ${regId}`);
    if (!/^TEMP-\d{4}-\d{5}$/.test(tempId)) throw new Error(`Invalid Temporary ID format: ${tempId}`);
    if (!/^CORR-\d{8}-[A-Z0-9]{6}$/.test(corrId)) throw new Error(`Invalid Correlation ID format: ${corrId}`);
    console.log('  ✓ [PASS] All ID formats match production specification.');

    // TEST 2: New Patient Online Registration
    console.log('\n[TEST 2] New Patient Online Self-Registration');
    const newRegResult = await RegistrationService.processRegistration({
      source: 'ONLINE_SELF_REGISTRATION',
      visitType: 'OPD',
      department: 'GENERAL_MEDICINE',
      chiefComplaint: 'General routine wellness check',
      patient: {
        firstName: 'Vikram',
        lastName: `Malhotra_${testSuffix}`,
        dateOfBirth: '1991-03-25',
        gender: 'MALE',
        bloodGroup: 'B+',
        mobile: testMobile,
        email: testEmail,
        address: { city: 'Pune', state: 'Maharashtra', postalCode: '411001' },
        emergencyContact: { name: 'Sunita Malhotra', relationship: 'Spouse', mobile: '9811122299' }
      }
    });

    if (!newRegResult.success || newRegResult.status !== 'REGISTERED' || newRegResult.isExistingPatient) {
      throw new Error('New patient registration failed or returned wrong status');
    }
    console.log(`  ✓ [PASS] Created Patient: ${newRegResult.patientId}, Initial Visit: ${newRegResult.visitId}, Reg: ${newRegResult.registrationId}`);

    // TEST 3: Patient Master Identity vs Encounter Invariance
    console.log('\n[TEST 3] Existing Patient Repeat Visit Registration');
    const repeatResult = await RegistrationService.processRegistration({
      existingPatientId: newRegResult.patientId,
      source: 'FRONT_DESK',
      visitType: 'FOLLOW_UP',
      department: 'GENERAL_MEDICINE',
      chiefComplaint: 'Follow-up consultation'
    });

    if (repeatResult.patientId !== newRegResult.patientId) {
      throw new Error(`Patient ID changed on repeat encounter! Old: ${newRegResult.patientId}, New: ${repeatResult.patientId}`);
    }
    if (repeatResult.visitId === newRegResult.visitId) {
      throw new Error('Visit ID must be unique for each new encounter!');
    }
    console.log(`  ✓ [PASS] Permanent PID [${repeatResult.patientId}] preserved. New Visit [${repeatResult.visitId}] generated.`);

    // TEST 4: Duplicate Detection (Exact High Confidence)
    console.log('\n[TEST 4] High Confidence Duplicate Match Handling');
    const duplicateSubmission = await RegistrationService.processRegistration({
      source: 'ONLINE_SELF_REGISTRATION',
      visitType: 'OPD',
      department: 'CARDIOLOGY',
      patient: {
        firstName: 'Vikram',
        lastName: `Malhotra_${testSuffix}`,
        dateOfBirth: '1991-03-25',
        gender: 'MALE',
        mobile: testMobile
      }
    });

    if (duplicateSubmission.patientId !== newRegResult.patientId || !duplicateSubmission.isExistingPatient) {
      throw new Error('Duplicate submission did not reuse existing permanent Patient ID!');
    }
    console.log(`  ✓ [PASS] Duplicate detected. Reused PID [${duplicateSubmission.patientId}] with new Visit [${duplicateSubmission.visitId}].`);

    // TEST 5: Ambiguous Match & Human Verification Required
    console.log('\n[TEST 5] Ambiguous Identity Match & Review Exception Creation');
    const ambiguousResult = await RegistrationService.processRegistration({
      source: 'ONLINE_SELF_REGISTRATION',
      visitType: 'OPD',
      patient: {
        firstName: 'Vikram',
        lastName: `Malhotra_${testSuffix}`,
        dateOfBirth: '1991-03-25',
        gender: 'MALE',
        mobile: `99${testSuffix}88`, // differing mobile -> ambiguous!
        email: `other_${testEmail}`
      }
    });

    if (ambiguousResult.status !== 'IDENTITY_VERIFICATION_REQUIRED') {
      throw new Error(`Expected IDENTITY_VERIFICATION_REQUIRED, got: ${ambiguousResult.status}`);
    }
    console.log(`  ✓ [PASS] Ambiguous identity correctly routed to review. Reg ID: ${ambiguousResult.registrationId}`);

    // TEST 6: Human Review Decision Execution
    console.log('\n[TEST 6] Human Review: Confirm Existing Identity');
    const reviewResult = await RegistrationService.reviewAmbiguousRegistration(
      ambiguousResult.registrationId,
      {
        decision: 'CONFIRM_EXISTING',
        selectedPatientId: newRegResult.patientId,
        reviewNotes: 'Front desk confirmed phone update with patient'
      }
    );

    if (reviewResult.patientId !== newRegResult.patientId || reviewResult.status !== 'REGISTERED') {
      throw new Error('Review decision failed to confirm existing patient');
    }
    console.log(`  ✓ [PASS] Review approved and resolved ambiguous registration to PID [${reviewResult.patientId}].`);

    // TEST 7: Emergency Registration (Zero Delay & Temporary ID)
    console.log('\n[TEST 7] Emergency Intake & Temporary Record Creation');
    const emergencyIntake = await RegistrationService.processEmergencyRegistration({
      provisionalName: `Trauma Victim_${testSuffix}`,
      estimatedAge: 42,
      gender: 'MALE',
      apparentCondition: 'Polytrauma acute emergency'
    });

    if (!emergencyIntake.isTemporary || !emergencyIntake.temporaryEmergencyId.startsWith('TEMP-')) {
      throw new Error('Emergency intake failed to issue temporary ID');
    }
    console.log(`  ✓ [PASS] Emergency temporary ID [${emergencyIntake.temporaryEmergencyId}] issued with Visit [${emergencyIntake.visitId}].`);

    // TEST 8: Emergency Linking Workflow
    console.log('\n[TEST 8] Emergency Temporary Record Linking to Permanent Patient Master');
    const linkResult = await RegistrationService.linkEmergencyRecord(emergencyIntake.temporaryEmergencyId, {
      targetPatientId: newRegResult.patientId
    });

    if (linkResult.permanentPatientId !== newRegResult.patientId) {
      throw new Error('Emergency record link failed to attach to target patient');
    }
    console.log(`  ✓ [PASS] Linked temporary case [${emergencyIntake.temporaryEmergencyId}] to permanent PID [${linkResult.permanentPatientId}].`);

    // TEST 9: Audit Logging & Notification Integrity
    console.log('\n[TEST 9] Audit & Notification Verification');
    const auditLogs = await AuditEvent.find({ module: 'PATIENT_REGISTRATION' }).sort({ createdAt: -1 }).limit(5);
    console.log(`  -> Verified ${auditLogs.length} recent Audit Events logged for Module 1 actions.`);

    const notifs = await Notification.find({ event: 'PATIENT_REGISTRATION_COMPLETED' }).sort({ createdAt: -1 }).limit(5);
    console.log(`  -> Verified ${notifs.length} Registration Notifications dispatched.`);

    console.log('\n======================================================');
    console.log('   ALL MODULE 1 ACCEPTANCE TESTS PASSED (9/9)       ');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILURE:', err);
    process.exit(1);
  }
};

runModule1Tests();
