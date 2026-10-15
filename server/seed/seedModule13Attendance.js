require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Attendance = require('../models/Attendance');
const AttendanceEvent = require('../models/AttendanceEvent');
const AttendanceCorrection = require('../models/AttendanceCorrection');
const AttendanceHistory = require('../models/AttendanceHistory');
const AttendanceImportBatch = require('../models/AttendanceImportBatch');
const Employee = require('../models/Employee');

const seedAttendanceData = async () => {
  try {
    const isDirect = require.main === module;
    if (isDirect) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
      console.log('--- SEEDING MODULE 13 ATTENDANCE MANAGEMENT RECORDS ---');
    }

    // Look up staff members
    const staffMembers = await Employee.find({ $or: [{ status: 'ACTIVE' }, { employmentStatus: 'ACTIVE' }] }).limit(5).lean();
    if (!staffMembers || staffMembers.length === 0) {
      console.log('[Seed Attendance] No active employees found. Run seedModule12Staff first.');
      if (isDirect) process.exit(0);
      return;
    }

    const emp1 = staffMembers[0]; // EMP10001
    const emp2 = staffMembers[1] || emp1; // EMP10002
    const emp3 = staffMembers[2] || emp1; // EMP10003
    const emp4 = staffMembers[3] || emp1; // EMP10004

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // 1. Create Attendance Records
    const attendanceData = [
      {
        attendanceId: 'ATT10001',
        employeeId: emp1._id,
        employeeIdCode: emp1.employeeId,
        attendanceDate: today,
        shiftDetails: {
          shiftCode: 'GENERAL',
          shiftName: 'General Hospital Shift',
          expectedStartTime: '09:00',
          expectedEndTime: '18:00'
        },
        checkIn: {
          timestamp: new Date(today.getTime() + (8 * 60 + 55) * 60000), // 08:55
          source: 'BIOMETRIC',
          deviceId: 'BIO-GATE-1',
          sourceEventId: 'BIO-EVT-101'
        },
        checkOut: {
          timestamp: new Date(today.getTime() + (18 * 60 + 5) * 60000), // 18:05
          source: 'BIOMETRIC',
          deviceId: 'BIO-GATE-1',
          sourceEventId: 'BIO-EVT-102'
        },
        status: 'PRESENT',
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        workedMinutes: 550,
        overtimeMinutes: 10,
        source: 'BIOMETRIC',
        reconciliationStatus: 'MATCHED',
        reconciliationNotes: 'Normal on-time punch matched to General Shift.'
      },
      {
        attendanceId: 'ATT10002',
        employeeId: emp2._id,
        employeeIdCode: emp2.employeeId,
        attendanceDate: today,
        shiftDetails: {
          shiftCode: 'GENERAL',
          shiftName: 'General Hospital Shift',
          expectedStartTime: '09:00',
          expectedEndTime: '18:00'
        },
        checkIn: {
          timestamp: new Date(today.getTime() + (9 * 60 + 28) * 60000), // 09:28
          source: 'BIOMETRIC',
          deviceId: 'BIO-GATE-2',
          sourceEventId: 'BIO-EVT-103'
        },
        checkOut: {
          timestamp: new Date(today.getTime() + (18 * 60 + 2) * 60000), // 18:02
          source: 'BIOMETRIC',
          deviceId: 'BIO-GATE-2',
          sourceEventId: 'BIO-EVT-104'
        },
        status: 'LATE',
        lateMinutes: 28,
        earlyDepartureMinutes: 0,
        workedMinutes: 514,
        overtimeMinutes: 0,
        source: 'BIOMETRIC',
        reconciliationStatus: 'MATCHED_WITH_LATE',
        reconciliationNotes: 'Arrived 28 minutes late against 09:00 shift start.'
      },
      {
        attendanceId: 'ATT10003',
        employeeId: emp3._id,
        employeeIdCode: emp3.employeeId,
        attendanceDate: today,
        shiftDetails: {
          shiftCode: 'GENERAL',
          shiftName: 'General Hospital Shift',
          expectedStartTime: '09:00',
          expectedEndTime: '18:00'
        },
        checkIn: {
          timestamp: new Date(today.getTime() + (9 * 60 + 10) * 60000), // 09:10
          source: 'BIOMETRIC',
          deviceId: 'BIO-GATE-1',
          sourceEventId: 'BIO-EVT-105'
        },
        checkOut: {
          timestamp: null
        },
        status: 'MISSED_PUNCH',
        lateMinutes: 10,
        earlyDepartureMinutes: 0,
        workedMinutes: 0,
        overtimeMinutes: 0,
        source: 'BIOMETRIC',
        reconciliationStatus: 'MISSING_PUNCH',
        reconciliationNotes: 'Check-in recorded, but check-out is missing.'
      },
      {
        attendanceId: 'ATT10004',
        employeeId: emp4._id,
        employeeIdCode: emp4.employeeId,
        attendanceDate: yesterday,
        shiftDetails: {
          shiftCode: 'GENERAL',
          shiftName: 'General Hospital Shift',
          expectedStartTime: '09:00',
          expectedEndTime: '18:00'
        },
        checkIn: {
          timestamp: new Date(yesterday.getTime() + (9 * 60 + 4) * 60000), // 09:04
          source: 'BIOMETRIC',
          deviceId: 'BIO-GATE-1'
        },
        checkOut: {
          timestamp: null
        },
        status: 'MISSED_PUNCH',
        correctionStatus: 'PENDING',
        lateMinutes: 4,
        source: 'BIOMETRIC',
        reconciliationStatus: 'MISSING_PUNCH',
        reconciliationNotes: 'Awaiting employee correction review.'
      }
    ];

    for (const att of attendanceData) {
      await Attendance.findOneAndUpdate(
        {
          $or: [
            { attendanceId: att.attendanceId },
            { employeeId: att.employeeId, attendanceDate: att.attendanceDate }
          ]
        },
        { $set: att },
        { upsert: true, new: true }
      );
    }

    // 2. Create Correction Request for ATT10004
    const att4 = await Attendance.findOne({ attendanceId: 'ATT10004' });
    if (att4) {
      const correction = await AttendanceCorrection.findOneAndUpdate(
        { requestId: 'ATC10001' },
        {
          requestId: 'ATC10001',
          attendanceId: att4._id,
          employeeId: emp4._id,
          employeeIdCode: emp4.employeeId,
          requestedByName: `${emp4.firstName} ${emp4.lastName}`,
          requestedAt: new Date(),
          originalValues: {
            checkIn: att4.checkIn.timestamp,
            checkOut: null,
            status: 'MISSED_PUNCH'
          },
          requestedValues: {
            checkIn: att4.checkIn.timestamp,
            checkOut: new Date(yesterday.getTime() + (18 * 60 + 5) * 60000), // 18:05
            status: 'PRESENT'
          },
          reason: 'Biometric device scanner was unresponsive at the exit gate during evening shift handover.',
          status: 'PENDING'
        },
        { upsert: true, new: true }
      );

      att4.correctionRequestId = correction._id;
      await att4.save();
    }

    // 3. Create Sample Import Batch
    await AttendanceImportBatch.findOneAndUpdate(
      { batchId: 'BAT10001' },
      {
        batchId: 'BAT10001',
        source: 'CSV',
        fileName: 'biometric_dump_oct15.csv',
        fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploadedByName: 'System Automation',
        uploadedAt: new Date(),
        recordCount: 24,
        processedCount: 24,
        successCount: 23,
        duplicateCount: 1,
        errorCount: 0,
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 60000),
        completedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 4. Create History Trail
    for (const att of attendanceData) {
      const savedAtt = await Attendance.findOne({ attendanceId: att.attendanceId });
      if (savedAtt) {
        await AttendanceHistory.create({
          attendanceId: savedAtt._id,
          action: 'CREATED',
          oldValues: {},
          newValues: { status: savedAtt.status },
          performedBy: 'SYSTEM',
          performedByName: 'Seed Master Loader',
          reason: 'Initial demo dataset ingestion'
        });
      }
    }

    console.log('[Seed Attendance] Module 13 Attendance records seeded successfully!');
    if (isDirect) process.exit(0);
  } catch (error) {
    console.error('[Seed Attendance Error]:', error);
    if (require.main === module) process.exit(1);
    throw error;
  }
};

module.exports = seedAttendanceData;

if (require.main === module) {
  seedAttendanceData();
}
