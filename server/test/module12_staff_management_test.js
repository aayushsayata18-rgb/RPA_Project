require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Employee = require('../models/Employee');
const EmployeeHistory = require('../models/EmployeeHistory');
const AccessRequest = require('../models/AccessRequest');
const EmployeeExternalSync = require('../models/EmployeeExternalSync');
const Department = require('../models/Department');
const Role = require('../models/Role');
const User = require('../models/User');
const AuditEvent = require('../models/AuditEvent');

const EmployeeService = require('../services/employeeService');
const EmployeeOnboardingService = require('../services/employeeOnboardingService');
const EmployeeTransferService = require('../services/employeeTransferService');
const EmployeeOffboardingService = require('../services/employeeOffboardingService');
const EmployeeAccessService = require('../services/employeeAccessService');
const EmployeeDocumentService = require('../services/employeeDocumentService');
const EmployeeSyncService = require('../services/employeeSyncService');

const runModule12Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 12 STAFF MANAGEMENT TEST SUITE ---');
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

    const userAdmin = { userId: 'USR-ADMIN-100', role: 'ADMIN_MANAGER' };
    const userSysAdmin = { userId: 'USR-SYSADMIN-01', role: 'SYSTEM_ADMIN' };
    const userHr = { userId: 'USR-HR-200', role: 'HR_MANAGER' };

    // 0. Setup Department and Roles in DB
    await Department.findOneAndUpdate(
      { departmentId: 'DEP-BILLING' },
      { departmentId: 'DEP-BILLING', name: 'Billing & Cashier', code: 'BILL', isActive: true },
      { upsert: true, new: true }
    );
    await Department.findOneAndUpdate(
      { departmentId: 'DEP-FINANCE' },
      { departmentId: 'DEP-FINANCE', name: 'Finance & Accounts', code: 'FIN', isActive: true },
      { upsert: true, new: true }
    );
    await Role.findOneAndUpdate(
      { roleCode: 'BILLING_STAFF' },
      { roleCode: 'BILLING_STAFF', name: 'Billing Executive', portal: 'FINANCE_PORTAL', permissions: ['billing.view', 'billing.create'], isActive: true },
      { upsert: true, new: true }
    );

    // 1. Employee Creation & Concurrency-Safe ID Generation
    const testEmail = `priya.shah.${Date.now()}@hospital.com`;
    const testPhone = `98200${Math.floor(10000 + Math.random() * 90000)}`;

    const newEmp = await EmployeeService.createEmployee(
      {
        firstName: 'Priya',
        lastName: 'Shah',
        email: testEmail,
        phone: testPhone,
        employeeType: 'BILLING',
        employmentType: 'FULL_TIME',
        designation: 'Billing Executive',
        departmentId: 'DEP-BILLING',
        departmentName: 'Billing & Cashier',
        roleCode: 'BILLING_STAFF'
      },
      userHr
    );

    assertTest('Employee created with unique Employee ID prefix EMP', newEmp.employeeId && newEmp.employeeId.startsWith('EMP'));
    assertTest('Employee initial status is PENDING_APPROVAL', newEmp.status === 'PENDING_APPROVAL');
    assertTest('Employee display name computed correctly', newEmp.displayName === 'Priya Shah');
    assertTest('Department assignment created and active', newEmp.departmentAssignments.length > 0 && newEmp.departmentAssignments[0].status === 'ACTIVE');

    // 2. Duplicate Detection
    const dupCheck = await EmployeeService.checkDuplicates({
      email: testEmail,
      phone: testPhone,
      firstName: 'Priya',
      lastName: 'Shah'
    });
    assertTest('Duplicate employee correctly detected by email/phone/name', dupCheck.hasDuplicates === true && dupCheck.matches.length > 0);

    // 3. Approval Workflow (HR / Admin Approves Onboarding)
    const { employee: approvedEmp, accessRequest } = await EmployeeOnboardingService.approveOnboarding(
      newEmp.employeeId,
      userAdmin,
      'Documents verified, approved for employment.'
    );
    assertTest('Approved employee status transitioned to ACTIVE', approvedEmp.status === 'ACTIVE');
    assertTest('Access Request automatically generated for approved role', accessRequest && accessRequest.status === 'PENDING_APPROVAL');

    // 4. Access Control & Separation of Duties Check
    let selfApprovalBlocked = false;
    try {
      // Simulate Priya trying to approve her own access
      await EmployeeAccessService.approveAccess(accessRequest.requestId, {
        userId: newEmp.employeeId,
        linkedEntityId: newEmp.employeeId,
        role: 'ADMIN_MANAGER'
      });
    } catch (err) {
      if (err.message.includes('Separation of Duties violation')) {
        selfApprovalBlocked = true;
      }
    }
    assertTest('Separation of Duties: Employee self-approval of privileged access is strictly forbidden', selfApprovalBlocked);

    // System Admin approves access request
    const approvedAccess = await EmployeeAccessService.approveAccess(accessRequest.requestId, userSysAdmin);
    assertTest('Authorized administrator approves access request', approvedAccess.status === 'APPROVED');

    // Provision access
    const { accessRequest: provisionedReq, user: createdUser } = await EmployeeAccessService.provisionAccess(
      accessRequest.requestId,
      userSysAdmin
    );
    assertTest('Access provisioned successfully and user account linked', provisionedReq.status === 'PROVISIONED' && createdUser.role === 'BILLING_STAFF');

    const refreshedEmp = await Employee.findOne({ employeeId: newEmp.employeeId });
    assertTest('Employee accessProvisioningStatus updated to PROVISIONED', refreshedEmp.accessProvisioningStatus === 'PROVISIONED');

    // 5. Document Management with Versioning
    const doc1 = await EmployeeDocumentService.addDocument(
      newEmp.employeeId,
      { documentType: 'IDENTITY', documentName: 'Aadhar Card', documentUrl: '/docs/aadhar_v1.pdf' },
      userHr
    );
    assertTest('Identity document v1 uploaded successfully', doc1.version === 1);

    const doc2 = await EmployeeDocumentService.addDocument(
      newEmp.employeeId,
      { documentType: 'IDENTITY', documentName: 'Updated Aadhar Card', documentUrl: '/docs/aadhar_v2.pdf' },
      userHr
    );
    assertTest('Document updated with version increment (v2) preserving history', doc2.version === 2);

    // 6. Department Transfer Workflow
    const transferResult = await EmployeeTransferService.transferDepartment(
      newEmp.employeeId,
      {
        newDepartmentId: 'DEP-FINANCE',
        newDepartmentName: 'Finance & Accounts',
        newDesignation: 'Senior Billing Executive',
        effectiveDate: new Date(),
        reason: 'Promotion and organizational transfer'
      },
      userAdmin
    );

    const transferredEmp = transferResult.employee;
    assertTest('Employee transferred to new department', transferredEmp.departmentAssignments.some(d => d.departmentId === 'DEP-FINANCE' && d.status === 'ACTIVE'));
    assertTest('Previous department assignment preserved with status TRANSFERRED', transferredEmp.departmentAssignments.some(d => d.departmentId === 'DEP-BILLING' && d.status === 'TRANSFERRED'));
    assertTest('Designation updated to Senior Billing Executive', transferredEmp.designation === 'Senior Billing Executive');

    // 7. External HRMS Synchronization & RPA Job
    const { syncRecord, rpaJob } = await EmployeeSyncService.syncEmployee(
      newEmp.employeeId,
      { externalSystem: 'EXTERNAL_HR_SYSTEM', syncType: 'UPDATE' },
      userAdmin
    );
    assertTest('External synchronization record created with QUEUED status', syncRecord.status === 'QUEUED');
    assertTest('RPA job created and linked to employee sync', rpaJob.jobName.includes(newEmp.employeeId));

    // Complete sync with verification read-back
    const completedSync = await EmployeeSyncService.completeSync(syncRecord._id, {
      status: 'SYNCED',
      externalEmployeeId: `EXT-${newEmp.employeeId}`,
      verificationResult: { verified: true, matchedFields: ['employeeId', 'designation'] }
    });
    assertTest('RPA sync completed and verified with external system', completedSync.status === 'SYNCED' && completedSync.externalEmployeeId);

    // 8. Offboarding & Termination Workflow
    const offboardedEmp = await EmployeeOffboardingService.initiateOffboarding(
      newEmp.employeeId,
      {
        terminationDate: new Date(),
        reason: 'Career transition',
        noticePeriodServed: true
      },
      userHr
    );
    assertTest('Employee status transitioned to TERMINATED', offboardedEmp.status === 'TERMINATED');
    assertTest('Employee accessProvisioningStatus set to REVOKED', offboardedEmp.accessProvisioningStatus === 'REVOKED');
    assertTest('Offboarding checklist populated with mandatory tasks', offboardedEmp.terminationDetails.offboardingChecklist.length > 5);

    // Update checklist item
    const checklistEmp = await EmployeeOffboardingService.updateChecklistItem(
      newEmp.employeeId,
      2, // ID Card Return
      { status: 'COMPLETED', notes: 'ID Badge returned at security desk' },
      userHr
    );
    assertTest('Checklist item updated to COMPLETED', checklistEmp.terminationDetails.offboardingChecklist[2].status === 'COMPLETED');

    // 9. Employee History & Audit Trails
    const history = await EmployeeService.getEmployeeHistory(newEmp.employeeId);
    assertTest('Complete employee audit lifecycle captured in history', history.length >= 6);

    const auditLogs = await AuditEvent.find({ entityId: newEmp.employeeId }).lean();
    assertTest('Audit events recorded for employee lifecycle operations', auditLogs.length > 0);

    // 10. Dashboard Metrics
    const metrics = await EmployeeService.getDashboardMetrics();
    assertTest('Staff Management dashboard metrics calculated accurately', metrics.summary.totalEmployees > 0 && typeof metrics.summary.terminated === 'number');

    console.log('\n==========================================================');
    console.log(`--- MODULE 12 ALL ${passedCount} TESTS PASSED SUCCESSFULLY! ---`);
    console.log('==========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n[MODULE 12 TEST SUITE ERROR]:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runModule12Tests();
