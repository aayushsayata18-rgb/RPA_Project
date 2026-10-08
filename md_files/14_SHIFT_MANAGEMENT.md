# 14_SHIFT_MANAGEMENT.md

# Hospital RPA Platform — Shift Management

## 1. MODULE PURPOSE

Build a complete **Shift Management module** for the Hospital Administrative Automation Platform.

The module must manage the hospital's workforce scheduling structure, including:

- Shift definitions
- Shift timings
- Departments
- Employee shift assignments
- Recurring rosters
- Daily/weekly/monthly schedules
- Shift changes
- Shift swaps
- Employee availability
- Shift exceptions
- Holidays and weekly offs
- Conflict detection
- Attendance reconciliation
- Notifications
- Schedule reports
- RPA synchronization with external scheduling/HR systems

The module is an **administrative workforce-management module**.

It must not make clinical staffing decisions autonomously.

---

# 2. CORE PRINCIPLE

The Shift Management module must distinguish between:

### Shift Definition

What a shift is.

Example:

```text
Morning Shift
09:00 – 18:00
```

### Shift Assignment

Which employee is assigned to that shift.

Example:

```text
EMP00125
06-Oct-2026
Morning Shift
```

### Shift Roster

The approved schedule for a period.

Example:

```text
Week:
05-Oct-2026 → 11-Oct-2026

EMP00125:
Mon → Morning
Tue → Morning
Wed → Evening
Thu → Morning
Fri → Morning
Sat → OFF
Sun → OFF
```

### Attendance

What actually happened.

Example:

```text
Scheduled:
09:00 – 18:00

Actual:
09:17 – 18:05
```

Shift Management owns the **planned schedule**.

Attendance Management owns the **actual attendance record**.

---

# 3. SHIFT MANAGEMENT WORKFLOW

The standard workflow is:

```text
Create Shift Definition
        ↓
Configure Rules
        ↓
Create Roster
        ↓
Select Department/Employees
        ↓
Assign Shifts
        ↓
Validate Conflicts
        ↓
Submit for Approval
        ↓
Approve
        ↓
Publish Roster
        ↓
Notify Employees
        ↓
Attendance Uses Published Shift
        ↓
Monitor Exceptions
        ↓
Handle Changes
```

---

# 4. ACTORS

## 4.1 Employee

Can:

- view own roster
- view upcoming shifts
- view previous shifts
- view shift details
- request shift change
- request shift swap
- provide availability if enabled
- receive notifications

Cannot:

- directly change an assigned shift
- approve own request
- modify another employee's roster

---

# 4.2 Department Manager / Supervisor

Can:

- view department roster
- create proposed schedules
- assign employees
- review conflicts
- approve or submit schedules according to permissions
- review shift-change requests
- review swap requests

---

# 4.3 HR Manager

Can:

- manage shift definitions
- manage organization-wide scheduling rules
- create and approve rosters
- resolve conflicts
- manage shift policies
- view organization-wide schedules
- perform authorized corrections

---

# 4.4 Administrative Manager

Can:

- view operational staffing schedules
- monitor department coverage
- review staffing exceptions
- view reports

---

# 4.5 System Admin

Can:

- configure technical settings
- manage permissions
- configure integrations
- monitor RPA

System Admin does not automatically receive roster approval rights.

---

# 5. SHIFT DEFINITIONS

Create a `Shift` model.

Example:

```javascript
{
  shiftCode: "MORNING",
  shiftName: "Morning Shift",

  startTime: "09:00",
  endTime: "18:00",

  crossesMidnight: false,

  breakMinutes: 60,

  graceBeforeMinutes: 30,
  graceAfterMinutes: 30,

  departmentIds: [],

  status: "ACTIVE",

  createdBy: ObjectId,
  updatedBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 6. SHIFT TYPES

Support configurable shift types such as:

```text
MORNING
GENERAL
EVENING
NIGHT
ROTATIONAL
CUSTOM
```

Do not assume these are the only shifts.

Hospital administrators must be able to configure additional shift definitions.

---

# 7. SHIFT STATUS

Recommended:

```text
DRAFT
ACTIVE
INACTIVE
ARCHIVED
```

Rules:

- DRAFT cannot normally be assigned to published rosters.
- ACTIVE can be assigned.
- INACTIVE cannot be assigned to new schedules.
- Existing historical assignments remain intact.
- ARCHIVED is retained for historical reporting.

Never delete a shift definition that has historical assignments.

---

# 8. CROSS-MIDNIGHT SHIFTS

Hospital shifts may cross midnight.

Example:

```text
Night Shift

22:00 → 06:00
```

The system must support:

```text
Start:
06-Oct-2026 22:00

End:
07-Oct-2026 06:00
```

Do not treat the end time as occurring before the start time.

Store enough information to correctly calculate the working window.

---

# 9. BREAK CONFIGURATION

A shift may define:

```text
Break duration
```

Example:

```text
Shift:
09:00–18:00

Break:
60 minutes
```

However, break handling must be configurable.

Do not automatically deduct one hour from attendance unless the hospital's attendance policy requires it.

Attendance Management owns actual worked-time calculations.

Shift Management only provides the configured schedule information.

---

# 10. SHIFT ASSIGNMENT

Create:

```text
ShiftAssignment
```

Recommended structure:

```javascript
{
  employeeId: ObjectId,

  shiftId: ObjectId,

  departmentId: ObjectId,

  assignmentDate: Date,

  effectiveFrom: Date,
  effectiveTo: Date,

  assignmentType: "ROSTER",

  status: "DRAFT",

  rosterId: ObjectId,

  approvedBy: ObjectId,
  approvedAt: Date,

  publishedAt: Date,

  notes: String,

  createdBy: ObjectId,
  updatedBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 11. ASSIGNMENT STATUS

Use:

```text
DRAFT
PENDING_APPROVAL
APPROVED
PUBLISHED
CANCELLED
COMPLETED
```

Example:

```text
DRAFT
   ↓
PENDING_APPROVAL
   ↓
APPROVED
   ↓
PUBLISHED
   ↓
COMPLETED
```

---

# 12. ROSTER

Create a `Roster` model.

A roster represents a scheduling period.

Example:

```javascript
{
  rosterName: "Administration — October Week 1",

  departmentId: ObjectId,

  periodStart: Date,
  periodEnd: Date,

  status: "DRAFT",

  assignments: [],

  submittedBy: ObjectId,
  submittedAt: Date,

  approvedBy: ObjectId,
  approvedAt: Date,

  publishedAt: Date,

  createdBy: ObjectId,
  updatedBy: ObjectId
}
```

---

# 13. ROSTER STATUS

Use:

```text
DRAFT
PENDING_APPROVAL
APPROVED
PUBLISHED
LOCKED
CANCELLED
COMPLETED
```

Meaning:

### DRAFT

Being prepared.

### PENDING_APPROVAL

Submitted for review.

### APPROVED

Authorized but not yet published.

### PUBLISHED

Visible to employees and consumed by Attendance.

### LOCKED

Historical schedule that should not be casually changed.

### CANCELLED

Invalidated before effective use.

### COMPLETED

Scheduling period has ended.

---

# 14. ROSTER CREATION

Supervisor/HR can create:

```text
Roster
+
Department
+
Date Range
```

Example:

```text
Department:
Reception

Period:
05-Oct-2026 → 11-Oct-2026
```

Then select employees.

---

# 15. ROSTER CALENDAR

Create a calendar-based UI.

Example:

```text
Employee       Mon      Tue      Wed      Thu      Fri      Sat      Sun

EMP00125       MORNING  MORNING  EVENING  MORNING  MORNING  OFF      OFF

EMP00126       MORNING  EVENING  EVENING  MORNING  MORNING  MORNING  OFF
```

Each cell should be clickable.

Click:

```text
EMP00125 / Wed
```

→ open assignment editor.

---

# 16. SHIFT ASSIGNMENT EDITOR

Fields:

```text
Employee
Date
Department
Shift
Notes
```

Actions:

```text
Save Draft
```

or:

```text
Submit for Approval
```

Published rosters require authorized workflow for changes.

---

# 17. CONFLICT DETECTION

The system must detect scheduling conflicts.

Examples:

### Overlapping Shifts

```text
Morning:
09:00–18:00

Evening:
17:00–23:00
```

Same employee cannot normally have both unless explicitly permitted.

---

### Duplicate Assignment

```text
EMP00125
06-Oct-2026
Morning
```

and another:

```text
EMP00125
06-Oct-2026
Morning
```

should be detected.

---

### Invalid Employee

If employee does not exist:

```text
Assignment rejected
```

Do not create employee automatically.

---

# 18. DEPARTMENT VALIDATION

Employee's department assignment must be checked.

Example:

```text
Employee:
EMP00125

Current Department:
Administration

Roster:
Pharmacy
```

The system should flag:

```text
DEPARTMENT_ASSIGNMENT_CONFLICT
```

unless cross-department scheduling is explicitly authorized.

---

# 19. EMPLOYEE STATUS VALIDATION

Do not assign normal future shifts to:

```text
TERMINATED
INACTIVE
```

employees.

For:

```text
ON_LEAVE
SUSPENDED
```

the system should validate according to configured policy and flag conflicts.

Do not silently override employee status.

---

# 20. LEAVE CONFLICT

Integrate with Leave Management.

Example:

```text
Employee:
EMP00125

Approved Leave:
06-Oct-2026

Roster:
Morning Shift
06-Oct-2026
```

Result:

```text
LEAVE_CONFLICT
```

The system must not silently remove the approved leave or create a shift anyway.

Authorized user must resolve the conflict.

---

# 21. WEEKLY OFF

Support roster-defined weekly offs.

Example:

```text
Saturday:
OFF

Sunday:
OFF
```

However, hospital staff may work rotating schedules.

Therefore:

**Do not assume Saturday/Sunday are universal weekly offs.**

The roster determines the employee's actual planned schedule.

---

# 22. HOLIDAY HANDLING

Integrate with hospital holiday configuration.

Possible behavior:

```text
Holiday
+
Employee scheduled
```

must follow hospital policy.

Some departments may operate on holidays.

Therefore, do not automatically remove all holiday shifts.

Flag or apply configured policy.

---

# 23. EMPLOYEE AVAILABILITY

Optionally support:

```text
EmployeeAvailability
```

Example:

```javascript
{
  employeeId,
  date,
  availableFrom,
  availableTo,
  availabilityStatus,
  reason,
  createdBy
}
```

Statuses:

```text
AVAILABLE
UNAVAILABLE
PREFERRED
RESTRICTED
```

Availability is an input to scheduling.

It does not automatically override operational requirements.

---

# 24. EMPLOYEE SHIFT PREFERENCE

Employees may optionally submit preferences.

Example:

```text
Preferred:
Morning

Avoid:
Night
```

The system may display preferences to the scheduler.

However:

**Preferences are not automatically guaranteed assignments.**

Final schedules require authorized scheduling decisions.

---

# 25. SHIFT SWAP

Support employee shift-swap requests.

Example:

```text
Employee A:
06-Oct Morning

Employee B:
06-Oct Evening
```

Employee A requests swap with Employee B.

Workflow:

```text
Request
 ↓
Validate employees
 ↓
Validate shifts
 ↓
Check conflicts
 ↓
Check leave/status
 ↓
Employee B acceptance if required
 ↓
Supervisor approval
 ↓
Update roster
 ↓
Audit
 ↓
Notify
```

---

# 26. SHIFT SWAP MODEL

Create:

```text
ShiftSwapRequest
```

Example:

```javascript
{
  requesterEmployeeId: ObjectId,
  targetEmployeeId: ObjectId,

  requesterAssignmentId: ObjectId,
  targetAssignmentId: ObjectId,

  reason: String,

  status: "PENDING_TARGET_ACCEPTANCE",

  targetResponseAt: Date,

  reviewedBy: ObjectId,
  reviewedAt: Date,

  reviewerComments: String,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 27. SHIFT SWAP STATUSES

Use:

```text
PENDING_TARGET_ACCEPTANCE
PENDING_APPROVAL
APPROVED
REJECTED
CANCELLED
COMPLETED
```

Do not modify assignments until required approvals are complete.

---

# 28. SHIFT CHANGE REQUEST

Separate from a swap.

Example:

```text
Employee:
EMP00125

Current:
Morning

Requested:
Evening

Date:
07-Oct-2026

Reason:
Personal requirement
```

Workflow:

```text
Employee Request
      ↓
Manager Review
      ↓
Conflict Validation
      ↓
Approval
      ↓
Roster Update
      ↓
Notification
```

---

# 29. SHIFT CHANGE MODEL

Create:

```text
ShiftChangeRequest
```

Fields:

```javascript
{
  employeeId,
  assignmentId,

  currentShiftId,
  requestedShiftId,

  effectiveDate,

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

# 30. PUBLISHED ROSTER CHANGES

A published roster must not be directly overwritten.

Instead:

```text
Published Assignment
       ↓
Change Request
       ↓
Approval
       ↓
New Assignment Version
       ↓
Audit
       ↓
Notification
```

Preserve the previous schedule.

This is critical because Attendance may already have consumed the original schedule.

---

# 31. ROSTER VERSIONING

Create roster versions.

Example:

```text
Roster V1
06-Oct:
Morning

Roster V2
06-Oct:
Evening
```

Store:

```text
versionNumber
changedBy
changeReason
changedAt
previousVersionId
```

Do not delete V1.

---

# 32. ROSTER PUBLISHING

When an authorized user clicks:

```text
Publish Roster
```

the system must validate:

- employee exists
- shift exists
- dates valid
- no critical overlap
- leave conflicts
- department conflicts
- employee status
- required approvals

If validation succeeds:

```text
Roster → PUBLISHED
```

Employees receive notifications.

---

# 33. PUBLISH VALIDATION FAILURE

Example:

```text
EMP00125
06-Oct
Two overlapping shifts
```

Publishing must fail or require explicit authorized resolution according to policy.

Display:

```text
Cannot publish roster.

3 conflicts require resolution.
```

Do not silently publish an invalid roster.

---

# 34. NOTIFICATION AFTER PUBLISH

Use centralized Notification Service.

Employee notification:

```text
Your work schedule has been published.

06-Oct:
Morning Shift
09:00–18:00

07-Oct:
Evening Shift
14:00–23:00
```

Channels:

```text
In-App
SMS
Email
```

depending on configuration.

Notification failure must not roll back the roster.

---

# 35. SHIFT REMINDERS

Optional configurable reminder:

```text
Upcoming Shift
```

Example:

```text
Your shift tomorrow:

Morning Shift
09:00–18:00
Reception Department
```

Reminder timing must be configurable.

Do not hardcode a specific number of hours.

---

# 36. ATTENDANCE INTEGRATION

Attendance uses the published shift assignment.

Example:

```text
Shift Management:

06-Oct
09:00–18:00
```

Attendance:

```text
Actual:
09:12–18:05
```

Attendance calculates:

```text
Late = 12 minutes
```

Shift Management does not alter the attendance result.

---

# 37. ATTENDANCE RECONCILIATION

If shift changes after attendance exists:

```text
Original Shift:
09:00

New Approved Shift:
10:00
```

Attendance reconciliation must re-evaluate the relationship.

However:

**Do not rewrite historical attendance without an authorized correction/audit workflow.**

---

# 38. PAYROLL INTEGRATION

Shift Management may provide:

```text
Scheduled Working Days
Scheduled Hours
Shift Type
Approved Overtime Eligibility
Night Shift Indicator
```

Payroll Support consumes approved values.

Do not calculate salary inside Shift Management.

---

# 39. NIGHT SHIFT SUPPORT

For:

```text
22:00 → 06:00
```

the system must correctly identify the shift as one logical assignment.

Attendance should associate overnight attendance events with the appropriate shift.

Do not simply use calendar date without considering the shift's cross-midnight configuration.

---

# 40. SHIFT DIFFERENTIAL

If hospital policy supports additional compensation for specific shifts:

```text
NIGHT
WEEKEND
HOLIDAY
```

Shift Management may expose:

```text
shiftCategory
compensationCategory
```

Payroll Support determines the actual financial calculation.

Do not hardcode compensation amounts in Shift Management.

---

# 41. SHIFT CONFIGURATION

Create:

```text
ShiftConfiguration
```

or use hospital configuration for:

```text
maximumDailyAssignments
overlapTolerance
approvalRequired
swapApprovalRequired
employeePreferenceEnabled
availabilityEnabled
holidaySchedulingPolicy
leaveConflictPolicy
```

All policy values should be configurable.

---

# 42. UI STRUCTURE

Create route:

```text
/shifts
```

Pages:

```text
Shift Dashboard
Shift Definitions
Roster Calendar
Employee Schedule
Shift Change Requests
Shift Swap Requests
Conflicts
Shift Reports
Configuration
```

---

# 43. SHIFT DASHBOARD

Cards:

```text
Today's Scheduled Employees
Current Active Shifts
Upcoming Shifts
Unfilled Shifts
Pending Approvals
Shift Conflicts
Swap Requests
Change Requests
```

Filters:

```text
Department
Date
Shift
Employee
Status
```

---

# 44. SHIFT DEFINITIONS SCREEN

Route:

```text
/shifts/definitions
```

Table:

| Code | Name | Start | End | Cross Midnight | Status |
|---|---|---|---|---|---|

Actions:

```text
Create
Edit
Deactivate
Archive
View History
```

---

# 45. CREATE SHIFT SCREEN

Route:

```text
/shifts/definitions/new
```

Fields:

```text
Shift Code
Shift Name
Start Time
End Time
Cross Midnight
Break Minutes
Grace Period
Applicable Departments
Status
```

Validation:

- unique code
- valid time
- valid cross-midnight configuration
- non-negative durations
- valid department references

---

# 46. ROSTER CALENDAR SCREEN

Route:

```text
/shifts/rosters
```

Features:

- week view
- month view
- department filter
- employee filter
- shift filter
- drag/drop optional
- assignment editor
- conflict indicators

If drag/drop is implemented:

**Every change must still pass backend authorization and validation.**

Frontend drag/drop must never bypass the approval workflow.

---

# 47. EMPLOYEE SCHEDULE SCREEN

Route:

```text
/my-schedule
```

Show:

```text
Today
Upcoming
Calendar
Shift Details
Department
Location if configured
Notes
Change Request
Swap Request
```

---

# 48. SHIFT REQUEST SCREEN

Route:

```text
/my-schedule/requests
```

Employee sees:

```text
Request ID
Request Type
Date
Current Shift
Requested Shift
Reason
Status
Submitted
Reviewed
```

---

# 49. CONFLICT SCREEN

Route:

```text
/shifts/conflicts
```

Types:

```text
OVERLAPPING_SHIFT
LEAVE_CONFLICT
DEPARTMENT_CONFLICT
INACTIVE_EMPLOYEE
DUPLICATE_ASSIGNMENT
INVALID_SHIFT
MISSING_EMPLOYEE
ROSTER_CONFLICT
```

Actions:

```text
View
Resolve
Assign
Dismiss if authorized
```

---

# 50. SHIFT REPORTS

Provide:

### Employee Schedule Report

```text
Employee
Department
Date
Shift
Status
```

### Department Coverage Report

```text
Date
Department
Required Staff
Scheduled Staff
Unfilled
```

If staffing requirements are configured.

### Shift Utilization

```text
Shift
Assigned Employees
Attendance Count
Absence Count
Late Count
```

### Change Report

```text
Original Shift
New Shift
Employee
Reason
Approved By
Date
```

---

# 51. COVERAGE

If hospital configuration defines required staffing counts, support:

```text
Shift Coverage Requirement
```

Example:

```text
Reception
Morning
Required: 4
Scheduled: 3
Gap: 1
```

The system may flag:

```text
UNDERSTAFFED
```

However:

**RPA must not independently hire, assign unauthorized employees, or make clinical staffing decisions.**

Authorized management must resolve staffing gaps.

---

# 52. COVERAGE MODEL

Optional:

```javascript
{
  departmentId,
  shiftId,
  date,
  requiredCount,
  scheduledCount,
  status
}
```

Status:

```text
ADEQUATE
UNDERSTAFFED
OVERSTAFFED
REVIEW_REQUIRED
```

---

# 53. RPA ROLE

Robot Framework can automate repetitive scheduling administration.

Examples:

- import approved roster from Excel
- sync schedules to external HR system
- publish schedules
- verify external synchronization
- send reminders
- detect conflicts
- generate reports
- reconcile external schedule data

RPA must not autonomously decide staffing.

---

# 54. RPA ROSTER IMPORT

Example:

```text
Excel File
    ↓
Robot Framework
    ↓
Read Spreadsheet
    ↓
Validate Employee IDs
    ↓
Validate Shift Codes
    ↓
Validate Dates
    ↓
Submit to Hospital API
    ↓
Validate Response
    ↓
Create RPA Execution Record
```

Example Excel:

```text
Employee ID | Date       | Shift
EMP00125    | 06-10-2026 | MORNING
EMP00126    | 06-10-2026 | EVENING
```

---

# 55. RPA EXTERNAL SYSTEM SYNC

Example:

```text
Hospital Roster
       ↓
RPA
       ↓
External HR System
       ↓
Update Schedule
       ↓
Read Back Schedule
       ↓
Compare
       ↓
SUCCESS / MISMATCH
```

If mismatch:

```text
ExceptionCase
```

must be created.

Do not assume the external system accepted the update merely because the browser showed a success message.

---

# 56. RPA ROBOT STRUCTURE

Use:

```text
robot/
├── resources/
│   ├── common.resource
│   ├── auth.resource
│   ├── api.resource
│   └── notifications.resource
│
├── keywords/
│   ├── shift_keywords.resource
│   ├── roster_keywords.resource
│   ├── conflict_keywords.resource
│   └── sync_keywords.resource
│
├── tests/
│   ├── shift_import.robot
│   ├── roster_publish.robot
│   ├── shift_sync.robot
│   ├── conflict_detection.robot
│   └── notification.robot
│
├── portals/
│   └── external_hr_portal.resource
│
└── results/
```

---

# 57. ROBOT KEYWORDS

Implement reusable keywords:

```text
Login To External HR System
Read Roster File
Validate Employee IDs
Validate Shift Codes
Create Roster
Submit Roster
Publish Roster
Sync Roster
Verify External Roster
Detect Shift Conflicts
Send Shift Notification
Capture Evidence
Record RPA Result
```

---

# 58. RPA RESULT CONTRACT

Example:

```json
{
  "success": true,
  "jobType": "ROSTER_SYNC",
  "correlationId": "RPA-SHIFT-20261007-0001",
  "recordsRead": 125,
  "recordsProcessed": 123,
  "recordsSucceeded": 121,
  "recordsFailed": 2,
  "startedAt": "2026-10-07T06:00:00Z",
  "completedAt": "2026-10-07T06:05:42Z"
}
```

Store in:

```text
RPAJob
RPAExecution
```

---

# 59. RPA FAILURE HANDLING

If external scheduling portal is unavailable:

```text
RPA
 ↓
Retry
 ↓
Still failing
 ↓
ExceptionCase
 ↓
Notify HR/Admin
```

Never create a fake success status.

---

# 60. RPA SECURITY

Never put credentials in:

```text
.robot
.resource
.env committed to Git
source code
```

Use secret management.

RPA logs must not expose:

- passwords
- authentication tokens
- sensitive employee information unnecessarily

---

# 61. API DESIGN

Base:

```text
/api/shifts
```

Shift definitions:

```http
GET    /api/shifts/definitions
POST   /api/shifts/definitions
GET    /api/shifts/definitions/:id
PATCH  /api/shifts/definitions/:id
POST   /api/shifts/definitions/:id/archive
```

Rosters:

```http
GET    /api/shifts/rosters
POST   /api/shifts/rosters
GET    /api/shifts/rosters/:id
PATCH  /api/shifts/rosters/:id
POST   /api/shifts/rosters/:id/submit
POST   /api/shifts/rosters/:id/approve
POST   /api/shifts/rosters/:id/publish
```

Assignments:

```http
GET    /api/shifts/assignments
POST   /api/shifts/assignments
PATCH  /api/shifts/assignments/:id
```

Requests:

```http
POST /api/shifts/change-requests
GET  /api/shifts/change-requests
POST /api/shifts/change-requests/:id/approve
POST /api/shifts/change-requests/:id/reject
```

Swaps:

```http
POST /api/shifts/swap-requests
GET  /api/shifts/swap-requests
POST /api/shifts/swap-requests/:id/accept
POST /api/shifts/swap-requests/:id/reject
POST /api/shifts/swap-requests/:id/approve
POST /api/shifts/swap-requests/:id/reject
```

Conflicts:

```http
GET /api/shifts/conflicts
POST /api/shifts/conflicts/:id/resolve
```

---

# 62. BACKEND STRUCTURE

Implement:

```text
server/
├── models/
│   ├── Shift.js
│   ├── ShiftAssignment.js
│   ├── Roster.js
│   ├── RosterVersion.js
│   ├── ShiftChangeRequest.js
│   ├── ShiftSwapRequest.js
│   └── ShiftConflict.js
│
├── controllers/
│   └── shiftController.js
│
├── services/
│   ├── shiftService.js
│   ├── rosterService.js
│   ├── assignmentService.js
│   ├── shiftValidationService.js
│   ├── shiftRequestService.js
│   └── coverageService.js
│
├── routes/
│   └── shiftRoutes.js
│
└── validators/
    └── shiftValidators.js
```

---

# 63. FRONTEND STRUCTURE

Use:

```text
client/src/
├── portals/
│   ├── administration/
│   │   └── shifts/
│   │       ├── pages/
│   │       │   ├── ShiftDashboard.jsx
│   │       │   ├── ShiftDefinitions.jsx
│   │       │   ├── RosterCalendar.jsx
│   │       │   ├── ShiftConflicts.jsx
│   │       │   └── ShiftReports.jsx
│   │       │
│   │       └── components/
│   │           ├── ShiftForm.jsx
│   │           ├── RosterGrid.jsx
│   │           ├── AssignmentModal.jsx
│   │           ├── ConflictPanel.jsx
│   │           └── CoverageSummary.jsx
│   │
│   └── employee/
│       └── schedule/
│           ├── MySchedule.jsx
│           ├── ShiftRequests.jsx
│           └── ShiftSwapRequests.jsx
```

---

# 64. MONGODB INDEXES

Create indexes such as:

```javascript
Shift:
{
  shiftCode: 1
}
```

Use uniqueness where appropriate.

```javascript
ShiftAssignment:
{
  employeeId: 1,
  assignmentDate: 1
}
```

```javascript
ShiftAssignment:
{
  rosterId: 1,
  assignmentDate: 1
}
```

```javascript
Roster:
{
  departmentId: 1,
  periodStart: 1,
  periodEnd: 1
}
```

```javascript
ShiftChangeRequest:
{
  employeeId: 1,
  status: 1,
  requestedAt: -1
}
```

```javascript
ShiftSwapRequest:
{
  requesterEmployeeId: 1,
  status: 1
}
```

Indexes must support the actual query patterns used by the application.

---

# 65. AUDIT LOGGING

Record:

```text
Shift Created
Shift Updated
Shift Deactivated
Roster Created
Roster Modified
Roster Submitted
Roster Approved
Roster Published
Assignment Created
Assignment Changed
Shift Change Requested
Shift Change Approved
Shift Swap Requested
Shift Swap Approved
Conflict Detected
Conflict Resolved
RPA Sync Executed
External Sync Failed
```

Example:

```javascript
{
  actorUserId,
  action: "ROSTER_PUBLISHED",
  entityType: "Roster",
  entityId,
  before,
  after,
  reason,
  timestamp,
  correlationId
}
```

---

# 66. VERSIONING AND HISTORY

Never destroy historical scheduling information.

Maintain:

```text
Roster Version
Assignment History
Shift Change History
Swap History
Approval History
```

Historical attendance must remain understandable even if shift definitions later change.

---

# 67. EXCEPTION MANAGEMENT

Create `ExceptionCase` for:

```text
SHIFT_OVERLAP
LEAVE_CONFLICT
INVALID_EMPLOYEE
INACTIVE_EMPLOYEE
DEPARTMENT_CONFLICT
INVALID_SHIFT
ROSTER_CONFLICT
EXTERNAL_SYNC_FAILURE
RPA_FAILURE
PUBLISH_FAILURE
UNRESOLVED_SWAP
```

Each exception should contain:

```text
Exception ID
Type
Entity
Description
Priority
Assigned To
Status
Created At
Resolved At
Resolution
```

---

# 68. HUMAN APPROVAL

Approval is required when configured for:

- roster publication
- shift changes
- shift swaps
- changes to published schedules
- policy-sensitive exceptions

RPA may prepare data for approval but cannot impersonate the approving person.

Do not allow:

```text
RPA account → automatically approves its own generated roster
```

---

# 69. NOTIFICATION EVENTS

Send notifications for:

```text
Roster Published
Roster Changed
Shift Change Requested
Shift Change Approved
Shift Change Rejected
Shift Swap Requested
Shift Swap Accepted
Shift Swap Approved
Shift Swap Rejected
Upcoming Shift
Roster Conflict
Unresolved Scheduling Exception
```

Use centralized Notification Service.

---

# 70. DOCUMENTS

Possible generated documents:

```text
Employee Shift Schedule
Department Roster
Monthly Roster
Shift Change Approval
Shift Swap Confirmation
Shift Coverage Report
```

Use centralized Document Generation.

Do not implement a second document engine.

---

# 71. REPORTING

Reports should support:

```text
Department
Employee
Date Range
Shift
Status
```

Export formats:

```text
CSV
Excel
PDF
```

Authorization must apply to exports.

---

# 72. SEARCH AND FILTERING

Support:

```text
Employee ID
Employee Name
Department
Shift
Date
Roster
Status
```

Search must be server-side for large datasets.

Do not load the entire employee roster into the browser unnecessarily.

---

# 73. PERFORMANCE

The module must support large hospital rosters.

Implement:

- server-side pagination
- server-side filtering
- indexed queries
- debounced search
- efficient roster loading
- lazy loading
- batch APIs where appropriate

Do not make one API request per employee when loading a roster.

---

# 74. CONCURRENCY

Prevent:

```text
Two users assigning different shifts simultaneously
Two users publishing same roster
Two users approving same request
Two RPA jobs modifying same roster
```

Use:

- version checks
- transaction/session where needed
- status validation
- idempotency
- optimistic locking where appropriate

---

# 75. ROSTER IMPORT

Support:

```text
CSV
Excel
API
RPA
```

Example:

```text
Employee ID | Date | Shift Code | Department
EMP00125 | 06-Oct-2026 | MORNING | Administration
```

Validation must happen before committing assignments.

---

# 76. IMPORT PREVIEW

Before import:

```text
Total Rows: 250
Valid: 242
Invalid: 8
Conflicts: 5
```

Display errors:

```text
Row 42:
EMP99999 not found

Row 58:
Shift code NIGHT2 does not exist
```

User must explicitly confirm import.

---

# 77. PARTIAL IMPORT POLICY

Do not silently import only valid rows.

Use explicit configuration:

```text
ALL_OR_NOTHING
```

or:

```text
ALLOW_VALID_ROWS_WITH_ERROR_REPORT
```

Default should favor safety.

---

# 78. EMPLOYEE SELF-SERVICE

Employee dashboard:

```text
Today
Upcoming Shifts
Calendar
Shift Details
Requests
Swap Requests
```

Example:

```text
Today

Morning Shift
09:00–18:00
Administration
```

---

# 79. SHIFT REQUEST SECURITY

Employee may request only changes to their own assignments.

Backend must verify:

```text
authenticatedUser.employeeId === requestedEmployeeId
```

Do not trust employee ID supplied by the frontend.

---

# 80. MANAGER ACCESS

Managers should only access employees they are authorized to manage.

Use:

```text
RBAC
+
Department Scope
+
Manager Assignment
```

Do not give every manager organization-wide access automatically.

---

# 81. SEED DATA

Create:

### Shifts

```text
MORNING
09:00–18:00

EVENING
14:00–23:00

NIGHT
22:00–06:00
```

### Employees

Use existing Staff Management seed employees.

### Rosters

Create sample rosters for:

```text
Administration
Reception
Pharmacy
Laboratory
```

Include:

- normal assignments
- night shift
- leave conflict
- swap request
- shift change
- unresolved conflict

---

# 82. END-TO-END EXAMPLE

Employee:

```text
EMP00125
Rahul Shah
Administration
```

Scheduler creates:

```text
Roster:
05-Oct-2026 → 11-Oct-2026
```

Assignments:

```text
Monday    Morning
Tuesday   Morning
Wednesday Evening
Thursday  Morning
Friday    Morning
Saturday  OFF
Sunday    OFF
```

System validates:

```text
Employee exists = YES
Shifts exist = YES
Overlaps = NONE
Leave conflicts = NONE
Employee status = ACTIVE
```

Roster:

```text
DRAFT
```

Manager submits:

```text
PENDING_APPROVAL
```

HR approves:

```text
APPROVED
```

Manager publishes:

```text
PUBLISHED
```

Employee receives notification.

Attendance later consumes:

```text
06-Oct
Morning
09:00–18:00
```

Employee checks in:

```text
09:12
```

Attendance calculates:

```text
Late = 12 minutes
```

The shift itself remains:

```text
09:00–18:00
```

Attendance and Shift Management remain separate sources of truth.

---

# 83. SHIFT CHANGE EXAMPLE

Employee requests:

```text
07-Oct

Current:
Morning

Requested:
Evening

Reason:
Personal requirement
```

System checks:

```text
Employee active = YES
Requested shift exists = YES
Overlap = NONE
Leave conflict = NONE
Department = compatible
```

Request:

```text
PENDING_APPROVAL
```

Manager approves.

System:

```text
Creates new assignment version
Preserves old assignment
Updates published roster
Creates audit event
Notifies employee
```

---

# 84. SHIFT SWAP EXAMPLE

Employee A:

```text
Morning
```

Employee B:

```text
Evening
```

Employee A requests swap.

Employee B accepts.

System checks:

```text
Both employees active
No leave conflict
No overlap
Department allowed
Required approvals present
```

Manager approves.

Result:

```text
Employee A → Evening
Employee B → Morning
```

All original assignments and approval history remain auditable.

---

# 85. ACCEPTANCE CRITERIA

The Shift Management module is complete only when:

- shift definitions can be created
- shifts can cross midnight
- shifts can be activated/deactivated
- employees can be assigned
- rosters can be created
- weekly/monthly schedules work
- conflicts are detected
- leave conflicts are detected
- employee status conflicts are detected
- published rosters are protected
- roster versions are preserved
- shift changes work
- shift swaps work
- approvals work
- employee self-service works
- notifications work
- attendance can consume published assignments
- historical schedules remain intact
- reports work
- imports work
- imports are validated
- duplicate assignments are prevented
- RPA synchronization works
- RPA failures create exceptions
- external sync is verified
- RBAC works
- department-level access works
- audit logs are generated
- unauthorized API access is blocked
- no autonomous clinical staffing decisions are made.

---

# 86. IMPLEMENTATION ORDER FOR AI CODING AGENT

Implement in this order.

## Phase 1 — Models

Create:

```text
Shift
ShiftAssignment
Roster
RosterVersion
ShiftChangeRequest
ShiftSwapRequest
ShiftConflict
EmployeeAvailability
```

---

## Phase 2 — Shift Definitions

Implement:

```text
Create
Edit
Activate
Deactivate
Archive
History
```

---

## Phase 3 — Roster Engine

Implement:

```text
Create roster
Add assignments
Validate assignments
Detect conflicts
Submit
Approve
Publish
Version
```

---

## Phase 4 — Employee Self-Service

Implement:

```text
My Schedule
Shift Change
Shift Swap
Availability
Request History
```

---

## Phase 5 — Manager/HR UI

Implement:

```text
Dashboard
Roster Calendar
Conflict Queue
Approval Queue
Reports
```

---

## Phase 6 — Integrations

Connect:

```text
Staff
Attendance
Leave
Payroll
Notification
Documents
Audit
Exception
RPA
```

---

## Phase 7 — RPA

Implement:

```text
Roster Import
External Sync
Read-Back Verification
Conflict Detection
Notifications
RPA Logging
```

---

## Phase 8 — Testing

Run:

```text
Unit Tests
API Tests
Frontend Tests
RBAC Tests
Concurrency Tests
Import Tests
RPA Tests
End-to-End Tests
```

---

# 87. STRICT RULES FOR THE AI CODING AGENT

1. Do not duplicate Employee data.
2. Use Employee ID from Staff Management.
3. Do not duplicate Leave Management.
4. Do not duplicate Attendance Management.
5. Shift Management owns planned schedules.
6. Attendance owns actual attendance.
7. Do not modify attendance directly from Shift Management.
8. Published schedules must be versioned.
9. Never silently overwrite historical assignments.
10. Do not automatically approve employee requests.
11. Do not allow RPA to approve its own actions.
12. Do not create employees automatically.
13. Do not assign terminated employees.
14. Do not silently override approved leave.
15. Do not invent shift definitions.
16. Do not assume weekends are always off.
17. Support cross-midnight shifts correctly.
18. Do not assume overtime is approved merely because a shift was exceeded.
19. Payroll owns monetary calculations.
20. Do not make clinical staffing decisions.
21. Use centralized Notification Service.
22. Use centralized Document Generation.
23. Use centralized Audit Logging.
24. Use centralized Exception Management.
25. Enforce authorization on backend APIs.
26. Do not trust employee IDs from frontend requests.
27. Protect published rosters from unauthorized modification.
28. Preserve roster versions.
29. Make RPA jobs idempotent.
30. Verify external-system updates through read-back where possible.
31. Store RPA correlation IDs.
32. Never expose external-system credentials.
33. Do not hardcode hospital scheduling policies.
34. Make scheduling rules configurable.
35. Keep the module integrated with the existing MERN architecture.

---

# 88. FINAL DEFINITION OF DONE

The module must provide this complete administrative lifecycle:

```text
Shift Definition
      ↓
Roster Creation
      ↓
Employee Assignment
      ↓
Conflict Detection
      ↓
Approval
      ↓
Roster Publication
      ↓
Employee Notification
      ↓
Attendance Reconciliation
      ↓
Shift Change / Swap
      ↓
Versioning
      ↓
Audit
      ↓
Reporting
      ↓
RPA Synchronization
```

The result must be:

**secure, auditable, configurable, versioned, RBAC-protected, concurrency-safe, integrated with Attendance/Leave/Staff/Payroll, and suitable for real hospital administrative operations.**

Robot Framework should automate repetitive scheduling and synchronization tasks, but authorized hospital personnel remain responsible for approval and workforce decisions.