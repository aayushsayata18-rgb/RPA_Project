/**
 * Seed Script: Module 16 Payroll Support Demo Data
 * Creates demo payroll period PAY-2026-10, salary structures, assignments,
 * inputs for EMP00125, EMP00126, EMP00127, one warning, one exception, and sample payslip.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollInput = require('../models/PayrollInput');
const SalaryStructure = require('../models/SalaryStructure');
const EmployeeSalaryAssignment = require('../models/EmployeeSalaryAssignment');
const OvertimeRecord = require('../models/OvertimeRecord');
const PayrollResult = require('../models/PayrollResult');
const Payslip = require('../models/Payslip');
const PayrollQuery = require('../models/PayrollQuery');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveType = require('../models/LeaveType');

const seedModule16 = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('[Seed Module 16] Connected to database');

    // 1. Ensure Departments exist
    const adminDept = await Department.findOneAndUpdate(
      { departmentId: 'DEP-ADMIN' },
      { departmentId: 'DEP-ADMIN', name: 'Administration', code: 'ADM', isActive: true },
      { upsert: true, new: true }
    );
    const hrDept = await Department.findOneAndUpdate(
      { departmentId: 'DEP-HR' },
      { departmentId: 'DEP-HR', name: 'Human Resources', code: 'HR', isActive: true },
      { upsert: true, new: true }
    );
    const pharmDept = await Department.findOneAndUpdate(
      { departmentId: 'DEP-PHARM' },
      { departmentId: 'DEP-PHARM', name: 'Pharmacy', code: 'PHARM', isActive: true },
      { upsert: true, new: true }
    );

    // 2. Ensure Employees exist (Section 89)
    const emp125 = await Employee.findOneAndUpdate(
      { employeeId: 'EMP00125' },
      {
        $set: {
          employeeId: 'EMP00125',
          firstName: 'Rahul',
          lastName: 'Shah',
          email: 'rahul.shah@hospital.com',
          designation: 'Administrative Executive',
          departmentName: 'Administration',
          status: 'ACTIVE',
          departmentAssignments: [{ departmentId: adminDept._id, isPrimary: true, status: 'ACTIVE' }]
        }
      },
      { upsert: true, new: true }
    );

    const emp126 = await Employee.findOneAndUpdate(
      { employeeId: 'EMP00126' },
      {
        $set: {
          employeeId: 'EMP00126',
          firstName: 'Priya',
          lastName: 'Mehta',
          email: 'priya.mehta@hospital.com',
          designation: 'HR Coordinator',
          departmentName: 'Human Resources',
          status: 'ACTIVE',
          departmentAssignments: [{ departmentId: hrDept._id, isPrimary: true, status: 'ACTIVE' }]
        }
      },
      { upsert: true, new: true }
    );

    const emp127 = await Employee.findOneAndUpdate(
      { employeeId: 'EMP00127' },
      {
        $set: {
          employeeId: 'EMP00127',
          firstName: 'Arjun',
          lastName: 'Patel',
          email: 'arjun.patel@hospital.com',
          designation: 'Clinical Pharmacist',
          departmentName: 'Pharmacy',
          status: 'ACTIVE',
          departmentAssignments: [{ departmentId: pharmDept._id, isPrimary: true, status: 'ACTIVE' }]
        }
      },
      { upsert: true, new: true }
    );

    console.log('[Seed Module 16] Ensured demo employees EMP00125, EMP00126, EMP00127');

    // 3. Salary Structures
    const salStruct = await SalaryStructure.findOneAndUpdate(
      { code: 'SAL-EXEC-001' },
      {
        code: 'SAL-EXEC-001',
        name: 'Administrative Executive Structure',
        description: 'Standard salary structure for executive and clinical staff',
        version: 1,
        components: [
          { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', calculationType: 'FIXED', defaultValue: 3500 },
          { code: 'HRA', name: 'Housing Allowance', type: 'EARNING', calculationType: 'PERCENTAGE', percentageValue: 20, defaultValue: 700 },
          { code: 'TRANSPORT', name: 'Transport Allowance', type: 'EARNING', calculationType: 'FIXED', defaultValue: 250 },
          { code: 'PF', name: 'Provident Fund', type: 'DEDUCTION', calculationType: 'PERCENTAGE', percentageValue: 5, defaultValue: 175 }
        ],
        effectiveFrom: new Date('2026-01-01'),
        status: 'ACTIVE',
        createdBy: 'HR_DIRECTOR',
        approvedBy: 'HOSPITAL_CEO',
        approvedAt: new Date('2026-01-01')
      },
      { upsert: true, new: true }
    );

    // 4. Employee Salary Assignments
    // EMP00125: Assigned valid salary structure
    await EmployeeSalaryAssignment.findOneAndUpdate(
      { assignmentId: 'SA-2026-00125' },
      {
        assignmentId: 'SA-2026-00125',
        employeeId: emp125._id,
        employeeIdCode: 'EMP00125',
        salaryStructureId: salStruct._id,
        salaryStructureCode: salStruct.code,
        version: 1,
        currency: 'USD',
        baseAmount: 4000,
        components: [
          { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', amount: 4000 },
          { code: 'HRA', name: 'Housing Allowance', type: 'EARNING', amount: 800 },
          { code: 'TRANSPORT', name: 'Transport Allowance', type: 'EARNING', amount: 250 },
          { code: 'PF', name: 'Provident Fund', type: 'DEDUCTION', amount: 200 }
        ],
        effectiveFrom: new Date('2026-01-01'),
        status: 'ACTIVE',
        changeReason: 'Initial Assignment',
        requestedBy: 'HR_MANAGER',
        approvedBy: 'FINANCE_HEAD',
        approvedAt: new Date('2026-01-01')
      },
      { upsert: true, new: true }
    );

    // EMP00127: Assigned valid salary structure
    await EmployeeSalaryAssignment.findOneAndUpdate(
      { assignmentId: 'SA-2026-00127' },
      {
        assignmentId: 'SA-2026-00127',
        employeeId: emp127._id,
        employeeIdCode: 'EMP00127',
        salaryStructureId: salStruct._id,
        salaryStructureCode: salStruct.code,
        version: 1,
        currency: 'USD',
        baseAmount: 4500,
        components: [
          { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', amount: 4500 },
          { code: 'HRA', name: 'Housing Allowance', type: 'EARNING', amount: 900 },
          { code: 'PF', name: 'Provident Fund', type: 'DEDUCTION', amount: 225 }
        ],
        effectiveFrom: new Date('2026-01-01'),
        status: 'ACTIVE',
        changeReason: 'Initial Assignment',
        requestedBy: 'HR_MANAGER',
        approvedBy: 'FINANCE_HEAD',
        approvedAt: new Date('2026-01-01')
      },
      { upsert: true, new: true }
    );

    // NOTE: EMP00126 intentionally left WITHOUT salary assignment to demonstrate Exception EXC-PAY-00027 (Section 89, 91)!

    // 5. Overtime Records for EMP00125 (Section 90)
    await OvertimeRecord.findOneAndUpdate(
      { overtimeId: 'OT-2026-00125' },
      {
        overtimeId: 'OT-2026-00125',
        employeeId: emp125._id,
        employeeIdCode: 'EMP00125',
        date: new Date('2026-10-18'),
        candidateMinutes: 480, // 8 hours
        requestedMinutes: 480,
        approvedMinutes: 360,  // 6 hours approved (Candidate != Approved)
        reason: 'Weekend emergency triage coverage',
        status: 'APPROVED',
        requestedBy: 'EMP00125',
        approvedBy: 'HR_SUPERVISOR',
        approvedAt: new Date('2026-10-19')
      },
      { upsert: true, new: true }
    );

    // 6. Demo Payroll Period PAY-2026-10 (Section 89)
    const period = await PayrollPeriod.findOneAndUpdate(
      { periodCode: 'PAY-2026-10' },
      {
        periodCode: 'PAY-2026-10',
        name: 'October 2026 Monthly Payroll',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-31'),
        frequency: 'MONTHLY',
        status: 'OPEN',
        cutoffDate: new Date('2026-10-28'),
        attendanceCutoffDate: new Date('2026-10-27'),
        leaveCutoffDate: new Date('2026-10-27'),
        createdBy: 'HR_DIRECTOR'
      },
      { upsert: true, new: true }
    );

    // 7. Inputs for EMP00125 (Valid)
    await PayrollInput.findOneAndUpdate(
      { inputId: 'PINP-2026-00125' },
      {
        inputId: 'PINP-2026-00125',
        payrollPeriodId: period._id,
        periodCode: period.periodCode,
        employeeId: emp125._id,
        employeeIdCode: 'EMP00125',
        version: 1,
        employeeSnapshot: {
          employeeCode: 'EMP00125',
          employeeName: 'Rahul Shah',
          departmentName: 'Administration',
          designation: 'Administrative Executive',
          employmentType: 'FULL_TIME',
          salaryStructureReference: 'SAL-EXEC-001'
        },
        attendanceSummary: {
          scheduledDays: 26,
          workedDays: 24,
          absentDays: 0,
          lateDays: 2,
          lateMinutes: 35,
          workedMinutes: 11520,
          earlyDepartures: 0
        },
        leaveSummary: {
          paidLeaveDays: 2,
          unpaidLeaveDays: 0,
          otherLeaveDays: 0
        },
        overtime: {
          candidateMinutes: 480,
          approvedMinutes: 360 // 6 hours approved
        },
        allowances: [
          { code: 'HRA', name: 'Housing Allowance', amount: 800, type: 'SALARY_COMPONENT' },
          { code: 'TRANSPORT', name: 'Transport Allowance', amount: 250, type: 'SALARY_COMPONENT' }
        ],
        deductions: [
          { code: 'PF', name: 'Provident Fund', amount: 200, type: 'SALARY_DEDUCTION' }
        ],
        status: 'REVIEWED',
        validationStatus: { isValid: true, errors: [] },
        calculatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 8. Input for EMP00126 (Exception: Missing Salary Assignment - Section 91)
    await PayrollInput.findOneAndUpdate(
      { inputId: 'PINP-2026-00126' },
      {
        inputId: 'PINP-2026-00126',
        payrollPeriodId: period._id,
        periodCode: period.periodCode,
        employeeId: emp126._id,
        employeeIdCode: 'EMP00126',
        version: 1,
        employeeSnapshot: {
          employeeCode: 'EMP00126',
          employeeName: 'Priya Mehta',
          departmentName: 'Human Resources',
          designation: 'HR Coordinator',
          employmentType: 'FULL_TIME',
          salaryStructureReference: null
        },
        attendanceSummary: {
          scheduledDays: 26,
          workedDays: 25,
          absentDays: 1,
          lateDays: 0,
          lateMinutes: 0,
          workedMinutes: 12000,
          earlyDepartures: 0
        },
        leaveSummary: {
          paidLeaveDays: 0,
          unpaidLeaveDays: 1,
          otherLeaveDays: 0
        },
        overtime: { candidateMinutes: 0, approvedMinutes: 0 },
        allowances: [],
        deductions: [],
        status: 'EXCEPTION',
        validationStatus: {
          isValid: false,
          errors: [
            {
              code: 'MISSING_SALARY_ASSIGNMENT',
              message: 'No active salary assignment found for EMP00126 in payroll period PAY-2026-10',
              severity: 'ERROR'
            }
          ]
        },
        calculatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 9. Input for EMP00127 (Warning: Unpaid Leave Detected)
    await PayrollInput.findOneAndUpdate(
      { inputId: 'PINP-2026-00127' },
      {
        inputId: 'PINP-2026-00127',
        payrollPeriodId: period._id,
        periodCode: period.periodCode,
        employeeId: emp127._id,
        employeeIdCode: 'EMP00127',
        version: 1,
        employeeSnapshot: {
          employeeCode: 'EMP00127',
          employeeName: 'Arjun Patel',
          departmentName: 'Pharmacy',
          designation: 'Clinical Pharmacist',
          employmentType: 'FULL_TIME',
          salaryStructureReference: 'SAL-EXEC-001'
        },
        attendanceSummary: {
          scheduledDays: 26,
          workedDays: 23,
          absentDays: 1,
          lateDays: 1,
          lateMinutes: 15,
          workedMinutes: 11040,
          earlyDepartures: 0
        },
        leaveSummary: {
          paidLeaveDays: 1,
          unpaidLeaveDays: 2,
          otherLeaveDays: 0
        },
        overtime: { candidateMinutes: 120, approvedMinutes: 120 },
        allowances: [
          { code: 'HRA', name: 'Housing Allowance', amount: 900, type: 'SALARY_COMPONENT' }
        ],
        deductions: [
          { code: 'PF', name: 'Provident Fund', amount: 225, type: 'SALARY_DEDUCTION' }
        ],
        status: 'CALCULATED',
        validationStatus: {
          isValid: true,
          errors: [
            {
              code: 'UNPAID_LEAVE_DETECTED',
              message: '2 unpaid leave day(s) present in period. Prorated salary adjustment applied.',
              severity: 'INFO'
            }
          ]
        },
        calculatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 10. Sample Payslip for EMP00125 (Previous finalized period e.g. PAY-2026-09)
    await Payslip.findOneAndUpdate(
      { payslipNumber: 'PSL-202609-00125' },
      {
        payslipNumber: 'PSL-202609-00125',
        payrollPeriodId: period._id,
        periodCode: 'PAY-2026-09',
        payrollResultId: new mongoose.Types.ObjectId(),
        employeeId: emp125._id,
        employeeIdCode: 'EMP00125',
        employeeName: 'Rahul Shah',
        departmentName: 'Administration',
        designation: 'Administrative Executive',
        bankDetailsMasked: {
          bankName: 'Hospital Trust Bank',
          accountNumberMasked: '••••••••8821'
        },
        documentId: 'DOC-PSL-202609-00125',
        grossAmount: 5194.23,
        deductionAmount: 200,
        netAmount: 4994.23,
        currency: 'USD',
        attendanceSummary: {
          scheduledDays: 26,
          workedDays: 24,
          absentDays: 0,
          paidLeaveDays: 2,
          unpaidLeaveDays: 0,
          overtimeMinutes: 360
        },
        earningsBreakdown: [
          { code: 'BASIC', name: 'Basic Salary', amount: 4000 },
          { code: 'HRA', name: 'Housing Allowance', amount: 800 },
          { code: 'TRANSPORT', name: 'Transport Allowance', amount: 250 },
          { code: 'OVERTIME', name: 'Approved Overtime (6.0 hrs)', amount: 144.23 }
        ],
        deductionsBreakdown: [
          { code: 'PF', name: 'Provident Fund', amount: 200 }
        ],
        status: 'PUBLISHED',
        generatedAt: new Date('2026-09-30'),
        publishedAt: new Date('2026-10-01')
      },
      { upsert: true, new: true }
    );

    // 11. Sample Payroll Query
    await PayrollQuery.findOneAndUpdate(
      { queryId: 'PQ-2026-00001' },
      {
        queryId: 'PQ-2026-00001',
        employeeId: emp125._id,
        employeeIdCode: 'EMP00125',
        employeeName: 'Rahul Shah',
        payrollPeriodId: period._id,
        periodCode: period.periodCode,
        category: 'OVERTIME_DISCREPANCY',
        subject: 'Approved overtime missing',
        description: '6 hours of approved weekend overtime are not visible in my preliminary draft calculation.',
        status: 'OPEN',
        priority: 'MEDIUM'
      },
      { upsert: true, new: true }
    );

    console.log('[Seed Module 16] Successfully seeded Demo Payroll Period, Inputs, Warning, Exception, and Payslip!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Module 16] Error during seeding:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedModule16();
}

module.exports = seedModule16;
