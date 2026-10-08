# 00_MASTER.md

# Hospital Administrative Management & RPA Automation Platform

## 1. DOCUMENT PURPOSE

This document is the **master implementation specification** for the complete Hospital Administrative Management & RPA Automation Platform.

This file must be given to an AI coding agent **before implementing any individual module**.

The AI coding agent must treat this document as the **global architecture and business-rule contract** for the entire project.

Individual functionality files will later provide detailed implementation instructions for specific modules such as:

- Patient Registration
- Appointment Management
- OPD Queue
- Admission
- Bed Management
- Discharge
- Billing
- Insurance
- Doctor Management
- Staff Management
- Attendance
- Pharmacy
- Inventory
- Procurement
- Laboratory
- Radiology
- Maintenance
- Housekeeping
- Notifications
- Documents
- Reports

The individual module files must follow all architecture, security, naming, data, RPA and workflow rules defined in this master file.

---

# 2. PROJECT OBJECTIVE

Build a complete hospital administrative management platform that digitizes and automates repetitive hospital administrative processes.

The system must combine:

1. A complete **MERN stack hospital application**
2. A **Robot Framework RPA automation layer**
3. Role-based portals
4. Centralized MongoDB data
5. REST APIs
6. Authentication and authorization
7. Notification services
8. Payment integration
9. Document generation
10. Insurance portal automation
11. External-system automation
12. Audit logging
13. Exception management
14. Reporting and analytics

The application must be functional rather than a collection of static UI screens.

Every major module must contain:

- Frontend screens
- Backend APIs
- MongoDB models
- Validation
- Business logic
- Role permissions
- Audit logging
- Error handling
- Notifications where applicable
- RPA integration where applicable
- Testable workflows
- Real data flow between modules

---

# 3. TECHNOLOGY STACK

## 3.1 Frontend

Use:

- React.js
- React Router
- JavaScript or TypeScript consistently throughout the project
- Axios/fetch for API communication
- Responsive CSS
- Component-based architecture

The frontend must be organized by role and module.

Do not create a completely separate React application for every role.

Use one React application with:

- Authentication
- Protected routes
- Role-based layouts
- Role-based navigation
- Shared components
- Module-specific components

---

# 4. BACKEND

Use:

- Node.js
- Express.js
- REST APIs
- MongoDB
- Mongoose

Backend responsibilities include:

- Authentication
- Authorization
- Business rules
- Data validation
- Database operations
- Workflow orchestration
- Notifications
- Payment integration
- Document generation
- RPA job management
- Audit logging
- Exception management
- Reporting APIs

The backend must never trust the frontend for authorization.

Every protected API must verify the authenticated user's role and permissions.

---

# 5. DATABASE

Use:

**MongoDB**

Use Mongoose models.

The database must contain separate collections/models for major business entities.

Expected major entities include:

```text
User
Role
Permission

Patient
Visit
Appointment
AppointmentHistory

OPDQueue
OPDToken

Admission
Bed
Ward
BedAssignment

Discharge
DischargeChecklist

Invoice
InvoiceItem
Payment
PaymentAttempt
Deposit
Discount
FinancialAdjustment

InsurancePolicy
InsuranceVerification
InsuranceClaim
InsuranceClaimDocument
InsuranceClaimStatusHistory

Doctor
DoctorSchedule
DoctorAvailability

Employee
Department
EmployeeRole

Attendance
AttendanceCorrection

Shift
ShiftAssignment

LeaveRequest
LeaveBalance

PayrollInput

Medicine
Prescription
PharmacyOrder
DispensingRecord

InventoryItem
InventoryBatch
InventoryMovement
InventoryAlert

PurchaseRequest
Quotation
PurchaseOrder
GoodsReceipt

Vendor
VendorDocument

LabOrder
LabSample
LabResult
LabDocument

RadiologyOrder
RadiologySchedule
RadiologyReport

MaintenanceTicket
Asset

HousekeepingTask

Feedback
Complaint

Notification
NotificationTemplate
NotificationDelivery

DocumentTemplate
GeneratedDocument

AuditEvent
RPAJob
RPAExecution
ExceptionCase

SystemConfiguration
HospitalConfiguration
```

The exact model structure will be refined in individual module files.

---

# 6. APPLICATION PORTALS

Do NOT create one complete application for every hospital role.

The recommended architecture is **one MERN application containing five major portal experiences**.

## Portal 1 — Patient Portal

Primary user:

```text
Patient
```

Features:

- Registration
- Login
- Profile
- Appointments
- Appointment reminders
- Online check-in
- OPD token
- Admission information
- Bed/accommodation information where applicable
- Bills
- Payment
- Payment reminders
- Payment status
- Digital receipts
- Insurance information
- Claim status where permitted
- Laboratory report availability
- Radiology report availability
- Documents
- Notifications
- Feedback
- Complaint submission

---

# 7. PORTAL 2 — CLINICAL PORTAL

Users:

```text
Doctor
Nurse
```

Doctor features include:

- Doctor dashboard
- Today's appointments
- OPD queue
- Patient information
- Consultation workflow
- Admission request
- Discharge request
- Doctor schedule
- Availability
- Patient-related operational information

Nurse features include:

- Assigned patients
- Ward information
- Nursing operational tasks
- Admission-related tasks
- Transfer information
- Discharge coordination
- Notifications

Clinical users must only access information permitted to their role.

RPA must never replace clinical decision-making.

---

# 8. PORTAL 3 — OPERATIONS PORTAL

Users:

```text
Receptionist
Pharmacist
Lab Technician
Radiology Technician
Housekeeping Staff
Maintenance Staff
```

The portal must dynamically display functionality based on role.

For example:

Receptionist:

- Registration
- Appointment
- Front-desk check-in
- OPD queue
- Admission coordination
- Patient search

Pharmacist:

- Pharmacy orders
- Dispensing
- Inventory
- Medicine stock
- Expiry
- Alerts

Lab Technician:

- Lab queue
- Sample management
- Lab administrative status
- Report workflow

Radiology Technician:

- Radiology scheduling
- Modality/resource status
- Report workflow

Housekeeping:

- Cleaning tasks
- Bed/room cleaning
- Task completion

Maintenance:

- Maintenance tickets
- Asset maintenance
- Work status

---

# 9. PORTAL 4 — FINANCE & INSURANCE PORTAL

Users:

```text
Billing Staff
Insurance Representative
```

Features:

- Billing dashboard
- Invoices
- Charges
- Payments
- Payment attempts
- Deposits
- Discounts
- Insurance verification
- Insurance claims
- Claim documents
- Claim status
- Settlement
- Billing queries
- Financial reports

Insurance representatives must have restricted access only to permitted insurance-related information.

---

# 10. PORTAL 5 — ADMINISTRATION & MANAGEMENT PORTAL

Users:

```text
Administrative Manager
HR Manager
Procurement Officer
Hospital Management
Authorized System Administrator
```

Features:

- Hospital configuration
- Users
- Roles
- Permissions
- Doctors
- Employees
- Departments
- Shifts
- Attendance
- Leave
- Payroll support
- Procurement
- Vendors
- Inventory
- Maintenance
- Reports
- Analytics
- Audit logs
- RPA jobs
- Exceptions
- Notification templates
- Document templates
- System configuration

---

# 11. ROLE-BASED ACCESS CONTROL

The system must implement RBAC.

Roles:

```text
PATIENT
RECEPTIONIST
DOCTOR
NURSE
PHARMACIST
LAB_TECHNICIAN
RADIOLOGY_TECHNICIAN
HOUSEKEEPING
MAINTENANCE
ADMIN_MANAGER
HR_MANAGER
BILLING_STAFF
INSURANCE_REPRESENTATIVE
PROCUREMENT_OFFICER
VENDOR
HOSPITAL_MANAGEMENT
SYSTEM_ADMIN
```

Do not hard-code role checks throughout components.

Use a centralized permission system.

Example:

```text
PATIENT_APPOINTMENT_CREATE
PATIENT_APPOINTMENT_VIEW
PATIENT_BILL_VIEW
PATIENT_PAYMENT_CREATE

PATIENT_REGISTER
PATIENT_UPDATE

OPD_CHECKIN
OPD_QUEUE_VIEW

ADMISSION_CREATE
ADMISSION_APPROVE

BED_VIEW
BED_ASSIGN
BED_TRANSFER

DISCHARGE_REQUEST
DISCHARGE_FINALIZE

INVOICE_CREATE
INVOICE_VIEW
PAYMENT_VIEW

INSURANCE_VERIFY
CLAIM_CREATE
CLAIM_SUBMIT

DOCTOR_MANAGE
EMPLOYEE_MANAGE

ATTENDANCE_VIEW
ATTENDANCE_CORRECT

SHIFT_MANAGE
LEAVE_APPROVE

INVENTORY_MANAGE
PROCUREMENT_MANAGE

REPORT_VIEW
AUDIT_VIEW

RPA_VIEW
RPA_RUN
RPA_RETRY
```

The final permission matrix will be expanded as modules are implemented.

---

# 12. CRITICAL IDENTITY RULES

The system must distinguish the following IDs.

## Patient ID

Permanent identity.

Example:

```text
P10045
```

A patient must never receive another permanent Patient ID simply because they:

- return to hospital
- visit another department
- get admitted
- come through emergency
- change phone number
- book another appointment

---

# 13. VISIT ID

A new Visit ID represents a new patient encounter.

Example:

```text
VIS202610060001
```

One patient can have many visits.

```text
Patient P10045
    ↓
VIS001
VIS002
VIS003
VIS004
```

---

# 14. APPOINTMENT ID

A booked appointment gets its own Appointment ID.

Example:

```text
APT202610060021
```

An appointment can be:

```text
BOOKED
CONFIRMED
CHECKED_IN
IN_PROGRESS
COMPLETED
CANCELLED
RESCHEDULED
NO_SHOW
```

---

# 15. OPD TOKEN

OPD token represents the patient's position in the current OPD queue.

Example:

```text
A-023
```

The token is not the appointment ID.

---

# 16. ADMISSION ID

Each admission receives an Admission ID.

Example:

```text
ADM202610060023
```

A patient can have multiple admissions during their lifetime.

---

# 17. BILLING IDs

Invoices must have unique IDs.

Example:

```text
INV202610060001
```

Payments must have transaction IDs.

Example:

```text
PAY202610060034
```

---

# 18. INSURANCE CLAIM ID

Example:

```text
CLM202610060012
```

Claim status history must be preserved.

---

# 19. EMPLOYEE ID

Each employee gets a permanent Employee ID.

Example:

```text
EMP10452
```

---

# 20. RPA JOB ID

Every Robot Framework automation execution must have a correlation ID.

Example:

```text
RPA20261006000023
```

This must connect:

```text
Hospital Action
      ↓
RPA Job
      ↓
Robot Execution
      ↓
External System Action
      ↓
Result
      ↓
Audit Log
```

---

# 21. MASTER HOSPITAL WORKFLOW

The overall patient journey is:

```text
Patient Registration
        ↓
Patient ID
        ↓
Appointment
        ↓
Appointment Confirmation
        ↓
Appointment Reminder
        ↓
Patient Arrival
        ↓
Online Check-in OR Front Desk Check-in
        ↓
OPD Token
        ↓
OPD Queue
        ↓
Consultation
        ↓
Admission Required?
      /       \
    NO         YES
    ↓           ↓
Services     Admission
               ↓
          Bed Assignment
               ↓
       Hospital Services
       /       |       \
     Lab    Radiology  Pharmacy
       \       |       /
            Billing
               ↓
       Insurance Verification
               ↓
        Insurance Claim
               ↓
        Patient Payment
               ↓
       Financial Settlement
               ↓
       Discharge Approval
               ↓
       Discharge Finalized
               ↓
       Bed CLEANING REQUIRED
               ↓
          Housekeeping
               ↓
          Bed AVAILABLE
```

---

# 22. EMERGENCY PATIENT WORKFLOW

Emergency registration must not require previous registration.

```text
Emergency Arrival
       ↓
Search Central Patient Master
       ↓
Confident Match?
   /            \
 YES             NO
 ↓                ↓
Existing ID     Temporary Record
 ↓                ↓
Emergency Visit / Temporary ID
        ↓
Admission Workflow
        ↓
Identity Verification
        ↓
Link Temporary Record
        ↓
Permanent Patient Master
```

Never create:

```text
EmergencyPatientMaster
```

There must be only one central Patient Master.

---

# 23. PATIENT REGISTRATION CHANNELS

Exactly two registration channels:

```text
1. Online Self Registration
2. Front Desk Registration
```

Both must ultimately use the same Patient Master.

---

# 24. OPD CHECK-IN CHANNELS

Exactly two check-in channels in the current design:

```text
1. Online Self Check-in
2. Front Desk Check-in
```

QR-code check-in is not part of the current implementation.

---

# 25. APPOINTMENT SPECIALTY RULE

The system must not assume a medical specialty based on basic RPA logic.

Specialty can come from:

```text
Patient selects specialty
OR
Patient selects doctor
OR
Doctor referral specifies specialty
```

If the patient only provides symptoms without knowing the specialty, route the case to an authorized hospital workflow.

RPA must not independently make medical recommendations.

---

# 26. NOTIFICATION ARCHITECTURE

Build one reusable centralized Notification Service.

Supported channels:

```text
SMS
Email
```

Future channels can be added later.

Notification events include:

```text
Registration Confirmation

Appointment Confirmation
Appointment Reminder
Appointment Cancellation
Appointment Rescheduling

OPD Check-in
OPD Token Called

Admission Confirmation

Billing Notification
Payment Reminder
Payment Successful
Payment Failed
Receipt Generated

Insurance Verification Result
Insurance Query
Claim Submitted
Claim Approved
Claim Rejected
Claim Query

Lab Report Available
Radiology Report Available

Discharge Notification

Staff Welcome
Staff Transfer
Staff Offboarding

Maintenance Alert
Inventory Alert
Procurement Alert

Feedback Acknowledgement
Complaint Update
```

Every notification must have:

```text
Notification ID
Recipient
Channel
Template
Event
Status
CreatedAt
SentAt
FailureReason
RetryCount
CorrelationID
```

---

# 27. BILLING PAYMENT NOTIFICATION RULE

When a bill is generated:

```text
Final Bill
    ↓
SMS + Email
    ↓
Secure payment link
```

If unpaid:

```text
Wait configured interval
    ↓
Payment Reminder
```

If payment succeeds:

```text
Payment Success
    ↓
SMS + Email
    ↓
Digital Receipt
```

If payment fails:

```text
Payment Failure
    ↓
SMS + Email
    ↓
Retry Payment
```

Reminder timing must be configurable.

Example:

```text
Immediately → Bill notification
24 hours → Reminder
48 hours → Second reminder
Configured escalation → Billing staff
```

Do not hard-code these timings.

---

# 28. PAYMENT GATEWAY RULE

Robot Framework must never process raw payment credentials.

Actual payment must be handled by a secure payment gateway.

Architecture:

```text
Patient Portal
      ↓
Node/Express
      ↓
Payment Gateway
      ↓
Bank/UPI/Card
      ↓
Gateway Result
      ↓
Backend
      ↓
Invoice/Payment Update
      ↓
Notification
```

RPA can:

- Check payment status
- Synchronize payment records
- Trigger notifications
- Generate receipts
- Handle administrative follow-up

RPA must not:

- Store card numbers
- Store CVV
- Process payment credentials
- Bypass gateway security

---

# 29. DISCHARGE PAYMENT GATE

This is one of the most important global business rules.

Discharge must not be finalized before the required financial settlement is completed.

```text
Doctor Discharge Approval
        ↓
Final Bill
        ↓
Insurance Settlement + Patient Payment
        ↓
Settlement Complete?
       /       \
     NO         YES
     ↓           ↓
Block       Discharge Finalized
Discharge       ↓
                Bed CLEANING REQUIRED
```

However, the hospital may have authorized exceptions such as:

- Insurance pending discharge
- Approved credit arrangement
- Approved waiver
- Approved adjustment
- Government/insurance scheme
- Management-approved exception

Therefore:

```text
Settlement incomplete
        ↓
Authorized Exception?
       /        \
     NO          YES
     ↓            ↓
Block         Continue
Discharge     Discharge
```

RPA must verify the exception.

RPA cannot create the exception.

---

# 30. BED MANAGEMENT RULES

Three different concepts must always remain separate.

## Clinical Requirement

Example:

```text
ICU Required
```

Decided by authorized clinical staff.

## Patient Accommodation Preference

Example:

```text
Private Room
```

Patient may select this where hospital policy permits.

## Physical Bed

Example:

```text
P-03
```

Assigned by hospital rules/system/staff.

The patient should normally not select a physical bed.

---

# 31. BED STATUS LIFECYCLE

Normal lifecycle:

```text
AVAILABLE
   ↓
RESERVED
   ↓
OCCUPIED
   ↓
CLEANING_REQUIRED
   ↓
AVAILABLE
```

Maintenance:

```text
AVAILABLE
   ↓
MAINTENANCE
   ↓
AVAILABLE
```

After discharge:

```text
OCCUPIED
   ↓
CLEANING_REQUIRED
```

Never directly:

```text
OCCUPIED → AVAILABLE
```

unless the hospital's explicitly configured workflow proves cleaning is not required.

---

# 32. RPA ROLE IN BED MANAGEMENT

RPA can:

- Read current bed status
- Filter suitable beds
- Apply predefined rules
- Coordinate assignment
- Update bed status
- Coordinate transfer
- Trigger housekeeping
- Generate bed reports

RPA must not:

- Decide ICU requirement
- Decide clinical suitability
- Automatically downgrade a clinically required bed
- Override hospital rules

---

# 33. RPA PRINCIPLE

The project must consistently follow:

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
LOG
```

If something cannot be safely determined:

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

# 34. HUMAN-IN-THE-LOOP AREAS

The following must require human decision/approval where applicable:

```text
Clinical diagnosis
Clinical priority
Admission decision
Discharge clinical decision
Medication decisions
Insurance coverage interpretation
Insurance claim appeal
Billing waiver
Billing adjustment
Financial exception
Bed clinical suitability
Ambiguous patient identity
Doctor qualification approval
Employee role approval
Access approval
Procurement approval
Vendor approval
Sensitive complaint resolution
```

RPA can automate the surrounding administrative work.

---

# 35. ROBOT FRAMEWORK ARCHITECTURE

Use Robot Framework as a separate automation project.

Recommended structure:

```text
robot/
│
├── resources/
│   ├── common.resource
│   ├── api.resource
│   ├── browser.resource
│   ├── authentication.resource
│   ├── database.resource
│   ├── notification.resource
│   ├── document.resource
│   └── evidence.resource
│
├── keywords/
│   ├── patient_keywords.resource
│   ├── appointment_keywords.resource
│   ├── opd_keywords.resource
│   ├── admission_keywords.resource
│   ├── bed_keywords.resource
│   ├── billing_keywords.resource
│   ├── insurance_keywords.resource
│   ├── claim_keywords.resource
│   ├── doctor_keywords.resource
│   └── staff_keywords.resource
│
├── tests/
│   ├── patient/
│   ├── appointment/
│   ├── opd/
│   ├── admission/
│   ├── billing/
│   ├── insurance/
│   └── staff/
│
├── portals/
│   ├── insurance/
│   └── legacy/
│
└── results/
```

---

# 36. RPA API-FIRST PRINCIPLE

When an external system provides a reliable API:

```text
Prefer API integration
```

When no API exists:

```text
Use Robot Framework browser automation
```

Example:

```text
Insurance API exists
        ↓
Robot/API integration

No API
        ↓
Robot Framework
        ↓
Browser
        ↓
Insurance Portal
```

This demonstrates genuine RPA capability without unnecessarily automating systems that already have APIs.

---

# 37. ROBOT FRAMEWORK JOB LIFECYCLE

Every automation job must follow:

```text
CREATED
   ↓
QUEUED
   ↓
RUNNING
   ↓
SUCCESS
```

Failure:

```text
RUNNING
   ↓
FAILED
   ↓
RETRY
   ↓
SUCCESS
```

Permanent failure:

```text
FAILED
   ↓
EXCEPTION
   ↓
HUMAN REVIEW
```

Possible statuses:

```text
CREATED
QUEUED
RUNNING
SUCCESS
FAILED
RETRYING
EXCEPTION
CANCELLED
```

---

# 38. RPA IDEMPOTENCY

RPA must never accidentally perform duplicate operations.

Examples:

Before submitting an insurance claim:

```text
Does claim already have external Claim ID?
       ↓
YES → Do not submit again
NO  → Submit
```

Before sending payment reminder:

```text
Has this reminder already been sent?
       ↓
YES → Skip
NO  → Send
```

Before creating patient:

```text
Does confident Patient ID already exist?
       ↓
YES → Reuse
NO  → Create
```

This rule is mandatory.

---

# 39. EXCEPTION MANAGEMENT

Create a central Exception Case system.

Every exception must contain:

```text
Exception ID
Module
Entity ID
RPA Job ID
Exception Type
Description
Severity
Source
Current Status
Assigned Role
CreatedAt
ResolvedAt
Resolution
```

Example:

```text
EXC202610060023

Module:
Insurance

Type:
PORTAL_UNAVAILABLE

Claim:
CLM202610060012

Status:
OPEN

Assigned:
Insurance Staff
```

---

# 40. RETRY POLICY

Not every failure should be retried.

Retry transient failures:

```text
Network timeout
Temporary portal outage
Temporary API failure
Temporary SMS provider failure
```

Do not blindly retry:

```text
Payment
Claim submission
Patient creation
Financial adjustment
Insurance submission
```

Before retrying any consequential action, verify whether the previous attempt actually succeeded.

---

# 41. AUDIT LOGGING

Every important operation must generate an AuditEvent.

Example:

```text
{
  userId,
  role,
  action,
  module,
  entityType,
  entityId,
  oldValue,
  newValue,
  timestamp,
  ipAddress,
  correlationId
}
```

Audit events include:

```text
LOGIN
LOGOUT

PATIENT_CREATED
PATIENT_UPDATED
PATIENT_LINKED

APPOINTMENT_CREATED
APPOINTMENT_CANCELLED
APPOINTMENT_RESCHEDULED

ADMISSION_CREATED
ADMISSION_APPROVED

BED_ASSIGNED
BED_TRANSFERRED
BED_STATUS_CHANGED

INVOICE_CREATED
PAYMENT_CREATED
PAYMENT_STATUS_CHANGED

INSURANCE_VERIFIED
CLAIM_SUBMITTED
CLAIM_STATUS_CHANGED

DISCHARGE_APPROVED
DISCHARGE_FINALIZED

EMPLOYEE_CREATED
EMPLOYEE_UPDATED
EMPLOYEE_OFFBOARDED

RPA_STARTED
RPA_COMPLETED
RPA_FAILED

DOCUMENT_CREATED
DOCUMENT_ACCESSED
```

Audit records should not be silently overwritten.

---

# 42. DOCUMENT ARCHITECTURE

Create a centralized document service.

Documents can include:

```text
Registration receipt
Appointment confirmation
Admission documents
Invoice
Payment receipt
Discharge documents
Insurance claim documents
Lab reports
Radiology reports
Employee documents
Purchase documents
Other approved administrative documents
```

Each document should have:

```text
Document ID
Document Type
Entity Type
Entity ID
Version
File Location
Created By
Created At
Access Permissions
```

---

# 43. DOCUMENT SECURITY

A user must never access a document merely because they know its URL.

Every document request must verify:

```text
Authentication
+
Authorization
+
Entity access
```

---

# 44. CONFIGURATION

Hospital rules must not be hard-coded.

Create configuration entities/settings for:

```text
Appointment reminder timing
OPD check-in window
No-show grace period
Bed allocation rules
Accommodation pricing
Billing rules
Payment reminder timing
Insurance configuration
Notification templates
Document templates
Shift rules
Leave rules
Inventory thresholds
Procurement thresholds
Escalation timing
```

Administrative users can manage approved configuration where permitted.

---

# 45. BILLING ARCHITECTURE

Billing must retrieve charges from:

```text
Room
Consultation
Laboratory
Pharmacy
Radiology
Other hospital services
```

Example:

```text
Room              ₹5,000
Laboratory        ₹2,000
Pharmacy          ₹3,500
Consultation      ₹1,000
Radiology         ₹2,500
------------------------
Gross Total      ₹14,000
```

Then apply configured:

```text
Insurance
Deposit
Discount
Authorized Adjustment
Tax/Other configured charges
```

Result:

```text
Gross Total
- Insurance
- Deposit
- Authorized Discount/Adjustment
=
Patient Payable
```

RPA must not invent these rules.

---

# 46. INSURANCE VERIFICATION

Verification checks may include:

```text
Policy number
Policy status
Active/expired
Patient eligibility
Hospital network
Coverage
Coverage limits
Used amount
Remaining amount
Authorization requirement
```

Implementation priority:

```text
API
↓
if unavailable
↓
Robot Framework browser automation
```

---

# 47. INSURANCE CLAIM PROCESSING

Claim process:

```text
Discharge/Claim Request
        ↓
Collect Patient Data
        ↓
Insurance Data
        ↓
Bills
        ↓
Treatment/Service Information
        ↓
Required Documents
        ↓
Validate Claim Package
        ↓
Submit
        ↓
Capture Claim Number
        ↓
Track
```

Possible statuses:

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

Status names must be configurable for insurer differences.

---

# 48. DOCTOR MANAGEMENT

Doctor management includes:

```text
Doctor profile
Specialization
Department
Qualification information
Registration information
Availability
Schedule
Leave/unavailability
Consultation configuration
```

RPA can synchronize approved schedules.

RPA does not approve qualifications.

---

# 49. STAFF MANAGEMENT

Staff management includes:

```text
Employee onboarding
Employee ID
Department
Role
Access requests
Documents
Welcome notification
Transfer
Role change
Department change
Offboarding
```

Role/access assignment must use an approved access matrix.

---

# 50. ATTENDANCE, SHIFT AND LEAVE

These modules must connect.

```text
Employee
   ↓
Shift Assignment
   ↓
Attendance
   ↓
Leave
   ↓
Payroll Input
```

Approved leave must affect relevant shift/attendance workflows.

---

# 51. PHARMACY AND INVENTORY

Pharmacy must connect to inventory and billing.

```text
Prescription/Order
       ↓
Pharmacy
       ↓
Dispensing
       ↓
Inventory Decrease
       ↓
Billing Charge
```

Inventory:

```text
Item
Batch
Expiry
Quantity
Minimum Level
Maximum Level
Location
Movement
```

---

# 52. PROCUREMENT

Procurement connects:

```text
Inventory Alert
     ↓
Purchase Request
     ↓
Approval
     ↓
Quotation
     ↓
Vendor
     ↓
Purchase Order
     ↓
Goods Receipt
     ↓
Inventory
```

RPA can automate administrative data movement.

---

# 53. LABORATORY

Administrative flow:

```text
Lab Order
   ↓
Lab Queue
   ↓
Sample
   ↓
Processing
   ↓
Authorized Result
   ↓
Report
   ↓
Billing
   ↓
Notification
```

RPA must never interpret laboratory results.

---

# 54. RADIOLOGY

Administrative flow:

```text
Radiology Order
   ↓
Scheduling
   ↓
Resource/Modality
   ↓
Procedure Status
   ↓
Report
   ↓
Billing
   ↓
Notification
```

RPA must never interpret imaging.

---

# 55. HOUSEKEEPING

Housekeeping is connected directly to bed management.

```text
Discharge Finalized
        ↓
Bed CLEANING_REQUIRED
        ↓
Housekeeping Task
        ↓
Assigned
        ↓
Cleaning
        ↓
Checklist
        ↓
Completed
        ↓
Bed AVAILABLE
```

The RPA must not mark a bed available before the required cleaning workflow is complete.

---

# 56. MAINTENANCE

Maintenance:

```text
Issue
 ↓
Ticket
 ↓
Assignment
 ↓
Work
 ↓
Parts/Cost
 ↓
Completion
 ↓
Verification
 ↓
Closed
```

Maintenance staff perform physical work.

RPA coordinates administrative status.

---

# 57. PATIENT FEEDBACK

Flow:

```text
Feedback
   ↓
Category
   ↓
Routing
   ↓
Responsible Staff
   ↓
Response
   ↓
Resolution
   ↓
Analytics
```

RPA can remind responsible staff about overdue cases.

---

# 58. REPORTING

Management dashboards should eventually include:

## Patient

```text
Registrations
Visits
Appointments
No-shows
```

## OPD

```text
Queue volume
Average waiting time
Completed consultations
```

## Admission

```text
Admissions
Discharges
Average stay
```

## Beds

```text
Total beds
Occupied
Available
Cleaning
Maintenance
Occupancy %
```

## Billing

```text
Gross billing
Collected amount
Outstanding
Payment failures
```

## Insurance

```text
Verification count
Claims submitted
Approved
Rejected
Pending
Settlement
```

## Staff

```text
Attendance
Absence
Leave
Shifts
```

## Inventory

```text
Stock
Low stock
Expiring
```

## Operations

```text
Maintenance
Housekeeping
Feedback
```

---

# 59. API DESIGN STANDARD

Use REST.

Example:

```text
/api/auth
/api/users
/api/patients
/api/visits
/api/appointments
/api/opd
/api/admissions
/api/beds
/api/discharges
/api/billing
/api/payments
/api/insurance
/api/claims
/api/doctors
/api/employees
/api/attendance
/api/shifts
/api/leave
/api/payroll
/api/pharmacy
/api/inventory
/api/procurement
/api/vendors
/api/lab
/api/radiology
/api/maintenance
/api/housekeeping
/api/feedback
/api/notifications
/api/documents
/api/reports
/api/rpa
/api/exceptions
/api/audit
/api/configuration
```

Every module-specific `.md` file will define its detailed endpoints.

---

# 60. API RESPONSE STANDARD

Use a consistent response structure.

Success:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Unable to complete operation",
  "errorCode": "VALIDATION_ERROR",
  "errors": []
}
```

Do not expose stack traces or secrets to users.

---

# 61. FRONTEND ARCHITECTURE

Recommended:

```text
client/
├── src/
│   ├── app/
│   ├── auth/
│   ├── routes/
│   ├── layouts/
│   ├── portals/
│   │   ├── patient/
│   │   ├── clinical/
│   │   ├── operations/
│   │   ├── finance/
│   │   └── administration/
│   │
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   └── styles/
```

Use reusable components.

Examples:

```text
DataTable
Modal
Form
StatusBadge
SearchBar
Pagination
DatePicker
ConfirmationDialog
NotificationPanel
DocumentViewer
AuditTimeline
```

---

# 62. BACKEND ARCHITECTURE

Recommended:

```text
server/
├── config/
├── models/
├── controllers/
├── routes/
├── services/
├── middleware/
├── validators/
├── jobs/
├── integrations/
├── utils/
├── errors/
└── app.js
```

Use separation:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Model
```

Do not put all business logic inside route files.

---

# 63. RPA ↔ MERN INTEGRATION

Robot Framework must communicate with the MERN application through controlled APIs.

Example:

```text
MERN
 ↓
Create RPA Job
 ↓
Robot Framework
 ↓
External Portal
 ↓
Result
 ↓
Robot Framework
 ↓
MERN API
 ↓
Update RPA Job
 ↓
Business Record
```

The MERN application must be able to see:

```text
RPA Job ID
Status
Started At
Completed At
Target system
Result
Error
Retry count
```

---

# 64. RPA DASHBOARD

Administration portal should eventually provide:

```text
Total Jobs
Running
Successful
Failed
Retrying
Exceptions
```

Example:

```text
RPA JOBS

Patient Registration       SUCCESS
Insurance Verification    SUCCESS
Insurance Claim            RUNNING
Payment Reconciliation     FAILED
Doctor Schedule Sync       SUCCESS
```

Authorized administrators can:

- View
- Retry eligible jobs
- Open exception
- View logs
- View evidence
- Cancel eligible jobs

---

# 65. ENVIRONMENT CONFIGURATION

Use `.env`.

Example:

```text
NODE_ENV=
PORT=

MONGO_URI=

JWT_SECRET=
JWT_EXPIRES_IN=

SMS_PROVIDER=
SMS_API_KEY=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=

PAYMENT_GATEWAY=
PAYMENT_KEY=
PAYMENT_SECRET=

RPA_API_URL=

INSURANCE_PORTAL_URL=
INSURANCE_PORTAL_USER=
INSURANCE_PORTAL_PASSWORD=
```

Never commit `.env`.

Provide:

```text
.env.example
```

---

# 66. SECURITY RULES

The implementation must include:

- Password hashing
- JWT authentication
- Protected routes
- Backend authorization
- Input validation
- Rate limiting where appropriate
- Secure HTTP headers
- HTTPS in production
- Secure cookies/token strategy
- Secret management
- Audit logs
- File access authorization
- Payment security
- RPA credential security

Do not log:

```text
Passwords
Payment credentials
Card numbers
CVV
Sensitive authentication secrets
```

---

# 67. DATA VALIDATION

Validate data at:

```text
Frontend
+
Backend
+
Database where appropriate
```

Never rely solely on frontend validation.

Examples:

```text
Email format
Phone format
Required fields
Date validity
Unique IDs
Status transitions
Amount validity
Role permissions
```

---

# 68. STATUS TRANSITIONS

Status changes must be controlled.

Do not allow arbitrary status changes.

Example:

```text
INVOICE:
DRAFT → GENERATED → PARTIALLY_PAID → PAID
                         ↓
                       FAILED
```

The backend must verify whether a requested status transition is valid.

---

# 69. AUDITABILITY REQUIREMENT

Every major workflow must answer:

```text
Who?
Did what?
When?
To which record?
From which value?
To which value?
Through which system?
Was RPA involved?
What was the result?
```

This is mandatory for the project.

---

# 70. TESTING STRATEGY

The project must have three testing levels.

## Unit Tests

Test:

- Services
- Validation
- Business rules
- Utilities

## API Tests

Test:

- Authentication
- Authorization
- CRUD
- Workflow transitions
- Error handling

## Robot Framework Tests

Test:

- Browser workflows
- External portals
- End-to-end workflows
- RPA jobs
- Exception handling
- Retry behavior

---

# 71. DEMO DATA

Create realistic seed data.

Include:

```text
Patients
Doctors
Employees
Departments
Beds
Appointments
Visits
Admissions
Invoices
Payments
Insurance policies
Claims
Medicines
Inventory
Vendors
Purchase orders
Lab orders
Radiology orders
Maintenance tickets
Notifications
```

The seed data must allow demonstration of the complete patient journey.

---

# 72. END-TO-END DEMONSTRATION

The final project must be able to demonstrate at least:

```text
Patient registration
      ↓
Appointment
      ↓
Reminder
      ↓
Online check-in
      ↓
OPD token
      ↓
Doctor consultation
      ↓
Admission request
      ↓
Bed assignment
      ↓
Lab/Radiology/Pharmacy services
      ↓
Billing
      ↓
Insurance verification
      ↓
Insurance claim
      ↓
Patient payment
      ↓
Payment reminder if unpaid
      ↓
Payment success/failure notification
      ↓
Settlement
      ↓
Discharge
      ↓
Bed cleaning
      ↓
Bed available
```

This must be demonstrable through the actual application and Robot Framework workflows.

---

# 73. DEVELOPMENT ORDER

Do not implement modules randomly.

Recommended order:

## Phase 1 — Foundation

```text
Project setup
Authentication
RBAC
User management
MongoDB
API structure
Audit
Exception framework
```

## Phase 2 — Patient Journey

```text
Patient Registration
Patient Records
Appointment
Notifications
OPD Queue
Admission
Bed Management
Discharge
```

## Phase 3 — Financial

```text
Billing
Payments
Payment reminders
Insurance Verification
Insurance Claims
```

## Phase 4 — Workforce

```text
Doctor Management
Staff Management
Attendance
Shift
Leave
Payroll Support
```

## Phase 5 — Hospital Operations

```text
Pharmacy
Inventory
Procurement
Vendor
Laboratory
Radiology
Maintenance
Housekeeping
```

## Phase 6 — Supporting Systems

```text
Feedback
Documents
Reports
Analytics
```

## Phase 7 — RPA

Create Robot Framework automation progressively for:

```text
Patient workflows
Appointment synchronization
Notifications
Billing reconciliation
Insurance verification
Insurance claim submission
Claim tracking
Doctor schedule synchronization
Staff onboarding
Reports
```

---

# 74. IMPORTANT IMPLEMENTATION RULE

When an individual module `.md` file is supplied to the AI coding agent, it must:

1. Read `00_MASTER.md` assumptions.
2. Inspect the existing repository.
3. Reuse existing architecture.
4. Never recreate existing models/services/components unnecessarily.
5. Integrate with existing modules.
6. Preserve existing APIs unless a migration is required.
7. Implement frontend + backend + database + RPA portions described by the module.
8. Add tests.
9. Update documentation.
10. Verify that existing functionality still works.

Do not treat each individual `.md` file as an independent application.

---

# 75. NO PLACEHOLDER IMPLEMENTATION

Do not create fake implementations such as:

```javascript
// TODO
// implement later
```

or:

```javascript
return {
    success: true
};
```

without actual functionality.

If an external service is unavailable during development, create a proper integration abstraction and a clearly defined development/mock adapter.

Example:

```text
PaymentGateway
 ├── MockPaymentGateway
 └── RealPaymentGateway
```

The architecture must allow the real provider to be configured later.

---

# 76. CONFIGURABLE VS HARDCODED

Never hard-code hospital business rules when they may change.

Bad:

```javascript
if (hours >= 24) sendReminder();
```

Better:

```javascript
const reminderInterval =
    hospitalConfig.paymentReminderIntervalHours;
```

Examples of configurable values:

```text
Payment reminder interval
OPD grace period
No-show period
Appointment reminder timing
Bed pricing
Insurance rules
Inventory threshold
Escalation period
Notification templates
```

---

# 77. RPA VS APPLICATION RESPONSIBILITY

Always distinguish:

## MERN Application

Responsible for:

```text
Database
Business records
Authentication
Authorization
Workflow state
Business rules
UI
APIs
Reports
Audit
Configuration
```

## Robot Framework

Responsible for:

```text
Browser automation
External portal interaction
Legacy system interaction
Repetitive data transfer
Scheduled checks
Cross-system synchronization
Status polling
Document upload
Administrative notifications
Exception routing
```

---

# 78. RPA MUST NOT BECOME THE BUSINESS SYSTEM

Do not design:

```text
Robot Framework
      ↓
owns all hospital data
```

Instead:

```text
MERN Application
      ↓
System of Record

Robot Framework
      ↓
Automation Worker
```

---

# 79. PROJECT SUCCESS CRITERIA

The application is considered successful when:

- All major modules have working UI.
- APIs work.
- MongoDB stores real workflow data.
- RBAC works.
- Patient lifecycle works end-to-end.
- Billing/payment works.
- Insurance workflows work.
- Staff workflows work.
- Hospital operational workflows work.
- Robot Framework performs real repetitive automation.
- External portal automation can be demonstrated where applicable.
- Notifications work.
- Documents can be generated.
- Audit logs work.
- Exceptions are visible.
- Reports work.
- No critical workflow depends on fake placeholder data.

---

# 80. FINAL MASTER INSTRUCTION TO THE AI CODING AGENT

You are building a **fully functional Hospital Administrative Management & RPA Automation Platform**.

Use:

```text
Frontend:
React.js

Backend:
Node.js + Express.js

Database:
MongoDB + Mongoose

Automation:
Robot Framework
```

Build the application as a modular, secure and maintainable system.

Follow every rule in this `00_MASTER.md`.

Do not:

- Invent clinical decisions
- Invent financial rules
- Invent insurance decisions
- Create duplicate patient masters
- Allow unauthorized users to access data
- Allow duplicate payments/claims/registrations
- Bypass the discharge settlement gate
- Store payment credentials
- Hard-code configurable hospital rules
- Make Robot Framework the source of truth
- Create separate applications unnecessarily

Always:

```text
Validate
→ Authorize
→ Execute
→ Verify
→ Persist
→ Audit
→ Notify
→ Handle Exception
```

Every future module must integrate with this architecture.

The application must be developed as a **real working MERN application with Robot Framework automation**, not as a prototype consisting only of screens.

When implementing a module, inspect existing code first, reuse shared services/models/components, implement the complete functionality described in that module's `.md` file, test it, and preserve all previously implemented functionality.

# END OF 00_MASTER.md