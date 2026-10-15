require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Shift = require('../models/Shift');
const ShiftAssignment = require('../models/ShiftAssignment');
const Roster = require('../models/Roster');
const RosterVersion = require('../models/RosterVersion');
const ShiftChangeRequest = require('../models/ShiftChangeRequest');
const ShiftSwapRequest = require('../models/ShiftSwapRequest');
const ShiftConflict = require('../models/ShiftConflict');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');

const ShiftService = require('../services/shiftService');
const RosterService = require('../services/rosterService');
const AssignmentService = require('../services/assignmentService');
const ShiftValidationService = require('../services/shiftValidationService');
const ShiftRequestService = require('../services/shiftRequestService');
const CoverageService = require('../services/coverageService');
const ShiftReportService = require('../services/shiftReportService');
const AttendanceService = require('../services/attendanceService');

const runModule14Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 14 SHIFT MANAGEMENT TEST SUITE ---');
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

    const userHr = { userId: 'USR-HR-201', role: 'HR_MANAGER', name: 'HR Manager Tester' };
    const userSupervisor = { userId: 'USR-SUP-301', role: 'SUPERVISOR', name: 'Department Supervisor' };

    // Setup Test Department & Employees
    const testDept = await Department.findOneAndUpdate(
      { departmentId: 'DEP-TEST-SHIFT' },
      { departmentId: 'DEP-TEST-SHIFT', name: 'Shift Testing Ward', code: 'STW', isActive: true },
      { upsert: true, new: true }
    );

    const empActiveA = await Employee.findOneAndUpdate(
      { employeeId: 'EMP_SM_001' },
      {
        $set: {
          employeeId: 'EMP_SM_001',
          firstName: 'Vikram',
          lastName: 'Mehta',
          status: 'ACTIVE',
          email: 'vikram.shift@hospital.com',
          designation: 'Senior Staff',
          departmentName: 'Shift Testing Ward',
          departmentAssignments: [{ departmentId: testDept._id, status: 'ACTIVE', isPrimary: true }]
        }
      },
      { upsert: true, new: true }
    );

    const empActiveB = await Employee.findOneAndUpdate(
      { employeeId: 'EMP_SM_002' },
      {
        $set: {
          employeeId: 'EMP_SM_002',
          firstName: 'Anjali',
          lastName: 'Deshmukh',
          status: 'ACTIVE',
          email: 'anjali.shift@hospital.com',
          designation: 'Staff Nurse',
          departmentName: 'Shift Testing Ward',
          departmentAssignments: [{ departmentId: testDept._id, status: 'ACTIVE', isPrimary: true }]
        }
      },
      { upsert: true, new: true }
    );

    const empTerminated = await Employee.findOneAndUpdate(
      { employeeId: 'EMP_SM_999' },
      {
        $set: {
          employeeId: 'EMP_SM_999',
          firstName: 'Tarun',
          lastName: 'Verma',
          status: 'TERMINATED',
          email: 'tarun.term@hospital.com',
          designation: 'Former Staff',
          departmentName: 'Shift Testing Ward'
        }
      },
      { upsert: true, new: true }
    );

    const empOnLeave = await Employee.findOneAndUpdate(
      { employeeId: 'EMP_SM_003' },
      {
        $set: {
          employeeId: 'EMP_SM_003',
          firstName: 'Kavita',
          lastName: 'Nair',
          status: 'ON_LEAVE',
          email: 'kavita.leave@hospital.com',
          designation: 'Nurse',
          departmentName: 'Shift Testing Ward'
        }
      },
      { upsert: true, new: true }
    );

    // Clean up previous test artifacts
    await Shift.deleteMany({ shiftCode: /^TEST_/ });
    await ShiftAssignment.deleteMany({ employeeIdCode: /^EMP_SM_/ });
    await Roster.deleteMany({ rosterName: /^TEST_ROSTER/ });
    await ShiftChangeRequest.deleteMany({ employeeIdCode: /^EMP_SM_/ });
    await ShiftSwapRequest.deleteMany({ requesterEmployeeCode: /^EMP_SM_/ });
    await ShiftConflict.deleteMany({ employeeIdCode: /^EMP_SM_/ });
    await Attendance.deleteMany({ employeeIdCode: /^EMP_SM_/ });
    const AttendanceEvent = require('../models/AttendanceEvent');
    await AttendanceEvent.deleteMany({ employeeIdCode: /^EMP_SM_/ });

    // ----------------------------------------------------
    // TEST 1: Create Standard Shift Definitions & Timing
    // ----------------------------------------------------
    console.log('\n--- 1. Shift Definitions & Timing Rules ---');
    const shiftMorning = await ShiftService.createShift({
      shiftCode: 'TEST_MORNING',
      shiftName: 'Test Morning Shift',
      shiftType: 'MORNING',
      startTime: '08:00',
      endTime: '17:00',
      crossesMidnight: false,
      breakMinutes: 60,
      departmentIds: [testDept._id]
    }, userHr);

    assertTest('Created morning shift definition successfully', shiftMorning.shiftCode === 'TEST_MORNING');
    assertTest('Shift ID assigned properly', shiftMorning.shiftId.startsWith('SHF'));

    // ----------------------------------------------------
    // TEST 2: Cross-Midnight Shift Window Calculations
    // ----------------------------------------------------
    console.log('\n--- 2. Cross-Midnight Shift Support ---');
    const shiftNight = await ShiftService.createShift({
      shiftCode: 'TEST_NIGHT',
      shiftName: 'Test Overnight Shift',
      shiftType: 'NIGHT',
      startTime: '22:00',
      endTime: '06:00',
      crossesMidnight: true,
      breakMinutes: 45
    }, userHr);

    assertTest('Created night shift definition with crossesMidnight true', shiftNight.crossesMidnight === true);

    const window = ShiftService.calculateShiftWindow(shiftNight, '2026-11-05');
    assertTest('Window start date matches 2026-11-05 at 22:00', window.startDateTime.getDate() === 5 && window.startDateTime.getHours() === 22);
    assertTest('Window end date moves forward to next day 2026-11-06 at 06:00', window.endDateTime.getDate() === 6 && window.endDateTime.getHours() === 6);
    assertTest('Duration correctly calculated as 8 hours (480 mins)', window.durationMinutes === 480);
    assertTest('Net working minutes accounts for break (435 mins)', window.netWorkingMinutes === 435);

    // ----------------------------------------------------
    // TEST 3: Duplicate Shift Code Prevention
    // ----------------------------------------------------
    console.log('\n--- 3. Validation: Unique Shift Codes ---');
    let duplicateErrorThrown = false;
    try {
      await ShiftService.createShift({
        shiftCode: 'TEST_MORNING',
        shiftName: 'Duplicate Morning Shift',
        startTime: '08:00',
        endTime: '17:00'
      }, userHr);
    } catch (e) {
      duplicateErrorThrown = true;
    }
    assertTest('Duplicate shiftCode creation rejected', duplicateErrorThrown === true);

    // ----------------------------------------------------
    // TEST 4: Terminated & Inactive Employee Validation
    // ----------------------------------------------------
    console.log('\n--- 4. Employee Status Validation ---');
    const valTerminated = await ShiftValidationService.validateAssignment({
      employeeId: empTerminated.employeeId,
      shiftId: shiftMorning._id,
      assignmentDate: '2026-11-05'
    });
    assertTest('Terminated employee assignment rejected', valTerminated.isValid === false);
    assertTest('Flagged INACTIVE_EMPLOYEE conflict', valTerminated.conflicts.some(c => c.conflictType === 'INACTIVE_EMPLOYEE'));

    // ----------------------------------------------------
    // TEST 5: Leave Conflict Detection
    // ----------------------------------------------------
    console.log('\n--- 5. Leave Conflict Detection ---');
    const valLeave = await ShiftValidationService.validateAssignment({
      employeeId: empOnLeave.employeeId,
      shiftId: shiftMorning._id,
      assignmentDate: '2026-11-05'
    });
    assertTest('Employee on leave rejected', valLeave.isValid === false);
    assertTest('Flagged LEAVE_CONFLICT conflict', valLeave.conflicts.some(c => c.conflictType === 'LEAVE_CONFLICT'));

    // ----------------------------------------------------
    // TEST 6: Roster Creation & Assignment
    // ----------------------------------------------------
    console.log('\n--- 6. Roster Creation & Shift Assignments ---');
    const roster = await RosterService.createRoster({
      rosterName: 'TEST_ROSTER_NOV_WEEK1',
      departmentId: testDept._id.toString(),
      periodStart: '2026-11-02',
      periodEnd: '2026-11-08',
      user: userSupervisor
    });
    assertTest('Roster created in DRAFT status', roster.status === 'DRAFT');
    assertTest('Roster ID generated', roster.rosterId.startsWith('RST'));

    const assignment1 = await AssignmentService.createAssignment({
      employeeId: empActiveA.employeeId,
      shiftId: shiftMorning._id.toString(),
      assignmentDate: '2026-11-05',
      rosterId: roster._id.toString(),
      user: userSupervisor
    });
    assertTest('Shift assignment created successfully', assignment1.assignmentId.startsWith('ASN'));
    assertTest('Assignment has DRAFT status matching roster', assignment1.status === 'DRAFT');

    // ----------------------------------------------------
    // TEST 7: Duplicate Assignment Detection
    // ----------------------------------------------------
    console.log('\n--- 7. Duplicate Assignment Prevention ---');
    let dupAssignmentError = false;
    try {
      await AssignmentService.createAssignment({
        employeeId: empActiveA.employeeId,
        shiftId: shiftMorning._id.toString(),
        assignmentDate: '2026-11-05',
        rosterId: roster._id.toString()
      });
    } catch (e) {
      dupAssignmentError = true;
    }
    assertTest('Duplicate assignment on same date prevented', dupAssignmentError === true);

    // ----------------------------------------------------
    // TEST 8: Shift Overlap Detection (Cross-window)
    // ----------------------------------------------------
    console.log('\n--- 8. Shift Overlap Detection ---');
    // Shift overlap: employee has 08:00 - 17:00, attempting to assign overlapping shift 16:00 - 20:00
    const shiftOverlapping = await ShiftService.createShift({
      shiftCode: 'TEST_OVERLAP',
      shiftName: 'Overlapping Evening Shift',
      startTime: '16:00',
      endTime: '20:00'
    }, userHr);

    let overlapError = false;
    try {
      await AssignmentService.createAssignment({
        employeeId: empActiveA.employeeId,
        shiftId: shiftOverlapping._id.toString(),
        assignmentDate: '2026-11-05',
        rosterId: roster._id.toString()
      });
    } catch (e) {
      overlapError = true;
    }
    assertTest('Overlapping shift window correctly blocked', overlapError === true);

    // ----------------------------------------------------
    // TEST 9: Roster Lifecycle (Submit -> Approve -> Publish)
    // ----------------------------------------------------
    console.log('\n--- 9. Roster Submission, Approval & Versioned Publishing ---');
    // Add second employee assignment
    await AssignmentService.createAssignment({
      employeeId: empActiveB.employeeId,
      shiftId: shiftNight._id.toString(),
      assignmentDate: '2026-11-05',
      rosterId: roster._id.toString(),
      user: userSupervisor
    });

    const submitted = await RosterService.submitRoster(roster._id.toString(), userSupervisor);
    assertTest('Roster transitioned to PENDING_APPROVAL', submitted.status === 'PENDING_APPROVAL');

    const approved = await RosterService.approveRoster(roster._id.toString(), userHr);
    assertTest('Roster transitioned to APPROVED', approved.status === 'APPROVED');

    const publishResult = await RosterService.publishRoster(roster._id.toString(), userHr);
    assertTest('Roster published successfully', publishResult.roster.status === 'PUBLISHED');
    assertTest('RosterVersion snapshot recorded (V1)', publishResult.version.versionNumber === 1);

    const refetchedAssign1 = await ShiftAssignment.findById(assignment1._id);
    assertTest('Assignments updated to PUBLISHED status', refetchedAssign1.status === 'PUBLISHED');

    // ----------------------------------------------------
    // TEST 10: Published Assignment Versioning Protection
    // ----------------------------------------------------
    console.log('\n--- 10. Published Assignment Modification Protection ---');
    // When modifying an assignment on a published roster, old assignment is cancelled and versioned
    const updatedAssign = await AssignmentService.updateAssignment(
      assignment1._id.toString(),
      { shiftId: shiftNight._id.toString(), notes: 'Emergency reassignment to night shift' },
      userHr
    );
    assertTest('New versioned assignment created with incremented version', updatedAssign.version === 2);
    assertTest('Points to previous assignment ID', updatedAssign.previousAssignmentId.toString() === assignment1._id.toString());

    const oldAssign = await ShiftAssignment.findById(assignment1._id);
    assertTest('Old published assignment preserved as CANCELLED (not deleted)', oldAssign.status === 'CANCELLED');

    const updatedRoster = await Roster.findById(roster._id);
    assertTest('Roster currentVersion incremented to 2', updatedRoster.currentVersion === 2);

    // ----------------------------------------------------
    // TEST 11: Employee Self-Service Schedule Retrieval
    // ----------------------------------------------------
    console.log('\n--- 11. Employee Self-Service Schedule ---');
    const mySchedule = await AssignmentService.getMySchedule(empActiveB.employeeId);
    assertTest('Retrieved employee self-schedule', mySchedule.employee.employeeId === empActiveB.employeeId);
    assertTest('Schedule contains assigned shifts', mySchedule.allAssignments.length > 0);

    // ----------------------------------------------------
    // TEST 12: Shift Change Request Workflow
    // ----------------------------------------------------
    console.log('\n--- 12. Shift Change Request Lifecycle ---');
    // Employee B has night shift on 2026-11-05, requests change to morning shift
    const assignB = await ShiftAssignment.findOne({
      employeeId: empActiveB._id,
      assignmentDate: ShiftValidationService.normalizeDate('2026-11-05'),
      status: 'PUBLISHED'
    });

    const changeReq = await ShiftRequestService.createChangeRequest({
      employeeId: empActiveB.employeeId,
      assignmentId: assignB._id.toString(),
      requestedShiftId: shiftMorning._id.toString(),
      reason: 'Childcare requirement in the evening',
      user: { role: 'EMPLOYEE', employeeId: empActiveB.employeeId }
    });
    assertTest('Shift change request created in PENDING_APPROVAL', changeReq.status === 'PENDING_APPROVAL');

    const approvedChange = await ShiftRequestService.reviewChangeRequest(changeReq.requestId, {
      action: 'APPROVE',
      reviewerComments: 'Approved by Ward Supervisor',
      user: userSupervisor
    });
    assertTest('Shift change approved by supervisor', approvedChange.status === 'APPROVED');

    // ----------------------------------------------------
    // TEST 13: Shift Swap Request Workflow
    // ----------------------------------------------------
    console.log('\n--- 13. Shift Swap Peer-to-Peer Workflow ---');
    // Setup 2 published assignments for swap on 2026-11-06
    const swapAssignA = await AssignmentService.createAssignment({
      employeeId: empActiveA.employeeId,
      shiftId: shiftMorning._id.toString(),
      assignmentDate: '2026-11-06',
      rosterId: roster._id.toString(),
      user: userSupervisor
    });
    const swapAssignB = await AssignmentService.createAssignment({
      employeeId: empActiveB.employeeId,
      shiftId: shiftNight._id.toString(),
      assignmentDate: '2026-11-06',
      rosterId: roster._id.toString(),
      user: userSupervisor
    });

    const swapReq = await ShiftRequestService.createSwapRequest({
      requesterEmployeeId: empActiveA.employeeId,
      requesterAssignmentId: swapAssignA._id.toString(),
      targetEmployeeId: empActiveB.employeeId,
      targetAssignmentId: swapAssignB._id.toString(),
      reason: 'Swap needed for exam schedule',
      user: { role: 'EMPLOYEE', employeeId: empActiveA.employeeId }
    });
    assertTest('Swap created in PENDING_TARGET_ACCEPTANCE', swapReq.status === 'PENDING_TARGET_ACCEPTANCE');

    // Peer accepts
    const peerAccepted = await ShiftRequestService.targetRespondSwap(swapReq.swapId, {
      accept: true,
      comments: 'Sure, I can cover that.'
    });
    assertTest('Peer accepted swap -> now PENDING_APPROVAL', peerAccepted.status === 'PENDING_APPROVAL');

    // Manager approves
    const supervisorApproved = await ShiftRequestService.reviewSwapRequest(swapReq.swapId, {
      action: 'APPROVE',
      reviewerComments: 'Coverage looks good. Approved.',
      user: userSupervisor
    });
    assertTest('Manager approved swap -> status COMPLETED', supervisorApproved.status === 'COMPLETED');

    // ----------------------------------------------------
    // TEST 14: Department Staffing Coverage Evaluation
    // ----------------------------------------------------
    console.log('\n--- 14. Department Staffing Coverage Analytics ---');
    const coverage = await CoverageService.evaluateCoverage({
      departmentId: testDept._id.toString(),
      date: '2026-11-06'
    });
    assertTest('Coverage report evaluated for department', coverage.department.departmentId === testDept.departmentId);
    assertTest('Contains shift staffing gaps and status', Array.isArray(coverage.coverage) && coverage.coverage.length > 0);

    // ----------------------------------------------------
    // TEST 15: Shift Reporting & CSV Generation
    // ----------------------------------------------------
    console.log('\n--- 15. Shift Reports & CSV Export ---');
    const scheduleReport = await ShiftReportService.getEmployeeScheduleReport({
      departmentId: testDept._id.toString(),
      startDate: '2026-11-01',
      endDate: '2026-11-10'
    });
    assertTest('Generated employee schedule report records', scheduleReport.length > 0);

    const csvOutput = ShiftReportService.convertToCsv(scheduleReport);
    assertTest('CSV export contains header and data rows', csvOutput.includes('employeeId,employeeName') || csvOutput.includes('assignmentId'));

    // ----------------------------------------------------
    // TEST 16: RPA Synchronization & Read-Back Verification
    // ----------------------------------------------------
    console.log('\n--- 16. RPA Automation Integration ---');
    const rpaCalendar = await RosterService.getRosterCalendar(roster.rosterId);
    assertTest('RPA calendar read-back returns valid employee grid', rpaCalendar.grid.length >= 2);
    assertTest('Dates array spans the roster period', rpaCalendar.dates.length === 7);

    // ----------------------------------------------------
    // TEST 17: Attendance Ingestion Consumes Published Shift
    // ----------------------------------------------------
    console.log('\n--- 17. Attendance Consumes Published Shift ---');
    // Record punch for empActiveA on 2026-11-06 (empActiveA has shiftNight 22:00 assigned via swap)
    const punchDate = ShiftValidationService.normalizeDate('2026-11-06');
    punchDate.setHours(21, 55, 0, 0);

    const punchIn = await AttendanceService.processPunchEvent({
      employeeIdCode: empActiveA.employeeId,
      eventDateTime: punchDate,
      direction: 'IN',
      source: 'BIOMETRIC',
      sourceEventId: `BIO-SM-TEST-${Date.now()}`
    });
    assertTest('Punch processed successfully', punchIn.success === true);
    assertTest('Attendance record linked to published shiftAssignmentId', punchIn.attendance.shiftAssignmentId !== null);
    assertTest('Attendance shiftDetails populated with published shift timings', punchIn.attendance.shiftDetails.expectedStartTime === '22:00');

    console.log('\n==========================================================');
    console.log(`✓ ALL ${passedCount} MODULE 14 SHIFT MANAGEMENT TESTS PASSED!`);
    console.log('==========================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MODULE 14 TEST FAILURE:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runModule14Tests();
}

module.exports = runModule14Tests;
