# 13_ATTENDANCE_MANAGEMENT.md

# Hospital RPA Platform — Attendance Management

## 1. MODULE PURPOSE

Build a complete **Attendance Management module** for the Hospital Administrative Automation Platform.

The module must manage, import, reconcile, correct, review, and report employee attendance while maintaining a complete audit trail.

The module must integrate with:

- Staff Management
- Shift Management
- Leave Management
- Payroll Support
- Notification Service
- Document Generation
- Reports & Analytics
- Robot Framework RPA
- Authentication & RBAC
- Audit Logging
- Exception Management

The module must support attendance originating from:

1. Biometric attendance devices
2. External attendance/HR systems
3. API integrations
4. CSV/Excel imports
5. Authorized manual entry
6. Employee self-service correction requests

The hospital application must remain the **system of record for the normalized attendance data** unless a specific external attendance system is configured as the authoritative source.

If an external system is authoritative, preserve the external source information and synchronization history rather than silently overwriting records.

---

# 2. IMPORTANT BUSINESS PRINCIPLE

Attendance automation must follow:

```text
Capture
   ↓
Validate
   ↓
Identify Employee
   ↓
Match Shift
   ↓
Calculate Attendance Status
   ↓
Detect Exceptions
   ↓
Human Review if Required
   ↓
Approve/Correct
   ↓
Reconcile
   ↓
Notify
   ↓
Report
```

The system and RPA must never falsify attendance.

RPA must NOT:

- create fake check-ins
- create fake check-outs
- approve its own attendance corrections
- mark an employee present without valid evidence
- manipulate attendance to increase salary
- manipulate attendance to reduce salary
- approve disputed attendance
- override approved leave
- override authorized shift changes
- make employment decisions
- make disciplinary decisions
- independently approve overtime
- independently approve payroll adjustments

Automation may **calculate and flag** information, but approval must remain with an authorized human where required.

---

# 3. ATTENDANCE OWNERSHIP

Attendance belongs to the **Employee**, not the Doctor or Patient.

Every attendance record must be linked to:

```text
Employee
    ↓
Department
    ↓
Shift Assignment
    ↓
Attendance
    ↓
Leave / Payroll
```

Employee ID is the permanent staff identity.

Do not create another employee identity inside Attendance Management.

---

# 4. ACTORS AND PERMISSIONS

## 4.1 Employee

Can:

- view own attendance
- view monthly attendance summary
- view check-in/check-out records
- view shift information
- request attendance correction
- provide correction reason
- upload supporting evidence if enabled
- view correction request status
- receive attendance notifications

Cannot:

- directly edit finalized attendance
- approve own correction
- edit another employee's attendance
- delete attendance records

---

## 4.2 Department Manager / Authorized Supervisor

Can:

- view attendance for assigned employees
- review correction requests
- approve/reject corrections if authorized
- review missing punches
- review late/early departures
- review attendance exceptions
- view department attendance reports

Cannot:

- modify records outside permitted scope
- bypass audit history
- approve unauthorized payroll changes

---

## 4.3 HR Manager

Can:

- view organization-wide attendance
- manage attendance policies/configuration
- review corrections
- approve corrections
- reconcile attendance
- import attendance
- resolve exceptions
- generate reports
- configure attendance rules where authorized

---

## 4.4 Administrative Manager

Can:

- view operational attendance dashboards
- review attendance trends
- monitor unresolved exceptions
- access authorized reports

---

## 4.5 System Admin

Can:

- configure technical integrations
- configure permissions
- manage attendance integration settings
- monitor RPA jobs
- view audit logs

System Admin must not automatically receive HR approval authority unless explicitly assigned through RBAC.

---

# 5. ATTENDANCE SOURCES

The system must support multiple sources.

## 5.1 Biometric Device

Example:

```text
Employee ID: EMP00125
Device: BIOMETRIC-01
Timestamp: 2026-10-06 08:57:31
Direction: IN
```

The system imports the event.

---

## 5.2 External HR/Attendance System

Attendance can be imported through:

- REST API
- secure file
- CSV
- Excel
- database integration
- RPA browser automation

---

## 5.3 Manual Entry

Authorized HR/manager users may enter attendance when permitted.

Manual entry must require:

- employee
- date
- attendance information
- reason
- source
- created by

---

## 5.4 Employee Correction Request

Employee cannot directly modify attendance.

Instead:

```text
Employee
   ↓
Correction Request
   ↓
Reason
   ↓
Evidence
   ↓
Supervisor/HR Review
   ↓
Approve / Reject
   ↓
Attendance Updated
```

---

# 6. ATTENDANCE DATA MODEL

Create an `Attendance` MongoDB/Mongoose model.

Recommended structure:

```javascript
{
  employeeId: ObjectId,
  attendanceDate: Date,

  shiftAssignmentId: ObjectId,

  checkIn: {
    timestamp: Date,
    source: String,
    sourceEventId: String,
    deviceId: String
  },

  checkOut: {
    timestamp: Date,
    source: String,
    sourceEventId: String,
    deviceId: String
  },

  status: String,

  lateMinutes: Number,
  earlyDepartureMinutes: Number,
  workedMinutes: Number,

  overtimeMinutes: Number,

  source: String,

  externalReference: String,

  correctionStatus: String,

  correctionRequestId: ObjectId,

  remarks: String,

  reconciliationStatus: String,

  createdBy: ObjectId,
  updatedBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 7. ATTENDANCE STATUS

Implement configurable statuses.

Recommended statuses:

```text
PRESENT
ABSENT
LATE
HALF_DAY
ON_LEAVE
HOLIDAY
WEEK_OFF
MISSED_PUNCH
PENDING_REVIEW
PENDING_CORRECTION
CORRECTION_APPROVED
CORRECTION_REJECTED
INVALID
```

Do not hardcode hospital-specific attendance policies where configuration is more appropriate.

For example:

Whether `LATE` should automatically become `HALF_DAY` must be configurable.

The system must not assume that a specific number of late minutes equals half-day unless configured by the hospital.

---

# 8. ATTENDANCE EVENT MODEL

Create an `AttendanceEvent` model.

Purpose:

Preserve the raw source event separately from the normalized attendance record.

Example:

```javascript
{
  employeeId: ObjectId,

  eventDateTime: Date,

  direction: "IN",

  source: "BIOMETRIC",

  sourceEventId: "BIO-987123",

  deviceId: "BIO-01",

  rawPayload: Object,

  importedAt: Date,

  importBatchId: ObjectId,

  processingStatus: "PROCESSED"
}
```

Statuses:

```text
RECEIVED
PROCESSED
DUPLICATE
INVALID
UNMATCHED
FAILED
```

This allows the system to preserve original source evidence.

---

# 9. ATTENDANCE CORRECTION MODEL

Create:

```text
AttendanceCorrection
```

Example:

```javascript
{
  attendanceId: ObjectId,

  employeeId: ObjectId,

  requestedBy: ObjectId,

  requestedAt: Date,

  originalValues: {
    checkIn: Date,
    checkOut: Date,
    status: String
  },

  requestedValues: {
    checkIn: Date,
    checkOut: Date,
    status: String
  },

  reason: String,

  evidenceDocuments: [],

  status: "PENDING",

  reviewedBy: ObjectId,

  reviewedAt: Date,

  reviewerComments: String,

  createdAt: Date,
  updatedAt: Date
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

# 10. ATTENDANCE IMPORT BATCH

Create:

```text
AttendanceImportBatch
```

Fields:

```text
batchId
source
fileName
fileHash
uploadedBy
uploadedAt
recordCount
processedCount
successCount
duplicateCount
errorCount
status
errorReport
startedAt
completedAt
```

Statuses:

```text
UPLOADED
VALIDATING
PROCESSING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

Use file hash/idempotency logic to prevent accidental duplicate imports.

---

# 11. SHIFT RECONCILIATION

Attendance must integrate with Shift Management.

For every employee:

```text
Approved Shift
       ↓
Expected Working Window
       ↓
Actual Attendance
       ↓
Compare
       ↓
Reconciliation Result
```

Example:

```text
Employee: EMP00125

Shift:
09:00 – 18:00

Actual:
09:12 – 18:05

Result:
Late by 12 minutes
Worked 8h 53m
```

The system may calculate:

- late minutes
- early departure
- worked duration
- missing punch
- shift mismatch
- overtime candidate

However:

**Overtime calculation is not automatically overtime approval.**

---

# 12. SHIFT MATCHING

Attendance processing must attempt to identify the employee's approved shift assignment for the attendance date.

Priority:

1. Specific shift assignment
2. Approved roster
3. Applicable recurring shift
4. Configured fallback rule

If no shift can be confidently determined:

```text
Attendance → PENDING_REVIEW
```

Do not invent a shift.

---

# 13. CHECK-IN PROCESS

When a valid IN event is received:

```text
Receive Event
      ↓
Validate Event
      ↓
Find Employee
      ↓
Check Duplicate
      ↓
Find Shift
      ↓
Store Attendance Event
      ↓
Create/Update Attendance
      ↓
Calculate Status
      ↓
Record Result
```

Example:

```text
08:57 IN
Expected shift: 09:00

Status:
PRESENT
```

If hospital policy considers early arrivals differently, use configuration.

---

# 14. CHECK-OUT PROCESS

When OUT event arrives:

```text
Find employee
      ↓
Find attendance for date
      ↓
Check existing checkout
      ↓
Validate timestamp
      ↓
Store event
      ↓
Calculate worked duration
      ↓
Calculate early departure/overtime candidate
      ↓
Update attendance
```

If no matching check-in exists:

```text
MISSED_PUNCH
```

or:

```text
PENDING_REVIEW
```

depending on configuration.

---

# 15. DUPLICATE PUNCH HANDLING

Example:

```text
08:59 IN
09:00 IN
```

The system must not create two independent attendance records.

Use:

- source event ID
- employee
- timestamp
- direction
- device ID

to detect duplicates.

Duplicate events should be recorded as:

```text
AttendanceEvent.status = DUPLICATE
```

while preserving the raw event.

---

# 16. MISSING PUNCH

Example:

```text
IN 09:02
OUT missing
```

System should flag:

```text
MISSED_PUNCH
```

and create an exception.

Notify employee according to configured policy.

Example:

```text
Your attendance record for 06-Oct-2026
does not contain a check-out time.
Please submit a correction request if required.
```

Do not automatically invent a checkout time.

---

# 17. LATE ARRIVAL

Compare actual check-in with expected shift start.

Example:

```text
Shift:
09:00

Check-in:
09:23

Late:
23 minutes
```

Store:

```text
lateMinutes = 23
```

Whether this results in:

- late
- half-day
- warning
- payroll impact

must be controlled by configured hospital policy and authorized users.

---

# 18. EARLY DEPARTURE

Example:

```text
Shift ends:
18:00

Check-out:
17:15

Early departure:
45 minutes
```

Store:

```text
earlyDepartureMinutes = 45
```

Do not automatically mark the employee absent or penalize salary.

---

# 19. WORKED HOURS

Calculate:

```text
Worked Minutes =
Check-out - Check-in
```

Example:

```text
09:00 → 18:00

Worked = 540 minutes
= 9 hours
```

If break deductions are configured, apply the configured attendance policy.

Do not hardcode an assumed break duration.

---

# 20. OVERTIME CANDIDATE

Example:

```text
Shift:
09:00–18:00

Check-out:
20:00

Potential overtime:
120 minutes
```

Store:

```text
overtimeMinutes = 120
```

But:

```text
overtimeMinutes != approved overtime
```

Approval must follow hospital policy.

Payroll Support may consume approved overtime later.

---

# 21. LEAVE RECONCILIATION

Integrate with Leave Management.

Example:

```text
Employee:
EMP00125

Date:
06-Oct-2026

Approved Leave:
FULL_DAY

Attendance Event:
None
```

Expected result:

```text
ON_LEAVE
```

If:

```text
Approved Leave = HALF_DAY
Attendance = Present
```

the system should reconcile according to configured rules and flag inconsistencies if required.

Do not allow attendance automation to override approved leave without authorized review.

---

# 22. HOLIDAY AND WEEK-OFF RECONCILIATION

Attendance must support hospital-configured:

- holidays
- weekly offs
- roster-specific off days

Example:

```text
Employee roster:
Sunday = Week Off

Attendance:
No attendance event
```

System may classify:

```text
WEEK_OFF
```

Do not treat all Sundays as automatically off because hospital employees may work rotating shifts.

Use approved roster/shift configuration.

---

# 23. ATTENDANCE CORRECTION WORKFLOW

Employee sees:

```text
06-Oct-2026

Check In: 09:04
Check Out: Missing

Status: MISSED_PUNCH
```

Employee clicks:

```text
Request Correction
```

Form:

```text
Requested Check-In
Requested Check-Out
Reason
Supporting Document
```

Example:

```text
Reason:
Biometric device was unavailable at the exit gate.
```

Submit.

Status:

```text
PENDING
```

Supervisor/HR reviews.

Actions:

```text
Approve
Reject
```

---

# 24. CORRECTION APPROVAL

When approved:

1. Preserve original record.
2. Store approved correction.
3. Update normalized attendance.
4. Recalculate attendance status.
5. Recalculate duration.
6. Record reviewer.
7. Record approval timestamp.
8. Create audit event.
9. Notify employee.
10. Trigger payroll reconciliation if applicable.

Example:

```text
Original:
Check-out = null

Approved:
Check-out = 18:03
```

Do not delete the original value.

---

# 25. CORRECTION REJECTION

When rejected:

```text
Correction status = REJECTED
```

Original attendance remains unchanged.

Reviewer must provide a reason where required.

Employee receives notification.

---

# 26. ATTENDANCE HISTORY

Every attendance record must maintain history.

Create:

```text
AttendanceHistory
```

Example:

```javascript
{
  attendanceId,
  action: "CORRECTION_APPROVED",
  oldValues: {},
  newValues: {},
  performedBy,
  reason,
  timestamp
}
```

History must be append-only.

---

# 27. ATTENDANCE DASHBOARD

Create route:

```text
/attendance
```

Dashboard cards:

```text
Today's Present
Today's Absent
Late
Missing Punches
Pending Corrections
Pending Review
On Leave
```

Filters:

```text
Date
Department
Employee
Shift
Status
Source
```

---

# 28. DAILY ATTENDANCE SCREEN

Route:

```text
/attendance/daily
```

Table:

| Employee | Department | Shift | Check In | Check Out | Status | Late | Worked |
|---|---|---|---|---|---|---|---|

Actions:

```text
View
Review
Request Correction
Approve Correction
```

Actions depend on RBAC.

---

# 29. EMPLOYEE ATTENDANCE SCREEN

Route:

```text
/my-attendance
```

Employee sees:

- calendar
- attendance status
- check-in
- check-out
- worked hours
- late minutes
- leave
- week off
- holidays
- correction status

---

# 30. CORRECTION QUEUE

Route:

```text
/attendance/corrections
```

Columns:

```text
Request ID
Employee
Date
Original Attendance
Requested Change
Reason
Submitted At
Status
Reviewer
```

Actions:

```text
View
Approve
Reject
```

Only authorized users can approve.

---

# 31. IMPORT SCREEN

Route:

```text
/attendance/import
```

Features:

- upload CSV
- upload Excel
- select source
- preview records
- validate
- import
- show errors
- download error report
- view import history

Example columns:

```text
Employee ID
Date
Check In
Check Out
Source Event ID
Device ID
```

---

# 32. IMPORT VALIDATION

Validate:

- employee ID exists
- date valid
- timestamp valid
- check-in/check-out format
- source event ID
- duplicate event
- impossible timestamp
- check-out before check-in
- employee inactive
- employee terminated
- invalid source

Invalid rows must not corrupt valid rows.

Show row-level errors.

Example:

```text
Row 27:
Employee EMP00999 not found.
```

---

# 33. IMPOSSIBLE TIMESTAMPS

Reject or flag:

```text
Check-in > Check-out
```

Example:

```text
IN 18:00
OUT 09:00
```

Do not automatically reverse them.

Create exception:

```text
INVALID_ATTENDANCE_TIME
```

---

# 34. EMPLOYEE NOT FOUND

If an imported event contains:

```text
EMP99999
```

but Employee does not exist:

```text
UNMATCHED
```

Do not create a new employee automatically.

Route to HR.

---

# 35. INACTIVE EMPLOYEE

If attendance arrives for:

```text
TERMINATED
```

employee:

Flag:

```text
ATTENDANCE_FOR_INACTIVE_EMPLOYEE
```

Do not silently accept it as valid attendance.

HR must review.

---

# 36. ATTENDANCE RECONCILIATION

Create:

```text
/attendance/reconciliation
```

Purpose:

Compare:

```text
Attendance
vs
Shift
vs
Leave
vs
Employee Status
```

Possible outcomes:

```text
MATCHED
SHIFT_MISMATCH
LEAVE_CONFLICT
MISSING_PUNCH
EMPLOYEE_STATUS_CONFLICT
DUPLICATE
PENDING_REVIEW
```

---

# 37. RECONCILIATION EXAMPLE

Employee:

```text
EMP00125
```

Shift:

```text
09:00–18:00
```

Attendance:

```text
09:45–18:00
```

Result:

```text
MATCHED_WITH_LATE
```

Employee:

```text
EMP00200
```

Approved leave:

```text
06-Oct-2026
```

Attendance:

```text
09:00–18:00
```

Result:

```text
LEAVE_CONFLICT
```

Human review required.

---

# 38. ATTENDANCE REPORTS

Provide:

### Daily Report

```text
Present
Absent
Late
Leave
Missing Punch
```

### Monthly Report

```text
Employee
Working Days
Present Days
Absent Days
Leave Days
Late Count
Late Minutes
Worked Hours
Missing Punches
```

### Department Report

```text
Department
Total Employees
Present
Absent
Late
Leave
Attendance %
```

### Exception Report

```text
Exception Type
Employee
Date
Status
Age
Assigned Reviewer
```

---

# 39. ATTENDANCE PERCENTAGE

Attendance percentage must use configurable hospital rules.

Do not blindly calculate:

```text
Present / Calendar Days
```

because holidays, week-offs, leave and roster variations may apply.

Use configured eligible working days.

Example:

```text
Eligible Working Days = 22
Present = 20

Attendance = 90.91%
```

---

# 40. NOTIFICATIONS

Integrate with centralized Notification Service.

Events:

```text
Missing Punch
Correction Submitted
Correction Approved
Correction Rejected
Attendance Exception
Attendance Import Failure
Reconciliation Conflict
Attendance Summary Available
```

Channels:

```text
SMS
Email
In-App
```

Notification must contain:

- event
- employee
- date
- action required
- secure application link

Do not expose sensitive information unnecessarily.

---

# 41. DOCUMENTS

Attendance may generate:

- attendance correction form
- attendance summary
- monthly attendance report
- exception report
- import error report

Documents must use Document Generation module.

Do not duplicate document-generation logic inside Attendance.

---

# 42. RPA ROLE

Robot Framework is an automation worker.

Typical workflow:

```text
External Attendance System
        ↓
Robot Framework
        ↓
Extract Attendance
        ↓
Validate
        ↓
Send to API
        ↓
Hospital Attendance Module
        ↓
Reconcile
        ↓
Update
        ↓
Notify
```

---

# 43. RPA ATTENDANCE IMPORT

Example external portal workflow:

```text
Open Attendance Portal
        ↓
Login using secret-managed credential
        ↓
Navigate to Attendance
        ↓
Select Date
        ↓
Download CSV
        ↓
Verify Download
        ↓
Upload to Hospital API
        ↓
Read Import Result
        ↓
Store RPA Execution Result
```

RPA must never store passwords directly in source code.

---

# 44. RPA ROBOT STRUCTURE

Use:

```text
robot/
├── resources/
│   ├── common.resource
│   ├── auth.resource
│   ├── attendance.resource
│   ├── notifications.resource
│   └── api.resource
│
├── keywords/
│   ├── attendance_keywords.resource
│   ├── reconciliation_keywords.resource
│   └── exception_keywords.resource
│
├── tests/
│   ├── attendance_import.robot
│   ├── attendance_reconciliation.robot
│   ├── attendance_correction_sync.robot
│   └── attendance_exception.robot
│
├── portals/
│   └── external_attendance_portal.resource
│
└── results/
```

---

# 45. ROBOT FRAMEWORK KEYWORDS

Implement reusable keywords:

```text
Login To Attendance System
Download Attendance Report
Verify Attendance File
Validate Attendance Records
Submit Attendance Import
Verify Import Result
Reconcile Attendance
Detect Missing Punches
Create Attendance Exception
Send Attendance Notification
Verify External Attendance Status
Capture RPA Evidence
Record RPA Execution
```

---

# 46. RPA RESULT CONTRACT

Every RPA job must return structured information.

Example:

```json
{
  "success": true,
  "jobType": "ATTENDANCE_IMPORT",
  "correlationId": "RPA-ATT-20261006-0001",
  "source": "BIOMETRIC_PORTAL",
  "recordsRead": 1250,
  "recordsImported": 1238,
  "duplicates": 8,
  "errors": 4,
  "startedAt": "2026-10-06T08:00:00Z",
  "completedAt": "2026-10-06T08:08:12Z"
}
```

Store the result in:

```text
RPAJob
RPAExecution
```

---

# 47. RPA FAILURE HANDLING

If external system is unavailable:

```text
RPA Job
   ↓
Retry according to configured policy
   ↓
Still failing
   ↓
Create ExceptionCase
   ↓
Notify HR/Admin
```

Do not fabricate attendance.

---

# 48. IDEMPOTENCY

Attendance imports must be idempotent.

Repeated execution must not create duplicate attendance.

Use:

```text
source
+
sourceEventId
```

as primary duplicate detection where available.

For systems without event IDs, use a carefully defined fingerprint.

Example:

```text
employeeId
date/time
direction
deviceId
source
```

---

# 49. ATTENDANCE API

Base route:

```text
/api/attendance
```

Endpoints:

```http
GET    /api/attendance
GET    /api/attendance/:id
POST   /api/attendance
PATCH  /api/attendance/:id
```

Import:

```http
POST /api/attendance/import
GET  /api/attendance/imports
GET  /api/attendance/imports/:id
```

Correction:

```http
POST /api/attendance/:id/correction
GET  /api/attendance/corrections
GET  /api/attendance/corrections/:id
POST /api/attendance/corrections/:id/approve
POST /api/attendance/corrections/:id/reject
```

Reconciliation:

```http
POST /api/attendance/reconcile
GET  /api/attendance/reconciliation
```

Reports:

```http
GET /api/attendance/reports/daily
GET /api/attendance/reports/monthly
GET /api/attendance/reports/department
GET /api/attendance/reports/exceptions
```

Employee self-service:

```http
GET /api/me/attendance
POST /api/me/attendance/:id/correction
```

---

# 50. BACKEND STRUCTURE

Implement:

```text
server/
├── models/
│   ├── Attendance.js
│   ├── AttendanceEvent.js
│   ├── AttendanceCorrection.js
│   ├── AttendanceHistory.js
│   └── AttendanceImportBatch.js
│
├── controllers/
│   └── attendanceController.js
│
├── services/
│   ├── attendanceService.js
│   ├── attendanceImportService.js
│   ├── attendanceCorrectionService.js
│   ├── attendanceReconciliationService.js
│   └── attendanceReportService.js
│
├── routes/
│   └── attendanceRoutes.js
│
├── validators/
│   └── attendanceValidators.js
│
└── jobs/
    └── attendanceJobs.js
```

---

# 51. FRONTEND STRUCTURE

Use:

```text
client/src/portals/administration/attendance/
├── pages/
│   ├── AttendanceDashboard.jsx
│   ├── DailyAttendance.jsx
│   ├── AttendanceCalendar.jsx
│   ├── AttendanceImport.jsx
│   ├── AttendanceCorrections.jsx
│   ├── AttendanceReconciliation.jsx
│   └── AttendanceReports.jsx
│
├── components/
│   ├── AttendanceTable.jsx
│   ├── AttendanceStatusBadge.jsx
│   ├── AttendanceFilters.jsx
│   ├── CorrectionModal.jsx
│   ├── ImportPreview.jsx
│   ├── ReconciliationTable.jsx
│   └── AttendanceSummary.jsx
│
└── services/
    └── attendanceApi.js
```

Employee pages:

```text
client/src/portals/employee/attendance/
├── MyAttendance.jsx
├── MyAttendanceCalendar.jsx
└── MyCorrectionRequests.jsx
```

---

# 52. MONGODB INDEXES

Create appropriate indexes.

Recommended:

```javascript
Attendance:
{
  employeeId: 1,
  attendanceDate: -1
}

Attendance:
{
  attendanceDate: 1,
  status: 1
}

Attendance:
{
  shiftAssignmentId: 1,
  attendanceDate: 1
}

AttendanceEvent:
{
  source: 1,
  sourceEventId: 1
}

AttendanceEvent:
{
  employeeId: 1,
  eventDateTime: 1
}

AttendanceCorrection:
{
  employeeId: 1,
  status: 1,
  requestedAt: -1
}

AttendanceImportBatch:
{
  source: 1,
  uploadedAt: -1
}
```

Use unique indexes where appropriate and safe.

---

# 53. DATABASE INTEGRATION

Attendance must reference:

```text
Employee
ShiftAssignment
LeaveRequest
Notification
Document
User
RPAJob
ExceptionCase
```

Do not duplicate employee master information unnecessarily.

---

# 54. STAFF MANAGEMENT INTEGRATION

Employee lifecycle affects attendance.

Examples:

```text
ACTIVE → attendance allowed
ON_LEAVE → reconcile against leave
SUSPENDED → review attendance according to policy
TERMINATED → future attendance requires exception
```

Attendance must consume the employee's current and historical status.

---

# 55. SHIFT MANAGEMENT INTEGRATION

Shift Management owns:

- shift definitions
- rosters
- assignments
- shift changes

Attendance consumes those approved records.

Do not duplicate shift-management logic inside Attendance.

---

# 56. LEAVE MANAGEMENT INTEGRATION

Leave Management owns:

- leave requests
- leave approvals
- leave balances

Attendance consumes approved leave.

Do not let attendance automation approve leave.

---

# 57. PAYROLL SUPPORT INTEGRATION

Attendance can provide:

```text
Worked Days
Leave Days
Late Minutes
Unpaid Absence Candidates
Approved Overtime
```

But Payroll Support decides how these values are used according to configured payroll policy.

Important:

```text
Attendance calculation
        ≠
Payroll approval
```

---

# 58. SECURITY

Attendance data is employee-related and must be protected.

Implement:

- JWT authentication
- RBAC
- API authorization
- department-level access where applicable
- employee self-service restrictions
- audit logging
- secure file storage
- signed document URLs
- input validation
- rate limiting
- secure secrets
- encryption where appropriate

Employees must never be able to query another employee's attendance through manipulated API parameters.

Always enforce authorization on the backend.

---

# 59. AUDIT LOGGING

Record:

```text
Attendance created
Attendance imported
Attendance modified
Correction requested
Correction approved
Correction rejected
Manual attendance entered
Attendance exception created
Attendance reconciled
Import failed
RPA executed
```

Audit event example:

```javascript
{
  actorUserId,
  action: "ATTENDANCE_CORRECTION_APPROVED",
  entityType: "AttendanceCorrection",
  entityId,
  before,
  after,
  reason,
  timestamp,
  correlationId
}
```

---

# 60. HUMAN-IN-THE-LOOP EXCEPTIONS

Create `ExceptionCase` for:

```text
Employee Not Found
Duplicate Attendance
Missing Punch
Invalid Timestamp
Shift Conflict
Leave Conflict
Inactive Employee Attendance
External System Failure
Import Failure
Ambiguous Employee Mapping
Uncertain RPA Result
```

Exception statuses:

```text
OPEN
ASSIGNED
IN_REVIEW
WAITING_FOR_INFORMATION
RESOLVED
REJECTED
CANCELLED
```

---

# 61. MANUAL ATTENDANCE ENTRY

Authorized HR users may manually create attendance only when policy permits.

Mandatory:

```text
Employee
Date
Check-in
Check-out
Reason
Source = MANUAL
Created By
```

Example reason:

```text
Biometric device unavailable during network outage.
```

Manual attendance must always be auditable.

---

# 62. NO SILENT DATA CORRECTION

Never execute:

```text
UPDATE attendance
```

without preserving:

```text
old value
new value
actor
reason
timestamp
```

For corrections, use the correction workflow.

---

# 63. ATTENDANCE CALENDAR

Provide monthly calendar.

Example:

```text
October 2026

Mon Tue Wed Thu Fri Sat Sun
 P   P   L   P   P   WO  WO
 P   P   P   A   P   WO  WO
 ...
```

Use clear status indicators.

Clicking a date opens:

```text
Attendance Details
Shift
Check-in
Check-out
Worked Hours
Correction Status
```

---

# 64. ATTENDANCE DETAIL PAGE

Route:

```text
/attendance/:id
```

Show:

### Employee

```text
Employee ID
Name
Department
Designation
```

### Shift

```text
Shift
Start
End
Roster
```

### Attendance

```text
Check-in
Check-out
Status
Worked Hours
Late
Early Departure
Overtime Candidate
```

### Source

```text
Biometric
Manual
API
RPA
Import
```

### History

Show all changes.

---

# 65. MONTHLY EMPLOYEE SUMMARY

Display:

```text
Working Days
Present
Absent
Leave
Week Off
Holiday
Late Count
Late Minutes
Missing Punches
Worked Hours
Approved Overtime
```

Do not include payroll amounts unless consumed from Payroll Support.

---

# 66. REPORT EXPORT

Allow authorized users to export:

```text
CSV
Excel
PDF
```

Exports must respect RBAC and filters.

Do not allow unauthorized users to export organization-wide attendance.

---

# 67. ATTENDANCE CONFIGURATION

Create hospital-level configuration.

Example:

```javascript
{
  attendanceWindowBeforeShiftMinutes,
  attendanceWindowAfterShiftMinutes,
  lateThresholdMinutes,
  halfDayThresholdMinutes,
  missingPunchGraceHours,
  overtimeRequiresApproval,
  autoMarkNoShow,
  correctionApprovalRequired,
  allowedManualEntryRoles
}
```

These values must be configurable.

Do not hardcode policy values throughout the application.

---

# 68. TIMEZONE

Hospital timezone must be configured.

For the Indian deployment:

```text
Asia/Kolkata
```

may be configured.

Store timestamps consistently and render them according to hospital/user timezone.

Do not calculate attendance using the browser's arbitrary local timezone.

---

# 69. CONCURRENCY

Prevent:

```text
Two users approving same correction
Two imports processing same batch
Two RPA jobs importing same file
Two corrections modifying same attendance simultaneously
```

Use:

- optimistic concurrency
- status checks
- idempotency
- database transactions where required

---

# 70. RPA SCHEDULING

Support configurable jobs such as:

```text
Daily Attendance Import
Every 30 Minutes Attendance Sync
Daily Missing Punch Detection
Daily Reconciliation
Monthly Attendance Report
```

Scheduling must be configurable.

Do not hardcode production schedules inside Robot Framework scripts.

---

# 71. RPA MONITORING

Administration screen:

```text
/RPA/attendance
```

Show:

```text
Job ID
Job Type
Started
Completed
Status
Records Read
Records Processed
Errors
Retry Count
Correlation ID
```

Possible statuses:

```text
QUEUED
RUNNING
SUCCESS
PARTIAL_SUCCESS
FAILED
RETRYING
CANCELLED
```

---

# 72. NOTIFICATION FAILURE

If SMS/email fails:

```text
Attendance transaction remains valid.
```

Create:

```text
NotificationDelivery = FAILED
```

and retry according to Notification Service policy.

Do not modify attendance because a notification failed.

---

# 73. EXTERNAL SYSTEM FAILURE

If biometric/HR system is unavailable:

```text
RPA detects failure
      ↓
Retry
      ↓
Create exception
      ↓
Notify HR/Admin
```

Previously imported attendance must remain intact.

---

# 74. DATA RETENTION

Attendance history and audit history must follow configurable hospital retention policies.

Do not implement destructive deletion simply because a record is old.

Use archival where required.

---

# 75. SEED DATA

Create demo employees.

Example:

```text
EMP00125
Rahul Shah
Administration
Administrative Executive

EMP00126
Priya Mehta
Human Resources
HR Executive

EMP00127
Arjun Patel
Pharmacy
Pharmacist
```

Create:

- shifts
- shift assignments
- attendance
- leave
- missing punches
- correction requests
- reconciliation exceptions

Include both successful and exception scenarios.

---

# 76. DEMO ATTENDANCE DATA

Example:

```text
Employee: EMP00125
Date: 06-Oct-2026
Shift: 09:00–18:00
Check-in: 08:57
Check-out: 18:05
Status: PRESENT
```

Example:

```text
Employee: EMP00126
Date: 06-Oct-2026
Shift: 09:00–18:00
Check-in: 09:27
Check-out: 18:00
Status: LATE
```

Example:

```text
Employee: EMP00127
Date: 06-Oct-2026
Check-in: 09:10
Check-out: null
Status: MISSED_PUNCH
```

---

# 77. UNIT TESTS

Backend tests must cover:

```text
Attendance creation
Attendance retrieval
Duplicate event detection
Check-in processing
Check-out processing
Worked-hour calculation
Late calculation
Early-departure calculation
Missing punch detection
Leave reconciliation
Shift reconciliation
Correction creation
Correction approval
Correction rejection
Audit creation
Import validation
Import idempotency
```

---

# 78. API TESTS

Test:

```text
GET /attendance
POST /attendance
POST /attendance/import
POST /attendance/:id/correction
POST /attendance/corrections/:id/approve
POST /attendance/corrections/:id/reject
POST /attendance/reconcile
```

Test unauthorized users.

Example:

```text
Employee A
cannot access
Employee B's attendance.
```

---

# 79. FRONTEND TESTS

Test:

- dashboard rendering
- filters
- attendance table
- employee attendance
- correction form
- approval dialog
- import preview
- validation errors
- reconciliation screen
- report export
- RBAC visibility

---

# 80. ROBOT FRAMEWORK TESTS

Create scenarios:

### Test 1 — Successful Import

```text
Login
Download attendance
Upload
Validate
Import
Verify records
```

### Test 2 — Duplicate Import

```text
Run same import twice
Verify no duplicate attendance
```

### Test 3 — Missing Punch

```text
Import IN without OUT
Verify exception
```

### Test 4 — Employee Not Found

```text
Import unknown employee
Verify unmatched event
```

### Test 5 — External Portal Failure

```text
Portal unavailable
Verify retry
Verify exception
```

---

# 81. ACCEPTANCE CRITERIA

The module is complete only when:

- employee attendance can be captured
- biometric/import/API sources are supported
- manual attendance is controlled by RBAC
- employee self-service is available
- employees cannot directly rewrite attendance
- correction workflow works
- correction approval is audited
- original values are preserved
- shifts are reconciled
- approved leave is reconciled
- late arrival is calculated
- early departure is calculated
- worked duration is calculated
- missing punches are detected
- duplicate events are prevented
- invalid timestamps are detected
- inactive employees create exceptions
- reports work
- exports respect RBAC
- notifications work
- RPA imports work
- RPA jobs are traceable
- RPA failures create exceptions
- no fake attendance can be created by automation
- payroll receives only appropriate attendance data
- all sensitive changes are audited
- backend authorization cannot be bypassed through frontend manipulation.

---

# 82. IMPLEMENTATION ORDER FOR AI CODING AGENT

Implement in this order:

## Phase 1 — Database

Create:

```text
Attendance
AttendanceEvent
AttendanceCorrection
AttendanceHistory
AttendanceImportBatch
```

---

## Phase 2 — Backend

Implement:

```text
attendanceService
attendanceImportService
attendanceCorrectionService
attendanceReconciliationService
attendanceReportService
```

---

## Phase 3 — APIs

Implement:

```text
Attendance CRUD
Import
Correction
Approval
Reconciliation
Reports
Employee Self-Service
```

---

## Phase 4 — RBAC

Implement:

```text
Employee
Supervisor
HR Manager
Administrative Manager
System Admin
```

permissions.

---

## Phase 5 — Frontend

Build:

```text
Attendance Dashboard
Daily Attendance
My Attendance
Corrections
Import
Reconciliation
Reports
Attendance Details
```

---

## Phase 6 — Integration

Connect:

```text
Staff
Shift
Leave
Payroll
Notification
Documents
Audit
Exception
RPA
```

---

## Phase 7 — Robot Framework

Implement:

```text
External Attendance Login
Attendance Download
Import
Reconciliation
Exception Handling
Notification
RPA Logging
```

---

## Phase 8 — Testing

Run:

```text
Backend Tests
API Tests
Frontend Tests
RBAC Tests
RPA Tests
End-to-End Tests
```

---

# 83. END-TO-END EXAMPLE

Employee:

```text
EMP00125
Rahul Shah
```

Approved shift:

```text
09:00–18:00
```

Biometric device generates:

```text
IN  = 09:12
OUT = 18:05
```

RPA retrieves the data.

System validates:

```text
Employee exists = YES
Duplicate = NO
Shift exists = YES
Timestamp valid = YES
```

System calculates:

```text
Late = 12 minutes
Worked = 8h 53m
```

Attendance:

```text
Status = LATE
```

Employee sees:

```text
06-Oct-2026
09:12 → 18:05
Late: 12 minutes
Status: LATE
```

If employee disputes the check-in:

```text
Request Correction
        ↓
Reason
        ↓
Submit
        ↓
Supervisor Review
        ↓
Approve
        ↓
Attendance recalculated
        ↓
Audit created
        ↓
Employee notified
```

No original record is silently deleted.

---

# 84. STRICT RULES FOR THE AI CODING AGENT

When implementing this module:

1. Do not create duplicate Employee entities.
2. Use Employee ID from Staff Management.
3. Do not allow employees to directly edit finalized attendance.
4. Preserve original attendance values.
5. Every correction must be auditable.
6. Do not create fake attendance.
7. Do not let RPA approve its own corrections.
8. Do not treat overtime candidates as approved overtime.
9. Do not override approved leave automatically.
10. Do not invent shifts.
11. Do not create employees automatically from unknown attendance records.
12. Do not silently discard invalid attendance events.
13. Preserve raw imported events.
14. Make imports idempotent.
15. Use centralized Notification Service.
16. Use centralized Document Generation.
17. Use centralized Audit Logging.
18. Use centralized Exception Management.
19. Enforce RBAC on the backend.
20. Never rely only on frontend authorization.
21. Do not hardcode hospital attendance policies.
22. Keep configuration separate from business code.
23. Do not put passwords in Robot Framework source code.
24. Use secret-managed credentials for external systems.
25. Store RPA correlation IDs.
26. Capture RPA evidence for failures where appropriate.
27. Never make employment or disciplinary decisions autonomously.
28. Do not modify payroll amounts directly from Attendance.
29. Do not expose another employee's attendance through manipulated API requests.
30. Keep Attendance as an administrative module, not a clinical module.

---

# 85. FINAL DEFINITION OF DONE

`13_ATTENDANCE_MANAGEMENT.md` is successfully implemented only when the hospital can reliably:

```text
Capture Attendance
       ↓
Import / Sync
       ↓
Identify Employee
       ↓
Match Shift
       ↓
Calculate Attendance
       ↓
Detect Exceptions
       ↓
Reconcile Leave
       ↓
Allow Controlled Corrections
       ↓
Human Approval
       ↓
Audit
       ↓
Notify
       ↓
Generate Reports
       ↓
Provide Payroll Inputs
```

The complete process must be:

**traceable, auditable, secure, idempotent, configurable, RBAC-protected, and safe for human review.**

Robot Framework must automate repetitive administrative work, but the hospital's authorized staff remain responsible for decisions requiring judgment or approval.