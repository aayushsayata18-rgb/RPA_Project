# 06_DISCHARGE_PROCESSING.md

# Hospital Administrative RPA Platform
## Module 06 — Discharge Processing

---

# 1. PURPOSE

Build a complete **Discharge Processing module** for the Hospital Administrative RPA Platform.

The module must coordinate the administrative workflow that occurs after an authorized clinical decision has been made that a patient can be discharged.

The module is responsible for:

- Receiving an authorized discharge request
- Validating patient/admission identity
- Checking administrative prerequisites
- Checking pending services
- Checking outstanding charges
- Coordinating billing
- Coordinating insurance information
- Coordinating deposits/advances
- Generating final administrative documents
- Coordinating payment/settlement
- Sending discharge notifications
- Releasing the physical bed through Bed Management
- Triggering housekeeping
- Recording discharge history
- Handling incomplete/exception cases
- Providing RPA automation
- Maintaining complete auditability

The module must NOT make the clinical decision that the patient is medically fit for discharge.

---

# 2. TECHNOLOGY

Use the existing project architecture:

```text
Frontend:
React.js

Backend:
Node.js
Express.js

Database:
MongoDB
Mongoose

Authentication:
JWT

Authorization:
RBAC

Automation:
Robot Framework

Communication:
Central Notification Service

Documents:
Central Document Generation Service

Payments:
Secure Payment Gateway

Audit:
Central Audit Service

Exceptions:
Central Exception Management

RPA:
Central RPA Job Management
```

Do not create duplicate infrastructure if the project already contains shared services.

---

# 3. CRITICAL RESPONSIBILITY BOUNDARY

The discharge workflow has two fundamentally different parts.

## Clinical Decision

Performed by:

- Doctor
- Authorized clinical staff

Example:

```text
Patient is clinically fit for discharge.
```

The system receives this as an authorized decision.

---

## Administrative Discharge Processing

Performed by:

- Hospital system
- Authorized administrative staff
- RPA

Examples:

```text
Check pending services
Check billing
Calculate final bill
Verify payment
Process insurance information
Generate documents
Release bed
Trigger housekeeping
Notify patient
```

---

# 4. NON-NEGOTIABLE RULE

RPA must NEVER independently decide:

- Medical fitness for discharge
- Clinical diagnosis
- Treatment completion
- Medication suitability
- Whether the patient should remain admitted
- Whether a medical procedure is required
- Whether a clinical result is acceptable

RPA may only execute administrative workflow after an authorized discharge decision/request exists.

---

# 5. DISCHARGE TERMINOLOGY

Keep these entities separate.

```text
Patient ID
    ↓
Visit ID
    ↓
Admission ID
    ↓
Discharge ID
    ↓
Invoice ID
    ↓
Payment Transaction ID
```

Example:

```text
Patient ID:
P10045

Visit ID:
VIS20261006001

Admission ID:
ADM10023

Discharge ID:
DIS20261006015

Invoice ID:
INV20261006122

Payment Transaction ID:
PAY20261006391
```

---

# 6. DISCHARGE SOURCES

Support:

1. Planned Discharge
2. Emergency/Administrative Discharge workflow where applicable
3. Transfer-out workflow where hospital policy treats transfer as a discharge episode
4. Authorized discharge cancellation before completion

Do not invent additional clinical discharge types.

---

# 7. DISCHARGE REQUEST

Create:

```text
DischargeRequest
```

Suggested structure:

```javascript
{
    patientId: ObjectId,

    visitId: ObjectId,

    admissionId: ObjectId,

    requestedByUserId: ObjectId,

    requestedByRole: String,

    requestType: String,

    clinicalDecisionReference: ObjectId,

    status: String,

    requestedAt: Date,

    effectiveDischargeDate: Date,

    notes: String,

    correlationId: String,

    createdAt: Date,

    updatedAt: Date
}
```

---

# 8. DISCHARGE RECORD

Create:

```text
Discharge
```

Suggested schema:

```javascript
{
    dischargeNumber: String,

    patientId: ObjectId,

    visitId: ObjectId,

    admissionId: ObjectId,

    dischargeRequestId: ObjectId,

    dischargeType: String,

    status: String,

    requestedAt: Date,

    approvedAt: Date,

    processingStartedAt: Date,

    completedAt: Date,

    cancelledAt: Date,

    cancellationReason: String,

    dischargeDate: Date,

    actualDepartureAt: Date,

    finalInvoiceId: ObjectId,

    paymentStatus: String,

    insuranceStatus: String,

    bedReleaseStatus: String,

    pendingItems: [],

    exceptionCount: Number,

    correlationId: String,

    createdAt: Date,

    updatedAt: Date
}
```

---

# 9. DISCHARGE STATUS

Use controlled states.

```text
DRAFT
REQUESTED
VALIDATING
PENDING_ADMIN_REVIEW
PENDING_SERVICES
PENDING_BILLING
PENDING_INSURANCE
PENDING_PAYMENT
READY_FOR_DISCHARGE
PROCESSING
COMPLETED
CANCELLED
EXCEPTION
```

Do not use arbitrary free-text statuses.

---

# 10. STATUS FLOW

Typical flow:

```text
REQUESTED
    ↓
VALIDATING
    ↓
PENDING_SERVICES
    ↓
PENDING_BILLING
    ↓
PENDING_INSURANCE
    ↓
PENDING_PAYMENT
    ↓
READY_FOR_DISCHARGE
    ↓
PROCESSING
    ↓
COMPLETED
```

Some stages may be skipped when not applicable.

Example:

```text
No insurance
```

does not require:

```text
PENDING_INSURANCE
```

---

# 11. DISCHARGE CANCELLATION

A discharge may be cancelled before completion if authorized.

Example:

```text
REQUESTED
→ CANCELLED
```

or:

```text
PENDING_BILLING
→ CANCELLED
```

The cancellation must record:

- User
- Role
- Reason
- Timestamp
- Correlation ID

Do not allow arbitrary cancellation after the discharge has been irreversibly completed without a separate authorized correction process.

---

# 12. DISCHARGE CHECKLIST

Create:

```text
DischargeChecklist
```

Suggested structure:

```javascript
{
    dischargeId: ObjectId,

    clinicalDecisionRecorded: Boolean,

    patientIdentityVerified: Boolean,

    admissionVerified: Boolean,

    pendingLabChecked: Boolean,

    pendingRadiologyChecked: Boolean,

    pendingPharmacyChecked: Boolean,

    otherServicesChecked: Boolean,

    chargesReconciled: Boolean,

    finalInvoiceGenerated: Boolean,

    insuranceChecked: Boolean,

    paymentSettled: Boolean,

    documentsGenerated: Boolean,

    patientNotified: Boolean,

    bedReleaseRequested: Boolean,

    housekeepingTriggered: Boolean,

    completed: Boolean,

    completedAt: Date
}
```

Clinical content must come from authorized clinical staff.

---

# 13. CORE WORKFLOW

The complete administrative workflow is:

```text
Authorized Clinical Discharge Decision
                ↓
        Create Discharge Request
                ↓
          Validate Patient
                ↓
         Validate Admission
                ↓
      Check Pending Services
                ↓
        Reconcile Charges
                ↓
       Verify Insurance State
                ↓
        Generate Final Bill
                ↓
       Payment / Settlement
                ↓
      Generate Documents
                ↓
       Notify Patient
                ↓
       Release Physical Bed
                ↓
      Trigger Housekeeping
                ↓
       Complete Discharge
```

---

# 14. STEP 1 — CLINICAL DISCHARGE DECISION

An authorized clinical user creates the discharge request.

Example:

```text
Doctor:
Dr. Patel

Patient:
Rahul Shah

Patient ID:
P10045

Admission:
ADM10023
```

Doctor submits:

```text
Discharge requested
```

The system records the clinical decision reference.

The actual clinical discharge summary/content remains owned by the clinical workflow.

---

# 15. STEP 2 — PATIENT VALIDATION

The system must verify:

```text
Patient exists
Admission exists
Admission belongs to patient
Admission is active
Discharge request references correct admission
```

If any mismatch occurs:

```text
DISCHARGE_IDENTITY_MISMATCH
```

Create an exception.

Do not continue automatically.

---

# 16. STEP 3 — ACTIVE ADMISSION VALIDATION

The system must verify:

```text
Admission.status = ACTIVE
```

or the appropriate configured active state.

If the admission has already been discharged:

```text
DISCHARGE_ALREADY_COMPLETED
```

must be returned.

Do not create duplicate discharge records.

---

# 17. STEP 4 — DUPLICATE DISCHARGE PREVENTION

Only one active discharge workflow may exist for a given admission.

Prevent:

```text
ADM10023
→ DIS10001
→ DIS10002
```

where both are active.

Use:

- database constraints
- transaction logic
- unique/partial indexes
- idempotency

---

# 18. STEP 5 — PENDING SERVICE CHECK

The system must query configured service modules.

Check:

```text
Laboratory
Radiology
Pharmacy
Other hospital services
```

The goal is administrative completeness.

Example:

```text
Lab:
1 pending result/charge

Radiology:
0 pending

Pharmacy:
0 pending

Other:
0 pending
```

The system should show:

```text
Pending items: 1
```

---

# 19. IMPORTANT CLINICAL BOUNDARY

The discharge module must NOT interpret whether a pending clinical result means the patient cannot be discharged.

For example:

```text
Lab result pending
```

must not automatically mean:

```text
Discharge medically prohibited
```

Instead:

```text
Pending clinical item
→ Flag
→ Authorized staff review according to hospital policy
```

RPA does not make that decision.

---

# 20. PENDING LAB WORKFLOW

If Lab reports:

```text
LAB_ORDER_123
Status:
PENDING
```

Discharge should show:

```text
Pending Laboratory Item
```

Possible configured outcomes:

```text
Resolved
Approved for discharge according to authorized workflow
Exception
```

The system must not invent the hospital's clinical discharge policy.

---

# 21. PENDING RADIOLOGY

Same principle.

Example:

```text
Radiology:
RAD-10023
Status:
REPORT_PENDING
```

Display:

```text
Pending Radiology Item
```

Route to authorized staff if required.

RPA only reads status and routes information.

---

# 22. PENDING PHARMACY

Check:

```text
Pending pharmacy order
Pending dispensing
Pending pharmacy charge
```

If the pharmacy workflow is incomplete:

```text
Flag administrative item
```

Do not decide whether medication should be continued/stopped.

---

# 23. OTHER SERVICES

Support configurable services:

```text
Consultation
Procedure
Room service
Equipment
Other billable services
```

The system should use the central service/charge interfaces rather than hardcoding every future department.

---

# 24. CHARGE RECONCILIATION

Retrieve charges from configured modules.

Potential sources:

```text
Room / Accommodation
Consultation
Laboratory
Pharmacy
Radiology
Other Services
```

Example:

```text
Room:          ₹5,000
Consultation:  ₹1,000
Laboratory:    ₹2,000
Pharmacy:      ₹3,500
Radiology:     ₹2,500
--------------------------------
Gross Total:  ₹14,000
```

Numbers are illustrative.

Do not hardcode these prices.

---

# 25. ROOM CHARGES

Retrieve actual bed/accommodation history from Bed Management.

Example:

```text
Oct 01–Oct 03:
General Ward

Oct 03–Oct 05:
Semi-Private

Oct 05–Oct 08:
Private
```

Billing calculates the actual room/accommodation charges according to configured rates.

Discharge must not independently calculate room pricing.

---

# 26. BILLING OWNERSHIP

Billing owns:

- invoice calculation
- discounts
- taxes
- insurance adjustments
- deposits
- payment records
- financial adjustments

Discharge only orchestrates the process.

---

# 27. DEPOSIT / ADVANCE

Retrieve applicable:

```text
Deposit
Advance
Prepayment
```

Example:

```text
Gross Bill:
₹14,000

Deposit:
₹5,000

Insurance/other coverage:
₹3,000

Patient Payable:
₹6,000
```

Illustrative only.

The Billing module calculates the actual amount.

---

# 28. INSURANCE STATUS

If insurance is active:

Retrieve:

```text
Policy
Verification result
Claim/preauthorization state
Approved amount where applicable
Pending query
```

Do not treat insurance verification as final claim settlement.

---

# 29. INSURANCE PENDING

If insurance processing is incomplete:

```text
Insurance:
UNDER_REVIEW
```

Discharge should show:

```text
Insurance processing pending
```

The system must follow the hospital's configured discharge/financial policy.

It must not invent whether the patient can leave.

---

# 30. FINAL INVOICE

Once the required charge information is available, request Billing to generate the final invoice.

Example:

```http
POST /api/billing/invoices/finalize
```

with:

```json
{
    "patientId": "P10045",
    "admissionId": "ADM10023",
    "dischargeId": "DIS10023"
}
```

Billing returns:

```json
{
    "invoiceId": "INV10045",
    "grossTotal": 14000,
    "coveredAmount": 3000,
    "depositAmount": 5000,
    "payableAmount": 6000
}
```

Values are illustrative.

---

# 31. FINAL BILL DISPLAY

Patient must receive a clear itemized bill.

Example:

```text
Final Hospital Bill

Room Charges          ₹5,000
Consultation          ₹1,000
Laboratory            ₹2,000
Pharmacy              ₹3,500
Radiology             ₹2,500
--------------------------------
Gross Total          ₹14,000

Insurance            ₹3,000
Deposit               ₹5,000
--------------------------------
Payable               ₹6,000
```

The UI must retrieve actual values from Billing.

---

# 32. DIGITAL PAYMENT

After final invoice generation, provide:

```text
Pay Now
```

and:

```text
Pay at Hospital Counter
```

---

# 33. PAYMENT GATEWAY

Use a secure external payment gateway integration.

Supported methods depend on hospital configuration, for example:

```text
UPI
Card
Net Banking
Other gateway-supported methods
```

The exact payment gateway must be configurable.

Do not store raw:

- card number
- CVV
- banking password
- UPI PIN

in the hospital database.

---

# 34. PAYMENT FLOW

```text
Final Invoice
      ↓
Generate Secure Payment Session
      ↓
Patient Opens Payment Page
      ↓
Gateway Processes Payment
      ↓
Gateway Callback/Webhook
      ↓
Verify Transaction
      ↓
Update Payment
      ↓
Update Invoice
      ↓
Generate Receipt
      ↓
Notify Patient
```

---

# 35. PAYMENT SUCCESS

On successful verified payment:

```text
Payment:
SUCCESS

Invoice:
PAID

Balance:
0
```

Store:

```text
Payment Transaction ID
```

Example:

```text
PAY20261006091
```

---

# 36. PAYMENT FAILURE

If payment fails:

```text
Payment:
FAILED
```

The invoice must remain unpaid/outstanding.

Notify patient:

```text
Payment could not be completed.
Please try again or pay at the hospital counter.
```

Do not mark the invoice paid based on frontend redirect alone.

Payment status must be verified with the gateway.

---

# 37. PAYMENT CALLBACK SECURITY

Gateway callbacks/webhooks must:

- validate signature
- verify transaction
- prevent duplicate processing
- use idempotency
- record callback timestamp
- store gateway reference
- log failures

Never trust an unverified payment-success request from the browser.

---

# 38. COUNTER PAYMENT

If patient chooses:

```text
Pay at Hospital Counter
```

billing staff records the payment.

The system then:

```text
Payment Recorded
→ Invoice Updated
→ Receipt Generated
→ Patient Notified
```

Physical counter payment remains supported even when digital payment is available.

---

# 39. PAYMENT REMINDERS

If configured:

```text
Invoice Outstanding
```

may trigger reminders after a defined interval.

Example:

```text
Invoice outstanding
→ Reminder after configured interval
```

Do not hardcode a reminder interval.

Use the Notification Service.

---

# 40. BILLING QUERY / DISPUTE

Patient may raise:

```text
Billing Query
```

Examples:

```text
Unexpected charge
Incorrect room charge
Missing deposit
Service charge question
```

Create/use a billing query mechanism.

Discharge must route the query to Billing.

It must NOT approve:

- discounts
- waivers
- refunds
- financial adjustments

unless authorized Billing workflow does so.

---

# 41. DISCHARGE DOCUMENTS

The module must coordinate generation of applicable documents.

Potential documents:

```text
Final Invoice
Payment Receipt
Discharge Administrative Form
Admission Summary / Administrative Summary
Approved Clinical Discharge Summary
Insurance Documents
Other configured discharge documents
```

---

# 42. CLINICAL DISCHARGE SUMMARY

The clinical discharge summary must come from authorized clinical staff.

RPA may:

- retrieve
- merge approved metadata
- generate PDF
- distribute
- store
- notify

RPA must NOT write clinical conclusions.

---

# 43. DOCUMENT GENERATION

Use the centralized Document Generation Service.

Example:

```http
POST /api/documents/generate
```

Request:

```json
{
    "templateCode": "DISCHARGE_SUMMARY",
    "referenceType": "DISCHARGE",
    "referenceId": "DIS10023"
}
```

---

# 44. DOCUMENT VERSIONING

Generated documents must store:

```text
Document ID
Template ID
Template Version
Reference ID
Generated By
Generated At
File Location
Checksum where applicable
Access Rules
```

Do not silently overwrite signed/approved documents.

---

# 45. DOCUMENT ACCESS

Patient can access authorized documents through the patient portal.

Authorized staff can access according to RBAC.

Clinical documents must have stricter access than general administrative documents.

---

# 46. PATIENT PORTAL FINAL BILL

Patient should see:

```text
Discharge
├── Final Bill
├── Payment Status
├── Payment Receipt
├── Discharge Documents
└── Available Approved Reports/Documents
```

---

# 47. MOBILE-FRIENDLY BILL

The final bill page must work well on mobile.

Display:

```text
Total Amount
Insurance/Adjustment
Deposit
Payable
Payment Status
Pay Now
Pay at Hospital Counter
Download Invoice
Download Receipt
```

Avoid unnecessarily complex UI.

---

# 48. DISCHARGE NOTIFICATION

After final discharge readiness, send configured notifications through the central Notification Service.

Possible channels:

```text
SMS
Email
Portal notification
```

---

# 49. DISCHARGE NOTIFICATION CONTENT

Example:

```text
Your hospital discharge process has been completed.
Your final bill and discharge documents are available in the hospital portal.
```

Do not expose sensitive information unnecessarily through SMS.

---

# 50. BED RELEASE

After the discharge is administratively completed according to configured hospital policy:

```text
Bed Management
```

must receive the release request.

Example:

```http
POST /api/beds/release
```

Reference:

```text
admissionId
dischargeId
bedAssignmentId
```

---

# 51. BED STATE AFTER DISCHARGE

The physical bed must NOT simply become:

```text
AVAILABLE
```

if cleaning is required.

Correct:

```text
OCCUPIED
   ↓
CLEANING_REQUIRED
```

Bed Management owns this state transition.

---

# 52. HOUSEKEEPING

Bed Management/Housekeeping integration creates:

```text
BED_CLEANING
```

task.

Example:

```text
Bed:
BED-P-03

Room:
P-03

Ward:
Private Wing

Reason:
Patient Discharged
```

---

# 53. HOUSEKEEPING COMPLETION

Housekeeping marks:

```text
Cleaning Completed
```

Bed Management verifies the bed is still eligible.

Then:

```text
CLEANING_REQUIRED
→ AVAILABLE
```

---

# 54. BED RELEASE FAILURE

If Bed Management cannot release the bed:

```text
BED_RELEASE_FAILED
```

Create an exception.

Discharge completion must not falsely report that the bed was released.

---

# 55. DISCHARGE COMPLETION

The discharge may be marked:

```text
COMPLETED
```

only when all mandatory administrative steps configured by the hospital are satisfied.

Potential requirements:

```text
Patient verified
Admission verified
Final billing completed
Required payment/settlement handled
Required insurance state handled
Required documents generated
Patient notified
Bed release initiated/completed as required
```

The exact mandatory checklist must be configurable.

---

# 56. DISCHARGE CHECKLIST UI

Create a visual checklist.

Example:

```text
Discharge Checklist

✓ Clinical discharge request received
✓ Patient verified
✓ Admission verified
✓ Pending services checked
✓ Charges reconciled
✓ Final invoice generated
✓ Insurance checked
✓ Payment settled
✓ Documents generated
✓ Patient notified
✓ Bed release requested
✓ Housekeeping triggered
```

Do not display a clinical decision as completed unless it actually came from the authorized clinical workflow.

---

# 57. DISCHARGE SCREEN

Create:

```text
/discharges
/discharges/:id
/discharges/:id/billing
/discharges/:id/documents
/discharges/:id/checklist
/discharges/:id/exceptions
```

---

# 58. DISCHARGE DASHBOARD

Display:

```text
Discharges Today
Pending Discharges
Pending Billing
Pending Payment
Pending Insurance
Pending Services
Exceptions
Completed
Cancelled
```

Filters:

```text
Date
Ward
Doctor
Status
Insurance
Payment Status
```

---

# 59. DISCHARGE DETAILS PAGE

Display:

```text
Patient Information
Admission Information
Discharge Request
Discharge Status
Pending Services
Billing Summary
Insurance Status
Payment Status
Documents
Bed Assignment
Housekeeping Status
Notifications
Exceptions
Audit History
```

---

# 60. DISCHARGE BILLING PAGE

Display:

```text
Invoice ID
Gross Total
Insurance
Deposit
Discount if authorized
Payable Amount
Payment Status
Payment Attempts
Transaction ID
Receipt
```

Do not allow unauthorized staff to modify financial values.

---

# 61. DISCHARGE DOCUMENT PAGE

Display:

```text
Document Name
Document Type
Version
Generated Date
Status
Access
Download
```

---

# 62. DISCHARGE EXCEPTION PAGE

Display:

```text
Exception ID
Type
Severity
Description
Current Status
Assigned User
Created At
Resolution
```

Actions according to permission:

```text
Assign
Review
Resolve
Request Information
Retry RPA
```

---

# 63. REST API DESIGN

Use:

```text
/api/discharges
/api/discharge-requests
/api/discharge-checklists
```

---

# 64. DISCHARGE REQUEST APIs

Create:

```http
POST /api/discharge-requests
```

Get:

```http
GET /api/discharge-requests/:id
```

Cancel:

```http
POST /api/discharge-requests/:id/cancel
```

---

# 65. DISCHARGE APIs

```http
GET /api/discharges
GET /api/discharges/:id
POST /api/discharges
PATCH /api/discharges/:id
POST /api/discharges/:id/process
POST /api/discharges/:id/complete
```

Use RBAC.

---

# 66. PENDING ITEMS API

```http
GET /api/discharges/:id/pending-items
```

Return:

```json
{
    "laboratory": [],
    "radiology": [],
    "pharmacy": [],
    "otherServices": []
}
```

---

# 67. BILLING INTEGRATION API

Example:

```http
GET /api/billing/admissions/:admissionId/charges
```

and:

```http
POST /api/billing/invoices/finalize
```

Discharge should call Billing through a service/client layer.

Do not directly manipulate Billing database collections from the Discharge module.

---

# 68. INSURANCE INTEGRATION

Retrieve insurance state through the Insurance module.

Example:

```http
GET /api/insurance/patients/:patientId/status
```

Do not duplicate policy or claim logic.

---

# 69. BED INTEGRATION

Retrieve current assignment:

```http
GET /api/beds/admissions/:admissionId/current
```

Release:

```http
POST /api/beds/release
```

The Bed Management module remains authoritative for physical bed state.

---

# 70. NOTIFICATION INTEGRATION

Use:

```http
POST /api/notifications
```

or the existing centralized event mechanism.

Events:

```text
DISCHARGE_REQUESTED
DISCHARGE_READY
DISCHARGE_COMPLETED
PAYMENT_SUCCESS
PAYMENT_FAILED
DISCHARGE_EXCEPTION
```

---

# 71. DOCUMENT INTEGRATION

Use:

```http
POST /api/documents/generate
```

for approved templates.

---

# 72. RPA ROLE

Robot Framework automates repetitive administrative actions.

It must follow:

```text
Input
→ Read
→ Validate
→ Apply configured rules
→ Act
→ Verify
→ Update
→ Notify
→ Log
```

---

# 73. DISCHARGE RPA WORKFLOW

Example:

```text
Authorized Discharge Request
        ↓
RPA Job Created
        ↓
Read Patient/Admission
        ↓
Validate
        ↓
Read Pending Services
        ↓
Read Billing State
        ↓
Read Insurance State
        ↓
Generate/Finalize Administrative Workflow
        ↓
Verify
        ↓
Trigger Payment/Notification/Documents
        ↓
Release Bed
        ↓
Verify
        ↓
Update Discharge
```

---

# 74. LEGACY HOSPITAL SYSTEM

If a legacy system exists:

```text
MERN Discharge
      ↓
RPA
      ↓
Legacy Hospital System
```

Robot may:

- log in
- locate patient
- locate admission
- retrieve charges
- read discharge state
- enter approved administrative data
- generate/retrieve documents
- verify updates
- capture evidence

---

# 75. RPA MUST NOT INVENT VALUES

For example, if the legacy system asks for:

```text
Discharge Date
```

RPA uses the approved value from the hospital application.

It must not invent a date.

Similarly:

```text
Invoice amount
Insurance coverage
Discount
Clinical conclusion
```

must come from authoritative systems.

---

# 76. RPA DISCHARGE JOB MODEL

Use centralized:

```text
RPAJob
```

Example:

```javascript
{
    jobType: "DISCHARGE_PROCESSING",

    module: "DISCHARGE",

    referenceType: "DISCHARGE",

    referenceId: ObjectId,

    correlationId: String,

    status: String,

    attempts: Number,

    startedAt: Date,

    completedAt: Date,

    errorCode: String,

    errorMessage: String,

    evidenceLocation: String,

    createdAt: Date,
    updatedAt: Date
}
```

---

# 77. ROBOT FRAMEWORK STRUCTURE

Extend:

```text
robot/
├── resources/
│   ├── common.resource
│   ├── api.resource
│   ├── auth.resource
│   ├── discharge.resource
│   ├── billing.resource
│   ├── insurance.resource
│   ├── bed.resource
│   ├── notification.resource
│   └── document.resource
│
├── keywords/
│   ├── discharge_keywords.resource
│   ├── billing_keywords.resource
│   ├── payment_keywords.resource
│   ├── document_keywords.resource
│   ├── bed_release_keywords.resource
│   └── exception_keywords.resource
│
├── tests/
│   ├── discharge_request.robot
│   ├── pending_services.robot
│   ├── billing_reconciliation.robot
│   ├── payment.robot
│   ├── document_generation.robot
│   ├── bed_release.robot
│   └── discharge_end_to_end.robot
│
└── results/
```

---

# 78. ROBOT KEYWORDS

Create reusable keywords:

```text
Create Discharge Request
Validate Patient Admission
Check Pending Laboratory Items
Check Pending Radiology Items
Check Pending Pharmacy Items
Retrieve Admission Charges
Request Final Invoice
Verify Invoice
Create Payment Session
Verify Payment
Generate Discharge Documents
Send Discharge Notification
Release Bed
Verify Bed Release
Create Discharge Exception
Capture Evidence
Update RPA Job
```

---

# 79. RPA EXCEPTIONS

Support:

```text
PATIENT_NOT_FOUND
ADMISSION_NOT_FOUND
DISCHARGE_ALREADY_EXISTS
PENDING_SERVICE
BILLING_MISMATCH
INVOICE_GENERATION_FAILED
INSURANCE_PENDING
PAYMENT_FAILED
PAYMENT_VERIFICATION_FAILED
DOCUMENT_GENERATION_FAILED
BED_RELEASE_FAILED
LEGACY_SYSTEM_UNAVAILABLE
LEGACY_LOGIN_FAILED
LEGACY_DATA_MISMATCH
NOTIFICATION_FAILED
```

---

# 80. PAYMENT RPA BOUNDARY

If payment is performed through a secure gateway:

RPA must NOT:

- capture card data
- read CVV
- bypass payment security
- mark payment successful manually

RPA can:

```text
Check payment status
Read verified gateway result
Update workflow
Trigger receipt
Notify patient
```

---

# 81. HUMAN-IN-THE-LOOP

If the system encounters:

```text
Ambiguous insurance
Pending clinical item
Billing dispute
Payment discrepancy
Missing service charge
Unknown bed state
Legacy mismatch
```

route to human review.

Flow:

```text
Exception
   ↓
Human Review
   ↓
Approved Decision
   ↓
RPA Continues
```

---

# 82. AUDIT EVENTS

Record:

```text
DISCHARGE_REQUEST_CREATED
DISCHARGE_VALIDATED
DISCHARGE_PROCESSING_STARTED
PENDING_ITEM_DETECTED
BILLING_RECONCILED
FINAL_INVOICE_GENERATED
PAYMENT_INITIATED
PAYMENT_VERIFIED
PAYMENT_FAILED
DOCUMENT_GENERATED
PATIENT_NOTIFIED
BED_RELEASE_REQUESTED
BED_RELEASED
HOUSEKEEPING_TRIGGERED
DISCHARGE_COMPLETED
DISCHARGE_CANCELLED
DISCHARGE_EXCEPTION_CREATED
```

---

# 83. AUDIT DATA

Every event should contain:

```text
User
Role
Timestamp
Action
Reference
Previous State
New State
Source
Correlation ID
IP/device metadata where permitted
```

---

# 84. SECURITY

Implement:

- JWT authentication
- RBAC
- backend authorization
- input validation
- audit logging
- secure payment integration
- document access control
- sensitive-data protection
- secure secret management
- rate limiting where appropriate
- session security

---

# 85. PATIENT DATA PROTECTION

Do not expose unnecessary data in:

- SMS
- email subject
- notification previews
- logs
- RPA screenshots
- browser automation evidence

Sensitive information should be masked wherever practical.

---

# 86. RPA SCREENSHOT POLICY

When RPA captures evidence:

- store securely
- restrict access
- associate with RPA Job
- avoid unnecessary patient information
- retain according to configurable retention policy

---

# 87. IDEMPOTENCY

Discharge operations must be idempotent.

Example:

```text
POST /api/discharges/:id/process
```

If the same operation is retried:

```text
DO NOT generate:
2 invoices
2 bed releases
2 discharge records
2 payment records
2 notification events
```

Use:

```text
Idempotency-Key
Correlation ID
Existing state checks
```

---

# 88. CONCURRENCY

Protect against:

```text
Doctor creates discharge
Receptionist processes discharge
RPA processes discharge
Billing finalizes invoice
```

simultaneously.

The backend must verify current state before every important transition.

---

# 89. TRANSACTIONAL CONSISTENCY

Where possible use MongoDB transactions for critical multi-document operations.

For example:

```text
Complete discharge
+
Update discharge
+
Update admission
+
Create bed-release request
```

Do not leave partially updated state without an exception/recovery mechanism.

---

# 90. ERROR HANDLING

Use standardized response format:

```json
{
    "success": false,
    "error": {
        "code": "DISCHARGE_BILLING_PENDING",
        "message": "Final billing cannot be completed because required charge information is pending.",
        "correlationId": "CORR-20261006-00125"
    }
}
```

---

# 91. HTTP STATUS CODES

Use:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

---

# 92. NOTIFICATION FAILURE

A failed notification must NOT automatically fail the entire discharge workflow.

Example:

```text
Discharge:
COMPLETED

Email:
FAILED

SMS:
SENT
```

Create a notification failure record.

Retry according to Notification Service policy.

---

# 93. DOCUMENT FAILURE

If a mandatory document fails to generate:

```text
Discharge:
EXCEPTION
```

Create:

```text
DOCUMENT_GENERATION_FAILED
```

Do not falsely report document availability.

---

# 94. PAYMENT FAILURE

If payment fails:

```text
Payment:
FAILED

Invoice:
OUTSTANDING
```

The system follows configured hospital policy.

Do not invent whether the patient can physically leave.

---

# 95. INSURANCE FAILURE

If insurance portal/API is unavailable:

```text
INSURANCE_VERIFICATION_UNAVAILABLE
```

or:

```text
INSURANCE_STATUS_UNKNOWN
```

Create an exception.

Do not assume:

```text
Approved
```

or:

```text
Rejected
```

---

# 96. FINAL DISCHARGE PAGE

The patient should see:

```text
Discharge Completed

Patient:
Rahul Shah

Admission:
ADM10023

Discharge:
DIS10023

Payment:
PAID

Final Amount:
₹6,000

Documents:
✓ Final Invoice
✓ Payment Receipt
✓ Discharge Summary
```

Illustrative only.

---

# 97. PATIENT PORTAL ACTIONS

Depending on hospital policy:

```text
View Final Bill
Pay Bill
Download Invoice
Download Receipt
Download Approved Documents
View Discharge Status
View Payment Status
Raise Billing Query
```

---

# 98. ADMINISTRATIVE STAFF VIEW

Staff should see:

```text
Discharge Queue

Patient
Admission
Doctor
Ward
Bed
Discharge Status
Billing Status
Insurance Status
Payment Status
Exception
```

---

# 99. FILTERS

Support:

```text
Date
Ward
Doctor
Discharge Status
Payment Status
Insurance Status
Exception
```

---

# 100. MANAGEMENT REPORTS

Provide:

```text
Discharges by Day
Discharges by Ward
Average Administrative Discharge Processing Time
Pending Discharges
Billing Pending
Payment Pending
Insurance Pending
Exception Rate
Bed Release Delay
Housekeeping Delay
```

---

# 101. DISCHARGE PROCESSING TIME

Track timestamps:

```text
Discharge Requested
Processing Started
Billing Ready
Payment Completed
Documents Generated
Bed Released
Discharge Completed
```

This allows management to identify bottlenecks.

---

# 102. BOT PERFORMANCE

Track:

```text
RPA Jobs
Success Rate
Failure Rate
Average Execution Time
Retry Count
Exception Count
Legacy System Downtime
```

---

# 103. SEED DATA

Create demo data.

Patient:

```text
Rahul Shah
P10045
```

Admission:

```text
ADM10023
```

Bed:

```text
BED-P-03
```

Example services:

```text
Room: ₹5,000
Consultation: ₹1,000
Lab: ₹2,000
Pharmacy: ₹3,500
Radiology: ₹2,500
```

Example:

```text
Gross:
₹14,000

Insurance:
₹3,000

Deposit:
₹5,000

Payable:
₹6,000
```

These are demo values only.

---

# 104. END-TO-END DEMO

The implementation must support:

```text
1. Doctor submits authorized discharge request
       ↓
2. Discharge record created
       ↓
3. Patient/admission validated
       ↓
4. Pending services checked
       ↓
5. Charges retrieved
       ↓
6. Insurance state retrieved
       ↓
7. Final invoice generated
       ↓
8. Patient sees itemized bill
       ↓
9. Patient pays online
       ↓
10. Gateway confirms payment
       ↓
11. Invoice marked PAID
       ↓
12. Receipt generated
       ↓
13. Discharge documents generated
       ↓
14. Patient notified
       ↓
15. Bed release requested
       ↓
16. Bed becomes CLEANING_REQUIRED
       ↓
17. Housekeeping task created
       ↓
18. Cleaning completed
       ↓
19. Bed becomes AVAILABLE
       ↓
20. Discharge completed
```

---

# 105. TESTING REQUIREMENTS

Implement:

```text
Unit Tests
Integration Tests
API Tests
UI Tests
Payment Tests
RPA Tests
Concurrency Tests
End-to-End Tests
```

---

# 106. UNIT TESTS

Test:

```text
Discharge state transitions
Duplicate discharge prevention
Patient/admission validation
Pending service detection
Billing integration
Payment status handling
Document generation handling
Bed release handling
Exception creation
```

---

# 107. API TESTS

Test:

```text
Create discharge request
Get discharge
Process discharge
Cancel discharge
Get pending items
Get billing summary
Get payment status
Get documents
Complete discharge
```

---

# 108. PAYMENT TESTS

Test:

```text
Payment success
Payment failure
Payment timeout
Duplicate callback
Invalid callback
Gateway unavailable
Already-paid invoice
```

---

# 109. BED RELEASE TEST

Test:

```text
Discharge completed
→ Bed release request
→ CLEANING_REQUIRED
→ Housekeeping task
→ Cleaning completed
→ AVAILABLE
```

Verify that discharge does not incorrectly mark the bed directly AVAILABLE.

---

# 110. RPA TESTS

Robot Framework must test:

```text
Read discharge request
Read patient
Read admission
Check services
Read billing
Verify payment
Generate documents
Release bed
Verify release
Capture evidence
Update RPA Job
Handle failures
Retry
```

---

# 111. SECURITY TESTS

Verify:

```text
Unauthorized user cannot discharge
Unauthorized user cannot modify invoice
Unauthorized user cannot mark payment successful
Unauthorized user cannot access sensitive documents
Unauthorized user cannot release beds
```

---

# 112. CONCURRENCY TEST

Simulate:

```text
User A → Process discharge
User B → Process discharge
RPA → Process discharge
```

Expected:

```text
One valid discharge workflow
No duplicate invoice
No duplicate payment
No duplicate bed release
No duplicate discharge completion
```

---

# 113. ACCEPTANCE CRITERIA

The module is accepted only when:

### Discharge

- [ ] Authorized discharge request can be created.
- [ ] Patient/admission validation works.
- [ ] Duplicate active discharge is prevented.
- [ ] Discharge statuses work.
- [ ] Cancellation works where permitted.

### Services

- [ ] Pending laboratory items can be detected.
- [ ] Pending radiology items can be detected.
- [ ] Pending pharmacy items can be detected.
- [ ] Other configured services can be checked.
- [ ] RPA does not interpret clinical results.

### Billing

- [ ] All configured charges can be retrieved.
- [ ] Actual accommodation history comes from Bed Management.
- [ ] Final invoice is generated by Billing.
- [ ] Itemized bill is visible.
- [ ] Billing disputes can be routed.

### Payment

- [ ] Online payment works.
- [ ] Payment gateway verification works.
- [ ] Payment failure is handled.
- [ ] Counter payment is supported.
- [ ] Receipt is generated.
- [ ] Duplicate payment callback is prevented.

### Insurance

- [ ] Insurance status can be retrieved.
- [ ] Pending insurance is visible.
- [ ] Insurance failures create exceptions.
- [ ] RPA does not invent coverage.

### Documents

- [ ] Final invoice available.
- [ ] Receipt available.
- [ ] Approved discharge documents available.
- [ ] Document access is controlled.

### Bed

- [ ] Current bed can be identified.
- [ ] Bed release is requested after discharge.
- [ ] Bed becomes CLEANING_REQUIRED where required.
- [ ] Housekeeping is triggered.
- [ ] Bed becomes AVAILABLE only after required cleaning.

### Notifications

- [ ] Patient receives discharge notification.
- [ ] Payment confirmation works.
- [ ] Payment failure notification works.
- [ ] Notification failures are tracked.

### RPA

- [ ] RPA jobs are tracked.
- [ ] Legacy synchronization works where configured.
- [ ] Failures create exceptions.
- [ ] Retry works.
- [ ] Evidence is captured securely.

### Security

- [ ] RBAC works.
- [ ] Audit logs work.
- [ ] Sensitive information is protected.
- [ ] Payment information is not improperly stored.

---

# 114. IMPLEMENTATION ORDER

The AI coding agent must implement the module in this order.

## Phase 1 — Database

Create:

```text
DischargeRequest
Discharge
DischargeChecklist
```

and any required discharge history entity.

---

## Phase 2 — Backend

Implement:

```text
DischargeService
DischargeValidationService
PendingServiceChecker
DischargeBillingService
DischargeInsuranceService
DischargePaymentService
DischargeDocumentService
DischargeBedService
DischargeNotificationService
```

Use shared services where available.

---

## Phase 3 — APIs

Implement:

```text
Discharge Request APIs
Discharge APIs
Checklist APIs
Pending Item APIs
Billing Integration
Payment Integration
Document Integration
Bed Integration
```

---

## Phase 4 — Billing Integration

Connect final charge aggregation and invoice generation.

Do not duplicate Billing logic.

---

## Phase 5 — Insurance Integration

Connect verification/status.

Do not duplicate Insurance logic.

---

## Phase 6 — Payment Integration

Implement secure gateway workflow.

---

## Phase 7 — Documents

Connect central document generation.

---

## Phase 8 — Bed Release

Connect:

```text
Discharge
→ Bed Management
→ Housekeeping
```

---

## Phase 9 — Notifications

Connect centralized Notification Service.

---

## Phase 10 — Frontend

Implement:

```text
Discharge Dashboard
Discharge Details
Checklist
Billing
Payment
Documents
Exceptions
```

---

## Phase 11 — RPA

Implement:

```text
Discharge Processing Robot
Legacy Synchronization
Payment Status Verification
Document Workflow
Bed Release Synchronization
Exception Handling
Reconciliation
```

---

## Phase 12 — Testing

Run:

```text
Unit
API
Integration
UI
Payment
Concurrency
RPA
End-to-End
Security
```

---

# 115. DO NOT IMPLEMENT

The AI coding agent MUST NOT implement:

```text
Medical diagnosis
Clinical decision making
Discharge fitness determination
Treatment decisions
Medication decisions
Clinical result interpretation
Insurance approval decisions
Insurance claim approval/rejection
Financial adjustment approval
Unauthorized discounts
Payment bypass
Manual payment success without verification
Automatic clinical priority
Automatic bed downgrade
```

---

# 116. FINAL ARCHITECTURE

The final workflow must remain:

```text
                ┌────────────────────────┐
                │ Authorized Clinical    │
                │ Discharge Decision     │
                └───────────┬────────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Discharge Processing │
                 └──────────┬───────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
     Services           Billing              Insurance
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
                            ▼
                       Payment
                            │
                            ▼
                       Documents
                            │
                            ▼
                       Notification
                            │
                            ▼
                     Bed Management
                            │
                            ▼
                       Housekeeping
                            │
                            ▼
                     Discharge Complete
```

RPA operates across repetitive administrative steps but does not replace authoritative business systems or human decision-makers.

---

# 117. DEFINITION OF DONE

`06_DISCHARGE_PROCESSING.md` is fully implemented only when:

- [ ] Authorized clinical discharge requests work.
- [ ] Patient/admission identity is validated.
- [ ] Duplicate discharge is prevented.
- [ ] Pending services are detected.
- [ ] Clinical results are never interpreted by RPA.
- [ ] Billing is reconciled.
- [ ] Final invoice is generated by Billing.
- [ ] Insurance state is checked.
- [ ] Online payment works.
- [ ] Counter payment works.
- [ ] Payment callbacks are verified.
- [ ] Payment failures are handled.
- [ ] Billing queries can be routed.
- [ ] Documents are generated.
- [ ] Approved clinical discharge documents can be distributed.
- [ ] Patient receives notifications.
- [ ] Bed release is triggered.
- [ ] Bed enters required cleaning state.
- [ ] Housekeeping task is created.
- [ ] Bed becomes available only after required cleaning.
- [ ] RPA jobs are tracked.
- [ ] RPA failures create exceptions.
- [ ] Human-in-the-loop handling works.
- [ ] Audit logs are complete.
- [ ] RBAC is enforced.
- [ ] Idempotency is implemented.
- [ ] Concurrency is protected.
- [ ] Payment security is enforced.
- [ ] End-to-end discharge scenario passes.

---

# 118. FINAL INSTRUCTION TO THE AI CODING AGENT

Build this as a **fully functional administrative discharge orchestration module**, not as a static discharge form.

The module must coordinate:

```text
Clinical Discharge Request
        +
Patient/Admission Validation
        +
Pending Services
        +
Billing
        +
Insurance
        +
Payment
        +
Documents
        +
Notifications
        +
Bed Release
        +
Housekeeping
        +
RPA
        +
Audit
        +
Exception Handling
```

Use existing shared infrastructure wherever available.

Do not duplicate:

- Authentication
- RBAC
- Billing
- Insurance
- Payment
- Notifications
- Documents
- Bed inventory
- Housekeeping
- Audit
- Exception management
- RPA job management

The most important architectural rules are:

> **Clinical staff decide whether the patient can be discharged.**

> **The Discharge module coordinates the administrative process; it does not make clinical decisions.**

> **Billing owns invoice calculation and financial rules.**

> **Insurance owns policy/claim decisions.**

> **Payment success must come from verified gateway information.**

> **Bed Management owns physical bed state.**

> **A discharged bed must enter the required cleaning workflow before becoming available.**

> **RPA automates repetitive administrative work but must stop and request human review whenever an ambiguous or high-risk decision is encountered.**

> **Every discharge step must be traceable through audit logs, correlation IDs, RPA jobs, and exception records.**