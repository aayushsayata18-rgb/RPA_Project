# 03 — OPD QUEUE MANAGEMENT

## 1. MODULE IDENTIFICATION

**File:** `03_OPD_QUEUE_MANAGEMENT.md`

**Module Name:** OPD Queue Management

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

**Primary Roles:**
- Patient
- Receptionist
- Doctor
- Nurse
- Administrative Manager
- System Admin

**Related Roles:**
- Billing Staff
- Hospital Management

---

# 2. INSTRUCTION TO THE AI CODING AGENT

Implement the **OPD Queue Management module** as a production-ready hospital queue-management subsystem.

Do NOT implement this as a simple list of appointments.

The system must distinguish:

```text
Appointment
    =
Expected / planned visit

Check-In
    =
Patient has actually arrived

OPD Token
    =
Patient's queue position

OPD Queue
    =
Operational sequence of patients waiting for service
```

The module must support exactly two patient check-in channels:

1. **Online Self Check-in**
2. **Front Desk Check-in**

Do NOT implement QR check-in in this module.

The module must integrate with:

- Patient Registration
- Appointment Management
- Patient Records
- Doctor Management
- Clinical Portal
- Notification Service
- RPA Job Management
- Audit Service
- Reports & Analytics

The queue system must be the authoritative source for **actual OPD arrival and queue state**.

---

# 3. CORE PRINCIPLE

The most important rule is:

> **An appointment does not automatically place a patient into the OPD queue.**

Correct flow:

```text
Appointment
    ↓
Appointment Time Approaches
    ↓
Patient Arrives
    ↓
Check-In
    ↓
OPD Token Generated
    ↓
Patient Added To Queue
```

Therefore:

```text
Appointment exists
≠
Patient has arrived
```

---

# 4. CHECK-IN CHANNELS

Exactly two check-in channels are supported.

## 4.1 Online Self Check-in

Patient receives an appointment-related SMS/email.

Near the appointment time, the patient can use:

```text
I'm Arrived
```

The patient is then taken through an authenticated check-in workflow.

---

## 4.2 Front Desk Check-in

Patient arrives physically at the hospital.

Receptionist:

```text
Search Appointment
       ↓
Verify Patient
       ↓
Click Check In
       ↓
System Generates OPD Token
       ↓
Patient Added To Queue
```

---

# 5. QR CHECK-IN

QR-based check-in is explicitly **out of scope** for this version.

Do NOT implement:

- QR token generation
- QR scanning
- QR kiosk check-in
- QR-based queue registration

The architecture should remain extensible enough to support it later, but it must not be built now.

---

# 6. RELATIONSHIP BETWEEN APPOINTMENT AND QUEUE

Example:

```text
Patient:
P10045

Appointment:
A202610001

Appointment Status:
CONFIRMED
```

Patient has not arrived:

```text
Queue:
NO
```

After check-in:

```text
Appointment:
CHECKED_IN

OPD Token:
T-102

Queue:
ACTIVE
```

The same patient identity and appointment remain linked.

---

# 7. OPD TOKEN

Every successful OPD check-in must generate an OPD token according to hospital configuration.

Example:

```text
OPD Token: C-102
```

The token must be unique within the applicable queue/date/context.

Do not use the Appointment ID as the OPD Token.

Example:

```text
Appointment:
A202610001

OPD Token:
C-102
```

These are separate identifiers.

---

# 8. TOKEN GENERATION

Token generation must be server-side.

Possible configuration:

```text
Department:
General Medicine

Prefix:
GM

Date:
2026-10-06

Sequence:
102
```

Result:

```text
GM-102
```

The actual token format must be configurable.

Do not hardcode a single prefix such as `A`.

---

# 9. TOKEN UNIQUENESS

The system must prevent duplicate token generation under concurrent check-ins.

Example:

```text
Receptionist A → Check In
Receptionist B → Check In
```

Both must not receive:

```text
GM-102
```

Use:

- atomic counters
- transaction-safe sequence generation
- unique indexes
- idempotency
- queue context

---

# 10. QUEUE CONTEXT

A token should belong to a defined queue context.

Recommended context:

```text
hospitalId
departmentId
doctorId
queueDate
queueType
```

Depending on hospital configuration, the queue may be:

```text
Doctor-specific
Department-specific
Clinic-specific
General OPD
```

Do not assume all hospitals use only one queue model.

The configuration must determine the queue context.

---

# 11. QUEUE ENTITY

Create a dedicated queue entity.

Recommended:

```text
OPDQueue {
    queueId,
    queueDate,
    departmentId,
    doctorId,
    queueType,

    status,

    currentToken,
    totalCheckedIn,
    totalCompleted,

    openedAt,
    closedAt,

    createdAt,
    updatedAt
}
```

Possible statuses:

```text
OPEN
PAUSED
CLOSED
```

---

# 12. OPD TOKEN ENTITY

Create a separate `OPDToken` entity.

Recommended:

```text
OPDToken {
    tokenId,
    tokenNumber,

    patientId,
    appointmentId,
    visitId,

    queueId,
    doctorId,
    departmentId,

    checkInChannel,

    checkInTime,
    expectedAppointmentTime,

    status,

    priorityType,
    priorityReason,

    calledAt,
    serviceStartedAt,
    completedAt,

    skippedAt,
    cancelledAt,

    createdAt,
    updatedAt
}
```

---

# 13. TOKEN STATUS

Recommended statuses:

```text
WAITING
CALLED
IN_SERVICE
COMPLETED
SKIPPED
CANCELLED
NO_SHOW
TRANSFERRED
```

Normal lifecycle:

```text
WAITING
   ↓
CALLED
   ↓
IN_SERVICE
   ↓
COMPLETED
```

Skipped:

```text
WAITING
   ↓
SKIPPED
```

Cancelled:

```text
WAITING
   ↓
CANCELLED
```

---

# 14. CHECK-IN STATUS

Appointment Management may maintain:

```text
NOT_CHECKED_IN
CHECKED_IN
LATE
NO_SHOW
```

OPD Queue Management becomes authoritative for the actual queue token and queue state.

When check-in succeeds:

```text
Appointment
CHECKED_IN

OPD Token
WAITING
```

---

# 15. PATIENT CHECK-IN FLOW — ONLINE

Complete workflow:

```text
Appointment Exists
       ↓
Reminder / Appointment Access
       ↓
Patient Selects "I'm Arrived"
       ↓
Authenticate Patient
       ↓
Retrieve Appointment
       ↓
Validate Appointment
       ↓
Check Check-In Eligibility
       ↓
Verify Appointment Has Not Been Cancelled
       ↓
Verify Appointment Date/Window
       ↓
Check Existing Check-In
       ↓
Generate OPD Token
       ↓
Create Queue Entry
       ↓
Update Appointment
       ↓
Create Visit if required
       ↓
Notify Patient
       ↓
Display Token
```

---

# 16. ONLINE CHECK-IN ELIGIBILITY

Online check-in must be allowed only when configured conditions are satisfied.

Possible conditions:

- appointment belongs to authenticated patient
- appointment is active
- appointment date is valid
- check-in window is open
- appointment has not already been checked in
- appointment has not been cancelled
- appointment has not been completed
- patient is not already in the queue for the same appointment

The check-in window must be configurable.

---

# 17. EARLY CHECK-IN

The hospital may recommend that patients arrive before their appointment.

Example:

```text
Recommended:
15 minutes before appointment
```

This is a recommendation, not a universal hardcoded rule.

The hospital configuration may define:

```text
onlineCheckInWindowBeforeMinutes
```

For example:

```text
30 minutes
60 minutes
120 minutes
```

The implementation must not assume `15` is always correct.

---

# 18. FRONT DESK CHECK-IN FLOW

Receptionist:

```text
Search Appointment
       ↓
Select Appointment
       ↓
Verify Patient Identity
       ↓
Verify Appointment Status
       ↓
Verify Check-In Eligibility
       ↓
Confirm Arrival
       ↓
Generate Token
       ↓
Add To Queue
       ↓
Update Appointment
       ↓
Print/Display Token
       ↓
Notify Patient
```

---

# 19. PATIENT IDENTITY VERIFICATION

Front-desk staff should verify patient identity using available identifiers.

Possible information:

- Patient ID
- Name
- Date of birth
- Mobile number

Do not display unnecessary clinical information.

---

# 20. ALREADY CHECKED-IN PATIENT

If the patient attempts to check in again:

```text
Patient already checked in.

Patient ID:
P10045

OPD Token:
GM-102
```

Do not generate another token.

The API must be idempotent.

---

# 21. ONLINE DOUBLE CLICK / DUPLICATE REQUEST

If a patient clicks:

```text
I'm Arrived
```

multiple times:

```text
Request 1 → success
Request 2 → duplicate
Request 3 → duplicate
```

Only one OPD token may be created.

Use:

- idempotency keys
- appointment-level uniqueness
- transaction logic

---

# 22. VISIT CREATION

If a Visit does not already exist for the appointment, the OPD workflow may create one through the Visit service.

Do not create multiple visits because the patient retries check-in.

Example:

```text
Appointment:
A202610001

Visit:
V202610155

OPD Token:
GM-102
```

All three remain separate records linked together.

---

# 23. QUEUE POSITION

The system must maintain queue position.

Example:

```text
GM-101 → Waiting
GM-102 → Waiting
GM-103 → Waiting
```

The patient sees:

```text
Your Token:
GM-102

Patients Ahead:
1
```

The count must be calculated from the current queue state.

Do not permanently store a "patients ahead" value if it can become stale.

---

# 24. QUEUE DISPLAY

The patient may see:

```text
Your Appointment
-------------------------
Dr. Patel
General Medicine

Token:
GM-102

Status:
Waiting

Patients Ahead:
1

Estimated Queue Position:
2
```

Do not present a precise waiting-time estimate unless the hospital has a validated calculation.

If estimates are displayed, label them as estimates.

---

# 25. QUEUE DASHBOARD — RECEPTION

Recommended route:

```text
/operations/opd-queue
```

Display:

```text
Today's Queue

Token | Patient | Doctor | Appointment | Status | Time
---------------------------------------------------------
GM-101 | P10021 | Dr X | 09:30 | IN_SERVICE
GM-102 | P10045 | Dr X | 09:45 | WAITING
GM-103 | P10072 | Dr X | 10:00 | WAITING
```

Use role-based visibility.

---

# 26. DOCTOR QUEUE VIEW

Recommended route:

```text
/clinical/opd-queue
```

Doctor sees:

```text
Current Patient
Next Patient
Waiting Patients
Skipped Patients
Completed Patients
```

Patient identity information must be limited to what the doctor needs.

---

# 27. PATIENT QUEUE VIEW

Recommended:

```text
/patient/queue/:tokenId
```

Display:

```text
Token:
GM-102

Status:
WAITING

Patients Ahead:
1

Doctor:
Dr. Patel

Department:
General Medicine

Room:
Consultation Room 3
```

Room information is shown only if configured.

---

# 28. QUEUE CALLING

Authorized staff/doctor can call the next patient.

Example:

```text
GM-101
```

becomes:

```text
CALLED
```

The system may display:

```text
Now Serving:
GM-101
```

Notification can be sent according to hospital configuration.

---

# 29. CALLING A PATIENT

Flow:

```text
WAITING
   ↓
CALL NEXT
   ↓
CALLED
```

Record:

```text
calledAt
calledBy
```

Do not automatically call a patient based on medical priority unless the authorized queue policy defines it.

---

# 30. SERVICE START

When consultation/service begins:

```text
CALLED
   ↓
IN_SERVICE
```

Record:

```text
serviceStartedAt
serviceStartedBy
```

The clinical encounter itself belongs to the Patient Records/Clinical workflow.

OPD Queue only records the operational state.

---

# 31. SERVICE COMPLETION

When service is complete:

```text
IN_SERVICE
   ↓
COMPLETED
```

Record:

```text
completedAt
completedBy
```

Do not automatically assume that completion means:

- patient discharged
- treatment completed
- admission unnecessary
- billing completed

Those are separate workflows.

---

# 32. SKIPPED PATIENT

A patient may be skipped according to hospital queue policy.

Example:

```text
CALLED
   ↓
No response
   ↓
SKIPPED
```

Record:

```text
skippedAt
skippedBy
skipReason
```

Do not silently delete the token.

---

# 33. SKIPPED PATIENT RETURN

Hospital policy may allow a skipped patient to return to the queue.

Possible transition:

```text
SKIPPED
   ↓
RETURN_TO_QUEUE
   ↓
WAITING
```

The exact position must follow a configured policy.

RPA must not invent the position.

---

# 34. LATE PATIENT

A patient arriving after the scheduled appointment time is not automatically a no-show.

Example:

```text
Appointment:
10:00 AM

Patient arrives:
10:12 AM
```

System:

```text
Check-In
   ↓
Mark Late
   ↓
Apply Queue Policy
```

Do not automatically reject the patient.

---

# 35. LATE STATUS

Record:

```text
isLate
lateMinutes
```

or equivalent derived information.

The system may display:

```text
Late Arrival
```

to authorized staff.

---

# 36. LATE QUEUE POSITION

The system must follow hospital-defined queue policy.

Possible policies include:

```text
Return to normal queue
Place after currently waiting patients
Staff review
Doctor decision
```

Do not hardcode one policy unless the hospital configuration specifies it.

RPA executes the configured rule.

It does not create its own queue policy.

---

# 37. NO-SHOW

No-show must not be based on reminder response.

Correct workflow:

```text
Appointment Time
      ↓
Check whether patient checked in
      ↓
Grace Period
      ↓
Still not checked in?
      ↓
Apply No-Show Policy
      ↓
NO_SHOW
```

The grace period must be configurable.

---

# 38. NO-SHOW PROCESSING

RPA can:

1. retrieve today's appointments
2. identify eligible appointments
3. verify check-in state
4. apply configured grace period
5. mark eligible appointments as no-show
6. update appointment history
7. release appointment capacity
8. notify patient
9. create audit events
10. generate reports

RPA must not mark a patient no-show before the configured conditions are satisfied.

---

# 39. EMERGENCY / URGENT PRIORITY

Emergency or urgent priority may be entered by authorized staff according to hospital policy.

The queue system must support a controlled priority field.

Example:

```text
priorityType:
NORMAL
URGENT
EMERGENCY
```

But:

> **RPA must not independently decide that a patient is urgent or emergency.**

The priority must originate from an authorized clinical/operational decision.

---

# 40. PRIORITY SOURCE

Store:

```text
priorityType
priorityReason
priorityAssignedBy
priorityAssignedAt
```

Example:

```text
priorityType:
URGENT

assignedBy:
Dr. Patel

reason:
Hospital-configured authorized reason
```

The reason should not be generated by AI/RPA.

---

# 41. PRIORITY QUEUE RULE

If the hospital has a configured priority policy:

```text
Emergency
   ↓
Urgent
   ↓
Normal
```

the system may order tokens accordingly.

However:

- the policy must be configurable
- authorized staff must assign priority
- every priority change must be audited

Do not allow patients to assign their own priority.

---

# 42. PATIENT PRIORITY UI

Patient must NOT see internal decision-making controls.

They may see:

```text
Status:
Waiting
```

They must not have:

```text
[Mark Myself Emergency]
```

or equivalent functionality.

---

# 43. QUEUE PAUSE

Authorized staff may pause a queue.

Example:

```text
Queue:
PAUSED
```

Reasons may include:

- doctor unavailable
- operational issue
- room unavailable
- hospital event

The reason must be recorded.

Patients should receive an appropriate operational notification where configured.

---

# 44. QUEUE REOPEN

```text
PAUSED
   ↓
OPEN
```

Record:

```text
resumedAt
resumedBy
```

---

# 45. QUEUE CLOSURE

At the end of an OPD session:

```text
OPEN
   ↓
CLOSED
```

Before closure, the system must identify unresolved tokens.

Examples:

```text
WAITING
CALLED
```

Do not silently delete them.

Apply configured end-of-session policy.

---

# 46. UNRESOLVED QUEUE ITEMS

If queue closes with waiting patients:

```text
Queue Closing
     ↓
Identify unresolved tokens
     ↓
Apply hospital policy
     ↓
Carry Forward / Cancel / Staff Review
```

Do not invent the policy.

---

# 47. QUEUE TRANSFER

A token may need to move to another authorized queue.

Example:

```text
Department A
     ↓
Transfer
     ↓
Department B
```

Use:

```text
status = TRANSFERRED
```

for the original queue record and create the appropriate destination queue association.

Preserve history.

---

# 48. TRANSFER RULES

Transfer must require authorized action.

Record:

```text
fromQueueId
toQueueId
transferredBy
transferredAt
transferReason
```

Do not allow arbitrary patient self-transfer.

---

# 49. APPOINTMENT VALIDATION

Before check-in:

Verify:

```text
Appointment exists
Appointment belongs to patient
Appointment is active
Appointment date is valid
Appointment is not cancelled
Appointment is not already completed
Appointment is not already checked in
```

If validation fails, return a controlled error.

---

# 50. CHECK-IN WINDOW

Configuration should include:

```text
checkInWindowBeforeMinutes
checkInWindowAfterMinutes
```

Example:

```text
Before:
60 minutes

After:
30 minutes
```

This is an example only.

Actual values must be configurable.

---

# 51. OUTSIDE CHECK-IN WINDOW

If patient attempts too early:

```text
Check-in is not currently available.
Your appointment begins at 10:00 AM.
```

If late:

```text
You are checking in after your scheduled appointment time.
Your arrival may be handled according to the hospital's queue policy.
```

Do not automatically reject unless configured.

---

# 52. FRONT DESK OVERRIDE

Authorized receptionist may have a controlled override for exceptional cases.

Example:

```text
Check-in Outside Window
```

Require:

- reason
- user identity
- audit event

Do not allow unrestricted overrides.

---

# 53. CHECK-IN ENTITY / TRANSACTION

If useful, create:

```text
CheckIn {
    checkInId,
    patientId,
    appointmentId,
    visitId,
    channel,
    checkInTime,
    checkedInBy,
    status,
    overrideUsed,
    overrideReason,
    correlationId,
    createdAt
}
```

This provides an auditable record separate from the appointment.

---

# 54. CHECK-IN CHANNEL ENUM

Use:

```text
ONLINE_SELF_CHECKIN
FRONT_DESK
```

Do not add:

```text
QR
```

for this version.

---

# 55. MONGODB INDEXES

Recommended indexes:

```text
queueId
queueDate
doctorId + queueDate
departmentId + queueDate
patientId + queueDate
appointmentId: unique where applicable
tokenNumber + queueId: unique
status + queueId
```

Use partial/compound indexes where appropriate.

---

# 56. TOKEN UNIQUENESS RULE

A token number should be unique within its queue context.

Example:

```text
Queue:
General Medicine — 06 Oct

GM-102
```

Another department may have:

```text
Dermatology — 06 Oct

DERM-102
```

The database uniqueness rule must reflect the actual configured queue scope.

---

# 57. API BASE PATH

Use:

```text
/api/v1/opd
```

Recommended endpoints:

```text
POST   /opd/check-in
GET    /opd/queues
GET    /opd/queues/:queueId
GET    /opd/queues/:queueId/tokens
GET    /opd/tokens/:tokenId
POST   /opd/tokens/:tokenId/call
POST   /opd/tokens/:tokenId/start
POST   /opd/tokens/:tokenId/complete
POST   /opd/tokens/:tokenId/skip
POST   /opd/tokens/:tokenId/return
POST   /opd/tokens/:tokenId/transfer
POST   /opd/queues/:queueId/pause
POST   /opd/queues/:queueId/resume
POST   /opd/queues/:queueId/close
```

---

# 58. CHECK-IN API

```http
POST /api/v1/opd/check-in
```

Example request:

```json
{
  "appointmentId": "A202610001",
  "channel": "ONLINE_SELF_CHECKIN"
}
```

The server determines:

- authenticated patient
- Patient ID
- appointment validity
- queue
- token
- Visit ID

Do not trust client-provided Patient ID when the authenticated session already establishes identity.

---

# 59. FRONT DESK CHECK-IN API

Same endpoint may support:

```json
{
  "appointmentId": "A202610001",
  "channel": "FRONT_DESK"
}
```

Backend identifies the receptionist from the JWT.

---

# 60. CHECK-IN RESPONSE

Example:

```json
{
  "success": true,
  "data": {
    "patientId": "P10045",
    "appointmentId": "A202610001",
    "visitId": "V202610155",
    "tokenId": "TOKEN-20261006-00102",
    "tokenNumber": "GM-102",
    "queueId": "QUEUE-GM-20261006",
    "status": "WAITING",
    "patientsAhead": 1
  },
  "correlationId": "CORR-OPD-20261006-000123"
}
```

---

# 61. GET QUEUE API

```http
GET /api/v1/opd/queues/:queueId
```

Return:

```text
queue details
current token
waiting count
called token
status
```

Do not return unauthorized patient information.

---

# 62. GET TOKEN API

```http
GET /api/v1/opd/tokens/:tokenId
```

Patient can access only their own token.

Staff can access according to role.

---

# 63. CALL TOKEN API

```http
POST /api/v1/opd/tokens/:tokenId/call
```

Backend:

1. authorize user
2. verify token status
3. update token
4. record `calledAt`
5. create history
6. optionally notify patient
7. create audit event

---

# 64. START SERVICE API

```http
POST /api/v1/opd/tokens/:tokenId/start
```

Expected:

```text
CALLED → IN_SERVICE
```

Only authorized clinical/operational users.

---

# 65. COMPLETE SERVICE API

```http
POST /api/v1/opd/tokens/:tokenId/complete
```

Expected:

```text
IN_SERVICE → COMPLETED
```

This does not complete the patient's overall hospital journey.

It only completes the OPD queue service state.

---

# 66. SKIP API

```http
POST /api/v1/opd/tokens/:tokenId/skip
```

Body:

```json
{
  "reason": "PATIENT_NOT_PRESENT"
}
```

---

# 67. RETURN-TO-QUEUE API

```http
POST /api/v1/opd/tokens/:tokenId/return
```

Requires authorization.

Record reason.

Apply configured queue-position policy.

---

# 68. QUEUE HISTORY

Create an immutable history mechanism.

Recommended:

```text
OPDTokenHistory {
    tokenId,
    previousStatus,
    newStatus,
    action,
    actorUserId,
    actorRole,
    reason,
    timestamp,
    correlationId
}
```

Examples:

```text
CHECKED_IN
CALLED
SERVICE_STARTED
SKIPPED
RETURNED
COMPLETED
TRANSFERRED
CANCELLED
```

---

# 69. RPA RESPONSIBILITY

Robot Framework can automate:

1. appointment verification
2. check-in synchronization with legacy systems
3. token synchronization
4. queue status synchronization
5. no-show processing
6. patient notifications
7. queue reports
8. external display synchronization
9. exception creation
10. operational reconciliation

RPA must not be the authoritative queue engine.

The MERN backend remains authoritative.

---

# 70. RPA GLOBAL PATTERN

Use:

```text
INPUT
 ↓
READ
 ↓
VALIDATE
 ↓
APPLY CONFIGURED RULES
 ↓
ACT
 ↓
VERIFY
 ↓
UPDATE
 ↓
NOTIFY
 ↓
LOG
```

---

# 71. RPA CHECK-IN SYNCHRONIZATION

If a legacy system must also be updated:

```text
MERN Check-In
      ↓
Create RPA Job
      ↓
Read Appointment
      ↓
Login Legacy System
      ↓
Search Appointment
      ↓
Confirm Check-In
      ↓
Capture Result
      ↓
Update MERN
      ↓
Audit
```

If an API exists, use the API instead.

---

# 72. RPA NO-SHOW PROCESS

Robot should:

```text
Get Today's Appointments
        ↓
Find Appointments Past Grace Period
        ↓
Check Queue/Check-In State
        ↓
Exclude Checked-In Patients
        ↓
Apply Configured Rule
        ↓
Update Appointment
        ↓
Notify
        ↓
Log
```

---

# 73. RPA NO-SHOW SAFETY

Before marking no-show, verify:

```text
Patient has no check-in
Appointment is not cancelled
Appointment is eligible
Grace period has passed
No exception is open that prevents processing
```

If uncertainty exists:

```text
ExceptionCase
```

Do not mark automatically.

---

# 74. RPA QUEUE RECONCILIATION

Daily or configurable reconciliation:

```text
MERN Queue
      ↕
Legacy Queue
```

Compare:

- appointment
- check-in
- token
- status

If mismatch:

```text
QUEUE_RECONCILIATION_EXCEPTION
```

Do not blindly overwrite one system with another.

---

# 75. RPA FOLDER STRUCTURE

Extend:

```text
robot/
├── resources/
│   ├── authentication.resource
│   ├── api_keywords.resource
│   ├── opd_keywords.resource
│   ├── appointment_keywords.resource
│   └── notification_keywords.resource
│
├── keywords/
│   ├── opd_checkin.resource
│   ├── opd_token.resource
│   ├── opd_queue.resource
│   ├── opd_no_show.resource
│   └── opd_reconciliation.resource
│
├── tests/
│   ├── opd_online_checkin.robot
│   ├── opd_frontdesk_checkin.robot
│   ├── opd_queue.robot
│   ├── opd_no_show.robot
│   └── opd_reconciliation.robot
│
└── results/
```

---

# 76. FRONTEND ROUTES

Patient:

```text
/patient/check-in
/patient/queue
/patient/queue/:tokenId
```

Operations:

```text
/operations/opd
/operations/opd/check-in
/operations/opd/queues
```

Clinical:

```text
/clinical/opd
/clinical/opd/queue
```

---

# 77. FRONTEND COMPONENTS

Recommended:

```text
AppointmentCheckIn
CheckInConfirmation
OPDTokenCard
QueueStatus
QueueList
QueueDashboard
CurrentTokenDisplay
NextPatientCard
PatientQueueView
CallPatientButton
StartServiceButton
CompleteServiceButton
SkipPatientDialog
ReturnToQueueDialog
QueuePauseDialog
QueueFilters
QueueStatusBadge
```

---

# 78. PATIENT CHECK-IN UI

Example:

```text
Your Appointment

Dr. Patel
General Medicine

12 Oct 2026
10:30 AM

[ I'M ARRIVED ]
```

After success:

```text
You're checked in.

Your OPD Token:
GM-102

Patients Ahead:
1

Please wait for your token to be called.
```

---

# 79. FRONT DESK CHECK-IN UI

Search:

```text
Patient ID
Appointment ID
Mobile
Name
```

Then:

```text
Patient:
Rahul Shah

Appointment:
A202610001

Doctor:
Dr. Patel

Time:
10:30 AM

[ CHECK IN ]
```

After successful check-in:

```text
Token:
GM-102
```

---

# 80. QUEUE DASHBOARD UI

Example:

```text
GENERAL MEDICINE
06 OCTOBER 2026

Now Serving:
GM-101

Next:
GM-102

Waiting:
GM-103
GM-104
GM-105

[Call Next]
[Pause Queue]
```

The exact ordering must come from configured queue rules.

---

# 81. PATIENT NOTIFICATION

After successful check-in:

```text
Your check-in is complete.

OPD Token: GM-102
Doctor: Dr. Patel
Department: General Medicine
```

Use Notification Service.

Do not implement direct SMS provider logic here.

---

# 82. TOKEN CALLED NOTIFICATION

When configured:

```text
Your token GM-102 has been called.

Please proceed to Consultation Room 3.
```

Room information must come from configuration.

Do not invent room information.

---

# 83. QUEUE DELAY NOTIFICATION

If the hospital supports delay notifications:

```text
The OPD queue is currently experiencing a delay.
Please continue to monitor your queue status.
```

Do not provide false waiting-time promises.

---

# 84. AUDIT EVENTS

Required events:

```text
OPD_CHECKIN_STARTED
OPD_CHECKIN_COMPLETED
OPD_CHECKIN_FAILED
OPD_TOKEN_CREATED
OPD_TOKEN_VIEWED
OPD_TOKEN_CALLED
OPD_SERVICE_STARTED
OPD_SERVICE_COMPLETED
OPD_TOKEN_SKIPPED
OPD_TOKEN_RETURNED
OPD_TOKEN_TRANSFERRED
OPD_TOKEN_CANCELLED
OPD_PRIORITY_ASSIGNED
OPD_PRIORITY_CHANGED
OPD_QUEUE_PAUSED
OPD_QUEUE_RESUMED
OPD_QUEUE_CLOSED
OPD_NO_SHOW_PROCESSED
```

---

# 85. RBAC

## Patient

Can:

- check in for own appointment
- view own token
- view own queue status
- receive queue notifications

Cannot:

- modify queue
- assign priority
- call another patient
- skip another patient

---

## Receptionist

Can:

- check in patients
- view operational queues
- generate tokens
- perform authorized queue actions
- handle late arrivals according to policy

Cannot:

- assign clinical priority unless the role is explicitly authorized for that policy
- make medical decisions

---

## Doctor

Can:

- view assigned queue
- call patient
- start service
- complete OPD service
- assign clinical/urgent priority where authorized

Cannot:

- manipulate unrelated queues without permission.

---

## Nurse

Can:

- view assigned queues
- perform authorized queue operations

---

## Administrative Manager

Can:

- view queues
- configure operational policies where authorized
- review queue performance

---

## System Admin

Can administer technical configuration but must still follow least-privilege principles for patient data.

---

# 86. PRIORITY SECURITY

Patients must never be able to submit:

```text
priority = EMERGENCY
```

through the normal API.

Backend must ignore/reject unauthorized priority changes.

Priority must be assigned through an authorized workflow.

---

# 87. EXCEPTION CASES

Create exceptions for:

```text
OPD_CHECKIN_OUTSIDE_WINDOW
DUPLICATE_CHECKIN
TOKEN_GENERATION_FAILURE
QUEUE_CONFIGURATION_ERROR
LEGACY_QUEUE_SYNC_FAILURE
NO_SHOW_PROCESSING_FAILURE
QUEUE_RECONCILIATION_FAILURE
INVALID_PRIORITY
QUEUE_STATE_CONFLICT
```

---

# 88. EXCEPTION EXAMPLE

If token generation fails:

```text
Appointment:
A202610001

Check-In:
SUCCESS

Token:
FAILED
```

Do not leave the system in an unclear state.

Create:

```text
ExceptionCase
type = TOKEN_GENERATION_FAILURE
status = OPEN
correlationId = ...
```

Attempt safe recovery.

If recovery succeeds:

```text
Token Created
Exception Closed
```

---

# 89. DATABASE TRANSACTION

Check-in is a multi-record operation:

```text
CheckIn
Appointment
Visit
OPDToken
OPDQueue
Audit
```

Critical state changes should use MongoDB transactions where appropriate.

Do not create a token if the associated check-in cannot be committed.

---

# 90. IDEMPOTENT CHECK-IN

A check-in request must be safe to retry.

Example:

```text
POST /opd/check-in
Idempotency-Key: CHECKIN-12345
```

If the request is repeated:

```text
Return existing token
```

rather than generating another token.

---

# 91. DATA CONSISTENCY

The following must never happen:

```text
Appointment = CHECKED_IN
but
No CheckIn record
```

or:

```text
CheckIn = SUCCESS
but
No OPD Token
```

unless an explicitly tracked exception state exists.

---

# 92. QUEUE STATE CONSISTENCY

Do not allow:

```text
Token:
COMPLETED

Queue:
Waiting
```

without a valid reason/history.

Use controlled state transitions.

---

# 93. QUEUE POSITION CALCULATION

Patients ahead should consider:

- queue status
- token status
- configured priority
- transfer
- skip status

Exclude:

```text
COMPLETED
CANCELLED
NO_SHOW
```

from active waiting count.

The exact queue-order algorithm must be centralized in a service.

Example:

```text
queueOrdering.service.js
```

Do not duplicate ordering logic across frontend and backend.

---

# 94. QUEUE ORDERING SERVICE

Recommended service responsibilities:

```text
getNextToken()
calculatePosition()
getPatientsAhead()
applyPriorityPolicy()
handleSkippedToken()
handleReturnedToken()
```

The backend must be authoritative.

Frontend should display backend-calculated values.

---

# 95. REAL-TIME UPDATES

The queue should support near-real-time updates.

Preferred implementation:

- WebSocket
- Socket.IO
- Server-Sent Events

according to project architecture.

When queue changes:

```text
Token Called
Token Completed
New Check-In
Queue Paused
```

connected clients should receive updates.

Do not require users to manually refresh the page.

---

# 96. REAL-TIME SECURITY

WebSocket/SSE clients must still obey RBAC.

A patient should receive only:

```text
their own queue state
```

or publicly permitted queue information.

A doctor receives their assigned queue.

A receptionist receives queues permitted by role.

---

# 97. REPORTING REQUIREMENTS

Expose data for:

- total check-ins
- online check-ins
- front-desk check-ins
- average waiting time
- average service time
- no-shows
- late arrivals
- completed consultations
- skipped patients
- queue utilization
- doctor utilization
- peak OPD hours
- queue delays

Reports & Analytics will consume these records.

---

# 98. PERFORMANCE

The queue dashboard must be responsive.

Requirements:

- paginated history
- efficient queue queries
- indexed token lookup
- efficient current-token lookup
- avoid full patient collection scans
- use WebSocket/SSE for updates where appropriate

Do not recalculate the entire hospital's queues for every token update.

---

# 99. ERROR FORMAT

Example:

```json
{
  "success": false,
  "error": {
    "code": "OPD_CHECKIN_NOT_AVAILABLE",
    "message": "Online check-in is not currently available for this appointment.",
    "correlationId": "CORR-OPD-20261006-000123"
  }
}
```

---

# 100. SEED DATA

Create realistic demonstration data.

Patients:

```text
P10001 — Rahul Shah
P10002 — Priya Patel
P10003 — Amit Mehta
P10004 — Neha Desai
P10005 — Rohan Shah
```

Appointments:

```text
A202610001
A202610002
A202610003
A202610004
A202610005
```

Queues:

```text
General Medicine
Cardiology
Dermatology
Orthopedics
```

Tokens:

```text
GM-101
GM-102
GM-103
CARD-201
CARD-202
```

Statuses should include:

```text
WAITING
CALLED
IN_SERVICE
COMPLETED
SKIPPED
```

---

# 101. DEMO SCENARIO — ONLINE CHECK-IN

Patient:

```text
P10045
```

Appointment:

```text
A202610001
10:30 AM
Dr. Patel
```

At 10:00 AM:

```text
Patient opens appointment
       ↓
[I'm Arrived]
       ↓
Validate appointment
       ↓
Generate token
       ↓
GM-102
```

Expected:

```text
Appointment = CHECKED_IN
Token = WAITING
Queue = OPEN
```

---

# 102. DEMO SCENARIO — FRONT DESK CHECK-IN

Patient arrives at reception.

Receptionist searches:

```text
A202610001
```

System displays:

```text
Rahul Shah
Dr. Patel
10:30 AM
```

Receptionist clicks:

```text
CHECK IN
```

Expected:

```text
Token:
GM-103
```

Patient receives confirmation.

---

# 103. DEMO SCENARIO — LATE ARRIVAL

Appointment:

```text
10:00 AM
```

Patient arrives:

```text
10:18 AM
```

System:

```text
Check-In
 ↓
Late = TRUE
 ↓
Apply configured late policy
```

Do not automatically classify as NO_SHOW.

---

# 104. DEMO SCENARIO — NO-SHOW

Appointment:

```text
10:00 AM
```

No check-in.

Configured grace:

```text
15 minutes
```

At 10:20:

```text
RPA verifies:
No check-in
Appointment active
Grace period passed
```

Then:

```text
Appointment → NO_SHOW
Slot released
Notification sent
Audit created
```

---

# 105. DEMO SCENARIO — PRIORITY

Authorized doctor assigns:

```text
Token:
GM-105

Priority:
URGENT
```

System records:

```text
priorityType = URGENT
priorityAssignedBy = DOC1001
```

Queue ordering applies the configured policy.

RPA does not decide the priority.

---

# 106. DEMO SCENARIO — DUPLICATE CHECK-IN

Patient clicks:

```text
I'm Arrived
```

twice.

Expected:

```text
First request:
GM-102

Second request:
Returns existing GM-102
```

No duplicate token.

---

# 107. TESTING REQUIREMENTS

## Unit Tests

Test:

- token generation
- queue ordering
- patients-ahead calculation
- check-in eligibility
- late detection
- no-show eligibility
- priority handling
- state transitions
- idempotency

---

# 108. API TESTS

Test:

```text
POST /opd/check-in
GET /opd/queues
GET /opd/queues/:id
GET /opd/tokens/:id
POST /opd/tokens/:id/call
POST /opd/tokens/:id/start
POST /opd/tokens/:id/complete
POST /opd/tokens/:id/skip
POST /opd/tokens/:id/return
POST /opd/tokens/:id/transfer
```

Also test:

- unauthorized calls
- invalid appointment
- duplicate check-in
- outside-window check-in
- cancelled appointment
- already completed appointment

---

# 109. INTEGRATION TESTS

Verify:

```text
Appointment
   ↓
Check-In
   ↓
OPD Token
   ↓
Queue
   ↓
Doctor Queue
   ↓
Service
   ↓
Completion
```

Also verify:

```text
Queue
 ↓
Notification
 ↓
Audit
 ↓
RPA
```

---

# 110. ROBOT FRAMEWORK TEST CASES

Implement at minimum:

```text
TC-OPD-001 Online self check-in
TC-OPD-002 Front desk check-in
TC-OPD-003 Duplicate check-in prevention
TC-OPD-004 Token generation
TC-OPD-005 Queue position
TC-OPD-006 Call patient
TC-OPD-007 Start service
TC-OPD-008 Complete service
TC-OPD-009 Skip patient
TC-OPD-010 Return skipped patient
TC-OPD-011 Late patient
TC-OPD-012 No-show processing
TC-OPD-013 Priority workflow
TC-OPD-014 Queue pause/resume
TC-OPD-015 Queue closure
TC-OPD-016 External system synchronization
TC-OPD-017 External synchronization failure
TC-OPD-018 Unauthorized priority modification
TC-OPD-019 Unauthorized queue access
TC-OPD-020 Check-in outside allowed window
```

---

# 111. SECURITY TESTS

Verify:

- patient can check in only for their own appointment
- patient cannot check in another patient
- patient cannot create arbitrary token
- patient cannot assign priority
- receptionist permissions are enforced
- doctor permissions are enforced
- unauthorized queue access is rejected
- queue history cannot be modified
- audit records cannot be modified by normal users

---

# 112. ACCEPTANCE CRITERIA

The module is accepted only when all are true.

## Check-In

- Online self check-in works.
- Front desk check-in works.
- QR check-in is not implemented.
- Appointment validity is verified.
- Check-in window is configurable.
- Duplicate check-in is prevented.
- Late arrivals are handled according to configured policy.

## Queue

- OPD token is generated server-side.
- Tokens are unique.
- Queue position is accurate.
- Queue state is persistent.
- Queue can be opened/paused/resumed/closed.
- Token state transitions are controlled.

## Clinical Priority

- Authorized users can assign priority where configured.
- Patients cannot assign priority.
- RPA cannot independently determine priority.

## No-Show

- Reminder non-response does not immediately create no-show.
- Grace period is configurable.
- Check-in state is verified before no-show.
- No-show processing is auditable.

## Integration

- Appointment Management integrates correctly.
- Patient Registration integrates correctly.
- Notification Service integrates correctly.
- Audit Service integrates correctly.
- RPA can synchronize with external systems.
- Patient Records can consume completed OPD encounter references.

---

# 113. DEFINITION OF DONE

Do not consider this module complete until all are implemented:

```text
React UI
+
Online Check-In
+
Front Desk Check-In
+
OPD Token Generation
+
Queue Management
+
Queue Ordering
+
Priority Support
+
Late Handling
+
No-Show Handling
+
Queue Calling
+
Service Start/Completion
+
Skip/Return
+
Queue Transfer
+
Pause/Resume/Close
+
Real-Time Updates
+
MongoDB Models
+
REST APIs
+
RBAC
+
Audit Logging
+
Exception Handling
+
Notification Integration
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

# 114. IMPLEMENTATION ORDER

The AI coding agent should implement in this order:

### Step 1
Create:

```text
OPDQueue
OPDToken
CheckIn
OPDTokenHistory
```

### Step 2
Implement queue configuration.

### Step 3
Implement token sequence generation.

### Step 4
Implement appointment/check-in validation.

### Step 5
Implement concurrency-safe check-in.

### Step 6
Implement token creation.

### Step 7
Implement queue ordering service.

### Step 8
Implement queue status transitions.

### Step 9
Implement call/start/complete/skip/return.

### Step 10
Implement late handling.

### Step 11
Implement no-show workflow.

### Step 12
Implement priority workflow.

### Step 13
Implement queue pause/resume/close.

### Step 14
Implement Patient Portal check-in.

### Step 15
Implement Receptionist queue UI.

### Step 16
Implement Doctor queue UI.

### Step 17
Implement real-time updates.

### Step 18
Integrate Notification Service.

### Step 19
Integrate Audit Service.

### Step 20
Implement RPA synchronization.

### Step 21
Implement exception handling.

### Step 22
Implement unit/API/integration tests.

### Step 23
Implement Robot Framework tests.

### Step 24
Add seed/demo data.

### Step 25
Perform full end-to-end testing.

---

# 115. DO NOT IMPLEMENT

Do not implement inside this module:

- medical diagnosis
- clinical triage
- treatment decisions
- admission decisions
- discharge decisions
- medication decisions
- lab interpretation
- radiology interpretation
- bed allocation
- insurance decisions
- billing calculations

The queue system manages **administrative/operational patient flow**, not clinical decision-making.

---

# 116. FINAL ARCHITECTURAL RULE

Maintain this strict separation:

```text
PATIENT
Permanent Identity
        |
        v
APPOINTMENT
Planned Visit
        |
        v
CHECK-IN
Actual Arrival
        |
        v
OPD TOKEN
Queue Position
        |
        v
OPD QUEUE
Operational Waiting State
        |
        v
SERVICE
Doctor/Clinical Encounter
```

The critical rule is:

> **A patient is not in the OPD queue merely because they have an appointment. The patient enters the OPD queue only after a valid check-in.**

And:

> **The OPD queue may execute an authorized priority policy, but neither the queue system nor Robot Framework may independently decide medical priority.**

The MERN backend remains the source of truth, while Robot Framework automates repetitive administrative synchronization, reconciliation, notifications, and exception-driven workflows.