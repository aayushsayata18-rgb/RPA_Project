# 25_PATIENT_FEEDBACK.md

# Patient Feedback, Complaints & Grievance Management

## 1. MODULE PURPOSE

Build a complete **Patient Feedback, Complaints, Suggestions & Grievance Management module** for the Hospital Administrative Automation & RPA Platform.

The module must allow the hospital to:

- Collect patient feedback.
- Collect complaints and grievances.
- Collect suggestions and compliments.
- Collect service-specific ratings.
- Track complaints from submission to closure.
- Assign complaints to responsible departments/users.
- Track investigation and response progress.
- Enforce configurable SLA timelines.
- Escalate overdue or high-priority cases.
- Maintain complete audit history.
- Allow patients to track appropriate complaint statuses.
- Send acknowledgement and resolution notifications.
- Attach supporting documents.
- Maintain confidentiality for sensitive complaints.
- Generate management reports and analytics.
- Integrate feedback with relevant hospital modules.
- Automate repetitive administrative workflows using Robot Framework where required.

The module must **not** allow automation to independently:

- Decide whether a complaint is true or false.
- Blame a doctor, nurse, employee, department, vendor, or patient.
- Make disciplinary decisions.
- Determine compensation.
- Approve refunds or financial adjustments.
- Make clinical decisions.
- Determine medical negligence.
- Determine clinical responsibility.
- Suppress or silently delete complaints.
- Change investigation findings.
- Close sensitive complaints without authorized human approval.

Human review must remain mandatory for sensitive, disputed, disciplinary, clinical, safety-related, legal, or high-impact complaints.

---

# 2. ARCHITECTURAL PRINCIPLE

The MERN application is the **system of record**.

Robot Framework is the **automation worker**.

```text
Patient / Staff
      |
      v
React Feedback Interface
      |
      v
Node.js + Express API
      |
      +----------------------+
      |                      |
      v                      v
MongoDB                 Notification Service
      |
      v
Feedback / Complaint Case
      |
      +----------------------+
      |                      |
      v                      v
Human Review          Robot Framework
                            |
                            v
                 External / Legacy Systems
```

The standard automation lifecycle is:

```text
INPUT
  ↓
READ
  ↓
VALIDATE
  ↓
APPLY CONFIGURED RULES
  ↓
CREATE / UPDATE CASE
  ↓
VERIFY
  ↓
NOTIFY
  ↓
LOG
```

If the automation encounters ambiguity:

```text
Automation
    ↓
Exception
    ↓
Human Review
    ↓
Approved Decision
    ↓
Automation Continues
```

---

# 3. MODULE SCOPE

The module covers:

1. Feedback submission
2. Complaint submission
3. Suggestions
4. Compliments
5. Ratings
6. Department-specific feedback
7. Staff-related feedback
8. Service feedback
9. Complaint categorization
10. Complaint assignment
11. Priority management
12. SLA tracking
13. Investigation workflow
14. Internal notes
15. Patient-facing responses
16. Escalation
17. Reopening
18. Resolution
19. Closure
20. Attachments
21. Confidentiality
22. Notifications
23. RPA automation
24. Analytics
25. Audit trail
26. Management reporting

---

# 4. FEEDBACK CHANNELS

The system should support configurable feedback sources.

Initial supported channels:

```text
1. Patient Portal
2. Front Desk
3. Authorized Staff Entry
4. Post-Visit Feedback Link
5. Post-Discharge Feedback
6. Email/Form Import
7. Legacy Hospital System
```

Future channels may include:

```text
8. Kiosk
9. Mobile Application
10. External Feedback Platform
11. Call-Center Entry
```

The `source` field must identify where the feedback originated.

Example:

```text
source = PATIENT_PORTAL
```

or:

```text
source = FRONT_DESK
```

---

# 5. FEEDBACK TYPES

The system must support configurable feedback types.

Initial types:

```text
COMPLAINT
SUGGESTION
COMPLIMENT
SERVICE_FEEDBACK
STAFF_FEEDBACK
FACILITY_FEEDBACK
BILLING_FEEDBACK
PHARMACY_FEEDBACK
LAB_FEEDBACK
RADIOLOGY_FEEDBACK
HOUSEKEEPING_FEEDBACK
MAINTENANCE_FEEDBACK
OTHER
```

The system administrator must be able to configure additional categories without modifying application code.

---

# 6. PATIENT FEEDBACK VS COMPLAINT

Do not treat every rating as a complaint.

Example:

```text
Rating = 5
Type = SERVICE_FEEDBACK
```

This is normal feedback.

Example:

```text
Rating = 1
Type = SERVICE_FEEDBACK
```

This may trigger a configurable review rule, but must not automatically become a formal complaint unless hospital policy explicitly enables such conversion.

A formal complaint should have its own complaint lifecycle.

---

# 7. PATIENT SUBMISSION FLOW

## 7.1 Patient Portal Flow

```text
Patient Login
    ↓
Feedback / Complaints
    ↓
Select Type
    ↓
Select Category
    ↓
Select Related Visit (Optional)
    ↓
Enter Subject
    ↓
Enter Description
    ↓
Rating (if applicable)
    ↓
Upload Attachment (Optional)
    ↓
Review
    ↓
Submit
    ↓
Generate Feedback ID
    ↓
Acknowledgement
```

Example:

```text
Patient ID: P10045
Visit ID: V202600123
Type: COMPLAINT
Category: HOUSEKEEPING
Subject: Room cleaning delay
Description: Room cleaning was delayed after discharge.
Rating: 2
```

System generates:

```text
Feedback ID: FB-2026-000124
```

---

# 8. ANONYMOUS FEEDBACK

Anonymous feedback may be supported if enabled by hospital configuration.

Configuration:

```text
allowAnonymousFeedback = true
```

For anonymous feedback:

- Do not require Patient ID.
- Do not require login.
- Generate Feedback ID.
- Allow status tracking using secure tracking mechanism if supported.
- Do not expose identity if the patient intentionally chose anonymity.

However, anonymous feedback may have limitations:

- Cannot always be linked to a visit.
- Follow-up may be impossible.
- Patient-specific resolution communication may not be possible.

Do not automatically convert anonymous feedback into identified feedback.

---

# 9. PATIENT IDENTITY LINKING

When feedback is submitted by a logged-in patient:

```text
patientId = Patient._id
```

Optional contextual references:

```text
visitId
appointmentId
admissionId
invoiceId
departmentId
```

The system must not automatically attach unrelated medical records.

Only relevant references should be linked.

---

# 10. FEEDBACK DATA MODEL

Create a `Feedback` Mongoose model.

Suggested structure:

```javascript
{
  feedbackId: String,

  patientId: ObjectId,
  visitId: ObjectId,
  appointmentId: ObjectId,
  admissionId: ObjectId,

  type: String,
  category: String,
  subcategory: String,

  source: String,

  subject: String,
  description: String,

  rating: Number,

  departmentId: ObjectId,
  staffId: ObjectId,
  locationId: ObjectId,

  priority: String,

  status: String,

  assignedTo: ObjectId,
  assignedDepartmentId: ObjectId,

  dueAt: Date,

  response: {
    text: String,
    respondedBy: ObjectId,
    respondedAt: Date,
    approvedBy: ObjectId,
    approvedAt: Date
  },

  resolution: {
    summary: String,
    resolvedBy: ObjectId,
    resolvedAt: Date
  },

  confidentiality: {
    level: String,
    restricted: Boolean
  },

  anonymous: Boolean,

  attachments: [
    {
      documentId: ObjectId,
      uploadedBy: ObjectId,
      uploadedAt: Date
    }
  ],

  tags: [String],

  externalReference: {
    system: String,
    referenceId: String
  },

  createdBy: ObjectId,
  updatedBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 11. FEEDBACK ID

Every feedback/complaint must receive a unique identifier.

Format:

```text
FB-YYYY-NNNNNN
```

Example:

```text
FB-2026-000001
FB-2026-000002
FB-2026-000003
```

Generation must be concurrency-safe.

Never generate IDs using a simple client-side counter.

---

# 12. FEEDBACK STATUS

Use configurable statuses.

Recommended statuses:

```text
DRAFT
SUBMITTED
ACKNOWLEDGED
ASSIGNED
UNDER_REVIEW
INVESTIGATION
WAITING_FOR_INFORMATION
RESPONSE_DRAFT
RESPONSE_PENDING_APPROVAL
RESPONSE_SENT
RESOLVED
CLOSED
REOPENED
ESCALATED
WITHDRAWN
```

If the hospital policy supports rejection, it may use:

```text
REJECTED
```

However, rejection must never be used merely to suppress an inconvenient complaint.

---

# 13. STATUS TRANSITIONS

Recommended lifecycle:

```text
DRAFT
  ↓
SUBMITTED
  ↓
ACKNOWLEDGED
  ↓
ASSIGNED
  ↓
UNDER_REVIEW
  ↓
INVESTIGATION
  ↓
RESPONSE_DRAFT
  ↓
RESPONSE_PENDING_APPROVAL
  ↓
RESPONSE_SENT
  ↓
RESOLVED
  ↓
CLOSED
```

Alternative paths:

```text
UNDER_REVIEW
      ↓
WAITING_FOR_INFORMATION
      ↓
UNDER_REVIEW
```

Escalation:

```text
UNDER_REVIEW
      ↓
ESCALATED
      ↓
INVESTIGATION
```

Reopening:

```text
CLOSED
   ↓
REOPENED
   ↓
UNDER_REVIEW
```

---

# 14. STATUS TRANSITION VALIDATION

The backend must enforce valid transitions.

Example:

```text
SUBMITTED → ACKNOWLEDGED
```

is valid.

But:

```text
SUBMITTED → CLOSED
```

should not be allowed unless an authorized administrative workflow explicitly supports direct closure.

Never rely only on frontend controls.

---

# 15. COMPLAINT PRIORITY

Supported priorities:

```text
LOW
MEDIUM
HIGH
URGENT
CRITICAL
```

Priority must be based on configured administrative rules and/or authorized staff selection.

The RPA system must not independently determine clinical severity.

For example:

```text
Safety-related complaint
      ↓
Route to authorized responsible team
```

not:

```text
RPA decides medical severity
```

---

# 16. SENSITIVE COMPLAINTS

Some complaints require restricted access.

Examples:

```text
Staff conduct
Patient privacy
Security
Clinical safety
Alleged negligence
Legal matters
Financial disputes
Potential harassment
Potential abuse
```

Such complaints should support:

```text
confidentiality.level = RESTRICTED
```

or:

```text
confidentiality.level = HIGHLY_RESTRICTED
```

Access must be controlled using RBAC.

---

# 17. CONFIDENTIALITY LEVELS

Recommended:

```text
NORMAL
RESTRICTED
HIGHLY_RESTRICTED
```

Example:

```text
NORMAL
→ assigned department + authorized managers

RESTRICTED
→ designated department manager + authorized administration

HIGHLY_RESTRICTED
→ specifically authorized management/compliance users
```

Do not expose restricted complaint details to unrelated staff.

---

# 18. INTERNAL NOTES VS PATIENT RESPONSE

These must be separate.

## Internal Notes

Used by authorized staff for:

- Investigation notes
- Internal communication
- Evidence review
- Assignment discussion
- Administrative decisions

These must never automatically appear in the Patient Portal.

## Patient Response

Contains only approved patient-facing information.

Example:

```text
Your complaint has been reviewed by the concerned department.
The matter has been addressed according to hospital policy.
```

---

# 19. INTERNAL NOTE MODEL

Create:

```text
FeedbackInternalNote
```

Suggested fields:

```javascript
{
  feedbackId: ObjectId,
  authorId: ObjectId,
  note: String,
  visibility: String,
  createdAt: Date
}
```

Visibility:

```text
INTERNAL
RESTRICTED
MANAGEMENT_ONLY
```

---

# 20. INVESTIGATION MODEL

For complaints requiring investigation, create:

```text
FeedbackInvestigation
```

Suggested fields:

```javascript
{
  investigationId: String,
  feedbackId: ObjectId,

  investigatorId: ObjectId,

  startedAt: Date,
  dueAt: Date,

  findings: String,

  evidence: [
    {
      documentId: ObjectId,
      description: String
    }
  ],

  conclusion: String,

  recommendation: String,

  status: String,

  approvedBy: ObjectId,
  approvedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

Possible statuses:

```text
OPEN
IN_PROGRESS
WAITING_FOR_INFORMATION
COMPLETED
PENDING_APPROVAL
APPROVED
CANCELLED
```

---

# 21. IMPORTANT INVESTIGATION RULE

The system may collect and organize investigation information.

It must not independently decide:

```text
Who is guilty
Who is responsible
Whether negligence occurred
Whether disciplinary action is required
Whether compensation must be paid
Whether a staff member should be terminated
```

These require authorized human decisions.

---

# 22. ASSIGNMENT

A complaint may be assigned to:

- Department
- Responsible manager
- Designated staff member
- Administrative team
- Compliance team
- Patient relations team

Example:

```text
Feedback:
FB-2026-000124

Department:
Housekeeping

Assigned To:
Housekeeping Manager
```

Assignment history must be preserved.

---

# 23. ASSIGNMENT HISTORY

Create:

```text
FeedbackAssignmentHistory
```

Fields:

```javascript
{
  feedbackId: ObjectId,
  fromDepartmentId: ObjectId,
  toDepartmentId: ObjectId,

  fromUserId: ObjectId,
  toUserId: ObjectId,

  reason: String,

  assignedBy: ObjectId,

  assignedAt: Date
}
```

Never overwrite the complete history.

---

# 24. SLA MANAGEMENT

SLA must be configurable.

Example configuration:

```text
LOW       → 5 working days
MEDIUM    → 3 working days
HIGH      → 1 working day
URGENT    → 4 hours
CRITICAL  → 1 hour
```

These are example values only.

Do not hard-code these values.

Hospital administration must be able to configure:

- acknowledgement SLA
- first-response SLA
- investigation SLA
- resolution SLA
- escalation threshold

---

# 25. SLA TIMER

For each applicable case store:

```text
submittedAt
acknowledgedAt
dueAt
resolvedAt
closedAt
```

Calculate:

```text
SLA elapsed
SLA remaining
SLA breached
```

The system should support:

```text
ON_TRACK
AT_RISK
BREACHED
PAUSED
```

---

# 26. SLA PAUSE

SLA may be paused when the case is:

```text
WAITING_FOR_INFORMATION
```

only if hospital configuration permits it.

The system must record:

```text
pauseStart
pauseEnd
pauseReason
pausedBy
```

Do not silently stop the SLA timer.

---

# 27. SLA ESCALATION

Example:

```text
Complaint submitted
       ↓
Assigned
       ↓
SLA approaching
       ↓
Reminder
       ↓
SLA breached
       ↓
Escalation
       ↓
Manager notification
```

Escalation rules must be configurable.

---

# 28. AUTOMATIC ACKNOWLEDGEMENT

After successful submission:

```text
Feedback ID generated
        ↓
Acknowledgement notification
```

Example:

```text
Your feedback has been received.

Feedback ID: FB-2026-000124

You can track its status through the hospital portal.
```

---

# 29. NOTIFICATIONS

Use the centralized Notification Service.

Supported channels:

```text
SMS
Email
In-App
```

Possible notifications:

### Patient

- Feedback received
- Complaint acknowledged
- Additional information requested
- Response available
- Complaint resolved
- Complaint reopened

### Internal Staff

- New complaint assigned
- SLA approaching
- SLA breached
- Escalation
- Investigation assigned
- Approval required

---

# 30. NOTIFICATION PRIVACY

Do not send sensitive complaint details through SMS.

Bad:

```text
Your complaint about Dr. XYZ's alleged negligence has been escalated.
```

Prefer:

```text
Your hospital feedback case has an important update.
Please log in to the secure portal.
```

Use secure portal links for sensitive information.

---

# 31. FEEDBACK ATTACHMENTS

Patients/staff may upload attachments where configured.

Examples:

```text
Image
PDF
Receipt
Invoice
Document
Screenshot
Other approved formats
```

The system must validate:

- file type
- file size
- malware/security policy
- access permissions

Attachments must not be publicly accessible.

---

# 32. DOCUMENT ACCESS

Every attachment must be protected by authorization.

Do not expose:

```text
/uploads/feedback/file.pdf
```

as a public URL.

Use authenticated document retrieval.

---

# 33. PATIENT PORTAL

Create:

```text
/portal/patient/feedback
```

Pages:

```text
FeedbackHome
SubmitFeedback
MyFeedback
FeedbackDetails
ComplaintDetails
FeedbackResponse
```

---

# 34. PATIENT FEEDBACK HOME

Display:

```text
Give Feedback
My Complaints
My Feedback
Track Complaint
```

Example:

```text
+------------------------------------+
| Patient Feedback                   |
+------------------------------------+
|                                    |
| [ Submit Feedback ]                |
|                                    |
| [ My Complaints ]                  |
|                                    |
| [ Feedback History ]               |
|                                    |
+------------------------------------+
```

---

# 35. SUBMIT FEEDBACK FORM

Fields:

```text
Feedback Type
Category
Subcategory
Related Visit
Department
Subject
Description
Rating
Attachments
Anonymous Option
```

Only show relevant fields.

For example:

```text
COMPLIMENT
→ Rating optional

COMPLAINT
→ Subject required
→ Description required
```

---

# 36. RATING COMPONENT

Use a standard rating control.

Example:

```text
Overall Experience

★ ★ ★ ★ ★
```

Rating:

```text
1 = Very Poor
2 = Poor
3 = Average
4 = Good
5 = Excellent
```

Labels should be configurable.

---

# 37. PATIENT COMPLAINT LIST

Display:

```text
Feedback ID
Type
Category
Submitted Date
Status
Last Updated
```

Example:

| Feedback ID | Type | Category | Status |
|---|---|---|---|
| FB-2026-000124 | Complaint | Housekeeping | Under Review |
| FB-2026-000125 | Suggestion | Facility | Resolved |

---

# 38. PATIENT COMPLAINT DETAILS

Patient may see:

```text
Feedback ID
Submission date
Category
Subject
Submitted description
Current status
Acknowledgement
Patient-facing response
Resolution status
Last updated
```

Do not expose:

- internal notes
- investigation evidence
- staff performance notes
- restricted information
- internal routing details
- confidential management decisions

---

# 39. STAFF / ADMIN FEEDBACK DASHBOARD

Create:

```text
/portal/administration/feedback
```

Dashboard cards:

```text
Total Feedback
Open Complaints
High Priority
SLA At Risk
SLA Breached
Pending Assignment
Pending Response
Resolved
Reopened
```

---

# 40. FEEDBACK MANAGEMENT SCREEN

Filters:

```text
Feedback ID
Patient ID
Date range
Type
Category
Department
Priority
Status
Assigned User
Source
SLA Status
```

Search must be server-side for large datasets.

---

# 41. FEEDBACK DETAILS ADMIN SCREEN

Display:

### Patient/context

```text
Patient ID
Visit ID
Appointment ID
Admission ID
```

### Feedback

```text
Type
Category
Subject
Description
Rating
Source
```

### Assignment

```text
Department
Assigned User
Priority
```

### SLA

```text
Due Date
Remaining Time
SLA Status
```

### Investigation

```text
Investigator
Status
Findings
Evidence
```

### Response

```text
Draft Response
Approval
Sent Date
```

### Audit

```text
Complete history
```

---

# 42. RESPONSE WORKFLOW

For sensitive or complaint cases:

```text
Investigation
    ↓
Response Draft
    ↓
Response Approval
    ↓
Response Sent
    ↓
Resolution
    ↓
Closure
```

The approval requirement must be configurable by category/priority.

---

# 43. RESPONSE APPROVAL

For configured cases:

```text
Staff drafts response
        ↓
Manager reviews
        ↓
APPROVE
        ↓
Patient receives response
```

or:

```text
Manager rejects draft
        ↓
Return for correction
```

The system must preserve previous drafts.

---

# 44. PATIENT RESPONSE

Patient-facing response should be stored separately from internal findings.

Example:

```text
Response:
Thank you for bringing this matter to our attention.
The concerned department has reviewed the issue and
appropriate administrative action has been taken.
```

Do not expose confidential internal details.

---

# 45. RESOLUTION

A case may be marked resolved when:

- Investigation is complete.
- Required response has been approved.
- Required administrative action has been recorded.
- Patient-facing response has been sent where applicable.

The exact resolution criteria must be configurable.

---

# 46. CLOSURE

Closing a case is different from resolving it.

Recommended:

```text
RESOLVED
    ↓
Patient response
    ↓
Closure eligibility
    ↓
CLOSED
```

Authorized users may close cases according to policy.

---

# 47. REOPENING

Patients or authorized staff may request reopening.

Example:

```text
Complaint:
RESOLVED

Patient:
"I am not satisfied with the resolution."

        ↓

REOPENED
```

Store:

```text
reopenedBy
reopenedAt
reopenReason
previousStatus
```

Never delete previous resolution history.

---

# 48. WITHDRAWAL

Patients may request withdrawal where permitted.

Withdrawal should not automatically delete the complaint.

Instead:

```text
status = WITHDRAWN
```

Keep the audit history.

For legally/safety-sensitive complaints, hospital policy may require the case to remain under review even if the patient requests withdrawal.

This must be handled by authorized staff.

---

# 49. FEEDBACK CATEGORIES

Initial configuration may include:

```text
Clinical Service
Nursing
Reception
Billing
Insurance
Pharmacy
Laboratory
Radiology
Housekeeping
Maintenance
Food Services
Facilities
Waiting Time
Appointment
OPD
Admission
Discharge
Communication
Staff Conduct
Patient Experience
Other
```

These must remain configurable.

---

# 50. MODULE INTEGRATIONS

The Feedback module integrates with:

```text
Patient
Appointment
OPD Queue
Admission
Billing
Insurance
Pharmacy
Laboratory
Radiology
Housekeeping
Maintenance
Staff
Notification
Document
Reports & Analytics
Audit
RPA
```

---

# 51. PATIENT INTEGRATION

Use:

```text
patientId
```

as the reference.

Do not duplicate the entire Patient document.

Example:

```javascript
patientId: ObjectId("...")
```

When displaying information, retrieve authorized patient details.

---

# 52. APPOINTMENT INTEGRATION

Optional:

```text
appointmentId
```

Use when feedback concerns:

- appointment scheduling
- doctor appointment
- waiting time
- cancellation
- rescheduling
- appointment communication

---

# 53. ADMISSION INTEGRATION

Optional:

```text
admissionId
```

Use for inpatient feedback.

Example:

```text
Room cleanliness
Nursing service
Admission experience
Discharge experience
```

---

# 54. BILLING INTEGRATION

For billing complaints:

```text
invoiceId
paymentId
```

may be referenced.

The Feedback module does not independently modify invoices.

Example:

```text
Patient complaint:
"Billing amount appears incorrect."

Feedback
    ↓
Billing Query
    ↓
Billing Staff Review
```

Billing staff decides whether an adjustment is required.

---

# 55. PHARMACY INTEGRATION

Pharmacy feedback may reference:

```text
pharmacyOrderId
prescriptionId
dispensingRecordId
```

The Feedback module must not modify prescriptions or dispensing decisions.

---

# 56. LABORATORY INTEGRATION

Feedback may reference:

```text
labOrderId
sampleId
reportId
```

The feedback system must not modify laboratory results.

---

# 57. RADIOLOGY INTEGRATION

Feedback may reference:

```text
radiologyOrderId
studyId
reportId
```

The feedback system must not modify radiology findings or reports.

---

# 58. HOUSEKEEPING INTEGRATION

Example:

```text
Complaint:
Room cleaning delayed
```

The system may link:

```text
housekeepingTaskId
```

The Feedback module should not directly alter housekeeping task completion.

---

# 59. MAINTENANCE INTEGRATION

Example:

```text
Complaint:
AC not working
```

The feedback may reference:

```text
maintenanceTicketId
```

Maintenance remains responsible for the actual maintenance workflow.

---

# 60. STAFF FEEDBACK

If feedback refers to a specific staff member:

```text
staffId
```

may be linked.

However, staff-related complaints require restricted access.

Do not expose public staff complaint information.

The system must not automatically create disciplinary action.

---

# 61. DEPARTMENT ASSIGNMENT

A complaint can be assigned to a department.

Example:

```text
Category:
Housekeeping

Department:
Housekeeping

Assigned User:
Housekeeping Manager
```

Assignment rules should be configurable.

---

# 62. AUTOMATED ROUTING

Simple deterministic routing may be automated.

Example:

```text
category = HOUSEKEEPING
→ department = HOUSEKEEPING
```

This is acceptable because it is administrative routing.

However:

```text
description = "Doctor made a serious clinical error"
→ RPA decides doctor is responsible
```

is prohibited.

The system may route the complaint to the configured authorized review team.

---

# 63. RPA RESPONSIBILITIES

Robot Framework may automate:

1. Importing feedback from legacy systems.
2. Reading external complaint portals.
3. Creating feedback records.
4. Synchronizing complaint statuses.
5. Sending acknowledgement triggers.
6. Checking SLA conditions.
7. Sending internal reminders.
8. Escalation notifications.
9. Downloading external complaint documents.
10. Uploading approved responses to external systems.
11. Synchronizing external case numbers.
12. Reconciliation.
13. Reporting.
14. Legacy portal integration.

---

# 64. RPA MUST NOT

Robot Framework must not independently:

```text
Determine complaint truth
Determine negligence
Assign blame
Approve disciplinary action
Approve compensation
Approve refunds
Modify clinical information
Modify laboratory results
Modify radiology findings
Approve financial adjustments
Close high-risk complaints without authorization
```

---

# 65. EXTERNAL SYSTEM AUTOMATION

If a hospital uses a legacy complaint system:

```text
Hospital Platform
      |
      v
RPA
      |
      v
Legacy Complaint Portal
```

Example workflow:

```text
Read feedback record
       ↓
Validate external reference
       ↓
Login
       ↓
Open complaint system
       ↓
Search case
       ↓
Update status
       ↓
Upload approved document
       ↓
Save
       ↓
Read confirmation
       ↓
Verify
       ↓
Update MongoDB
```

---

# 66. EXTERNAL SYSTEM FAILURE

If external system fails:

```text
RPA Job
   ↓
Failure
   ↓
Retry according to safe retry policy
   ↓
Still failing
   ↓
RPA Exception
   ↓
Human Review
```

Do not blindly repeat an update if the external result is unknown.

Example:

```text
Portal Save clicked
       ↓
Browser timeout
       ↓
Unknown whether update succeeded
```

Do not immediately submit again.

Instead:

```text
Search external case
       ↓
Verify actual state
       ↓
Continue / reconcile
```

---

# 67. RPA JOB MODEL

Create/reuse:

```text
RPAJob
RPAExecution
```

Suggested fields:

```javascript
{
  jobId: String,
  type: String,
  module: "PATIENT_FEEDBACK",

  referenceId: ObjectId,

  status: String,

  startedAt: Date,
  completedAt: Date,

  attempt: Number,

  externalSystem: String,
  externalReference: String,

  correlationId: String,

  errorCode: String,
  errorMessage: String,

  evidence: [
    {
      type: String,
      location: String
    }
  ]
}
```

---

# 68. ROBOT FRAMEWORK STRUCTURE

Create:

```text
robot/
├── portals/
│   └── feedback/
│       ├── feedback_import.robot
│       ├── legacy_case_sync.robot
│       ├── complaint_status_sync.robot
│       ├── feedback_notification.robot
│       ├── feedback_escalation.robot
│       └── feedback_reconciliation.robot
│
├── keywords/
│   └── feedback/
│       ├── feedback_keywords.robot
│       ├── legacy_portal_keywords.robot
│       ├── notification_keywords.robot
│       └── reconciliation_keywords.robot
│
├── resources/
│   ├── common.robot
│   ├── browser.robot
│   ├── api.robot
│   └── variables.robot
│
└── tests/
    └── feedback/
        ├── feedback_import_tests.robot
        ├── complaint_sync_tests.robot
        ├── escalation_tests.robot
        └── reconciliation_tests.robot
```

---

# 69. ROBOT FRAMEWORK EXAMPLE

Example conceptual test:

```robot
*** Test Cases ***
Import New External Complaint

    Get Pending External Complaints
    FOR    ${complaint}    IN    @{complaints}
        Validate Complaint
        Search Existing Feedback
        Create Feedback If Missing
        Store External Reference
        Verify Feedback Created
    END
```

The implementation should use reusable keywords rather than duplicated browser steps.

---

# 70. ROBOT API-FIRST PRINCIPLE

If the external system exposes a reliable API:

```text
Use API
```

instead of browser automation.

If no API exists:

```text
Use Robot Framework browser automation
```

Do not automate a browser unnecessarily.

---

# 71. RPA EVIDENCE

For external automation maintain evidence when appropriate:

```text
Screenshot
External case ID
Timestamp
Execution ID
Response message
Downloaded document reference
```

Evidence must be access-controlled.

---

# 72. RPA CORRELATION

Every automation must have:

```text
RPA Job ID
Correlation ID
Feedback ID
External Reference
```

Example:

```text
Feedback ID:
FB-2026-000124

RPA Job:
RPA-FB-000823

Correlation:
CORR-2026-ABC123

External Case:
EXT-984522
```

---

# 73. DUPLICATE PREVENTION

The system must prevent duplicate feedback creation during RPA imports.

Possible matching:

```text
externalSystem
externalReference
```

must be unique where applicable.

For patient-submitted feedback, do not automatically merge complaints merely because the descriptions look similar.

Possible duplicates must be reviewed if necessary.

---

# 74. FEEDBACK AUDIT TRAIL

Every important action must be audited.

Examples:

```text
Feedback Created
Feedback Updated
Assignment Changed
Priority Changed
Status Changed
Internal Note Added
Attachment Added
Investigation Started
Investigation Completed
Response Drafted
Response Approved
Response Sent
Feedback Resolved
Feedback Closed
Feedback Reopened
Feedback Escalated
```

---

# 75. AUDIT MODEL

Use the common:

```text
AuditEvent
```

model.

Suggested fields:

```javascript
{
  actorId: ObjectId,
  actorRole: String,

  action: String,

  entityType: "Feedback",
  entityId: ObjectId,

  before: Object,
  after: Object,

  ipAddress: String,
  userAgent: String,

  correlationId: String,

  createdAt: Date
}
```

Do not store unnecessary sensitive information.

---

# 76. SECURITY

Implement:

- JWT authentication
- Password hashing
- RBAC
- Backend authorization
- Object-level authorization
- Restricted complaint access
- Secure attachment access
- Input validation
- Rate limiting where appropriate
- Audit logging
- Session security
- Secure HTTP headers
- Protection against injection
- File upload validation
- Sensitive data minimization

---

# 77. ROLE PERMISSIONS

Example:

| Role | Submit | View | Assign | Investigate | Respond | Close |
|---|---:|---:|---:|---:|---:|---:|
| Patient | ✓ | Own | — | — | — | Request |
| Receptionist | ✓ | Limited | — | — | — | — |
| Department Manager | ✓ | Department | ✓ | ✓ | ✓ | ✓ |
| Administrative Manager | ✓ | All Authorized | ✓ | ✓ | ✓ | ✓ |
| Hospital Management | — | Authorized | ✓ | ✓ | Approve | ✓ |
| System Admin | — | Technical | Technical | — | — | — |

The exact permissions must be configurable.

---

# 78. PATIENT ACCESS RULE

A patient can only access feedback associated with their own account.

Backend must verify:

```text
authenticatedUser.patientId === feedback.patientId
```

Do not trust:

```text
GET /feedback/:id
```

alone.

---

# 79. STAFF ACCESS RULE

A department manager should normally see only:

```text
their department
```

unless additional permissions are granted.

Restricted complaints require explicit authorization.

---

# 80. DATABASE INDEXES

Recommended indexes:

```javascript
FeedbackSchema.index({ feedbackId: 1 }, { unique: true });

FeedbackSchema.index({
  patientId: 1,
  createdAt: -1
});

FeedbackSchema.index({
  status: 1,
  priority: 1,
  createdAt: -1
});

FeedbackSchema.index({
  assignedTo: 1,
  status: 1
});

FeedbackSchema.index({
  assignedDepartmentId: 1,
  status: 1
});

FeedbackSchema.index({
  category: 1,
  createdAt: -1
});

FeedbackSchema.index({
  source: 1,
  createdAt: -1
});

FeedbackSchema.index({
  dueAt: 1,
  status: 1
});

FeedbackSchema.index({
  "externalReference.system": 1,
  "externalReference.referenceId": 1
});
```

---

# 81. API DESIGN

Base path:

```text
/api/feedback
```

---

# 82. PATIENT APIs

### Create feedback

```http
POST /api/feedback
```

### Get patient's feedback

```http
GET /api/feedback/my
```

### Get feedback

```http
GET /api/feedback/:feedbackId
```

### Upload attachment

```http
POST /api/feedback/:feedbackId/attachments
```

### Request reopening

```http
POST /api/feedback/:feedbackId/reopen
```

---

# 83. ADMIN APIs

### List feedback

```http
GET /api/feedback
```

Filters:

```text
status
type
category
department
priority
assignedTo
source
dateFrom
dateTo
slaStatus
```

### Assign

```http
POST /api/feedback/:feedbackId/assign
```

### Change priority

```http
POST /api/feedback/:feedbackId/priority
```

### Add internal note

```http
POST /api/feedback/:feedbackId/internal-notes
```

### Start investigation

```http
POST /api/feedback/:feedbackId/investigation
```

### Update investigation

```http
PATCH /api/feedback/:feedbackId/investigation
```

### Draft response

```http
POST /api/feedback/:feedbackId/response
```

### Approve response

```http
POST /api/feedback/:feedbackId/response/approve
```

### Send response

```http
POST /api/feedback/:feedbackId/response/send
```

### Resolve

```http
POST /api/feedback/:feedbackId/resolve
```

### Close

```http
POST /api/feedback/:feedbackId/close
```

### Escalate

```http
POST /api/feedback/:feedbackId/escalate
```

---

# 84. REPORT APIs

```http
GET /api/feedback/reports/summary
GET /api/feedback/reports/by-category
GET /api/feedback/reports/by-department
GET /api/feedback/reports/sla
GET /api/feedback/reports/resolution-time
GET /api/feedback/reports/ratings
```

---

# 85. RPA APIs

```http
POST /api/feedback/rpa/import
POST /api/feedback/rpa/sync
POST /api/feedback/rpa/reconcile
GET  /api/feedback/rpa/jobs
GET  /api/feedback/rpa/jobs/:jobId
```

RPA APIs must be authenticated using a service identity.

Do not expose them publicly.

---

# 86. BACKEND STRUCTURE

Use:

```text
server/
├── models/
│   ├── Feedback.js
│   ├── FeedbackInternalNote.js
│   ├── FeedbackInvestigation.js
│   ├── FeedbackAssignmentHistory.js
│   └── FeedbackSLA.js
│
├── controllers/
│   └── feedbackController.js
│
├── services/
│   ├── feedbackService.js
│   ├── feedbackRoutingService.js
│   ├── feedbackSLAService.js
│   ├── feedbackInvestigationService.js
│   ├── feedbackResponseService.js
│   └── feedbackAnalyticsService.js
│
├── validators/
│   └── feedbackValidator.js
│
└── routes/
    └── feedbackRoutes.js
```

---

# 87. FRONTEND STRUCTURE

Use:

```text
client/src/
├── portals/
│   ├── patient/
│   │   └── feedback/
│   │       ├── FeedbackHome.jsx
│   │       ├── SubmitFeedback.jsx
│   │       ├── MyFeedback.jsx
│   │       └── FeedbackDetails.jsx
│   │
│   └── administration/
│       └── feedback/
│           ├── FeedbackDashboard.jsx
│           ├── FeedbackList.jsx
│           ├── FeedbackDetails.jsx
│           ├── InvestigationPanel.jsx
│           ├── ResponsePanel.jsx
│           └── FeedbackReports.jsx
│
└── components/
    └── feedback/
        ├── FeedbackStatusBadge.jsx
        ├── PriorityBadge.jsx
        ├── RatingInput.jsx
        ├── SLAIndicator.jsx
        └── FeedbackTimeline.jsx
```

---

# 88. FEEDBACK TIMELINE

Every case should display a chronological timeline.

Example:

```text
10:05 AM
Complaint submitted

10:05 AM
Acknowledgement sent

10:20 AM
Assigned to Housekeeping Manager

11:10 AM
Investigation started

02:30 PM
Investigation completed

03:00 PM
Response approved

03:05 PM
Response sent

03:10 PM
Case resolved
```

This is highly useful for auditability.

---

# 89. FEEDBACK ANALYTICS

Management dashboard should include:

### Volume

```text
Feedback count
Complaint count
Suggestion count
Compliment count
```

### Category

```text
Billing
Housekeeping
Pharmacy
Laboratory
Radiology
Reception
Facilities
etc.
```

### Department

```text
Complaints by department
```

### Ratings

```text
Average rating
Rating distribution
```

### SLA

```text
SLA compliance
SLA breaches
Average response time
Average resolution time
```

### Status

```text
Open
Under Review
Escalated
Resolved
Closed
Reopened
```

---

# 90. TREND ANALYSIS

Support:

```text
Daily
Weekly
Monthly
Quarterly
```

Example:

```text
Housekeeping complaints
Jan → 32
Feb → 28
Mar → 19
Apr → 14
```

Charts should be interactive.

Use the existing frontend charting approach used by the application.

Do not use static screenshot charts.

---

# 91. DEPARTMENT PERFORMANCE

Show:

```text
Department
Total Complaints
Average Response Time
Average Resolution Time
SLA Compliance
Reopened Cases
Average Rating
```

Do not automatically use these metrics to punish employees.

Management must interpret the results.

---

# 92. RECURRING ISSUE ANALYSIS

The system may identify repeated categories.

Example:

```text
Housekeeping
→ Room cleaning delay
→ 32 complaints
```

This can generate:

```text
Recurring Issue Alert
```

But the system must not automatically conclude:

```text
Housekeeping staff are responsible.
```

It only identifies a pattern.

---

# 93. FEEDBACK TO ACTION WORKFLOW

Example:

```text
Feedback
   ↓
Category
   ↓
Department
   ↓
Investigation
   ↓
Action Recommendation
   ↓
Authorized Decision
   ↓
Resolution
```

The system records the decision.

It does not autonomously make the decision.

---

# 94. NOTIFICATION TEMPLATES

Create configurable templates.

Examples:

```text
FEEDBACK_RECEIVED
COMPLAINT_ACKNOWLEDGED
FEEDBACK_ASSIGNED
FEEDBACK_SLA_WARNING
FEEDBACK_SLA_BREACHED
FEEDBACK_INFORMATION_REQUESTED
FEEDBACK_RESPONSE_AVAILABLE
FEEDBACK_RESOLVED
FEEDBACK_REOPENED
```

Templates should support variables:

```text
{{feedbackId}}
{{patientName}}
{{status}}
{{portalLink}}
{{dueDate}}
```

Sensitive information should not be inserted into insecure channels.

---

# 95. DOCUMENT GENERATION

Possible generated documents:

```text
Feedback Acknowledgement
Complaint Response
Resolution Letter
Internal Investigation Report
Feedback Summary Report
Management Report
```

Use the centralized Document Generation module.

Do not create a second independent document engine.

---

# 96. FEEDBACK EXPORT

Authorized users may export:

```text
CSV
Excel
PDF
```

according to system capabilities and permissions.

Export must respect:

- RBAC
- confidentiality
- department scope
- date filters
- restricted fields

---

# 97. DATA RETENTION

Retention should be configurable.

Example configuration:

```text
feedbackRetentionDays
complaintRetentionDays
attachmentRetentionDays
auditRetentionDays
```

Do not hard-code legal retention periods.

The hospital administrator must configure retention according to applicable policies.

---

# 98. SOFT DELETE

Feedback should generally not be physically deleted.

Instead use:

```text
status = WITHDRAWN
```

or another configured lifecycle state.

Administrative deletion, if ever required, must be:

- permission restricted
- audited
- policy controlled

---

# 99. EXCEPTION CASES

Create/reuse:

```text
ExceptionCase
```

Examples:

```text
Duplicate external complaint
Unknown external case
Patient reference mismatch
Department mapping missing
Invalid attachment
Unauthorized access
Notification failure
External portal unavailable
External status mismatch
SLA configuration missing
Invalid status transition
Restricted complaint access violation
Response approval missing
```

---

# 100. HUMAN-IN-THE-LOOP CASES

Human review is mandatory when:

```text
Complaint is sensitive
Complaint alleges clinical negligence
Complaint alleges staff misconduct
Complaint involves legal issues
Complaint involves financial compensation
External status is ambiguous
Patient identity cannot be verified
Multiple patient matches exist
External case has conflicting information
```

---

# 101. SEED DATA

Create realistic demo data.

Example departments:

```text
Reception
Billing
Pharmacy
Laboratory
Radiology
Housekeeping
Maintenance
Nursing
Administration
Patient Relations
```

Example feedback:

```text
FB-2026-000001
Type: COMPLAINT
Category: HOUSEKEEPING
Priority: MEDIUM
Status: UNDER_REVIEW
```

```text
FB-2026-000002
Type: SERVICE_FEEDBACK
Category: RECEPTION
Rating: 4
Status: CLOSED
```

```text
FB-2026-000003
Type: COMPLIMENT
Category: NURSING
Rating: 5
Status: CLOSED
```

---

# 102. DEMO SCENARIO 1 — NORMAL FEEDBACK

```text
Patient logs in
      ↓
Submit Feedback
      ↓
Type = SERVICE_FEEDBACK
      ↓
Rating = 4
      ↓
Submit
      ↓
FB ID generated
      ↓
Acknowledgement
      ↓
Feedback stored
```

Expected:

```text
Status = ACKNOWLEDGED
```

---

# 103. DEMO SCENARIO 2 — HOUSEKEEPING COMPLAINT

```text
Patient submits complaint
        ↓
Category = HOUSEKEEPING
        ↓
System routes to Housekeeping
        ↓
Manager receives notification
        ↓
Investigation
        ↓
Response
        ↓
Resolution
        ↓
Patient notified
```

---

# 104. DEMO SCENARIO 3 — BILLING COMPLAINT

```text
Patient
   ↓
Billing Complaint
   ↓
Invoice reference
   ↓
Billing Staff Review
   ↓
Verify invoice
   ↓
Decision by authorized billing staff
   ↓
Response
```

The Feedback module does not automatically change the invoice.

---

# 105. DEMO SCENARIO 4 — REOPENED COMPLAINT

```text
Complaint
   ↓
Resolved
   ↓
Patient disagrees
   ↓
Reopen Request
   ↓
REOPENED
   ↓
New Review
```

Previous history must remain available.

---

# 106. DEMO SCENARIO 5 — SENSITIVE COMPLAINT

```text
Patient submits sensitive complaint
        ↓
Confidentiality = RESTRICTED
        ↓
Restricted routing
        ↓
Authorized reviewer
        ↓
Investigation
        ↓
Approved response
        ↓
Patient notified
```

Unauthorized users must not see the complaint.

---

# 107. DEMO SCENARIO 6 — SLA BREACH

```text
Complaint submitted
      ↓
SLA calculated
      ↓
Assigned
      ↓
No action
      ↓
SLA warning
      ↓
SLA breached
      ↓
Escalation
      ↓
Manager notification
```

---

# 108. API VALIDATION

Validate:

```text
type
category
description
rating
patient reference
visit reference
attachments
priority
status transitions
assignment
```

Examples:

```text
rating must be between 1 and 5
```

if rating is provided.

Do not accept:

```text
rating = 100
```

---

# 109. INPUT SANITIZATION

All free-text fields must be sanitized against:

- XSS
- HTML injection
- malicious scripts
- invalid control characters

Never render raw user-submitted HTML.

---

# 110. IDEMPOTENCY

Important actions should support idempotency.

Examples:

```text
Create external feedback
Send response
Import complaint
Sync status
Upload external response
```

Use idempotency keys where appropriate.

Example:

```text
Idempotency-Key:
FB-RPA-2026-000124
```

---

# 111. CONCURRENCY CONTROL

Prevent two administrators from performing conflicting operations.

Example:

```text
Manager A:
closes complaint

Manager B:
reopens complaint
```

The backend must validate current state before applying the operation.

Use:

```text
version
updatedAt
optimistic concurrency
```

as appropriate.

---

# 112. FRONTEND UX REQUIREMENTS

The UI should be:

- Clean
- Professional
- Responsive
- Accessible
- Fast
- Consistent with the rest of the hospital application

Use existing application design system.

Do not create a completely different visual language.

---

# 113. RESPONSIVE PATIENT EXPERIENCE

Patient portal must work properly on:

```text
Mobile
Tablet
Desktop
```

The feedback form should be easy to complete on a mobile phone.

---

# 114. ACCESSIBILITY

Support:

- Keyboard navigation
- Labels for inputs
- Accessible error messages
- Screen-reader friendly controls
- Proper contrast
- Focus states
- Clear status indicators

Do not communicate status using color alone.

---

# 115. ERROR HANDLING

Example:

```text
Feedback submission failed.
Please try again.
```

Do not expose:

```text
MongoDB error
Stack trace
Internal exception
Database credentials
```

to users.

---

# 116. AUDITABLE AUTOMATION

Every RPA operation must produce:

```text
Input
Validation result
Action
Verification result
Output
Timestamp
Operator/service identity
Correlation ID
```

This is required for troubleshooting and audit.

---

# 117. REPORTING REQUIREMENTS

Reports should include:

### Feedback Summary

```text
Total
Complaints
Suggestions
Compliments
Average Rating
```

### Complaint Status

```text
Submitted
Under Review
Escalated
Resolved
Closed
Reopened
```

### Department Report

```text
Department
Complaint Count
Average Rating
Average Resolution Time
SLA Compliance
```

### SLA Report

```text
Total Cases
On Time
At Risk
Breached
```

---

# 118. SECURITY LOGGING

Log security-sensitive events:

```text
Restricted feedback viewed
Restricted attachment accessed
Investigation accessed
Response approved
Complaint closed
Complaint reopened
Export generated
```

Do not log sensitive complaint text unnecessarily.

---

# 119. TESTING REQUIREMENTS

Implement:

### Unit Tests

- Feedback validation
- ID generation
- Status transitions
- SLA calculation
- Priority validation
- Assignment
- Response approval
- Reopening
- Permission checks

### Integration Tests

- Patient feedback submission
- Notification creation
- Department routing
- Billing feedback reference
- Appointment feedback reference
- Document attachment
- RPA job creation

### API Tests

Test:

```text
POST /api/feedback
GET /api/feedback/my
GET /api/feedback/:id
POST /api/feedback/:id/assign
POST /api/feedback/:id/resolve
POST /api/feedback/:id/close
POST /api/feedback/:id/reopen
```

---

# 120. RBAC TESTS

Verify:

```text
Patient cannot view another patient's complaint.
Receptionist cannot view restricted complaints without permission.
Department manager cannot access unrelated confidential cases.
Unauthorized user cannot approve responses.
Unauthorized user cannot close complaints.
```

---

# 121. RPA TESTS

Test:

```text
External complaint import
Duplicate detection
External case search
Status synchronization
External response upload
Notification trigger
SLA escalation
External portal failure
Unknown external state
Reconciliation
```

---

# 122. ACCEPTANCE CRITERIA

The module is complete only when all of the following work.

### Feedback

- [ ] Patient can submit feedback.
- [ ] Patient can submit complaint.
- [ ] Patient can optionally rate service.
- [ ] Feedback ID is generated.
- [ ] Patient can view their feedback.
- [ ] Anonymous feedback works if enabled.
- [ ] Attachments work securely.

### Complaint Management

- [ ] Complaints can be assigned.
- [ ] Priority can be managed.
- [ ] SLA is calculated.
- [ ] SLA warnings work.
- [ ] Escalation works.
- [ ] Investigation can be recorded.
- [ ] Internal notes are private.
- [ ] Patient responses are separated from internal notes.
- [ ] Response approval works.
- [ ] Resolution works.
- [ ] Closure works.
- [ ] Reopening works.

### Security

- [ ] RBAC works.
- [ ] Patient data isolation works.
- [ ] Restricted complaints are protected.
- [ ] Attachments are protected.
- [ ] Audit events are generated.

### Notifications

- [ ] Acknowledgement works.
- [ ] Assignment notification works.
- [ ] SLA notification works.
- [ ] Response notification works.
- [ ] Resolution notification works.

### RPA

- [ ] External import works.
- [ ] Duplicate protection works.
- [ ] External status synchronization works.
- [ ] RPA jobs are tracked.
- [ ] Evidence is captured where appropriate.
- [ ] Unknown external states enter reconciliation.
- [ ] RPA never makes prohibited decisions.

### Analytics

- [ ] Feedback volume reports work.
- [ ] Category reports work.
- [ ] Department reports work.
- [ ] Rating reports work.
- [ ] SLA reports work.
- [ ] Resolution-time reports work.

---

# 123. IMPLEMENTATION ORDER

The AI coding agent should implement this module in the following order.

## Step 1 — Database

Create:

```text
Feedback
FeedbackInternalNote
FeedbackInvestigation
FeedbackAssignmentHistory
FeedbackSLA
```

Reuse:

```text
Patient
Visit
Appointment
Admission
Employee
Department
Notification
Document
AuditEvent
RPAJob
ExceptionCase
```

---

## Step 2 — Backend Services

Implement:

```text
feedbackService
feedbackRoutingService
feedbackSLAService
feedbackInvestigationService
feedbackResponseService
feedbackAnalyticsService
```

---

## Step 3 — Validation

Implement:

```text
feedbackValidator
statusTransitionValidator
permissionValidator
attachmentValidator
```

---

## Step 4 — APIs

Implement patient APIs first.

Then:

```text
Admin APIs
Investigation APIs
Response APIs
Analytics APIs
RPA APIs
```

---

## Step 5 — Patient UI

Build:

```text
Feedback Home
Submit Feedback
My Feedback
Feedback Details
Complaint Tracking
```

---

## Step 6 — Administration UI

Build:

```text
Feedback Dashboard
Feedback List
Feedback Details
Assignment
Investigation
Response
Resolution
Reports
```

---

## Step 7 — Notifications

Integrate with:

```text
Notification Service
```

Do not build a second notification system.

---

## Step 8 — Documents

Integrate with:

```text
Document Generation
Document Storage
```

Do not create a separate document engine.

---

## Step 9 — RPA

Implement:

```text
External Import
External Status Sync
External Response Upload
SLA Escalation
Reconciliation
```

---

## Step 10 — Analytics

Implement:

```text
Summary
Category
Department
Rating
SLA
Resolution
Trend
```

---

## Step 11 — Security

Verify:

```text
RBAC
Patient isolation
Restricted complaint access
Attachment security
Audit logging
Export security
```

---

## Step 12 — Testing

Run:

```text
Unit Tests
API Tests
Integration Tests
RBAC Tests
RPA Tests
End-to-End Tests
```

---

# 124. END-TO-END ACCEPTANCE SCENARIO

Use this complete scenario to validate the implementation.

```text
Patient:
Rahul Shah

Patient ID:
P10045

Visit:
V202600123
```

Patient submits:

```text
Type:
COMPLAINT

Category:
HOUSEKEEPING

Subject:
Room cleaning delay

Description:
Room cleaning was delayed after discharge.

Rating:
2
```

System:

```text
Create FB-2026-000124
        ↓
ACKNOWLEDGED
        ↓
Route to Housekeeping
        ↓
Assign Manager
        ↓
Start SLA
        ↓
Notify Manager
```

Manager:

```text
Opens complaint
        ↓
Starts investigation
        ↓
Adds internal note
        ↓
Reviews housekeeping task
        ↓
Completes investigation
```

Manager drafts:

```text
Patient-facing response
```

Authorized reviewer:

```text
Approves response
```

System:

```text
Sends notification
        ↓
Marks RESPONSE_SENT
        ↓
Marks RESOLVED
```

After closure:

```text
Patient can view:
- Complaint ID
- Status
- Response
- Resolution
```

Patient cannot view:

```text
Internal notes
Investigation evidence
Staff performance information
Confidential management notes
```

If patient is dissatisfied:

```text
Request Reopen
      ↓
REOPENED
      ↓
New review
```

Every action must appear in the audit trail.

---

# 125. FINAL IMPLEMENTATION RULES FOR THE AI CODING AGENT

When implementing this module:

1. Do not create duplicate Patient entities.
2. Reuse the existing Patient ID.
3. Reuse Visit/Appointment/Admission references where available.
4. Do not duplicate Notification functionality.
5. Do not duplicate Document functionality.
6. Do not duplicate Audit functionality.
7. Do not duplicate RPA job tracking.
8. Use MongoDB references rather than copying entire documents.
9. Enforce authorization on the backend.
10. Never trust frontend permissions alone.
11. Preserve complaint history.
12. Never silently delete complaints.
13. Keep internal notes separate from patient responses.
14. Protect restricted complaints.
15. Protect attachments.
16. Make SLA rules configurable.
17. Make categories configurable.
18. Make notification templates configurable.
19. Make escalation rules configurable.
20. Do not hard-code hospital policy.
21. Do not invent clinical rules.
22. Do not invent compensation/refund rules.
23. Do not allow RPA to make sensitive human decisions.
24. Use API-first integration when possible.
25. Use Robot Framework browser automation only when necessary.
26. Verify external actions before recording them as successful.
27. Never blindly retry an unknown external transaction.
28. Preserve RPA evidence and correlation IDs.
29. Implement idempotency.
30. Implement concurrency protection.
31. Write unit, integration, API, RBAC, RPA, and end-to-end tests.
32. Use realistic seed data.
33. Keep the module integrated with the existing hospital platform.
34. Do not create a separate standalone feedback application.
35. Keep the implementation production-oriented and maintainable.

---

# 126. DEFINITION OF DONE

`25_PATIENT_FEEDBACK.md` is considered implemented only when:

```text
Patient
  ↓
Can submit feedback/complaint
  ↓
System generates Feedback ID
  ↓
Feedback is stored securely
  ↓
Correct department can receive it
  ↓
SLA is calculated
  ↓
Complaint can be investigated
  ↓
Internal notes remain private
  ↓
Response can be approved
  ↓
Patient receives appropriate notification
  ↓
Complaint can be resolved
  ↓
Complaint can be closed
  ↓
Complaint can be reopened
  ↓
All actions are audited
  ↓
Management can analyze feedback
  ↓
External systems can be synchronized by RPA
  ↓
RPA exceptions can be reconciled
  ↓
Sensitive decisions remain human-controlled
```

The final implementation must be **fully functional**, not a mockup, placeholder workflow, or static UI.