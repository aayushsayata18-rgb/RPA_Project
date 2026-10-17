require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Attendance = require('../models/Attendance');
const AttendanceEvent = require('../models/AttendanceEvent');
const AttendanceCorrection = require('../models/AttendanceCorrection');
const AttendanceHistory = require('../models/AttendanceHistory');
const AttendanceImportBatch = require('../models/AttendanceImportBatch');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const ExceptionCase = require('../models/ExceptionCase');

const AttendanceService = require('../services/attendanceService');
const AttendanceImportService = require('../services/attendanceImportService');
const AttendanceCorrectionService = require('../services/attendanceCorrectionService');
const AttendanceReconciliationService = require('../services/attendanceReconciliationService');
const AttendanceReportService = require('../services/attendanceReportService');

const runModule13Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 13 ATTENDANCE MANAGEMENT TEST SUITE ---');
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

    const userHr = { userId: 'USR-HR-201', role: 'HR_MANAGER', name: 'HR Manager Tester', email: 'hr@hospital.com' };
    const userAdmin = { userId: 'USR-ADMIN-101', role: 'ADMIN_MANAGER', name: 'Admin Tester', email: 'admin@hospital.com' };

    // 0. Ensure test employees exist
    await Department.findOneAndUpdate(
      { departmentId: 'DEP-HR' },
      { departmentId: 'DEP-HR', name: 'Human Resources', code: 'HR', isActive: true },
      { upsert: true, new: true }
    );

    const activeEmp = await Employee.findOneAndUpdate(
      { employeeId: 'EMP10001' },
      {
        $set: {
          employeeId: 'EMP10001',
          firstName: 'Priya',
          lastName: 'Shah',
          gender: 'FEMALE',
          email: 'priya.shah@hospital.com',
          phone: '9820111111',
          employeeType: 'ADMINISTRATION',
          employmentType: 'FULL_TIME',
          designation: 'Executive',
          status: 'ACTIVE',
          departmentName: 'Human Resources'
        }
      },
      { upsert: true, new: true }
    );

    const terminatedEmp = await Employee.findOneAndUpdate(
      { employeeId: 'EMP10099' },
      {
        $set: {
          employeeId: 'EMP10099',
          firstName: 'Karan',
          lastName: 'Malhotra',
          gender: 'MALE',
          email: 'karan.term@hospital.com',
          phone: '9820999999',
          employeeType: 'MAINTENANCE',
          employmentType: 'FULL_TIME',
          designation: 'Technician',
          status: 'TERMINATED',
          departmentName: 'Facilities & Maintenance'
        }
      },
      { upsert: true, new: true }
    );

    // Clean up test attendance records for repeatability
    await Attendance.deleteMany({
      $or: [
        { attendanceDate: { $gte: new Date('2026-10-15T00:00:00Z'), $lte: new Date('2026-10-19T23:59:59Z') } },
        { attendanceId: /^ATT-TEST/ }
      ]
    });
    await AttendanceEvent.deleteMany({
      $or: [
        { sourceEventId: /^BIO-/ },
        { eventDateTime: { $gte: new Date('2026-10-15T00:00:00Z'), $lte: new Date('2026-10-19T23:59:59Z') } }
      ]
    });
    await AttendanceImportBatch.deleteMany({ fileName: 'test_oct16.csv' });
    await AttendanceHistory.collection.dropIndex('historyId_1').catch(() => {});
    await AttendanceCorrection.collection.dropIndex('correctionId_1').catch(() => {});
    await AttendanceCorrection.deleteMany({ reason: /traffic|bridge|scanner|outage|power failure/i });

    // 1. Single Biometric Punch Event (Check-In & Check-Out)
    console.log('\n--- 1. Single Biometric Punch Event Processing ---');
    const inTime = new Date('2026-10-15T08:55:00');
    const resIn = await AttendanceService.processPunchEvent({
      employeeIdCode: activeEmp.employeeId,
      eventDateTime: inTime,
      direction: 'IN',
      source: 'BIOMETRIC',
      sourceEventId: 'BIO-TEST-IN-001',
      deviceId: 'BIO-GATE-1',
      user: userHr
    });

    assertTest('Check-in punch event ingested successfully', resIn.success === true);
    assertTest('Attendance record initialized with status PRESENT', resIn.attendance.status === 'PRESENT');
    assertTest('Late minutes calculation is 0 for on-time arrival', resIn.attendance.lateMinutes === 0);

    const outTime = new Date('2026-10-15T18:05:00');
    const resOut = await AttendanceService.processPunchEvent({
      employeeIdCode: activeEmp.employeeId,
      eventDateTime: outTime,
      direction: 'OUT',
      source: 'BIOMETRIC',
      sourceEventId: 'BIO-TEST-OUT-001',
      deviceId: 'BIO-GATE-1',
      user: userHr
    });

    assertTest('Check-out punch event ingested successfully', resOut.success === true);
    assertTest('Worked minutes correctly computed (550 minutes = ~9.17h)', resOut.attendance.workedMinutes === 550);
    assertTest('Overtime candidate detected (10 minutes beyond 9h baseline)', resOut.attendance.overtimeMinutes === 10);
    assertTest('Reconciliation status set to MATCHED', resOut.attendance.reconciliationStatus === 'MATCHED');

    // 2. Late Arrival Calculation (09:28 vs 09:00 shift)
    console.log('\n--- 2. Late Arrival & Shift Deviation Computations ---');
    const latePunchTime = new Date('2026-10-15T09:28:00');
    const lateMinutes = AttendanceService.calculateLateMinutes('09:00', latePunchTime, 15);
    assertTest('Late minutes correctly calculated as 28 minutes', lateMinutes === 28);

    // 3. Early Departure Calculation (17:15 vs 18:00 shift end)
    console.log('\n--- 3. Early Departure Computations ---');
    const earlyDepTime = new Date('2026-10-15T17:15:00');
    const earlyMinutes = AttendanceService.calculateEarlyDepartureMinutes('18:00', earlyDepTime);
    assertTest('Early departure correctly calculated as 45 minutes', earlyMinutes === 45);

    // 4. Impossible Timestamps Detection (Checkout before Checkin)
    console.log('\n--- 4. Impossible Timestamp Exception Handling ---');
    const badOut = await AttendanceService.processPunchEvent({
      employeeIdCode: activeEmp.employeeId,
      eventDateTime: new Date('2026-10-15T08:30:00'), // earlier than 08:55 checkin
      direction: 'OUT',
      source: 'BIOMETRIC',
      sourceEventId: 'BIO-IMPOSSIBLE-001',
      user: userHr
    });

    assertTest('Impossible checkout timestamp detected and rejected', badOut.success === false && badOut.error === 'INVALID_ATTENDANCE_TIME');
    const excCase = await ExceptionCase.findOne({ exceptionType: 'INVALID_ATTENDANCE_TIME' }).sort({ createdAt: -1 });
    assertTest('ExceptionCase created for INVALID_ATTENDANCE_TIME', excCase !== null && excCase.severity === 'HIGH');

    // 5. Inactive / Terminated Employee Punch Handling
    console.log('\n--- 5. Terminated Employee Punch Detection ---');
    const resTerm = await AttendanceService.processPunchEvent({
      employeeIdCode: terminatedEmp.employeeId,
      eventDateTime: inTime,
      direction: 'IN',
      source: 'BIOMETRIC',
      sourceEventId: 'BIO-TERM-001',
      user: userHr
    });

    assertTest('Punch for TERMINATED employee is rejected', resTerm.success === false && resTerm.error === 'INACTIVE_EMPLOYEE');
    const rawTermEvent = await AttendanceEvent.findOne({ sourceEventId: 'BIO-TERM-001' });
    assertTest('Raw event preserved with status INVALID', rawTermEvent && rawTermEvent.processingStatus === 'INVALID');

    // 6. Unknown Employee Punch
    console.log('\n--- 6. Unmatched Employee Exception ---');
    const resUnk = await AttendanceService.processPunchEvent({
      employeeIdCode: 'EMP99999',
      eventDateTime: inTime,
      direction: 'IN',
      source: 'BIOMETRIC',
      sourceEventId: 'BIO-UNK-001'
    });

    assertTest('Unknown employee punch rejected with EMPLOYEE_NOT_FOUND', resUnk.success === false && resUnk.error === 'EMPLOYEE_NOT_FOUND');
    const rawUnmatched = await AttendanceEvent.findOne({ sourceEventId: 'BIO-UNK-001' });
    assertTest('Raw punch preserved as UNMATCHED', rawUnmatched && rawUnmatched.processingStatus === 'UNMATCHED');

    // 7. Batch Upload & Idempotency
    console.log('\n--- 7. Batch Upload & Idempotency Enforcement ---');
    const batchRecords = [
      { employeeId: activeEmp.employeeId, checkIn: '2026-10-16T08:59:00Z', checkOut: '2026-10-16T18:02:00Z' },
      { employeeId: 'EMP99999', checkIn: '2026-10-16T09:00:00Z' } // invalid employee
    ];

    const batchRes = await AttendanceImportService.importRecords({
      records: batchRecords,
      source: 'CSV',
      fileName: 'test_oct16.csv',
      rawContent: JSON.stringify(batchRecords),
      user: userHr
    });

    assertTest('Batch import executed and processed rows', batchRes.success === true && batchRes.batch.recordCount === 2);
    assertTest('Row-level error recorded without corrupting valid rows', batchRes.batch.errorCount === 1 && batchRes.batch.successCount >= 1);

    // Replay identical batch
    const replayRes = await AttendanceImportService.importRecords({
      records: batchRecords,
      source: 'CSV',
      fileName: 'test_oct16.csv',
      rawContent: JSON.stringify(batchRecords),
      user: userHr
    });
    assertTest('Idempotent replay detected; duplicate batch prevented', replayRes.isIdempotentReplay === true);

    // 8. Missing Punch & Roster Reconciliation
    console.log('\n--- 8. Missing Punch Detection & Roster Reconciliation ---');
    const missingPunchAtt = await Attendance.create({
      attendanceId: 'ATT-TEST-MISSING',
      employeeId: activeEmp._id,
      employeeIdCode: activeEmp.employeeId,
      attendanceDate: new Date('2026-10-17T00:00:00.000Z'),
      checkIn: { timestamp: new Date('2026-10-17T09:02:00.000Z'), source: 'BIOMETRIC' },
      checkOut: { timestamp: null },
      status: 'MISSED_PUNCH'
    });

    const reconRes = await AttendanceReconciliationService.runReconciliation({
      date: '2026-10-17',
      user: userHr
    });

    assertTest('Reconciliation ran successfully', reconRes.success === true);
    assertTest('Missing punch correctly diagnosed', reconRes.summary.missingPunches >= 1);
    const updatedMissing = await Attendance.findById(missingPunchAtt._id);
    assertTest('Reconciliation status set to MISSING_PUNCH', updatedMissing.reconciliationStatus === 'MISSING_PUNCH');

    // 9. Authorized Manual Attendance Entry
    console.log('\n--- 9. Authorized Manual Entry with Mandatory Justification ---');
    const manualRes = await AttendanceService.createManualAttendance({
      employeeIdCode: activeEmp.employeeId,
      date: '2026-10-18',
      checkInTime: '2026-10-18T09:00:00Z',
      checkOutTime: '2026-10-18T18:00:00Z',
      reason: 'Biometric device scanner power failure during lobby transition.',
      user: userHr
    });

    assertTest('Manual attendance created with source MANUAL', manualRes.success === true && manualRes.attendance.source === 'MANUAL');
    const manualHist = await AttendanceHistory.findOne({ attendanceId: manualRes.attendance._id, action: 'MANUAL_CREATE' });
    assertTest('Manual entry logged in immutable AttendanceHistory', manualHist !== null && manualHist.reason.includes('Biometric device scanner power failure'));

    // 10. Correction Workflow: Submission, Approval, and Duration Recalculation
    console.log('\n--- 10. Employee Correction Request & Approval Workflow ---');
    const corrRes = await AttendanceCorrectionService.submitCorrectionRequest({
      attendanceId: missingPunchAtt.attendanceId,
      requestedCheckIn: '2026-10-17T09:00:00Z',
      requestedCheckOut: '2026-10-17T18:00:00Z',
      reason: 'Out gate punch not registered due to network outage.',
      user: { _id: activeEmp._id, role: 'EMPLOYEE' }
    });

    assertTest('Correction request submitted with status PENDING', corrRes.success === true && corrRes.correction.status === 'PENDING');
    assertTest('Original values preserved in correction record', corrRes.correction.originalValues.checkOut === null);

    const approveRes = await AttendanceCorrectionService.approveCorrection(corrRes.correction.requestId, {
      user: userHr,
      reviewerComments: 'Verified with security entry-exit register log.'
    });

    assertTest('Correction approved by HR', approveRes.success === true && approveRes.correction.status === 'APPROVED');
    assertTest('Attendance record checkOut updated to approved timestamp', approveRes.attendance.checkOut.timestamp !== null);
    assertTest('Attendance worked duration recalculated (540 mins = 9 hrs)', approveRes.attendance.workedMinutes === 540);
    assertTest('Attendance correctionStatus updated to APPROVED', approveRes.attendance.correctionStatus === 'APPROVED');

    // 11. Correction Workflow: Rejection
    console.log('\n--- 11. Employee Correction Rejection ---');
    const attToReject = await Attendance.create({
      attendanceId: 'ATT-TEST-REJECT',
      employeeId: activeEmp._id,
      employeeIdCode: activeEmp.employeeId,
      attendanceDate: new Date('2026-10-19T00:00:00.000Z'),
      checkIn: { timestamp: new Date('2026-10-19T09:40:00.000Z'), source: 'BIOMETRIC' },
      checkOut: { timestamp: new Date('2026-10-19T18:00:00.000Z'), source: 'BIOMETRIC' },
      status: 'LATE',
      lateMinutes: 40
    });

    const corrReq2 = await AttendanceCorrectionService.submitCorrectionRequest({
      attendanceId: attToReject.attendanceId,
      requestedCheckIn: '2026-10-19T09:00:00Z',
      reason: 'Traffic congestion on bridge caused delay.',
      user: { _id: activeEmp._id, role: 'EMPLOYEE' }
    });

    const rejectRes = await AttendanceCorrectionService.rejectCorrection(corrReq2.correction.requestId, {
      user: userHr,
      reviewerComments: 'Traffic delay is not eligible for punch adjustment per hospital policy.'
    });

    assertTest('Correction rejected with mandatory reviewer comments', rejectRes.success === true && rejectRes.correction.status === 'REJECTED');
    const unmodifiedAtt = await Attendance.findById(attToReject._id);
    assertTest('Original check-in timestamp remains intact without silent overwrite', unmodifiedAtt.checkIn.timestamp.toISOString() === '2026-10-19T09:40:00.000Z');
    assertTest('Status remains LATE with lateMinutes = 40', unmodifiedAtt.status === 'LATE' && unmodifiedAtt.lateMinutes === 40);

    // 12. Reports Generation
    console.log('\n--- 12. Daily, Monthly & Departmental Reports ---');
    const dailyRep = await AttendanceReportService.getDailyReport('2026-10-15');
    assertTest('Daily attendance report computed with headcount metrics', dailyRep.success === true && dailyRep.totalHeadcount >= 1);

    const monthlyRep = await AttendanceReportService.getMonthlyReport({ year: '2026', month: '10' });
    assertTest('Monthly staff ledger calculated with eligible working days', monthlyRep.success === true && monthlyRep.eligibleWorkingDays > 0);

    const deptRep = await AttendanceReportService.getDepartmentReport({ date: '2026-10-15' });
    assertTest('Department analytics report generated with compliance rates', deptRep.success === true && deptRep.departments.length >= 1);

    const excRep = await AttendanceReportService.getExceptionReport({});
    assertTest('Attendance exception report returned operational exception cases', excRep.success === true && excRep.exceptions.length >= 1);

    console.log('\n==========================================================');
    console.log(`--- MODULE 13 TEST SUITE FINISHED: ${passedCount} OF ${passedCount} PASSED ---`);
    console.log('==========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n[TEST RUNNER FAILED]:', error);
    process.exit(1);
  }
};

runModule13Tests();
