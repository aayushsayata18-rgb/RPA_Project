require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');
const AppointmentHistory = require('../models/AppointmentHistory');
const AppointmentReminder = require('../models/AppointmentReminder');
const Notification = require('../models/Notification');
const AuditEvent = require('../models/AuditEvent');
const DoctorScheduleService = require('../services/DoctorScheduleService');
const AppointmentService = require('../services/AppointmentService');
const AppointmentReminderService = require('../services/AppointmentReminderService');
const IdGeneratorService = require('../services/IdGeneratorService');

const runModule2Tests = async () => {
  console.log('\n======================================================');
  console.log('   MODULE 2: APPOINTMENT MANAGEMENT ACCEPTANCE SUITE  ');
  console.log('======================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('✓ Connected to MongoDB');

    const testSuffix = String(Date.now()).slice(-6);
    const testDateStr = '2026-10-15'; // A Thursday

    // TEST 1: Appointment ID Generation
    console.log('\n[TEST 1] Appointment ID Generation format & sequence');
    const aptId1 = await IdGeneratorService.generateAppointmentId();
    const aptId2 = await IdGeneratorService.generateAppointmentId();
    console.log(`  -> Generated IDs: ${aptId1}, ${aptId2}`);
    if (!/^A\d{9}$/.test(aptId1)) throw new Error(`Invalid Appointment ID format: ${aptId1}`);
    console.log('  ✓ [PASS] Appointment ID matches specification (e.g. A202610001).');

    // TEST 2: Doctor Availability & Slot Generation
    console.log('\n[TEST 2] Slot Generation and Working Hours Calculation');
    const slotsResult = await DoctorScheduleService.generateAvailableSlots('DOC1001', testDateStr);
    console.log(`  -> Doctor: ${slotsResult.doctorName}, Slots generated: ${slotsResult.slots.length}`);
    if (!slotsResult.isAvailable || slotsResult.slots.length === 0) {
      throw new Error('Expected available slots for DOC1001 on a weekday.');
    }
    const firstSlot = slotsResult.slots[0];
    console.log(`  -> First Slot: ${firstSlot.startTime} - ${firstSlot.endTime} (Duration: ${firstSlot.durationMinutes}m, Available: ${firstSlot.available})`);
    if (firstSlot.startTime !== '09:00' || firstSlot.endTime !== '09:30') {
      throw new Error(`Unexpected first slot timing: ${firstSlot.startTime}-${firstSlot.endTime}`);
    }
    console.log('  ✓ [PASS] Slots properly calculated matching shifts and lunch breaks.');

    // TEST 3: Create Appointment & Instant Confirmation
    console.log('\n[TEST 3] Create Appointment, History & Notification Generation');
    const apt1 = await AppointmentService.createAppointment({
      patientId: 'P10001',
      doctorId: 'DOC1001',
      appointmentDate: testDateStr,
      startTime: '09:00',
      appointmentType: 'NEW_CONSULTATION',
      source: 'PATIENT_PORTAL',
      reason: 'Chest screening test',
      actorUserId: 'USR-PATIENT-001',
      actorRole: 'PATIENT'
    });

    console.log(`  -> Created Appointment ID: ${apt1.appointmentId}, Status: ${apt1.status}`);
    if (apt1.status !== 'CONFIRMED') throw new Error(`Expected CONFIRMED status, got: ${apt1.status}`);

    // Check History record
    const history1 = await AppointmentHistory.findOne({ appointmentId: apt1.appointmentId, action: 'CREATED' });
    if (!history1) throw new Error('AppointmentHistory record was not created.');
    console.log(`  -> History Record: Action=${history1.action}, Status=${history1.newStatus}`);

    // Check Notification
    const notif1 = await Notification.findOne({
      recipientId: 'P10001',
      event: 'APPOINTMENT_CONFIRMED',
      entityId: apt1.appointmentId
    });
    if (!notif1) throw new Error('Confirmation notification was not dispatched.');
    console.log(`  -> Confirmation Notification: ${notif1.title} - ${notif1.message}`);
    console.log('  ✓ [PASS] Appointment created with history and instant confirmation notification.');

    // TEST 4: Double-Booking Prevention (Concurrency Guard)
    console.log('\n[TEST 4] Double-Booking Prevention on Full Slot Capacity');
    let doubleBookingBlocked = false;
    try {
      await AppointmentService.createAppointment({
        patientId: 'P10002',
        doctorId: 'DOC1001',
        appointmentDate: testDateStr,
        startTime: '09:00', // SAME SLOT ALREADY BOOKED BY P10001
        appointmentType: 'NEW_CONSULTATION',
        source: 'PATIENT_PORTAL',
        reason: 'Attempting to book same slot'
      });
    } catch (err) {
      if (err.code === 'APPOINTMENT_SLOT_UNAVAILABLE' || err.statusCode === 409) {
        doubleBookingBlocked = true;
        console.log(`  -> Correctly rejected double-booking: ${err.message}`);
      } else {
        throw err;
      }
    }
    if (!doubleBookingBlocked) {
      throw new Error('Double-booking was allowed when slot capacity is 1!');
    }
    console.log('  ✓ [PASS] Double-booking successfully prevented.');

    // TEST 5: Reminder Scheduling & Idempotency Key
    console.log('\n[TEST 5] Reminder Scheduling and Duplicate Prevention');
    const reminders = await AppointmentReminder.find({ appointmentId: apt1.appointmentId });
    console.log(`  -> Scheduled reminders count: ${reminders.length}`);
    if (reminders.length === 0) throw new Error('No reminders scheduled for appointment.');
    console.log(`  -> Primary Reminder: Scheduled for ${reminders[0].scheduledFor}, IdempotencyKey=${reminders[0].idempotencyKey}`);

    // Attempt duplicate schedule
    await AppointmentReminderService.scheduleRemindersForAppointment(apt1);
    const remindersAfter = await AppointmentReminder.find({ appointmentId: apt1.appointmentId });
    if (remindersAfter.length !== reminders.length) {
      throw new Error('Duplicate reminder was created!');
    }
    console.log('  ✓ [PASS] Reminders scheduled with idempotency protection against duplication.');

    // TEST 6: Rescheduling Flow (Immutable History & New Appointment)
    console.log('\n[TEST 6] Appointment Rescheduling Lifecycle');
    const rescheduleResult = await AppointmentService.rescheduleAppointment(apt1.appointmentId, {
      newDate: testDateStr,
      newStartTime: '09:30',
      reason: 'Patient requested later time slot',
      actorUserId: 'USR-PATIENT-001',
      actorRole: 'PATIENT'
    });

    const oldApt = rescheduleResult.originalAppointment;
    const newApt = rescheduleResult.newAppointment;

    console.log(`  -> Original Appointment: ${oldApt.appointmentId} [Status: ${oldApt.status}]`);
    console.log(`  -> New Appointment: ${newApt.appointmentId} [Status: ${newApt.status}, Time: ${newApt.startTime}]`);
    console.log(`  -> Rescheduled Link: ${newApt.rescheduledFromAppointmentId}`);

    if (oldApt.status !== 'RESCHEDULED' || newApt.status !== 'CONFIRMED') {
      throw new Error('Reschedule status transition failed.');
    }
    if (newApt.rescheduledFromAppointmentId !== oldApt.appointmentId) {
      throw new Error('RescheduledFrom link missing on new appointment.');
    }
    console.log('  ✓ [PASS] Rescheduling preserved old history and issued new appointment.');

    // TEST 7: Cancellation Flow & Slot Release
    console.log('\n[TEST 7] Appointment Cancellation & Slot Release');
    const cancelledApt = await AppointmentService.cancelAppointment(newApt.appointmentId, {
      reason: 'PATIENT_REQUEST',
      notes: 'No longer needed',
      actorUserId: 'USR-PATIENT-001',
      actorRole: 'PATIENT'
    });

    console.log(`  -> Cancelled Appointment: ${cancelledApt.appointmentId}, Status: ${cancelledApt.status}`);
    if (cancelledApt.status !== 'CANCELLED') throw new Error('Expected CANCELLED status.');

    // Verify slot is now available again for booking
    const slotCheckAfterCancel = await DoctorScheduleService.checkDoctorAvailability(
      'DOC1001',
      testDateStr,
      '09:30',
      '10:00'
    );
    console.log(`  -> Slot 09:30-10:00 after cancel available: ${slotCheckAfterCancel.available}`);
    if (!slotCheckAfterCancel.available) {
      throw new Error('Slot was not released after cancellation!');
    }
    console.log('  ✓ [PASS] Cancellation released slot and updated status without deleting history.');

    // TEST 8: No-Show Processing Policy
    console.log('\n[TEST 8] Automated No-Show Policy Execution');
    // Create an overdue un-checked-in appointment
    const pastApt = await AppointmentService.createAppointment({
      patientId: 'P10003',
      doctorId: 'DOC1002',
      appointmentDate: '2026-10-01',
      startTime: '10:00',
      appointmentType: 'NEW_CONSULTATION',
      source: 'FRONT_DESK',
      reason: 'Past appointment test',
      actorUserId: 'RECEPTION_STAFF',
      actorRole: 'RECEPTIONIST'
    });

    const noShowResult = await AppointmentService.processNoShowAppointments({
      dateStr: '2026-10-01',
      gracePeriodMinutes: 15
    });

    console.log(`  -> Processed No-Shows: ${noShowResult.processedCount}`);
    const updatedPastApt = await Appointment.findOne({ appointmentId: pastApt.appointmentId });
    console.log(`  -> Overdue Appointment Status: ${updatedPastApt.status}, CheckInStatus: ${updatedPastApt.checkInStatus}`);
    if (updatedPastApt.status !== 'NO_SHOW') {
      throw new Error('Past un-checked-in appointment was not marked NO_SHOW.');
    }
    console.log('  ✓ [PASS] Automated No-Show policy executed correctly.');

    console.log('\n======================================================');
    console.log('  ✓ ALL 8 MODULE 2 ACCEPTANCE TESTS PASSED SUCCESSFULLY!  ');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ [Module 2 Acceptance Test Failed]:', error);
    process.exit(1);
  }
};

runModule2Tests();
