# 27_DOCUMENT_GENERATION.md

# Document Generation & Document Management Service

## 1. MODULE PURPOSE

Build a centralized **Document Generation & Management Service** for the Hospital Administrative Automation & RPA Platform.

The service must allow hospital modules to:

- Generate standardized documents.
- Use configurable templates.
- Generate PDF documents.
- Generate printable documents.
- Generate downloadable documents.
- Store generated documents securely.
- Track document versions.
- Track document status.
- Attach supporting files.
- Link documents to hospital entities.
- Control document access using RBAC.
- Generate documents automatically after business events.
- Generate documents on demand.
- Generate documents through RPA workflows.
- Maintain complete document audit history.
- Prevent unauthorized modification.
- Preserve historical document versions.
- Support digital document delivery through the Notification Service.

This must be a **centralized shared service**.

Individual modules must not build their own separate PDF/document engines.

---

# 2. ARCHITECTURAL PRINCIPLE

The architecture must follow:

```text
Hospital Module
      |
      | Document Request
      v
Document Service
      |
      +----------------------+
      |                      |
      v                      v
Template Engine          MongoDB Metadata
      |
      v
Document Renderer
      |
      v
PDF / Document File
      |
      v
Secure Document Storage
      |
      v
Notification Service
```

Examples:

```text
Patient Registration
Appointment
Admission
Discharge
Billing
Insurance
Claims
Pharmacy
Laboratory
Radiology
Procurement
Vendor Management
Maintenance
Housekeeping
Feedback
HR
Payroll
```

must all reuse this service.

---

# 3. DOCUMENT SERVICE RESPONSIBILITIES

The service owns:

1. Document templates
2. Template versions
3. Document generation
4. Document metadata
5. Document versions
6. Document storage references
7. Document access control
8. Document lifecycle
9. Document downloads
10. Document audit
11. Document generation history
12. Document expiration where applicable
13. Document regeneration
14. Document delivery integration
15. RPA document exchange
16. Document validation
17. Document integrity verification

The service does **not** own the business data itself.

For example:

```text
Invoice data
→ Billing module

Invoice PDF
→ Document Service
```

---

# 4. SYSTEM OF RECORD

Business information remains owned by the originating module.

Example:

```text
Billing
    |
    └── Invoice = business record

Document Service
    |
    └── Invoice PDF = generated artifact
```

Similarly:

```text
Laboratory
    |
    └── LabResult = clinical record

Document Service
    |
    └── Lab Report PDF = document artifact
```

Never make the PDF the source of truth for structured business data.

---

# 5. DOCUMENT TYPES

Create a configurable document type catalog.

Initial document types:

```text id="m1ghde"
PATIENT_REGISTRATION_RECEIPT

APPOINTMENT_CONFIRMATION

OPD_RECEIPT

ADMISSION_CONFIRMATION

BED_ASSIGNMENT

BED_TRANSFER

DISCHARGE_ADMIN_DOCUMENT

DISCHARGE_SUMMARY

FINAL_INVOICE

PAYMENT_RECEIPT

PAYMENT_TRANSACTION_RECEIPT

INSURANCE_VERIFICATION_REPORT

INSURANCE_CLAIM_PACKAGE

INSURANCE_CLAIM_SUBMISSION_RECEIPT

PHARMACY_RECEIPT

PRESCRIPTION_COPY

LAB_REQUISITION

LAB_SAMPLE_RECEIPT

LAB_REPORT

RADIOLOGY_REQUISITION

RADIOLOGY_REPORT

PURCHASE_REQUEST

RFQ_DOCUMENT

PURCHASE_ORDER

GOODS_RECEIPT

VENDOR_DOCUMENT

MAINTENANCE_WORK_ORDER

MAINTENANCE_REPORT

HOUSEKEEPING_TASK_REPORT

FEEDBACK_ACKNOWLEDGEMENT

FEEDBACK_RESPONSE

FEEDBACK_RESOLUTION

EMPLOYEE_DOCUMENT

LEAVE_APPROVAL

ATTENDANCE_REPORT

SHIFT_ROSTER

PAYROLL_DOCUMENT

MANAGEMENT_REPORT

RPA_EXECUTION_REPORT
```

The catalog must remain configurable.

---

# 6. DOCUMENT CATEGORIES

Support:

```text id="jjuxw7"
PATIENT
CLINICAL
FINANCIAL
INSURANCE
PHARMACY
LABORATORY
RADIOLOGY
OPERATIONS
PROCUREMENT
VENDOR
HR
ADMINISTRATION
RPA
REPORTING
```

---

# 7. DOCUMENT STATUS

Recommended statuses:

```text id="a6o6f7"
DRAFT
GENERATING
GENERATED
PENDING_REVIEW
APPROVED
REJECTED
RELEASED
SUPERSEDED
CANCELLED
FAILED
ARCHIVED
```

Not every document requires every status.

The applicable lifecycle must be configurable by document type.

---

# 8. DOCUMENT LIFECYCLE

Typical workflow:

```text id="5a7z7h"
Business Event
      ↓
Document Request
      ↓
Validate Data
      ↓
Load Template
      ↓
Render
      ↓
Generate File
      ↓
Validate File
      ↓
Store
      ↓
Create Metadata
      ↓
RELEASED
      ↓
Notify / Make Available
```

For documents requiring approval:

```text id="t3t3t0"
GENERATED
     ↓
PENDING_REVIEW
     ↓
APPROVED
     ↓
RELEASED
```

---

# 9. DOCUMENT ID

Every document must have a unique document ID.

Format:

```text id="svhrb4"
DOC-YYYY-NNNNNN
```

Example:

```text id="v5y8cl"
DOC-2026-000001
DOC-2026-000002
```

Document IDs must be generated server-side.

---

# 10. DOCUMENT MODEL

Create:

```text id="k76p0u"
GeneratedDocument
```

Suggested schema:

```javascript id="e4z2op"
{
  documentId: String,

  documentType: String,
  category: String,

  title: String,

  entityReference: {
    entityType: String,
    entityId: ObjectId,
    module: String
  },

  patientId: ObjectId,
  visitId: ObjectId,
  admissionId: ObjectId,

  templateId: ObjectId,
  templateVersion: Number,

  version: Number,

  status: String,

  storage: {
    provider: String,
    path: String,
    fileName: String,
    mimeType: String,
    size: Number,
    checksum: String
  },

  generatedBy: ObjectId,
  approvedBy: ObjectId,
  releasedBy: ObjectId,

  generatedAt: Date,
  approvedAt: Date,
  releasedAt: Date,

  expiresAt: Date,

  supersedesDocumentId: ObjectId,

  metadata: Object,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 11. DOCUMENT VERSIONING

Documents must support versioning.

Example:

```text id="q36p0g"
DOC-2026-000123
Version 1
```

Later correction:

```text id="6m1ynp"
DOC-2026-000123
Version 2
```

Version 1 must not be silently overwritten.

Version 1 becomes:

```text id="g2x0gs"
SUPERSEDED
```

Version 2 becomes the current version.

---

# 12. WHY VERSIONING IS REQUIRED

Example:

A billing invoice is generated.

Later, an authorized billing adjustment occurs.

Do not overwrite the original PDF.

Instead:

```text id="mbw3yc"
Invoice Version 1
        ↓
Adjustment
        ↓
Invoice Version 2
```

Both remain auditable.

---

# 13. DOCUMENT TEMPLATE MODEL

Create:

```text id="n8h75o"
DocumentTemplate
```

Suggested schema:

```javascript id="i7g3y5"
{
  templateId: String,

  documentType: String,

  name: String,

  description: String,

  category: String,

  language: String,

  version: Number,

  format: String,

  content: String,

  variables: [
    {
      name: String,
      type: String,
      required: Boolean
    }
  ],

  enabled: Boolean,

  approvalRequired: Boolean,

  approvedBy: ObjectId,
  approvedAt: Date,

  effectiveFrom: Date,
  effectiveTo: Date,

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 14. TEMPLATE VERSIONING

Never overwrite an active template version.

Example:

```text id="a9ukfh"
Invoice Template
Version 1
```

Later:

```text id="5z4h5m"
Invoice Template
Version 2
```

Old documents remain linked to Version 1.

New documents use Version 2 after activation.

---

# 15. TEMPLATE VARIABLES

Example:

```text id="v0x2ri"
{{hospitalName}}
{{hospitalAddress}}
{{patientName}}
{{patientId}}
{{visitId}}
{{invoiceId}}
{{invoiceDate}}
{{totalAmount}}
```

Templates must declare their required variables.

---

# 16. VARIABLE VALIDATION

Before rendering:

```text id="qk7b8o"
Template
   ↓
Find required variables
   ↓
Compare with supplied data
   ↓
Missing variable?
   ↓
FAIL
```

Never generate incomplete documents silently.

---

# 17. DOCUMENT GENERATION REQUEST

Example:

```json id="c2g5q4"
{
  "documentType": "FINAL_INVOICE",

  "entityReference": {
    "entityType": "Invoice",
    "entityId": "..."
  },

  "patientId": "...",

  "templateData": {
    "hospitalName": "ABC Hospital",
    "patientName": "Rahul Shah",
    "invoiceNumber": "INV-2026-00123",
    "totalAmount": 11500
  }
}
```

---

# 18. DATA SOURCE PRINCIPLE

Prefer retrieving authoritative data from the backend rather than trusting frontend-provided financial or clinical values.

Bad:

```text id="z7d0px"
Frontend says:
totalAmount = 11500
```

Correct:

```text id="4d1r93"
Document Service
     ↓
Billing Service
     ↓
Retrieve Invoice
     ↓
Generate PDF
```

The originating module remains authoritative.

---

# 19. DOCUMENT GENERATION API

Base path:

```text id="bxrjmm"
/api/documents
```

Create document:

```http id="w6f6ic"
POST /api/documents/generate
```

---

# 20. GET DOCUMENT

```http id="12u4p5"
GET /api/documents/:documentId
```

Return metadata and authorized access information.

Do not expose internal storage paths.

---

# 21. DOWNLOAD DOCUMENT

```http id="h3j0g4"
GET /api/documents/:documentId/download
```

Backend must verify authorization before returning the file.

---

# 22. PREVIEW DOCUMENT

```http id="q8y9mc"
GET /api/documents/:documentId/preview
```

Preview access must follow the same authorization rules.

---

# 23. REGENERATE DOCUMENT

```http id="c3c72f"
POST /api/documents/:documentId/regenerate
```

Regeneration must create a new version when appropriate.

Do not overwrite the previous version.

---

# 24. RELEASE DOCUMENT

```http id="j7w6am"
POST /api/documents/:documentId/release
```

Only authorized roles may release documents that require approval.

---

# 25. APPROVE DOCUMENT

```http id="q5p2w3"
POST /api/documents/:documentId/approve
```

Approval must be permission controlled.

---

# 26. CANCEL DOCUMENT

```http id="8w7j3q"
POST /api/documents/:documentId/cancel
```

Cancellation should preserve audit history.

---

# 27. DOCUMENT SEARCH

```http id="q7g3df"
GET /api/documents
```

Filters:

```text id="2b1gk9"
documentType
category
patientId
visitId
admissionId
entityType
entityId
status
dateFrom
dateTo
generatedBy
```

---

# 28. PATIENT DOCUMENT ACCESS

Patient portal:

```text id="h2mm9e"
/portal/patient/documents
```

Display:

```text id="a6d8so"
Document
Date
Type
Status
Download
View
```

Example:

```text
Final Invoice
10 Oct 2026
Released
[View] [Download]
```

---

# 29. PATIENT DOCUMENT TYPES

Patient may access only authorized documents such as:

```text id="3am2ap"
Registration Receipt
Appointment Confirmation
Invoice
Payment Receipt
Discharge Summary
Released Lab Report
Released Radiology Report
Prescription Copy
Other permitted documents
```

Do not expose internal hospital documents.

---

# 30. CLINICAL DOCUMENT ACCESS

Clinical documents require stricter controls.

Example:

```text id="y4uwf1"
Lab Report
Radiology Report
Discharge Summary
```

The patient should only see them when they have reached the appropriate release state.

---

# 31. UNRELEASED DOCUMENTS

A patient must not access:

```text id="c3y5qb"
DRAFT
PENDING_REVIEW
PENDING_APPROVAL
```

documents unless hospital policy explicitly allows it.

Example:

```text id="q1j8fr"
Lab Report
Status = DRAFT
```

must not be visible to patient.

---

# 32. INTERNAL DOCUMENTS

Examples:

```text id="fx4l9s"
Internal Investigation Report
Internal Procurement Comparison
Internal RPA Error Report
Internal HR Document
```

These must never appear in the patient portal.

---

# 33. DOCUMENT ACCESS CONTROL

Every document must have an authorization check based on:

```text id="nup4x0"
User
Role
Patient ownership
Department
Entity relationship
Document category
Document status
Confidentiality
```

---

# 34. DOCUMENT CONFIDENTIALITY

Support:

```text id="s4l6y7"
NORMAL
RESTRICTED
HIGHLY_RESTRICTED
```

Example:

```text id="o6wzjj"
NORMAL
→ patient + authorized staff

RESTRICTED
→ designated department

HIGHLY_RESTRICTED
→ specific authorized roles
```

---

# 35. STORAGE ABSTRACTION

Do not tightly couple document logic to one storage provider.

Create:

```javascript id="8k4y8k"
StorageProvider
```

Interface:

```javascript id="k9xjz7"
upload()
download()
delete()
exists()
getMetadata()
```

Possible implementations:

```text id="8j7g1r"
Local Storage
Object Storage
Cloud Storage
Hospital File Server
```

---

# 36. LOCAL DEVELOPMENT STORAGE

For development:

```text id="1pt5oe"
server/storage/documents/
```

may be used.

However, the architecture must use a storage abstraction.

---

# 37. PRODUCTION STORAGE

Production should preferably use secure object/file storage.

Examples may include:

```text id="0o5x4c"
Hospital-managed object storage
Cloud object storage
Secure file server
```

The implementation should not hard-code a specific provider.

---

# 38. FILE NAMING

Use safe generated names.

Example:

```text id="c1j8ha"
DOC-2026-000123-v2.pdf
```

Do not use:

```text id="j9w8z2"
Rahul_Sensitive_Lab_Report.pdf
```

as the raw storage path.

Avoid exposing patient names in storage filenames.

---

# 39. FILE CHECKSUM

Every stored document should have a checksum.

Example:

```text id="l5n88u"
SHA-256
```

Store:

```text id="5p9s5p"
checksum
```

in metadata.

This helps detect file corruption or unintended modification.

---

# 40. DOCUMENT INTEGRITY

When downloading:

```text id="sqv1c3"
Document Metadata
     ↓
Storage
     ↓
Checksum Verification
     ↓
Return File
```

If integrity verification fails:

```text id="5h9s8b"
Do not return as valid
Create exception
Alert administrator
```

---

# 41. FILE TYPE VALIDATION

Supported formats initially:

```text id="g9ccqk"
PDF
PNG
JPG/JPEG
DOCX
XLSX
```

Actual supported types should be configurable.

For generated hospital documents, PDF should be the default output.

---

# 42. UPLOADED DOCUMENTS

Modules may allow users to upload supporting files.

Examples:

```text id="i9n9wy"
Insurance document
Vendor certificate
Purchase quotation
Complaint attachment
Medical document
```

Uploaded documents must use the same document-management service.

---

# 43. UPLOAD API

```http id="2bjj8b"
POST /api/documents/upload
```

Required:

```text id="o6f8n1"
Entity reference
Document type
File
```

---

# 44. UPLOAD SECURITY

Validate:

- MIME type
- file extension
- file size
- filename
- malware/security policy
- authorization
- entity relationship

Do not trust the client-provided MIME type alone.

---

# 45. DOCUMENT SIZE LIMITS

Use configurable limits.

Example:

```text id="l6q8vp"
Generated PDF:
20 MB

Uploaded attachment:
25 MB
```

These are example defaults.

Do not hard-code hospital policy.

---

# 46. VIRUS/MALWARE SCANNING

Where supported, uploaded documents should pass through a malware scanning layer before being made available.

Flow:

```text id="g1n3ey"
Upload
 ↓
Temporary storage
 ↓
Security scan
 ↓
Clean?
 ↓
Permanent storage
```

If unsafe:

```text id="d6e5yy"
Reject
 ↓
Security event
```

---

# 47. DOCUMENT GENERATION ENGINE

The service should separate:

```text id="v7q8qj"
Template
Data
Renderer
Output
```

Example:

```text
Template:
invoice-template

Data:
Invoice object

Renderer:
PDF renderer

Output:
PDF
```

---

# 48. PDF GENERATION

PDF should be the default final document format.

Generated PDF must have:

- Page numbers where appropriate
- Hospital name
- Document title
- Document ID
- Date
- Relevant entity ID
- Structured content
- Footer where configured
- Version where applicable

---

# 49. HOSPITAL HEADER

Document templates should support:

```text id="xj7t1u"
Hospital Logo
Hospital Name
Address
Phone
Email
Website
Registration information where configured
```

These should come from `HospitalConfiguration`.

Do not hard-code hospital details into templates.

---

# 50. DOCUMENT FOOTER

Support:

```text id="v8on9h"
Generated Date
Document ID
Page X of Y
Confidentiality notice
Version
```

according to document type.

---

# 51. DIGITAL SIGNATURE SUPPORT

Design the service so digital signature integration can be added.

Example:

```text id="f10x5d"
Generated
 ↓
Approved
 ↓
Digital Signature
 ↓
Released
```

Do not implement legal signature behavior unless an actual supported provider is configured.

---

# 52. APPROVAL WORKFLOW

Some documents require approval.

Example:

```text id="0jy6se"
Management Report
    ↓
Generated
    ↓
Pending Approval
    ↓
Manager Approval
    ↓
Released
```

Another:

```text id="ryh4g9"
Lab Report
    ↓
Result Verified
    ↓
Report Finalized
    ↓
Released
```

Clinical verification remains owned by Laboratory/Radiology.

---

# 53. DOCUMENT SERVICE MUST NOT APPROVE CLINICAL CONTENT

The document service can:

```text id="g6j8sr"
render
store
version
release
deliver
```

It must not:

```text id="wqk8ob"
interpret lab results
interpret radiology images
approve diagnosis
approve treatment
decide medical fitness
```

---

# 54. BILLING DOCUMENT GENERATION

Billing may request:

```text id="h9g7gj"
FINAL_INVOICE
PAYMENT_RECEIPT
```

Flow:

```text id="y2k0rm"
Billing
 ↓
Invoice finalized
 ↓
Document Service
 ↓
Generate Invoice PDF
 ↓
Store
 ↓
Release
 ↓
Notification Service
```

The Document Service does not calculate the invoice.

---

# 55. DISCHARGE DOCUMENT GENERATION

Discharge may request:

```text id="4a8fkn"
DISCHARGE_SUMMARY
FINAL_INVOICE
PAYMENT_RECEIPT
DISCHARGE_ADMIN_DOCUMENT
```

Clinical discharge summary content must come from authorized clinical staff.

Document Service only formats/stores/distributes approved content.

---

# 56. LAB DOCUMENT GENERATION

Laboratory may request:

```text id="h85bkj"
LAB_REPORT
```

Workflow:

```text id="z8k4jv"
Result Verified
     ↓
Report Finalized
     ↓
Document Service
     ↓
Generate PDF
     ↓
Release
```

Document Service must not modify result values.

---

# 57. RADIOLOGY DOCUMENT GENERATION

Radiology may request:

```text id="6bqv2m"
RADIOLOGY_REPORT
```

Workflow:

```text id="i6k15f"
Report Verified
     ↓
Finalized
     ↓
Generate
     ↓
Store
     ↓
Release
```

Document Service must not modify findings.

---

# 58. INSURANCE DOCUMENT PACKAGE

Claims may request multiple documents:

```text id="z0o4mg"
Invoice
Discharge Summary
Lab Reports
Radiology Reports
Prescriptions
Other supporting documents
```

Create a document package.

---

# 59. DOCUMENT PACKAGE MODEL

Create:

```text id="2g2g8s"
DocumentPackage
```

Suggested schema:

```javascript id="l4n2y9"
{
  packageId: String,

  packageType: String,

  entityReference: {
    entityType: String,
    entityId: ObjectId
  },

  documents: [
    {
      documentId: ObjectId,
      order: Number
    }
  ],

  status: String,

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 60. DOCUMENT PACKAGE PDF

Where required, generate a combined PDF.

Example:

```text id="u8m3m7"
Insurance Claim Package
-----------------------
1. Claim Form
2. Invoice
3. Discharge Summary
4. Lab Reports
5. Radiology Report
6. Payment Receipt
```

Each source document remains separately stored and auditable.

---

# 61. DOCUMENT MERGING

When merging PDFs:

- Preserve original documents.
- Preserve source IDs.
- Preserve order.
- Record package version.
- Do not modify source documents.

---

# 62. DOCUMENT EXPIRATION

Some documents may have expiration dates.

Examples:

```text id="q7u3vx"
Vendor Certificate
Insurance Document
Employee Certificate
Contract
```

Store:

```text id="8x4gk4"
expiresAt
```

Document service can generate expiry alerts through Notification Service.

---

# 63. DOCUMENT EXPIRY NOTIFICATION

Example:

```text id="c4h1dy"
Vendor document expires in 30 days.
```

The Document Service creates the event.

Notification Service sends the notification.

Do not build email/SMS logic here.

---

# 64. DOCUMENT ARCHIVING

When a document reaches its archival lifecycle:

```text id="s6q7mv"
RELEASED
   ↓
ARCHIVED
```

Archived documents remain retrievable by authorized users.

Do not physically delete documents unless retention policy explicitly allows it.

---

# 65. DOCUMENT RETENTION

Configuration:

```text id="v8e3d7"
retentionDays
archiveAfterDays
```

These must be configurable by document type.

Do not hard-code legal retention periods.

---

# 66. DOCUMENT DELETE POLICY

Physical deletion should be highly restricted.

Normal behavior:

```text id="9a6l4v"
Document
   ↓
ARCHIVED
```

not:

```text id="m1r8f9"
Document
   ↓
DELETE
```

Permanent deletion requires:

- authorization
- policy justification
- audit
- retention validation

---

# 67. DOCUMENT AUDIT

Audit:

```text id="6ubj6e"
Document Requested
Document Generated
Document Viewed
Document Downloaded
Document Approved
Document Released
Document Superseded
Document Regenerated
Document Cancelled
Document Archived
Document Uploaded
Document Access Denied
```

---

# 68. DOCUMENT ACCESS AUDIT

For sensitive documents record:

```text id="t6yk1f"
userId
documentId
action
timestamp
IP
userAgent
```

This allows the hospital to know who accessed sensitive documents.

---

# 69. DOCUMENT DOWNLOAD CONTROL

Every download must check:

```text id="tujc8y"
Authentication
Authorization
Document status
Patient ownership
Department scope
Confidentiality
```

---

# 70. SECURE DOWNLOAD

Do not expose direct permanent storage URLs.

Prefer:

```text id="4q67af"
Authenticated API
      ↓
Authorization
      ↓
Short-lived signed URL
```

or secure streaming through the backend.

---

# 71. DOCUMENT PREVIEW

Preview should use a controlled endpoint.

Do not expose the storage bucket publicly.

---

# 72. DOCUMENT SEARCH

Search must support:

```text id="k9ofcv"
Document ID
Patient ID
Document Type
Entity Type
Entity ID
Date
Status
Category
```

Sensitive documents must still respect authorization.

---

# 73. DOCUMENT API STRUCTURE

Use:

```text id="c9r6d4"
GET    /api/documents
POST   /api/documents/generate
GET    /api/documents/:documentId
GET    /api/documents/:documentId/download
GET    /api/documents/:documentId/preview
POST   /api/documents/:documentId/approve
POST   /api/documents/:documentId/release
POST   /api/documents/:documentId/regenerate
POST   /api/documents/:documentId/cancel
POST   /api/documents/upload
```

---

# 74. TEMPLATE API

```text id="s7d9nd"
GET    /api/document-templates
POST   /api/document-templates
GET    /api/document-templates/:id
PATCH  /api/document-templates/:id
POST   /api/document-templates/:id/approve
POST   /api/document-templates/:id/activate
POST   /api/document-templates/:id/deactivate
```

---

# 75. DOCUMENT PACKAGE API

```text id="t4j4ak"
POST /api/document-packages
GET  /api/document-packages/:packageId
GET  /api/document-packages/:packageId/download
POST /api/document-packages/:packageId/regenerate
```

---

# 76. BACKEND STRUCTURE

Use:

```text id="4gk2x7"
server/
├── models/
│   ├── GeneratedDocument.js
│   ├── DocumentTemplate.js
│   ├── DocumentPackage.js
│   └── DocumentAccessLog.js
│
├── controllers/
│   ├── documentController.js
│   ├── documentTemplateController.js
│   └── documentPackageController.js
│
├── services/
│   ├── documentService.js
│   ├── templateService.js
│   ├── renderingService.js
│   ├── documentVersionService.js
│   ├── documentAccessService.js
│   ├── documentPackageService.js
│   └── documentRetentionService.js
│
├── renderers/
│   ├── PdfRenderer.js
│   └── rendererFactory.js
│
├── storage/
│   ├── StorageProvider.js
│   └── storageImplementation.js
│
├── validators/
│   └── documentValidator.js
│
└── routes/
    ├── documentRoutes.js
    └── documentTemplateRoutes.js
```

---

# 77. FRONTEND STRUCTURE

Use:

```text id="p9f49x"
client/src/
├── components/
│   └── documents/
│       ├── DocumentViewer.jsx
│       ├── DocumentList.jsx
│       ├── DocumentDownloadButton.jsx
│       ├── DocumentStatusBadge.jsx
│       └── DocumentVersionHistory.jsx
│
└── portals/
    └── administration/
        └── documents/
            ├── DocumentDashboard.jsx
            ├── DocumentList.jsx
            ├── DocumentDetails.jsx
            ├── TemplateManagement.jsx
            ├── DocumentPackage.jsx
            └── DocumentReports.jsx
```

---

# 78. PATIENT DOCUMENT UI

Patient portal:

```text id="gnj5ci"
/portal/patient/documents
```

Example:

```text
My Documents

----------------------------------------
Final Invoice
10 Oct 2026
[View] [Download]

Payment Receipt
10 Oct 2026
[View] [Download]

Lab Report
10 Oct 2026
[View] [Download]

Discharge Summary
10 Oct 2026
[View] [Download]
----------------------------------------
```

---

# 79. ADMIN DOCUMENT DASHBOARD

Display:

```text id="54ap4v"
Documents Generated Today
Pending Review
Pending Approval
Failed
Released
Archived
```

---

# 80. TEMPLATE MANAGEMENT UI

Authorized users can:

```text id="4fhc2w"
Create template
Edit draft
Preview
Validate variables
Submit for approval
Approve
Activate
Deactivate
View versions
```

Active templates should not be directly overwritten.

---

# 81. TEMPLATE PREVIEW

Allow:

```text id="8k8e8m"
Template
+
Sample Data
↓
Preview PDF
```

Example sample data:

```json id="79ty0v"
{
  "patientName": "Rahul Shah",
  "patientId": "P10045",
  "invoiceId": "INV-1001"
}
```

Do not use real patient data for template development/testing unless explicitly authorized.

---

# 82. TEMPLATE APPROVAL

Sensitive templates may require approval.

Example:

```text id="db3m1m"
New Invoice Template
     ↓
Draft
     ↓
Review
     ↓
Approved
     ↓
Activated
```

---

# 83. TEMPLATE CHANGE IMPACT

When changing a template:

- Existing documents remain unchanged.
- New documents use the new active version.
- Old versions remain available.
- Audit who changed the template.
- Audit who approved it.

---

# 84. DOCUMENT GENERATION QUEUE

For large documents or reports:

```text id="jjy1jh"
Request
 ↓
Queue
 ↓
Worker
 ↓
Generate
 ↓
Store
 ↓
Update Status
```

Example:

```text id="j1g8vw"
Management Report
10,000 records
```

should not block a normal HTTP request unnecessarily.

---

# 85. GENERATION FAILURE

If rendering fails:

```text id="2ysl2c"
GENERATING
    ↓
Renderer Error
    ↓
FAILED
```

Store:

```text id="8ujf5s"
errorCode
errorMessage
correlationId
```

Do not expose internal stack traces to users.

---

# 86. GENERATION RETRY

Safe generation failures may be retried.

Example:

```text id="qg1o7y"
Temporary storage failure
```

may be retryable.

Template validation failure:

```text id="3iv8uo"
Missing required variable
```

should not be blindly retried.

---

# 87. DOCUMENT CORRELATION

Every generated document should have:

```text id="e7p2bb"
Document ID
Entity ID
Module
Template ID
Template Version
Correlation ID
```

Example:

```text id="0o7f7x"
Document:
DOC-2026-000123

Entity:
Invoice INV-1001

Module:
Billing

Template:
FINAL_INVOICE_V3

Correlation:
CORR-2026-ABC123
```

---

# 88. RPA INTEGRATION

Robot Framework may:

- Download approved documents.
- Upload documents to external portals.
- Retrieve external documents.
- Attach documents to external cases.
- Verify external document status.
- Reconcile external document references.

The RPA layer must not modify document contents without an explicit authorized workflow.

---

# 89. RPA DOCUMENT FLOW

Example:

```text id="v2n0sa"
Insurance Claim
      ↓
Document Package
      ↓
RPA Job
      ↓
Download Package
      ↓
Login Insurer Portal
      ↓
Upload Documents
      ↓
Submit
      ↓
Capture External Reference
      ↓
Verify
      ↓
Update Claim
```

---

# 90. RPA UNKNOWN STATE

If upload times out:

```text id="z3q2o9"
Upload
 ↓
Timeout
 ↓
UNKNOWN
```

Do not upload again immediately.

Instead:

```text id="v0k6k2"
Search external claim
 ↓
Verify document
 ↓
Continue / reconcile
```

---

# 91. RPA DOCUMENT EVIDENCE

Store appropriate evidence:

```text id="8n2qkj"
RPA Job ID
Document ID
External Case ID
Upload timestamp
External response
Screenshot if appropriate
```

Evidence must be protected.

---

# 92. NOTIFICATION INTEGRATION

After document release:

```text id="i7o8j9"
Document Service
       ↓
Document Released
       ↓
Notification Service
       ↓
Patient / Staff
```

Example:

```text
Your laboratory report is now available.
Please log in to the secure hospital portal.
```

The document service must not implement SMS/email itself.

---

# 93. DOCUMENT ACCESS AFTER NOTIFICATION

Notification may contain:

```text id="jqc5y8"
secure portal route
```

Example:

```text
/portal/patient/documents/DOC-2026-000123
```

The backend must still perform authorization.

---

# 94. DOCUMENT PACKAGE SECURITY

A package may contain multiple sensitive documents.

Therefore:

- verify access to every document
- do not include unauthorized documents
- maintain package manifest
- audit package generation
- audit package download

---

# 95. DOCUMENT PACKAGE VALIDATION

Before generating package:

```text id="o9d3l4"
Requested Documents
      ↓
Check existence
      ↓
Check authorization
      ↓
Check release status
      ↓
Check integrity
      ↓
Generate package
```

If one required document is missing:

```text id="f0x7f1"
Package = FAILED / INCOMPLETE
```

according to configured policy.

---

# 96. DOCUMENT REPORTING

Provide:

```text id="x8y5jo"
Documents Generated
Documents Released
Documents Failed
Documents Downloaded
Documents Archived
Documents by Type
Documents by Department
Documents by Date
```

---

# 97. DOCUMENT ACCESS REPORT

Authorized management can view:

```text id="4i1c2n"
Document
Accessed By
Role
Action
Date
Time
```

Sensitive access must be auditable.

---

# 98. DOCUMENT STORAGE HEALTH

Administration dashboard may display:

```text id="p5p9iz"
Storage Available
Generation Queue
Failed Documents
Storage Errors
Integrity Errors
```

Do not expose infrastructure secrets.

---

# 99. DOCUMENT INTEGRITY CHECK

Provide a background verification job:

```text id="h9m2r1"
Find stored documents
      ↓
Read checksum
      ↓
Calculate checksum
      ↓
Compare
```

Mismatch:

```text id="v8qj7r"
Integrity Exception
```

---

# 100. DOCUMENT RETENTION JOB

Scheduled job:

```text id="c2w4b7"
Find documents past archival threshold
      ↓
Archive
      ↓
Audit
```

Permanent deletion must not happen automatically unless explicitly configured and permitted.

---

# 101. DATABASE INDEXES

Recommended:

```javascript id="u2j0r3"
GeneratedDocumentSchema.index(
  { documentId: 1 },
  { unique: true }
);

GeneratedDocumentSchema.index({
  "entityReference.entityType": 1,
  "entityReference.entityId": 1
});

GeneratedDocumentSchema.index({
  patientId: 1,
  createdAt: -1
});

GeneratedDocumentSchema.index({
  documentType: 1,
  status: 1,
  createdAt: -1
});

GeneratedDocumentSchema.index({
  status: 1,
  createdAt: -1
});

GeneratedDocumentSchema.index({
  expiresAt: 1,
  status: 1
});

DocumentTemplateSchema.index({
  documentType: 1,
  language: 1,
  version: -1
});
```

---

# 102. SECURITY REQUIREMENTS

Implement:

- JWT authentication
- RBAC
- Object-level authorization
- Patient ownership validation
- Department-level access
- Confidentiality restrictions
- Secure file storage
- Secure downloads
- Malware scanning
- File validation
- Audit logging
- Encryption in transit
- Secret management
- Rate limiting
- Access logging

---

# 103. PATIENT DOCUMENT ISOLATION

A patient must never access another patient's document.

Bad:

```text id="q3d9o0"
GET /api/documents/DOC-2026-000124
```

and automatically return the file.

Correct:

```text id="m8m5uy"
Authenticate
 ↓
Find Document
 ↓
Check patientId
 ↓
Check document status
 ↓
Check authorization
 ↓
Return
```

---

# 104. DOCUMENT ACCESS BY EMPLOYEE

Employees may access documents according to:

```text id="1r4q7u"
Role
Department
Entity relationship
Permission
Document category
```

Example:

Billing staff may access invoices but should not automatically access confidential HR documents.

---

# 105. DOCUMENT GENERATION AUDIT

Audit:

```text id="o8j1tg"
Who requested
Why
What document
Which template
Which version
When generated
Who approved
Who released
Who downloaded
```

---

# 106. DOCUMENT CONTENT PROTECTION

Do not allow users to edit released documents directly.

Instead:

```text id="p1f7j8"
Released Document
      ↓
Correction Required
      ↓
Generate New Version
      ↓
Approval
      ↓
Release
```

---

# 107. DOCUMENT CORRECTION

Example:

Invoice typo discovered.

Do not:

```text id="7z9guk"
Edit PDF directly
```

Instead:

```text id="w9y0j1"
Correct source data
      ↓
Generate Version 2
      ↓
Approve if required
      ↓
Release Version 2
```

---

# 108. DOCUMENT SOURCE DATA VALIDATION

Before generating:

```text id="q6w7d4"
Entity exists?
Entity status valid?
Required fields present?
User authorized?
Template active?
Template variables valid?
```

If any required condition fails:

```text id="0l5y5x"
Do not generate.
```

---

# 109. DOCUMENT GENERATION EXAMPLE — INVOICE

```text id="b2z1o7"
Billing:
Invoice INV-1001 finalized
       ↓
POST /api/documents/generate
       ↓
Document Service retrieves invoice
       ↓
Loads FINAL_INVOICE template
       ↓
Renders PDF
       ↓
Stores PDF
       ↓
Creates DOC-2026-000123
       ↓
Releases document
       ↓
Notification Service
       ↓
Patient receives secure link
```

---

# 110. DOCUMENT GENERATION EXAMPLE — LAB

```text id="n3g1ro"
Lab Result verified
       ↓
Lab Report finalized
       ↓
Document Service
       ↓
Generate LAB_REPORT
       ↓
Store
       ↓
Release
       ↓
Patient notification
```

The document service does not interpret the result.

---

# 111. DOCUMENT GENERATION EXAMPLE — PURCHASE ORDER

```text id="9k6f2x"
Purchase Order approved
       ↓
Document Service
       ↓
Generate PO PDF
       ↓
Store
       ↓
Release
       ↓
Vendor notification
```

Procurement remains the source of PO business data.

---

# 112. DOCUMENT GENERATION EXAMPLE — FEEDBACK

```text id="j4h2tg"
Feedback response approved
       ↓
Document Service
       ↓
Generate response letter
       ↓
Store
       ↓
Release
       ↓
Notification Service
```

---

# 113. MULTI-LANGUAGE DOCUMENTS

Templates may support:

```text id="f0y5cq"
en-IN
hi-IN
gu-IN
```

The selected language should be determined by:

```text id="p0b6s9"
User preference
Patient preference
Document configuration
Hospital default
```

Fallback:

```text id="o3o8w9"
Requested language unavailable
        ↓
Hospital default
```

---

# 114. DOCUMENT NUMBERING

Some document types may require business numbers.

Example:

```text id="5z0xij"
Invoice:
INV-2026-000123

Claim:
CLM-2026-000045

Purchase Order:
PO-2026-000078
```

The originating business module owns business-number generation.

Document Service owns:

```text id="9knh7g"
DOC-2026-000123
```

Do not confuse the two.

---

# 115. DOCUMENT METADATA

Metadata may include:

```text id="t6r1f8"
Department
Patient ID
Visit ID
Admission ID
Business Reference
Document Type
Version
Language
Confidentiality
Generated Date
```

Do not store excessive sensitive information.

---

# 116. DOCUMENT EXPIRATION ALERTS

For documents with expiry:

```text id="p7w4k2"
30 days before
→ notification

7 days before
→ notification

Expired
→ notification
```

Intervals must be configurable.

---

# 117. EXCEPTION CASES

Use:

```text id="w6m9s3"
ExceptionCase
```

Examples:

```text id="v6h8cx"
Template missing
Template inactive
Missing variable
Entity not found
Unauthorized request
Storage failure
Renderer failure
File integrity mismatch
Document package incomplete
Invalid uploaded file
Malware detected
External upload failure
Unknown RPA state
```

---

# 118. RPA EXCEPTION

Example:

```text id="z1q9bo"
Document upload to insurer portal
        ↓
Timeout
        ↓
Unknown
        ↓
RPA Exception
        ↓
Human/reconciliation
```

Do not create duplicate uploads.

---

# 119. TEST DATA

Seed:

```text id="8q5y6f"
10 document templates
20 generated documents
5 document types
3 patients
3 employees
2 document packages
```

Include:

```text id="8t9u5v"
Generated
Released
Superseded
Archived
Failed
Pending Approval
```

---

# 120. TEST SCENARIO — DOCUMENT GENERATION

```text id="k2g6t0"
Create invoice
 ↓
Request invoice PDF
 ↓
Generate
 ↓
Store
 ↓
Verify checksum
 ↓
Release
 ↓
Patient can view
```

---

# 121. TEST SCENARIO — VERSIONING

```text id="8x2f1v"
Document Version 1
 ↓
Source corrected
 ↓
Generate Version 2
 ↓
Version 1 = SUPERSEDED
 ↓
Version 2 = RELEASED
```

Both must remain auditable.

---

# 122. TEST SCENARIO — ACCESS CONTROL

Patient A:

```text id="6q7m0e"
DOC-A
```

Patient B:

```text id="3o2h8w"
DOC-B
```

Patient A requests DOC-B.

Expected:

```text id="5z9j6p"
403 Forbidden
```

and security event recorded.

---

# 123. TEST SCENARIO — TEMPLATE ERROR

Missing:

```text id="0x1o6s"
{{invoiceNumber}}
```

Expected:

```text id="1x9f4a"
Generation fails
No incomplete PDF released
Exception created
```

---

# 124. TEST SCENARIO — STORAGE FAILURE

```text id="y9g0s5"
PDF generated
 ↓
Storage fails
 ↓
Document = FAILED
 ↓
Retry if safe
```

No notification should say "document available" until storage succeeds and release is complete.

---

# 125. TEST SCENARIO — SENSITIVE DOCUMENT

```text id="w8y5r1"
Internal Investigation Report
```

Patient requests it.

Expected:

```text id="c6f8k1"
403 Forbidden
```

---

# 126. TEST SCENARIO — LAB REPORT

```text id="s6x8u2"
Lab Result
Status = VERIFIED

Generate Report
 ↓
Report = RELEASED
 ↓
Patient notified
```

Before release:

```text id="z2k7o4"
Patient cannot access.
```

---

# 127. TEST SCENARIO — DOCUMENT PACKAGE

```text id="j7f5n8"
Claim Package
 ↓
Invoice
 ↓
Discharge Summary
 ↓
Lab Report
 ↓
Radiology Report
 ↓
Payment Receipt
 ↓
Validate
 ↓
Generate package
```

Expected:

```text id="n8m1k4"
All documents included in correct order.
```

---

# 128. UNIT TESTS

Implement tests for:

```text id="5z1l9o"
Document ID generation
Template lookup
Template version selection
Variable validation
PDF rendering
Storage upload
Checksum calculation
Document access
Document release
Document approval
Document versioning
Document package creation
Retention
Expiration
```

---

# 129. API TESTS

Test:

```text id="2r6h8c"
POST /api/documents/generate
GET /api/documents/:id
GET /api/documents/:id/download
GET /api/documents/:id/preview
POST /api/documents/:id/approve
POST /api/documents/:id/release
POST /api/documents/:id/regenerate
POST /api/documents/upload
```

---

# 130. SECURITY TESTS

Verify:

```text id="m0p4m7"
Patient isolation
Employee authorization
Restricted document access
Template authorization
Download authorization
Upload validation
Malware rejection
Storage URL protection
Audit logging
```

---

# 131. RPA TESTS

Test:

```text id="q4n8x6"
Document download
External upload
External verification
Timeout
Unknown upload state
Duplicate prevention
Evidence capture
```

---

# 132. ACCEPTANCE CRITERIA

The module is complete when:

### Generation

- [ ] Documents can be generated.
- [ ] Templates are configurable.
- [ ] Template versions are preserved.
- [ ] Required variables are validated.
- [ ] PDFs are generated successfully.
- [ ] Document IDs are unique.

### Storage

- [ ] Documents are securely stored.
- [ ] Checksums are generated.
- [ ] Storage paths are not publicly exposed.
- [ ] Download authorization works.
- [ ] Preview authorization works.

### Versioning

- [ ] Documents can be regenerated.
- [ ] Previous versions remain available.
- [ ] Superseded status works.
- [ ] Version history works.

### Approval

- [ ] Approval workflow works.
- [ ] Release workflow works.
- [ ] Unauthorized users cannot approve/release.

### Patient Portal

- [ ] Patient can view permitted documents.
- [ ] Patient can download permitted documents.
- [ ] Patient cannot access another patient's documents.
- [ ] Unreleased documents remain hidden.

### Security

- [ ] RBAC works.
- [ ] Restricted documents are protected.
- [ ] Attachments are validated.
- [ ] Access is audited.
- [ ] Sensitive information is protected.

### RPA

- [ ] Documents can be uploaded to external systems.
- [ ] External references are recorded.
- [ ] Unknown upload states are reconciled.
- [ ] Duplicate uploads are prevented.

### Reporting

- [ ] Document reports work.
- [ ] Access reports work.
- [ ] Failed generation reports work.
- [ ] Storage health is visible to authorized administrators.

---

# 133. IMPLEMENTATION ORDER

## Step 1 — Models

Create:

```text id="1m0j9n"
GeneratedDocument
DocumentTemplate
DocumentPackage
DocumentAccessLog
```

---

## Step 2 — Storage Abstraction

Implement:

```text id="k5r7d1"
StorageProvider
LocalStorageProvider
```

with production-ready abstraction for object/file storage.

---

## Step 3 — Template Engine

Implement:

```text id="v9o1c8"
Template lookup
Versioning
Variable validation
Rendering
Language fallback
```

---

## Step 4 — PDF Renderer

Implement:

```text id="q0d7m4"
PdfRenderer
```

and renderer factory.

---

## Step 5 — Document Service

Implement:

```text id="p4h9t3"
Generate
Store
Version
Approve
Release
Download
Preview
Regenerate
Archive
```

---

## Step 6 — APIs

Implement:

```text id="w8m5j2"
Document APIs
Template APIs
Package APIs
```

---

## Step 7 — Security

Implement:

```text id="x6q2b8"
RBAC
Patient ownership
Department access
Confidentiality
Download protection
```

---

## Step 8 — Administration UI

Build:

```text id="r5g1n0"
Document Dashboard
Document Search
Document Details
Template Management
Package Management
Document Reports
```

---

## Step 9 — Patient Portal

Build:

```text id="z8f3m7"
My Documents
Document Viewer
Download
Version History where permitted
```

---

## Step 10 — Notifications

Integrate with:

```text id="p3x8v6"
Notification Service
```

for:

```text
Document Released
Document Expiring
Document Generation Failed
```

---

## Step 11 — RPA

Implement required:

```text id="q1s7k2"
External Document Download
External Upload
Document Verification
Reconciliation
```

---

## Step 12 — Retention

Implement:

```text id="u5g8c3"
Archive jobs
Expiry jobs
Integrity checks
```

---

## Step 13 — Cross-Module Integration

Integrate with:

```text id="d9v4s1"
Patient Registration
Appointment
Admission
Discharge
Billing
Insurance
Claims
Pharmacy
Laboratory
Radiology
Procurement
Vendor
Maintenance
Housekeeping
Feedback
HR
Payroll
Reports
RPA
```

---

# 134. CROSS-MODULE RULE

No module should create its own independent document storage system.

Incorrect:

```text id="j4n6z8"
Billing/
  invoices/
    pdf/

Lab/
  reports/
    pdf/

Insurance/
  claims/
    documents/
```

Correct:

```text id="b2c7f4"
Billing ────────┐
Laboratory ─────┤
Radiology ──────┤
Insurance ──────┤
Procurement ────┤
Feedback ───────┤
                 ↓
        Document Service
                 ↓
        Secure Storage
```

---

# 135. FINAL IMPLEMENTATION RULES FOR AI CODING AGENT

When implementing this module:

1. Build one centralized Document Service.
2. Do not create separate document engines in individual modules.
3. Keep business data in the originating module.
4. Treat generated files as artifacts.
5. Use configurable templates.
6. Version templates.
7. Version generated documents.
8. Never silently overwrite released documents.
9. Validate all template variables.
10. Generate PDF by default.
11. Store files securely.
12. Do not expose storage URLs publicly.
13. Implement secure downloads.
14. Implement patient-level access control.
15. Implement department-level access control.
16. Protect restricted documents.
17. Validate uploaded files.
18. Support malware scanning where available.
19. Calculate and store checksums.
20. Support document packages.
21. Preserve source documents inside packages.
22. Do not modify clinical content.
23. Do not calculate billing amounts.
24. Do not approve clinical results.
25. Do not approve financial decisions.
26. Use Notification Service for communication.
27. Use AuditEvent for audit logging.
28. Use RPAJob for automation tracking.
29. Implement idempotency.
30. Implement concurrency protection.
31. Handle storage failures safely.
32. Handle rendering failures safely.
33. Do not release incomplete documents.
34. Use UTC internally.
35. Support configurable language.
36. Support configurable retention.
37. Keep archived documents auditable.
38. Never expose sensitive patient information in filenames or logs.
39. Test authorization thoroughly.
40. Keep the service reusable by every existing and future hospital module.

---

# 136. DEFINITION OF DONE

The Document Generation Service is complete when:

```text id="k9s4z0"
Hospital Module
      ↓
Document Request
      ↓
Validate Source Data
      ↓
Select Approved Template
      ↓
Render Document
      ↓
Generate PDF
      ↓
Validate File
      ↓
Calculate Checksum
      ↓
Secure Storage
      ↓
Create Document Metadata
      ↓
Approval if required
      ↓
Release
      ↓
Notification Service
      ↓
Patient / Staff Access
      ↓
Audit
```

and all generated documents remain:

- Secure
- Versioned
- Auditable
- Traceable
- Permission-controlled
- Reusable across modules
- Accessible through the appropriate portal
- Suitable for RPA integration

The implementation must be **fully functional**, integrated with the existing MERN + MongoDB + Robot Framework architecture, and must not be implemented as a static PDF generator or mock document-management screen.