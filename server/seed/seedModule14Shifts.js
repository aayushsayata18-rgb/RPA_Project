require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Shift = require('../models/Shift');
const Roster = require('../models/Roster');
const RosterVersion = require('../models/RosterVersion');
const ShiftAssignment = require('../models/ShiftAssignment');
const ShiftChangeRequest = require('../models/ShiftChangeRequest');
const ShiftSwapRequest = require('../models/ShiftSwapRequest');
const ShiftConflict = require('../models/ShiftConflict');
const ShiftCoverage = require('../models/ShiftCoverage');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const IdGeneratorService = require('../services/IdGeneratorService');

const seedShiftData = async () => {
  try {
    const isDirect = require.main === module;
    if (isDirect) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
      console.log('--- SEEDING MODULE 14 SHIFT MANAGEMENT RECORDS ---');
    }

    // 1. Seed Shifts
    const standardShifts = [
      {
        shiftCode: 'MORNING',
        shiftName: 'Morning Shift',
        shiftType: 'MORNING',
        startTime: '09:00',
        endTime: '18:00',
        crossesMidnight: false,
        breakMinutes: 60,
        graceBeforeMinutes: 30,
        graceAfterMinutes: 30,
        status: 'ACTIVE',
        description: 'Standard daytime morning hospital operations shift'
      },
      {
        shiftCode: 'EVENING',
        shiftName: 'Evening Shift',
        shiftType: 'EVENING',
        startTime: '14:00',
        endTime: '23:00',
        crossesMidnight: false,
        breakMinutes: 60,
        graceBeforeMinutes: 30,
        graceAfterMinutes: 30,
        status: 'ACTIVE',
        description: 'Late daytime through evening operations shift'
      },
      {
        shiftCode: 'NIGHT',
        shiftName: 'Night Shift',
        shiftType: 'NIGHT',
        startTime: '22:00',
        endTime: '06:00',
        crossesMidnight: true,
        breakMinutes: 60,
        graceBeforeMinutes: 30,
        graceAfterMinutes: 30,
        status: 'ACTIVE',
        shiftCategory: 'NIGHT',
        compensationCategory: 'NIGHT_DIFFERENTIAL',
        description: 'Overnight cross-midnight hospital operational coverage'
      },
      {
        shiftCode: 'GENERAL',
        shiftName: 'General Administrative Shift',
        shiftType: 'GENERAL',
        startTime: '09:00',
        endTime: '18:00',
        crossesMidnight: false,
        breakMinutes: 60,
        graceBeforeMinutes: 30,
        graceAfterMinutes: 30,
        status: 'ACTIVE',
        description: 'Administrative core hours'
      },
      {
        shiftCode: 'ROTATIONAL',
        shiftName: 'Rotational Day Shift',
        shiftType: 'ROTATIONAL',
        startTime: '08:00',
        endTime: '16:00',
        crossesMidnight: false,
        breakMinutes: 45,
        graceBeforeMinutes: 15,
        graceAfterMinutes: 15,
        status: 'ACTIVE',
        description: 'Rotational emergency / clinical support shift'
      }
    ];

    const seededShifts = {};
    for (const s of standardShifts) {
      let shift = await Shift.findOne({ shiftCode: s.shiftCode });
      if (!shift) {
        const shiftId = await IdGeneratorService.generateShiftId();
        shift = new Shift({ ...s, shiftId });
        await shift.save();
        console.log(`[Seed Shift] Created shift definition: ${shift.shiftCode} (${shift.shiftId})`);
      }
      seededShifts[s.shiftCode] = shift;
    }

    // 2. Fetch Sample Employees and Department
    const employees = await Employee.find({
      $or: [{ status: 'ACTIVE' }, { employmentStatus: 'ACTIVE' }]
    }).limit(6);

    const receptionDept = await Department.findOne({
      $or: [{ departmentId: 'DEP-RECEPTION' }, { code: 'RECP' }]
    }) || await Department.findOne();

    if (!receptionDept || employees.length === 0) {
      console.log('[Seed Shift] Incomplete prerequisite departments or employees. Skipping rosters.');
      if (isDirect) process.exit(0);
      return;
    }

    const emp1 = employees[0]; // e.g. EMP10001
    const emp2 = employees[1] || emp1;
    const emp3 = employees[2] || emp1;

    // 3. Create Sample Roster for Current Week
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

    let roster = await Roster.findOne({
      rosterName: 'Reception Desk — Approved Weekly Roster',
      departmentId: receptionDept._id
    });

    if (!roster) {
      const rosterId = await IdGeneratorService.generateRosterId();
      roster = new Roster({
        rosterId,
        rosterName: 'Reception Desk — Approved Weekly Roster',
        departmentId: receptionDept._id,
        departmentCode: receptionDept.code || 'RECP',
        periodStart: weekStart,
        periodEnd: weekEnd,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        currentVersion: 1,
        notes: 'Official weekly published reception roster'
      });
      await roster.save();
      console.log(`[Seed Shift] Created Roster: ${roster.rosterName} (${roster.rosterId})`);

      // 4. Create sample assignments across the week
      const days = [0, 1, 2, 3, 4]; // Mon - Fri
      const assignmentsCreated = [];

      for (const dOffset of days) {
        const assignDate = new Date(weekStart);
        assignDate.setDate(assignDate.getDate() + dOffset);

        // emp1 on MORNING
        const a1Id = await IdGeneratorService.generateShiftAssignmentId();
        const a1 = new ShiftAssignment({
          assignmentId: a1Id,
          employeeId: emp1._id,
          employeeIdCode: emp1.employeeId,
          shiftId: seededShifts.MORNING._id,
          shiftCode: 'MORNING',
          departmentId: receptionDept._id,
          departmentCode: receptionDept.code || 'RECP',
          assignmentDate: assignDate,
          status: 'PUBLISHED',
          rosterId: roster._id,
          publishedAt: new Date()
        });
        await a1.save();
        assignmentsCreated.push(a1);

        // emp2 on EVENING
        const a2Id = await IdGeneratorService.generateShiftAssignmentId();
        const a2 = new ShiftAssignment({
          assignmentId: a2Id,
          employeeId: emp2._id,
          employeeIdCode: emp2.employeeId,
          shiftId: seededShifts.EVENING._id,
          shiftCode: 'EVENING',
          departmentId: receptionDept._id,
          departmentCode: receptionDept.code || 'RECP',
          assignmentDate: assignDate,
          status: 'PUBLISHED',
          rosterId: roster._id,
          publishedAt: new Date()
        });
        await a2.save();
        assignmentsCreated.push(a2);

        // emp3 on NIGHT (cross-midnight!)
        const a3Id = await IdGeneratorService.generateShiftAssignmentId();
        const a3 = new ShiftAssignment({
          assignmentId: a3Id,
          employeeId: emp3._id,
          employeeIdCode: emp3.employeeId,
          shiftId: seededShifts.NIGHT._id,
          shiftCode: 'NIGHT',
          departmentId: receptionDept._id,
          departmentCode: receptionDept.code || 'RECP',
          assignmentDate: assignDate,
          status: 'PUBLISHED',
          rosterId: roster._id,
          publishedAt: new Date()
        });
        await a3.save();
        assignmentsCreated.push(a3);
      }

      // Record RosterVersion V1
      const versionId = await IdGeneratorService.generateRosterVersionId();
      await RosterVersion.create({
        versionId,
        rosterId: roster._id,
        versionNumber: 1,
        snapshot: assignmentsCreated.map(a => ({
          assignmentId: a.assignmentId,
          employeeIdCode: a.employeeIdCode,
          shiftCode: a.shiftCode,
          assignmentDate: a.assignmentDate
        })),
        changeReason: 'Initial Published Reception Weekly Schedule',
        changedAt: new Date()
      });

      console.log(`[Seed Shift] Created ${assignmentsCreated.length} assignments and RosterVersion V1.`);

      // 5. Create Sample Shift Change Request
      if (assignmentsCreated.length >= 2) {
        const scrId = await IdGeneratorService.generateShiftChangeRequestId();
        const scr = new ShiftChangeRequest({
          requestId: scrId,
          employeeId: emp1._id,
          employeeIdCode: emp1.employeeId,
          assignmentId: assignmentsCreated[0]._id,
          currentShiftId: seededShifts.MORNING._id,
          currentShiftCode: 'MORNING',
          requestedShiftId: seededShifts.EVENING._id,
          requestedShiftCode: 'EVENING',
          effectiveDate: assignmentsCreated[0].assignmentDate,
          reason: 'Personal medical appointment in morning',
          status: 'PENDING_APPROVAL'
        });
        await scr.save();
        console.log(`[Seed Shift] Created sample ShiftChangeRequest: ${scr.requestId}`);
      }

      // 6. Create Sample Shift Swap Request
      if (assignmentsCreated.length >= 4) {
        const ssrId = await IdGeneratorService.generateShiftSwapRequestId();
        const ssr = new ShiftSwapRequest({
          swapId: ssrId,
          requesterEmployeeId: emp1._id,
          requesterEmployeeCode: emp1.employeeId,
          requesterAssignmentId: assignmentsCreated[1]._id, // emp1 MORNING on Tue
          targetEmployeeId: emp2._id,
          targetEmployeeCode: emp2.employeeId,
          targetAssignmentId: assignmentsCreated[3]._id, // emp2 EVENING on Tue
          reason: 'Family event attendance exchange',
          status: 'PENDING_TARGET_ACCEPTANCE'
        });
        await ssr.save();
        console.log(`[Seed Shift] Created sample ShiftSwapRequest: ${ssr.swapId}`);
      }
    }

    console.log('✓ MODULE 14 SHIFT MANAGEMENT SEEDING COMPLETED SUCCESSFULLY!');
    if (isDirect) process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Module 14 shifts:', error);
    if (require.main === module) process.exit(1);
    throw error;
  }
};

if (require.main === module) {
  seedShiftData();
}

module.exports = seedShiftData;
