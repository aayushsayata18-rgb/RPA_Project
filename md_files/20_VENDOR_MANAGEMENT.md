# 20_VENDOR_MANAGEMENT.md

# Hospital Administrative & RPA Platform
## Module 20 — Vendor Management

---

# 1. MODULE PURPOSE

Build a complete **Vendor Management module** for the Hospital Administrative & RPA Platform.

The module must provide a centralized, controlled vendor master and manage the vendor lifecycle from:

```text
Vendor Identification
        ↓
Vendor Registration
        ↓
Duplicate Check
        ↓
Document Collection
        ↓
Verification
        ↓
Approval
        ↓
ACTIVE Vendor
        ↓
Procurement Usage
        ↓
Purchase Orders
        ↓
Deliveries
        ↓
Performance Tracking
        ↓
Contract Management
        ↓
Compliance Monitoring
        ↓
Suspension / Inactivation
        ↓
Renewal / Reactivation / Closure
```

The module must support vendors supplying:

- Medicines
- Medical consumables
- Surgical supplies
- Laboratory supplies
- Radiology supplies
- Medical equipment
- IT equipment
- Maintenance services
- Housekeeping materials
- Facility services
- General hospital supplies
- Other configurable categories

---

# 2. CRITICAL ARCHITECTURAL PRINCIPLE

Vendor Management is the **authoritative source of truth for vendor master information**.

Other modules must reference:

```text
vendorId
```

rather than maintaining duplicate vendor profiles.

For example:

```text
Procurement
      ↓
vendorId
      ↓
Vendor Management
```

Medical Inventory may store a supplier reference, but must not create an independent vendor master.

---

# 3. MODULE RESPONSIBILITY

## Vendor Management owns

- Vendor master
- Vendor identity
- Vendor classification
- Vendor contacts
- Vendor addresses
- Vendor documents
- Vendor verification
- Vendor approval
- Vendor status
- Vendor categories
- Vendor bank/payment references where permitted
- Contracts
- Contract validity
- Compliance documents
- Vendor performance
- Vendor issues
- Vendor suspension
- Vendor reactivation
- Vendor deactivation
- Vendor audit history

## Procurement owns

```text
19_PROCUREMENT.md
```

- Purchase Requests
- RFQs
- Quotations
- Vendor selection for individual purchases
- Purchase Orders
- Delivery tracking
- Procurement approvals

Vendor Management provides the vendor master to Procurement.

---

# 4. IMPORTANT BOUNDARY

Vendor Management does **not** automatically decide:

- Which vendor should win a quotation
- Which vendor should receive a purchase order
- Whether a purchase should be approved
- Whether an invoice should be paid
- Whether a vendor should receive a contract
- Whether a vendor's performance is acceptable

The system may calculate and display information.

Authorized humans make final decisions.

---

# 5. USERS AND RBAC

## 5.1 Vendor Management Officer

Permissions:

```text id="7z4vpy"
vendor.view
vendor.create
vendor.edit
vendor.contact.manage
vendor.document.manage
vendor.verification.submit
vendor.performance.view
vendor.issue.create
```

---

# 6. VENDOR MANAGER

Additional:

```text id="y7qj7h"
vendor.verify
vendor.approve
vendor.suspend
vendor.reactivate
vendor.deactivate
vendor.contract.manage
vendor.compliance.manage
vendor.performance.manage
vendor.exception.resolve
```

---

# 7. PROCUREMENT OFFICER

Can:

```text id="slr6t7"
vendor.view
vendor.search
vendor.view_procurement_summary
vendor.view_active_contracts
```

Procurement Officer cannot modify the Vendor Master unless explicitly authorized.

---

# 8. PROCUREMENT MANAGER

Can view:

```text id="e5j18p"
vendor.performance
vendor.compliance
vendor.contracts
vendor.procurement_history
```

---

# 9. FINANCE STAFF

Can access authorized:

```text id="t2t8iz"
vendor.payment_reference
vendor.tax_information
vendor.invoice_information
```

Sensitive bank information must be masked.

---

# 10. VENDOR USER

A vendor may have restricted portal access.

Vendor user can:

```text id="f4t3pr"
view_own_profile
update_allowed_contacts
upload_documents
view_own_contracts
view_own_purchase_orders
acknowledge_po
update_delivery
submit_invoice
respond_to_rfq
```

Vendor users must never access:

```text id="c4w7ae"
Other Vendors
Internal Vendor Scores
Internal Approval Comments
Other Vendor Quotations
Internal Procurement Strategy
Hospital Internal Notes
```

---

# 11. SYSTEM ADMINISTRATOR

Can configure:

- Vendor categories
- Approval thresholds
- Required documents
- Compliance policies
- Vendor status rules
- RPA integrations
- Notification rules
- Document templates
- RBAC

System Admin must not automatically approve vendors.

---

# 12. CORE IDENTIFIERS

Use separate identifiers:

```text id="n5fx8e"
Vendor ID
Vendor User ID
Vendor Document ID
Vendor Contact ID
Vendor Contract ID
Vendor Performance Review ID
Vendor Issue ID
Vendor Verification ID
RPA Job ID
Correlation ID
```

Example:

```text id="wz8njy"
VEN-2026-00015
VUSR-00021
VDOC-00072
VCON-00031
VREV-00018
VISS-00009
```

---

# 13. VENDOR MASTER

Create:

```text id="fx5kjm"
Vendor
```

Fields:

```text id="4s8j3x"
vendorId
legalName
displayName
vendorType
vendorCategory
registrationNumber
taxIdentificationNumber
businessRegistrationNumber
website
email
phone
alternatePhone
address
city
state
country
postalCode
primaryContactId
status
riskLevel
verificationStatus
preferredVendor
createdAt
updatedAt
createdBy
updatedBy
```

---

# 14. VENDOR TYPES

Support configurable:

```text id="3jv2h8"
SUPPLIER
SERVICE_PROVIDER
EQUIPMENT_VENDOR
PHARMACEUTICAL_VENDOR
LAB_SUPPLIER
MEDICAL_DEVICE_VENDOR
FACILITY_VENDOR
IT_VENDOR
OTHER
```

---

# 15. VENDOR CATEGORIES

Examples:

```text id="k8m8y1"
MEDICINES
MEDICAL_CONSUMABLES
SURGICAL
LABORATORY
RADIOLOGY
EQUIPMENT
MAINTENANCE
HOUSEKEEPING
IT
FACILITY
GENERAL
```

Categories must be configurable.

A vendor may belong to multiple categories.

---

# 16. VENDOR STATUS

Use:

```text id="r8gqhp"
DRAFT
PENDING_VERIFICATION
PENDING_APPROVAL
ACTIVE
ON_HOLD
SUSPENDED
INACTIVE
REJECTED
DEACTIVATED
```

---

# 17. STATUS TRANSITIONS

Primary flow:

```text id="1i6l2x"
DRAFT
 ↓
PENDING_VERIFICATION
 ↓
PENDING_APPROVAL
 ↓
ACTIVE
```

Alternative:

```text id="5v9x02"
PENDING_VERIFICATION
 ↓
REJECTED
```

Operational:

```text id="q4p7wo"
ACTIVE
 ↓
ON_HOLD
 ↓
ACTIVE
```

or:

```text id="j1q4on"
ACTIVE
 ↓
SUSPENDED
 ↓
ACTIVE
```

Permanent:

```text id="u5l7aa"
ACTIVE
 ↓
DEACTIVATED
```

---

# 18. DUPLICATE VENDOR DETECTION

Before creating a vendor, check possible duplicates using:

```text id="u1sjjq"
Legal Name
Registration Number
Tax ID
Business Registration Number
Primary Email
Phone
Bank reference where authorized
```

Example:

```text id="2w3kpa"
Existing:
ABC Medical Supplies Pvt Ltd

New:
ABC Medical Supplies Private Limited
```

The system should flag:

```text id="o7b7v4"
POSSIBLE_DUPLICATE
```

It must not automatically merge records.

---

# 19. VENDOR DUPLICATE REVIEW

Possible duplicate workflow:

```text id="brg72f"
New Vendor
     ↓
Duplicate Detection
     ↓
Potential Matches
     ↓
Human Review
     ↓
Confirm New Vendor
OR
Link Existing Vendor
OR
Reject Registration
```

---

# 20. VENDOR ONBOARDING

Vendor onboarding must support:

```text id="3z2mnp"
Manual registration
Vendor self-registration
Procurement-created registration
Imported vendor data
RPA synchronization
```

---

# 21. VENDOR REGISTRATION FORM

Fields:

```text id="i3u4c0"
Legal Name
Display Name
Vendor Type
Categories
Registration Number
Tax ID
Business Registration Number
Email
Phone
Address
Primary Contact
Secondary Contact
Website
Services / Products
Documents
Notes
```

---

# 22. VENDOR SELF-REGISTRATION

Optional vendor portal flow:

```text id="t13q0q"
Vendor Opens Registration
       ↓
Creates Account
       ↓
Enters Company Information
       ↓
Uploads Documents
       ↓
Submits
       ↓
PENDING_VERIFICATION
       ↓
Hospital Review
       ↓
Approval
```

Vendor must not become ACTIVE automatically.

---

# 23. VENDOR CONTACT

Create:

```text id="v1ylfl"
VendorContact
```

Fields:

```text id="p2y7z8"
vendorContactId
vendorId
name
designation
department
email
phone
alternatePhone
contactType
isPrimary
status
createdAt
updatedAt
```

---

# 24. CONTACT TYPES

```text id="9f5xhj"
SALES
SUPPORT
ACCOUNTS
LOGISTICS
TECHNICAL
MANAGEMENT
PRIMARY
OTHER
```

A vendor may have multiple contacts.

---

# 25. PRIMARY CONTACT RULE

A vendor should have at most one active primary contact per configured contact purpose.

Do not allow accidental duplicate primary contacts.

---

# 26. VENDOR ADDRESS

Support multiple addresses:

```text id="7dsk2m"
REGISTERED
BILLING
SHIPPING
WAREHOUSE
OFFICE
OTHER
```

Create:

```text id="zq1tdd"
VendorAddress
```

Fields:

```text id="4ykqbd"
addressId
vendorId
addressType
line1
line2
city
state
country
postalCode
isPrimary
status
```

---

# 27. VENDOR DOCUMENTS

Create:

```text id="xj66tg"
VendorDocument
```

Documents may include:

```text id="qk9c0r"
Business Registration
Tax Certificate
License
Product Authorization
Quality Certificate
Insurance Certificate
Bank Document
Contract
Compliance Certificate
Other
```

Do not hard-code country-specific licenses.

Document types must be configurable.

---

# 28. VENDOR DOCUMENT MODEL

Fields:

```text id="o3myk8"
vendorDocumentId
vendorId
documentType
documentNumber
issueDate
expiryDate
issuer
fileReference
status
verificationStatus
uploadedBy
verifiedBy
verifiedAt
createdAt
updatedAt
```

---

# 29. DOCUMENT STATUS

```text id="0c4w9b"
UPLOADED
UNDER_REVIEW
VERIFIED
REJECTED
EXPIRED
REPLACED
CANCELLED
```

---

# 30. DOCUMENT EXPIRY

For documents with expiry dates:

```text id="f5s8my"
expiryDate
```

The system must monitor:

```text id="ww7u2n"
Expired
Expiring Soon
```

Example configuration:

```text id="j0i8af"
30 days
60 days
90 days
```

---

# 31. DOCUMENT EXPIRY ALERT

Example:

```text id="j5rrq3"
Vendor = ABC Medical
Certificate expires in 20 days
```

Create:

```text id="uh8j5g"
VENDOR_DOCUMENT_EXPIRING
```

Notify Vendor Management.

If the document is required for continued vendor activity, apply the configured vendor status policy.

Do not invent legal consequences.

---

# 32. DOCUMENT VERIFICATION

Workflow:

```text id="uw2iys"
Upload
 ↓
Validate File
 ↓
Review Metadata
 ↓
Human Verification
 ↓
VERIFIED / REJECTED
```

RPA may collect/validate external evidence but final verification must remain with authorized staff where required.

---

# 33. VENDOR VERIFICATION

Create:

```text id="l7s6u7"
VendorVerification
```

Fields:

```text id="p9y4n1"
verificationId
vendorId
verificationType
requestedAt
startedAt
completedAt
status
result
verifiedBy
evidence[]
notes
```

---

# 34. VERIFICATION TYPES

Configurable:

```text id="zgnf90"
IDENTITY
BUSINESS_REGISTRATION
TAX
LICENSE
BANK
ADDRESS
COMPLIANCE
PRODUCT_AUTHORIZATION
CONTRACT
OTHER
```

---

# 35. VERIFICATION STATUS

```text id="n5j1h0"
NOT_STARTED
IN_PROGRESS
PASSED
FAILED
PARTIAL
PENDING_HUMAN_REVIEW
EXPIRED
```

---

# 36. VENDOR APPROVAL

Vendor cannot become ACTIVE until required verification and approvals are complete.

Flow:

```text id="k15zj4"
Registration
 ↓
Validation
 ↓
Verification
 ↓
Required Documents
 ↓
Approval
 ↓
ACTIVE
```

---

# 37. APPROVAL RULES

Approval requirements must be configurable.

Example:

```text id="5w6d0r"
Low-risk vendor
→ Vendor Manager

High-risk / critical supplier
→ Additional Management Approval
```

These are examples only.

Never hard-code financial/legal thresholds.

---

# 38. VENDOR RISK LEVEL

Support:

```text id="vkvkxb"
LOW
MEDIUM
HIGH
CRITICAL
```

Risk level may be calculated using configured criteria, but final classification should be reviewable by authorized personnel.

---

# 39. RISK FACTORS

Potential factors:

```text id="sg1x1m"
Critical product category
Document completeness
Compliance history
Delivery history
Quality issues
Contract status
External verification
Incident history
```

Do not create unsupported legal/compliance assumptions.

---

# 40. VENDOR APPROVAL DECISION

Store:

```text id="m1a8vq"
decision
decisionReason
approvedBy
approvedAt
```

Possible:

```text id="phb8i8"
APPROVE
REJECT
RETURN_FOR_CORRECTION
```

---

# 41. VENDOR REJECTION

Require:

```text id="6f6vl8"
rejectionReason
```

Notify vendor if appropriate.

Rejected vendor may be resubmitted only through an authorized workflow.

---

# 42. VENDOR ON HOLD

`ON_HOLD` is an operational status.

Reasons may include:

```text id="y5u3jr"
Missing document
Pending clarification
Pending renewal
Temporary business issue
Internal review
```

Store:

```text id="gl4rte"
holdReason
holdStart
expectedResolutionDate
placedBy
```

---

# 43. VENDOR SUSPENSION

Suspension is a controlled action.

Possible triggers:

```text id="cx4r6u"
Serious unresolved issue
Expired mandatory document
Repeated delivery failures
Quality issue
Management decision
Contract issue
```

The system may recommend suspension but must not automatically suspend based solely on an arbitrary score.

---

# 44. SUSPENSION WORKFLOW

```text id="r8x7jb"
Issue / Review
 ↓
Suspend Request
 ↓
Authorized Review
 ↓
Approval
 ↓
SUSPENDED
 ↓
Notify Relevant Users
```

---

# 45. SUSPENDED VENDOR PROCUREMENT BEHAVIOR

By default:

```text id="2hr5se"
SUSPENDED
```

vendors cannot be selected for new procurement.

Existing open POs must not automatically disappear.

They should be flagged for review.

Example:

```text id="r6k7h4"
Existing PO
+
Vendor Suspended
=
REVIEW REQUIRED
```

---

# 46. VENDOR REACTIVATION

Workflow:

```text id="g2fr0y"
SUSPENDED / INACTIVE
      ↓
Reactivation Request
      ↓
Document Review
      ↓
Verification
      ↓
Approval
      ↓
ACTIVE
```

Do not automatically reactivate.

---

# 47. VENDOR DEACTIVATION

A vendor can be deactivated when no longer active.

Before deactivation check:

```text id="7c6kby"
Open Purchase Orders
Open Deliveries
Pending Invoices
Active Contracts
Open Claims / Issues
Pending Documents
```

If dependencies exist:

```text id="4x2k6h"
BLOCK OR REQUIRE AUTHORIZED OVERRIDE
```

Do not delete the vendor.

---

# 48. SOFT DELETE

Never physically delete a vendor that has procurement history.

Use:

```text id="8e9fgi"
INACTIVE
DEACTIVATED
```

Historical transactions must continue referencing the vendor.

---

# 49. VENDOR CONTRACT

Create:

```text id="n2c1bf"
VendorContract
```

Fields:

```text id="y8p9qs"
contractId
vendorId
contractNumber
contractType
startDate
endDate
status
scope
value
currency
renewalType
renewalNoticeDays
documents[]
approvedBy
createdBy
```

---

# 50. CONTRACT TYPES

Configurable:

```text id="g0f8hm"
SUPPLY
SERVICE
MAINTENANCE
EQUIPMENT
FRAMEWORK
RATE_CONTRACT
OTHER
```

---

# 51. CONTRACT STATUS

```text id="w6yqla"
DRAFT
PENDING_APPROVAL
ACTIVE
EXPIRING
EXPIRED
SUSPENDED
TERMINATED
RENEWAL_PENDING
```

---

# 52. CONTRACT EXPIRY

If:

```text id="t4fxw9"
endDate - currentDate <= renewalNoticeDays
```

generate:

```text id="rqy3v6"
CONTRACT_EXPIRING
```

Notify responsible users.

Do not automatically renew a contract.

---

# 53. CONTRACT RENEWAL

Workflow:

```text id="h8r8gj"
Contract Expiring
      ↓
Renewal Review
      ↓
Performance Review
      ↓
Commercial Review
      ↓
Human Decision
      ↓
Renew / Replace / Close
```

---

# 54. VENDOR PERFORMANCE

Create:

```text id="t6jv8z"
VendorPerformanceReview
```

Metrics may include:

```text id="1lrr1x"
On-time delivery
Quantity accuracy
Quality issues
Response time
Quotation responsiveness
Invoice accuracy
Contract compliance
Issue resolution
```

---

# 55. PERFORMANCE CALCULATION

The system may calculate objective metrics.

Example:

```text id="m7fhk4"
On-Time Delivery %
Quantity Accuracy %
Invoice Match %
Issue Resolution Time
```

But do not automatically mark a vendor as unsuitable solely from an arbitrary score.

Human review remains available.

---

# 56. PERFORMANCE REVIEW MODEL

Fields:

```text id="0uqbtl"
reviewId
vendorId
periodStart
periodEnd
metrics
overallScore
reviewStatus
reviewedBy
reviewedAt
comments
```

---

# 57. PERFORMANCE REVIEW STATUS

```text id="2u8lyb"
DRAFT
PENDING_REVIEW
COMPLETED
ACKNOWLEDGED
DISPUTED
CLOSED
```

---

# 58. VENDOR ISSUE

Create:

```text id="7yupw0"
VendorIssue
```

Examples:

```text id="4v4t1z"
Late Delivery
Wrong Quantity
Damaged Goods
Quality Concern
Documentation Issue
Invoice Issue
Communication Issue
Contract Issue
Other
```

---

# 59. VENDOR ISSUE MODEL

Fields:

```text id="w4x5hi"
issueId
vendorId
purchaseOrderId
deliveryId
category
severity
description
reportedBy
assignedTo
status
resolution
resolvedBy
resolvedAt
createdAt
updatedAt
```

---

# 60. ISSUE SEVERITY

```text id="2eq2rf"
LOW
MEDIUM
HIGH
CRITICAL
```

Severity must be assigned according to configurable policy.

Do not let RPA make sensitive risk determinations.

---

# 61. ISSUE STATUS

```text id="w6s9xx"
OPEN
UNDER_REVIEW
VENDOR_RESPONSE_REQUIRED
IN_PROGRESS
RESOLVED
CLOSED
REJECTED
```

---

# 62. VENDOR RESPONSE

Vendor may respond to an issue through a restricted portal.

Store:

```text id="8ubwzo"
response
respondedAt
respondedBy
attachments
```

Hospital staff must review the response.

---

# 63. VENDOR COMMUNICATION

Create a communication history:

```text id="e2y7i3"
VendorCommunication
```

Track:

```text id="3v3knu"
vendorId
communicationType
subject
referenceType
referenceId
direction
sender
recipient
messageReference
timestamp
status
```

Examples:

```text id="h2t6v8"
Email
Portal Message
Phone Log
System Notification
Document Submission
```

Do not store unnecessary sensitive information.

---

# 64. VENDOR BANK INFORMATION

If bank/payment information is stored, create a separate restricted structure:

```text id="a0v5y9"
VendorPaymentProfile
```

Fields should be minimized and access restricted.

Example:

```text id="8l9h24"
vendorId
accountName
bankName
maskedAccountNumber
accountReference
verificationStatus
verifiedBy
verifiedAt
```

Do not display complete bank account information to ordinary procurement users.

---

# 65. BANK DETAIL CHANGE

Bank detail changes are sensitive.

Workflow:

```text id="j0e7wv"
Change Request
 ↓
Document / Evidence
 ↓
Verification
 ↓
Human Approval
 ↓
Update
 ↓
Audit
```

RPA must not independently approve bank detail changes.

---

# 66. TAX / REGISTRATION DATA

Store configurable regulatory/business identifiers.

Do not hard-code country-specific tax logic.

Example:

```text id="k7w5m9"
taxIdentificationNumber
registrationNumber
```

Validation rules must be configurable.

---

# 67. VENDOR SEARCH

Search by:

```text id="u6b7xk"
Vendor ID
Legal Name
Display Name
Registration Number
Tax ID
Category
City
Status
Risk Level
```

Support:

```text id="7s0q2a"
Active only
Verified only
Expiring documents
Suspended
Contract expiring
```

---

# 68. VENDOR DASHBOARD

Route:

```text id="9y4j3h"
/administration/vendors
```

KPIs:

```text id="a3i8m4"
Total Vendors
Active Vendors
Pending Verification
Pending Approval
Suspended
Expiring Documents
Expiring Contracts
Open Vendor Issues
High-Risk Vendors
RPA Sync Failures
```

---

# 69. VENDOR DETAILS SCREEN

Show:

```text id="f5v7em"
Vendor Profile
Contacts
Addresses
Documents
Verification
Contracts
Procurement History
Performance
Issues
Communications
Audit History
```

Use tabs.

---

# 70. VENDOR PROFILE UI

Sections:

```text id="6shhbe"
Company Information
Classification
Contacts
Addresses
Categories
Status
Risk
Verification
```

Actions depend on RBAC:

```text id="9nq4jo"
Edit
Submit Verification
Approve
Place On Hold
Suspend
Reactivate
Deactivate
```

---

# 71. VENDOR DOCUMENT UI

Show:

```text id="7j0l0v"
Document Type
Document Number
Issue Date
Expiry Date
Verification Status
Uploaded By
Verified By
```

Actions:

```text id="bq5w9p"
Upload
Replace
Verify
Reject
Download
```

Access must be permission-controlled.

---

# 72. CONTRACT UI

Show:

```text id="w1c8za"
Contract Number
Type
Start Date
End Date
Value
Status
Renewal Notice
```

Actions:

```text id="v9i8ny"
Create
Edit Draft
Submit
Approve
Renew
Terminate
```

---

# 73. PERFORMANCE UI

Display:

```text id="ezv4q4"
Delivery Performance
Quality Performance
Invoice Accuracy
Issue Resolution
Overall Score
Review History
```

Charts must be interactive.

---

# 74. VENDOR ISSUE UI

Display:

```text id="m5f7y9"
Issue ID
Vendor
Category
Severity
PO
Description
Status
Assigned To
Vendor Response
Resolution
```

---

# 75. VENDOR PORTAL

Route:

```text id="y17f9d"
/vendor
```

Vendor can see:

```text id="q1x2s3"
Dashboard
Company Profile
Documents
RFQs
Purchase Orders
Deliveries
Invoices
Contracts
Issues
Notifications
```

All queries must be scoped to the authenticated vendor.

---

# 76. VENDOR PORTAL PROFILE EDIT

Vendor may update only configurable fields.

Example:

```text id="1py4i0"
Contact Person
Phone
Email
Address
Supporting Documents
```

Sensitive master fields may require hospital approval.

Vendor changes should create:

```text id="x5x9ca"
VendorChangeRequest
```

when approval is required.

---

# 77. VENDOR CHANGE REQUEST

Create:

```text id="0q9h1v"
VendorChangeRequest
```

Fields:

```text id="13q3fk"
changeRequestId
vendorId
requestedBy
changeType
before
after
reason
documents
status
reviewedBy
reviewedAt
```

Statuses:

```text id="2g3m4n"
DRAFT
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
CANCELLED
```

---

# 78. PROCUREMENT INTEGRATION

Procurement should query:

```text id="7nd2ay"
GET /api/vendors?status=ACTIVE
```

Before vendor selection verify:

```text id="4k9w4d"
Vendor ACTIVE?
Required documents valid?
Contract requirements met?
Allowed category?
Any blocking status?
```

The system may flag issues but should follow configured procurement policy.

---

# 79. SUSPENDED VENDOR + PROCUREMENT

If vendor becomes suspended:

```text id="6ys8kp"
New Vendor Selection
→ BLOCK / REVIEW
```

Existing PO:

```text id="j8o5my"
Flag for Review
```

Do not automatically cancel it.

---

# 80. INVENTORY INTEGRATION

Inventory references:

```text id="0a6h0s"
vendorId
```

for:

- Goods received
- Batch supplier
- Purchase Order
- Supplier history

Inventory does not duplicate vendor information.

---

# 81. PROCUREMENT PERFORMANCE DATA

Vendor Management may consume Procurement data:

```text id="5f0q7u"
PO count
PO value
Delivery performance
Late deliveries
Quotation response
Invoice mismatch
```

These are derived/reference data.

The source transaction remains in Procurement.

---

# 82. RPA RESPONSIBILITIES

Robot Framework may automate:

- Vendor portal synchronization
- External vendor registry lookups
- Document collection
- Vendor status synchronization
- Vendor certificate expiry checks
- Vendor profile synchronization
- Vendor acknowledgement
- External compliance portal data collection
- Vendor performance data import

RPA must not:

- approve vendors
- approve contracts
- approve bank changes
- suspend vendors autonomously
- classify a vendor as legally compliant without required human verification
- select vendors for procurement

---

# 83. RPA — VENDOR DATA SYNC

Flow:

```text id="q1p7i4"
External Vendor System
      ↓
Read Vendor Data
      ↓
Normalize
      ↓
Match Vendor
      ↓
Compare
      ↓
Create Change Proposal
      ↓
Human Review if required
      ↓
Update
      ↓
Audit
```

Do not blindly overwrite hospital master data.

---

# 84. RPA — DOCUMENT EXPIRY CHECK

Robot may:

```text id="r4t6k2"
Login External Portal
↓
Read Certificate Status
↓
Read Expiry
↓
Compare
↓
Update Verification Evidence
↓
Notify
```

If external result is ambiguous:

```text id="s8n3z5"
PENDING_HUMAN_REVIEW
```

---

# 85. RPA — VENDOR STATUS

RPA may read external status.

Example:

```text id="6z4w8c"
External Status = ACTIVE
```

This does not automatically mean:

```text id="b9f4e1"
Hospital Vendor = ACTIVE
```

The hospital's own verification/approval rules remain authoritative.

---

# 86. RPA GOLDEN RULE

Always:

```text id="p0h1h8"
INPUT
 ↓
READ
 ↓
VALIDATE
 ↓
COMPARE
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

Ambiguous:

```text id="x7s6d2"
EXCEPTION
 ↓
HUMAN REVIEW
 ↓
AUTHORIZED DECISION
 ↓
CONTINUE
```

---

# 87. ROBOT FRAMEWORK STRUCTURE

Create:

```text id="j0d4y7"
robot/
├── resources/
│   ├── common.resource
│   ├── authentication.resource
│   ├── vendor.resource
│   ├── procurement.resource
│   └── api.resource
│
├── keywords/
│   ├── vendor_keywords.resource
│   ├── document_keywords.resource
│   ├── verification_keywords.resource
│   ├── contract_keywords.resource
│   └── performance_keywords.resource
│
├── tests/
│   ├── vendor_sync.robot
│   ├── document_expiry.robot
│   ├── vendor_verification.robot
│   ├── vendor_status_sync.robot
│   └── vendor_exception.robot
│
├── portals/
│   ├── vendor_portal.robot
│   └── external_registry.robot
│
└── results/
```

---

# 88. ROBOT KEYWORDS

Implement:

```text id="2kq5d4"
Login To Vendor Portal
Search Vendor
Read Vendor Profile
Read Vendor Documents
Read Document Expiry
Read Vendor Status
Compare Vendor Data
Create Change Request
Create Exception
Capture Evidence
Logout
```

---

# 89. RPA JOB TYPES

Use:

```text id="5z7l0q"
VENDOR_PROFILE_SYNC
VENDOR_DOCUMENT_SYNC
VENDOR_VERIFICATION_CHECK
VENDOR_STATUS_SYNC
VENDOR_EXPIRY_CHECK
VENDOR_PERFORMANCE_IMPORT
```

---

# 90. RPA RETRY RULE

Retry only technical failures:

```text id="u5e4xy"
NETWORK_TIMEOUT
TEMPORARY_BROWSER_FAILURE
TEMPORARY_API_FAILURE
```

Do not blindly retry:

```text id="2t8e4g"
INVALID_VENDOR
UNKNOWN_VENDOR
VERIFICATION_FAILURE
DOCUMENT_REJECTED
AUTHORIZATION_FAILURE
UNKNOWN_EXTERNAL_RESULT
```

---

# 91. UNKNOWN EXTERNAL RESULT

Example:

```text id="w9o1y4"
RPA updates external vendor system
↓
Browser crashes
↓
Unknown whether update succeeded
```

Do not submit again blindly.

Create:

```text id="3z1t7c"
UNKNOWN_EXTERNAL_VENDOR_RESULT
```

and reconcile.

---

# 92. API DESIGN

Base:

```text id="u8l5rq"
/api/vendors
```

---

## Vendor APIs

```http id="9zbrg8"
GET    /api/vendors
GET    /api/vendors/:id
POST   /api/vendors
PUT    /api/vendors/:id
PATCH  /api/vendors/:id/status
```

---

## Contacts

```http id="d2n5k9"
GET    /api/vendors/:id/contacts
POST   /api/vendors/:id/contacts
PUT    /api/vendors/:id/contacts/:contactId
DELETE /api/vendors/:id/contacts/:contactId
```

---

## Documents

```http id="p5b7yx"
GET  /api/vendors/:id/documents
POST /api/vendors/:id/documents
POST /api/vendors/:id/documents/:documentId/verify
POST /api/vendors/:id/documents/:documentId/reject
```

---

## Verification

```http id="t2x7zk"
POST /api/vendors/:id/verification
GET  /api/vendors/:id/verification
POST /api/vendors/:id/verification/:verificationId/complete
```

---

## Contracts

```http id="g8c0qa"
GET  /api/vendors/:id/contracts
POST /api/vendors/:id/contracts
PUT  /api/vendors/:id/contracts/:contractId
POST /api/vendors/:id/contracts/:contractId/approve
POST /api/vendors/:id/contracts/:contractId/renew
POST /api/vendors/:id/contracts/:contractId/terminate
```

---

## Performance

```http id="v1b9v4"
GET  /api/vendors/:id/performance
POST /api/vendors/:id/performance/reviews
POST /api/vendors/:id/performance/reviews/:reviewId/complete
```

---

## Issues

```http id="g4x6p8"
GET  /api/vendors/:id/issues
POST /api/vendors/:id/issues
POST /api/vendors/:id/issues/:issueId/resolve
```

---

# 93. BACKEND STRUCTURE

Implement:

```text id="b6s1pd"
server/
├── models/
│   ├── Vendor.js
│   ├── VendorContact.js
│   ├── VendorAddress.js
│   ├── VendorDocument.js
│   ├── VendorVerification.js
│   ├── VendorContract.js
│   ├── VendorPerformanceReview.js
│   ├── VendorIssue.js
│   ├── VendorCommunication.js
│   ├── VendorPaymentProfile.js
│   └── VendorChangeRequest.js
│
├── controllers/
│   ├── vendorController.js
│   ├── vendorContactController.js
│   ├── vendorDocumentController.js
│   ├── vendorVerificationController.js
│   ├── vendorContractController.js
│   ├── vendorPerformanceController.js
│   └── vendorIssueController.js
│
├── services/
│   └── vendor/
│       ├── vendorService.js
│       ├── duplicateDetectionService.js
│       ├── vendorVerificationService.js
│       ├── vendorDocumentService.js
│       ├── vendorContractService.js
│       ├── vendorPerformanceService.js
│       ├── vendorIssueService.js
│       └── vendorStatusService.js
│
├── validators/
│   └── vendor/
│
└── routes/
    └── vendorRoutes.js
```

---

# 94. FRONTEND STRUCTURE

Create:

```text id="pj4k5s"
client/src/portals/administration/vendors/
├── pages/
│   ├── VendorDashboard.jsx
│   ├── VendorList.jsx
│   ├── VendorDetails.jsx
│   ├── VendorRegistration.jsx
│   ├── VendorVerification.jsx
│   ├── VendorDocuments.jsx
│   ├── VendorContracts.jsx
│   ├── VendorPerformance.jsx
│   ├── VendorIssues.jsx
│   └── VendorReports.jsx
│
├── components/
│   ├── VendorForm.jsx
│   ├── VendorStatusBadge.jsx
│   ├── VendorDocumentTable.jsx
│   ├── VendorContactTable.jsx
│   ├── VendorContractTable.jsx
│   ├── VendorPerformanceChart.jsx
│   ├── VendorIssueTable.jsx
│   └── VendorTimeline.jsx
│
└── services/
    └── vendorService.js
```

---

# 95. DATABASE INDEXES

Create:

```text id="a3q6yr"
vendorId UNIQUE
legalName
displayName
registrationNumber
taxIdentificationNumber
status
vendorType
vendorCategory
riskLevel
verificationStatus
```

Compound indexes:

```text id="v8l6z4"
status + vendorCategory
status + verificationStatus
vendorId + status
```

Contacts:

```text id="s3y9k2"
vendorId
email
phone
```

Documents:

```text id="n1z5o8"
vendorId
documentType
expiryDate
verificationStatus
```

Contracts:

```text id="y8f1w4"
vendorId
status
endDate
```

Performance:

```text id="d2r5k7"
vendorId
periodStart
periodEnd
```

---

# 96. DATA CONSISTENCY

When a vendor is referenced by Procurement:

```text id="t1w7w8"
vendorId
```

must resolve to a valid vendor.

Do not copy mutable vendor data into Purchase Orders unless storing an intentional historical snapshot.

---

# 97. HISTORICAL SNAPSHOTS

Purchase Orders may store:

```text id="0k9s7x"
vendorNameSnapshot
vendorAddressSnapshot
vendorContactSnapshot
```

This ensures historical documents remain correct even if the vendor master changes later.

The snapshot is not a replacement for `vendorId`.

---

# 98. CONCURRENCY CONTROL

Protect:

```text id="e4j7b2"
Vendor approval
Vendor suspension
Vendor reactivation
Document verification
Contract approval
Bank profile approval
Vendor change requests
```

Two users must not approve incompatible status transitions simultaneously.

---

# 99. IDEMPOTENCY

Support idempotency for:

```text id="q7s8p3"
Vendor import
External vendor synchronization
Document import
Vendor status synchronization
```

Use:

```text id="9z4v8m"
externalVendorId
sourceSystem
externalReference
```

where available.

---

# 100. AUDIT LOGGING

Create AuditEvent for:

```text id="3d6h9p"
VENDOR_CREATED
VENDOR_UPDATED
VENDOR_SUBMITTED
VENDOR_VERIFIED
VENDOR_APPROVED
VENDOR_REJECTED
VENDOR_HOLD
VENDOR_SUSPENDED
VENDOR_REACTIVATED
VENDOR_DEACTIVATED
DOCUMENT_UPLOADED
DOCUMENT_VERIFIED
DOCUMENT_REJECTED
CONTRACT_CREATED
CONTRACT_APPROVED
CONTRACT_RENEWED
CONTRACT_TERMINATED
PERFORMANCE_REVIEW_CREATED
PERFORMANCE_REVIEW_COMPLETED
ISSUE_CREATED
ISSUE_RESOLVED
BANK_CHANGE_REQUESTED
BANK_CHANGE_APPROVED
```

---

# 101. SECURITY

Implement:

```text id="x8w3a5"
JWT authentication
RBAC
Backend authorization
Vendor-level data isolation
Document access control
Secure file uploads
Audit logging
Rate limiting
Secret management
```

Vendor portal requests must always be scoped by authenticated vendor ID.

Never trust:

```text id="q9b2v1"
vendorId
```

supplied by the frontend.

Derive vendor identity from authenticated context.

---

# 102. FILE UPLOAD SECURITY

Allowed documents should be configurable.

Validate:

```text id="2m5x7z"
MIME type
Extension
File size
File signature where possible
Virus/malware scanning integration if available
```

Never allow executable files.

---

# 103. NOTIFICATIONS

Use:

```text id="z5j6p7"
26_NOTIFICATION_SERVICE.md
```

Notifications:

```text id="j8m4r6"
Vendor Registration Submitted
Verification Required
Vendor Approved
Vendor Rejected
Document Expiring
Document Expired
Contract Expiring
Vendor Issue Created
Vendor Issue Response Required
Vendor Suspended
Vendor Reactivated
```

---

# 104. DOCUMENT GENERATION

Integrate:

```text id="q1w8e3"
27_DOCUMENT_GENERATION.md
```

Generate:

```text id="m5k7x9"
Vendor Registration Summary
Vendor Approval Record
Vendor Verification Report
Vendor Contract
Vendor Performance Report
Vendor Issue Report
Vendor Compliance Summary
```

---

# 105. REPORTS

Implement:

### Vendor Master

```text id="v6z3a2"
Vendors by Status
Vendors by Category
Vendors by Type
Vendors by Location
```

### Compliance

```text id="k4y7b9"
Missing Documents
Expiring Documents
Expired Documents
Pending Verification
```

### Contracts

```text id="p3x5c7"
Active Contracts
Expiring Contracts
Expired Contracts
Contracts by Category
```

### Performance

```text id="d8m1n5"
On-Time Delivery
Quality Issues
Invoice Accuracy
Issue Resolution
Vendor Performance Trends
```

---

# 106. VENDOR KPIs

Dashboard:

```text id="j3k5p8"
Active Vendors
Pending Onboarding
Pending Verification
Documents Expiring
Contracts Expiring
Suspended Vendors
Open Issues
Average Vendor Response Time
Average Issue Resolution Time
Average Delivery Performance
RPA Failures
```

---

# 107. CONFIGURATION

Support configurable:

```text id="a5s7d9"
Required vendor documents
Verification requirements
Approval hierarchy
Risk criteria
Document expiry warning days
Contract renewal warning days
Suspension rules
Reactivation requirements
Vendor categories
Vendor types
Performance metrics
```

---

# 108. NO HARD-CODED LEGAL RULES

The system must not assume:

```text id="p9q1s3"
specific country license requirements
specific tax formats
specific regulatory approval rules
specific banking verification laws
```

unless explicitly configured for the hospital's jurisdiction.

---

# 109. DEMO SCENARIO — NEW VENDOR

Vendor:

```text id="b3n7m9"
ABC Medical Supplies Pvt Ltd
```

Flow:

```text id="w5h8k2"
Registration
↓
Duplicate Check
↓
Document Upload
↓
Verification
↓
Manager Approval
↓
ACTIVE
```

---

# 110. DEMO SCENARIO — EXPIRING DOCUMENT

Vendor:

```text id="u4c7a1"
ABC Medical Supplies
```

Certificate:

```text id="e8p2l6"
Expiry = 20 days from today
```

Configuration:

```text id="s7d3f5"
Warning = 30 days
```

System:

```text id="m6x1q8"
Creates VENDOR_DOCUMENT_EXPIRING
```

Notification sent to:

```text id="r2t9y4"
Vendor Manager
Vendor
```

if configured.

---

# 111. DEMO SCENARIO — SUSPENDED VENDOR

Vendor has unresolved critical issue.

Workflow:

```text id="h5k8m2"
Issue
↓
Review
↓
Suspension Request
↓
Authorized Approval
↓
SUSPENDED
```

Procurement:

```text id="x4c7v1"
New Vendor Selection
→ BLOCK / REVIEW
```

Existing POs remain visible and are flagged.

---

# 112. DEMO SCENARIO — REACTIVATION

```text id="q9w3e7"
Suspended Vendor
↓
Corrective Evidence
↓
Document Verification
↓
Review
↓
Approval
↓
ACTIVE
```

---

# 113. DEMO SCENARIO — POSSIBLE DUPLICATE

Existing:

```text id="n6r8t3"
ABC Medical Supplies Pvt Ltd
```

New:

```text id="k2m5v9"
ABC Medical Supplies Private Limited
```

System:

```text id="c7x1z4"
POSSIBLE_DUPLICATE
```

Human decides:

```text id="s3p8w6"
Merge/Link Existing
OR
Continue as Separate Vendor
```

No automatic merge.

---

# 114. TESTING

Unit tests:

```text id="m8k4q2"
Vendor validation
Duplicate detection
Status transitions
Document expiry
Verification
Approval
Suspension
Reactivation
Contract expiry
Performance calculation
Issue lifecycle
Vendor scoping
```

---

# 115. API TESTING

Test:

```text id="q7v3x9"
401
403
404
409
422
```

Also:

```text id="w5n8m1"
Duplicate vendor
Invalid status transition
Unauthorized vendor access
Document expiry
Concurrent approval
Duplicate synchronization
```

---

# 116. VENDOR PORTAL SECURITY TESTING

Vendor A must not access Vendor B.

Test:

```text id="c4m7x2"
Authenticated Vendor A
↓
Request Vendor B resource
↓
403 / 404
```

depending on API design.

Test direct URL manipulation.

Test altered:

```text id="j6p9r3"
vendorId
```

in request body/query.

The backend must ignore unauthorized vendor IDs.

---

# 117. RPA TESTING

### Vendor synchronization

```text id="v8k2m5"
External Vendor
→ Read
→ Match
→ Compare
→ Update Proposal
→ Human Review
```

### Document expiry

```text id="r4n7x1"
External Certificate
→ Read
→ Compare
→ Alert
```

### External failure

```text id="p6w3z9"
Portal unavailable
→ RPAJob FAILED
→ Exception
→ Notification
```

### Unknown result

```text id="m2q8v5"
Update submitted
→ Browser crash
→ Unknown result
→ Reconciliation
```

---

# 118. PERFORMANCE

Use:

```text id="s8k4n1"
Pagination
Indexes
Server-side filtering
Projection
Aggregation
Background jobs
Caching where appropriate
```

Do not load all vendor documents or procurement history into one page.

---

# 119. DATA RETENTION

Do not delete vendors with historical procurement transactions.

Preserve:

```text id="y7c3m9"
Vendor
PO
Delivery
Invoice
Contract
Issue
Audit
```

Use inactive/deactivated status instead.

---

# 120. FINAL END-TO-END VENDOR WORKFLOW

The completed Vendor Management module must support:

```text id="q5w8e2"
VENDOR
   ↓
REGISTRATION
   ↓
DUPLICATE CHECK
   ↓
DOCUMENT COLLECTION
   ↓
VERIFICATION
   ↓
APPROVAL
   ↓
ACTIVE
   ↓
PROCUREMENT
   ↓
PURCHASE ORDERS
   ↓
DELIVERIES
   ↓
PERFORMANCE
   ↓
ISSUES
   ↓
CONTRACTS
   ↓
COMPLIANCE
   ↓
RENEWAL / SUSPENSION / REACTIVATION
   ↓
AUDIT
```

---

# 121. IMPLEMENTATION ORDER FOR AI CODING AGENT

Implement in this order:

```text id="x2c6m8"
1. Vendor Master
        ↓
2. Vendor Contacts
        ↓
3. Vendor Addresses
        ↓
4. Vendor Documents
        ↓
5. Duplicate Detection
        ↓
6. Verification Workflow
        ↓
7. Approval Workflow
        ↓
8. Vendor Status Lifecycle
        ↓
9. Vendor Contracts
        ↓
10. Vendor Performance
        ↓
11. Vendor Issues
        ↓
12. Vendor Portal
        ↓
13. Procurement Integration
        ↓
14. Inventory Integration
        ↓
15. Notifications
        ↓
16. Documents
        ↓
17. RPA
        ↓
18. Reports
        ↓
19. Audit / Security
        ↓
20. Testing
```

---

# 122. FINAL AI CODING AGENT INSTRUCTION

You are implementing **Module 20 — Vendor Management** inside the existing Hospital Administrative & RPA Platform.

Treat this document as an implementation specification.

Before coding:

1. Inspect the existing repository.
2. Reuse authentication.
3. Reuse RBAC.
4. Reuse Procurement.
5. Reuse Medical Inventory.
6. Reuse Notification Service.
7. Reuse Document Generation.
8. Reuse AuditEvent.
9. Reuse ExceptionCase.
10. Reuse RPAJob.
11. Preserve existing UI architecture.
12. Preserve existing API conventions.

Do not create duplicate:

```text id="p8w3n5"
Vendor
Procurement
Inventory
Notification
Audit
RPA
```

systems.

Implement:

```text id="r4m7x2"
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
Vendor Lifecycle
↓
Document Management
↓
Verification
↓
Contracts
↓
Performance
↓
Issues
↓
Vendor Portal
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

Every vendor lifecycle operation must be:

```text id="k6q9w1"
Validated
Authorized
Audited
Traceable
Idempotent where applicable
Exception-safe
```

Never silently:

```text id="m3v8p2"
approve vendors
merge duplicate vendors
approve contracts
approve bank changes
suspend vendors
reactivate vendors
select procurement winners
```

without the appropriate configured authorization.

RPA may collect, synchronize, compare, and execute already-authorized actions, but must not replace human vendor-management decisions.

When ambiguity occurs:

```text id="w7n2c5"
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

The final implementation must be a **fully functional hospital Vendor Management module**, not a static vendor directory or mock CRUD application.