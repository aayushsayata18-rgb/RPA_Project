# 22 — RADIOLOGY ADMINISTRATION

## 1. MODULE OVERVIEW

### Module Name
**Radiology Administration**

### Module Code
`RAD`

### Purpose

Build a complete hospital radiology administration and operational workflow module within the existing MERN-based Hospital Administrative Automation & RPA Platform.

The module must manage the **administrative and operational lifecycle of radiology services**, including:

- Radiology modality master
- Radiology examination/test master
- Radiology orders
- Scheduling
- Appointment slots
- Patient preparation instructions
- Procedure/scan room assignment
- Modality/resource allocation
- Patient arrival/check-in
- Examination status tracking
- Study/accession number generation
- Image/study metadata
- Radiology report workflow
- Result/report verification
- Report release
- Report amendment/versioning
- Radiology billing integration
- Radiology inventory/consumable integration
- External RIS/PACS integration
- RPA automation
- Notifications
- Documents
- Exceptions
- Operational reports and analytics
- Complete audit trail

The module must provide a traceable workflow:

```text
Patient
   ↓
Visit / Admission
   ↓
Doctor / Authorized User Orders Examination
   ↓
Radiology Order
   ↓
Eligibility / Administrative Validation
   ↓
Scheduling
   ↓
Patient Preparation
   ↓
Patient Arrival / Check-In
   ↓
Modality / Procedure
   ↓
Study / Accession Number
   ↓
Image / Study Metadata
   ↓
Report Draft
   ↓
Authorized Verification
   ↓
Report Finalization
   ↓
Report Release
   ↓
Patient / Doctor Access
```

---

# 2. CRITICAL CLINICAL SAFETY BOUNDARY

This module is an **administrative and radiology workflow system**.

It must NOT become an autonomous clinical decision-making system.

The application and RPA must NEVER:

- Diagnose a patient.
- Interpret radiology images.
- Generate autonomous medical findings.
- Determine whether a finding is clinically significant.
- Decide treatment.
- Recommend medication.
- Decide whether surgery is required.
- Determine emergency medical priority autonomously.
- Modify radiology findings automatically.
- Invent measurements.
- Invent imaging observations.
- Invent contrast dosage.
- Invent contraindications.
- Decide whether a patient is medically fit for a procedure.
- Decide whether a scan should be performed.
- Override a radiologist or authorized clinician.
- Approve/reject insurance claims.
- Determine insurance coverage.
- Make autonomous financial adjustments.

The system may automate **administrative workflow and routing**.

The global RPA pattern remains:

```text
INPUT
  ↓
READ
  ↓
VALIDATE
  ↓
APPLY CONFIGURED ADMINISTRATIVE RULES
  ↓
ACT
  ↓
VERIFY
  ↓
UPDATE
  ↓
NOTIFY
  ↓
AUDIT
```

If the system encounters ambiguity:

```text
Exception
   ↓
Human Review
   ↓
Authorized Decision
   ↓
RPA Continues
```

---

# 3. ARCHITECTURE

Use the existing platform architecture.

```text
React.js
   │
   │ REST API
   ▼
Node.js + Express.js
   │
   ├── Radiology Controllers
   ├── Radiology Services
   ├── Validators
   ├── Authorization
   ├── Scheduling
   ├── Notification Service
   ├── Document Service
   ├── Billing Integration
   ├── Inventory Integration
   ├── RIS/PACS Integration
   ├── RPA Job Service
   └── Audit Service
   │
   ▼
MongoDB + Mongoose
   │
   ├── RadiologyExam
   ├── RadiologyOrder
   ├── RadiologySchedule
   ├── RadiologyStudy
   ├── RadiologyReport
   ├── RadiologyException
   └── supporting history
```

External integration:

```text
Hospital MERN
      │
      ├──────── API ────────► RIS/PACS
      │
      └──── RPA ───────────► Legacy Radiology System
```

MERN remains the system of record for administrative radiology workflow.

RPA is the automation worker.

---

# 4. ACTORS

The module must support existing system roles.

## 4.1 Radiology Technician

Can:

- View radiology orders.
- View scheduled procedures.
- Check patient arrival.
- Prepare procedure workflow.
- Assign/use modality according to authorized workflow.
- Start examination.
- Complete examination.
- Enter operational information.
- Upload or associate study metadata.
- Record operational exceptions.

Cannot:

- Diagnose.
- Interpret images.
- Approve radiology reports unless explicitly authorized.
- Modify a radiologist's findings.

---

# 5. RADIOLOGIST / AUTHORIZED REPORTING PHYSICIAN

Can:

- View assigned studies.
- Review radiology study metadata.
- Enter report.
- Verify report.
- Finalize report.
- Release report.
- Amend reports through controlled workflow.

Cannot:

- Delete historical reports.

---

# 6. DOCTOR

Can:

- Create radiology orders.
- View order status.
- View released reports for authorized patients.

Cannot:

- Modify finalized radiology reports unless they are also authorized reporting personnel.

---

# 7. RECEPTIONIST

Can:

- View radiology appointments.
- Register/check in patient.
- Print administrative documents.
- Confirm appointment.
- View payment/billing status.

Cannot:

- Modify radiology findings.

---

# 8. BILLING STAFF

Can:

- View radiology charges.
- Reconcile billing references.
- View payment state.

Cannot:

- Modify examination findings or reports.

---

# 9. INVENTORY STAFF

Can:

- Manage radiology consumable inventory through Medical Inventory.

Cannot:

- Modify clinical records.

---

# 10. ADMINISTRATIVE MANAGER

Can:

- View operational analytics.
- Monitor scheduling.
- Monitor modality utilization.
- Monitor delays.
- Manage configured administrative rules.

---

# 11. SYSTEM ADMINISTRATOR

Can:

- Configure permissions.
- Configure integration settings.
- Configure modality/resource metadata.
- Manage RPA configuration.

Clinical report access must still follow configured access controls.

---

# 12. PATIENT

Patient Portal may display:

- Radiology appointments.
- Preparation instructions.
- Appointment status.
- Examination status.
- Released reports.
- Radiology documents.

Unreleased reports must not be exposed unless explicitly permitted by hospital configuration.

---

# 13. RADIOLOGY EXAM MASTER

Create:

`RadiologyExam`

This is the master catalog of radiology examinations/procedures.

Examples:

```text
X-Ray Chest
X-Ray Knee
Ultrasound Abdomen
CT Head
CT Abdomen
MRI Brain
MRI Knee
Mammography
Other configured studies
```

These are demonstration examples only.

---

# 14. RADIOLOGY EXAM MODEL

```javascript
{
  examId: String,

  code: String,

  name: String,

  category: String,

  modalityType: String,

  description: String,

  bodyPart: String,

  preparationInstructions: String,

  fastingRequired: Boolean,

  appointmentRequired: Boolean,

  estimatedDurationMinutes: Number,

  turnaroundTimeMinutes: Number,

  chargeCode: String,

  priceReference: Number,

  externalCode: String,

  departmentId: ObjectId,

  status: String,

  activeFrom: Date,

  inactiveFrom: Date,

  createdBy: ObjectId,

  updatedBy: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 15. EXAM STATUS

Use:

```text
DRAFT
PENDING_APPROVAL
ACTIVE
INACTIVE
RETIRED
```

Only `ACTIVE` exams should normally be available for new orders.

Historical orders must retain snapshots.

---

# 16. MODALITY MASTER

Create:

`RadiologyModality`

A modality represents a physical imaging resource.

Example:

```text
MOD-CT-01
MOD-MRI-01
MOD-XRAY-01
MOD-US-01
```

---

# 17. MODALITY MODEL

```javascript
{
  modalityId: String,

  name: String,

  type: String,

  departmentId: ObjectId,

  location: String,

  room: String,

  manufacturer: String,

  model: String,

  serialReference: String,

  status: String,

  operatingHours: Object,

  maintenanceSchedule: Object,

  externalSystemId: String,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 18. MODALITY STATUS

Use:

```text
AVAILABLE
RESERVED
IN_USE
MAINTENANCE
OUT_OF_SERVICE
DECOMMISSIONED
```

Do not automatically schedule a patient on a modality marked:

```text
MAINTENANCE
OUT_OF_SERVICE
DECOMMISSIONED
```

---

# 19. RADIOLOGY ORDER

Create:

`RadiologyOrder`

## Fields

```javascript
{
  orderId: String,

  patientId: ObjectId,

  visitId: ObjectId,

  admissionId: ObjectId,

  orderingDoctorId: ObjectId,

  examId: ObjectId,

  examNameSnapshot: String,

  examCodeSnapshot: String,

  modalityTypeSnapshot: String,

  bodyPartSnapshot: String,

  priority: String,

  clinicalNote: String,

  orderDateTime: Date,

  status: String,

  billingReferenceId: ObjectId,

  externalRisOrderId: String,

  externalPacsStudyId: String,

  source: String,

  cancellationReason: String,

  createdBy: ObjectId,

  updatedBy: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 20. RADIOLOGY PRIORITY

Support configurable:

```text
NORMAL
URGENT
STAT
```

`STAT` is an authorized operational priority.

RPA must not infer priority from symptoms or patient data.

---

# 21. RADIOLOGY ORDER STATUS

Use:

```text
DRAFT
ORDERED
PENDING_SCHEDULING
SCHEDULED
PREPARATION_REQUIRED
READY_FOR_CHECKIN
CHECKED_IN
IN_PROGRESS
COMPLETED
REPORT_PENDING
REPORT_READY
RELEASED
CANCELLED
ON_HOLD
```

---

# 22. RADIOLOGY ORDER WORKFLOW

```text
Doctor
  ↓
Create Order
  ↓
Validate Patient
  ↓
Validate Visit/Admission
  ↓
Validate Exam
  ↓
Create Radiology Order
  ↓
Billing Integration
  ↓
Scheduling
  ↓
Preparation Instructions
  ↓
Patient Check-In
  ↓
Procedure
  ↓
Study Created
  ↓
Report Draft
  ↓
Radiologist Verification
  ↓
Report Finalization
  ↓
Report Release
  ↓
Patient / Doctor Access
```

---

# 23. PATIENT VALIDATION

Before creating an order:

1. Verify Patient ID.
2. Verify patient exists.
3. Verify visit/admission when required.
4. Verify ordering doctor.
5. Verify examination exists.
6. Verify exam is active.
7. Check duplicate/open order according to configurable rules.

If multiple patient matches exist:

```text
STOP
↓
Create exception
↓
Human verification
```

Never automatically choose a patient.

---

# 24. DUPLICATE ORDER DETECTION

Check:

- Patient
- Visit
- Admission
- Examination
- Existing active order
- Recent order date
- Current status

Potential duplicate:

```text
RAD-2026-10031
CT Head
Status: SCHEDULED
```

New CT Head request:

```text
Potential duplicate.
Human confirmation required.
```

Do not automatically cancel the new request.

---

# 25. SCHEDULING

Radiology scheduling must consider:

- Examination
- Modality type
- Available modality
- Modality operating hours
- Existing bookings
- Appointment duration
- Maintenance periods
- Room availability
- Staff/resource availability where configured
- Patient availability
- Hospital scheduling rules

The scheduling engine must not make clinical decisions.

---

# 26. RADIOLOGY SCHEDULE

Create:

`RadiologySchedule`

```javascript
{
  scheduleId: String,

  orderId: ObjectId,

  patientId: ObjectId,

  examId: ObjectId,

  modalityId: ObjectId,

  room: String,

  scheduledStart: Date,

  scheduledEnd: Date,

  status: String,

  scheduledBy: ObjectId,

  confirmedAt: Date,

  cancellationReason: String,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 27. SCHEDULE STATUS

Use:

```text
AVAILABLE
HELD
BOOKED
CONFIRMED
CHECKED_IN
IN_PROGRESS
COMPLETED
CANCELLED
NO_SHOW
BLOCKED
```

---

# 28. SLOT GENERATION

Slot generation must be based on:

```text
Modality operating hours
+
Configured exam duration
+
Configured buffer
+
Existing appointments
+
Maintenance blocks
```

Example:

```text
CT Room 1
09:00–17:00
Exam duration: 30 min
Buffer: 10 min
```

Possible slots:

```text
09:00–09:30
09:40–10:10
10:20–10:50
...
```

Do not hard-code this example.

---

# 29. SCHEDULING CONFLICT

Before booking:

```text
Check modality
Check room
Check schedule
Check maintenance
Check overlapping appointment
```

If conflict exists:

```text
Do not overwrite existing booking.
Create scheduling exception.
```

---

# 30. PATIENT PREPARATION

The exam master may contain preparation instructions.

Examples may include:

- Fasting instructions
- Arrival time
- Required documents
- Hospital-specific preparation steps

These must be configured by authorized hospital staff.

The system must not invent medical preparation instructions.

---

# 31. PREPARATION STATUS

Use:

```text
NOT_REQUIRED
PENDING
INSTRUCTIONS_SENT
ACKNOWLEDGED
COMPLETED
NOT_COMPLETED
REQUIRES_REVIEW
```

If the patient indicates they did not follow required preparation:

```text
Create operational exception
```

Do not automatically decide whether the examination can proceed.

---

# 32. PATIENT NOTIFICATION

After scheduling:

```text
Your radiology appointment has been scheduled.

Exam: CT Head
Date: 15 Oct 2026
Time: 10:30 AM

Please log in to the hospital portal for preparation instructions.
```

Use centralized Notification Service.

---

# 33. CHECK-IN

Patient can be checked in through:

1. Patient Portal where supported.
2. Front Desk.
3. Radiology Reception.

No QR workflow should be introduced unless separately configured.

---

# 34. CHECK-IN FLOW

```text
Patient Arrives
   ↓
Verify Appointment
   ↓
Verify Patient Identity
   ↓
Check Preparation Status
   ↓
Check Administrative Requirements
   ↓
Check In
   ↓
Status = CHECKED_IN
```

RPA can automate administrative verification.

RPA cannot determine whether a patient is medically fit for examination.

---

# 35. RADIOLOGY STUDY

Create:

`RadiologyStudy`

A study represents the actual imaging examination performed.

## Fields

```javascript
{
  studyId: String,

  accessionNumber: String,

  orderId: ObjectId,

  patientId: ObjectId,

  examId: ObjectId,

  modalityId: ObjectId,

  performedDateTime: Date,

  performedBy: ObjectId,

  room: String,

  externalPacsStudyId: String,

  externalStudyUID: String,

  studyStatus: String,

  imageReference: String,

  metadata: Object,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 36. ACCESSION NUMBER

Generate a unique radiology accession number.

Example:

```text
RAD-ACC-2026-000001
RAD-ACC-2026-000002
```

Generation must be:

- Backend controlled
- Unique
- Concurrency-safe
- Auditable
- Non-reusable

Never use frontend counters.

---

# 37. STUDY STATUS

Use:

```text
REGISTERED
SCHEDULED
IN_PROGRESS
COMPLETED
TRANSFERRED
REPORT_PENDING
REPORTED
CANCELLED
```

---

# 38. EXAMINATION START

Authorized radiology technician selects:

```text
Start Examination
```

System records:

```text
Start timestamp
User
Modality
Room
Order
Patient
```

Status:

```text
IN_PROGRESS
```

---

# 39. EXAMINATION COMPLETION

Technician completes the administrative examination workflow.

Record:

```text
Completion timestamp
Performed by
Modality
Study ID
Accession number
External PACS reference
Operational notes
```

Status:

```text
COMPLETED
```

Clinical interpretation must not be entered here unless the user is specifically authorized for reporting.

---

# 40. PACS INTEGRATION

Support external PACS references.

Possible identifiers:

```text
PACS Study ID
Study UID
Accession Number
```

Do not duplicate full image storage inside MongoDB.

MongoDB should store metadata and secure references.

If image storage is required, use a dedicated approved imaging storage system.

---

# 41. RIS INTEGRATION

Support external RIS integration.

Preferred:

```text
API
↓
Secure file/interface
↓
Robot Framework browser automation
```

RPA is used only when APIs/interfaces are unavailable.

---

# 42. EXTERNAL RIS ORDER FLOW

```text
MERN
 ↓
Radiology Order
 ↓
RPA Job
 ↓
RIS Login
 ↓
Find Patient
 ↓
Verify Identity
 ↓
Enter Examination
 ↓
Schedule / Submit
 ↓
Capture RIS Order ID
 ↓
Read Back
 ↓
Update MERN
```

---

# 43. EXTERNAL PACS/RIS STUDY FLOW

```text
External RIS/PACS
       ↓
Study Created
       ↓
RPA/API retrieves metadata
       ↓
Verify patient
       ↓
Verify accession
       ↓
Verify exam
       ↓
Update RadiologyStudy
```

If verification fails:

```text
STOP
↓
Exception
↓
Human Review
```

---

# 44. RADIOLOGY REPORT

Create:

`RadiologyReport`

## Fields

```javascript
{
  reportId: String,

  reportNumber: String,

  studyId: ObjectId,

  orderId: ObjectId,

  patientId: ObjectId,

  radiologistId: ObjectId,

  reportText: String,

  impression: String,

  status: String,

  reportVersion: Number,

  verifiedBy: ObjectId,

  verifiedAt: Date,

  releasedBy: ObjectId,

  releasedAt: Date,

  previousReportId: ObjectId,

  amendmentReason: String,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 45. REPORT STATUS

Use:

```text
DRAFT
PENDING_VERIFICATION
VERIFIED
FINALIZED
RELEASED
AMENDED
CANCELLED
```

---

# 46. REPORT ENTRY

Only authorized reporting personnel may enter the clinical report.

The system may provide structured fields:

```text
Clinical History
Technique
Findings
Impression
Recommendations
```

These fields must not be automatically populated with invented medical content.

---

# 47. REPORT VERIFICATION

Workflow:

```text
Draft
 ↓
Pending Verification
 ↓
Authorized Radiologist
 ↓
Review
 ↓
Verify
 ↓
Finalized
```

The verifier must be authenticated and authorized.

---

# 48. REPORT RELEASE

Only authorized personnel may release a final report.

```text
FINALIZED
   ↓
RELEASE
   ↓
RELEASED
```

After release:

- Patient Portal access may become available.
- Doctor Portal access becomes available.
- Notification may be sent.
- Audit event is generated.

---

# 49. REPORT AMENDMENT

Never silently edit a released report.

Workflow:

```text
Released Report
      ↓
Amendment Request
      ↓
Reason Required
      ↓
Authorized Review
      ↓
New Version
      ↓
Previous Version Preserved
      ↓
Updated Report
      ↓
Notification
```

Example:

```text
RAD-RPT-2026-00101
Version 1

RAD-RPT-2026-00101
Version 2 — Amended
```

Version 1 remains auditable.

---

# 50. NO AUTONOMOUS IMAGE INTERPRETATION

If an image exists:

```text
PACS Study
```

RPA may:

- Locate study.
- Retrieve metadata.
- Verify identifiers.
- Download authorized document.
- Update status.

RPA must NOT:

- Read image content.
- Diagnose.
- Generate findings.
- Generate impression.
- Decide whether an abnormality exists.

---

# 51. BILLING INTEGRATION

Radiology services must integrate with Billing.

Possible billing event:

```text
Order
Schedule
Procedure completion
Report completion
```

The hospital must configure the actual charging point.

Do not hard-code one universal policy.

---

# 52. BILLING MODEL REFERENCE

Each radiology order should store:

```text
billingReferenceId
```

Billing should reference:

```text
sourceModule = RADIOLOGY
sourceEntityId = RadiologyOrder/RadiologyStudy
```

---

# 53. BILLING IDEMPOTENCY

Before creating a charge:

```text
Does charge already exist?
      ↓
YES → Return existing charge
NO  → Create charge
```

Never create duplicate radiology charges because of:

- Browser refresh
- RPA retry
- API retry
- Job restart
- Network timeout

---

# 54. INSURANCE INTEGRATION

Radiology module provides service/charge information to:

```text
Billing
Insurance Verification
Insurance Claims
```

Radiology does NOT decide:

- Coverage
- Eligibility
- Claim approval
- Claim rejection
- Patient responsibility

---

# 55. INVENTORY INTEGRATION

Radiology may consume:

- Contrast-related supplies where configured
- Procedure consumables
- Disposable materials
- Other radiology supplies

Medical Inventory remains source of truth.

Workflow:

```text
Radiology Procedure
      ↓
Consumable Usage
      ↓
Inventory Movement
      ↓
Medical Inventory
```

---

# 56. NO DUPLICATE INVENTORY DEDUCTION

Use:

```text
sourceModule = RADIOLOGY
sourceEntityId = Study/Procedure ID
inventoryItemId
batchId
```

If the same consumption request is retried:

```text
Existing movement found
↓
Do not deduct again
```

---

# 57. RADIOLOGY EXCEPTIONS

Create:

`RadiologyException`

## Fields

```javascript
{
  exceptionId: String,

  type: String,

  severity: String,

  patientId: ObjectId,

  orderId: ObjectId,

  scheduleId: ObjectId,

  studyId: ObjectId,

  reportId: ObjectId,

  description: String,

  source: String,

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

# 58. EXCEPTION TYPES

Support:

```text
PATIENT_MISMATCH
ORDER_MISMATCH
DUPLICATE_ORDER
SCHEDULING_CONFLICT
MODALITY_UNAVAILABLE
MAINTENANCE_CONFLICT
PREPARATION_INCOMPLETE
CHECKIN_MISMATCH
DUPLICATE_ACCESSION
PACS_STUDY_MISMATCH
RIS_UNAVAILABLE
PACS_UNAVAILABLE
EXTERNAL_STUDY_UNKNOWN
REPORT_MISSING
REPORT_MISMATCH
BILLING_MISMATCH
INVENTORY_SYNC_FAILURE
DOCUMENT_FAILURE
NOTIFICATION_FAILURE
UNAUTHORIZED_REPORT_CHANGE
```

---

# 59. EXCEPTION STATUS

```text
OPEN
UNDER_REVIEW
WAITING_FOR_EXTERNAL_SYSTEM
WAITING_FOR_USER
RESOLVED
CANCELLED
```

---

# 60. EXCEPTION SEVERITY

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Critical exceptions must be visible to authorized administrators.

---

# 61. RADIOLOGY DASHBOARD

Create:

```text
Today's Orders
Pending Scheduling
Today's Appointments
Checked-In Patients
Procedures In Progress
Completed Studies
Reports Pending
Reports Pending Verification
Reports Ready
Reports Released
No Shows
Cancelled
Exceptions
```

---

# 62. MODALITY DASHBOARD

Display:

```text
Modality
Status
Current Patient
Current Study
Scheduled Next
Maintenance
Utilization
```

Example:

```text
MRI-01
Status: IN_USE

Current:
RAD-2026-1021

Next:
RAD-2026-1022
11:30 AM
```

---

# 63. SCHEDULING SCREEN

Provide:

- Calendar
- Day view
- Week view
- Modality filter
- Examination filter
- Doctor filter
- Patient search
- Availability
- Maintenance blocks
- Appointment status

Actions:

```text
Schedule
Reschedule
Cancel
Check In
View Order
```

---

# 64. PATIENT CHECK-IN SCREEN

Display:

```text
Patient
Appointment
Exam
Modality
Preparation Status
Payment/Billing Status
```

Actions:

```text
Check In
Mark No Show
Reschedule
View Instructions
```

The system must not automatically mark a patient No Show merely because a reminder was ignored.

---

# 65. PROCEDURE SCREEN

Display:

```text
Patient
Order
Exam
Modality
Accession Number
Schedule
Status
```

Actions:

```text
Start Examination
Complete Examination
Record Operational Exception
View External Study
```

---

# 66. REPORTING QUEUE

Display:

```text
Study ID
Patient
Exam
Modality
Performed Date
Report Status
Assigned Radiologist
```

Actions:

```text
Open Study
Create Report
Edit Draft
Submit Verification
Verify
Finalize
Release
```

RBAC must control every action.

---

# 67. PATIENT PORTAL RADIOLOGY

Create:

```text
Patient Portal
 └── Radiology
     ├── Appointments
     ├── Preparation
     ├── Examination Status
     ├── Reports
     └── Report History
```

Example:

```text
MRI Brain
Date: 18 Oct 2026
Status: Report Released

[View Report]
[Download]
```

---

# 68. DOCTOR PORTAL RADIOLOGY

Create:

```text
Doctor Portal
 └── Radiology
     ├── Orders
     ├── Pending Studies
     ├── Completed Studies
     └── Released Reports
```

Only authorized patient records should be visible.

---

# 69. NOTIFICATIONS

Use centralized Notification Service.

Events:

```text
Appointment Scheduled
Appointment Rescheduled
Appointment Cancelled
Preparation Instructions
Appointment Reminder
Patient Check-In
Examination Completed
Report Released
Report Amended
Operational Exception
```

Do not include sensitive findings in normal SMS/email.

---

# 70. REPORT RELEASE NOTIFICATION

Example:

```text
Your radiology report is now available.

Please log in to the hospital portal to securely view your report.
```

---

# 71. REPORT AMENDMENT NOTIFICATION

If a released report is amended:

```text
Your radiology report has been updated.

Please log in to the hospital portal to view the latest version.
```

Do not include the clinical amendment details in SMS unless explicitly authorized by hospital policy.

---

# 72. DOCUMENT GENERATION

Radiology documents may include:

```text
Radiology Requisition
Appointment Confirmation
Preparation Instructions
Procedure Receipt
Radiology Report
Amended Radiology Report
External RIS/PACS Report
```

Every document must be associated with the appropriate:

```text
Patient
Visit
Order
Study
Report
```

---

# 73. SECURE DOCUMENT ACCESS

Reports must not be exposed through unrestricted URLs.

Use:

```text
Authentication
↓
Authorization
↓
Patient/Doctor access verification
↓
Secure document retrieval
```

Record document access in audit logs.

---

# 74. RIS RPA OPERATIONS

Potential Robot Framework operations:

```text
RAD_ORDER_EXTERNAL_ENTRY
RAD_ORDER_EXTERNAL_SYNC
RAD_SCHEDULE_SYNC
RAD_STUDY_STATUS_SYNC
RAD_PACS_METADATA_SYNC
RAD_REPORT_DOWNLOAD
RAD_REPORT_RECONCILIATION
RAD_EXTERNAL_EXCEPTION_RECONCILIATION
```

---

# 75. RPA ORDER ENTRY

Robot flow:

```text
Receive RPA Job
      ↓
Read Radiology Order
      ↓
Validate Patient
      ↓
Open RIS
      ↓
Login
      ↓
Search Patient
      ↓
Verify Identity
      ↓
Enter Exam
      ↓
Submit
      ↓
Capture External Order ID
      ↓
Read Back
      ↓
Update MERN
      ↓
Audit
```

---

# 76. RPA PACS/RIS STUDY SYNC

```text
RPA Job
 ↓
Search external system
 ↓
Find accession number
 ↓
Retrieve study
 ↓
Verify patient
 ↓
Verify examination
 ↓
Capture external study UID
 ↓
Update MERN
 ↓
Audit
```

If mismatch:

```text
STOP
↓
Exception
```

---

# 77. RPA REPORT RETRIEVAL

```text
Search external report
 ↓
Verify accession number
 ↓
Verify patient
 ↓
Download report
 ↓
Store securely
 ↓
Associate with study
 ↓
Update status
 ↓
Send for authorized review
```

RPA must not release a report solely because it successfully downloaded it.

---

# 78. UNKNOWN EXTERNAL OUTCOME

Example:

```text
RIS order submitted
↓
Browser crashes
↓
No confirmation
```

Do NOT submit again.

Perform:

```text
Reconciliation
↓
Search external RIS by correlation/accession/patient
↓
Determine state
↓
Continue OR create exception
```

---

# 79. RPA JOB STRUCTURE

Each job must store:

```text
RPA Job ID
Correlation ID
Module = RADIOLOGY
Operation
Entity ID
Robot
Start Time
End Time
Status
Attempt
External Reference
Evidence
Error
```

---

# 80. ROBOT FRAMEWORK STRUCTURE

Add:

```text
robot/
├── portals/
│   └── radiology/
│       ├── ris_login.robot
│       ├── rad_order.robot
│       ├── scheduling_sync.robot
│       ├── study_sync.robot
│       └── report_download.robot
│
├── keywords/
│   └── radiology/
│       ├── ris_login.resource
│       ├── rad_order_keywords.resource
│       ├── scheduling_keywords.resource
│       ├── pacs_keywords.resource
│       └── report_keywords.resource
│
├── tests/
│   └── radiology/
│       ├── order_sync.robot
│       ├── scheduling.robot
│       ├── study_reconciliation.robot
│       ├── report_retrieval.robot
│       └── exception_handling.robot
│
└── results/
```

---

# 81. ROBOT KEYWORDS

Create reusable keywords:

```text
Login To RIS
Search Patient In RIS
Verify RIS Patient
Create Radiology Order
Select Examination
Capture RIS Order ID
Search RIS Order
Read Study Status
Search PACS Study
Verify PACS Patient
Verify PACS Accession
Capture PACS Study UID
Download Radiology Report
Upload Radiology Report
Create Radiology Exception
Capture Screenshot
Log RPA Execution
```

---

# 82. RPA FAILURE HANDLING

Example:

```text
RIS Login Failed
 ↓
Retry according to configured policy
 ↓
Still failed
 ↓
Create Exception
 ↓
Notify Radiology Administration
```

Never retry indefinitely.

---

# 83. EXTERNAL REPORT MISMATCH

If external report:

```text
Patient ≠ Expected Patient
```

or:

```text
Accession ≠ Expected Accession
```

or:

```text
Exam ≠ Expected Exam
```

then:

```text
STOP
↓
Do not attach report
↓
Create Exception
↓
Human Review
```

---

# 84. BILLING FAILURE

If examination is completed but billing integration fails:

```text
Study = COMPLETED
Billing = FAILED
```

Do NOT revert:

```text
Study = NOT COMPLETED
```

Create billing exception and reconcile separately.

---

# 85. NOTIFICATION FAILURE

If report is released but email fails:

```text
Report = RELEASED
Notification = FAILED
```

Retry notification separately.

Never change report state because of notification failure.

---

# 86. DATABASE MODELS

Minimum required models:

```text
RadiologyExam
RadiologyModality
RadiologyOrder
RadiologySchedule
RadiologyStudy
RadiologyReport
RadiologyException
```

Optional supporting models:

```text
RadiologyScheduleHistory
RadiologyProcedureEvent
RadiologyReportVersion
RadiologyPreparationRecord
```

---

# 87. INDEXES

### RadiologyOrder

```text
patientId
visitId
admissionId
examId
orderingDoctorId
status
priority
orderDateTime
externalRisOrderId
```

### RadiologySchedule

```text
modalityId
scheduledStart
scheduledEnd
status
patientId
orderId
```

### RadiologyStudy

```text
studyId
accessionNumber
patientId
orderId
modalityId
externalPacsStudyId
externalStudyUID
status
```

### RadiologyReport

```text
reportId
reportNumber
patientId
studyId
orderId
status
releasedAt
```

Unique indexes where required:

```text
examId
modalityId
orderId
accessionNumber
reportNumber
externalStudyUID
```

---

# 88. CONCURRENCY CONTROL

Protect:

- Slot booking
- Modality assignment
- Accession generation
- Study creation
- Report verification
- Report release
- Billing charge creation
- Inventory consumption
- RPA jobs

Two users must not be able to reserve the same slot.

---

# 89. SLOT BOOKING CONCURRENCY

Example:

```text
User A selects 10:00
User B selects 10:00
```

Only one transaction may successfully reserve the slot.

The second receives:

```text
Slot no longer available.
Please select another slot.
```

Do not rely only on frontend checks.

---

# 90. AUDIT LOGGING

Record:

```text
User
Action
Entity
Entity ID
Timestamp
Old Value
New Value
Reason
IP/session where appropriate
Correlation ID
RPA Job ID
```

Important events:

- Exam created
- Exam modified
- Modality changed
- Order created
- Order cancelled
- Appointment booked
- Appointment rescheduled
- Check-in
- Study started
- Study completed
- Report entered
- Report verified
- Report released
- Report amended
- External integration
- Exception
- Document access

---

# 91. SECURITY

Implement:

- JWT
- RBAC
- Backend authorization
- Input validation
- Rate limiting
- Secure document access
- Audit logging
- Secure RPA credentials
- Encryption for sensitive integration credentials
- No credentials in source code
- No unrestricted report URLs

---

# 92. RPA CREDENTIALS

Never write:

```text
username = admin
password = password123
```

inside Robot Framework files.

Use secure environment/secret configuration:

```text
RIS_BASE_URL
RIS_USERNAME
RIS_PASSWORD
PACS_BASE_URL
PACS_USERNAME
PACS_PASSWORD
```

---

# 93. ANALYTICS

Provide operational analytics:

### Scheduling

- Appointments per day
- Modality utilization
- Slot utilization
- Cancellation rate
- No-show rate
- Rescheduling rate

### Procedures

- Exams performed
- Exams by modality
- Exams by category
- Pending studies
- Completed studies

### Reporting

- Reports pending
- Reports verified
- Reports released
- Report turnaround time
- Amended reports

### RPA

- Successful jobs
- Failed jobs
- Unknown outcomes
- Reconciliation cases

---

# 94. TURNAROUND TIME

Track:

```text
Order Created
Scheduled
Check-In
Procedure Started
Procedure Completed
Report Drafted
Report Verified
Report Released
```

Calculate:

```text
Order → Procedure
Procedure → Report
Report → Release
Order → Release
```

Do not hard-code one universal target.

Targets must be configurable.

---

# 95. NO-SHOW HANDLING

If patient does not arrive within the configured appointment window:

```text
Potential No Show
```

The system may mark:

```text
NO_SHOW
```

only according to configured hospital policy.

Do not assume no-show merely because a reminder received no response.

Patient may:

```text
Reschedule
Rebook
Contact Hospital
```

---

# 96. CANCELLATION

Cancellation must record:

```text
Cancelled By
Cancellation Time
Cancellation Reason
Previous Schedule
```

Released billing charges must not be silently removed.

Billing reconciliation must follow configured financial rules.

---

# 97. RESCHEDULING

Do not overwrite history.

Old schedule:

```text
CANCELLED / RESCHEDULED
```

New schedule:

```text
BOOKED / CONFIRMED
```

Preserve:

```text
Previous Schedule ID
New Schedule ID
Rescheduled By
Reason
Timestamp
```

---

# 98. PATIENT PREPARATION EXCEPTION

If required preparation is incomplete:

```text
Preparation Status = NOT_COMPLETED
```

Create:

```text
PREPARATION_INCOMPLETE
```

The authorized radiology staff decides whether the examination proceeds.

RPA must not make the clinical decision.

---

# 99. MODALITY MAINTENANCE

When modality status changes to:

```text
MAINTENANCE
```

future bookings must be handled according to configured policy.

Existing bookings must be surfaced for review.

Do NOT silently move patients to another modality if the change could have clinical or operational implications.

---

# 100. MODALITY OUTAGE

Workflow:

```text
Modality Failure
 ↓
Mark modality unavailable
 ↓
Identify affected bookings
 ↓
Create exceptions
 ↓
Notify radiology administration
 ↓
Human decides rescheduling/alternative
```

RPA can notify and update records.

---

# 101. PATIENT PORTAL REPORT ACCESS

Before showing report:

```text
Authenticate
 ↓
Check patient ownership
 ↓
Check report status = RELEASED
 ↓
Allow access
```

If:

```text
DRAFT
PENDING_VERIFICATION
FINALIZED
```

but not released:

```text
Do not expose
```

unless explicitly enabled by hospital configuration.

---

# 102. SEED DATA

Create realistic demonstration data.

### Examinations

```text
RAD-XR-001
Chest X-Ray

RAD-CT-001
CT Head

RAD-MRI-001
MRI Brain

RAD-US-001
Ultrasound Abdomen

RAD-MAM-001
Mammography
```

### Modalities

```text
CT-01
MRI-01
XRAY-01
US-01
```

Use clearly labelled development/demo records.

---

# 103. END-TO-END DEMO SCENARIO

Implement:

```text
1. Doctor logs in.
2. Opens patient.
3. Creates CT Head radiology order.
4. System validates patient and examination.
5. Billing reference is created.
6. Order enters scheduling queue.
7. Scheduler selects available CT slot.
8. Patient receives appointment notification.
9. Patient arrives.
10. Reception verifies appointment.
11. Patient is checked in.
12. Technician opens procedure.
13. Accession number generated.
14. Study starts.
15. Study completes.
16. PACS/RIS reference is captured.
17. Study enters reporting queue.
18. Authorized radiologist creates report.
19. Report submitted for verification.
20. Radiologist verifies report.
21. Report finalized.
22. Report released.
23. Patient receives secure notification.
24. Patient logs into portal.
25. Patient views/downloads report.
26. Audit trail contains all important events.
```

---

# 104. RPA DEMO SCENARIO

Create mock RIS/PACS integration.

Flow:

```text
MERN
 ↓
Radiology Order
 ↓
RPA Job
 ↓
Mock RIS Login
 ↓
Search Patient
 ↓
Create Order
 ↓
Capture External ID
 ↓
Update MERN
```

Then:

```text
Mock PACS
 ↓
Study available
 ↓
RPA retrieves metadata
 ↓
Verify patient/accession
 ↓
Update study
```

Then:

```text
Mock RIS
 ↓
Report available
 ↓
RPA retrieves document
 ↓
MERN stores document reference
 ↓
Authorized user verifies
 ↓
Report released
```

---

# 105. RPA UNKNOWN-STATE DEMO

Simulate:

```text
External RIS order submitted
 ↓
Browser crashes
 ↓
No confirmation
```

Expected:

```text
RPA Job = UNKNOWN
 ↓
Reconciliation
 ↓
Search RIS
 ↓
If found → link existing order
If not found → authorized retry
If ambiguous → human exception
```

Never blindly submit another order.

---

# 106. API STRUCTURE

Implement:

```text
/api/radiology/exams
/api/radiology/modalities
/api/radiology/orders
/api/radiology/schedules
/api/radiology/studies
/api/radiology/reports
/api/radiology/exceptions
/api/radiology/rpa
/api/radiology/integrations
/api/radiology/analytics
```

---

# 107. EXAM APIs

```http
GET    /api/radiology/exams
GET    /api/radiology/exams/:id
POST   /api/radiology/exams
PUT    /api/radiology/exams/:id
PATCH  /api/radiology/exams/:id/status
```

---

# 108. MODALITY APIs

```http
GET    /api/radiology/modalities
GET    /api/radiology/modalities/:id
POST   /api/radiology/modalities
PUT    /api/radiology/modalities/:id
PATCH  /api/radiology/modalities/:id/status
```

---

# 109. ORDER APIs

```http
GET    /api/radiology/orders
GET    /api/radiology/orders/:id
POST   /api/radiology/orders
PATCH  /api/radiology/orders/:id
POST   /api/radiology/orders/:id/cancel
```

---

# 110. SCHEDULE APIs

```http
GET    /api/radiology/schedules
GET    /api/radiology/schedules/availability
POST   /api/radiology/schedules
PATCH  /api/radiology/schedules/:id
POST   /api/radiology/schedules/:id/cancel
POST   /api/radiology/schedules/:id/reschedule
POST   /api/radiology/schedules/:id/check-in
```

---

# 111. STUDY APIs

```http
GET    /api/radiology/studies
GET    /api/radiology/studies/:id
POST   /api/radiology/studies
POST   /api/radiology/studies/:id/start
POST   /api/radiology/studies/:id/complete
```

---

# 112. REPORT APIs

```http
GET    /api/radiology/reports
GET    /api/radiology/reports/:id
POST   /api/radiology/reports
PUT    /api/radiology/reports/:id
POST   /api/radiology/reports/:id/verify
POST   /api/radiology/reports/:id/finalize
POST   /api/radiology/reports/:id/release
POST   /api/radiology/reports/:id/amend
GET    /api/radiology/reports/:id/download
```

---

# 113. EXCEPTION APIs

```http
GET    /api/radiology/exceptions
GET    /api/radiology/exceptions/:id
POST   /api/radiology/exceptions
PATCH  /api/radiology/exceptions/:id
POST   /api/radiology/exceptions/:id/resolve
```

---

# 114. ANALYTICS APIs

```http
GET /api/radiology/analytics/dashboard
GET /api/radiology/analytics/scheduling
GET /api/radiology/analytics/modalities
GET /api/radiology/analytics/turnaround
GET /api/radiology/analytics/reports
GET /api/radiology/analytics/rpa
```

---

# 115. BACKEND STRUCTURE

Add:

```text
server/
├── models/
│   ├── RadiologyExam.js
│   ├── RadiologyModality.js
│   ├── RadiologyOrder.js
│   ├── RadiologySchedule.js
│   ├── RadiologyStudy.js
│   ├── RadiologyReport.js
│   └── RadiologyException.js
│
├── controllers/
│   └── radiology/
│       ├── examController.js
│       ├── modalityController.js
│       ├── orderController.js
│       ├── scheduleController.js
│       ├── studyController.js
│       ├── reportController.js
│       └── exceptionController.js
│
├── services/
│   └── radiology/
│       ├── examService.js
│       ├── modalityService.js
│       ├── orderService.js
│       ├── scheduleService.js
│       ├── studyService.js
│       ├── reportService.js
│       ├── billingService.js
│       ├── inventoryService.js
│       ├── risIntegrationService.js
│       ├── pacsIntegrationService.js
│       └── radiologyRpaService.js
│
└── routes/
    └── radiology/
```

---

# 116. FRONTEND STRUCTURE

Create:

```text
client/src/portals/operations/radiology/
├── pages/
│   ├── RadiologyDashboard.jsx
│   ├── RadiologyExams.jsx
│   ├── Modalities.jsx
│   ├── RadiologyOrders.jsx
│   ├── RadiologyScheduling.jsx
│   ├── PatientCheckIn.jsx
│   ├── ProcedureQueue.jsx
│   ├── Studies.jsx
│   ├── ReportingQueue.jsx
│   ├── RadiologyReports.jsx
│   ├── Exceptions.jsx
│   └── Analytics.jsx
│
├── components/
│   ├── RadiologyOrderTable.jsx
│   ├── ScheduleCalendar.jsx
│   ├── ModalityStatusCard.jsx
│   ├── StudyDetails.jsx
│   ├── ReportEditor.jsx
│   ├── ReportViewer.jsx
│   └── ExceptionTable.jsx
│
└── services/
    └── radiologyApi.js
```

---

# 117. API VALIDATION

Validate:

- Patient ID
- Visit ID
- Admission ID
- Exam ID
- Doctor ID
- Modality ID
- Schedule dates
- Report permissions
- Status transitions
- Required fields
- Duplicate records

Never trust frontend validation alone.

---

# 118. STATE TRANSITION VALIDATION

Prevent invalid transitions.

Example:

```text
DRAFT → ORDERED
ORDERED → PENDING_SCHEDULING
PENDING_SCHEDULING → SCHEDULED
SCHEDULED → CHECKED_IN
CHECKED_IN → IN_PROGRESS
IN_PROGRESS → COMPLETED
COMPLETED → REPORT_PENDING
REPORT_PENDING → REPORT_READY
REPORT_READY → RELEASED
```

Do not allow:

```text
RELEASED → DRAFT
```

without an explicit amendment workflow.

---

# 119. DOCUMENT VERSIONING

Every released report must have:

```text
Report Number
Version
Created At
Verified By
Released By
Previous Version Reference
```

Amendment must never destroy previous versions.

---

# 120. AUDITABLE RPA EVIDENCE

For external system automation, capture where permitted:

- Screenshot on failure
- External reference ID
- External transaction status
- Timestamp
- Robot name
- Correlation ID
- Error message
- Evidence document

Do not capture unnecessary sensitive information.

---

# 121. REPORT ACCESS AUDITING

When a patient or doctor opens a report, record:

```text
User
Report
Patient
Timestamp
Action = VIEW/DOWNLOAD
```

---

# 122. PERFORMANCE REQUIREMENTS

Radiology dashboards should use:

- Pagination
- Server-side filtering
- Server-side sorting
- Indexed queries
- Lazy loading
- Date-range filtering

Do not load thousands of studies into the browser unnecessarily.

---

# 123. SEARCH

Support search by:

```text
Patient ID
Patient Name
Order ID
Accession Number
Study ID
Report Number
Doctor
Modality
Date Range
Status
```

---

# 124. FILTERS

Provide:

```text
Date
Modality
Exam
Priority
Order Status
Schedule Status
Study Status
Report Status
Radiologist
Exception Status
```

---

# 125. ERROR HANDLING

Use consistent API errors:

```json
{
  "success": false,
  "error": {
    "code": "RAD_MODALITY_UNAVAILABLE",
    "message": "The selected modality is currently unavailable.",
    "details": {}
  },
  "correlationId": "CORR-2026-000321"
}
```

Frontend should show user-friendly messages.

---

# 126. TESTING

Create unit tests for:

- Exam creation
- Exam activation
- Modality creation
- Modality status
- Order creation
- Duplicate order detection
- Schedule generation
- Slot conflict
- Booking
- Rescheduling
- Cancellation
- Check-in
- Study creation
- Accession generation
- Report creation
- Report verification
- Report release
- Amendment
- Billing idempotency
- Inventory integration
- RPA job creation
- External reconciliation
- RBAC
- Audit

---

# 127. INTEGRATION TESTS

Test:

```text
Patient
 ↓
Radiology Order
 ↓
Scheduling
 ↓
Check-In
 ↓
Study
 ↓
Report
 ↓
Billing
 ↓
Notification
 ↓
Patient Portal
```

Also:

```text
Radiology
 ↓
Inventory
```

and:

```text
Radiology
 ↓
RIS/PACS
 ↓
RPA
```

---

# 128. SECURITY TESTS

Test:

```text
Patient A accessing Patient B report
Receptionist editing report
Technician releasing report
Billing user modifying report
Unauthorized modality modification
Unauthorized schedule modification
Unauthorized report amendment
Unauthenticated document download
```

All must fail appropriately.

---

# 129. RPA TESTS

Test:

### Successful RIS login

```text
Login → Success
```

### Failed login

```text
Login → Failure → Exception
```

### Order submission

```text
Create order → Capture external ID → Verify
```

### Unknown submission

```text
Submit → Crash → Reconcile
```

### Study synchronization

```text
Search PACS → Verify accession → Update
```

### Report retrieval

```text
Retrieve → Verify → Store
```

### Duplicate protection

```text
Run same RPA job twice
↓
No duplicate external order
```

---

# 130. DEMO EXCEPTION TESTS

Implement:

```text
Patient mismatch
Scheduling conflict
Modality maintenance
External RIS unavailable
PACS unavailable
External study mismatch
Report mismatch
Billing failure
Notification failure
Inventory failure
```

Every exception must be recoverable without corrupting data.

---

# 131. ACCEPTANCE CRITERIA

The module is complete only when:

- Radiology exam master works.
- Modality master works.
- Radiology orders work.
- Patient identity validation works.
- Duplicate order detection works.
- Scheduling works.
- Slot conflicts are prevented.
- Modality maintenance blocks scheduling.
- Patient check-in works.
- Study/accession generation works.
- Study lifecycle works.
- RIS integration works or has a mock implementation.
- PACS metadata integration works or has a mock implementation.
- Reports can be created.
- Reports can be verified.
- Reports can be finalized.
- Reports can be released.
- Released reports are securely accessible.
- Report amendments preserve history.
- Billing integration works.
- Duplicate billing is prevented.
- Inventory integration works.
- Duplicate inventory consumption is prevented.
- Notifications work.
- Notification failures do not corrupt report state.
- Exceptions work.
- RPA jobs are traceable.
- Unknown external outcomes trigger reconciliation.
- RBAC works.
- Audit logs work.
- MongoDB indexes exist.
- Backend validation exists.
- Frontend validation exists.
- Unit tests exist.
- Integration tests exist.
- RPA tests exist.
- Seed/demo data exists.
- Complete end-to-end flow works.

---

# 132. IMPLEMENTATION ORDER

## Phase 1 — Database

Create:

```text
RadiologyExam
RadiologyModality
RadiologyOrder
RadiologySchedule
RadiologyStudy
RadiologyReport
RadiologyException
```

Add indexes and relationships.

---

## Phase 2 — Backend Core

Implement:

```text
Models
Validators
Services
Controllers
Routes
RBAC
Audit
Exception handling
```

---

## Phase 3 — Exam and Modality Master

Implement:

```text
Exam CRUD
Modality CRUD
Status management
Search
Filtering
```

---

## Phase 4 — Orders

Implement:

```text
Create
Validate
Duplicate detection
Cancel
Status management
```

---

## Phase 5 — Scheduling

Implement:

```text
Availability
Slot generation
Booking
Conflict detection
Rescheduling
Cancellation
Maintenance blocks
```

---

## Phase 6 — Check-In and Studies

Implement:

```text
Check-in
Study creation
Accession generation
Start
Complete
```

---

## Phase 7 — Reporting

Implement:

```text
Report draft
Verification
Finalization
Release
Versioning
Amendment
Secure access
```

---

## Phase 8 — Billing

Implement:

```text
Charge creation
Idempotency
Reconciliation
Billing exceptions
```

---

## Phase 9 — Inventory

Implement:

```text
Consumable usage
Inventory movement
Batch reference
Reconciliation
```

---

## Phase 10 — Notifications

Integrate:

```text
SMS
Email
Patient Portal
Notification tracking
```

---

## Phase 11 — RIS/PACS Integration

Implement:

```text
API integration interfaces
Mock RIS
Mock PACS
External identifiers
Reconciliation
```

---

## Phase 12 — RPA

Implement:

```text
RPA Job
Robot Framework
RIS automation
PACS metadata automation
Report retrieval
Evidence
Failure handling
Unknown-state reconciliation
```

---

## Phase 13 — Frontend

Implement:

```text
Dashboard
Exams
Modalities
Orders
Scheduling
Check-in
Studies
Reporting
Reports
Exceptions
Analytics
```

---

## Phase 14 — Security and Audit

Implement:

```text
RBAC
Authorization
Secure reports
Audit
RPA credential management
Access logging
```

---

## Phase 15 — Testing

Implement:

```text
Unit tests
API tests
Integration tests
Security tests
RPA tests
End-to-end tests
```

---

# 133. CROSS-MODULE DEPENDENCIES

This module integrates with:

```text
01 Patient Registration
02 Appointment Management
04 Patient Admission
05 Bed Management
07 Patient Records
08 Billing
09 Insurance Verification
10 Insurance Claims
11 Doctor Management
18 Medical Inventory
26 Notification Service
27 Document Generation
28 Reports & Analytics
```

Do not duplicate shared entities.

---

# 134. SOURCE-OF-TRUTH RULES

| Data | Source of Truth |
|---|---|
| Patient | Patient Registration |
| Doctor | Doctor Management |
| Visit | Patient/Visit system |
| Admission | Patient Admission |
| Radiology exam master | Radiology |
| Modality | Radiology |
| Radiology order | Radiology |
| Schedule | Radiology |
| Study metadata | Radiology |
| Radiology report | Radiology |
| Billing | Billing |
| Insurance | Insurance modules |
| Physical consumables | Medical Inventory |
| Notifications | Notification Service |
| Documents | Document Generation |
| RPA execution | RPA subsystem |
| Audit | Central Audit Service |

---

# 135. NO DUPLICATE MASTER DATA

Never create:

```text
RadiologyPatient
RadiologyDoctor
RadiologyBilling
RadiologyInventory
```

Use shared references:

```text
Patient
Doctor
Visit
Admission
Invoice
InventoryItem
User
```

---

# 136. STRICT RPA BOUNDARY

RPA may:

```text
Read
Search
Enter
Schedule according to configured rules
Submit
Retrieve
Download
Synchronize
Reconcile
Notify
Log
```

RPA must NOT:

```text
Diagnose
Interpret images
Generate findings
Generate medical impressions
Choose treatment
Determine medical fitness
Override radiologist
Approve insurance
Approve financial adjustments
```

---

# 137. FINAL AI CODING AGENT INSTRUCTION

Build this as a **fully functional production-quality Radiology Administration module**, not as a simple CRUD demonstration.

The implementation must:

1. Follow the existing MERN architecture.
2. Reuse shared hospital entities.
3. Implement complete RBAC.
4. Implement radiology exam and modality masters.
5. Implement order management.
6. Implement scheduling and conflict prevention.
7. Implement patient check-in.
8. Implement study/accession management.
9. Support RIS/PACS integration architecture.
10. Support Robot Framework automation.
11. Implement report creation, verification, finalization and release.
12. Preserve report versions.
13. Implement secure report access.
14. Integrate with Billing.
15. Integrate with Medical Inventory.
16. Integrate with Notification Service.
17. Implement exception handling.
18. Implement idempotency.
19. Handle unknown external transaction states safely.
20. Maintain complete auditability.
21. Never perform autonomous clinical interpretation.
22. Never invent findings or medical recommendations.
23. Never silently overwrite released reports.
24. Never duplicate billing or inventory transactions.
25. Provide realistic seed/demo data.
26. Provide unit, integration, security and RPA tests.
27. Provide mock RIS/PACS integrations where real systems are unavailable.
28. Ensure the complete workflow works from:

```text
Doctor Order
→ Scheduling
→ Patient Check-In
→ Radiology Study
→ Reporting
→ Verification
→ Release
→ Patient/Doctor Portal
```

**Do not implement placeholders where functional logic is expected.**

**Do not duplicate shared hospital master data.**

**Do not bypass authorization.**

**Do not use RPA as the system of record.**

**Do not allow RPA or application automation to diagnose, interpret images, or make clinical decisions.**

The completed module must integrate cleanly with all previously defined hospital modules and remain extensible for future RIS/PACS/API integrations.