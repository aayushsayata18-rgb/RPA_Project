# 17_PHARMACY_MANAGEMENT.md

# Hospital Administrative & RPA Platform
## Module 17 — Pharmacy Management

---

## 1. MODULE PURPOSE

Build a complete **Pharmacy Management module** for the Hospital Administrative & RPA Platform.

The Pharmacy module must manage the complete administrative and operational lifecycle from:

```text
Doctor Prescription
        ↓
Prescription Validation
        ↓
Pharmacy Order
        ↓
Pharmacist Review
        ↓
Stock Availability Check
        ↓
Stock Reservation
        ↓
Medicine Dispensing
        ↓
Billing Integration
        ↓
Patient Notification
        ↓
Dispensing Record
        ↓
Audit / Reporting
```

The module must support both:

1. **Outpatient Pharmacy**
2. **Inpatient Pharmacy**

The module must integrate with:

- Patient Registration
- Appointment Management
- OPD Queue
- Patient Records
- Patient Admission
- Bed Management
- Billing
- Insurance
- Doctor Management
- Staff Management
- Medical Inventory
- Notification Service
- Document Generation
- Reports & Analytics
- Robot Framework RPA

---

# 2. CRITICAL ARCHITECTURAL PRINCIPLE

The MERN application is the **system of record**.

Robot Framework is the **automation worker**.

```text
React Frontend
      ↓
Node.js + Express
      ↓
MongoDB
      ↓
Business Services
      ↓
RPA Job Queue
      ↓
Robot Framework
      ↓
External / Legacy Pharmacy System
```

Robot Framework must NEVER become the pharmacy database.

All important pharmacy transactions must ultimately be stored in MongoDB.

---

# 3. RESPONSIBILITY BOUNDARY

## Pharmacy Management owns

The Pharmacy module owns:

- Medicine master/catalog
- Prescription workflow
- Pharmacy orders
- Pharmacist review
- Dispensing workflow
- Dispensing records
- Pharmacy returns
- Pharmacy-specific operational statuses
- Pharmacy queues
- Pharmacy notifications
- Pharmacy reports
- Pharmacy exceptions

## Medical Inventory owns

The Medical Inventory module (`18_MEDICAL_INVENTORY.md`) is the authoritative owner of:

- Physical stock
- Inventory batches
- Lot numbers
- Stock quantities
- Inventory movements
- Purchase receipts
- Stock adjustments
- Expiry tracking
- Reorder levels
- Warehouse/store inventory
- Stock valuation

Pharmacy MUST NOT create a second independent inventory source of truth.

Instead:

```text
Medical Inventory
       ↓
Stock Availability API
       ↓
Pharmacy
       ↓
Reserve / Issue Stock
       ↓
Medical Inventory
       ↓
Inventory Movement
```

Pharmacy may maintain references to inventory batches used for dispensing, but physical stock quantities must be maintained by Medical Inventory.

---

# 4. CLINICAL SAFETY BOUNDARY

This is a strict requirement.

The system and RPA must NOT make clinical decisions.

The following must remain human/clinician controlled:

- Medicine selection
- Diagnosis
- Dose
- Route
- Frequency
- Duration
- Treatment plan
- Medicine substitution
- Clinical equivalence
- Drug interaction interpretation
- Dose modification
- Prescription modification
- Clinical priority
- Clinical approval

The pharmacist may review a prescription according to hospital policy and professional authority.

RPA may:

- read
- validate
- compare
- synchronize
- check configured administrative rules
- check stock
- reserve stock
- create administrative records
- send notifications
- reconcile data
- generate documents
- update external systems
- verify read-back

RPA must NOT change:

```text
Medicine
Dose
Route
Frequency
Duration
Clinical instructions
```

without an explicit authorized human action.

---

# 5. USERS AND RBAC

## 5.1 Pharmacist

Permissions:

```text
pharmacy.dashboard.view
pharmacy.prescription.view
pharmacy.prescription.validate
pharmacy.order.view
pharmacy.order.process
pharmacy.stock.view
pharmacy.dispense.create
pharmacy.dispense.complete
pharmacy.return.create
pharmacy.return.process
pharmacy.exception.view
pharmacy.report.view
```

A pharmacist cannot modify the clinical content of a prescription.

---

## 5.2 Senior Pharmacist / Pharmacy Manager

Additional permissions:

```text
pharmacy.override.review
pharmacy.return.approve
pharmacy.exception.resolve
pharmacy.controlled_medicine.review
pharmacy.report.export
pharmacy.configuration.manage
```

---

## 5.3 Doctor

Can:

- create prescription
- view prescription
- view prescription status
- cancel prescription according to authorization
- view dispensing status

Cannot:

- dispense medicine
- modify dispensing quantity
- modify stock
- mark medicine as dispensed

---

## 5.4 Nurse

Can:

- view authorized inpatient medication information
- view pharmacy order status

Cannot:

- modify prescription
- dispense medicine
- modify stock

---

## 5.5 Billing Staff

Can:

- view billable pharmacy charges
- view dispensing-linked charges
- reconcile billing

Cannot:

- modify prescription
- dispense medicine
- modify pharmacy stock

---

## 5.6 Inventory Staff

Can manage stock through:

```text
18_MEDICAL_INVENTORY.md
```

Pharmacy consumes inventory APIs.

---

## 5.7 Receptionist

Can:

- view pharmacy order status
- view patient-facing pickup information where authorized

Cannot:

- dispense medicine
- alter prescriptions

---

## 5.8 Patient

Patient Portal can show:

- active prescriptions
- pharmacy order status
- ready-for-pickup status
- dispensing history
- pharmacy documents
- applicable billing information

Sensitive internal pharmacy information must not be exposed.

---

## 5.9 System Administrator

Can:

- configure pharmacy settings
- manage permissions
- manage integration settings
- manage pharmacy configuration

System Admin must not automatically receive unrestricted access to clinical content unless explicitly authorized.

---

# 6. CORE IDENTIFIERS

Use separate identifiers.

```text
Patient ID
Visit ID
Admission ID
Doctor ID
Prescription ID
Pharmacy Order ID
Dispensing Record ID
Return ID
Medicine ID
Inventory Batch ID
Invoice ID
Payment Transaction ID
RPA Job ID
Correlation ID
```

Never use Patient ID as the primary transaction identifier.

---

# 7. MEDICINE MASTER

Create a Medicine Master.

## Medicine fields

```text
medicineId
genericName
brandName
strength
dosageForm
unit
manufacturer
category
barcode
sku
prescriptionRequired
controlledMedicine
storageRequirements
status
description
createdAt
updatedAt
createdBy
updatedBy
```

Example:

```json
{
  "medicineId": "MED-000125",
  "genericName": "Paracetamol",
  "brandName": "Example Brand",
  "strength": "500 mg",
  "dosageForm": "Tablet",
  "unit": "Tablet",
  "manufacturer": "Example Pharma",
  "category": "Analgesic",
  "barcode": "890000000001",
  "sku": "PCM500TAB",
  "prescriptionRequired": true,
  "controlledMedicine": false,
  "status": "ACTIVE"
}
```

---

# 8. MEDICINE STATUS

Supported statuses:

```text
DRAFT
ACTIVE
INACTIVE
DISCONTINUED
PENDING_REVIEW
```

A medicine marked:

```text
INACTIVE
DISCONTINUED
```

must not be newly prescribed/dispensed unless hospital configuration explicitly permits historical processing.

---

# 9. MEDICINE MASTER RULES

## Rule 1 — Unique medicine

Medicine ID must be unique.

## Rule 2 — Duplicate prevention

Prevent duplicate medicines using configurable matching such as:

```text
genericName
strength
dosageForm
manufacturer
```

Potential duplicate → human review.

## Rule 3 — No automatic clinical substitution

If:

```text
Prescribed = Medicine A
Stock unavailable = Medicine B
```

RPA must NOT automatically replace A with B.

The pharmacist/authorized clinician must decide.

---

# 10. PRESCRIPTION

The Doctor creates the prescription.

Prescription belongs to:

```text
Patient
+
Visit
+
Doctor
```

For admitted patients:

```text
Patient
+
Visit
+
Admission
+
Doctor
```

---

# 11. PRESCRIPTION MODEL

Create:

```text
Prescription
```

Fields:

```text
prescriptionId
patientId
visitId
admissionId
doctorId
departmentId
prescriptionDate
items[]
instructions
status
validUntil
createdBy
updatedBy
createdAt
updatedAt
cancelledAt
cancelledBy
cancellationReason
```

---

# 12. PRESCRIPTION ITEM

Each item:

```text
prescriptionItemId
medicineId
medicineNameSnapshot
strengthSnapshot
dosageFormSnapshot
dose
route
frequency
duration
quantity
unit
instructions
refillAllowed
status
```

Example:

```json
{
  "medicineId": "MED-000125",
  "dose": "500 mg",
  "route": "ORAL",
  "frequency": "THREE_TIMES_DAILY",
  "duration": "5 DAYS",
  "quantity": 15,
  "unit": "TABLET"
}
```

The system must preserve snapshots so historical prescriptions remain understandable even if the Medicine Master changes later.

---

# 13. PRESCRIPTION STATUS

Use:

```text
DRAFT
ISSUED
SENT_TO_PHARMACY
UNDER_REVIEW
VALIDATED
PARTIALLY_DISPENSED
DISPENSED
ON_HOLD
CANCELLED
EXPIRED
REJECTED
```

Transitions:

```text
DRAFT
 ↓
ISSUED
 ↓
SENT_TO_PHARMACY
 ↓
UNDER_REVIEW
 ↓
VALIDATED
 ↓
PARTIALLY_DISPENSED
 ↓
DISPENSED
```

Possible branches:

```text
UNDER_REVIEW → ON_HOLD
UNDER_REVIEW → REJECTED
ISSUED → CANCELLED
SENT_TO_PHARMACY → CANCELLED
VALIDATED → CANCELLED
```

---

# 14. PRESCRIPTION VALIDATION

Before processing:

```text
Patient exists?
Visit exists?
Admission exists if inpatient?
Doctor exists?
Doctor authorized?
Prescription valid?
Medicine exists?
Medicine active?
Required fields present?
Quantity valid?
Prescription cancelled?
Prescription expired?
Duplicate processing?
```

If any validation fails:

```text
Do not dispense.
Create ExceptionCase.
Set appropriate status.
Notify authorized user.
```

---

# 15. PHARMACY ORDER

A Pharmacy Order represents the operational pharmacy request generated from a prescription.

Create:

```text
PharmacyOrder
```

Fields:

```text
pharmacyOrderId
prescriptionId
patientId
visitId
admissionId
orderType
priority
items[]
status
requestedAt
receivedAt
processedAt
completedAt
createdBy
updatedBy
```

---

# 16. ORDER TYPES

```text
OUTPATIENT
INPATIENT
EMERGENCY
WARD_STOCK
DISCHARGE_MEDICATION
```

The system must support configurable additional types.

---

# 17. PHARMACY ORDER STATUS

Use:

```text
NEW
RECEIVED
VALIDATING
READY_FOR_DISPENSING
PARTIALLY_FULFILLED
DISPENSED
ON_HOLD
CANCELLED
COMPLETED
```

---

# 18. OUTPATIENT PHARMACY FLOW

```text
Doctor Creates Prescription
        ↓
Prescription Issued
        ↓
Send to Pharmacy
        ↓
Pharmacy Order Created
        ↓
Pharmacist Reviews
        ↓
Check Stock
        ↓
Reserve Stock
        ↓
Prepare Medicine
        ↓
Dispense
        ↓
Create Billing Item
        ↓
Receipt
        ↓
Patient Notification
        ↓
Completed
```

---

# 19. INPATIENT PHARMACY FLOW

For admitted patients:

```text
Doctor Prescription
        ↓
Pharmacy Order
        ↓
Pharmacist Validation
        ↓
Stock Check
        ↓
Stock Reservation
        ↓
Medicine Issue
        ↓
Ward / Patient
        ↓
Dispensing Record
        ↓
Billing Integration
```

The exact administration/clinical medication-administration workflow must remain configurable and must not be invented by RPA.

---

# 20. EMERGENCY PHARMACY FLOW

Emergency prescriptions can be marked:

```text
orderType = EMERGENCY
```

The system may prioritize the operational queue according to configured hospital policy.

RPA must not independently decide clinical urgency.

If an authorized user sets:

```text
priority = URGENT
```

the system may process the order accordingly.

---

# 21. PHARMACY QUEUE

Create Pharmacy Queue UI.

Columns:

```text
Order ID
Patient
Patient ID
Order Type
Doctor
Priority
Requested Time
Status
Stock Status
Action
```

Filters:

```text
Today
Pending
Urgent
Out of Stock
Inpatient
Outpatient
Discharge
On Hold
Completed
```

---

# 22. STOCK AVAILABILITY

Pharmacy must query Medical Inventory.

Example API:

```http
GET /api/inventory/availability?medicineId=MED-000125
```

Response:

```json
{
  "medicineId": "MED-000125",
  "availableQuantity": 150,
  "batches": [
    {
      "batchId": "BAT-10001",
      "availableQuantity": 80,
      "expiryDate": "2027-06-30"
    }
  ]
}
```

---

# 23. STOCK RESERVATION

Before dispensing, reserve required quantity.

Example:

```text
Required = 15
Available = 150

Reserve = 15
Available after reservation = 135
```

Reservation must be concurrency-safe.

Two pharmacists must not be able to reserve the same physical stock.

Use transactional/atomic inventory operations.

---

# 24. FEFO / FIFO

The system must support configurable stock selection policies:

```text
FEFO
FIFO
MANUAL_AUTHORIZED_SELECTION
```

Preferred configuration may be:

```text
FEFO = First Expiry, First Out
```

If the batch-selection rule is configured and unambiguous, RPA may execute it.

If a pharmacist intentionally selects a different batch, record:

```text
selectionMethod
overrideReason
approvedBy
```

Do not silently override the configured policy.

---

# 25. EXPIRED MEDICINE

An expired batch must never be dispensed.

Validation:

```text
expiryDate < currentDate
```

Then:

```text
BLOCK DISPENSING
```

Create:

```text
InventoryAlert
```

and notify authorized inventory/pharmacy staff.

---

# 26. NEAR-EXPIRY MEDICINE

Configure:

```text
nearExpiryDays
```

Example:

```text
30 days
```

If:

```text
expiryDate <= today + nearExpiryDays
```

generate an alert.

Do not automatically discard the stock.

The authorized inventory/pharmacy workflow determines the action.

---

# 27. DISPENSING RECORD

Create:

```text
DispensingRecord
```

Fields:

```text
dispensingRecordId
pharmacyOrderId
prescriptionId
patientId
visitId
admissionId
pharmacistId
items[]
dispensedAt
status
notes
createdAt
updatedAt
```

---

# 28. DISPENSING ITEM

Each item:

```text
medicineId
inventoryBatchId
prescriptionItemId
prescribedQuantity
dispensedQuantity
unit
dispensingStatus
substitution
substitutionReason
approvedBy
```

Possible statuses:

```text
PENDING
PARTIALLY_DISPENSED
DISPENSED
NOT_DISPENSED
RETURNED
```

---

# 29. SUBSTITUTION RULE

Substitution is high-risk.

The system must NOT automatically substitute:

```text
Medicine A → Medicine B
```

If stock is unavailable:

```text
OUT OF STOCK
      ↓
Pharmacist Review
      ↓
Human Decision
      ↓
Authorized Substitution if permitted
      ↓
Record reason
      ↓
Continue
```

Store:

```text
originalMedicineId
substituteMedicineId
reason
approvedBy
approvedAt
```

If clinical authorization is required, require the appropriate authorized clinician.

---

# 30. PARTIAL DISPENSING

If:

```text
Required = 30
Available = 20
```

the system may allow partial dispensing according to configuration.

Example:

```text
Prescribed = 30
Dispensed = 20
Remaining = 10
```

Status:

```text
PARTIALLY_DISPENSED
```

Do not mark the prescription fully dispensed.

Notify the patient/pharmacy staff where configured.

---

# 31. FULL DISPENSING

When all required items have been successfully dispensed:

```text
Prescription = DISPENSED
PharmacyOrder = COMPLETED
```

Store timestamps.

---

# 32. DISPENSING CONFIRMATION

Before final submission, show:

```text
Patient
Prescription
Medicine
Batch
Quantity
Pharmacist
Billing Amount
```

Require confirmation.

For high-risk/controlled medicine configuration, require additional authorization.

---

# 33. CONTROLLED / RESTRICTED MEDICINES

The application must support a configurable:

```text
controlledMedicine
```

flag/category.

Do NOT hard-code country-specific legal rules.

Instead provide configurable hospital policies.

For configured controlled medicines:

```text
Additional pharmacist authorization
Additional audit
Additional documentation
Optional secondary approval
```

RPA must NOT autonomously dispense controlled/restricted medicines.

---

# 34. PHARMACY RETURNS

Create:

```text
PharmacyReturn
```

Supported reasons:

```text
PATIENT_RETURN
WRONG_MEDICINE
WRONG_QUANTITY
DAMAGED
EXPIRED
CANCELLED_ORDER
DISCHARGE_RETURN
OTHER
```

Fields:

```text
returnId
patientId
pharmacyOrderId
dispensingRecordId
items[]
reason
status
requestedBy
approvedBy
processedBy
createdAt
processedAt
```

---

# 35. RETURN STATUS

```text
REQUESTED
UNDER_REVIEW
APPROVED
REJECTED
PROCESSED
QUARANTINED
CANCELLED
```

---

# 36. RETURN TO STOCK RULE

Returned medicine must NOT automatically become saleable stock.

The system must support:

```text
QUARANTINE
RETURN_TO_STOCK
DISPOSE
REJECT
```

according to configured hospital policy and authorized decision.

If a returned item is placed into quarantine:

```text
Stock remains non-saleable
```

until authorized disposition.

---

# 37. BILLING INTEGRATION

Pharmacy must send actual billable dispensing information to Billing.

Preferred flow:

```text
Prescription
     ↓
Dispensing
     ↓
Actual Dispensed Quantity
     ↓
Billing Service
     ↓
Invoice Item
```

The system must avoid double billing.

Use an idempotency key such as:

```text
pharmacyOrderId + dispensingRecordId + prescriptionItemId
```

or another stable configured identifier.

---

# 38. PRESCRIBED VS DISPENSED QUANTITY

The billing system must use the hospital's configured billing policy.

Do not assume:

```text
Prescribed quantity = Billable quantity
```

unless the hospital configuration explicitly says so.

For example:

```text
Prescribed = 30
Dispensed = 20
```

The billing rule may determine whether the charge is:

```text
20
30
or another configured amount
```

The Pharmacy module must pass factual dispensing data.

Billing owns the financial rule.

---

# 39. INSURANCE INTEGRATION

Pharmacy must not determine insurance coverage.

Pharmacy provides:

```text
Medicine
Quantity
Price
Dispensing
Invoice reference
```

Billing/Insurance handles:

```text
Coverage
Patient responsibility
Claim eligibility
Claim submission
Claim settlement
```

---

# 40. PATIENT PORTAL

Add:

```text
/pharmacy
```

under the Patient Portal.

Patient can view:

### Active Prescriptions

```text
Prescription ID
Doctor
Date
Status
```

### Pharmacy Orders

```text
Order ID
Status
Requested Date
Ready for Pickup
```

### Dispensing History

```text
Medicine
Quantity
Date
Pharmacy
```

### Documents

```text
Prescription
Dispensing Receipt
Applicable Pharmacy Documents
```

Do not expose internal audit information.

---

# 41. PATIENT NOTIFICATIONS

Possible notifications:

```text
Prescription received
Prescription requires pharmacy review
Medicine ready
Order partially fulfilled
Order on hold
Medicine unavailable
Dispensing completed
Pickup reminder
Return processed
```

Use the centralized Notification Service.

Channels:

```text
SMS
Email
In-app
```

depending on configuration.

---

# 42. PRIVACY OF NOTIFICATIONS

Do not unnecessarily include sensitive medicine details in SMS.

Prefer:

```text
"Your pharmacy order PO-10023 is ready for pickup."
```

rather than exposing a detailed medication list.

Detailed information can be shown securely in the authenticated portal.

---

# 43. PHARMACY OPERATIONS PORTAL

Route:

```text
/operations/pharmacy
```

Dashboard:

```text
Pending Orders
Ready Orders
Urgent Orders
Partial Orders
Out-of-Stock
On Hold
Returns
Near Expiry
Controlled Medicine Queue
```

---

# 44. PHARMACY SCREENS

Implement:

```text
Pharmacy Dashboard
Medicine Search
Prescription Queue
Prescription Details
Pharmacy Order Queue
Order Details
Stock Availability
Dispensing Screen
Dispensing History
Returns
Return Details
Exception Queue
Alerts
Reports
Configuration
```

---

# 45. MEDICINE SEARCH

Search by:

```text
Medicine ID
Generic Name
Brand Name
SKU
Barcode
Manufacturer
Category
Strength
Dosage Form
```

Results:

```text
Medicine
Strength
Form
Available Stock
Nearest Expiry
Prescription Required
Status
```

Do not expose sensitive inventory details to unauthorized users.

---

# 46. DISPENSING SCREEN

Display:

```text
Patient Information
Prescription Information
Doctor
Visit / Admission
Medicine
Prescribed Quantity
Available Quantity
Batch
Expiry
Quantity to Dispense
Instructions
```

For each item:

```text
[Select Batch]
[Quantity]
[Dispense]
```

System validates before final submission.

---

# 47. BARCODE SUPPORT

Support barcode scanning where hardware is available.

Barcode may identify:

```text
Medicine
Batch
SKU
```

Barcode scanning must still validate the scanned item against the prescription.

Scanning the wrong medicine must produce:

```text
MEDICINE_MISMATCH
```

and block dispensing.

---

# 48. PHARMACY EXCEPTIONS

Create ExceptionCase records for:

```text
PATIENT_NOT_FOUND
PATIENT_MISMATCH
VISIT_NOT_FOUND
ADMISSION_NOT_FOUND
DOCTOR_NOT_FOUND
INVALID_PRESCRIPTION
PRESCRIPTION_EXPIRED
PRESCRIPTION_CANCELLED
MEDICINE_NOT_FOUND
MEDICINE_INACTIVE
INSUFFICIENT_STOCK
EXPIRED_BATCH
DUPLICATE_DISPENSING
BILLING_SYNC_FAILURE
INVENTORY_SYNC_FAILURE
EXTERNAL_SYSTEM_FAILURE
UNKNOWN_DISPENSE_RESULT
CONTROLLED_MEDICINE_APPROVAL_REQUIRED
SUBSTITUTION_REVIEW_REQUIRED
RETURN_REVIEW_REQUIRED
```

---

# 49. EXCEPTION WORKFLOW

```text
Exception Detected
        ↓
Create ExceptionCase
        ↓
Assign Severity
        ↓
Notify Responsible Role
        ↓
Human Review
        ↓
Decision
        ↓
Correct Data / Approve / Reject
        ↓
Resume Workflow
        ↓
Verify
        ↓
Close Exception
```

Never silently ignore exceptions.

---

# 50. DUPLICATE DISPENSING PROTECTION

Before dispensing:

```text
Check prescription item status
Check existing dispensing record
Check order status
Check idempotency key
```

If already successfully dispensed:

```text
BLOCK DUPLICATE
```

Return:

```text
DUPLICATE_DISPENSING
```

---

# 51. RPA RESPONSIBILITIES

Robot Framework can automate:

### Medicine Master Synchronization

```text
External System
      ↓
Read Medicine Data
      ↓
Validate
      ↓
Compare
      ↓
Update Hospital System
      ↓
Verify
      ↓
Log
```

---

# 52. RPA — PRESCRIPTION SYNCHRONIZATION

If a legacy hospital system does not provide an API:

```text
Login
↓
Open Prescription Module
↓
Search Patient
↓
Read Prescription
↓
Validate Data
↓
Send to MERN Backend
↓
Verify API Response
↓
Capture Evidence
↓
Close Session
```

RPA must never modify the prescription's clinical content.

---

# 53. RPA — PHARMACY ORDER SYNC

Example:

```text
MERN Pharmacy Order
        ↓
RPA Queue
        ↓
Open Legacy Pharmacy System
        ↓
Search Patient
        ↓
Create/Update Order
        ↓
Read Back Order Number
        ↓
Compare
        ↓
Update MongoDB
```

---

# 54. RPA — STOCK RECONCILIATION

Where an external pharmacy system provides stock reports:

```text
Download Stock Report
        ↓
Parse File
        ↓
Validate Columns
        ↓
Match Medicine IDs
        ↓
Match Batch IDs
        ↓
Compare Quantities
        ↓
Generate Reconciliation Result
```

Differences must NOT be silently overwritten.

Example:

```text
Hospital Stock = 100
External Stock = 97
Difference = -3
```

Create:

```text
Inventory Reconciliation Exception
```

for human review.

---

# 55. RPA — DISPENSING SYNCHRONIZATION

If dispensing happens in an external legacy system:

```text
Read Dispensing Queue
        ↓
Search Order
        ↓
Read Dispense Result
        ↓
Validate
        ↓
Update MERN
        ↓
Verify
        ↓
Notify
```

Unknown result:

```text
DO NOT RETRY BLINDLY
```

Create exception.

---

# 56. RPA GOLDEN RULE

Every automation follows:

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
AUDIT
```

For ambiguity:

```text
EXCEPTION
 ↓
HUMAN REVIEW
 ↓
AUTHORIZED DECISION
 ↓
RPA CONTINUES
```

---

# 57. ROBOT FRAMEWORK STRUCTURE

Create:

```text
robot/
├── resources/
│   ├── common.resource
│   ├── authentication.resource
│   ├── api.resource
│   ├── pharmacy.resource
│   ├── inventory.resource
│   └── notifications.resource
│
├── keywords/
│   ├── pharmacy_keywords.resource
│   ├── prescription_keywords.resource
│   ├── dispensing_keywords.resource
│   ├── inventory_keywords.resource
│   └── reconciliation_keywords.resource
│
├── tests/
│   ├── pharmacy_order.robot
│   ├── prescription_sync.robot
│   ├── dispensing_sync.robot
│   ├── stock_reconciliation.robot
│   ├── medicine_sync.robot
│   └── pharmacy_exception.robot
│
├── portals/
│   ├── legacy_pharmacy.robot
│   └── legacy_inventory.robot
│
└── results/
```

---

# 58. ROBOT FRAMEWORK KEYWORDS

Create reusable keywords:

```text
Login To Pharmacy System
Search Patient
Read Prescription
Validate Prescription
Search Medicine
Read Stock
Reserve Stock
Create Pharmacy Order
Submit Dispensing
Read Dispensing Result
Verify Dispensing Result
Update Pharmacy Order
Create Exception
Send Pharmacy Notification
Capture Evidence
Logout
```

---

# 59. ROBOT JOB MODEL

Create:

```text
RPAJob
```

Fields:

```text
jobId
jobType
module
referenceId
correlationId
status
priority
attempt
maxAttempts
startedAt
completedAt
errorCode
errorMessage
evidencePath
createdAt
updatedAt
```

Statuses:

```text
QUEUED
RUNNING
SUCCESS
FAILED
RETRY_PENDING
WAITING_HUMAN
CANCELLED
```

---

# 60. RPA RETRY RULE

Retry only technical failures.

Examples:

```text
Network timeout
Temporary browser failure
Temporary API timeout
```

Do NOT automatically retry:

```text
Wrong patient
Invalid prescription
Expired medicine
Insufficient stock
Clinical ambiguity
Unknown dispense result
Authorization failure
```

---

# 61. DATABASE MODELS

Implement at minimum:

```text
Medicine
Prescription
PharmacyOrder
DispensingRecord
PharmacyReturn
PharmacyException
```

Use existing shared:

```text
Patient
Visit
Admission
Doctor
Employee
Invoice
InvoiceItem
Payment
InventoryItem
InventoryBatch
InventoryMovement
InventoryAlert
Notification
NotificationDelivery
Document
AuditEvent
RPAJob
ExceptionCase
```

---

# 62. MEDICINE MONGOOSE MODEL

Example:

```javascript
{
  medicineId: {
    type: String,
    unique: true,
    index: true
  },

  genericName: {
    type: String,
    required: true,
    index: true
  },

  brandName: String,

  strength: String,

  dosageForm: String,

  unit: String,

  manufacturer: String,

  category: String,

  barcode: {
    type: String,
    index: true,
    sparse: true
  },

  sku: {
    type: String,
    index: true
  },

  prescriptionRequired: Boolean,

  controlledMedicine: Boolean,

  storageRequirements: String,

  status: {
    type: String,
    enum: [
      "DRAFT",
      "ACTIVE",
      "INACTIVE",
      "DISCONTINUED",
      "PENDING_REVIEW"
    ]
  }
}
```

---

# 63. PRESCRIPTION MODEL INDEXES

Create indexes:

```text
patientId + prescriptionDate
doctorId + prescriptionDate
visitId
admissionId
status
```

---

# 64. PHARMACY ORDER INDEXES

Create:

```text
pharmacyOrderId UNIQUE
patientId + status
prescriptionId UNIQUE
admissionId + status
requestedAt
orderType + status
```

If multiple pharmacy orders per prescription are allowed by configuration, replace the unique prescription index with an appropriate compound uniqueness rule.

---

# 65. DISPENSING INDEXES

Create:

```text
dispensingRecordId UNIQUE
pharmacyOrderId
prescriptionId
patientId
dispensedAt
pharmacistId
```

---

# 66. RETURN INDEXES

Create:

```text
returnId UNIQUE
patientId
pharmacyOrderId
status
createdAt
```

---

# 67. API DESIGN

Base route:

```text
/api/pharmacy
```

---

## Medicine APIs

```http
GET    /api/pharmacy/medicines
GET    /api/pharmacy/medicines/:medicineId
POST   /api/pharmacy/medicines
PUT    /api/pharmacy/medicines/:medicineId
PATCH  /api/pharmacy/medicines/:medicineId/status
```

---

## Prescription APIs

```http
GET    /api/pharmacy/prescriptions
GET    /api/pharmacy/prescriptions/:id
POST   /api/pharmacy/prescriptions/:id/send
POST   /api/pharmacy/prescriptions/:id/validate
POST   /api/pharmacy/prescriptions/:id/hold
POST   /api/pharmacy/prescriptions/:id/cancel
```

Prescription creation should normally occur through the Doctor/Clinical module.

---

## Pharmacy Order APIs

```http
GET    /api/pharmacy/orders
GET    /api/pharmacy/orders/:id
POST   /api/pharmacy/orders/:id/receive
POST   /api/pharmacy/orders/:id/validate
POST   /api/pharmacy/orders/:id/hold
POST   /api/pharmacy/orders/:id/cancel
```

---

## Stock APIs

```http
GET /api/pharmacy/availability/:medicineId
POST /api/pharmacy/orders/:id/reserve
DELETE /api/pharmacy/orders/:id/reservation
```

Actual stock mutation must call Medical Inventory services.

---

## Dispensing APIs

```http
POST /api/pharmacy/dispensing
GET  /api/pharmacy/dispensing
GET  /api/pharmacy/dispensing/:id
POST /api/pharmacy/dispensing/:id/complete
```

---

## Return APIs

```http
POST /api/pharmacy/returns
GET  /api/pharmacy/returns
GET  /api/pharmacy/returns/:id
POST /api/pharmacy/returns/:id/approve
POST /api/pharmacy/returns/:id/process
POST /api/pharmacy/returns/:id/reject
```

---

## Reports

```http
GET /api/pharmacy/reports/dispensing
GET /api/pharmacy/reports/orders
GET /api/pharmacy/reports/out-of-stock
GET /api/pharmacy/reports/near-expiry
GET /api/pharmacy/reports/returns
GET /api/pharmacy/reports/reconciliation
```

---

# 68. BACKEND STRUCTURE

Implement:

```text
server/
├── models/
│   ├── Medicine.js
│   ├── Prescription.js
│   ├── PharmacyOrder.js
│   ├── DispensingRecord.js
│   └── PharmacyReturn.js
│
├── controllers/
│   ├── pharmacyMedicineController.js
│   ├── prescriptionController.js
│   ├── pharmacyOrderController.js
│   ├── dispensingController.js
│   └── pharmacyReturnController.js
│
├── services/
│   ├── pharmacy/
│   │   ├── medicineService.js
│   │   ├── prescriptionService.js
│   │   ├── pharmacyOrderService.js
│   │   ├── dispensingService.js
│   │   ├── returnService.js
│   │   ├── stockAvailabilityService.js
│   │   └── pharmacyBillingService.js
│
├── validators/
│   └── pharmacy/
│
└── routes/
    └── pharmacyRoutes.js
```

---

# 69. FRONTEND STRUCTURE

Create:

```text
client/src/portals/operations/pharmacy/
├── pages/
│   ├── PharmacyDashboard.jsx
│   ├── PrescriptionQueue.jsx
│   ├── PrescriptionDetails.jsx
│   ├── PharmacyOrderQueue.jsx
│   ├── PharmacyOrderDetails.jsx
│   ├── DispensingScreen.jsx
│   ├── DispensingHistory.jsx
│   ├── PharmacyReturns.jsx
│   ├── PharmacyAlerts.jsx
│   └── PharmacyReports.jsx
│
├── components/
│   ├── PrescriptionCard.jsx
│   ├── PharmacyOrderTable.jsx
│   ├── StockAvailability.jsx
│   ├── BatchSelector.jsx
│   ├── DispensingForm.jsx
│   ├── ReturnForm.jsx
│   └── PharmacyStatusBadge.jsx
│
└── services/
    └── pharmacyService.js
```

Patient portal:

```text
client/src/portals/patient/pharmacy/
├── PharmacyOrders.jsx
├── PrescriptionHistory.jsx
├── DispensingHistory.jsx
└── PharmacyDocuments.jsx
```

---

# 70. VALIDATION RULES

Validate:

```text
Patient ID
Visit ID
Admission ID
Prescription ID
Medicine ID
Doctor ID
Quantity
Batch
Expiry
Pharmacist
Status
```

Examples:

```text
quantity > 0
```

```text
expiryDate > currentDate
```

```text
dispensedQuantity <= availableQuantity
```

unless authorized partial/alternative workflow applies.

---

# 71. PRESCRIPTION EXPIRY

Prescription expiry must be configurable.

Do not hard-code a universal validity period.

Configuration example:

```text
prescriptionValidityDays
```

If expired:

```text
EXPIRED
```

and dispensing must be blocked unless an authorized process explicitly renews/reissues it.

---

# 72. AUDIT LOGGING

Every important pharmacy action must create:

```text
AuditEvent
```

Examples:

```text
MEDICINE_CREATED
MEDICINE_UPDATED
PRESCRIPTION_RECEIVED
PRESCRIPTION_VALIDATED
PRESCRIPTION_HELD
PRESCRIPTION_CANCELLED
ORDER_CREATED
ORDER_VALIDATED
STOCK_RESERVED
DISPENSING_STARTED
DISPENSING_COMPLETED
DISPENSING_CANCELLED
SUBSTITUTION_APPROVED
RETURN_CREATED
RETURN_APPROVED
RETURN_PROCESSED
EXCEPTION_CREATED
EXCEPTION_RESOLVED
```

Store:

```text
actorId
actorRole
action
entityType
entityId
before
after
timestamp
ipAddress
correlationId
```

Sensitive data should be minimized in logs.

---

# 73. SECURITY

Implement:

```text
JWT authentication
RBAC
Backend authorization
Input validation
Rate limiting
Audit logging
Secure API access
Encrypted secrets
HTTPS in production
Secure RPA credentials
Session timeout
```

Do not store external pharmacy credentials in:

```text
source code
MongoDB plaintext
frontend
Robot source files
```

Use environment/secret management.

---

# 74. DATA PRIVACY

Patient information is sensitive.

Only authorized roles can access:

```text
Patient identity
Prescription
Dispensing
Pharmacy history
```

Do not return entire patient objects unnecessarily.

Use DTOs/selective fields.

---

# 75. DOCUMENT GENERATION

Integrate with:

```text
27_DOCUMENT_GENERATION.md
```

Documents may include:

```text
Prescription Copy
Dispensing Receipt
Pharmacy Return Record
Medicine Issue Report
Pharmacy Reconciliation Report
```

Clinical documents must preserve the content entered/approved by authorized clinicians.

---

# 76. NOTIFICATION SERVICE INTEGRATION

Use:

```text
26_NOTIFICATION_SERVICE.md
```

Do not implement a separate SMS/email engine inside Pharmacy.

Pharmacy should call:

```text
NotificationService.send(...)
```

Track:

```text
Notification
NotificationDelivery
```

---

# 77. REPORTS

Provide:

### Operational

```text
Orders Today
Dispensed Today
Pending Orders
Partial Orders
On Hold
```

### Inventory-related

```text
Out of Stock
Near Expiry
Stock Reconciliation Exceptions
```

### Dispensing

```text
Medicine-wise Dispensing
Pharmacist-wise Dispensing
Patient-wise Dispensing
Doctor-wise Prescription Volume
```

### Returns

```text
Return Count
Return Reasons
Pending Returns
Processed Returns
```

### RPA

```text
RPA Jobs
Success Rate
Failure Rate
Exceptions
Average Processing Time
```

---

# 78. PHARMACY DASHBOARD KPIs

Show:

```text
Today's Orders
Pending Orders
Completed Orders
Partial Fulfillment
Out-of-Stock Items
Near-Expiry Items
Pending Returns
RPA Failures
Exceptions
```

Use interactive charts where appropriate.

Do not use static chart images.

---

# 79. SEARCH AND FILTERING

Support:

```text
Patient ID
Patient Name
Prescription ID
Order ID
Medicine
Doctor
Status
Date
Order Type
Priority
```

Use server-side pagination.

Do not load thousands of records unnecessarily into the browser.

---

# 80. CONCURRENCY CONTROL

Critical operations must be atomic.

Especially:

```text
Stock Reservation
Dispensing
Return Processing
Billing Creation
```

Example:

Two pharmacists attempt:

```text
Medicine Stock = 10
Pharmacist A requests = 8
Pharmacist B requests = 5
```

The system must prevent both from successfully reserving:

```text
8 + 5 = 13
```

when only 10 are available.

---

# 81. IDEMPOTENCY

External and RPA operations must support idempotency.

Example:

```text
dispensingRequestId
```

If the same request is received twice:

```text
First request → SUCCESS
Second request → return existing result
```

Do not create duplicate dispensing records.

---

# 82. EXTERNAL SYSTEM FAILURE

If an external pharmacy system is unavailable:

```text
Create RPAJob
status = FAILED
```

then:

```text
Create ExceptionCase
```

Notify authorized staff.

Do not falsely mark the order:

```text
COMPLETED
```

---

# 83. UNKNOWN EXTERNAL RESULT

Example:

```text
RPA submits dispensing
↓
Browser crashes
↓
Cannot determine whether external system accepted it
```

Do NOT blindly resubmit.

Set:

```text
UNKNOWN_DISPENSE_RESULT
```

and require reconciliation.

---

# 84. OFFLINE / MANUAL FALLBACK

If hospital policy permits manual processing during system outage:

```text
Manual Processing
      ↓
Record Temporary Reference
      ↓
System Restored
      ↓
Reconciliation
      ↓
Authorized Verification
      ↓
Final MongoDB Record
```

Do not silently merge duplicate transactions.

---

# 85. SEED DATA

Create realistic demo data.

Example medicines:

```text
MED-000001 Paracetamol 500 mg Tablet
MED-000002 Amoxicillin 500 mg Capsule
MED-000003 Omeprazole 20 mg Capsule
MED-000004 Cetirizine 10 mg Tablet
MED-000005 Azithromycin 500 mg Tablet
```

Create multiple manufacturers and dosage forms.

Create:

```text
20+ medicines
50+ prescriptions
50+ pharmacy orders
multiple dispensing records
multiple patients
multiple doctors
multiple batches
```

Do not create only one sample record.

---

# 86. DEMO SCENARIO — OUTPATIENT

Patient:

```text
Patient ID: P10045
Visit ID: V20031
```

Doctor creates:

```text
Prescription ID: RX30015
```

Medicine:

```text
Paracetamol 500 mg
Quantity: 15
```

Flow:

```text
Doctor Issues Prescription
        ↓
Pharmacy Order PO40021
        ↓
Pharmacist Validates
        ↓
Stock = 100
        ↓
Reserve = 15
        ↓
Dispense = 15
        ↓
Dispensing Record
        ↓
Billing Item
        ↓
Patient Notification
        ↓
Completed
```

---

# 87. DEMO SCENARIO — PARTIAL STOCK

Prescription:

```text
Required = 30
```

Inventory:

```text
Available = 20
```

Result:

```text
Partial Fulfillment Allowed
```

Store:

```text
Prescribed = 30
Dispensed = 20
Remaining = 10
```

Status:

```text
PARTIALLY_FULFILLED
```

Notify pharmacy staff/patient according to configuration.

---

# 88. DEMO SCENARIO — OUT OF STOCK

Prescription:

```text
Medicine A
Quantity = 10
```

Inventory:

```text
Available = 0
```

System:

```text
ON_HOLD
```

Do NOT automatically select another medicine.

Create:

```text
INSUFFICIENT_STOCK
```

Notify pharmacist.

---

# 89. DEMO SCENARIO — EXPIRED BATCH

Batch:

```text
BAT-10015
Expiry = Past Date
```

Attempt dispensing.

System:

```text
BLOCK
```

Create:

```text
EXPIRED_BATCH
```

Do not allow dispensing.

---

# 90. DEMO SCENARIO — WRONG MEDICINE BARCODE

Prescription:

```text
MED-000001
```

Scanned:

```text
MED-000009
```

System:

```text
MEDICINE_MISMATCH
```

Display:

```text
Scanned medicine does not match the prescription item.
```

Block completion.

---

# 91. DEMO SCENARIO — DUPLICATE DISPENSING

Existing:

```text
Dispensing Record = COMPLETED
```

Same request submitted again.

System:

```text
BLOCK
```

Return existing transaction/idempotency result.

Do not create duplicate billing.

---

# 92. TESTING

Implement unit tests for:

```text
Medicine validation
Prescription validation
Prescription expiry
Stock availability
Stock reservation
FEFO selection
Expired batch blocking
Partial dispensing
Full dispensing
Duplicate dispensing
Billing integration
Return validation
RPA job creation
Exception creation
Notification creation
```

---

# 93. API TESTS

Test:

```text
POST /prescriptions
GET /prescriptions
POST /prescriptions/:id/validate

GET /orders
POST /orders/:id/receive

GET /availability/:medicineId

POST /dispensing
POST /dispensing/:id/complete

POST /returns
POST /returns/:id/approve
POST /returns/:id/process
```

Test:

```text
401
403
404
409
422
500
```

where applicable.

---

# 94. RBAC TESTING

Verify:

```text
Doctor → can create prescription
Doctor → cannot dispense

Pharmacist → can dispense
Pharmacist → cannot modify clinical prescription

Billing Staff → can view pharmacy charges
Billing Staff → cannot dispense

Inventory Staff → can manage stock
Inventory Staff → cannot alter prescriptions

Patient → can view own pharmacy information only
```

---

# 95. RPA TESTING

Robot Framework tests must include:

### Successful flow

```text
Read Prescription
→ Create Order
→ Validate
→ Dispense
→ Verify
→ Update
```

### Failure flow

```text
External system unavailable
→ RPA fails
→ RPAJob FAILED
→ ExceptionCase created
→ Notification sent
```

### Unknown result

```text
Submit
→ Browser failure
→ Unknown result
→ Human reconciliation
```

---

# 96. ACCEPTANCE CRITERIA

The module is accepted only if:

- Medicine master works.
- Duplicate medicine detection works.
- Doctors can issue prescriptions.
- Prescriptions reach pharmacy.
- Pharmacists can validate prescriptions.
- Pharmacy orders are created.
- Stock availability comes from Medical Inventory.
- Stock reservations are concurrency-safe.
- Expired batches cannot be dispensed.
- Partial dispensing works.
- Full dispensing works.
- Duplicate dispensing is blocked.
- Substitution requires authorized human action.
- Controlled medicine workflow supports additional authorization.
- Returns work.
- Returned stock is not automatically treated as saleable.
- Pharmacy billing integration works.
- Insurance does not get incorrectly decided by Pharmacy.
- Patient receives appropriate notifications.
- Patient can view pharmacy order status.
- Audit events are recorded.
- Exceptions are created and resolved.
- RPA jobs are traceable.
- RPA failures do not corrupt pharmacy records.
- Unknown external results require reconciliation.
- RBAC is enforced server-side.
- Sensitive patient data is protected.
- Reports work.
- Seed data works.
- Unit/API/RPA tests pass.

---

# 97. IMPLEMENTATION ORDER FOR AI CODING AGENT

Implement in this exact order.

## Step 1 — Shared Dependencies

Verify existing:

```text
Patient
Visit
Admission
Doctor
Employee
Billing
Inventory
Notification
Audit
RPA
Exception
```

Do not duplicate them.

---

## Step 2 — Medicine Master

Implement:

```text
Medicine model
API
Validation
UI
RBAC
Audit
```

---

## Step 3 — Prescription Integration

Connect Doctor/Clinical module to Pharmacy.

Implement:

```text
Prescription
PrescriptionItem
Prescription status
```

---

## Step 4 — Pharmacy Orders

Implement:

```text
PharmacyOrder
Queue
Statuses
Validation
```

---

## Step 5 — Inventory Integration

Connect to:

```text
18_MEDICAL_INVENTORY.md
```

Implement:

```text
Availability
Reservation
Batch selection
Expiry validation
```

---

## Step 6 — Dispensing

Implement:

```text
DispensingRecord
DispensingItem
Partial dispensing
Full dispensing
Duplicate protection
```

---

## Step 7 — Returns

Implement:

```text
PharmacyReturn
Approval
Processing
Quarantine workflow
```

---

## Step 8 — Billing

Connect actual dispensing information to Billing.

Implement:

```text
Invoice item creation
Idempotency
Billing reconciliation
```

---

## Step 9 — Notifications

Connect to centralized Notification Service.

---

## Step 10 — Patient Portal

Implement:

```text
Prescription status
Order status
Dispensing history
Documents
```

---

## Step 11 — RPA

Implement:

```text
RPAJob
Prescription sync
Order sync
Stock reconciliation
Dispensing sync
Exception handling
```

---

## Step 12 — Reports

Implement:

```text
Dashboard
Dispensing reports
Order reports
Return reports
Stock exception reports
RPA reports
```

---

## Step 13 — Security

Verify:

```text
JWT
RBAC
Authorization
Audit
Secret management
Sensitive data protection
```

---

## Step 14 — Testing

Run:

```text
Unit tests
API tests
Integration tests
RBAC tests
RPA tests
End-to-end tests
```

---

# 98. DO NOT IMPLEMENT

The AI coding agent must NOT implement:

```text
Automatic diagnosis
Automatic medicine selection
Automatic medicine substitution
Automatic dose modification
Automatic clinical recommendation
Automatic treatment decisions
Automatic insurance approval
Automatic claim approval
Automatic financial adjustment
Automatic controlled-medicine authorization
Automatic clinical priority
```

Do not create fake clinical intelligence.

---

# 99. FINAL END-TO-END PHARMACY WORKFLOW

The completed module should support:

```text
PATIENT
   ↓
VISIT / ADMISSION
   ↓
DOCTOR
   ↓
PRESCRIPTION
   ↓
PHARMACY ORDER
   ↓
PHARMACIST REVIEW
   ↓
VALIDATION
   ↓
INVENTORY AVAILABILITY
   ↓
STOCK RESERVATION
   ↓
BATCH / EXPIRY VALIDATION
   ↓
DISPENSING
   ↓
DISPENSING RECORD
   ↓
BILLING
   ↓
INSURANCE / PATIENT RESPONSIBILITY
   ↓
PAYMENT
   ↓
NOTIFICATION
   ↓
DOCUMENT
   ↓
AUDIT
   ↓
REPORTING
```

---

# 100. FINAL AI CODING AGENT INSTRUCTION

You are implementing **Module 17 — Pharmacy Management** inside an existing Hospital Administrative & RPA Platform.

Do not treat this document as a conceptual description.

Treat it as an **implementation specification**.

Before coding:

1. Inspect the existing repository.
2. Identify already implemented shared entities.
3. Reuse existing authentication and RBAC.
4. Reuse existing Patient, Visit, Admission, Doctor, Employee, Billing, Inventory, Notification, Audit, Exception and RPA infrastructure.
5. Do not duplicate shared models.
6. Preserve existing API conventions.
7. Preserve existing UI design system.
8. Preserve existing folder architecture.
9. Do not break existing modules.
10. Add Pharmacy functionality incrementally.

Implement:

```text
Database
↓
Backend Models
↓
Services
↓
Controllers
↓
Routes
↓
Validation
↓
RBAC
↓
Frontend Pages
↓
Frontend Components
↓
API Integration
↓
Notifications
↓
Documents
↓
RPA
↓
Audit
↓
Reports
↓
Tests
```

Every important operation must be:

```text
Validated
Authorized
Audited
Idempotent where required
Exception-safe
Traceable
```

The final implementation must be a **fully functional pharmacy management module**, not a mock UI or static prototype.

All clinical decisions remain with authorized human professionals.

All physical inventory truth remains with the Medical Inventory module.

All financial rules remain with Billing.

All insurance decisions remain with Insurance.

All external browser automation remains with Robot Framework.

The MERN application remains the system of record.