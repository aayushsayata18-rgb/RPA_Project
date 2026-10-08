# 12_STAFF_MANAGEMENT.md

# Staff Management Module

## 1. Module Overview

Build a complete **Staff Management Module** for the Hospital Administrative Automation & RPA Platform.

This module manages the hospital's administrative employee/staff master for non-doctor staff and provides the foundation required by:

- Attendance Management
- Shift Management
- Leave Management
- Payroll Support
- Department Management
- Access/Role Management
- Notifications
- Reports & Analytics
- RPA workflows

The module must support the complete administrative employee lifecycle:

```text
Employee Request
      ↓
Employee Details
      ↓
Validation
      ↓
Duplicate Check
      ↓
Employee Creation
      ↓
Employee ID
      ↓
Department Assignment
      ↓
Role Assignment
      ↓
Approval
      ↓
System Access Request
      ↓
Document Generation
      ↓
Welcome Notification
      ↓
ACTIVE
      ↓
Transfer / Update
      ↓
Leave / Attendance / Shift / Payroll
      ↓
Offboarding
      ↓
Access Deactivation
      ↓
INACTIVE / TERMINATED
```

### Critical Boundary

This module manages **staff administrative information and lifecycle**.

It must NOT independently:

- Decide who should be hired.
- Approve employment.
- Decide salary without authorized HR rules.
- Approve promotions.
- Approve access privileges without an authorized approval workflow.
- Modify attendance without authorization.
- Approve leave.
- Make payroll decisions.
- Create unauthorized accounts.
- Grant privileged access automatically.
- Delete historical employee records.

HR/management remains responsible for employment decisions.

---

# 2. Technology Stack

Use the existing hospital platform architecture.

### Frontend

- React.js
- React Router
- Existing Bootstrap/design system
- Axios/API client
- Reusable forms
- Tables
- Filters
- Modals
- Approval components
- Role-based UI

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- REST APIs
- JWT
- RBAC
- Validation
- Audit logging
- Notification Service

### RPA

- Robot Framework
- Browser automation
- API automation where available
- External HR/HIS synchronization
- Access-request automation
- Document generation triggers
- Employee master synchronization

---

# 3. Staff Definition

The Staff Management module covers employees such as:

```text
Receptionist
Nurse
Pharmacist
Lab Technician
Radiology Technician
Housekeeping Staff
Maintenance Staff
Administrative Staff
Billing Staff
HR Staff
Procurement Staff
Other configured employees
```

Doctors are managed by:

```text
11_DOCTOR_MANAGEMENT.md
```

However, a doctor may still have an associated Employee record if the hospital HR architecture requires one.

Do not create duplicate identities.

---

# 4. Core Identity Rules

Every employee must have:

```text
Employee ID
```

Example:

```text
EMP10001
```

Employee ID is permanent.

Do not create a new Employee ID when:

- Department changes.
- Role changes.
- Manager changes.
- Shift changes.
- Phone/email changes.
- Employee transfers internally.
- Employee returns from leave.

---

# 5. Employee Lifecycle Status

Support:

```text
DRAFT
PENDING_APPROVAL
ACTIVE
ON_LEAVE
SUSPENDED
INACTIVE
TERMINATED
```

### DRAFT

Employee record is incomplete.

### PENDING_APPROVAL

Required HR/management approval is pending.

### ACTIVE

Employee is actively employed.

### ON_LEAVE

Employee remains employed but is temporarily unavailable.

### SUSPENDED

Employee is temporarily restricted according to authorized HR/management action.

### INACTIVE

Employee is no longer active but remains historically relevant.

### TERMINATED

Employment has ended.

Historical employee records must remain available for audit and historical reporting.

---

# 6. Employee Data Model

Create:

```text
Employee
```

Suggested Mongoose schema:

```javascript
{
  employeeId: String,

  userId: ObjectId,

  firstName: String,
  middleName: String,
  lastName: String,

  displayName: String,

  dateOfBirth: Date,

  gender: String,

  phone: String,
  email: String,

  alternatePhone: String,

  address: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },

  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },

  employeeType: String,

  employmentType: String,

  joiningDate: Date,

  leavingDate: Date,

  departmentAssignments: [
    {
      departmentId: ObjectId,
      isPrimary: Boolean,
      startDate: Date,
      endDate: Date
    }
  ],

  roleAssignments: [
    {
      roleId: ObjectId,
      startDate: Date,
      endDate: Date,
      status: String
    }
  ],

  managerId: ObjectId,

  designation: String,

  qualifications: [
    {
      qualification: String,
      institution: String,
      year: Number
    }
  ],

  employeeDocuments: [
    {
      documentId: ObjectId,
      documentType: String
    }
  ],

  status: String,

  accessProvisioningStatus: String,

  createdBy: ObjectId,
  updatedBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 7. Employee Types

Make employee type configurable.

Example:

```text
NURSE
RECEPTIONIST
PHARMACIST
LAB_TECHNICIAN
RADIOLOGY_TECHNICIAN
HOUSEKEEPING
MAINTENANCE
BILLING
HR
ADMINISTRATION
PROCUREMENT
OTHER
```

Do not hard-code the complete hospital organizational structure.

---

# 8. Employment Types

Support configurable employment types:

```text
FULL_TIME
PART_TIME
CONTRACT
TEMPORARY
CONSULTANT
INTERN
OTHER
```

The hospital can configure which types are permitted.

---

# 9. Department Assignment

An employee can belong to one or more departments.

Example:

```text
Primary:
Laboratory

Secondary:
Administration
```

Each assignment must contain:

```text
Department
Primary/Secondary
Effective From
Effective To
Status
```

Historical assignments must remain available.

---

# 10. Department Transfer

Workflow:

```text
Transfer Request
       ↓
Current Employee
       ↓
New Department
       ↓
Effective Date
       ↓
Approval
       ↓
Department Assignment Updated
       ↓
Future Shift Impact Checked
       ↓
Leave/Attendance Context Updated
       ↓
Access Review Triggered
       ↓
Notifications
```

Do not delete the previous department assignment.

---

# 11. Role Assignment

Separate:

```text
Employee Role
```

from:

```text
Application Permissions
```

Example:

```text
Employee:
EMP10001

Job Role:
Billing Staff

Application Permissions:
billing.view
billing.create
billing.payment
```

The role should map to permissions through the existing RBAC system.

Do not directly grant arbitrary permissions to employees unless explicitly supported by the authorization architecture.

---

# 12. Role Assignment Workflow

```text
Employee Created
       ↓
Department Selected
       ↓
Role Requested
       ↓
Authorized Approval
       ↓
Role Assigned
       ↓
Access Request Generated
```

HR/management decides the job role.

System Admin implements technical access according to approved authorization.

---

# 13. Access Provisioning

Access provisioning must be treated as a controlled process.

Workflow:

```text
Approved Employee
       ↓
Approved Role
       ↓
Access Matrix
       ↓
Generate Access Request
       ↓
Authorized Approval
       ↓
Account Creation / Role Assignment
       ↓
Verify Access
       ↓
ACTIVE
```

RPA may automate account creation in an approved external system.

It must not invent or expand permissions.

---

# 14. Access Provisioning Status

Support:

```text
NOT_REQUESTED
REQUESTED
PENDING_APPROVAL
IN_PROGRESS
PROVISIONED
FAILED
REVOKED
```

Display in employee detail.

Example:

```text
Application Access:
PROVISIONED

Last Updated:
06-Oct-2026
```

---

# 15. Employee Onboarding

End-to-end onboarding:

```text
HR Creates Employee
       ↓
Enter Personal Details
       ↓
Employment Details
       ↓
Department
       ↓
Designation
       ↓
Role
       ↓
Documents
       ↓
Validation
       ↓
Duplicate Check
       ↓
Approval
       ↓
Employee ID
       ↓
Access Request
       ↓
Account Provisioning
       ↓
Documents
       ↓
Welcome Notification
       ↓
ACTIVE
```

---

# 16. Employee Creation UI

Route:

```text
/administration/staff/new
```

Sections:

### Personal Information

```text
First Name *
Middle Name
Last Name *
Date of Birth
Gender
Phone *
Email *
Address
```

### Emergency Contact

```text
Name
Relationship
Phone
```

### Employment

```text
Employee Type *
Employment Type *
Designation *
Joining Date *
Department *
Manager
```

### Role

```text
Application Role *
```

### Documents

```text
Identity Document
Employment Document
Qualification
Other
```

---

# 17. Employee Search

Support search by:

```text
Employee ID
Name
Phone
Email
Department
Designation
Employee Type
Employment Type
Status
Role
```

Example:

```text
Search:
EMP10001
```

or:

```text
Search:
Billing
```

---

# 18. Employee List UI

Route:

```text
/administration/staff
```

Columns:

| Field | Example |
|---|---|
| Employee ID | EMP10001 |
| Name | Priya Shah |
| Department | Billing |
| Designation | Billing Executive |
| Employment Type | FULL_TIME |
| Status | ACTIVE |
| Access | PROVISIONED |
| Actions | View/Edit |

---

# 19. Employee Detail UI

Route:

```text
/administration/staff/:employeeId
```

Tabs:

```text
Overview
Employment
Department
Role & Access
Documents
Attendance
Shifts
Leave
Payroll
History
Audit
```

Only display data that the current user has permission to access.

---

# 20. Duplicate Employee Detection

Before creating an employee, search by configured identifiers:

```text
Email
Phone
Government/employee identifier if configured
Existing Employee ID
```

Potential duplicate:

```text
Same name
+
Same DOB
+
Same phone
```

must produce a warning.

Example:

```text
Possible existing employee found.

EMP10001
Priya Shah
Billing
```

Do not automatically merge records.

Human review is required for ambiguous matches.

---

# 21. Employee ID Generation

Employee ID must be generated by the backend.

Example:

```text
EMP10001
EMP10002
EMP10003
```

Do not generate IDs in the frontend.

The ID generation mechanism must be concurrency-safe.

Two simultaneous onboarding requests must never receive the same Employee ID.

---

# 22. Employee Approval

If hospital policy requires approval:

```text
PENDING_APPROVAL
```

Reviewer sees:

```text
Employee
Department
Designation
Employment Type
Role
Documents
```

Actions:

```text
Approve
Return for Correction
Reject
```

Rejection must include a reason.

---

# 23. Employee Approval Boundary

RPA can:

- Read approved employee information.
- Create employee in legacy system.
- Create access request.
- Upload documents.
- Send notifications.

RPA cannot:

- Decide employee approval.
- Approve role.
- Grant unauthorized permissions.
- Approve salary.
- Approve employment.
- Override HR decisions.

---

# 24. Employee Documents

Support:

```text
Identity Document
Address Document
Qualification Certificate
Employment Letter
Appointment Letter
Contract
Other
```

Use the central Document Service.

Each document should have:

```text
Document ID
Employee ID
Type
Version
Storage Key
Uploaded By
Uploaded At
Access Permissions
```

---

# 25. Document Versioning

If a document changes:

```text
Version 1
Version 2
```

must be preserved.

Do not permanently overwrite historical employment documents.

---

# 26. Employment History

Create:

```text
EmployeeHistory
```

or use an appropriate history/event architecture.

Track:

```text
Joining
Department Change
Role Change
Designation Change
Manager Change
Employment Type Change
Leave Status
Suspension
Reactivation
Termination
```

Example:

```text
06-Oct-2026
Billing
Billing Executive
ACTIVE

01-Jan-2027
Finance
Senior Billing Executive
ACTIVE
```

---

# 27. Employee Transfer

Workflow:

```text
Transfer Request
      ↓
Current Assignment
      ↓
New Department
      ↓
New Designation if applicable
      ↓
New Manager
      ↓
Approval
      ↓
Effective Date
      ↓
Update Employee
      ↓
Review Role/Access
      ↓
Shift Impact
      ↓
Notifications
```

---

# 28. Transfer Access Review

A department change may require different permissions.

Example:

```text
Old:
Receptionist

New:
Billing Staff
```

System should create:

```text
Access Review Required
```

It must not automatically retain unnecessary old permissions indefinitely.

Authorized staff reviews:

```text
Keep
Add
Remove
```

RPA can apply approved access changes.

---

# 29. Role Change

Example:

```text
Billing Staff
      ↓
Senior Billing Staff
```

Role change should be recorded with:

```text
Previous Role
New Role
Effective Date
Approved By
Reason
```

Do not rewrite historical records.

---

# 30. Manager Assignment

Employee may have:

```text
Manager ID
```

Changing manager should be audited.

Manager relationship may affect:

- Leave approval.
- Shift approval.
- Attendance correction approval.
- Performance workflow if implemented.
- Notifications.

Do not duplicate manager details in Employee.

---

# 31. Employment Status Changes

Allowed transitions:

```text
DRAFT → PENDING_APPROVAL
PENDING_APPROVAL → ACTIVE
ACTIVE → ON_LEAVE
ON_LEAVE → ACTIVE
ACTIVE → SUSPENDED
SUSPENDED → ACTIVE
ACTIVE → INACTIVE
ACTIVE → TERMINATED
```

Transitions must be validated.

Do not allow arbitrary status changes from the frontend.

---

# 32. Suspension

Suspension must be an authorized HR/management action.

Record:

```text
Suspension Date
Reason
Expected End Date if applicable
Approved By
Notes
```

Do not automatically delete employee data.

Access handling must follow approved policy.

---

# 33. Termination

Termination workflow:

```text
Termination Request
       ↓
Approval
       ↓
Termination Date
       ↓
Future Shift Review
       ↓
Leave Review
       ↓
Payroll Input Review
       ↓
Access Revocation
       ↓
External System Deactivation
       ↓
Employee = TERMINATED
       ↓
Final Notifications
```

RPA may execute approved administrative deactivation.

---

# 34. Offboarding

Checklist:

```text
Employee Status
Department
Role
Access
Assets if applicable
Documents
Shift Assignments
Future Leave
Attendance
Payroll
External Systems
```

The module should create/track an offboarding checklist.

---

# 35. Access Revocation

When an employee is terminated:

```text
Approved Termination
       ↓
Access Revocation Request
       ↓
External Systems
       ↓
RPA/API
       ↓
Verify Access Disabled
       ↓
REVOKED
```

If revocation fails:

```text
ExceptionCase
```

must be created.

Do not mark access as revoked until verification succeeds.

---

# 36. External Employee Synchronization

If the hospital uses another HR/HIS system:

```text
Hospital Platform
       ↓
Approved Employee
       ↓
RPA Job
       ↓
External System
       ↓
Create/Update
       ↓
Read Back
       ↓
Verify
       ↓
SYNCED
```

Use API when available.

Use Robot Framework browser automation when no reliable API exists.

---

# 37. External Sync Model

Create if required:

```text
EmployeeExternalSync
```

Suggested schema:

```javascript
{
  employeeId: ObjectId,

  externalSystem: String,

  externalEmployeeId: String,

  syncType: String,

  status: String,

  lastSyncedAt: Date,

  lastAttemptAt: Date,

  errorCode: String,

  errorMessage: String,

  rpaJobId: ObjectId,

  correlationId: String
}
```

Statuses:

```text
NOT_SYNCED
QUEUED
SYNCING
SYNCED
FAILED
MANUAL_REVIEW
```

---

# 38. RPA Folder Structure

Add:

```text
robot/
├── staff/
│   ├── tests/
│   │   ├── create_employee.robot
│   │   ├── update_employee.robot
│   │   ├── provision_access.robot
│   │   ├── update_employee_role.robot
│   │   └── offboard_employee.robot
│   │
│   ├── keywords/
│   │   ├── employee_login.resource
│   │   ├── employee_search.resource
│   │   ├── employee_profile.resource
│   │   ├── employee_access.resource
│   │   ├── employee_documents.resource
│   │   ├── employee_offboarding.resource
│   │   └── employee_evidence.resource
│   │
│   └── resources/
│       ├── browser.resource
│       ├── api.resource
│       ├── secrets.resource
│       └── common.resource
```

---

# 39. Robot Framework Onboarding Flow

```robot
*** Test Cases ***
Onboard Employee
    [Arguments]    ${employee_id}

    Get Approved Employee
    Validate Employee Data

    Open External HR System
    Login To External System

    Search Employee
    Create Employee Record
    Verify Employee Saved

    Capture Evidence
    Submit Synchronization Result

    Close External Session
```

---

# 40. Robot Framework Access Provisioning

```robot
*** Test Cases ***
Provision Employee Access
    [Arguments]    ${employee_id}

    Get Approved Access Request
    Validate Role

    Open Target System
    Login To Target System

    Create Or Update User
    Assign Approved Role

    Verify Access
    Capture Evidence

    Submit Provisioning Result
    Close Session
```

RPA must use only the approved role/permission set.

---

# 41. RPA Verification Principle

Never assume:

```text
Save button clicked
=
Successful synchronization
```

Always:

```text
Write
 ↓
Read Back
 ↓
Compare
 ↓
Verify
```

If verification fails:

```text
SYNC FAILED
```

or:

```text
MANUAL REVIEW
```

---

# 42. Employee Access Matrix

Maintain configurable mapping:

```text
Job Role
     ↓
Approved Application Roles
     ↓
Permissions
```

Example:

```text
Billing Staff
    ↓
Billing Role
    ↓
billing.view
billing.create
billing.payment
billing.query
```

Do not allow RPA to infer permissions from department names.

---

# 43. Access Request Model

Create:

```text
AccessRequest
```

Suggested fields:

```javascript
{
  requestId: String,

  employeeId: ObjectId,

  requestedRoleId: ObjectId,

  requestedPermissions: [String],

  source: String,

  status: String,

  requestedBy: ObjectId,

  approvedBy: ObjectId,

  approvedAt: Date,

  provisionedAt: Date,

  revokedAt: Date,

  rpaJobId: ObjectId,

  correlationId: String,

  reason: String,

  createdAt: Date,
  updatedAt: Date
}
```

Statuses:

```text
REQUESTED
PENDING_APPROVAL
APPROVED
PROVISIONING
PROVISIONED
FAILED
REVOKED
REJECTED
```

---

# 44. Access Request Security

An employee must not approve their own privileged access.

Example:

```text
Employee:
EMP10001

Requested:
Finance Admin

Approver:
EMP10001
```

must be rejected by the authorization layer.

Use separation of duties where configured.

---

# 45. Attendance Integration

Attendance Management owns:

```text
Attendance
Attendance Corrections
Attendance Approval
```

Staff Management provides:

```text
Employee ID
Department
Employment Status
Shift relationship
```

Do not duplicate attendance data inside Employee.

---

# 46. Shift Integration

Shift Management owns:

```text
Shift
Shift Assignment
Roster
```

Staff Management references the employee.

When employee transfers:

```text
Department Change
       ↓
Shift Conflict Check
       ↓
Affected Assignments
       ↓
Authorized Review
```

Do not silently modify approved rosters.

---

# 47. Leave Integration

Leave Management owns:

```text
LeaveRequest
LeaveBalance
LeaveApproval
```

Staff Management displays linked leave information.

Employee status may show:

```text
ON_LEAVE
```

based on approved leave according to configured business rules.

Do not create a duplicate leave system.

---

# 48. Payroll Support Integration

Payroll Support consumes approved employee information:

```text
Employee ID
Employment Type
Department
Designation
Approved Salary Inputs
Attendance
Leave
Allowances
Deductions
```

Staff Management must not calculate payroll unless explicitly defined by the Payroll Support module.

---

# 49. Notification Integration

Use centralized Notification Service.

Events:

```text
EMPLOYEE_CREATED
EMPLOYEE_APPROVAL_REQUIRED
EMPLOYEE_APPROVED
EMPLOYEE_ROLE_CHANGED
EMPLOYEE_DEPARTMENT_CHANGED
EMPLOYEE_ACCESS_PROVISIONED
EMPLOYEE_ACCESS_FAILED
EMPLOYEE_ACCESS_REVOKED
EMPLOYEE_TRANSFERRED
EMPLOYEE_SUSPENDED
EMPLOYEE_TERMINATED
EMPLOYEE_DOCUMENT_EXPIRING
```

---

# 50. Welcome Notification

After successful onboarding:

```text
Employee
    ↓
ACTIVE
    ↓
Required Access Provisioned
    ↓
Welcome Notification
```

Example:

```text
Welcome to the hospital.

Your employee ID is EMP10001.

Please use the approved hospital login process to access your assigned systems.
```

Do not include passwords in email/SMS.

---

# 51. Employee Documents

Document types:

```text
IDENTITY
ADDRESS
QUALIFICATION
EMPLOYMENT
CONTRACT
APPOINTMENT_LETTER
POLICY_ACKNOWLEDGEMENT
OTHER
```

Use centralized document generation where required.

---

# 52. Document Generation

Integration with:

```text
27_DOCUMENT_GENERATION.md
```

Possible documents:

```text
Appointment Letter
Employment Letter
Transfer Letter
Role Change Letter
Termination Letter
Other configured HR documents
```

Document content must come from approved HR templates.

RPA may trigger generation/distribution but must not invent employment terms.

---

# 53. Employee Notifications

Example department transfer:

```text
Your department assignment has been updated.

Effective Date:
01-Nov-2026

New Department:
Finance
```

Sensitive HR information should only be included where appropriate.

---

# 54. Employee Dashboard

Route:

```text
/administration/staff/dashboard
```

Cards:

```text
Total Employees
Active
On Leave
Pending Approval
Suspended
Terminated
Access Pending
Sync Failures
Documents Expiring
```

---

# 55. Employee Reports

Provide:

```text
Employee Count by Department
Employee Count by Role
Employee Count by Employment Type
Active vs Inactive
New Joiners
Transfers
Terminations
Pending Access
Access Failures
Document Expiry
```

Filters:

```text
Date
Department
Role
Employee Type
Employment Type
Status
```

---

# 56. Employee Audit Timeline

Display:

```text
Employee Created
Approved
Department Assigned
Role Assigned
Access Provisioned
Department Changed
Role Changed
Leave
Suspension
Reactivation
Termination
Access Revoked
```

Each event must include:

```text
Actor
Timestamp
Reason
Correlation ID
Source
```

---

# 57. Employee History

Example:

```text
01-Jan-2026
Reception
Receptionist

01-Jul-2026
Billing
Billing Executive

01-Jan-2027
Finance
Senior Billing Executive
```

Do not rewrite history.

---

# 58. API Endpoints

## Employees

```http
POST /api/employees
GET /api/employees
GET /api/employees/:id
PUT /api/employees/:id
PATCH /api/employees/:id/status
```

## Departments

```http
POST /api/employees/:id/departments
PUT /api/employees/:id/departments/:assignmentId
POST /api/employees/:id/departments/:assignmentId/end
```

## Roles

```http
POST /api/employees/:id/roles
PUT /api/employees/:id/roles/:assignmentId
POST /api/employees/:id/roles/:assignmentId/end
```

## Documents

```http
GET /api/employees/:id/documents
POST /api/employees/:id/documents
```

## Access

```http
GET /api/employees/:id/access
POST /api/employees/:id/access-request
POST /api/access-requests/:id/approve
POST /api/access-requests/:id/reject
POST /api/access-requests/:id/provision
POST /api/access-requests/:id/revoke
```

---

# 59. Backend Structure

Use:

```text
server/
├── models/
│   ├── Employee.js
│   ├── EmployeeHistory.js
│   ├── AccessRequest.js
│   └── EmployeeExternalSync.js
│
├── controllers/
│   ├── employeeController.js
│   ├── employeeAccessController.js
│   └── employeeDocumentController.js
│
├── services/
│   ├── employeeService.js
│   ├── employeeOnboardingService.js
│   ├── employeeTransferService.js
│   ├── employeeOffboardingService.js
│   ├── employeeAccessService.js
│   ├── employeeDocumentService.js
│   └── employeeSyncService.js
│
└── routes/
    ├── employeeRoutes.js
    └── accessRequestRoutes.js
```

---

# 60. Employee Service Responsibilities

### employeeService

Handles:

- Employee CRUD.
- Search.
- Employee ID generation.
- Status management.

### employeeOnboardingService

Handles:

- Onboarding validation.
- Approval.
- Access request creation.
- Welcome workflow.

### employeeTransferService

Handles:

- Department transfer.
- Role changes.
- Effective dates.
- Access review.

### employeeOffboardingService

Handles:

- Termination.
- Access revocation.
- Future assignment review.
- Final status.

### employeeAccessService

Handles:

- Access request.
- Approval.
- Provisioning.
- Revocation.

### employeeSyncService

Handles:

- External system synchronization.
- RPA job creation.
- Result processing.

---

# 61. Database Indexes

Create:

```javascript
Employee.index({
  employeeId: 1
}, {
  unique: true
});

Employee.index({
  displayName: 1
});

Employee.index({
  status: 1
});

Employee.index({
  "departmentAssignments.departmentId": 1
});

Employee.index({
  "roleAssignments.roleId": 1
});

Employee.index({
  email: 1
});

Employee.index({
  phone: 1
});

AccessRequest.index({
  employeeId: 1,
  status: 1
});

AccessRequest.index({
  status: 1,
  createdAt: -1
});

EmployeeExternalSync.index({
  employeeId: 1,
  externalSystem: 1
});
```

---

# 62. RBAC Permissions

Create permissions such as:

```text
employee.view
employee.create
employee.edit
employee.approve
employee.activate
employee.suspend
employee.terminate
employee.transfer
employee.manage_department
employee.manage_role
employee.view_documents
employee.manage_documents
employee.view_attendance
employee.view_leave
employee.view_payroll
employee.manage_access
employee.approve_access
employee.provision_access
employee.revoke_access
employee.view_audit
employee.sync_external
```

---

# 63. Suggested Role Access

| Action | Employee | HR | Manager | Admin Manager | System Admin |
|---|---:|---:|---:|---:|---:|
| View Own Profile | Yes | Yes | Yes | Yes | Yes |
| Create Employee | No | Yes | Yes | Yes | Yes |
| Edit Employee | Limited | Yes | Limited | Yes | Yes |
| Approve Employee | No | Yes | Yes | Yes | Yes |
| Transfer Employee | No | Yes | Yes | Yes | Yes |
| Assign Role | No | Configurable | Configurable | Yes | Yes |
| Approve Access | No | Limited | Yes | Yes | Yes |
| Provision Access | No | No | No | Limited | Yes |
| Revoke Access | No | Limited | Yes | Yes | Yes |
| Terminate | No | Yes | Yes | Yes | Yes |
| View Payroll Data | Own Limited | Yes | Limited | Yes | Configurable |

Actual implementation must use permissions rather than hard-coded role names.

---

# 64. Audit Events

Record:

```text
EMPLOYEE_CREATED
EMPLOYEE_UPDATED
EMPLOYEE_APPROVAL_REQUESTED
EMPLOYEE_APPROVED
EMPLOYEE_REJECTED
EMPLOYEE_ACTIVATED
EMPLOYEE_SUSPENDED
EMPLOYEE_REACTIVATED
EMPLOYEE_TERMINATED
EMPLOYEE_DEPARTMENT_CHANGED
EMPLOYEE_ROLE_CHANGED
EMPLOYEE_DOCUMENT_ADDED
EMPLOYEE_ACCESS_REQUESTED
EMPLOYEE_ACCESS_APPROVED
EMPLOYEE_ACCESS_PROVISIONING_STARTED
EMPLOYEE_ACCESS_PROVISIONED
EMPLOYEE_ACCESS_FAILED
EMPLOYEE_ACCESS_REVOKED
EMPLOYEE_EXTERNAL_SYNC_STARTED
EMPLOYEE_EXTERNAL_SYNC_COMPLETED
EMPLOYEE_EXTERNAL_SYNC_FAILED
```

---

# 65. Security Requirements

Implement:

- JWT authentication.
- Backend RBAC.
- Field-level authorization where required.
- Secure document storage.
- Secure access-request APIs.
- Separation of duties.
- Audit logging.
- No passwords in logs.
- No secrets in source code.
- No credentials in employee records.
- Least privilege.
- Secure file upload.
- Rate limiting.
- Input validation.

---

# 66. Sensitive Information

Treat the following carefully:

```text
Date of Birth
Address
Emergency Contact
Employment Documents
Identity Documents
HR Information
Access Information
Payroll-related information
```

Do not expose unnecessary employee information to general staff.

---

# 67. Employee Self-Service

Route:

```text
/employee/profile
```

Employee can view:

```text
Employee ID
Name
Department
Designation
Approved Role
Contact Details
Joining Date
Documents permitted for self-view
```

Employee may request changes to permitted fields.

Example:

```text
Change Phone Number
```

Request:

```text
PENDING_REVIEW
```

Authorized HR approves.

---

# 68. Employee Self-Service Security

Employee must not be able to:

- Change Employee ID.
- Change department directly.
- Change role directly.
- Grant permissions.
- Approve own requests.
- Terminate own employment.
- Access other employees' HR documents.
- Modify attendance through Staff Management.

---

# 69. Employee Transfer and Shift Impact

When transfer becomes effective:

```text
Employee Transfer
      ↓
Find Future Shift Assignments
      ↓
Check Compatibility
      ↓
Create Review Task
```

Do not automatically delete future shifts.

Authorized Shift Management handles roster changes.

---

# 70. Employee Transfer and Leave Impact

Existing approved leave must remain historically valid.

If transfer affects leave approval authority:

```text
Old Manager
      ↓
New Manager
```

future requests may route to the new manager.

Historical approvals must remain unchanged.

---

# 71. Employee Termination and Leave

When termination is approved:

```text
Find Future Leave
```

Do not automatically delete historical leave records.

Handle future leave according to configured HR policy.

---

# 72. Employee Termination and Attendance

Attendance records remain historical.

After termination date:

```text
No new attendance should normally be accepted
```

unless authorized correction workflow explicitly allows it.

---

# 73. Employee Termination and Payroll

Payroll Support must receive termination information.

Possible integration:

```text
Employee Termination
      ↓
Payroll Input Update
      ↓
Final Payroll Processing
```

Do not calculate final salary in Staff Management unless explicitly required by Payroll Support.

---

# 74. Employee Asset Integration

If the hospital tracks assets:

```text
Laptop
ID Card
Access Card
Other Equipment
```

Staff Management can trigger an asset-return checklist.

Asset Management is not part of this module unless an existing Asset entity is available.

---

# 75. Onboarding Checklist

Create configurable checklist:

```text
Employee Record
Documents
Department
Role
Approval
System Access
ID Card
Welcome Notification
Training
Other
```

Each item:

```text
PENDING
IN_PROGRESS
COMPLETED
BLOCKED
```

---

# 76. Offboarding Checklist

Support:

```text
Termination Approval
Access Revocation
ID Card Return
Asset Return
Document Completion
Shift Review
Leave Review
Payroll Notification
External System Deactivation
Final Notification
```

The exact checklist should be configurable.

---

# 77. Onboarding RPA Failure

Example:

```text
Approved Employee
       ↓
RPA Creates External Employee
       ↓
External System Error
```

System:

```text
Employee = ACTIVE
External Sync = FAILED
Exception = OPEN
```

unless the hospital explicitly requires external synchronization before activation.

Do not invent a dependency between internal activation and external sync.

Make the dependency configurable.

---

# 78. Access Provisioning Failure

Example:

```text
Employee ACTIVE
Access Request APPROVED
RPA Provisioning
      ↓
FAILED
```

System:

```text
Access = FAILED
ExceptionCase = OPEN
Notification = Sent
```

Do not falsely display:

```text
Access Provisioned
```

---

# 79. Example End-to-End Onboarding

Create:

```text
Priya Shah
EMP10001
```

Department:

```text
Billing
```

Designation:

```text
Billing Executive
```

Employment:

```text
FULL_TIME
```

Role:

```text
Billing Staff
```

HR submits.

System:

```text
PENDING_APPROVAL
```

Manager approves.

System:

```text
ACTIVE
```

Employee ID:

```text
EMP10001
```

Access request:

```text
Billing Staff
```

Approved.

RPA:

```text
External HR System
      ↓
Create Employee
      ↓
Verify
```

Then:

```text
Access Provisioning
      ↓
Verify
      ↓
PROVISIONED
```

Welcome notification sent.

---

# 80. Example Department Transfer

Employee:

```text
EMP10001
Billing
Billing Executive
```

Transfer:

```text
Finance
Senior Billing Executive
```

Effective:

```text
01-Nov-2026
```

System:

```text
Transfer Request
      ↓
Approval
      ↓
New Assignment
      ↓
Role Review
      ↓
Access Review
      ↓
Shift Review
      ↓
Notifications
```

Old assignment remains in history.

---

# 81. Example Offboarding

Employee:

```text
EMP10001
```

Termination:

```text
31-Oct-2026
```

System:

```text
Termination Approved
      ↓
Future Shift Review
      ↓
Leave Review
      ↓
Payroll Notification
      ↓
Access Revocation
      ↓
External System Deactivation
      ↓
Verify
      ↓
TERMINATED
```

Historical records remain available.

---

# 82. Testing Requirements

## Backend

Test:

```text
Employee creation
Employee ID generation
Duplicate detection
Approval
Department assignment
Role assignment
Transfer
Status transitions
Access request
Access approval
Access provisioning
Access revocation
Termination
Audit
RBAC
```

---

# 83. Access Tests

Test:

```text
Employee cannot approve own access.
Employee cannot access another employee's HR data.
Unauthorized user cannot assign privileged roles.
Unauthorized user cannot provision access.
Terminated employee cannot receive new access.
Revoked access is reflected correctly.
```

---

# 84. RPA Tests

Test:

```text
Create employee
Update employee
Sync department
Sync role
Provision access
Verify access
Revoke access
Offboard employee
External system unavailable
Employee not found
Duplicate employee
Unexpected response
Evidence capture
```

---

# 85. Frontend Tests

Test:

```text
Employee list
Search
Create employee
Edit employee
Employee detail
Department assignment
Role assignment
Access request
Approval
Transfer
Termination
Documents
Dashboard
Permissions
```

---

# 86. Database Integrity Tests

Verify:

```text
Employee ID unique.
Historical department assignments preserved.
Historical role assignments preserved.
Employee deletion prevented where history exists.
Access requests reference valid employees.
External sync references valid employees.
Documents reference valid employees.
```

---

# 87. Implementation Order

Implement in this order:

```text
1. Employee model
2. Employee history
3. Department assignments
4. Role assignments
5. AccessRequest model
6. External sync model
7. Employee ID generation
8. Employee CRUD APIs
9. Duplicate detection
10. Employee approval workflow
11. Department transfer
12. Role change
13. Access workflow
14. Onboarding workflow
15. Offboarding workflow
16. Document integration
17. Attendance integration
18. Shift integration
19. Leave integration
20. Payroll integration
21. Notification integration
22. Audit integration
23. RPA integration
24. Administration UI
25. Employee self-service
26. Seed data
27. Automated tests
28. RPA tests
29. Security testing
30. End-to-end testing
```

---

# 88. AI Coding Agent Instructions

Implement this module inside the existing hospital platform.

Strictly follow these rules:

1. Reuse existing authentication.
2. Reuse existing RBAC.
3. Reuse existing User model.
4. Reuse existing Department model.
5. Reuse existing Role/Permission model.
6. Reuse existing Notification Service.
7. Reuse existing Document Service.
8. Reuse existing Audit Service.
9. Reuse existing RPAJob/RPAExecution.
10. Reuse existing ExceptionCase.
11. Reuse Attendance Management.
12. Reuse Shift Management.
13. Reuse Leave Management.
14. Reuse Payroll Support.
15. Do not create duplicate employee identities.
16. Employee ID must be permanent.
17. Never delete historical employees.
18. Preserve department history.
19. Preserve role history.
20. Do not automatically approve employment.
21. Do not automatically grant privileged access.
22. Do not allow self-approval of privileged access.
23. Do not invent salary or payroll values.
24. Do not modify attendance from this module.
25. Do not create a duplicate leave system.
26. Do not create a duplicate shift system.
27. Validate all external/RPA responses.
28. Verify external writes by reading back the result.
29. Do not store credentials in source code.
30. Do not store credentials in MongoDB.
31. Do not expose passwords through notifications.
32. Implement idempotent RPA operations.
33. Handle duplicate external records safely.
34. Create exceptions for ambiguous situations.
35. Implement complete audit logging.
36. Implement notifications.
37. Implement realistic seed data.
38. Write backend tests.
39. Write frontend tests.
40. Write Robot Framework tests.
41. Test all RBAC restrictions.
42. Test employee data isolation.
43. Test onboarding.
44. Test transfer.
45. Test offboarding.
46. Test access provisioning and revocation.

---

# 89. Definition of Done

The Staff Management Module is complete when this full workflow works:

```text
HR
 ↓
Employee Creation
 ↓
Validation
 ↓
Duplicate Check
 ↓
Approval
 ↓
Employee ID
 ↓
Department
 ↓
Role
 ↓
Access Request
 ↓
Access Approval
 ↓
RPA/API Provisioning
 ↓
Verification
 ↓
Welcome Notification
 ↓
ACTIVE
```

Internal lifecycle:

```text
ACTIVE
 ↓
Department Transfer
 ↓
Role Review
 ↓
Access Review
 ↓
Shift Review
 ↓
Leave Integration
 ↓
Attendance Integration
 ↓
Payroll Integration
```

Offboarding:

```text
Termination Approval
 ↓
Shift Review
 ↓
Leave Review
 ↓
Payroll Notification
 ↓
Access Revocation
 ↓
External System Deactivation
 ↓
Verification
 ↓
TERMINATED
```

The final implementation must provide:

```text
Employee Master
+
Employee Lifecycle
+
Departments
+
Roles
+
Access Requests
+
Onboarding
+
Transfers
+
Offboarding
+
Documents
+
Attendance Integration
+
Shift Integration
+
Leave Integration
+
Payroll Integration
+
RPA Automation
+
Notifications
+
Audit Logging
+
Exception Handling
+
RBAC
+
Automated Testing
```

The module must remain an **administrative employee-management system** and must never autonomously make employment, authorization, payroll, clinical, or other high-impact decisions.