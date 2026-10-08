# 02 — APPOINTMENT MANAGEMENT

## 1. MODULE IDENTIFICATION

**File:** `02_APPOINTMENT_MANAGEMENT.md`

**Module Name:** Appointment Management

**System:** Hospital Administrative Automation & RPA Platform

**Architecture:** MERN + Robot Framework

**Frontend:** React.js

**Backend:** Node.js + Express.js

**Database:** MongoDB + Mongoose

**Automation:** Robot Framework

**API Style:** REST

**Primary Portals:**
- Patient Portal
- Operations Portal
- Clinical Portal
- Administration & Management Portal

**Primary Roles:**
- Patient
- Receptionist
- Doctor
- Administrative Manager
- System Admin

**Related Roles:**
- Nurse
- Billing Staff
- Insurance Representative
- Hospital Management

---

# 2. INSTRUCTION TO THE AI CODING AGENT

Implement the **Appointment Management module** as a complete production-style hospital appointment subsystem.

Do NOT implement this as a simple calendar or CRUD table.

The module must support the complete lifecycle of an appointment:

```text
Appointment Request
        ↓
Determine Appointment Source
        ↓
Determine Doctor / Specialty
        ↓
Check Doctor Availability
        ↓
Find Available Slot
        ↓
Patient Selects Slot
        ↓
Create Appointment
        ↓
Generate Appointment ID
        ↓
Immediate Confirmation
        ↓
SMS + Email
        ↓
Reminder Scheduling
        ↓
Patient Check-In / Cancellation / Rescheduling
        ↓
Appointment Completion / No-Show
```

The module must integrate with:

- Patient Registration
- Patient Records
- Doctor Management
- Doctor Schedule
- OPD Queue
- Notification Service
- Billing where applicable
- Audit Service
- RPA Job Management

The appointment system is responsible for **administrative scheduling**.

It must NOT make medical decisions.

---

# 3. CORE APPOINTMENT PRINCIPLES

The following rules are mandatory.

## Rule 1 — Appointment ≠ Visit

An appointment represents a planned future encounter.

A Visit represents the actual patient encounter.

Example:

```text
Patient ID:
P10045

Appointment:
A202610001

Visit:
V202610100
```

The system must not treat the appointment itself as proof that the patient arrived.

---

## Rule 2 — Appointment ≠ OPD Queue

An appointment is an expected booking.

The OPD queue is generated after actual patient check-in.

```text
Appointment
    ↓
Patient Arrives
    ↓
Check-In
    ↓
OPD Token
    ↓
OPD Queue
```

Appointment Management must not create an OPD token merely because an appointment exists.

---

## Rule 3 — RPA Does Not Make Clinical Decisions

RPA may:

- verify schedules
- create bookings
- synchronize external systems
- send reminders
- process cancellations
- process rescheduling
- detect configured conflicts
- update appointment statuses
- generate reports
- notify staff

RPA must NOT:

- diagnose
- determine medical priority
- decide which specialty a patient medically needs
- determine emergency status
- decide whether a patient requires admission
- override doctor availability rules without authorization.

---

# 4. APPOINTMENT REQUEST SOURCES

The system must support exactly these appointment-request sources.

## 4.1 Patient Selects Specialty

Example:

```text
Patient
  ↓
Select Specialty
  ↓
Select Doctor
  ↓
Select Date
  ↓
Select Available Slot
  ↓
Confirm
```

Example specialties may include:

- Cardiology
- Dermatology
- Orthopedics
- General Medicine

The actual list must come from the hospital's configured Department/Specialty data.

---

# 5. PATIENT SELECTS SPECIFIC DOCTOR

The patient may already know which doctor they want.

Flow:

```text
Patient
   ↓
Search Doctor
   ↓
View Doctor Profile
   ↓
View Availability
   ↓
Select Slot
   ↓
Confirm Appointment
```

Doctor availability must come from the Doctor Management / Schedule module.

Do not maintain a second independent doctor schedule inside Appointment Management.

---

# 6. EXISTING DOCTOR REFERRAL

An appointment may be requested because an existing doctor referred the patient.

Example:

```text
Dr. Patel
   ↓
Referral
   ↓
Radiology / Specialist / Follow-up
   ↓
Appointment Request
```

The system must record the referring doctor when applicable.

Recommended fields:

```text
referringDoctorId
referralReason
referralReference
```

The referral reason must be administrative/contextual unless entered by an authorized clinical user.

RPA must not generate a clinical referral reason.

---

# 7. PATIENT DOES NOT KNOW SPECIALTY

If a patient only provides symptoms and does not know which specialty they need:

```text
Patient
   ↓
"I don't know which specialty I need"
   ↓
Authorized Staff Review
   ↓
Specialty / Doctor Selected
   ↓
Appointment Booking
```

The basic appointment automation must NOT independently diagnose or recommend a specialty.

Provide a controlled workflow for staff assistance.

---

# 8. APPOINTMENT ENTITY

Create a dedicated MongoDB `Appointment` entity.

Recommended structure:

```text
Appointment {
    appointmentId,
    patientId,
    visitId,
    doctorId,
    departmentId,
    specialtyId,

    referringDoctorId,

    appointmentDate,
    startTime,
    endTime,

    appointmentType,
    source,

    status,

    bookingReference,

    reason,

    notes,

    cancellationReason,
    rescheduledFromAppointmentId,

    checkInStatus,

    reminderStatus,

    confirmationStatus,

    createdBy,
    updatedBy,

    createdAt,
    updatedAt
}
```

Do not duplicate complete patient or doctor profiles inside the Appointment document.

Use references.

---

# 9. APPOINTMENT ID

Appointment IDs must be generated server-side.

Example:

```text
A202610001
A202610002
A202610003
```

Requirements:

- unique
- immutable
- human-readable
- concurrency-safe
- configurable prefix
- never reused

Do not use MongoDB `_id` as the human-facing Appointment ID.

---

# 10. APPOINTMENT SOURCES

Recommended enum:

```text
PATIENT_PORTAL
FRONT_DESK
DOCTOR_REFERRAL
ADMINISTRATIVE_BOOKING
RPA
```

The actual permitted sources should be centrally configurable.

---

# 11. APPOINTMENT TYPES

The system should support configurable appointment types.

Example:

```text
NEW_CONSULTATION
FOLLOW_UP
REFERRED_CONSULTATION
DIAGNOSTIC
PROCEDURE
OTHER
```

Do not hardcode medical meanings into RPA.

---

# 12. APPOINTMENT STATUS

Use a controlled lifecycle.

Recommended statuses:

```text
REQUESTED
PENDING_REVIEW
SCHEDULED
CONFIRMED
CHECKED_IN
IN_PROGRESS
COMPLETED
CANCELLED
RESCHEDULED
NO_SHOW
EXPIRED
```

Typical lifecycle:

```text
REQUESTED
   ↓
SCHEDULED
   ↓
CONFIRMED
   ↓
CHECKED_IN
   ↓
IN_PROGRESS
   ↓
COMPLETED
```

Cancellation:

```text
CONFIRMED
   ↓
CANCELLED
```

Rescheduling:

```text
CONFIRMED
   ↓
RESCHEDULED
   ↓
NEW APPOINTMENT
```

No-show:

```text
CONFIRMED
   ↓
GRACE PERIOD
   ↓
NO_SHOW
```

The exact grace period must be configurable.

---

# 13. APPOINTMENT DATE AND TIME

Appointments must use the hospital's configured timezone.

Store timestamps consistently, preferably in UTC at the database level, while displaying them in hospital/user timezone.

Avoid using browser local time as the authoritative appointment time.

---

# 14. DOCTOR AVAILABILITY

Appointment Management must consume doctor availability from the Doctor Management module.

Conceptually:

```text
Doctor
   |
   +--- Department
   |
   +--- Schedule
   |
   +--- Availability
   |
   +--- Leave / Unavailability
   |
   +--- Appointments
```

The appointment service asks:

```text
Is Doctor X available on Date Y from Time A to Time B?
```

Doctor Management remains responsible for the source schedule.

---

# 15. SLOT GENERATION

Slots may be generated from:

- doctor working hours
- consultation duration
- break periods
- leave
- holidays
- hospital configuration
- maximum appointments per period
- appointment type rules

Example:

Doctor:

```text
09:00 - 12:00
Consultation duration: 30 minutes
```

Generated slots:

```text
09:00
09:30
10:00
10:30
11:00
11:30
```

Do not allow booking during:

- doctor leave
- blocked time
- break
- already occupied slot
- hospital closure period

---

# 16. DOUBLE-BOOKING PREVENTION

The backend must prevent two users from booking the same slot simultaneously.

This must not depend only on frontend availability.

Example race:

```text
Patient A sees 10:00 available
Patient B sees 10:00 available

Patient A → Book
Patient B → Book
```

Only one must succeed if the slot capacity is one.

Use:

- database constraints/indexes
- transactions where appropriate
- atomic reservation logic
- conflict detection

---

# 17. SLOT CAPACITY

Do not assume every appointment slot has capacity = 1.

Hospital configuration may permit:

```text
capacity = 1
```

or:

```text
capacity = 2
```

or another configured value.

Appointment booking must use the configured capacity.

Do not hardcode this value.

---

# 18. APPOINTMENT BOOKING FLOW

```text
Patient
   ↓
Select Specialty / Doctor
   ↓
Select Date
   ↓
Fetch Available Slots
   ↓
Select Slot
   ↓
Review Appointment
   ↓
Confirm Booking
   ↓
Backend Revalidates Slot
   ↓
Create Appointment
   ↓
Generate Appointment ID
   ↓
Confirmation
   ↓
Notification Service
   ↓
Schedule Reminder
```

The backend must recheck availability immediately before creating the appointment.

---

# 19. PATIENT ELIGIBILITY FOR BOOKING

Before booking:

1. Authenticate patient.
2. Resolve Patient ID.
3. Verify patient is active.
4. Verify doctor exists.
5. Verify specialty/department relationship.
6. Verify slot exists.
7. Verify slot capacity.
8. Verify doctor is available.
9. Verify no blocking appointment conflict if policy requires it.
10. Create appointment.

Do not trust doctor IDs or patient IDs supplied by unauthorized clients.

---

# 20. APPOINTMENT CONFIRMATION

Confirmation is immediate after successful booking.

Example:

```text
Appointment Confirmed

Appointment ID: A202610001
Patient ID: P10045

Doctor: Dr. Patel
Specialty: Cardiology

Date: 12 October 2026
Time: 10:30 AM

Status: CONFIRMED
```

The actual doctor/specialty/date/time must come from system data.

---

# 21. CONFIRMATION VS REMINDER

These are different events.

## Confirmation

Sent immediately after successful booking.

```text
Booking
 ↓
Confirmation
```

## Reminder

Sent later according to configured reminder rules.

```text
Booking
 ↓
Scheduled Reminder
 ↓
Reminder Time
 ↓
Reminder
```

Never treat confirmation as the reminder.

---

# 22. NOTIFICATION CHANNELS

The appointment module must integrate with the centralized Notification Service.

Supported channels:

```text
SMS
EMAIL
```

Potential future channels:

```text
PUSH
WHATSAPP
```

Do not implement independent SMS/email providers directly in this module.

---

# 23. CONFIRMATION EVENT

Publish:

```text
appointment.confirmed
```

Payload example:

```json
{
  "appointmentId": "A202610001",
  "patientId": "P10045",
  "doctorId": "DOC1001",
  "appointmentDate": "2026-10-12",
  "startTime": "10:30"
}
```

The Notification Service handles actual delivery.

---

# 24. REMINDER CONFIGURATION

Reminder timing must be configurable.

Example default:

```text
24 hours before appointment
```

Optional additional reminder:

```text
2 hours before appointment
```

Do not hardcode these values into frontend components.

Configuration may be:

```text
appointmentReminderEnabled
primaryReminderHours
secondaryReminderEnabled
secondaryReminderHours
```

---

# 25. REMINDER DELIVERY

Track:

```text
scheduled
queued
sent
delivered
failed
cancelled
```

A failed reminder must NOT automatically cancel an appointment.

---

# 26. DUPLICATE REMINDER PREVENTION

The system must prevent duplicate reminder delivery for the same configured reminder event.

Example:

```text
Appointment A202610001
24-hour reminder
```

must not generate five identical SMS messages because a worker was retried.

Use an idempotency key such as:

```text
APPOINTMENT_REMINDER:A202610001:24H
```

---

# 27. PATIENT REMINDER RESPONSE

A reminder may contain an action such as:

```text
I'm Arrived
```

or:

```text
View Appointment
```

The appointment module should expose the appointment reference required by the OPD Queue module.

The reminder itself must not create an OPD token.

---

# 28. CANCELLATION

Patient or authorized staff may cancel an appointment according to hospital policy.

Flow:

```text
Existing Appointment
      ↓
Cancellation Request
      ↓
Authorization
      ↓
Validate Status
      ↓
Record Cancellation Reason
      ↓
Change Status = CANCELLED
      ↓
Release Slot Capacity
      ↓
Cancel Pending Reminders
      ↓
Notify Patient
      ↓
Audit
```

---

# 29. CANCELLATION RULES

An appointment cannot normally be cancelled after:

```text
COMPLETED
```

or potentially:

```text
IN_PROGRESS
```

unless an authorized staff workflow explicitly allows it.

The allowed cancellation statuses must be configurable.

---

# 30. CANCELLATION REASON

Require a reason where hospital policy requires one.

Examples:

```text
PATIENT_REQUEST
DOCTOR_UNAVAILABLE
HOSPITAL_CANCELLATION
DUPLICATE_BOOKING
OTHER
```

If `OTHER` is selected, require a description.

---

# 31. SLOT RELEASE

When an appointment is cancelled:

```text
Booked Capacity
      ↓
Decrement
      ↓
Slot Available
```

The system must not delete the appointment.

The appointment remains in history with:

```text
status = CANCELLED
```

This is important for audit and reporting.

---

# 32. RESCHEDULING

Rescheduling must preserve appointment history.

Do NOT simply overwrite the original date/time.

Correct flow:

```text
Original Appointment
A202610001
     |
     v
RESCHEDULE REQUEST
     |
     v
Find New Slot
     |
     v
Create New Appointment
A202610055
     |
     v
Original = RESCHEDULED
     |
     v
New Appointment = CONFIRMED
```

Store:

```text
rescheduledFromAppointmentId
```

---

# 33. RESCHEDULING HISTORY

Example:

```text
A202610001
10 Oct, 10:00
        ↓
RESCHEDULED

A202610055
12 Oct, 11:30
        ↓
CONFIRMED
```

Do not lose the original booking history.

---

# 34. RESCHEDULING NOTIFICATIONS

After successful rescheduling:

1. Mark old appointment `RESCHEDULED`.
2. Create new appointment.
3. Cancel old reminders.
4. Create new reminders.
5. Send new confirmation.
6. Optionally send rescheduling notification.
7. Record audit event.

Avoid duplicate messages.

---

# 35. DOCTOR UNAVAILABILITY

If a doctor becomes unavailable after appointments have already been booked:

```text
Doctor Unavailable
      ↓
Find affected appointments
      ↓
Apply hospital policy
      ↓
Notify affected patients
      ↓
Staff Review where needed
      ↓
Reschedule / Cancel
```

RPA can automate repetitive notification and rescheduling preparation.

It must not automatically substitute another doctor unless hospital policy explicitly authorizes that rule.

---

# 36. DOCTOR LEAVE

Doctor leave must be consumed from Doctor/Staff scheduling data.

Appointment Management should detect:

```text
Doctor Leave
       ↓
No new booking
```

For existing appointments:

```text
Affected appointments
       ↓
Exception / staff action
       ↓
Reschedule / cancel according to policy
```

---

# 37. APPOINTMENT CONFLICTS

Detect:

- same doctor/time conflict
- doctor leave conflict
- blocked slot
- department closure
- duplicate patient appointment where policy prohibits it
- incompatible appointment type
- invalid referral
- missing doctor availability

Do not silently override conflicts.

---

# 38. PATIENT DUPLICATE APPOINTMENT

Example:

Patient already has:

```text
Cardiology
12 Oct
10:00
```

Patient attempts another appointment:

```text
Cardiology
12 Oct
10:00
```

System should detect potential duplicate.

Depending on configured hospital policy:

```text
Reject
or
Require staff confirmation
```

Do not invent a medical reason.

---

# 39. APPOINTMENT SEARCH

Authorized users should be able to search by:

```text
Appointment ID
Patient ID
Patient name
Doctor
Department
Date
Status
```

Receptionist should be able to search appointments needed for operational work.

Patients should only see their own appointments.

---

# 40. PATIENT APPOINTMENT PAGE

Recommended route:

```text
/patient/appointments
```

Features:

- Upcoming appointments
- Past appointments
- Appointment details
- Cancel
- Reschedule
- View confirmation
- View doctor information
- View location/room where configured
- Check-in action when eligible

---

# 41. BOOK APPOINTMENT PAGE

Recommended route:

```text
/patient/appointments/book
```

UI flow:

```text
1. Select Specialty
2. Select Doctor
3. Select Date
4. Select Slot
5. Enter/confirm appointment information
6. Review
7. Confirm
```

If the patient starts from a specific doctor:

```text
Doctor
 ↓
Availability
 ↓
Date
 ↓
Slot
```

---

# 42. STAFF APPOINTMENT DASHBOARD

Recommended route:

```text
/operations/appointments
```

Dashboard should provide:

```text
Today's Appointments
Upcoming
Pending Requests
Cancelled
Rescheduled
No Shows
Doctor Availability
```

Filters:

```text
Date
Department
Doctor
Status
Patient
Appointment Type
```

---

# 43. DOCTOR VIEW

Recommended route:

```text
/clinical/appointments
```

Doctor can view:

- today's schedule
- upcoming appointments
- appointment details permitted by role
- patient identity information
- referral information where authorized

The doctor should not need to access administrative features unrelated to clinical work.

---

# 44. ADMINISTRATIVE APPOINTMENT VIEW

Administrative Manager may view:

- appointment volumes
- cancellations
- no-shows
- utilization
- doctor schedule utilization
- operational metrics

This is subject to role permissions.

---

# 45. OPD CHECK-IN INTEGRATION

Appointment Management exposes appointment information to OPD Queue Management.

When patient checks in:

```text
Appointment
     ↓
Check-In
     ↓
OPD Queue
```

The OPD module may update:

```text
appointment.checkInStatus = CHECKED_IN
```

Appointment Management should not independently generate the OPD token.

---

# 46. CHECK-IN STATUS

Recommended:

```text
NOT_CHECKED_IN
CHECKED_IN
LATE
NO_SHOW
```

The exact transition may be owned by OPD Queue Management.

Appointment Management stores the resulting administrative status.

---

# 47. NO-SHOW POLICY

The system must NOT immediately mark a patient as `NO_SHOW` simply because the reminder was not answered.

Important:

> No response to a reminder does not mean the patient is absent.

Correct process:

```text
Appointment Time
      ↓
Configured Grace Period
      ↓
Check whether patient checked in
      ↓
YES → CHECKED_IN
NO  → Apply No-Show Policy
```

---

# 48. GRACE PERIOD

Example:

```text
Appointment:
10:00 AM

Grace period:
15 minutes
```

At 10:05:

```text
NOT NO-SHOW
```

At 10:20:

```text
Eligible for NO_SHOW processing
```

The actual value must be configurable.

---

# 49. NO-SHOW AUTOMATION

RPA can:

- identify appointments eligible for no-show processing
- verify check-in state
- update appointment according to configured policy
- release slot
- notify patient
- generate operational reports

RPA must not make clinical priority decisions.

---

# 50. PATIENT REBOOKING AFTER NO-SHOW

Patient may rebook according to hospital policy.

The old appointment remains:

```text
NO_SHOW
```

A new appointment is created.

Never overwrite the historical appointment.

---

# 51. FRONT DESK BOOKING

Receptionist workflow:

```text
Search Patient
      ↓
Select Patient
      ↓
Select Specialty / Doctor
      ↓
Select Date
      ↓
Select Slot
      ↓
Confirm
      ↓
Appointment Created
      ↓
SMS + Email
```

Patient ID must come from the authenticated/selected patient record.

---

# 52. DOCTOR REFERRAL BOOKING

Authorized staff or doctor:

```text
Patient
   ↓
Referring Doctor
   ↓
Requested Specialty / Doctor
   ↓
Available Slot
   ↓
Appointment
```

Store the referral relationship.

---

# 53. APPOINTMENT NOTES

Appointment notes should be carefully scoped.

Do not turn appointment notes into an unrestricted clinical record.

Administrative notes may include:

- scheduling instructions
- patient-requested timing
- referral reference
- operational notes

Clinical notes belong in the Patient Records/Clinical module.

---

# 54. PAYMENT REQUIREMENTS

Do not automatically introduce payment requirements for every appointment.

If hospital configuration supports:

- consultation fee
- booking fee
- advance payment

then Appointment Management may create a payment request through the Billing/Payment system.

Do not duplicate payment processing logic.

The actual payment gateway belongs to the Billing/Payment integration.

---

# 55. INSURANCE

Appointment Management may reference insurance information if needed for scheduling workflows.

It must not decide insurance eligibility or coverage.

Insurance verification belongs to:

```text
09_INSURANCE_VERIFICATION.md
```

---

# 56. DOCUMENTS

Possible appointment documents:

- appointment confirmation
- rescheduling confirmation
- cancellation confirmation

Generate documents through the centralized Document Generation module.

Do not implement a second PDF generation system.

---

# 57. NOTIFICATION TEMPLATES

Recommended template identifiers:

```text
APPOINTMENT_BOOKED_SMS
APPOINTMENT_BOOKED_EMAIL

APPOINTMENT_REMINDER_SMS
APPOINTMENT_REMINDER_EMAIL

APPOINTMENT_CANCELLED_SMS
APPOINTMENT_CANCELLED_EMAIL

APPOINTMENT_RESCHEDULED_SMS
APPOINTMENT_RESCHEDULED_EMAIL

APPOINTMENT_NO_SHOW_SMS
APPOINTMENT_NO_SHOW_EMAIL
```

Templates must be configurable.

---

# 58. MONGODB INDEXES

Create appropriate indexes.

Recommended:

```text
appointmentId: unique

patientId + appointmentDate
doctorId + appointmentDate
doctorId + appointmentDate + startTime
status + appointmentDate
departmentId + appointmentDate
```

Use compound indexes according to actual query patterns.

Do not create excessive indexes without considering write performance.

---

# 59. APPOINTMENT HISTORY

Create a separate history entity or event mechanism.

Recommended:

```text
AppointmentHistory {
    appointmentId,
    action,
    previousStatus,
    newStatus,
    previousDate,
    newDate,
    previousDoctorId,
    newDoctorId,
    reason,
    actorUserId,
    actorRole,
    correlationId,
    createdAt
}
```

Examples:

```text
CREATED
CONFIRMED
CANCELLED
RESCHEDULED
CHECKED_IN
NO_SHOW
COMPLETED
```

---

# 60. APPOINTMENT API

Base:

```text
/api/v1/appointments
```

Required endpoints:

```text
POST   /appointments
GET    /appointments/:appointmentId
GET    /appointments
PATCH  /appointments/:appointmentId
POST   /appointments/:appointmentId/cancel
POST   /appointments/:appointmentId/reschedule
POST   /appointments/:appointmentId/confirm
GET    /appointments/:appointmentId/history
```

---

# 61. AVAILABLE SLOT API

Recommended:

```http
GET /api/v1/appointments/available-slots
```

Parameters:

```text
doctorId
departmentId
specialtyId
date
appointmentType
```

Response:

```json
{
  "success": true,
  "data": {
    "date": "2026-10-12",
    "doctorId": "DOC1001",
    "slots": [
      {
        "startTime": "10:00",
        "endTime": "10:30",
        "available": true
      },
      {
        "startTime": "10:30",
        "endTime": "11:00",
        "available": true
      }
    ]
  }
}
```

The backend must generate this using actual schedule data.

---

# 62. CREATE APPOINTMENT API

```http
POST /api/v1/appointments
```

Example:

```json
{
  "patientId": "P10045",
  "doctorId": "DOC1001",
  "departmentId": "DEP001",
  "appointmentDate": "2026-10-12",
  "startTime": "10:30",
  "appointmentType": "NEW_CONSULTATION",
  "source": "PATIENT_PORTAL"
}
```

The backend must:

1. authenticate user
2. authorize action
3. validate patient
4. validate doctor
5. validate department
6. validate date
7. validate slot
8. check availability again
9. check conflicts
10. create appointment
11. create history
12. publish confirmation event
13. schedule reminders
14. return appointment ID

---

# 63. CANCEL API

```http
POST /api/v1/appointments/:appointmentId/cancel
```

Body:

```json
{
  "reason": "PATIENT_REQUEST"
}
```

Backend must:

- verify permission
- verify appointment status
- record reason
- update status
- release slot
- cancel pending reminders
- publish notification event
- audit action

---

# 64. RESCHEDULE API

```http
POST /api/v1/appointments/:appointmentId/reschedule
```

Body:

```json
{
  "newDate": "2026-10-15",
  "newStartTime": "11:00"
}
```

Backend:

```text
Validate Original
      ↓
Validate New Slot
      ↓
Create New Appointment
      ↓
Mark Original RESCHEDULED
      ↓
Link Records
      ↓
Move Reminders
      ↓
Notify
```

---

# 65. RBAC

## Patient

Can:

- view own appointments
- book appointments
- cancel own eligible appointments
- reschedule own eligible appointments
- view confirmation
- receive reminders
- check appointment status

Cannot:

- view another patient's appointments
- modify doctor schedules
- modify hospital configuration
- change appointment history

---

## Receptionist

Can:

- create appointments
- search appointments
- cancel according to permission
- reschedule
- view operational appointment data
- assist patients

Cannot:

- modify doctor schedules without appropriate permission
- make clinical priority decisions

---

## Doctor

Can:

- view own appointments
- view relevant patient appointment information
- create authorized referral appointments
- manage authorized schedule exceptions where applicable

Cannot:

- modify unrelated doctors' schedules unless authorized.

---

## Administrative Manager

Can:

- view appointment analytics
- configure operational appointment settings where authorized
- manage scheduling policies
- handle escalated appointment issues

---

## System Admin

Can manage technical configuration.

System Admin access must still follow least privilege for patient information.

---

# 66. AUDIT EVENTS

Log:

```text
APPOINTMENT_CREATED
APPOINTMENT_VIEWED
APPOINTMENT_UPDATED
APPOINTMENT_CONFIRMED
APPOINTMENT_CANCELLED
APPOINTMENT_RESCHEDULED
APPOINTMENT_CHECKED_IN
APPOINTMENT_NO_SHOW
APPOINTMENT_COMPLETED
SLOT_RESERVED
SLOT_RELEASED
REMINDER_SCHEDULED
REMINDER_CANCELLED
```

Audit record:

```text
auditEventId
actorUserId
actorRole
action
entityType
entityId
timestamp
correlationId
before
after
reason
result
```

---

# 67. CORRELATION ID

Each appointment transaction must carry a correlation ID.

Example:

```text
CORR-APT-20261006-000001
```

Use it across:

```text
Appointment
AppointmentHistory
Notification
RPAJob
AuditEvent
ExceptionCase
```

---

# 68. EXCEPTION CASES

Possible exception types:

```text
SLOT_CONFLICT
DOCTOR_UNAVAILABLE
PATIENT_IDENTITY_ERROR
DUPLICATE_APPOINTMENT
EXTERNAL_SYSTEM_FAILURE
NOTIFICATION_FAILURE
RESCHEDULE_FAILURE
NO_SHOW_PROCESSING_FAILURE
```

High-risk ambiguity should enter an exception queue rather than being silently resolved.

---

# 69. RPA ARCHITECTURE

Robot Framework should use:

```text
robot/
├── resources/
│   ├── appointment_keywords.resource
│   ├── doctor_schedule_keywords.resource
│   ├── notification_keywords.resource
│   ├── api_keywords.resource
│   └── authentication.resource
│
├── keywords/
│   ├── appointment_booking.resource
│   ├── appointment_cancellation.resource
│   ├── appointment_rescheduling.resource
│   ├── appointment_reminders.resource
│   └── appointment_no_show.resource
│
├── tests/
│   ├── appointment_booking.robot
│   ├── cancellation.robot
│   ├── rescheduling.robot
│   ├── reminders.robot
│   └── no_show.robot
│
└── results/
```

---

# 70. RPA BOOKING FLOW

When an external/legacy system must also receive an appointment:

```text
MERN Appointment Created
        ↓
RPA Job Created
        ↓
Read Appointment
        ↓
Validate
        ↓
Login Legacy System
        ↓
Search Patient
        ↓
Enter Appointment
        ↓
Submit
        ↓
Verify Success
        ↓
Capture External Appointment Reference
        ↓
Update MERN
        ↓
Audit
```

If the external system has a reliable API, prefer API integration instead of browser automation.

---

# 71. RPA FAILURE

Example:

```text
MERN Appointment:
CONFIRMED

Legacy System:
FAILED
```

Do NOT cancel the MERN appointment automatically.

Create:

```text
ExceptionCase
type = APPOINTMENT_EXTERNAL_SYNC_FAILURE
```

Retry according to configured retry policy.

If human intervention is required:

```text
Exception Queue
   ↓
Staff Review
   ↓
Retry / Resolve
```

---

# 72. RPA VERIFICATION

Never assume that clicking "Save" means the appointment was successfully created.

Verify using:

- success message
- external appointment reference
- API response
- record lookup
- status verification

Then update the RPA execution record.

---

# 73. RPA JOB ENTITY

Use the global `RPAJob` / `RPAExecution` entities.

Recommended information:

```text
jobId
jobType
correlationId
entityType
entityId
status
startedAt
completedAt
retryCount
externalReference
errorCode
errorMessage
screenshotPath
```

---

# 74. SECURITY FOR RPA

Robot Framework credentials must be stored securely.

Never:

```text
hardcode usernames
hardcode passwords
commit secrets
store insurer/legacy credentials in Git
```

Use environment variables or a secrets manager.

---

# 75. FRONTEND COMPONENTS

Recommended components:

```text
AppointmentBookingForm
SpecialtySelector
DoctorSelector
DoctorAvailability
DateSelector
SlotSelector
AppointmentReview
AppointmentConfirmation
AppointmentList
AppointmentCard
AppointmentDetails
CancelAppointmentDialog
RescheduleAppointmentDialog
AppointmentFilters
AppointmentStatusBadge
AppointmentHistory
DoctorScheduleSummary
```

---

# 76. APPOINTMENT CARD

Example:

```text
--------------------------------------
Cardiology
Dr. Patel

12 Oct 2026
10:30 AM

Appointment ID: A202610001

Status: Confirmed

[View]
[Reschedule]
[Cancel]
--------------------------------------
```

Actions depend on status and user role.

---

# 77. MOBILE PATIENT EXPERIENCE

Patient booking must be usable on mobile.

Prioritize:

- large touch targets
- simple date selection
- clear time slots
- minimal typing
- readable confirmation
- easy cancellation/rescheduling

---

# 78. API VALIDATION

Use a backend validation library consistent with the project.

Validate:

- patient ID
- doctor ID
- department ID
- date
- time
- appointment type
- source
- referral
- reason where required

Reject unknown fields where appropriate.

---

# 79. TIMEZONE AND DST

All appointment date/time calculations must use a consistent timezone strategy.

Store canonical timestamps.

Convert only at presentation boundaries.

Do not compare raw strings such as:

```text
"10:00 AM"
```

for scheduling logic.

Use proper date/time representations.

---

# 80. APPOINTMENT HISTORY MUST BE IMMUTABLE

Users must not be able to edit historical appointment events.

If an appointment changes:

```text
Create new history event
```

Do not rewrite historical audit data.

---

# 81. REPORTING DATA

The module must expose data needed for:

- daily appointment count
- completed appointments
- cancelled appointments
- rescheduled appointments
- no-shows
- doctor utilization
- department utilization
- slot utilization
- reminder delivery
- booking source

The Reports & Analytics module will consume this data.

---

# 82. PERFORMANCE REQUIREMENTS

The appointment search/list API must support pagination.

Example:

```text
?page=1&limit=25
```

Do not return thousands of appointments in one response.

Available slot queries should be optimized for common date ranges.

---

# 83. ERROR HANDLING

Example:

```json
{
  "success": false,
  "error": {
    "code": "APPOINTMENT_SLOT_UNAVAILABLE",
    "message": "The selected appointment slot is no longer available.",
    "correlationId": "CORR-APT-20261006-000001"
  }
}
```

Frontend should show a user-friendly message:

```text
This slot is no longer available.
Please select another time.
```

Do not expose backend stack traces.

---

# 84. IDEMPOTENCY

Appointment creation must protect against duplicate submissions.

Example:

```text
Patient clicks Book
↓
Network delay
↓
Patient clicks Book again
```

The system must not create two identical appointments accidentally.

Use:

```text
Idempotency-Key
```

or an equivalent server-side mechanism.

---

# 85. TRANSACTIONAL BOOKING

Slot reservation and appointment creation must be concurrency-safe.

Conceptually:

```text
Check Capacity
      ↓
Reserve Capacity
      ↓
Create Appointment
      ↓
Commit
```

If appointment creation fails:

```text
Release Reservation
```

Do not leave a phantom unavailable slot.

---

# 86. NOTIFICATION FAILURE IS NON-BLOCKING

If appointment booking succeeds but SMS fails:

```text
Appointment = CONFIRMED
SMS = FAILED
```

Do not roll back the appointment merely because the notification failed.

The Notification Service handles retries.

---

# 87. SEED DATA

Create realistic demo data.

Example doctors:

```text
DOC1001 — Dr. Mehta — Cardiology
DOC1002 — Dr. Patel — General Medicine
DOC1003 — Dr. Shah — Dermatology
DOC1004 — Dr. Desai — Orthopedics
```

Create schedules:

```text
DOC1001
Monday
09:00–12:00
14:00–17:00
```

Create existing appointments with different statuses:

```text
CONFIRMED
COMPLETED
CANCELLED
RESCHEDULED
NO_SHOW
```

Create test patients from the Patient Registration seed data.

---

# 88. DEMO SCENARIO — NORMAL BOOKING

Patient:

```text
P10045
```

Requests:

```text
Specialty: Cardiology
Doctor: Dr. Mehta
Date: 12-Oct-2026
Time: 10:30 AM
```

System:

```text
Check doctor availability
        ↓
Check slot capacity
        ↓
Create:
A202610001
        ↓
Status:
CONFIRMED
        ↓
Send SMS + Email
        ↓
Schedule 24-hour reminder
```

---

# 89. DEMO SCENARIO — SLOT TAKEN

Patient selects:

```text
10:30 AM
```

Another patient books it before the first request completes.

Expected:

```text
APPOINTMENT_SLOT_UNAVAILABLE
```

Frontend:

```text
The selected slot is no longer available.
Please choose another time.
```

Do not create a duplicate booking.

---

# 90. DEMO SCENARIO — CANCELLATION

Existing:

```text
A202610001
CONFIRMED
```

Patient cancels.

Expected:

```text
A202610001
CANCELLED
```

Then:

```text
Slot capacity released
Pending reminder cancelled
Cancellation notification sent
History created
Audit created
```

---

# 91. DEMO SCENARIO — RESCHEDULING

Existing:

```text
A202610001
10 Oct 10:00
```

Patient requests:

```text
12 Oct 11:30
```

Expected:

```text
A202610001 → RESCHEDULED

A202610055 → CONFIRMED

rescheduledFromAppointmentId:
A202610001
```

Old reminders are cancelled.

New reminders are scheduled.

---

# 92. DEMO SCENARIO — DOCTOR UNAVAILABLE

Doctor's approved leave overlaps with an existing appointment.

System:

```text
Detect affected appointments
        ↓
Create operational task/exception
        ↓
Notify staff
        ↓
Notify patient according to policy
```

Do not silently move the patient to a different doctor.

---

# 93. DEMO SCENARIO — NO-SHOW

Appointment:

```text
10:00 AM
```

Patient does not check in.

Grace period:

```text
15 minutes
```

At 10:05:

```text
Still active
```

After 10:15:

```text
Eligible for no-show processing
```

RPA verifies no check-in and applies configured policy.

Expected:

```text
Appointment = NO_SHOW
```

Then:

```text
Slot released
Patient notification
Audit
Report update
```

---

# 94. TESTING REQUIREMENTS

## Unit Tests

Test:

- slot generation
- appointment ID generation
- conflict detection
- availability checking
- cancellation rules
- rescheduling
- reminder calculation
- no-show eligibility
- permission checks

---

# 95. API TESTS

Test:

```text
POST /appointments
GET /appointments
GET /appointments/:id
GET /appointments/available-slots
POST /appointments/:id/cancel
POST /appointments/:id/reschedule
GET /appointments/:id/history
```

Test both authorized and unauthorized users.

---

# 96. INTEGRATION TESTS

Verify:

```text
Patient → Appointment
Doctor → Appointment
Schedule → Appointment
Appointment → Notification
Appointment → OPD Queue
Appointment → Audit
Appointment → RPA
```

---

# 97. ROBOT FRAMEWORK TEST CASES

At minimum:

```text
TC-APT-001 Book appointment by specialty
TC-APT-002 Book appointment with specific doctor
TC-APT-003 Book referred appointment
TC-APT-004 Prevent double booking
TC-APT-005 Cancel appointment
TC-APT-006 Reschedule appointment
TC-APT-007 Schedule reminder
TC-APT-008 Prevent duplicate reminder
TC-APT-009 Process no-show
TC-APT-010 Doctor unavailable handling
TC-APT-011 External system synchronization
TC-APT-012 External synchronization failure
TC-APT-013 Unauthorized booking attempt
TC-APT-014 Patient sees only own appointments
```

---

# 98. SECURITY TESTS

Verify:

- patient cannot access another patient's appointment
- receptionist cannot modify unauthorized schedules
- doctor cannot access unrelated administrative functions
- appointment APIs require authentication
- role authorization is enforced server-side
- historical appointment data cannot be altered
- secrets are not exposed
- sensitive data is not returned unnecessarily

---

# 99. ACCEPTANCE CRITERIA

The module is accepted only when:

## Booking

- Patient can book an appointment.
- Receptionist can book an appointment.
- Doctor referral appointments are supported.
- Specialty selection works.
- Doctor selection works.
- Available slots are accurate.
- Slot capacity is respected.
- Double booking is prevented.
- Appointment ID is generated correctly.

## Confirmation

- Confirmation is generated immediately.
- SMS event is created.
- Email event is created.
- Notification failure does not cancel appointment.

## Reminder

- Reminder timing is configurable.
- Reminders are scheduled.
- Duplicate reminders are prevented.
- Failed reminders are retried according to notification policy.

## Cancellation

- Eligible appointments can be cancelled.
- Reason is recorded.
- Slot is released.
- Reminder is cancelled.
- Notification is sent.
- History is preserved.

## Rescheduling

- New slot is validated.
- New appointment is created.
- Original appointment becomes RESCHEDULED.
- History is preserved.
- Old reminders are cancelled.
- New reminders are scheduled.
- Confirmation is sent.

## No-Show

- No response to reminder does not immediately create NO_SHOW.
- Configured grace period is respected.
- Check-in state is verified.
- No-show processing is auditable.

## RPA

- RPA can automate approved administrative appointment tasks.
- RPA verifies external-system actions.
- External failures create exceptions.
- RPA does not make clinical decisions.

---

# 100. DEFINITION OF DONE

Do not consider the Appointment Management module complete until all of the following exist:

```text
React UI
+
Appointment APIs
+
MongoDB Models
+
Doctor Schedule Integration
+
Slot Availability
+
Concurrency Protection
+
Booking
+
Cancellation
+
Rescheduling
+
Reminder Scheduling
+
Notification Integration
+
No-Show Processing
+
RBAC
+
Audit Logging
+
Exception Handling
+
RPA Integration
+
Robot Framework Tests
+
Unit Tests
+
Integration Tests
+
Seed Data
+
End-to-End Tests
```

---

# 101. IMPLEMENTATION ORDER

The AI coding agent should implement in this exact order.

### Step 1
Create/update:

```text
Appointment
AppointmentHistory
```

### Step 2
Implement appointment ID generation.

### Step 3
Implement availability service integration.

### Step 4
Implement slot generation.

### Step 5
Implement concurrency-safe booking.

### Step 6
Implement appointment creation API.

### Step 7
Implement appointment search/details.

### Step 8
Implement cancellation.

### Step 9
Implement rescheduling.

### Step 10
Implement confirmation event.

### Step 11
Integrate Notification Service.

### Step 12
Implement configurable reminder scheduling.

### Step 13
Implement no-show processing.

### Step 14
Implement Patient Portal UI.

### Step 15
Implement Receptionist/Operations UI.

### Step 16
Implement Doctor appointment view.

### Step 17
Implement RBAC.

### Step 18
Implement audit logging.

### Step 19
Implement exception handling.

### Step 20
Implement RPA workflows.

### Step 21
Implement Robot Framework tests.

### Step 22
Implement unit/integration/API tests.

### Step 23
Add seed data.

### Step 24
Run complete end-to-end tests.

---

# 102. DO NOT IMPLEMENT

Do not implement the following inside this module:

- clinical diagnosis
- medical triage
- medical priority decisions
- treatment decisions
- admission decisions
- discharge decisions
- OPD token generation
- bed allocation
- insurance approval
- billing calculation
- medication decisions
- lab result interpretation
- radiology interpretation

Use the appropriate module/service interfaces instead.

---

# 103. FINAL ARCHITECTURAL RULE

The appointment subsystem must maintain the following separation:

```text
PATIENT
Permanent identity
       |
       v
APPOINTMENT
Planned encounter
       |
       v
CHECK-IN
Actual arrival
       |
       v
OPD QUEUE
Actual operational queue
       |
       v
VISIT
Actual encounter
```

Do not collapse these concepts into one database record.

The appointment system must remain the authoritative source for **appointment scheduling and appointment lifecycle**, while integrating with Patient Registration, Doctor Management, OPD Queue, Notification, Billing, Audit and RPA services through clean APIs/events.

> **An appointment means "the patient is scheduled to come." It does not mean "the patient has arrived," "the patient is in the queue," or "the patient has received medical care."**