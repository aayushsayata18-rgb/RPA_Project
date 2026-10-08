# 24 — HOUSEKEEPING MANAGEMENT

## 1. MODULE OVERVIEW

### Module Name
**Housekeeping Management**

### Module Code
`HK`

### Purpose

Build a complete hospital housekeeping management module within the existing MERN-based Hospital Administrative Automation & RPA Platform.

The module must manage the complete administrative and operational lifecycle of hospital housekeeping activities, including:

- Housekeeping task management
- Cleaning requests
- Routine cleaning schedules
- Patient-room turnover
- Discharge-room cleaning
- Bed-area cleaning coordination
- Ward/room/area management
- Cleaning task assignment
- Housekeeping staff assignment
- Shift-based housekeeping
- Cleaning checklists
- Inspection and verification
- Cleaning status tracking
- Consumable usage
- Housekeeping inventory integration
- Waste/linen workflow references where configured
- Priority and SLA management
- Escalation
- Vendor housekeeping support
- Housekeeping performance tracking
- Notifications
- RPA automation
- Exceptions
- Audit trail
- Operational reports and analytics

The core lifecycle must support:

```text
Cleaning Need
   ↓
Request / Scheduled Task
   ↓
Validate Location
   ↓
Priority / SLA
   ↓
Assign Housekeeping Staff
   ↓
Task Started
   ↓
Cleaning Performed
   ↓
Checklist
   ↓
Inspection / Verification
   ↓
Area Available
   ↓
Task Closed
   ↓
Audit / Analytics
```

For patient-room turnover:

```text
Patient Discharge
      ↓
Bed Status = CLEANING REQUIRED
      ↓
Housekeeping Task
      ↓
Room/Bed Cleaning
      ↓
Inspection
      ↓
Bed/Room Available
```

---

# 2. CRITICAL SAFETY AND CLINICAL BOUNDARY

Housekeeping is an administrative/operational module.

It must NOT autonomously make clinical decisions.

The system and RPA must NEVER:

- Diagnose infection.
- Determine whether a patient has an infectious disease.
- Decide clinical isolation requirements.
- Decide whether a patient is medically fit for discharge.
- Decide whether a patient can occupy a room.
- Override infection-control personnel.
- Change clinical isolation status.
- Decide treatment.
- Interpret laboratory results.
- Interpret radiology results.
- Determine clinical priority.
- Declare a room clinically safe when an authorized inspection is required.
- Override hospital infection-control policy.
- Invent cleaning chemicals or concentrations.
- Invent decontamination procedures.
- Automatically classify a room as infection-risk based on patient diagnosis unless explicitly supplied by authorized hospital systems.

The system may automate:

```text
Request
→ Route
→ Assign
→ Schedule
→ Notify
→ Track
→ Verify configured operational conditions
→ Update
→ Audit
```

Where a safety-sensitive condition exists:

```text
Exception
   ↓
Authorized Human Review
   ↓
Decision
   ↓
Housekeeping Workflow Continues
```

---

# 3. ARCHITECTURE

Use the existing MERN architecture.

```text id="h7q2p8"
React.js
   │
   │ REST API
   ▼
Node.js + Express.js
   │
   ├── Housekeeping Controllers
   ├── Housekeeping Services
   ├── Task Scheduling
   ├── Assignment Service
   ├── Checklist Service
   ├── Inspection Service
   ├── Inventory Integration
   ├── Bed Integration
   ├── Admission Integration
   ├── Notification Service
   ├── Document Service
   ├── RPA Job Service
   └── Audit Service
   │
   ▼
MongoDB + Mongoose
```

Housekeeping integrates with:

```text id="h8x4c2"
Bed Management
Admission
Discharge
Staff Management
Shift Management
Medical Inventory
Notification Service
Document Generation
Reports & Analytics
RPA
```

---

# 4. ACTORS

## 4.1 Housekeeping Staff

Can:

- View assigned tasks.
- Accept task.
- Start task.
- Complete cleaning checklist.
- Record completion.
- Report issues.
- Request consumables.
- Upload evidence where configured.

Cannot:

- Change room ownership.
- Change bed assignment.
- Mark a clinically restricted room safe.
- Override infection-control decisions.
- Close tasks requiring supervisor inspection without authorization.

---

# 5. HOUSEKEEPING SUPERVISOR

Can:

- View all housekeeping tasks.
- Assign staff.
- Reassign tasks.
- Schedule routine cleaning.
- Review exceptions.
- Verify completed tasks.
- Inspect completed work.
- Reopen tasks.
- Monitor SLA.
- Monitor staffing coverage.

---

# 6. INFECTION CONTROL / AUTHORIZED SAFETY ROLE

If such a role exists in the hospital system, it may:

- Define or approve specialized cleaning requirements.
- Review restricted cleaning conditions.
- Approve return-to-use conditions where policy requires.

The system must not invent infection-control policies.

---

# 7. RECEPTION / OPERATIONS

Can:

- Create housekeeping requests.
- View task status.
- Request cleaning for operational areas.

---

# 8. NURSE / CLINICAL STAFF

Can:

- Request room/area cleaning.
- Request spill cleanup.
- Request urgent housekeeping.
- View relevant cleaning status.

They cannot alter housekeeping records without appropriate permissions.

---

# 9. ADMINISTRATIVE MANAGER

Can:

- View housekeeping performance.
- View SLA metrics.
- Review staffing.
- Review vendor performance.
- Review costs.
- Configure operational policies.

---

# 10. VENDOR

If outsourced housekeeping is enabled:

- View assigned tasks only.
- Accept assignments.
- Update work status.
- Upload service documentation.
- Submit task completion.

Vendor access must be strictly scoped.

---

# 11. HOUSEKEEPING AREA MASTER

Create:

`HousekeepingArea`

An area represents a physical location requiring housekeeping.

Examples:

```text id="q7w4m2"
Patient Room
Ward
ICU Area
OPD Area
Waiting Area
Corridor
Reception
Laboratory Area
Radiology Area
Pharmacy Area
Office
Restroom
Cafeteria
Storage Area
Other
```

These are configurable examples.

---

# 12. AREA MODEL

```javascript id="v3f8p2"
{
  areaId: String,

  areaCode: String,

  name: String,

  areaType: String,

  buildingId: ObjectId,

  floorId: ObjectId,

  departmentId: ObjectId,

  roomId: ObjectId,

  bedId: ObjectId,

  status: String,

  cleaningFrequency: String,

  active: Boolean,

  notes: String,

  createdAt: Date,

  updatedAt: Date
}
```

Use existing hospital location/ward/room/bed entities where available.

Do not create duplicate location masters.

---

# 13. AREA STATUS

Use configurable statuses:

```text id="n5r2x7"
AVAILABLE
OCCUPIED
CLEANING_REQUIRED
CLEANING_IN_PROGRESS
PENDING_INSPECTION
RESTRICTED
OUT_OF_SERVICE
INACTIVE
```

The system must not automatically infer clinical restriction.

---

# 14. HOUSEKEEPING TASK

Create:

`HousekeepingTask`

## Fields

```javascript id="c4m9w2"
{
  taskId: String,

  taskNumber: String,

  areaId: ObjectId,

  roomId: ObjectId,

  bedId: ObjectId,

  sourceModule: String,

  sourceEntityId: String,

  taskType: String,

  priority: String,

  description: String,

  requestedBy: ObjectId,

  assignedTo: ObjectId,

  assignedVendorId: ObjectId,

  scheduledStart: Date,

  scheduledEnd: Date,

  actualStart: Date,

  actualEnd: Date,

  status: String,

  checklistId: ObjectId,

  inspectionRequired: Boolean,

  inspectionStatus: String,

  completionNotes: String,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 15. TASK NUMBER

Generate unique task numbers.

Example:

```text id="h5v8x1"
HK-2026-000001
HK-2026-000002
HK-2026-000003
```

Generation must be backend-controlled and concurrency-safe.

---

# 16. TASK SOURCES

Support:

```text id="k3q7z1"
MANUAL_REQUEST
DISCHARGE
BED_TURNOVER
SCHEDULED_CLEANING
URGENT_REQUEST
MAINTENANCE_COMPLETION
PATIENT_REQUEST
DEPARTMENT_REQUEST
RPA_IMPORT
EXTERNAL_SYSTEM
```

---

# 17. TASK TYPES

Support configurable types:

```text id="w6x2p9"
ROUTINE_CLEANING
DEEP_CLEANING
PATIENT_ROOM_TURNOVER
BED_AREA_CLEANING
SPILL_CLEANUP
RESTROOM_CLEANING
WARD_CLEANING
COMMON_AREA_CLEANING
EMERGENCY_CLEANING
POST_MAINTENANCE_CLEANING
OTHER
```

---

# 18. TASK PRIORITY

Use:

```text id="c7m1q8"
LOW
MEDIUM
HIGH
URGENT
CRITICAL
```

Priority is operational.

The system must not infer clinical urgency.

---

# 19. TASK STATUS

Use:

```text id="z8w4n2"
DRAFT
SUBMITTED
PENDING_ASSIGNMENT
ASSIGNED
ACCEPTED
SCHEDULED
IN_PROGRESS
ON_HOLD
WAITING_FOR_SUPPLIES
PENDING_INSPECTION
COMPLETED
VERIFIED
CLOSED
REOPENED
CANCELLED
```

---

# 20. STANDARD HOUSEKEEPING WORKFLOW

```text id="r5x8q2"
Request / Schedule
      ↓
Validate Area
      ↓
Create Task
      ↓
Assign Staff
      ↓
Schedule
      ↓
Staff Accepts
      ↓
Start Cleaning
      ↓
Complete Checklist
      ↓
Submit Completion
      ↓
Inspection if Required
      ↓
Verify
      ↓
Close
      ↓
Update Area/Bed State
      ↓
Notify
      ↓
Audit
```

---

# 21. ROUTINE CLEANING

Routine cleaning should support recurring schedules.

Example:

```text id="w9k3m7"
Area:
OPD Waiting Area

Frequency:
Every 2 hours

Schedule:
09:00
11:00
13:00
15:00
17:00
```

Actual frequency must be configurable.

---

# 22. RECURRING HOUSEKEEPING PLAN

Create:

`HousekeepingSchedule`

```javascript id="f7n3c9"
{
  scheduleId: String,

  areaId: ObjectId,

  taskType: String,

  frequencyType: String,

  intervalValue: Number,

  startDate: Date,

  endDate: Date,

  preferredShiftId: ObjectId,

  checklistId: ObjectId,

  assignedTeamId: ObjectId,

  active: Boolean,

  createdBy: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 23. FREQUENCY TYPES

Support:

```text id="v5x2q9"
HOURLY
DAILY
WEEKLY
MONTHLY
CUSTOM
SHIFT_BASED
```

---

# 24. PATIENT ROOM TURNOVER

This is an important integration with Discharge and Bed Management.

When a patient is discharged:

```text id="x3q7m2"
Discharge Completed
      ↓
Bed Status = CLEANING_REQUIRED
      ↓
Housekeeping Task Created
      ↓
Housekeeping Assigned
      ↓
Cleaning
      ↓
Inspection if Required
      ↓
Bed Status = AVAILABLE
```

Housekeeping must NOT mark the bed available before the configured completion/inspection process is complete.

---

# 25. BED MANAGEMENT INTEGRATION

Bed Management remains the source of truth for:

- Bed ID
- Ward
- Bed status
- Bed assignment

Housekeeping receives a cleaning request.

It must not directly manipulate bed status without calling the Bed Management service.

---

# 26. BED TURNOVER TASK

Create:

```text id="y4m8c3"
sourceModule = BED_MANAGEMENT
sourceEntityId = BedAssignment / Bed ID
taskType = PATIENT_ROOM_TURNOVER
```

Example:

```text id="f8n2w6"
Bed:
B-203

Previous Status:
OCCUPIED

New operational state:
CLEANING_REQUIRED
```

---

# 27. DISCHARGE INTEGRATION

After discharge:

```text id="v2m7x5"
Discharge
 ↓
Bed Management
 ↓
CLEANING_REQUIRED
 ↓
Housekeeping
```

Housekeeping should not independently determine whether discharge is medically complete.

---

# 28. ROOM TURNOVER STATUS

Track:

```text id="m5x8q2"
WAITING_FOR_CLEANING
ASSIGNED
IN_PROGRESS
PENDING_INSPECTION
CLEAN
VERIFIED
RELEASED
```

---

# 29. HOUSEKEEPING CHECKLIST

Create:

`HousekeepingChecklist`

```javascript id="n7c4x1"
{
  checklistId: String,

  name: String,

  taskType: String,

  version: Number,

  items: [
    {
      itemId: String,
      description: String,
      required: Boolean,
      responseType: String
    }
  ],

  status: String,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 30. CHECKLIST RESPONSE TYPES

Support:

```text id="p4q8x3"
YES_NO
PASS_FAIL
TEXT
NUMBER
CHECKBOX
NOT_APPLICABLE
```

The checklist must be configurable.

---

# 31. CLEANING CHECKLIST

Example:

```text id="q7x1m5"
Room cleaning completed
Floor cleaned
Surfaces cleaned
Bed area cleaned
Waste removed
Restroom cleaned
Supplies replenished
Equipment area cleaned
Final inspection requested
```

These are administrative checklist examples.

The hospital can configure actual checklist items.

---

# 32. CLEANING COMPLETION

Housekeeping staff selects:

```text id="r9w4c2"
Start Task
```

System records:

```text id="n6x2p8"
Actual Start
User
Task
Area
```

On completion:

```text id="m7q3x1"
Actual End
Checklist
Notes
Evidence
```

Status:

```text id="w8c5v2"
PENDING_INSPECTION
```

if inspection is required.

Otherwise:

```text id="e4m7q1"
COMPLETED
```

---

# 33. INSPECTION

Inspection may be performed by:

- Housekeeping Supervisor
- Authorized Operations Staff
- Other configured role

Inspection status:

```text id="z3n8w2"
PENDING
PASSED
FAILED
NOT_REQUIRED
```

---

# 34. INSPECTION FAILURE

If cleaning fails inspection:

```text id="x6q2m9"
PENDING_INSPECTION
      ↓
FAILED
      ↓
REOPENED
      ↓
Housekeeping Rework
      ↓
Inspection Again
```

Do not simply close the task.

---

# 35. AREA RETURN TO AVAILABLE

For areas requiring inspection:

```text id="q9w3m1"
Cleaning Completed
      ↓
Inspection Passed
      ↓
Area Released
```

The system may update operational availability according to configured policy.

---

# 36. ROOM AVAILABILITY SAFETY

Housekeeping cannot independently determine that a room is clinically suitable for a patient.

If infection-control or safety clearance is required:

```text id="n8x4c7"
Housekeeping Completed
 ↓
Required Authorized Clearance
 ↓
Room Released
```

---

# 37. SPECIAL CLEANING

Support special cleaning requests such as:

```text id="p2m7x9"
Deep Cleaning
Spill Cleanup
Post-Maintenance Cleaning
High-Level Cleaning
Room Turnover
```

The actual procedures must be configured by authorized hospital personnel.

---

# 38. NO INVENTED CLEANING PROCEDURES

The application must not automatically generate:

- Chemical concentrations
- Contact times
- Sterilization procedures
- Infection-control procedures

unless those are explicitly configured by authorized hospital personnel.

---

# 39. HOUSEKEEPING STAFF ASSIGNMENT

Assignment can consider:

- Shift
- Availability
- Department
- Workload
- Skills where configured
- Location

The final assignment must follow configured authorization.

---

# 40. SHIFT INTEGRATION

Housekeeping assignment should integrate with Shift Management.

Before assignment:

```text id="h4x7p2"
Is employee scheduled?
Is employee active?
Is employee available?
```

If not:

```text id="z5m9q1"
Assignment conflict
```

Do not automatically assign unavailable staff.

---

# 41. ATTENDANCE INTEGRATION

Attendance may be used to determine operational availability.

For example:

```text id="c8x2m7"
Employee scheduled
+
Attendance = ABSENT
```

The system may flag:

```text id="v5q1n8"
Assignment may need reassignment.
```

Do not automatically manipulate attendance.

---

# 42. STAFFING DASHBOARD

Display:

```text id="m9w3c2"
Scheduled Staff
Present Staff
Assigned Tasks
Unassigned Tasks
Overdue Tasks
Tasks per Employee
```

Attendance remains authoritative in Attendance Management.

---

# 43. HOUSEKEEPING CONSUMABLES

Possible items:

```text id="q2m8x4"
Cleaning Supplies
Garbage Bags
Mops
Gloves
Masks
Cleaning Cloths
Paper Products
Other configured supplies
```

Medical Inventory remains the inventory source of truth.

---

# 44. CONSUMABLE REQUEST

Create:

`HousekeepingSupplyRequest`

```javascript id="w4c7n1"
{
  requestId: String,

  taskId: ObjectId,

  inventoryItemId: ObjectId,

  quantityRequested: Number,

  quantityIssued: Number,

  status: String,

  requestedBy: ObjectId,

  approvedBy: ObjectId,

  issuedBy: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 45. SUPPLY REQUEST STATUS

```text id="p6x3m8"
REQUESTED
PENDING_APPROVAL
APPROVED
REJECTED
PARTIALLY_ISSUED
ISSUED
RETURNED
CANCELLED
```

---

# 46. INVENTORY INTEGRATION

Workflow:

```text id="z7m2q5"
Housekeeping
 ↓
Supply Request
 ↓
Inventory Check
 ↓
Issue
 ↓
Medical Inventory
 ↓
Stock Movement
```

Housekeeping must not directly edit inventory quantities.

---

# 47. INVENTORY IDEMPOTENCY

Use:

```text id="v8c3x1"
sourceModule = HOUSEKEEPING
sourceEntityId = SupplyRequest ID
```

A retry must not issue duplicate supplies.

---

# 48. WASTE MANAGEMENT REFERENCE

If the hospital separately implements a Waste Management module in the future, Housekeeping should integrate through defined APIs.

Do not implement an unrelated full waste-management system inside this module.

Housekeeping may record:

```text id="k5n2q7"
Waste collection requested
Waste collection completed
```

where required.

---

# 49. LINEN MANAGEMENT REFERENCE

If Linen Management is later implemented separately, Housekeeping should integrate with it.

Do not duplicate linen inventory.

Possible integration:

```text id="q8m4x2"
Room Turnover
 ↓
Linen Requirement
 ↓
Linen Service
```

---

# 50. MAINTENANCE INTEGRATION

After maintenance:

```text id="m3q7x8"
Maintenance Work Order
      ↓
Maintenance Completed
      ↓
Post-Maintenance Cleaning Task
      ↓
Housekeeping
```

This task can be generated automatically according to configured rules.

---

# 51. MAINTENANCE CLEANING

Example:

```text id="x2w5m9"
Asset:
HVAC Unit

Maintenance:
Completed

System:
Create housekeeping task

Type:
POST_MAINTENANCE_CLEANING
```

---

# 52. URGENT CLEANING REQUEST

Workflow:

```text id="v7q2n5"
Requester
 ↓
Urgent Request
 ↓
Supervisor
 ↓
Assign Available Staff
 ↓
Task
```

RPA may route and notify.

It must not infer clinical urgency.

---

# 53. HOUSEKEEPING SLA

Configure:

```text id="c5m8x1"
Priority
Response Time
Target Completion Time
Escalation Time
```

Example:

```javascript id="m4q7z2"
{
  priority: "HIGH",
  responseMinutes: 15,
  completionMinutes: 60
}
```

Example only.

---

# 54. SLA STATUS

Use:

```text id="x8n2p6"
NOT_STARTED
WITHIN_SLA
AT_RISK
BREACHED
COMPLETED
```

---

# 55. ESCALATION

If task approaches SLA breach:

```text id="r4w7c1"
Notify Supervisor
```

If SLA breached:

```text id="q9m3x5"
Notify Supervisor
Notify Manager if configured
Create SLA exception
```

Do not alter task status incorrectly.

---

# 56. HOUSEKEEPING EXCEPTION

Create:

`HousekeepingException`

```javascript id="y5q8m2"
{
  exceptionId: String,

  type: String,

  severity: String,

  taskId: ObjectId,

  areaId: ObjectId,

  source: String,

  description: String,

  status: String,

  assignedTo: ObjectId,

  resolution: String,

  resolvedBy: ObjectId,

  resolvedAt: Date,

  rpaJobId: ObjectId,

  evidenceDocumentId: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 57. EXCEPTION TYPES

Support:

```text id="w3m7x9"
AREA_NOT_FOUND
BED_NOT_FOUND
DUPLICATE_TASK
ASSIGNMENT_CONFLICT
STAFF_UNAVAILABLE
SUPPLY_UNAVAILABLE
INVENTORY_SYNC_FAILURE
SCHEDULE_CONFLICT
SLA_BREACH
INSPECTION_FAILED
RESTRICTED_AREA
MAINTENANCE_DEPENDENCY
EXTERNAL_SYSTEM_FAILURE
UNKNOWN_EXTERNAL_STATE
DOCUMENT_FAILURE
NOTIFICATION_FAILURE
```

---

# 58. EXCEPTION STATUS

```text id="c6q1n8"
OPEN
UNDER_REVIEW
WAITING_FOR_USER
WAITING_FOR_EXTERNAL_SYSTEM
RESOLVED
CANCELLED
```

---

# 59. EXCEPTION SEVERITY

```text id="m8x3p2"
LOW
MEDIUM
HIGH
CRITICAL
```

---

# 60. HOUSEKEEPING DASHBOARD

Display:

```text id="n7q4c9"
Open Tasks
Pending Assignment
In Progress
Pending Inspection
Overdue
SLA At Risk
SLA Breached
Waiting for Supplies
Room Turnovers
Urgent Requests
Failed Inspections
Exceptions
```

---

# 61. ROOM TURNOVER DASHBOARD

Display:

```text id="x2m7w4"
Beds Awaiting Cleaning
Cleaning In Progress
Pending Inspection
Ready for Release
Overdue Turnovers
```

This should integrate with Bed Management.

---

# 62. STAFF DASHBOARD

Display:

```text id="p8c3n5"
Available Staff
Assigned Staff
Unassigned Tasks
Tasks per Staff
Overdue Tasks
Shift
Attendance Status
```

Do not modify Attendance from this dashboard.

---

# 63. HOUSEKEEPING CALENDAR

Support:

```text id="q5w8m2"
Daily
Weekly
Monthly
Shift
```

Filters:

```text id="v7x2c4"
Area
Task Type
Staff
Department
Priority
Status
```

---

# 64. TASK SCREEN

Columns:

```text id="m4n7q2"
Task ID
Area
Room
Bed
Task Type
Priority
Assigned Staff
Scheduled Time
Status
SLA
Actions
```

Actions:

```text id="x8c5p1"
View
Assign
Schedule
Start
Hold
Complete
Inspect
Verify
Close
Reopen
```

RBAC must control actions.

---

# 65. HOUSEKEEPING STAFF WORKSPACE

Display:

```text id="w3q7m8"
My Tasks
Today's Schedule
In Progress
Waiting for Supplies
Completed
```

Task detail:

```text id="n2x5c9"
Location
Task
Priority
Instructions
Checklist
Supplies
Start
Complete
```

---

# 66. INSPECTION WORKSPACE

Supervisor sees:

```text id="c7m2q4"
Task
Area
Staff
Completed Time
Checklist
Notes
Evidence
```

Actions:

```text id="p8x3n5"
Pass
Fail
Reopen
```

---

# 67. PATIENT PORTAL

Patients may see:

```text id="m5q8x2"
Room Cleaning Request
Status
```

if hospital policy allows patient-generated requests.

Example:

```text id="v7c3n9"
Request:
Room cleaning

Status:
Assigned
```

Patients must not see internal staff information unless configured.

---

# 68. NOTIFICATIONS

Use centralized Notification Service.

Events:

```text id="q3m7x8"
Cleaning Request Submitted
Task Assigned
Task Scheduled
Task Started
Task Completed
Inspection Required
Inspection Failed
Task Closed
SLA At Risk
SLA Breached
Supply Unavailable
Room Turnover Completed
```

---

# 69. NOTIFICATION FAILURE

If:

```text id="n8w2c5"
Task = COMPLETED
Notification = FAILED
```

do not revert task status.

Track notification separately.

---

# 70. DOCUMENTS

Possible documents:

```text id="x5q7m3"
Housekeeping Request
Housekeeping Work Order
Cleaning Checklist
Inspection Record
Vendor Service Report
Housekeeping Daily Report
```

Use centralized Document Generation.

---

# 71. HOUSEKEEPING DAILY REPORT

Generate:

```text id="m4c8x2"
Date
Department
Area
Tasks Scheduled
Tasks Completed
Pending
Overdue
SLA Breaches
Inspection Failures
Staff
Vendor Tasks
```

---

# 72. VENDOR HOUSEKEEPING

If housekeeping is outsourced:

```text id="q7n3w5"
Housekeeping Task
 ↓
Vendor Assignment
 ↓
Vendor Accepts
 ↓
Task
 ↓
Completion
 ↓
Hospital Verification
 ↓
Close
```

Vendor Management remains the source of truth for vendor identity.

---

# 73. VENDOR ACCESS

Vendor sees only:

```text id="x2m8q4"
Assigned Tasks
Assigned Locations
Required Instructions
Task Status
Service Documents
```

No access to:

```text id="v5c7n2"
Patient medical information
Unrelated staff information
Other vendor tasks
Financial data
```

unless explicitly authorized.

---

# 74. RPA ROLE

Robot Framework may automate:

- Importing cleaning schedules.
- Creating housekeeping tasks from external systems.
- Creating room-turnover tasks.
- Syncing task statuses.
- Sending notifications.
- Generating daily reports.
- Reconciliation.
- Updating external facility systems.
- Vendor task status synchronization.

RPA must not:

- Determine clinical priority.
- Determine infection-control requirements.
- Declare room clinically safe.
- Override supervisor inspection.
- Approve financial adjustments.

---

# 75. RPA BED TURNOVER FLOW

```text id="z6m3q8"
Bed Management
 ↓
Bed = CLEANING_REQUIRED
 ↓
RPA Job
 ↓
Create Housekeeping Task
 ↓
Capture Task ID
 ↓
Update Housekeeping
 ↓
Notify Supervisor
```

If task already exists:

```text id="c2x7n5"
Do not create duplicate.
```

---

# 76. RPA STATUS SYNC

```text id="m8q3v7"
External Housekeeping System
 ↓
Task Status
 ↓
RPA/API
 ↓
Verify Task ID
 ↓
Update MERN
 ↓
Audit
```

Unknown status:

```text id="x5c2n8"
Exception
↓
Reconciliation
```

---

# 77. RPA UNKNOWN STATE

Example:

```text id="q7m4x2"
External task submitted
↓
Browser crashes
↓
No confirmation
```

Do not submit again blindly.

Instead:

```text id="v3n8c5"
Search external system
 ↓
Find task
 ↓
Link existing task
```

or:

```text id="m5q2x7"
Human Review
```

---

# 78. RPA JOB MODEL

Every automation stores:

```text id="x8c4m1"
RPA Job ID
Correlation ID
Module = HOUSEKEEPING
Operation
Entity ID
Robot
Started At
Completed At
Status
Attempt
External Reference
Evidence
Error
```

---

# 79. ROBOT FRAMEWORK STRUCTURE

Add:

```text id="q3m8v5"
robot/
├── portals/
│   └── housekeeping/
│       ├── housekeeping_login.robot
│       ├── task_creation.robot
│       ├── task_sync.robot
│       ├── room_turnover.robot
│       └── report_download.robot
│
├── keywords/
│   └── housekeeping/
│       ├── login.resource
│       ├── task_keywords.resource
│       ├── bed_turnover_keywords.resource
│       ├── vendor_keywords.resource
│       └── evidence.resource
│
├── tests/
│   └── housekeeping/
│       ├── task_creation.robot
│       ├── bed_turnover.robot
│       ├── status_sync.robot
│       └── exception_handling.robot
│
└── results/
```

---

# 80. ROBOT KEYWORDS

Create:

```text id="m7x2c4"
Login To Housekeeping System
Search Area
Search Bed
Create Cleaning Task
Capture External Task ID
Search External Task
Read External Task Status
Update External Task
Create Room Turnover Task
Reconcile Task
Capture Screenshot
Create Housekeeping Exception
Log RPA Execution
```

---

# 81. RPA RETRY POLICY

Use configurable retry limits.

Example:

```text id="x3q8m2"
Attempt 1
Attempt 2
Attempt 3
→ Exception
```

Never retry indefinitely.

---

# 82. DATABASE MODELS

Minimum:

```text id="v5m8c1"
HousekeepingArea
HousekeepingTask
HousekeepingSchedule
HousekeepingChecklist
HousekeepingSupplyRequest
HousekeepingException
```

Optional:

```text id="q2x7n4"
HousekeepingInspection
HousekeepingTaskHistory
```

---

# 83. INDEXES

### HousekeepingArea

```text id="m8c3q7"
areaId
areaCode
departmentId
roomId
bedId
status
```

### HousekeepingTask

```text id="x5n2v8"
taskId
taskNumber
areaId
roomId
bedId
assignedTo
status
priority
scheduledStart
sourceModule
sourceEntityId
```

### HousekeepingSchedule

```text id="q7m3c1"
scheduleId
areaId
active
nextDueDate
```

### SupplyRequest

```text id="v8x2n5"
requestId
taskId
inventoryItemId
status
```

Use unique indexes for identifiers.

---

# 84. CONCURRENCY

Protect:

- Task creation
- Room turnover task creation
- Staff assignment
- Task status transitions
- Supply issuance
- Schedule generation
- RPA task creation

Two RPA executions must not create duplicate cleaning tasks.

---

# 85. IDEMPOTENCY

Use source references:

```text id="m3q7x1"
sourceModule
sourceEntityId
taskType
```

For example:

```text id="c8n2v5"
BED_MANAGEMENT
B-203
PATIENT_ROOM_TURNOVER
```

Before creating:

```text id="x7m4q9"
Existing active turnover task?
YES → Return existing task
NO → Create task
```

---

# 86. AUDIT LOGGING

Record:

```text id="q5c8m2"
Task Created
Task Assigned
Task Rescheduled
Task Started
Checklist Submitted
Task Completed
Inspection Passed
Inspection Failed
Task Reopened
Task Closed
Supply Requested
Supply Issued
Vendor Assigned
RPA Executed
Exception Created
Exception Resolved
Document Accessed
```

---

# 87. SECURITY

Implement:

- JWT
- RBAC
- Backend authorization
- Input validation
- Rate limiting
- Vendor data isolation
- Secure documents
- Audit logging
- RPA secret management

---

# 88. PATIENT PRIVACY

Housekeeping staff generally do not need access to full patient clinical information.

When a task is associated with a patient room, expose only the minimum necessary information.

Example:

```text id="v4m8x2"
Room: 203
Bed: B-203
Task: Patient Room Turnover
```

Avoid displaying:

```text id="q7c3n5"
Diagnosis
Lab results
Radiology results
Medication
Clinical notes
```

unless explicitly required and authorized.

---

# 89. SEARCH

Support:

```text id="m2x7q4"
Task ID
Area
Room
Bed
Department
Staff
Vendor
Priority
Status
Date
```

---

# 90. ANALYTICS

Provide:

### Task Metrics

- Tasks created
- Tasks completed
- Tasks pending
- Tasks overdue

### SLA

- SLA compliance
- SLA breach rate
- Average response time
- Average completion time

### Staff

- Tasks per employee
- Completion rate
- Overdue tasks

### Areas

- Cleaning frequency
- Requests by area
- Turnover time

### Room Turnover

- Average turnover duration
- Beds awaiting cleaning
- Beds pending inspection

### Vendor

- Vendor tasks
- Completion rate
- SLA compliance

---

# 91. ROOM TURNOVER TIME

Calculate:

```text id="x5q8m2"
Cleaning Completion Time
-
Cleaning Task Creation Time
```

and:

```text id="v3n7c4"
Bed Available Time
-
Bed Cleaning Required Time
```

These are operational metrics.

---

# 92. STAFF PERFORMANCE

Do not use raw task count as the sole employee performance measure.

Reports should provide context:

```text id="q8m2x5"
Task Count
Task Type
Shift
Working Hours
Priority
SLA
Absence
```

Avoid automated employment decisions based on simplistic scores.

---

# 93. ACCEPTANCE CRITERIA

The module is complete only when:

- Area master works.
- Housekeeping task creation works.
- Manual requests work.
- Scheduled tasks work.
- Room turnover works.
- Bed Management integration works.
- Discharge integration works.
- Maintenance integration works.
- Staff assignment works.
- Shift availability is checked.
- Cleaning checklist works.
- Inspection workflow works.
- Failed inspection reopens work.
- Supply requests work.
- Inventory integration works.
- Duplicate inventory issue is prevented.
- SLA tracking works.
- Escalation works.
- Vendor tasks work.
- Vendor isolation works.
- Notifications work.
- Notification failure does not corrupt task state.
- RPA jobs are traceable.
- Unknown external outcomes trigger reconciliation.
- Audit logging works.
- RBAC works.
- Patient privacy controls work.
- Reports work.
- Analytics work.
- Seed data exists.
- Automated tests exist.
- End-to-end room turnover works.

---

# 94. END-TO-END DEMO — PATIENT ROOM TURNOVER

Implement:

```text id="m7q2x5"
1. Patient is occupying bed B-203.
2. Doctor completes authorized discharge process.
3. Discharge module completes administrative discharge.
4. Bed Management changes B-203 to CLEANING_REQUIRED.
5. Housekeeping task is automatically created.
6. Supervisor sees task.
7. Staff member is assigned.
8. Staff accepts task.
9. Staff starts cleaning.
10. Checklist is displayed.
11. Staff completes checklist.
12. Task moves to PENDING_INSPECTION if required.
13. Supervisor inspects.
14. Inspection passes.
15. Housekeeping task becomes VERIFIED/CLOSED.
16. Bed Management is notified.
17. Bed becomes AVAILABLE according to Bed Management rules.
18. Audit records complete workflow.
19. Dashboard metrics update.
```

---

# 95. END-TO-END DEMO — URGENT CLEANING

```text id="q4x8m2"
1. Nurse submits urgent cleaning request.
2. Request is validated.
3. Task created.
4. Supervisor notified.
5. Available staff displayed.
6. Authorized supervisor assigns staff.
7. Staff accepts.
8. Task starts.
9. Cleaning completed.
10. Checklist submitted.
11. Inspection if required.
12. Task closed.
13. Requester notified.
14. Audit completed.
```

---

# 96. END-TO-END DEMO — SUPPLY SHORTAGE

```text id="v5m2q8"
1. Staff starts cleaning.
2. Required consumable unavailable.
3. Supply request created.
4. Inventory checked.
5. Stock unavailable.
6. Task becomes WAITING_FOR_SUPPLIES.
7. Procurement request created where configured.
8. Procurement completes purchase.
9. Goods received.
10. Inventory updated.
11. Supply issued.
12. Housekeeping resumes.
13. Task completed.
```

---

# 97. END-TO-END DEMO — MAINTENANCE DEPENDENCY

```text id="x3q7m1"
1. Maintenance work order completed.
2. Asset/area requires post-maintenance cleaning.
3. Housekeeping task automatically generated.
4. Staff assigned.
5. Cleaning completed.
6. Inspection performed.
7. Task closed.
8. Related maintenance record updated.
```

---

# 98. BACKEND API STRUCTURE

Implement:

```text id="m8x3q7"
/api/housekeeping/areas
/api/housekeeping/tasks
/api/housekeeping/schedules
/api/housekeeping/checklists
/api/housekeeping/inspections
/api/housekeeping/supplies
/api/housekeeping/exceptions
/api/housekeeping/rpa
/api/housekeeping/analytics
```

---

# 99. AREA APIs

```http id="q2v7m4"
GET    /api/housekeeping/areas
GET    /api/housekeeping/areas/:id
POST   /api/housekeeping/areas
PUT    /api/housekeeping/areas/:id
PATCH  /api/housekeeping/areas/:id/status
```

---

# 100. TASK APIs

```http id="x7n3c5"
GET    /api/housekeeping/tasks
GET    /api/housekeeping/tasks/:id
POST   /api/housekeeping/tasks
PATCH  /api/housekeeping/tasks/:id
POST   /api/housekeeping/tasks/:id/assign
POST   /api/housekeeping/tasks/:id/schedule
POST   /api/housekeeping/tasks/:id/start
POST   /api/housekeeping/tasks/:id/hold
POST   /api/housekeeping/tasks/:id/complete
POST   /api/housekeeping/tasks/:id/inspect
POST   /api/housekeeping/tasks/:id/verify
POST   /api/housekeeping/tasks/:id/close
POST   /api/housekeeping/tasks/:id/reopen
```

---

# 101. SCHEDULE APIs

```http id="v4q8m2"
GET    /api/housekeeping/schedules
GET    /api/housekeeping/schedules/:id
POST   /api/housekeeping/schedules
PUT    /api/housekeeping/schedules/:id
PATCH  /api/housekeeping/schedules/:id/status
```

---

# 102. CHECKLIST APIs

```http id="m5x2q7"
GET    /api/housekeeping/checklists
GET    /api/housekeeping/checklists/:id
POST   /api/housekeeping/checklists
PUT    /api/housekeeping/checklists/:id
```

---

# 103. SUPPLY APIs

```http id="q8n3c5"
GET    /api/housekeeping/supplies
POST   /api/housekeeping/supplies/request
POST   /api/housekeeping/supplies/:id/approve
POST   /api/housekeeping/supplies/:id/issue
POST   /api/housekeeping/supplies/:id/return
```

---

# 104. EXCEPTION APIs

```http id="x3m7v1"
GET    /api/housekeeping/exceptions
GET    /api/housekeeping/exceptions/:id
POST   /api/housekeeping/exceptions
PATCH  /api/housekeeping/exceptions/:id
POST   /api/housekeeping/exceptions/:id/resolve
```

---

# 105. ANALYTICS APIs

```http id="n7q2c4"
GET /api/housekeeping/analytics/dashboard
GET /api/housekeeping/analytics/tasks
GET /api/housekeeping/analytics/sla
GET /api/housekeeping/analytics/staff
GET /api/housekeeping/analytics/turnover
GET /api/housekeeping/analytics/vendors
```

---

# 106. BACKEND STRUCTURE

Create:

```text id="m8x4q2"
server/
├── models/
│   ├── HousekeepingArea.js
│   ├── HousekeepingTask.js
│   ├── HousekeepingSchedule.js
│   ├── HousekeepingChecklist.js
│   ├── HousekeepingInspection.js
│   ├── HousekeepingSupplyRequest.js
│   └── HousekeepingException.js
│
├── controllers/
│   └── housekeeping/
│       ├── areaController.js
│       ├── taskController.js
│       ├── scheduleController.js
│       ├── checklistController.js
│       ├── inspectionController.js
│       ├── supplyController.js
│       └── exceptionController.js
│
├── services/
│   └── housekeeping/
│       ├── areaService.js
│       ├── taskService.js
│       ├── scheduleService.js
│       ├── assignmentService.js
│       ├── checklistService.js
│       ├── inspectionService.js
│       ├── inventoryService.js
│       ├── bedIntegrationService.js
│       ├── dischargeIntegrationService.js
│       ├── maintenanceIntegrationService.js
│       └── housekeepingRpaService.js
│
└── routes/
    └── housekeeping/
```

---

# 107. FRONTEND STRUCTURE

Create:

```text id="q3m8v5"
client/src/portals/operations/housekeeping/
├── pages/
│   ├── HousekeepingDashboard.jsx
│   ├── Areas.jsx
│   ├── Tasks.jsx
│   ├── TaskDetails.jsx
│   ├── HousekeepingCalendar.jsx
│   ├── RoomTurnover.jsx
│   ├── MyTasks.jsx
│   ├── Checklists.jsx
│   ├── Inspections.jsx
│   ├── SupplyRequests.jsx
│   ├── Exceptions.jsx
│   └── Analytics.jsx
│
├── components/
│   ├── TaskTable.jsx
│   ├── TaskStatusBadge.jsx
│   ├── TaskAssignment.jsx
│   ├── ChecklistForm.jsx
│   ├── InspectionPanel.jsx
│   ├── TurnoverCard.jsx
│   └── ExceptionTable.jsx
│
└── services/
    └── housekeepingApi.js
```

---

# 108. TESTING

Create unit tests for:

- Area creation
- Task creation
- Duplicate task detection
- Assignment
- Schedule
- Checklist
- Completion
- Inspection
- Reopen
- Room turnover
- Supply request
- Inventory integration
- SLA
- Escalation
- Vendor access
- Notifications
- RPA
- RBAC
- Audit

---

# 109. SECURITY TESTS

Test:

```text id="m4q8x2"
Patient accessing housekeeping administration
Housekeeping staff accessing unrelated clinical records
Vendor accessing another vendor's task
Requester closing task
Unauthorized supervisor functions
Unauthorized area modification
Unauthorized inventory issue
```

---

# 110. FINAL IMPLEMENTATION ORDER

## Phase 1

Database:

```text id="q7m3x8"
HousekeepingArea
HousekeepingTask
HousekeepingSchedule
HousekeepingChecklist
HousekeepingInspection
HousekeepingSupplyRequest
HousekeepingException
```

## Phase 2

Backend:

```text id="m5x8c2"
Models
Validators
Services
Controllers
Routes
RBAC
Audit
```

## Phase 3

Task management:

```text id="v2q7n4"
Requests
Assignment
Scheduling
Execution
Completion
Inspection
Closure
```

## Phase 4

Room turnover:

```text id="x8m3c5"
Discharge
→ Bed Management
→ Housekeeping
→ Inspection
→ Bed Available
```

## Phase 5

Recurring housekeeping:

```text id="q4v7m2"
Schedules
Recurring Tasks
Due Dates
Overdue
```

## Phase 6

Inventory:

```text id="n8c2x5"
Supply Requests
Issue
Return
Reconciliation
```

## Phase 7

Vendor:

```text id="m3q8v1"
Vendor Tasks
Service Reports
Verification
```

## Phase 8

Notifications:

```text id="x7c4m2"
SMS
Email
In-App
```

## Phase 9

RPA:

```text id="q5m8n3"
Task Sync
Room Turnover
External System
Reconciliation
```

## Phase 10

Frontend:

```text id="v4x7q2"
Dashboard
Tasks
Calendar
Turnover
My Tasks
Inspection
Supplies
Exceptions
Analytics
```

## Phase 11

Testing:

```text id="m8q3c5"
Unit
Integration
Security
RPA
End-to-End
```

---

# 111. CROSS-MODULE DEPENDENCIES

This module integrates with:

```text id="x2m7q4"
04 Patient Admission
05 Bed Management
06 Discharge Processing
12 Staff Management
13 Attendance Management
14 Shift Management
18 Medical Inventory
19 Procurement
20 Vendor Management
23 Maintenance
26 Notification Service
27 Document Generation
28 Reports & Analytics
```

---

# 112. SOURCE-OF-TRUTH RULES

| Data | Source of Truth |
|---|---|
| Housekeeping tasks | Housekeeping |
| Housekeeping schedules | Housekeeping |
| Housekeeping checklist | Housekeeping |
| Bed status | Bed Management |
| Patient admission/discharge | Admission/Discharge |
| Employee | Staff Management |
| Shift | Shift Management |
| Attendance | Attendance Management |
| Supplies/stock | Medical Inventory |
| Procurement | Procurement |
| Vendor | Vendor Management |
| Maintenance | Maintenance |
| Notifications | Notification Service |
| Documents | Document Generation |
| RPA execution | RPA subsystem |
| Audit | Central Audit Service |

---

# 113. NO DUPLICATE MASTER DATA

Do not create:

```text id="q8m3x1"
HousekeepingEmployee
HousekeepingVendor
HousekeepingInventory
HousekeepingBed
HousekeepingPatient
```

Use existing:

```text id="v5c7n2"
Employee
Vendor
InventoryItem
Bed
Patient
```

---

# 114. FINAL AI CODING AGENT INSTRUCTION

Build this as a **fully functional production-quality Hospital Housekeeping Management subsystem**, not as a simple CRUD application.

The implementation must:

1. Follow the existing MERN architecture.
2. Reuse existing hospital master data.
3. Implement RBAC.
4. Implement housekeeping area management.
5. Implement manual cleaning requests.
6. Implement scheduled cleaning.
7. Implement recurring cleaning schedules.
8. Implement patient-room turnover.
9. Integrate with Discharge.
10. Integrate with Bed Management.
11. Integrate with Maintenance.
12. Integrate with Staff and Shift Management.
13. Implement task assignment.
14. Implement checklists.
15. Implement inspection.
16. Implement failed-inspection rework.
17. Implement supply requests.
18. Integrate with Medical Inventory.
19. Integrate with Procurement where supplies are unavailable.
20. Integrate with Vendor Management.
21. Implement SLA tracking.
22. Implement escalation.
23. Implement notifications.
24. Implement document generation.
25. Implement exceptions.
26. Implement RPA automation.
27. Implement idempotent external integrations.
28. Handle unknown external outcomes safely.
29. Maintain complete audit history.
30. Protect patient privacy.
31. Enforce vendor data isolation.
32. Never let RPA make clinical or infection-control decisions.
33. Never automatically declare a room clinically safe when authorized clearance is required.
34. Never directly modify Bed Management data from the frontend.
35. Never directly manipulate inventory quantities.
36. Provide realistic seed/demo data.
37. Provide unit, integration, security and RPA tests.
38. Ensure complete room-turnover workflow works end-to-end.

**Do not implement placeholders where functional logic is expected.**

**Do not duplicate Patient, Bed, Employee, Vendor or Inventory master data.**

**Do not bypass inspection or authorization workflows.**

**Do not silently modify historical housekeeping records.**

**Do not expose unnecessary patient information to housekeeping staff or vendors.**

**Do not treat RPA as the system of record.**

**Do not allow automation to make clinical, infection-control, or safety-critical decisions.**

The completed module must integrate cleanly with the hospital's Admission, Discharge, Bed, Staff, Shift, Inventory, Procurement, Vendor, Maintenance, Notification, Document and Reporting modules.