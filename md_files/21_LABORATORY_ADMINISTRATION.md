# 21 — LABORATORY ADMINISTRATION

## 1. MODULE OVERVIEW

### Module Name
**Laboratory Administration**

### Module Code
`LAB`

### Purpose

Build a complete hospital laboratory administration and operational management module inside the existing MERN-based Hospital Administrative Automation & RPA Platform.

The module must manage the **administrative and operational lifecycle of laboratory services**, including:

- Laboratory test master
- Test catalog
- Lab orders
- Patient/sample identification
- Sample collection
- Accession number generation
- Sample receiving
- Sample processing workflow
- Result entry workflow
- Result verification workflow
- Report generation
- Report release
- Sample rejection
- Lab service billing integration
- Laboratory inventory consumption integration
- External LIS/HIS integration
- RPA automation
- Notifications
- Documents
- Exceptions
- Audit trail
- Laboratory operational reports and analytics

The system must maintain complete traceability from:

```text
Patient
   ↓
Visit / Admission
   ↓
Doctor / Authorized User Orders Test
   ↓
Lab Order
   ↓
Sample Collection
   ↓
Accession Number
   ↓
Sample Receiving
   ↓
Processing
   ↓
Result Entry
   ↓
Result Verification
   ↓
Report Finalization
   ↓
Report Release
   ↓
Patient / Doctor Access
```

---

# 2. CRITICAL CLINICAL SAFETY BOUNDARY

This module is an **administrative and laboratory workflow system**.

It is NOT an autonomous clinical decision-making system.

The system and RPA must NEVER:

- Diagnose a patient.
- Interpret laboratory results.
- Decide whether a result is medically dangerous.
- Change a laboratory result automatically.
- Change a reference range automatically.
- Invent a result.
- Invent a unit.
- Invent a specimen type.
- Change test methodology.
- Approve a clinical result without authorized verification.
- Decide treatment.
- Recommend medication.
- Decide whether a patient requires admission.
- Decide whether a patient requires emergency treatment.
- Determine medical priority autonomously.
- Override a laboratory professional.
- Modify a verified result without an authorized amendment workflow.
- Release an unverified result unless hospital configuration explicitly permits it.
- Decide insurance coverage.
- Approve insurance claims.

RPA is allowed to automate **administrative actions only**.

The global automation principle is:

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
UPDATE SYSTEM
  ↓
NOTIFY
  ↓
AUDIT LOG
```

For ambiguous or high-risk situations:

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

# 3. SYSTEM ARCHITECTURE

The module must be implemented inside the existing architecture.

```text
React.js
   │
   │ REST API
   ▼
Node.js + Express.js
   │
   ├── Laboratory Controllers
   ├── Laboratory Services
   ├── Validators
   ├── Authorization
   ├── Notification Service
   ├── Document Service
   ├── Billing Integration
   ├── Inventory Integration
   ├── RPA Job Service
   └── Audit Service
   │
   ▼
MongoDB + Mongoose
   │
   ├── LabTest
   ├── LabOrder
   ├── LabOrderItem
   ├── LabSample
   ├── LabResult
   ├── LabReport
   ├── LabException
   └── Lab-related audit/history
```

Robot Framework operates as the automation worker:

```text
Hospital MERN Application
        │
        ▼
     RPA Job
        │
        ▼
Robot Framework
        │
        ├── External HIS
        ├── External LIS
        ├── Insurance/Lab Portals where applicable
        └── Legacy systems
        │
        ▼
Verification
        │
        ▼
MERN Application
```

The MERN system remains the system of record.

Robot Framework must NOT become the database.

---

# 4. ACTORS AND RBAC

## 4.1 Laboratory Technician

Can:

- View lab orders assigned to laboratory.
- View sample collection queue.
- Register samples.
- Collect samples.
- Generate/accession sample IDs.
- Receive samples.
- Update operational sample status.
- Enter laboratory results where permitted.
- View pending verification queue.
- Upload laboratory documents.
- Record sample rejection.
- Record operational exceptions.

Cannot:

- Change patient identity.
- Change doctor identity.
- Modify an approved clinical order without authorization.
- Approve own result if segregation of duties is configured.
- Change verified results directly.
- Release unauthorized reports.

---

# 5. Pathologist / Authorized Result Verifier

Can:

- Review entered results.
- Verify results.
- Approve/finalize reports.
- Amend reports through controlled workflow.
- Release results.
- Review result history.
- Review amendments.

Cannot:

- Delete historical verified results.
- Erase audit history.

---

# 6. Doctor

Can:

- Order laboratory tests.
- View patient laboratory order status.
- View released reports.
- View authorized result history.

Cannot:

- Modify laboratory results.
- Verify laboratory results unless explicitly configured as an authorized verifier.
- Delete laboratory records.

---

# 7. Nurse

Can:

- View relevant laboratory orders.
- View collection requirements where permitted.
- View released reports.
- Assist with collection workflow if authorized.

---

# 8. Receptionist

Can:

- Create administrative laboratory requests where hospital policy permits.
- View order status.
- Verify patient details.
- Print requisition documents.
- View billing status.

Cannot:

- Enter laboratory results.
- Verify results.
- Release reports.

---

# 9. Billing Staff

Can:

- View laboratory charges.
- View billing references.
- Reconcile laboratory charges.

Cannot:

- Modify clinical results.

---

# 10. Inventory Staff

Can:

- View laboratory consumable requests/usage.
- Process inventory transactions generated by laboratory.

Cannot:

- Modify laboratory test results.

---

# 11. Administrative Manager

Can:

- View laboratory operational reports.
- Configure administrative settings.
- Review exceptions.
- Monitor performance.

---

# 12. System Administrator

Can:

- Configure module permissions.
- Manage laboratory configuration.
- Manage integrations.
- Manage RPA credentials/configuration references.
- View technical logs.

Must NOT receive unrestricted access to clinical result content unless explicitly granted by hospital policy.

---

# 13. PATIENT

Patient Portal can display:

- Laboratory orders.
- Collection instructions.
- Sample status.
- Released reports.
- Laboratory documents.
- Report history.

Patients must NOT see unverified laboratory results unless explicitly enabled by hospital configuration.

---

# 14. LABORATORY TEST MASTER

Create a configurable laboratory test catalog.

## Entity

`LabTest`

## Fields

```javascript
{
  labTestId: String,

  code: String,

  name: String,

  category: String,

  description: String,

  specimenType: String,

  containerType: String,

  collectionInstructions: String,

  preparationInstructions: String,

  fastingRequired: Boolean,

  turnaroundTimeMinutes: Number,

  departmentId: ObjectId,

  externalCode: String,

  chargeCode: String,

  priceReference: Number,

  status: String,

  activeFrom: Date,

  inactiveFrom: Date,

  createdBy: ObjectId,

  updatedBy: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

### Important

Do NOT hard-code medical reference ranges into application logic.

If reference ranges are required, they must be configurable and managed by authorized laboratory/clinical personnel.

---

# 15. LAB TEST STATUS

Use:

```text
DRAFT
ACTIVE
INACTIVE
RETIRED
PENDING_APPROVAL
```

Only `ACTIVE` tests should normally be available for new orders.

Historical orders must continue referencing the original test configuration.

---

# 16. TEST CATEGORIES

The system should support configurable categories such as:

```text
Hematology
Biochemistry
Microbiology
Immunology
Serology
Pathology
Urinalysis
Clinical Chemistry
Molecular Diagnostics
Other
```

These are configuration examples and must not be hard-coded as the only allowed categories.

---

# 17. LAB ORDER

Create:

`LabOrder`

A laboratory order represents a request for one or more laboratory tests for a patient encounter.

## Fields

```javascript
{
  orderId: String,

  patientId: ObjectId,

  visitId: ObjectId,

  admissionId: ObjectId,

  orderingDoctorId: ObjectId,

  orderDateTime: Date,

  priority: String,

  clinicalNote: String,

  status: String,

  collectionLocation: String,

  billingReferenceId: ObjectId,

  externalLisOrderId: String,

  source: String,

  cancellationReason: String,

  createdBy: ObjectId,

  updatedBy: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

`admissionId` may be null for outpatient orders.

---

# 18. LAB ORDER ITEM

A single LabOrder can contain multiple tests.

Create:

`LabOrderItem`

```javascript
{
  orderItemId: String,

  orderId: ObjectId,

  labTestId: ObjectId,

  testNameSnapshot: String,

  testCodeSnapshot: String,

  specimenTypeSnapshot: String,

  collectionInstructionsSnapshot: String,

  priceSnapshot: Number,

  status: String,

  sampleId: ObjectId,

  resultId: ObjectId,

  reportId: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

Snapshot important test information so historical records remain stable even if the test master changes later.

---

# 19. LAB ORDER PRIORITY

Use configurable priorities:

```text
NORMAL
URGENT
STAT
```

Important:

`STAT` is an administrative/operational priority assigned by an authorized user.

RPA must never infer that a patient needs STAT testing based on symptoms, patient data, or result values.

---

# 20. LAB ORDER STATUS

Use:

```text
DRAFT
ORDERED
SCHEDULED
AWAITING_COLLECTION
PARTIALLY_COLLECTED
COLLECTED
IN_PROCESS
PARTIALLY_COMPLETED
COMPLETED
REPORT_READY
RELEASED
CANCELLED
ON_HOLD
```

---

# 21. LAB ORDER WORKFLOW

## Standard workflow

```text
Doctor / Authorized User
        ↓
Create Lab Order
        ↓
Validate Patient
        ↓
Validate Visit / Admission
        ↓
Validate Test
        ↓
Create Lab Order
        ↓
Billing Integration
        ↓
Collection Queue
        ↓
Sample Collection
        ↓
Accession Number
        ↓
Sample Reception
        ↓
Processing
        ↓
Result Entry
        ↓
Verification
        ↓
Report Generation
        ↓
Report Release
        ↓
Notification
```

---

# 22. PATIENT VALIDATION

Before creating a lab order:

1. Verify Patient ID.
2. Verify patient exists.
3. Verify visit/admission where required.
4. Verify ordering user.
5. Verify test exists.
6. Verify test is active.
7. Verify required specimen configuration exists.
8. Check duplicate/open order according to configurable rules.

If patient identity is ambiguous:

```text
Do NOT automatically choose a patient.
Create exception.
Send for human verification.
```

---

# 23. DUPLICATE LAB ORDER DETECTION

The system should detect potential duplicates using:

- Patient ID
- Test ID
- Visit ID
- Admission ID
- Similar recent order
- Current order status

Do not automatically cancel duplicates unless the rule is explicitly configured.

Example:

```text
Patient: P10045
Visit: V20341
Test: CBC
Existing Order: LAB-2026-10021
Status: AWAITING_COLLECTION

New CBC order detected.
```

System:

```text
Potential duplicate detected.
Human confirmation required.
```

---

# 24. SAMPLE MANAGEMENT

Create:

`LabSample`

## Fields

```javascript
{
  sampleId: String,

  accessionNumber: String,

  orderId: ObjectId,

  orderItemId: ObjectId,

  patientId: ObjectId,

  specimenType: String,

  containerType: String,

  collectionDateTime: Date,

  collectedBy: ObjectId,

  collectionLocation: String,

  receivedDateTime: Date,

  receivedBy: ObjectId,

  processingLocation: String,

  status: String,

  rejectionReason: String,

  rejectionNotes: String,

  externalLisSampleId: String,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 25. ACCESSION NUMBER

Every accepted laboratory sample must have a unique accession number.

Example:

```text
ACC-2026-000001
ACC-2026-000002
ACC-2026-000003
```

Generation must be:

- Unique
- Concurrency-safe
- Auditable
- Non-reusable

Never generate accession numbers using simple frontend counters.

Use a backend atomic sequence/counter mechanism.

---

# 26. SAMPLE STATUS

Use:

```text
REGISTERED
COLLECTED
RECEIVED
ACCEPTED
REJECTED
IN_PROCESS
COMPLETED
DISPOSED
ARCHIVED
```

---

# 27. SAMPLE COLLECTION

The collection screen must display:

- Patient ID
- Patient name
- Date of birth/age where permitted
- Order ID
- Test
- Specimen type
- Container type
- Collection instructions
- Priority
- Ordering doctor
- Visit/admission
- Collection location

Collector enters:

- Collection timestamp
- Collector
- Collection status
- Notes if required

---

# 28. SAMPLE IDENTIFICATION

Sample identification must use at least:

```text
Patient
+
Order
+
Order Item
+
Accession Number
```

The system must prevent a sample from being associated with a different patient without an explicit authorized correction workflow.

---

# 29. SAMPLE REJECTION

Sample rejection must be supported.

Example operational rejection reasons:

```text
INSUFFICIENT_SAMPLE
WRONG_CONTAINER
MISSING_LABEL
LABEL_MISMATCH
LEAKED_CONTAINER
DAMAGED_CONTAINER
SAMPLE_NOT_RECEIVED
SAMPLE_STABILITY_EXCEEDED
DUPLICATE_SAMPLE
OTHER
```

The list must be configurable.

These are operational rejection reasons.

They must NOT be used to make clinical diagnoses.

---

# 30. REJECTED SAMPLE WORKFLOW

```text
Sample
 ↓
Rejected
 ↓
Record reason
 ↓
Notify responsible department
 ↓
Create recollection task if applicable
 ↓
Update order
 ↓
Authorized staff decides next action
```

RPA can automate notifications and administrative updates.

RPA must not independently decide that a recollection is medically required.

---

# 31. LAB RESULT

Create:

`LabResult`

## Fields

```javascript
{
  resultId: String,

  orderId: ObjectId,

  orderItemId: ObjectId,

  sampleId: ObjectId,

  patientId: ObjectId,

  testId: ObjectId,

  resultValue: String,

  resultText: String,

  unit: String,

  referenceRangeSnapshot: String,

  abnormalFlag: String,

  status: String,

  enteredBy: ObjectId,

  enteredAt: Date,

  verifiedBy: ObjectId,

  verifiedAt: Date,

  releasedBy: ObjectId,

  releasedAt: Date,

  amendmentReason: String,

  previousResultId: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 32. RESULT STATUS

Use:

```text
DRAFT
ENTERED
PENDING_VERIFICATION
VERIFIED
AMENDED
RELEASED
CANCELLED
```

---

# 33. RESULT ENTRY

Authorized laboratory personnel may enter:

- Numeric values
- Text values
- Units
- Configured reference range snapshot
- Authorized flags
- Laboratory comments where permitted

The system must validate data type according to the test configuration.

Example:

```text
Test: Hemoglobin
Expected type: Numeric

Entered:
13.4

Unit:
g/dL
```

The application must NOT automatically conclude:

```text
"Patient is healthy."
```

or:

```text
"Patient has anemia."
```

Such interpretation is outside the module's autonomous boundary.

---

# 34. RESULT VERIFICATION

Workflow:

```text
Result Entered
      ↓
PENDING_VERIFICATION
      ↓
Authorized Verifier
      ↓
Review
      ↓
VERIFY
      ↓
VERIFIED
```

Verifier should be able to see:

- Patient
- Order
- Test
- Sample
- Result
- Unit
- Configured reference information
- Previous amendments
- Audit history

---

# 35. SEGREGATION OF DUTIES

Where hospital policy requires:

```text
Result Entry User ≠ Result Verification User
```

The system should enforce this.

Make the rule configurable.

---

# 36. RESULT AMENDMENT

Verified/released results must never be silently edited.

Use an amendment workflow:

```text
Released Result
      ↓
Amendment Request
      ↓
Reason Required
      ↓
Authorized Review
      ↓
New Result Version
      ↓
Audit Previous Version
      ↓
Updated Report
      ↓
Notify Relevant Users
```

Historical versions must remain available.

---

# 37. LAB REPORT

Create:

`LabReport`

## Fields

```javascript
{
  reportId: String,

  reportNumber: String,

  orderId: ObjectId,

  patientId: ObjectId,

  reportVersion: Number,

  status: String,

  generatedDocumentId: ObjectId,

  verifiedBy: ObjectId,

  verifiedAt: Date,

  releasedBy: ObjectId,

  releasedAt: Date,

  amendmentReason: String,

  previousReportId: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 38. REPORT STATUS

Use:

```text
DRAFT
PENDING_VERIFICATION
FINALIZED
RELEASED
AMENDED
CANCELLED
```

---

# 39. REPORT GENERATION

A report should contain, according to hospital configuration:

### Header

- Hospital name
- Hospital logo
- Laboratory name
- Address/contact information

### Patient information

- Patient ID
- Patient name
- Relevant demographic fields
- Visit ID
- Admission ID if applicable

### Order information

- Order ID
- Ordering doctor
- Order date
- Sample/accession number

### Results

- Test
- Result
- Unit
- Reference range
- Configured flags

### Verification

- Authorized verifier
- Verification timestamp

### Footer

- Document/report number
- Version
- Generation timestamp
- Amendment information if applicable

---

# 40. REPORT VERSIONING

Example:

```text
LAB-RPT-2026-00051
Version 1
```

After amendment:

```text
LAB-RPT-2026-00051
Version 2
```

Version 1 must remain auditable.

---

# 41. REPORT RELEASE

Only authorized users may release reports.

Workflow:

```text
Report Finalized
       ↓
Release
       ↓
Report Status = RELEASED
       ↓
Patient/Doctor access enabled
       ↓
Notification
```

---

# 42. PATIENT PORTAL

Create laboratory section:

```text
Patient Portal
   └── Laboratory
       ├── My Orders
       ├── Collection Instructions
       ├── Sample Status
       ├── Reports
       └── Report History
```

---

# 43. PATIENT LABORATORY VIEW

Display:

```text
Order ID
Test
Order Date
Status
Sample Status
Report Status
```

Example:

```text
LAB-2026-10023

CBC
Status: Report Released

[View Report]
[Download PDF]
```

---

# 44. SECURE REPORT ACCESS

Do not expose sensitive result data directly in SMS/email.

Instead send:

```text
Your laboratory report is available.

Please log in to the hospital portal to securely view your report.
```

Use authenticated portal access or a secure expiring document link according to hospital security configuration.

---

# 45. DOCTOR PORTAL

Doctors should have:

```text
Doctor Portal
   └── Laboratory
       ├── Pending Orders
       ├── Processing Orders
       ├── Completed Reports
       └── Patient Laboratory History
```

Only authorized patient records should be visible.

---

# 46. LABORATORY OPERATIONS PORTAL

Create:

```text
Operations Portal
   └── Laboratory
       ├── Dashboard
       ├── Test Master
       ├── Orders
       ├── Collection Queue
       ├── Sample Reception
       ├── Processing Queue
       ├── Result Entry
       ├── Verification Queue
       ├── Reports
       ├── Rejected Samples
       ├── Exceptions
       ├── External LIS Sync
       └── Analytics
```

---

# 47. LAB DASHBOARD

Display:

```text
Today's Orders
Pending Collection
Collected Samples
Samples Awaiting Reception
Samples In Process
Results Pending Verification
Reports Ready
Reports Released
Rejected Samples
Exceptions
```

Additional configurable KPIs:

- Average turnaround time
- Orders by category
- Pending samples
- Rejected sample rate
- Report release count
- External LIS failures

---

# 48. LAB ORDER SCREEN

Table columns:

```text
Order ID
Patient
Visit
Doctor
Tests
Priority
Order Date
Sample Status
Result Status
Report Status
Actions
```

Actions:

```text
View
Collect
Register Sample
Receive
Process
Enter Result
View Result
Verify
Generate Report
Release
```

Actions must depend on RBAC and current state.

---

# 49. COLLECTION QUEUE

Display:

```text
Patient
Order
Test
Specimen
Priority
Waiting Time
Collection Status
```

Sorting may use configured administrative rules such as:

1. STAT
2. URGENT
3. NORMAL
4. Order time

This is only an operational queue ordering mechanism.

RPA must not determine clinical priority.

---

# 50. SAMPLE RECEPTION SCREEN

Laboratory staff should be able to:

- Search accession number.
- Scan/enter accession number if supported.
- Verify patient.
- Verify order.
- Verify specimen.
- Accept sample.
- Reject sample.
- Record rejection reason.
- Add notes.

---

# 51. RESULT ENTRY SCREEN

Display:

```text
Patient
Order
Test
Sample
Result
Unit
Reference Range
Flag
Comments
```

Buttons:

```text
Save Draft
Submit for Verification
```

Do not provide an unrestricted "Modify Verified Result" button.

---

# 52. VERIFICATION SCREEN

Display:

```text
Patient
Order
Sample
Test
Result
Unit
Reference Range
Previous versions
Audit history
```

Actions:

```text
Verify
Return for Correction
Hold
```

The exact clinical verification rules must be configurable and managed by authorized laboratory personnel.

---

# 53. REPORT RELEASE SCREEN

Display:

```text
Report
Version
Verification Status
Verifier
Generated Date
```

Action:

```text
Release Report
```

Confirmation should be required before release.

---

# 54. BILLING INTEGRATION

Laboratory module must integrate with Billing.

Possible billing events:

```text
Order Created
Sample Collected
Test Completed
Report Released
```

The actual charging event must be configurable.

Do NOT hard-code one charging policy.

For example:

```javascript
laboratoryBillingPolicy = {
  chargeAt: "ORDER"
}
```

or:

```javascript
laboratoryBillingPolicy = {
  chargeAt: "COMPLETION"
}
```

---

# 55. BILLING IDEMPOTENCY

A laboratory test must not accidentally generate duplicate charges.

Use:

```text
billingReferenceId
sourceModule = LABORATORY
sourceEntityId = LabOrderItem ID
```

Before creating a charge:

```text
Does charge already exist?
    YES → return existing charge
    NO → create charge
```

---

# 56. INSURANCE INTEGRATION

Laboratory charges may participate in insurance processing.

However:

Laboratory module must NOT determine:

- Insurance eligibility
- Coverage
- Claim approval
- Claim rejection
- Patient financial responsibility

It only provides accurate laboratory service information to:

```text
Billing
Insurance Verification
Insurance Claims
```

---

# 57. MEDICAL INVENTORY INTEGRATION

Laboratory may consume:

- Reagents
- Tubes
- Containers
- Consumables
- Other configured laboratory supplies

Medical Inventory remains the inventory source of truth.

Laboratory must not maintain a second independent stock ledger.

Workflow:

```text
Lab Processing
      ↓
Consumable Used
      ↓
Inventory Movement Request
      ↓
Medical Inventory
      ↓
Stock Deducted
```

---

# 58. INVENTORY CONSUMPTION

Create controlled consumption references:

```javascript
{
  sourceModule: "LABORATORY",
  sourceEntityId: "...",
  inventoryItemId: "...",
  batchId: "...",
  quantity: 1,
  consumedBy: "...",
  consumedAt: "..."
}
```

Duplicate consumption must be prevented.

---

# 59. CRITICAL / URGENT RESULT ROUTING

The system may support configurable result flags.

However:

The system must NOT determine clinically critical status autonomously unless a formally configured and authorized laboratory rule exists.

If an authorized rule produces:

```text
CRITICAL_RESULT_FLAG
```

the system may:

- Create notification
- Create task
- Notify authorized clinical personnel
- Log acknowledgement

RPA may route the notification.

RPA must NOT interpret the result.

---

# 60. NOTIFICATIONS

Use the centralized Notification Service.

Possible events:

### Lab order created

Notify patient where configured.

### Collection required

Notify patient with instructions.

### Sample rejected

Notify responsible staff.

### Sample delayed

Notify responsible staff.

### Report released

Notify patient and authorized doctor.

### Report amended

Notify affected authorized users according to policy.

### Critical-result routing

Notify authorized clinical personnel only.

---

# 61. SMS/EMAIL SECURITY

Never send sensitive result values through ordinary SMS/email.

Use:

```text
Notification
   ↓
Secure Portal
   ↓
Authenticated User
   ↓
Report
```

---

# 62. DOCUMENTS

Laboratory documents may include:

```text
Lab Requisition
Sample Collection Receipt
Sample Rejection Notice
Laboratory Report
Amended Laboratory Report
External LIS Report
```

All generated documents must be linked to:

```text
Patient
Visit
Order
Order Item
Sample
Report
```

where applicable.

---

# 63. EXTERNAL LIS INTEGRATION

The system must support integration with an external Laboratory Information System.

Preferred order:

```text
API
 ↓
Secure File Integration
 ↓
RPA Browser Automation
```

Use Robot Framework browser automation only when API/integration is unavailable or impractical.

---

# 64. EXTERNAL LIS ORDER FLOW

```text
Hospital System
      ↓
Lab Order
      ↓
RPA Job
      ↓
Login to LIS
      ↓
Search Patient
      ↓
Verify Identity
      ↓
Create Lab Order
      ↓
Enter Tests
      ↓
Submit
      ↓
Read Confirmation
      ↓
Capture External LIS Order ID
      ↓
Verify
      ↓
Update MERN
```

---

# 65. EXTERNAL LIS RESULT FLOW

```text
External LIS
      ↓
RPA/API
      ↓
Retrieve Report
      ↓
Verify Patient
      ↓
Verify Order
      ↓
Verify Report Identifier
      ↓
Store External Document
      ↓
Update Status
      ↓
Human Verification if required
      ↓
Release
```

RPA must never blindly import an uncertain result.

---

# 66. EXTERNAL RESULT MISMATCH

If:

```text
Patient mismatch
OR
Order mismatch
OR
Test mismatch
OR
Report identifier mismatch
```

then:

```text
STOP
 ↓
Create ExceptionCase
 ↓
Capture evidence
 ↓
Human Review
```

Never guess.

---

# 67. RPA JOB MODEL

Use the global `RPAJob` / `RPAExecution` architecture.

Each laboratory automation must contain:

```text
RPA Job ID
Correlation ID
Module = LABORATORY
Operation
Entity ID
Started At
Completed At
Status
Attempt
Robot Name
Evidence
Error
```

---

# 68. RPA OPERATIONS

Possible operations:

```text
LAB_ORDER_EXTERNAL_SYNC
LAB_SAMPLE_STATUS_SYNC
LAB_LIS_ORDER_ENTRY
LAB_LIS_RESULT_RETRIEVAL
LAB_REPORT_DOWNLOAD
LAB_RESULT_RECONCILIATION
LAB_NOTIFICATION
LAB_BILLING_RECONCILIATION
LAB_INVENTORY_RECONCILIATION
```

---

# 69. ROBOT FRAMEWORK STRUCTURE

Create:

```text
robot/
├── portals/
│   └── laboratory/
│       ├── lis_login.robot
│       ├── lab_order.robot
│       ├── sample_status.robot
│       └── report_download.robot
│
├── keywords/
│   └── laboratory/
│       ├── lab_login.resource
│       ├── lab_order_keywords.resource
│       ├── sample_keywords.resource
│       ├── result_keywords.resource
│       └── report_keywords.resource
│
├── tests/
│   └── laboratory/
│       ├── lab_order_sync.robot
│       ├── sample_reconciliation.robot
│       ├── report_retrieval.robot
│       └── exception_handling.robot
│
├── resources/
│   ├── common.resource
│   ├── api.resource
│   ├── authentication.resource
│   └── evidence.resource
│
└── results/
```

---

# 70. ROBOT FRAMEWORK KEYWORD EXAMPLES

Create reusable keywords such as:

```text
Login To Laboratory System
Search Patient By Patient ID
Verify Patient Identity
Create External Lab Order
Add Laboratory Test
Submit Laboratory Order
Capture External Order ID
Search External Lab Order
Read Sample Status
Download Laboratory Report
Verify Report Identity
Upload Laboratory Report
Create Laboratory Exception
Capture Screenshot
Log RPA Execution
```

---

# 71. RPA FAILURE HANDLING

Example:

```text
Login failed
    ↓
Retry according to configured policy
    ↓
Still failed?
    ↓
Create Exception
    ↓
Notify Operations
```

Do not endlessly retry.

---

# 72. RPA UNKNOWN RESULT

If an external action may have succeeded but confirmation is unavailable:

Example:

```text
RPA submitted laboratory order
↓
Browser crashed
↓
No confirmation captured
```

Do NOT submit again immediately.

Instead:

```text
UNKNOWN
 ↓
Reconcile external system
 ↓
Determine whether order exists
 ↓
Continue OR human review
```

This prevents duplicate orders.

---

# 73. LAB EXCEPTION MODEL

Create:

`LabException`

Fields:

```javascript
{
  exceptionId: String,

  type: String,

  severity: String,

  patientId: ObjectId,

  orderId: ObjectId,

  sampleId: ObjectId,

  resultId: ObjectId,

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

# 74. EXCEPTION TYPES

Support:

```text
PATIENT_MISMATCH
INVALID_ORDER
UNKNOWN_TEST
DUPLICATE_ORDER
DUPLICATE_ACCESSION
SAMPLE_MISMATCH
SAMPLE_REJECTED
EXTERNAL_LIS_UNAVAILABLE
EXTERNAL_RESULT_UNKNOWN
RESULT_MISMATCH
REPORT_MISSING
BILLING_MISMATCH
INVENTORY_SYNC_FAILURE
UNAUTHORIZED_RESULT_CHANGE
DOCUMENT_FAILURE
NOTIFICATION_FAILURE
```

---

# 75. EXCEPTION STATUS

```text
OPEN
UNDER_REVIEW
WAITING_FOR_EXTERNAL_SYSTEM
WAITING_FOR_USER
RESOLVED
CANCELLED
```

---

# 76. EXCEPTION SEVERITY

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Critical exceptions must be visible to authorized operations managers.

---

# 77. BACKEND API STRUCTURE

Implement:

```text
/api/laboratory/tests
/api/laboratory/orders
/api/laboratory/order-items
/api/laboratory/collections
/api/laboratory/samples
/api/laboratory/results
/api/laboratory/reports
/api/laboratory/exceptions
/api/laboratory/inventory
/api/laboratory/integrations
/api/laboratory/rpa
/api/laboratory/analytics
```

---

# 78. TEST MASTER APIs

```http
GET    /api/laboratory/tests
GET    /api/laboratory/tests/:id
POST   /api/laboratory/tests
PUT    /api/laboratory/tests/:id
PATCH  /api/laboratory/tests/:id/status
```

---

# 79. ORDER APIs

```http
GET    /api/laboratory/orders
GET    /api/laboratory/orders/:id
POST   /api/laboratory/orders
PATCH  /api/laboratory/orders/:id
POST   /api/laboratory/orders/:id/cancel
POST   /api/laboratory/orders/:id/schedule
```

---

# 80. SAMPLE APIs

```http
POST   /api/laboratory/samples
GET    /api/laboratory/samples
GET    /api/laboratory/samples/:id
POST   /api/laboratory/samples/:id/collect
POST   /api/laboratory/samples/:id/receive
POST   /api/laboratory/samples/:id/accept
POST   /api/laboratory/samples/:id/reject
```

---

# 81. RESULT APIs

```http
POST   /api/laboratory/results
GET    /api/laboratory/results/:id
PUT    /api/laboratory/results/:id
POST   /api/laboratory/results/:id/submit-verification
POST   /api/laboratory/results/:id/verify
POST   /api/laboratory/results/:id/amend
```

---

# 82. REPORT APIs

```http
GET    /api/laboratory/reports
GET    /api/laboratory/reports/:id
POST   /api/laboratory/reports/:id/generate
POST   /api/laboratory/reports/:id/finalize
POST   /api/laboratory/reports/:id/release
GET    /api/laboratory/reports/:id/download
```

---

# 83. COLLECTION APIs

```http
GET    /api/laboratory/collections/queue
POST   /api/laboratory/collections/:orderItemId/collect
GET    /api/laboratory/collections/pending
```

---

# 84. EXCEPTION APIs

```http
GET    /api/laboratory/exceptions
GET    /api/laboratory/exceptions/:id
POST   /api/laboratory/exceptions
PATCH  /api/laboratory/exceptions/:id
POST   /api/laboratory/exceptions/:id/resolve
```

---

# 85. ANALYTICS APIs

```http
GET /api/laboratory/analytics/dashboard
GET /api/laboratory/analytics/orders
GET /api/laboratory/analytics/turnaround
GET /api/laboratory/analytics/samples
GET /api/laboratory/analytics/reports
```

---

# 86. BACKEND FOLDER STRUCTURE

Add:

```text
server/
├── models/
│   ├── LabTest.js
│   ├── LabOrder.js
│   ├── LabOrderItem.js
│   ├── LabSample.js
│   ├── LabResult.js
│   ├── LabReport.js
│   └── LabException.js
│
├── controllers/
│   └── laboratory/
│       ├── labTestController.js
│       ├── labOrderController.js
│       ├── labSampleController.js
│       ├── labResultController.js
│       ├── labReportController.js
│       └── labExceptionController.js
│
├── services/
│   └── laboratory/
│       ├── labTestService.js
│       ├── labOrderService.js
│       ├── sampleService.js
│       ├── resultService.js
│       ├── reportService.js
│       ├── billingService.js
│       ├── inventoryService.js
│       ├── lisIntegrationService.js
│       └── laboratoryRpaService.js
│
├── validators/
│   └── laboratory/
│
└── routes/
    └── laboratory/
```

---

# 87. FRONTEND STRUCTURE

Create:

```text
client/src/portals/operations/laboratory/
├── pages/
│   ├── LaboratoryDashboard.jsx
│   ├── LabTests.jsx
│   ├── LabOrders.jsx
│   ├── LabOrderDetails.jsx
│   ├── CollectionQueue.jsx
│   ├── SampleReception.jsx
│   ├── ProcessingQueue.jsx
│   ├── ResultEntry.jsx
│   ├── VerificationQueue.jsx
│   ├── LabReports.jsx
│   ├── RejectedSamples.jsx
│   ├── LabExceptions.jsx
│   └── LabAnalytics.jsx
│
├── components/
│   ├── LabOrderTable.jsx
│   ├── SampleStatusBadge.jsx
│   ├── ResultForm.jsx
│   ├── VerificationPanel.jsx
│   ├── LabReportViewer.jsx
│   └── LabExceptionTable.jsx
│
└── services/
    └── laboratoryApi.js
```

---

# 88. DATABASE INDEXES

Create indexes for:

### LabOrder

```text
patientId
visitId
admissionId
orderingDoctorId
status
priority
orderDateTime
externalLisOrderId
```

### LabSample

```text
sampleId
accessionNumber
patientId
orderId
status
collectionDateTime
externalLisSampleId
```

### LabResult

```text
resultId
patientId
orderId
orderItemId
sampleId
status
verifiedAt
releasedAt
```

### LabReport

```text
reportId
reportNumber
patientId
orderId
status
releasedAt
```

Ensure unique indexes where required:

```text
labTestId
orderId
accessionNumber
reportNumber
```

Use appropriate compound indexes for frequent queries.

---

# 89. CONCURRENCY REQUIREMENTS

Concurrency protection is mandatory for:

- Accession number generation
- Order creation
- Sample registration
- Result verification
- Report release
- Billing charge creation
- Inventory consumption
- RPA job execution

Two users must not be able to:

```text
Verify the same result simultaneously
```

or:

```text
Create duplicate accession numbers
```

or:

```text
Generate duplicate billing charges
```

---

# 90. IDEMPOTENCY

Every external integration/RPA operation must support an idempotency key.

Example:

```text
LAB-LIS-ORDER-{orderId}
```

If the same operation is submitted again:

```text
Existing successful operation found
        ↓
Return previous result
```

Do not duplicate the external action.

---

# 91. AUDIT LOGGING

Record:

```text
WHO
WHAT
WHEN
FROM WHERE
OLD VALUE
NEW VALUE
REASON
CORRELATION ID
RPA JOB ID
```

Important events:

- Test created
- Test changed
- Order created
- Order cancelled
- Sample collected
- Sample rejected
- Result entered
- Result verified
- Result amended
- Report generated
- Report released
- External LIS sync
- Exception created
- Exception resolved

---

# 92. SECURITY

Implement:

- JWT authentication
- RBAC
- Backend authorization
- Input validation
- Rate limiting
- Secure document access
- Sensitive field protection
- Password hashing
- Audit logging
- Session/token controls
- Secure RPA credential storage
- No credentials inside Robot Framework source code
- No credentials in Git
- No patient laboratory reports in public URLs

---

# 93. DOCUMENT ACCESS CONTROL

Before downloading a report:

```text
Authenticate
 ↓
Authorize
 ↓
Verify patient relationship / role
 ↓
Generate secure access
 ↓
Download
```

Do not expose:

```text
/reports/LAB-RPT-123.pdf
```

as an unrestricted public URL.

---

# 94. RPA CREDENTIAL SECURITY

Never put:

```text
username = "admin"
password = "123456"
```

inside `.robot` files.

Use environment variables or a secure secret manager.

Example:

```text
LIS_USERNAME
LIS_PASSWORD
LIS_BASE_URL
```

---

# 95. REPORT DOWNLOAD SECURITY

Every download must generate an audit event:

```text
User
Patient
Report
Timestamp
IP/session
Purpose if configured
```

---

# 96. LABORATORY REPORTS AND ANALYTICS

Create reports such as:

### Operational

- Daily lab orders
- Orders by test
- Orders by department
- Orders by doctor
- Sample collection volume
- Sample rejection rate
- Pending samples
- Pending verification
- Released reports

### Turnaround

- Average turnaround time
- Test-specific turnaround
- Department turnaround
- Delayed orders

### RPA

- Successful jobs
- Failed jobs
- External LIS failures
- Reconciliation exceptions

### Billing

- Laboratory charges
- Unbilled laboratory services
- Billing reconciliation exceptions

Do not expose sensitive clinical data to unauthorized management reports.

---

# 97. TURNAROUND TIME

Store timestamps:

```text
Order Created
Sample Collected
Sample Received
Processing Started
Result Entered
Result Verified
Report Released
```

This allows:

```text
Collection → Result Verification
```

and:

```text
Order → Report Release
```

to be calculated.

Do not hard-code one universal TAT target.

---

# 98. INPATIENT LAB FLOW

```text
Doctor orders test
      ↓
Lab Order
      ↓
Collection Queue
      ↓
Sample Collection
      ↓
Sample Processing
      ↓
Result Verification
      ↓
Report Release
      ↓
Doctor/Authorized Staff
      ↓
Patient Record
```

Link every order to:

```text
Patient
Admission
Ward
Bed
Doctor
```

where available.

---

# 99. OUTPATIENT LAB FLOW

```text
Doctor Consultation
      ↓
Lab Order
      ↓
Patient Collection
      ↓
Sample Processing
      ↓
Report
      ↓
Patient Portal
```

---

# 100. EMERGENCY LAB FLOW

Emergency laboratory orders may be created for:

```text
Existing Patient
OR
Temporary Emergency Patient
```

The laboratory system must use the Patient/Visit identity already established by the Patient Registration and Admission modules.

If a temporary patient later becomes linked to a permanent Patient ID, laboratory records must retain the original identity linkage history.

Do not create a second permanent patient.

---

# 101. PATIENT IDENTITY SAFETY

If laboratory staff encounter:

```text
Patient name mismatch
DOB mismatch
Patient ID mismatch
Order mismatch
```

the system must not silently continue.

Create:

```text
PATIENT_MISMATCH
```

exception.

---

# 102. NOTIFICATION RETRY

Notification failure must not change the laboratory clinical status.

Example:

```text
Report = RELEASED
SMS = FAILED
```

Do NOT change:

```text
Report = NOT RELEASED
```

Instead:

```text
NotificationDelivery = FAILED
Retry according to notification policy
```

---

# 103. EXTERNAL LIS OUTAGE

If LIS is unavailable:

```text
Detect failure
 ↓
Mark integration unavailable
 ↓
Queue administrative sync where appropriate
 ↓
Notify authorized operations staff
 ↓
Do not duplicate existing orders
 ↓
Retry according to configured policy
```

---

# 104. HUMAN APPROVAL POINTS

Human review is required for situations such as:

```text
Ambiguous patient identity
Duplicate order uncertainty
Sample identity mismatch
External result mismatch
Result amendment
Unexpected external report
Unauthorized result modification
Unknown external transaction status
```

---

# 105. NO AUTOMATIC CLINICAL INTERPRETATION

For example, if a result is:

```text
Hemoglobin = 8.2
```

the system must NOT automatically write:

```text
"Patient has anemia."
```

It may display the configured result and reference information.

Clinical interpretation belongs to authorized clinical personnel.

---

# 106. NO AUTOMATIC RESULT CORRECTION

If an external LIS returns:

```text
Result = 10.2
```

and the hospital system contains:

```text
Result = 12.2
```

do NOT automatically overwrite.

Create:

```text
RESULT_MISMATCH
```

and require authorized review.

---

# 107. NO AUTOMATIC REFERENCE RANGE MODIFICATION

Reference ranges must not be dynamically invented based on patient age, gender, or other data unless an explicitly configured and clinically approved ruleset exists.

The RPA layer must never invent ranges.

---

# 108. SEED DATA

Create realistic demo data.

Example tests:

```text
CBC
Complete Blood Count

GLUCOSE
Blood Glucose

LFT
Liver Function Test

KFT
Kidney Function Test

LIPID
Lipid Profile

URINE
Urinalysis

TSH
Thyroid Stimulating Hormone
```

Use clearly labelled demonstration values.

Do not present demo data as medical advice.

---

# 109. DEMO PATIENT

Use existing seeded patient records rather than creating unrelated duplicate patient identities.

Example:

```text
Patient ID: P10045
Visit ID: V20341
Doctor: D1003
```

These are development/demo records only.

---

# 110. DEMO END-TO-END SCENARIO

Implement a working scenario:

```text
1. Doctor logs in.
2. Opens patient.
3. Creates CBC + Glucose order.
4. System validates patient and tests.
5. Lab order created.
6. Billing reference created.
7. Laboratory dashboard receives order.
8. Technician opens collection queue.
9. Sample collected.
10. Accession number generated.
11. Sample received.
12. Sample accepted.
13. Technician enters result.
14. Result submitted for verification.
15. Authorized verifier reviews result.
16. Result verified.
17. Report generated.
18. Report finalized.
19. Report released.
20. Patient receives notification.
21. Patient opens portal.
22. Patient downloads report.
23. Audit history records complete workflow.
```

---

# 111. DEMO SAMPLE REJECTION SCENARIO

Implement:

```text
Order created
 ↓
Sample collected
 ↓
Sample received
 ↓
Sample rejected
 ↓
Reason = MISSING_LABEL
 ↓
Exception created
 ↓
Responsible staff notified
 ↓
Order status updated
 ↓
Human decides next action
```

---

# 112. DEMO EXTERNAL LIS SCENARIO

Simulate:

```text
Doctor creates order
 ↓
RPA Job created
 ↓
Robot logs into mock LIS
 ↓
Patient verified
 ↓
Tests entered
 ↓
External order ID captured
 ↓
MERN updated
```

Create a mock external LIS environment for development/testing if no real LIS is available.

---

# 113. API ERROR FORMAT

Use a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "LAB_SAMPLE_NOT_FOUND",
    "message": "Laboratory sample was not found.",
    "details": {}
  },
  "correlationId": "CORR-2026-000123"
}
```

---

# 114. FRONTEND ERROR HANDLING

Never display raw server errors.

Instead:

```text
Unable to accept sample.
Please verify the accession number or contact laboratory administration.
```

Provide:

```text
Retry
View Exception
Contact Administrator
```

where appropriate.

---

# 115. TESTING REQUIREMENTS

Create unit tests for:

- Test creation
- Test activation
- Order creation
- Duplicate order detection
- Sample creation
- Accession generation
- Sample rejection
- Result entry
- Result verification
- Amendment
- Report generation
- Report release
- Billing idempotency
- Inventory consumption
- RPA job creation
- External LIS reconciliation
- RBAC
- Audit logging

---

# 116. INTEGRATION TESTS

Test:

```text
Patient → Lab Order
Lab Order → Billing
Lab Order → Sample
Sample → Result
Result → Report
Report → Patient Portal
Lab → Inventory
Lab → Notification
Lab → RPA
Lab → Audit
```

---

# 117. RPA TESTS

Robot Framework must test:

### Successful login

```text
Login → Success
```

### Failed login

```text
Login → Failure → Exception
```

### Order creation

```text
Create external order → Verify
```

### Unknown result

```text
Submit → Browser failure → Reconciliation
```

### Duplicate protection

```text
Same job twice → No duplicate order
```

### Report retrieval

```text
Retrieve → Verify patient/order → Store
```

---

# 118. SECURITY TESTS

Test:

```text
Unauthorized result access
Unauthorized result modification
Unauthorized report download
Unauthorized verification
Patient viewing another patient's report
Technician releasing report without permission
Billing user editing clinical result
```

Every unauthorized operation must return an appropriate authorization error.

---

# 119. ACCEPTANCE CRITERIA

The module is considered complete only when:

- Laboratory test master works.
- Lab orders can be created.
- Patient identity is validated.
- Visit/admission linkage works.
- Duplicate order detection works.
- Samples can be collected.
- Accession numbers are unique.
- Samples can be received.
- Samples can be rejected.
- Rejection reasons are recorded.
- Results can be entered.
- Results can be verified.
- Verified results cannot be silently modified.
- Amendments preserve history.
- Reports can be generated.
- Reports can be finalized.
- Reports can be released.
- Patients can securely access released reports.
- Doctors can access authorized reports.
- Billing integration works.
- Duplicate billing is prevented.
- Inventory integration works.
- Duplicate inventory consumption is prevented.
- Notifications work.
- Notification failures do not corrupt clinical status.
- Exceptions work.
- RPA jobs are traceable.
- External LIS synchronization works or has a mock integration.
- RPA failures create exceptions.
- Unknown external outcomes trigger reconciliation.
- RBAC works.
- Audit logging works.
- MongoDB indexes are implemented.
- Backend validation exists.
- Frontend validation exists.
- API tests exist.
- RPA tests exist.
- Seed/demo data exists.
- End-to-end workflow works.

---

# 120. IMPLEMENTATION ORDER FOR AI CODING AGENT

Implement this module in the following order.

## Phase 1 — Database

Create:

```text
LabTest
LabOrder
LabOrderItem
LabSample
LabResult
LabReport
LabException
```

Add required indexes and relationships.

---

## Phase 2 — Backend

Implement:

```text
Models
Validators
Services
Controllers
Routes
Authorization
Audit
Exception handling
```

---

## Phase 3 — Laboratory Test Master

Implement:

```text
CRUD
Activation
Deactivation
Search
Filtering
```

---

## Phase 4 — Lab Orders

Implement:

```text
Create
View
Search
Duplicate detection
Cancellation
Status management
```

---

## Phase 5 — Sample Management

Implement:

```text
Collection queue
Sample creation
Accession generation
Reception
Acceptance
Rejection
```

---

## Phase 6 — Results

Implement:

```text
Result entry
Draft
Submit for verification
Verification
Amendment
Version history
```

---

## Phase 7 — Reports

Implement:

```text
Generate
Finalize
Release
Versioning
Secure download
```

---

## Phase 8 — Billing Integration

Implement:

```text
Charge creation
Idempotency
Charge reconciliation
Billing reference
```

---

## Phase 9 — Inventory Integration

Implement:

```text
Consumable usage
Inventory movement
Reconciliation
Failure handling
```

---

## Phase 10 — Notifications

Integrate with:

```text
Notification Service
SMS
Email
Patient Portal
```

---

## Phase 11 — RPA

Implement:

```text
RPA Job
Robot Framework
Mock LIS
External order entry
Result retrieval
Report download
Reconciliation
Evidence capture
```

---

## Phase 12 — Frontend

Implement:

```text
Laboratory Dashboard
Orders
Collection
Samples
Results
Verification
Reports
Exceptions
Analytics
```

---

## Phase 13 — Security

Implement:

```text
RBAC
Authorization
Audit
Secure document access
Sensitive data protection
RPA credential management
```

---

## Phase 14 — Testing

Implement:

```text
Unit tests
API tests
Integration tests
RBAC tests
RPA tests
End-to-end tests
```

---

# 121. IMPORTANT CROSS-MODULE DEPENDENCIES

This module depends on:

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

Laboratory must consume existing shared entities instead of duplicating them.

Do NOT create:

```text
LabPatient
LabDoctor
LabBillingPatient
```

The laboratory module must reference:

```text
Patient
Doctor
Visit
Admission
Invoice
Employee/User
```

from the shared system.

---

# 122. SOURCE-OF-TRUTH RULES

| Data | Source of Truth |
|---|---|
| Patient identity | Patient Registration |
| Doctor identity | Doctor Management |
| Visit | Patient/Visit Management |
| Admission | Patient Admission |
| Lab test master | Laboratory |
| Lab order | Laboratory |
| Sample | Laboratory |
| Lab result | Laboratory |
| Lab report | Laboratory |
| Billing | Billing |
| Insurance | Insurance modules |
| Physical consumable stock | Medical Inventory |
| Notifications | Notification Service |
| Documents | Document Generation |
| RPA execution | RPA subsystem |
| Audit | Central Audit Service |

---

# 123. DO NOT DUPLICATE MASTER DATA

Never create another independent:

```text
Patient master
Doctor master
Employee master
Inventory master
Billing master
Insurance master
Notification system
```

Use references to existing modules.

---

# 124. RPA BOUNDARY

RPA may:

```text
Read
Navigate
Enter
Submit
Download
Synchronize
Verify administrative confirmation
Notify
Reconcile
Log
```

RPA must not:

```text
Diagnose
Interpret
Treat
Approve clinical results
Modify clinical results
Invent missing information
Choose medical priority
Choose treatment
Approve insurance
Approve financial adjustments
```

---

# 125. FINAL AI IMPLEMENTATION INSTRUCTION

Build this module as a **production-quality laboratory administration subsystem**, not as a demo CRUD page.

The implementation must:

1. Follow the existing MERN architecture.
2. Reuse shared Patient, Visit, Admission, Doctor, Billing, Inventory, Notification, Document, Audit and RPA services.
3. Implement proper RBAC.
4. Implement complete laboratory state transitions.
5. Preserve historical data.
6. Prevent duplicate accession numbers.
7. Prevent duplicate billing.
8. Prevent duplicate inventory consumption.
9. Preserve result version history.
10. Require authorization for verification and release.
11. Never silently modify verified results.
12. Implement exception-driven RPA.
13. Implement idempotent external integrations.
14. Handle uncertain external outcomes safely.
15. Keep clinical decisions with authorized humans.
16. Maintain complete auditability.
17. Provide realistic seed/demo data.
18. Provide automated tests.
19. Provide a mock LIS integration for development if a real LIS is unavailable.
20. Ensure the complete workflow works from **Doctor Lab Order → Sample → Result → Verification → Report → Patient Portal**.

The final implementation should allow a hospital to operate the administrative laboratory workflow end-to-end while using Robot Framework to automate repetitive interactions with external/legacy laboratory systems.

**Do not implement placeholders where functional logic is expected.**

**Do not create duplicate master data.**

**Do not bypass authorization.**

**Do not make autonomous clinical decisions.**

**Do not silently overwrite laboratory results.**

**Do not treat RPA as the system of record.**

The completed module must integrate cleanly with all previously defined hospital modules and remain extensible for future LIS/API integrations.