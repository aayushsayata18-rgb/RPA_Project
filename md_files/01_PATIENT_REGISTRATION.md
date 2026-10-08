# 01 — PATIENT REGISTRATION & IDENTITY MANAGEMENT

## 1. MODULE IDENTIFICATION

**File:** `01_PATIENT_REGISTRATION.md`

**Module Name:** Patient Registration & Identity Management

**System:** Hospital Administrative Automation & RPA Platform

**Architecture:** MERN + Robot Framework

**Frontend:** React.js

**Backend:** Node.js + Express.js

**Database:** MongoDB + Mongoose

**Automation:** Robot Framework

**API Style:** REST

**Primary Portal(s):**
- Patient Portal
- Operations Portal

**Primary Roles:**
- Patient
- Receptionist
- System Admin
- Administrative Manager

**Related Roles:**
- Doctor
- Nurse
- Billing Staff
- Insurance Representative
- Laboratory Technician
- Radiology Technician
- Other authorized hospital staff

---

# 2. INSTRUCTION TO THE AI CODING AGENT

You are implementing the **Patient Registration & Identity Management module** of a production-style hospital administrative platform.

Do NOT build this as a simple CRUD page.

The module must provide a complete, secure, auditable patient registration workflow supporting:

1. Online self-registration
2. Front-desk registration
3. Existing-patient identification
4. Duplicate-patient prevention
5. Permanent Patient ID generation
6. Visit ID generation
7. Emergency patient registration
8. Temporary emergency identity handling
9. Identity verification
10. Patient profile updates
11. Registration confirmation
12. SMS/email notifications through the centralized Notification Service
13. Registration documents/receipts where applicable
14. Audit logging
15. RBAC
16. Exception handling
17. RPA-assisted administrative automation
18. Human review for ambiguous identity matches

The implementation must integrate with the rest of the hospital platform.

Do not create a separate standalone patient database.

The **Patient Master is the central source of truth for patient identity**.

---

# 3. CORE DESIGN PRINCIPLE

The most important architectural rule of this module is:

> **Patient Identity and Patient Encounter are different concepts.**

A patient has one permanent identity.

Every time the patient visits the hospital, a new encounter/visit is created.

Therefore:

```text
PATIENT
  |
  |--- Patient ID: P10045
  |
  |--- Visit 1: V202600001
  |
  |--- Visit 2: V202600145
  |
  |--- Visit 3: V202601002
  |
  |--- Admission 1: ADM20260021
  |
  |--- Admission 2: ADM20260103
```

Never create a new Patient ID merely because the patient visits the hospital again.

---

# 4. REGISTRATION CHANNELS

The system must support exactly two primary patient registration channels.

## 4.1 Online Self-Registration

Patient registers through the Patient Portal.

Typical flow:

```text
Patient
   |
   v
Registration Form
   |
   v
Validate Input
   |
   v
Search Patient Master
   |
   +--------------------+
   |                    |
Existing Patient       No Match
   |                    |
   v                    v
Verify Identity       Create Patient
   |                    |
   +---------+----------+
             |
             v
       Create Visit
             |
             v
      Registration ID
             |
             v
Confirmation
             |
             v
SMS + Email
```

---

# 5. FRONT-DESK REGISTRATION

Receptionist can register a patient from the Operations Portal.

Flow:

```text
Receptionist
     |
     v
Search Existing Patient
     |
     +------------------------+
     |                        |
Existing Patient            No Match
     |                        |
     v                        v
Verify Details            New Patient
     |                        |
     +------------+-----------+
                  |
                  v
            Create Visit
                  |
                  v
        Registration Complete
                  |
                  v
        Receipt / Notification
```

The receptionist must not create a duplicate permanent patient when an existing patient can be confidently identified.

---

# 6. PATIENT IDENTITY MODEL

## 6.1 Patient ID

`Patient ID` is the permanent identity identifier.

Example:

```text
P10045
```

Properties:

- unique
- immutable
- never reused
- never regenerated for the same person
- must not be deleted as a normal business operation
- must not change because of a new visit
- must be referenced by visits, admissions, billing, insurance, pharmacy, laboratory, radiology and other modules

---

# 7. VISIT ID

Every registration/encounter creates a new Visit.

Example:

```text
Patient ID: P10045

Visit 1:
V202600001

Visit 2:
V202600891
```

A Visit represents a specific hospital encounter.

The visit may later be associated with:

- Appointment
- OPD Token
- Admission
- Laboratory orders
- Radiology orders
- Pharmacy orders
- Billing
- Insurance
- Discharge

---

# 8. APPOINTMENT ID

An appointment is not the same as registration.

Example:

```text
Patient ID: P10045
Appointment ID: A202600501
Visit ID: V202600881
```

Depending on hospital workflow, the Visit may be created during registration/check-in according to the configured workflow.

Do not duplicate appointment data into the Patient Master.

---

# 9. PATIENT MASTER

The Patient Master contains long-term identity and demographic information.

It must NOT contain temporary encounter-specific information.

## Patient Master should contain:

- Patient ID
- First Name
- Middle Name
- Last Name
- Full Name
- Date of Birth
- Gender
- Mobile Number
- Email
- Address
- City
- State
- Country
- Postal Code
- Emergency Contact
- Blood Group if hospital policy permits
- Government ID reference if permitted
- Insurance references
- Communication preferences
- Identity verification status
- Registration source
- Patient status
- Created timestamp
- Updated timestamp
- Created by
- Updated by

---

# 10. VISIT ENTITY

The Visit entity should contain encounter-specific information.

Recommended fields:

```text
visitId
patientId
visitType
registrationSource
department
appointmentId
checkInStatus
visitStatus
visitDate
startTime
endTime
createdBy
createdAt
updatedAt
```

Possible `visitType` values:

```text
OPD
EMERGENCY
FOLLOW_UP
DIAGNOSTIC
OTHER
```

Do not hardcode unsupported visit types throughout the frontend.

Use configuration/enums.

---

# 11. REGISTRATION SOURCES

The system must distinguish:

```text
ONLINE_SELF_REGISTRATION
FRONT_DESK
EMERGENCY
```

Emergency registration is a workflow variant, not a separate Patient Master.

---

# 12. PATIENT STATUS

Recommended patient statuses:

```text
ACTIVE
INACTIVE
TEMPORARY_EMERGENCY
IDENTITY_PENDING
MERGED
```

Do not allow ordinary users to manually change these statuses.

Status changes must follow controlled workflows.

---

# 13. ONLINE REGISTRATION UI

Create a React page:

```text
/register
```

or equivalent route according to the application's routing convention.

The page must contain a professional hospital registration form.

## Required sections

### Personal Information

Fields:

- First Name
- Middle Name
- Last Name
- Date of Birth
- Gender

### Contact Information

Fields:

- Mobile Number
- Email
- Address
- City
- State
- Country
- Postal Code

### Emergency Contact

Fields:

- Contact Name
- Relationship
- Mobile Number

### Identity Information

Where legally and operationally permitted:

- Government ID type
- Government ID reference

Do not expose sensitive ID numbers unnecessarily in the UI.

---

# 14. FORM VALIDATION

Frontend validation must provide immediate feedback.

Backend validation is mandatory even when frontend validation exists.

Never trust client-side validation.

## Required validations

### Name

- required
- reasonable length
- reject obviously invalid values
- trim whitespace

### Date of Birth

- required where hospital policy requires it
- must be a valid date
- cannot be an impossible future date

### Mobile Number

- required
- valid format
- normalized before storage

### Email

- validate format
- normalize case where appropriate

### Address

- trim whitespace
- enforce reasonable maximum length

### Postal Code

- validate according to configured country rules

### Emergency Contact

Must not silently equal the patient unless hospital policy explicitly allows it.

---

# 15. DUPLICATE PATIENT DETECTION

Duplicate prevention is one of the most important functions of this module.

The system must search the Patient Master before creating a new patient.

Potential matching attributes:

- mobile number
- email
- government ID reference
- full name
- date of birth
- gender
- other configured identity attributes

Do NOT rely on only one field for identity matching.

---

# 16. MATCHING STRATEGY

The system should classify matches.

## Exact Match

Example:

```text
Mobile = 9876543210
Government ID = matching
Date of Birth = matching
```

Result:

```text
HIGH_CONFIDENCE_MATCH
```

The system may retrieve the existing Patient ID.

---

## Possible Match

Example:

```text
Name matches
DOB matches
Mobile differs
```

Result:

```text
POSSIBLE_MATCH
```

Do NOT automatically select the patient.

Send to human verification.

---

## No Match

If no meaningful match exists:

```text
NO_MATCH
```

The system may create a new permanent Patient ID.

---

# 17. HUMAN IDENTITY VERIFICATION

If multiple possible patients are found, display:

```text
Potential Existing Patients
----------------------------------
Patient ID | Name | DOB | Mobile | Match
P10045     | ...  | ... | ...    | 92%
P10201     | ...  | ... | ...    | 78%
```

Authorized staff must verify identity.

Available actions:

```text
Confirm Existing Patient
Create New Patient
Request More Information
Cancel
```

The system must record the decision.

---

# 18. NEVER AUTO-MERGE PATIENTS

The system must NOT automatically merge patient identities based only on similarity.

Patient merging is a high-risk identity operation.

If duplicate identity is suspected:

```text
Create Exception Case
        |
        v
Human Review
        |
        v
Approved Merge / No Merge
```

A future dedicated patient-master governance workflow may handle merging.

This module must not silently merge records.

---

# 19. EXISTING PATIENT REGISTRATION

When an existing patient is identified:

```text
Existing Patient Found
        |
        v
Retrieve Patient ID
        |
        v
Display Existing Profile
        |
        v
Verify/Update Permitted Details
        |
        v
Create New Visit
        |
        v
Registration Complete
```

Example:

```text
Patient ID: P10045
Name: Rahul Shah

New Visit:
V202610001
```

Do not create:

```text
P10046
```

for the same patient.

---

# 20. PROFILE UPDATE RULES

Patients may update permitted information.

Examples:

Allowed:

- phone number
- email
- address
- communication preference

Sensitive fields may require staff verification depending on hospital policy.

Examples:

- date of birth
- government identity
- legal name
- gender where legally regulated

Every important modification must generate an audit event.

---

# 21. EMERGENCY REGISTRATION

Emergency registration must support patients who arrive without a known hospital record.

The system must first search the central Patient Master.

Flow:

```text
Emergency Patient Arrives
          |
          v
Search Patient Master
          |
          +---------------------+
          |                     |
Confident Match             No Match
          |                     |
          v                     v
Retrieve Patient ID      Create Temporary Record
          |                     |
          |                     v
          |                TEMP ID
          |                     |
          +----------+----------+
                     |
                     v
              Emergency Visit
                     |
                     v
             Emergency Workflow
```

---

# 22. TEMPORARY EMERGENCY ID

Example:

```text
TEMP-2026-00452
```

The temporary identifier must clearly indicate that it is not a permanent Patient ID.

Recommended fields:

```text
temporaryEmergencyId
temporaryRecordStatus
createdAt
createdBy
identityVerificationStatus
linkedPatientId
```

---

# 23. EMERGENCY IDENTITY LINKING

After the patient's identity becomes known:

```text
Temporary Emergency Record
          |
          v
Identity Verification
          |
          v
Find Existing Patient
          |
          +----------------------+
          |                      |
Existing Patient            Truly New Patient
          |                      |
          v                      v
Link Temporary Record       Create Permanent Patient
          |                      |
          +----------+-----------+
                     |
                     v
             Preserve History
```

Do not delete emergency history.

All clinical/administrative records associated with the temporary encounter must remain traceable.

---

# 24. PATIENT REGISTRATION WORKFLOW

## Standard workflow

```text
START
  |
  v
Receive Registration Request
  |
  v
Validate Input
  |
  v
Search Patient Master
  |
  +----------------------+
  |                      |
Existing Patient        No Match
  |                      |
  v                      v
Verify Identity       Create Patient
  |                      |
  +----------+-----------+
             |
             v
       Generate/Resolve
        Patient ID
             |
             v
       Create Visit ID
             |
             v
       Save Registration
             |
             v
 Generate Registration Record
             |
             v
 Send Confirmation
             |
             v
       Audit Event
             |
             v
            END
```

---

# 25. REGISTRATION STATUS

Recommended statuses:

```text
DRAFT
SUBMITTED
VALIDATING
IDENTITY_MATCH_PENDING
IDENTITY_VERIFICATION_REQUIRED
REGISTERED
FAILED
CANCELLED
```

For normal successful registration:

```text
DRAFT
  ↓
SUBMITTED
  ↓
VALIDATING
  ↓
REGISTERED
```

For ambiguous identity:

```text
SUBMITTED
  ↓
VALIDATING
  ↓
IDENTITY_VERIFICATION_REQUIRED
  ↓
REGISTERED
```

---

# 26. REGISTRATION RECORD

If the system needs a registration transaction entity separate from Patient and Visit, create:

```text
Registration
```

Suggested fields:

```text
registrationId
patientId
visitId
source
status
submittedBy
registrationDate
verificationStatus
matchResult
reviewedBy
reviewedAt
failureReason
correlationId
createdAt
updatedAt
```

This provides an audit-friendly registration transaction.

---

# 27. MONGODB DATA MODEL

## Patient

Suggested Mongoose schema:

```text
Patient {
    patientId: String,
    firstName: String,
    middleName: String,
    lastName: String,
    fullName: String,

    dateOfBirth: Date,
    gender: String,

    mobile: String,
    email: String,

    address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    },

    emergencyContact: {
        name: String,
        relationship: String,
        mobile: String
    },

    identityDocuments: [
        {
            type: String,
            reference: String,
            verified: Boolean,
            verifiedAt: Date,
            verifiedBy: ObjectId
        }
    ],

    communicationPreferences: {
        sms: Boolean,
        email: Boolean
    },

    status: String,

    registrationSource: String,

    createdAt: Date,
    updatedAt: Date,

    createdBy: ObjectId,
    updatedBy: ObjectId
}
```

---

# 28. IMPORTANT DATABASE INDEXES

Create indexes for frequently searched fields.

Recommended:

```text
patientId: unique
mobile
email
dateOfBirth
governmentIdReference
```

Do NOT make every field unique.

For example, family members may share:

- address
- landline
- sometimes email

Therefore uniqueness rules must be carefully designed.

---

# 29. VISIT MODEL

Recommended:

```text
Visit {
    visitId: String,
    patientId: ObjectId,

    visitType: String,

    registrationId: ObjectId,
    appointmentId: ObjectId,

    departmentId: ObjectId,

    visitDate: Date,

    status: String,

    checkInStatus: String,

    createdAt: Date,
    updatedAt: Date,

    createdBy: ObjectId
}
```

Index:

```text
visitId: unique
patientId
visitDate
status
```

---

# 30. REGISTRATION MODEL

Recommended:

```text
Registration {
    registrationId: String,

    patientId: ObjectId,
    visitId: ObjectId,

    source: String,

    status: String,

    identityMatchStatus: String,

    submittedBy: ObjectId,
    reviewedBy: ObjectId,

    submittedAt: Date,
    reviewedAt: Date,

    failureReason: String,

    correlationId: String,

    createdAt: Date,
    updatedAt: Date
}
```

---

# 31. TEMPORARY EMERGENCY RECORD MODEL

Recommended:

```text
EmergencyTemporaryRecord {
    temporaryId: String,

    temporaryEmergencyId: String,

    provisionalName: String,
    estimatedAge: Number,
    gender: String,

    discoveredPatientId: ObjectId,

    linkedPatientId: ObjectId,

    identityVerificationStatus: String,

    status: String,

    createdAt: Date,
    updatedAt: Date,

    createdBy: ObjectId
}
```

Do not duplicate complete patient data unnecessarily.

---

# 32. BACKEND API DESIGN

Implement REST APIs under a consistent namespace such as:

```text
/api/v1/patients
/api/v1/registrations
/api/v1/visits
```

---

## 32.1 Search Patients

```http
GET /api/v1/patients/search
```

Supported parameters:

```text
patientId
mobile
email
name
dateOfBirth
```

Response:

```json
{
  "success": true,
  "data": {
    "matches": [],
    "matchStatus": "NO_MATCH"
  }
}
```

---

# 33. CREATE PATIENT

```http
POST /api/v1/patients
```

Request:

```json
{
  "firstName": "Rahul",
  "lastName": "Shah",
  "dateOfBirth": "1998-05-10",
  "gender": "MALE",
  "mobile": "9876543210",
  "email": "rahul@example.com"
}
```

Backend must:

1. validate input
2. normalize data
3. check duplicate
4. generate Patient ID
5. save Patient
6. create audit event
7. return Patient ID

---

# 34. CREATE REGISTRATION

```http
POST /api/v1/registrations
```

The API must orchestrate:

```text
Validation
→ Identity Search
→ Existing/New Decision
→ Patient Resolution
→ Visit Creation
→ Registration Creation
→ Notification Event
→ Audit Event
```

Do not place the entire workflow directly inside a route handler.

Use service-layer architecture.

Recommended:

```text
registration.controller.js
registration.service.js
registration.validator.js
patientMatching.service.js
visit.service.js
```

---

# 35. UPDATE PATIENT

```http
PATCH /api/v1/patients/:patientId
```

Use field-level authorization.

A patient should not be able to update administrative fields.

Example:

Patient can update:

```text
mobile
email
address
communicationPreferences
```

Patient should not directly update:

```text
patientId
status
identityVerificationStatus
createdAt
```

---

# 36. GET PATIENT

```http
GET /api/v1/patients/:patientId
```

Return only data allowed for the requesting role.

Do not expose sensitive information unnecessarily.

---

# 37. CREATE VISIT

```http
POST /api/v1/visits
```

Must require:

```text
patientId
visitType
```

Optional:

```text
appointmentId
departmentId
```

Generate unique Visit ID server-side.

Never accept a client-generated Visit ID as authoritative.

---

# 38. EMERGENCY REGISTRATION API

Example:

```http
POST /api/v1/registrations/emergency
```

Backend workflow:

```text
Receive provisional data
       ↓
Search Patient Master
       ↓
Confident match?
   /          \
 YES          NO
 |             |
Retrieve      Create
Patient ID    TEMP ID
 \             /
  \           /
   Create Emergency Visit
           ↓
      Audit + Notify
```

---

# 39. FRONTEND ROUTES

Recommended routes:

```text
/register
/register/success
/patient/profile
/patient/visits
/front-desk/registration
/front-desk/patients/search
/front-desk/patients/:patientId
/front-desk/registrations
/front-desk/identity-review
/front-desk/emergency-registration
```

Protect routes using RBAC.

---

# 40. ONLINE REGISTRATION EXPERIENCE

The Patient Portal should provide:

### Step 1 — Personal Details

### Step 2 — Contact Details

### Step 3 — Emergency Contact

### Step 4 — Identity Information

### Step 5 — Review

### Step 6 — Submit

### Step 7 — Confirmation

Confirmation screen should show:

```text
Registration Successful

Patient ID: P10045
Visit ID: V202610001

Registration Date:
06 October 2026

You will receive confirmation through SMS and email.
```

Do not expose unnecessary internal identifiers.

---

# 41. FRONT-DESK EXPERIENCE

Receptionist dashboard should provide:

```text
Register Patient
Search Patient
Recent Registrations
Pending Identity Reviews
Emergency Registration
Today's Registrations
```

---

# 42. PATIENT SEARCH UI

Search options:

```text
Patient ID
Mobile Number
Name
Date of Birth
Email
```

Display:

```text
Patient ID
Name
DOB
Mobile
Last Visit
Status
```

Do not display unnecessary clinical information.

---

# 43. IDENTITY REVIEW UI

For ambiguous matches:

```text
Identity Verification Required

Submitted Patient Information
--------------------------------

Potential Matches
--------------------------------

[View Patient]

Actions:
[Confirm Existing Patient]
[Create New Patient]
[Request More Information]
[Cancel]
```

Every action must be logged.

---

# 44. REGISTRATION CONFIRMATION

After successful registration:

Generate a registration confirmation event.

Possible content:

```text
Hospital Registration Confirmed

Patient ID: P10045
Visit ID: V202610001
Registration Date: 06-Oct-2026

Please keep your Patient ID for future visits.
```

The actual template must be configurable.

---

# 45. NOTIFICATION INTEGRATION

Do not implement independent SMS/email logic inside the registration module.

Use:

```text
Notification Service
```

Create an event such as:

```text
PATIENT_REGISTRATION_COMPLETED
```

Payload:

```json
{
  "patientId": "P10045",
  "visitId": "V202610001",
  "registrationId": "REG202600001"
}
```

Notification Service determines:

- SMS
- Email
- template
- retry
- delivery status
- patient preference

---

# 46. NOTIFICATION FAILURE

If SMS fails:

```text
Registration remains successful.
```

Do not roll back patient registration because notification failed.

Instead:

```text
Notification = FAILED
Retry according to notification policy
Create audit record
```

The same principle applies to email.

---

# 47. REGISTRATION RECEIPT / DOCUMENT

Where configured, generate a registration confirmation document.

Possible content:

```text
Hospital Name
Patient Registration Confirmation

Patient ID
Patient Name
Visit ID
Registration Date
Registration Source
```

The document should be generated through the centralized Document Generation module.

Do not duplicate PDF generation logic inside this module.

---

# 48. RPA RESPONSIBILITY

Robot Framework is an automation worker.

It is NOT the system of record.

The MERN backend remains authoritative.

RPA may perform repetitive administrative tasks such as:

1. Reading registration data from approved external sources
2. Validating required fields
3. Searching external hospital/legacy systems
4. Entering patient information into legacy systems
5. Synchronizing approved patient information
6. Verifying successful submission
7. Capturing external reference IDs
8. Updating the MERN system through APIs
9. Triggering notifications
10. Logging execution results

---

# 49. RPA MUST NOT

Robot Framework must never independently:

- diagnose patients
- determine medical priority
- determine treatment
- decide admission
- decide discharge fitness
- interpret medical results
- choose a patient identity when multiple matches are ambiguous
- merge patient identities without authorization
- invent demographic information
- override hospital identity rules
- bypass RBAC
- create unauthorized access

---

# 50. RPA STANDARD WORKFLOW

Follow the global RPA pattern:

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

For ambiguity:

```text
INPUT
  ↓
READ
  ↓
VALIDATE
  ↓
AMBIGUOUS
  ↓
EXCEPTION CASE
  ↓
HUMAN REVIEW
  ↓
APPROVED DECISION
  ↓
RPA CONTINUES
```

---

# 51. ROBOT FRAMEWORK STRUCTURE

Create or extend:

```text
robot/
├── resources/
│   ├── common_keywords.resource
│   ├── api_keywords.resource
│   ├── browser_keywords.resource
│   ├── authentication.resource
│   └── patient_keywords.resource
│
├── keywords/
│   ├── patient_registration_keywords.resource
│   ├── patient_matching_keywords.resource
│   └── emergency_registration_keywords.resource
│
├── tests/
│   ├── patient_registration.robot
│   ├── duplicate_patient.robot
│   ├── emergency_registration.robot
│   └── identity_review.robot
│
├── portals/
│   └── hospital_legacy_portal.resource
│
└── results/
```

Use API automation wherever a stable API exists.

Use browser automation only when necessary.

---

# 52. ROBOT TEST CASE — NEW PATIENT

Example conceptual test:

```text
Open Registration Source
Read Registration Data
Validate Required Fields
Search Patient Master
Verify No Existing Match
Submit Patient Registration
Capture Patient ID
Capture Visit ID
Verify Registration Success
Verify Patient Exists
Verify Visit Exists
Verify Audit Event
Verify Notification Event
```

---

# 53. ROBOT TEST CASE — EXISTING PATIENT

```text
Read Patient Information
Search Patient Master
Verify Existing Patient
Verify Patient ID
Update Permitted Details
Create New Visit
Verify New Visit ID
Verify Existing Patient ID Was Reused
Verify Registration
```

Critical assertion:

```text
Existing Patient ID != newly generated Patient ID
```

The system must reuse the existing identity.

---

# 54. ROBOT TEST CASE — DUPLICATE

Input:

```text
Name = Rahul Shah
DOB = matching
Mobile = matching
```

Expected:

```text
Existing Patient Detected
```

System must not create another Patient.

---

# 55. ROBOT TEST CASE — AMBIGUOUS MATCH

Expected:

```text
Multiple Potential Patients
        ↓
Identity Review Required
```

Robot must stop before selecting a patient.

Create:

```text
ExceptionCase
```

with:

```text
type = PATIENT_IDENTITY_AMBIGUITY
severity = HIGH
status = OPEN
```

---

# 56. ROBOT TEST CASE — EMERGENCY UNKNOWN PATIENT

Expected:

```text
Search Patient Master
→ No confident match
→ Create temporary emergency identity
→ Create emergency visit
→ Verify record
```

---

# 57. ROBOT TEST CASE — EMERGENCY LINKING

Expected:

```text
Temporary ID
     ↓
Identity Verified
     ↓
Existing Patient Found
     ↓
Link Temporary Record
     ↓
Preserve History
```

---

# 58. RBAC

## Patient

Can:

- self-register
- view own registration
- update permitted personal details
- view own Patient ID
- view own Visit IDs
- manage communication preferences

Cannot:

- search arbitrary patients
- modify another patient
- access staff dashboards
- approve identity matches

---

## Receptionist

Can:

- register patients
- search patients
- create visits
- update permitted demographics
- process identity review
- process emergency registration

Cannot:

- access unrestricted clinical data
- alter clinical records
- make clinical decisions

---

## Doctor

Can:

- view permitted patient identity information
- use patient identity in clinical workflows

Cannot:

- change protected administrative identity data without authorization.

---

## Nurse

Can:

- view permitted patient information

---

## Billing Staff

Can:

- retrieve required identity information

Cannot:

- modify patient identity without permission.

---

## System Admin

Can:

- administer system configuration and technical access

Must NOT automatically receive unrestricted clinical visibility merely because of technical privileges.

Use least privilege.

---

# 59. AUDIT LOGGING

The following events must be audited:

```text
PATIENT_CREATED
PATIENT_VIEWED
PATIENT_UPDATED
PATIENT_SEARCHED
REGISTRATION_CREATED
REGISTRATION_COMPLETED
REGISTRATION_FAILED
VISIT_CREATED
IDENTITY_MATCH_FOUND
IDENTITY_REVIEW_CREATED
IDENTITY_REVIEW_APPROVED
IDENTITY_REVIEW_REJECTED
TEMPORARY_EMERGENCY_CREATED
TEMPORARY_EMERGENCY_LINKED
PATIENT_MERGE_REQUESTED
```

Audit fields:

```text
auditEventId
actorUserId
actorRole
action
entityType
entityId
timestamp
ipAddress
userAgent
correlationId
before
after
result
reason
```

Sensitive information must be redacted according to security policy.

---

# 60. SECURITY REQUIREMENTS

Implement:

- JWT authentication
- secure password hashing
- RBAC middleware
- backend authorization
- input validation
- sanitization
- rate limiting where appropriate
- secure HTTP headers
- HTTPS in production
- encrypted secrets
- environment variables
- audit logging
- access-controlled documents
- sensitive data masking
- session/token expiration
- refresh-token strategy where applicable

Never store:

```text
passwords in plain text
API secrets in source code
payment secrets in frontend code
insurer credentials in Robot Framework files
```

---

# 61. DATA PRIVACY

Patient information is sensitive.

The system must follow applicable hospital privacy and data-protection requirements.

Principles:

```text
Collect only required data
Use least privilege
Log access
Protect sensitive fields
Restrict exports
Control document access
Avoid unnecessary exposure
```

---

# 62. CORRELATION ID

Every registration transaction should have a correlation ID.

Example:

```text
CORR-20261006-000123
```

Use it across:

```text
Registration
Visit
Notification
RPA Job
Audit Event
Exception Case
Document Generation
```

This allows complete traceability.

---

# 63. EXCEPTION MANAGEMENT

Create an ExceptionCase whenever automated processing cannot safely continue.

Examples:

### Duplicate / Possible Duplicate

```text
PATIENT_IDENTITY_AMBIGUITY
```

### Invalid Data

```text
PATIENT_DATA_VALIDATION_ERROR
```

### External System Failure

```text
PATIENT_SYSTEM_SYNC_FAILURE
```

### Notification Failure

```text
REGISTRATION_NOTIFICATION_FAILURE
```

### Temporary Record Linking Failure

```text
EMERGENCY_IDENTITY_LINK_FAILURE
```

---

# 64. EXCEPTION UI

Authorized staff should see:

```text
Exception Queue

ID
Type
Patient/Temporary ID
Priority
Status
Created At
Assigned To
```

Actions:

```text
Open
Review
Approve
Reject
Retry
Escalate
Close
```

Do not allow unauthorized users to resolve identity exceptions.

---

# 65. TRANSACTIONAL CONSISTENCY

Registration involves multiple records:

```text
Patient
Visit
Registration
Audit
Notification Event
```

The implementation should prevent partially completed registration states.

Where MongoDB transactions are available, use transactions for critical database operations.

Example:

```text
Create Patient
+
Create Visit
+
Create Registration
```

should be atomic where appropriate.

External notification delivery should not necessarily be inside the DB transaction.

Use an event/outbox-style mechanism where appropriate.

---

# 66. IDEMPOTENCY

Registration APIs must support idempotency where duplicate submissions are possible.

Example:

Patient clicks:

```text
Submit
```

then clicks again because the page appears slow.

The system must not create:

```text
Patient P10045
Patient P10046
```

for the same transaction.

Use an idempotency key or equivalent transaction protection.

Example:

```text
Idempotency-Key: REG-CLIENT-123456
```

---

# 67. CONCURRENCY

Two receptionists may attempt to register the same patient simultaneously.

The backend must protect against duplicate creation.

Use:

- unique indexes
- transactions
- deterministic matching
- idempotency
- conflict handling

Do not rely only on frontend checks.

---

# 68. PATIENT ID GENERATION

Patient IDs must be generated server-side.

Example:

```text
P10001
P10002
P10003
```

The implementation must ensure:

- uniqueness
- concurrency safety
- no accidental reuse
- consistent formatting
- configurable prefix

Do not use MongoDB `_id` directly as the human-facing Patient ID.

---

# 69. VISIT ID GENERATION

Example:

```text
V202610001
V202610002
```

The format may be configurable.

The Visit ID must be unique.

---

# 70. SEARCH PERFORMANCE

Patient search is a high-frequency operation.

Implement indexes for common queries.

Avoid unbounded collection scans.

For name search:

- normalize searchable values
- use appropriate indexes/search strategy
- paginate results
- limit result count

Never return thousands of patient records to the frontend.

---

# 71. API ERROR FORMAT

Use consistent errors.

Example:

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_DUPLICATE_POSSIBLE",
    "message": "A possible existing patient was found.",
    "correlationId": "CORR-20261006-000123"
  }
}
```

Do not expose stack traces to end users.

---

# 72. SUCCESS RESPONSE

Example:

```json
{
  "success": true,
  "data": {
    "patientId": "P10045",
    "visitId": "V202610001",
    "registrationId": "REG202610001",
    "status": "REGISTERED"
  },
  "correlationId": "CORR-20261006-000123"
}
```

---

# 73. DATABASE RELATIONSHIPS

Conceptual relationship:

```text
Patient
   |
   | 1
   |
   | N
   v
Visit
   |
   +------ Appointment
   |
   +------ OPD Queue
   |
   +------ Admission
   |
   +------ Billing
   |
   +------ Lab Orders
   |
   +------ Radiology Orders
   |
   +------ Pharmacy Orders
```

Patient may also have:

```text
Patient
 ├── Insurance Policies
 ├── Documents
 ├── Notifications
 ├── Feedback
 └── Audit References
```

---

# 74. CROSS-MODULE DEPENDENCIES

This module is foundational.

It must integrate with:

### Appointment Management

Uses:

```text
patientId
visitId
```

### OPD Queue

Uses:

```text
patientId
visitId
appointmentId
```

### Admission

Uses:

```text
patientId
visitId
```

### Bed Management

Uses:

```text
admissionId
patientId
```

### Billing

Uses:

```text
patientId
visitId
admissionId
```

### Insurance

Uses:

```text
patientId
```

### Pharmacy

Uses:

```text
patientId
visitId
```

### Laboratory

Uses:

```text
patientId
visitId
```

### Radiology

Uses:

```text
patientId
visitId
```

---

# 75. EVENT DEFINITIONS

Publish domain events where the architecture supports event-driven integration.

Recommended events:

```text
patient.created
patient.updated
registration.created
registration.completed
visit.created
identity.review.required
emergency.patient.created
emergency.identity.linked
```

Example:

```json
{
  "event": "registration.completed",
  "eventId": "EVT-20261006-0001",
  "timestamp": "2026-10-06T08:30:00Z",
  "correlationId": "CORR-20261006-000123",
  "data": {
    "patientId": "P10045",
    "visitId": "V202610001",
    "registrationId": "REG202610001"
  }
}
```

---

# 76. FRONTEND STATE MANAGEMENT

Use the project's selected state-management approach consistently.

The registration module should maintain:

```text
registrationForm
validationErrors
searchResults
identityMatchStatus
selectedPatient
registrationStatus
loadingState
errorState
successState
```

Avoid storing sensitive patient information unnecessarily in persistent browser storage.

Do not place sensitive patient records into localStorage unless explicitly justified and secured.

---

# 77. LOADING STATES

The UI must clearly show loading states during:

- patient search
- duplicate detection
- registration submission
- patient profile retrieval
- identity review actions

Prevent double submission.

Example:

```text
[ Register Patient ]
```

becomes:

```text
[ Registering... ]
```

while the request is in progress.

---

# 78. ACCESSIBILITY

The registration UI should support:

- keyboard navigation
- labels for inputs
- readable error messages
- sufficient contrast
- screen-reader-friendly controls
- focus management
- accessible tables
- accessible modal dialogs

---

# 79. RESPONSIVE DESIGN

Patient self-registration must work on:

- desktop
- tablet
- mobile

Front-desk screens should prioritize desktop/tablet use.

Do not create separate mobile applications.

---

# 80. SEED DATA

Create realistic demo data.

Example:

```text
P10001 — Rahul Shah
P10002 — Priya Patel
P10003 — Amit Mehta
P10004 — Neha Shah
P10005 — Rohan Desai
```

Create multiple visits for some patients.

Example:

```text
P10001
 ├── V202610001
 ├── V202610045
 └── V202610098
```

This is important for demonstrating that Patient ID is permanent while Visit ID changes.

Also seed:

- possible duplicate records
- emergency temporary record
- identity-review exception
- inactive patient
- patients with missing optional fields

Do not use real people's sensitive information.

---

# 81. DEMO SCENARIO — NEW PATIENT

Input:

```text
Name: Rahul Shah
DOB: 1998-05-10
Mobile: 9876543210
Email: rahul@example.com
```

Expected:

```text
Patient ID generated: P10045
Visit ID generated: V202610001
Registration status: REGISTERED
```

Notification event:

```text
PATIENT_REGISTRATION_COMPLETED
```

---

# 82. DEMO SCENARIO — EXISTING PATIENT

Existing:

```text
Patient ID: P10045
Name: Rahul Shah
DOB: 1998-05-10
Mobile: 9876543210
```

Patient registers again.

Expected:

```text
Patient ID remains:
P10045

New Visit:
V202610155
```

The system must NOT create another Patient ID.

---

# 83. DEMO SCENARIO — AMBIGUOUS PATIENT

Two possible records:

```text
P10045 Rahul Shah
DOB: 1998-05-10

P10221 Rahul Shah
DOB: 1998-05-10
```

Input:

```text
Rahul Shah
DOB: 1998-05-10
```

Expected:

```text
IDENTITY_VERIFICATION_REQUIRED
```

No patient should be selected automatically.

---

# 84. DEMO SCENARIO — EMERGENCY UNKNOWN PATIENT

Unknown emergency patient.

Expected:

```text
TEMP-2026-00452
```

Create:

```text
Emergency Visit
```

Later identity is verified.

If existing patient:

```text
TEMP-2026-00452
        ↓
P10045
```

All history must remain traceable.

---

# 85. TESTING STRATEGY

Implement all of the following.

## Unit Tests

Test:

- Patient ID generation
- Visit ID generation
- input validation
- normalization
- duplicate matching
- exact matching
- possible matching
- no-match logic
- permission checks
- status transitions

---

# 86. BACKEND INTEGRATION TESTS

Test:

```text
Create patient
Create registration
Create visit
Search patient
Update patient
Emergency registration
Identity review
Notification event
Audit event
```

---

# 87. API TESTS

Test:

```text
POST /patients
GET /patients/:id
GET /patients/search
PATCH /patients/:id

POST /registrations
POST /registrations/emergency

POST /visits
GET /visits/:id
```

Also test unauthorized requests.

---

# 88. SECURITY TESTS

Verify:

```text
Patient cannot access another patient
Receptionist cannot perform unauthorized clinical actions
Unauthorized role cannot resolve identity exception
Unauthenticated API calls are rejected
Expired JWT is rejected
Invalid input is rejected
Sensitive data is not leaked in errors
```

---

# 89. ROBOT FRAMEWORK ACCEPTANCE TESTS

At minimum implement:

```text
TC-REG-001 New patient registration
TC-REG-002 Existing patient registration
TC-REG-003 Duplicate detection
TC-REG-004 Ambiguous identity
TC-REG-005 Emergency unknown patient
TC-REG-006 Emergency existing patient
TC-REG-007 Patient profile update
TC-REG-008 Registration notification
TC-REG-009 Registration failure recovery
TC-REG-010 Unauthorized access
```

---

# 90. ACCEPTANCE CRITERIA

The module is accepted only if all of the following are true.

## Identity

- A patient receives exactly one permanent Patient ID.
- Repeat visits do not create new Patient IDs.
- Visit IDs are unique.
- Patient IDs are unique.
- IDs are generated server-side.

## Registration

- Online registration works.
- Front-desk registration works.
- Required fields are validated.
- Duplicate detection works.
- Existing patients can be reused.
- New visits are created correctly.

## Duplicate Handling

- Exact matches can be identified.
- Possible matches are routed to human review.
- The system never automatically chooses an ambiguous patient.
- Patient merging is not automatic.

## Emergency

- Existing patients can be identified.
- Unknown emergency patients can receive temporary IDs.
- Temporary records can later be linked.
- History remains traceable.

## Security

- RBAC works.
- Unauthorized access is rejected.
- Sensitive data is protected.
- Audit events are created.

## Notifications

- Registration completion triggers the Notification Service.
- SMS/email failures do not invalidate successful registration.
- Notification status is tracked.

## RPA

- Robot Framework automation can execute approved registration tasks.
- RPA verifies successful actions.
- RPA failures create trackable execution failures/exceptions.
- RPA does not make identity decisions when ambiguity exists.

## Reliability

- Duplicate submissions are prevented.
- Concurrent registration attempts are handled safely.
- Critical database operations are transaction-safe.
- API errors are standardized.

---

# 91. DEFINITION OF DONE

Do not consider this module complete merely because the UI exists.

The module is complete only when:

```text
Frontend
   +
Backend APIs
   +
MongoDB Models
   +
Validation
   +
RBAC
   +
Audit Logging
   +
Notifications
   +
Exception Handling
   +
RPA Integration
   +
Robot Tests
   +
Unit Tests
   +
Integration Tests
   +
Seed Data
   +
Documentation
```

are implemented and tested.

---

# 92. IMPLEMENTATION ORDER

The AI coding agent should implement in this order:

### Step 1
Create/update MongoDB models:

```text
Patient
Visit
Registration
EmergencyTemporaryRecord
```

### Step 2
Implement validation schemas.

### Step 3
Implement Patient ID generator.

### Step 4
Implement Visit ID generator.

### Step 5
Implement patient matching service.

### Step 6
Implement registration service.

### Step 7
Implement emergency registration service.

### Step 8
Implement REST APIs.

### Step 9
Implement RBAC middleware integration.

### Step 10
Implement audit events.

### Step 11
Implement notification event integration.

### Step 12
Implement exception handling.

### Step 13
Implement Patient Portal registration UI.

### Step 14
Implement Receptionist registration UI.

### Step 15
Implement patient search.

### Step 16
Implement identity review UI.

### Step 17
Implement emergency registration UI.

### Step 18
Implement Robot Framework automation.

### Step 19
Implement tests.

### Step 20
Add seed/demo data.

### Step 21
Perform end-to-end testing.

---

# 93. DO NOT IMPLEMENT

The AI coding agent must NOT add unrelated features while implementing this file.

Do not implement:

- appointment scheduling logic
- OPD queue logic
- bed allocation
- billing calculations
- insurance claims
- pharmacy dispensing
- laboratory result interpretation
- radiology interpretation
- payroll
- procurement
- maintenance
- housekeeping

Those modules will be implemented through their respective specifications.

Only create the interfaces/dependencies required for integration.

---

# 94. IMPORTANT ARCHITECTURAL RULES

The implementation must follow these rules:

### Rule 1

```text
Patient ID = Permanent Identity
```

### Rule 2

```text
Visit ID = Individual Encounter
```

### Rule 3

```text
Appointment ID = Appointment
```

### Rule 4

Do not create duplicate permanent patients.

### Rule 5

Do not automatically merge ambiguous identities.

### Rule 6

Emergency patients do not use a separate permanent Patient Master.

### Rule 7

Temporary emergency IDs are temporary.

### Rule 8

RPA is an automation worker, not the system of record.

### Rule 9

RPA must never make clinical decisions.

### Rule 10

RPA must never invent missing patient information.

### Rule 11

Human review is mandatory for ambiguous identity cases.

### Rule 12

All important identity operations must be auditable.

### Rule 13

The backend is authoritative.

### Rule 14

Frontend validation is not sufficient.

### Rule 15

Notifications must use the centralized Notification Service.

### Rule 16

Documents must use the centralized Document Generation Service.

### Rule 17

All patient-related modules must reference the central Patient entity.

### Rule 18

Never silently discard historical patient/visit data.

---

# 95. FINAL END-TO-END EXAMPLE

## Scenario

A new patient registers online.

```text
Patient
  |
  v
Patient Portal
  |
  v
Registration Form
  |
  v
POST /api/v1/registrations
  |
  v
Backend Validation
  |
  v
Patient Matching
  |
  v
No Existing Match
  |
  v
Generate Patient ID
  |
  v
P10045
  |
  v
Generate Visit ID
  |
  v
V202610001
  |
  v
Create Registration
  |
  v
Audit Event
  |
  v
Publish registration.completed
  |
  +--------------------+
  |                    |
  v                    v
SMS Notification     Email Notification
  |
  v
Registration Success
```

---

# 96. FINAL IMPLEMENTATION PRINCIPLE

Build this module as a **real hospital identity and registration subsystem**, not as a demo form.

The resulting implementation must be:

- modular
- secure
- auditable
- scalable
- testable
- API-driven
- RBAC-controlled
- RPA-compatible
- MongoDB-backed
- integrated with the future hospital modules

Most importantly:

> **The system must preserve one permanent patient identity across the patient's entire relationship with the hospital while creating a separate encounter/Visit ID for every new visit.**

This rule must remain intact throughout the entire application.