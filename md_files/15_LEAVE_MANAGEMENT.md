# 15_LEAVE_MANAGEMENT.md

# Hospital RPA Platform — Leave Management

## 1. MODULE PURPOSE

Build a complete **Leave Management module** for the Hospital Administrative Automation Platform.

The module must manage the complete employee leave lifecycle:

- Leave policy configuration
- Leave types
- Leave eligibility
- Leave balances
- Leave accrual
- Leave requests
- Full-day leave
- Half-day leave
- Partial-day leave where configured
- Leave approval
- Leave rejection
- Leave cancellation
- Leave withdrawal
- Leave balance calculation
- Holiday/calendar integration
- Shift reconciliation
- Attendance reconciliation
- Payroll support
- Notifications
- Leave documents
- Reports
- Audit history
- RPA automation

The module is an **administrative HR/workforce module**.

It must not make employment, medical, disciplinary, or payroll decisions autonomously.

---

# 2. CORE PRINCIPLE

Leave Management owns:

> **Whether an employee has requested, been approved for, cancelled, or otherwise has an authorized leave period.**

Attendance Management owns:

> **What attendance actually occurred.**

Shift Management owns:

> **What work schedule was planned.**

Payroll Support owns:

> **How approved attendance/leave information affects payroll calculations.**

Therefore:

```text id="6k9m1p"
Leave
  ↓
Approved Leave
  ↓
Shift Reconciliation
  ↓
Attendance Reconciliation
  ↓
Payroll Input
```

Do not merge these modules into one data model.

---

# 3. LEAVE LIFECYCLE

The standard lifecycle is:

```text id="x0h1fb"
Employee
   ↓
View Leave Balance
   ↓
Select Leave Type
   ↓
Select Dates
   ↓
Enter Reason
   ↓
Attach Documents if Required
   ↓
Submit Request
   ↓
Validate
   ↓
Check Balance
   ↓
Check Shift / Existing Leave Conflicts
   ↓
Manager / HR Approval
   ↓
Approved / Rejected
   ↓
Update Leave Balance
   ↓
Update Shift / Attendance Reconciliation
   ↓
Notify Employee
   ↓
Payroll Consumes Approved Result
```

---

# 4. ACTORS

## 4.1 Employee

Can:

- view leave types available to them
- view leave balances
- view leave history
- create leave request
- select dates
- select full-day/half-day where allowed
- enter reason
- upload supporting document where required
- cancel eligible leave
- withdraw pending request
- view approval status
- receive notifications

Cannot:

- approve own leave
- edit approved leave directly
- modify leave balance
- create leave for another employee
- bypass approval workflow

---

# 5. DEPARTMENT MANAGER / SUPERVISOR

Can:

- view leave requests for authorized employees
- review requests
- approve
- reject
- request additional information
- view department leave calendar
- review leave conflicts

Cannot:

- change leave balances arbitrarily
- approve outside their authorization scope
- alter HR policy unless explicitly authorized

---

# 6. HR MANAGER

Can:

- configure leave types
- configure policies
- configure eligibility
- configure approval workflows
- manage balances
- perform authorized adjustments
- approve/review leave
- manage leave calendars
- generate reports
- resolve exceptions

---

# 7. ADMINISTRATIVE MANAGER

Can:

- view authorized leave dashboards
- monitor staffing-related leave trends
- view department leave summaries
- monitor unresolved leave exceptions

---

# 8. SYSTEM ADMIN

Can:

- configure technical settings
- manage RBAC
- configure integrations
- monitor RPA
- manage system configuration

System Admin does not automatically receive HR approval authority.

---

# 9. LEAVE TYPE

Create a configurable `LeaveType` model.

Example:

```javascript id="7odf0m"
{
  code: "CASUAL",
  name: "Casual Leave",

  description: "Short-duration personal leave",

  unit: "DAYS",

  allowHalfDay: true,
  allowPartialDay: false,

  requiresDocument: false,

  minimumNoticeHours: 0,

  maximumContinuousDays: null,

  balanceTracked: true,

  carryForwardAllowed: false,

  approvalRequired: true,

  status: "ACTIVE",

  createdBy: ObjectId,
  updatedBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

Do not hardcode specific hospital leave policies.

---

# 10. LEAVE TYPES

The hospital may configure types such as:

```text id="sjx0kz"
CASUAL
SICK
ANNUAL
EARNED
MATERNITY
PATERNITY
UNPAID
COMPENSATORY
SPECIAL
OTHER
```

These are examples only.

The application must support custom leave types.

---

# 11. LEAVE TYPE STATUS

Use:

```text id="96x4kj"
DRAFT
ACTIVE
INACTIVE
ARCHIVED
```

Inactive leave types cannot normally be used for new requests.

Historical records must remain intact.

---

# 12. LEAVE POLICY

Create:

```text id="2x8n6n"
LeavePolicy
```

Possible fields:

```javascript id="c0f0k8"
{
  leaveTypeId: ObjectId,

  employeeType: String,

  departmentId: ObjectId,

  annualEntitlement: Number,

  accrualMethod: String,

  accrualFrequency: String,

  carryForwardAllowed: Boolean,

  carryForwardLimit: Number,

  maximumBalance: Number,

  minimumNoticeHours: Number,

  maximumContinuousDays: Number,

  negativeBalanceAllowed: Boolean,

  halfDayAllowed: Boolean,

  partialDayAllowed: Boolean,

  documentationRequiredAfterDays: Number,

  approvalWorkflowId: ObjectId,

  effectiveFrom: Date,
  effectiveTo: Date,

  status: String
}
```

Policy must be versioned.

---

# 13. POLICY VERSIONING

When a leave policy changes:

Do not modify historical policy behavior.

Example:

```text id="9omr0n"
Policy V1:
Annual entitlement = 18 days

Policy V2:
Annual entitlement = 20 days
```

Existing records should remain associated with the applicable policy version.

---

# 14. LEAVE BALANCE

Create:

```text id="5qpxjh"
LeaveBalance
```

Recommended structure:

```javascript id="z8ij82"
{
  employeeId: ObjectId,

  leaveTypeId: ObjectId,

  year: Number,

  openingBalance: Number,

  accrued: Number,

  carriedForward: Number,

  used: Number,

  pending: Number,

  adjusted: Number,

  available: Number,

  closingBalance: Number,

  lastCalculatedAt: Date,

  updatedBy: ObjectId
}
```

---

# 15. BALANCE CALCULATION

A conceptual calculation:

```text id="m5f6ro"
Available =
Opening
+ Accrued
+ Carried Forward
+ Adjustments
- Used
- Reserved Pending Leave
```

However, exact calculation must follow the configured hospital policy.

Do not assume pending leave must always reduce available balance.

Make this behavior configurable.

---

# 16. LEAVE LEDGER

Create a `LeaveBalanceTransaction` model.

Purpose:

Provide a complete financial-style ledger for leave balances.

Example:

```javascript id="2bgbh8"
{
  employeeId,
  leaveTypeId,

  transactionType:
    "OPENING_BALANCE"
    | "ACCRUAL"
    | "CARRY_FORWARD"
    | "LEAVE_USED"
    | "LEAVE_CANCELLED"
    | "ADJUSTMENT"
    | "EXPIRY",

  amount,

  referenceType,
  referenceId,

  balanceBefore,
  balanceAfter,

  reason,

  createdBy,
  createdAt
}
```

Never update balances without recording the corresponding transaction where the balance is tracked.

---

# 17. LEAVE REQUEST

Create:

```text id="y9kzz6"
LeaveRequest
```

Example:

```javascript id="8gq9m3"
{
  requestNumber: "LR-2026-00125",

  employeeId: ObjectId,

  leaveTypeId: ObjectId,

  startDate: Date,
  endDate: Date,

  duration: Number,

  unit: "DAYS",

  dayType: "FULL_DAY",

  partialStartTime: null,
  partialEndTime: null,

  reason: String,

  documents: [],

  status: "PENDING",

  submittedAt: Date,

  currentApproverId: ObjectId,

  approvedBy: ObjectId,
  approvedAt: Date,

  rejectedBy: ObjectId,
  rejectedAt: Date,

  rejectionReason: String,

  cancelledAt: Date,
  cancellationReason: String,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 18. LEAVE REQUEST STATUS

Use:

```text id="zkhf87"
DRAFT
PENDING
UNDER_REVIEW
APPROVED
REJECTED
CANCEL_REQUESTED
CANCELLED
WITHDRAWN
EXPIRED
```

Recommended flow:

```text id="1fdfh4"
DRAFT
 ↓
PENDING
 ↓
UNDER_REVIEW
 ↓
APPROVED
```

or:

```text id="8z3u4b"
PENDING
 ↓
REJECTED
```

---

# 19. FULL-DAY LEAVE

Example:

```text id="i5k6yx"
Start:
10-Oct-2026

End:
12-Oct-2026

Duration:
3 days
```

The system should calculate duration using the applicable calendar/shift rules.

Do not simply count calendar days if hospital policy excludes certain days.

---

# 20. HALF-DAY LEAVE

Support:

```text id="5e3q1v"
FIRST_HALF
SECOND_HALF
```

Example:

```text id="q3w5m8"
10-Oct-2026
Morning half
```

Whether half-day is allowed depends on LeaveType configuration.

---

# 21. PARTIAL-DAY LEAVE

If enabled:

```text id="7dy5ei"
Start:
14:00

End:
17:00
```

Store exact requested period.

The system must validate that the duration is within the employee's applicable shift/work schedule.

---

# 22. LEAVE DURATION CALCULATION

Leave duration must consider:

- employee schedule
- shift assignment
- holiday calendar
- weekly off
- leave policy
- full-day/half-day
- partial-day configuration

Do not create a universal assumption such as:

```text
1 calendar day = 1 leave day
```

for every hospital policy.

---

# 23. OVERLAPPING LEAVE

The system must detect:

```text id="g7a5tu"
Existing:
10-Oct → 12-Oct

New:
11-Oct → 13-Oct
```

Result:

```text id="8b8l5s"
LEAVE_OVERLAP
```

Do not allow duplicate overlapping approved leave unless explicitly supported by policy.

---

# 24. MULTIPLE LEAVE TYPES ON SAME DATE

Example:

```text id="4zyh3g"
Sick Leave:
10-Oct

Casual Leave:
10-Oct
```

This should normally be rejected or sent to human review.

Do not silently choose one.

---

# 25. SHIFT CONFLICT

Integrate with Shift Management.

Example:

```text id="6jv3n8"
Approved Shift:
10-Oct
09:00–18:00

Leave:
10-Oct
Full Day
```

This is valid if approved.

If leave is rejected:

```text id="af7ysc"
Roster remains unchanged.
```

---

# 26. PARTIAL LEAVE + SHIFT

Example:

```text id="km2c6o"
Shift:
09:00–18:00

Leave:
09:00–13:00

Attendance:
13:00–18:00
```

The system should reconcile:

```text id="n4pk6x"
Partial Leave
+
Partial Attendance
```

without marking the employee absent for the entire day.

---

# 27. LEAVE AND ATTENDANCE RECONCILIATION

Attendance must consume approved leave information.

Example:

```text id="e3u7vo"
Approved Leave:
10-Oct

Attendance:
No Punch
```

Result:

```text id="d2z5ko"
ON_LEAVE
```

If:

```text id="g6qrr1"
Approved Leave:
10-Oct

Attendance:
09:00–18:00
```

System should create a:

```text id="hpl3v6"
LEAVE_ATTENDANCE_CONFLICT
```

for review according to policy.

Do not silently cancel either record.

---

# 28. LEAVE AND SHIFT RECONCILIATION

If an employee receives approved leave after a shift has already been published:

```text id="3d4m0m"
Shift:
10-Oct Morning

Leave:
10-Oct Approved
```

Shift Management must flag or reconcile the assignment.

Do not silently delete the shift history.

---

# 29. LEAVE REQUEST VALIDATION

Before submission, validate:

- employee exists
- employee is active/eligible
- leave type active
- policy applicable
- date range valid
- duration valid
- balance sufficient if required
- notice period
- maximum continuous duration
- existing leave overlap
- shift conflict
- required documents
- approval workflow exists

---

# 30. INSUFFICIENT BALANCE

Example:

```text id="y0m6c3"
Available:
2 days

Requested:
5 days
```

Possible outcomes depend on policy:

```text id="e2gkz8"
REJECT
```

or:

```text id="ly3yn4"
ALLOW_WITHOUT_PAY
```

or:

```text id="xw7e4b"
ALLOW_NEGATIVE_BALANCE
```

Do not invent the rule.

Use configured policy.

---

# 31. DOCUMENT REQUIREMENTS

Some leave types may require documents.

Example:

```text id="vpgv13"
Leave Type:
SICK

Policy:
Document required after 2 days
```

If the employee requests:

```text id="xv1p5k"
3 days
```

system requires supporting documentation.

If missing:

```text id="c0i1br"
Cannot submit until required document is provided.
```

unless the configured workflow allows submission followed by document review.

---

# 32. DOCUMENT MODEL

Do not store large files directly inside `LeaveRequest` documents unless explicitly required.

Use centralized document storage.

Reference:

```javascript id="t2mkw8"
{
  documentId,
  documentType,
  uploadedBy,
  uploadedAt
}
```

Use Document Generation/Document Management infrastructure.

---

# 33. LEAVE APPROVAL WORKFLOW

Standard:

```text id="2zj6k6"
Employee
 ↓
Submit
 ↓
Manager
 ↓
Approve / Reject
 ↓
HR if required
 ↓
Final Approval
 ↓
Balance Update
 ↓
Notification
```

Approval steps must be configurable.

---

# 34. MULTI-LEVEL APPROVAL

Support configurable workflows.

Example:

```text id="3l8gcz"
Leave <= 2 days
→ Manager

Leave > 2 days
→ Manager
→ HR

Special Leave
→ Manager
→ HR
```

These are examples only.

The hospital administrator configures the actual policy.

---

# 35. APPROVAL RULE

The requester cannot approve their own request.

Backend must enforce:

```text id="4a2zgp"
request.employeeId !== reviewer.employeeId
```

where applicable.

Do not rely only on UI hiding the approval button.

---

# 36. APPROVAL COMMENTS

Reviewer may enter:

```text id="m4tr0d"
Approval Comment
```

or:

```text id="4u5p2j"
Rejection Reason
```

Rejection should require a reason where configured.

---

# 37. LEAVE APPROVAL RESULT

On approval:

1. Update request status.
2. Update leave ledger.
3. Update balance.
4. Trigger Shift reconciliation.
5. Trigger Attendance reconciliation.
6. Notify employee.
7. Create audit event.
8. Make approved leave available to Payroll Support.

Use transaction/session where required so critical state changes do not partially succeed.

---

# 38. LEAVE REJECTION

On rejection:

```text id="f5q7al"
LeaveRequest.status = REJECTED
```

Do not consume the balance.

Notify employee.

Store:

- reviewer
- timestamp
- reason

---

# 39. WITHDRAWAL OF PENDING REQUEST

Employee may withdraw:

```text id="u7f7u2"
PENDING
UNDER_REVIEW
```

if policy permits.

Result:

```text id="2q2g76"
WITHDRAWN
```

No leave balance should be consumed.

---

# 40. CANCELLATION OF APPROVED LEAVE

Approved leave may require a cancellation workflow.

Employee:

```text id="3t7z3w"
Cancel Approved Leave
```

System:

```text id="5wh2b7"
Cancellation Request
 ↓
Review
 ↓
Approve
 ↓
Leave Cancelled
 ↓
Balance Reversed
 ↓
Shift Reconciliation
 ↓
Attendance Reconciliation
 ↓
Notify
```

Do not directly delete the leave record.

---

# 41. LEAVE CANCELLATION MODEL

Create:

```text id="t3w5lh"
LeaveCancellationRequest
```

Fields:

```javascript id="wh6h7c"
{
  leaveRequestId,
  employeeId,

  reason,

  status,

  requestedBy,
  requestedAt,

  reviewedBy,
  reviewedAt,

  reviewerComments
}
```

---

# 42. BALANCE REVERSAL

If approved leave was later cancelled:

```text id="3h1vdr"
Used:
3 days

Cancellation:
3 days returned
```

Create a ledger transaction:

```text id="0wq8k5"
LEAVE_CANCELLED
+3 days
```

Never simply overwrite the balance without a ledger entry.

---

# 43. LEAVE ADJUSTMENT

Authorized HR users may perform manual balance adjustments.

Example:

```text id="xv4m4v"
+2 days
Reason:
Approved HR correction
```

Mandatory:

- adjustment amount
- reason
- authorized user
- timestamp
- reference

Do not allow employees to adjust balances.

---

# 44. LEAVE BALANCE ADJUSTMENT APPROVAL

Where required, use:

```text id="j9f7e5"
Adjustment Requested
 ↓
HR Review
 ↓
Approval
 ↓
Ledger Entry
 ↓
Balance Update
```

RPA cannot independently approve adjustments.

---

# 45. ACCRUAL

Support configurable accrual.

Examples:

```text id="h7f4h8"
MONTHLY
QUARTERLY
YEARLY
MANUAL
```

The exact formula is policy-driven.

Example:

```text id="n6r7ud"
Annual entitlement = 18
Monthly accrual = 1.5
```

Do not assume all leave types accrue monthly.

---

# 46. ACCRUAL JOB

A scheduled job may:

```text id="6e4e1c"
Find eligible employees
      ↓
Find applicable policy
      ↓
Calculate accrual
      ↓
Create ledger transaction
      ↓
Update balance
      ↓
Audit
```

If policy is ambiguous:

```text id="1qk5y2"
ExceptionCase
```

must be created.

Do not invent accrual values.

---

# 47. CARRY FORWARD

If enabled:

```text id="7v0qon"
Previous Year Balance
      ↓
Apply Carry-Forward Limit
      ↓
Create Carry-Forward Transaction
      ↓
New Year Balance
```

Example:

```text id="q08ks8"
Available:
12 days

Carry-forward limit:
5 days

Carry-forward:
5 days
```

This is only an example.

Use configured policy.

---

# 48. LEAVE EXPIRY

If policy supports expiry:

```text id="4g8q3v"
Unused leave
      ↓
Expiry Date
      ↓
Expire eligible amount
      ↓
Ledger Transaction
```

Never delete expired leave history.

---

# 49. HOLIDAY CALENDAR

Create/configure:

```text id="t1kg7v"
HolidayCalendar
```

Fields:

```javascript id="r0px7a"
{
  name,
  date,
  holidayName,
  applicableDepartments,
  applicableEmployeeTypes,
  status
}
```

Do not assume a holiday applies to every hospital employee.

Some departments may operate normally.

---

# 50. LEAVE CALENDAR

Create:

```text id="v5q7td"
/leave/calendar
```

Authorized managers see:

```text id="6r5f4e"
Employee
Leave Type
Start
End
Status
Department
```

Use filters:

```text id="2f0h6g"
Department
Leave Type
Status
Date
Employee
```

---

# 51. EMPLOYEE LEAVE CALENDAR

Employee sees only their own leave.

Route:

```text id="xj3t9o"
/my-leave
```

Show:

```text id="o8h7h1"
Leave Balance
Upcoming Leave
Past Leave
Pending Requests
Rejected Requests
Cancelled Requests
```

---

# 52. LEAVE DASHBOARD

Route:

```text id="l3f0nm"
/leave
```

Cards:

```text id="0ypz1c"
Pending Requests
Approved Today
Employees On Leave
Upcoming Leave
Low Balance
Pending Cancellations
Exceptions
```

HR dashboard may show organization-wide statistics.

---

# 53. LEAVE REQUEST FORM

Route:

```text id="bqg3uo"
/my-leave/request
```

Fields:

```text id="t4h7js"
Leave Type
Start Date
End Date
Day Type
Partial Start
Partial End
Reason
Supporting Document
```

Display:

```text id="q1jz2q"
Available Balance
Requested Duration
Remaining Balance
```

Do not reveal unauthorized employee information.

---

# 54. REQUEST PREVIEW

Before submission:

```text id="3y8j4v"
Leave Type:
Annual Leave

Dates:
10-Oct → 12-Oct

Duration:
3 days

Available:
8 days

After Approval:
5 days
```

Then:

```text id="0c4o6q"
Submit Request
```

---

# 55. APPROVAL QUEUE

Route:

```text id="x1l5di"
/leave/approvals
```

Columns:

```text id="5z0k7s"
Request ID
Employee
Department
Leave Type
Dates
Duration
Reason
Submitted
Status
```

Actions:

```text id="m0i9sr"
View
Approve
Reject
Request Information
```

---

# 56. LEAVE DETAIL PAGE

Route:

```text id="n4g8ye"
/leave/:id
```

Show:

### Employee

```text id="y3p6zk"
Employee ID
Name
Department
Designation
```

### Leave

```text id="1t5r8j"
Type
Dates
Duration
Day Type
Reason
```

### Balance

```text id="5f1m3r"
Before
Pending
After Approval
```

### Workflow

```text id="8q5yqf"
Submitted
Reviewed
Approved/Rejected
```

### Documents

Show authorized attachments.

---

# 57. LEAVE HISTORY

Employee history:

```text id="xq5h7u"
Date
Type
Duration
Status
Approver
```

HR can view organization-level history subject to permissions.

---

# 58. NOTIFICATIONS

Use centralized Notification Service.

Events:

```text id="f1zq7n"
Leave Request Submitted
Leave Request Approved
Leave Request Rejected
Leave Information Requested
Leave Cancellation Requested
Leave Cancellation Approved
Leave Cancellation Rejected
Leave Balance Updated
Leave Expiry Reminder
Upcoming Approved Leave
```

Channels:

```text id="q1i5gp"
In-App
Email
SMS
```

according to configuration.

Notification failure must not alter leave state.

---

# 59. LEAVE REMINDER

Optional reminder:

```text id="e6q2p8"
Your approved leave begins tomorrow.

10-Oct-2026
Annual Leave
```

Timing is configurable.

---

# 60. DOCUMENT GENERATION

Possible documents:

```text id="d7c5rr"
Leave Approval Letter
Leave Rejection Notice
Leave Balance Statement
Leave History
Department Leave Report
```

Use centralized Document Generation.

---

# 61. RPA ROLE

Robot Framework may automate:

- importing leave data
- synchronizing approved leave with external HR systems
- downloading leave reports
- submitting approved leave to external systems
- reconciliation
- notifications
- leave balance synchronization
- exception reporting

RPA must not:

- approve leave
- reject leave
- alter leave balance without authorized workflow
- fabricate leave
- make HR decisions
- override policy

---

# 62. RPA LEAVE IMPORT

Example:

```text id="yx1h4d"
External HR System
       ↓
Robot Framework
       ↓
Download Leave Data
       ↓
Validate Employee
       ↓
Validate Leave Type
       ↓
Validate Dates
       ↓
Submit API
       ↓
Verify Result
       ↓
Record RPA Execution
```

---

# 63. RPA EXTERNAL LEAVE SYNC

Example:

```text id="5x5j8v"
Hospital Leave
       ↓
Approved
       ↓
RPA
       ↓
External HR System
       ↓
Submit
       ↓
Read Back
       ↓
Compare
```

If mismatch:

```text id="g4l6j2"
ExceptionCase
```

---

# 64. RPA ROBOT STRUCTURE

Use:

```text id="q8f0d4"
robot/
├── resources/
│   ├── common.resource
│   ├── auth.resource
│   ├── api.resource
│   └── notifications.resource
│
├── keywords/
│   ├── leave_keywords.resource
│   ├── balance_keywords.resource
│   ├── approval_keywords.resource
│   └── sync_keywords.resource
│
├── tests/
│   ├── leave_import.robot
│   ├── leave_sync.robot
│   ├── leave_reconciliation.robot
│   └── leave_exception.robot
│
├── portals/
│   └── external_hr_portal.resource
│
└── results/
```

---

# 65. RPA KEYWORDS

Implement:

```text id="z6l3pd"
Login To External HR System
Download Leave Report
Read Leave File
Validate Employee
Validate Leave Type
Validate Leave Dates
Import Leave
Verify Leave Import
Sync Approved Leave
Verify External Leave
Reconcile Leave
Create Leave Exception
Send Leave Notification
Capture Evidence
Record RPA Execution
```

---

# 66. RPA RESULT CONTRACT

Example:

```json id="9qug0c"
{
  "success": true,
  "jobType": "LEAVE_SYNC",
  "correlationId": "RPA-LEAVE-20261007-0001",
  "recordsRead": 150,
  "recordsProcessed": 148,
  "recordsSucceeded": 146,
  "recordsFailed": 2,
  "startedAt": "2026-10-07T06:00:00Z",
  "completedAt": "2026-10-07T06:06:22Z"
}
```

Store in:

```text id="6df5qk"
RPAJob
RPAExecution
```

---

# 67. RPA SECURITY

Never place external credentials in:

```text id="h0wq7r"
Robot source code
Git repository
Committed .env
Test files
Screenshots
Logs
```

Use secret-managed credentials.

Mask sensitive values.

---

# 68. RPA FAILURE

If external system fails:

```text id="q2s8m9"
Attempt
 ↓
Retry
 ↓
Failure
 ↓
ExceptionCase
 ↓
HR Notification
```

Do not mark synchronization successful.

---

# 69. API DESIGN

Base:

```text id="q4h8y2"
/api/leave
```

Leave types:

```http id="s0t2la"
GET    /api/leave/types
POST   /api/leave/types
GET    /api/leave/types/:id
PATCH  /api/leave/types/:id
```

Policies:

```http id="7a7h0j"
GET    /api/leave/policies
POST   /api/leave/policies
PATCH  /api/leave/policies/:id
```

Requests:

```http id="u8w7x0"
GET    /api/leave/requests
POST   /api/leave/requests
GET    /api/leave/requests/:id
POST   /api/leave/requests/:id/submit
POST   /api/leave/requests/:id/approve
POST   /api/leave/requests/:id/reject
POST   /api/leave/requests/:id/withdraw
```

Cancellation:

```http id="t9g0o8"
POST /api/leave/requests/:id/cancellation
POST /api/leave/cancellations/:id/approve
POST /api/leave/cancellations/:id/reject
```

Balances:

```http id="c4h3z2"
GET /api/leave/balances
GET /api/leave/balances/:employeeId
```

Ledger:

```http id="3n2j7m"
GET /api/leave/ledger/:employeeId
```

Reports:

```http id="2y8r6w"
GET /api/leave/reports/summary
GET /api/leave/reports/usage
GET /api/leave/reports/balance
GET /api/leave/reports/department
```

Employee self-service:

```http id="h4q2d9"
GET /api/me/leave
GET /api/me/leave/balances
POST /api/me/leave/requests
```

---

# 70. BACKEND STRUCTURE

Implement:

```text id="h3y6pn"
server/
├── models/
│   ├── LeaveType.js
│   ├── LeavePolicy.js
│   ├── LeaveBalance.js
│   ├── LeaveBalanceTransaction.js
│   ├── LeaveRequest.js
│   ├── LeaveCancellationRequest.js
│   └── HolidayCalendar.js
│
├── controllers/
│   └── leaveController.js
│
├── services/
│   ├── leaveService.js
│   ├── leaveValidationService.js
│   ├── leaveBalanceService.js
│   ├── leaveApprovalService.js
│   ├── leaveAccrualService.js
│   ├── leaveReconciliationService.js
│   └── leaveReportService.js
│
├── routes/
│   └── leaveRoutes.js
│
├── validators/
│   └── leaveValidators.js
│
└── jobs/
    ├── leaveAccrualJob.js
    └── leaveExpiryJob.js
```

---

# 71. FRONTEND STRUCTURE

Use:

```text id="5kgz0w"
client/src/
├── portals/
│   ├── employee/
│   │   └── leave/
│   │       ├── pages/
│   │       │   ├── MyLeave.jsx
│   │       │   ├── LeaveRequest.jsx
│   │       │   ├── LeaveBalances.jsx
│   │       │   └── LeaveHistory.jsx
│   │       │
│   │       └── components/
│   │           ├── LeaveBalanceCard.jsx
│   │           ├── LeaveRequestForm.jsx
│   │           ├── LeaveCalendar.jsx
│   │           └── LeaveHistoryTable.jsx
│   │
│   └── administration/
│       └── leave/
│           ├── pages/
│           │   ├── LeaveDashboard.jsx
│           │   ├── LeaveApprovals.jsx
│           │   ├── LeaveCalendar.jsx
│           │   ├── LeavePolicies.jsx
│           │   ├── LeaveTypes.jsx
│           │   └── LeaveReports.jsx
│           │
│           └── components/
│               ├── ApprovalPanel.jsx
│               ├── LeavePolicyForm.jsx
│               ├── LeaveCalendarGrid.jsx
│               └── LeaveReportFilters.jsx
```

---

# 72. MONGODB INDEXES

Recommended:

```javascript id="z7a8qp"
LeaveRequest:
{
  employeeId: 1,
  startDate: 1,
  endDate: 1
}
```

```javascript id="s9p1fc"
LeaveRequest:
{
  status: 1,
  submittedAt: -1
}
```

```javascript id="2bq2p4"
LeaveRequest:
{
  employeeId: 1,
  status: 1
}
```

```javascript id="7v8u2w"
LeaveBalance:
{
  employeeId: 1,
  leaveTypeId: 1,
  year: 1
}
```

Use a suitable unique index for:

```text id="d1v3ru"
employeeId + leaveTypeId + year
```

where the business model guarantees one current balance per combination.

Ledger:

```javascript id="6c5r2m"
LeaveBalanceTransaction:
{
  employeeId: 1,
  leaveTypeId: 1,
  createdAt: -1
}
```

---

# 73. AUDIT LOGGING

Record:

```text id="x5f6j0"
Leave Type Created
Leave Type Updated
Policy Created
Policy Updated
Balance Created
Balance Adjusted
Accrual Applied
Leave Requested
Leave Submitted
Leave Approved
Leave Rejected
Leave Withdrawn
Cancellation Requested
Cancellation Approved
Cancellation Rejected
Leave Expired
RPA Sync Executed
External Sync Failed
```

Example:

```javascript id="w2n1z6"
{
  actorUserId,
  action: "LEAVE_APPROVED",
  entityType: "LeaveRequest",
  entityId,
  before,
  after,
  reason,
  timestamp,
  correlationId
}
```

---

# 74. HUMAN-IN-THE-LOOP EXCEPTIONS

Create `ExceptionCase` for:

```text id="v5q9r4"
Insufficient Balance
Leave Overlap
Leave Attendance Conflict
Leave Shift Conflict
Missing Document
Invalid Employee
Invalid Leave Type
Policy Not Found
Ambiguous Policy
External HR Failure
RPA Failure
Balance Calculation Error
Duplicate Import
```

Statuses:

```text id="w3l8qp"
OPEN
ASSIGNED
IN_REVIEW
WAITING_FOR_INFORMATION
RESOLVED
REJECTED
CANCELLED
```

---

# 75. LEAVE BALANCE SAFETY

Balance calculations are sensitive.

Use:

- database transactions
- idempotency
- ledger entries
- concurrency control

Prevent:

```text id="5h2l7s"
Two approvals
for the same leave
```

from consuming the balance twice.

---

# 76. DOUBLE APPROVAL PROTECTION

Before approving:

```text id="j8x0s6"
Verify status == PENDING/UNDER_REVIEW
```

If already approved:

```text id="m9j0fz"
Return:
Request already processed.
```

Do not apply the balance transaction again.

---

# 77. CONCURRENT LEAVE REQUESTS

Example:

```text id="n6j8cz"
Balance:
5 days

Request A:
3 days

Request B:
3 days
```

Two users/processes must not cause an invalid balance.

Use appropriate transaction/locking strategy.

If pending requests reserve balance, enforce the configured reservation rule atomically.

---

# 78. EMPLOYEE STATUS INTEGRATION

Integrate with Staff Management.

Example:

```text id="m2k4r1"
ACTIVE
→ eligible

TERMINATED
→ no future leave requests

ON_LEAVE
→ existing leave data remains authoritative
```

Do not delete leave history when employee is terminated.

---

# 79. SHIFT MANAGEMENT INTEGRATION

Shift Management provides:

```text id="j7z8f1"
Scheduled Shift
Shift Date
Start Time
End Time
```

Leave Management provides:

```text id="g8x9t0"
Approved Leave
```

The two systems reconcile conflicts.

Neither module should silently overwrite the other's historical records.

---

# 80. ATTENDANCE INTEGRATION

Attendance consumes approved leave.

Examples:

```text id="5x3k4a"
Approved full-day leave
→ ON_LEAVE
```

```text id="7v1q3r"
Approved half-day leave
+
attendance for remaining half
→ PARTIAL_LEAVE / PRESENT
```

according to configured rules.

---

# 81. PAYROLL INTEGRATION

Payroll Support may consume:

```text id="u7g8m2"
Approved Paid Leave
Approved Unpaid Leave
Leave Days
Leave Type
Leave Period
```

Leave Management does not calculate salary.

Do not directly update payroll amounts.

---

# 82. REPORTS

Create:

### Leave Summary

```text id="5y3f2p"
Employee
Leave Type
Approved Days
Pending Days
Used Days
Balance
```

### Department Leave Report

```text id="g6v2x4"
Department
Employees
On Leave Today
Upcoming Leave
```

### Leave Utilization

```text id="a2p7j9"
Leave Type
Total Used
Total Approved
Total Cancelled
```

### Leave Balance Report

```text id="h5q8r0"
Employee
Leave Type
Opening
Accrued
Used
Available
```

### Exception Report

```text id="v2m4n6"
Exception
Employee
Date
Status
Assigned To
```

---

# 83. EXPORTS

Authorized users can export:

```text id="k7t8p2"
CSV
Excel
PDF
```

Apply:

- RBAC
- department scope
- date filters
- employee scope

Do not allow employees to export department-wide leave data.

---

# 84. LEAVE SEARCH

Support:

```text id="f7h4q2"
Request ID
Employee ID
Employee Name
Leave Type
Department
Status
Date Range
```

Use server-side pagination.

---

# 85. TIMEZONE

Use hospital-configured timezone.

For the Indian deployment:

```text id="d2f6s8"
Asia/Kolkata
```

may be configured.

Store timestamps consistently and render according to configured timezone.

Do not use the browser's arbitrary timezone for approval timestamps or leave calculations.

---

# 86. DATA RETENTION

Do not delete historical leave requests merely because they are old.

Retain:

- requests
- approvals
- rejections
- cancellations
- balance ledger
- policy versions
- audit history

according to hospital retention policy.

---

# 87. SEED DATA

Create sample leave types:

```text id="9g1n2b"
CASUAL
SICK
ANNUAL
UNPAID
```

Create sample employees from Staff Management.

Create:

```text id="5j2p9d"
leave balances
leave requests
approved leave
rejected leave
pending leave
cancelled leave
leave conflict
missing-document case
```

---

# 88. DEMO SCENARIO

Employee:

```text id="z1h4m7"
EMP00125
Rahul Shah
Administration
```

Balance:

```text id="r5c6v8"
Annual Leave:
10 days
```

Employee requests:

```text id="y7p8q2"
10-Oct-2026 → 12-Oct-2026
3 days
```

System validates:

```text id="s2d4f6"
Employee exists
Leave type active
Balance sufficient
No overlapping leave
Policy applicable
```

Request:

```text id="b3n5m7"
PENDING
```

Manager approves.

System:

```text id="k8q1w4"
Leave = APPROVED
Used = +3
Available = 7
```

Shift Management is notified/reconciles the affected shifts.

Attendance later sees:

```text id="m6r2t9"
10-Oct → ON_LEAVE
11-Oct → ON_LEAVE
12-Oct → ON_LEAVE
```

Employee receives notification.

---

# 89. DEMO HALF-DAY SCENARIO

Employee:

```text id="q4w7e9"
EMP00126
```

Shift:

```text id="r2t5y8"
09:00–18:00
```

Leave:

```text id="u1i4o7"
FIRST_HALF
```

Attendance:

```text id="p3a6s9"
13:00–18:00
```

System reconciles:

```text id="d8f1g4"
Morning:
ON_LEAVE

Afternoon:
PRESENT
```

according to configured policy.

---

# 90. TESTING — UNIT TESTS

Test:

```text id="n8b2v5"
Leave request creation
Leave duration calculation
Leave overlap detection
Balance validation
Approval
Rejection
Withdrawal
Cancellation
Balance reversal
Accrual
Carry-forward
Expiry
Ledger creation
Shift reconciliation
Attendance reconciliation
```

---

# 91. API TESTS

Test:

```text id="m5c7x1"
POST /api/leave/requests
POST /api/leave/requests/:id/approve
POST /api/leave/requests/:id/reject
POST /api/leave/requests/:id/withdraw
POST /api/leave/requests/:id/cancellation
POST /api/leave/cancellations/:id/approve
GET /api/leave/balances
GET /api/leave/ledger/:employeeId
```

Test unauthorized access.

---

# 92. RBAC TESTS

Verify:

```text id="v6b8n2"
Employee:
can view own leave

Employee:
cannot approve leave

Manager:
can approve authorized employees

HR:
can manage policies

System Admin:
cannot approve unless explicitly assigned permission
```

---

# 93. FRONTEND TESTS

Test:

- leave dashboard
- balance display
- request form
- date selection
- half-day selection
- document upload
- approval queue
- rejection
- cancellation
- leave calendar
- filters
- responsive layout
- RBAC

---

# 94. RPA TESTS

Create:

### Test 1 — Import Leave

```text id="k4m7p9"
Login
Download
Validate
Import
Verify
```

### Test 2 — Duplicate Import

```text id="n2q5r8"
Import same data twice
Verify no duplicate leave
```

### Test 3 — Unknown Employee

```text id="t6y9u1"
Import unknown Employee ID
Verify exception
```

### Test 4 — External Sync

```text id="i3o6p9"
Sync approved leave
Read back
Compare
```

### Test 5 — External Failure

```text id="a7s0d2"
External system unavailable
Verify retry
Verify exception
```

---

# 95. ACCEPTANCE CRITERIA

The module is complete only when:

- leave types can be configured
- leave policies can be configured
- policy versions are preserved
- leave balances work
- leave ledger works
- leave requests work
- full-day leave works
- half-day leave works
- partial-day leave works where enabled
- overlap detection works
- balance validation works
- document requirements work
- approval workflow works
- rejection workflow works
- withdrawal works
- approved leave cancellation works
- balance reversal works
- accrual works
- carry-forward works where configured
- expiry works where configured
- holiday integration works
- shift integration works
- attendance integration works
- payroll integration works
- notifications work
- documents work
- reports work
- exports work
- RPA synchronization works
- RPA failures create exceptions
- balance changes are auditable
- duplicate approvals cannot consume balance twice
- RBAC is enforced on backend
- employee cannot access another employee's leave
- RPA cannot approve leave
- historical leave data cannot be silently deleted.

---

# 96. IMPLEMENTATION ORDER FOR AI CODING AGENT

## Phase 1 — Database

Create:

```text id="b5m7n9"
LeaveType
LeavePolicy
LeaveBalance
LeaveBalanceTransaction
LeaveRequest
LeaveCancellationRequest
HolidayCalendar
```

---

## Phase 2 — Leave Policy Engine

Implement:

```text id="c8d1f4"
Eligibility
Leave types
Balance rules
Accrual
Carry-forward
Expiry
Documentation rules
Approval workflow
```

---

## Phase 3 — Leave Requests

Implement:

```text id="e2g5h8"
Create
Validate
Submit
Approve
Reject
Withdraw
Cancel
```

---

## Phase 4 — Balance Engine

Implement:

```text id="j1k4l7"
Balance calculation
Ledger
Accrual
Adjustments
Carry-forward
Expiry
Concurrency protection
```

---

## Phase 5 — Frontend

Build:

```text id="m3n6p9"
My Leave
Leave Request
Leave Balance
Leave History
Approval Queue
Leave Calendar
Policies
Reports
```

---

## Phase 6 — Integrations

Connect:

```text id="q2r5t8"
Staff
Shift
Attendance
Payroll
Notification
Documents
Audit
Exception
```

---

## Phase 7 — RPA

Implement:

```text id="u4v7w0"
External Leave Import
Leave Sync
Read-Back Verification
Reconciliation
Exception Handling
Notifications
```

---

## Phase 8 — Testing

Run:

```text id="x1y4z7"
Unit Tests
API Tests
RBAC Tests
Frontend Tests
Concurrency Tests
RPA Tests
End-to-End Tests
```

---

# 97. STRICT RULES FOR THE AI CODING AGENT

1. Do not duplicate Employee data.
2. Use Employee ID from Staff Management.
3. Leave Management owns approved leave records.
4. Shift Management owns schedules.
5. Attendance Management owns actual attendance.
6. Payroll Support owns payroll calculations.
7. Do not directly modify attendance from Leave Management.
8. Do not directly modify payroll amounts.
9. Do not allow employees to approve their own leave.
10. Do not allow employees to modify balances.
11. Preserve leave history.
12. Preserve balance ledger history.
13. Never silently delete approved leave.
14. Use cancellation workflows.
15. Do not hardcode leave policies.
16. Do not assume every employee has the same entitlement.
17. Do not assume weekends are always excluded.
18. Do not assume holidays apply to every department.
19. Do not assume pending leave always consumes balance.
20. Do not approve leave automatically merely because balance exists.
21. Do not reject leave automatically merely because an exception exists unless policy explicitly requires it.
22. Use centralized Notification Service.
23. Use centralized Document Generation.
24. Use centralized Audit Logging.
25. Use centralized Exception Management.
26. Enforce authorization on backend APIs.
27. Do not trust employee IDs supplied by the frontend.
28. Protect balance updates with transactions/concurrency controls.
29. Make accrual jobs idempotent.
30. Make RPA imports idempotent.
31. Never place external credentials in Robot Framework code.
32. Store RPA correlation IDs.
33. Verify external synchronization where possible.
34. Do not allow RPA to approve or reject leave.
35. Do not make employment, disciplinary, medical, or financial decisions autonomously.
36. Preserve historical policy versions.
37. Keep the module fully integrated with the existing MERN architecture.

---

# 98. FINAL DEFINITION OF DONE

The complete Leave Management lifecycle must work as:

```text id="z7a2c5"
Leave Policy
      ↓
Leave Type
      ↓
Employee Eligibility
      ↓
Leave Balance
      ↓
Employee Request
      ↓
Validation
      ↓
Approval
      ↓
Balance Ledger
      ↓
Shift Reconciliation
      ↓
Attendance Reconciliation
      ↓
Notification
      ↓
Payroll Input
      ↓
Reporting
      ↓
Audit
```

For cancellation:

```text id="k4m8p2"
Approved Leave
      ↓
Cancellation Request
      ↓
Human Approval
      ↓
Balance Reversal
      ↓
Shift Reconciliation
      ↓
Attendance Reconciliation
      ↓
Notification
      ↓
Audit
```

The implementation must be:

**policy-driven, auditable, versioned, secure, concurrency-safe, RBAC-protected, idempotent, integrated with Staff/Shift/Attendance/Payroll, and suitable for real hospital administrative operations.**

Robot Framework should automate repetitive leave synchronization, import, reconciliation, and reporting tasks, while authorized hospital personnel remain responsible for leave approvals and HR decisions.