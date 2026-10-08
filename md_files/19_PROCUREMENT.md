# 19_PROCUREMENT.md

# Hospital Administrative & RPA Platform
## Module 19 — Procurement Management

---

# 1. MODULE PURPOSE

Build a complete **Procurement Management module** for the Hospital Administrative & RPA Platform.

The module must manage the hospital procurement lifecycle from identifying a requirement through purchase, supplier coordination, goods receipt, reconciliation, and closure.

Core workflow:

```text
Department Requirement
        ↓
Purchase Request
        ↓
Validation
        ↓
Approval
        ↓
Quotation / Vendor Sourcing
        ↓
Quotation Comparison
        ↓
Vendor Selection
        ↓
Purchase Order
        ↓
Approval
        ↓
PO Sent to Vendor
        ↓
Vendor Confirmation
        ↓
Delivery
        ↓
Goods Receipt
        ↓
Quantity / Quality Verification
        ↓
Inventory Update
        ↓
Invoice Matching
        ↓
Payment Handoff
        ↓
Procurement Closure
        ↓
Audit / Reporting
```

The module must support procurement for:

- Medicines
- Medical consumables
- Surgical supplies
- Laboratory supplies
- Radiology supplies
- PPE
- Equipment
- Maintenance materials
- Housekeeping materials
- General hospital supplies
- Other configurable categories

---

# 2. CRITICAL ARCHITECTURAL PRINCIPLE

The MERN application is the **system of record**.

Robot Framework is the **automation worker**.

```text
React
  ↓
Node.js / Express
  ↓
MongoDB
  ↓
Procurement Services
  ↓
RPA Queue
  ↓
Robot Framework
  ↓
External Vendor / ERP / Procurement Portal
```

RPA must never become the procurement database.

---

# 3. MODULE RESPONSIBILITY

## Procurement owns

- Purchase Requests
- Procurement approval workflow
- RFQs
- Quotations
- Quotation comparison
- Vendor selection record
- Purchase Orders
- PO approvals
- Vendor confirmation tracking
- Delivery tracking
- Procurement exceptions
- Procurement reports
- Procurement RPA workflows

## Vendor Management owns

```text
20_VENDOR_MANAGEMENT.md
```

Vendor master data.

Procurement stores references to vendors.

## Medical Inventory owns

```text
18_MEDICAL_INVENTORY.md
```

Physical inventory.

Procurement does not directly manipulate stock quantities.

## Billing / Finance owns

Financial settlement and payment processing.

Procurement provides:

```text
PO
Receipt
Invoice
Matching result
```

to the appropriate financial workflow.

---

# 4. USERS AND RBAC

## 4.1 Department Requester

Can:

```text
procurement.request.create
procurement.request.view_own
procurement.request.cancel_own
```

---

# 5. PROCUREMENT OFFICER

Can:

```text
procurement.request.view
procurement.request.validate
procurement.rfq.create
procurement.quotation.manage
procurement.comparison.create
procurement.vendor.recommend
procurement.po.create
procurement.po.view
procurement.delivery.track
procurement.exception.manage
procurement.report.view
```

---

# 6. PROCUREMENT MANAGER

Additional:

```text
procurement.request.approve
procurement.vendor_selection.approve
procurement.po.approve
procurement.exception.resolve
procurement.configuration.manage
procurement.report.export
```

---

# 7. DEPARTMENT MANAGER

Can:

```text
procurement.request.review
procurement.request.approve
procurement.request.reject
```

within authorized department scope.

---

# 8. FINANCE / ACCOUNTS

Can:

```text
procurement.po.view
procurement.receipt.view
procurement.invoice.match.view
procurement.payment_status.view
```

They should not automatically receive procurement approval rights.

---

# 9. INVENTORY STAFF

Can:

```text
procurement.po.view
procurement.goods_receipt.create
procurement.goods_receipt.process
```

Inventory quantities are managed by the Medical Inventory module.

---

# 10. VENDOR

Restricted vendor portal access may provide:

```text
po.view
po.acknowledge
delivery.update
shipment_document.upload
invoice.submit
```

Vendor must not access unrelated hospital records.

---

# 11. SYSTEM ADMIN

Can configure:

- Procurement settings
- Approval thresholds
- Document templates
- RPA integrations
- Notification templates
- Permissions

System Admin must not automatically approve purchases.

---

# 12. CORE IDENTIFIERS

Use separate IDs:

```text
Purchase Request ID
RFQ ID
Quotation ID
Comparison ID
Purchase Order ID
Delivery ID
Goods Receipt ID
Supplier Invoice ID
Procurement Exception ID
RPA Job ID
Correlation ID
```

Examples:

```text
PR-2026-00021
RFQ-2026-00015
QUO-2026-00042
CMP-2026-00007
PO-2026-00115
DEL-2026-00091
GRN-2026-00073
PINV-2026-00102
```

---

# 13. PURCHASE REQUEST

Create:

```text
PurchaseRequest
```

A Purchase Request represents a department's requirement.

Fields:

```text
purchaseRequestId
requesterId
departmentId
requestDate
requiredByDate
priority
category
items[]
reason
justification
status
estimatedTotal
attachments[]
createdAt
updatedAt
```

---

# 14. PURCHASE REQUEST ITEM

Fields:

```text
requestItemId
inventoryItemId
itemNameSnapshot
description
quantity
unit
estimatedUnitPrice
estimatedTotal
preferredSpecification
requiredByDate
```

The system must preserve snapshots for historical traceability.

---

# 15. PURCHASE REQUEST PRIORITY

Use configurable:

```text
LOW
NORMAL
HIGH
URGENT
```

Do not allow users to bypass approval merely by selecting `URGENT`.

Urgent requests may follow a separately configured approval policy.

---

# 16. PURCHASE REQUEST STATUS

Use:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
PENDING_APPROVAL
APPROVED
REJECTED
RETURNED_FOR_CORRECTION
RFQ_IN_PROGRESS
PO_CREATED
PARTIALLY_ORDERED
ORDERED
FULFILLED
CANCELLED
CLOSED
```

---

# 17. PURCHASE REQUEST WORKFLOW

```text
Requester
   ↓
Create Request
   ↓
Validate
   ↓
Department Review
   ↓
Approval
   ↓
Procurement
   ↓
RFQ / Direct Procurement
   ↓
Quotation
   ↓
Vendor Selection
   ↓
Purchase Order
```

---

# 18. REQUEST VALIDATION

Validate:

```text
Requester exists
Department exists
Items exist
Quantities > 0
Required-by date valid
Category valid
Justification present where required
Estimated price valid where required
Duplicate request check
```

Potential duplicate:

```text
Same department
Same item
Similar quantity
Recent request
```

must be flagged rather than automatically merged.

---

# 19. REQUEST APPROVAL

Approval must be policy-driven.

Example:

```text
Amount <= threshold A
→ Department Manager

Amount > threshold A
→ Procurement Manager

Amount > threshold B
→ Additional Management Approval
```

These are examples only.

All thresholds must be configurable.

RPA must never invent approval limits.

---

# 20. APPROVAL SEGREGATION

The same user should not perform incompatible actions when policy prohibits it.

For example:

```text
Requester
≠
Final Approver
```

and where required:

```text
Requester
≠
PO Approver
```

Implement configurable segregation-of-duties rules.

---

# 21. REQUEST REJECTION

When rejected, require:

```text
rejectionReason
rejectedBy
rejectedAt
```

Notify requester.

Request cannot silently disappear.

---

# 22. RETURN FOR CORRECTION

Reviewer may return request:

```text
RETURNED_FOR_CORRECTION
```

with:

```text
correctionReason
```

Requester edits and resubmits.

Maintain revision history.

---

# 23. RFQ

Create:

```text
RFQ
```

Request for Quotation.

Fields:

```text
rfqId
purchaseRequestIds[]
vendorIds[]
items[]
issueDate
responseDeadline
status
createdBy
```

---

# 24. RFQ STATUS

```text
DRAFT
ISSUED
PARTIALLY_RESPONDED
RESPONDED
CLOSED
CANCELLED
```

---

# 25. RFQ ITEMS

Each RFQ item:

```text
inventoryItemId
description
quantity
unit
specification
requiredDeliveryDate
```

Do not expose internal evaluation notes to vendors.

---

# 26. VENDOR SELECTION

Procurement can invite one or multiple vendors depending on hospital policy.

The system must support:

```text
Single-source procurement
Multi-vendor RFQ
Framework/vendor contract
Emergency procurement
```

Do not automatically select the cheapest vendor without policy.

---

# 27. QUOTATION

Create:

```text
Quotation
```

Fields:

```text
quotationId
rfqId
vendorId
quotationDate
validUntil
items[]
subtotal
tax
discount
shipping
otherCharges
grandTotal
paymentTerms
deliveryTerms
documents[]
status
```

---

# 28. QUOTATION ITEM

Fields:

```text
inventoryItemId
description
quotedQuantity
unitPrice
tax
discount
lineTotal
deliveryDays
brand
manufacturer
specification
```

---

# 29. QUOTATION STATUS

```text
DRAFT
RECEIVED
UNDER_REVIEW
SHORTLISTED
REJECTED
ACCEPTED
EXPIRED
CANCELLED
```

---

# 30. QUOTATION VALIDITY

If:

```text
validUntil < currentDate
```

mark:

```text
EXPIRED
```

Do not automatically use an expired quotation for a new purchase.

Require vendor reconfirmation or a new quotation according to policy.

---

# 31. QUOTATION COMPARISON

Create:

```text
QuotationComparison
```

Display:

```text
Vendor
Item
Quantity
Unit Price
Tax
Discount
Delivery Time
Warranty
Specification
Payment Terms
Total
```

---

# 32. COMPARISON RULE

The system may calculate objective comparison metrics.

Example:

```text
Price Score
Delivery Score
Specification Match
Warranty
Payment Terms
```

But the system must not make an autonomous final vendor decision unless the hospital explicitly configures and authorizes such a deterministic rule.

Default:

```text
System recommends / highlights
Human selects
```

---

# 33. VENDOR SELECTION

Store:

```text
selectedVendorId
selectionReason
selectedQuotationId
selectedBy
selectedAt
approvalStatus
```

Selection reason is mandatory.

Example:

```text
Lowest compliant quotation
Best delivery time
Existing contract
Technical compliance
Emergency availability
```

---

# 34. PURCHASE ORDER

Create:

```text
PurchaseOrder
```

Fields:

```text
purchaseOrderId
purchaseRequestIds[]
vendorId
quotationId
orderDate
expectedDeliveryDate
currency
items[]
subtotal
tax
discount
shipping
grandTotal
paymentTerms
deliveryTerms
billingAddress
shippingAddress
status
approvalStatus
documents[]
createdBy
approvedBy
createdAt
updatedAt
```

---

# 35. PURCHASE ORDER ITEM

Fields:

```text
inventoryItemId
description
quantity
unit
unitPrice
tax
discount
lineTotal
requiredByDate
specification
```

---

# 36. PURCHASE ORDER STATUS

Use:

```text
DRAFT
PENDING_APPROVAL
APPROVED
SENT_TO_VENDOR
ACKNOWLEDGED
PARTIALLY_DELIVERED
DELIVERED
PARTIALLY_RECEIVED
RECEIVED
CLOSED
CANCELLED
REJECTED
```

---

# 37. PO APPROVAL

Approval workflow:

```text
PO Created
    ↓
Validation
    ↓
Approval Rules
    ↓
Authorized Approver
    ↓
Approved
    ↓
Vendor
```

RPA cannot approve a PO.

It may submit an already approved PO.

---

# 38. PO VALIDATION

Before approval:

```text
Vendor active?
Items valid?
Quantity valid?
Price valid?
Quotation valid?
Approval required?
Budget/reference valid if integrated?
Delivery date valid?
Duplicate PO?
```

---

# 39. PO DUPLICATE PREVENTION

Before creating PO:

```text
Check Purchase Request
Check existing PO
Check vendor
Check item
Check active/open PO
```

If an existing open PO already covers the requirement:

```text
FLAG POSSIBLE DUPLICATE
```

Human decides.

---

# 40. PURCHASE ORDER VERSIONING

Once approved, the PO should become controlled.

If changes are required:

```text
Approved PO
     ↓
Change Request
     ↓
Review
     ↓
Approval
     ↓
New PO Revision
```

Do not silently edit an approved PO.

---

# 41. PO REVISION MODEL

Create:

```text
PurchaseOrderRevision
```

Fields:

```text
revisionId
purchaseOrderId
revisionNumber
changedFields[]
reason
createdBy
approvedBy
createdAt
```

---

# 42. VENDOR ACKNOWLEDGEMENT

Vendor may:

```text
ACCEPT
REJECT
ACCEPT_WITH_CHANGES
```

If vendor proposes changes:

```text
Do not automatically update PO.
```

Create:

```text
VendorChangeRequest
```

for human review.

---

# 43. DELIVERY TRACKING

Create:

```text
Delivery
```

Fields:

```text
deliveryId
purchaseOrderId
vendorId
expectedDate
actualDate
shipmentReference
carrier
items[]
documents[]
status
```

---

# 44. DELIVERY STATUS

```text
EXPECTED
SHIPPED
IN_TRANSIT
DELIVERED
PARTIALLY_DELIVERED
DELAYED
CANCELLED
```

---

# 45. DELIVERY TRACKING

Procurement dashboard should show:

```text
PO
Vendor
Expected Date
Current Status
Days Delayed
Shipment Reference
```

---

# 46. LATE DELIVERY

If:

```text
currentDate > expectedDeliveryDate
AND
PO not delivered
```

create:

```text
DELIVERY_DELAY
```

Notify procurement staff.

Do not automatically penalize the vendor.

---

# 47. GOODS RECEIPT

Inventory handles the physical receipt.

Procurement must integrate with:

```text
18_MEDICAL_INVENTORY.md
```

Flow:

```text
PO
 ↓
Delivery
 ↓
Goods Receipt
 ↓
Inventory Verification
 ↓
Accepted Quantity
 ↓
Inventory Update
```

---

# 48. THREE-WAY MATCHING

Support:

```text
Purchase Order
       +
Goods Receipt
       +
Supplier Invoice
```

Compare:

```text
Quantity
Price
Item
Tax
Total
```

---

# 49. THREE-WAY MATCH STATUS

Use:

```text
MATCHED
PARTIAL_MATCH
PRICE_MISMATCH
QUANTITY_MISMATCH
ITEM_MISMATCH
TAX_MISMATCH
MISSING_RECEIPT
MISSING_INVOICE
PENDING_REVIEW
REJECTED
```

---

# 50. THREE-WAY MATCH EXAMPLE

PO:

```text
100 units × ₹50 = ₹5,000
```

Receipt:

```text
100 units
```

Invoice:

```text
100 units × ₹50 = ₹5,000
```

Result:

```text
MATCHED
```

---

# 51. QUANTITY MISMATCH

PO:

```text
100
```

Receipt:

```text
90
```

Invoice:

```text
100
```

Result:

```text
QUANTITY_MISMATCH
```

Do not automatically authorize full payment.

---

# 52. PRICE MISMATCH

PO:

```text
₹50
```

Invoice:

```text
₹55
```

Result:

```text
PRICE_MISMATCH
```

Human review required.

Do not automatically modify the PO.

---

# 53. INVOICE

Procurement may store supplier invoice references.

Fields:

```text
supplierInvoiceId
vendorId
invoiceNumber
invoiceDate
dueDate
currency
subtotal
tax
discount
grandTotal
documents[]
status
```

Financial system remains authoritative for payment.

---

# 54. PROCUREMENT INVOICE STATUS

```text
RECEIVED
VALIDATING
MATCHED
MISMATCH
APPROVED_FOR_PAYMENT
SENT_TO_FINANCE
PAID
REJECTED
CANCELLED
```

---

# 55. PAYMENT BOUNDARY

Procurement does not execute the actual payment unless the hospital architecture explicitly assigns payment processing to Procurement.

Normally:

```text
Procurement
   ↓
Three-way match
   ↓
Approved for payment
   ↓
Finance
   ↓
Payment
```

Do not create fake payment logic inside Procurement.

---

# 56. INVENTORY INTEGRATION

When goods are accepted:

```text
Procurement
     ↓
Goods Receipt
     ↓
Medical Inventory
     ↓
Inventory Batch
     ↓
Stock Movement
```

Procurement must receive:

```text
Goods Receipt ID
Accepted Quantity
Rejected Quantity
Batch Information
```

---

# 57. INVENTORY RECEIPT FAILURE

If Procurement says:

```text
Goods Received
```

but Inventory transaction fails:

```text
Do not mark procurement as fully completed.
```

Create:

```text
INVENTORY_SYNC_FAILURE
```

and notify responsible staff.

---

# 58. PROCUREMENT DASHBOARD

Route:

```text
/administration/procurement
```

Display:

```text
Pending Requests
Requests Awaiting Approval
RFQs
Quotation Responses
POs Awaiting Approval
Open POs
Delayed Deliveries
Pending Receipts
Invoice Mismatches
Open Exceptions
RPA Failures
```

---

# 59. PROCUREMENT SCREENS

Implement:

```text
Procurement Dashboard
Purchase Requests
Purchase Request Details
Approval Queue
RFQs
Quotation Management
Quotation Comparison
Vendor Selection
Purchase Orders
PO Details
PO Revisions
Delivery Tracking
Goods Receipts
Invoice Matching
Exceptions
Reports
Configuration
```

---

# 60. PURCHASE REQUEST UI

Form:

```text
Department
Requester
Required By
Priority
Category
Item
Quantity
Unit
Specification
Reason
Justification
Attachments
```

Actions:

```text
Save Draft
Submit
Cancel
```

---

# 61. PURCHASE REQUEST DETAILS

Show:

```text
Request ID
Requester
Department
Items
Estimated Cost
Priority
Approval Status
RFQ
PO
Delivery
Receipt
Invoice Match
History
```

Use a timeline:

```text
Created
Submitted
Reviewed
Approved
RFQ
Selected
PO
Delivered
Received
Matched
Closed
```

---

# 62. RFQ UI

Show:

```text
RFQ ID
Request
Items
Invited Vendors
Issue Date
Deadline
Responses
Status
```

Actions:

```text
Issue RFQ
Add Vendor
View Responses
Close RFQ
```

---

# 63. QUOTATION COMPARISON UI

Use a comparison table:

```text
              Vendor A    Vendor B    Vendor C
Price            ₹X          ₹Y          ₹Z
Delivery         5d          7d          4d
Warranty          1y          2y          1y
Compliance        Yes         Yes         No
Payment Terms     30d         15d         30d
```

Do not automatically select a vendor.

Provide:

```text
Select Vendor
```

with mandatory reason.

---

# 64. PO CREATION UI

Show:

```text
Vendor
Quotation
Items
Quantities
Prices
Taxes
Discounts
Delivery Date
Payment Terms
Delivery Terms
```

Calculate totals server-side.

Never trust frontend totals.

---

# 65. PO APPROVAL UI

Approver sees:

```text
Request
Quotation Comparison
Selected Vendor
Selection Reason
PO Total
Previous Revisions
Supporting Documents
```

Actions:

```text
Approve
Reject
Return
```

---

# 66. PO DETAILS

Show:

```text
PO ID
Vendor
Order Date
Expected Delivery
Items
Total
Status
Approval
Acknowledgement
Delivery
Goods Receipt
Invoice Match
Audit
```

---

# 67. DELIVERY DASHBOARD

Show:

```text
Expected Today
Due Soon
Delayed
In Transit
Delivered
Partially Delivered
```

Use filters:

```text
Vendor
Date
Department
Status
Priority
```

---

# 68. INVOICE MATCHING UI

Show side-by-side:

```text
PO
Receipt
Invoice
```

Highlight:

```text
Quantity Difference
Price Difference
Tax Difference
Total Difference
```

Actions:

```text
Approve Match
Create Exception
Send to Finance
Reject
```

---

# 69. PROCUREMENT EXCEPTIONS

Create ExceptionCase for:

```text
DUPLICATE_REQUEST
INVALID_ITEM
INVALID_VENDOR
APPROVAL_TIMEOUT
PO_MISMATCH
VENDOR_CHANGE_REQUEST
DELIVERY_DELAY
QUANTITY_MISMATCH
PRICE_MISMATCH
ITEM_MISMATCH
TAX_MISMATCH
MISSING_RECEIPT
MISSING_INVOICE
INVENTORY_SYNC_FAILURE
EXTERNAL_SYSTEM_FAILURE
UNKNOWN_EXTERNAL_RESULT
RPA_FAILURE
```

---

# 70. EXCEPTION WORKFLOW

```text
Exception
   ↓
ExceptionCase
   ↓
Assignment
   ↓
Human Review
   ↓
Decision
   ↓
Correct / Approve / Reject
   ↓
Retry if safe
   ↓
Verify
   ↓
Close
```

---

# 71. RPA RESPONSIBILITIES

Robot Framework may automate:

- Vendor portal login
- RFQ submission
- PO submission
- Vendor acknowledgement retrieval
- Delivery status retrieval
- Supplier invoice download
- External ERP procurement entry
- Procurement report download
- Three-way matching data collection
- Notification triggers
- External status synchronization

RPA must not:

- approve purchases
- select vendors autonomously
- alter prices without authorization
- approve invoice mismatches
- approve budget exceptions
- authorize payment

---

# 72. RPA — PO SUBMISSION

Only after:

```text
PO = APPROVED
```

RPA may:

```text
Read Approved PO
      ↓
Login External System
      ↓
Open Procurement Module
      ↓
Enter PO
      ↓
Submit
      ↓
Read External PO Number
      ↓
Verify
      ↓
Update MongoDB
```

---

# 73. RPA — VENDOR PORTAL

If vendor portal requires browser automation:

```text
Login
↓
Open Purchase Order
↓
Enter approved data
↓
Submit
↓
Capture confirmation
↓
Read external reference
↓
Update
↓
Audit
```

Credentials must come from secure secret storage.

---

# 74. RPA — DELIVERY STATUS

Robot can periodically:

```text
Login Vendor Portal
↓
Search PO
↓
Read Delivery Status
↓
Compare MongoDB
↓
Update Delivery
↓
Notify if changed
```

---

# 75. RPA — SUPPLIER INVOICE

Robot may:

```text
Download Invoice
↓
Validate File
↓
Extract Fields
↓
Match Vendor
↓
Match PO
↓
Match Receipt
↓
Create Invoice Record
↓
Flag Mismatch
```

RPA must not approve payment.

---

# 76. RPA GOLDEN RULE

Always:

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

Ambiguous situation:

```text
EXCEPTION
 ↓
HUMAN REVIEW
 ↓
AUTHORIZED DECISION
 ↓
CONTINUE
```

---

# 77. ROBOT FRAMEWORK STRUCTURE

Create:

```text
robot/
├── resources/
│   ├── common.resource
│   ├── authentication.resource
│   ├── procurement.resource
│   ├── vendor.resource
│   ├── inventory.resource
│   └── api.resource
│
├── keywords/
│   ├── procurement_keywords.resource
│   ├── quotation_keywords.resource
│   ├── po_keywords.resource
│   ├── delivery_keywords.resource
│   └── invoice_keywords.resource
│
├── tests/
│   ├── po_submission.robot
│   ├── vendor_acknowledgement.robot
│   ├── delivery_sync.robot
│   ├── invoice_sync.robot
│   ├── procurement_reconciliation.robot
│   └── procurement_exception.robot
│
├── portals/
│   ├── vendor_portal.robot
│   └── external_erp.robot
│
└── results/
```

---

# 78. ROBOT KEYWORDS

Implement:

```text
Login To Procurement Portal
Create External RFQ
Submit Purchase Order
Read External PO Number
Read Vendor Acknowledgement
Read Delivery Status
Download Supplier Invoice
Extract Invoice Data
Match Invoice
Create Exception
Capture Evidence
Logout
```

---

# 79. RPA JOB TYPES

Use:

```text
PROCUREMENT_PO_SUBMISSION
RFQ_SYNC
VENDOR_ACKNOWLEDGEMENT_SYNC
DELIVERY_STATUS_SYNC
SUPPLIER_INVOICE_SYNC
EXTERNAL_ERP_SYNC
PROCUREMENT_RECONCILIATION
```

---

# 80. RPA RETRY

Retry technical failures only:

```text
NETWORK_TIMEOUT
TEMPORARY_BROWSER_FAILURE
TEMPORARY_API_FAILURE
```

Do not blindly retry:

```text
PO_REJECTED
PRICE_MISMATCH
VENDOR_CHANGE_REQUEST
UNKNOWN_EXTERNAL_RESULT
APPROVAL_REQUIRED
```

---

# 81. UNKNOWN EXTERNAL RESULT

Example:

```text
PO submitted
↓
Browser crashes
↓
Cannot determine whether vendor received PO
```

Do not submit again blindly.

Create:

```text
UNKNOWN_PO_SUBMISSION_RESULT
```

Then reconcile by searching the external system.

---

# 82. API DESIGN

Base:

```text
/api/procurement
```

---

## Purchase Requests

```http
GET    /api/procurement/requests
GET    /api/procurement/requests/:id
POST   /api/procurement/requests
PUT    /api/procurement/requests/:id
POST   /api/procurement/requests/:id/submit
POST   /api/procurement/requests/:id/approve
POST   /api/procurement/requests/:id/reject
POST   /api/procurement/requests/:id/return
POST   /api/procurement/requests/:id/cancel
```

---

## RFQs

```http
GET  /api/procurement/rfqs
GET  /api/procurement/rfqs/:id
POST /api/procurement/rfqs
POST /api/procurement/rfqs/:id/issue
POST /api/procurement/rfqs/:id/close
```

---

## Quotations

```http
GET  /api/procurement/quotations
GET  /api/procurement/quotations/:id
POST /api/procurement/quotations
PUT  /api/procurement/quotations/:id
```

---

## Comparisons

```http
POST /api/procurement/comparisons
GET  /api/procurement/comparisons/:id
POST /api/procurement/comparisons/:id/select
```

---

## Purchase Orders

```http
GET  /api/procurement/purchase-orders
GET  /api/procurement/purchase-orders/:id
POST /api/procurement/purchase-orders
POST /api/procurement/purchase-orders/:id/approve
POST /api/procurement/purchase-orders/:id/reject
POST /api/procurement/purchase-orders/:id/send
POST /api/procurement/purchase-orders/:id/cancel
```

---

## Deliveries

```http
GET /api/procurement/deliveries
GET /api/procurement/deliveries/:id
POST /api/procurement/deliveries
```

---

## Invoice Matching

```http
GET  /api/procurement/invoices
GET  /api/procurement/invoices/:id
POST /api/procurement/invoices
POST /api/procurement/invoices/:id/match
POST /api/procurement/invoices/:id/approve
```

---

# 83. BACKEND STRUCTURE

Implement:

```text
server/
├── models/
│   ├── PurchaseRequest.js
│   ├── RFQ.js
│   ├── Quotation.js
│   ├── QuotationComparison.js
│   ├── PurchaseOrder.js
│   ├── PurchaseOrderRevision.js
│   ├── Delivery.js
│   ├── SupplierInvoice.js
│   └── VendorChangeRequest.js
│
├── controllers/
│   ├── purchaseRequestController.js
│   ├── rfqController.js
│   ├── quotationController.js
│   ├── comparisonController.js
│   ├── purchaseOrderController.js
│   ├── deliveryController.js
│   └── supplierInvoiceController.js
│
├── services/
│   └── procurement/
│       ├── purchaseRequestService.js
│       ├── approvalService.js
│       ├── rfqService.js
│       ├── quotationService.js
│       ├── comparisonService.js
│       ├── purchaseOrderService.js
│       ├── deliveryService.js
│       ├── invoiceMatchingService.js
│       └── procurementExceptionService.js
│
├── validators/
│   └── procurement/
│
└── routes/
    └── procurementRoutes.js
```

---

# 84. FRONTEND STRUCTURE

Create:

```text
client/src/portals/administration/procurement/
├── pages/
│   ├── ProcurementDashboard.jsx
│   ├── PurchaseRequests.jsx
│   ├── PurchaseRequestDetails.jsx
│   ├── ApprovalQueue.jsx
│   ├── RFQs.jsx
│   ├── Quotations.jsx
│   ├── QuotationComparison.jsx
│   ├── PurchaseOrders.jsx
│   ├── PurchaseOrderDetails.jsx
│   ├── Deliveries.jsx
│   ├── InvoiceMatching.jsx
│   ├── Exceptions.jsx
│   └── ProcurementReports.jsx
│
├── components/
│   ├── PurchaseRequestForm.jsx
│   ├── ApprovalTimeline.jsx
│   ├── RFQTable.jsx
│   ├── QuotationTable.jsx
│   ├── ComparisonTable.jsx
│   ├── PurchaseOrderForm.jsx
│   ├── DeliveryStatus.jsx
│   ├── InvoiceMatchView.jsx
│   └── ProcurementStatusBadge.jsx
│
└── services/
    └── procurementService.js
```

---

# 85. DATABASE INDEXES

Create indexes:

```text
purchaseRequestId UNIQUE
requesterId
departmentId
status
requiredByDate
priority

rfqId UNIQUE
vendorIds
status
responseDeadline

quotationId UNIQUE
vendorId
rfqId
status
validUntil

purchaseOrderId UNIQUE
vendorId
status
expectedDeliveryDate
purchaseRequestIds

deliveryId UNIQUE
purchaseOrderId
vendorId
status
expectedDate

supplierInvoiceId UNIQUE
vendorId
invoiceNumber
status
```

Use compound indexes where useful.

---

# 86. IDEMPOTENCY

Support idempotency for:

```text
PO submission
External RFQ submission
Goods receipt synchronization
Supplier invoice import
Vendor acknowledgement
Delivery status synchronization
```

Example:

```text
externalReference
+
internalTransactionId
```

must not create duplicate records.

---

# 87. CONCURRENCY CONTROL

Protect:

```text
Purchase Request approval
PO approval
PO cancellation
PO revision
Vendor selection
Goods receipt linkage
Invoice matching
```

Two users must not approve/revise the same transaction simultaneously in conflicting states.

---

# 88. STATE VALIDATION

Every action must validate current status.

Example:

```text
DRAFT → APPROVE
```

must fail.

Correct:

```text
PENDING_APPROVAL → APPROVED
```

Likewise:

```text
CLOSED → MODIFY
```

must fail.

---

# 89. DOCUMENT GENERATION

Integrate:

```text
27_DOCUMENT_GENERATION.md
```

Generate:

```text
Purchase Request
RFQ
Quotation Comparison
Purchase Order
PO Revision
Delivery Note
Goods Receipt
Supplier Invoice Record
Procurement Report
```

Approved documents should be versioned.

---

# 90. NOTIFICATIONS

Integrate:

```text
26_NOTIFICATION_SERVICE.md
```

Notify:

### Request submitted

Requester + approver.

### Approval required

Approver.

### Request approved

Requester + procurement.

### PO approved

Procurement.

### PO sent

Vendor/procurement.

### Delivery delayed

Procurement manager.

### Invoice mismatch

Procurement + finance.

### Exception

Responsible user.

---

# 91. NOTIFICATION CONTENT

Keep sensitive internal information out of vendor notifications.

Example:

```text
Purchase Order PO-2026-00115 has been issued.
Please log in to the vendor portal to view details.
```

Detailed information should be available through authenticated access.

---

# 92. REPORTS

Implement:

### Purchase Requests

```text
Requests by Department
Requests by Category
Requests by Status
Pending Approvals
```

### Procurement

```text
PO Value
PO Count
Vendor-wise Purchases
Category-wise Purchases
```

### Delivery

```text
On-time Delivery
Delayed Delivery
Partial Delivery
```

### Vendor

```text
Vendor Response Rate
Quotation Count
Selected Vendor Count
Delivery Performance
```

### Invoice

```text
Matched
Mismatched
Pending
```

---

# 93. PROCUREMENT KPIs

Dashboard:

```text
Open Purchase Requests
Pending Approvals
Open RFQs
Quotation Responses
POs This Month
PO Value
Delayed Deliveries
Invoice Mismatches
Average Procurement Cycle
RPA Failures
Open Exceptions
```

---

# 94. PROCUREMENT CYCLE TIME

Track timestamps:

```text
requestCreatedAt
requestApprovedAt
rfqCreatedAt
quotationReceivedAt
vendorSelectedAt
poCreatedAt
poApprovedAt
poSentAt
deliveryReceivedAt
goodsReceiptAt
invoiceMatchedAt
closedAt
```

Calculate:

```text
Request → Approval
Approval → PO
PO → Delivery
Delivery → Receipt
Receipt → Invoice Match
Total Procurement Cycle
```

---

# 95. AUDIT LOGGING

Create AuditEvent for:

```text
REQUEST_CREATED
REQUEST_SUBMITTED
REQUEST_APPROVED
REQUEST_REJECTED
REQUEST_RETURNED
RFQ_CREATED
RFQ_ISSUED
QUOTATION_RECEIVED
QUOTATION_SELECTED
VENDOR_SELECTED
PO_CREATED
PO_APPROVED
PO_REJECTED
PO_SENT
PO_ACKNOWLEDGED
PO_CANCELLED
PO_REVISED
DELIVERY_UPDATED
INVOICE_RECEIVED
INVOICE_MATCHED
INVOICE_MISMATCHED
EXCEPTION_CREATED
EXCEPTION_RESOLVED
```

---

# 96. SECURITY

Implement:

```text
JWT
RBAC
Backend authorization
Audit logging
Secure document storage
Secure vendor access
Input validation
Rate limiting
Secret management
```

Never trust frontend role checks alone.

---

# 97. VENDOR ACCESS SECURITY

Vendor users must only access:

```text
Their own vendor records
Their own RFQs
Their own POs
Their own delivery information
Their own invoices
```

Never allow:

```text
Vendor A → Vendor B data
```

Use server-side vendor scoping.

---

# 98. DATA PRIVACY

Procurement may contain:

```text
Pricing
Contracts
Vendor banking references
Internal approval data
Budget information
```

Restrict access by role.

Vendor must not see:

```text
Internal comparison scores
Other vendor prices
Internal approval comments
Internal budget information
```

unless explicitly configured.

---

# 99. SEED DATA

Create realistic demo data:

```text
30 Purchase Requests
15 RFQs
40 Quotations
10 Quotation Comparisons
20 Purchase Orders
15 Deliveries
15 Supplier Invoices
10 Exceptions
```

Include:

```text
Pending Approval
Approved
Rejected
Delayed
Partial Delivery
Matched Invoice
Price Mismatch
Quantity Mismatch
```

---

# 100. DEMO SCENARIO — NORMAL PROCUREMENT

Department:

```text
Laboratory
```

Requirement:

```text
1000 Test Tubes
```

Flow:

```text
Purchase Request
      ↓
Department Approval
      ↓
RFQ
      ↓
3 Quotations
      ↓
Comparison
      ↓
Human Vendor Selection
      ↓
PO
      ↓
Manager Approval
      ↓
Vendor
      ↓
Delivery
      ↓
Goods Receipt
      ↓
Inventory
      ↓
Supplier Invoice
      ↓
Three-Way Match
      ↓
Finance
      ↓
Closed
```

---

# 101. DEMO SCENARIO — PRICE MISMATCH

PO:

```text
Unit Price = ₹100
Quantity = 100
```

Invoice:

```text
Unit Price = ₹110
```

System:

```text
PRICE_MISMATCH
```

Do not automatically update the PO.

Create exception.

Human reviews.

---

# 102. DEMO SCENARIO — PARTIAL DELIVERY

PO:

```text
1000 units
```

First delivery:

```text
600 units
```

Status:

```text
PARTIALLY_DELIVERED
```

Inventory receives:

```text
600
```

Remaining:

```text
400
```

Second delivery:

```text
400
```

PO becomes:

```text
DELIVERED
```

then:

```text
RECEIVED
```

according to receipt workflow.

---

# 103. DEMO SCENARIO — DELAYED DELIVERY

Expected:

```text
2026-10-01
```

Today:

```text
2026-10-07
```

No delivery.

System creates:

```text
DELIVERY_DELAY
```

Notify procurement manager.

Do not automatically cancel the PO.

---

# 104. DEMO SCENARIO — VENDOR CHANGE

Vendor proposes:

```text
Quantity change
Price change
Delivery date change
```

System creates:

```text
VendorChangeRequest
```

Human reviews.

Do not silently modify approved PO.

---

# 105. TESTING

Unit tests:

```text
Purchase Request validation
Approval rules
RFQ creation
Quotation calculation
Quotation comparison
Vendor selection
PO calculation
PO approval
PO versioning
Delivery tracking
Three-way matching
Invoice mismatch
Idempotency
Exception handling
```

---

# 106. API TESTING

Test:

```text
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
```

Also:

```text
Duplicate PO
Invalid vendor
Expired quotation
Invalid status transition
Concurrent approval
Duplicate invoice
```

---

# 107. RBAC TESTING

Verify:

```text
Requester
→ creates request
→ cannot approve own restricted request

Procurement Officer
→ manages procurement
→ cannot perform restricted final approval if policy prevents it

Procurement Manager
→ approves configured transactions

Vendor
→ sees own data only

Inventory Staff
→ handles receipt
→ cannot approve PO

Finance
→ handles payment workflow
→ cannot alter vendor selection
```

---

# 108. RPA TESTING

Successful:

```text
Approved PO
→ External submission
→ External reference
→ Read-back
→ Success
```

Failure:

```text
External portal unavailable
→ FAILED
→ Exception
```

Unknown:

```text
Submit
→ Browser crash
→ Unknown result
→ Reconciliation
```

---

# 109. PERFORMANCE

Use:

```text
Pagination
Indexes
Projection
Aggregation
Background jobs
Async processing
```

Do not load all historical procurement records into the frontend.

---

# 110. CONFIGURATION

Create configurable:

```text
Approval thresholds
Approval hierarchy
Urgent procurement policy
RFQ response deadline
Quotation validity rules
PO change policy
Delivery tolerance
Receipt tolerance
Price tolerance
Quantity tolerance
Invoice matching tolerance
Segregation-of-duties rules
```

Never hard-code hospital-specific values.

---

# 111. NO AUTONOMOUS PROCUREMENT DECISIONS

The system may calculate:

```text
Lowest price
Fastest delivery
Variance
Match percentage
Historical vendor metrics
```

But it must not automatically:

```text
Select vendor
Approve purchase
Approve price change
Approve budget exception
Approve invoice mismatch
Authorize payment
```

unless a future explicit hospital policy enables a deterministic workflow and proper authorization.

Default behavior is human approval.

---

# 112. FINAL END-TO-END WORKFLOW

The completed Procurement module must support:

```text
DEPARTMENT
   ↓
PURCHASE REQUEST
   ↓
APPROVAL
   ↓
RFQ
   ↓
QUOTATIONS
   ↓
COMPARISON
   ↓
HUMAN VENDOR SELECTION
   ↓
PURCHASE ORDER
   ↓
APPROVAL
   ↓
VENDOR
   ↓
DELIVERY
   ↓
GOODS RECEIPT
   ↓
MEDICAL INVENTORY
   ↓
SUPPLIER INVOICE
   ↓
THREE-WAY MATCH
   ↓
FINANCE
   ↓
PAYMENT
   ↓
PROCUREMENT CLOSURE
   ↓
AUDIT / REPORTING
```

---

# 113. IMPLEMENTATION ORDER FOR AI CODING AGENT

Implement in this order:

```text
1. Purchase Request
        ↓
2. Approval Workflow
        ↓
3. RFQ
        ↓
4. Quotation
        ↓
5. Quotation Comparison
        ↓
6. Vendor Selection
        ↓
7. Purchase Order
        ↓
8. PO Approval
        ↓
9. Vendor Acknowledgement
        ↓
10. Delivery Tracking
        ↓
11. Goods Receipt Integration
        ↓
12. Three-Way Matching
        ↓
13. Finance Handoff
        ↓
14. Notifications
        ↓
15. Documents
        ↓
16. RPA
        ↓
17. Reports
        ↓
18. Audit / Security
        ↓
19. Testing
```

---

# 114. FINAL AI CODING AGENT INSTRUCTION

You are implementing **Module 19 — Procurement Management** inside the existing Hospital Administrative & RPA Platform.

Treat this document as an implementation specification.

Before coding:

1. Inspect the existing repository.
2. Reuse existing authentication.
3. Reuse existing RBAC.
4. Reuse Vendor Management.
5. Reuse Medical Inventory.
6. Reuse Notification Service.
7. Reuse Document Generation.
8. Reuse AuditEvent.
9. Reuse ExceptionCase.
10. Reuse RPAJob.
11. Preserve existing UI architecture.
12. Preserve existing API conventions.

Do not create duplicate vendor, inventory, patient, employee, notification, audit, or RPA systems.

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
Approval Workflow
↓
React UI
↓
Vendor Integration
↓
Inventory Integration
↓
Invoice Matching
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

Every procurement transaction must be:

```text
Validated
Authorized
Audited
Traceable
Idempotent where applicable
Exception-safe
```

The system must never silently:

```text
approve purchases
select vendors
change approved prices
change approved quantities
approve mismatches
authorize payments
```

RPA must execute approved actions and synchronize systems, not make procurement decisions.

When ambiguity occurs:

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

The final implementation must be a **fully functional hospital procurement management module**, not a static procurement dashboard or mock workflow.