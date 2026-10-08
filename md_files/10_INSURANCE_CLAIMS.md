# 10_INSURANCE_CLAIMS.md

# Insurance Claims Management Module

## 1. Module Overview

Build a complete **Insurance Claims Management Module** for the Hospital Administrative Automation & RPA Platform.

This module manages the administrative lifecycle of an insurance claim from claim creation through submission, insurer review, queries, approval/rejection, settlement, and closure.

The module must support:

- Claim creation.
- Claim preparation.
- Patient and policy association.
- Claim eligibility/verification reference.
- Bill and invoice association.
- Treatment/service information.
- Required document collection.
- Document validation.
- Claim package preparation.
- Insurer API submission where available.
- Insurer portal submission using Robot Framework where APIs are unavailable.
- Claim reference number capture.
- Claim status tracking.
- Periodic insurer status polling.
- Query handling.
- Additional-document requests.
- Partial approval.
- Full approval.
- Rejection.
- Payment/settlement tracking.
- Claim reconciliation with hospital billing.
- Notifications.
- Exception management.
- Complete audit history.
- Human-in-the-loop processing.

### Critical Boundary

This module is responsible for **administrative insurance claim processing**.

The system/RPA must NOT independently:

- Decide whether a claim should be approved.
- Decide whether treatment is medically necessary.
- Reject a claim.
- Appeal a rejected claim.
- Modify clinical records.
- Invent medical information.
- Invent insurance coverage.
- Fabricate supporting documents.
- Change insurer responses.
- Approve financial write-offs.
- Decide patient liability without authorized billing rules.
- Make clinical decisions.

The insurer's decision is authoritative for insurer claim status.

Human staff must handle ambiguous, disputed, rejected, queried, or exceptional cases.

---

# 2. Technology Stack

Use the existing platform architecture:

### Frontend

- React.js
- React Router
- Existing design system/Bootstrap
- Axios/API client
- Reusable tables/forms/modals
- Role-based UI
- Responsive layouts

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- REST APIs
- JWT
- RBAC
- Validation
- Audit logging
- Central error handling

### Automation

- Robot Framework
- Browser automation for insurer portals
- API automation where supported
- Scheduled claim-status polling
- Evidence capture
- RPA execution tracking

---

# 3. Relationship With Insurance Verification

Insurance Verification and Insurance Claims are separate modules.

## Verification

Answers:

```text
Is the policy active?
Is the patient eligible?
Is the provider in network?
What coverage information does the insurer provide?
Is authorization required?
```

## Claims

Answers:

```text
What claim is being submitted?
What documents support it?
Was it submitted?
What claim number did the insurer assign?
Is it under review?
Did the insurer request more information?
Was it approved/rejected/partially approved?
Was it paid?
```

Never treat:

```text
VERIFIED INSURANCE
```

as:

```text
CLAIM APPROVED
```

---

# 4. End-to-End Claim Lifecycle

Primary workflow:

```text
Discharge / Claim Request
        ↓
Identify Patient
        ↓
Identify Insurance Policy
        ↓
Check Verification
        ↓
Create Claim
        ↓
Collect Invoice/Bill
        ↓
Collect Supporting Documents
        ↓
Validate Claim Package
        ↓
Claim Ready
        ↓
Human Review if Required
        ↓
Submit to Insurer
        ↓
Capture Claim Number
        ↓
Track Claim
        ↓
Under Review
        ↓
 ┌───────────────┐
 │               │
 ▼               ▼
Query          Decision
 │               │
 ▼          ┌────┴─────┐
More Docs   │          │
 │          ▼          ▼
 ▼       Approved    Rejected
Resubmit     │          │
             ▼          ▼
         Settlement   Human Review
             │
             ▼
            Paid
             │
             ▼
           Closed
```

---

# 5. Claim Statuses

Implement the following statuses exactly:

```text
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

Optional internal processing statuses may be used if needed:

```text
PREPARING
VALIDATION_FAILED
SUBMISSION_IN_PROGRESS
SUBMISSION_FAILED
```

Do not expose unnecessary technical statuses to patients.

---

# 6. Claim Status Transition Rules

Recommended lifecycle:

```text
DRAFT
  ↓
READY
  ↓
SUBMITTED
  ↓
UNDER_REVIEW
  ↓
APPROVED
  ↓
PAID
```

Alternative:

```text
UNDER_REVIEW
      ↓
QUERY
      ↓
MORE_INFORMATION_REQUIRED
      ↓
SUBMITTED / UNDER_REVIEW
```

Rejection:

```text
UNDER_REVIEW
      ↓
REJECTED
```

Partial approval:

```text
UNDER_REVIEW
      ↓
PARTIALLY_APPROVED
      ↓
PAID
```

Cancellation:

```text
DRAFT → CANCELLED
READY → CANCELLED
```

A submitted claim must not be silently deleted.

---

# 7. Claim Entity

Create:

```text
InsuranceClaim
```

Suggested Mongoose schema:

```javascript
{
  claimId: String,

  patientId: ObjectId,

  policyId: ObjectId,

  verificationId: ObjectId,

  admissionId: ObjectId,

  visitId: ObjectId,

  invoiceId: ObjectId,

  claimType: String,

  claimNumber: String,

  insurerName: String,

  policyNumber: String,

  memberId: String,

  patientName: String,

  admissionDate: Date,

  dischargeDate: Date,

  totalClaimAmount: Number,

  approvedAmount: Number,

  rejectedAmount: Number,

  patientResponsibilityAmount: Number,

  settlementAmount: Number,

  currency: String,

  status: String,

  submissionSource: String,

  insurerReferenceNumber: String,

  insurerDecisionDate: Date,

  submittedAt: Date,

  lastStatusCheckedAt: Date,

  paidAt: Date,

  cancellationReason: String,

  rejectionReason: String,

  queryReason: String,

  notes: String,

  rpaJobId: ObjectId,

  correlationId: String,

  createdBy: ObjectId,

  updatedBy: ObjectId,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 8. Claim Item

Create:

```text
InsuranceClaimItem
```

or embed claim line items if the existing architecture prefers embedded documents.

Suggested fields:

```javascript
{
  claimId: ObjectId,

  serviceType: String,

  serviceId: ObjectId,

  description: String,

  serviceDate: Date,

  quantity: Number,

  unitAmount: Number,

  claimedAmount: Number,

  approvedAmount: Number,

  rejectedAmount: Number,

  rejectionReason: String
}
```

Possible service types:

```text
CONSULTATION
ROOM
LAB
RADIOLOGY
PHARMACY
PROCEDURE
OTHER
```

The actual allowed service types should be configurable.

---

# 9. Claim Document Entity

Create:

```text
InsuranceClaimDocument
```

Suggested schema:

```javascript
{
  claimId: ObjectId,

  patientId: ObjectId,

  documentType: String,

  documentId: ObjectId,

  fileName: String,

  storageKey: String,

  version: Number,

  required: Boolean,

  submittedToInsurer: Boolean,

  uploadedBy: ObjectId,

  uploadedAt: Date,

  verificationStatus: String,

  notes: String,

  createdAt: Date
}
```

---

# 10. Claim Status History

Create:

```text
InsuranceClaimStatusHistory
```

Suggested schema:

```javascript
{
  claimId: ObjectId,

  previousStatus: String,

  newStatus: String,

  changedBy: ObjectId,

  source: String,

  reason: String,

  insurerReference: String,

  timestamp: Date
}
```

Every meaningful claim state transition must be recorded.

---

# 11. Claim Query Entity

Create:

```text
InsuranceClaimQuery
```

Suggested fields:

```javascript
{
  claimId: ObjectId,

  queryReference: String,

  queryType: String,

  queryText: String,

  requestedDocuments: [ObjectId],

  receivedAt: Date,

  dueDate: Date,

  status: String,

  responseText: String,

  respondedBy: ObjectId,

  respondedAt: Date,

  insurerReference: String,

  createdAt: Date,
  updatedAt: Date
}
```

Statuses:

```text
OPEN
IN_PROGRESS
RESPONSE_READY
SUBMITTED
RESOLVED
CANCELLED
```

---

# 12. Claim Payment/Settlement

Create or reuse an appropriate payment/settlement entity.

Example:

```text
InsuranceClaimSettlement
```

Fields:

```javascript
{
  claimId: ObjectId,

  insurerName: String,

  insurerReference: String,

  approvedAmount: Number,

  settledAmount: Number,

  settlementDate: Date,

  paymentReference: String,

  status: String,

  notes: String,

  recordedBy: ObjectId,

  createdAt: Date
}
```

Possible states:

```text
PENDING
PARTIALLY_PAID
PAID
DISPUTED
```

Do not mark a claim PAID simply because it was APPROVED.

---

# 13. Database Indexes

Create:

```javascript
InsuranceClaim.index({
  patientId: 1,
  createdAt: -1
});

InsuranceClaim.index({
  policyId: 1
});

InsuranceClaim.index({
  invoiceId: 1
});

InsuranceClaim.index({
  admissionId: 1
});

InsuranceClaim.index({
  claimNumber: 1
});

InsuranceClaim.index({
  insurerReferenceNumber: 1
});

InsuranceClaim.index({
  status: 1,
  createdAt: -1
});

InsuranceClaim.index({
  insurerName: 1,
  status: 1
});

InsuranceClaimStatusHistory.index({
  claimId: 1,
  timestamp: -1
});

InsuranceClaimQuery.index({
  claimId: 1,
  status: 1
});
```

---

# 14. Claim Creation Sources

Support:

1. Discharge process.
2. Billing staff.
3. Authorized insurance staff.
4. Scheduled claim preparation.
5. Configured automatic claim creation after eligible discharge.

Do not automatically submit every bill to insurance.

Claim submission must follow hospital-configured workflow.

---

# 15. Claim Creation From Discharge

When discharge is initiated/completed:

```text
Discharge
   ↓
Final/Applicable Invoice
   ↓
Insurance Policy
   ↓
Latest Verification
   ↓
Claim Eligibility for Administrative Processing
   ↓
Create Draft Claim
```

The system may create:

```text
DRAFT
```

but should not automatically submit unless the hospital has explicitly configured automatic submission for that insurer/claim type.

---

# 16. Claim Creation Screen

Route:

```text
/finance-insurance/claims/create
```

Form:

```text
Patient *
Insurance Policy *
Admission / Visit
Invoice *
Claim Type *
Admission Date
Discharge Date
Claim Amount
Supporting Documents
Notes
```

When patient is selected:

Automatically display:

```text
Patient ID
Patient Name
DOB
Active Insurance
Policy Number
Member ID
Last Verification
Verification Status
```

---

# 17. Verification Check Before Claim Creation

When creating a claim:

```text
Policy exists?
     ↓
Verification exists?
     ↓
Verification current?
     ↓
Yes → Continue
No → Warning / Re-verification workflow
```

Do not invent a rule that all claims require fresh verification.

Use hospital/insurer configuration.

If verification is stale:

```text
Insurance verification may be outdated.

[Re-Verify]
[Continue According to Policy]
```

The final behavior should follow configured business rules.

---

# 18. Claim Data Collection

Collect data from existing authoritative modules.

### Patient

From:

```text
Patient
```

### Admission

From:

```text
Admission
```

### Visit

From:

```text
Visit
```

### Billing

From:

```text
Invoice
InvoiceItem
Payment
Deposit
```

### Insurance

From:

```text
InsurancePolicy
InsuranceVerification
```

### Clinical/Service Information

Only from authorized existing records.

Do not allow RPA to create medical facts.

---

# 19. Claim Package

A claim package may contain:

```text
Patient Information
Insurance Information
Admission Information
Discharge Information
Invoice
Invoice Items
Payment/Deposit Information
Service Records
Lab Documents
Radiology Documents
Pharmacy Records
Required Supporting Documents
Other Insurer-Required Documents
```

Actual document requirements must be configured per insurer/claim type.

Do not hard-code one universal claim document list.

---

# 20. Claim Document Checklist

Display:

```text
Document
Required?
Available?
Validated?
Submitted?
```

Example:

| Document | Required | Available | Submitted |
|---|---:|---:|---:|
| Final Invoice | Yes | Yes | No |
| Discharge Document | Yes | Yes | No |
| Insurance Card | Yes | Yes | No |
| Lab Documents | Configurable | Yes | No |
| Radiology Documents | Configurable | No | No |

---

# 21. Document Validation

Before submission validate:

- File exists.
- File is readable.
- Correct document type.
- Patient association correct.
- Claim association correct.
- Required document present.
- No obvious duplicate upload.
- Supported file type.
- File size within configuration.
- Document access permission valid.

Do not validate medical correctness using RPA.

---

# 22. Claim Validation

Before moving:

```text
DRAFT → READY
```

validate:

```text
Patient exists
Insurance policy exists
Invoice exists
Claim amount available
Required identifiers available
Required documents available
Policy information available
Claim type selected
No active duplicate claim
```

If validation fails:

```text
DRAFT
```

and show errors.

---

# 23. Duplicate Claim Prevention

Before creating/submitting:

Search for:

```text
patientId
policyId
invoiceId
claimType
```

If an existing active claim exists for the same billing event:

```text
Show warning.
```

Example:

```text
A claim already exists for invoice INV-2026-001245.

Claim:
CLM-2026-00098

Status:
UNDER_REVIEW
```

Do not create a duplicate automatically.

---

# 24. Claim Review Screen

Route:

```text
/finance-insurance/claims/:claimId
```

Sections:

### Claim Summary

```text
Claim ID
Claim Number
Insurer
Policy
Status
Claim Amount
Approved Amount
Paid Amount
```

### Patient

```text
Patient ID
Name
```

### Encounter

```text
Visit
Admission
Discharge
```

### Billing

```text
Invoice
Invoice Total
Claimed Amount
Patient Responsibility
```

### Documents

```text
Required Documents
Available Documents
Submitted Documents
```

### Timeline

```text
Claim Created
Ready
Submitted
Under Review
Query
Decision
Payment
```

### RPA

```text
RPA Job
Last Execution
Last Status Check
```

---

# 25. Human Claim Review

Before submission, support an optional configured review step.

Reviewer sees:

```text
Patient
Policy
Verification
Invoice
Claim Items
Documents
Claim Amount
```

Actions:

```text
Mark Ready
Return for Correction
Cancel
```

The reviewer must not modify insurer-derived information.

---

# 26. Claim Submission

Submission source:

```text
API
```

or:

```text
INSURER_PORTAL_RPA
```

Workflow:

```text
READY
 ↓
Submission Request
 ↓
API / RPA
 ↓
Insurer
 ↓
Claim Reference Captured
 ↓
SUBMITTED
```

Capture:

```text
Insurer Claim Number
Submission Reference
Submission Timestamp
Submission Source
```

---

# 27. API Claim Submission

Use provider adapters.

Example:

```javascript
class InsuranceClaimsAdapter {
    async submitClaim(claimPackage) {}
    async getClaimStatus(claimReference) {}
    async getClaimQueries(claimReference) {}
}
```

Provider-specific implementations:

```text
ProviderAClaimsAdapter
ProviderBClaimsAdapter
```

Do not place insurer-specific logic directly inside controllers.

---

# 28. Robot Framework Claim Submission

When portal automation is required:

```text
Robot Framework
      ↓
Login
      ↓
Navigate Claims
      ↓
Create Claim
      ↓
Enter Patient/Policy Data
      ↓
Enter Claim Information
      ↓
Upload Documents
      ↓
Submit
      ↓
Read Claim Reference
      ↓
Capture Evidence
      ↓
Return Result
```

RPA must not independently alter claim amounts or documents.

---

# 29. Robot Framework Folder Structure

Add:

```text
robot/
├── insurance/
│   ├── claims/
│   │   ├── tests/
│   │   │   ├── submit_claim.robot
│   │   │   ├── check_claim_status.robot
│   │   │   ├── handle_claim_query.robot
│   │   │   └── capture_claim_evidence.robot
│   │   │
│   │   ├── keywords/
│   │   │   ├── claim_login.resource
│   │   │   ├── claim_creation.resource
│   │   │   ├── claim_documents.resource
│   │   │   ├── claim_submission.resource
│   │   │   ├── claim_status.resource
│   │   │   └── claim_evidence.resource
│   │   │
│   │   └── resources/
│   │       ├── browser.resource
│   │       ├── api.resource
│   │       ├── secrets.resource
│   │       └── common.resource
│   │
│   └── portals/
│       └── <provider-specific-resources>
```

---

# 30. RPA Job Contract

Create:

```text
RPAJob
```

with:

```text
jobType = INSURANCE_CLAIM_SUBMISSION
```

Example:

```javascript
{
  jobType: "INSURANCE_CLAIM_SUBMISSION",

  referenceId: "CLM-2026-00098",

  status: "RUNNING",

  correlationId: "CORR-2026-00456",

  startedAt: Date
}
```

Track:

```text
QUEUED
RUNNING
SUCCESS
FAILED
CANCELLED
```

---

# 31. Claim Submission Result

RPA/API should return normalized data:

```json
{
  "success": true,
  "claimStatus": "SUBMITTED",
  "insurerReferenceNumber": "INS-CLM-778821",
  "submittedAt": "2026-10-06T12:00:00Z",
  "evidence": [
    "evidence-reference"
  ]
}
```

Backend validates the result.

Never blindly trust RPA output.

---

# 32. Claim Tracking

After submission, the claim must be trackable.

Example:

```text
SUBMITTED
     ↓
Status Check
     ↓
UNDER_REVIEW
```

The system must support:

- Manual status update from authorized staff.
- API polling.
- Portal polling using Robot Framework.
- Scheduled status checks.

---

# 33. Automated Claim Status Polling

Use a scheduled worker/job.

Example:

```text
Every configurable interval:
    Find claims eligible for status check.
    Call insurer API OR start RPA.
    Read current status.
    Normalize result.
    Compare with stored status.
    Update if changed.
    Add status history.
    Notify relevant staff.
```

Do not poll claims after they reach terminal states unless required for reconciliation.

Terminal states generally include:

```text
PAID
CANCELLED
```

Rejected claims may remain open for human follow-up.

---

# 34. Claim Status Mapping

Different insurers may use different statuses.

Example:

```text
Insurer:
"PROCESSING"

Hospital:
UNDER_REVIEW
```

Another:

```text
Insurer:
"ADDITIONAL_DOCUMENTS"

Hospital:
MORE_INFORMATION_REQUIRED
```

Use provider-specific status mappings.

Do not expose insurer-specific raw status as the primary hospital status.

Store raw insurer status separately for evidence/audit.

---

# 35. Query Handling

When insurer requests additional information:

```text
UNDER_REVIEW
      ↓
QUERY
```

Create:

```text
InsuranceClaimQuery
```

Example:

```text
Query:
Provide discharge document.

Due Date:
10-Oct-2026
```

Notify:

```text
Insurance Staff
Billing Staff
```

as configured.

---

# 36. Additional Information Workflow

```text
QUERY
 ↓
Review Request
 ↓
Identify Missing Information
 ↓
Collect Document/Data
 ↓
Human Review
 ↓
Prepare Response
 ↓
Submit Response
 ↓
UNDER_REVIEW
```

RPA may:

- Upload approved documents.
- Enter approved responses.
- Capture submission reference.

RPA must not invent answers.

---

# 37. Query UI

Route:

```text
/finance-insurance/claims/:claimId/queries
```

Display:

```text
Query Reference
Query Date
Due Date
Description
Requested Documents
Status
Response
```

Actions:

```text
Open
Upload Document
Prepare Response
Submit Response
Resolve
```

---

# 38. More Information Required

When insurer requests more documents:

```text
status = MORE_INFORMATION_REQUIRED
```

Show a prominent warning:

```text
Additional information is required for this claim.
```

List:

```text
Missing Document
Reason
Due Date
Responsible Department
```

Department routing may include:

```text
Billing
Medical Records
Laboratory
Radiology
Pharmacy
Administration
```

Routing must follow configured ownership.

---

# 39. Claim Resubmission

After required information is supplied:

```text
MORE_INFORMATION_REQUIRED
        ↓
Human Review
        ↓
READY
        ↓
Submit Response
        ↓
UNDER_REVIEW
```

Do not create an entirely new claim unless insurer/hospital rules require it.

Preserve original claim history.

---

# 40. Claim Approval

If insurer reports:

```text
APPROVED
```

store:

```text
status = APPROVED
approvedAmount = insurer-provided amount
decisionDate
insurerReference
```

Do not modify insurer-provided approved amount.

If amount is missing:

```text
approvedAmount = null
```

until confirmed.

---

# 41. Partial Approval

If insurer reports:

```text
PARTIALLY_APPROVED
```

store:

```text
approvedAmount
rejectedAmount
patientResponsibilityAmount
```

only when those amounts are explicitly available or determined by authorized billing rules.

Create line-level approval information where available.

---

# 42. Claim Rejection

If insurer reports:

```text
REJECTED
```

store:

```text
status = REJECTED
rejectionReason
decisionDate
insurerReference
```

Do not automatically appeal.

Notify authorized staff.

Example:

```text
Claim CLM-2026-00098 was rejected by the insurer.

Reason:
[Insurer-provided reason]

Please review the claim.
```

---

# 43. Rejected Claim Human Workflow

```text
REJECTED
   ↓
Insurance Staff Review
   ↓
Determine Next Action
   ├── Accept Rejection
   ├── Correct Data
   ├── Submit Additional Information
   └── Initiate Appeal Through Authorized Workflow
```

This module does not automatically decide the next action.

---

# 44. Claim Payment

Approved does not mean paid.

Lifecycle:

```text
APPROVED
   ↓
Payment Pending
   ↓
Settlement Received
   ↓
PAID
```

When payment is received:

```text
Record payment reference
Record amount
Record settlement date
Update claim
Reconcile with billing
```

---

# 45. Payment Reconciliation

Reconcile:

```text
Claim
Approved Amount
Settlement Amount
Invoice
Insurance Receivable
```

Example:

```text
Claim Amount: ₹100,000
Approved: ₹80,000
Paid: ₹80,000
Patient Responsibility: ₹20,000
```

This is an illustrative example only.

Actual financial treatment must follow configured billing rules.

RPA must not invent patient responsibility.

---

# 46. Billing Integration

Billing should be able to view:

```text
Claim Status
Claim Number
Submitted Amount
Approved Amount
Paid Amount
Pending Insurance Amount
```

API:

```http
GET /api/insurance/claims/patient/:patientId
```

and:

```http
GET /api/insurance/claims/invoice/:invoiceId
```

---

# 47. Billing Claim Reconciliation

When claim payment is received:

```text
Insurance Claim
      ↓
Settlement
      ↓
Billing Reconciliation
      ↓
Update Insurance Receivable
      ↓
Generate Audit Event
```

If amounts do not match:

```text
Create ExceptionCase
```

Example:

```text
Expected settlement:
₹80,000

Received:
₹75,000

Difference:
₹5,000
```

Do not automatically write off the difference.

---

# 48. Admission Integration

Admission may create a claim preparation task when configured.

Example:

```text
Admission
   ↓
Insurance Available
   ↓
Policy Verified
   ↓
Claim Tracking Requirement
```

Do not create a claim merely because an admission exists.

Claim creation rules must be configurable.

---

# 49. Discharge Integration

Discharge is a major claim trigger.

After final bill:

```text
Discharge
   ↓
Final Invoice
   ↓
Insurance Policy
   ↓
Claim Creation
```

The system can create:

```text
DRAFT
```

for review.

If automatic submission is enabled:

```text
DRAFT
 ↓
Validation
 ↓
READY
 ↓
Submission
```

Otherwise wait for authorized staff.

---

# 50. Patient Portal

Patient should be able to see limited claim information.

Route:

```text
/patient/insurance/claims
```

Display:

```text
Claim Number
Insurer
Claim Status
Submitted Date
Decision Date
Approved Amount
Paid Amount
```

Only expose financial details according to patient access policy.

Do not expose internal RPA technical logs.

---

# 51. Finance & Insurance Portal

Route:

```text
/finance-insurance/claims
```

Dashboard:

```text
Draft Claims
Ready Claims
Submitted
Under Review
Queries
More Information Required
Approved
Partially Approved
Rejected
Paid
```

Filters:

```text
Date
Insurer
Status
Department
Claim Type
Patient
Admission
```

---

# 52. Claim Detail Timeline

Example:

```text
06 Oct 2026 10:00
Claim Created

06 Oct 2026 10:20
Claim Marked Ready

06 Oct 2026 10:30
Submitted to Insurer

06 Oct 2026 10:31
Insurer Reference: INS-CLM-778821

07 Oct 2026 09:00
Under Review

08 Oct 2026 14:00
Additional Documents Requested

09 Oct 2026 10:30
Documents Submitted

10 Oct 2026 16:00
Approved
```

Every event should come from actual system/insurer activity.

---

# 53. Notification Events

Integrate with the centralized Notification Service.

Events:

```text
CLAIM_CREATED
CLAIM_READY
CLAIM_SUBMITTED
CLAIM_UNDER_REVIEW
CLAIM_QUERY_RECEIVED
CLAIM_MORE_INFORMATION_REQUIRED
CLAIM_APPROVED
CLAIM_PARTIALLY_APPROVED
CLAIM_REJECTED
CLAIM_PAYMENT_RECEIVED
CLAIM_RECONCILIATION_EXCEPTION
```

Possible channels:

```text
Email
SMS
In-App
```

Patient notifications should use privacy-safe wording.

---

# 54. Claim Documents

Possible document types:

```text
INSURANCE_CARD
POLICY_DOCUMENT
FINAL_INVOICE
DISCHARGE_DOCUMENT
LAB_REPORT
RADIOLOGY_REPORT
PHARMACY_DOCUMENT
SERVICE_DOCUMENT
IDENTITY_DOCUMENT
INSURER_CORRESPONDENCE
CLAIM_SUBMISSION_EVIDENCE
CLAIM_APPROVAL_EVIDENCE
CLAIM_REJECTION_EVIDENCE
PAYMENT_EVIDENCE
OTHER
```

Actual required documents must be configurable.

---

# 55. Document Versioning

If a document is replaced:

```text
Version 1
Version 2
Version 3
```

must remain auditable.

Never overwrite a submitted document without preserving history.

---

# 56. Evidence Management

For portal submissions capture:

```text
Submission timestamp
Insurer reference
Screenshot if configured
Submission confirmation
Portal response
```

Store secure evidence reference.

Do not store credentials in screenshots.

---

# 57. Exception Management

Use:

```text
ExceptionCase
```

Claim-specific categories:

```text
MISSING_DOCUMENT
INVALID_DOCUMENT
DUPLICATE_CLAIM
SUBMISSION_FAILURE
PORTAL_UNAVAILABLE
API_FAILURE
CLAIM_REFERENCE_NOT_FOUND
STATUS_MAPPING_ERROR
QUERY_UNRESOLVED
PAYMENT_MISMATCH
INSURER_RESPONSE_AMBIGUOUS
RPA_FAILURE
RECONCILIATION_FAILURE
```

---

# 58. Human Review Requirements

Human review is mandatory when:

- Claim information is ambiguous.
- Insurer response is unclear.
- Multiple claim references are returned.
- Claim is rejected.
- Claim is partially approved and financial action is required.
- Additional information is requested.
- Payment does not match expected settlement.
- Portal behavior is unexpected.
- Required document is missing.
- Data conflict exists between hospital and insurer.
- Appeal is being considered.

---

# 59. RPA Boundaries

RPA may:

- Read approved claim data.
- Populate insurer forms.
- Upload approved documents.
- Submit claims.
- Capture claim references.
- Poll status.
- Download insurer responses.
- Capture evidence.
- Update claim processing status.
- Send notifications.
- Create exceptions.

RPA may NOT:

- Invent claim data.
- Modify medical information.
- Choose a false diagnosis.
- Fabricate documents.
- Change insurer responses.
- Approve claims.
- Reject claims.
- Approve appeals.
- Approve financial write-offs.
- Determine medical necessity.

---

# 60. Claim Status Polling RPA

Robot flow:

```robot
*** Test Cases ***
Check Insurance Claim Status
    [Arguments]    ${claim_id}

    Load Claim
    Validate Claim Reference
    Open Insurer Portal
    Login To Insurer Portal

    Search Claim
    Read Claim Status
    Read Insurer Reference
    Read Query Information
    Read Decision Information

    Capture Evidence
    Normalize Claim Status
    Submit Result

    Close Insurer Session
```

---

# 61. Claim Submission RPA

```robot
*** Test Cases ***
Submit Insurance Claim
    [Arguments]    ${claim_id}

    Load Claim Package
    Validate Claim Package

    Open Insurer Portal
    Login To Insurer Portal

    Navigate To Claims
    Enter Patient Information
    Enter Policy Information
    Enter Claim Information
    Upload Claim Documents

    Review Submission
    Submit Claim

    Capture Claim Reference
    Capture Submission Evidence

    Return Submission Result

    Close Insurer Session
```

---

# 62. Secrets

Never store insurer credentials in:

```text
.robot files
Git
MongoDB
plain-text config files
screenshots
logs
```

Use the approved secret-management mechanism.

Robot Framework receives secrets only at runtime.

---

# 63. API Endpoints

## Claims

```http
POST /api/insurance/claims
GET /api/insurance/claims
GET /api/insurance/claims/:id
PUT /api/insurance/claims/:id
POST /api/insurance/claims/:id/validate
POST /api/insurance/claims/:id/ready
POST /api/insurance/claims/:id/submit
POST /api/insurance/claims/:id/cancel
```

---

## Claim Status

```http
GET /api/insurance/claims/:id/status-history
POST /api/insurance/claims/:id/check-status
```

---

## Queries

```http
GET /api/insurance/claims/:id/queries
POST /api/insurance/claims/:id/queries/:queryId/respond
POST /api/insurance/claims/:id/queries/:queryId/submit
```

---

## Documents

```http
GET /api/insurance/claims/:id/documents
POST /api/insurance/claims/:id/documents
DELETE /api/insurance/claims/:id/documents/:documentId
```

Deletion should be restricted and should preserve audit history.

---

## Settlement

```http
GET /api/insurance/claims/:id/settlement
POST /api/insurance/claims/:id/settlement
POST /api/insurance/claims/:id/reconcile
```

---

# 64. Backend Structure

Use:

```text
server/
├── models/
│   ├── InsuranceClaim.js
│   ├── InsuranceClaimDocument.js
│   ├── InsuranceClaimStatusHistory.js
│   ├── InsuranceClaimQuery.js
│   └── InsuranceClaimSettlement.js
│
├── controllers/
│   ├── insuranceClaimController.js
│   ├── insuranceClaimQueryController.js
│   └── insuranceClaimSettlementController.js
│
├── services/
│   ├── insuranceClaimService.js
│   ├── insuranceClaimValidationService.js
│   ├── insuranceClaimSubmissionService.js
│   ├── insuranceClaimStatusService.js
│   ├── insuranceClaimQueryService.js
│   ├── insuranceClaimSettlementService.js
│   └── insuranceClaimNotificationService.js
│
└── routes/
    └── insuranceClaimRoutes.js
```

---

# 65. Integration Adapter Structure

Use:

```text
server/integrations/insurance/
├── claims/
│   ├── claimsAdapter.js
│   ├── providerRegistry.js
│   ├── api/
│   │   ├── providerA.js
│   │   └── providerB.js
│   └── portal/
│       ├── providerA.js
│       └── providerB.js
```

All insurer-specific implementations must be isolated.

---

# 66. RBAC

Example permissions:

```text
insurance.claim.view
insurance.claim.create
insurance.claim.edit
insurance.claim.validate
insurance.claim.submit
insurance.claim.cancel
insurance.claim.query.view
insurance.claim.query.respond
insurance.claim.status.view
insurance.claim.settlement.record
insurance.claim.reconcile
insurance.claim.exception.resolve
insurance.claim.audit.view
```

Suggested access:

| Action | Patient | Reception | Billing | Insurance | Manager | Admin |
|---|---:|---:|---:|---:|---:|---:|
| View Own Claim | Yes | No | Yes | Yes | Yes | Yes |
| Create Claim | No | Limited | Yes | Yes | Yes | Yes |
| Prepare Claim | No | No | Yes | Yes | Yes | Yes |
| Submit Claim | No | No | Configurable | Yes | Yes | Yes |
| Handle Query | No | No | Limited | Yes | Yes | Yes |
| Record Settlement | No | No | Yes | Yes | Yes | Yes |
| Resolve Exception | No | No | Limited | Yes | Yes | Yes |

Use actual Permission entities rather than hard-coded role names wherever possible.

---

# 67. Audit Events

Record:

```text
CLAIM_CREATED
CLAIM_UPDATED
CLAIM_VALIDATED
CLAIM_MARKED_READY
CLAIM_SUBMISSION_STARTED
CLAIM_SUBMITTED
CLAIM_REFERENCE_CAPTURED
CLAIM_STATUS_CHANGED
CLAIM_QUERY_CREATED
CLAIM_QUERY_RESPONDED
CLAIM_DOCUMENT_ADDED
CLAIM_DOCUMENT_SUBMITTED
CLAIM_APPROVED
CLAIM_PARTIALLY_APPROVED
CLAIM_REJECTED
CLAIM_PAYMENT_RECORDED
CLAIM_RECONCILED
CLAIM_CANCELLED
CLAIM_EXCEPTION_CREATED
CLAIM_EXCEPTION_RESOLVED
```

Each audit event must contain:

```text
Actor
Action
Entity
Entity ID
Timestamp
Correlation ID
Source
Before/After where appropriate
```

---

# 68. Security

Implement:

- JWT authentication.
- Backend authorization.
- RBAC.
- Secure document access.
- Input validation.
- File validation.
- Rate limiting.
- Audit logs.
- Secure insurer credentials.
- No credentials in logs.
- No sensitive data in URLs unnecessarily.
- Idempotent claim submission.
- Duplicate claim prevention.
- Secure API communication.
- Least privilege.

---

# 69. Idempotent Claim Submission

Claim submission is high risk.

If the backend receives duplicate submission requests:

```text
POST /submit
```

do not create duplicate insurer submissions.

Before submitting:

```text
Is claim already submitted?
Is insurer reference already present?
Is submission currently in progress?
```

If yes:

```text
Return existing state.
```

Use a submission idempotency key.

Example:

```text
CLAIM-SUBMIT-CLM-2026-00098
```

---

# 70. Submission Failure

Example:

```text
Claim READY
      ↓
Submission Started
      ↓
Portal Timeout
```

System:

```text
Submission attempt = FAILED
Claim remains READY or moves to configured submission-failure state
ExceptionCase = OPEN
```

Do not mark:

```text
SUBMITTED
```

unless the insurer reference/submission evidence confirms submission.

This is critical to prevent false claims.

---

# 71. Unknown Submission Result

If the portal times out immediately after clicking Submit, the result may be uncertain.

Do NOT blindly retry.

Workflow:

```text
UNKNOWN SUBMISSION RESULT
        ↓
Check Insurer Claim Search
        ↓
Claim Exists?
   ├── YES → Capture Reference → SUBMITTED
   └── NO → Human Review / Safe Retry
```

This prevents duplicate claim submission.

---

# 72. Claim Reference Capture

When insurer returns:

```text
Claim Number
Reference Number
Tracking ID
```

store it immediately.

Example:

```text
Hospital Claim ID:
CLM-2026-00098

Insurer Claim Number:
INS-CLM-778821
```

Hospital and insurer identifiers must remain separate.

---

# 73. Raw Insurer Response

Store only what is necessary and allowed by security/privacy requirements.

Possible:

```text
rawStatus
rawReference
rawDecision
rawReason
responseTimestamp
```

Sensitive response payloads should be minimized and protected.

Do not store unnecessary insurer portal data.

---

# 74. Claim Reports

Dashboard reports:

```text
Total Claims
Draft Claims
Submitted Claims
Under Review
Queries
Approved
Partially Approved
Rejected
Paid
Pending Payment
Average Processing Time
Average Settlement Time
```

Provider-wise:

```text
Insurer
Claims
Approved
Rejected
Pending
Paid
```

Financial:

```text
Total Claimed
Total Approved
Total Paid
Total Pending
Total Rejected
```

Use actual stored values.

Do not derive financial metrics from unverified assumptions.

---

# 75. Claim Aging

Create configurable aging buckets:

```text
0–7 Days
8–15 Days
16–30 Days
31–60 Days
60+ Days
```

Use:

```text
currentDate - submittedAt
```

for claims that are still pending.

---

# 76. Alerts

Support configurable alerts for:

```text
Claim pending too long
Query approaching due date
Claim rejection
Payment mismatch
RPA submission failure
Portal unavailable
Claim status unchanged
```

Do not spam notifications.

Use the central notification deduplication/retry system.

---

# 77. Seed Data

Create realistic development claims.

Example:

```text
Patient:
P10045

Policy:
POL-ABC-45892

Invoice:
INV-2026-001245

Claim:
CLM-2026-00098

Insurer:
Example Health Insurance

Claim Amount:
115000

Status:
UNDER_REVIEW

Insurer Reference:
INS-CLM-778821
```

Also create examples for:

```text
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

# 78. Example End-to-End Scenario

Patient:

```text
Rahul Shah
P10045
```

Admission:

```text
ADM10023
```

Discharge completed.

Final invoice:

```text
INV-2026-001245
```

Insurance:

```text
Provider:
Example Health Insurance

Policy:
POL-ABC-45892

Verification:
VERIFIED
```

System creates:

```text
CLM-2026-00098
```

Claim amount:

```text
₹115,000
```

Documents:

```text
Final Invoice
Discharge Document
Insurance Card
Required Supporting Documents
```

Validation passes.

Claim:

```text
READY
```

Authorized staff submits.

RPA opens insurer portal:

```text
Login
→ Claims
→ New Claim
→ Enter Details
→ Upload Documents
→ Submit
```

Insurer returns:

```text
INS-CLM-778821
```

System:

```text
SUBMITTED
```

Next status check:

```text
UNDER_REVIEW
```

Later insurer requests:

```text
Additional document required.
```

System:

```text
QUERY
MORE_INFORMATION_REQUIRED
```

Staff uploads the requested document.

RPA submits the response.

Claim:

```text
UNDER_REVIEW
```

Insurer later returns:

```text
APPROVED
Approved Amount: insurer-provided amount
```

Later payment arrives.

Staff/RPA records:

```text
PAID
```

Billing reconciliation occurs.

---

# 79. Example Rejection Scenario

Claim:

```text
UNDER_REVIEW
```

Insurer:

```text
REJECTED
Reason:
Insurer-provided rejection reason.
```

System:

```text
Claim = REJECTED
```

Notify Insurance Staff.

Staff reviews:

```text
Claim
Documents
Insurer reason
Billing
Verification
```

System does not automatically appeal.

Human chooses next action.

---

# 80. Example Partial Approval

Claim:

```text
Claimed: ₹100,000
```

Insurer:

```text
PARTIALLY_APPROVED
Approved: ₹80,000
```

Store insurer-provided decision.

The remaining ₹20,000 must not automatically become a patient liability unless the hospital's configured financial rules establish that relationship.

Create a billing review task if required.

---

# 81. Testing Requirements

## Backend

Test:

```text
Claim creation
Claim validation
Duplicate detection
Document validation
Ready transition
Submission
Idempotency
Status update
Query creation
Query response
Approval
Partial approval
Rejection
Settlement
Reconciliation
Cancellation
RBAC
```

---

## RPA

Test:

```text
Successful submission
Successful status check
Portal timeout
Login failure
Invalid claim response
Missing claim reference
Query retrieval
Document upload
Evidence capture
Unknown submission result
```

---

## Frontend

Test:

```text
Claim dashboard
Claim creation
Claim detail
Document checklist
Claim submission
Status timeline
Query handling
Settlement
Exception handling
Permission restrictions
```

---

# 82. Security Testing

Verify:

```text
Patient cannot access another patient's claim.
Patient cannot create or modify insurer decisions.
Unauthorized staff cannot submit claims.
Unauthorized staff cannot record settlement.
Unauthorized staff cannot resolve claim exceptions.
Claim documents cannot be downloaded without permission.
RPA credentials cannot be retrieved from API responses.
Audit logs cannot be modified through normal APIs.
```

---

# 83. Implementation Order

Implement in this order:

```text
1. InsuranceClaim model
2. InsuranceClaimDocument model
3. InsuranceClaimStatusHistory model
4. InsuranceClaimQuery model
5. InsuranceClaimSettlement model
6. Claim validation service
7. Claim creation service
8. Claim document service
9. Claim status service
10. Provider adapter interface
11. Claim submission adapter
12. RPA job integration
13. Query workflow
14. Settlement/reconciliation workflow
15. Exception handling
16. Audit integration
17. Notification integration
18. Backend APIs
19. Finance & Insurance UI
20. Patient claim view
21. Billing integration
22. Discharge integration
23. Robot Framework submission automation
24. Robot Framework status polling
25. Seed data
26. Automated tests
27. Security testing
28. End-to-end testing
```

---

# 84. AI Coding Agent Instructions

Implement this module inside the existing hospital platform.

Strict rules:

1. Do not create a separate application.
2. Reuse existing authentication.
3. Reuse existing RBAC.
4. Reuse existing Patient model.
5. Reuse existing Admission model.
6. Reuse existing Visit model.
7. Reuse existing Billing/Invoice model.
8. Reuse existing InsurancePolicy model from `09_INSURANCE_VERIFICATION.md`.
9. Reuse existing InsuranceVerification model.
10. Reuse existing Notification Service.
11. Reuse existing Document Service.
12. Reuse existing Audit Service.
13. Reuse existing RPAJob/RPAExecution infrastructure.
14. Reuse existing ExceptionCase.
15. Do not duplicate patient data unnecessarily.
16. Do not create a second insurance verification system.
17. Do not create a separate billing system.
18. Do not invent insurer rules.
19. Do not invent claim amounts.
20. Do not invent approval decisions.
21. Do not fabricate documents.
22. Do not automatically appeal rejected claims.
23. Do not modify clinical content.
24. Do not make clinical decisions.
25. Do not store insurer credentials in source code.
26. Do not store credentials in MongoDB.
27. Do not expose credentials through APIs.
28. Keep insurer-specific integrations isolated.
29. Validate all API/RPA responses.
30. Prevent duplicate submissions.
31. Handle uncertain submission results safely.
32. Preserve all claim history.
33. Preserve all insurer references.
34. Keep audit logs immutable.
35. Make scheduled status checks idempotent.
36. Implement complete exception handling.
37. Implement loading/error/empty/success states.
38. Write backend tests.
39. Write frontend tests.
40. Write Robot Framework tests.
41. Seed realistic test data.
42. Verify all RBAC restrictions.
43. Verify patient data isolation.
44. Verify Billing reconciliation.
45. Verify Discharge integration.
46. Never turn an insurer response into a decision made by the hospital system.

---

# 85. Definition of Done

The module is complete only when this end-to-end flow works:

```text
Patient
   ↓
Insurance Policy
   ↓
Insurance Verification
   ↓
Discharge / Claim Trigger
   ↓
Claim Creation
   ↓
Invoice + Documents
   ↓
Claim Validation
   ↓
Human Review if Configured
   ↓
API / Robot Framework
   ↓
Insurer
   ↓
Claim Reference
   ↓
Submitted
   ↓
Status Tracking
   ↓
Query / More Information
   ↓
Approval / Partial Approval / Rejection
   ↓
Settlement
   ↓
Payment Reconciliation
   ↓
Billing Update
   ↓
Notifications
   ↓
Audit History
```

The implementation must correctly support:

```text
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

The final system must provide:

```text
MERN
+
MongoDB
+
REST APIs
+
RBAC
+
Insurance Integration
+
Robot Framework RPA
+
Claim Document Management
+
Claim Tracking
+
Query Handling
+
Settlement/Reconciliation
+
Exception Handling
+
Notifications
+
Audit Logging
+
Billing Integration
+
Discharge Integration
+
Automated Testing
```

Most importantly, the system must automate repetitive administrative claim processing while keeping **claim decisions, ambiguous cases, financial adjustments, appeals, and clinically sensitive decisions under authorized human control**.