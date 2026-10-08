# 11_DOCTOR_MANAGEMENT.md

# Doctor Management Module

## 1. Module Overview

Build a complete **Doctor Management Module** for the Hospital Administrative Automation & RPA Platform.

This module manages the hospital's administrative doctor master and all information required by other modules to identify, schedule, assign, and communicate with doctors.

The module must support:

- Doctor profile creation.
- Doctor profile updates.
- Doctor identity and contact information.
- Professional information.
- Specialization.
- Department assignment.
- Qualification information.
- Registration/license information.
- Credential/document management.
- Doctor employment/association status.
- Consultation configuration.
- Doctor availability.
- Doctor schedules.
- Recurring schedules.
- Schedule exceptions.
- Leave/unavailability.
- Appointment slot generation.
- Schedule conflict detection.
- Department transfers.
- Doctor status changes.
- Integration with Appointment Management.
- Integration with OPD Queue Management.
- Integration with Patient Records.
- Integration with Admission.
- Integration with Billing.
- Integration with Leave Management.
- Integration with Shift Management.
- RPA synchronization.
- Notifications.
- Audit logging.
- Human approval workflows.

### Critical Boundary

This module manages **administrative doctor information**.

It must NOT:

- Diagnose patients.
- Recommend treatments.
- Decide medical priority.
- Automatically approve clinical credentials.
- Decide clinical competence.
- Automatically determine whether a doctor is medically suitable for a patient.
- Change signed clinical records.
- Automatically approve professional registration.
- Invent qualification/license information.

Professional credentials and important administrative changes must follow configured approval workflows.

---

# 2. Technology Stack

Use the existing platform architecture.

### Frontend

- React.js
- React Router
- Existing Bootstrap/design system
- Axios/API client
- Reusable forms
- Data tables
- Modals
- Calendar/schedule components
- Role-based UI

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- REST APIs
- JWT authentication
- RBAC
- Validation middleware
- Audit logging
- Notification Service

### RPA

- Robot Framework
- Browser/API automation where required
- Approved external system synchronization
- RPA job tracking
- Evidence capture

---

# 3. Module Objective

Create a single authoritative administrative Doctor Master.

Other modules should reference the Doctor entity instead of storing duplicate doctor information.

Example:

```text id="f1h9xb"
Doctor
  │
  ├── Appointment
  ├── OPD Queue
  ├── Patient Records
  ├── Admission
  ├── Billing
  ├── Shift
  ├── Leave
  └── Reports
```

Doctor information should therefore be centrally managed.

---

# 4. Doctor Identity

Every doctor must have a permanent:

```text id="4ljk7e"
Doctor ID
```

Example:

```text id="spm6wl"
DOC10001
```

Doctor ID must remain stable even if:

- Department changes.
- Schedule changes.
- Contact information changes.
- Status changes.
- Doctor takes leave.
- Doctor transfers internally.

Do not create a new Doctor ID for routine profile updates.

---

# 5. Doctor Status

Support:

```text id="zj1e1n"
DRAFT
PENDING_APPROVAL
ACTIVE
ON_LEAVE
SUSPENDED
INACTIVE
TERMINATED
```

### DRAFT

Doctor record created but incomplete.

### PENDING_APPROVAL

Required administrative/credential review is pending.

### ACTIVE

Doctor can be used for configured hospital workflows.

### ON_LEAVE

Doctor remains active in the master but is temporarily unavailable.

### SUSPENDED

Doctor is temporarily restricted according to an authorized administrative decision.

### INACTIVE

Doctor is no longer actively scheduled.

### TERMINATED

Doctor's hospital association has ended.

Do not delete historical doctor records.

---

# 6. Doctor Data Model

Create:

```text id="8d09yk"
Doctor
```

Suggested Mongoose schema:

```javascript id="5v67bs"
{
  doctorId: String,

  userId: ObjectId,

  employeeId: ObjectId,

  title: String,

  firstName: String,
  middleName: String,
  lastName: String,

  displayName: String,

  gender: String,

  dateOfBirth: Date,

  phone: String,
  email: String,

  alternatePhone: String,

  profilePhoto: String,

  qualifications: [
    {
      qualification: String,
      institution: String,
      year: Number
    }
  ],

  specializations: [
    {
      name: String,
      primary: Boolean
    }
  ],

  registrationDetails: [
    {
      registrationNumber: String,
      registrationAuthority: String,
      issueDate: Date,
      expiryDate: Date,
      status: String
    }
  ],

  departments: [
    {
      departmentId: ObjectId,
      isPrimary: Boolean,
      startDate: Date,
      endDate: Date
    }
  ],

  consultationSettings: {
    consultationDurationMinutes: Number,
    consultationFee: Number,
    currency: String
  },

  status: String,

  joiningDate: Date,
  leavingDate: Date,

  employmentType: String,

  availabilityStatus: String,

  documents: [
    {
      documentId: ObjectId,
      documentType: String
    }
  ],

  notes: String,

  createdBy: ObjectId,
  updatedBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

Do not duplicate User authentication information unnecessarily.

---

# 7. Doctor Profile Ownership

The Doctor entity owns:

```text id="n5y0y7"
Doctor identity
Professional information
Specialization
Department association
Registration details
Consultation configuration
Availability relationship
Administrative status
```

Other modules own their own information.

For example:

```text id="s78ih9"
Doctor
→ Doctor master

Appointment
→ Appointment record

Shift
→ Shift assignment

Leave
→ Leave request

Patient Record
→ Clinical encounter information
```

Do not place appointment history inside Doctor as the source of truth.

---

# 8. Doctor Qualification

Support multiple qualifications.

Example:

```text id="4o6vdy"
MBBS
Institution: XYZ Medical College
Year: 2019
```

```text id="9j4y1x"
MD
Institution: ABC University
Year: 2022
```

Qualification records should be editable only by authorized users.

If documentation is required, link the qualification to supporting documents.

---

# 9. Registration Information

Support professional registration information:

```text id="h3phw2"
Registration Number
Registration Authority
Issue Date
Expiry Date
Status
Supporting Document
```

Example:

```text id="3cm1vl"
Registration Number:
REG-123456

Authority:
Configured Registration Authority

Status:
VALID
```

The system should store the information provided by authorized staff.

Do not automatically claim that a registration is legally valid unless verification has actually been completed.

---

# 10. Registration Status

Support:

```text id="g4a8vv"
VALID
EXPIRING_SOON
EXPIRED
PENDING_VERIFICATION
NOT_VERIFIED
```

Expiration calculation should use configured thresholds.

Example:

```text id="0v2y4b"
registrationExpiryWarningDays = 30
```

Do not hard-code a legal requirement.

---

# 11. Specialization

Doctor can have multiple specializations.

Example:

```text id="5f9e7j"
Primary:
Cardiology

Secondary:
Internal Medicine
```

Specializations should reference a configurable master where possible.

Avoid arbitrary free-text values when the hospital maintains a specialization master.

---

# 12. Department Association

Doctor can belong to one or more departments.

Example:

```text id="iy5j1n"
Primary Department:
Cardiology

Secondary Department:
Emergency Medicine
```

Each association should store:

```text id="qaj5zw"
Department
Primary/Secondary
Start Date
End Date
Status
```

Do not delete historical department assignments.

---

# 13. Doctor Department Transfer

Workflow:

```text id="ym9p4r"
Existing Department
        ↓
Transfer Request
        ↓
Authorized Approval
        ↓
New Department Assignment
        ↓
Update Doctor Master
        ↓
Update Future Schedule
        ↓
Notify Relevant Staff
```

Historical appointments must remain associated with the department applicable at the time.

Do not rewrite historical appointment data simply because the doctor transferred.

---

# 14. Doctor Creation Workflow

```text id="67x0sy"
HR/Admin Creates Doctor
        ↓
Enter Basic Information
        ↓
Enter Professional Information
        ↓
Select Department
        ↓
Add Specialization
        ↓
Add Registration
        ↓
Upload Documents
        ↓
Configure Consultation
        ↓
Review
        ↓
Submit
        ↓
PENDING_APPROVAL
        ↓
Authorized Approval
        ↓
ACTIVE
```

Approval requirements must be configurable.

---

# 15. Doctor Creation UI

Route:

```text id="h2v5h4"
/administration/doctors/new
```

Sections:

### Personal Information

```text id="h8w7b8"
Title
First Name *
Middle Name
Last Name *
Date of Birth
Gender
Phone *
Email *
```

### Professional Information

```text id="l7g9nq"
Qualifications
Specialization
Registration
```

### Department

```text id="h4zqtc"
Primary Department *
Additional Departments
```

### Consultation

```text id="z5l0ec"
Consultation Duration
Consultation Fee
Currency
```

### Documents

```text id="7b1x4y"
Registration Certificate
Qualification Certificate
Identity/Employment Document
Other
```

---

# 16. Doctor Search

Provide search by:

```text id="e3r0jb"
Doctor ID
Name
Email
Phone
Department
Specialization
Registration Number
Status
```

Support partial name search.

Example:

```text id="u1jqj7"
Search:
"Patel"
```

Results:

```text id="c5l54s"
DOC10001
Dr. Amit Patel
Cardiology
ACTIVE
```

---

# 17. Doctor List UI

Route:

```text id="5p9v5j"
/administration/doctors
```

Columns:

| Field | Example |
|---|---|
| Doctor ID | DOC10001 |
| Name | Dr. Amit Patel |
| Specialization | Cardiology |
| Department | Cardiology |
| Status | ACTIVE |
| Availability | AVAILABLE |
| Registration | VALID |
| Actions | View/Edit/Schedule |

---

# 18. Doctor Detail UI

Route:

```text id="z9c7k2"
/administration/doctors/:doctorId
```

Tabs:

```text id="t0d0e1"
Overview
Professional
Departments
Schedule
Availability
Leave
Documents
Appointments
Audit
```

Appointments shown here are a linked view, not the source of appointment data.

---

# 19. Doctor Availability

Availability represents whether the doctor can currently be scheduled.

Possible values:

```text id="f2b9q1"
AVAILABLE
UNAVAILABLE
ON_LEAVE
SUSPENDED
```

Availability must consider:

- Doctor status.
- Schedule.
- Leave.
- Explicit unavailability.
- Department rules.
- Existing appointment capacity.

---

# 20. Doctor Schedule

Create:

```text id="x9x3f7"
DoctorSchedule
```

Suggested schema:

```javascript id="k6j4ve"
{
  doctorId: ObjectId,

  departmentId: ObjectId,

  dayOfWeek: Number,

  startTime: String,

  endTime: String,

  slotDurationMinutes: Number,

  locationId: ObjectId,

  effectiveFrom: Date,

  effectiveTo: Date,

  status: String,

  createdBy: ObjectId,

  updatedBy: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 21. Schedule Status

Support:

```text id="s4x8r8"
DRAFT
PENDING_APPROVAL
ACTIVE
INACTIVE
CANCELLED
```

Only ACTIVE schedules should normally generate appointment availability.

---

# 22. Recurring Schedule

Support recurring schedules.

Example:

```text id="l5q3v6"
Doctor:
DOC10001

Monday:
09:00–13:00

Wednesday:
09:00–13:00

Friday:
14:00–18:00
```

Each schedule should have:

```text id="r4x0j2"
Effective From
Effective To
```

Avoid infinite schedules with no effective period if the hospital's configuration requires explicit periods.

---

# 23. Schedule Exceptions

Support exceptions such as:

```text id="x7v7ra"
Holiday
Doctor Leave
Doctor Unavailability
Department Closure
Special Clinic
Schedule Change
```

Exception records should override recurring availability only for the affected period.

---

# 24. Doctor Availability Model

Create:

```text id="b4m6k2"
DoctorAvailability
```

Suggested fields:

```javascript id="1v2h7n"
{
  doctorId: ObjectId,

  date: Date,

  startTime: String,

  endTime: String,

  status: String,

  reason: String,

  source: String,

  createdBy: ObjectId,

  createdAt: Date
}
```

Possible statuses:

```text id="k0w5u8"
AVAILABLE
UNAVAILABLE
LEAVE
SPECIAL_AVAILABILITY
```

---

# 25. Schedule Conflict Detection

Before activating a schedule, check:

```text id="5h4v2d"
Same doctor
+
Overlapping date range
+
Overlapping time
+
Same department/location
```

Example conflict:

```text id="c5v9qp"
Existing:
09:00–12:00

New:
11:00–14:00
```

System should flag:

```text id="5nq2xj"
Schedule conflict detected.
```

Do not silently overwrite the existing schedule.

---

# 26. Location Assignment

Doctor schedule may optionally specify:

```text id="p6h3z8"
OPD Room
Clinic
Department
Teleconsultation
Other configured location
```

Location must reference a configurable hospital location/room entity.

Do not hard-code room names.

---

# 27. Appointment Integration

Appointment Management must use active doctor schedules.

Flow:

```text id="t0f1ap"
Patient selects Doctor
        ↓
Appointment Service
        ↓
DoctorSchedule
        ↓
DoctorAvailability
        ↓
Existing Appointments
        ↓
Available Slots
```

Doctor Management should not directly create patient appointments.

Appointment Management remains the source of truth for appointments.

---

# 28. Slot Generation

Given:

```text id="v3f0gk"
Start:
09:00

End:
12:00

Slot:
30 minutes
```

Generate:

```text id="8ql4y6"
09:00
09:30
10:00
10:30
11:00
11:30
```

The actual slot calculation must also consider:

- Existing bookings.
- Schedule exceptions.
- Leave.
- Holidays.
- Doctor status.
- Department/location constraints.

---

# 29. Consultation Configuration

Support:

```text id="t8j1x4"
Consultation Duration
Consultation Fee
Currency
```

Example:

```text id="v9e6tq"
Duration: 30 minutes
Fee: Configured amount
Currency: INR
```

Billing should consume configured rates according to its own authoritative billing/rate configuration.

Do not make Doctor Management the financial source of truth for final billing.

---

# 30. Doctor Leave Integration

Leave Management owns leave requests.

Doctor Management should consume approved leave.

Flow:

```text id="m8r1d5"
Doctor Leave Request
        ↓
Leave Management
        ↓
Approved
        ↓
Doctor Availability
        ↓
Schedule Exception
        ↓
Appointment Slot Update
        ↓
Notifications
```

Do not create an independent doctor leave system.

---

# 31. Shift Management Integration

Shift Management owns staff/doctor shift assignments.

Doctor Management consumes relevant approved shift information where scheduling depends on it.

Example:

```text id="8gk2wq"
Shift:
09:00–17:00

Doctor:
DOC10001

Department:
Cardiology
```

If an OPD schedule conflicts with an approved shift constraint, the system should flag it according to configured policy.

Do not automatically change approved shifts.

---

# 32. Appointment Conflict

Before making a doctor available:

Check:

```text id="i0g4de"
Doctor status
Schedule
Leave
Existing appointments
```

If doctor becomes unavailable after appointments exist:

```text id="j4j2e9"
Do not silently delete appointments.
```

Create an administrative task:

```text id="z6c1av"
Affected appointments require handling.
```

Authorized staff can:

- Reschedule.
- Reassign according to hospital policy.
- Cancel.
- Notify patients.

RPA can execute the approved administrative changes.

---

# 33. Doctor Unavailability

Support manual temporary unavailability.

Example:

```text id="8c4d0x"
Doctor:
DOC10001

Date:
15-Oct-2026

Time:
14:00–18:00

Reason:
Administrative unavailability
```

Only authorized staff can create this record.

---

# 34. Doctor Schedule Change Workflow

```text id="f4e3nv"
Staff creates schedule change
        ↓
Conflict Check
        ↓
Review
        ↓
Approval
        ↓
Activate New Schedule
        ↓
Identify affected future slots
        ↓
Handle appointments
        ↓
Notify patients/staff
```

Historical schedule records must remain auditable.

---

# 35. Schedule Versioning

Do not overwrite important schedule history.

Example:

```text id="9e1i7b"
Version 1:
09:00–13:00

Version 2:
10:00–14:00
```

Store effective dates.

This allows the system to answer:

```text id="s9n0x1"
What was Dr. Patel's schedule on 01-Oct-2026?
```

---

# 36. RPA Role

Robot Framework can automate administrative doctor-management tasks such as:

- Reading approved doctor data.
- Creating doctor records in legacy systems.
- Updating doctor profiles in external systems.
- Synchronizing department assignments.
- Synchronizing approved schedules.
- Updating availability in external scheduling systems.
- Checking external system update status.
- Capturing evidence.
- Reporting failures.
- Sending notifications.

RPA must not independently approve:

- Doctor credentials.
- Department assignment.
- Employment status.
- Clinical privileges.
- Professional registration.
- Suspension.
- Termination.

---

# 37. RPA Doctor Synchronization

Example:

```text id="6m8y0q"
Approved Doctor Record
        ↓
RPA Job
        ↓
Open Legacy Hospital System
        ↓
Search Doctor
        ↓
Create/Update Doctor
        ↓
Verify Saved Information
        ↓
Capture Reference
        ↓
Update Sync Status
        ↓
Audit
```

---

# 38. Doctor External Sync Model

If required, add:

```text id="5j5p5d"
DoctorExternalSync
```

Suggested fields:

```javascript id="q2x2i5"
{
  doctorId: ObjectId,

  externalSystem: String,

  externalDoctorId: String,

  syncType: String,

  status: String,

  lastSyncedAt: Date,

  lastAttemptAt: Date,

  errorCode: String,

  errorMessage: String,

  rpaJobId: ObjectId,

  correlationId: String
}
```

Statuses:

```text id="h9q5xw"
PENDING
SYNCING
SYNCED
FAILED
MANUAL_REVIEW
```

---

# 39. RPA Folder Structure

Add:

```text id="j8h0q1"
robot/
├── doctor/
│   ├── tests/
│   │   ├── create_doctor.robot
│   │   ├── update_doctor.robot
│   │   ├── sync_doctor_schedule.robot
│   │   └── sync_doctor_availability.robot
│   │
│   ├── keywords/
│   │   ├── doctor_login.resource
│   │   ├── doctor_search.resource
│   │   ├── doctor_profile.resource
│   │   ├── doctor_schedule.resource
│   │   ├── doctor_availability.resource
│   │   └── doctor_evidence.resource
│   │
│   └── resources/
│       ├── browser.resource
│       ├── api.resource
│       ├── secrets.resource
│       └── common.resource
```

---

# 40. Robot Framework Example

```robot id="4up6i2"
*** Test Cases ***
Synchronize Doctor Schedule
    [Arguments]    ${doctor_id}

    Get Approved Doctor Schedule
    Validate Schedule

    Open External Hospital System
    Login To External System

    Search Doctor
    Open Doctor Schedule
    Update Schedule

    Verify Schedule Saved
    Capture Evidence

    Submit Synchronization Result
    Close External Session
```

---

# 41. RPA Verification

After updating an external system:

```text id="2q8v7m"
Write
  ↓
Read Back
  ↓
Compare
  ↓
Match?
 ├── YES → SUCCESS
 └── NO → EXCEPTION
```

Never mark a synchronization successful merely because the external Save button was clicked.

---

# 42. Doctor Profile Update

Editable fields depend on permission.

Example:

```text id="m5x7o2"
Contact Number
Email
Department
Specialization
Consultation Settings
Availability
```

Sensitive fields:

```text id="g7p1tx"
Registration
Qualification
Employment Status
Clinical Privileges
```

may require approval.

Use configurable approval rules.

---

# 43. Doctor Profile Approval

Example:

```text id="x5x4ye"
Staff submits registration update
        ↓
PENDING_APPROVAL
        ↓
Authorized Reviewer
        ↓
Approve / Return
```

If approved:

```text id="t7q9zi"
ACTIVE
```

If returned:

```text id="d0x5m3"
CORRECTION_REQUIRED
```

If the hospital does not need approval for a specific field, the field can follow the standard update workflow.

---

# 44. Doctor Documents

Support:

```text id="5y6m8z"
Qualification Certificate
Registration Certificate
Identity Document
Employment Document
Other Authorized Document
```

Use existing Document Generation/Storage architecture.

Documents must have:

```text id="8z2e4w"
Document ID
Doctor ID
Type
Version
Storage Reference
Uploaded By
Uploaded At
Access Control
```

---

# 45. Credential Expiry Alerts

System should identify upcoming expirations.

Example:

```text id="k1z8l0"
Registration expires in 15 days.
```

Generate:

```text id="x3m7p9"
Notification
Administrative Task
Dashboard Alert
```

Threshold must be configurable.

RPA can send reminders but cannot renew a professional credential autonomously.

---

# 46. Doctor Availability Dashboard

Route:

```text id="b3x6j7"
/administration/doctors/availability
```

Filters:

```text id="0p8a7f"
Date
Department
Specialization
Doctor
Status
```

Display:

```text id="9z8r2j"
Doctor
Department
Available From
Available To
Status
Appointments
Leave
```

---

# 47. Schedule Calendar

Route:

```text id="x6q4m2"
/administration/doctors/:doctorId/schedule
```

Views:

```text id="2s9m3n"
Day
Week
Month
```

Actions:

```text id="0d7p2a"
Add Schedule
Edit Schedule
Add Exception
Block Time
View Appointments
```

Do not allow schedule editing to bypass authorization.

---

# 48. Doctor Appointment View

Route:

```text id="9z5w0n"
/administration/doctors/:doctorId/appointments
```

Show:

```text id="k6e5u8"
Date
Time
Patient ID
Patient Name
Appointment Status
Department
Room
```

Patient clinical details should not be exposed unnecessarily.

---

# 49. Integration With OPD Queue

OPD Queue uses:

```text id="d1q4hf"
Doctor ID
```

Doctor Management provides:

```text id="q8r6pm"
Doctor Name
Department
Current availability
Room/location
```

OPD Queue remains authoritative for:

```text id="t1z4a0"
Token
Queue position
Check-in
Queue status
```

Do not move queue logic into Doctor Management.

---

# 50. Integration With Patient Records

Patient records can display:

```text id="1z6w5m"
Doctor
Department
Appointment
Encounter
```

Patient Records remain authoritative for patient encounter history.

Doctor Management remains authoritative for doctor master data.

---

# 51. Integration With Admission

Admission may reference:

```text id="3d5q2k"
Attending Doctor
Consulting Doctor
Department
```

Actual admission relationships should use Doctor IDs.

Do not duplicate full doctor profile data inside Admission.

---

# 52. Integration With Billing

Billing may require:

```text id="m3j5i7"
Doctor ID
Doctor Name
Department
Consultation Service
```

Billing remains authoritative for charges/rates.

Doctor Management only provides doctor identity and configured consultation information.

---

# 53. Doctor Notifications

Use centralized Notification Service.

Events:

```text id="k3g8m5"
DOCTOR_CREATED
DOCTOR_APPROVAL_REQUIRED
DOCTOR_APPROVED
DOCTOR_PROFILE_UPDATED
DOCTOR_SCHEDULE_CHANGED
DOCTOR_UNAVAILABLE
DOCTOR_LEAVE_APPROVED
DOCTOR_CREDENTIAL_EXPIRING
DOCTOR_EXTERNAL_SYNC_FAILED
```

Recipients depend on event.

---

# 54. Schedule Change Notification

If a schedule change affects future appointments:

```text id="r8j4u6"
Identify affected appointments
        ↓
Create administrative task
        ↓
Authorized staff reviews
        ↓
Reschedule/cancel/reassign
        ↓
Notify patients
```

RPA can perform the approved repetitive changes.

It must not independently decide patient reassignment unless configured rules explicitly authorize the action.

---

# 55. Doctor Deactivation

When a doctor becomes inactive:

```text id="s8k2m4"
Doctor Status
    ↓
INACTIVE
```

System must:

- Prevent new appointments according to configuration.
- Prevent new schedule creation.
- Preserve existing historical appointments.
- Identify future appointments.
- Create an administrative task for affected appointments.
- Notify authorized staff.
- Update availability.

Do not delete doctor history.

---

# 56. Doctor Termination

When employment ends:

```text id="g6p4y8"
TERMINATED
```

System should:

- Stop new scheduling.
- End future availability.
- Preserve historical records.
- Preserve appointments.
- Preserve patient records.
- Preserve billing references.
- Preserve audit records.
- Trigger approved access deactivation through Staff/HR workflows.

Do not delete the Doctor record.

---

# 57. Doctor Reactivation

Authorized users may reactivate a doctor if allowed.

Workflow:

```text id="h5y7q1"
INACTIVE
   ↓
Reactivation Request
   ↓
Credential/Administrative Checks
   ↓
Approval
   ↓
ACTIVE
```

Schedules should not automatically become active unless configured.

---

# 58. Department and Specialization Filters

Doctor availability search must support:

```text id="u5c8m4"
Department
Specialization
Doctor
Date
Time
Location
```

This supports Appointment Management.

---

# 59. API Endpoints

## Doctors

```http id="5z0g6d"
POST /api/doctors
GET /api/doctors
GET /api/doctors/:id
PUT /api/doctors/:id
PATCH /api/doctors/:id/status
```

---

## Professional Information

```http id="d8x0w1"
POST /api/doctors/:id/qualifications
PUT /api/doctors/:id/qualifications/:qualificationId

POST /api/doctors/:id/registrations
PUT /api/doctors/:id/registrations/:registrationId
```

---

## Departments

```http id="6d4q3r"
POST /api/doctors/:id/departments
PUT /api/doctors/:id/departments/:assignmentId
POST /api/doctors/:id/departments/:assignmentId/end
```

---

## Schedule

```http id="x3r7p0"
GET /api/doctors/:id/schedules
POST /api/doctors/:id/schedules
PUT /api/doctors/:id/schedules/:scheduleId
DELETE /api/doctors/:id/schedules/:scheduleId
```

---

## Availability

```http id="e7k1z8"
GET /api/doctors/:id/availability
POST /api/doctors/:id/availability
PUT /api/doctors/:id/availability/:availabilityId
```

---

## Conflict Detection

```http id="n6c2v9"
POST /api/doctors/:id/schedules/check-conflict
```

---

# 60. Backend Structure

Implement:

```text id="3s6p1j"
server/
├── models/
│   ├── Doctor.js
│   ├── DoctorSchedule.js
│   ├── DoctorAvailability.js
│   └── DoctorExternalSync.js
│
├── controllers/
│   ├── doctorController.js
│   ├── doctorScheduleController.js
│   └── doctorAvailabilityController.js
│
├── services/
│   ├── doctorService.js
│   ├── doctorScheduleService.js
│   ├── doctorAvailabilityService.js
│   ├── doctorConflictService.js
│   ├── doctorCredentialService.js
│   └── doctorSyncService.js
│
└── routes/
    ├── doctorRoutes.js
    ├── doctorScheduleRoutes.js
    └── doctorAvailabilityRoutes.js
```

---

# 61. Service Responsibilities

## doctorService

Handles:

- Doctor creation.
- Doctor updates.
- Doctor status.
- Search.
- Department association.

## doctorScheduleService

Handles:

- Schedule creation.
- Schedule updates.
- Recurrence.
- Effective dates.
- Schedule activation.

## doctorAvailabilityService

Handles:

- Daily availability.
- Unavailability.
- Leave integration.
- Schedule exceptions.

## doctorConflictService

Handles:

- Schedule conflicts.
- Leave conflicts.
- Existing appointment conflicts.

## doctorCredentialService

Handles:

- Qualification.
- Registration.
- Expiry.
- Approval status.

## doctorSyncService

Handles:

- External system synchronization.
- RPA job creation.
- Sync result processing.

---

# 62. Database Indexes

Create:

```javascript id="3g8b7z"
Doctor.index({
  doctorId: 1
}, {
  unique: true
});

Doctor.index({
  displayName: 1
});

Doctor.index({
  status: 1
});

Doctor.index({
  "departments.departmentId": 1
});

Doctor.index({
  "specializations.name": 1
});

Doctor.index({
  "registrationDetails.registrationNumber": 1
});

DoctorSchedule.index({
  doctorId: 1,
  effectiveFrom: 1,
  effectiveTo: 1
});

DoctorSchedule.index({
  departmentId: 1,
  dayOfWeek: 1
});

DoctorAvailability.index({
  doctorId: 1,
  date: 1
});
```

---

# 63. RBAC Permissions

Create permissions such as:

```text id="p4c7k9"
doctor.view
doctor.create
doctor.edit
doctor.approve
doctor.activate
doctor.deactivate
doctor.view_documents
doctor.manage_documents
doctor.manage_departments
doctor.manage_schedule
doctor.manage_availability
doctor.view_appointments
doctor.view_audit
doctor.sync_external
doctor.resolve_sync_exception
```

---

# 64. Suggested Role Access

| Action | Receptionist | Doctor | HR | Admin Manager | Hospital Management | System Admin |
|---|---:|---:|---:|---:|---:|---:|
| View Doctor | Yes | Own/Allowed | Yes | Yes | Yes | Yes |
| Create Doctor | No | No | Yes | Yes | Yes | Yes |
| Edit Profile | Limited | Own Limited | Yes | Yes | Yes | Yes |
| Manage Credentials | No | Limited | Yes | Yes | Yes | Yes |
| Manage Schedule | No | Limited | Limited | Yes | Yes | Yes |
| Manage Availability | No | Own | Yes | Yes | Yes | Yes |
| Approve Doctor | No | No | Configurable | Yes | Yes | Yes |
| External Sync | No | No | Limited | Yes | Yes | Yes |
| Audit | No | Limited | Yes | Yes | Yes | Yes |

Actual permissions must use the application's RBAC system.

---

# 65. Audit Events

Record:

```text id="k5y2d1"
DOCTOR_CREATED
DOCTOR_UPDATED
DOCTOR_APPROVAL_REQUESTED
DOCTOR_APPROVED
DOCTOR_REJECTED
DOCTOR_ACTIVATED
DOCTOR_DEACTIVATED
DOCTOR_TERMINATED
DOCTOR_DEPARTMENT_ASSIGNED
DOCTOR_DEPARTMENT_CHANGED
DOCTOR_QUALIFICATION_UPDATED
DOCTOR_REGISTRATION_UPDATED
DOCTOR_SCHEDULE_CREATED
DOCTOR_SCHEDULE_UPDATED
DOCTOR_SCHEDULE_CANCELLED
DOCTOR_AVAILABILITY_CHANGED
DOCTOR_EXTERNAL_SYNC_STARTED
DOCTOR_EXTERNAL_SYNC_COMPLETED
DOCTOR_EXTERNAL_SYNC_FAILED
```

Audit must include:

```text id="x0p9n7"
Actor
Entity
Entity ID
Action
Timestamp
Correlation ID
Before
After
Source
```

---

# 66. Security

Implement:

- JWT authentication.
- RBAC.
- Backend authorization.
- Field-level permission where needed.
- Secure document access.
- Input validation.
- Audit logs.
- Secure external integrations.
- No credentials in source code.
- No credentials in logs.
- Least privilege.
- Secure file upload.
- Protection against unauthorized doctor-profile changes.

---

# 67. Sensitive Fields

Potentially sensitive fields include:

```text id="p8w1z3"
Date of Birth
Personal Phone
Personal Email
Registration Information
Credential Documents
Employment Information
```

Use appropriate access controls.

---

# 68. Doctor Self-Service

If the doctor portal allows profile access:

Doctor can:

- View own profile.
- View own schedule.
- View own availability.
- Request profile correction.
- Request schedule changes.
- View approved leave.
- Upload permitted documents.

Doctor should not directly modify controlled master fields without the configured workflow.

Example:

```text id="8r4n5y"
Doctor requests email change
       ↓
Change Request
       ↓
Approval if required
       ↓
Doctor Master Updated
```

---

# 69. Doctor Schedule Self-Service

Doctor may request:

```text id="b4q7n2"
Availability change
Schedule change
Unavailability
```

Workflow:

```text id="q1m9x5"
Doctor Request
    ↓
Conflict Check
    ↓
Manager/Admin Review
    ↓
Approved
    ↓
Schedule Updated
```

Do not allow unauthorized direct schedule changes if hospital policy requires approval.

---

# 70. Notifications for Doctor Schedule

When approved schedule changes affect the doctor:

```text id="g3q6r8"
Doctor notification
```

When affected appointments exist:

```text id="f1w8k2"
Staff notification
Patient notification
```

Use centralized Notification Service.

---

# 71. RPA Sync Exception

Example:

```text id="j7k5m3"
Doctor DOC10001
External System:
Legacy HIS

Sync:
FAILED

Reason:
Doctor record could not be found.
```

Create:

```text id="t2c9w1"
ExceptionCase
```

RPA must not create a duplicate external doctor record without configured permission.

---

# 72. External System Sync States

Use:

```text id="z9x2c5"
NOT_SYNCED
QUEUED
SYNCING
SYNCED
FAILED
MANUAL_REVIEW
```

Display last synchronization information:

```text id="v8n3q6"
Last Sync:
06-Oct-2026 10:30

Status:
SYNCED
```

---

# 73. Doctor Master Dashboard

Route:

```text id="m2k6j8"
/administration/doctors/dashboard
```

Cards:

```text id="x3p5s7"
Total Doctors
Active Doctors
On Leave
Inactive
Pending Approval
Credential Expiring
Schedule Conflicts
Sync Failures
```

---

# 74. Reports

Provide:

```text id="j7v2p9"
Doctor Count by Department
Doctor Count by Specialization
Active vs Inactive
Doctors on Leave
Upcoming Credential Expiry
Schedule Utilization
Availability
External Sync Status
```

Use date and department filters.

---

# 75. Seed Data

Create realistic development data.

Example:

```text id="n9k2v4"
Doctor ID:
DOC10001

Name:
Dr. Amit Patel

Department:
Cardiology

Specialization:
Cardiology

Status:
ACTIVE

Registration:
REG-123456

Registration Status:
VALID
```

Schedule:

```text id="q3f7y1"
Monday
09:00–13:00

Wednesday
09:00–13:00

Friday
14:00–18:00
```

Create additional doctors for:

```text id="v4z8s2"
ACTIVE
ON_LEAVE
PENDING_APPROVAL
INACTIVE
SUSPENDED
```

Create schedule conflicts for testing.

---

# 76. Example End-to-End Scenario

Create a new doctor:

```text id="8s7x5c"
Dr. Amit Patel
DOC10001
```

HR enters:

```text id="j3m6v9"
Qualification:
MBBS

Specialization:
Cardiology

Department:
Cardiology

Registration:
REG-123456
```

Documents uploaded.

Record:

```text id="z5x8m1"
PENDING_APPROVAL
```

Authorized administrator reviews.

Approves:

```text id="r7q2k5"
ACTIVE
```

Schedule created:

```text id="e6n3p8"
Monday
09:00–13:00
```

Appointment Management reads active schedule and creates available slots.

Patient books:

```text id="c9v1x7"
10:00
```

Doctor later requests leave.

Leave Management approves:

```text id="y2m5k8"
15-Oct-2026
```

Doctor Availability updates.

Affected appointment is identified.

Staff handles rescheduling.

Patients receive notifications.

RPA synchronizes the schedule change with a legacy hospital system.

External system confirms update.

Sync status:

```text id="b8q4w6"
SYNCED
```

Audit history contains the entire workflow.

---

# 77. Example Schedule Conflict

Existing:

```text id="q4s8m2"
Monday
09:00–13:00
```

User creates:

```text id="z1x5c9"
Monday
11:00–15:00
```

System detects:

```text id="m7v3k6"
CONFLICT
```

Show:

```text
Doctor DOC10001 already has a schedule from
09:00 to 13:00 on Monday.

Please review the overlapping schedule.
```

Do not automatically overwrite.

---

# 78. Example Credential Expiry

Registration:

```text id="d5f8q1"
Expiry:
30-Oct-2026
```

Current date:

```text id="n3k7p4"
06-Oct-2026
```

If warning threshold is 30 days:

```text id="r9m2v5"
EXPIRING_SOON
```

Notify authorized administrator.

Do not automatically suspend the doctor unless a configured hospital rule explicitly requires it.

---

# 79. Testing Requirements

## Backend Tests

Test:

```text id="t4z8y2"
Doctor creation
Doctor update
Duplicate doctor prevention
Department assignment
Department transfer
Qualification management
Registration management
Status changes
Schedule creation
Schedule conflict
Availability
Leave integration
External sync
RBAC
Audit
```

---

# 80. Schedule Tests

Test:

```text id="p5c7m1"
Recurring schedule
Effective dates
Overlapping schedules
Schedule exception
Leave conflict
Doctor inactive
Doctor terminated
Existing appointment conflict
Slot generation integration
```

---

# 81. Frontend Tests

Test:

```text id="y8q2v5"
Doctor list
Search
Doctor creation
Doctor detail
Doctor edit
Department assignment
Schedule calendar
Availability
Credential documents
Approval
Status change
Notifications
Permissions
```

---

# 82. RPA Tests

Test:

```text id="m3x7z1"
Create doctor in external system
Update doctor
Sync department
Sync schedule
Sync availability
Verify external save
Handle external system failure
Handle doctor-not-found
Capture evidence
Create exception
Retry failed synchronization
```

---

# 83. Security Tests

Verify:

```text id="c7v1m5"
Unauthorized user cannot create doctor.
Unauthorized user cannot approve doctor.
Unauthorized user cannot edit credentials.
Doctor cannot modify another doctor's controlled profile.
Doctor cannot approve own credential change.
Receptionist cannot configure external integration.
Sensitive documents require permission.
Audit cannot be modified through normal APIs.
```

---

# 84. API Validation

Validate:

```text id="q9n4x6"
Required fields
Email
Phone
Dates
Department IDs
Specialization IDs
Registration numbers
Status enums
Schedule times
Effective dates
```

Reject invalid schedule:

```text id="k5m8p2"
startTime >= endTime
```

Reject invalid date ranges:

```text id="a6v3z9"
effectiveFrom > effectiveTo
```

---

# 85. Transaction Requirements

Use database transactions when operations require multiple updates.

Example:

```text id="j4x7m1"
Approve Doctor
  ↓
Update Doctor Status
  ↓
Create Audit Event
  ↓
Create Notification
```

If required operations must be atomic, use a transaction.

For external RPA/API actions, do not hold a MongoDB transaction open while waiting for a browser automation job.

---

# 86. Implementation Order

Implement in this order:

```text id="w3k6q9"
1. Doctor model
2. Doctor qualification structure
3. Registration structure
4. Department relationship
5. Doctor status
6. Doctor schedule model
7. Doctor availability model
8. Doctor search APIs
9. Doctor CRUD APIs
10. Credential management
11. Schedule management
12. Conflict detection
13. Availability management
14. Leave integration
15. Shift integration
16. Appointment integration
17. Notification integration
18. Audit integration
19. RPA job integration
20. External sync
21. Administration UI
22. Schedule calendar
23. Doctor self-service
24. Seed data
25. Automated tests
26. RPA tests
27. Security testing
28. End-to-end testing
```

---

# 87. AI Coding Agent Instructions

Implement this module inside the existing hospital platform.

Strict rules:

1. Reuse the existing authentication system.
2. Reuse existing RBAC.
3. Reuse existing User model.
4. Reuse existing Employee model where appropriate.
5. Reuse existing Department model.
6. Reuse existing Leave Management.
7. Reuse existing Shift Management.
8. Reuse existing Appointment Management.
9. Reuse existing Notification Service.
10. Reuse existing Document Service.
11. Reuse existing Audit Service.
12. Reuse existing RPA infrastructure.
13. Do not create duplicate doctor identities.
14. Do not delete historical doctor records.
15. Do not silently overwrite schedules.
16. Do not automatically approve credentials.
17. Do not make clinical decisions.
18. Do not invent registration information.
19. Do not invent qualifications.
20. Do not automatically change patient appointments without an approved workflow.
21. Prevent schedule conflicts.
22. Preserve schedule history.
23. Validate all external synchronization results.
24. Do not store external-system credentials in source code.
25. Do not store secrets in logs.
26. Isolate provider/legacy-system-specific RPA selectors.
27. Implement idempotent synchronization.
28. Create exceptions for ambiguous failures.
29. Use human review for sensitive administrative decisions.
30. Write automated tests.
31. Write Robot Framework tests.
32. Implement complete RBAC.
33. Implement audit logging.
34. Implement notifications.
35. Implement realistic seed data.
36. Verify all integrations end-to-end.

---

# 88. Definition of Done

The Doctor Management Module is complete when the following workflow works end-to-end:

```text id="f7m2x9"
HR/Admin
   ↓
Create Doctor
   ↓
Professional Information
   ↓
Department
   ↓
Credentials
   ↓
Documents
   ↓
Approval
   ↓
ACTIVE
   ↓
Schedule
   ↓
Availability
   ↓
Appointment Slots
   ↓
Patient Appointment
   ↓
OPD Queue
   ↓
Patient Encounter
```

And administrative changes work:

```text id="v4x8k2"
Doctor Leave
   ↓
Availability Update
   ↓
Affected Appointments
   ↓
Authorized Staff Action
   ↓
Patient Notification
```

And external synchronization works:

```text id="j9q3m7"
Approved Change
   ↓
RPA Job
   ↓
Legacy/External System
   ↓
Write
   ↓
Read Back
   ↓
Verify
   ↓
SYNCED / FAILED
   ↓
Audit
```

The final implementation must provide:

```text id="b6y1r8"
Doctor Master
+
Professional Information
+
Departments
+
Credentials
+
Schedules
+
Availability
+
Leave Integration
+
Appointment Integration
+
Shift Integration
+
RPA Synchronization
+
Notifications
+
Documents
+
Audit Logging
+
RBAC
+
Exception Handling
+
Automated Testing
```

The module must remain an **administrative doctor-management system** and must never become a clinical decision-making engine.