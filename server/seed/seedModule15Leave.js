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

const seedLeaveModule = async () => {
  try {
    console.log('[Seed Module 15]: Starting Leave Management seed...');

    const currentYear = new Date().getFullYear();

    // 1. Seed Leave Types
    const leaveTypesData = [
      {
        leaveTypeId: 'LT-1001',
        code: 'CASUAL',
        name: 'Casual Leave',
        description: 'Short-duration personal and incidental leave',
        unit: 'DAYS',
        allowHalfDay: true,
        allowPartialDay: false,
        requiresDocument: false,
        minimumNoticeHours: 12,
        maximumContinuousDays: 3,
        balanceTracked: true,
        carryForwardAllowed: false,
        approvalRequired: true,
        status: 'ACTIVE',
        isPaid: true,
        colorCode: '#38bdf8'
      },
      {
        leaveTypeId: 'LT-1002',
        code: 'SICK',
        name: 'Sick Leave',
        description: 'Medical and recuperation leave',
        unit: 'DAYS',
        allowHalfDay: true,
        allowPartialDay: false,
        requiresDocument: true,
        documentRequiredAfterDays: 2,
        minimumNoticeHours: 0,
        maximumContinuousDays: 14,
        balanceTracked: true,
        carryForwardAllowed: true,
        approvalRequired: true,
        status: 'ACTIVE',
        isPaid: true,
        colorCode: '#f87171'
      },
      {
        leaveTypeId: 'LT-1003',
        code: 'ANNUAL',
        name: 'Annual / Earned Leave',
        description: 'Statutory vacation and planned annual leave',
        unit: 'DAYS',
        allowHalfDay: false,
        allowPartialDay: false,
        requiresDocument: false,
        minimumNoticeHours: 48,
        maximumContinuousDays: 21,
        balanceTracked: true,
        carryForwardAllowed: true,
        approvalRequired: true,
        status: 'ACTIVE',
        isPaid: true,
        colorCode: '#4ade80'
      },
      {
        leaveTypeId: 'LT-1004',
        code: 'MATERNITY',
        name: 'Maternity Leave',
        description: 'Maternity leave for eligible female staff',
        unit: 'DAYS',
        allowHalfDay: false,
        allowPartialDay: false,
        requiresDocument: true,
        documentRequiredAfterDays: 1,
        minimumNoticeHours: 168,
        maximumContinuousDays: 180,
        balanceTracked: true,
        carryForwardAllowed: false,
        approvalRequired: true,
        status: 'ACTIVE',
        isPaid: true,
        colorCode: '#c084fc'
      },
      {
        leaveTypeId: 'LT-1005',
        code: 'UNPAID',
        name: 'Leave Without Pay (LWP)',
        description: 'Authorized absence without salary compensation',
        unit: 'DAYS',
        allowHalfDay: true,
        allowPartialDay: true,
        requiresDocument: false,
        minimumNoticeHours: 24,
        maximumContinuousDays: 60,
        balanceTracked: false,
        carryForwardAllowed: false,
        approvalRequired: true,
        status: 'ACTIVE',
        isPaid: false,
        colorCode: '#94a3b8'
      }
    ];

    const typeMap = {};
    for (const lt of leaveTypesData) {
      const saved = await LeaveType.findOneAndUpdate(
        { code: lt.code },
        { $set: lt },
        { upsert: true, new: true }
      );
      typeMap[lt.code] = saved;
    }
    console.log(`  ✓ Seeded ${Object.keys(typeMap).length} standard Leave Types.`);

    // 2. Seed Versioned Policies
    const policiesData = [
      {
        policyId: 'LP-1001',
        policyCode: 'POL-CASUAL',
        version: 1,
        name: 'Hospital General Casual Leave Policy',
        description: '12 days annual entitlement for all active staff',
        leaveTypeId: typeMap['CASUAL']._id,
        leaveTypeCode: 'CASUAL',
        employeeType: 'ALL',
        annualEntitlement: 12,
        accrualMethod: 'YEARLY',
        accrualRate: 12,
        carryForwardAllowed: false,
        carryForwardLimit: 0,
        maximumBalance: 12,
        minimumNoticeHours: 12,
        maximumContinuousDays: 3,
        negativeBalanceAllowed: false,
        halfDayAllowed: true,
        partialDayAllowed: false,
        documentationRequiredAfterDays: 0,
        status: 'ACTIVE'
      },
      {
        policyId: 'LP-1002',
        policyCode: 'POL-SICK',
        version: 1,
        name: 'Hospital Medical & Sick Leave Policy',
        description: '10 days medical leave with medical certificate after 2 days',
        leaveTypeId: typeMap['SICK']._id,
        leaveTypeCode: 'SICK',
        employeeType: 'ALL',
        annualEntitlement: 10,
        accrualMethod: 'YEARLY',
        accrualRate: 10,
        carryForwardAllowed: true,
        carryForwardLimit: 5,
        maximumBalance: 20,
        minimumNoticeHours: 0,
        maximumContinuousDays: 14,
        negativeBalanceAllowed: false,
        halfDayAllowed: true,
        partialDayAllowed: false,
        documentationRequiredAfterDays: 2,
        status: 'ACTIVE'
      },
      {
        policyId: 'LP-1003',
        policyCode: 'POL-ANNUAL',
        version: 1,
        name: 'Hospital Earned Vacation Leave Policy',
        description: '18 days annual vacation accrued at 1.5 days/month',
        leaveTypeId: typeMap['ANNUAL']._id,
        leaveTypeCode: 'ANNUAL',
        employeeType: 'ALL',
        annualEntitlement: 18,
        accrualMethod: 'MONTHLY',
        accrualRate: 1.5,
        carryForwardAllowed: true,
        carryForwardLimit: 5,
        maximumBalance: 30,
        minimumNoticeHours: 48,
        maximumContinuousDays: 21,
        negativeBalanceAllowed: false,
        halfDayAllowed: false,
        partialDayAllowed: false,
        documentationRequiredAfterDays: 0,
        status: 'ACTIVE'
      }
    ];

    for (const pol of policiesData) {
      await LeavePolicy.findOneAndUpdate(
        { policyCode: pol.policyCode, version: pol.version },
        { $set: pol },
        { upsert: true }
      );
    }
    console.log(`  ✓ Seeded ${policiesData.length} versioned Leave Policies.`);

    // 3. Seed Holiday Calendar
    const holidaysData = [
      {
        holidayId: `HOL-${currentYear}-0001`,
        name: "Republic Day",
        date: new Date(currentYear, 0, 26),
        holidayName: "Republic Day",
        holidayType: "PUBLIC",
        year: currentYear,
        isAllDepartments: true,
        status: "ACTIVE"
      },
      {
        holidayId: `HOL-${currentYear}-0002`,
        name: "Independence Day",
        date: new Date(currentYear, 7, 15),
        holidayName: "Independence Day",
        holidayType: "PUBLIC",
        year: currentYear,
        isAllDepartments: true,
        status: "ACTIVE"
      },
      {
        holidayId: `HOL-${currentYear}-0003`,
        name: "Mahatma Gandhi Jayanti",
        date: new Date(currentYear, 9, 2),
        holidayName: "Mahatma Gandhi Jayanti",
        holidayType: "PUBLIC",
        year: currentYear,
        isAllDepartments: true,
        status: "ACTIVE"
      },
      {
        holidayId: `HOL-${currentYear}-0004`,
        name: "Diwali Festival",
        date: new Date(currentYear, 10, 1),
        holidayName: "Deepavali",
        holidayType: "PUBLIC",
        year: currentYear,
        isAllDepartments: true,
        status: "ACTIVE"
      }
    ];

    for (const hol of holidaysData) {
      await HolidayCalendar.findOneAndUpdate(
        { holidayId: hol.holidayId },
        { $set: hol },
        { upsert: true }
      );
    }
    console.log(`  ✓ Seeded ${holidaysData.length} official Holiday Calendar entries.`);

    // 4. Ensure Demo Employee (Rahul Shah EMP00125 from Spec Section 88)
    const deptAdmin = await Department.findOne({ departmentId: 'DEP-ADMIN' }) ||
      await Department.create({
        departmentId: 'DEP-ADMIN',
        name: 'Hospital Administration',
        code: 'ADMIN',
        isActive: true
      });

    const empDemo = await Employee.findOneAndUpdate(
      { employeeId: 'EMP00125' },
      {
        $set: {
          employeeId: 'EMP00125',
          firstName: 'Rahul',
          lastName: 'Shah',
          status: 'ACTIVE',
          email: 'rahul.shah@hospital.com',
          designation: 'Senior Administrator',
          departmentName: 'Hospital Administration',
          departmentAssignments: [{ departmentId: deptAdmin._id, status: 'ACTIVE', isPrimary: true }]
        }
      },
      { upsert: true, new: true }
    );

    // Seed balances for demo employee
    const balanceAnnual = await LeaveBalance.findOneAndUpdate(
      { employeeId: empDemo._id, leaveTypeId: typeMap['ANNUAL']._id, year: currentYear },
      {
        $set: {
          balanceId: `BAL-${empDemo.employeeId}-ANNUAL`,
          employeeId: empDemo._id,
          employeeCode: empDemo.employeeId,
          leaveTypeId: typeMap['ANNUAL']._id,
          leaveTypeCode: 'ANNUAL',
          year: currentYear,
          openingBalance: 10,
          accrued: 3,
          carriedForward: 0,
          used: 3,
          pending: 0,
          adjusted: 0,
          available: 10,
          closingBalance: 10,
          lastCalculatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    const balanceCasual = await LeaveBalance.findOneAndUpdate(
      { employeeId: empDemo._id, leaveTypeId: typeMap['CASUAL']._id, year: currentYear },
      {
        $set: {
          balanceId: `BAL-${empDemo.employeeId}-CASUAL`,
          employeeId: empDemo._id,
          employeeCode: empDemo.employeeId,
          leaveTypeId: typeMap['CASUAL']._id,
          leaveTypeCode: 'CASUAL',
          year: currentYear,
          openingBalance: 12,
          accrued: 0,
          carriedForward: 0,
          used: 2,
          pending: 0,
          adjusted: 0,
          available: 10,
          closingBalance: 10,
          lastCalculatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    // Initial Ledger transactions
    await LeaveBalanceTransaction.findOneAndUpdate(
      { employeeId: empDemo._id, leaveTypeId: typeMap['ANNUAL']._id, year: currentYear, transactionType: 'OPENING_BALANCE' },
      {
        $set: {
          transactionId: `TXN-${empDemo.employeeId}-ANNUAL-001`,
          employeeId: empDemo._id,
          employeeCode: empDemo.employeeId,
          leaveTypeId: typeMap['ANNUAL']._id,
          leaveTypeCode: 'ANNUAL',
          year: currentYear,
          transactionType: 'OPENING_BALANCE',
          amount: 10,
          balanceBefore: 0,
          balanceAfter: 10,
          reason: 'Annual Vacation Entitlement',
          createdBy: 'SEED'
        }
      },
      { upsert: true }
    );

    // Seed Sample Approved Leave Request
    const startDate = new Date(currentYear, 9, 10);
    const endDate = new Date(currentYear, 9, 12);
    await LeaveRequest.findOneAndUpdate(
      { requestNumber: 'LR-2026-00125' },
      {
        $set: {
          requestNumber: 'LR-2026-00125',
          employeeId: empDemo._id,
          employeeCode: empDemo.employeeId,
          employeeName: `${empDemo.firstName} ${empDemo.lastName}`,
          departmentId: deptAdmin._id,
          departmentName: deptAdmin.name,
          leaveTypeId: typeMap['ANNUAL']._id,
          leaveTypeCode: 'ANNUAL',
          leaveTypeName: 'Annual / Earned Leave',
          startDate,
          endDate,
          duration: 3,
          unit: 'DAYS',
          dayType: 'FULL_DAY',
          reason: 'Family annual function and planned vacation',
          status: 'APPROVED',
          submittedAt: new Date(currentYear, 9, 1),
          approvedBy: 'USR-HR-201',
          approvedAt: new Date(currentYear, 9, 2),
          approvalNotes: 'Approved as per annual entitlement.',
          shiftReconciled: true,
          attendanceReconciled: true
        }
      },
      { upsert: true }
    );

    // Seed Sample Pending Leave Request
    await LeaveRequest.findOneAndUpdate(
      { requestNumber: 'LR-2026-00126' },
      {
        $set: {
          requestNumber: 'LR-2026-00126',
          employeeId: empDemo._id,
          employeeCode: empDemo.employeeId,
          employeeName: `${empDemo.firstName} ${empDemo.lastName}`,
          departmentId: deptAdmin._id,
          departmentName: deptAdmin.name,
          leaveTypeId: typeMap['CASUAL']._id,
          leaveTypeCode: 'CASUAL',
          leaveTypeName: 'Casual Leave',
          startDate: new Date(currentYear, 10, 5),
          endDate: new Date(currentYear, 10, 5),
          duration: 1,
          unit: 'DAYS',
          dayType: 'FULL_DAY',
          reason: 'Personal administrative appointment',
          status: 'PENDING',
          submittedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log('  ✓ Seeded demo Leave Requests and employee balances for Rahul Shah (EMP00125).');
    console.log('[Seed Module 15]: Leave Management Seed Completed Successfully.\n');
  } catch (error) {
    console.error('[Seed Module 15 Error]:', error.message);
    throw error;
  }
};

module.exports = seedLeaveModule;

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db')
    .then(async () => {
      await seedLeaveModule();
      await mongoose.disconnect();
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
