# 09_INSURANCE_VERIFICATION.md

# Insurance Verification Module

## 1. Module Overview

Build a complete **Insurance Verification Module** for the Hospital Administrative Automation & RPA Platform.

The module must allow the hospital to:

- Store and manage patient insurance policy information.
- Associate one or more insurance policies with a patient.
- Verify whether a patient's insurance policy is currently valid.
- Verify patient eligibility where supported.
- Verify policy status.
- Verify policy expiry.
- Verify network status.
- Retrieve available coverage and limits.
- Retrieve deductible/copay/remaining coverage information when the insurer actually provides it.
- Determine whether prior authorization/preauthorization is required when the insurer provides that information.
- Record the source of verification.
- Maintain complete verification history.
- Integrate with insurer APIs where available.
- Use Robot Framework browser automation when an insurer has no usable API.
- Capture evidence from insurer portals when required.
- Route ambiguous or failed verification cases to authorized human staff.
- Provide verified insurance information to Billing, Admission, Discharge, and other authorized modules.
- Notify relevant staff/patients about verification outcomes.
- Maintain complete audit and RPA execution history.

### Critical Boundary

This module performs **insurance verification only**.

It must NOT:

- Approve insurance claims.
- Reject insurance claims.
- Decide whether a claim should be paid.
- Make medical decisions.
- Decide whether treatment is medically necessary.
- Invent insurance coverage.
- Guess coverage amounts.
- Automatically override insurer responses.
- Make financial adjustments.
- Automatically appeal rejected insurance claims.

Claims are handled by:

```text
10_INSURANCE_CLAIMS.md
```

---

# 2. Technology Stack

Use the existing hospital platform architecture.

### Frontend

- React.js
- React Router
- Axios or existing API client
- Bootstrap or the existing application UI system
- Form validation
- Role-based route protection
- Reusable tables, modals, forms and status components

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- REST APIs
- JWT authentication
- RBAC middleware
- Validation middleware
- Central error handling
- Audit logging

### Automation

- Robot Framework
- Browser automation using an appropriate browser library
- API automation where applicable
- Screenshot/evidence capture
- RPA job tracking

### External Integration

Support both:

```text
Insurer API
      OR
Insurer Web Portal
      OR
Manual Verification
```

Preferred order:

```text
1. Official API
2. Secure portal automation
3. Manual verification
```

Do not use browser automation if a reliable official API is available and approved.

---

# 3. Business Objective

Insurance verification currently requires staff to repeatedly:

1. Read insurance information.
2. Open an insurer website.
3. Log in.
4. Search for the patient/policy.
5. Read policy information.
6. Check eligibility.
7. Check expiry.
8. Check network status.
9. Check coverage.
10. Check authorization requirements.
11. Record the result.
12. Inform Billing or Admission staff.

Automate these repetitive administrative steps while maintaining human control over ambiguous or high-risk cases.

Target workflow:

```text
Patient Insurance Details
        ↓
Validate Details
        ↓
Find Existing Policy
        ↓
Create/Update Policy Association
        ↓
Verification Request
        ↓
Select Integration
        ↓
API Verification OR RPA Portal Verification
        ↓
Read Insurer Response
        ↓
Validate Response
        ↓
Store Verification Result
        ↓
Store Evidence
        ↓
Update Insurance Record
        ↓
Notify Relevant Staff
        ↓
Expose Verified Data to Billing/Admission/Discharge
```

---

# 4. Actors and Permissions

## 4.1 Patient

Can:

- Add insurance information.
- View own insurance policies.
- Upload insurance documents.
- Request verification.
- View verification status.
- View non-sensitive verification results.
- Receive notifications.

Cannot:

- Modify verified insurer responses directly.
- Mark a policy as verified.
- Override verification results.
- Approve coverage.

---

## 4.2 Receptionist

Can:

- Add patient insurance information.
- Search patient insurance.
- Request verification.
- View verification results.
- Upload policy documents.
- Correct policy information before verification.
- See verification status.

Cannot:

- Override insurer response.
- Approve claims.
- Modify insurer-derived coverage values without proper correction workflow.

---

## 4.3 Billing Staff

Can:

- View verified insurance information.
- Request re-verification.
- Review eligibility and coverage information.
- View verification history.
- Use verified information for billing workflows.
- Flag discrepancies.

Cannot:

- Invent coverage.
- Override insurer information without authorized adjustment workflow.
- Approve claims.

---

## 4.4 Insurance Representative

Can:

- Review verification records.
- Review insurer responses.
- Handle exceptions.
- Manually record authorized verification information when required.
- Upload supporting evidence.

Cannot:

- Modify raw insurer evidence.
- Delete audit history.
- Approve claims through this module.

---

## 4.5 Administrative Manager

Can:

- View verification reports.
- Review exceptions.
- Configure approved verification workflows.
- View insurer integration status.

---

## 4.6 System Admin

Can:

- Configure technical integrations.
- Configure insurer endpoints.
- Configure approved credentials/secrets references.
- Manage integration activation.
- View technical failures.
- View audit logs.

System Admin must NOT see plaintext insurer credentials.

---

# 5. Core Insurance Concepts

The implementation must clearly distinguish the following.

## 5.1 Patient

Permanent hospital identity.

Example:

```text
Patient ID: P10045
Name: Rahul Shah
```

---

## 5.2 Insurance Policy

The insurance coverage relationship associated with the patient.

Example:

```text
Policy Number: POL-ABC-45892
Member ID: MEM-78291
Provider: Example Health Insurance
Plan: Gold Health Plan
```

---

## 5.3 Verification

A specific attempt to determine the current policy/eligibility/coverage state.

Example:

```text
Verification ID: IV-2026-000123
Policy ID: INS-POL-00045
Source: INSURER_PORTAL
Status: VERIFIED
Verified At: 2026-10-06 10:30
```

---

## 5.4 Verification Evidence

Evidence supporting the verification result.

Examples:

- API response reference.
- Portal screenshot.
- Verification reference number.
- Portal transaction/reference ID.
- Uploaded insurer document.
- Manual verification document.

---

# 6. Insurance Policy Lifecycle

Implement policy states:

```text
DRAFT
ACTIVE
EXPIRED
CANCELLED
SUSPENDED
UNKNOWN
```

The system must not automatically assume a policy is ACTIVE merely because the patient entered it.

The policy status should be derived from verified insurer information when available.

---

# 7. Verification Status Lifecycle

Use:

```text
REQUESTED
QUEUED
IN_PROGRESS
VERIFIED
PARTIALLY_VERIFIED
NOT_ELIGIBLE
EXPIRED
NOT_FOUND
AMBIGUOUS
FAILED
MANUAL_REVIEW
CANCELLED
```

### Meaning

### REQUESTED

Verification has been requested.

### QUEUED

Verification is waiting for an RPA/API worker.

### IN_PROGRESS

Verification is currently being executed.

### VERIFIED

The insurer response successfully confirms the requested information.

### PARTIALLY_VERIFIED

Some information was obtained but some fields were unavailable.

Example:

```text
Eligibility = Verified
Policy Status = Active
Coverage Limits = Not Available
Authorization = Unknown
```

### NOT_ELIGIBLE

Insurer explicitly reports the patient is not eligible.

### EXPIRED

Policy is explicitly reported as expired.

### NOT_FOUND

Insurer could not find the policy/member combination.

### AMBIGUOUS

Multiple possible matches or unclear insurer information.

### FAILED

Technical verification failure.

### MANUAL_REVIEW

Human intervention is required.

---

# 8. Insurance Policy Data Model

Create a Mongoose model:

```text
InsurancePolicy
```

Suggested schema:

```javascript
{
  patientId: ObjectId,

  policyNumber: String,
  memberId: String,
  groupNumber: String,

  providerName: String,
  providerCode: String,

  planName: String,
  planType: String,

  relationshipToPatient: String,

  policyHolderName: String,
  policyHolderPatientId: ObjectId,

  startDate: Date,
  endDate: Date,

  status: String,

  isPrimary: Boolean,
  priority: Number,

  networkStatus: String,

  coverageType: String,

  deductibleAmount: Number,
  deductibleUsed: Number,
  deductibleRemaining: Number,

  copayAmount: Number,

  coverageLimit: Number,
  coverageUsed: Number,
  coverageRemaining: Number,

  authorizationRequired: Boolean,

  lastVerifiedAt: Date,
  lastVerificationStatus: String,

  source: String,

  documents: [
    {
      documentId: ObjectId,
      documentType: String
    }
  ],

  createdBy: ObjectId,
  updatedBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

### Important

Amounts such as deductible, copay, coverage limit, and remaining coverage must only be populated when the insurer provides them or an authorized human enters them from valid evidence.

Never calculate or invent insurer coverage values from incomplete information.

---

# 9. Insurance Verification Data Model

Create:

```text
InsuranceVerification
```

Suggested schema:

```javascript
{
  verificationId: String,

  patientId: ObjectId,
  policyId: ObjectId,

  requestedBy: ObjectId,

  verificationSource: String,

  integrationType: String,

  status: String,

  requestedAt: Date,
  startedAt: Date,
  completedAt: Date,

  insurerName: String,

  policyNumber: String,
  memberId: String,

  eligibilityStatus: String,
  policyStatus: String,

  effectiveDate: Date,
  expiryDate: Date,

  networkStatus: String,

  coverageType: String,

  deductibleAmount: Number,
  deductibleUsed: Number,
  deductibleRemaining: Number,

  copayAmount: Number,

  coverageLimit: Number,
  coverageUsed: Number,
  coverageRemaining: Number,

  authorizationRequired: String,

  verificationReference: String,

  insurerResponseSummary: Object,

  evidenceDocumentIds: [ObjectId],

  errorCode: String,
  errorMessage: String,

  exceptionCaseId: ObjectId,

  rpaJobId: ObjectId,

  correlationId: String,

  createdAt: Date,
  updatedAt: Date
}
```

Do not store raw credentials or sensitive authentication tokens in this document.

---

# 10. Verification Attempt Model

If multiple attempts need to be tracked separately, create:

```text
InsuranceVerificationAttempt
```

Example:

```javascript
{
  verificationId: ObjectId,

  attemptNumber: Number,

  source: "API",

  startedAt: Date,
  completedAt: Date,

  status: String,

  externalReference: String,

  responseCode: String,

  errorCode: String,

  errorMessage: String,

  evidenceDocumentId: ObjectId,

  rpaExecutionId: ObjectId,

  createdAt: Date
}
```

This allows the system to distinguish:

```text
Verification
    ├── Attempt 1 → API → Failed
    ├── Attempt 2 → Portal → Success
    └── Attempt 3 → Manual → Completed
```

---

# 11. Insurance Document Model

Support documents such as:

- Insurance card.
- Policy document.
- Member card.
- Insurer correspondence.
- Eligibility confirmation.
- Verification evidence.

Suggested:

```text
InsuranceDocument
```

Fields:

```javascript
{
  patientId: ObjectId,
  policyId: ObjectId,

  documentType: String,

  fileName: String,
  storageKey: String,

  mimeType: String,
  fileSize: Number,

  uploadedBy: ObjectId,

  source: String,

  verificationId: ObjectId,

  createdAt: Date
}
```

Documents must use the existing secure document storage architecture.

---

# 12. Database Indexes

Create indexes for common searches:

```javascript
InsurancePolicy.index({ patientId: 1 });

InsurancePolicy.index({
  policyNumber: 1
});

InsurancePolicy.index({
  memberId: 1
});

InsurancePolicy.index({
  providerName: 1
});

InsurancePolicy.index({
  patientId: 1,
  isPrimary: 1
});

InsuranceVerification.index({
  patientId: 1,
  createdAt: -1
});

InsuranceVerification.index({
  policyId: 1,
  createdAt: -1
});

InsuranceVerification.index({
  status: 1
});

InsuranceVerification.index({
  correlationId: 1
});

InsuranceVerification.index({
  rpaJobId: 1
});
```

Use appropriate compound indexes after observing actual query patterns.

---

# 13. Policy Association

A patient can have:

```text
Primary Insurance
Secondary Insurance
```

Support multiple policies.

Example:

```text
Patient P10045

Primary:
ABC Health
Policy: POL-10001

Secondary:
XYZ Insurance
Policy: POL-20001
```

Do not assume every hospital uses secondary insurance.

Therefore configure:

```text
allowSecondaryInsurance = true/false
```

in hospital configuration.

---

# 14. Patient Insurance Entry Workflow

## Patient Portal

Patient navigates:

```text
Patient Portal
 → My Insurance
 → Add Insurance
```

Form:

```text
Insurance Provider *
Policy Number *
Member ID *
Group Number
Policy Holder Name *
Relationship to Patient *
Plan Name
Policy Start Date
Policy End Date
Insurance Card Upload
```

Buttons:

```text
Save
Save & Verify
Cancel
```

---

# 15. Staff Insurance Entry

Receptionist/Billing staff:

```text
Finance & Insurance
 → Patient Search
 → Patient
 → Insurance
 → Add Policy
```

Search patient using:

```text
Patient ID
Mobile
Name
Date of Birth
```

Do not create a new patient during insurance entry.

---

# 16. Duplicate Policy Detection

Before creating a policy, search:

```text
patientId
+
provider
+
policyNumber
+
memberId
```

If an exact matching policy exists:

```text
Do not create duplicate.
```

Show:

```text
Existing policy found.

Policy: POL-ABC-45892
Provider: Example Health Insurance
Last Verified: 06 Oct 2026
Status: ACTIVE

[View Policy]
[Request Re-Verification]
```

---

# 17. Verification Request

User clicks:

```text
Verify Insurance
```

Backend:

```text
POST /api/insurance/policies/:policyId/verify
```

Create:

```text
InsuranceVerification
status = REQUESTED
```

Then queue the verification.

Response:

```json
{
  "verificationId": "IV-2026-000123",
  "status": "QUEUED"
}
```

Do not keep the HTTP request waiting for a long-running insurer portal process.

---

# 18. Verification Source Selection

The backend must select the configured verification adapter.

Example:

```text
Provider
   ↓
Integration Configuration
   ↓
API Available?
   ├── YES → API Adapter
   └── NO → Portal RPA Adapter
```

Manual fallback:

```text
API Failure
      ↓
Configured Portal Available?
      ↓
YES → Portal Automation
NO → Manual Review
```

Do not automatically switch integration methods unless configured by the hospital.

---

# 19. Insurer API Integration

When an official API is available:

```text
Hospital Backend
      ↓
Insurance Adapter
      ↓
Insurer API
      ↓
Response
      ↓
Normalize Response
      ↓
InsuranceVerification
```

Create an adapter interface:

```javascript
class InsuranceProviderAdapter {
    async verifyEligibility(policyData) {}
    async getCoverage(policyData) {}
    async getAuthorizationRequirements(policyData) {}
}
```

Provider-specific adapters:

```text
ABCInsuranceAdapter
XYZInsuranceAdapter
...
```

Do not hard-code provider-specific logic inside the controller.

---

# 20. API Response Normalization

Different insurers may return different field names.

Example insurer response:

```json
{
  "member_status": "ACTIVE",
  "effective_date": "2026-01-01",
  "termination_date": "2026-12-31",
  "network": "IN_NETWORK"
}
```

Normalize internally:

```json
{
  "eligibilityStatus": "ELIGIBLE",
  "policyStatus": "ACTIVE",
  "effectiveDate": "2026-01-01",
  "expiryDate": "2026-12-31",
  "networkStatus": "IN_NETWORK"
}
```

The frontend must use the normalized hospital schema rather than provider-specific response fields.

---

# 21. Robot Framework Portal Verification

When an API is unavailable:

```text
Robot Framework
      ↓
Open Insurer Portal
      ↓
Authenticate
      ↓
Search Policy / Member
      ↓
Read Verification Data
      ↓
Capture Evidence
      ↓
Return Structured Result
      ↓
Backend Updates Verification
```

Robot Framework must NOT own business data.

It only performs automation.

---

# 22. Robot Framework Folder Structure

Add:

```text
robot/
├── insurance/
│   ├── tests/
│   │   ├── verify_insurance_portal.robot
│   │   ├── retry_failed_verification.robot
│   │   └── capture_insurance_evidence.robot
│   │
│   ├── keywords/
│   │   ├── insurer_login.resource
│   │   ├── policy_search.resource
│   │   ├── eligibility_check.resource
│   │   ├── coverage_check.resource
│   │   ├── authorization_check.resource
│   │   ├── evidence_capture.resource
│   │   └── verification_result.resource
│   │
│   └── resources/
│       ├── browser.resource
│       ├── api.resource
│       ├── secrets.resource
│       └── common.resource
│
└── results/
    └── insurance/
```

---

# 23. Robot Framework Verification Flow

Pseudo-flow:

```robot
*** Test Cases ***
Verify Insurance Policy
    [Arguments]    ${verification_id}

    Get Verification Request
    Validate Verification Input

    Open Insurer Portal
    Authenticate With Insurer

    Search Patient Policy
    Verify Policy Status
    Verify Eligibility
    Verify Network Status
    Retrieve Coverage Information
    Retrieve Authorization Requirement

    Capture Verification Evidence

    Build Normalized Verification Result
    Submit Verification Result

    Close Insurer Session
```

The exact browser selectors must be configured per insurer portal.

Never hard-code passwords in `.robot` files.

---

# 24. Credential Security

Insurer portal credentials are highly sensitive.

Never store:

```text
username/password
API secret
API token
private key
session cookie
```

inside:

```text
MongoDB
source code
Git repository
Robot Framework test files
logs
screenshots
API responses
```

Use the application's approved secret-management mechanism.

Example:

```text
INSURER_PORTAL_USERNAME
INSURER_PORTAL_PASSWORD
INSURER_API_KEY
```

or a proper secrets manager.

Robot Framework receives only the credential it needs at runtime.

---

# 25. RPA Job

Use existing:

```text
RPAJob
RPAExecution
```

entities.

Example:

```javascript
{
  jobType: "INSURANCE_VERIFICATION",

  referenceId: "IV-2026-000123",

  status: "RUNNING",

  priority: "NORMAL",

  correlationId: "CORR-2026-000987",

  startedAt: Date,

  completedAt: Date
}
```

Execution log:

```text
RPA Job
   ↓
Execution
   ↓
Step 1 Login
   ↓
Step 2 Search Policy
   ↓
Step 3 Verify Eligibility
   ↓
Step 4 Read Coverage
   ↓
Step 5 Capture Evidence
   ↓
Step 6 Submit Result
```

---

# 26. Evidence Capture

For portal verification, capture evidence when:

- Verification succeeds.
- Verification fails.
- Portal returns ambiguous information.
- Portal reports policy not found.
- Human review is required.
- Technical failure occurs after meaningful interaction.

Possible evidence:

```text
Screenshot
Portal reference number
Timestamp
Structured response
Document
```

Do not capture unnecessary sensitive portal screens.

Evidence must be access-controlled.

---

# 27. Verification Result

Example successful result:

```text
Verification ID: IV-2026-000123

Patient:
P10045 - Rahul Shah

Provider:
Example Health Insurance

Policy:
POL-ABC-45892

Member:
MEM-78291

Eligibility:
ELIGIBLE

Policy Status:
ACTIVE

Network:
IN_NETWORK

Effective:
01-Jan-2026

Expiry:
31-Dec-2026

Coverage:
Available

Authorization:
Required for selected service

Source:
INSURER_PORTAL

Verified:
06-Oct-2026 10:30 AM
```

Important:

The module must distinguish:

```text
Verification Result
```

from:

```text
Claim Decision
```

A successful verification does NOT mean:

```text
Claim Approved
```

---

# 28. Unknown Coverage

Suppose insurer returns:

```text
Policy Active
Eligibility Active
Coverage Details Unavailable
```

Store:

```text
policyStatus = ACTIVE
eligibilityStatus = ELIGIBLE
coverageStatus = UNKNOWN
```

Do NOT calculate coverage.

Do NOT assume:

```text
100% coverage
80% coverage
₹5,00,000 limit
```

unless explicitly returned by the insurer or entered from authorized evidence.

---

# 29. Ambiguous Response

Example:

```text
Two matching member records found.
```

System must:

```text
Verification → AMBIGUOUS
       ↓
ExceptionCase → OPEN
       ↓
Insurance Staff Review
```

Human sees:

```text
Possible Matches

Match 1
Name: Rahul Shah
DOB: 14/05/2001
Member ID: MEM-78291

Match 2
Name: Rahul S Shah
DOB: 14/05/2001
Member ID: MEM-78219
```

The system must NOT automatically choose one.

---

# 30. Policy Not Found

If insurer explicitly reports:

```text
Policy Not Found
```

Store:

```text
status = NOT_FOUND
```

Do not automatically mark the policy invalid unless the insurer response explicitly states invalid/terminated/expired.

Notify authorized staff.

---

# 31. Expired Policy

If insurer explicitly reports:

```text
Policy Status = EXPIRED
```

Store:

```text
policy.status = EXPIRED
verification.status = EXPIRED
```

Notify Billing/Insurance staff.

Do not delete the historical policy.

Historical policies must remain available for previous encounters/claims.

---

# 32. Network Status

Support:

```text
IN_NETWORK
OUT_OF_NETWORK
UNKNOWN
NOT_AVAILABLE
```

Only populate from insurer information.

The module must not infer network status from provider name alone.

---

# 33. Authorization Requirement

Support:

```text
REQUIRED
NOT_REQUIRED
UNKNOWN
NOT_AVAILABLE
```

If insurer says:

```text
Authorization required
```

display clearly:

```text
Prior Authorization Required
```

Do not automatically create authorization approval.

Authorization workflows are outside basic verification.

---

# 34. Coverage Information

Possible fields:

```text
Coverage Type
Coverage Limit
Coverage Used
Coverage Remaining
Deductible
Deductible Used
Deductible Remaining
Copay
Coinsurance
```

Each field must have an availability state.

Example:

```json
{
  "coverageLimit": {
    "value": 500000,
    "available": true,
    "source": "INSURER"
  },
  "copay": {
    "value": null,
    "available": false,
    "source": "INSURER"
  }
}
```

This prevents the system from confusing:

```text
0
```

with:

```text
Unknown
```

---

# 35. Verification Freshness

Insurance information changes over time.

Implement configurable verification freshness.

Example configuration:

```text
insuranceVerificationValidityHours = 24
```

If:

```text
lastVerifiedAt < 24 hours
```

the system may display:

```text
Recently Verified
```

If older:

```text
Verification May Be Stale
[Verify Again]
```

The actual duration must be configurable.

Do not hard-code 24 hours as a universal hospital rule.

---

# 36. Re-Verification Triggers

Allow re-verification when:

- Policy number changes.
- Member ID changes.
- Patient insurance provider changes.
- Previous verification is stale.
- Admission requires fresh verification.
- Billing requests verification.
- Discharge requires verification.
- Insurer information is disputed.
- Staff explicitly requests verification.

---

# 37. Idempotency

Prevent duplicate verification jobs.

If the same request is submitted repeatedly:

```text
POST /verify
```

within a configurable time window while an existing verification is:

```text
REQUESTED
QUEUED
IN_PROGRESS
```

do not create multiple concurrent jobs unnecessarily.

Return the existing active verification.

---

# 38. Retry Policy

Retry only technical failures.

Examples:

```text
Network timeout
Temporary server error
Portal unavailable
Browser crash
```

Do not automatically retry indefinitely.

Example configuration:

```text
maxRetries = 3
retryDelay = configurable
```

After maximum retries:

```text
FAILED
```

or:

```text
MANUAL_REVIEW
```

depending on the failure type.

Do not retry business responses such as:

```text
NOT_FOUND
EXPIRED
NOT_ELIGIBLE
```

as if they were technical failures.

---

# 39. Exception Management

Create/use:

```text
ExceptionCase
```

Example:

```javascript
{
  type: "INSURANCE_VERIFICATION",
  referenceId: "IV-2026-000123",

  category: "AMBIGUOUS_RESPONSE",

  severity: "MEDIUM",

  status: "OPEN",

  assignedTo: ObjectId,

  reason: "Multiple member matches returned",

  createdAt: Date,
  resolvedAt: Date
}
```

Exception categories:

```text
INVALID_INPUT
POLICY_NOT_FOUND
AMBIGUOUS_MATCH
PORTAL_UNAVAILABLE
API_FAILURE
AUTHENTICATION_FAILURE
COVERAGE_UNAVAILABLE
UNEXPECTED_RESPONSE
EVIDENCE_CAPTURE_FAILURE
MANUAL_VERIFICATION_REQUIRED
```

---

# 40. Human Review Workflow

```text
Exception Created
       ↓
Assigned to Insurance Staff
       ↓
Review Patient + Policy
       ↓
Review Insurer Evidence
       ↓
Contact Insurer if Required
       ↓
Enter Authorized Result
       ↓
Upload Supporting Evidence
       ↓
Resolve Exception
       ↓
Update Verification
```

Human decision must be recorded.

Example:

```text
Reviewed By:
Insurance Staff - EMP1008

Decision:
Policy confirmed active.

Evidence:
Insurer confirmation document.

Reviewed At:
06-Oct-2026 11:10
```

---

# 41. Verification History

Every verification must remain in history.

Example:

```text
06 Oct 2026
ACTIVE
IN_NETWORK
Verified via API

01 Oct 2026
ACTIVE
IN_NETWORK
Verified via Portal

01 Sep 2026
EXPIRED
Verified via Portal
```

Never overwrite historical verification records.

The current policy record can be updated with the latest state, while the verification history remains immutable/auditable.

---

# 42. UI — Insurance Dashboard

Route:

```text
/finance-insurance/insurance
```

Dashboard cards:

```text
Active Policies
Pending Verification
Verified Today
Manual Review
Expired Policies
Failed Verifications
```

Filters:

```text
Date
Provider
Status
Verification Source
Verification Status
Department
```

---

# 43. UI — Patient Insurance List

Route:

```text
/finance-insurance/patients/:patientId/insurance
```

Display:

| Field | Example |
|---|---|
| Provider | Example Health |
| Policy Number | POL-ABC-45892 |
| Member ID | MEM-78291 |
| Status | ACTIVE |
| Network | IN_NETWORK |
| Last Verified | 06 Oct 2026 |
| Verification | VERIFIED |
| Primary | Yes |

Actions:

```text
View
Verify
Re-Verify
Documents
History
```

---

# 44. UI — Add Insurance

Create reusable form:

```text
Provider *
Policy Number *
Member ID *
Group Number
Plan Name
Policy Holder
Relationship
Start Date
End Date
Primary Insurance
Insurance Card
```

Buttons:

```text
Save
Save & Verify
Cancel
```

Validation errors must appear beside fields.

---

# 45. UI — Verification Details

Route:

```text
/finance-insurance/verifications/:verificationId
```

Sections:

### Patient

```text
Patient ID
Name
DOB
```

### Policy

```text
Provider
Policy Number
Member ID
Plan
```

### Verification

```text
Status
Source
Requested At
Started At
Completed At
```

### Eligibility

```text
Eligible / Not Eligible / Unknown
```

### Coverage

```text
Coverage Type
Limit
Used
Remaining
Deductible
Copay
```

### Network

```text
In Network
Out of Network
Unknown
```

### Authorization

```text
Required
Not Required
Unknown
```

### Evidence

```text
View Evidence
```

### Audit

```text
Requested By
Verified By
RPA Job
Correlation ID
```

---

# 46. Verification Status UI

Use clear status badges.

Example:

```text
VERIFIED
PARTIALLY VERIFIED
PENDING
IN PROGRESS
MANUAL REVIEW
NOT FOUND
EXPIRED
NOT ELIGIBLE
FAILED
```

Avoid using only colors.

Always include text labels for accessibility.

---

# 47. Patient Portal Insurance Screen

Route:

```text
/patient/insurance
```

Patient sees:

```text
My Insurance

ABC Health
Policy: POL-ABC-45892
Status: Active
Last Verified: 06 Oct 2026

[View Details]
```

Sensitive insurer information must follow the existing patient authorization model.

---

# 48. Billing Integration

Billing must be able to retrieve the latest relevant verification.

Example API:

```http
GET /api/insurance/patients/:patientId/active
```

Response:

```json
{
  "policy": {
    "providerName": "Example Health Insurance",
    "policyNumber": "POL-ABC-45892",
    "status": "ACTIVE"
  },

  "verification": {
    "status": "VERIFIED",
    "eligibilityStatus": "ELIGIBLE",
    "networkStatus": "IN_NETWORK",
    "lastVerifiedAt": "2026-10-06T10:30:00Z"
  }
}
```

Billing may use this information according to configured billing rules.

Insurance verification does NOT automatically determine the final bill.

---

# 49. Admission Integration

During admission:

```text
Patient Admission
      ↓
Insurance Available?
      ↓
YES
      ↓
Check Verification Freshness
      ↓
Fresh?
 ├── YES → Use Latest Verification
 └── NO → Request Verification
```

If verification is unavailable:

```text
Do not invent coverage.

Create appropriate exception/task.
```

Admission should continue or pause according to hospital-configured administrative policy.

Do not invent a policy for what happens when verification is pending.

---

# 50. Discharge Integration

Before final discharge billing:

```text
Discharge
   ↓
Insurance Status
   ↓
Latest Verification
   ↓
Coverage Information
   ↓
Billing/Insurance Workflow
```

If insurer information is stale:

```text
Show warning
```

Example:

```text
Insurance verification is older than configured freshness period.

[Re-Verify]
```

Do not automatically assume insurance will pay the final bill.

---

# 51. Notification Integration

Use the centralized Notification Service.

Events:

```text
INSURANCE_VERIFICATION_REQUESTED
INSURANCE_VERIFICATION_COMPLETED
INSURANCE_VERIFICATION_FAILED
INSURANCE_VERIFICATION_REVIEW_REQUIRED
INSURANCE_POLICY_EXPIRED
INSURANCE_POLICY_NOT_FOUND
INSURANCE_POLICY_NOT_ELIGIBLE
```

Possible channels:

```text
SMS
Email
In-App
```

Patient notifications must avoid exposing unnecessary sensitive information.

Example:

```text
Your insurance verification has been completed.
Please log in to the hospital portal to view the available details.
```

---

# 52. API Endpoints

Implement REST APIs.

## Policies

```http
POST /api/insurance/policies
GET /api/insurance/policies/:id
GET /api/insurance/patients/:patientId/policies
PUT /api/insurance/policies/:id
DELETE /api/insurance/policies/:id
```

Deletion should normally be soft-delete/archive rather than destructive deletion when historical records exist.

---

## Verification

```http
POST /api/insurance/policies/:policyId/verify

GET /api/insurance/verifications/:verificationId

GET /api/insurance/policies/:policyId/verifications

GET /api/insurance/patients/:patientId/verifications
```

---

## Re-Verification

```http
POST /api/insurance/verifications/:verificationId/retry
```

Only permit retry where the current state allows it.

---

## Exceptions

```http
GET /api/insurance/exceptions

GET /api/insurance/exceptions/:id

POST /api/insurance/exceptions/:id/assign

POST /api/insurance/exceptions/:id/resolve
```

---

## Evidence

```http
GET /api/insurance/verifications/:verificationId/evidence

POST /api/insurance/verifications/:verificationId/evidence
```

Use secure document access.

---

# 53. Controller Structure

Create:

```text
insurancePolicyController.js
insuranceVerificationController.js
insuranceExceptionController.js
insuranceDocumentController.js
```

Keep controllers thin.

Business logic belongs in services.

---

# 54. Service Structure

Create:

```text
insurancePolicyService.js
insuranceVerificationService.js
insuranceEligibilityService.js
insuranceCoverageService.js
insuranceIntegrationService.js
insuranceEvidenceService.js
insuranceExceptionService.js
insuranceNotificationService.js
```

Provider-specific integrations should be isolated.

---

# 55. Integration Adapter Structure

Use:

```text
server/integrations/insurance/
├── insuranceAdapter.js
├── providerRegistry.js
├── api/
│   ├── providerA.js
│   └── providerB.js
└── portal/
    ├── providerA.js
    └── providerB.js
```

Example:

```javascript
const adapter = providerRegistry.getProvider(providerCode);

const result = await adapter.verify({
    policyNumber,
    memberId,
    patient
});
```

---

# 56. Backend Routes

Recommended:

```text
server/
├── routes/
│   └── insuranceRoutes.js
│
├── controllers/
│   ├── insurancePolicyController.js
│   ├── insuranceVerificationController.js
│   └── insuranceExceptionController.js
│
├── services/
│   ├── insurancePolicyService.js
│   ├── insuranceVerificationService.js
│   └── insuranceIntegrationService.js
│
└── models/
    ├── InsurancePolicy.js
    ├── InsuranceVerification.js
    ├── InsuranceVerificationAttempt.js
    └── InsuranceDocument.js
```

---

# 57. RBAC Matrix

| Action | Patient | Receptionist | Billing | Insurance Rep | Manager | Admin |
|---|---:|---:|---:|---:|---:|---:|
| Add Policy | Yes | Yes | Yes | Yes | Yes | Yes |
| View Policy | Own | Yes | Yes | Yes | Yes | Yes |
| Request Verification | Own | Yes | Yes | Yes | Yes | Yes |
| View Verification | Own | Yes | Yes | Yes | Yes | Yes |
| Manual Review | No | Limited | Limited | Yes | Yes | Yes |
| Resolve Exception | No | No | Limited | Yes | Yes | Yes |
| Configure Integration | No | No | No | No | Limited | Yes |
| View Audit | No | Limited | Limited | Yes | Yes | Yes |

Implement actual permissions using the application's existing Permission model.

---

# 58. Audit Logging

Audit events:

```text
INSURANCE_POLICY_CREATED
INSURANCE_POLICY_UPDATED
INSURANCE_POLICY_VERIFICATION_REQUESTED
INSURANCE_VERIFICATION_STARTED
INSURANCE_VERIFICATION_COMPLETED
INSURANCE_VERIFICATION_FAILED
INSURANCE_VERIFICATION_RETRIED
INSURANCE_EXCEPTION_CREATED
INSURANCE_EXCEPTION_RESOLVED
INSURANCE_DOCUMENT_UPLOADED
INSURANCE_DOCUMENT_VIEWED
INSURANCE_POLICY_ARCHIVED
```

Audit record:

```javascript
{
  actorId: ObjectId,
  action: String,
  entityType: String,
  entityId: ObjectId,

  before: Object,
  after: Object,

  correlationId: String,

  ipAddress: String,
  userAgent: String,

  timestamp: Date
}
```

Do not store passwords or secrets in audit logs.

---

# 59. Security Requirements

Implement:

- JWT authentication.
- RBAC.
- Backend authorization.
- Input validation.
- Secure file upload.
- Document access control.
- Encryption in transit.
- Secure secret management.
- No credentials in logs.
- No credentials in source code.
- Audit logging.
- Session timeout according to existing application configuration.
- Rate limiting for public-facing APIs.
- Idempotency for verification requests.
- Protection against duplicate jobs.
- Secure API communication.
- Principle of least privilege.

---

# 60. Data Privacy

Insurance information is sensitive.

Do not expose complete insurance details to unauthorized users.

Patient portal should only show the patient's own information.

Staff access must be role-controlled.

Every sensitive record access should be auditable.

---

# 61. RPA Error Handling

Example:

```text
Portal Login
     ↓
Authentication Failed
     ↓
Capture Technical Evidence
     ↓
RPAExecution = FAILED
     ↓
InsuranceVerification = FAILED
     ↓
ExceptionCase = OPEN
     ↓
Notify Insurance Staff
```

Never repeatedly retry invalid credentials indefinitely.

Authentication failures should alert technical/admin personnel where appropriate.

---

# 62. Portal UI Change Handling

Insurer websites may change.

Robot Framework selectors must be isolated in provider-specific resource files.

Example:

```text
robot/insurance/portals/provider_a/
├── selectors.resource
├── login.resource
├── verification.resource
└── evidence.resource
```

Do not scatter insurer-specific selectors throughout generic keywords.

---

# 63. RPA Verification Output Contract

Robot Framework should return a structured result such as:

```json
{
  "success": true,

  "status": "VERIFIED",

  "policyStatus": "ACTIVE",

  "eligibilityStatus": "ELIGIBLE",

  "networkStatus": "IN_NETWORK",

  "effectiveDate": "2026-01-01",

  "expiryDate": "2026-12-31",

  "coverage": {
    "available": true,
    "limit": 500000,
    "remaining": 425000
  },

  "authorizationRequired": "UNKNOWN",

  "externalReference": "INS-VER-778821",

  "evidence": [
    "evidence-file-reference"
  ]
}
```

Backend validates this output before updating MongoDB.

Never blindly trust RPA output.

---

# 64. Verification Result Validation

Backend must validate:

```text
Required identifiers
Status values
Date formats
Allowed enum values
Numeric amounts
Provider identity
Policy/member identifiers
Evidence references
```

If RPA returns malformed data:

```text
Do not update policy.
Create technical exception.
```

---

# 65. Concurrency Control

Prevent:

```text
Staff A → Verify
Staff B → Verify
RPA Job A
RPA Job B
```

running unnecessarily for the same policy.

Use:

```text
activeVerificationId
```

or a database-level mechanism.

Only one active verification should normally run per policy unless explicitly configured otherwise.

---

# 66. Insurance Dashboard Reports

Provide:

```text
Verification Volume
Verification Success Rate
Manual Review Rate
Failed Verification Rate
Expired Policies
Not Eligible Policies
Not Found Policies
Average Verification Time
API vs Portal Verification
Provider-wise Verification
```

Filters:

```text
Today
This Week
This Month
Custom Range
Provider
Status
Source
```

---

# 67. Seed Data

Create realistic development data.

Example:

```text
Patient:
P10045
Rahul Shah

Insurance Provider:
Example Health Insurance

Policy:
POL-ABC-45892

Member:
MEM-78291

Plan:
Gold Health Plan

Status:
ACTIVE

Network:
IN_NETWORK
```

Verification:

```text
Verification:
IV-2026-000123

Status:
VERIFIED

Eligibility:
ELIGIBLE

Source:
API

Verified:
2026-10-06
```

Create additional records for:

```text
Active
Expired
Not Found
Manual Review
Failed
Partially Verified
```

This allows the UI to be tested against every status.

---

# 68. Example End-to-End Scenario

## Scenario

Patient Rahul Shah arrives for an OPD appointment.

```text
Patient ID:
P10045
```

Insurance:

```text
Provider:
Example Health Insurance

Policy:
POL-ABC-45892

Member:
MEM-78291
```

Receptionist clicks:

```text
Verify Insurance
```

System:

```text
Create Verification
IV-2026-000123
```

RPA/API executes:

```text
Search Policy
      ↓
Policy ACTIVE
      ↓
Eligibility ELIGIBLE
      ↓
Network IN_NETWORK
      ↓
Coverage Retrieved
      ↓
Authorization Requirement Retrieved
```

System updates:

```text
InsurancePolicy
InsuranceVerification
```

Billing sees:

```text
Insurance:
Verified

Eligibility:
Eligible

Network:
In Network

Last Verified:
06-Oct-2026
```

The system does NOT say:

```text
Claim Approved
```

because verification is not claim processing.

---

# 69. Example Ambiguous Scenario

Insurer returns:

```text
Multiple member matches.
```

System:

```text
Verification = AMBIGUOUS
```

Create:

```text
ExceptionCase
```

Insurance representative receives notification.

Representative reviews:

```text
Patient information
Policy information
Insurer response
Evidence
```

Representative confirms the correct member.

System stores the human-reviewed result and supporting evidence.

Audit:

```text
Reviewed By: EMP1008
Reviewed At: 06-Oct-2026 11:20
Decision: Confirmed Member ID MEM-78291
```

---

# 70. Example Portal Failure

RPA:

```text
Open insurer portal
       ↓
Portal unavailable
```

System:

```text
RPAExecution = FAILED
Verification = FAILED
Exception = OPEN
```

Notification:

```text
Insurance verification could not be completed automatically.
Manual review is required.
```

No coverage values are invented.

---

# 71. Manual Verification

Authorized staff can manually complete verification when automation is unavailable.

Required:

```text
Provider
Policy Number
Verification Date
Verification Method
Eligibility
Policy Status
Network Status
Coverage information if available
Authorization requirement if available
Reference Number
Supporting Evidence
Notes
```

Manual verification must identify:

```text
verifiedBy
verifiedAt
verificationSource = MANUAL
```

Manual entry must not modify the raw automated response.

---

# 72. Documents Generated/Stored

Support:

```text
Insurance Verification Summary
Eligibility Confirmation
Uploaded Insurance Card
Policy Document
Portal Evidence
Insurer Correspondence
```

Documents must have:

```text
Document ID
Patient ID
Policy ID
Verification ID
Document Type
Created/Uploaded By
Created At
Storage Reference
Version
Access Permissions
```

---

# 73. Notification Templates

Create templates such as:

```text
INSURANCE_VERIFICATION_REQUESTED
INSURANCE_VERIFICATION_COMPLETED
INSURANCE_VERIFICATION_FAILED
INSURANCE_MANUAL_REVIEW_REQUIRED
INSURANCE_POLICY_EXPIRED
INSURANCE_POLICY_NOT_FOUND
```

Example staff notification:

```text
Insurance verification requires review for patient P10045.

Reason:
Multiple insurer records matched the submitted member information.

Verification ID:
IV-2026-000123
```

---

# 74. Acceptance Criteria

The module is complete only when all of the following work.

### Policy Management

- [ ] Create insurance policy.
- [ ] Edit insurance policy.
- [ ] View policy.
- [ ] Search policy.
- [ ] Associate policy with patient.
- [ ] Support primary/secondary configuration.
- [ ] Detect duplicate policy.

### Verification

- [ ] Request verification.
- [ ] Queue verification.
- [ ] API verification supported.
- [ ] Portal/RPA verification supported.
- [ ] Verification history stored.
- [ ] Verification result normalized.
- [ ] Verification freshness supported.
- [ ] Re-verification supported.

### Eligibility

- [ ] Eligibility stored.
- [ ] Not eligible status supported.
- [ ] Unknown status supported.

### Coverage

- [ ] Coverage values stored when available.
- [ ] Unknown values remain unknown.
- [ ] No invented coverage.

### Network

- [ ] In-network supported.
- [ ] Out-of-network supported.
- [ ] Unknown supported.

### Authorization

- [ ] Required supported.
- [ ] Not required supported.
- [ ] Unknown supported.

### RPA

- [ ] RPA job created.
- [ ] RPA execution tracked.
- [ ] Portal login supported.
- [ ] Policy search supported.
- [ ] Evidence captured.
- [ ] Structured result returned.
- [ ] Failures handled.
- [ ] Credentials protected.

### Exceptions

- [ ] Ambiguous match creates exception.
- [ ] Portal failure creates exception.
- [ ] Manual review supported.
- [ ] Exception assignment supported.
- [ ] Exception resolution audited.

### Integration

- [ ] Billing can read verified information.
- [ ] Admission can request/check verification.
- [ ] Discharge can access verification.
- [ ] Notification service integrated.
- [ ] Document service integrated.
- [ ] Audit service integrated.

### Security

- [ ] RBAC enforced.
- [ ] Sensitive data protected.
- [ ] Documents access-controlled.
- [ ] Secrets never logged.
- [ ] Audit records generated.

---

# 75. Automated Tests

Create backend tests for:

```text
Create policy
Duplicate policy detection
Update policy
Request verification
Duplicate verification prevention
Verification status transition
Successful API result
Partial result
Expired policy
Not eligible
Not found
Ambiguous result
Failed integration
Retry
Manual verification
Evidence upload
Authorization access
Billing integration
```

---

# 76. Robot Framework Tests

Create:

```text
Verify Active Policy
Verify Expired Policy
Verify Not Eligible Policy
Verify Policy Not Found
Handle Ambiguous Match
Handle Portal Timeout
Handle Login Failure
Capture Evidence
Return Verification Result
Retry Technical Failure
```

Each test should verify both:

```text
RPA output
```

and:

```text
Hospital backend state
```

---

# 77. Frontend Tests

Test:

```text
Insurance list
Add policy
Edit policy
Request verification
Verification status polling
Verification details
Evidence display
Manual review
Exception workflow
Permission restrictions
Patient portal
Billing integration
```

---

# 78. API Security Tests

Verify that:

```text
Patient A cannot access Patient B's insurance.

Receptionist cannot modify system integration credentials.

Billing staff cannot configure insurer adapters.

Unauthorized users cannot view evidence.

Unauthorized users cannot resolve exceptions.

Patient cannot mark policy as verified.
```

---

# 79. Implementation Order

Implement in this order:

```text
1. InsurancePolicy model
2. InsuranceVerification model
3. VerificationAttempt model
4. InsuranceDocument model
5. Validation schemas
6. Policy service
7. Verification service
8. Provider adapter interface
9. API adapter framework
10. RPA job integration
11. Exception handling
12. Audit logging
13. Notification integration
14. Backend APIs
15. Finance & Insurance UI
16. Patient Insurance UI
17. Billing integration
18. Admission integration
19. Discharge integration
20. Robot Framework portal automation
21. Seed data
22. Automated tests
23. Security testing
24. End-to-end testing
```

---

# 80. AI Coding Agent Instructions

You are implementing this module inside an existing MERN hospital administration platform.

Follow these rules strictly:

1. Do not create a separate application.
2. Integrate with the existing authentication system.
3. Reuse the existing RBAC system.
4. Reuse the existing Patient model.
5. Reuse the existing User model.
6. Reuse the existing Notification Service.
7. Reuse the existing Document Service.
8. Reuse the existing Audit Service.
9. Reuse the existing RPAJob/RPAExecution architecture.
10. Reuse the existing ExceptionCase architecture.
11. Do not duplicate patient records.
12. Do not create a separate insurance-only patient database.
13. Do not store insurer credentials in MongoDB.
14. Do not store secrets in source code.
15. Do not hard-code insurer portal passwords.
16. Do not invent insurance coverage.
17. Do not convert verification into claim approval.
18. Do not implement clinical decision-making.
19. Do not automatically resolve ambiguous insurer matches.
20. Do not overwrite verification history.
21. Preserve immutable audit history.
22. Use transactions where multiple related records must update atomically.
23. Make verification requests idempotent.
24. Prevent duplicate concurrent verification jobs.
25. Use configurable insurer integrations.
26. Keep provider-specific API logic isolated.
27. Keep provider-specific RPA selectors isolated.
28. Validate all RPA output before database updates.
29. Capture evidence according to configured rules.
30. Never expose sensitive credentials in logs.
31. Implement proper loading, empty, error and success states in the UI.
32. Do not use mock-only functionality in the final implementation.
33. Seed realistic test data.
34. Write automated tests.
35. Verify every API with RBAC.
36. Verify patient data isolation.
37. Verify billing integration.
38. Verify admission/discharge integration.
39. Ensure the system remains functional if an insurer API is unavailable.
40. Route unresolved cases to human review instead of guessing.

---

# 81. Definition of Done

This module is considered complete only when a real end-to-end flow can execute:

```text
Patient
   ↓
Insurance Details
   ↓
Insurance Policy
   ↓
Verification Request
   ↓
API / Robot Framework
   ↓
Insurer
   ↓
Verification Result
   ↓
Evidence
   ↓
MongoDB
   ↓
Audit
   ↓
Notification
   ↓
Billing
   ↓
Admission / Discharge
```

and the system correctly handles:

```text
ACTIVE
EXPIRED
NOT_ELIGIBLE
NOT_FOUND
PARTIALLY_VERIFIED
AMBIGUOUS
FAILED
MANUAL_REVIEW
```

without inventing any insurance information.

The final implementation must provide a production-style Insurance Verification workflow with:

```text
MERN
+
MongoDB
+
RBAC
+
REST APIs
+
Insurance Provider Adapters
+
Robot Framework RPA
+
Exception Handling
+
Evidence Management
+
Notifications
+
Audit Logging
+
Billing Integration
+
Admission/Discharge Integration
+
Automated Testing
```

The module must remain strictly an **insurance verification system**, not a claim approval engine and not a clinical decision system.