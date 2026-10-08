# 28_REPORTS_ANALYTICS.md

# Reports & Analytics Management

## 1. MODULE PURPOSE

Build a centralized **Reports & Analytics module** for the Hospital Administrative Automation & RPA Platform.

The module must provide authorized users with:

- Operational reports
- Patient administration reports
- Appointment reports
- OPD queue reports
- Admission reports
- Bed occupancy reports
- Discharge reports
- Billing reports
- Payment reports
- Insurance reports
- Pharmacy reports
- Inventory reports
- Procurement reports
- Vendor reports
- Laboratory administration reports
- Radiology administration reports
- Maintenance reports
- Housekeeping reports
- Patient feedback reports
- Staff reports
- Attendance reports
- Shift reports
- Leave reports
- Payroll-support reports
- RPA execution reports
- Exception reports
- Notification reports
- Document reports
- Management dashboards
- Trend analysis
- KPI dashboards
- Exportable reports
- Scheduled reports

The module must provide a **centralized reporting layer**, while the actual business data remains owned by each individual module.

---

# 2. CORE PRINCIPLE

The Reports & Analytics module is **not the system of record**.

For example:

```text
Billing
   ↓
Invoice / Payment
   ↓
Reports & Analytics
   ↓
Billing Report
```

Similarly:

```text
Pharmacy
   ↓
Prescription / Dispensing
   ↓
Reports & Analytics
   ↓
Pharmacy Report
```

The reporting module reads and aggregates authorized source data.

It must not silently modify operational records.

---

# 3. ARCHITECTURE

Use:

```text
Hospital Modules
       |
       v
Operational MongoDB
       |
       v
Reporting / Analytics Service
       |
       +-------------------------+
       |                         |
       v                         v
Report Engine              Analytics Engine
       |                         |
       +------------+------------+
                    |
                    v
              React Dashboards
                    |
          +---------+---------+
          |         |         |
          v         v         v
        View      Export    Schedule
```

Source modules include:

```text
Patient
Appointment
OPD
Admission
Bed
Discharge
Billing
Insurance
Claims
Doctor
Staff
Attendance
Shift
Leave
Payroll
Pharmacy
Inventory
Procurement
Vendor
Laboratory
Radiology
Maintenance
Housekeeping
Feedback
Notification
Document
RPA
Exception
```

---

# 4. REPORTING PRINCIPLES

The implementation must follow these rules:

1. Reports must use authoritative source data.
2. Do not duplicate business logic unnecessarily.
3. Do not create conflicting calculations.
4. Business rules must be configurable.
5. Report filters must be explicit.
6. Every report must show its reporting period.
7. Every report must show generated timestamp.
8. Every report must identify its data source.
9. Reports must respect RBAC.
10. Sensitive reports require restricted permissions.
11. Patient-level reports require patient-data authorization.
12. Financial reports require financial permissions.
13. HR reports require HR permissions.
14. Reports must be auditable.
15. Export operations must be audited.
16. Large reports should use asynchronous generation.
17. Report generation failure must not modify source data.
18. Analytics must not automatically make disciplinary, clinical, financial, or operational decisions.

---

# 5. REPORT CATEGORIES

Create the following categories:

```text
PATIENT_ADMINISTRATION
APPOINTMENT
OPD
ADMISSION
BED
DISCHARGE
BILLING
PAYMENT
INSURANCE
CLAIMS
DOCTOR
STAFF
ATTENDANCE
SHIFT
LEAVE
PAYROLL
PHARMACY
INVENTORY
PROCUREMENT
VENDOR
LABORATORY
RADIOLOGY
MAINTENANCE
HOUSEKEEPING
FEEDBACK
NOTIFICATION
DOCUMENT
RPA
EXCEPTION
MANAGEMENT
```

---

# 6. REPORT TYPES

Each report must have a unique report type.

Example:

```text
PATIENT_REGISTRATION_SUMMARY
APPOINTMENT_SUMMARY
APPOINTMENT_NO_SHOW
OPD_QUEUE_SUMMARY
ADMISSION_SUMMARY
BED_OCCUPANCY
DISCHARGE_SUMMARY
BILLING_SUMMARY
PAYMENT_SUMMARY
INSURANCE_VERIFICATION_SUMMARY
CLAIM_STATUS_SUMMARY
PHARMACY_DISPENSING_SUMMARY
INVENTORY_STOCK_SUMMARY
LOW_STOCK_REPORT
EXPIRY_REPORT
PROCUREMENT_SUMMARY
VENDOR_PERFORMANCE
ATTENDANCE_SUMMARY
SHIFT_COVERAGE
LEAVE_SUMMARY
PAYROLL_INPUT_SUMMARY
LAB_ORDER_SUMMARY
RADIOLOGY_ORDER_SUMMARY
MAINTENANCE_SUMMARY
HOUSEKEEPING_SUMMARY
PATIENT_FEEDBACK_SUMMARY
NOTIFICATION_DELIVERY
DOCUMENT_GENERATION
RPA_EXECUTION
RPA_FAILURE
EXCEPTION_SUMMARY
MANAGEMENT_DASHBOARD
```

The catalog must remain configurable.

---

# 7. REPORT MODEL

Create:

```text
ReportDefinition
```

Suggested schema:

```javascript
{
  reportId: String,

  name: String,

  code: String,

  category: String,

  description: String,

  sourceModules: [String],

  dataSource: String,

  queryDefinition: Object,

  filters: [
    {
      field: String,
      type: String,
      required: Boolean,
      allowedValues: [String]
    }
  ],

  columns: [
    {
      key: String,
      label: String,
      dataType: String,
      visible: Boolean,
      exportable: Boolean
    }
  ],

  permissions: [String],

  exportFormats: [String],

  scheduleEnabled: Boolean,

  enabled: Boolean,

  version: Number,

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 8. REPORT EXECUTION MODEL

Create:

```text
ReportExecution
```

Suggested schema:

```javascript
{
  executionId: String,

  reportId: ObjectId,

  requestedBy: ObjectId,

  filters: Object,

  status: String,

  startedAt: Date,

  completedAt: Date,

  rowCount: Number,

  outputFormat: String,

  outputDocumentId: ObjectId,

  errorCode: String,

  errorMessage: String,

  correlationId: String,

  createdAt: Date
}
```

---

# 9. REPORT EXECUTION STATUS

Use:

```text
QUEUED
RUNNING
COMPLETED
PARTIAL
FAILED
CANCELLED
EXPIRED
```

---

# 10. REPORT GENERATION FLOW

```text
User
 ↓
Select Report
 ↓
Select Filters
 ↓
Validate Permissions
 ↓
Validate Filters
 ↓
Execute Query
 ↓
Aggregate Data
 ↓
Generate Result
 ↓
Display / Export
 ↓
Audit
```

For large reports:

```text
Request
 ↓
QUEUED
 ↓
Worker
 ↓
Generate
 ↓
Store
 ↓
Notify User
```

---

# 11. REPORT FILTERS

Common filters:

```text
Date From
Date To
Department
Doctor
Patient
Ward
Bed
Status
Category
Priority
Employee
Vendor
Payment Status
Insurance Status
Claim Status
RPA Status
```

Do not expose filters that the current user is not authorized to use.

---

# 12. DATE FILTERING

Every time-based report must support:

```text
Today
Yesterday
This Week
Last Week
This Month
Last Month
This Quarter
This Year
Custom Range
```

The backend must use explicit date boundaries.

---

# 13. TIMEZONE

Store timestamps consistently in UTC.

Display/report using configured hospital timezone.

For this application:

```text
Hospital Timezone:
Asia/Kolkata
```

should be configurable.

Do not hard-code timezone conversions throughout the application.

---

# 14. PATIENT ADMINISTRATION REPORTS

Create:

### Patient Registration Summary

Columns:

```text
Date
New Patients
Existing Patient Visits
Online Registrations
Front Desk Registrations
Temporary Emergency Records
Duplicate Review Cases
```

---

# 15. PATIENT REGISTRATION TREND

Display:

```text
Daily
Weekly
Monthly
```

Example:

```text
January → 1,250
February → 1,410
March → 1,520
```

Use interactive charts.

---

# 16. DUPLICATE PATIENT REPORT

Show:

```text
Possible Duplicate ID
Patient References
Match Reason
Created Date
Review Status
Reviewed By
```

The report must not automatically merge patient records.

---

# 17. APPOINTMENT REPORTS

Create:

```text
Appointment Summary
Appointment by Doctor
Appointment by Department
Appointment by Specialty
Appointment Cancellation
Appointment Rescheduling
Appointment No-Show
Appointment Utilization
```

---

# 18. APPOINTMENT SUMMARY

Columns:

```text
Date
Appointments Booked
Confirmed
Checked In
Completed
Cancelled
Rescheduled
No Show
```

---

# 19. NO-SHOW REPORT

Include:

```text
Patient ID
Appointment ID
Doctor
Department
Appointment Date
Scheduled Time
Check-In Status
No-Show Status
```

Patient-level access must be restricted.

---

# 20. OPD REPORTS

Create:

```text
OPD Daily Summary
OPD Queue Summary
Doctor-wise OPD
Department-wise OPD
Token Completion
Waiting Time
Late Arrival
No Show
```

---

# 21. OPD WAITING-TIME ANALYTICS

Calculate:

```text
Check-in time
Token generated time
Consultation start time
Consultation completion time
```

Metrics:

```text
Average Waiting Time
Median Waiting Time
Maximum Waiting Time
```

These are administrative metrics.

Do not use them to automatically evaluate clinical quality.

---

# 22. ADMISSION REPORTS

Create:

```text
Admission Summary
Admission by Department
Admission by Ward
Emergency Admissions
OPD Admissions
Admission Duration
Current Inpatients
Admission Trends
```

---

# 23. BED REPORTS

Create:

```text
Bed Availability
Bed Occupancy
Bed Utilization
Bed Transfers
Bed Cleaning Pending
Beds Under Maintenance
```

---

# 24. BED OCCUPANCY DASHBOARD

Display:

```text
Total Beds
Available
Reserved
Occupied
Cleaning Required
Maintenance
```

Example:

```text
Total = 200
Occupied = 145
Available = 32
Reserved = 8
Cleaning = 10
Maintenance = 5
```

---

# 25. OCCUPANCY RATE

Use configured formula:

```text
Occupancy Rate =
Occupied Beds / Available Operational Beds × 100
```

The exact definition of "operational beds" must be configurable.

Do not count maintenance/unavailable beds as operational capacity unless configuration says otherwise.

---

# 26. DISCHARGE REPORTS

Create:

```text
Discharge Summary
Discharge by Department
Average Admission Duration
Pending Discharge
Discharge Billing Status
Discharge Bed Turnover
```

---

# 27. BILLING REPORTS

Create:

```text
Billing Summary
Invoice Summary
Outstanding Balance
Paid Invoices
Pending Payments
Discount Summary
Financial Adjustment Summary
Revenue by Department
Revenue by Service
```

---

# 28. BILLING SUMMARY

Display:

```text
Gross Amount
Discount
Insurance Amount
Deposit/Advance
Patient Responsibility
Paid Amount
Outstanding Amount
```

The report must consume the billing module's authoritative calculations.

Do not independently invent billing formulas.

---

# 29. PAYMENT REPORTS

Create:

```text
Payment Summary
Payment by Method
Payment Success
Payment Failure
Refund Summary
Payment Reconciliation
Gateway Transactions
Counter Payments
```

Methods may include:

```text
UPI
CARD
NET_BANKING
CASH
OTHER
```

These remain configurable.

---

# 30. PAYMENT RECONCILIATION

Compare:

```text
Hospital Payment Record
        VS
Payment Gateway Record
```

Possible statuses:

```text
MATCHED
MISSING_HOSPITAL_RECORD
MISSING_GATEWAY_RECORD
AMOUNT_MISMATCH
STATUS_MISMATCH
DUPLICATE
PENDING_REVIEW
```

The report must flag discrepancies.

It must not automatically change financial records.

---

# 31. INSURANCE REPORTS

Create:

```text
Insurance Verification Summary
Policy Status
Eligibility Summary
Coverage Verification
Verification Failures
Pending Verification
```

---

# 32. INSURANCE CLAIM REPORTS

Create:

```text
Claim Summary
Claims by Insurer
Submitted Claims
Under Review
Query
Approved
Partially Approved
Rejected
Paid
Pending
```

---

# 33. CLAIM AGING REPORT

Display:

```text
Claim ID
Insurer
Submitted Date
Current Status
Days Pending
Last Update
```

This is an administrative tracking report.

It must not determine claim approval.

---

# 34. DOCTOR REPORTS

Create:

```text
Doctor Directory
Doctor Schedule
Doctor Availability
Appointment Load
OPD Load
Leave / Unavailability
Credential Expiry
```

Reports must respect doctor/staff confidentiality.

---

# 35. STAFF REPORTS

Create:

```text
Employee Directory
Department Staffing
Employee Status
Role Distribution
Onboarding Status
Offboarding Status
Access Status
```

Do not expose confidential HR information to unauthorized users.

---

# 36. ATTENDANCE REPORTS

Create:

```text
Daily Attendance
Monthly Attendance
Employee Attendance
Department Attendance
Late Attendance
Absence
Missed Punch
Attendance Corrections
```

---

# 37. ATTENDANCE SUMMARY

Columns:

```text
Employee
Department
Present
Absent
Late
Half Day
Leave
Missed Punch
Correction Count
```

---

# 38. SHIFT REPORTS

Create:

```text
Shift Roster
Shift Coverage
Shift Assignments
Shift Changes
Shift Swaps
Cross-Midnight Shifts
Unassigned Shifts
```

---

# 39. SHIFT COVERAGE

Example:

```text
Department:
Reception

Morning:
Required = 8
Assigned = 8

Evening:
Required = 6
Assigned = 5
```

Flag:

```text
Coverage Gap
```

Do not automatically assign staff merely because a gap exists.

---

# 40. LEAVE REPORTS

Create:

```text
Leave Summary
Leave by Employee
Leave by Department
Leave Type Summary
Pending Leave Requests
Leave Balance
Leave Trends
```

---

# 41. PAYROLL SUPPORT REPORTS

Create:

```text
Payroll Input Summary
Attendance Input
Leave Input
Overtime Input
Payroll Exceptions
Payroll Reconciliation
Payslip Generation Status
```

The reporting module must not independently calculate final payroll if Payroll Support is not the authoritative payroll engine.

---

# 42. PHARMACY REPORTS

Create:

```text
Prescription Summary
Pharmacy Order Summary
Dispensing Summary
Partial Dispensing
Cancelled Orders
Medicine Usage
Top Dispensed Medicines
Pharmacy Billing Summary
```

Clinical interpretation is outside this report.

---

# 43. INVENTORY REPORTS

Create:

```text
Current Stock
Low Stock
Out of Stock
Expiry
Near Expiry
Batch Summary
Inventory Movement
Stock Adjustment
Stock Transfer
Stock Count
Quarantine
```

---

# 44. STOCK VALUATION

If inventory valuation is configured, display the value according to the configured hospital accounting method.

Do not invent valuation policy.

Example:

```text
Inventory Value
= quantity × configured valuation basis
```

The valuation basis must come from configuration/finance-approved policy.

---

# 45. EXPIRY REPORT

Display:

```text
Item
Batch
Expiry Date
Current Quantity
Location
Days to Expiry
Status
```

Example statuses:

```text
EXPIRED
EXPIRING_SOON
VALID
```

---

# 46. PROCUREMENT REPORTS

Create:

```text
Purchase Request Summary
RFQ Summary
Quotation Comparison
Purchase Order Summary
Pending Orders
Late Deliveries
Goods Receipt Summary
Purchase Price Variance
Three-Way Match Summary
```

---

# 47. PROCUREMENT PERFORMANCE

Display:

```text
Purchase Requests
Approved
Rejected
Average Processing Time
PO Count
Delivery Delays
Invoice Match Rate
```

Do not automatically rank vendors for procurement decisions unless configured and approved.

---

# 48. VENDOR REPORTS

Create:

```text
Vendor Directory
Active Vendors
Suspended Vendors
Vendor Document Expiry
Vendor Performance
Vendor Issues
Vendor Contract Expiry
```

Performance should be informational.

Do not automatically suspend vendors based solely on a report.

---

# 49. LABORATORY REPORTS

Administrative reports:

```text
Lab Order Volume
Sample Collection
Sample Rejection
Pending Reports
Completed Reports
Turnaround Time
External LIS Reconciliation
Lab Billing Summary
```

---

# 50. LAB TURNAROUND TIME

Calculate:

```text
Order Time
→ Sample Collection
→ Sample Receipt
→ Processing
→ Verification
→ Report Release
```

Display:

```text
Average TAT
Median TAT
Maximum TAT
```

Do not interpret clinical significance.

---

# 51. RADIOLOGY REPORTS

Create:

```text
Radiology Order Summary
Schedule Utilization
Modality Utilization
Room Utilization
Pending Studies
Completed Studies
Report Pending
Report Released
External RIS/PACS Reconciliation
```

---

# 52. MAINTENANCE REPORTS

Create:

```text
Maintenance Requests
Work Orders
Open Tickets
Completed Tickets
Preventive Maintenance
Breakdowns
SLA Compliance
Asset Downtime
Maintenance Cost
Vendor Maintenance
```

---

# 53. SAFETY-CRITICAL ASSET REPORT

Display:

```text
Asset
Criticality
Current Status
Maintenance Status
Last Inspection
Next Scheduled Maintenance
Calibration Status
```

The report must not declare equipment clinically safe.

---

# 54. HOUSEKEEPING REPORTS

Create:

```text
Cleaning Tasks
Completed Tasks
Pending Tasks
Overdue Tasks
Room Turnover
Bed Cleaning
Inspection Results
Supply Requests
SLA Compliance
```

---

# 55. PATIENT FEEDBACK REPORTS

Create:

```text
Feedback Summary
Complaint Summary
Feedback by Category
Feedback by Department
Rating Summary
SLA Compliance
Resolution Time
Reopened Cases
Escalated Cases
```

---

# 56. FEEDBACK TREND

Example:

```text
Month
Complaints
Average Rating
Resolution Time
```

The report must identify patterns without automatically blaming individuals.

---

# 57. NOTIFICATION REPORTS

Create:

```text
Notification Volume
SMS Delivery
Email Delivery
In-App Delivery
Failed Notifications
Unknown Delivery
Provider Performance
Retry Summary
```

---

# 58. DOCUMENT REPORTS

Create:

```text
Documents Generated
Documents Released
Documents Failed
Documents Archived
Documents Downloaded
Documents by Type
Document Generation Errors
```

---

# 59. RPA REPORTS

Create:

```text
RPA Job Summary
RPA Success Rate
RPA Failure Rate
RPA Exceptions
Execution Duration
External System Performance
Retry Count
Reconciliation Cases
```

---

# 60. RPA EXECUTION DASHBOARD

Display:

```text
Total Jobs
Running
Completed
Failed
Exception
Reconciliation Required
Average Duration
```

Example:

```text
Jobs Today: 1,250
Success: 1,190
Failed: 35
Exceptions: 20
Reconciliation: 5
```

---

# 61. RPA PERFORMANCE

Metrics:

```text
Average Execution Time
Success Rate
Failure Rate
Retry Rate
Exception Rate
Reconciliation Rate
```

Do not hide failed automation runs.

---

# 62. EXCEPTION REPORTS

Create:

```text
Open Exceptions
Critical Exceptions
Exceptions by Module
Exceptions by Type
Ageing Exceptions
Resolved Exceptions
Recurring Exceptions
```

---

# 63. EXCEPTION AGING

Example:

```text
Exception ID
Module
Created
Age
Priority
Assigned To
Status
```

This allows operations teams to focus on unresolved problems.

---

# 64. MANAGEMENT DASHBOARD

Create:

```text
/portal/administration/reports
```

Dashboard cards:

```text
Patients Today
Appointments Today
OPD Visits
Current Admissions
Bed Occupancy
Discharges
Revenue
Outstanding Payments
Claims Pending
Low Stock Items
Open Maintenance
Open Housekeeping
Open Complaints
RPA Failures
```

---

# 65. MANAGEMENT DASHBOARD RULE

Management dashboards must be configurable.

Do not assume that every hospital wants exactly the same KPIs.

Administrators should be able to configure:

```text
Visible KPI
Order
Date range
Department
Refresh interval
```

---

# 66. KPI DEFINITIONS

Every KPI must have a defined calculation.

Example:

```text
Bed Occupancy Rate
=
Occupied Operational Beds
/
Operational Bed Capacity
× 100
```

Store the definition/version.

Do not allow different dashboards to calculate the same KPI differently.

---

# 67. KPI DEFINITION MODEL

Create:

```text
KPIDefinition
```

Suggested fields:

```javascript
{
  code: String,

  name: String,

  description: String,

  category: String,

  formulaDefinition: Object,

  sourceModules: [String],

  unit: String,

  version: Number,

  enabled: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 68. KPI SNAPSHOTS

For expensive calculations, optionally create:

```text
KPISnapshot
```

Fields:

```javascript
{
  kpiCode: String,

  value: Number,

  periodStart: Date,
  periodEnd: Date,

  filters: Object,

  generatedAt: Date,

  version: Number
}
```

Snapshots must indicate the calculation version.

---

# 69. ANALYTICS VS REPORTS

Reports:

```text
"What happened?"
```

Analytics:

```text
"How is it changing?"
```

Example report:

```text
1,250 appointments this month.
```

Analytics:

```text
Appointments increased 12% compared with previous month.
```

Do not automatically infer causation.

---

# 70. TREND ANALYTICS

Support:

```text
Daily
Weekly
Monthly
Quarterly
Yearly
```

Comparisons:

```text
Current period
Previous period
Same period previous year
```

where data is available.

---

# 71. DRILL-DOWN

Dashboards should support drill-down.

Example:

```text
Bed Occupancy
     ↓
Ward
     ↓
Bed Type
     ↓
Specific Beds
```

Authorization must be checked at every level.

---

# 72. REPORT TABLES

Tables should support:

- Pagination
- Sorting
- Search
- Filtering
- Column selection
- Export
- Drill-down
- Date range
- Refresh

---

# 73. CHARTS

Use interactive charts.

Supported chart types:

```text
Line
Bar
Stacked Bar
Pie/Donut
Area
Table
KPI Card
```

Do not use static chart images.

---

# 74. REPORT EXPORT FORMATS

Support:

```text
CSV
XLSX
PDF
```

where appropriate.

Not every report needs every format.

The report definition controls allowed formats.

---

# 75. CSV EXPORT

CSV is appropriate for:

```text
Large tabular datasets
Operational data
Simple lists
```

Large exports should be generated asynchronously.

---

# 76. XLSX EXPORT

Use XLSX for:

```text
Management analysis
Operational spreadsheets
Filtered tabular reports
```

Apply:

- headers
- column widths
- date formatting
- numeric formatting
- summary rows where applicable

---

# 77. PDF REPORT

PDF should include:

```text
Hospital Name
Report Name
Reporting Period
Filters
Generated Date
Generated By
Data Source
Summary
Table/Charts
Page Number
```

---

# 78. REPORT FILTER DISPLAY

Every exported report must show the filters used.

Example:

```text
Report:
Appointment Summary

Period:
01 Oct 2026 – 07 Oct 2026

Department:
Cardiology

Doctor:
All

Status:
All
```

This prevents ambiguity.

---

# 79. REPORT DATA FRESHNESS

The UI should indicate whether data is:

```text
LIVE
RECENT
SNAPSHOT
CACHED
```

For cached reports:

```text
Last Updated:
10:30 AM
```

Do not present stale data as real-time.

---

# 80. CACHING

For expensive reports, caching may be used.

Cache key should include:

```text
reportId
filters
user scope where relevant
calculation version
```

Do not share restricted cached results between unauthorized users.

---

# 81. REPORT ASYNC GENERATION

Large report flow:

```text
User
 ↓
Request
 ↓
QUEUED
 ↓
Worker
 ↓
Generate
 ↓
Store
 ↓
Notification
 ↓
Download
```

Use the centralized Document Service to store final PDF/XLSX artifacts where appropriate.

---

# 82. REPORT NOTIFICATION

After large report generation:

```text
Report ready.
Please open the Reports section to download it.
```

Use Notification Service.

Do not implement direct email/SMS in Reports.

---

# 83. SCHEDULED REPORTS

Authorized users may configure recurring reports.

Examples:

```text
Daily
Weekly
Monthly
```

Example:

```text
Every Monday 8:00 AM
→ Weekly Operations Report
```

---

# 84. REPORT SCHEDULE MODEL

Create:

```text
ReportSchedule
```

Suggested schema:

```javascript
{
  scheduleId: String,

  reportId: ObjectId,

  createdBy: ObjectId,

  frequency: String,

  schedule: Object,

  filters: Object,

  outputFormat: String,

  recipients: [
    {
      userId: ObjectId,
      email: String
    }
  ],

  enabled: Boolean,

  lastRunAt: Date,
  nextRunAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 85. SCHEDULED REPORT SECURITY

Before each execution:

```text
Resolve report
 ↓
Validate current permissions
 ↓
Validate recipient authorization
 ↓
Execute
```

Do not assume a user who had permission six months ago still has permission.

---

# 86. REPORT RECIPIENTS

Possible recipients:

```text
Hospital Management
Administrative Manager
HR Manager
Finance
Procurement
Department Manager
System Administrator
```

Recipients must be permission controlled.

---

# 87. PATIENT-LEVEL REPORT RESTRICTION

A report containing:

```text
Patient Name
Patient ID
Medical information
```

must require explicit authorization.

Do not allow an ordinary user to export the entire patient population.

---

# 88. AGGREGATED DATA

Where possible, management dashboards should use aggregated information.

Example:

```text
Total Admissions
Average Length of Stay
Bed Occupancy
```

rather than displaying patient names unnecessarily.

---

# 89. FINANCIAL REPORT SECURITY

Financial reports require appropriate permissions.

Examples:

```text
Revenue
Outstanding Payments
Refunds
Adjustments
Payroll
Vendor Payments
```

must not be accessible to ordinary operational staff.

---

# 90. HR REPORT SECURITY

HR reports may contain:

```text
Salary
Attendance
Leave
Employee information
```

Access must be restricted.

Do not expose payroll/salary information to department users unless explicitly authorized.

---

# 91. AUDIT LOGGING

Audit:

```text
Report Viewed
Report Generated
Report Exported
Report Downloaded
Report Scheduled
Report Schedule Modified
Dashboard Configuration Changed
KPI Definition Changed
```

---

# 92. REPORT ACCESS LOG

Create:

```text
ReportAccessLog
```

Suggested fields:

```javascript
{
  userId: ObjectId,

  reportId: ObjectId,

  action: String,

  filters: Object,

  outputFormat: String,

  executionId: ObjectId,

  createdAt: Date
}
```

Avoid storing unnecessarily sensitive report data.

---

# 93. REPORT DEFINITION VERSIONING

If a report's formula changes:

```text
Version 1
 ↓
Version 2
```

Old executions remain associated with Version 1.

This is important for historical comparison.

---

# 94. KPI VERSIONING

If:

```text
Bed Occupancy Formula
```

changes, increment the KPI version.

Historical reports must identify which definition was used.

---

# 95. DATA QUALITY

The reporting service must detect obvious data-quality issues.

Examples:

```text
Negative quantity
Admission without patient
Payment without invoice
Appointment without doctor
Bed occupied without assignment
Employee attendance for unknown employee
```

These should be reported as data-quality exceptions.

Do not silently correct source data.

---

# 96. DATA QUALITY REPORT

Create:

```text
Data Quality Dashboard
```

Metrics:

```text
Missing References
Duplicate Records
Invalid Statuses
Orphan Records
Calculation Errors
Synchronization Issues
```

---

# 97. DATA QUALITY WORKFLOW

```text
Reporting Engine
     ↓
Detect anomaly
     ↓
Create Exception
     ↓
Assign responsible module
     ↓
Human correction
     ↓
Source system updated
     ↓
Report refresh
```

The reporting engine must not modify source records automatically.

---

# 98. CROSS-MODULE RECONCILIATION

Reports may compare modules.

Examples:

```text
Billing
vs
Payment Gateway
```

```text
Pharmacy Dispensing
vs
Inventory Movement
```

```text
Procurement Goods Receipt
vs
Inventory Receipt
```

```text
Lab Order
vs
Lab Report
```

```text
RPA Job
vs
External System Status
```

---

# 99. RECONCILIATION REPORT

Each reconciliation should show:

```text
Reference
Source A
Source B
Expected
Actual
Difference
Status
Last Checked
```

Statuses:

```text
MATCHED
MISMATCH
MISSING
DUPLICATE
PENDING_REVIEW
```

---

# 100. MANAGEMENT INSIGHTS

The dashboard may show informational insights such as:

```text
Bed occupancy increased compared with previous month.
Appointment no-shows increased.
Inventory items nearing expiry increased.
RPA failure rate increased.
Patient complaint volume increased.
```

The system must distinguish:

```text
Observed metric
```

from:

```text
Possible explanation
```

Do not automatically claim causation.

---

# 101. ALERTS

Reports may generate alerts for configured thresholds.

Example:

```text
Bed occupancy > 90%
Low stock below threshold
RPA failure rate > configured threshold
SLA breach count > configured threshold
```

Alert workflow:

```text
Metric
 ↓
Threshold
 ↓
Alert
 ↓
Notification Service
```

---

# 102. THRESHOLD MODEL

Create:

```text
AnalyticsAlertRule
```

Fields:

```javascript
{
  ruleId: String,

  metricCode: String,

  operator: String,

  threshold: Number,

  period: String,

  severity: String,

  recipients: [ObjectId],

  enabled: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 103. ALERT STATUS

```text
ACTIVE
TRIGGERED
ACKNOWLEDGED
RESOLVED
DISABLED
```

---

# 104. NO AUTONOMOUS DECISION MAKING

Analytics may say:

```text
"Inventory of Item X is below configured reorder level."
```

It must not automatically:

```text
"Purchase Item X from Vendor Y."
```

unless a separate authorized procurement workflow explicitly handles this.

Similarly:

```text
"Department has high complaint count."
```

must not automatically mean:

```text
"Employee should be disciplined."
```

---

# 105. REPORT API

Base path:

```text
/api/reports
```

---

# 106. REPORT CATALOG API

```http
GET /api/reports
GET /api/reports/:reportId
```

---

# 107. EXECUTE REPORT

```http
POST /api/reports/:reportId/run
```

Request:

```json
{
  "filters": {
    "dateFrom": "2026-10-01",
    "dateTo": "2026-10-07",
    "departmentId": "..."
  },
  "format": "PDF"
}
```

---

# 108. REPORT EXECUTION STATUS

```http
GET /api/reports/executions/:executionId
```

---

# 109. DOWNLOAD REPORT

```http
GET /api/reports/executions/:executionId/download
```

Authorization is required.

---

# 110. REPORT SCHEDULE API

```http
GET    /api/reports/schedules
POST   /api/reports/schedules
PATCH  /api/reports/schedules/:id
DELETE /api/reports/schedules/:id
```

Deletion should preferably disable the schedule rather than destroy history.

---

# 111. DASHBOARD API

```http
GET /api/reports/dashboard/management
GET /api/reports/dashboard/operations
GET /api/reports/dashboard/finance
GET /api/reports/dashboard/hr
GET /api/reports/dashboard/rpa
```

Each endpoint must enforce permissions.

---

# 112. KPI API

```http
GET /api/reports/kpis
GET /api/reports/kpis/:code
GET /api/reports/kpis/:code/trend
```

---

# 113. ANALYTICS ALERT API

```http
GET  /api/reports/alerts
POST /api/reports/alerts
PATCH /api/reports/alerts/:id
POST /api/reports/alerts/:id/acknowledge
POST /api/reports/alerts/:id/resolve
```

---

# 114. BACKEND STRUCTURE

Use:

```text
server/
├── models/
│   ├── ReportDefinition.js
│   ├── ReportExecution.js
│   ├── ReportSchedule.js
│   ├── ReportAccessLog.js
│   ├── KPIDefinition.js
│   ├── KPISnapshot.js
│   └── AnalyticsAlertRule.js
│
├── controllers/
│   ├── reportController.js
│   ├── dashboardController.js
│   ├── kpiController.js
│   └── reportScheduleController.js
│
├── services/
│   ├── reportService.js
│   ├── reportQueryService.js
│   ├── reportExportService.js
│   ├── dashboardService.js
│   ├── kpiService.js
│   ├── analyticsService.js
│   ├── reconciliationService.js
│   └── dataQualityService.js
│
├── workers/
│   ├── reportWorker.js
│   ├── scheduledReportWorker.js
│   └── analyticsAlertWorker.js
│
├── validators/
│   └── reportValidator.js
│
└── routes/
    └── reportRoutes.js
```

---

# 115. FRONTEND STRUCTURE

Use:

```text
client/src/
├── portals/
│   └── administration/
│       └── reports/
│           ├── ReportsHome.jsx
│           ├── ReportCatalog.jsx
│           ├── ReportViewer.jsx
│           ├── ReportFilters.jsx
│           ├── ReportHistory.jsx
│           ├── ScheduledReports.jsx
│           ├── KPIManagement.jsx
│           ├── AnalyticsAlerts.jsx
│           ├── DataQuality.jsx
│           └── dashboards/
│               ├── ManagementDashboard.jsx
│               ├── OperationsDashboard.jsx
│               ├── FinanceDashboard.jsx
│               ├── HRDashboard.jsx
│               └── RPADashboard.jsx
│
└── components/
    └── reports/
        ├── KPIWidget.jsx
        ├── ReportTable.jsx
        ├── ReportChart.jsx
        ├── ReportFilterPanel.jsx
        ├── ExportMenu.jsx
        ├── ReportStatusBadge.jsx
        └── AnalyticsAlertCard.jsx
```

---

# 116. REPORT HOME

Example:

```text
Reports & Analytics

---------------------------------------------
Patient & Operations
[Patients] [Appointments] [OPD] [Admissions]

Finance
[Billing] [Payments] [Insurance]

Workforce
[Attendance] [Shifts] [Leave] [Payroll]

Operations
[Pharmacy] [Inventory] [Procurement]
[Maintenance] [Housekeeping]

Clinical Administration
[Laboratory] [Radiology]

Automation
[RPA] [Exceptions] [Notifications]

Management
[Management Dashboard]
---------------------------------------------
```

---

# 117. REPORT VIEWER

The report viewer should contain:

```text
Report Name
Description

Filters
[Apply] [Reset]

Summary KPIs

Charts

Data Table

[Export PDF]
[Export XLSX]
[Export CSV]
```

---

# 118. REPORT REFRESH

Allow:

```text
Refresh
```

but avoid uncontrolled rapid refresh.

Use reasonable rate limits.

---

# 119. REPORT PAGINATION

Large datasets must use server-side pagination.

Do not load:

```text
500,000 rows
```

into the browser at once.

---

# 120. LARGE EXPORTS

Large exports should be asynchronous.

Example:

```text
User requests:
100,000-row Inventory Report

System:
QUEUED

Worker:
Generates XLSX

Notification:
Report ready

User:
Downloads
```

---

# 121. REPORT CACHING

Cache only where appropriate.

Example:

```text
Management dashboard
→ cache for 5 minutes
```

Financial transaction detail:

```text
→ use fresh data where required
```

Cache strategy must be configurable by report type.

---

# 122. REPORT DATA SECURITY

Never use:

```text
GET /api/reports/patients?all=true
```

without permission controls.

Every report execution must calculate the user's authorized data scope.

---

# 123. DEPARTMENT SCOPING

Example:

Housekeeping Manager:

```text
Housekeeping reports
```

should not automatically see:

```text
Payroll
Vendor bank information
Insurance claims
Confidential HR data
```

---

# 124. MANAGEMENT ACCESS

Hospital Management may have broad reporting access but still should respect:

- highly restricted HR information
- confidential complaint data
- security information
- sensitive patient information

according to configured permissions.

---

# 125. REPORT DATA MASKING

Sensitive fields may be masked.

Example:

```text
Phone:
******1234

Email:
r*****@example.com
```

Financial account information should be masked.

---

# 126. REPORT EXPORT MASKING

Masking must apply to exports as well.

Do not show masked data in UI but full data in XLSX without permission.

---

# 127. AUDIT EXPORTS

Every export must record:

```text
User
Report
Filters
Format
Execution ID
Timestamp
```

---

# 128. REPORT SCHEDULER

The scheduler must execute:

```text
Due Schedule
 ↓
Validate Permissions
 ↓
Generate Report
 ↓
Store Document
 ↓
Notify Recipients
 ↓
Update Schedule
```

If permissions have changed, the report should not be sent to unauthorized recipients.

---

# 129. REPORT SCHEDULE FAILURE

Example:

```text
Scheduled Report
 ↓
Generation failed
 ↓
Report Execution = FAILED
 ↓
Notification to authorized administrator
 ↓
Retry if safe
```

Do not repeatedly send failed report notifications.

---

# 130. REPORT VERSIONING

Every report definition must have a version.

Example:

```text
Billing Summary v1
Billing Summary v2
```

The execution record must store the version used.

---

# 131. REPORT REPRODUCIBILITY

A report execution should be reproducible where practical.

Store:

```text
Report Definition Version
Filters
Period
Data source version where applicable
KPI version
Generated timestamp
```

This is especially important for financial and management reports.

---

# 132. FINANCIAL REPORT CONSISTENCY

Financial reports must consume Billing/Payment data according to the authoritative financial rules.

Do not create separate formulas that disagree with Billing.

Example:

```text
Billing:
Outstanding = ₹20,000

Report:
Outstanding = ₹18,000
```

is unacceptable.

The reporting layer must use the same authoritative calculation or a clearly versioned reporting definition.

---

# 133. CLINICAL DATA BOUNDARY

The Reports module may display authorized clinical-administrative information.

It must not:

- diagnose
- interpret medical results
- generate medical recommendations
- alter clinical records
- decide clinical priority

For example:

```text
Lab report count = 500
```

is acceptable.

But:

```text
The system determines which patient has a serious disease.
```

is outside this module's scope.

---

# 134. DATA QUALITY DASHBOARD

Include:

```text
Orphan Records
Missing References
Duplicate Records
Invalid Status
Mismatched Totals
Synchronization Errors
External Integration Errors
```

---

# 135. CROSS-MODULE TOTAL RECONCILIATION

Example:

```text
Billing Revenue
       VS
Payment Transactions
```

Example:

```text
Pharmacy Dispensing
       VS
Inventory Deduction
```

Example:

```text
Procurement Goods Receipt
       VS
Inventory Receipt
```

Discrepancies should become exceptions.

---

# 136. RPA ANALYTICS

Track:

```text
Total Executions
Success
Failure
Retry
Exception
Reconciliation
Average Duration
```

Break down by:

```text
RPA Process
External System
Date
Department
```

---

# 137. RPA FAILURE TREND

Example:

```text
September:
Failure Rate = 1.2%

October:
Failure Rate = 2.4%
```

The dashboard can flag:

```text
Failure rate increased.
```

It must not automatically conclude why.

---

# 138. PATIENT EXPERIENCE DASHBOARD

Combine authorized aggregated metrics:

```text
Appointment No-Show
Average Waiting Time
Feedback Rating
Complaint Volume
Resolution Time
```

Do not expose patient identities unless necessary.

---

# 139. OPERATIONS DASHBOARD

Display:

```text
Current Admissions
Bed Occupancy
OPD Queue
Pending Discharges
Pharmacy Orders
Lab Pending
Radiology Pending
Maintenance Open
Housekeeping Pending
Inventory Alerts
```

---

# 140. FINANCE DASHBOARD

Display according to permissions:

```text
Revenue
Collections
Outstanding
Payment Success Rate
Insurance Pending
Claims Pending
Billing Queries
```

---

# 141. HR DASHBOARD

Display:

```text
Active Employees
Attendance
Absence
Leave
Shift Coverage
Payroll Input Status
Pending Corrections
```

---

# 142. AUTOMATION DASHBOARD

Display:

```text
RPA Jobs
Success Rate
Failure Rate
Exceptions
Reconciliation
Notification Delivery
Document Generation
```

---

# 143. ALERT INTEGRATION

Reports may generate events:

```text
LOW_STOCK_THRESHOLD_REACHED
BED_OCCUPANCY_THRESHOLD_REACHED
RPA_FAILURE_THRESHOLD_REACHED
SLA_BREACH_THRESHOLD_REACHED
```

Send through Notification Service.

---

# 144. RPA INTEGRATION

Robot Framework may automate:

- scheduled external report download
- legacy report extraction
- report upload to external systems
- report reconciliation
- external data collection

RPA must not modify source records simply to make reports look correct.

---

# 145. RPA REPORT EXTRACTION FLOW

Example:

```text
RPA Job
 ↓
Login Legacy System
 ↓
Navigate Reports
 ↓
Select Date
 ↓
Download Report
 ↓
Validate File
 ↓
Store Document
 ↓
Extract Data if required
 ↓
Compare with Hospital Data
 ↓
Create Reconciliation Result
```

---

# 146. EXTERNAL REPORT UNKNOWN STATE

If download fails after clicking:

```text
Download
 ↓
Timeout
```

do not automatically click download repeatedly.

Check:

```text
Download history
External report list
File availability
```

then reconcile.

---

# 147. ROBOT FOLDER STRUCTURE

Create:

```text
robot/
├── portals/
│   └── reports/
│       ├── legacy_report_download.robot
│       ├── external_report_upload.robot
│       └── report_reconciliation.robot
│
├── keywords/
│   └── reports/
│       ├── report_keywords.robot
│       ├── legacy_portal_keywords.robot
│       └── reconciliation_keywords.robot
│
└── tests/
    └── reports/
        ├── report_download_tests.robot
        ├── report_reconciliation_tests.robot
        └── scheduled_report_tests.robot
```

---

# 148. REPORT DATABASE INDEXES

Recommended:

```javascript
ReportDefinitionSchema.index(
  { code: 1 },
  { unique: true }
);

ReportExecutionSchema.index({
  reportId: 1,
  createdAt: -1
});

ReportExecutionSchema.index({
  requestedBy: 1,
  createdAt: -1
});

ReportExecutionSchema.index({
  status: 1,
  createdAt: -1
});

ReportScheduleSchema.index({
  enabled: 1,
  nextRunAt: 1
});

ReportAccessLogSchema.index({
  userId: 1,
  createdAt: -1
});

ReportAccessLogSchema.index({
  reportId: 1,
  createdAt: -1
});

KPIDefinitionSchema.index({
  code: 1
});
```

---

# 149. SECURITY REQUIREMENTS

Implement:

- JWT authentication
- RBAC
- Department-level authorization
- Patient-data authorization
- Financial-data authorization
- HR-data authorization
- Export permissions
- Report scheduling permissions
- Audit logging
- Data masking
- Secure report downloads
- Rate limiting
- Input validation

---

# 150. PERFORMANCE REQUIREMENTS

The reporting layer must avoid blocking normal hospital operations.

Large reports should:

```text
Queue
 ↓
Background Worker
 ↓
Generate
 ↓
Store
```

Do not execute expensive aggregation synchronously if it could cause API timeouts.

---

# 151. REPORT QUERY SAFETY

Do not allow users to submit arbitrary MongoDB queries.

Bad:

```json
{
  "query": {
    "$where": "..."
  }
}
```

Instead use predefined report definitions and validated filter parameters.

---

# 152. REPORT INJECTION PROTECTION

Validate:

- filter fields
- sort fields
- operators
- date ranges
- IDs
- export format

Never directly concatenate user input into database queries.

---

# 153. DATE RANGE LIMITS

Very large date ranges may be restricted for expensive reports.

Example:

```text
Maximum:
12 months
```

for certain detailed reports.

The exact limit must be configurable.

---

# 154. REPORT ERROR HANDLING

User-facing error:

```text
The report could not be generated.
Please try again or contact an administrator.
```

Do not expose:

```text
MongoDB aggregation error
Stack trace
Database query
Internal path
```

---

# 155. SEED DATA

Create realistic sample data:

```text
20 patients
30 appointments
15 admissions
50 bed records
100 invoices
100 payments
20 claims
30 employees
100 attendance records
20 leave requests
50 pharmacy orders
100 inventory movements
30 procurement records
20 vendors
50 lab orders
30 radiology orders
20 maintenance tickets
20 housekeeping tasks
30 feedback records
100 notifications
100 RPA jobs
```

This allows dashboards to demonstrate meaningful aggregation.

---

# 156. DEMO SCENARIO — MANAGEMENT DASHBOARD

Given:

```text
200 beds
150 occupied
20 reserved
20 available
10 cleaning
```

Dashboard:

```text
Occupancy:
150 / 190 operational beds
```

The exact denominator must follow configured operational-bed rules.

---

# 157. DEMO SCENARIO — APPOINTMENTS

```text
Appointments:
500

Confirmed:
430

Checked In:
390

Completed:
360

Cancelled:
30

No Show:
40
```

Dashboard should display these consistently.

---

# 158. DEMO SCENARIO — BILLING

```text
Gross:
₹15,00,000

Discount:
₹50,000

Insurance:
₹4,00,000

Patient Responsibility:
₹10,50,000

Collected:
₹9,80,000

Outstanding:
₹70,000
```

These are illustrative test values.

Actual production values must come from Billing.

---

# 159. DEMO SCENARIO — RPA

```text
Jobs:
1,000

Completed:
950

Failed:
20

Exception:
20

Reconciliation:
10
```

Display:

```text
Success Rate
Failure Rate
Exception Rate
```

---

# 160. DEMO SCENARIO — FEEDBACK

```text
Feedback:
250

Complaints:
80

Suggestions:
50

Compliments:
60

Service Feedback:
60

Average Rating:
4.1
```

Show trend by month.

---

# 161. DEMO SCENARIO — INVENTORY

```text
Total Items:
1,200

Low Stock:
35

Near Expiry:
18

Expired:
4

Quarantined:
3
```

Do not automatically create purchase orders from this dashboard.

---

# 162. UNIT TESTS

Implement tests for:

```text
Report permission validation
Filter validation
Date range validation
Report definition lookup
Report execution
Pagination
Aggregation
KPI calculation
KPI versioning
Report export
Report scheduling
Data masking
Access logging
```

---

# 163. INTEGRATION TESTS

Test:

```text
Patient report
Appointment report
Admission report
Bed report
Billing report
Payment report
Insurance report
Inventory report
Procurement report
HR report
RPA report
Feedback report
```

against seeded data.

---

# 164. RBAC TESTS

Verify:

```text
Patient:
Only own permitted reports/documents.

Receptionist:
Operational reports permitted by role.

Billing Staff:
Billing/payment reports.

HR Manager:
HR/attendance/leave/payroll-support reports.

Procurement:
Procurement/vendor reports.

Hospital Management:
Configured management reports.

System Admin:
Technical/RPA/system reports.
```

---

# 165. EXPORT SECURITY TESTS

Verify:

```text
Unauthorized user cannot export.
Restricted fields are masked.
Patient-level exports are protected.
Financial reports require financial permission.
HR reports require HR permission.
```

---

# 166. PERFORMANCE TESTS

Test:

```text
1,000 rows
10,000 rows
100,000 rows
```

for supported reports.

Large exports must use asynchronous generation.

---

# 167. RPA TESTS

Test:

```text
Legacy report download
External report upload
Download timeout
Unknown external state
Duplicate report
File validation
Reconciliation
RPA failure
```

---

# 168. DATA QUALITY TESTS

Seed invalid records and verify:

```text
Orphan reference
Duplicate
Missing field
Mismatched total
Invalid status
```

creates appropriate data-quality exceptions.

---

# 169. ACCEPTANCE CRITERIA

The module is complete only when:

### Reports

- [ ] Report catalog works.
- [ ] Report filters work.
- [ ] Report execution works.
- [ ] Large reports can run asynchronously.
- [ ] Reports display correct periods.
- [ ] Reports show generation timestamp.
- [ ] Reports show filters.

### Dashboards

- [ ] Management dashboard works.
- [ ] Operations dashboard works.
- [ ] Finance dashboard works.
- [ ] HR dashboard works.
- [ ] RPA dashboard works.

### Analytics

- [ ] Trends work.
- [ ] KPI calculations work.
- [ ] KPI versions are tracked.
- [ ] Drill-down works.
- [ ] Threshold alerts work.

### Exports

- [ ] CSV works.
- [ ] XLSX works.
- [ ] PDF works where configured.
- [ ] Large exports are asynchronous.
- [ ] Export permissions work.

### Security

- [ ] RBAC works.
- [ ] Patient isolation works.
- [ ] Financial data is restricted.
- [ ] HR data is restricted.
- [ ] Sensitive fields can be masked.
- [ ] Exports are audited.

### Reconciliation

- [ ] Cross-module reconciliation works.
- [ ] Payment reconciliation works.
- [ ] Inventory reconciliation works.
- [ ] Procurement reconciliation works.
- [ ] RPA reconciliation works.

### Data Quality

- [ ] Data-quality issues are detected.
- [ ] Exceptions are created.
- [ ] Source records are not silently changed.

---

# 170. IMPLEMENTATION ORDER

## Step 1 — Report Models

Create:

```text
ReportDefinition
ReportExecution
ReportSchedule
ReportAccessLog
KPIDefinition
KPISnapshot
AnalyticsAlertRule
```

---

## Step 2 — Report Catalog

Implement:

```text
Report definitions
Report categories
Permissions
Filters
Columns
Export formats
```

---

## Step 3 — Report Query Layer

Implement:

```text
Patient reports
Appointment reports
OPD reports
Admission reports
Bed reports
Billing reports
Payment reports
```

Then continue:

```text
Insurance
Claims
Pharmacy
Inventory
Procurement
Vendor
HR
Laboratory
Radiology
Maintenance
Housekeeping
Feedback
RPA
```

---

## Step 4 — Report Execution Engine

Implement:

```text
Validation
Authorization
Filtering
Aggregation
Pagination
Execution tracking
```

---

## Step 5 — Export Engine

Implement:

```text
CSV
XLSX
PDF
```

using the centralized Document Service where appropriate.

---

## Step 6 — Dashboards

Build:

```text
Management
Operations
Finance
HR
RPA
```

---

## Step 7 — KPI Engine

Implement:

```text
KPI definitions
KPI versions
KPI calculation
KPI trends
Snapshots
```

---

## Step 8 — Data Quality

Implement:

```text
Orphan detection
Duplicate detection
Mismatch detection
Missing data
Exception creation
```

---

## Step 9 — Reconciliation

Implement:

```text
Billing vs Payment
Procurement vs Inventory
Pharmacy vs Inventory
RPA vs External
Lab vs LIS
Radiology vs RIS/PACS
```

where supported.

---

## Step 10 — Scheduling

Implement:

```text
Scheduled reports
Recurring reports
Permission revalidation
Report generation
Notification
```

---

## Step 11 — Alerts

Implement:

```text
Threshold rules
Trigger
Notification
Acknowledgement
Resolution
```

---

## Step 12 — RPA

Implement only required external report extraction/upload/reconciliation workflows.

---

# 171. CROSS-MODULE RULE

The Reports module must consume data from other modules.

It must not become another operational system.

Incorrect:

```text
Reports
 └── Editable Invoice
```

Correct:

```text
Reports
 └── Invoice Summary
```

If an invoice must be changed:

```text
Reports
 ↓
Open Invoice
 ↓
Billing Module
 ↓
Authorized Change
```

---

# 172. SOURCE-OF-TRUTH RULE

The following remain authoritative:

```text
Patient
→ Patient Registration

Appointment
→ Appointment Management

OPD Token
→ OPD Queue

Admission
→ Patient Admission

Bed
→ Bed Management

Invoice
→ Billing

Payment
→ Payment/Gateway Integration

Insurance
→ Insurance Verification

Claim
→ Insurance Claims

Doctor
→ Doctor Management

Employee
→ Staff Management

Attendance
→ Attendance Management

Shift
→ Shift Management

Leave
→ Leave Management

Payroll Inputs
→ Payroll Support

Prescription
→ Pharmacy / Clinical workflow

Inventory
→ Medical Inventory

Purchase Order
→ Procurement

Vendor
→ Vendor Management

Lab Order/Result
→ Laboratory

Radiology Order/Report
→ Radiology

Maintenance Ticket
→ Maintenance

Housekeeping Task
→ Housekeeping

Feedback
→ Patient Feedback

Notification
→ Notification Service

Document
→ Document Service

RPA Execution
→ RPA Job Management
```

Reports must not replace these systems.

---

# 173. FINAL IMPLEMENTATION RULES FOR AI CODING AGENT

When implementing this module:

1. Build one centralized Reports & Analytics layer.
2. Do not duplicate operational modules.
3. Use authoritative source data.
4. Do not modify source records from reports.
5. Implement predefined report definitions.
6. Do not expose arbitrary database queries.
7. Validate all filters.
8. Enforce RBAC on every report.
9. Protect patient data.
10. Protect financial data.
11. Protect HR data.
12. Protect confidential complaint data.
13. Audit report views.
14. Audit report exports.
15. Audit scheduled reports.
16. Version report definitions.
17. Version KPI definitions.
18. Show reporting periods.
19. Show filters.
20. Show generated timestamps.
21. Support CSV.
22. Support XLSX.
23. Support PDF.
24. Use asynchronous processing for large reports.
25. Reuse Document Service for generated report files.
26. Reuse Notification Service for report-ready notifications.
27. Reuse AuditEvent for audit logs.
28. Reuse RPAJob for automation tracking.
29. Implement caching only where safe.
30. Never share restricted cached data.
31. Implement data-quality detection.
32. Implement cross-module reconciliation.
33. Never silently correct source data.
34. Create exceptions for mismatches.
35. Support configurable KPI thresholds.
36. Support scheduled reports.
37. Revalidate permissions before scheduled delivery.
38. Support interactive charts.
39. Support drill-down with authorization checks.
40. Never make autonomous clinical decisions.
41. Never make autonomous financial decisions.
42. Never make autonomous HR decisions.
43. Never make autonomous procurement/vendor decisions.
44. Never use analytics as an automatic disciplinary system.
45. Preserve report reproducibility.
46. Keep calculations consistent with source modules.
47. Test with realistic data.
48. Test large datasets.
49. Test RBAC thoroughly.
50. Keep the implementation production-oriented and maintainable.

---

# 174. DEFINITION OF DONE

The Reports & Analytics module is complete when:

```text
Hospital Data
      |
      v
Authoritative Modules
      |
      v
Reports & Analytics
      |
      +-----------------------------+
      |             |               |
      v             v               v
   Reports       Dashboards      Analytics
      |             |               |
      +-------------+---------------+
                    |
          +---------+---------+
          |         |         |
          v         v         v
        View      Export    Schedule
                              |
                              v
                    Notification Service
```

The completed module must provide:

- Centralized reporting
- Interactive dashboards
- KPI monitoring
- Trend analysis
- Cross-module reconciliation
- Data-quality monitoring
- Scheduled reports
- Secure exports
- RPA analytics
- Exception analytics
- Management reporting
- Operational reporting
- Financial reporting
- HR reporting
- Inventory/procurement reporting
- Patient-experience reporting

while maintaining strict separation between:

```text
Operational System of Record
              and
Reports & Analytics
```

The implementation must be **fully functional**, secure, permission-controlled, auditable, scalable, configurable, and integrated with the complete MERN + MongoDB + Robot Framework hospital platform.