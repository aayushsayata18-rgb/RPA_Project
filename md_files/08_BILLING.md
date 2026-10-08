# 08_BILLING.md

# Hospital Administrative RPA Platform
## Module 08 — Billing & Payment Management

---

# 1. PURPOSE

Build a complete **Billing & Payment Management module** for the Hospital Administrative RPA Platform.

The module is responsible for the hospital's authoritative financial records related to:

- Patient billing
- Visit charges
- Admission charges
- Room/accommodation charges
- Doctor/consultation charges
- Laboratory charges
- Radiology charges
- Pharmacy charges
- Other configured hospital services
- Deposits/advances
- Discounts where authorized
- Insurance-related financial coverage references
- Final invoices
- Payment collection
- Online payment
- Counter payment
- Payment verification
- Payment receipts
- Outstanding balances
- Payment reminders
- Billing queries/disputes
- Financial reconciliation
- Billing reports
- RPA-based administrative automation

The module must integrate with:

- Patient Registration
- Appointments
- OPD
- Admission
- Bed Management
- Discharge
- Insurance Verification
- Insurance Claims
- Pharmacy
- Laboratory
- Radiology
- Notification Service
- Document Generation
- Payment Gateway
- Reports & Analytics
- Audit
- Exception Management
- Robot Framework

---

# 2. CRITICAL OWNERSHIP RULE

**Billing is the authoritative source for hospital invoices, payments, balances, deposits, and financial transactions.**

Other modules may:

- send charges
- request an invoice
- retrieve billing information
- display billing information

but must not independently modify Billing's financial records.

Architecture:

```text id="g8f2m1"
Service Modules
     │
     ├── Consultation
     ├── Room
     ├── Lab
     ├── Radiology
     ├── Pharmacy
     └── Other Services
              │
              ▼
       ┌──────────────┐
       │   BILLING    │
       │ Authoritative│
       └──────┬───────┘
              │
       ┌──────┼──────────┐
       ▼      ▼          ▼
    Invoice Payment   Reports
```

---

# 3. FINANCIAL SAFETY PRINCIPLE

The system must never allow RPA to independently:

- invent prices
- invent discounts
- invent insurance coverage
- approve financial adjustments
- approve refunds
- change invoice totals without authorization
- mark an unpaid invoice as paid
- bypass payment gateway verification
- create unauthorized waivers
- modify financial history silently

RPA performs administrative automation only.

---

# 4. TECHNOLOGY

Use:

```text id="n5q8v3"
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

Payment:
Secure Payment Gateway

Notifications:
Central Notification Service

Documents:
Central Document Generation Service

Audit:
Central Audit Service

Exceptions:
Central Exception Management
```

---

# 5. CORE IDENTIFIERS

Maintain distinct identifiers.

```text id="r7m2p5"
Patient ID
Visit ID
Admission ID
Invoice ID
Invoice Item ID
Payment ID
Payment Transaction ID
Deposit ID
Adjustment ID
Billing Query ID
RPA Job ID
Correlation ID
```

Example:

```text id="x4n8q2"
Patient:
P10045

Admission:
ADM10023

Invoice:
INV20261006122

Payment:
PAY20261006391

Transaction:
TXN-RAZOR-849201
```

---

# 6. BILLING OWNERSHIP

Billing owns:

```text id="m8q3v6"
Invoice
Invoice Items
Payments
Payment Attempts
Deposits
Financial Adjustments
Outstanding Balance
Billing Queries
```

Billing consumes data from:

```text id="q5n7r2"
Bed Management
Pharmacy
Laboratory
Radiology
Appointments/OPD
Other Services
Insurance
```

---

# 7. BILLING FLOW

General workflow:

```text id="v2m8q4"
Patient / Visit / Admission
          ↓
Retrieve Billable Services
          ↓
Validate Charges
          ↓
Create Invoice Items
          ↓
Calculate Gross Total
          ↓
Apply Configured Rules
          ↓
Apply Deposit / Insurance / Authorized Adjustments
          ↓
Calculate Payable Amount
          ↓
Generate Invoice
          ↓
Notify Patient
          ↓
Payment
          ↓
Verify Payment
          ↓
Receipt
          ↓
Update Balance
```

---

# 8. BILLING SOURCES

Charges may originate from:

### Consultation

```text id="k4p7n2"
Doctor consultation
```

### Accommodation

```text id="m8q3v1"
Room
Bed
Accommodation category
```

### Laboratory

```text id="q5r8m2"
Lab tests
```

### Radiology

```text id="n7v3p5"
Radiology services
```

### Pharmacy

```text id="x2m8q4"
Dispensed medicines
```

### Other Services

```text id="r6p3n7"
Configured hospital services
```

---

# 9. CHARGE SOURCE MODEL

Each charge must maintain source information.

Example:

```javascript id="v5q8m2"
{
    sourceModule: "LABORATORY",

    sourceType: "LAB_ORDER",

    sourceId: ObjectId,

    serviceCode: String,

    description: String,

    quantity: Number,

    unitPrice: Number,

    taxAmount: Number,

    discountAmount: Number,

    grossAmount: Number,

    netAmount: Number
}
```

This allows every invoice item to be traced to its originating service.

---

# 10. BILLABLE ITEM

Create/use:

```text id="m7r2q5"
BillableItem
```

Suggested structure:

```javascript id="p8n4v2"
{
    patientId: ObjectId,

    visitId: ObjectId,

    admissionId: ObjectId,

    sourceModule: String,

    sourceType: String,

    sourceId: ObjectId,

    serviceCode: String,

    description: String,

    quantity: Number,

    unitPrice: Number,

    grossAmount: Number,

    discountAmount: Number,

    insuranceAmount: Number,

    taxAmount: Number,

    netAmount: Number,

    status: String,

    serviceDate: Date,

    createdAt: Date,

    updatedAt: Date
}
```

---

# 11. BILLABLE ITEM STATUS

Use:

```text id="q5m8v3"
PENDING
VALIDATED
INVOICED
VOID
CANCELLED
REVERSED
```

Do not delete financial history.

---

# 12. INVOICE MODEL

Create:

```text id="r2n7m4"
Invoice
```

Suggested schema:

```javascript id="x8q3p5"
{
    invoiceNumber: String,

    patientId: ObjectId,

    visitId: ObjectId,

    admissionId: ObjectId,

    invoiceType: String,

    status: String,

    currency: String,

    subtotal: Number,

    taxTotal: Number,

    discountTotal: Number,

    insuranceCoverage: Number,

    depositApplied: Number,

    adjustmentTotal: Number,

    grossTotal: Number,

    payableAmount: Number,

    paidAmount: Number,

    balanceAmount: Number,

    issueDate: Date,

    dueDate: Date,

    finalizedAt: Date,

    cancelledAt: Date,

    cancellationReason: String,

    createdByUserId: ObjectId,

    correlationId: String,

    createdAt: Date,

    updatedAt: Date
}
```

---

# 13. INVOICE STATUSES

Use:

```text id="m4q8v2"
DRAFT
PENDING_REVIEW
FINALIZED
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED
VOID
```

---

# 14. INVOICE LIFECYCLE

Typical:

```text id="x7n3p5"
DRAFT
  ↓
PENDING_REVIEW
  ↓
FINALIZED
  ↓
PARTIALLY_PAID
  ↓
PAID
```

If no payment:

```text id="q2m8r4"
FINALIZED
→ OVERDUE
```

according to configured policy.

---

# 15. INVOICE ITEMS

Create:

```text id="n5v7p2"
InvoiceItem
```

Suggested fields:

```javascript id="r8m3q6"
{
    invoiceId: ObjectId,

    sourceModule: String,

    sourceType: String,

    sourceId: ObjectId,

    serviceCode: String,

    description: String,

    quantity: Number,

    unitPrice: Number,

    grossAmount: Number,

    discountAmount: Number,

    insuranceAmount: Number,

    taxAmount: Number,

    netAmount: Number,

    serviceDate: Date,

    metadata: Object
}
```

---

# 16. ITEMIZED BILL REQUIREMENT

Every invoice must be itemized.

Example:

```text id="q4m8v2"
Room Charges        ₹5,000
Consultation        ₹1,000
Laboratory          ₹2,000
Pharmacy            ₹3,500
Radiology           ₹2,500
--------------------------------
Gross Total        ₹14,000
```

Numbers are illustrative only.

---

# 17. ROOM / ACCOMMODATION CHARGES

Bed Management provides actual accommodation history.

Example:

```text id="m7q3v5"
Oct 01–Oct 03
General Ward

Oct 03–Oct 05
Semi-Private

Oct 05–Oct 08
Private
```

Billing calculates applicable charges according to configured billing rules.

---

# 18. IMPORTANT ROOM BILLING RULE

The requested accommodation does NOT determine the final room charge.

Example:

```text id="x5n8q2"
Requested:
Private

Actually Assigned:
Semi-Private
```

Billing uses the actual assigned accommodation.

The requested preference must not be used as the financial source of truth.

---

# 19. BED ASSIGNMENT INTEGRATION

Billing should retrieve:

```text id="r2m7v5"
Bed ID
Accommodation Category
Ward
Room
Assignment Start
Assignment End
```

from Bed Management.

---

# 20. ROOM CHARGE PERIOD

Room charges should reference:

```text id="n8q4m2"
assignmentStart
assignmentEnd
actualAccommodationCategory
```

Do not overwrite historical assignments.

---

# 21. CONSULTATION CHARGES

Consultation charges may be received from:

- Appointment/OPD
- Clinical service
- Other configured service

Each charge must contain:

```text id="v3m7q5"
Doctor
Visit
Service
Date
Configured Price
```

Billing does not decide the clinical service.

---

# 22. LABORATORY CHARGES

Lab module sends billable charges.

Example:

```json id="q8m2r4"
{
    "sourceModule": "LABORATORY",
    "sourceType": "LAB_ORDER",
    "sourceId": "LAB10023",
    "serviceCode": "CBC",
    "description": "Complete Blood Count",
    "quantity": 1,
    "unitPrice": 500
}
```

Billing validates and records the charge.

---

# 23. RADIOLOGY CHARGES

Example:

```json id="n5q8v2"
{
    "sourceModule": "RADIOLOGY",
    "sourceType": "RADIOLOGY_ORDER",
    "sourceId": "RAD10023",
    "serviceCode": "XRAY-CHEST",
    "description": "Chest X-Ray",
    "quantity": 1,
    "unitPrice": 1000
}
```

---

# 24. PHARMACY CHARGES

Pharmacy sends dispensed-item charges.

Example:

```text id="r4m7q2"
Medicine A
Quantity: 10
Unit Price: ₹20
Total: ₹200
```

Billing should not independently decide which medication was dispensed.

---

# 25. OTHER SERVICES

Support configurable service categories.

Examples:

```text id="m8n3q5"
Procedure
Equipment
Administrative Service
Other Hospital Service
```

The service must be configured by authorized administrators.

---

# 26. RATE CARD

Create a configurable rate structure.

Suggested model:

```javascript id="q2v7m4"
{
    serviceCode: String,

    serviceName: String,

    category: String,

    unit: String,

    basePrice: Number,

    taxRate: Number,

    effectiveFrom: Date,

    effectiveTo: Date,

    active: Boolean,

    createdAt: Date,
    updatedAt: Date
}
```

---

# 27. RATE VERSIONING

Rates must be versioned.

Example:

```text id="x5m8r2"
Consultation:

01 Jan–30 Jun:
₹800

01 Jul onward:
₹1,000
```

An old invoice must retain the price that was actually used.

Do not recalculate historical invoices from today's rate.

---

# 28. RATE OWNERSHIP

Only authorized administrative/finance users may manage rates.

RPA cannot create or change rate cards unless explicitly authorized through a controlled workflow.

---

# 29. DISCOUNT MODEL

Create:

```text id="m7q2v5"
FinancialAdjustment
```

Possible adjustment types:

```text id="n4r8p2"
DISCOUNT
WAIVER
CREDIT
DEBIT
OTHER_CONFIGURED_ADJUSTMENT
```

---

# 30. FINANCIAL ADJUSTMENT APPROVAL

Adjustments must have:

```text id="q5m8v3"
Requested By
Reason
Amount
Type
Status
Approved By
Approved At
```

Statuses:

```text id="r2n7m4"
REQUESTED
UNDER_REVIEW
APPROVED
REJECTED
CANCELLED
APPLIED
```

---

# 31. RPA ADJUSTMENT RULE

RPA must NEVER independently approve a financial adjustment.

Correct:

```text id="x8m3q5"
Adjustment Requested
      ↓
Authorized Human Review
      ↓
Approved
      ↓
RPA/System Applies
```

---

# 32. INSURANCE COVERAGE

Billing may receive insurance information such as:

```text id="q4v7n2"
Verified Policy
Coverage Reference
Approved Amount
Patient Responsibility
Claim Reference
```

Only use authoritative insurance information.

Do not invent coverage.

---

# 33. INSURANCE VS PAYMENT

Keep separate:

```text id="m8r3q5"
Insurance Coverage
```

and:

```text id="n2q7v4"
Actual Patient Payment
```

Insurance coverage is not automatically equivalent to money received.

---

# 34. DEPOSIT MODEL

Create:

```text id="x5m8q2"
Deposit
```

Suggested:

```javascript id="r7n3v5"
{
    depositNumber: String,

    patientId: ObjectId,

    visitId: ObjectId,

    admissionId: ObjectId,

    amount: Number,

    usedAmount: Number,

    remainingAmount: Number,

    paymentId: ObjectId,

    status: String,

    receivedAt: Date,

    createdByUserId: ObjectId,

    createdAt: Date,
    updatedAt: Date
}
```

---

# 35. DEPOSIT STATUSES

```text id="q8m2r4"
ACTIVE
PARTIALLY_APPLIED
FULLY_APPLIED
REFUNDED
CANCELLED
```

Refunds must follow an authorized financial workflow.

---

# 36. APPLYING DEPOSIT

Example:

```text id="n5q7v2"
Invoice:
₹14,000

Deposit:
₹5,000

Applied:
₹5,000

Remaining:
₹9,000
```

The system must maintain a traceable relationship between deposit and invoice.

---

# 37. INVOICE CALCULATION

Use a centralized calculation service.

Conceptually:

```text id="r4m8q2"
Gross Charges
      -
Authorized Discounts
      -
Insurance Coverage
      -
Deposit Applied
      +
Applicable Taxes/Adjustments
      =
Payable Amount
```

The exact financial formula must be configurable according to hospital rules.

Do not hardcode a universal insurance/tax policy.

---

# 38. MONEY PRECISION

Do not use floating-point arithmetic for financial calculations.

Use:

- Decimal128
- integer smallest currency unit
- or another exact-money strategy

consistently across the application.

---

# 39. CURRENCY

Store currency explicitly.

Example:

```text id="m7q3v5"
INR
```

Do not assume currency globally inside calculation code.

---

# 40. INVOICE FINALIZATION

Before finalization:

```text id="q2n8m4"
Validate patient
Validate visit/admission
Validate invoice items
Validate prices
Validate adjustments
Validate insurance references
Validate deposits
Calculate totals
```

Then:

```text id="x5m8r2"
DRAFT
→ FINALIZED
```

After finalization, financial modifications require an authorized correction/adjustment process.

---

# 41. FINALIZED INVOICE IMMUTABILITY

A finalized invoice must not be directly edited.

Incorrect:

```text id="n8q3v5"
FINALIZED
→ change amount directly
```

Correct:

```text id="r4m7q2"
FINALIZED
→ authorized adjustment/correction
→ audit
```

---

# 42. INVOICE NUMBER

Generate unique invoice numbers.

Example:

```text id="m5q8v2"
INV-2026-000001
```

Use a concurrency-safe sequence strategy.

Never generate invoice numbers solely from frontend timestamps.

---

# 43. PAYMENT MODEL

Create:

```text id="q7n3m5"
Payment
```

Suggested:

```javascript id="x4r8v2"
{
    paymentNumber: String,

    invoiceId: ObjectId,

    patientId: ObjectId,

    amount: Number,

    currency: String,

    method: String,

    status: String,

    gatewayProvider: String,

    gatewayTransactionId: String,

    paymentReference: String,

    receivedAt: Date,

    verifiedAt: Date,

    createdByUserId: ObjectId,

    correlationId: String,

    createdAt: Date,
    updatedAt: Date
}
```

---

# 44. PAYMENT METHODS

Support configurable methods such as:

```text id="n8m2q4"
UPI
CARD
NET_BANKING
CASH
BANK_TRANSFER
OTHER_CONFIGURED_METHOD
```

---

# 45. PAYMENT STATUSES

Use:

```text id="r5q8v2"
INITIATED
PENDING
SUCCESS
FAILED
CANCELLED
REFUNDED
PARTIALLY_REFUNDED
```

---

# 46. PAYMENT ATTEMPT MODEL

Create:

```text id="m7n3q5"
PaymentAttempt
```

Suggested:

```javascript id="q2r8v4"
{
    paymentId: ObjectId,

    invoiceId: ObjectId,

    attemptNumber: Number,

    amount: Number,

    method: String,

    gatewayProvider: String,

    gatewayReference: String,

    status: String,

    failureCode: String,

    failureMessage: String,

    initiatedAt: Date,

    completedAt: Date
}
```

---

# 47. ONLINE PAYMENT FLOW

```text id="x5m8q2"
Invoice
   ↓
Pay Now
   ↓
Create Payment Session
   ↓
Secure Gateway
   ↓
Patient Completes Payment
   ↓
Gateway Callback/Webhook
   ↓
Verify Signature
   ↓
Verify Transaction
   ↓
Payment = SUCCESS
   ↓
Invoice Updated
   ↓
Receipt Generated
   ↓
Notification Sent
```

---

# 48. PAYMENT GATEWAY SECURITY

Never trust only the frontend redirect.

For example:

```text id="n7r3m5"
Browser:
Payment Success
```

does NOT by itself mean:

```text id="q4m8v2"
Payment SUCCESS
```

The backend must verify the gateway transaction.

---

# 49. PAYMENT CALLBACK IDEMPOTENCY

If gateway sends the same callback twice:

```text id="m8q2v5"
Webhook #1
Webhook #2
```

the system must process it only once.

Do not create:

```text id="r7n3m4"
Two payments
Two receipts
```

for one transaction.

---

# 50. PAYMENT SUCCESS

When verified:

```text id="x5q8n2"
Payment:
SUCCESS

Invoice:
PAID / PARTIALLY_PAID

Balance:
Updated
```

If:

```text id="n2m7v4"
Paid Amount < Invoice Amount
```

invoice becomes:

```text id="q8r3m5"
PARTIALLY_PAID
```

---

# 51. PAYMENT FAILURE

On failure:

```text id="m4q7n2"
Payment:
FAILED

Invoice:
Remains outstanding
```

Patient can retry.

Do not alter invoice total because of a failed payment.

---

# 52. PAYMENT RECEIPT

After verified payment:

```text id="x7n3m5"
Generate Receipt
```

Receipt contains:

```text id="q2m8r4"
Receipt Number
Invoice Number
Patient
Amount
Payment Method
Transaction Reference
Date
Status
```

Do not expose sensitive gateway information.

---

# 53. COUNTER PAYMENT

Billing staff can record:

```text id="m5r8q2"
Cash
Card
UPI
Bank Transfer
```

according to configured hospital methods.

Counter payments must also create:

```text id="n7q3v4"
Payment
```

and:

```text id="x2m8r5"
Receipt
```

---

# 54. CASH PAYMENT CONTROLS

If cash is supported:

- cashier identity required
- amount required
- timestamp required
- receipt generated
- audit event created
- cancellation/reversal controlled

Do not allow anonymous cash entries.

---

# 55. OUTSTANDING BALANCE

Calculate:

```text id="q4m8v2"
Balance =
Payable Amount - Verified Payments
```

Do not include:

- failed payments
- cancelled payments
- unverified transactions

as successful payments.

---

# 56. OVERDUE

If configured:

```text id="m7n2q5"
Due Date
+
Balance > 0
```

then:

```text id="x8r3v4"
OVERDUE
```

Notification rules are configurable.

---

# 57. PAYMENT REMINDERS

Use centralized Notification Service.

Example:

```text id="q5m8n2"
Invoice Outstanding
      ↓
Configured Reminder Interval
      ↓
SMS
+
Email
```

Avoid duplicate reminders.

---

# 58. NOTIFICATION DEDUPLICATION

Use an idempotency key such as:

```text id="r3v7m5"
INVOICE-INV20261006122-REMINDER-01
```

so retries do not create duplicate notifications.

---

# 59. BILLING QUERY

Create:

```text id="m8q2v4"
BillingQuery
```

Suggested:

```javascript id="x5n7r3"
{
    queryNumber: String,

    patientId: ObjectId,

    invoiceId: ObjectId,

    submittedByUserId: ObjectId,

    category: String,

    description: String,

    status: String,

    assignedTo: ObjectId,

    resolution: String,

    resolvedBy: ObjectId,

    resolvedAt: Date,

    createdAt: Date,
    updatedAt: Date
}
```

---

# 60. BILLING QUERY STATUSES

```text id="q4m8v2"
OPEN
UNDER_REVIEW
WAITING_FOR_INFORMATION
RESOLVED
REJECTED
CLOSED
```

---

# 61. BILLING QUERY EXAMPLES

Patients may ask:

```text id="m7r3q5"
Why was this lab charge added?

Why is my room charge different?

Why was my deposit not applied?

Why is my insurance amount different?
```

The Billing team resolves according to hospital policy.

---

# 62. FINANCIAL ADJUSTMENT WORKFLOW

Example:

```text id="x2n8q4"
Billing Query
     ↓
Adjustment Requested
     ↓
Authorized Review
     ↓
Approved / Rejected
     ↓
If Approved
     ↓
Apply Adjustment
     ↓
Recalculate Balance
     ↓
Audit
```

RPA can execute the approved action.

---

# 63. REFUND WORKFLOW

If refunds are supported:

```text id="q5m7r2"
Refund Requested
     ↓
Authorized Review
     ↓
Approved
     ↓
Refund Processed
     ↓
Payment Updated
     ↓
Audit
     ↓
Patient Notified
```

Do not implement automatic refunds merely because an invoice is overpaid.

---

# 64. REFUND STATUSES

```text id="m8q3v5"
REQUESTED
APPROVED
PROCESSING
COMPLETED
FAILED
REJECTED
CANCELLED
```

---

# 65. BILLING DISPUTE SECURITY

A patient must not be able to directly alter:

```text id="x7n2q4"
Invoice
Payment
Adjustment
Refund
```

They may only create a query/request.

---

# 66. DISCHARGE INTEGRATION

Discharge requests final billing state.

Example:

```text id="q3m8r2"
POST /api/billing/invoices/finalize
```

Billing returns:

```json id="n7v2m5"
{
    "invoiceId": "INV20261006122",
    "grossTotal": 14000,
    "insuranceCoverage": 3000,
    "depositApplied": 5000,
    "payableAmount": 6000,
    "balanceAmount": 6000
}
```

Illustrative values.

---

# 67. DISCHARGE BILLING COMPLETION

Discharge should receive:

```text id="m5q8v2"
Invoice finalized
Balance
Payment status
```

Billing remains authoritative.

---

# 68. INSURANCE INTEGRATION

Billing may request:

```text id="x2r7m4"
Insurance verification
Claim status
Approved amount
Patient responsibility
```

Insurance module owns insurance decisions.

---

# 69. INSURANCE PENDING

If insurance is pending:

```text id="q8m3n5"
Do not invent coverage.
```

Billing should use the hospital's configured handling rule.

Example:

```text id="m7r2q4"
Estimated/authorized patient responsibility
```

only if such a value is actually available.

---

# 70. ADMISSION INTEGRATION

Billing receives:

```text id="x5n8m2"
Patient
Admission
Services
Bed assignments
```

It must not create a second admission record.

---

# 71. BED MANAGEMENT INTEGRATION

Billing consumes:

```text id="q4m7r2"
Actual accommodation
Assignment period
Ward
Room
Bed
```

The billing module must not modify bed state.

---

# 72. LAB/RADIOLOGY/PHARMACY INTEGRATION

These modules submit billable charges.

Billing validates:

```text id="m8q3v5"
Source exists
Source belongs to patient
Source is billable
Price is valid
Charge has not already been invoiced
```

---

# 73. DUPLICATE CHARGE PREVENTION

A service must not be invoiced twice accidentally.

Example:

```text id="x7r2m5"
LAB10023
```

must not appear as two active identical invoice items unless explicitly authorized.

Use:

```text id="q4n8v2"
sourceModule
sourceType
sourceId
```

with appropriate uniqueness/idempotency strategy.

---

# 74. CHARGE REVERSAL

If a source service is cancelled/reversed:

```text id="m5q7r3"
Billing receives reversal event
```

The system must handle it according to invoice state.

If invoice is not finalized:

```text id="x8n2m4"
Remove/void pending charge
```

If finalized:

```text id="q3r7v5"
Create authorized adjustment/reversal
```

Do not silently delete financial history.

---

# 75. BILLING DASHBOARD

Create:

```text id="m7q2n4"
/billing
```

Summary cards:

```text id="x5r8v2"
Today's Revenue
Outstanding
Pending Payments
Paid Invoices
Partially Paid
Overdue
Billing Queries
```

---

# 76. BILLING LIST

Display:

```text id="q4m8r2"
Invoice Number
Patient
Admission
Invoice Date
Gross
Paid
Balance
Status
```

Filters:

```text id="n7m3v5"
Date
Ward
Status
Payment Status
Insurance
Doctor
```

---

# 77. INVOICE DETAILS PAGE

Route:

```text id="x2q8m4"
/billing/invoices/:invoiceId
```

Display:

```text id="m5r7n2"
Patient
Visit/Admission
Invoice
Items
Subtotal
Taxes
Discounts
Insurance
Deposit
Payable
Payments
Balance
Documents
Queries
Audit
```

---

# 78. CREATE INVOICE PAGE

Authorized users may create a draft invoice.

Workflow:

```text id="q8m2v5"
Select Patient
      ↓
Select Visit/Admission
      ↓
Retrieve Billable Items
      ↓
Review
      ↓
Create Draft
```

---

# 79. INVOICE FINALIZATION UI

Show a final confirmation screen.

Example:

```text id="x7n3m5"
You are about to finalize:

Gross Total: ₹14,000
Insurance: ₹3,000
Deposit: ₹5,000
Payable: ₹6,000

Once finalized, direct editing is not allowed.
```

Require appropriate permission.

---

# 80. PAYMENT PAGE

Patient route:

```text id="q5m8r2"
/portal/billing/invoices/:invoiceId/pay
```

Display:

```text id="n7v3m4"
Invoice Total
Paid
Balance
Payment Methods
Pay Now
```

---

# 81. PAYMENT RESULT PAGE

Success:

```text id="x4m8q2"
Payment Successful

Amount:
₹6,000

Transaction:
TXN-XXXX

Receipt:
Available
```

Failure:

```text id="m5q7r3"
Payment Failed

Please try again or use hospital counter payment.
```

---

# 82. RECEIPT PAGE

Display:

```text id="q8n3v5"
Receipt Number
Invoice
Patient
Amount
Method
Transaction Reference
Date
Download Receipt
```

---

# 83. BILLING QUERY PAGE

Patient:

```text id="x2m7r4"
/portal/billing/queries
```

Actions:

```text id="m8q3n5"
Create Query
View Status
View Response
```

Staff:

```text id="q5r7v2"
/billing/queries
```

---

# 84. API DESIGN

Use:

```text id="n4m8q2"
/api/billing/billable-items
/api/billing/invoices
/api/billing/invoices/:id
/api/billing/invoices/:id/items
/api/billing/invoices/:id/finalize
/api/billing/payments
/api/billing/payments/:id
/api/billing/payment-attempts
/api/billing/deposits
/api/billing/adjustments
/api/billing/refunds
/api/billing/queries
/api/billing/rates
```

---

# 85. BILLABLE ITEM APIs

```http id="x7m3q5"
POST /api/billing/billable-items
GET /api/billing/billable-items
GET /api/billing/billable-items/:id
POST /api/billing/billable-items/:id/validate
```

---

# 86. INVOICE APIs

```http id="q2r8m4"
POST /api/billing/invoices
GET /api/billing/invoices
GET /api/billing/invoices/:id
POST /api/billing/invoices/:id/finalize
POST /api/billing/invoices/:id/cancel
```

---

# 87. PAYMENT APIs

```http id="m5n7q2"
POST /api/billing/payments
GET /api/billing/payments/:id
POST /api/billing/payments/:id/verify
POST /api/billing/payments/:id/refund
```

Gateway callback:

```http id="x8r3m5"
POST /api/payments/webhooks/:provider
```

---

# 88. DEPOSIT APIs

```http id="q4m8v2"
POST /api/billing/deposits
GET /api/billing/deposits
POST /api/billing/deposits/:id/apply
```

---

# 89. ADJUSTMENT APIs

```http id="m7n2q5"
POST /api/billing/adjustments
GET /api/billing/adjustments
POST /api/billing/adjustments/:id/approve
POST /api/billing/adjustments/:id/reject
POST /api/billing/adjustments/:id/apply
```

Approval endpoints must enforce authorization.

---

# 90. BILLING QUERY APIs

```http id="x5q8r2"
POST /api/billing/queries
GET /api/billing/queries
GET /api/billing/queries/:id
POST /api/billing/queries/:id/resolve
```

---

# 91. RATE APIs

```http id="m8r3q5"
GET /api/billing/rates
POST /api/billing/rates
PATCH /api/billing/rates/:id
```

Rate modification requires appropriate permission.

---

# 92. MONGOOSE INDEXES

Suggested indexes:

Invoice:

```javascript id="q7m2v4"
{ invoiceNumber: 1 } // unique

{ patientId: 1, issueDate: -1 }

{ admissionId: 1, status: 1 }

{ status: 1, issueDate: -1 }
```

InvoiceItem:

```javascript id="x5n8r2"
{
    sourceModule: 1,
    sourceType: 1,
    sourceId: 1
}
```

Payment:

```javascript id="m4q7v3"
{ paymentNumber: 1 } // unique

{ invoiceId: 1, createdAt: -1 }

{ gatewayTransactionId: 1 }
```

Deposit:

```javascript id="n8r2m5"
{ depositNumber: 1 } // unique

{ patientId: 1, admissionId: 1 }
```

---

# 93. MONEY DATA MODEL

Use MongoDB Decimal128 or an equivalent exact-money representation.

Example:

```javascript id="q5m8r2"
grossTotal: Decimal128
payableAmount: Decimal128
paidAmount: Decimal128
balanceAmount: Decimal128
```

Do not use JavaScript floating-point arithmetic for final financial calculations.

---

# 94. ROUNDING

Define one centralized rounding strategy.

Do not allow:

```text id="x7n3m4"
Invoice Service:
round to 2 decimals

Payment Service:
round to nearest rupee

Report:
round differently
```

All financial components must use the same configured currency precision and rounding rules.

---

# 95. AUDIT EVENTS

Create audit events for:

```text id="m8q3v5"
BILLABLE_ITEM_CREATED
BILLABLE_ITEM_VALIDATED
INVOICE_CREATED
INVOICE_FINALIZED
INVOICE_CANCELLED
PAYMENT_CREATED
PAYMENT_VERIFIED
PAYMENT_FAILED
PAYMENT_REFUNDED
DEPOSIT_CREATED
DEPOSIT_APPLIED
ADJUSTMENT_REQUESTED
ADJUSTMENT_APPROVED
ADJUSTMENT_REJECTED
ADJUSTMENT_APPLIED
BILLING_QUERY_CREATED
BILLING_QUERY_RESOLVED
RATE_CREATED
RATE_UPDATED
```

---

# 96. FINANCIAL AUDIT REQUIREMENT

Every financial modification must record:

```text id="q4n7m2"
Who
What
When
Previous Value
New Value
Reason
Reference
Correlation ID
```

Financial history must be reconstructable.

---

# 97. RBAC

Suggested permissions:

```text id="x5m8r3"
billing.view
billing.create_invoice
billing.finalize_invoice
billing.cancel_invoice
billing.record_payment
billing.verify_payment
billing.manage_deposits
billing.request_adjustment
billing.approve_adjustment
billing.apply_adjustment
billing.request_refund
billing.approve_refund
billing.manage_rates
billing.view_reports
billing.manage_queries
billing.manage_rpa
```

---

# 98. ROLE EXAMPLES

### Patient

```text id="m7q2v5"
View own invoices
Pay own invoices
View own receipts
Create billing queries
```

### Billing Staff

```text id="q8n3m4"
View
Create
Finalize
Record counter payment
Manage queries
```

subject to configured permissions.

### Finance/Admin Manager

May approve configured:

```text id="x5r7m2"
Adjustments
Refunds
Rate changes
```

### Hospital Management

May view reports.

### System Admin

Technical access according to policy, with audit.

---

# 99. PAYMENT DATA SECURITY

Never store:

```text id="m4q8n2"
CVV
UPI PIN
Internet Banking Password
Full card data unless a compliant payment architecture explicitly requires it
```

Prefer gateway tokenization.

---

# 100. WEBHOOK SECURITY

Payment gateway webhook must:

1. Validate signature.
2. Validate provider.
3. Validate transaction.
4. Validate invoice/payment relationship.
5. Check duplicate callback.
6. Update payment atomically.
7. Update invoice.
8. Create audit event.

---

# 101. PAYMENT RECONCILIATION

Provide reconciliation between:

```text id="x7m3q5"
Hospital Payment Records
```

and:

```text id="q2n8r4"
Payment Gateway Settlement/Transaction Data
```

RPA may assist.

Example mismatch:

```text id="m5q7v2"
Gateway:
SUCCESS ₹6,000

Hospital:
PENDING ₹6,000
```

Create:

```text id="n8r3m5"
PAYMENT_RECONCILIATION_MISMATCH
```

Do not manually mark paid without verified evidence.

---

# 102. RPA ROLE

Robot Framework may automate:

- legacy billing data entry
- charge synchronization
- invoice retrieval
- payment-status reconciliation
- report generation
- billing reminders
- document retrieval
- reconciliation
- exception routing

RPA must never become the financial system of record.

---

# 103. BILLING RPA WORKFLOW

Use:

```text id="q5m8r2"
Input
 ↓
Read
 ↓
Validate
 ↓
Apply configured rules
 ↓
Act
 ↓
Verify
 ↓
Update
 ↓
Notify
 ↓
Log
```

---

# 104. RPA — LEGACY CHARGE IMPORT

```text id="x7n3q5"
Scheduled Job
      ↓
Login Legacy System
      ↓
Search Patient/Admission
      ↓
Read Charges
      ↓
Validate Source
      ↓
Compare Existing Charges
      ↓
Create Billable Items
      ↓
Verify
      ↓
Log
```

---

# 105. RPA — INVOICE SYNCHRONIZATION

If legacy system generates invoices:

```text id="m4q8r2"
Read Invoice
      ↓
Validate Invoice Number
      ↓
Match Patient
      ↓
Match Admission
      ↓
Compare Items/Totals
      ↓
Import or flag mismatch
```

Ambiguous matches must go to human review.

---

# 106. RPA — PAYMENT RECONCILIATION

```text id="x8m3q5"
Read Gateway/Legacy Payment Report
       ↓
Match Transaction ID
       ↓
Match Amount
       ↓
Match Invoice
       ↓
Compare Status
       ↓
Update / Exception
       ↓
Audit
```

---

# 107. RPA — BILLING REMINDERS

RPA may trigger reminders if required, but preferably the centralized Notification Service should handle scheduling.

If RPA is used:

```text id="q5r7m2"
Read Outstanding Invoices
      ↓
Apply configured reminder policy
      ↓
Check duplicate notification
      ↓
Send
      ↓
Record
```

---

# 108. ROBOT FRAMEWORK STRUCTURE

Extend:

```text id="m8q2v5"
robot/
├── resources/
│   ├── common.resource
│   ├── api.resource
│   ├── auth.resource
│   ├── billing.resource
│   ├── payment.resource
│   ├── invoice.resource
│   ├── legacy_billing.resource
│   ├── notification.resource
│   └── document.resource
│
├── keywords/
│   ├── billing_keywords.resource
│   ├── invoice_keywords.resource
│   ├── payment_keywords.resource
│   ├── reconciliation_keywords.resource
│   ├── legacy_keywords.resource
│   └── exception_keywords.resource
│
├── tests/
│   ├── charge_import.robot
│   ├── invoice_generation.robot
│   ├── invoice_finalization.robot
│   ├── payment_success.robot
│   ├── payment_failure.robot
│   ├── payment_reconciliation.robot
│   └── billing_end_to_end.robot
│
└── results/
```

---

# 109. ROBOT KEYWORDS

Create:

```text id="x5m8r2"
Login To Billing System
Search Patient
Search Admission
Read Charges
Validate Charge
Create Billable Item
Create Invoice
Finalize Invoice
Read Payment Status
Verify Payment
Reconcile Gateway Transaction
Generate Billing Report
Create Billing Exception
Capture Evidence
Update RPA Job
```

---

# 110. RPA EXCEPTIONS

Support:

```text id="q7n3m5"
PATIENT_NOT_FOUND
ADMISSION_NOT_FOUND
DUPLICATE_CHARGE
INVALID_CHARGE
INVOICE_MISMATCH
PAYMENT_MISMATCH
GATEWAY_UNAVAILABLE
LEGACY_SYSTEM_UNAVAILABLE
LEGACY_LOGIN_FAILED
AMOUNT_MISMATCH
TRANSACTION_NOT_FOUND
DUPLICATE_PAYMENT
UNAUTHORIZED_ADJUSTMENT
DOCUMENT_GENERATION_FAILED
```

---

# 111. HUMAN-IN-THE-LOOP

Example:

```text id="m4q8r2"
Legacy Invoice:
₹14,000

MERN Calculated:
₹13,500
```

RPA must NOT decide which amount is correct.

Instead:

```text id="x7n2m5"
Create BILLING_AMOUNT_MISMATCH
        ↓
Finance/Billing Review
        ↓
Approved Decision
        ↓
RPA/System Continues
```

---

# 112. BILLING REPORTS

Create reports for:

### Daily Revenue

```text id="q5m8r2"
Date
Gross
Discounts
Insurance
Net
Collected
Outstanding
```

### Outstanding

```text id="m8n3q5"
Invoice
Patient
Amount
Paid
Balance
Due Date
Status
```

### Payment Report

```text id="x7r2m4"
Transaction
Invoice
Amount
Method
Status
Date
```

### Insurance Billing

```text id="q4m8n2"
Invoice
Claim
Insurance Amount
Patient Responsibility
Status
```

### Adjustment Report

```text id="m5q7r3"
Adjustment
Amount
Reason
Requested By
Approved By
Status
```

---

# 113. MANAGEMENT DASHBOARD

Display:

```text id="x8n3m5"
Today's Revenue
Month-to-Date Revenue
Outstanding Amount
Collection Rate
Payment Success Rate
Payment Failure Rate
Insurance Receivable
Pending Billing
Billing Queries
Refunds
Adjustments
```

---

# 114. FILTERS

Support:

```text id="q2m7r4"
Date Range
Ward
Department
Doctor
Invoice Status
Payment Status
Insurance
Payment Method
```

---

# 115. EXPORTS

Authorized users can export:

```text id="m8q3v5"
CSV
Excel-compatible format
PDF
```

Exports must respect:

- RBAC
- patient privacy
- financial permissions

---

# 116. BILLING DATA RETENTION

Do not hardcode legal retention periods.

Support configurable:

```text id="x5r8m2"
Retention Policy
Archive Status
Document Retention
Audit Retention
```

Historical financial records should remain traceable.

---

# 117. DATABASE TRANSACTIONS

Use MongoDB transactions for critical operations where supported.

For example:

```text id="q7m3n5"
Verify Payment
+
Update Payment
+
Update Invoice
+
Create Receipt Reference
+
Audit
```

If a transaction cannot complete atomically, use an explicit reconciliation/recovery workflow.

---

# 118. IDEMPOTENCY

Use idempotency keys for:

- charge submission
- invoice creation
- invoice finalization
- payment creation
- payment webhook
- deposit application
- adjustment application
- refund

Example:

```text id="m4q8r2"
PAYMENT-TXN-849201
```

Repeated requests must not create duplicate financial records.

---

# 119. CONCURRENCY

Protect against:

```text id="x7n3m5"
Two users finalizing invoice
Two users recording payment
Gateway callback + manual reconciliation
Two workers importing same charge
```

Expected:

```text id="q5m8r2"
Exactly one valid financial state transition.
```

---

# 120. ERROR RESPONSE

Use:

```json id="m8q3v5"
{
    "success": false,
    "error": {
        "code": "INVOICE_ALREADY_FINALIZED",
        "message": "The invoice has already been finalized and cannot be directly edited.",
        "correlationId": "CORR-20261006-00521"
    }
}
```

---

# 121. ACCEPTANCE CRITERIA

The module is accepted only when:

### Charges

- [ ] Consultation charges work.
- [ ] Room charges work.
- [ ] Laboratory charges work.
- [ ] Radiology charges work.
- [ ] Pharmacy charges work.
- [ ] Other configured charges work.
- [ ] Source references are preserved.
- [ ] Duplicate charges are prevented.

### Invoices

- [ ] Draft invoices work.
- [ ] Invoice items are itemized.
- [ ] Rate versions work.
- [ ] Finalization works.
- [ ] Finalized invoices cannot be silently edited.
- [ ] Invoice numbers are unique.

### Deposits

- [ ] Deposits can be recorded.
- [ ] Deposits can be applied.
- [ ] Remaining deposit is tracked.
- [ ] Deposit history is preserved.

### Insurance

- [ ] Insurance coverage references can be applied.
- [ ] Coverage is sourced from Insurance.
- [ ] Pending insurance is handled without invented values.

### Payments

- [ ] Online payment works.
- [ ] Gateway verification works.
- [ ] Payment callbacks are secure.
- [ ] Duplicate callbacks are prevented.
- [ ] Payment failures are handled.
- [ ] Counter payment works.
- [ ] Receipts are generated.

### Adjustments

- [ ] Adjustment requests work.
- [ ] Approval is permission-controlled.
- [ ] RPA cannot independently approve adjustments.
- [ ] Adjustment history is preserved.

### Queries

- [ ] Patients can create billing queries.
- [ ] Billing staff can resolve queries.
- [ ] Query history is preserved.

### Discharge

- [ ] Final invoice can be requested by Discharge.
- [ ] Actual bed/accommodation history is used.
- [ ] Billing returns final financial state.

### RPA

- [ ] Legacy charge synchronization works.
- [ ] Invoice synchronization works.
- [ ] Payment reconciliation works.
- [ ] Exceptions work.
- [ ] Human review works.

### Security

- [ ] RBAC works.
- [ ] Payment data is protected.
- [ ] Financial changes are audited.
- [ ] Sensitive information is protected.

---

# 122. END-TO-END ACCEPTANCE SCENARIO

The implementation must demonstrate:

```text id="x5m8q2"
1. Patient has an active admission
       ↓
2. Bed Management provides actual accommodation history
       ↓
3. Lab submits charges
       ↓
4. Radiology submits charges
       ↓
5. Pharmacy submits charges
       ↓
6. Consultation charge submitted
       ↓
7. Billing retrieves all billable items
       ↓
8. Invoice draft created
       ↓
9. Finance reviews
       ↓
10. Invoice finalized
       ↓
11. Patient receives SMS/email
       ↓
12. Patient opens secure portal
       ↓
13. Patient views itemized bill
       ↓
14. Patient selects Pay Now
       ↓
15. Payment gateway processes payment
       ↓
16. Backend verifies gateway result
       ↓
17. Payment marked SUCCESS
       ↓
18. Invoice marked PAID/PARTIALLY_PAID
       ↓
19. Receipt generated
       ↓
20. Patient receives payment confirmation
       ↓
21. Billing state available to Discharge
```

---

# 123. IMPLEMENTATION ORDER

## Phase 1 — Database

Create:

```text id="q7m3r5"
BillableItem
RateCard
Invoice
InvoiceItem
Payment
PaymentAttempt
Deposit
FinancialAdjustment
BillingQuery
```

---

## Phase 2 — Financial Calculation

Implement:

```text id="m5n8q2"
ChargeValidationService
InvoiceCalculationService
DepositService
AdjustmentService
BalanceService
```

Use exact-money arithmetic.

---

## Phase 3 — Invoice APIs

Implement:

```text id="x4q7m3"
Draft
Items
Finalize
Cancel
View
```

---

## Phase 4 — Payment

Implement:

```text id="n8m2r5"
PaymentService
PaymentGatewayAdapter
WebhookVerification
PaymentReconciliation
ReceiptGeneration
```

---

## Phase 5 — Integrations

Connect:

```text id="q5r8m2"
Admission
Bed Management
Pharmacy
Laboratory
Radiology
Insurance
Discharge
```

---

## Phase 6 — Patient Portal

Build:

```text id="m7q3v5"
Invoice
Payment
Receipt
Billing Query
```

---

## Phase 7 — Staff Portal

Build:

```text id="x2n8r4"
Billing Dashboard
Invoice Management
Payments
Deposits
Adjustments
Queries
Reports
```

---

## Phase 8 — Notifications

Connect centralized Notification Service.

---

## Phase 9 — Documents

Connect Document Generation Service.

---

## Phase 10 — RPA

Implement:

```text id="q8m3v5"
Legacy Billing Sync
Charge Import
Invoice Sync
Payment Reconciliation
Exception Handling
```

---

## Phase 11 — Reports

Implement billing analytics.

---

## Phase 12 — Testing

Run:

```text id="m5r7n2"
Unit
API
Integration
Payment
Webhook
Concurrency
RPA
Security
End-to-End
```

---

# 124. DO NOT IMPLEMENT

The coding agent MUST NOT implement:

```text id="x7m2q4"
Medical diagnosis
Clinical decision making
Treatment decisions
Insurance approval decisions
Claim approval/rejection
Unauthorized discounts
Unauthorized waivers
Unauthorized refunds
Unverified payment success
Manual gateway bypass
Direct modification of finalized financial history
Duplicate financial records
Independent room inventory
Independent insurance database
```

---

# 125. FINAL ARCHITECTURE

The final Billing architecture must remain:

```text id="q4n8m2"
                 ┌─────────────────────┐
                 │   Service Modules   │
                 └──────────┬──────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
       Pharmacy            Lab             Radiology
          │                 │                  │
          └─────────────────┼──────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    BILLING    │
                    │   Financial   │
                    │   Authority   │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
           Invoice       Payment       Reports
              │             │
              ▼             ▼
          Documents      Gateway
              │
              ▼
         Notifications
```

Billing is the authoritative financial system.

---

# 126. DEFINITION OF DONE

`08_BILLING.md` is fully implemented when:

- [ ] Billable items work.
- [ ] Charge source references work.
- [ ] Rate cards work.
- [ ] Rate versioning works.
- [ ] Accommodation charges use actual Bed Management assignments.
- [ ] Invoice creation works.
- [ ] Invoice finalization works.
- [ ] Invoice numbers are unique.
- [ ] Finalized invoices are protected from direct editing.
- [ ] Deposits work.
- [ ] Insurance coverage integration works.
- [ ] Adjustments require authorization.
- [ ] Payment gateway integration works.
- [ ] Gateway callbacks are verified.
- [ ] Payment idempotency works.
- [ ] Counter payments work.
- [ ] Receipts work.
- [ ] Outstanding balances work.
- [ ] Payment reminders work.
- [ ] Billing queries work.
- [ ] Refund workflow works if enabled.
- [ ] Financial audit logs work.
- [ ] Patient portal billing works.
- [ ] Billing staff portal works.
- [ ] Management reports work.
- [ ] RPA synchronization works.
- [ ] Payment reconciliation works.
- [ ] Exceptions work.
- [ ] RBAC works.
- [ ] Concurrency protection works.
- [ ] End-to-end billing/payment flow passes.

---

# 127. FINAL INSTRUCTION TO THE AI CODING AGENT

Build this as a **production-quality financial subsystem**, not a simple invoice page.

The implementation must provide:

```text id="m8q3v5"
Charge Collection
+
Rate Management
+
Invoice Management
+
Accommodation Billing
+
Deposit Management
+
Insurance Coverage Integration
+
Payment Gateway
+
Counter Payment
+
Receipt Generation
+
Outstanding Balance
+
Billing Queries
+
Authorized Adjustments
+
Refund Workflow
+
Reports
+
Notifications
+
Documents
+
RPA
+
Reconciliation
+
Audit
+
RBAC
```

Most importantly:

> **Billing is the authoritative financial source of truth.**

> **Every invoice item must be traceable to its source service.**

> **Actual assigned accommodation from Bed Management, not requested accommodation preference, drives room billing.**

> **Finalized financial records must never be silently overwritten.**

> **Payment success must be verified by the payment gateway/backend.**

> **RPA must never invent financial values or independently approve discounts, waivers, refunds, or adjustments.**

> **Insurance coverage is not the same as actual payment received.**

> **All financial changes must be auditable and reconstructable.**

> **Patient billing disputes must create requests for authorized Billing staff rather than directly changing financial records.**