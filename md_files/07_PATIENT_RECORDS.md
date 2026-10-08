# 07_PATIENT_RECORDS.md

# Hospital Administrative RPA Platform
## Module 07 — Patient Records

---

# 1. PURPOSE

Build a complete **Patient Records Management module** for the Hospital Administrative RPA Platform.

The module provides a centralized, secure, auditable way to access and manage the patient's hospital record across the patient lifecycle.

It must connect information from:

- Patient Registration
- Visits
- Appointments
- OPD
- Admissions
- Bed assignments
- Discharge
- Billing
- Insurance
- Pharmacy
- Laboratory
- Radiology
- Documents
- Notifications
- Feedback/complaints where permitted

The module must provide a **longitudinal patient record view** without duplicating ownership of data belonging to other modules.

---

# 2. CORE PRINCIPLE

The Patient Records module is primarily an **aggregated record-access and document-management layer**.

It must NOT become a second database containing copies of every hospital module's business data.

For example:

```text
Patient Records
      │
      ├── Patient Master ─────────► Registration owns it
      ├── Appointment ────────────► Appointment owns it
      ├── Admission ──────────────► Admission owns it
      ├── Bed Assignment ─────────► Bed Management owns it
      ├── Invoice ────────────────► Billing owns it
      ├── Insurance Claim ────────► Insurance owns it
      ├── Prescription ───────────► Pharmacy/Clinical workflow owns it
      ├── Lab Result ─────────────► Laboratory owns it
      └── Radiology Report ───────► Radiology owns it
```

Patient Records retrieves and presents authorized information.

---

# 3. TECHNOLOGY

Use:

```text
Frontend:
React.js

Backend:
Node.js + Express.js

Database:
MongoDB + Mongoose

Authentication:
JWT

Authorization:
RBAC

Automation:
Robot Framework

Documents:
Central Document Generation Service

Notifications:
Central Notification Service

Audit:
Central Audit Service

Exceptions:
Central Exception Service
```

Use existing shared infrastructure.

Do not create duplicate authentication, notification, document, audit, or RPA infrastructure.

---

# 4. PATIENT IDENTITY RULE

The permanent:

```text
Patient ID
```

is the primary identity reference.

Example:

```text
P10045
```

must remain stable across:

- visits
- appointments
- admissions
- discharges
- bills
- insurance
- laboratory
- radiology
- pharmacy
- documents

---

# 5. VISIT IS NOT PATIENT

Maintain:

```text
Patient
    ↓
Visit
```

A patient may have many visits.

Example:

```text
Patient:
P10045

Visits:
VIS-001
VIS-002
VIS-003
```

Do not create a new patient record for each visit.

---

# 6. ADMISSION IS NOT VISIT

An admission represents an inpatient episode.

Example:

```text
Patient
   ↓
Visit
   ↓
Admission
```

One patient can have multiple admissions over time.

---

# 7. RECORD OWNERSHIP

The system must maintain clear ownership.

| Information | Owner |
|---|---|
| Patient identity | Registration |
| Appointment | Appointment |
| OPD queue | OPD |
| Admission | Admission |
| Physical bed | Bed Management |
| Discharge | Discharge |
| Invoice | Billing |
| Insurance policy | Insurance |
| Claim | Insurance |
| Doctor master | Doctor Management |
| Pharmacy | Pharmacy |
| Inventory | Medical Inventory |
| Lab | Laboratory |
| Radiology | Radiology |
| Documents | Document Generation |
| Patient record view | Patient Records |

Patient Records should reference the source record.

---

# 8. PATIENT RECORD TYPES

Support:

```text
Patient Master
Visit Records
Appointment Records
OPD Encounters
Admission Records
Discharge Records
Bed Assignment History
Billing Records
Insurance Records
Pharmacy Records
Laboratory Records
Radiology Records
Documents
Notifications
Administrative Notes
Audit References
```

---

# 9. CLINICAL CONTENT BOUNDARY

The module may display approved clinical information from authorized systems.

It must NOT:

- diagnose
- interpret lab results
- interpret radiology results
- prescribe medication
- recommend treatment
- modify clinical findings
- generate clinical conclusions
- alter signed clinical documents

RPA must never perform these tasks.

---

# 10. PATIENT RECORD DASHBOARD

Create:

```text id="e7pj3m"
/patients/:patientId/records
```

The main page should provide a longitudinal timeline.

Example:

```text id="o6ic5w"
PATIENT: Rahul Shah
PATIENT ID: P10045

------------------------------------------------

2026-10-06
Admission
ADM10023
Private Room

2026-10-05
Radiology
CT Report Available

2026-10-04
Laboratory
CBC Result Available

2026-10-01
OPD Visit
Dr. Patel

2026-09-15
Appointment
Cardiology
```

---

# 11. PATIENT SUMMARY

Display:

```text id="qjv0me"
Patient ID
Full Name
Date of Birth
Age
Gender
Contact Information
Emergency Contact
Registration Date
Patient Status
```

Only show information permitted by role.

---

# 12. PATIENT PROFILE

Patient profile should include:

```text id="v3wzlv"
Identity
Contact
Address
Emergency Contact
Communication Preferences
Registration Information
Document References
```

Sensitive information must be protected.

---

# 13. PROFILE EDITING

Authorized users may update permitted patient information.

Examples:

```text id="f5dqkc"
Phone Number
Email
Address
Emergency Contact
Communication Preference
```

Changes must be audited.

---

# 14. SENSITIVE PROFILE CHANGES

Certain fields may require staff verification.

Examples:

```text id="ndls5n"
Legal Name
Date of Birth
Government ID
Identity-related information
```

Do not allow unrestricted patient-side editing of sensitive identity fields.

---

# 15. PROFILE CHANGE HISTORY

Create or use an existing history entity.

Example:

```javascript id="jgt9pk"
{
    patientId: ObjectId,

    field: String,

    previousValue: String,

    newValue: String,

    reason: String,

    changedByUserId: ObjectId,

    verifiedByUserId: ObjectId,

    timestamp: Date,

    correlationId: String
}
```

Never silently overwrite sensitive identity changes.

---

# 16. PATIENT TIMELINE

The timeline should aggregate major events.

Possible events:

```text id="xy0l1s"
REGISTRATION
APPOINTMENT
CHECK_IN
OPD_VISIT
ADMISSION
BED_ASSIGNMENT
LAB_ORDER
LAB_RESULT
RADIOLOGY_ORDER
RADIOLOGY_REPORT
PHARMACY_ORDER
PHARMACY_DISPENSE
BILL_GENERATED
PAYMENT
DISCHARGE
DOCUMENT_GENERATED
FEEDBACK
```

---

# 17. TIMELINE EVENT MODEL

Do not necessarily duplicate every source document.

Use a lightweight event representation:

```javascript id="gpnrfi"
{
    patientId: ObjectId,

    eventType: String,

    sourceModule: String,

    referenceType: String,

    referenceId: ObjectId,

    eventDate: Date,

    title: String,

    summary: String,

    visibility: String,

    createdAt: Date
}
```

Where possible, generate timeline information dynamically from source modules.

---

# 18. VISIT HISTORY

Display:

```text id="1khjzz"
Visit ID
Date
Visit Type
Department
Doctor
Appointment
OPD Status
Outcome Reference
```

Example:

```text id="e8r2t7"
VIS-20261001

Date:
01 Oct 2026

Type:
OPD

Doctor:
Dr. Patel

Status:
COMPLETED
```

---

# 19. APPOINTMENT HISTORY

Display:

```text id="xk5k3d"
Appointment ID
Doctor
Department/Specialty
Date
Time
Status
Check-in status
No-show status
```

Retrieve from Appointment Management.

Do not create another appointment engine.

---

# 20. OPD HISTORY

Display:

```text id="5q1i8j"
Visit
Doctor
Token
Queue status
Check-in time
Called time
Service start
Completion time
```

Do not modify historical OPD tokens from Patient Records.

---

# 21. ADMISSION HISTORY

Display:

```text id="0m8t8u"
Admission ID
Admission Date
Admission Type
Ward
Accommodation
Current/Previous Bed
Discharge Date
Discharge Status
```

Example:

```text id="o1s7rd"
ADM10023
OPD Admission
01 Oct 2026
Private Wing
BED-P-03
Discharged
08 Oct 2026
```

---

# 22. BED HISTORY

Retrieve assignment history from Bed Management.

Example:

```text id="v25kno"
Oct 01–Oct 03
BED-G-12
General Ward

Oct 03–Oct 05
BED-S-04
Semi-Private

Oct 05–Oct 08
BED-P-03
Private
```

Patient Records must not independently alter bed assignments.

---

# 23. DISCHARGE HISTORY

Display:

```text id="r1p2f7"
Discharge ID
Admission ID
Discharge Date
Status
Final Invoice
Payment Status
Documents
```

Clinical discharge content should be shown only to authorized users.

---

# 24. BILLING HISTORY

Display:

```text id="zq2ux1"
Invoice ID
Invoice Date
Invoice Type
Gross Amount
Coverage
Deposit
Payable
Paid
Balance
Status
```

Financial permissions must be enforced.

---

# 25. BILLING DATA OWNERSHIP

Patient Records must read Billing data through APIs/services.

Do not directly modify:

```text id="h8j7gd"
Invoice
Payment
Financial Adjustment
Deposit
```

from Patient Records.

---

# 26. PAYMENT HISTORY

Display authorized payment information:

```text id="l5h8l1"
Transaction ID
Date
Amount
Payment Method
Status
Invoice
Receipt
```

Sensitive gateway information must never be exposed.

Do not display:

- card number
- CVV
- banking credentials
- payment gateway secrets

---

# 27. INSURANCE RECORDS

Display:

```text id="o8j1m9"
Insurance Provider
Policy Number
Policy Status
Coverage
Verification Date
Expiry
Claim References
```

Mask sensitive policy information where required.

Example:

```text id="f0h1py"
Policy:
****1234
```

---

# 28. INSURANCE CLAIM HISTORY

Display:

```text id="xq7m8c"
Claim ID
Admission
Submitted Date
Status
Approved Amount where authorized
Rejected/Query Status
Documents
```

Statuses may include:

```text id="ak5j1b"
DRAFT
READY
SUBMITTED
UNDER_REVIEW
QUERY
MORE_INFORMATION_REQUIRED
APPROVED
PARTIALLY_APPROVED
REJECTED
PAID
CANCELLED
```

---

# 29. PHARMACY HISTORY

Display only authorized information.

Possible information:

```text id="3v3c4s"
Prescription Reference
Order
Dispensing Status
Dispensed Date
Billing Reference
```

Clinical medication interpretation is outside this module.

---

# 30. LABORATORY RECORDS

Display:

```text id="1r3h5q"
Lab Order ID
Test
Order Date
Sample Status
Result Status
Report Date
Document
```

---

# 31. LAB RESULT BOUNDARY

The system may display an authorized laboratory result.

It must NOT produce a statement such as:

```text id="8x5x3x"
"This result means the patient has..."
```

unless such interpretation comes from an authorized clinical document/source.

RPA must never interpret results.

---

# 32. RADIOLOGY RECORDS

Display:

```text id="4d1k9a"
Radiology Order ID
Modality
Scheduled Date
Status
Report Status
Report Document
```

---

# 33. RADIOLOGY INTERPRETATION BOUNDARY

Patient Records may display an approved radiology report.

It must not:

- interpret images
- summarize findings independently
- generate diagnosis
- modify report content

---

# 34. DOCUMENT LIBRARY

Create a centralized patient document view.

Example:

```text id="jz9qke"
Documents

Administrative
├── Registration Receipt
├── Admission Form
├── Final Invoice
└── Payment Receipt

Clinical
├── Discharge Summary
├── Lab Reports
└── Radiology Reports

Insurance
├── Policy Documents
└── Claim Documents
```

Actual categories depend on document metadata.

---

# 35. DOCUMENT MODEL

Use existing:

```text id="d1h2m3"
GeneratedDocument
```

Suggested references:

```javascript id="xw2s7z"
{
    documentId,
    patientId,
    referenceType,
    referenceId,
    documentType,
    templateId,
    templateVersion,
    fileLocation,
    status,
    generatedAt,
    createdBy,
    accessLevel
}
```

Do not duplicate file storage logic.

---

# 36. DOCUMENT ACCESS CONTROL

Examples:

### Patient

Can access:

```text id="w2x9sm"
Own authorized documents
Invoices
Receipts
Approved discharge documents
Approved lab/radiology reports
```

### Doctor

Can access records permitted for clinical care.

### Billing Staff

Can access billing-related records.

### Insurance Staff

Can access insurance-related documents.

### Management

Access depends on policy.

### System Admin

Technical access must still be audited.

---

# 37. DOCUMENT DOWNLOAD

When a user clicks:

```text id="4s7l0w"
Download
```

the backend must verify authorization before returning the file.

Never expose permanent unrestricted storage URLs.

Prefer:

```text id="5kq8w4"
Short-lived signed URL
```

or authenticated streaming.

---

# 38. DOCUMENT PREVIEW

Where supported, provide:

```text id="2m5m5j"
Preview
Download
```

Do not expose documents to unauthorized users through frontend-only restrictions.

Authorization must happen on the backend.

---

# 39. SEARCH PATIENT RECORDS

Authorized staff should be able to search by:

```text id="c4s2q0"
Patient ID
Name
Phone
Email
Date of Birth
Appointment ID
Visit ID
Admission ID
Invoice ID
```

Sensitive identity search must follow permission rules.

---

# 40. PATIENT SEARCH RESULT

Example:

```text id="u7y4s9"
Patient ID:
P10045

Name:
Rahul Shah

DOB:
01 Jan 1999

Phone:
******1234

Last Visit:
06 Oct 2026
```

Avoid exposing unnecessary data in search results.

---

# 41. DUPLICATE PATIENT HANDLING

If duplicate/possible-match records exist:

```text id="x1n4d6"
Possible Duplicate
```

Patient Records must not automatically merge records.

Route to Patient Registration/Identity Management.

---

# 42. EMERGENCY TEMPORARY RECORDS

Temporary emergency records may appear in Patient Records.

Example:

```text id="p4f7v9"
TEMP-2026-00452
```

Display:

```text
Temporary Emergency Identity
Verification Pending
```

After identity linking, references must be updated according to Registration's authoritative process.

---

# 43. EMERGENCY RECORD LINKING

Patient Records must not independently merge temporary identity records.

The workflow is:

```text id="5d8j1p"
Temporary Emergency Record
       ↓
Identity Verification
       ↓
Registration Module
       ↓
Permanent Patient ID
       ↓
Record References Linked
```

---

# 44. RECORD CORRECTION

Do not directly overwrite historical records.

If a source module supports correction:

```text id="b5n1v2"
Correction Request
      ↓
Authorized Source Module
      ↓
Approval if required
      ↓
Updated Source Record
      ↓
Patient Records reflects new state
```

Patient Records should not become a backdoor for changing source data.

---

# 45. RECORD VERSIONING

Important documents/records should support:

```text id="2g5f8s"
Version
Created At
Updated At
Updated By
Previous Version
Change Reason
```

Especially for:

- clinical documents
- insurance documents
- billing documents
- administrative forms

---

# 46. CLINICAL DOCUMENT LOCKING

If a clinical document is finalized/signed:

```text id="8f6t2p"
FINALIZED
```

it must not be directly edited.

Corrections must use the appropriate authorized clinical/document workflow.

---

# 47. PATIENT PORTAL

Create:

```text id="p0l4n5"
/portal/records
```

Patient can see a simplified view.

Sections:

```text id="8g7q2m"
My Visits
Appointments
Admissions
Bills
Payments
Insurance
Lab Reports
Radiology Reports
Documents
Notifications
```

---

# 48. PATIENT PORTAL PRIVACY

A patient must only access their own record.

Backend authorization must validate:

```text id="f9j3n2"
Authenticated user
→ linked patient ID
→ requested patient ID
```

Never trust a frontend URL such as:

```text
/patients/P10045
```

as proof of ownership.

---

# 49. ATTENDANT / REPRESENTATIVE ACCESS

If the hospital supports authorized representatives, use explicit authorization.

Example:

```text id="c2x6k4"
Patient
    ↓
Authorized Representative
    ↓
Limited Record Access
```

The representative must not automatically receive full access.

Access should be:

- explicit
- time-bound where appropriate
- auditable
- revocable

---

# 50. RECORD ACCESS LOG

Create/use:

```text id="w8q2r1"
RecordAccessLog
```

Suggested:

```javascript id="r6m2k1"
{
    patientId: ObjectId,

    userId: ObjectId,

    role: String,

    resourceType: String,

    resourceId: ObjectId,

    action: String,

    purpose: String,

    timestamp: Date,

    ipAddress: String,

    correlationId: String
}
```

Examples:

```text id="3g8z2w"
PATIENT_RECORD_VIEWED
DOCUMENT_VIEWED
DOCUMENT_DOWNLOADED
BILL_VIEWED
LAB_REPORT_VIEWED
RADIOLOGY_REPORT_VIEWED
```

---

# 51. BREAK-GLASS ACCESS

If the hospital requires emergency access to restricted records, implement it only as an explicit configurable feature.

Example:

```text id="p4v6c8"
Emergency Access
```

Must require:

- reason
- authorized role
- audit
- notification to appropriate management/security personnel

Do not create unrestricted emergency access.

---

# 52. RPA ROLE

RPA may automate administrative record tasks such as:

- retrieving records from legacy systems
- synchronizing approved data
- importing documents
- checking record completeness
- indexing documents
- reconciling patient references
- generating record reports
- notifying staff about missing records

RPA must NOT modify clinical content independently.

---

# 53. RPA RECORD SYNCHRONIZATION

Workflow:

```text id="n5f8t2"
Scheduled RPA Job
      ↓
Login to legacy system
      ↓
Search Patient
      ↓
Read approved record metadata
      ↓
Validate
      ↓
Compare with MERN
      ↓
Update authorized fields/references
      ↓
Verify
      ↓
Log
```

---

# 54. RPA DOCUMENT IMPORT

If a legacy system contains documents:

```text id="g7h4v1"
Find Patient
   ↓
Find Document
   ↓
Download
   ↓
Validate file
   ↓
Virus/malware scan where infrastructure supports it
   ↓
Store securely
   ↓
Attach Patient ID
   ↓
Attach source reference
   ↓
Audit
```

---

# 55. RPA MUST NOT INVENT PATIENT IDENTITIES

If a legacy patient cannot confidently be matched:

```text id="s2k6v4"
Do NOT automatically attach document.
```

Create:

```text id="j8p3x7"
PATIENT_MATCH_AMBIGUOUS
```

and route for human review.

---

# 56. RPA DOCUMENT MATCHING

Matching may use approved identifiers such as:

```text id="k4m9x2"
Patient ID
Legacy Patient ID
Admission ID
Visit ID
Verified identity fields
```

Do not rely only on patient name.

---

# 57. RPA EXCEPTION TYPES

Support:

```text id="v7r2p1"
PATIENT_NOT_FOUND
MULTIPLE_PATIENT_MATCHES
DOCUMENT_MATCH_FAILED
LEGACY_SYSTEM_UNAVAILABLE
LEGACY_LOGIN_FAILED
DOCUMENT_DOWNLOAD_FAILED
INVALID_DOCUMENT
DUPLICATE_DOCUMENT
RECORD_SYNC_MISMATCH
UNAUTHORIZED_RECORD_ACCESS
```

---

# 58. RPA HUMAN REVIEW

If multiple patients match:

```text id="a5n8c3"
Legacy:
Rahul Shah

Possible:
P10045
P10455
P20451
```

Robot must stop.

Flow:

```text id="p7m2x6"
Exception
→ Human Identity Review
→ Confirm Patient
→ RPA Continues
```

---

# 59. ROBOT FRAMEWORK STRUCTURE

Extend:

```text id="b2k7m5"
robot/
├── resources/
│   ├── common.resource
│   ├── api.resource
│   ├── auth.resource
│   ├── patient_records.resource
│   ├── document.resource
│   ├── registration.resource
│   ├── legacy_system.resource
│   └── notification.resource
│
├── keywords/
│   ├── patient_record_keywords.resource
│   ├── document_keywords.resource
│   ├── synchronization_keywords.resource
│   ├── reconciliation_keywords.resource
│   └── exception_keywords.resource
│
├── tests/
│   ├── patient_record_search.robot
│   ├── record_sync.robot
│   ├── document_import.robot
│   ├── record_reconciliation.robot
│   └── record_access.robot
│
└── results/
```

---

# 60. ROBOT KEYWORDS

Create:

```text id="q5f2v8"
Login To Legacy System
Search Patient
Verify Patient Identity
Read Patient Record
Read Visit History
Read Admission
Read Document List
Download Document
Validate Document
Upload Document
Attach Document
Reconcile Record
Create Record Exception
Capture Evidence
Update RPA Job
```

---

# 61. RPA JOB MODEL

Use centralized:

```text id="e7j3p2"
RPAJob
```

Example:

```javascript id="s5d8k2"
{
    jobType: "PATIENT_RECORD_SYNC",

    module: "PATIENT_RECORDS",

    referenceType: "PATIENT",

    referenceId: ObjectId,

    correlationId: String,

    status: String,

    attempts: Number,

    startedAt: Date,

    completedAt: Date,

    errorCode: String,

    errorMessage: String,

    evidenceLocation: String
}
```

---

# 62. NOTIFICATIONS

Patient Records should use the central Notification Service.

Examples:

```text id="w2q7m5"
DOCUMENT_AVAILABLE
LAB_REPORT_AVAILABLE
RADIOLOGY_REPORT_AVAILABLE
DISCHARGE_DOCUMENT_AVAILABLE
RECORD_UPDATE_REQUIRES_REVIEW
```

Do not create a separate notification engine.

---

# 63. DOCUMENT AVAILABLE NOTIFICATION

Example:

```text id="k7p4n2"
A new document is available in your hospital portal.
Please sign in to view it.
```

Avoid exposing sensitive details in SMS/email.

---

# 64. API DESIGN

Use:

```text id="r5t8w3"
/api/patients/:patientId/records
/api/patients/:patientId/timeline
/api/patients/:patientId/visits
/api/patients/:patientId/admissions
/api/patients/:patientId/documents
/api/patients/:patientId/billing
/api/patients/:patientId/insurance
/api/patients/:patientId/laboratory
/api/patients/:patientId/radiology
/api/patients/:patientId/pharmacy
```

These are read/aggregation APIs unless explicitly specified otherwise.

---

# 65. PATIENT SUMMARY API

```http id="q2m7x4"
GET /api/patients/:patientId/records/summary
```

Response:

```json id="m5j8k2"
{
    "patient": {},
    "lastVisit": {},
    "activeAdmission": {},
    "currentBed": {},
    "outstandingBalance": {},
    "activeInsurance": {},
    "recentDocuments": []
}
```

Apply role-specific field filtering.

---

# 66. TIMELINE API

```http id="p4r7w1"
GET /api/patients/:patientId/timeline
```

Support:

```text id="v3k8m2"
from
to
eventType
sourceModule
page
limit
```

---

# 67. DOCUMENT API

```http id="d5q9n1"
GET /api/patients/:patientId/documents
GET /api/documents/:documentId
GET /api/documents/:documentId/download
```

Backend authorization is mandatory.

---

# 68. VISIT API

```http id="a7p2m8"
GET /api/patients/:patientId/visits
GET /api/visits/:visitId
```

Read from Visit/Appointment/OPD services.

---

# 69. ADMISSION API

```http id="k3n8v6"
GET /api/patients/:patientId/admissions
GET /api/admissions/:admissionId
```

Patient Records should use service-level integration.

---

# 70. BILLING API

```http id="z6m2q4"
GET /api/patients/:patientId/billing
```

Financial data must be filtered according to permission.

---

# 71. INSURANCE API

```http id="w5r1n7"
GET /api/patients/:patientId/insurance
```

Mask sensitive information where required.

---

# 72. LAB API

```http id="j4p8s2"
GET /api/patients/:patientId/laboratory
```

Return:

```text id="n7q2m5"
Orders
Samples
Results
Reports
```

---

# 73. RADIOLOGY API

```http id="x8v3k1"
GET /api/patients/:patientId/radiology
```

Return:

```text id="p6r2m9"
Orders
Schedules
Reports
Documents
```

---

# 74. PHARMACY API

```http id="c5w7n2"
GET /api/patients/:patientId/pharmacy
```

Return authorized:

```text id="m8q4s1"
Orders
Dispensing records
Billing references
```

---

# 75. FRONTEND COMPONENTS

Create reusable components:

```text id="r8m3v6"
PatientHeader
PatientSummaryCard
PatientTimeline
VisitHistory
AppointmentHistory
AdmissionHistory
BedHistory
BillingHistory
InsuranceHistory
PharmacyHistory
LabHistory
RadiologyHistory
DocumentLibrary
RecordAccessBanner
RecordFilters
RecordSearch
```

---

# 76. PATIENT RECORD TABS

Recommended:

```text id="x5n8q2"
Overview
Timeline
Visits
Appointments
Admissions
Bed History
Billing
Insurance
Pharmacy
Laboratory
Radiology
Documents
Notifications
Access History
```

Hide tabs that the current role is not permitted to access.

---

# 77. MOBILE RESPONSIVENESS

Patient portal record pages must be mobile-friendly.

Desktop may use:

```text id="n2v7m4"
Sidebar + Timeline
```

Mobile may use:

```text id="q5r8k1"
Accordion
Tabs
Cards
```

---

# 78. SEARCH AND FILTERING

Support:

```text id="m4x7p2"
Date range
Record type
Department
Doctor
Admission
Document type
Status
```

Use pagination for large histories.

Do not load the entire patient record into the browser at once for patients with large histories.

---

# 79. PERFORMANCE

Use:

- pagination
- indexed queries
- lazy loading
- server-side filtering
- caching where appropriate
- document metadata instead of file contents in initial requests

Example:

```text id="k3m8q1"
Patient with 500 documents
```

must not download all 500 documents automatically.

---

# 80. DATABASE INDEXES

Where Patient Records maintains its own metadata/timeline:

```javascript id="v6p2n8"
{
    patientId: 1,
    eventDate: -1
}
```

Document metadata:

```javascript id="q7m3r5"
{
    patientId: 1,
    documentType: 1,
    generatedAt: -1
}
```

Access log:

```javascript id="x4n8k2"
{
    patientId: 1,
    timestamp: -1
}
```

Do not create redundant indexes on source collections from this module.

---

# 81. AUDIT

Record:

```text id="m7q2v5"
PATIENT_RECORD_VIEWED
PATIENT_PROFILE_UPDATED
DOCUMENT_VIEWED
DOCUMENT_DOWNLOADED
BILLING_RECORD_VIEWED
INSURANCE_RECORD_VIEWED
LAB_REPORT_VIEWED
RADIOLOGY_REPORT_VIEWED
RECORD_ACCESS_DENIED
```

---

# 82. ACCESS DENIAL

If unauthorized access is attempted:

```json id="w3k8n2"
{
    "success": false,
    "error": {
        "code": "RECORD_ACCESS_DENIED",
        "message": "You do not have permission to access this patient record.",
        "correlationId": "CORR-20261006-00321"
    }
}
```

The event should be audited.

---

# 83. RBAC

Suggested permissions:

```text id="n5r8q2"
patient_records.view
patient_records.search
patient_records.view_documents
patient_records.download_documents
patient_records.view_billing
patient_records.view_insurance
patient_records.view_lab
patient_records.view_radiology
patient_records.view_pharmacy
patient_records.edit_allowed_profile
patient_records.view_access_history
patient_records.manage_sync
patient_records.manage_rpa
```

---

# 84. ROLE EXAMPLES

### Patient

```text id="p2m7x4"
Own records only
```

### Receptionist

May view:

```text id="v8q3n5"
Identity
Visits
Appointments
Admissions
Administrative documents
```

according to policy.

### Doctor

May access authorized clinical records.

### Nurse

May access authorized clinical records.

### Billing Staff

May access:

```text id="k5r2m8"
Billing
Patient identity
Relevant admission
```

### Insurance Representative

May access:

```text id="x7m4p1"
Insurance
Relevant patient identity
Claims
Supporting documents
```

### Management

Access according to configured reporting policy.

---

# 85. RECORD ACCESS PURPOSE

Where required, ask authorized staff for purpose:

```text id="r4n8q2"
Treatment
Billing
Insurance
Administration
Other configured reason
```

Store the purpose in access logs.

---

# 86. DATA RETENTION

Record retention must be configurable.

Do not hardcode legal retention periods unless provided by hospital policy.

The system should support:

```text id="m2q7v5"
Retention Policy
Document Retention
Audit Retention
Archive Status
```

---

# 87. ARCHIVING

Old records may be archived according to hospital policy.

Archived records must remain:

- discoverable to authorized users
- immutable where required
- auditable
- protected

Do not physically delete records simply because they are old unless an explicit retention/deletion policy authorizes it.

---

# 88. DATA CORRECTION

If a source record contains an error:

```text id="n8m4p2"
Patient Records
    ↓
Identify Source Module
    ↓
Correction through Source Module
    ↓
Patient Records refreshes
```

Never create an unofficial correction in Patient Records.

---

# 89. RECORD RECONCILIATION

RPA or scheduled backend jobs may detect:

```text id="q2v7m5"
Patient ID mismatch
Admission mismatch
Document missing reference
Duplicate document
Missing timeline event
Legacy record mismatch
```

Create an exception.

---

# 90. RECONCILIATION EXAMPLE

Legacy:

```text id="k4m8n2"
Patient ID:
P10045
Admission:
ADM10023
```

MERN:

```text id="x7r3q1"
Patient ID:
P10045
Admission:
ADM10025
```

Do not automatically attach records.

Create:

```text id="v5n2m8"
RECORD_REFERENCE_MISMATCH
```

---

# 91. DOCUMENT DUPLICATE DETECTION

When importing a document, use available metadata such as:

```text id="p8m4q2"
Source Document ID
Checksum
Patient ID
Document Type
Document Date
```

If duplicate is detected:

```text id="r7n3v5"
Do not blindly create another document.
```

Record the reconciliation result.

---

# 92. FILE SECURITY

Uploaded/imported documents must be:

- validated
- scanned where infrastructure supports it
- stored outside public web root
- access controlled
- logged
- associated with patient/reference
- protected against path traversal
- protected against arbitrary file execution

---

# 93. API SECURITY

All patient record APIs must use:

```text id="m3q8v2"
Authentication
Authorization
Validation
Rate limiting where appropriate
Audit
Correlation ID
```

Never expose internal MongoDB IDs unnecessarily if public identifiers can be used.

---

# 94. CORRELATION ID

Every cross-module request should have:

```text id="x7n2m4"
Correlation ID
```

Example:

```text
CORR-20261006-00521
```

This allows:

```text
Patient Record
→ Admission
→ Billing
→ Document
→ RPA
```

to be traced.

---

# 95. SEED DATA

Create demo patient:

```text id="q5m8r2"
Patient:
Rahul Shah

Patient ID:
P10045
```

Include:

```text id="n7v3k1"
3 Visits
2 Appointments
1 Admission
2 Bed Assignments
1 Discharge
3 Bills
2 Payments
1 Insurance Policy
2 Claims
3 Lab Orders
2 Lab Reports
2 Radiology Orders
1 Radiology Report
4 Documents
```

Use realistic relationships.

---

# 96. PATIENT TIMELINE DEMO

Example:

```text id="r2m7x4"
01 Sep
Registration

15 Sep
Appointment

01 Oct
OPD Visit

01 Oct
Admission

01 Oct
Bed Assignment

02 Oct
Lab Report

03 Oct
Radiology Report

05 Oct
Bed Transfer

08 Oct
Final Invoice

08 Oct
Payment

08 Oct
Discharge

08 Oct
Discharge Documents
```

---

# 97. TESTING

Implement:

```text id="n4q8m2"
Unit Tests
API Tests
Integration Tests
Authorization Tests
Document Access Tests
RPA Tests
Reconciliation Tests
End-to-End Tests
```

---

# 98. UNIT TESTS

Test:

```text id="v7m3p5"
Timeline generation
Patient identity mapping
Document filtering
Access control
Profile change validation
Record aggregation
Duplicate detection
```

---

# 99. API TESTS

Test:

```text id="q2n8m4"
Patient summary
Timeline
Visits
Admissions
Documents
Billing
Insurance
Laboratory
Radiology
Pharmacy
```

---

# 100. AUTHORIZATION TESTS

Verify:

```text id="m5r7v2"
Patient A cannot access Patient B
Billing staff cannot access restricted clinical content
Unauthorized user cannot download documents
Insurance staff cannot modify clinical records
```

---

# 101. DOCUMENT SECURITY TEST

Attempt:

```text id="x8q3n5"
User A requests Patient B's document
```

Expected:

```text id="v2m7r4"
403 RECORD_ACCESS_DENIED
```

and audit event created.

---

# 102. RPA TEST

Robot must demonstrate:

```text id="q5n8m2"
Search legacy patient
Verify identity
Read record
Import document
Attach document
Verify
Update RPA Job
```

---

# 103. RPA AMBIGUOUS MATCH TEST

Input:

```text id="m4r7v2"
Name:
Rahul Shah
```

Legacy returns multiple matches.

Expected:

```text id="n8q3m5"
Robot stops
Exception created
Human review requested
No document attached
```

---

# 104. ACCEPTANCE CRITERIA

The module is accepted only when:

### Patient identity

- [ ] Permanent Patient ID is used consistently.
- [ ] Patient is not duplicated per visit.
- [ ] Emergency temporary records are supported.
- [ ] Identity ambiguity is handled safely.

### Timeline

- [ ] Visits appear.
- [ ] Appointments appear.
- [ ] Admissions appear.
- [ ] Bed assignments appear.
- [ ] Billing events appear.
- [ ] Lab events appear.
- [ ] Radiology events appear.
- [ ] Pharmacy events appear.
- [ ] Discharge appears.
- [ ] Documents appear.

### Documents

- [ ] Authorized documents are visible.
- [ ] Unauthorized documents are blocked.
- [ ] Download access is protected.
- [ ] Document metadata is tracked.
- [ ] Document versions are preserved.

### Clinical safety

- [ ] No clinical interpretation is performed.
- [ ] Signed/finalized documents cannot be silently edited.
- [ ] RPA cannot modify clinical findings.

### Security

- [ ] RBAC works.
- [ ] Patient ownership is validated.
- [ ] Access attempts are logged.
- [ ] Sensitive information is protected.

### RPA

- [ ] Legacy record synchronization works.
- [ ] Document import works.
- [ ] Duplicate detection works.
- [ ] Ambiguous matching creates human-review exceptions.
- [ ] RPA jobs are traceable.

### Performance

- [ ] Large record histories use pagination.
- [ ] Documents are lazy-loaded.
- [ ] Search is indexed.
- [ ] Timeline queries are performant.

---

# 105. END-TO-END ACCEPTANCE SCENARIO

The implementation must demonstrate:

```text id="g6p2n8"
1. Patient registered
       ↓
2. Patient receives permanent Patient ID
       ↓
3. Appointment created
       ↓
4. Visit created
       ↓
5. Admission created
       ↓
6. Bed assigned
       ↓
7. Lab order created
       ↓
8. Lab report generated
       ↓
9. Radiology order created
       ↓
10. Radiology report generated
       ↓
11. Pharmacy transaction recorded
       ↓
12. Billing generated
       ↓
13. Payment recorded
       ↓
14. Discharge completed
       ↓
15. Documents generated
       ↓
16. Patient Records timeline displays all authorized events
```

---

# 106. IMPLEMENTATION ORDER

## Phase 1 — Record Aggregation

Implement:

```text id="m8q3v5"
Patient summary
Timeline
Visits
Appointments
Admissions
```

---

## Phase 2 — Historical Modules

Connect:

```text id="n2r7k4"
Bed Management
Discharge
Billing
Insurance
```

---

## Phase 3 — Clinical/Service Records

Connect:

```text id="q5m8v2"
Pharmacy
Laboratory
Radiology
```

---

## Phase 4 — Documents

Connect central Document Generation/Storage service.

---

## Phase 5 — Patient Portal

Build:

```text id="r7n3m5"
Overview
Timeline
Documents
Bills
Reports
```

---

## Phase 6 — Staff Portal

Implement role-specific views.

---

## Phase 7 — Access Control

Implement:

```text id="v2m8q4"
RBAC
Patient ownership
Document authorization
Record access logs
```

---

## Phase 8 — RPA

Implement:

```text id="k5n7r2"
Legacy synchronization
Document import
Reconciliation
Exception handling
```

---

## Phase 9 — Testing

Run full test suite.

---

# 107. DO NOT IMPLEMENT

The coding agent MUST NOT implement:

```text id="x4m8q2"
Clinical diagnosis
Clinical interpretation
Medical recommendation
Treatment recommendation
Medication recommendation
Radiology interpretation
Lab interpretation
Discharge fitness determination
Insurance approval
Claim approval/rejection
Financial adjustment approval
Unauthorized record merging
Automatic identity merging
Clinical data modification by RPA
```

---

# 108. FINAL ARCHITECTURE

Use:

```text id="q7m3v5"
                    ┌───────────────────────┐
                    │    Patient Records    │
                    │   Aggregation Layer   │
                    └───────────┬───────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
     Registration          Appointments           Admissions
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
       Billing              Insurance             Bed Mgmt
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
      Pharmacy                 Lab                Radiology
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
                                ▼
                         Document Service
                                │
                                ▼
                         Patient Portal
```

Patient Records is the **authorized longitudinal view**, not a replacement for the source modules.

---

# 109. DEFINITION OF DONE

`07_PATIENT_RECORDS.md` is fully implemented when:

- [ ] Patient summary works.
- [ ] Permanent Patient ID is respected.
- [ ] Visit history works.
- [ ] Appointment history works.
- [ ] OPD history works.
- [ ] Admission history works.
- [ ] Bed history works.
- [ ] Discharge history works.
- [ ] Billing history works.
- [ ] Payment history works.
- [ ] Insurance history works.
- [ ] Pharmacy history works.
- [ ] Laboratory history works.
- [ ] Radiology history works.
- [ ] Longitudinal timeline works.
- [ ] Document library works.
- [ ] Document download authorization works.
- [ ] Patient portal works.
- [ ] Staff role-specific access works.
- [ ] Sensitive records are protected.
- [ ] Access logs work.
- [ ] Profile changes are audited.
- [ ] Emergency temporary records are supported.
- [ ] Ambiguous identity matches require human review.
- [ ] RPA synchronization works.
- [ ] RPA document import works.
- [ ] Reconciliation works.
- [ ] Exceptions work.
- [ ] Audit logging works.
- [ ] Pagination works.
- [ ] Large patient histories perform correctly.
- [ ] End-to-end record aggregation works.

---

# 110. FINAL INSTRUCTION TO THE AI CODING AGENT

Build this module as a **secure, production-quality longitudinal Patient Records system**.

The final implementation must provide:

```text id="v8m2q5"
Patient Identity
+
Timeline
+
Visits
+
Appointments
+
OPD
+
Admissions
+
Beds
+
Discharge
+
Billing
+
Insurance
+
Pharmacy
+
Laboratory
+
Radiology
+
Documents
+
Patient Portal
+
Role-Based Staff Access
+
Audit
+
RPA Synchronization
+
Exception Handling
```

Use the source module as the authoritative owner of each record.

Never create duplicate business logic merely to display data.

Most importantly:

> **Patient Records is an aggregation and authorized-access layer, not a replacement for Registration, Admission, Billing, Insurance, Pharmacy, Laboratory, Radiology, or Bed Management.**

> **The permanent Patient ID is the central patient identity.**

> **Historical records must remain traceable and must not be silently overwritten.**

> **Clinical information may be displayed when authorized, but Patient Records and RPA must never independently interpret, diagnose, or modify clinical content.**

> **A patient may access only their own authorized records, and every sensitive record access must be auditable.**

> **Ambiguous patient/document matching must stop for human review rather than guessing.**