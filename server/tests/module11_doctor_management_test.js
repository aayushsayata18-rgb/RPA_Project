require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const DoctorAvailability = require('../models/DoctorAvailability');
const DoctorExternalSync = require('../models/DoctorExternalSync');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const ExceptionCase = require('../models/ExceptionCase');

const DoctorService = require('../services/doctorService');
const DoctorScheduleService = require('../services/DoctorScheduleService');
const DoctorConflictService = require('../services/doctorConflictService');
const DoctorCredentialService = require('../services/doctorCredentialService');
const DoctorAvailabilityService = require('../services/doctorAvailabilityService');
const DoctorSyncService = require('../services/doctorSyncService');

const runModule11Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 11 DOCTOR MANAGEMENT TEST SUITE ---');
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

    const userAdmin = { userId: 'USR-ADMIN-TEST', role: 'ADMIN_MANAGER' };
    const userHr = { userId: 'USR-HR-TEST', role: 'HR_MANAGER' };

    // Setup Test Department
    const testDept = await Department.findOneAndUpdate(
      { departmentId: 'DEP-TEST-DOC' },
      {
        departmentId: 'DEP-TEST-DOC',
        name: 'Test Clinical Department',
        code: 'TCLIN',
        isActive: true
      },
      { upsert: true, new: true }
    );

    // 1. Doctor Profile Creation
    const testDocId = `DOC_T_${Date.now()}`;
    const testEmail = `doctor.test.${Date.now()}@hospital.com`;

    const createdDoctor = await DoctorService.createDoctor(
      {
        doctorId: testDocId,
        title: 'Dr.',
        firstName: 'Vikram',
        lastName: 'Singhania',
        gender: 'MALE',
        email: testEmail,
        phone: '9876543299',
        departmentId: testDept.departmentId,
        departmentName: testDept.name,
        specialty: 'Clinical Cardiology',
        consultationFee: 750,
        consultationDurationMinutes: 30,
        status: 'PENDING_APPROVAL',
        registrationNumber: 'REG-TEST-9988',
        registrationAuthority: 'National Medical Commission',
        registrationExpiryDate: new Date('2030-01-01')
      },
      userHr
    );

    assertTest('1. Doctor created with unique ID and PENDING_APPROVAL status', createdDoctor.doctorId === testDocId && createdDoctor.status === 'PENDING_APPROVAL');
    assertTest('2. Doctor displayName and fullName synced properly', createdDoctor.displayName.includes('Vikram Singhania'));
    assertTest('3. Primary department assigned in departments array', createdDoctor.departments.length > 0 && createdDoctor.departments[0].departmentId === testDept.departmentId);

    // 2. Duplicate Doctor Prevention
    let duplicateRejected = false;
    try {
      await DoctorService.createDoctor(
        {
          doctorId: testDocId,
          firstName: 'Another',
          lastName: 'Doctor',
          email: 'another.unique@hospital.com',
          phone: '9876543200',
          departmentId: testDept.departmentId
        },
        userHr
      );
    } catch (e) {
      duplicateRejected = true;
    }
    assertTest('4. Prevent duplicate doctor creation with same doctorId', duplicateRejected);

    // 3. Doctor Profile Update
    const updatedDoctor = await DoctorService.updateDoctor(
      testDocId,
      {
        bio: 'Senior Clinical Specialist with 15+ years experience.',
        consultationFee: 900
      },
      userAdmin
    );
    assertTest('5. Doctor profile updated successfully (bio & consultationFee)', updatedDoctor.consultationFee === 900 && updatedDoctor.bio.includes('15+ years'));

    // 4. Qualification Management
    const doctorWithQual = await DoctorCredentialService.addQualification(
      testDocId,
      {
        qualification: 'DM (Cardiology)',
        institution: 'AIIMS New Delhi',
        year: 2012,
        verificationStatus: 'VERIFIED'
      },
      userHr
    );
    assertTest('6. Added qualification DM (Cardiology) to doctor profile', doctorWithQual.qualifications.some((q) => q.qualification === 'DM (Cardiology)'));

    // 5. Registration Management & Expiry Evaluation
    const statusValid = DoctorCredentialService.evaluateRegistrationStatus(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    assertTest('7. Registration valid if expiry is 1 year in future', statusValid === 'VALID');

    const statusExpiringSoon = DoctorCredentialService.evaluateRegistrationStatus(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000));
    assertTest('8. Registration EXPIRING_SOON if expiry <= 30 days', statusExpiringSoon === 'EXPIRING_SOON');

    const statusExpired = DoctorCredentialService.evaluateRegistrationStatus(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000));
    assertTest('9. Registration EXPIRED if expiry is in past', statusExpired === 'EXPIRED');

    // 6. Doctor Status Lifecycle & Approval Workflow
    const approvedDoc = await DoctorService.changeDoctorStatus(testDocId, 'ACTIVE', 'Administrative verification complete', userAdmin);
    assertTest('10. Doctor approved and transitioned to ACTIVE status', approvedDoc.doctor.status === 'ACTIVE' && approvedDoc.doctor.availabilityStatus === 'AVAILABLE');

    // 7. Department Transfer Workflow (Section 13)
    const targetDept = await Department.findOneAndUpdate(
      { departmentId: 'DEP-TRANSFER-TEST' },
      { departmentId: 'DEP-TRANSFER-TEST', name: 'Emergency Surgery Department', code: 'ESURG', isActive: true },
      { upsert: true, new: true }
    );

    const transferredDoc = await DoctorService.transferDepartment(
      testDocId,
      {
        targetDepartmentId: targetDept.departmentId,
        reason: 'Internal transfer to surgical unit'
      },
      userAdmin
    );
    assertTest('11. Doctor transferred to new primary department', transferredDoc.departmentId === targetDept.departmentId);
    assertTest('12. Historical department marked as TRANSFERRED with preserved history', transferredDoc.departments.some((d) => d.status === 'TRANSFERRED'));

    // 8. Recurring Schedule Creation
    const scheduleMon = await DoctorScheduleService.createSchedule(
      {
        doctorId: testDocId,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '13:00',
        slotDurationMinutes: 30,
        roomNumber: 'OPD-101',
        status: 'ACTIVE'
      },
      userAdmin
    );
    assertTest('13. Recurring Monday schedule created (09:00 - 13:00)', scheduleMon.dayOfWeekName === 'MONDAY' && scheduleMon.startTime === '09:00');

    // 9. Schedule Conflict Detection (Section 25 & 77)
    let conflictDetected = false;
    try {
      await DoctorScheduleService.createSchedule(
        {
          doctorId: testDocId,
          dayOfWeek: 1, // Same Monday
          startTime: '11:00', // Overlaps with 09:00 - 13:00
          endTime: '15:00',
          roomNumber: 'OPD-101'
        },
        userAdmin
      );
    } catch (e) {
      if (e.errorCode === 'SCHEDULE_CONFLICT') {
        conflictDetected = true;
      }
    }
    assertTest('14. Overlapping schedule conflict detected and rejected with 409 error', conflictDetected);

    // 10. Invalid Schedule Bounds Validation (Section 84)
    let boundsRejected = false;
    try {
      await DoctorScheduleService.createSchedule(
        {
          doctorId: testDocId,
          dayOfWeek: 2, // Tuesday
          startTime: '15:00',
          endTime: '12:00' // startTime >= endTime
        },
        userAdmin
      );
    } catch (e) {
      boundsRejected = true;
    }
    assertTest('15. Invalid schedule with startTime >= endTime rejected', boundsRejected);

    // 11. Slot Generation (Section 28)
    // Find next Monday date string
    const nextMonday = new Date();
    nextMonday.setHours(12, 0, 0, 0);
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
    const nextMondayStr = nextMonday.toISOString().split('T')[0];

    const slotResult = await DoctorScheduleService.generateAvailableSlots(testDocId, nextMondayStr);
    assertTest('16. Generated available slots from active recurring schedule', slotResult.slots.length === 8); // 4 hours / 30m = 8 slots
    assertTest('17. First slot begins at 09:00 and finishes at 09:30', slotResult.slots[0].startTime === '09:00' && slotResult.slots[0].endTime === '09:30');

    // 12. Doctor Unavailability Recording (Section 33)
    const unavailResult = await DoctorAvailabilityService.recordAvailability(
      {
        doctorId: testDocId,
        date: nextMonday,
        startTime: '10:00',
        endTime: '11:00',
        status: 'UNAVAILABLE',
        reason: 'Staff meeting'
      },
      userAdmin
    );
    assertTest('18. Manual unavailability exception recorded for doctor', unavailResult.availabilityRecord.status === 'UNAVAILABLE');

    // 13. Approved Leave Integration (Section 30)
    const leaveResult = await DoctorAvailabilityService.processApprovedLeave(
      {
        doctorId: testDocId,
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        reason: 'Conference Leave'
      },
      userHr
    );
    assertTest('19. Approved leave creates date-specific availability exceptions', leaveResult.recordsCreatedCount === 3);

    // 14. Doctor Deactivation / Suspension Impact Check (Section 55)
    // Create an appointment on doctor's schedule
    const testAptId = `APT-TEST-${Date.now()}`;
    await Appointment.create({
      appointmentId: testAptId,
      patientId: 'P10001',
      doctorId: testDocId,
      doctorName: createdDoctor.displayName,
      departmentId: testDept.departmentId,
      departmentName: testDept.name,
      specialty: 'Clinical Cardiology',
      appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      appointmentDateStr: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '09:30',
      status: 'CONFIRMED',
      correlationId: `CORR-APT-${Date.now()}`
    });

    const statusDeactivated = await DoctorService.changeDoctorStatus(
      testDocId,
      'INACTIVE',
      'Doctor sabbatical',
      userAdmin
    );
    assertTest('20. Deactivation flags affected future appointments and opens exception', statusDeactivated.affectedAppointmentsCount >= 1);

    // 15. External RPA System Synchronization (Section 37 & 41)
    const syncResult = await DoctorSyncService.triggerDoctorSync(testDocId, {
      syncType: 'PROFILE_SYNC',
      externalSystem: 'LEGACY_HIS',
      user: userAdmin
    });
    assertTest('21. External RPA sync triggered with read-back verification', syncResult.status === 'SYNCED' && syncResult.verifiedByReadBack === true);

    // 16. Doctor Master Dashboard Metrics (Section 73)
    const metrics = await DoctorService.getDashboardMetrics();
    assertTest('22. Dashboard returns total, active, on-leave, and credential metrics', metrics.totalDoctors > 0 && typeof metrics.activeDoctors === 'number');

    console.log('\n==========================================================');
    console.log(`--- MODULE 11 TEST SUITE COMPLETE: ${passedCount} OF 22 TESTS PASSED ---`);
    console.log('==========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n[FATAL ERROR] Module 11 test failed:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

runModule11Tests();
