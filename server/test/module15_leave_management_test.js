require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const LeaveType = require('../models/LeaveType');
const LeavePolicy = require('../models/LeavePolicy');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveBalanceTransaction = require('../models/LeaveBalanceTransaction');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveCancellationRequest = require('../models/LeaveCancellationRequest');
const HolidayCalendar = require('../models/HolidayCalendar');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Shift = require('../models/Shift');
const ShiftAssignment = require('../models/ShiftAssignment');
const Attendance = require('../models/Attendance');

const LeaveService = require('../services/leaveService');
const LeaveValidationService = require('../services/leaveValidationService');
const LeaveBalanceService = require('../services/leaveBalanceService');
const LeaveApprovalService = require('../services/leaveApprovalService');
const LeaveAccrualService = require('../services/leaveAccrualService');
const LeaveReconciliationService = require('../services/leaveReconciliationService');
const LeaveReportService = require('../services/leaveReportService');
const ShiftValidationService = require('../services/shiftValidationService');
const AttendanceReconciliationService = require('../services/attendanceReconciliationService');
const IdGeneratorService = require('../services/IdGeneratorService');

const runModule15Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 15 LEAVE MANAGEMENT TEST SUITE ---');
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

    const userHr = { userId: 'USR-HR-LEAVE-01', role: 'HR_MANAGER', name: 'HR Leave Admin' };
    const userSupervisor = { userId: 'USR-SUP-LEAVE-01', employeeId: 'EMP_MGR_001', role: 'SUPERVISOR', name: 'Department Head' };
    const userEmployee = { userId: 'USR-EMP-LEAVE-01', employeeId: 'EMP_LM_001', role: 'EMPLOYEE', name: 'Rohan Sharma' };

    // Setup Test Department & Employees
    const testDept = await Department.findOneAndUpdate(
      { departmentId: 'DEP-TEST-LEAVE' },
      { departmentId: 'DEP-TEST-LEAVE', name: 'Leave Testing Ward', code: 'LTW', isActive: true },
      { upsert: true, new: true }
    );

    const empA = await Employee.findOneAndUpdate(
      { employeeId: 'EMP_LM_001' },
      {
        $set: {
          employeeId: 'EMP_LM_001',
          firstName: 'Rohan',
          lastName: 'Sharma',
          status: 'ACTIVE',
          email: 'rohan.lm@hospital.com',
          designation: 'Staff Nurse',
          departmentName: 'Leave Testing Ward',
          departmentAssignments: [{ departmentId: testDept._id, status: 'ACTIVE', isPrimary: true }]
        }
      },
      { upsert: true, new: true }
    );

    const empB = await Employee.findOneAndUpdate(
      { employeeId: 'EMP_LM_002' },
      {
        $set: {
          employeeId: 'EMP_LM_002',
          firstName: 'Pooja',
          lastName: 'Patel',
          status: 'ACTIVE',
          email: 'pooja.lm@hospital.com',
          designation: 'Resident Doctor',
          departmentName: 'Leave Testing Ward',
          departmentAssignments: [{ departmentId: testDept._id, status: 'ACTIVE', isPrimary: true }]
        }
      },
      { upsert: true, new: true }
    );

    const empTerminated = await Employee.findOneAndUpdate(
      { employeeId: 'EMP_LM_999' },
      {
        $set: {
          employeeId: 'EMP_LM_999',
          firstName: 'Devendra',
          lastName: 'Kumar',
          status: 'TERMINATED',
          email: 'dev.term@hospital.com',
          designation: 'Ex-Staff',
          departmentName: 'Leave Testing Ward'
        }
      },
      { upsert: true, new: true }
    );

    // Clean up test records for idempotency
    await LeaveRequest.deleteMany({ employeeCode: { $in: ['EMP_LM_001', 'EMP_LM_002'] } });
    await LeaveBalance.deleteMany({ employeeCode: { $in: ['EMP_LM_001', 'EMP_LM_002'] } });
    await LeaveBalanceTransaction.deleteMany({ employeeCode: { $in: ['EMP_LM_001', 'EMP_LM_002'] } });
    await LeaveCancellationRequest.deleteMany({ employeeCode: { $in: ['EMP_LM_001', 'EMP_LM_002'] } });
    await Attendance.deleteMany({ employeeId: { $in: [empA._id, empB._id] } });

    // ==========================================
    // TEST 1: ID Generation
    // ==========================================
    console.log('\n--- TEST 1: ID Generators ---');
    const reqId = await IdGeneratorService.generateLeaveRequestId();
    const typeId = await IdGeneratorService.generateLeaveTypeId();
    const polId = await IdGeneratorService.generateLeavePolicyId();
    const balId = await IdGeneratorService.generateLeaveBalanceId();
    const txnId = await IdGeneratorService.generateLeaveTransactionId();
    const canId = await IdGeneratorService.generateLeaveCancellationId();
    const holId = await IdGeneratorService.generateHolidayId();

    assertTest('Leave Request ID starts with LR-YYYY-', reqId.startsWith(`LR-${new Date().getFullYear()}-`));
    assertTest('Leave Type ID starts with LT-', typeId.startsWith('LT-'));
    assertTest('Leave Policy ID starts with LP-', polId.startsWith('LP-'));
    assertTest('Leave Balance ID starts with BAL-', balId.startsWith('BAL-'));
    assertTest('Leave Transaction ID starts with TXN-', txnId.startsWith('TXN-'));
    assertTest('Leave Cancellation ID starts with LCR-YYYY-', canId.startsWith(`LCR-${new Date().getFullYear()}-`));
    assertTest('Holiday ID starts with HOL-YYYY-', holId.startsWith(`HOL-${new Date().getFullYear()}-`));

    // ==========================================
    // TEST 2: Leave Type Creation & Retrieval
    // ==========================================
    console.log('\n--- TEST 2: Leave Type Configuration ---');
    const typeCode = `TEST_CAS_${Date.now().toString().slice(-4)}`;
    const createdType = await LeaveService.createLeaveType(
      {
        code: typeCode,
        name: 'Test Casual Leave',
        unit: 'DAYS',
        allowHalfDay: true,
        allowPartialDay: false,
        requiresDocument: false,
        balanceTracked: true,
        carryForwardAllowed: false,
        status: 'ACTIVE'
      },
      userHr
    );

    assertTest('Leave Type successfully created with code', createdType.code === typeCode);
    assertTest('Leave Type status is ACTIVE', createdType.status === 'ACTIVE');
    assertTest('Leave Type allowHalfDay is true', createdType.allowHalfDay === true);

    // ==========================================
    // TEST 3: Policy Creation & Policy Versioning (Sec 12 & 13)
    // ==========================================
    console.log('\n--- TEST 3: Policy Creation & Immutable Versioning ---');
    const policyCode = `POL_${typeCode}`;
    const policyV1 = await LeaveService.createLeavePolicy(
      {
        policyCode,
        name: 'Casual Policy V1',
        leaveTypeId: createdType._id,
        annualEntitlement: 14,
        accrualMethod: 'MONTHLY',
        accrualRate: 1.16,
        status: 'ACTIVE'
      },
      userHr
    );

    assertTest('Policy V1 created with version 1', policyV1.version === 1);
    assertTest('Policy V1 annual entitlement is 14', policyV1.annualEntitlement === 14);

    // Update policy to V2 (Must not mutate V1)
    const policyV2 = await LeaveService.updateLeavePolicy(
      policyV1._id,
      {
        annualEntitlement: 16,
        name: 'Casual Policy V2'
      },
      userHr
    );

    assertTest('Policy V2 created with version 2', policyV2.version === 2);
    assertTest('Policy V2 annual entitlement is 16', policyV2.annualEntitlement === 16);

    const oldV1 = await LeavePolicy.findById(policyV1._id);
    assertTest('Historical Policy V1 preserved with status SUPERSEDED', oldV1.status === 'SUPERSEDED');
    assertTest('Historical Policy V1 retains original entitlement of 14', oldV1.annualEntitlement === 14);

    // ==========================================
    // TEST 4: Balance Ledger & Calculation Formula (Sec 14, 15, 16)
    // ==========================================
    console.log('\n--- TEST 4: Balance Calculation & Financial-Style Ledger ---');
    const curYear = new Date().getFullYear();
    const balance = await LeaveBalanceService.getOrCreateBalance({
      employeeId: empA._id,
      leaveTypeId: createdType._id,
      year: curYear
    });

    assertTest('Initial balance created with opening entitlement', balance.openingBalance === 16);
    assertTest('Initial available equals opening balance', balance.available === 16);

    // Check that opening balance transaction was recorded
    const openingTxn = await LeaveBalanceTransaction.findOne({
      employeeId: empA._id,
      leaveTypeId: createdType._id,
      transactionType: 'OPENING_BALANCE'
    });
    assertTest('Opening ledger transaction recorded', !!openingTxn);
    assertTest('Ledger transaction recorded correct amount', openingTxn.amount === 16);

    // ==========================================
    // TEST 5: Leave Request Validation & Duration Calculation (Sec 19, 20, 22, 29)
    // ==========================================
    console.log('\n--- TEST 5: Leave Request Validation & Rules Engine ---');

    // Terminated employee validation failure
    const termVal = await LeaveValidationService.validateLeaveRequest({
      employeeId: empTerminated._id,
      leaveTypeId: createdType._id,
      startDate: new Date(curYear, 10, 10),
      endDate: new Date(curYear, 10, 12),
      reason: 'Terminated employee request'
    });
    assertTest('Terminated employee cannot request leave', !termVal.isValid);

    // Half-Day duration test (Sec 20)
    const halfDayDuration = await LeaveValidationService.calculateDuration({
      startDate: new Date(curYear, 10, 10),
      endDate: new Date(curYear, 10, 10),
      dayType: 'FIRST_HALF'
    });
    assertTest('Half-day calculation evaluates to exactly 0.5', halfDayDuration === 0.5);

    // Multi-day calculation with Holiday deduction (Sec 22, 49)
    const holDate = new Date(curYear, 10, 11);
    await HolidayCalendar.create({
      holidayId: await IdGeneratorService.generateHolidayId(),
      name: 'Test Hospital Holiday',
      holidayName: 'Test Hospital Holiday',
      date: holDate,
      year: curYear,
      isAllDepartments: true,
      status: 'ACTIVE'
    });

    const fullSpanDuration = await LeaveValidationService.calculateDuration({
      startDate: new Date(curYear, 10, 10),
      endDate: new Date(curYear, 10, 12), // 3 calendar days, 1 holiday => 2 leave days
      dayType: 'FULL_DAY',
      excludeHolidays: true
    });
    assertTest('Duration calculation deducts official holiday', fullSpanDuration === 2);

    // ==========================================
    // TEST 6: Leave Request Submission & Pending Balance Reservation (Sec 17, 33)
    // ==========================================
    console.log('\n--- TEST 6: Leave Submission & Pending Balance Reservation ---');
    const startLeave = new Date(curYear, 10, 15);
    const endLeave = new Date(curYear, 10, 16);

    const submitRes = await LeaveService.createLeaveRequest(
      {
        employeeId: empA._id,
        leaveTypeId: createdType._id,
        startDate: startLeave,
        endDate: endLeave,
        dayType: 'FULL_DAY',
        reason: 'Personal family occasion',
        documents: []
      },
      userEmployee
    );

    const createdReq = submitRes.request;
    assertTest('Leave request created with status PENDING', createdReq.status === 'PENDING');
    assertTest('Leave request has unique requestNumber', createdReq.requestNumber.startsWith(`LR-${curYear}-`));

    // Balance reservation check
    const reservedBal = await LeaveBalance.findById(balance._id);
    assertTest('Pending days reserved on balance', reservedBal.pending === createdReq.duration);
    assertTest('Available balance reduced by pending reservation', reservedBal.available === (16 - createdReq.duration));

    // ==========================================
    // TEST 7: Overlapping Leave Detection (Sec 23 & 24)
    // ==========================================
    console.log('\n--- TEST 7: Overlap & Conflict Prevention ---');
    const overlapVal = await LeaveValidationService.validateLeaveRequest({
      employeeId: empA._id,
      leaveTypeId: createdType._id,
      startDate: new Date(curYear, 10, 16), // Overlaps with 15-16
      endDate: new Date(curYear, 10, 18),
      reason: 'Overlapping request test'
    });
    assertTest('Overlapping leave request correctly flagged as invalid', !overlapVal.isValid);
    assertTest('Error message identifies leave overlap', overlapVal.errors.some(e => e.includes('overlap') || e.includes('already has')));

    // ==========================================
    // TEST 8: Self-Approval Prevention Rule (Sec 35)
    // ==========================================
    console.log('\n--- TEST 8: Requester Self-Approval Prevention ---');
    let selfApprovalBlocked = false;
    try {
      await LeaveApprovalService.approveLeaveRequest({
        requestId: createdReq._id,
        notes: 'Trying to self approve',
        actorUser: { userId: 'USR-EMP-LEAVE-01', employeeId: empA.employeeId, role: 'EMPLOYEE' }
      });
    } catch (err) {
      if (err.message.includes('Self-approval violation') || err.message.includes('own leave')) {
        selfApprovalBlocked = true;
      }
    }
    assertTest('Requester self-approval strictly blocked by backend rule', selfApprovalBlocked);

    // ==========================================
    // TEST 9: Leave Approval Lifecycle & Ledger Consumption (Sec 37)
    // ==========================================
    console.log('\n--- TEST 9: Leave Approval & Ledger Consumption ---');
    const approvedReq = await LeaveApprovalService.approveLeaveRequest({
      requestId: createdReq._id,
      notes: 'Approved by department supervisor',
      actorUser: userSupervisor
    });

    assertTest('Leave request status transitioned to APPROVED', approvedReq.status === 'APPROVED');
    assertTest('Approver details recorded', approvedReq.approvedBy === userSupervisor.userId);

    const postApprovalBal = await LeaveBalance.findById(balance._id);
    assertTest('Pending balance released', postApprovalBal.pending === 0);
    assertTest('Used balance incremented by duration', postApprovalBal.used === createdReq.duration);
    assertTest('Available balance updated accurately', postApprovalBal.available === (16 - createdReq.duration));

    const usedTxn = await LeaveBalanceTransaction.findOne({
      employeeId: empA._id,
      leaveTypeId: createdType._id,
      transactionType: 'LEAVE_USED',
      referenceId: createdReq.requestNumber
    });
    assertTest('LEAVE_USED financial ledger transaction recorded', !!usedTxn);
    assertTest('Ledger amount is negative consumption', usedTxn.amount === -createdReq.duration);

    // ==========================================
    // TEST 10: Double Approval Protection (Sec 75 & 76)
    // ==========================================
    console.log('\n--- TEST 10: Double Approval Concurrency Guard ---');
    let doubleApprovalBlocked = false;
    try {
      await LeaveApprovalService.approveLeaveRequest({
        requestId: createdReq._id,
        notes: 'Trying duplicate approval',
        actorUser: userSupervisor
      });
    } catch (err) {
      if (err.message.includes('already been processed') || err.message.includes('Cannot approve')) {
        doubleApprovalBlocked = true;
      }
    }
    assertTest('Double approval blocked without duplicating balance consumption', doubleApprovalBlocked);

    // ==========================================
    // TEST 11: Shift Management Integration (Sec 25, 79)
    // ==========================================
    console.log('\n--- TEST 11: Shift Management Integration ---');
    const testShift = await Shift.findOneAndUpdate(
      { shiftCode: 'GEN_LEAVE_TEST' },
      {
        shiftId: 'SHF-TEST-LV',
        shiftCode: 'GEN_LEAVE_TEST',
        shiftName: 'General Leave Test Shift',
        startTime: '09:00',
        endTime: '17:00',
        status: 'ACTIVE'
      },
      { upsert: true, new: true }
    );

    // Attempting to assign shift on approved leave date must trigger LEAVE_CONFLICT
    const shiftValOnLeave = await ShiftValidationService.validateAssignment({
      employeeId: empA._id,
      shiftId: testShift._id,
      assignmentDate: startLeave // Date employee is on approved leave
    });

    assertTest('Shift assignment on approved leave date triggers conflict', !shiftValOnLeave.isValid);
    assertTest('Conflict type is LEAVE_CONFLICT', shiftValOnLeave.conflicts.some(c => c.conflictType === 'LEAVE_CONFLICT'));

    // ==========================================
    // TEST 12: Attendance Management Reconciliation (Sec 27, 80)
    // ==========================================
    console.log('\n--- TEST 12: Attendance Management Reconciliation ---');
    // Case A: Absent on approved leave without punch => Reconciled to ON_LEAVE
    const reconResult = await AttendanceReconciliationService.runReconciliation({
      date: startLeave
    });

    const attRecord = await Attendance.findOne({
      employeeId: empA._id,
      attendanceDate: startLeave
    });

    assertTest('Attendance auto-reconciled to ON_LEAVE for approved leave date', attRecord?.status === 'ON_LEAVE');
    assertTest('Reconciliation status is MATCHED', attRecord?.reconciliationStatus === 'MATCHED');

    // Case B: Physical punch detected on approved full leave => LEAVE_ATTENDANCE_CONFLICT
    attRecord.checkIn = { timestamp: new Date(startLeave.setHours(9, 5)), deviceId: 'BIO-FRONT-01' };
    await attRecord.save();

    await AttendanceReconciliationService.runReconciliation({ date: startLeave });
    const conflictedAtt = await Attendance.findById(attRecord._id);
    assertTest('Punch during approved leave triggers LEAVE_CONFLICT reconciliation', conflictedAtt.reconciliationStatus === 'LEAVE_CONFLICT');

    // ==========================================
    // TEST 13: Approved Leave Cancellation Workflow & Balance Reversal (Sec 40, 41, 42)
    // ==========================================
    console.log('\n--- TEST 13: Approved Leave Cancellation & Balance Reversal ---');
    const cancelReq = await LeaveService.requestCancellation(
      {
        requestId: createdReq._id,
        reason: 'Personal event was postponed, returning to active roster'
      },
      userEmployee
    );

    assertTest('Cancellation request generated with status PENDING', cancelReq.status === 'PENDING');
    assertTest('LeaveRequest status updated to CANCEL_REQUESTED', (await LeaveRequest.findById(createdReq._id)).status === 'CANCEL_REQUESTED');

    // HR approves cancellation
    const cancelResult = await LeaveApprovalService.approveCancellation({
      cancellationId: cancelReq.cancellationId,
      reviewerComments: 'Approved cancellation and restored leave ledger.',
      actorUser: userHr
    });

    assertTest('Cancellation status transitioned to APPROVED', cancelResult.cancellationRequest.status === 'APPROVED');
    assertTest('LeaveRequest status transitioned to CANCELLED', cancelResult.leaveRequest.status === 'CANCELLED');

    const reversedBal = await LeaveBalance.findById(balance._id);
    assertTest('Used balance reversed back to 0', reversedBal.used === 0);
    assertTest('Available balance restored to full amount (16)', reversedBal.available === 16);

    const cancelTxn = await LeaveBalanceTransaction.findOne({
      employeeId: empA._id,
      leaveTypeId: createdType._id,
      transactionType: 'LEAVE_CANCELLED'
    });
    assertTest('LEAVE_CANCELLED reversal transaction created in ledger', !!cancelTxn);
    assertTest('Reversal transaction amount matches restored duration', cancelTxn.amount === createdReq.duration);

    // ==========================================
    // TEST 14: Rejection & Withdrawal Workflow (Sec 38, 39)
    // ==========================================
    console.log('\n--- TEST 14: Leave Rejection & Employee Withdrawal ---');
    const reqToWithdraw = (await LeaveService.createLeaveRequest(
      {
        employeeId: empA._id,
        leaveTypeId: createdType._id,
        startDate: new Date(curYear, 11, 1),
        endDate: new Date(curYear, 11, 2),
        reason: 'Temporary test request'
      },
      userEmployee
    )).request;

    const withdrawn = await LeaveApprovalService.withdrawLeaveRequest({
      requestId: reqToWithdraw._id,
      actorUser: userEmployee
    });
    assertTest('Employee successfully withdrew pending request', withdrawn.status === 'WITHDRAWN');

    const reqToReject = (await LeaveService.createLeaveRequest(
      {
        employeeId: empA._id,
        leaveTypeId: createdType._id,
        startDate: new Date(curYear, 11, 10),
        endDate: new Date(curYear, 11, 11),
        reason: 'Unacceptable notice period request'
      },
      userEmployee
    )).request;

    const rejected = await LeaveApprovalService.rejectLeaveRequest({
      requestId: reqToReject._id,
      reason: 'Operational ward staffing shortage on these dates',
      actorUser: userSupervisor
    });
    assertTest('Supervisor successfully rejected leave request', rejected.status === 'REJECTED');
    assertTest('Rejection reason recorded', rejected.rejectionReason.includes('staffing shortage'));

    // ==========================================
    // TEST 15: Authorized HR Balance Adjustment (Sec 43, 44)
    // ==========================================
    console.log('\n--- TEST 15: Authorized HR Manual Balance Adjustment ---');
    const adjResult = await LeaveBalanceService.adjustBalance({
      employeeId: empA._id,
      leaveTypeId: createdType._id,
      adjustmentAmount: 2.5,
      reason: 'HR Special Discretionary Credit',
      year: curYear,
      actorUser: userHr
    });

    assertTest('Adjusted balance incremented by 2.5', adjResult.balance.adjusted === 2.5);
    assertTest('Adjusted available balance updated to 18.5', adjResult.balance.available === 18.5);
    assertTest('Ledger records ADJUSTMENT transaction with reason', adjResult.transaction.transactionType === 'ADJUSTMENT');

    // ==========================================
    // TEST 16: Automated Accrual Engine & Idempotency (Sec 45, 46)
    // ==========================================
    console.log('\n--- TEST 16: Accrual Engine Execution & Idempotency ---');
    const accrual1 = await LeaveAccrualService.runAccrualJob({
      month: 11,
      year: curYear,
      frequency: 'MONTHLY',
      actorUser: userHr
    });
    assertTest('Accrual job processed active employees', accrual1.processedEmployees > 0);
    assertTest('Accrual count applied successfully', accrual1.accrualCount > 0);

    // Re-run same period (must be idempotent - skippedCount increases, accrualCount 0)
    const accrual2 = await LeaveAccrualService.runAccrualJob({
      month: 11,
      year: curYear,
      frequency: 'MONTHLY',
      actorUser: userHr
    });
    assertTest('Accrual is idempotent: duplicate period run accrues 0 records', accrual2.accrualCount === 0);
    assertTest('Duplicate period skips already processed records', accrual2.skippedCount > 0);

    // ==========================================
    // TEST 17: RPA External Leave Batch Import & Exceptions (Sec 62, 65, 94)
    // ==========================================
    console.log('\n--- TEST 17: RPA Leave Import, Idempotency & Exceptions ---');
    const rpaRecords = [
      {
        employeeId: empB.employeeId,
        leaveTypeCode: typeCode,
        startDate: new Date(curYear, 11, 20),
        endDate: new Date(curYear, 11, 21),
        reason: 'RPA Imported Leave'
      },
      {
        employeeId: 'NON_EXISTENT_EMP_99999', // Unknown employee exception
        leaveTypeCode: typeCode,
        startDate: new Date(curYear, 11, 20),
        endDate: new Date(curYear, 11, 21),
        reason: 'Should create exception'
      }
    ];

    const rpaImportRes = await LeaveService.rpaImportExternalLeave({
      records: rpaRecords,
      correlationId: `RPA-TEST-${Date.now()}`
    });

    assertTest('RPA batch processed both records', rpaImportRes.recordsProcessed === 2);
    assertTest('RPA batch successfully imported valid record', rpaImportRes.recordsSucceeded === 1);
    assertTest('RPA batch flagged invalid employee record as failure', rpaImportRes.recordsFailed === 1);
    assertTest('RPA batch generated ExceptionCase for unknown employee', rpaImportRes.errors.some(e => e.error.includes('Unknown Employee')));

    // Re-run same import (Duplicate import idempotency test)
    const rpaDuplicateRes = await LeaveService.rpaImportExternalLeave({
      records: [rpaRecords[0]],
      correlationId: `RPA-DUP-${Date.now()}`
    });
    assertTest('RPA duplicate import safely handled with 0 duplicate requests created', rpaDuplicateRes.importedRequests.length === 0);

    // ==========================================
    // TEST 18: RPA External HR Sync & Read-Back (Sec 63, 66)
    // ==========================================
    console.log('\n--- TEST 18: RPA External Synchronization Contract ---');
    const rpaSyncRes = await LeaveService.rpaSyncApprovedLeave({
      dateRange: {
        startDate: new Date(curYear, 0, 1),
        endDate: new Date(curYear, 11, 31)
      }
    });

    assertTest('RPA Sync contract returns success', rpaSyncRes.success === true);
    assertTest('RPA Sync contract includes jobType LEAVE_SYNC', rpaSyncRes.jobType === 'LEAVE_SYNC');
    assertTest('RPA Sync contract includes correlationId', !!rpaSyncRes.correlationId);

    // ==========================================
    // TEST 19: Reports & Export Capabilities (Sec 82, 83)
    // ==========================================
    console.log('\n--- TEST 19: Reporting & Export Engine ---');
    const summaryReport = await LeaveReportService.getLeaveSummary({ year: curYear });
    assertTest('Leave summary report returns records', summaryReport.length > 0);

    const deptReport = await LeaveReportService.getDepartmentLeaveReport();
    assertTest('Department leave report returns data', deptReport.length > 0);

    const utilReport = await LeaveReportService.getUtilizationReport({ year: curYear });
    assertTest('Utilization report returns leave type statistics', utilReport.length > 0);

    const csvData = LeaveReportService.convertToCSV(summaryReport);
    assertTest('CSV conversion generates valid formatted lines', csvData.includes('employeeCode') && csvData.includes('\n'));

    console.log('\n==========================================================');
    console.log(`--- MODULE 15 TEST SUITE COMPLETED: ALL ${passedCount} TESTS PASSED! ---`);
    console.log('==========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ MODULE 15 TEST SUITE FAILED:', error);
    process.exit(1);
  }
};

runModule15Tests();
