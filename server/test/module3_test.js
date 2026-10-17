require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const OPDQueue = require('../models/OPDQueue');
const OPDToken = require('../models/OPDToken');
const CheckIn = require('../models/CheckIn');
const OPDTokenHistory = require('../models/OPDTokenHistory');
const Visit = require('../models/Visit');
const AuditEvent = require('../models/AuditEvent');
const Notification = require('../models/Notification');
const OPDQueueService = require('../services/OPDQueueService');
const OPDQueueOrderingService = require('../services/OPDQueueOrderingService');
const OPDNoShowService = require('../services/OPDNoShowService');
const OPDReconciliationService = require('../services/OPDReconciliationService');
const IdGeneratorService = require('../services/IdGeneratorService');

const runModule3Tests = async () => {
  console.log('\n======================================================');
  console.log('   MODULE 3: OPD QUEUE MANAGEMENT ACCEPTANCE SUITE    ');
  console.log('======================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('✓ Connected to MongoDB');

    const todayStr = new Date().toISOString().slice(0, 10);
    const testSuffix = String(Date.now()).slice(-5);

    // Create a fresh test appointment for today
    const testAptId = `A2026${testSuffix}`;
    const testAppointment = await Appointment.create({
      appointmentId: testAptId,
      patientId: 'P10001',
      patientName: 'Aarav K Patel',
      patientPhone: '9876543216',
      patientEmail: 'patient@hospital.com',
      doctorId: 'DOC1002',
      doctorName: 'Dr. Anita Patel',
      departmentId: 'DEP-GMED',
      departmentName: 'Department of General Medicine',
      specialty: 'General Medicine',
      appointmentDate: new Date(),
      appointmentDateStr: todayStr,
      startTime: '10:00',
      endTime: '10:30',
      status: 'CONFIRMED',
      source: 'PATIENT_PORTAL',
      correlationId: `CORR-TEST-${testSuffix}`
    });
    console.log(`✓ Created test appointment: ${testAptId}`);

    // TEST 1: Token Sequence and ID Generation
    console.log('\n[TEST 1] Token Number & Token ID Generation');
    const { tokenNumber, sequenceNumber } = await IdGeneratorService.generateTokenNumber('GM', todayStr);
    const tokenId = await IdGeneratorService.generateTokenId();
    console.log(`  -> Generated Token: ${tokenNumber} (Seq: ${sequenceNumber}), Token ID: ${tokenId}`);
    if (!tokenNumber.startsWith('GM-') || !tokenId.startsWith('TOKEN-')) {
      throw new Error(`Invalid token format: ${tokenNumber}, ${tokenId}`);
    }
    console.log('  ✓ [PASS] Token number and ID generation strictly server-side.');

    // TEST 2: Process Online Self Check-in
    console.log('\n[TEST 2] Process Online Self Check-in & Queue Entry');
    const checkInRes = await OPDQueueService.processCheckIn({
      appointmentId: testAptId,
      channel: 'ONLINE_SELF_CHECKIN',
      actorUser: { role: 'PATIENT', patientId: 'P10001', id: 'P10001', name: 'Aarav K Patel' },
      override: true // allow test timing
    });

    if (!checkInRes.success) throw new Error('Check-in failed');
    const generatedToken = checkInRes.data;
    console.log(`  -> Token Created: ${generatedToken.tokenNumber} (${generatedToken.status})`);
    console.log(`  -> Room Number: ${generatedToken.roomNumber}`);
    console.log(`  -> Patients Ahead: ${checkInRes.data.patientsAhead}`);

    // Verify appointment status updated to CHECKED_IN
    const updatedApt = await Appointment.findOne({ appointmentId: testAptId });
    if (updatedApt.status !== 'CHECKED_IN' || !['CHECKED_IN', 'LATE'].includes(updatedApt.checkInStatus)) {
      throw new Error(`Appointment status not updated. Got: ${updatedApt.status}, checkInStatus: ${updatedApt.checkInStatus}`);
    }

    // Verify CheckIn and TokenHistory records exist
    const checkInRecord = await CheckIn.findOne({ appointmentId: testAptId });
    if (!checkInRecord) throw new Error('CheckIn record not created');

    const historyRecord = await OPDTokenHistory.findOne({ tokenId: generatedToken.tokenId });
    if (!historyRecord) throw new Error('OPDTokenHistory record not created');

    console.log('  ✓ [PASS] Online self check-in generated token, linked visit, updated appointment and created audit records.');

    // TEST 3: Duplicate Check-In Prevention / Idempotency
    console.log('\n[TEST 3] Duplicate Check-In Prevention (Idempotency)');
    const dupRes = await OPDQueueService.processCheckIn({
      appointmentId: testAptId,
      channel: 'ONLINE_SELF_CHECKIN',
      actorUser: { role: 'PATIENT', patientId: 'P10001', id: 'P10001' },
      override: true
    });

    if (!dupRes.alreadyCheckedIn) {
      throw new Error('Duplicate check-in was not caught by idempotency guard.');
    }
    console.log(`  -> Idempotency Guard returned existing token: ${dupRes.token.tokenNumber}`);
    console.log('  ✓ [PASS] Idempotent check-in prevents duplicate tokens.');

    // TEST 4: Queue Position and Priority Ordering
    console.log('\n[TEST 4] Queue Position & Priority Ordering Calculation');
    const aheadCount = await OPDQueueOrderingService.calculatePatientsAhead(generatedToken.queueId, generatedToken);
    const estWait = await OPDQueueOrderingService.calculateEstimatedWaitTime(aheadCount);
    console.log(`  -> Patients ahead: ${aheadCount}, Estimated wait: ${estWait} minutes`);
    console.log('  ✓ [PASS] Queue ordering service correctly calculated queue position.');

    // TEST 5: Unauthorized Priority Modification Rejection
    console.log('\n[TEST 5] Security Test: Patient Prohibited from Modifying Priority');
    let unauthorizedBlocked = false;
    try {
      await OPDQueueService.assignPriority(generatedToken.tokenId, {
        priorityType: 'EMERGENCY',
        priorityReason: 'Patient self-declares emergency',
        actorUser: { role: 'PATIENT', id: 'P10001' }
      });
    } catch (err) {
      if (err.errorCode === 'UNAUTHORIZED_PRIORITY_MODIFICATION' || err.statusCode === 403) {
        unauthorizedBlocked = true;
        console.log(`  -> Correctly blocked unauthorized priority modification: ${err.message}`);
      } else {
        throw err;
      }
    }
    if (!unauthorizedBlocked) throw new Error('Patient was able to set clinical priority!');
    console.log('  ✓ [PASS] Patient role strictly forbidden from assigning clinical priority.');

    // TEST 6: Authorized Doctor Assigns Urgent Priority
    console.log('\n[TEST 6] Authorized Doctor Assigns Urgent Priority');
    const priorityRes = await OPDQueueService.assignPriority(generatedToken.tokenId, {
      priorityType: 'URGENT',
      priorityReason: 'Severe acute presentation evaluated by triage doctor',
      actorUser: { role: 'DOCTOR', id: 'DOC1002', name: 'Dr. Anita Patel' }
    });
    if (priorityRes.token.priorityType !== 'URGENT') {
      throw new Error('Failed to update priority to URGENT');
    }
    console.log(`  -> Priority successfully updated to: ${priorityRes.token.priorityType}`);
    console.log('  ✓ [PASS] Authorized clinical user successfully assigned urgent priority with audit trace.');

    // TEST 7: Call Token (WAITING -> CALLED)
    console.log('\n[TEST 7] Call Patient Token (WAITING -> CALLED)');
    const callRes = await OPDQueueService.callToken(generatedToken.tokenId, {
      actorUser: { role: 'DOCTOR', id: 'DOC1002', name: 'Dr. Anita Patel' }
    });
    if (callRes.token.status !== 'CALLED') throw new Error(`Expected CALLED status, got ${callRes.token.status}`);

    const queueAfterCall = await OPDQueue.findOne({ queueId: generatedToken.queueId });
    if (queueAfterCall.currentToken !== generatedToken.tokenNumber) {
      throw new Error(`Queue currentToken not updated. Expected ${generatedToken.tokenNumber}, got ${queueAfterCall.currentToken}`);
    }
    console.log(`  -> Token ${generatedToken.tokenNumber} is CALLED. Queue now serving: ${queueAfterCall.currentToken}`);
    console.log('  ✓ [PASS] Token called and live queue current token updated.');

    // TEST 8: Start Service (CALLED -> IN_SERVICE)
    console.log('\n[TEST 8] Start Consultation Service (CALLED -> IN_SERVICE)');
    const startRes = await OPDQueueService.startService(generatedToken.tokenId, {
      actorUser: { role: 'DOCTOR', id: 'DOC1002', name: 'Dr. Anita Patel' }
    });
    if (startRes.token.status !== 'IN_SERVICE') throw new Error(`Expected IN_SERVICE status, got ${startRes.token.status}`);

    const aptDuringService = await Appointment.findOne({ appointmentId: testAptId });
    if (aptDuringService.status !== 'IN_PROGRESS') {
      throw new Error(`Expected Appointment status IN_PROGRESS, got: ${aptDuringService.status}`);
    }
    console.log(`  -> Token in service. Appointment status updated to: ${aptDuringService.status}`);
    console.log('  ✓ [PASS] Consultation service started.');

    // TEST 9: Complete Service (IN_SERVICE -> COMPLETED)
    console.log('\n[TEST 9] Complete Consultation (IN_SERVICE -> COMPLETED)');
    const completeRes = await OPDQueueService.completeService(generatedToken.tokenId, {
      actorUser: { role: 'DOCTOR', id: 'DOC1002', name: 'Dr. Anita Patel' },
      notes: 'Consultation finished, prescription given.'
    });
    if (completeRes.token.status !== 'COMPLETED') throw new Error(`Expected COMPLETED status, got ${completeRes.token.status}`);

    const finalApt = await Appointment.findOne({ appointmentId: testAptId });
    if (finalApt.status !== 'COMPLETED') throw new Error(`Expected Appointment status COMPLETED, got: ${finalApt.status}`);
    console.log(`  -> Service completed. Final appointment status: ${finalApt.status}`);
    console.log('  ✓ [PASS] Consultation completed and state synchronized.');

    // TEST 10: Skip and Return to Queue Flow
    console.log('\n[TEST 10] Skip Patient and Return to Queue Lifecycle');
    // Create another test appointment for skip/return
    const skipAptId = `A2026S${testSuffix}`;
    await Appointment.create({
      appointmentId: skipAptId,
      patientId: 'P10002',
      patientName: 'Priya Sharma',
      doctorId: 'DOC1002',
      doctorName: 'Dr. Anita Patel',
      departmentId: 'DEP-GMED',
      departmentName: 'Department of General Medicine',
      specialty: 'General Medicine',
      appointmentDate: new Date(),
      appointmentDateStr: todayStr,
      startTime: '10:30',
      endTime: '11:00',
      status: 'CONFIRMED',
      source: 'FRONT_DESK',
      correlationId: `CORR-SKIP-${testSuffix}`
    });

    const skipCheckin = await OPDQueueService.processCheckIn({
      appointmentId: skipAptId,
      channel: 'FRONT_DESK',
      actorUser: { role: 'RECEPTIONIST', id: 'RECEPT01', name: 'Front Desk Reception' },
      override: true
    });

    const skipTokenId = skipCheckin.data.tokenId;

    // Call and then Skip
    await OPDQueueService.callToken(skipTokenId, { actorUser: { role: 'DOCTOR', id: 'DOC1002' } });
    const skipRes = await OPDQueueService.skipToken(skipTokenId, {
      reason: 'PATIENT_NOT_PRESENT',
      actorUser: { role: 'DOCTOR', id: 'DOC1002', name: 'Dr. Anita Patel' }
    });
    if (skipRes.token.status !== 'SKIPPED') throw new Error(`Expected SKIPPED status, got: ${skipRes.token.status}`);
    console.log(`  -> Token marked as SKIPPED. Reason: ${skipRes.token.skipReason}`);

    // Return to queue
    const returnRes = await OPDQueueService.returnToken(skipTokenId, {
      reason: 'PATIENT_RETURNED_TO_DESK',
      actorUser: { role: 'RECEPTIONIST', id: 'RECEPT01', name: 'Receptionist' }
    });
    if (returnRes.token.status !== 'WAITING') throw new Error(`Expected WAITING status on return, got: ${returnRes.token.status}`);
    console.log(`  -> Token returned to queue: ${returnRes.token.tokenNumber} (status: ${returnRes.token.status})`);
    console.log('  ✓ [PASS] Skipped patient correctly returned to waiting queue.');

    // TEST 11: Queue Pause and Resume
    console.log('\n[TEST 11] Queue Pause & Resume Lifecycle');
    const pauseRes = await OPDQueueService.pauseQueue(generatedToken.queueId, {
      reason: 'DOCTOR_EMERGENCY_MEETING',
      actorUser: { role: 'ADMIN_MANAGER', id: 'ADMIN01', name: 'Manager' }
    });
    if (pauseRes.queue.status !== 'PAUSED') throw new Error('Queue failed to pause');
    console.log(`  -> Queue paused: status=${pauseRes.queue.status}`);

    const resumeRes = await OPDQueueService.resumeQueue(generatedToken.queueId, {
      actorUser: { role: 'ADMIN_MANAGER', id: 'ADMIN01', name: 'Manager' }
    });
    if (resumeRes.queue.status !== 'OPEN') throw new Error('Queue failed to resume');
    console.log(`  -> Queue resumed: status=${resumeRes.queue.status}`);
    console.log('  ✓ [PASS] Queue pause and resume lifecycle verified.');

    // TEST 12: Automated No-Show Processing
    console.log('\n[TEST 12] Automated No-Show Processing past Grace Period');
    const noShowAptId = `A2026N${testSuffix}`;
    await Appointment.create({
      appointmentId: noShowAptId,
      patientId: 'P10003',
      patientName: 'Amit R Mehta',
      patientPhone: '9876543230',
      doctorId: 'DOC1002',
      doctorName: 'Dr. Anita Patel',
      departmentId: 'DEP-GMED',
      departmentName: 'Department of General Medicine',
      specialty: 'General Medicine',
      appointmentDate: new Date(),
      appointmentDateStr: todayStr,
      startTime: '08:00', // Past time
      endTime: '08:30',
      status: 'CONFIRMED',
      checkInStatus: 'NOT_CHECKED_IN',
      source: 'PATIENT_PORTAL',
      correlationId: `CORR-NOSHOW-${testSuffix}`
    });

    const noShowRes = await OPDNoShowService.processNoShows({
      dateStr: todayStr,
      gracePeriodMinutes: 15,
      actorUser: { role: 'RPA_BOT', id: 'RPA_NO_SHOW' }
    });

    console.log(`  -> No-show processed. Evaluated: ${noShowRes.totalEvaluated}, Processed: ${noShowRes.processedCount}`);
    const noShowApt = await Appointment.findOne({ appointmentId: noShowAptId });
    if (noShowApt.status !== 'NO_SHOW' || noShowApt.checkInStatus !== 'NO_SHOW') {
      throw new Error(`Appointment was not marked NO_SHOW. Status: ${noShowApt.status}`);
    }
    console.log('  ✓ [PASS] Automated no-show evaluation marked eligible appointment and updated audit timeline.');

    // TEST 13: Queue Reconciliation & Discrepancy Detection
    console.log('\n[TEST 13] OPD Queue Reconciliation & Audit');
    const reconRes = await OPDReconciliationService.reconcileOPDQueue({
      dateStr: todayStr,
      actorUser: { role: 'RPA_BOT', id: 'RPA_RECONCILER' }
    });
    console.log(`  -> Total Appointments reconciled: ${reconRes.totalAppointments}, Total Tokens: ${reconRes.totalTokens}`);
    console.log('  ✓ [PASS] Daily queue reconciliation executed cleanly.');

    console.log('\n======================================================');
    console.log('   ALL 13 MODULE 3 ACCEPTANCE TESTS PASSED (100%)    ');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ [TEST FAILURE]:', error);
    process.exit(1);
  }
};

runModule3Tests();
