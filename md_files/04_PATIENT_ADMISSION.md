# 04 — PATIENT ADMISSION

## 1. MODULE IDENTIFICATION

**File:** `04_PATIENT_ADMISSION.md`

**Module Name:** Patient Admission Management

**System:** Hospital Administrative Automation & RPA Platform

**Architecture:** MERN + Robot Framework

**Frontend:** React.js

**Backend:** Node.js + Express.js

**Database:** MongoDB + Mongoose

**Automation:** Robot Framework

**API Style:** REST

**Primary Portals:**
- Clinical Portal
- Operations Portal
- Patient Portal
- Finance & Insurance Portal
- Administration & Management Portal

**Primary Roles:**
- Doctor
- Nurse
- Receptionist
- Administrative Manager
- Billing Staff
- System Admin

**Related Roles:**
- Patient
- Insurance Representative
- Pharmacist
- Laboratory Technician
- Radiology Technician
- Housekeeping Staff
- Hospital Management

---

# 2. INSTRUCTION TO THE AI CODING AGENT

Implement the **Patient Admission Management module** as a complete hospital administrative admission workflow.

Do NOT implement this as a simple "admit patient" button.

The module must support:

1. OPD-based admission
2. Emergency admission
3. Existing patient identification
4. Temporary emergency identity
5. Admission request
6. Administrative validation
7. Bed availability integration
8. Accommodation preference
9. Clinical requirement reference
10. Admission approval workflow
11. Admission ID generation
12. Bed assignment integration
13. Admission documentation
14. Patient/relative notifications
15. Billing/insurance integration
16. Department notifications
17. Exception handling
18. Audit logging
19. RPA automation
20. Human approval where required

The module must integrate with:

- Patient Registration
- Patient Records
- Appointment Management
- OPD Queue
- Bed Management
- Billing
- Insurance Verification
- Insurance Claims
- Pharmacy
- Laboratory
- Radiology
- Notification Service
- Document Generation
- Audit Service
- RPA Job Management

---

# 3. CRITICAL SAFETY AND RESPONSIBILITY RULE

The system must preserve the following boundary:

> **The system does not decide whether a patient medically requires admission.**

Admission necessity must originate from:

- Doctor
- Authorized clinical staff
- Authorized hospital admission workflow

The system/RPA then performs administrative execution.

Correct architecture:

```text id="n3a6ud"
Doctor / Authorized Clinical Staff
             |
             v
       Admission Required
             |
             v
      Admission Request
             |
             v
   Administrative Validation
             |
             v
      Bed Availability
             |
             v
   Authorized Admission Process
             |
             v
       Admission Record
             |
             v
        Bed Assignment
```

RPA must never independently decide:

- whether a patient should be admitted
- whether ICU is clinically required
- whether the patient is medically stable
- whether admission is medically justified
- whether discharge is medically appropriate.

---

# 4. ADMISSION SOURCES

Exactly two primary admission sources must be supported.

## 4.1 OPD Admission

Patient has already entered the hospital through normal outpatient workflow.

Typical sequence:

```text id="s0o1on"
Patient Registration
      ↓
Appointment
      ↓
OPD Check-In
      ↓
Doctor Consultation
      ↓
Doctor Determines Admission Required
      ↓
Admission Request
      ↓
Administrative Processing
      ↓
Bed Assignment
      ↓
Admission
```

---

# 5. EMERGENCY ADMISSION

Emergency admission may occur without prior appointment or OPD registration.

Flow:

```text id="q7uv8m"
Emergency Patient Arrives
          ↓
Search Patient Master
          |
     +----+----+
     |         |
 Existing    Unknown
     |         |
     v         v
Patient ID   Temporary ID
     |         |
     +----+----+
          |
          v
   Emergency Visit
          |
          v
Authorized Clinical Decision
          |
          v
   Admission Request
          |
          v
Administrative Admission
```

---

# 6. NO SEPARATE EMERGENCY PATIENT MASTER

Emergency patients must still use the central Patient Master.

Do NOT create:

```text
EmergencyPatientMaster
```

as an independent permanent identity database.

Instead:

```text id="j0zccq"
Patient Master
     |
     +--- Existing Patient
     |
     +--- Temporary Emergency Record
```

Temporary identity exists only until identity is verified.

---

# 7. ADMISSION ID

Every admission episode must have a unique Admission ID.

Example:

```text id="p3j6uw"
ADM202610001
ADM202610002
ADM202610003
```

Properties:

- unique
- immutable
- generated server-side
- never reused
- independent of Patient ID
- independent of Visit ID

---

# 8. ID RELATIONSHIP

Example:

```text id="h81gqo"
Patient ID:
P10045

Visit ID:
V202610155

Admission ID:
ADM202610001

Bed:
P-03
```

These represent different concepts.

```text id="4u7d4j"
Patient ID
    =
Permanent identity

Visit ID
    =
Hospital encounter

Admission ID
    =
Inpatient admission episode

Bed ID
    =
Physical accommodation
```

---

# 9. ADMISSION REQUEST

Create a dedicated `AdmissionRequest` entity.

Recommended:

```text id="j7gby3"
AdmissionRequest {
    admissionRequestId,

    patientId,
    visitId,

    source,

    requestedBy,
    requestingDepartment,
    requestingDoctor,

    clinicalRequirementReference,

    accommodationPreference,

    requestedAt,

    status,

    priority,

    approvalStatus,

    exceptionStatus,

    correlationId,

    createdAt,
    updatedAt
}
```

---

# 10. ADMISSION REQUEST SOURCE

Use:

```text id="e2b7dp"
OPD
EMERGENCY
```

Future sources may be added through configuration.

Do not create duplicate workflows for other sources unless explicitly required.

---

# 11. ADMISSION REQUEST STATUS

Recommended:

```text id="j0v8ot"
DRAFT
SUBMITTED
VALIDATING
PENDING_APPROVAL
APPROVED
BED_SEARCH
BED_PENDING
BED_ASSIGNED
ADMITTED
REJECTED
CANCELLED
EXCEPTION
```

Normal OPD flow:

```text id="hj8lyc"
DRAFT
 ↓
SUBMITTED
 ↓
VALIDATING
 ↓
APPROVED
 ↓
BED_SEARCH
 ↓
BED_ASSIGNED
 ↓
ADMITTED
```

---

# 12. CLINICAL REQUIREMENT

The system must store the clinical admission requirement as a reference to authorized clinical information.

Example:

```text id="q11h87"
clinicalRequirementReference
```

This may point to:

- doctor admission order
- clinical encounter
- authorized admission request

Do not ask RPA to generate a clinical justification.

---

# 13. CLINICAL INFORMATION BOUNDARY

The admission module may display necessary clinical context to authorized users.

However, it must not generate or modify clinical conclusions.

Do NOT implement logic such as:

```text id="9hhl1j"
If oxygen < X → ICU admission
```

or:

```text id="0r5s6w"
If age > X → admit
```

or any other autonomous medical admission rule.

---

# 14. ACCOMMODATION PREFERENCE

Patient may express an accommodation preference.

Example choices:

```text id="9l2z2f"
General Ward
Semi-Private
Private Room
Other configured category
```

This is a **patient preference**, not a clinical requirement.

---

# 15. CLINICAL REQUIREMENT VS PATIENT PREFERENCE

The system must maintain these as separate concepts.

Example:

```text id="hccu9t"
Clinical Requirement:
ICU

Patient Preference:
Private Room
```

Clinical requirement takes precedence.

Another example:

```text id="zyydq5"
Clinical Requirement:
General Ward

Patient Preference:
Private Room
```

If hospital policy permits, the patient may receive the preferred accommodation if available and financially/administratively eligible.

---

# 16. ACTUAL BED VS PREFERENCE

Patient does not choose a physical bed directly.

Patient chooses:

```text id="u6j8pm"
Accommodation Category
```

The system/authorized staff assigns:

```text id="dr0qvn"
Physical Bed
```

Example:

```text id="b0mtmm"
Patient Preference:
Private Room

Available:
P-01
P-02
P-03

System/Staff:
Assign P-03
```

---

# 17. BED MANAGEMENT INTEGRATION

Do not duplicate bed inventory inside Patient Admission.

Bed Management is authoritative for:

- physical beds
- ward
- bed type
- status
- equipment
- occupancy
- isolation capability
- maintenance
- cleaning

Admission requests bed availability through the Bed Management service.

---

# 18. ADMISSION WORKFLOW — OPD

Complete flow:

```text id="d3l8bg"
Patient
   ↓
Registration
   ↓
Appointment
   ↓
OPD Check-In
   ↓
Doctor Consultation
   ↓
Doctor Determines Admission Required
   ↓
Admission Request
   ↓
Validate Patient
   ↓
Validate Visit
   ↓
Validate Requesting Doctor
   ↓
Apply Administrative Rules
   ↓
Authorized Approval
   ↓
Check Bed Availability
   ↓
Bed Assignment
   ↓
Create Admission
   ↓
Generate Admission ID
   ↓
Update Bed
   ↓
Generate Documents
   ↓
Notify Departments
   ↓
Notify Patient/Relative
   ↓
Audit
```

---

# 19. ADMISSION WORKFLOW — EMERGENCY

```text id="m3gcqg"
Emergency Arrival
       ↓
Search Patient Master
       |
   +---+---+
   |       |
Found    Not Found
   |       |
   v       v
Patient   TEMP ID
ID
   |       |
   +---+---+
       |
       v
Emergency Visit
       |
       v
Clinical Admission Decision
       |
       v
Admission Request
       |
       v
Administrative Validation
       |
       v
Bed Management
       |
       v
Admission
```

Emergency clinical care must not be blocked by unnecessary administrative steps where hospital policy requires immediate care.

The system should support later administrative completion.

---

# 20. EMERGENCY TEMPORARY ID

Example:

```text id="1z9ayc"
TEMP-2026-00452
```

The temporary record should include:

```text id="4zcl3p"
temporaryEmergencyId
provisionalName
approximateAge
gender
createdAt
createdBy
identityStatus
linkedPatientId
```

Only required information should be collected until identity is established.

---

# 21. EMERGENCY IDENTITY LINKING

Later:

```text id="u8nxw5"
TEMP-2026-00452
       ↓
Identity Verification
       ↓
P10045 identified
       ↓
Link Emergency Visit
       ↓
Link Admission
       ↓
Preserve all history
```

Never silently delete the temporary identity history.

---

# 22. ADMISSION APPROVAL

The system must support configured approval workflows.

Example:

```text id="e7m3th"
Doctor Admission Request
       ↓
Administrative Validation
       ↓
Approval Required?
       |
   +---+---+
   |       |
  YES      NO
   |       |
   v       v
Authorized Approver
       |
       v
APPROVED
```

The exact approval requirement must be configurable.

Do not hardcode unnecessary approval layers.

---

# 23. WHO MAY APPROVE

Depending on hospital configuration:

- authorized doctor
- admission desk
- administrative manager
- authorized hospital staff

The AI coding agent must implement permissions so that approval is role-based.

Do not allow arbitrary users to approve admission.

---

# 24. ADMISSION REJECTION

An admission request may be rejected for administrative reasons where policy allows.

Example:

```text id="u5ey3y"
Missing required administrative information
Invalid request
Duplicate active admission
```

However:

> Administrative rejection must never override an emergency clinical-care requirement.

The system must route exceptional cases to authorized human staff.

---

# 25. ACTIVE ADMISSION PREVENTION

Before creating a new admission, check whether the patient already has an active admission.

Example:

```text id="7s6z4m"
Patient P10045

Active Admission:
ADM202610001
```

If another admission request is submitted:

```text id="12tvvy"
Potential duplicate active admission
```

Create an exception or require authorized review.

Do not blindly create another active admission.

---

# 26. ADMISSION ENTITY

Recommended:

```text id="j4i4jw"
Admission {
    admissionId,

    patientId,
    visitId,

    admissionRequestId,

    admissionType,

    source,

    admissionDate,
    admissionTime,

    status,

    admittingDoctorId,
    admittingDepartmentId,

    clinicalRequirementReference,

    accommodationPreference,

    assignedWardId,
    assignedBedId,

    identityStatus,

    insuranceStatus,

    billingStatus,

    dischargeStatus,

    createdAt,
    updatedAt,

    createdBy,
    updatedBy,

    correlationId
}
```

---

# 27. ADMISSION TYPES

Recommended:

```text id="cghmrf"
INPATIENT
EMERGENCY
OBSERVATION
OTHER_CONFIGURED
```

Use only types supported by hospital configuration.

Do not invent clinical definitions.

---

# 28. ADMISSION STATUS

Recommended:

```text id="a2k7gm"
REQUESTED
APPROVED
BED_PENDING
BED_ASSIGNED
ADMITTED
TRANSFER_PENDING
TRANSFERRED
DISCHARGE_REQUESTED
DISCHARGED
CANCELLED
```

Typical:

```text id="w4x4v0"
REQUESTED
 ↓
APPROVED
 ↓
BED_PENDING
 ↓
BED_ASSIGNED
 ↓
ADMITTED
 ↓
DISCHARGE_REQUESTED
 ↓
DISCHARGED
```

---

# 29. ADMISSION TIME

The authoritative admission timestamp must be generated by the backend.

Do not allow users to arbitrarily modify the admission timestamp.

Corrections, if allowed, require an auditable administrative workflow.

---

# 30. ADMISSION DATE VS REGISTRATION DATE

These must not be conflated.

Example:

```text id="wl1uev"
Registration:
06-Oct-2026

OPD Visit:
06-Oct-2026

Admission:
06-Oct-2026 14:20
```

The admission timestamp represents the inpatient admission event.

---

# 31. BED ASSIGNMENT FLOW

Admission requests bed availability from Bed Management.

```text id="6qmbw6"
Admission Approved
       ↓
Get Clinical Requirement
       ↓
Get Accommodation Preference
       ↓
Query Bed Management
       ↓
Find Suitable Beds
       ↓
Apply Configured Rules
       ↓
Auto-assign if safe and authorized
       ↓
Otherwise Staff Confirmation
       ↓
Reserve Bed
       ↓
Create Admission
       ↓
Occupy Bed
```

---

# 32. BED ASSIGNMENT RULE

The system must not automatically downgrade accommodation because the preferred category is unavailable.

Example:

Patient requests:

```text id="kj6aab"
Private Room
```

Private rooms unavailable.

Do NOT automatically assign:

```text id="wmqun3"
General Ward
```

Instead:

```text id="1a5qys"
Offer:
Waiting List
Alternative Category
Admission Desk Review
```

---

# 33. CLINICAL REQUIREMENT OVERRIDE

If authorized clinical requirement says:

```text id="x7u6aq"
ICU
```

then patient preference cannot downgrade the requirement.

The system should query appropriate ICU-compatible beds.

If unavailable:

```text id="b9b8uk"
No suitable bed available
       ↓
Exception
       ↓
Authorized clinical/administrative decision
```

RPA does not decide the clinical alternative.

---

# 34. BED RESERVATION

Before admission is finalized, the selected bed may be reserved.

Recommended state:

```text id="b8rx3h"
AVAILABLE
   ↓
RESERVED
   ↓
OCCUPIED
```

Reservation must have an expiration mechanism where appropriate.

Do not leave beds permanently reserved due to abandoned requests.

---

# 35. ADMISSION + BED TRANSACTION

Where possible, use transactional coordination.

Example:

```text id="0wz7x7"
Reserve Bed
     +
Create Admission
     +
Assign Bed
```

If one operation fails:

```text id="m4e9yy"
Rollback or safely recover
```

Do not create:

```text id="rj8pyd"
Admission = ADMITTED
Bed = AVAILABLE
```

without an explicit exception state.

---

# 36. ADMISSION DOCUMENTS

Potential documents:

- admission form
- admission confirmation
- patient identification form
- consent documents where applicable
- accommodation assignment document
- insurance admission documents
- emergency registration document

Clinical/legal content must come from authorized sources.

RPA may populate approved templates but must not invent clinical information.

---

# 37. DOCUMENT GENERATION

Use the centralized:

```text id="t5n2m8"
Document Generation Service
```

Do not implement independent PDF generation in this module.

The admission module should submit:

```text id="nlqk8b"
documentType
patientId
admissionId
templateId
data
```

The Document Service handles rendering/storage/versioning.

---

# 38. PATIENT NOTIFICATION

After successful admission:

Use Notification Service.

Possible events:

```text id="4m0x7e"
ADMISSION_CONFIRMED
BED_ASSIGNED
ADMISSION_DOCUMENT_READY
```

SMS/email may contain:

```text id="l9v2j5"
Your hospital admission has been registered.

Admission ID:
ADM202610001

Ward:
Private Room

Bed:
P-03
```

Only include information appropriate for the channel.

---

# 39. RELATIVE / ATTENDANT NOTIFICATION

If hospital policy and consent allow, notifications may be sent to the authorized emergency contact/attendant.

Do not automatically expose sensitive information to arbitrary phone numbers.

Use stored authorized contact information.

---

# 40. DEPARTMENT NOTIFICATIONS

After admission, relevant departments may need notifications.

Examples:

- Nursing
- Housekeeping
- Pharmacy
- Laboratory
- Radiology
- Billing
- Insurance
- Admission Desk

Use internal notification/event mechanisms.

Do not send every event to every department.

Use role/department-specific routing.

---

# 41. BILLING INTEGRATION

Admission should create or update the billing context.

For example:

```text id="k5m2u3"
Admission
   ↓
Billing Account / Encounter
   ↓
Room Charges
   ↓
Services
   ↓
Final Billing
```

The admission module does not calculate all hospital charges.

Billing owns charge calculation.

---

# 42. INSURANCE INTEGRATION

Admission may trigger insurance verification if required.

Example:

```text id="zj4f7e"
Admission
   ↓
Insurance Details
   ↓
Insurance Verification
   ↓
Eligibility Result
```

Do not interpret coverage beyond the verified insurer response.

---

# 43. PHARMACY INTEGRATION

Admission may notify pharmacy/clinical systems that an inpatient admission exists.

The admission module does not prescribe or dispense medication.

---

# 44. LABORATORY INTEGRATION

Admission may create an inpatient context used by Laboratory Administration.

The admission module does not order tests unless an authorized clinical workflow explicitly creates the order.

---

# 45. RADIOLOGY INTEGRATION

Same principle:

```text id="b7j4k5"
Admission
   ↓
Radiology Orders
```

Orders are created by authorized clinical staff.

Admission does not interpret results.

---

# 46. PATIENT RECORDS INTEGRATION

Patient Records should consume:

```text id="6ytb4k"
patientId
visitId
admissionId
```

The admission module creates administrative context.

Clinical notes remain owned by Patient Records/Clinical workflows.

---

# 47. ADMISSION CHECKLIST

Create a configurable administrative checklist.

Example:

```text id="7j13r6"
Patient Identity Verified
Visit Verified
Admission Request Verified
Doctor Verified
Accommodation Preference Recorded
Insurance Information Recorded
Billing Account Created
Required Documents Available
Bed Assigned
Admission Confirmation Generated
Notifications Sent
```

Checklist items may be:

```text id="t5zqqp"
REQUIRED
OPTIONAL
CONDITIONAL
```

---

# 48. CHECKLIST STATUS

Each item:

```text id="9m44pm"
PENDING
COMPLETED
NOT_APPLICABLE
BLOCKED
EXCEPTION
```

The system must not allow an admission to be marked complete if required checklist items are unresolved unless an authorized override is used.

---

# 49. CHECKLIST OVERRIDE

Authorized staff may override a non-clinical checklist blocker if policy allows.

Require:

- reason
- user
- timestamp
- audit

Do not allow arbitrary overrides.

---

# 50. EMERGENCY ADMINISTRATIVE DEFERRAL

Emergency situations may require incomplete documentation.

The system should support:

```text id="j5s7s0"
ADMINISTRATIVE_COMPLETION_PENDING
```

Example:

```text id="5fh4sb"
Emergency care started
Identity incomplete
Insurance incomplete
```

The patient must still have a trackable administrative record.

Create tasks for later completion.

---

# 51. IDENTITY VERIFICATION STATUS

Possible:

```text id="1v9c3b"
VERIFIED
PENDING
TEMPORARY
FAILED
```

If temporary:

```text id="3k7tqa"
Patient ID:
TEMP-2026-00452
```

Later link to permanent Patient ID.

---

# 52. ADMISSION EXCEPTIONS

Create `ExceptionCase` for:

```text id="o0vyn3"
AMBIGUOUS_PATIENT
MISSING_IDENTITY_INFORMATION
NO_SUITABLE_BED
BED_RESERVATION_FAILURE
DUPLICATE_ACTIVE_ADMISSION
INSURANCE_VERIFICATION_FAILURE
BILLING_SETUP_FAILURE
EXTERNAL_SYSTEM_FAILURE
DOCUMENT_GENERATION_FAILURE
NOTIFICATION_FAILURE
ADMISSION_CHECKLIST_BLOCKED
```

---

# 53. NO SUITABLE BED

If no suitable bed exists:

```text id="5j0iql"
Admission Approved
       ↓
Bed Search
       ↓
No Suitable Bed
       ↓
BED_PENDING
       ↓
Notify Admission Desk
       ↓
Patient/Attendant Notification if configured
       ↓
Wait / Alternative / Authorized Decision
```

Do not automatically downgrade the patient.

---

# 54. BED WAITING LIST

If hospital supports waiting lists:

```text id="x3y7ap"
Admission
   ↓
Requested Category
   ↓
No Availability
   ↓
Waiting List
```

The waiting list belongs conceptually to Bed Management.

Admission should store the reference.

---

# 55. ADMISSION CANCELLATION

Before admission is finalized, an authorized user may cancel.

Example:

```text id="0d6ptg"
Admission Request
     ↓
CANCELLED
```

If a bed was reserved:

```text id="j86pwt"
Release Reservation
```

Do not delete the admission request.

Preserve history.

---

# 56. ADMISSION TRANSFER

Transfer is primarily managed by Bed Management.

Admission should support:

```text id="4sm48f"
currentWardId
currentBedId
```

Bed transfer history belongs to Bed Management.

Admission should consume the resulting assignment.

---

# 57. ADMISSION DISCHARGE RELATIONSHIP

Admission remains active until the discharge workflow completes.

Example:

```text id="q3shdj"
ADMITTED
    ↓
DISCHARGE_REQUESTED
    ↓
DISCHARGED
```

Discharge Processing owns the discharge workflow.

Admission provides the admission context.

---

# 58. MULTIPLE ADMISSIONS

A patient may have multiple admissions over time.

Example:

```text id="bhl1b5"
P10045

ADM202610001
06-Oct → 10-Oct

ADM202611002
21-Nov → 25-Nov
```

Do not overwrite historical admissions.

---

# 59. ACTIVE ADMISSION QUERY

Provide:

```http id="e1myxj"
GET /api/v1/admissions/active/:patientId
```

Return active admission if one exists.

This is used by:

- Billing
- Pharmacy
- Lab
- Radiology
- Clinical Portal
- Bed Management
- Discharge

---

# 60. ADMISSION API

Base:

```text id="xvkg75"
/api/v1/admissions
```

Required endpoints:

```text id="c9y3b9"
POST   /admission-requests
GET    /admission-requests/:id
GET    /admission-requests
POST   /admission-requests/:id/approve
POST   /admission-requests/:id/reject
POST   /admission-requests/:id/cancel

POST   /admissions
GET    /admissions/:admissionId
GET    /admissions
GET    /admissions/active/:patientId

POST   /admissions/:admissionId/complete-admission
```

---

# 61. CREATE ADMISSION REQUEST

```http id="1hljcm"
POST /api/v1/admission-requests
```

Example:

```json id="3nkg0u"
{
  "patientId": "P10045",
  "visitId": "V202610155",
  "source": "OPD",
  "requestedBy": "DOC1001",
  "accommodationPreference": "PRIVATE_ROOM",
  "clinicalRequirementReference": "CLINREQ-001"
}
```

The backend must verify that the requesting user is authorized.

---

# 62. APPROVE ADMISSION REQUEST

```http id="x7g3wv"
POST /api/v1/admission-requests/:id/approve
```

Body:

```json id="8dfp82"
{
  "reason": "Approved according to hospital admission workflow"
}
```

Only authorized roles may approve.

---

# 63. REJECT ADMISSION REQUEST

```http id="yb75qi"
POST /api/v1/admission-requests/:id/reject
```

Require:

```json id="0f5hjg"
{
  "reason": "Administrative reason"
}
```

Do not allow arbitrary rejection by unauthorized users.

---

# 64. COMPLETE ADMISSION

After bed assignment and required administrative checks:

```http id="dskxpv"
POST /api/v1/admissions/:admissionId/complete-admission
```

Backend verifies:

```text id="qzjv7h"
Admission approved
Bed assigned
Required checklist complete
Identity status acceptable
No blocking exception
```

Then:

```text id="s0wz5s"
Admission → ADMITTED
```

---

# 65. FRONTEND ROUTES

Operations:

```text id="f3dy4h"
/operations/admissions
/operations/admissions/requests
/operations/admissions/:requestId
/operations/admissions/emergency
/operations/admissions/:admissionId
```

Clinical:

```text id="1e3j67"
/clinical/admissions
/clinical/admission-requests
```

Patient:

```text id="0w7y4n"
/patient/admissions
/patient/admissions/:admissionId
```

---

# 66. ADMISSION REQUEST UI

Doctor/authorized clinical user:

```text id="mmb3qh"
Patient:
Rahul Shah
Patient ID:
P10045

Visit:
V202610155

Admission Required:
[Yes]

Accommodation Preference:
[Private Room]

Clinical Requirement Reference:
[CLINREQ-001]

[Submit Admission Request]
```

The clinical requirement content itself should come from authorized clinical records.

---

# 67. ADMISSION DESK UI

Display:

```text id="p9h9pg"
Admission Requests

Request ID
Patient
Source
Doctor
Preference
Status
Bed Status
Created At
```

Actions:

```text id="d7m6qf"
View
Approve
Reject
Find Bed
Open Exception
```

---

# 68. BED SELECTION UI

When appropriate:

```text id="s2k8hm"
Admission:
ADM202610001

Clinical Requirement:
General Ward

Patient Preference:
Private

Available Categories:
General Ward
Semi-Private
Private

Available Beds:
P-01
P-02
P-03
```

The UI must make clear that physical bed assignment is subject to authorized rules.

---

# 69. EMERGENCY ADMISSION UI

Emergency registration screen:

```text id="r1v7br"
Emergency Admission

Search Patient:
[Patient ID / Mobile / Name]

[Search]

If not found:
[Create Temporary Emergency Record]
```

After temporary identity:

```text id="2t8d3f"
Temporary ID:
TEMP-2026-00452
```

Then continue admission workflow.

---

# 70. PATIENT ADMISSION VIEW

Patient should see appropriate information:

```text id="y08vwx"
Admission ID:
ADM202610001

Admission Date:
06 Oct 2026

Status:
ADMITTED

Ward:
Private Room

Bed:
P-03
```

Do not expose internal workflow details or confidential staff notes.

---

# 71. NOTIFICATION EVENTS

Recommended:

```text id="f6t6do"
admission.requested
admission.approved
admission.bed.assigned
admission.completed
admission.exception
admission.cancelled
```

Notification Service handles actual delivery.

---

# 72. RPA RESPONSIBILITY

RPA may:

- read approved admission requests
- validate administrative fields
- synchronize admission into legacy systems
- search bed availability through legacy interfaces
- enter approved admission data
- capture external admission number
- verify successful admission
- generate approved documents
- notify departments
- reconcile admission records
- create exception cases
- retry failed administrative tasks

RPA must NOT:

- decide admission necessity
- determine medical priority
- choose clinical treatment
- decide ICU requirement
- override clinical requirements
- downgrade required accommodation
- approve admission outside its configured authorization

---

# 73. RPA ADMISSION WORKFLOW

```text id="fxh5w4"
Admission Request
       ↓
READ
       ↓
VALIDATE
       ↓
CHECK APPROVAL
       ↓
CHECK PATIENT IDENTITY
       ↓
CHECK BED STATUS
       ↓
APPLY CONFIGURED ADMIN RULES
       ↓
ACT
       ↓
VERIFY
       ↓
UPDATE MERN
       ↓
NOTIFY
       ↓
AUDIT
```

---

# 74. RPA LEGACY SYSTEM INTEGRATION

If a legacy admission system exists:

```text id="k2lql5"
MERN Admission Approved
       ↓
RPA Job
       ↓
Login Legacy System
       ↓
Search Patient
       ↓
Enter Admission
       ↓
Select Approved Bed
       ↓
Submit
       ↓
Verify External Admission ID
       ↓
Update MERN
```

If a reliable API exists, prefer API integration.

---

# 75. RPA FAILURE

Example:

```text id="jz8k4g"
MERN:
ADMISSION APPROVED

Legacy:
FAILED
```

Do not mark the admission completed unless verification succeeds.

Create:

```text id="f4lq9m"
ExceptionCase
type = ADMISSION_EXTERNAL_SYNC_FAILURE
```

Retry according to policy.

---

# 76. RPA VERIFICATION

After external submission, verify:

- success response
- external admission ID
- patient record
- admission status
- bed assignment

Never assume that pressing Save succeeded.

---

# 77. RPA FOLDER STRUCTURE

Extend:

```text id="rb8xw6"
robot/
├── resources/
│   ├── admission_keywords.resource
│   ├── bed_keywords.resource
│   ├── patient_keywords.resource
│   ├── api_keywords.resource
│   └── notification_keywords.resource
│
├── keywords/
│   ├── admission_request.resource
│   ├── emergency_admission.resource
│   ├── admission_processing.resource
│   ├── admission_sync.resource
│   └── admission_reconciliation.resource
│
├── tests/
│   ├── opd_admission.robot
│   ├── emergency_admission.robot
│   ├── bed_assignment.robot
│   └── admission_sync.robot
│
└── results/
```

---

# 78. RBAC

## Patient

Can:

- view own admission
- view admission status
- view assigned ward/bed where permitted
- receive notifications
- view admission documents permitted to patient

Cannot:

- create clinical admission decisions
- approve admission
- assign beds
- modify admission status

---

## Receptionist

Can:

- initiate administrative admission workflows
- search patient
- verify identity
- process approved admission requests
- coordinate admission

Cannot:

- make clinical admission decisions unless separately authorized.

---

## Doctor

Can:

- create admission request
- provide clinical requirement reference
- approve/authorize according to hospital policy

Cannot:

- override system security controls.

---

## Nurse

Can:

- view admission information
- perform authorized operational tasks
- update permitted admission checklist items

Cannot:

- independently decide admission.

---

## Billing Staff

Can:

- view required admission/billing information

Cannot:

- approve clinical admission.

---

## Administrative Manager

Can:

- approve configured administrative admission workflows
- resolve exceptions
- view admission operations
- manage admission policies where authorized

---

## System Admin

Can manage technical configuration.

Must still follow least privilege for patient information.

---

# 79. AUDIT EVENTS

Record:

```text id="g4ef6a"
ADMISSION_REQUEST_CREATED
ADMISSION_REQUEST_VIEWED
ADMISSION_REQUEST_APPROVED
ADMISSION_REQUEST_REJECTED
ADMISSION_REQUEST_CANCELLED
ADMISSION_VALIDATION_STARTED
ADMISSION_VALIDATION_COMPLETED
ADMISSION_BED_SEARCH_STARTED
ADMISSION_BED_ASSIGNED
ADMISSION_CREATED
ADMISSION_COMPLETED
ADMISSION_EXCEPTION_CREATED
ADMISSION_EXCEPTION_RESOLVED
TEMPORARY_EMERGENCY_ID_CREATED
TEMPORARY_EMERGENCY_LINKED
ADMISSION_DOCUMENT_GENERATED
ADMISSION_NOTIFICATION_SENT
```

---

# 80. CORRELATION ID

Every admission workflow must have:

```text id="1p1qbc"
CORR-ADM-20261006-000001
```

Use the same correlation ID across:

- Admission Request
- Admission
- Bed assignment
- RPA Job
- Notification
- Document
- Audit
- Exception

---

# 81. EXCEPTION QUEUE

Admission exceptions should be visible in an operations exception queue.

Example:

```text id="m3z7k0"
Admission Exceptions

ID
Type
Patient
Admission
Severity
Status
Assigned To
Created At
```

Actions:

```text id="h0ng7g"
View
Retry
Resolve
Escalate
Close
```

---

# 82. DATA PRIVACY

Admission records may contain sensitive information.

Implement:

- role-based access
- field-level restrictions where needed
- audit logging
- document access control
- secure APIs
- sensitive-data masking
- no unnecessary information in notifications
- no sensitive data in URL parameters where avoidable

---

# 83. API AUTHORIZATION

Every admission endpoint must enforce backend authorization.

Never rely on frontend hiding buttons.

Example:

```text id="iymqtc"
POST /admission-requests/:id/approve
```

must verify:

```text id="q3xpy3"
authenticated user
+
authorized role
+
permission
+
valid workflow state
```

---

# 84. API ERROR FORMAT

Example:

```json id="prfj3x"
{
  "success": false,
  "error": {
    "code": "NO_SUITABLE_BED",
    "message": "No suitable bed is currently available for this admission request.",
    "correlationId": "CORR-ADM-20261006-000001"
  }
}
```

Do not expose internal stack traces.

---

# 85. IDEMPOTENCY

Admission request submission must be idempotent.

If a doctor clicks submit twice:

```text id="6m3b3r"
Request 1 → ADMREQ-001
Request 2 → existing request
```

Do not create duplicate admission requests.

Similarly, completing admission must not create multiple Admission IDs.

---

# 86. CONCURRENCY

Protect against:

- two admission staff selecting the same bed
- duplicate admission approval
- duplicate admission completion
- concurrent emergency registration
- duplicate external synchronization

Bed Management must provide concurrency-safe reservation.

---

# 87. ACTIVE ADMISSION VALIDATION

Before completion:

```text id="a3f1lc"
Check:
Patient
Visit
Admission Request
Existing Admissions
Bed
Approval
Checklist
```

If another active admission exists:

```text id="yaf2yc"
Potential duplicate active admission
```

Create an exception.

---

# 88. TRANSACTIONAL ADMISSION COMPLETION

Admission completion may involve:

```text id="0xjj1r"
Admission
Bed Assignment
Admission Checklist
Billing Context
Notification Event
Audit Event
```

Use transactions/event patterns where appropriate.

External actions should be tracked separately.

---

# 89. SEED DATA

Create demo data:

### Patients

```text id="i3v5x6"
P10001 — Rahul Shah
P10002 — Priya Patel
P10003 — Amit Mehta
```

### Doctors

```text id="s8n0xl"
DOC1001 — Dr. Patel
DOC1002 — Dr. Mehta
```

### Admission Requests

```text id="f3d3fk"
ADMREQ1001 — OPD — P10001
ADMREQ1002 — Emergency — P10002
ADMREQ1003 — OPD — P10003
```

Statuses:

```text id="q6m6a4"
PENDING_APPROVAL
BED_PENDING
BED_ASSIGNED
```

### Beds

Use Bed Management seed data.

---

# 90. DEMO SCENARIO — OPD ADMISSION

Patient:

```text id="a3tq6f"
P10045
```

Visit:

```text id="e6b7qy"
V202610155
```

Doctor submits admission request.

```text id="6cwxh0"
ADMREQ202610001
```

System validates.

Authorized approval occurs.

Bed Management returns:

```text id="01o1hb"
Private
P-03
AVAILABLE
```

Bed is reserved.

Admission created:

```text id="k9q7p9"
ADM202610001
```

Expected:

```text id="m4y8i7"
Admission = ADMITTED
Bed = OCCUPIED
```

---

# 91. DEMO SCENARIO — EMERGENCY UNKNOWN PATIENT

Unknown patient arrives.

System:

```text id="w2xjqs"
TEMP-2026-00452
```

Emergency Visit created.

Authorized doctor requests admission.

Bed assignment occurs.

Admission:

```text id="q4w4mz"
ADM202610002
```

Later patient identity is confirmed:

```text id="5q5d5k"
TEMP-2026-00452
       ↓
P10045
```

Admission history remains intact.

---

# 92. DEMO SCENARIO — NO BED AVAILABLE

Patient requires a configured accommodation category.

No suitable bed exists.

Expected:

```text id="bq0p5k"
Admission Request:
APPROVED

Bed:
PENDING

Exception:
NO_SUITABLE_BED
```

System does not automatically downgrade accommodation.

---

# 93. DEMO SCENARIO — ACTIVE ADMISSION

Patient already has:

```text id="3v9p3p"
ADM202610001
ADMITTED
```

Another admission request arrives.

Expected:

```text id="8jy5bn"
DUPLICATE_ACTIVE_ADMISSION
```

Human review required.

---

# 94. DEMO SCENARIO — EMERGENCY INCOMPLETE INFORMATION

Emergency patient has:

```text id="t6ps8w"
Unknown name
Unknown insurance
Temporary identity
```

System allows:

```text id="a5t9o7"
Emergency administrative record
+
Temporary ID
+
Admission workflow
```

Missing information becomes:

```text id="0duyca"
ADMINISTRATIVE_COMPLETION_PENDING
```

Do not block necessary emergency care merely because non-critical administrative fields are incomplete.

---

# 95. TESTING REQUIREMENTS

## Unit Tests

Test:

- Admission ID generation
- duplicate active admission detection
- admission status transitions
- accommodation preference handling
- approval validation
- checklist logic
- emergency identity handling
- idempotency
- permission checks

---

# 96. API TESTS

Test:

```text id="1a4tpg"
POST /admission-requests
GET /admission-requests
GET /admission-requests/:id
POST /admission-requests/:id/approve
POST /admission-requests/:id/reject
POST /admission-requests/:id/cancel

POST /admissions
GET /admissions/:id
GET /admissions
GET /admissions/active/:patientId
POST /admissions/:id/complete-admission
```

---

# 97. INTEGRATION TESTS

Verify:

```text id="b0h5jk"
Patient
 ↓
Visit
 ↓
Admission Request
 ↓
Approval
 ↓
Bed Management
 ↓
Admission
 ↓
Notification
 ↓
Billing
 ↓
Insurance
 ↓
Patient Records
```

---

# 98. ROBOT FRAMEWORK TEST CASES

At minimum:

```text id="o1syom"
TC-ADM-001 OPD admission request
TC-ADM-002 Admission approval
TC-ADM-003 Admission rejection
TC-ADM-004 Bed availability check
TC-ADM-005 Bed reservation
TC-ADM-006 Admission completion
TC-ADM-007 Emergency admission
TC-ADM-008 Temporary emergency identity
TC-ADM-009 Temporary identity linking
TC-ADM-010 Duplicate active admission
TC-ADM-011 No suitable bed
TC-ADM-012 External system synchronization
TC-ADM-013 External synchronization failure
TC-ADM-014 Admission notification
TC-ADM-015 Admission document generation
TC-ADM-016 Administrative completion pending
TC-ADM-017 Unauthorized admission approval
```

---

# 99. SECURITY TESTS

Verify:

- patient cannot approve own admission
- patient cannot assign bed
- receptionist cannot make unauthorized clinical decisions
- unauthorized staff cannot approve admission
- patient cannot view another patient's admission
- sensitive admission information is protected
- emergency temporary records are protected
- audit records cannot be modified by normal users

---

# 100. ACCEPTANCE CRITERIA

## OPD Admission

- Doctor/authorized clinical staff can submit admission request.
- Patient and Visit are correctly linked.
- Administrative workflow validates request.
- Bed Management is queried.
- Appropriate bed can be assigned.
- Admission ID is generated.
- Admission record is created.
- Notifications are generated.
- Audit events are recorded.

## Emergency Admission

- Emergency patients can enter without prior appointment.
- Existing patients can be identified.
- Unknown patients receive temporary IDs.
- Temporary records can later be linked.
- Emergency administrative workflow can continue with incomplete non-critical information.
- No duplicate permanent Patient ID is created.

## Bed

- Patient preference is separate from physical bed.
- Clinical requirement is separate from preference.
- No automatic downgrade occurs.
- Bed reservation is concurrency-safe.

## Security

- RBAC is enforced.
- Admission approval is protected.
- Patient data is protected.
- Audit trail exists.

## RPA

- RPA can synchronize approved admission workflows.
- RPA verifies external actions.
- RPA creates exceptions for failures.
- RPA does not make medical decisions.

---

# 101. DEFINITION OF DONE

Do not consider the module complete until all of the following exist:

```text id="r0j35f"
Admission Request
+
OPD Admission
+
Emergency Admission
+
Temporary Emergency Identity
+
Admission Approval
+
Admission ID Generation
+
Bed Management Integration
+
Accommodation Preference
+
Clinical Requirement Reference
+
Admission Checklist
+
Admission Completion
+
Notification Integration
+
Document Integration
+
Billing Integration
+
Insurance Integration
+
Patient Records Integration
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

# 102. IMPLEMENTATION ORDER

The AI coding agent should implement in this order:

### Step 1
Create:

```text id="u8b9b7"
AdmissionRequest
Admission
AdmissionChecklist
```

### Step 2
Implement Admission ID generation.

### Step 3
Implement admission request validation.

### Step 4
Implement active-admission detection.

### Step 5
Implement approval workflow.

### Step 6
Integrate Patient Registration.

### Step 7
Integrate Visit.

### Step 8
Integrate Bed Management.

### Step 9
Implement bed reservation/assignment integration.

### Step 10
Implement admission completion.

### Step 11
Implement emergency admission.

### Step 12
Implement temporary emergency identity integration.

### Step 13
Implement checklist.

### Step 14
Integrate Billing.

### Step 15
Integrate Insurance.

### Step 16
Integrate Patient Records.

### Step 17
Integrate Notification Service.

### Step 18
Integrate Document Generation.

### Step 19
Implement RBAC.

### Step 20
Implement Audit Logging.

### Step 21
Implement Exception Management.

### Step 22
Implement RPA workflows.

### Step 23
Implement frontend screens.

### Step 24
Implement unit/API/integration tests.

### Step 25
Implement Robot Framework tests.

### Step 26
Add seed/demo data.

### Step 27
Run complete end-to-end scenarios.

---

# 103. DO NOT IMPLEMENT

Do not implement inside this module:

- autonomous medical admission decisions
- clinical diagnosis
- treatment decisions
- ICU clinical eligibility decisions
- discharge decisions
- medication decisions
- laboratory interpretation
- radiology interpretation
- independent bed inventory
- insurance approval decisions
- final billing calculation
- procurement
- payroll

Use the appropriate module/service.

---

# 104. FINAL ARCHITECTURAL RULE

Maintain the following separation:

```text id="2jmwqd"
PATIENT
Permanent identity
        |
        v
VISIT
Hospital encounter
        |
        v
ADMISSION REQUEST
Authorized request for inpatient admission
        |
        v
APPROVAL
Administrative/authorized workflow
        |
        v
BED MANAGEMENT
Find/reserve/assign physical accommodation
        |
        v
ADMISSION
Inpatient episode
        |
        v
BILLING / INSURANCE / CLINICAL / SERVICES
```

For emergency:

```text id="j7n7qk"
EMERGENCY ARRIVAL
       ↓
PATIENT MASTER SEARCH
       ↓
Existing Patient OR Temporary Emergency ID
       ↓
Emergency Visit
       ↓
Authorized Clinical Admission Decision
       ↓
Administrative Admission
       ↓
Bed Assignment
       ↓
Admission
```

The most important rule is:

> **The hospital's authorized clinical staff decides that a patient requires admission. The application and Robot Framework execute, verify, synchronize, notify, document, and audit that decision. They do not make the medical decision themselves.**

A second critical rule is:

> **Patient accommodation preference never silently overrides a clinical requirement, and an unavailable preferred category must never cause an automatic downgrade.**

A third critical rule is:

> **Emergency patients may begin the emergency workflow with incomplete administrative information, but every temporary identity and later identity-linking action must remain traceable and auditable.**