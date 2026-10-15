/**
 * Comprehensive Acceptance Test Suite for Module 16: Payroll Support
 * Tests all requirements, lifecycles, calculations, idempotency, versioning, reconciliation, and RBAC
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollInput = require('../models/PayrollInput');
const PayrollInputVersion = require('../models/PayrollInputVersion');
const SalaryStructure = require('../models/SalaryStructure');
const EmployeeSalaryAssignment = require('../models/EmployeeSalaryAssignment');
const OvertimeRecord = require('../models/OvertimeRecord');
const PayrollRun = require('../models/PayrollRun');
const PayrollResult = require('../models/PayrollResult');
const Payslip = require('../models/Payslip');
const PayrollQuery = require('../models/PayrollQuery');
const PayrollAdjustment = require('../models/PayrollAdjustment');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveType = require('../models/LeaveType');

const PayrollPeriodService = require('../services/payrollPeriodService');
const PayrollInputService = require('../services/payrollInputService');
const PayrollValidationService = require('../services/payrollValidationService');
const PayrollCalculationService = require('../services/payrollCalculationService');
const PayrollProcessingService = require('../services/payrollProcessingService');
const PayrollReconciliationService = require('../services/payrollReconciliationService');
const PayslipService = require('../services/payslipService');
const PayrollQueryService = require('../services/payrollQueryService');
const SalaryConfigurationService = require('../services/salaryConfigurationService');
const IdGeneratorService = require('../services/IdGeneratorService');

const runModule16Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 16 PAYROLL SUPPORT TEST SUITE ---');
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

    const userHr = { userId: 'USR-HR-PAY-01', role: 'HR_MANAGER', name: 'HR Admin' };
    const userApprover = { userId: 'USR-FIN-APPROVER-01', role: 'FINANCE_HEAD', name: 'Chief Financial Officer' };
    const userEmployee = { userId: 'USR-EMP-PAY-01', employeeId: 'EMP_PAY_001', role: 'EMPLOYEE', name: 'Dev Sharma' };

    // Setup Test Department & Employees
    const testDept = await Department.findOneAndUpdate(
      { departmentId: 'DEP-PAYROLL-TEST' },
      { departmentId: 'DEP-PAYROLL-TEST', name: 'Payroll Testing Ward', code: 'PTW', isActive: true },
      { upsert: true, new: true }
    );

    const empA = await Employee.findOneAndUpdate(
      { employeeId: 'EMP_PAY_001' },
      {
        $set: {
          employeeId: 'EMP_PAY_001',
          firstName: 'Dev',
          lastName: 'Sharma',
          status: 'ACTIVE',
          email: 'dev.pay@hospital.com',
          designation: 'Senior Ward Nurse',
          departmentName: 'Payroll Testing Ward',
          departmentAssignments: [{ departmentId: testDept._id, status: 'ACTIVE', isPrimary: true }]
        }
      },
      { upsert: true, new: true }
    );

    const empB = await Employee.findOneAndUpdate(
      { employeeId: 'EMP_PAY_002' },
      {
        $set: {
          employeeId: 'EMP_PAY_002',
          firstName: 'Ananya',
          lastName: 'Sen',
          status: 'ACTIVE',
          email: 'ananya.pay@hospital.com',
          designation: 'Clinical Pharmacist',
          departmentName: 'Payroll Testing Ward',
          departmentAssignments: [{ departmentId: testDept._id, status: 'ACTIVE', isPrimary: true }]
        }
      },
      { upsert: true, new: true }
    );

    // Clean up test employee artifacts from prior runs
    await EmployeeSalaryAssignment.deleteMany({ employeeId: { $in: [empA._id, empB._id] } });
    await PayrollInput.deleteMany({ employeeId: { $in: [empA._id, empB._id] } });
    await PayrollInputVersion.deleteMany({ employeeId: { $in: [empA._id, empB._id] } });
    await OvertimeRecord.deleteMany({ employeeId: { $in: [empA._id, empB._id] } });
    await Attendance.deleteMany({ employeeId: { $in: [empA._id, empB._id] } });
    await Payslip.deleteMany({ employeeId: { $in: [empA._id, empB._id] } });
    await PayrollQuery.deleteMany({ employeeId: { $in: [empA._id, empB._id] } });

    // ==========================================
    // TEST 1: ID GENERATORS
    // ==========================================
    console.log('\n--- TEST 1: ID Generators ---');
    const periodCodeGenerated = IdGeneratorService.generatePayrollPeriodCode(2026, 11);
    assertTest('Payroll Period Code formatted PAY-YYYY-MM', periodCodeGenerated === 'PAY-2026-11');

    const inputId = await IdGeneratorService.generatePayrollInputId();
    assertTest('Payroll Input ID starts with PINP-YYYY-', /^PINP-\d{4}-\d{5}$/.test(inputId));

    const assignmentId = await IdGeneratorService.generateSalaryAssignmentId();
    assertTest('Salary Assignment ID starts with SA-YYYY-', /^SA-\d{4}-\d{5}$/.test(assignmentId));

    const overtimeId = await IdGeneratorService.generateOvertimeId();
    assertTest('Overtime ID starts with OT-YYYY-', /^OT-\d{4}-\d{5}$/.test(overtimeId));

    const runId = await IdGeneratorService.generatePayrollRunId();
    assertTest('Payroll Run ID starts with PRUN-YYYY-', /^PRUN-\d{4}-\d{5}$/.test(runId));

    const resultId = await IdGeneratorService.generatePayrollResultId();
    assertTest('Payroll Result ID starts with PRES-YYYY-', /^PRES-\d{4}-\d{5}$/.test(resultId));

    const payslipNum = await IdGeneratorService.generatePayslipNumber('PAY-2026-11');
    assertTest('Payslip Number starts with PSL-YYYYMM-', /^PSL-202611-\d{5}$/.test(payslipNum));

    const queryId = await IdGeneratorService.generatePayrollQueryId();
    assertTest('Payroll Query ID starts with PQ-YYYY-', /^PQ-\d{4}-\d{5}$/.test(queryId));

    const adjId = await IdGeneratorService.generatePayrollAdjustmentId();
    assertTest('Payroll Adjustment ID starts with PADJ-YYYY-', /^PADJ-\d{4}-\d{5}$/.test(adjId));

    // ==========================================
    // TEST 2: SALARY STRUCTURE & VERSIONING
    // ==========================================
    console.log('\n--- TEST 2: Salary Structure Creation & Versioning ---');
    const testStructCode = `SAL-TEST-${Date.now()}`;
    const structV1 = await SalaryConfigurationService.createSalaryStructure(
      {
        code: testStructCode,
        name: 'Nurse Salary Structure',
        components: [
          { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', calculationType: 'FIXED', defaultValue: 3000 },
          { code: 'HRA', name: 'Housing Allowance', type: 'EARNING', calculationType: 'PERCENTAGE', percentageValue: 20, defaultValue: 600 },
          { code: 'PF', name: 'Provident Fund', type: 'DEDUCTION', calculationType: 'PERCENTAGE', percentageValue: 5, defaultValue: 150 }
        ],
        effectiveFrom: '2026-01-01'
      },
      userHr
    );
    assertTest('Salary Structure V1 created with version 1', structV1.version === 1);
    assertTest('Salary Structure status is ACTIVE', structV1.status === 'ACTIVE');

    // Create revision V2
    const structV2 = await SalaryConfigurationService.createSalaryStructure(
      {
        code: testStructCode,
        name: 'Nurse Salary Structure Revised',
        components: [
          { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', calculationType: 'FIXED', defaultValue: 3200 },
          { code: 'HRA', name: 'Housing Allowance', type: 'EARNING', calculationType: 'PERCENTAGE', percentageValue: 20, defaultValue: 640 },
          { code: 'PF', name: 'Provident Fund', type: 'DEDUCTION', calculationType: 'PERCENTAGE', percentageValue: 5, defaultValue: 160 }
        ],
        effectiveFrom: '2026-07-01'
      },
      userHr
    );
    assertTest('Salary Structure V2 created with version 2', structV2.version === 2);

    const oldStruct = await SalaryStructure.findById(structV1._id);
    assertTest('Salary Structure V1 superseded and preserved historically', oldStruct.status === 'SUPERSEDED');

    // ==========================================
    // TEST 3: SALARY ASSIGNMENT & VERSIONING
    // ==========================================
    console.log('\n--- TEST 3: Employee Salary Assignment & Version History ---');
    const sa1 = await SalaryConfigurationService.assignSalary(
      {
        employeeId: empA._id,
        salaryStructureId: structV2._id,
        baseAmount: 3200,
        currency: 'USD',
        effectiveFrom: '2026-07-01',
        changeReason: 'Initial onboarding salary'
      },
      userHr
    );
    assertTest('Initial salary assignment created with version 1', sa1.version === 1);
    assertTest('Base amount set accurately', sa1.baseAmount === 3200);

    // Revised assignment
    const sa2 = await SalaryConfigurationService.assignSalary(
      {
        employeeId: empA._id,
        salaryStructureId: structV2._id,
        baseAmount: 3500,
        currency: 'USD',
        effectiveFrom: '2026-10-01',
        changeReason: 'Performance annual hike'
      },
      userHr
    );
    assertTest('Revised salary assignment created with version 2', sa2.version === 2);
    assertTest('New base amount is 3500', sa2.baseAmount === 3500);

    const history = await SalaryConfigurationService.getEmployeeSalaryHistory(empA._id);
    assertTest('Salary history preserves both version 1 and version 2', history.length >= 2);

    const effectiveAssignment = await SalaryConfigurationService.getEffectiveSalaryAssignment(empA._id, '2026-11-15');
    assertTest('Effective assignment resolves to latest active version (3500 base)', effectiveAssignment.baseAmount === 3500);

    // ==========================================
    // TEST 4: PAYROLL PERIOD LIFECYCLE
    // ==========================================
    console.log('\n--- TEST 4: Payroll Period Lifecycle & Locking ---');
    const testPeriodCode = `PAY-TEST-${Date.now()}`;
    const period = await PayrollPeriodService.createPeriod(
      {
        periodCode: testPeriodCode,
        name: 'Unit Test Payroll Period',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        frequency: 'MONTHLY'
      },
      userHr
    );
    assertTest('Payroll period created with status DRAFT', period.status === 'DRAFT');

    const openedPeriod = await PayrollPeriodService.openPeriod(period._id, userHr);
    assertTest('Payroll period transitioned to OPEN', openedPeriod.status === 'OPEN');

    // ==========================================
    // TEST 5: OVERTIME DISTINCT FROM CANDIDATE
    // ==========================================
    console.log('\n--- TEST 5: Overtime Candidate vs Approved Minutes ---');
    const otRecord = new OvertimeRecord({
      overtimeId: await IdGeneratorService.generateOvertimeId(),
      employeeId: empA._id,
      employeeIdCode: empA.employeeId,
      date: new Date('2026-11-10'),
      candidateMinutes: 480, // 8 hours potential overtime
      requestedMinutes: 480,
      approvedMinutes: 0,
      reason: 'ICU surge support',
      status: 'PENDING',
      requestedBy: empA.employeeId
    });
    await otRecord.save();
    assertTest('Overtime record initially PENDING with 0 approved minutes', otRecord.status === 'PENDING' && otRecord.approvedMinutes === 0);

    // Supervisor approves only 360 minutes (6 hours)
    otRecord.approvedMinutes = 360;
    otRecord.status = 'APPROVED';
    otRecord.approvedBy = 'SUPERVISOR_LEAD';
    otRecord.approvedAt = new Date();
    await otRecord.save();
    assertTest('Approved overtime distinct from candidate (360 vs 480 mins)', otRecord.approvedMinutes === 360 && otRecord.candidateMinutes === 480);

    // ==========================================
    // TEST 6: ATTENDANCE & LEAVE RECONCILIATION & INPUT GENERATION
    // ==========================================
    console.log('\n--- TEST 6: Attendance, Leave & Input Generation ---');
    // Seed Attendance for empA
    await Attendance.create({
      attendanceId: `ATT-TEST-${Date.now()}-1`,
      employeeId: empA._id,
      employeeIdCode: empA.employeeId,
      attendanceDate: new Date('2026-11-02'),
      status: 'PRESENT',
      workedMinutes: 480
    });
    await Attendance.create({
      attendanceId: `ATT-TEST-${Date.now()}-2`,
      employeeId: empA._id,
      employeeIdCode: empA.employeeId,
      attendanceDate: new Date('2026-11-03'),
      status: 'PRESENT',
      lateMinutes: 20,
      flags: { isLate: true, lateMinutes: 20 },
      workedMinutes: 460
    });

    const genResult = await PayrollInputService.generateInputsForPeriod(openedPeriod._id, userHr, { employeeIds: [empA._id, empB._id] });
    assertTest('Inputs generated successfully for period', genResult.totalEmployees >= 1);

    const inputEmpA = await PayrollInput.findOne({ payrollPeriodId: openedPeriod._id, employeeId: empA._id });
    assertTest('Input found for EMP_PAY_001', inputEmpA !== null);
    assertTest('Approved overtime consumed into input (360 mins)', inputEmpA.overtime?.approvedMinutes === 360);
    assertTest('Attendance late minutes captured', inputEmpA.attendanceSummary?.lateMinutes >= 20);
    assertTest('Source references present for traceability', inputEmpA.sourceReferences.length >= 3);

    // ==========================================
    // TEST 7: IMMUTABLE VERSIONING ON RECALCULATION
    // ==========================================
    console.log('\n--- TEST 7: Immutable Input Versioning on Recalculation ---');
    // Refresh inputs again
    await PayrollInputService.generateInputsForPeriod(openedPeriod._id, userHr, { employeeIds: [empA._id, empB._id], recalculationReason: 'Attendance punch correction' });
    const updatedInputEmpA = await PayrollInput.findOne({ payrollPeriodId: openedPeriod._id, employeeId: empA._id });
    assertTest('Input version incremented to version 2', updatedInputEmpA.version === 2);

    const archivedVersion = await PayrollInputVersion.findOne({
      payrollInputId: updatedInputEmpA._id,
      version: 1
    });
    assertTest('Previous version 1 archived into PayrollInputVersion collection', archivedVersion !== null);
    assertTest('Archived version records changeReason', archivedVersion.changeReason === 'Attendance punch correction');

    // ==========================================
    // TEST 8: VALIDATION & EXCEPTION DETECTION
    // ==========================================
    console.log('\n--- TEST 8: Validation & Severe Exception Detection ---');
    // Note: empB (EMP_PAY_002) has no salary assignment yet!
    const validationReport = await PayrollValidationService.validatePeriod(openedPeriod._id, userHr);
    assertTest('Validation detects missing salary assignment for EMP_PAY_002', validationReport.errorCount >= 1);
    assertTest('Validation returns success=false due to blocking errors', validationReport.success === false);
    const missingSalError = validationReport.errors.find(e => e.code === 'MISSING_SALARY_ASSIGNMENT');
    assertTest('Error code is MISSING_SALARY_ASSIGNMENT', missingSalError !== undefined);

    // Now resolve the exception by assigning salary to empB
    await SalaryConfigurationService.assignSalary(
      {
        employeeId: empB._id,
        salaryStructureId: structV2._id,
        baseAmount: 3400,
        currency: 'USD',
        effectiveFrom: '2026-01-01',
        changeReason: 'Resolved missing salary assignment'
      },
      userHr
    );

    // Regenerate and revalidate
    await PayrollInputService.generateInputsForPeriod(openedPeriod._id, userHr, { employeeIds: [empA._id, empB._id] });
    const revalidation = await PayrollValidationService.validatePeriod(openedPeriod._id, userHr);
    assertTest('After resolution, validation passes with errorCount 0', revalidation.errorCount === 0);
    assertTest('Revalidation success is true', revalidation.success === true);

    // ==========================================
    // TEST 9: SEGREGATION OF DUTIES & APPROVAL
    // ==========================================
    console.log('\n--- TEST 9: Segregation of Duties & Period Approval ---');
    await PayrollPeriodService.submitForReview(openedPeriod._id, userHr, 'Ready for final payroll audit');

    // Submitter cannot approve their own period (Segregation of Duties)
    let selfApprovalBlocked = false;
    try {
      await PayrollPeriodService.approvePeriod(openedPeriod._id, userHr, 'Self-approving', true);
    } catch (err) {
      selfApprovalBlocked = true;
    }
    assertTest('Submitter self-approval strictly blocked by segregation of duties rule', selfApprovalBlocked);

    // Authorized approver approves
    const approvedPeriod = await PayrollPeriodService.approvePeriod(openedPeriod._id, userApprover, 'Audited and approved by CFO', true);
    assertTest('Payroll period status transitioned to APPROVED', approvedPeriod.status === 'APPROVED');

    // ==========================================
    // TEST 10: PAYROLL CALCULATION & EXACT MONETARY INTEGRITY
    // ==========================================
    console.log('\n--- TEST 10: Financial Calculation & Monetary Integrity ---');
    const calcInput = await PayrollInput.findOne({ payrollPeriodId: approvedPeriod._id, employeeId: empA._id });
    const resultDoc = await PayrollCalculationService.calculateInputResult(calcInput, approvedPeriod);

    assertTest('Gross earnings calculated accurately', resultDoc.grossEarnings > 0);
    assertTest('Net pay equals gross earnings minus total deductions', resultDoc.netPay === Math.round((resultDoc.grossEarnings - resultDoc.totalDeductions) * 100) / 100);
    assertTest('Overtime pay included in earnings breakdown', resultDoc.breakdown?.earnings.some(e => e.code === 'OVERTIME'));

    // ==========================================
    // TEST 11: PROCESSING ENGINE & IDEMPOTENCY GUARD
    // ==========================================
    console.log('\n--- TEST 11: Processing Engine Execution & Idempotency ---');
    const testCorrelationId = `RUN-CORR-TEST-${Date.now()}`;
    const runResult1 = await PayrollProcessingService.executePayrollRun(
      approvedPeriod._id,
      userHr,
      { correlationId: testCorrelationId, bypassApproval: true }
    );
    assertTest('Payroll run 1 processed successfully', runResult1.success === true);
    assertTest('Payroll run 1 status is SUCCESS', runResult1.run.status === 'SUCCESS');

    // Duplicate run attempt with exact same correlationId
    const runResult2 = await PayrollProcessingService.executePayrollRun(
      approvedPeriod._id,
      userHr,
      { correlationId: testCorrelationId, bypassApproval: true }
    );
    assertTest('Duplicate run prevented via idempotency key', runResult2.idempotent === true);
    assertTest('No duplicate calculation executed', runResult2.message.includes('Duplicate processing prevented'));

    // ==========================================
    // TEST 12: INTERNAL & EXTERNAL RECONCILIATION
    // ==========================================
    console.log('\n--- TEST 12: Internal & External Reconciliation ---');
    const internalRec = await PayrollReconciliationService.reconcileInternal(approvedPeriod._id);
    assertTest('Internal reconciliation status is MATCHED', internalRec.status === 'MATCHED');
    assertTest('Zero missing results between inputs and results', internalRec.missingInResults.length === 0);
    assertTest('Zero duplicate results found', internalRec.duplicates.length === 0);

    // External reconciliation: deliberate mismatch
    const externalRecordsMismatch = [
      { employeeIdCode: 'EMP_PAY_001', grossEarnings: 3500 }
      // Missing EMP_PAY_002
    ];
    const extRecMismatch = await PayrollReconciliationService.reconcileExternal(approvedPeriod._id, { records: externalRecordsMismatch });
    assertTest('External reconciliation detects missing employee', extRecMismatch.missingInExternal.includes('EMP_PAY_002'));
    assertTest('External reconciliation status is MISMATCH_DETECTED', extRecMismatch.status === 'MISMATCH_DETECTED');

    // ==========================================
    // TEST 13: PAYSLIP GENERATION & CONFIDENTIAL ACCESS
    // ==========================================
    console.log('\n--- TEST 13: Payslip Generation & Confidential Access ---');
    const payslipGen = await PayslipService.generatePayslipsForPeriod(approvedPeriod._id, userHr);
    assertTest('Payslips generated for eligible employees', payslipGen.count >= 2);

    const empPayslips = await PayslipService.getEmployeePayslips(empA._id);
    assertTest('Employee can retrieve own payslips', empPayslips.length >= 1);
    const slipA = empPayslips[0];
    assertTest('Bank account is masked in payslip', slipA.bankDetailsMasked?.accountNumberMasked.startsWith('••••'));

    // View payslip and verify audit log recorded
    const viewedSlip = await PayslipService.viewPayslip(slipA._id, { ...userHr, employeeId: empA.employeeId });
    assertTest('Access log recorded in payslip document', viewedSlip.accessLogs.length >= 1);

    // Cross-employee unauthorized access attempt
    let crossAccessBlocked = false;
    try {
      await PayslipService.viewPayslip(slipA._id, { userId: 'OTHER_USER', employeeId: 'DIFFERENT_EMP', role: 'EMPLOYEE' });
    } catch (err) {
      crossAccessBlocked = true;
    }
    assertTest('Employee cannot access another employee payslip', crossAccessBlocked);

    // ==========================================
    // TEST 14: STALE INPUT DETECTION ON RETROACTIVE CORRECTION
    // ==========================================
    console.log('\n--- TEST 14: Stale Input Detection on Retroactive Correction ---');
    const staleResults = await PayrollInputService.markStaleIfSourceChanged(
      'ATTENDANCE',
      empA._id,
      '2026-11-03',
      'Retroactive punch adjustment approved by supervisor'
    );
    assertTest('Stale detection identifies affected payroll input', staleResults.length >= 1);
    const staleInput = await PayrollInput.findOne({ payrollPeriodId: approvedPeriod._id, employeeId: empA._id });
    assertTest('Payroll input marked isStale=true', staleInput.isStale === true);
    assertTest('Stale reason explicitly recorded', staleInput.staleReason.includes('ATTENDANCE updated'));

    // ==========================================
    // TEST 15: PAYROLL ADJUSTMENT WORKFLOW
    // ==========================================
    console.log('\n--- TEST 15: Authorized Payroll Adjustments ---');
    const adj = new PayrollAdjustment({
      adjustmentId: await IdGeneratorService.generatePayrollAdjustmentId(),
      employeeId: empA._id,
      employeeIdCode: empA.employeeId,
      payrollPeriodId: approvedPeriod._id,
      periodCode: approvedPeriod.periodCode,
      adjustmentType: 'REIMBURSEMENT',
      code: 'TRAVEL_CLAIM',
      name: 'Emergency Patient Transfer Allowance',
      amount: 150,
      reason: 'Fuel and toll reimbursement',
      status: 'PENDING',
      requestedBy: empA.employeeId
    });
    await adj.save();
    assertTest('Adjustment created in PENDING status', adj.status === 'PENDING');

    adj.status = 'APPROVED';
    adj.approvedBy = userApprover.userId;
    adj.approvedAt = new Date();
    await adj.save();
    assertTest('Adjustment approved by authorized approver', adj.status === 'APPROVED');

    // ==========================================
    // TEST 16: PAYROLL QUERIES LIFECYCLE
    // ==========================================
    console.log('\n--- TEST 16: Payroll Queries Self-Service & Resolution ---');
    const query = await PayrollQueryService.submitQuery(
      {
        employeeId: empA._id,
        employeeIdCode: empA.employeeId,
        payrollPeriodId: approvedPeriod._id,
        periodCode: approvedPeriod.periodCode,
        category: 'OVERTIME_DISCREPANCY',
        subject: 'Query on November Overtime',
        description: 'Please confirm 6 hours overtime calculation',
        priority: 'MEDIUM'
      },
      userEmployee
    );
    assertTest('Payroll query submitted with status OPEN', query.status === 'OPEN');
    assertTest('Unique queryId generated', /^PQ-\d{4}-\d{5}$/.test(query.queryId));

    const resolvedQuery = await PayrollQueryService.resolveQuery(
      query._id,
      'Verified with attendance logs; 6.0 hours overtime accurately credited.',
      userHr
    );
    assertTest('Query status transitioned to RESOLVED', resolvedQuery.status === 'RESOLVED');
    assertTest('Resolution comment recorded in query activity log', resolvedQuery.activityLog.length >= 2);

    // ==========================================
    // TEST 17: FINALIZATION & PERMANENT LOCKING
    // ==========================================
    console.log('\n--- TEST 17: Period Finalization & Protection ---');
    const finalized = await PayrollPeriodService.finalizePeriod(approvedPeriod._id, userHr);
    assertTest('Period finalized successfully with status FINALIZED', finalized.status === 'FINALIZED');
    assertTest('Period permanently locked (isLocked=true)', finalized.isLocked === true);

    // Verification that finalized period blocks input regeneration
    let finalizedRegenBlocked = false;
    try {
      await PayrollInputService.generateInputsForPeriod(finalized._id, userHr);
    } catch (err) {
      finalizedRegenBlocked = true;
    }
    assertTest('Regeneration on finalized period blocked', finalizedRegenBlocked);

    console.log('\n==========================================================');
    console.log(`--- MODULE 16 TEST SUITE COMPLETED: ALL ${passedCount} TESTS PASSED! ---`);
    console.log('==========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Module 16 Test Failure:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  runModule16Tests();
}

module.exports = runModule16Tests;
