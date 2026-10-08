# 16_PAYROLL_SUPPORT.md

# Hospital RPA Platform — Payroll Support

## 1. MODULE PURPOSE

Build a complete **Payroll Support module** for the Hospital Administrative Automation Platform.

This module provides the administrative workforce data, validation, reconciliation, payroll-period processing support, payroll input preparation, exception management, payroll review, and external payroll-system synchronization required to support hospital payroll operations.

The module must integrate with:

- Staff Management
- Attendance Management
- Shift Management
- Leave Management
- Employee documents
- Notification Service
- Reports & Analytics
- Robot Framework RPA
- Audit Logging
- Exception Management
- External Payroll/HR systems where configured

The module must **not blindly calculate or approve salary** using assumptions.

The hospital may have different:

- salary structures
- statutory requirements
- deductions
- overtime rules
- allowances
- reimbursements
- tax rules
- employee categories
- payroll periods

Therefore, payroll rules must be configurable and/or delegated to the hospital's authorized payroll system.

---

# 2. CORE PRINCIPLE

Payroll Support is primarily a **data preparation, reconciliation, validation, and integration layer**.

The core flow is:

```text
Employee Master
      ↓
Salary/Payroll Configuration
      ↓
Attendance
      ↓
Leave
      ↓
Shift
      ↓
Approved Overtime
      ↓
Other Approved Payroll Inputs
      ↓
Payroll Period
      ↓
Validation
      ↓
Exception Detection
      ↓
Payroll Review
      ↓
Approval
      ↓
Payroll System / Processing
      ↓
Payroll Result
      ↓
Payslip / Notification
      ↓
Audit
```

The module must clearly distinguish:

### Calculated Input

Example:

```text
Worked Days = 24
Approved Leave = 2
Approved Overtime = 6 hours
```

from:

### Financial Result

Example:

```text
Gross Salary
Deductions
Tax
Net Salary
```

Financial results should only be calculated according to configured rules or returned by an authorized payroll engine/system.

---

# 3. STRICT PAYROLL SAFETY PRINCIPLE

RPA and automation must NOT:

- invent salary values
- approve salary increases
- approve bonuses
- approve deductions
- change employee salary without authorization
- fabricate attendance
- fabricate overtime
- fabricate leave
- approve payroll exceptions
- override payroll policy
- approve statutory calculations
- create unauthorized employees
- create unauthorized bank/payment details
- release salary payments
- change payroll after final approval without controlled workflow

Automation may:

- collect data
- validate data
- reconcile data
- calculate configured administrative metrics
- prepare payroll inputs
- synchronize approved data
- detect exceptions
- generate reports
- notify authorized users

---

# 4. PAYROLL OWNERSHIP

Different modules own different information.

| Data | Authoritative Module |
|---|---|
| Employee identity | Staff Management |
| Employee role | Staff Management |
| Department | Staff Management |
| Shift | Shift Management |
| Actual attendance | Attendance Management |
| Approved leave | Leave Management |
| Approved overtime | Authorized payroll/manager workflow |
| Salary configuration | Payroll/HR |
| Payroll calculation | Configured Payroll Engine/System |
| Invoice/payment | Billing |
| Hospital financial transactions | Billing/Finance |

Payroll Support must consume these records rather than duplicate them.

---

# 5. ACTORS

## 5.1 Employee

Can:

- view own payroll period status
- view approved attendance summary
- view leave information
- view payslips where enabled
- download payslips
- raise payroll queries
- view payroll query status

Cannot:

- edit salary
- edit payroll inputs
- approve payroll
- modify bank/payment details through unauthorized interfaces
- modify attendance through Payroll

---

# 6. HR MANAGER

Can:

- view payroll inputs
- review employee payroll data
- validate attendance/leave reconciliation
- manage authorized payroll configuration
- review exceptions
- prepare payroll periods
- submit payroll for approval
- generate reports

---

# 7. PAYROLL STAFF / AUTHORIZED FINANCE USER

Can:

- review payroll inputs
- validate payroll data
- run configured payroll calculation
- review calculated results
- resolve exceptions
- prepare payroll output
- submit for approval
- export payroll files

Actual permissions must be controlled through RBAC.

---

# 8. ADMINISTRATIVE MANAGER

Can:

- view payroll processing status
- monitor payroll exceptions
- access authorized summary reports

Should not automatically receive access to sensitive employee salary details unless explicitly authorized.

---

# 9. HOSPITAL MANAGEMENT

Can:

- view authorized payroll summaries
- view payroll-period status
- review organization-level reports

Detailed salary access must be permission-controlled.

---

# 10. SYSTEM ADMIN

Can:

- configure technical integrations
- manage system settings
- manage RBAC
- monitor RPA

System Admin does not automatically receive payroll approval privileges.

---

# 11. PAYROLL PERIOD

Create:

```text
PayrollPeriod
```

Example:

```javascript
{
  periodCode: "PAY-2026-10",

  startDate: "2026-10-01",
  endDate: "2026-10-31",

  frequency: "MONTHLY",

  status: "DRAFT",

  cutoffDate: Date,

  attendanceCutoffDate: Date,

  leaveCutoffDate: Date,

  inputLockDate: Date,

  createdBy: ObjectId,

  approvedBy: ObjectId,

  approvedAt: Date,

  processedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 12. PAYROLL PERIOD STATUS

Use:

```text
DRAFT
OPEN
INPUT_COLLECTION
VALIDATION
PENDING_REVIEW
PENDING_APPROVAL
APPROVED
PROCESSING
PROCESSED
FINALIZED
CANCELLED
```

Recommended flow:

```text
DRAFT
 ↓
OPEN
 ↓
INPUT_COLLECTION
 ↓
VALIDATION
 ↓
PENDING_REVIEW
 ↓
PENDING_APPROVAL
 ↓
APPROVED
 ↓
PROCESSING
 ↓
PROCESSED
 ↓
FINALIZED
```

---

# 13. PAYROLL PERIOD LOCKING

Once a payroll period reaches:

```text
FINALIZED
```

normal users must not be able to modify payroll inputs.

If a correction is required:

```text
Correction Request
      ↓
Authorized Review
      ↓
Approved Adjustment
      ↓
Controlled Reprocessing / Adjustment
```

Do not silently modify finalized payroll.

---

# 14. PAYROLL INPUT

Create:

```text
PayrollInput
```

Recommended:

```javascript
{
  payrollPeriodId: ObjectId,

  employeeId: ObjectId,

  attendanceSummary: {
    scheduledDays: Number,
    workedDays: Number,
    absentDays: Number,
    lateDays: Number,
    lateMinutes: Number,
    workedMinutes: Number
  },

  leaveSummary: {
    paidLeaveDays: Number,
    unpaidLeaveDays: Number,
    otherLeaveDays: Number
  },

  overtime: {
    candidateMinutes: Number,
    approvedMinutes: Number
  },

  allowances: [],

  deductions: [],

  reimbursements: [],

  sourceReferences: [],

  status: "DRAFT",

  calculatedAt: Date,

  reviewedBy: ObjectId,
  reviewedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 15. SOURCE REFERENCES

Every payroll input should identify where it came from.

Example:

```javascript
{
  sourceType: "ATTENDANCE",
  sourceId: ObjectId,
  sourceVersion: Number
}
```

Possible sources:

```text
ATTENDANCE
LEAVE
SHIFT
OVERTIME
EXPENSE
BONUS
DEDUCTION
MANUAL_ADJUSTMENT
EXTERNAL_PAYROLL
```

This provides traceability.

---

# 16. PAYROLL INPUT STATUS

Use:

```text
DRAFT
CALCULATED
PENDING_REVIEW
REVIEWED
EXCEPTION
APPROVED
LOCKED
```

---

# 17. PAYROLL EMPLOYEE SNAPSHOT

Payroll periods must preserve the employee data relevant to processing.

Create a controlled snapshot.

Example:

```javascript
{
  payrollPeriodId,
  employeeId,

  employeeCode,
  employeeName,

  departmentId,
  departmentName,

  designation,

  employmentType,

  salaryStructureReference,

  effectiveFrom,

  effectiveTo
}
```

The snapshot allows historical payroll periods to remain understandable even if employee information later changes.

Do not overwrite historical payroll data with current employee information.

---

# 18. SALARY STRUCTURE

Create a configurable `SalaryStructure` model if salary calculation is handled inside this platform.

Example:

```javascript
{
  code: "SAL-EXEC-001",
  name: "Administrative Executive",

  components: [
    {
      code: "BASIC",
      name: "Basic Salary",
      type: "EARNING",
      calculationType: "FIXED"
    },
    {
      code: "HRA",
      name: "Housing Allowance",
      type: "EARNING",
      calculationType: "CONFIGURED"
    }
  ],

  effectiveFrom,
  effectiveTo,

  status: "ACTIVE"
}
```

Do not hardcode specific salary components.

---

# 19. EMPLOYEE SALARY ASSIGNMENT

Create:

```text
EmployeeSalaryAssignment
```

Example:

```javascript
{
  employeeId,
  salaryStructureId,

  effectiveFrom,
  effectiveTo,

  currency,

  baseAmount,

  components: [],

  status: "ACTIVE",

  approvedBy,
  approvedAt,

  createdAt,
  updatedAt
}
```

Changes require authorization.

---

# 20. SALARY CHANGE

Salary changes must not be treated as normal employee profile edits.

Workflow:

```text
Salary Change Request
      ↓
Authorization
      ↓
Approval
      ↓
Effective Date
      ↓
Salary Assignment Version
      ↓
Payroll Consumption
```

RPA must not independently approve salary changes.

---

# 21. SALARY HISTORY

Never overwrite previous salary assignments.

Example:

```text
01-Jan → 30-Jun
Basic = configured amount

01-Jul → current
Basic = new configured amount
```

Historical payroll periods must continue referencing the correct version.

---

# 22. ATTENDANCE INPUT

Attendance Management provides:

```text
Scheduled Days
Worked Days
Absent Days
Late Days
Late Minutes
Early Departures
Worked Hours
Approved Overtime
```

Only approved values should be used for payroll.

Example:

```text
Overtime Candidate:
10 hours

Approved Overtime:
6 hours
```

Payroll consumes:

```text
6 hours
```

not:

```text
10 hours
```

unless the configured payroll policy explicitly says otherwise.

---

# 23. LEAVE INPUT

Leave Management provides:

```text
Paid Leave
Unpaid Leave
Other Approved Leave
```

Payroll Support must use **approved** leave only.

Pending leave must not automatically become approved leave.

---

# 24. SHIFT INPUT

Shift Management provides:

- scheduled days
- scheduled hours
- shift type
- night-shift indicator
- holiday/week-off schedule

Payroll may use these as inputs where configured.

Do not infer salary simply from a shift assignment.

---

# 25. OVERTIME

Overtime requires clear distinction:

```text
Attendance:
Potential Overtime
```

versus:

```text
Payroll:
Approved Overtime
```

Workflow:

```text
Actual Attendance
      ↓
Overtime Candidate
      ↓
Authorized Review
      ↓
Approved Overtime
      ↓
Payroll Input
```

RPA cannot approve overtime.

---

# 26. OVERTIME MODEL

Create:

```text
OvertimeRecord
```

Example:

```javascript
{
  employeeId,
  payrollPeriodId,

  attendanceId,

  candidateMinutes,
  requestedMinutes,
  approvedMinutes,

  reason,

  status: "PENDING",

  requestedBy,
  approvedBy,
  approvedAt,

  createdAt,
  updatedAt
}
```

Statuses:

```text
PENDING
APPROVED
REJECTED
CANCELLED
```

---

# 27. ALLOWANCES

Support configurable payroll components.

Examples:

```text
Basic
Housing Allowance
Transport Allowance
Night Shift Allowance
Other Allowance
```

These are examples only.

Actual components must be configured.

---

# 28. DEDUCTIONS

Support configurable deductions.

Examples:

```text
Employee Benefit Deduction
Loan Deduction
Other Approved Deduction
```

Do not invent statutory deductions or rates.

Where statutory calculations are required, integrate with the appropriate configured payroll/statutory engine.

---

# 29. REIMBURSEMENTS

If hospital policy requires reimbursement processing, support:

```text
Expense Claim
 ↓
Review
 ↓
Approval
 ↓
Payroll Input
```

Example:

```javascript
{
  employeeId,
  payrollPeriodId,

  category,
  amount,

  documentIds,

  status,

  approvedBy,
  approvedAt
}
```

Do not approve reimbursement automatically.

---

# 30. PAYROLL CALCULATION

If payroll calculation is implemented inside the platform, it must use a configurable calculation engine.

Conceptually:

```text
Gross Earnings
      ↓
Approved Earnings
      ↓
Configured Deductions
      ↓
Configured Statutory Calculations
      ↓
Net Pay
```

Do not hardcode tax rates, statutory percentages, or legal rules.

---

# 31. EXTERNAL PAYROLL ENGINE

Preferred where the hospital already has a payroll system.

Workflow:

```text
Hospital Payroll Support
      ↓
Validated Payroll Inputs
      ↓
Export/API
      ↓
External Payroll System
      ↓
Payroll Calculation
      ↓
Payroll Result
      ↓
Import/Sync
      ↓
Hospital System
```

The external payroll system may remain authoritative for final payroll calculations.

---

# 32. PAYROLL RESULT

Create:

```text
PayrollResult
```

Example:

```javascript
{
  payrollPeriodId,
  employeeId,

  grossEarnings,
  totalDeductions,
  netPay,

  currency,

  source: "INTERNAL_ENGINE",

  externalReference,

  calculationVersion,

  status,

  calculatedAt,

  finalizedAt
}
```

Sensitive fields must be protected by RBAC.

---

# 33. PAYSLIP

Create:

```text
Payslip
```

Example:

```javascript
{
  payrollPeriodId,
  employeeId,

  payslipNumber,

  documentId,

  grossAmount,
  deductionAmount,
  netAmount,

  status: "GENERATED",

  generatedAt
}
```

The actual payslip should be generated through the centralized Document Generation module.

---

# 34. PAYSLIP ACCESS

Employee can view only their own payslips.

Example:

```text
/api/me/payroll/payslips
```

Backend must verify identity.

Never trust:

```text
employeeId
```

from the frontend without authorization.

---

# 35. PAYROLL QUERY

Create:

```text
PayrollQuery
```

Employees may raise:

- missing payslip
- incorrect attendance input
- leave discrepancy
- overtime discrepancy
- salary discrepancy
- deduction question
- reimbursement question

Example:

```javascript
{
  employeeId,
  payrollPeriodId,

  category,
  subject,
  description,

  attachments,

  status: "OPEN",

  assignedTo,

  resolution,

  createdAt,
  resolvedAt
}
```

---

# 36. PAYROLL QUERY STATUS

Use:

```text
OPEN
ASSIGNED
IN_REVIEW
WAITING_FOR_INFORMATION
RESOLVED
REJECTED
CLOSED
```

---

# 37. PAYROLL EXCEPTION

Create `ExceptionCase` for:

```text
Missing Attendance
Unresolved Leave
Unapproved Overtime
Missing Salary Assignment
Salary Conflict
Duplicate Employee
Inactive Employee
Missing Bank Information
Calculation Failure
External Payroll Failure
Payroll Import Failure
Payslip Generation Failure
```

Do not allow payroll finalization while critical exceptions remain unresolved unless policy explicitly permits it.

---

# 38. PAYROLL VALIDATION

Before processing, validate:

### Employee

- employee exists
- employee active for relevant period
- correct employment type
- salary assignment exists

### Attendance

- no unresolved critical attendance exceptions
- approved attendance data available

### Leave

- approved leave available
- no unresolved critical conflicts

### Overtime

- approved overtime only

### Salary

- applicable salary assignment exists
- effective date valid

### Payroll configuration

- payroll period open
- required configuration available

---

# 39. PAYROLL PRE-CHECK

Create endpoint:

```text
POST /api/payroll/periods/:id/validate
```

Result:

```json
{
  "success": true,
  "employeeCount": 250,
  "validCount": 244,
  "warningCount": 4,
  "errorCount": 2
}
```

Example error:

```text
EMP00125:
No salary assignment found for payroll period.
```

---

# 40. VALIDATION SEVERITY

Use:

```text
ERROR
WARNING
INFO
```

### ERROR

Blocks processing.

### WARNING

Requires review but may not block processing depending on policy.

### INFO

Informational only.

---

# 41. PAYROLL REVIEW

Route:

```text
/payroll/review
```

Show:

```text
Employee
Department
Scheduled Days
Worked Days
Leave
Overtime
Gross
Deductions
Net
Exception Status
```

Detailed salary columns must only be shown to authorized users.

---

# 42. PAYROLL PERIOD DASHBOARD

Route:

```text
/payroll
```

Cards:

```text
Open Payroll Period
Employees
Pending Validation
Exceptions
Pending Approval
Processed
Finalized
Payroll Queries
```

---

# 43. EMPLOYEE PAYROLL DASHBOARD

Route:

```text
/my-payroll
```

Show:

```text
Current Payroll Status
Previous Payslips
Payroll Periods
Attendance Summary
Leave Summary
Approved Overtime
Open Payroll Queries
```

Do not expose internal payroll processing information unnecessarily.

---

# 44. PAYROLL PERIOD SCREEN

Route:

```text
/payroll/periods/:id
```

Tabs:

```text
Overview
Employees
Inputs
Exceptions
Review
Approval
Processing
Results
Payslips
Audit
```

---

# 45. PAYROLL PROCESSING WORKFLOW

Use:

```text
Open Period
      ↓
Collect Inputs
      ↓
Validate
      ↓
Resolve Critical Exceptions
      ↓
Generate Payroll Inputs
      ↓
Review
      ↓
Approve
      ↓
Process
      ↓
Verify Results
      ↓
Generate Payslips
      ↓
Notify Employees
      ↓
Finalize
```

---

# 46. PAYROLL APPROVAL

Approval must be separate from preparation.

Example:

```text
Payroll Staff:
Prepare

Payroll Manager:
Review

Authorized Approver:
Approve
```

Do not allow one automation account to perform all stages if segregation of duties is configured.

---

# 47. SEGREGATION OF DUTIES

Support permissions such as:

```text
PAYROLL_PREPARE
PAYROLL_REVIEW
PAYROLL_APPROVE
PAYROLL_PROCESS
PAYROLL_FINALIZE
PAYROLL_VIEW_SENSITIVE
```

A hospital may configure whether one user can hold multiple permissions.

---

# 48. PAYROLL PROCESSING LOCK

When processing begins:

```text
PROCESSING
```

critical input changes must be blocked or require controlled workflow.

Prevent:

```text
Attendance modified
Leave modified
Salary changed
```

from silently changing already processed payroll.

If source data changes:

```text
Payroll Recalculation Required
```

must be raised.

---

# 49. SOURCE DATA CHANGE DETECTION

If Attendance is corrected after payroll input was generated:

```text
Attendance Correction Approved
       ↓
Detect affected Payroll Period
       ↓
Mark Payroll Input:
STALE
       ↓
Require Recalculation
```

Do not silently continue using old data.

---

# 50. PAYROLL INPUT VERSION

Create versioning.

Example:

```text
Payroll Input V1
 ↓
Attendance correction
 ↓
Payroll Input V2
```

Preserve V1.

Store:

```text
version
createdAt
createdBy
sourceVersions
changeReason
```

---

# 51. PAYROLL RUN

Create:

```text
PayrollRun
```

Example:

```javascript
{
  payrollPeriodId,

  runNumber: 1,

  status: "PROCESSING",

  inputVersion,

  employeeCount,

  successfulCount,

  failedCount,

  startedAt,
  completedAt,

  startedBy,

  approvedBy
}
```

If a rerun is required:

```text
Run 1
Run 2
```

must remain separately traceable.

---

# 52. PAYROLL RUN STATUSES

Use:

```text
QUEUED
VALIDATING
PROCESSING
PARTIAL_SUCCESS
SUCCESS
FAILED
CANCELLED
```

---

# 53. PAYROLL RESULT RECONCILIATION

After processing:

```text
Payroll Inputs
      ↓
Payroll Results
      ↓
Compare
      ↓
Validate Count
      ↓
Validate Totals
      ↓
Detect Missing Employees
      ↓
Detect Duplicate Results
      ↓
Review Exceptions
```

Example:

```text
Input Employees: 250
Results: 250
Missing: 0
Duplicates: 0
```

---

# 54. EXTERNAL PAYROLL RECONCILIATION

If external payroll system returns:

```text
250 employees
```

but hospital submitted:

```text
252 employees
```

create:

```text
PAYROLL_RESULT_MISMATCH
```

Do not assume the missing employees were intentionally excluded.

---

# 55. PAYMENT RELEASE

If the external payroll system handles salary payment:

```text
Hospital System
→ Payroll Result
→ External Payroll
→ Payment
```

The hospital platform should not claim payment success unless it receives verified confirmation.

RPA must never fabricate payment confirmation.

---

# 56. BANK DETAILS

If employee bank details are stored, treat them as highly sensitive.

Use:

- encryption where appropriate
- strict RBAC
- masked display
- audit logging
- secure update workflow

Example UI:

```text
Bank Account:
••••••••1234
```

Do not expose full account numbers unnecessarily.

---

# 57. BANK DETAIL CHANGE

Workflow:

```text
Employee Request
      ↓
Validation
      ↓
Supporting Evidence if Required
      ↓
Authorized Review
      ↓
Approval
      ↓
Update
      ↓
Audit
```

RPA must not independently approve bank-detail changes.

---

# 58. PAYROLL NOTIFICATIONS

Events:

```text
Payroll Period Open
Payroll Input Issue
Payroll Approval Required
Payroll Processed
Payslip Available
Payroll Query Updated
Payroll Finalized
```

Employee notification:

```text
Your October 2026 payslip is now available.
```

Use centralized Notification Service.

---

# 59. DOCUMENT GENERATION

Generate:

- payslip
- payroll summary
- payroll register
- payroll exception report
- employee payroll statement

Use centralized Document Generation.

---

# 60. RPA ROLE

Robot Framework may automate:

- collecting attendance data
- collecting leave data
- collecting approved overtime
- preparing payroll input files
- uploading payroll input to external system
- downloading payroll results
- reconciling results
- downloading payslips
- importing payslips
- sending notifications
- generating exception reports

RPA must not:

- approve payroll
- approve salary changes
- approve overtime
- approve deductions
- release payments
- fabricate payroll results

---

# 61. RPA PAYROLL INPUT EXPORT

Example:

```text
Attendance
+
Leave
+
Approved Overtime
+
Salary Assignment
      ↓
Payroll Support
      ↓
Validated Payroll Input
      ↓
Robot Framework
      ↓
External Payroll System
```

---

# 62. RPA EXTERNAL PAYROLL WORKFLOW

Example:

```text
Open Payroll Portal
      ↓
Authenticate using secret manager
      ↓
Select Payroll Period
      ↓
Upload Payroll Input
      ↓
Verify Upload
      ↓
Submit for Authorized Review
      ↓
Download Processing Result
      ↓
Verify File
      ↓
Import Result
      ↓
Reconcile
      ↓
Store RPA Execution
```

If the external system requires a human approval button, RPA must stop and create a human task rather than impersonating the approver.

---

# 63. RPA PAYSLIP DOWNLOAD

Example:

```text
External Payroll System
      ↓
Payroll Processed
      ↓
Robot Login
      ↓
Download Payslips
      ↓
Verify Employee Mapping
      ↓
Store Documents
      ↓
Update Payslip Records
      ↓
Notify Employees
```

Never attach the wrong employee's payslip to another employee.

---

# 64. RPA PAYROLL RESULT CONTRACT

Example:

```json
{
  "success": true,
  "jobType": "PAYROLL_PROCESS",
  "correlationId": "RPA-PAY-202610-0001",
  "payrollPeriod": "PAY-2026-10",
  "recordsRead": 250,
  "recordsProcessed": 250,
  "recordsSucceeded": 248,
  "recordsFailed": 2,
  "startedAt": "2026-10-31T18:00:00Z",
  "completedAt": "2026-10-31T18:15:30Z"
}
```

Store in:

```text
RPAJob
RPAExecution
```

---

# 65. RPA ROBOT STRUCTURE

Use:

```text
robot/
├── resources/
│   ├── common.resource
│   ├── auth.resource
│   ├── api.resource
│   ├── payroll.resource
│   └── notifications.resource
│
├── keywords/
│   ├── payroll_keywords.resource
│   ├── payroll_validation.resource
│   ├── payroll_reconciliation.resource
│   └── payslip_keywords.resource
│
├── tests/
│   ├── payroll_input_export.robot
│   ├── payroll_process.robot
│   ├── payroll_result_import.robot
│   ├── payroll_reconciliation.robot
│   └── payslip_download.robot
│
├── portals/
│   └── external_payroll_portal.resource
│
└── results/
```

---

# 66. ROBOT KEYWORDS

Implement:

```text
Login To Payroll System
Select Payroll Period
Prepare Payroll Input
Validate Payroll File
Upload Payroll Input
Verify Upload
Download Payroll Result
Validate Payroll Result
Reconcile Payroll
Download Payslips
Map Payslip To Employee
Store Payslip
Create Payroll Exception
Send Payroll Notification
Capture Evidence
Record RPA Execution
```

---

# 67. RPA FAILURE HANDLING

If external payroll portal fails:

```text
Attempt
 ↓
Retry
 ↓
Failure
 ↓
ExceptionCase
 ↓
Notify Payroll Staff
```

Do not:

- mark payroll processed
- mark payment successful
- fabricate results

---

# 68. IDEMPOTENCY

Payroll operations are high risk.

Every processing operation must use:

```text
payrollPeriodId
+
runNumber
+
correlationId
```

to prevent accidental duplicate processing.

Do not process the same payroll run twice because a browser/RPA job was retried.

---

# 69. UNCERTAIN SUBMISSION

If the external payroll portal times out immediately after clicking:

```text
Submit
```

do NOT automatically submit again.

First:

```text
Query external system
      ↓
Find payroll run
      ↓
Check status
```

If status is unknown:

```text
ExceptionCase:
UNCERTAIN_PAYROLL_SUBMISSION
```

Human review may be required.

---

# 70. PAYROLL API

Base:

```text
/api/payroll
```

Periods:

```http
GET    /api/payroll/periods
POST   /api/payroll/periods
GET    /api/payroll/periods/:id
PATCH  /api/payroll/periods/:id
POST   /api/payroll/periods/:id/open
POST   /api/payroll/periods/:id/validate
POST   /api/payroll/periods/:id/submit-review
POST   /api/payroll/periods/:id/approve
POST   /api/payroll/periods/:id/process
POST   /api/payroll/periods/:id/finalize
```

Inputs:

```http
GET  /api/payroll/periods/:id/inputs
POST /api/payroll/periods/:id/generate-inputs
GET  /api/payroll/inputs/:id
```

Overtime:

```http
GET  /api/payroll/overtime
POST /api/payroll/overtime/:id/approve
POST /api/payroll/overtime/:id/reject
```

Results:

```http
GET /api/payroll/periods/:id/results
GET /api/payroll/results/:id
```

Payslips:

```http
GET /api/payroll/payslips
GET /api/payroll/payslips/:id
```

Employee:

```http
GET /api/me/payroll
GET /api/me/payroll/payslips
GET /api/me/payroll/queries
POST /api/me/payroll/queries
```

---

# 71. BACKEND STRUCTURE

Implement:

```text
server/
├── models/
│   ├── PayrollPeriod.js
│   ├── PayrollInput.js
│   ├── PayrollInputVersion.js
│   ├── SalaryStructure.js
│   ├── EmployeeSalaryAssignment.js
│   ├── OvertimeRecord.js
│   ├── PayrollRun.js
│   ├── PayrollResult.js
│   ├── Payslip.js
│   └── PayrollQuery.js
│
├── controllers/
│   └── payrollController.js
│
├── services/
│   ├── payrollPeriodService.js
│   ├── payrollInputService.js
│   ├── payrollValidationService.js
│   ├── payrollCalculationService.js
│   ├── payrollProcessingService.js
│   ├── payrollReconciliationService.js
│   ├── payslipService.js
│   └── payrollQueryService.js
│
├── routes/
│   └── payrollRoutes.js
│
├── validators/
│   └── payrollValidators.js
│
└── jobs/
    ├── payrollInputJob.js
    ├── payrollProcessingJob.js
    └── payslipJob.js
```

---

# 72. FRONTEND STRUCTURE

Use:

```text
client/src/
├── portals/
│   ├── administration/
│   │   └── payroll/
│   │       ├── pages/
│   │       │   ├── PayrollDashboard.jsx
│   │       │   ├── PayrollPeriods.jsx
│   │       │   ├── PayrollReview.jsx
│   │       │   ├── PayrollExceptions.jsx
│   │       │   ├── PayrollResults.jsx
│   │       │   └── PayrollReports.jsx
│   │       │
│   │       └── components/
│   │           ├── PayrollSummary.jsx
│   │           ├── PayrollInputTable.jsx
│   │           ├── PayrollValidationPanel.jsx
│   │           ├── PayrollApprovalPanel.jsx
│   │           └── PayrollExceptionTable.jsx
│   │
│   └── employee/
│       └── payroll/
│           ├── MyPayroll.jsx
│           ├── Payslips.jsx
│           ├── PayslipViewer.jsx
│           └── PayrollQueries.jsx
```

---

# 73. MONGODB INDEXES

Recommended:

```javascript
PayrollPeriod:
{
  startDate: 1,
  endDate: 1
}
```

```javascript
PayrollPeriod:
{
  status: 1
}
```

```javascript
PayrollInput:
{
  payrollPeriodId: 1,
  employeeId: 1
}
```

Use a unique constraint where appropriate:

```text
payrollPeriodId + employeeId + inputVersion
```

Salary assignment:

```javascript
{
  employeeId: 1,
  effectiveFrom: -1
}
```

Payroll result:

```javascript
{
  payrollPeriodId: 1,
  employeeId: 1
}
```

Payslip:

```javascript
{
  employeeId: 1,
  payrollPeriodId: 1
}
```

Payroll query:

```javascript
{
  employeeId: 1,
  status: 1,
  createdAt: -1
}
```

---

# 74. AUDIT LOGGING

Record:

```text
Payroll Period Created
Payroll Period Opened
Payroll Inputs Generated
Payroll Input Changed
Payroll Validation Executed
Payroll Exception Created
Payroll Reviewed
Payroll Approved
Payroll Run Started
Payroll Run Completed
Payroll Finalized
Salary Assignment Created
Salary Assignment Changed
Overtime Approved
Payslip Generated
Payslip Accessed
Payroll Query Created
Payroll Query Resolved
External Payroll Sync
RPA Execution
```

Every sensitive action should include:

```text
actor
timestamp
entity
before
after
reason
correlationId
```

---

# 75. PAYROLL ACCESS LOGGING

Payslip and salary access is sensitive.

Record when an authorized user accesses:

- salary structure
- employee salary
- payroll result
- payslip
- bank details

Example:

```javascript
{
  action: "PAYSLIP_VIEWED",
  actorUserId,
  employeeId,
  payslipId,
  timestamp,
  correlationId
}
```

---

# 76. SECURITY

Implement:

- JWT authentication
- RBAC
- least-privilege permissions
- department-level restrictions where required
- sensitive-field masking
- backend authorization
- audit logging
- secure document access
- encrypted transport
- secure secrets
- rate limiting
- input validation

Never rely only on frontend route protection.

---

# 77. SENSITIVE DATA

Treat these as sensitive:

- salary
- bank details
- deductions
- tax information
- payslips
- payroll results
- reimbursement information

Use strict access controls.

---

# 78. PAYROLL REPORTS

Provide:

### Payroll Register

```text
Employee
Department
Gross
Deductions
Net
Status
```

### Attendance Input Report

```text
Employee
Scheduled
Worked
Absent
Leave
Late
```

### Overtime Report

```text
Employee
Candidate
Approved
Rejected
```

### Payroll Exception Report

```text
Employee
Exception
Severity
Status
```

### Payroll Summary

```text
Period
Employees
Gross Total
Deductions Total
Net Total
Exceptions
```

Financial totals must only be visible to authorized roles.

---

# 79. EXPORTS

Support:

```text
CSV
Excel
PDF
```

Potential payroll bank file/export should only be generated if explicitly configured.

Any payment file must require strong authorization and audit controls.

---

# 80. EMPLOYEE PAYSLIP

Employee should see:

```text
October 2026
------------------------
Gross Earnings
Deductions
Net Pay
------------------------
Attendance Summary
Leave Summary
Approved Overtime
```

The exact payslip layout should be configurable.

---

# 81. PAYROLL QUERY EXAMPLE

Employee sees:

```text
October 2026
Net Pay
```

and raises:

```text
Category:
Overtime

Subject:
Approved overtime missing

Description:
6 hours of approved overtime are not visible in the payroll result.
```

Workflow:

```text
Employee
 ↓
Payroll Query
 ↓
Payroll Staff
 ↓
Review Attendance
 ↓
Review Overtime
 ↓
Review Payroll Input
 ↓
Resolve
 ↓
Notify Employee
```

Do not automatically change payroll based solely on an employee complaint.

---

# 82. SOURCE DATA RECONCILIATION

Before finalization:

```text
Staff
vs
Attendance
vs
Leave
vs
Shift
vs
Payroll Input
vs
Payroll Result
```

must be reconciled.

Example:

```text
Staff Employees: 250
Payroll Inputs: 250
Payroll Results: 250
```

Any mismatch creates an exception.

---

# 83. EMPLOYEE JOIN/EXIT HANDLING

New employee:

```text
Staff Created
 ↓
Salary Assignment
 ↓
Effective Date
 ↓
Payroll Eligibility
```

Terminated employee:

```text
Staff Termination
 ↓
Final Payroll Eligibility
 ↓
Payroll Processing
 ↓
Historical Records Retained
```

Do not automatically assume termination date equals payroll cutoff date.

Use configured effective dates.

---

# 84. RETROACTIVE CHANGES

If a salary or attendance correction affects a closed payroll period:

```text
Correction
 ↓
Detect Affected Payroll Period
 ↓
Create Payroll Adjustment Case
 ↓
Authorized Review
 ↓
Adjustment / Reprocessing
```

Do not silently reopen finalized payroll.

---

# 85. PAYROLL ADJUSTMENT

Create:

```text
PayrollAdjustment
```

Example:

```javascript
{
  employeeId,
  payrollPeriodId,

  adjustmentType,
  amount,

  reason,

  sourceReference,

  status: "PENDING",

  requestedBy,
  approvedBy,
  approvedAt
}
```

Statuses:

```text
PENDING
APPROVED
REJECTED
APPLIED
CANCELLED
```

No automatic financial adjustment without authorized approval.

---

# 86. RPA PAYROLL ADJUSTMENT RULE

RPA may:

```text
Prepare
Validate
Upload
Track
```

but cannot:

```text
Approve
```

payroll adjustments.

---

# 87. CONCURRENCY

Prevent:

- two payroll runs for the same period
- duplicate payslip generation
- duplicate external submissions
- duplicate overtime approval
- duplicate adjustment application
- duplicate result import

Use:

- unique indexes
- status locks
- transaction/session
- idempotency keys
- run numbers
- correlation IDs

---

# 88. DATA RETENTION

Do not delete:

- finalized payroll periods
- payroll inputs
- payroll results
- payslips
- salary history
- adjustment history
- payroll audit logs

Retention must follow hospital policy and applicable legal requirements.

Use archival rather than destructive deletion where appropriate.

---

# 89. SEED DATA

Create demo payroll period:

```text
PAY-2026-10
01-Oct-2026 → 31-Oct-2026
```

Demo employees:

```text
EMP00125
Rahul Shah
Administration

EMP00126
Priya Mehta
Human Resources

EMP00127
Arjun Patel
Pharmacy
```

Create:

- salary assignments
- attendance summaries
- leave summaries
- approved overtime
- payroll inputs
- one warning
- one exception
- sample payslips

---

# 90. END-TO-END EXAMPLE

Employee:

```text
EMP00125
Rahul Shah
```

October schedule:

```text
Scheduled Days: 26
```

Attendance:

```text
Worked: 24
Absent: 0
Late: 2
```

Leave:

```text
Paid Leave: 2
```

Overtime:

```text
Candidate: 8 hours
Approved: 6 hours
```

Payroll input becomes:

```text
Scheduled Days: 26
Worked Days: 24
Paid Leave: 2
Approved Overtime: 6h
```

System validates:

```text
Employee exists = YES
Salary assignment = YES
Attendance exceptions = NONE
Leave conflicts = NONE
Overtime approved = YES
```

Payroll input:

```text
READY FOR REVIEW
```

Authorized payroll user reviews.

Approver approves.

Payroll system processes.

Result is imported.

Payslip generated.

Employee receives:

```text
Your October 2026 payslip is available.
```

---

# 91. ERROR SCENARIO

Employee:

```text
EMP00126
```

has:

```text
No salary assignment
```

Payroll validation returns:

```text
ERROR
MISSING_SALARY_ASSIGNMENT
```

Payroll cannot be finalized for that employee.

Exception:

```text
EXC-PAY-00027
```

is created.

HR/Payroll resolves the salary assignment.

System recalculates payroll input.

The exception is closed only after validation succeeds.

---

# 92. ATTENDANCE CORRECTION SCENARIO

Payroll input was generated:

```text
Worked:
24 days
```

Later an approved attendance correction changes one day.

System detects:

```text
Payroll Input V1 = STALE
```

Then:

```text
Recalculate
 ↓
Payroll Input V2
 ↓
Review
```

Never silently continue with stale payroll data.

---

# 93. UNIT TESTS

Test:

```text
Payroll period creation
Payroll period locking
Payroll input generation
Attendance integration
Leave integration
Shift integration
Salary assignment
Overtime approval
Payroll validation
Payroll calculation
Payroll result reconciliation
Payslip generation
Payroll adjustment
Payroll query
Duplicate processing prevention
```

---

# 94. API TESTS

Test:

```text
POST /api/payroll/periods
POST /api/payroll/periods/:id/validate
POST /api/payroll/periods/:id/generate-inputs
POST /api/payroll/periods/:id/approve
POST /api/payroll/periods/:id/process
POST /api/payroll/periods/:id/finalize
GET /api/payroll/periods/:id/results
GET /api/me/payroll/payslips
POST /api/me/payroll/queries
```

Test unauthorized access to salary and payslip data.

---

# 95. RBAC TESTS

Verify:

```text
Employee:
own payslip only

Manager:
authorized payroll visibility only

Payroll Staff:
payroll processing access

HR:
authorized salary/employee payroll access

System Admin:
technical access only unless explicitly granted payroll permissions
```

---

# 96. RPA TESTS

### Test 1 — Payroll Input Upload

```text
Prepare
Validate
Upload
Verify
```

### Test 2 — Duplicate Submission

```text
Run same payroll submission twice
Verify no duplicate payroll run
```

### Test 3 — External Failure

```text
Portal unavailable
Verify retry
Verify exception
```

### Test 4 — Uncertain Submission

```text
Submit
Timeout
Query external status
Verify no blind resubmission
```

### Test 5 — Payslip Mapping

```text
Download payslips
Map employee IDs
Verify correct document ownership
```

---

# 97. ACCEPTANCE CRITERIA

The module is complete only when:

- payroll periods can be created
- payroll periods can be opened and locked
- employee payroll inputs can be generated
- attendance data is consumed correctly
- leave data is consumed correctly
- shift data is consumed correctly
- approved overtime is distinguished from overtime candidates
- salary assignments are versioned
- payroll inputs are traceable
- payroll validation works
- exceptions are detected
- payroll review works
- payroll approval works
- payroll processing works
- payroll results can be imported
- results can be reconciled
- payslips can be generated
- employees can securely access their own payslips
- payroll queries work
- adjustments require authorization
- finalized payroll is protected
- source corrections trigger stale-input detection
- duplicate payroll processing is prevented
- RPA integration works
- RPA failures create exceptions
- uncertain external submissions are handled safely
- sensitive payroll data is protected
- audit logs exist
- RBAC is enforced server-side.

---

# 98. IMPLEMENTATION ORDER FOR AI CODING AGENT

## Phase 1 — Database

Create:

```text
PayrollPeriod
PayrollInput
PayrollInputVersion
SalaryStructure
EmployeeSalaryAssignment
OvertimeRecord
PayrollRun
PayrollResult
Payslip
PayrollQuery
PayrollAdjustment
```

---

## Phase 2 — Payroll Input Engine

Implement:

```text
Attendance aggregation
Leave aggregation
Shift aggregation
Overtime aggregation
Source references
Input versioning
Validation
```

---

## Phase 3 — Salary Configuration

Implement:

```text
Salary structures
Employee salary assignments
Effective dates
Salary history
Authorization
```

---

## Phase 4 — Payroll Period

Implement:

```text
Create
Open
Collect inputs
Validate
Review
Approve
Process
Finalize
```

---

## Phase 5 — Payroll Results

Implement:

```text
Run tracking
Result import
Result reconciliation
Payslip generation
```

---

## Phase 6 — Employee Self-Service

Implement:

```text
My Payroll
Payslips
Payroll Queries
Payroll Summary
```

---

## Phase 7 — RPA

Implement:

```text
Payroll export
External upload
Read-back verification
Result download
Result reconciliation
Payslip download
Exception handling
```

---

## Phase 8 — Testing

Run:

```text
Unit Tests
API Tests
RBAC Tests
Concurrency Tests
Financial Integrity Tests
RPA Tests
End-to-End Tests
```

---

# 99. STRICT RULES FOR THE AI CODING AGENT

1. Do not duplicate Employee master data.
2. Do not duplicate Attendance records.
3. Do not duplicate Leave records.
4. Do not duplicate Shift records.
5. Payroll Support consumes authoritative source modules.
6. Never fabricate attendance.
7. Never fabricate leave.
8. Never fabricate overtime.
9. Candidate overtime is not approved overtime.
10. Do not calculate salary using undocumented assumptions.
11. Do not hardcode statutory rates.
12. Do not hardcode tax rules.
13. Do not hardcode hospital-specific salary rules.
14. Salary changes require authorization.
15. Payroll adjustments require authorization.
16. Payroll approval must be separate from payroll preparation where configured.
17. Finalized payroll must be protected.
18. Source corrections must invalidate affected payroll inputs.
19. Preserve every payroll version.
20. Preserve salary history.
21. Preserve payroll results.
22. Never silently overwrite financial records.
23. Use exact monetary arithmetic; do not rely on unsafe floating-point calculations.
24. Use transactions for critical financial state changes.
25. Use idempotency for payroll processing.
26. Prevent duplicate payroll runs.
27. Prevent duplicate payslip generation.
28. Protect bank information.
29. Protect payslips.
30. Enforce RBAC on backend.
31. Employees can access only their own payroll data.
32. Use centralized Notification Service.
33. Use centralized Document Generation.
34. Use centralized Audit Logging.
35. Use centralized Exception Management.
36. Never store external payroll credentials in Robot Framework source.
37. Never allow RPA to approve payroll.
38. Never allow RPA to release payments.
39. Verify external payroll submissions.
40. Do not blindly retry uncertain financial submissions.
41. Store RPA correlation IDs.
42. Maintain complete processing history.
43. Do not silently reopen finalized payroll.
44. Do not make employment or compensation decisions autonomously.
45. Keep payroll policy configurable.
46. Integrate with Staff, Attendance, Shift, and Leave instead of duplicating them.

---

# 100. FINAL DEFINITION OF DONE

The Payroll Support module must provide this complete lifecycle:

```text
Employee
      ↓
Salary Assignment
      ↓
Payroll Period
      ↓
Attendance
      ↓
Leave
      ↓
Shift
      ↓
Approved Overtime
      ↓
Payroll Input
      ↓
Validation
      ↓
Exception Resolution
      ↓
Human Review
      ↓
Approval
      ↓
Payroll Processing
      ↓
Result Reconciliation
      ↓
Payslip Generation
      ↓
Employee Notification
      ↓
Payroll Query
      ↓
Finalization
      ↓
Audit
```

For corrections:

```text
Source Data Correction
      ↓
Affected Payroll Detection
      ↓
Payroll Input Marked STALE
      ↓
Recalculation
      ↓
Review
      ↓
Approval
      ↓
Controlled Reprocessing / Adjustment
      ↓
Audit
```

The implementation must be:

**financially safe, traceable, auditable, versioned, configurable, concurrency-safe, idempotent, RBAC-protected, integrated with Staff/Attendance/Shift/Leave, and suitable for real hospital payroll administration.**

Robot Framework should automate repetitive payroll data synchronization and reconciliation, but authorized HR/payroll personnel remain responsible for payroll approval, financial decisions, salary changes, and payment authorization.