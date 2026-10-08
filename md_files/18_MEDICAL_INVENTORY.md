# 18_MEDICAL_INVENTORY.md

# Hospital Administrative & RPA Platform
## Module 18 — Medical Inventory Management

---

# 1. MODULE PURPOSE

Build a complete **Medical Inventory Management module** for the Hospital Administrative & RPA Platform.

The module must manage the hospital's physical medical inventory lifecycle:

```text
Medicine / Medical Item Master
        ↓
Procurement
        ↓
Purchase Order
        ↓
Goods Receipt
        ↓
Batch / Lot Registration
        ↓
Stock Availability
        ↓
Storage / Location
        ↓
Stock Issue
        ↓
Pharmacy / Department Consumption
        ↓
Returns / Transfers
        ↓
Stock Adjustment
        ↓
Expiry Monitoring
        ↓
Reorder Alerts
        ↓
Inventory Reports
        ↓
Audit / Reconciliation
```

The module must support:

- Medicine inventory
- Medical consumables
- Surgical supplies
- Laboratory consumables
- Radiology consumables
- General clinical supplies
- Batch/lot tracking
- Expiry tracking
- Stock movements
- Stock transfers
- Stock reservations
- Stock issues
- Returns
- Stock adjustments
- Reconciliation
- Low-stock alerts
- Near-expiry alerts
- Inventory reporting
- Procurement integration
- Pharmacy integration
- RPA automation

---

# 2. CRITICAL ARCHITECTURAL PRINCIPLE

The **Medical Inventory module is the authoritative source of truth for physical stock**.

Other modules must not maintain independent stock quantities.

```text
                    ┌────────────────────┐
                    │ Medical Inventory   │
                    │ SYSTEM OF RECORD    │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ↓                   ↓                   ↓
      Pharmacy             Laboratory          Radiology
          ↓                   ↓                   ↓
      Dispensing           Consumption          Usage
```

Pharmacy may request/reserve/issue inventory, but inventory quantities are maintained here.

---

# 3. SYSTEM RESPONSIBILITY

## Medical Inventory owns

- Inventory item master
- Stock locations
- Inventory batches
- Stock quantities
- Available quantity
- Reserved quantity
- Quarantined quantity
- Damaged quantity
- Expired quantity
- Inventory movements
- Stock transfers
- Stock adjustments
- Stock reconciliation
- Low-stock alerts
- Expiry alerts
- Inventory audit trail

## Procurement owns

Procurement owns:

- Purchase requests
- Quotations
- Purchase orders
- Supplier selection workflow
- Procurement approvals

See:

```text
19_PROCUREMENT.md
```

## Vendor Management owns

Vendor master and vendor relationship information belongs to:

```text
20_VENDOR_MANAGEMENT.md
```

## Pharmacy owns

Pharmacy owns:

- Prescription
- Pharmacy order
- Dispensing
- Pharmacy return workflow

See:

```text
17_PHARMACY_MANAGEMENT.md
```

---

# 4. INVENTORY CATEGORIES

The system must support configurable categories.

Example:

```text
MEDICINE
SURGICAL_SUPPLY
MEDICAL_CONSUMABLE
LAB_CONSUMABLE
RADIOLOGY_CONSUMABLE
PPE
DISINFECTANT
GENERAL_CLINICAL_SUPPLY
OTHER
```

Do not hard-code categories that cannot be changed by authorized administrators.

---

# 5. INVENTORY ITEM VS BATCH

These are separate concepts.

## Inventory Item

Represents the catalog/master item.

Example:

```text
Paracetamol 500 mg Tablet
```

## Inventory Batch

Represents a physical batch/lot.

Example:

```text
Paracetamol 500 mg
Batch: PCM-2026-A01
Expiry: 2028-04-30
Quantity: 1000
```

Therefore:

```text
InventoryItem
      │
      ├── Batch A
      ├── Batch B
      └── Batch C
```

Never store all physical batch information directly inside the item master.

---

# 6. CORE IDENTIFIERS

Use separate IDs.

```text
Inventory Item ID
Batch ID
Stock Location ID
Stock Movement ID
Reservation ID
Transfer ID
Adjustment ID
Reconciliation ID
Purchase Order ID
Goods Receipt ID
RPA Job ID
Correlation ID
```

Examples:

```text
INV-000125
BAT-2026-000341
LOC-MAIN-001
MOV-000982
RES-000112
TRF-000041
ADJ-000018
REC-000009
```

IDs must be generated safely and must be unique.

---

# 7. INVENTORY ITEM MASTER

Create:

```text
InventoryItem
```

Fields:

```text
inventoryItemId
itemType
medicineId
name
genericName
brandName
description
category
subcategory
unitOfMeasure
packSize
manufacturer
supplierReferences[]
barcode
sku
reorderLevel
reorderQuantity
minimumStock
maximumStock
prescriptionRequired
controlledItem
storageRequirements
temperatureRequirement
status
createdAt
updatedAt
createdBy
updatedBy
```

---

# 8. MEDICINE INTEGRATION

If an inventory item represents a medicine:

```text
itemType = MEDICINE
```

and:

```text
medicineId = MED-000125
```

The Pharmacy Medicine Master remains authoritative for pharmacy-specific medicine information.

Inventory must reference it rather than create an unrelated medicine.

---

# 9. INVENTORY ITEM STATUS

Use:

```text
DRAFT
ACTIVE
INACTIVE
DISCONTINUED
PENDING_REVIEW
```

Inactive items cannot receive new stock unless explicitly authorized.

---

# 10. UNIT OF MEASURE

Support configurable units:

```text
TABLET
CAPSULE
BOTTLE
VIAL
AMPOULE
BOX
PACK
PIECE
ML
LITRE
GRAM
KILOGRAM
PAIR
ROLL
UNIT
```

The system must not assume that every item is measured in pieces.

---

# 11. PACK SIZE

Support:

```text
packSize
packUnit
baseUnit
conversionFactor
```

Example:

```text
1 Box = 100 Tablets
```

The system may store:

```text
purchaseUnit = BOX
baseUnit = TABLET
conversionFactor = 100
```

All stock calculations must use a consistent base unit.

---

# 12. STOCK LOCATIONS

Create:

```text
StockLocation
```

Examples:

```text
MAIN_STORE
PHARMACY_STORE
EMERGENCY_STORE
OT_STORE
LAB_STORE
RADIOLOGY_STORE
WARD_STORE
ICU_STORE
```

A location can contain multiple items and batches.

---

# 13. STOCK LOCATION MODEL

Fields:

```text
locationId
locationCode
locationName
locationType
departmentId
parentLocationId
address
temperatureControlled
securityLevel
status
createdAt
updatedAt
```

---

# 14. LOCATION HIERARCHY

Support:

```text
Hospital
 └── Main Medical Store
      ├── Medicine Section
      ├── Consumables Section
      └── Surgical Section
```

Another example:

```text
Hospital
 └── Pharmacy
      ├── General
      ├── Refrigerated
      └── Controlled Storage
```

Use `parentLocationId`.

---

# 15. INVENTORY BATCH

Create:

```text
InventoryBatch
```

Fields:

```text
batchId
inventoryItemId
batchNumber
lotNumber
manufacturer
manufacturingDate
expiryDate
receivedDate
purchaseOrderId
goodsReceiptId
supplierId
locationId
unitCost
sellingPrice
receivedQuantity
availableQuantity
reservedQuantity
quarantinedQuantity
damagedQuantity
expiredQuantity
status
createdAt
updatedAt
```

---

# 16. BATCH STATUS

Use:

```text
RECEIVED
AVAILABLE
RESERVED
PARTIALLY_RESERVED
QUARANTINED
EXPIRED
DAMAGED
DEPLETED
BLOCKED
```

---

# 17. AVAILABLE STOCK CALCULATION

Do not treat total physical quantity as available quantity.

Conceptually:

```text
Available Quantity
=
Physical Quantity
-
Reserved Quantity
-
Quarantined Quantity
-
Damaged Quantity
-
Expired Quantity
```

However, implement this using the chosen inventory accounting model consistently rather than maintaining conflicting calculated values.

---

# 18. INVENTORY QUANTITY MODEL

At minimum track:

```text
onHandQuantity
availableQuantity
reservedQuantity
quarantinedQuantity
damagedQuantity
expiredQuantity
```

Example:

```text
On Hand = 100
Reserved = 20
Quarantined = 5
Damaged = 2
Expired = 3

Available = 70
```

---

# 19. STOCK MOVEMENT

Every physical stock change must generate:

```text
InventoryMovement
```

Never silently modify quantity.

Movement types:

```text
RECEIPT
ISSUE
RESERVATION
RELEASE_RESERVATION
TRANSFER_OUT
TRANSFER_IN
RETURN
ADJUSTMENT_IN
ADJUSTMENT_OUT
DAMAGE
EXPIRY
QUARANTINE
UNQUARANTINE
DISPOSAL
CONSUMPTION
```

---

# 20. INVENTORY MOVEMENT MODEL

Fields:

```text
movementId
inventoryItemId
batchId
sourceLocationId
destinationLocationId
movementType
quantity
unit
referenceType
referenceId
reason
performedBy
approvedBy
correlationId
timestamp
```

---

# 21. INVENTORY LEDGER PRINCIPLE

Inventory movement history must be append-only from the business perspective.

Do not delete historical movement records.

If an incorrect movement occurred:

```text
Incorrect Movement
      ↓
Correction / Reversal
      ↓
New Movement
```

Do not edit history invisibly.

---

# 22. GOODS RECEIPT INTEGRATION

Procurement creates Purchase Orders.

Inventory receives goods.

Flow:

```text
Purchase Order
      ↓
Supplier Delivery
      ↓
Goods Receipt
      ↓
Quantity Verification
      ↓
Batch Verification
      ↓
Expiry Verification
      ↓
Quality/Acceptance Check
      ↓
Stock Entry
```

---

# 23. GOODS RECEIPT

Create/use:

```text
GoodsReceipt
GoodsReceiptItem
```

Fields:

```text
goodsReceiptId
purchaseOrderId
vendorId
receivedDate
receivedBy
status
items[]
documents[]
notes
```

---

# 24. GOODS RECEIPT ITEM

Fields:

```text
inventoryItemId
orderedQuantity
receivedQuantity
acceptedQuantity
rejectedQuantity
batchNumber
lotNumber
manufacturingDate
expiryDate
unitCost
locationId
inspectionStatus
rejectionReason
```

---

# 25. RECEIVING WORKFLOW

```text
Purchase Order
      ↓
Goods Arrive
      ↓
Inventory Staff Opens GRN
      ↓
Scan / Enter Items
      ↓
Compare PO Quantity
      ↓
Enter Batch / Lot
      ↓
Enter Expiry
      ↓
Quality / Acceptance
      ↓
Accept / Reject / Partial
      ↓
Create Inventory Batch
      ↓
Create RECEIPT Movement
      ↓
Update Stock
      ↓
Audit
```

---

# 26. OVER-RECEIPT

Example:

```text
PO Quantity = 100
Received = 120
```

Do not silently accept 120.

Apply configured policy:

```text
Allowed tolerance
Human approval
Partial acceptance
Reject excess
```

If outside configured tolerance:

```text
Create ExceptionCase
```

---

# 27. UNDER-RECEIPT

Example:

```text
PO = 100
Received = 80
```

Allow partial receipt if procurement policy permits.

Store:

```text
Ordered = 100
Received = 80
Pending = 20
```

Do not mark PO fully received.

---

# 28. BATCH TRACKING

For batch-tracked items, batch number is mandatory.

Validation:

```text
batchNumber != null
```

For non-batch-tracked items, batch can be optional based on item configuration.

Do not force batch numbers onto every item if the hospital does not require them.

---

# 29. EXPIRY TRACKING

For expiry-tracked items:

```text
expiryDate
```

is mandatory.

Validate:

```text
expiryDate >= receivedDate
```

where appropriate.

If expiry is invalid:

```text
BLOCK RECEIPT
```

and create an exception.

---

# 30. EXPIRED STOCK

Expired stock must not be available for issue.

System must automatically identify:

```text
expiryDate < currentDate
```

and transition stock to:

```text
EXPIRED
```

or create a pending expiry-review state if the hospital requires human verification first.

No expired stock may be issued.

---

# 31. NEAR-EXPIRY ALERTS

Configuration:

```text
nearExpiryDays = 30
```

Example:

```text
Today = 2026-10-07
Expiry = 2026-10-25
```

If configured threshold is 30:

```text
NEAR_EXPIRY
```

Generate:

```text
InventoryAlert
```

Do not automatically dispose of stock.

---

# 32. LOW-STOCK ALERT

Each item may have:

```text
minimumStock
reorderLevel
reorderQuantity
maximumStock
```

Example:

```text
Current = 80
Reorder Level = 100
```

Generate:

```text
LOW_STOCK
```

---

# 33. REORDER ALERT

When:

```text
availableQuantity <= reorderLevel
```

create:

```text
InventoryAlert
```

The alert may be consumed by Procurement.

Inventory must not autonomously create and approve a purchase order.

---

# 34. ALERT STATUS

Use:

```text
OPEN
ACKNOWLEDGED
IN_PROGRESS
RESOLVED
DISMISSED
```

---

# 35. INVENTORY RESERVATION

Reservations are necessary for:

- Pharmacy dispensing
- Ward issue
- Scheduled procedure
- Laboratory requirement
- Radiology requirement
- Other approved workflows

Create:

```text
InventoryReservation
```

Fields:

```text
reservationId
inventoryItemId
batchId
locationId
quantity
reservedForType
reservedForId
status
reservedAt
expiresAt
releasedAt
createdBy
```

---

# 36. RESERVATION STATUS

```text
ACTIVE
PARTIALLY_CONSUMED
CONSUMED
RELEASED
EXPIRED
CANCELLED
```

---

# 37. RESERVATION RULE

Example:

```text
Available = 100
Reservation A = 60
```

Available becomes:

```text
40
```

Another request:

```text
Request = 50
```

must fail or enter an appropriate pending/partial state.

Do not allow:

```text
40 available
50 reserved
```

without an explicit configured workflow.

---

# 38. RESERVATION EXPIRY

Reservations may have:

```text
expiresAt
```

When expired:

```text
ACTIVE
 ↓
EXPIRED
 ↓
Release quantity
```

The release must create the appropriate inventory movement/audit event.

---

# 39. PHARMACY INTEGRATION

Pharmacy requests stock through APIs.

Example:

```http
GET /api/inventory/availability/:inventoryItemId
```

Reservation:

```http
POST /api/inventory/reservations
```

Issue:

```http
POST /api/inventory/issues
```

Release:

```http
POST /api/inventory/reservations/:id/release
```

---

# 40. PHARMACY ISSUE FLOW

```text
Pharmacy Order
      ↓
Check Availability
      ↓
Reserve
      ↓
Dispense
      ↓
Confirm Issue
      ↓
Inventory ISSUE movement
      ↓
Reduce Stock
      ↓
Dispensing Record
```

Do not reduce stock merely because a prescription was created.

Stock should be changed according to the configured reservation/issue workflow.

---

# 41. PHARMACY RETURN

When Pharmacy returns inventory:

```text
Pharmacy
      ↓
Return Request
      ↓
Inventory Review
      ↓
Quarantine / Accept / Reject
      ↓
Inventory Movement
```

Do not automatically return all medicine to saleable stock.

---

# 42. WARD STOCK

Support ward-level inventory.

Example:

```text
Main Store
   ↓
Ward Store
   ↓
Patient / Procedure
```

Ward stock can be transferred from central inventory.

---

# 43. INVENTORY TRANSFER

Create:

```text
InventoryTransfer
```

Fields:

```text
transferId
sourceLocationId
destinationLocationId
items[]
requestedBy
approvedBy
issuedBy
receivedBy
status
requestedAt
approvedAt
dispatchedAt
receivedAt
```

---

# 44. TRANSFER STATUS

```text
REQUESTED
APPROVED
PICKING
DISPATCHED
PARTIALLY_RECEIVED
RECEIVED
REJECTED
CANCELLED
```

---

# 45. TRANSFER WORKFLOW

```text
Source Location
      ↓
Transfer Request
      ↓
Authorization
      ↓
Stock Reservation
      ↓
Pick Stock
      ↓
Transfer Out
      ↓
Dispatch
      ↓
Destination Receives
      ↓
Transfer In
      ↓
Verify
      ↓
Complete
```

---

# 46. TRANSFER QUANTITY MISMATCH

Example:

```text
Sent = 100
Received = 97
```

Do not silently close the transfer.

Create:

```text
TRANSFER_QUANTITY_MISMATCH
```

and require human reconciliation.

---

# 47. STOCK ADJUSTMENTS

Authorized users may create stock adjustments.

Examples:

```text
Physical count difference
Damaged goods
Expired goods
Data correction
Lost item
Found item
```

Create:

```text
InventoryAdjustment
```

---

# 48. ADJUSTMENT MODEL

Fields:

```text
adjustmentId
inventoryItemId
batchId
locationId
systemQuantity
physicalQuantity
difference
reason
supportingDocument
requestedBy
approvedBy
status
createdAt
processedAt
```

---

# 49. ADJUSTMENT STATUS

```text
DRAFT
PENDING_APPROVAL
APPROVED
REJECTED
PROCESSED
CANCELLED
```

---

# 50. NO SILENT STOCK EDITS

Never provide a UI that simply changes:

```text
quantity = 500
```

without creating an adjustment/movement.

Every change must have:

```text
Who
What
When
Why
Before
After
Reference
```

---

# 51. PHYSICAL STOCK COUNT

Support inventory counting.

Workflow:

```text
Create Count Session
      ↓
Freeze / Snapshot Relevant Stock
      ↓
Physical Count
      ↓
Enter Count
      ↓
Compare System Quantity
      ↓
Generate Variance
      ↓
Review
      ↓
Approve Adjustment
      ↓
Post Adjustment
```

---

# 52. STOCK COUNT SESSION

Create:

```text
StockCountSession
```

Fields:

```text
countSessionId
locationId
countType
status
startedAt
completedAt
createdBy
approvedBy
items[]
```

---

# 53. COUNT TYPES

```text
FULL
CYCLE_COUNT
CATEGORY
BATCH
SPOT_CHECK
```

---

# 54. COUNT STATUS

```text
DRAFT
IN_PROGRESS
PENDING_REVIEW
APPROVED
POSTED
CANCELLED
```

---

# 55. INVENTORY RECONCILIATION

Support reconciliation between:

```text
MongoDB Inventory
External ERP
Legacy Pharmacy
Supplier Report
Physical Count
```

Flow:

```text
Source Data
      ↓
Normalize
      ↓
Match Item
      ↓
Match Batch
      ↓
Compare Quantity
      ↓
Generate Difference
      ↓
Human Review
      ↓
Authorized Adjustment
```

---

# 56. RECONCILIATION MODEL

Create:

```text
InventoryReconciliation
```

Fields:

```text
reconciliationId
source
locationId
startedAt
completedAt
status
totalItems
matchedItems
mismatchedItems
unknownItems
results[]
createdBy
```

---

# 57. RECONCILIATION RESULT

Each result:

```text
inventoryItemId
batchId
systemQuantity
externalQuantity
difference
status
resolution
resolvedBy
resolvedAt
```

---

# 58. RECONCILIATION STATUS

```text
MATCHED
MISMATCH
UNKNOWN_ITEM
UNKNOWN_BATCH
MISSING_EXTERNAL
MISSING_INTERNAL
PENDING_REVIEW
RESOLVED
```

---

# 59. RPA ROLE

Robot Framework may automate:

- External stock report download
- Legacy inventory system synchronization
- Stock reconciliation
- External goods receipt entry
- External stock issue
- External transfer entry
- External stock report extraction
- Expiry report generation
- Low-stock report extraction
- Supplier portal interactions where required

RPA must never silently overwrite inventory quantities.

---

# 60. RPA — STOCK REPORT IMPORT

Example:

```text
External System
      ↓
Login
      ↓
Open Stock Report
      ↓
Download CSV/Excel
      ↓
Validate File
      ↓
Parse
      ↓
Normalize
      ↓
Match Items
      ↓
Compare
      ↓
Create Reconciliation
      ↓
Notify
```

---

# 61. RPA — EXTERNAL INVENTORY ENTRY

If an external system requires browser automation:

```text
Read approved inventory transaction
      ↓
Login
      ↓
Open inventory module
      ↓
Enter transaction
      ↓
Submit
      ↓
Read external transaction number
      ↓
Verify
      ↓
Update MongoDB
```

Do not mark success until read-back verification succeeds.

---

# 62. RPA — STOCK ADJUSTMENT

Adjustments are sensitive.

RPA may execute an already authorized adjustment.

It must not decide the adjustment amount.

Flow:

```text
Human Approval
      ↓
Approved Adjustment
      ↓
RPA Executes
      ↓
External System Confirmation
      ↓
Read Back
      ↓
Update Status
```

---

# 63. RPA — EXPIRY REPORT

RPA may:

```text
Login
↓
Download expiry report
↓
Parse
↓
Compare with MongoDB
↓
Create discrepancies
↓
Notify inventory staff
```

RPA must not automatically dispose of medicines.

---

# 64. RPA GOLDEN RULE

All automation follows:

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

Ambiguity:

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

# 65. ROBOT FRAMEWORK STRUCTURE

Create:

```text
robot/
├── resources/
│   ├── common.resource
│   ├── authentication.resource
│   ├── inventory.resource
│   ├── pharmacy.resource
│   ├── procurement.resource
│   └── api.resource
│
├── keywords/
│   ├── inventory_keywords.resource
│   ├── stock_keywords.resource
│   ├── batch_keywords.resource
│   ├── reconciliation_keywords.resource
│   └── transfer_keywords.resource
│
├── tests/
│   ├── inventory_sync.robot
│   ├── stock_reconciliation.robot
│   ├── goods_receipt.robot
│   ├── inventory_transfer.robot
│   ├── expiry_alert.robot
│   └── adjustment.robot
│
├── portals/
│   ├── legacy_inventory.robot
│   ├── legacy_pharmacy.robot
│   └── supplier_portal.robot
│
└── results/
```

---

# 66. ROBOT KEYWORDS

Implement reusable keywords:

```text
Login To Inventory System
Open Inventory Module
Search Inventory Item
Read Stock Quantity
Read Batch Information
Download Stock Report
Parse Inventory Report
Compare Stock
Create Reconciliation
Create Exception
Enter Goods Receipt
Enter Stock Transfer
Enter Stock Issue
Read External Transaction ID
Verify External Transaction
Capture Evidence
Logout
```

---

# 67. RPA JOB MODEL

Reuse the shared:

```text
RPAJob
```

with:

```text
module = MEDICAL_INVENTORY
```

Possible job types:

```text
STOCK_SYNC
STOCK_RECONCILIATION
GOODS_RECEIPT_SYNC
TRANSFER_SYNC
STOCK_ISSUE_SYNC
EXPIRY_REPORT_SYNC
EXTERNAL_ADJUSTMENT
```

---

# 68. RPA RETRY RULE

Retry technical failures only.

Allowed:

```text
NETWORK_TIMEOUT
TEMPORARY_BROWSER_FAILURE
TEMPORARY_API_FAILURE
```

Do not automatically retry:

```text
QUANTITY_MISMATCH
UNKNOWN_ITEM
UNKNOWN_BATCH
AUTHORIZATION_FAILURE
STOCK_CONFLICT
EXPIRED_ITEM
INVALID_TRANSACTION
UNKNOWN_EXTERNAL_RESULT
```

---

# 69. UNKNOWN TRANSACTION RESULT

Example:

```text
RPA submits stock issue
↓
Browser crashes
↓
Cannot determine whether issue succeeded
```

Do not blindly submit again.

Create:

```text
UNKNOWN_EXTERNAL_TRANSACTION
```

and reconcile.

---

# 70. API DESIGN

Base:

```text
/api/inventory
```

---

## Item APIs

```http
GET    /api/inventory/items
GET    /api/inventory/items/:id
POST   /api/inventory/items
PUT    /api/inventory/items/:id
PATCH  /api/inventory/items/:id/status
```

---

## Batch APIs

```http
GET /api/inventory/batches
GET /api/inventory/batches/:id
POST /api/inventory/batches
```

---

## Availability

```http
GET /api/inventory/availability/:inventoryItemId
GET /api/inventory/availability/:inventoryItemId?locationId=LOC-001
```

---

## Reservations

```http
POST   /api/inventory/reservations
GET    /api/inventory/reservations
POST   /api/inventory/reservations/:id/release
```

---

## Issues

```http
POST /api/inventory/issues
GET  /api/inventory/issues
```

---

## Transfers

```http
POST /api/inventory/transfers
GET  /api/inventory/transfers
GET  /api/inventory/transfers/:id
POST /api/inventory/transfers/:id/approve
POST /api/inventory/transfers/:id/dispatch
POST /api/inventory/transfers/:id/receive
```

---

## Adjustments

```http
POST /api/inventory/adjustments
GET  /api/inventory/adjustments
POST /api/inventory/adjustments/:id/approve
POST /api/inventory/adjustments/:id/process
```

---

## Stock Counts

```http
POST /api/inventory/counts
GET  /api/inventory/counts
POST /api/inventory/counts/:id/start
POST /api/inventory/counts/:id/complete
POST /api/inventory/counts/:id/approve
POST /api/inventory/counts/:id/post
```

---

## Reconciliation

```http
POST /api/inventory/reconciliations
GET  /api/inventory/reconciliations
GET  /api/inventory/reconciliations/:id
POST /api/inventory/reconciliations/:id/resolve
```

---

# 71. BACKEND STRUCTURE

Implement:

```text
server/
├── models/
│   ├── InventoryItem.js
│   ├── InventoryBatch.js
│   ├── StockLocation.js
│   ├── InventoryMovement.js
│   ├── InventoryReservation.js
│   ├── InventoryTransfer.js
│   ├── InventoryAdjustment.js
│   ├── StockCountSession.js
│   ├── InventoryReconciliation.js
│   └── InventoryAlert.js
│
├── controllers/
│   ├── inventoryItemController.js
│   ├── batchController.js
│   ├── stockController.js
│   ├── reservationController.js
│   ├── transferController.js
│   ├── adjustmentController.js
│   ├── stockCountController.js
│   └── reconciliationController.js
│
├── services/
│   └── inventory/
│       ├── inventoryItemService.js
│       ├── batchService.js
│       ├── stockService.js
│       ├── reservationService.js
│       ├── transferService.js
│       ├── adjustmentService.js
│       ├── stockCountService.js
│       ├── reconciliationService.js
│       ├── expiryService.js
│       └── alertService.js
│
├── validators/
│   └── inventory/
│
└── routes/
    └── inventoryRoutes.js
```

---

# 72. FRONTEND STRUCTURE

Create:

```text
client/src/portals/operations/inventory/
├── pages/
│   ├── InventoryDashboard.jsx
│   ├── InventoryItems.jsx
│   ├── InventoryItemDetails.jsx
│   ├── BatchManagement.jsx
│   ├── StockLocations.jsx
│   ├── StockAvailability.jsx
│   ├── Reservations.jsx
│   ├── StockIssues.jsx
│   ├── Transfers.jsx
│   ├── Adjustments.jsx
│   ├── StockCounts.jsx
│   ├── Reconciliation.jsx
│   ├── Alerts.jsx
│   └── InventoryReports.jsx
│
├── components/
│   ├── InventoryTable.jsx
│   ├── BatchTable.jsx
│   ├── StockCard.jsx
│   ├── StockMovementTable.jsx
│   ├── ReservationTable.jsx
│   ├── TransferForm.jsx
│   ├── AdjustmentForm.jsx
│   ├── StockCountForm.jsx
│   ├── ReconciliationTable.jsx
│   └── InventoryAlertBadge.jsx
│
└── services/
    └── inventoryService.js
```

---

# 73. INVENTORY DASHBOARD

Route:

```text
/operations/inventory
```

Display:

```text
Total Inventory Items
Total Active Batches
Low Stock
Near Expiry
Expired
Quarantined
Pending Transfers
Pending Adjustments
Pending Reconciliations
RPA Failures
```

---

# 74. INVENTORY ITEM SCREEN

Show:

```text
Item ID
Name
Category
Manufacturer
Unit
Current Stock
Reserved
Available
Reorder Level
Status
```

Tabs:

```text
Overview
Batches
Movements
Reservations
Alerts
Reconciliation
```

---

# 75. BATCH SCREEN

Show:

```text
Batch ID
Batch Number
Item
Location
Received Date
Manufacturing Date
Expiry Date
On Hand
Available
Reserved
Quarantined
Status
```

Filters:

```text
Expiring Soon
Expired
Available
Quarantined
Depleted
```

---

# 76. STOCK MOVEMENT SCREEN

Show:

```text
Movement ID
Item
Batch
From
To
Movement Type
Quantity
Reference
User
Date
```

The history should be read-only for normal users.

---

# 77. STOCK ADJUSTMENT UI

Form:

```text
Item
Batch
Location
System Quantity
Physical Quantity
Difference
Reason
Supporting Document
```

Submit:

```text
PENDING_APPROVAL
```

Do not directly post unless the user's role and configuration explicitly allow it.

---

# 78. STOCK TRANSFER UI

Form:

```text
From Location
To Location
Item
Batch
Quantity
Reason
```

System validates:

```text
Source available stock
Destination
Batch
Quantity
User permission
```

---

# 79. RECONCILIATION UI

Show:

```text
System Quantity
External Quantity
Difference
Status
Resolution
```

Actions:

```text
Review
Resolve
Create Adjustment
Mark Matched
```

Do not allow users to simply overwrite system quantity.

---

# 80. INVENTORY ALERTS

Generate alerts for:

```text
LOW_STOCK
NEAR_EXPIRY
EXPIRED
NEGATIVE_STOCK_ATTEMPT
STOCK_MISMATCH
TRANSFER_MISMATCH
UNKNOWN_BATCH
UNKNOWN_ITEM
RECONCILIATION_FAILURE
RPA_FAILURE
```

---

# 81. NOTIFICATIONS

Use centralized:

```text
26_NOTIFICATION_SERVICE.md
```

Notify:

### Low Stock

```text
Inventory Manager
Procurement
```

### Expiry

```text
Inventory Manager
Pharmacy Manager where applicable
```

### Stock Mismatch

```text
Inventory Manager
```

### Transfer Issue

```text
Source/Destination responsible users
```

---

# 82. PROCUREMENT INTEGRATION

When inventory reaches reorder level:

```text
Inventory
   ↓
LOW_STOCK
   ↓
Procurement
   ↓
Purchase Request
```

Inventory does not automatically approve procurement.

---

# 83. VENDOR INTEGRATION

Vendor information comes from:

```text
20_VENDOR_MANAGEMENT.md
```

Inventory stores references:

```text
vendorId
```

Do not duplicate complete vendor profiles.

---

# 84. DOCUMENTS

Integrate with:

```text
27_DOCUMENT_GENERATION.md
```

Generate:

```text
Goods Receipt
Stock Issue Slip
Stock Transfer Note
Stock Adjustment Report
Stock Count Report
Inventory Reconciliation Report
Expiry Report
Low Stock Report
```

---

# 85. AUDIT LOGGING

Every sensitive operation must generate an `AuditEvent`.

Examples:

```text
ITEM_CREATED
ITEM_UPDATED
BATCH_CREATED
GOODS_RECEIVED
STOCK_RESERVED
STOCK_ISSUED
STOCK_RETURNED
TRANSFER_CREATED
TRANSFER_APPROVED
TRANSFER_DISPATCHED
TRANSFER_RECEIVED
ADJUSTMENT_CREATED
ADJUSTMENT_APPROVED
ADJUSTMENT_POSTED
COUNT_STARTED
COUNT_COMPLETED
COUNT_APPROVED
RECONCILIATION_CREATED
RECONCILIATION_RESOLVED
ALERT_CREATED
```

---

# 86. SECURITY

Implement:

```text
JWT authentication
RBAC
Backend authorization
Input validation
Audit logging
Rate limiting
Secret management
Secure file upload
Document access control
```

Inventory documents may contain supplier, pricing, and operational information.

Restrict access appropriately.

---

# 87. FILE UPLOADS

Supporting documents may include:

```text
Supplier Invoice
Delivery Note
Inspection Report
Adjustment Evidence
Count Sheet
Reconciliation File
```

Validate:

```text
file type
file size
extension
content type
access permission
```

Do not allow executable uploads.

---

# 88. DATABASE INDEXES

Create indexes on:

```text
inventoryItemId
sku
barcode
category
status
batchId
batchNumber
expiryDate
locationId
supplierId
purchaseOrderId
goodsReceiptId
movementId
referenceId
reservationId
transferId
adjustmentId
```

Important compound indexes:

```text
inventoryItemId + locationId
inventoryItemId + expiryDate
inventoryItemId + status
locationId + status
batchId + locationId
```

---

# 89. CONCURRENCY CONTROL

Critical operations must be atomic:

```text
Reservation
Issue
Transfer
Adjustment
Goods Receipt
Return
```

Example:

```text
Stock = 100
Request A = 70
Request B = 50
```

Only one combination that fits the available stock can succeed.

Prevent negative stock unless an explicit hospital configuration permits a controlled exception workflow.

---

# 90. NEGATIVE STOCK

Default:

```text
negativeStockAllowed = false
```

If a transaction would create negative stock:

```text
BLOCK
```

Create:

```text
NEGATIVE_STOCK_ATTEMPT
```

Only an explicitly configured authorized workflow may permit such a transaction.

---

# 91. IDEMPOTENCY

External transactions must use idempotency.

Example:

```text
goodsReceiptRequestId
stockIssueRequestId
transferRequestId
```

If the same request arrives twice:

```text
Return existing transaction
```

Do not duplicate stock.

---

# 92. ERROR HANDLING

Use standard response format:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Requested quantity exceeds available stock.",
    "correlationId": "CORR-2026-00123"
  }
}
```

Every serious failure should have a correlation ID.

---

# 93. SEED DATA

Create realistic demo data.

At least:

```text
30+ inventory items
50+ batches
10+ locations
100+ stock movements
20+ reservations
15+ transfers
10+ adjustments
5+ reconciliation sessions
```

Include:

```text
Normal stock
Low stock
Near expiry
Expired
Quarantined
Multiple batches
Multiple locations
```

---

# 94. DEMO SCENARIO — GOODS RECEIPT

Purchase Order:

```text
PO-50021
Paracetamol
Ordered = 1000
```

Supplier delivers:

```text
Batch = PCM-2026-A01
Received = 1000
Expiry = 2028-04-30
```

Workflow:

```text
Receive Goods
↓
Validate PO
↓
Validate Batch
↓
Validate Expiry
↓
Accept
↓
Create Batch
↓
Create RECEIPT Movement
↓
Increase Stock
↓
Audit
```

---

# 95. DEMO SCENARIO — PHARMACY RESERVATION

Stock:

```text
Available = 500
```

Pharmacy requests:

```text
Quantity = 30
```

Result:

```text
Reserved = 30
Available = 470
```

When dispensing completes:

```text
Reserved = 0
On Hand = 470
```

Create:

```text
RESERVATION
ISSUE
```

movements as appropriate to the chosen inventory accounting design.

---

# 96. DEMO SCENARIO — LOW STOCK

```text
On Hand = 80
Reserved = 20
Available = 60
Reorder Level = 100
```

System creates:

```text
LOW_STOCK
```

Notification:

```text
Inventory Manager
Procurement
```

No automatic purchase order approval.

---

# 97. DEMO SCENARIO — NEAR EXPIRY

```text
Expiry = 2026-10-25
Today = 2026-10-07
Threshold = 30 days
```

Create:

```text
NEAR_EXPIRY
```

The item remains available unless hospital policy says otherwise.

---

# 98. DEMO SCENARIO — TRANSFER

```text
Main Store
   ↓
Pharmacy Store
```

Request:

```text
Paracetamol
Quantity = 200
```

Flow:

```text
Request
↓
Approve
↓
Reserve
↓
Dispatch
↓
Transfer Out
↓
Receive
↓
Transfer In
↓
Complete
```

---

# 99. DEMO SCENARIO — STOCK MISMATCH

System:

```text
100
```

External:

```text
97
```

Result:

```text
Difference = -3
```

Create:

```text
MISMATCH
```

Require human investigation.

Do not automatically change:

```text
100 → 97
```

---

# 100. DEMO SCENARIO — PHYSICAL COUNT

System:

```text
500
```

Physical:

```text
492
```

Difference:

```text
-8
```

Workflow:

```text
Count
↓
Review
↓
Approve Adjustment
↓
Adjustment -8
↓
Movement
↓
New Stock = 492
```

---

# 101. REPORTS

Implement:

### Stock Reports

```text
Current Stock
Stock by Location
Stock by Category
Batch Stock
```

### Movement Reports

```text
Receipts
Issues
Transfers
Returns
Adjustments
Consumption
```

### Expiry Reports

```text
Expired
Expiring in 7 Days
Expiring in 30 Days
Expiring in 60 Days
```

### Procurement Support

```text
Low Stock
Reorder Candidates
Consumption Trends
```

### Reconciliation

```text
Matched
Mismatched
Unresolved
```

---

# 102. INVENTORY DASHBOARD KPIs

Show:

```text
Total Items
Total Stock Locations
Low Stock Items
Near Expiry Items
Expired Items
Quarantined Items
Pending Transfers
Pending Adjustments
Pending Counts
Open Reconciliations
RPA Failures
```

Charts should be interactive.

---

# 103. SEARCH

Support:

```text
Item ID
Name
Generic Name
Brand
SKU
Barcode
Batch
Location
Category
Supplier
```

Use server-side pagination.

---

# 104. INVENTORY SERVICE LAYER

Business logic must not be placed directly in controllers.

Example:

```javascript
inventoryService.reserveStock()
inventoryService.releaseReservation()
inventoryService.issueStock()
inventoryService.receiveGoods()
inventoryService.transferStock()
inventoryService.createAdjustment()
inventoryService.reconcileStock()
```

Controllers should handle:

```text
Request
Validation
Authorization
Service Call
Response
```

---

# 105. TRANSACTION SAFETY

Where MongoDB transactions are available and appropriate, use them for multi-document operations such as:

```text
Goods Receipt + Batch + Movement
Stock Issue + Movement + Reservation Update
Transfer Out + Transfer Record
Transfer Receive + Destination Movement
Adjustment + Movement
```

If transaction failure occurs:

```text
Rollback
```

and return a failure response.

---

# 106. AUDIT VS MOVEMENT

Do not confuse:

```text
InventoryMovement
```

with:

```text
AuditEvent
```

InventoryMovement records the **business stock movement**.

AuditEvent records the **user/system action**.

Example:

```text
InventoryMovement:
Paracetamol +100 RECEIPT

AuditEvent:
Employee E1007 approved goods receipt GRN-5001
```

Both should exist.

---

# 107. PHARMACY BOUNDARY

Pharmacy asks:

```text
"How much stock is available?"
```

Inventory answers.

Pharmacy asks:

```text
"Reserve 20."
```

Inventory handles reservation.

Pharmacy says:

```text
"20 were dispensed."
```

Inventory posts the issue.

Pharmacy must not directly update:

```text
InventoryBatch.availableQuantity
```

---

# 108. PROCUREMENT BOUNDARY

Inventory identifies:

```text
LOW_STOCK
```

Procurement decides:

```text
Whether to purchase
How much to purchase
Which vendor
Whether to approve
```

Inventory does not make procurement decisions.

---

# 109. VENDOR BOUNDARY

Vendor module owns:

```text
Vendor Master
Vendor Status
Vendor Documents
Vendor Contacts
```

Inventory stores references.

---

# 110. HUMAN APPROVAL REQUIREMENTS

Require human approval for:

```text
Large stock adjustments
Unexpected quantity mismatch
Transfer mismatch
Unknown batch
Unknown item
Disposal
Controlled/restricted inventory
Negative stock override
Manual reconciliation
```

Thresholds must be configurable.

---

# 111. INVENTORY EXCEPTION TYPES

Create:

```text
UNKNOWN_ITEM
UNKNOWN_BATCH
DUPLICATE_BATCH
INVALID_EXPIRY
EXPIRED_STOCK
INSUFFICIENT_STOCK
NEGATIVE_STOCK_ATTEMPT
STOCK_MISMATCH
TRANSFER_MISMATCH
GOODS_RECEIPT_MISMATCH
PURCHASE_ORDER_NOT_FOUND
LOCATION_NOT_FOUND
RPA_FAILURE
UNKNOWN_EXTERNAL_RESULT
DUPLICATE_TRANSACTION
ADJUSTMENT_APPROVAL_REQUIRED
DISPOSAL_APPROVAL_REQUIRED
```

---

# 112. EXCEPTION WORKFLOW

```text
Exception Detected
        ↓
ExceptionCase
        ↓
Severity
        ↓
Assignment
        ↓
Human Review
        ↓
Resolution
        ↓
Corrective Action
        ↓
Verification
        ↓
Close
```

---

# 113. TESTING

Unit tests:

```text
Available stock calculation
Reservation
Reservation release
Issue
Goods receipt
Batch creation
Expiry validation
Low-stock calculation
Transfer
Adjustment
Stock count
Reconciliation
Idempotency
```

---

# 114. API TESTING

Test:

```text
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Error
```

Also test:

```text
Duplicate request
Concurrent reservation
Concurrent issue
Expired batch
Insufficient stock
Unknown item
Unknown batch
```

---

# 115. RBAC TESTING

Verify:

```text
Inventory Staff
→ can receive stock
→ can view inventory
→ cannot approve unauthorized adjustment

Inventory Manager
→ can approve configured adjustments

Pharmacist
→ can query inventory
→ cannot directly alter stock

Procurement Officer
→ can view reorder alerts
→ cannot directly alter stock

Patient
→ cannot access inventory management
```

---

# 116. RPA TESTING

Test:

### Successful synchronization

```text
External Report
→ Download
→ Parse
→ Match
→ Reconcile
→ Success
```

### Unknown item

```text
External Item
→ No Match
→ UNKNOWN_ITEM
→ Human Review
```

### Quantity mismatch

```text
External = 97
System = 100
→ MISMATCH
```

### External failure

```text
Login failure
→ RPAJob FAILED
→ ExceptionCase
→ Notification
```

---

# 117. PERFORMANCE REQUIREMENTS

The module must support realistic hospital data volumes.

Use:

```text
Pagination
Indexes
Projection
Server-side filtering
Aggregation pipelines
Background jobs
```

Do not fetch all inventory movements into the frontend.

---

# 118. DATA RETENTION

Inventory transaction history should not be deleted through normal UI.

Use archival strategies if required.

Historical records must remain traceable.

---

# 119. SYSTEM CONFIGURATION

Create configurable settings:

```text
defaultReorderThreshold
nearExpiryDays
allowNegativeStock
defaultStockSelectionPolicy
reservationExpiryHours
adjustmentApprovalThreshold
transferApprovalRequired
batchTrackingRequiredByCategory
expiryTrackingRequiredByCategory
```

Do not hard-code hospital-specific operational policies.

---

# 120. CONFIGURATION SECURITY

Only authorized administration users may change inventory configuration.

Configuration changes must create:

```text
AuditEvent
```

Store:

```text
before
after
changedBy
changedAt
reason
```

---

# 121. FINAL END-TO-END INVENTORY WORKFLOW

The completed system must support:

```text
VENDOR
   ↓
PROCUREMENT
   ↓
PURCHASE ORDER
   ↓
GOODS RECEIPT
   ↓
BATCH CREATION
   ↓
INVENTORY STOCK
   ↓
LOCATION
   ↓
RESERVATION
   ↓
ISSUE
   ├────────→ PHARMACY
   ├────────→ LAB
   ├────────→ RADIOLOGY
   ├────────→ WARD
   └────────→ OTHER AUTHORIZED DEPARTMENT
   ↓
RETURN / TRANSFER / ADJUSTMENT
   ↓
RECONCILIATION
   ↓
EXPIRY / LOW-STOCK MONITORING
   ↓
REPORTING
   ↓
AUDIT
```

---

# 122. STRICT IMPLEMENTATION RULES FOR AI CODING AGENT

Before implementation:

1. Inspect the existing repository.
2. Identify existing shared models.
3. Reuse authentication.
4. Reuse RBAC.
5. Reuse Notification Service.
6. Reuse Audit Service.
7. Reuse ExceptionCase.
8. Reuse RPAJob.
9. Reuse Vendor.
10. Reuse Procurement entities where already implemented.
11. Reuse Pharmacy integration from `17_PHARMACY_MANAGEMENT.md`.

Do NOT create duplicate:

```text
Patient
Employee
Vendor
Doctor
Medicine
Invoice
Notification
AuditEvent
RPAJob
```

unless the existing architecture explicitly requires a separate model.

---

# 123. IMPLEMENTATION ORDER

Implement in this order:

```text
1. Inventory Item Master
        ↓
2. Stock Locations
        ↓
3. Inventory Batches
        ↓
4. Inventory Movements
        ↓
5. Availability
        ↓
6. Reservations
        ↓
7. Goods Receipt
        ↓
8. Stock Issues
        ↓
9. Transfers
        ↓
10. Adjustments
        ↓
11. Stock Counts
        ↓
12. Reconciliation
        ↓
13. Alerts
        ↓
14. Pharmacy Integration
        ↓
15. Procurement Integration
        ↓
16. RPA
        ↓
17. Reports
        ↓
18. Audit/Security
        ↓
19. Testing
```

---

# 124. FINAL ACCEPTANCE STANDARD

This module is complete only when:

- Inventory Item Master works.
- Multiple inventory categories work.
- Multiple locations work.
- Batch/lot tracking works.
- Expiry tracking works.
- Goods receipt works.
- Purchase Order integration works.
- Stock quantities are accurate.
- Reservations are concurrency-safe.
- Stock issues are atomic.
- Transfers work.
- Transfer mismatches create exceptions.
- Stock adjustments require appropriate authorization.
- Physical counts work.
- Reconciliation works.
- Low-stock alerts work.
- Near-expiry alerts work.
- Expired stock cannot be issued.
- Quarantine works.
- Pharmacy can consume inventory through APIs.
- Pharmacy cannot directly modify inventory.
- Procurement can consume low-stock information.
- Vendor references work.
- RPA can synchronize external inventory.
- RPA failures create traceable exceptions.
- Unknown external results do not cause blind retries.
- Audit events are generated.
- RBAC is enforced server-side.
- Inventory history is preserved.
- Reports work.
- Seed data works.
- Unit tests pass.
- API tests pass.
- RBAC tests pass.
- RPA tests pass.
- End-to-end inventory flows pass.

---

# 125. FINAL AI CODING AGENT INSTRUCTION

You are implementing **Module 18 — Medical Inventory Management**.

Treat this document as an implementation specification, not as a conceptual overview.

The module must become the **single authoritative source of truth for physical medical inventory**.

Implement:

```text
MongoDB Models
↓
Mongoose Schemas
↓
Services
↓
Controllers
↓
REST APIs
↓
Validation
↓
RBAC
↓
React Pages
↓
React Components
↓
Inventory Transactions
↓
Pharmacy Integration
↓
Procurement Integration
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

Every stock-changing operation must be:

```text
Authorized
Validated
Atomic
Audited
Traceable
Idempotent where applicable
```

Never silently modify stock.

Never allow Pharmacy or another module to bypass Inventory services.

Never allow RPA to make business decisions that require human approval.

Never automatically dispose, substitute, approve, purchase, or authorize sensitive inventory actions.

When ambiguity exists:

```text
STOP
↓
CREATE EXCEPTION
↓
HUMAN REVIEW
↓
AUTHORIZED DECISION
↓
CONTINUE
```

The final result must be a **fully functional hospital medical inventory management system**, not a static dashboard or mockup.