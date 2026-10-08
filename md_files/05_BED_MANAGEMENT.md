# 05_BED_MANAGEMENT.md

# Hospital Administrative RPA Platform
## Module 05 — Bed Management

---

## 1. PURPOSE

Build a complete **Bed Management module** for the Hospital Administrative RPA Platform using the existing MERN architecture:

- React.js
- Node.js
- Express.js
- MongoDB
- Mongoose
- Robot Framework for RPA/automation
- REST APIs
- JWT authentication
- RBAC
- Audit logging
- Centralized Notification Service
- Centralized Document Generation Service

The Bed Management module is responsible for maintaining the hospital's authoritative record of:

- Wards
- Rooms, where applicable
- Physical beds
- Accommodation categories
- Bed capabilities
- Bed availability
- Bed reservations/holds
- Physical bed assignments
- Bed transfers
- Bed releases
- Cleaning requirements
- Maintenance states
- Bed status history
- Bed availability reporting
- Administrative bed allocation automation

The module must integrate with:

- Patient Admission
- OPD/Visit
- Discharge Processing
- Housekeeping
- Maintenance
- Billing
- Notifications
- Reports & Analytics
- Audit
- Robot Framework RPA

---

# 2. CRITICAL DESIGN PRINCIPLE

The system must keep these three concepts completely separate.

## 2.1 Clinical Requirement

Defined by:

- Doctor
- Authorized clinical staff

Examples:

- ICU required
- Isolation-capable bed required
- Specific clinical equipment required
- Gender-compatible accommodation required
- Other configured clinical/administrative compatibility requirements

The Bed Management system may **filter beds according to an already-defined requirement**.

It must NOT determine whether the patient clinically needs ICU, isolation, oxygen support, etc.

---

## 2.2 Patient Accommodation Preference

The patient or authorized representative may select an accommodation category where hospital policy permits.

Examples:

```text
General Ward
Semi-Private
Private Room
```

The patient chooses a **category**, not a specific physical bed.

Example:

```text
Patient preference:
Private Room
```

This does NOT mean:

```text
Bed P-03
```

must be selected by the patient.

---

## 2.3 Physical Bed

The physical bed is an actual inventory resource maintained by Bed Management.

Example:

```text
Bed ID: BED-P-03
Ward: Private Wing
Room: P-03
Category: Private
Status: AVAILABLE
```

Only authorized hospital staff/system rules can assign this physical bed.

---

# 3. NON-NEGOTIABLE BUSINESS RULES

The implementation agent MUST follow these rules.

### Rule 1 — Patient ID is not Bed ID

A patient has a permanent:

```text
Patient ID
```

A physical bed has:

```text
Bed ID
```

Never use one as the other.

---

### Rule 2 — Admission does not own the bed inventory

The Admission module requests bed availability/assignment.

Bed Management owns:

- physical bed records
- bed status
- reservations
- assignments
- releases
- transfers
- cleaning state
- maintenance state

Do not create a second independent bed inventory inside Admission.

---

### Rule 3 — Patient selects category, not physical bed

The patient may request:

```text
Private
```

but must not directly select:

```text
BED-P-03
```

---

### Rule 4 — No silent downgrade

If the patient requests:

```text
Private
```

and Private beds are unavailable, the system MUST NOT silently assign:

```text
Semi-Private
```

or:

```text
General Ward
```

Instead show configured alternatives:

- Waitlist
- Alternative accommodation
- Contact admission desk
- Staff review

---

### Rule 5 — Clinical requirement overrides preference

If authorized clinical staff specify a requirement that requires a particular bed capability/category, that requirement takes precedence over patient accommodation preference.

Example:

```text
Patient preference: Private Room
Clinical requirement: ICU
```

The system must search for a suitable ICU bed according to configured hospital rules.

The system must never downgrade a clinically required bed placement.

---

### Rule 6 — Actual assigned bed drives billing

The patient's requested accommodation does not determine the final room charge.

Example:

```text
Requested:
Private Room

Actually Assigned:
Semi-Private

```

If the hospital's configured billing policy charges according to the actual accommodation, Billing must use the actual assigned accommodation.

Bed Management provides the actual assignment.

Billing calculates charges.

Bed Management must NOT calculate final invoices.

---

### Rule 7 — No double assignment

A physical bed cannot simultaneously be assigned to two active patients.

The implementation must use:

- database constraints/indexes where possible
- transactional operations where supported
- atomic reservation/assignment operations
- concurrency checks
- idempotency

---

### Rule 8 — Cleaning is mandatory before availability when configured

After discharge or transfer:

```text
OCCUPIED
    ↓
CLEANING_REQUIRED
    ↓
Housekeeping completes cleaning
    ↓
AVAILABLE
```

The system must not directly mark the bed AVAILABLE when a cleaning workflow is required.

---

### Rule 9 — Maintenance is separate from cleaning

A bed requiring maintenance must not be placed into normal availability.

Example:

```text
AVAILABLE
   ↓
MAINTENANCE
   ↓
AVAILABLE
```

If the bed is unsafe or unavailable:

```text
OUT_OF_SERVICE
```

may be used according to authorized staff action.

---

### Rule 10 — RPA does not make clinical decisions

RPA may:

- read availability
- filter beds
- apply configured rules
- reserve
- assign
- release
- synchronize
- notify
- reconcile
- report

RPA may NOT:

- decide medical priority
- decide ICU requirement
- decide isolation requirement
- override clinical requirements
- downgrade clinically required placement
- invent hospital policies
- approve unauthorized exceptions

---

# 4. BED HIERARCHY

The system should represent the physical hospital structure as:

```text
Hospital
   │
   ├── Ward
   │     │
   │     ├── Room
   │     │      │
   │     │      ├── Bed
   │     │      └── Bed
   │     │
   │     └── Room
   │
   └── Ward
          │
          └── Bed
```

Not every ward must require a room.

Therefore the design must support:

```text
Hospital
  → Ward
      → Bed
```

and:

```text
Hospital
  → Ward
      → Room
          → Bed
```

---

# 5. ACCOMMODATION CATEGORIES

Create configurable accommodation categories.

Example:

| Category | Example |
|---|---|
| GENERAL | General Ward |
| SEMI_PRIVATE | Semi-Private |
| PRIVATE | Private Room |
| ICU | ICU |
| HDU | High Dependency Unit |
| ISOLATION | Isolation |
| OTHER | Hospital-configured category |

These are examples only.

The actual hospital administrator must be able to configure categories.

---

# 6. ACCOMMODATION CATEGORY MODEL

Suggested MongoDB model:

```javascript
AccommodationCategory
{
    name: String,
    code: String,
    description: String,

    categoryType: String,

    baseRateReference: Number,

    patientSelectable: Boolean,

    clinicallyRestricted: Boolean,

    active: Boolean,

    sortOrder: Number,

    createdAt: Date,
    updatedAt: Date
}
```

### Important

`baseRateReference` is only a reference/configuration value.

Billing remains the owner of financial calculation.

Do not duplicate invoice logic here.

---

# 7. WARD MODEL

Create:

```text
Ward
```

Suggested schema:

```javascript
{
    wardCode: String,
    wardName: String,

    floor: String,

    departmentId: ObjectId,

    wardType: String,

    accommodationCategoryId: ObjectId,

    genderPolicy: String,

    isolationSupported: Boolean,

    active: Boolean,

    description: String,

    createdAt: Date,
    updatedAt: Date
}
```

Example:

```text
Ward Code:
PW-01

Ward Name:
Private Wing

Floor:
3

Accommodation:
PRIVATE

Gender Policy:
ANY
```

---

# 8. ROOM MODEL

Where rooms are physically meaningful, create:

```javascript
Room
{
    roomNumber: String,
    wardId: ObjectId,

    roomType: String,

    accommodationCategoryId: ObjectId,

    capacity: Number,

    genderPolicy: String,

    isolationCapability: Boolean,

    active: Boolean,

    createdAt: Date,
    updatedAt: Date
}
```

A room may contain:

```text
1 bed
```

or:

```text
2 beds
```

or another configured capacity.

---

# 9. BED MODEL

The core entity is:

```text
Bed
```

Suggested schema:

```javascript
{
    bedCode: String,

    wardId: ObjectId,

    roomId: ObjectId,

    accommodationCategoryId: ObjectId,

    bedNumber: String,

    status: String,

    genderPolicy: String,

    isolationCapability: Boolean,

    equipmentCapabilities: [
        String
    ],

    clinicalCapabilities: [
        String
    ],

    accessibilityFeatures: [
        String
    ],

    currentAssignmentId: ObjectId,

    currentPatientId: ObjectId,

    currentAdmissionId: ObjectId,

    reservationId: ObjectId,

    maintenanceStatus: String,

    cleaningRequired: Boolean,

    active: Boolean,

    notes: String,

    createdAt: Date,
    updatedAt: Date
}
```

---

# 10. BED STATUS ENUM

Use controlled statuses.

```text
AVAILABLE
RESERVED
OCCUPIED
CLEANING_REQUIRED
MAINTENANCE
OUT_OF_SERVICE
BLOCKED
```

Do not allow arbitrary free-text status values.

---

# 11. BED STATE MACHINE

The implementation must enforce valid state transitions.

Primary lifecycle:

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

Out of service:

```text
AVAILABLE
    ↓
OUT_OF_SERVICE
```

and after authorized resolution:

```text
OUT_OF_SERVICE
    ↓
AVAILABLE
```

Blocked:

```text
AVAILABLE
    ↓
BLOCKED
    ↓
AVAILABLE
```

---

# 12. INVALID TRANSITIONS

The API must reject invalid transitions.

Example:

```text
OCCUPIED → AVAILABLE
```

must not be allowed when cleaning is required.

Instead:

```text
OCCUPIED
→ CLEANING_REQUIRED
→ AVAILABLE
```

Similarly:

```text
MAINTENANCE → OCCUPIED
```

must be rejected.

---

# 13. BED ASSIGNMENT MODEL

Create:

```text
BedAssignment
```

Suggested schema:

```javascript
{
    bedId: ObjectId,

    patientId: ObjectId,

    admissionId: ObjectId,

    visitId: ObjectId,

    assignedAt: Date,

    releasedAt: Date,

    assignmentType: String,

    status: String,

    assignedByUserId: ObjectId,

    releaseReason: String,

    source: String,

    correlationId: String,

    createdAt: Date,
    updatedAt: Date
}
```

Possible assignment types:

```text
INITIAL_ADMISSION
TRANSFER
TEMPORARY
EMERGENCY
OTHER
```

---

# 14. BED RESERVATION MODEL

Create:

```text
BedReservation
```

Suggested schema:

```javascript
{
    bedId: ObjectId,

    patientId: ObjectId,

    admissionId: ObjectId,

    reservationReason: String,

    reservedAt: Date,

    expiresAt: Date,

    status: String,

    createdByUserId: ObjectId,

    correlationId: String,

    createdAt: Date,
    updatedAt: Date
}
```

Statuses:

```text
ACTIVE
EXPIRED
CONVERTED
CANCELLED
```

---

# 15. RESERVATION EXPIRATION

A reserved bed cannot remain reserved indefinitely.

The hospital configuration must determine the reservation duration.

Example:

```text
Reservation created:
10:00

Expiration:
10:30
```

When expired:

```text
RESERVED
→ AVAILABLE
```

only if:

- no active assignment exists
- no other valid hold exists
- no maintenance/cleaning condition exists

Expired reservations must be recorded in history.

---

# 16. BED STATUS HISTORY

Create:

```text
BedStatusHistory
```

Suggested fields:

```javascript
{
    bedId: ObjectId,

    previousStatus: String,

    newStatus: String,

    reason: String,

    referenceType: String,

    referenceId: ObjectId,

    changedByUserId: ObjectId,

    source: String,

    correlationId: String,

    timestamp: Date
}
```

Every important status change must be auditable.

---

# 17. BED COMPATIBILITY

The system must support configurable compatibility filtering.

Potential attributes:

```text
Accommodation category
Gender policy
Isolation capability
Equipment
Clinical capabilities
Accessibility
Ward restrictions
Configured hospital rules
```

Example:

```text
Requirement:
Isolation required = YES

Candidate Bed:
Isolation capability = YES
```

Suitable.

Example:

```text
Requirement:
Isolation required = YES

Candidate Bed:
Isolation capability = NO
```

Not suitable.

The system must not infer clinical requirements itself.

---

# 18. GENDER/OCCUPANCY RULE

Beds/rooms/wards may have configured policies:

```text
ANY
MALE_ONLY
FEMALE_ONLY
SINGLE_OCCUPANCY
```

The actual hospital policy must be configurable.

If the patient's placement conflicts with the configured rule:

```text
DO NOT ASSIGN
```

Create an exception or request staff review.

---

# 19. PATIENT ACCOMMODATION REQUEST

The Admission workflow may contain:

```javascript
accommodationPreference
```

Example:

```json
{
    "categoryId": "PRIVATE",
    "source": "PATIENT",
    "requestedAt": "2026-10-06T08:30:00Z"
}
```

This is a preference/request.

It does not reserve a physical bed.

---

# 20. CLINICAL REQUIREMENT REFERENCE

Admission may send a structured requirement.

Example:

```json
{
    "requiredCategory": "ICU",
    "isolationRequired": false,
    "requiredCapabilities": [
        "OXYGEN_SUPPORT"
    ]
}
```

Bed Management consumes this as a constraint.

It does not create the requirement.

---

# 21. BED SEARCH ALGORITHM

Implement a deterministic bed search service.

Input:

```text
patientId
admissionId
clinicalRequirement
accommodationPreference
gender
```

The service should:

### Step 1

Retrieve active beds.

### Step 2

Remove:

```text
MAINTENANCE
OUT_OF_SERVICE
BLOCKED
CLEANING_REQUIRED
OCCUPIED
```

### Step 3

Apply clinical requirements.

### Step 4

Apply mandatory hospital compatibility rules.

### Step 5

Apply accommodation preference.

### Step 6

Return suitable beds.

Example:

```text
Clinical Requirement:
GENERAL

Patient Preference:
PRIVATE
```

Search:

```text
PRIVATE + compatible + AVAILABLE
```

If unavailable:

```text
DO NOT automatically select GENERAL
```

Return:

```text
NO_PRIVATE_BED_AVAILABLE
```

with alternatives.

---

# 22. SEARCH RESULT STRUCTURE

The backend should return something similar to:

```json
{
    "status": "SUCCESS",
    "requestedCategory": "PRIVATE",
    "clinicalRequirementSatisfied": true,
    "availableCount": 3,
    "beds": [
        {
            "bedId": "BED-P-01",
            "ward": "Private Wing",
            "room": "P-01",
            "category": "PRIVATE"
        }
    ]
}
```

If unavailable:

```json
{
    "status": "CATEGORY_UNAVAILABLE",
    "requestedCategory": "PRIVATE",
    "availableCount": 0,
    "alternatives": [],
    "requiresStaffAction": true
}
```

---

# 23. AUTO-ASSIGNMENT

Automatic physical bed assignment is allowed only when:

1. The clinical requirement is already authorized.
2. The bed satisfies all mandatory compatibility rules.
3. The accommodation category is permitted.
4. Hospital policy allows automatic assignment.
5. There is no ambiguity.
6. Exactly one suitable bed is selected according to a configured deterministic rule.
7. The operation is concurrency-safe.

Possible configured selection rules:

```text
FIRST_AVAILABLE
LOWEST_BED_NUMBER
WARD_PRIORITY
ROOM_PRIORITY
EARLIEST_AVAILABLE
```

The exact rule must be configurable.

---

# 24. MULTIPLE SUITABLE BEDS

If multiple beds are suitable, the system may:

### Option A

Automatically choose using an approved configured rule.

OR

### Option B

Show:

```text
3 suitable beds found
```

and request staff confirmation.

The system must not invent a preference.

---

# 25. BED RESERVATION WORKFLOW

When a bed is selected:

```text
Search
  ↓
Validate
  ↓
Reserve
  ↓
Confirm admission assignment
```

Reservation must be atomic.

Example:

```text
BED-P-03
AVAILABLE
```

becomes:

```text
BED-P-03
RESERVED
```

Then the admission process confirms:

```text
RESERVED
→ OCCUPIED
```

---

# 26. CONCURRENCY REQUIREMENT

Two users/RPA workers may attempt to reserve the same bed.

Example:

```text
Receptionist A → BED-P-03
Receptionist B → BED-P-03
```

Only one operation may succeed.

The second must receive:

```text
BED_NO_LONGER_AVAILABLE
```

and refresh availability.

Do not rely only on frontend availability.

The backend/database must enforce this.

---

# 27. INITIAL ADMISSION ASSIGNMENT

Workflow:

```text
Admission Approved
        ↓
Bed Search
        ↓
Suitable Bed Found
        ↓
Reserve Bed
        ↓
Confirm Assignment
        ↓
Create BedAssignment
        ↓
Bed = OCCUPIED
        ↓
Update Admission
        ↓
Notify
```

Admission remains the owner of the admission episode.

Bed Management remains the owner of physical bed state.

---

# 28. BED TRANSFER

A transfer means moving a patient from one physical bed to another.

Example:

```text
BED-G-12
    ↓
BED-S-04
```

Workflow:

```text
Transfer Request
      ↓
Validate Patient/Admission
      ↓
Check New Bed
      ↓
Apply Compatibility Rules
      ↓
Reserve New Bed
      ↓
Confirm Transfer
      ↓
New Bed = OCCUPIED
      ↓
Old Bed = CLEANING_REQUIRED
      ↓
Close Old Assignment
      ↓
Create New Assignment
      ↓
Update Admission
      ↓
Notify Housekeeping
      ↓
Notify Relevant Users
```

---

# 29. TRANSFER SAFETY

Never release the old bed before successfully securing the new bed.

Incorrect:

```text
Old bed released
     ↓
New bed unavailable
```

Correct:

```text
New bed secured
     ↓
Transfer confirmed
     ↓
Old bed released
```

This prevents the patient from losing their existing assignment due to a failed transfer.

---

# 30. TRANSFER FAILURE

If the new bed reservation fails:

```text
Old bed remains OCCUPIED
```

and the system creates an exception:

```text
BED_TRANSFER_FAILED
```

Notify the authorized staff member.

---

# 31. DISCHARGE BED RELEASE

When Discharge Processing confirms administrative discharge completion:

```text
OCCUPIED
     ↓
CLEANING_REQUIRED
```

Create housekeeping task:

```text
CLEAN_BED
```

The bed must remain unavailable until required cleaning is completed.

---

# 32. HOUSEKEEPING INTEGRATION

Bed Management creates or triggers a housekeeping request.

Example:

```json
{
    "taskType": "BED_CLEANING",
    "bedId": "BED-P-03",
    "roomId": "P-03",
    "wardId": "PRIVATE-WING",
    "trigger": "DISCHARGE"
}
```

Housekeeping updates the task.

When verified:

```text
CLEANING_REQUIRED
→ AVAILABLE
```

Only authorized housekeeping workflow/system rules can complete the cleaning state.

---

# 33. MAINTENANCE INTEGRATION

A bed may be unavailable due to maintenance.

Workflow:

```text
AVAILABLE
    ↓
MAINTENANCE
```

Maintenance completes the work:

```text
MAINTENANCE
    ↓
AVAILABLE
```

If unsafe:

```text
MAINTENANCE
    ↓
OUT_OF_SERVICE
```

Bed Management receives the final state.

---

# 34. MAINTENANCE MUST NOT HAPPEN ON OCCUPIED BEDS

The system must reject:

```text
OCCUPIED → MAINTENANCE
```

unless an authorized emergency safety workflow explicitly exists.

Do not invent such an emergency workflow.

If an occupied bed has a safety issue, create an exception for authorized staff.

---

# 35. BED BLOCKING

Authorized staff may temporarily block a bed.

Reasons may include:

```text
Renovation
Administrative hold
Room preparation
Operational restriction
Other configured reason
```

Example:

```text
AVAILABLE
→ BLOCKED
```

The system must require:

- reason
- user
- timestamp
- expected release if applicable

---

# 36. BED AVAILABILITY DASHBOARD

Create an operational dashboard.

Display:

```text
Total Beds
Available
Reserved
Occupied
Cleaning Required
Maintenance
Blocked
Out of Service
```

Example:

```text
Total Beds:           250
Available:             72
Reserved:              10
Occupied:             142
Cleaning Required:     12
Maintenance:            7
Blocked:                4
Out of Service:          3
```

---

# 37. AVAILABILITY BY CATEGORY

Display:

| Category | Total | Available | Occupied |
|---|---:|---:|---:|
| General | 120 | 35 | 70 |
| Semi-Private | 60 | 18 | 37 |
| Private | 40 | 10 | 25 |
| ICU | 20 | 5 | 13 |
| Other | 10 | 4 | 7 |

Numbers are demo examples only.

---

# 38. AVAILABILITY BY WARD

Example:

```text
Private Wing
Available: 10
Occupied: 25

General Ward A
Available: 20
Occupied: 50

ICU
Available: 5
Occupied: 13
```

Provide filters:

- Ward
- Category
- Floor
- Status
- Gender policy
- Capability
- Date/time where historical reporting is required

---

# 39. BED MAP / VISUAL VIEW

The frontend should provide an optional visual bed map.

Example:

```text
PRIVATE WING

Room P-01
[ BED-P-01 ] AVAILABLE

Room P-02
[ BED-P-02 ] OCCUPIED

Room P-03
[ BED-P-03 ] CLEANING

Room P-04
[ BED-P-04 ] MAINTENANCE
```

Use clear status indicators.

Do not depend solely on colors.

Each bed should also display textual status.

---

# 40. RECEPTION / ADMISSION DESK VIEW

Authorized staff should be able to:

- search patient
- view admission
- search available beds
- filter by category
- filter by ward
- view compatibility
- reserve
- assign
- release
- initiate transfer
- view reservation expiration
- view exceptions

The UI must clearly show:

```text
Requested Category
Clinical Requirement
Actual Assigned Category
Actual Bed
```

---

# 41. PATIENT VIEW

Patients should NOT receive unrestricted bed inventory access.

Where appropriate, patient/authorized representative may see:

```text
Requested Accommodation
Current Assigned Accommodation
Ward/Room information
Bed assignment
```

If hospital policy permits accommodation selection, patient sees categories such as:

```text
General Ward
Semi-Private
Private Room
```

not a full internal operational bed list.

---

# 42. DOCTOR/CLINICAL VIEW

Authorized clinical staff may view:

```text
Current bed
Required placement
Relevant compatibility information
Transfer status
```

Clinical staff are responsible for clinical requirements.

Bed Management should not ask doctors to operate inventory unless required by the workflow.

---

# 43. MANAGEMENT VIEW

Management dashboard may show:

- occupancy
- availability
- utilization
- category demand
- ward occupancy
- transfer volume
- average time in cleaning
- maintenance downtime
- blocked beds
- out-of-service beds
- reservation conversion
- waiting list references

---

# 44. WAITING LIST INTEGRATION

Bed Management should support a reference to a waiting list.

When requested category is unavailable:

```text
PRIVATE
Available = 0
```

System may offer:

```text
Add to waiting list
```

The waiting-list record should contain enough information to reconnect to the Admission/Patient workflow.

Do not create an unrelated independent patient queue.

Suggested fields:

```javascript
{
    patientId,
    admissionId,
    requestedCategoryId,
    clinicalRequirementReference,
    priorityReference,
    status,
    createdAt,
    expiresAt,
    correlationId
}
```

Bed Management must not determine clinical priority.

---

# 45. WAITING LIST STATUS

Example:

```text
WAITING
OFFERED
ACCEPTED
DECLINED
EXPIRED
CANCELLED
FULFILLED
```

---

# 46. BILLING INTEGRATION

Bed Management must expose actual assignment information.

Example:

```json
{
    "patientId": "P10045",
    "admissionId": "ADM10023",
    "bedId": "BED-P-03",
    "category": "PRIVATE",
    "assignedAt": "2026-10-06T10:30:00Z"
}
```

Billing uses this information to calculate room/accommodation charges according to configured billing rules.

Bed Management does NOT:

- generate invoices
- apply discounts
- calculate insurance coverage
- process payments
- approve financial adjustments

---

# 47. ROOM CHARGE HISTORY SUPPORT

For patients transferred between accommodations, maintain assignment history.

Example:

```text
Oct 01 – Oct 03
General Ward

Oct 03 – Oct 05
Semi-Private

Oct 05 – Oct 08
Private
```

Billing can use these periods to calculate charges.

Therefore every assignment must have:

```text
assignedAt
releasedAt
```

and must never be overwritten destructively.

---

# 48. REST API DESIGN

Implement routes under:

```text
/api/beds
/api/wards
/api/rooms
/api/accommodation-categories
/api/bed-reservations
/api/bed-assignments
/api/bed-transfers
```

---

# 49. ACCOMMODATION APIs

### GET categories

```http
GET /api/accommodation-categories
```

### Create category

```http
POST /api/accommodation-categories
```

### Update category

```http
PATCH /api/accommodation-categories/:id
```

### Deactivate category

```http
PATCH /api/accommodation-categories/:id/status
```

---

# 50. WARD APIs

```http
GET /api/wards
GET /api/wards/:id
POST /api/wards
PATCH /api/wards/:id
```

Support filters:

```text
active
category
floor
wardType
```

---

# 51. ROOM APIs

```http
GET /api/rooms
GET /api/rooms/:id
POST /api/rooms
PATCH /api/rooms/:id
```

---

# 52. BED APIs

```http
GET /api/beds
GET /api/beds/:id
POST /api/beds
PATCH /api/beds/:id
```

Filters:

```text
ward
room
category
status
genderPolicy
isolationCapability
active
```

---

# 53. BED SEARCH API

```http
POST /api/beds/search
```

Request:

```json
{
    "patientId": "P10045",
    "admissionId": "ADM10023",
    "clinicalRequirement": {
        "requiredCategory": "PRIVATE",
        "isolationRequired": false
    },
    "accommodationPreference": {
        "category": "PRIVATE"
    }
}
```

Response:

```json
{
    "success": true,
    "availableCount": 2,
    "beds": []
}
```

---

# 54. RESERVE BED API

```http
POST /api/bed-reservations
```

Request:

```json
{
    "bedId": "BED-P-03",
    "patientId": "P10045",
    "admissionId": "ADM10023",
    "reservationReason": "INITIAL_ADMISSION"
}
```

Backend must revalidate availability.

Never trust frontend availability.

---

# 55. CONFIRM ASSIGNMENT API

```http
POST /api/bed-assignments
```

Request:

```json
{
    "bedId": "BED-P-03",
    "patientId": "P10045",
    "admissionId": "ADM10023",
    "assignmentType": "INITIAL_ADMISSION"
}
```

The operation must:

1. Validate reservation.
2. Validate bed state.
3. Validate patient/admission.
4. Create assignment.
5. Update bed.
6. Update admission reference.
7. Record audit.
8. Emit event.
9. Notify required parties.

---

# 56. RELEASE BED API

```http
POST /api/beds/:id/release
```

Do not immediately make the bed available when cleaning is required.

Response:

```json
{
    "status": "CLEANING_REQUIRED",
    "housekeepingTaskCreated": true
}
```

---

# 57. TRANSFER API

```http
POST /api/bed-transfers
```

Request:

```json
{
    "patientId": "P10045",
    "admissionId": "ADM10023",
    "fromBedId": "BED-G-12",
    "toBedId": "BED-P-03",
    "reason": "APPROVED_TRANSFER"
}
```

---

# 58. BED STATUS API

```http
PATCH /api/beds/:id/status
```

This endpoint must enforce:

- RBAC
- valid state transitions
- reason requirement
- audit
- concurrency
- status history

---

# 59. BED AVAILABILITY API

```http
GET /api/beds/availability
```

Response should provide summary and detailed data.

Example:

```json
{
    "summary": {
        "total": 250,
        "available": 72,
        "reserved": 10,
        "occupied": 142,
        "cleaningRequired": 12,
        "maintenance": 7
    }
}
```

---

# 60. FRONTEND ROUTES

Implement routes such as:

```text
/beds
/beds/dashboard
/beds/availability
/beds/:id
/beds/reservations
/beds/assignments
/beds/transfers
/beds/wards
/beds/rooms
/beds/categories
```

Restrict access using RBAC.

---

# 61. BED DASHBOARD COMPONENTS

Create reusable components:

```text
BedSummaryCards
BedAvailabilityTable
WardOccupancyTable
CategoryAvailabilityTable
BedMap
BedStatusBadge
BedFilterPanel
BedSearchResults
ReservationPanel
AssignmentPanel
TransferPanel
BedHistoryTimeline
```

---

# 62. BED DETAILS PAGE

Display:

```text
Bed ID
Ward
Room
Category
Current Status
Gender Policy
Isolation Capability
Equipment
Current Patient
Current Admission
Reservation
Maintenance Information
Cleaning Status
Status History
Assignment History
```

---

# 63. RESERVATION UI

Display:

```text
Bed
Patient
Admission
Reserved At
Expires At
Reason
Status
```

Actions:

```text
Confirm Assignment
Cancel Reservation
```

Only authorized users may perform these actions.

---

# 64. TRANSFER UI

The transfer screen should display:

```text
Patient
Admission
Current Bed
Current Category

Requested/New Requirement

Available Compatible Beds

Transfer Reason
```

The user must explicitly confirm the transfer where staff confirmation is required.

---

# 65. RPA ROLE

Robot Framework acts as an automation worker.

It must NOT become a second bed database.

Architecture:

```text
MERN Application
      ↓
REST API
      ↓
Bed Management
      ↓
RPA Job
      ↓
Legacy Hospital System / External System
      ↓
Verification
      ↓
MERN Update
```

---

# 66. BED MANAGEMENT RPA WORKFLOW

Use the standard automation pattern:

```text
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

# 67. RPA — BED AVAILABILITY SYNCHRONIZATION

If an external/legacy hospital system contains bed inventory:

```text
Scheduled RPA Job
      ↓
Login
      ↓
Navigate to Bed Management
      ↓
Read ward/room/bed data
      ↓
Extract statuses
      ↓
Validate records
      ↓
Compare with MERN
      ↓
Identify differences
      ↓
Update authorized records
      ↓
Verify
      ↓
Log results
```

---

# 68. RPA — BED ASSIGNMENT

If a legacy system requires browser automation:

```text
MERN Admission
      ↓
Bed assigned in authoritative workflow
      ↓
Create RPA Job
      ↓
Robot logs into legacy system
      ↓
Find patient/admission
      ↓
Select assigned bed
      ↓
Save
      ↓
Read confirmation
      ↓
Verify bed
      ↓
Update RPA Job
```

If the legacy system reports failure:

```text
Do not silently mark synchronization successful.
```

Create:

```text
RPA Exception
```

---

# 69. RPA — BED RELEASE

After discharge:

```text
Discharge event
      ↓
Bed becomes CLEANING_REQUIRED
      ↓
Housekeeping workflow
      ↓
Cleaning completed
      ↓
Bed becomes AVAILABLE
      ↓
RPA syncs external system if required
```

---

# 70. RPA — BED TRANSFER

Robot may:

```text
Read approved transfer
↓
Open legacy system
↓
Locate patient
↓
Change bed
↓
Save
↓
Verify new bed
↓
Verify old bed release
↓
Update job
```

RPA must never invent a destination bed.

---

# 71. RPA — RECONCILIATION

Run scheduled reconciliation between:

```text
MERN Bed State
```

and:

```text
Legacy Bed State
```

Example:

```text
MERN:
BED-P-03 = OCCUPIED

Legacy:
BED-P-03 = AVAILABLE
```

This is a critical mismatch.

Do not blindly overwrite the MERN state.

Create:

```text
BED_STATE_MISMATCH
```

and route for authorized review according to configured policy.

---

# 72. RPA EXCEPTION CASES

Create exception records for:

```text
BED_NOT_FOUND
BED_ALREADY_OCCUPIED
BED_ALREADY_RESERVED
LEGACY_SYSTEM_UNAVAILABLE
LOGIN_FAILURE
SESSION_TIMEOUT
STATUS_MISMATCH
PATIENT_NOT_FOUND
ADMISSION_NOT_FOUND
INVALID_BED_DATA
DUPLICATE_ASSIGNMENT
TRANSFER_FAILURE
HOUSEKEEPING_SYNC_FAILURE
MAINTENANCE_SYNC_FAILURE
```

---

# 73. HUMAN-IN-THE-LOOP

If the system cannot safely determine the correct action:

```text
Exception
    ↓
Human Review
    ↓
Approved Decision
    ↓
RPA Continues
```

Never force the RPA to guess.

---

# 74. ROBOT FRAMEWORK STRUCTURE

Use:

```text
robot/
├── resources/
│   ├── common.resource
│   ├── api.resource
│   ├── auth.resource
│   ├── bed.resource
│   ├── admission.resource
│   ├── housekeeping.resource
│   └── notification.resource
│
├── keywords/
│   ├── bed_keywords.resource
│   ├── reservation_keywords.resource
│   ├── assignment_keywords.resource
│   ├── transfer_keywords.resource
│   ├── reconciliation_keywords.resource
│   └── exception_keywords.resource
│
├── tests/
│   ├── bed_availability.robot
│   ├── bed_reservation.robot
│   ├── bed_assignment.robot
│   ├── bed_release.robot
│   ├── bed_transfer.robot
│   ├── bed_reconciliation.robot
│   └── bed_rpa_exception.robot
│
├── portals/
│   └── legacy_hospital/
│
└── results/
```

---

# 75. ROBOT KEYWORDS

Implement reusable keywords such as:

```text
Login To Hospital System
Search Patient
Search Admission
Read Bed Status
Search Available Beds
Reserve Bed
Assign Bed
Release Bed
Transfer Patient Bed
Verify Bed Assignment
Verify Bed Release
Create Bed Exception
Update RPA Job
Capture Evidence
Logout From Hospital System
```

---

# 76. RPA JOB MODEL

Use the existing centralized:

```text
RPAJob
```

with module metadata:

```javascript
{
    jobType: "BED_ASSIGNMENT",

    module: "BED_MANAGEMENT",

    correlationId: String,

    referenceType: String,

    referenceId: ObjectId,

    status: String,

    attempts: Number,

    startedAt: Date,

    completedAt: Date,

    errorCode: String,

    errorMessage: String,

    evidenceLocation: String,

    createdAt: Date,
    updatedAt: Date
}
```

---

# 77. RPA JOB STATUSES

Use controlled values:

```text
QUEUED
RUNNING
SUCCEEDED
FAILED
RETRYING
WAITING_FOR_HUMAN
CANCELLED
```

---

# 78. NOTIFICATIONS

Integrate with the centralized Notification Service.

Potential events:

```text
BED_RESERVED
BED_ASSIGNED
BED_TRANSFERRED
BED_RELEASED
BED_CLEANING_REQUIRED
BED_AVAILABLE
BED_TRANSFER_FAILED
BED_ASSIGNMENT_EXCEPTION
```

Notifications may be sent to:

- Admission desk
- Authorized clinical staff
- Housekeeping
- Maintenance
- Patient, where appropriate
- Management, for configured alerts

Do not implement a separate notification engine inside Bed Management.

---

# 79. HOUSEKEEPING NOTIFICATION

When:

```text
OCCUPIED
→ CLEANING_REQUIRED
```

create the housekeeping task and notification.

Example:

```text
Bed P-03 requires cleaning after discharge.
```

---

# 80. PATIENT NOTIFICATION

Patient-facing notifications must not expose unnecessary internal information.

Example:

```text
Your accommodation has been assigned.
Please contact the admission desk for further assistance.
```

Actual content must be configurable through Notification Templates.

---

# 81. AUDIT LOGGING

Every important operation must create:

```text
AuditEvent
```

Examples:

```text
BED_CREATED
BED_UPDATED
BED_STATUS_CHANGED
BED_RESERVED
BED_ASSIGNMENT_CREATED
BED_ASSIGNMENT_RELEASED
BED_TRANSFER_CREATED
BED_TRANSFER_COMPLETED
BED_BLOCKED
BED_MAINTENANCE_STARTED
BED_MAINTENANCE_COMPLETED
BED_CLEANING_STARTED
BED_CLEANING_COMPLETED
BED_EXCEPTION_CREATED
```

Audit information:

```text
who
what
when
previous state
new state
reason
source
correlation ID
```

---

# 82. RBAC

At minimum support permissions such as:

```text
bed.view
bed.create
bed.update
bed.reserve
bed.assign
bed.release
bed.transfer
bed.block
bed.maintenance
bed.view_history
bed.manage_wards
bed.manage_rooms
bed.manage_categories
bed.reconcile
bed.rpa_manage
```

Example access:

### Receptionist

```text
bed.view
bed.search
bed.reserve
bed.assign
```

subject to hospital policy.

### Administrative Manager

```text
bed.view
bed.manage
bed.reports
```

### Housekeeping

```text
bed.view_limited
bed.cleaning.update
```

### Maintenance

```text
bed.maintenance
```

### Hospital Management

```text
bed.view
bed.reports
```

### System Admin

Full system permissions according to security policy.

Permissions must be configurable.

---

# 83. SECURITY

Implement:

- JWT authentication
- secure password hashing
- backend authorization
- role/permission checks
- input validation
- API rate limiting where appropriate
- audit logs
- secure secrets
- encrypted transport
- protected patient information
- least-privilege access

Never store:

- passwords
- insurer credentials
- external-system credentials

inside source code or Robot Framework files.

Use environment variables or a secret-management solution.

---

# 84. DATABASE INDEXES

Create indexes for common operations.

Suggested:

```javascript
Bed:
{ bedCode: 1 } unique
{ wardId: 1, status: 1 }
{ roomId: 1, status: 1 }
{ accommodationCategoryId: 1, status: 1 }
{ currentPatientId: 1 }
{ currentAdmissionId: 1 }
```

Reservation:

```javascript
{
    bedId: 1,
    status: 1
}
```

Assignment:

```javascript
{
    bedId: 1,
    status: 1
}

{
    patientId: 1,
    admissionId: 1,
    status: 1
}
```

History:

```javascript
{
    bedId: 1,
    timestamp: -1
}
```

Use partial/compound indexes where appropriate to prevent multiple active assignments.

---

# 85. IDEMPOTENCY

Bed assignment APIs must support idempotency.

Example:

```text
Idempotency-Key:
BED-ASSIGN-ADM10023-20261006
```

If the same request is retried:

```text
DO NOT create another assignment.
```

Return the existing result.

This is especially important for RPA retries.

---

# 86. CONCURRENCY

Protect against:

```text
Two receptionists
Two RPA workers
User + RPA
Multiple admission processes
```

attempting to assign the same bed.

Backend must perform a fresh availability check during mutation.

Frontend state alone is insufficient.

---

# 87. EVENT-DRIVEN INTEGRATION

Emit application events such as:

```text
bed.reserved
bed.assigned
bed.transfer.completed
bed.release.requested
bed.cleaning.required
bed.cleaning.completed
bed.maintenance.started
bed.maintenance.completed
```

Other modules can consume these events.

Do not duplicate their business logic inside Bed Management.

---

# 88. ADMISSION INTEGRATION

Admission sends:

```text
Patient ID
Admission ID
Clinical requirement reference
Accommodation preference
```

Bed Management returns:

```text
Bed ID
Ward
Room
Actual category
Assignment ID
Assignment timestamp
```

---

# 89. DISCHARGE INTEGRATION

Discharge sends:

```text
Admission ID
Patient ID
Discharge confirmation
```

Bed Management:

```text
Find active assignment
→ close assignment
→ set bed CLEANING_REQUIRED
→ create housekeeping task
```

---

# 90. HOUSEKEEPING INTEGRATION

Housekeeping returns:

```text
Cleaning completed
```

Bed Management validates:

```text
Bed is CLEANING_REQUIRED
```

then:

```text
CLEANING_REQUIRED → AVAILABLE
```

---

# 91. MAINTENANCE INTEGRATION

Maintenance may request:

```text
Take bed out of service
```

Bed Management verifies:

```text
No active patient assignment
```

and updates state.

If occupied:

```text
Exception / authorized review
```

---

# 92. REPORTS

Provide reports including:

### Daily Bed Availability

```text
Ward
Category
Total
Available
Occupied
Reserved
Cleaning
Maintenance
Out of Service
```

### Occupancy Report

```text
Date
Ward
Category
Occupied
Total
Occupancy %
```

### Bed Turnaround Report

Measure:

```text
Discharge
→ Cleaning Started
→ Cleaning Completed
→ Available
```

### Transfer Report

```text
Patient
Admission
Old Bed
New Bed
Reason
Time
```

### Maintenance Downtime

```text
Bed
Start
End
Duration
Reason
```

---

# 93. ANALYTICS

Management analytics may include:

```text
Occupancy Rate
Available Bed Rate
Bed Utilization
Average Cleaning Time
Average Reservation Time
Reservation Conversion Rate
Transfer Volume
Maintenance Downtime
Out-of-Service Rate
Category Demand
Ward Demand
```

Use configurable date ranges.

---

# 94. EXPORTS

Authorized users should be able to export:

```text
CSV
Excel-compatible data
PDF reports
```

depending on the existing Reports & Analytics implementation.

Exports must respect RBAC and patient-data access restrictions.

---

# 95. SEED DATA

Create realistic demo data.

Example categories:

```text
General Ward
Semi-Private
Private Room
ICU
Isolation
```

Example wards:

```text
General Ward A
General Ward B
Private Wing
ICU
Isolation Ward
```

Example beds:

```text
BED-G-01
BED-G-02
BED-G-03

BED-S-01
BED-S-02

BED-P-01
BED-P-02
BED-P-03

BED-ICU-01
BED-ICU-02

BED-ISO-01
```

Seed multiple states:

```text
AVAILABLE
RESERVED
OCCUPIED
CLEANING_REQUIRED
MAINTENANCE
OUT_OF_SERVICE
BLOCKED
```

This is required for testing dashboards.

---

# 96. DEMO SCENARIO

Create a demonstration scenario:

```text
Patient:
Rahul Shah

Patient ID:
P10045

Admission:
ADM10023

Preference:
Private Room
```

Available beds:

```text
BED-P-01 → OCCUPIED
BED-P-02 → AVAILABLE
BED-P-03 → AVAILABLE
```

Search returns:

```text
2 suitable beds
```

If hospital configuration allows automatic selection:

```text
BED-P-02
```

may be selected using the configured deterministic rule.

Otherwise show both to authorized staff.

After assignment:

```text
BED-P-02
AVAILABLE → RESERVED → OCCUPIED
```

---

# 97. DEMO TRANSFER

Patient:

```text
P10045
```

Current:

```text
BED-P-02
```

Transfer request:

```text
BED-P-04
```

Workflow:

```text
Check BED-P-04
      ↓
Reserve BED-P-04
      ↓
Confirm transfer
      ↓
BED-P-04 = OCCUPIED
      ↓
BED-P-02 = CLEANING_REQUIRED
      ↓
Housekeeping task
```

After cleaning:

```text
BED-P-02 = AVAILABLE
```

---

# 98. DEMO DISCHARGE

Patient:

```text
P10045
```

Current:

```text
BED-P-04
```

Discharge completed:

```text
BED-P-04
OCCUPIED
   ↓
CLEANING_REQUIRED
```

Housekeeping:

```text
Cleaning Started
   ↓
Cleaning Completed
   ↓
BED-P-04 AVAILABLE
```

---

# 99. VALIDATION RULES

Implement backend validation for:

### Bed code

Required and unique.

### Ward

Required.

### Accommodation category

Required.

### Status

Must be valid enum.

### Assignment

Patient and admission must exist.

### Reservation

Bed must be available.

### Transfer

Source and destination must be different.

### Transfer destination

Must satisfy mandatory compatibility.

### Release

Only active assignment can be released.

### Maintenance

Cannot normally transition an occupied bed directly to maintenance.

---

# 100. ERROR RESPONSE FORMAT

Use consistent API errors.

Example:

```json
{
    "success": false,
    "error": {
        "code": "BED_NO_LONGER_AVAILABLE",
        "message": "The selected bed is no longer available.",
        "correlationId": "CORR-20261006-00125"
    }
}
```

Use appropriate HTTP statuses:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

---

# 101. EXCEPTION MANAGEMENT

All important exceptions must be traceable.

Create/use:

```text
ExceptionCase
```

Example:

```javascript
{
    exceptionType: "BED_STATE_MISMATCH",

    module: "BED_MANAGEMENT",

    severity: "HIGH",

    referenceType: "BED",

    referenceId: ObjectId,

    description: String,

    status: "OPEN",

    assignedTo: ObjectId,

    correlationId: String,

    createdAt: Date,
    resolvedAt: Date
}
```

---

# 102. EXCEPTION STATUSES

```text
OPEN
UNDER_REVIEW
WAITING_FOR_INFORMATION
RESOLVED
CLOSED
CANCELLED
```

---

# 103. IMPORTANT EXCEPTION EXAMPLES

### Example 1

MERN:

```text
BED-P-03 = OCCUPIED
```

Legacy:

```text
BED-P-03 = AVAILABLE
```

Create:

```text
BED_STATE_MISMATCH
```

Do not automatically overwrite the authoritative state.

---

### Example 2

RPA tries to assign an already occupied bed.

Return:

```text
409 CONFLICT
```

Create an RPA failure/exception.

---

### Example 3

Private category unavailable.

Return:

```text
CATEGORY_UNAVAILABLE
```

Offer:

```text
Waiting list
Alternative accommodation
Admission desk review
```

Do not downgrade silently.

---

# 104. TESTING REQUIREMENTS

Implement unit, integration, API, UI and RPA tests.

---

# 105. UNIT TESTS

Test:

```text
Bed state transitions
Compatibility filtering
Category filtering
Gender rules
Reservation expiration
Assignment validation
Transfer validation
Release logic
Cleaning logic
Maintenance logic
```

---

# 106. API TESTS

Test:

```text
Create bed
Update bed
Search availability
Reserve bed
Assign bed
Release bed
Transfer bed
Change status
Get history
Get availability dashboard
```

---

# 107. CONCURRENCY TEST

Simulate:

```text
User A → Reserve BED-P-03
User B → Reserve BED-P-03
```

Expected:

```text
One succeeds
One receives conflict
```

There must never be two active reservations/assignments for the same physical bed.

---

# 108. RPA TESTS

Robot Framework tests should verify:

```text
Login
Read bed state
Search bed
Reserve
Assign
Verify
Release
Transfer
Reconcile
Exception handling
Retry
Evidence capture
```

---

# 109. FAILURE RECOVERY TEST

Simulate:

```text
Legacy system unavailable
```

Expected:

```text
RPA Job = FAILED/RETRYING
Exception created
No false success
No incorrect bed status
```

---

# 110. HOUSEKEEPING TEST

Scenario:

```text
Occupied
→ Discharge
→ Cleaning Required
→ Housekeeping Complete
→ Available
```

Verify every state transition.

---

# 111. MAINTENANCE TEST

Scenario:

```text
Available
→ Maintenance
→ Maintenance Complete
→ Available
```

Also verify:

```text
Occupied → Maintenance
```

is rejected unless an explicitly configured authorized safety workflow exists.

---

# 112. ACCEPTANCE CRITERIA

The module is accepted only when all of the following work.

### Bed inventory

- Wards can be created.
- Rooms can be created.
- Beds can be created.
- Accommodation categories can be configured.
- Bed attributes can be maintained.

### Availability

- Available beds can be searched.
- Search respects status.
- Search respects configured compatibility.
- Category filtering works.
- Ward filtering works.

### Assignment

- Beds can be reserved.
- Beds can be assigned.
- Duplicate assignment is prevented.
- Assignment history is retained.

### Reservation

- Reservation expiration works.
- Expired beds become available when safe.
- Reservation history is retained.

### Transfer

- Compatible destination beds can be selected.
- Destination is secured before releasing source.
- Old bed enters cleaning state when required.
- New bed becomes occupied.
- Admission is updated.

### Discharge

- Discharged patient's bed becomes cleaning-required.
- Housekeeping task is created.
- Bed becomes available only after required cleaning.

### Maintenance

- Maintenance state works.
- Maintenance beds are excluded from availability.
- Occupied beds are protected from normal maintenance transitions.

### Billing

- Actual assigned accommodation is exposed to Billing.
- Assignment history supports period-based billing.

### RPA

- Bed synchronization works.
- Assignment synchronization works.
- Transfer synchronization works.
- Release synchronization works.
- Reconciliation detects mismatches.
- Failures create traceable RPA jobs/exceptions.

### Security

- RBAC works.
- Unauthorized users cannot modify bed assignments.
- Audit logs are created.
- Sensitive information is protected.

---

# 113. END-TO-END ACCEPTANCE SCENARIO

The implementation agent must demonstrate this scenario.

```text
1. Create patient
        ↓
2. Create admission
        ↓
3. Admission approved
        ↓
4. Patient requests Private
        ↓
5. Bed Management searches Private beds
        ↓
6. Suitable bed found
        ↓
7. Bed reserved
        ↓
8. Bed assigned
        ↓
9. Admission updated
        ↓
10. Billing receives actual accommodation
        ↓
11. Patient transfers
        ↓
12. Destination bed reserved
        ↓
13. Destination occupied
        ↓
14. Old bed becomes CLEANING_REQUIRED
        ↓
15. Housekeeping completes cleaning
        ↓
16. Old bed becomes AVAILABLE
        ↓
17. Patient discharged
        ↓
18. Current bed becomes CLEANING_REQUIRED
        ↓
19. Housekeeping completes
        ↓
20. Bed becomes AVAILABLE
```

Every stage must be auditable.

---

# 114. IMPLEMENTATION ORDER

The AI coding agent should implement this module in the following order.

## Phase 1 — Database

Create:

```text
AccommodationCategory
Ward
Room
Bed
BedReservation
BedAssignment
BedStatusHistory
```

Add indexes and validation.

---

## Phase 2 — Backend Services

Implement:

```text
BedService
BedSearchService
BedReservationService
BedAssignmentService
BedTransferService
BedStatusService
BedAvailabilityService
BedReconciliationService
```

---

## Phase 3 — APIs

Implement all REST endpoints.

Add:

- validation
- authorization
- error handling
- correlation IDs
- idempotency
- audit logging

---

## Phase 4 — Admission Integration

Connect:

```text
Admission
↔
Bed Management
```

Do not duplicate bed logic in Admission.

---

## Phase 5 — Discharge Integration

Connect:

```text
Discharge
→
Bed Release
→
Housekeeping
```

---

## Phase 6 — Housekeeping Integration

Implement:

```text
Cleaning Required
→
Housekeeping Task
→
Cleaning Completed
→
Available
```

---

## Phase 7 — Maintenance Integration

Implement:

```text
Maintenance Request
→
Bed Unavailable
→
Maintenance Completed
→
Available
```

---

## Phase 8 — Billing Integration

Expose:

```text
Actual Accommodation
Assignment History
Assigned/Released timestamps
```

Billing remains responsible for financial calculations.

---

## Phase 9 — Frontend

Build:

```text
Dashboard
Availability
Bed Map
Bed Details
Reservations
Assignments
Transfers
Wards
Rooms
Categories
History
```

---

## Phase 10 — RPA

Implement:

```text
Availability Sync
Assignment Sync
Transfer Sync
Release Sync
Reconciliation
Exception Handling
```

---

## Phase 11 — Notifications

Connect centralized Notification Service.

---

## Phase 12 — Testing

Run:

```text
Unit Tests
API Tests
Integration Tests
Concurrency Tests
UI Tests
Robot Framework Tests
End-to-End Tests
```

---

# 115. DO NOT IMPLEMENT

The coding agent MUST NOT implement any of the following inside Bed Management:

```text
Medical diagnosis
Clinical decision making
ICU eligibility decision
Treatment decisions
Medication decisions
Discharge fitness decisions
Insurance approval
Insurance claim approval
Financial adjustment approval
Payment processing
Invoice calculation
Patient clinical priority determination
Unauthorized bed downgrade
Independent duplicate bed inventory
```

These belong to the appropriate modules/authorized personnel.

---

# 116. FINAL ARCHITECTURAL RULE

The final architecture must remain:

```text
                    ┌──────────────────────┐
                    │   React Frontend     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Express REST API   │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Bed Management      Admission       Discharge
              │
              ▼
          MongoDB
              │
              ├──────────────► Housekeeping
              │
              ├──────────────► Maintenance
              │
              ├──────────────► Billing
              │
              ├──────────────► Notifications
              │
              └──────────────► Reports
              
              ▲
              │
        Robot Framework
              │
              ▼
       Legacy/External Systems
```

Bed Management is the **authoritative source for physical bed inventory and bed status**.

Admission determines that an admission workflow requires accommodation.

Authorized clinical staff define clinical requirements.

The patient may express an accommodation preference where permitted.

Bed Management finds and manages the actual physical bed.

Billing uses the actual assignment to calculate applicable charges.

Housekeeping controls completion of required cleaning tasks.

Maintenance controls maintenance work.

Robot Framework automates repetitive administrative synchronization and legacy-system interaction.

**No component may silently override another module's ownership or business rules.**

---

# 117. DEFINITION OF DONE

`05_BED_MANAGEMENT.md` is considered fully implemented only when:

- [ ] Accommodation categories are configurable.
- [ ] Wards are configurable.
- [ ] Rooms are configurable.
- [ ] Physical beds are configurable.
- [ ] Bed capabilities are stored.
- [ ] Bed statuses are controlled.
- [ ] Valid state transitions are enforced.
- [ ] Bed reservations work.
- [ ] Reservation expiry works.
- [ ] Physical assignments work.
- [ ] Duplicate assignments are prevented.
- [ ] Bed search supports clinical requirements supplied by authorized users.
- [ ] Patient accommodation preferences are supported.
- [ ] Silent downgrade is impossible.
- [ ] Transfers work safely.
- [ ] Old bed is released only after successful destination assignment.
- [ ] Discharge triggers cleaning workflow.
- [ ] Housekeeping completion returns bed to availability.
- [ ] Maintenance states work.
- [ ] Billing receives actual accommodation assignment information.
- [ ] Assignment history is preserved.
- [ ] Availability dashboard works.
- [ ] Ward/category availability works.
- [ ] RBAC works.
- [ ] Audit logging works.
- [ ] Exception handling works.
- [ ] RPA job tracking works.
- [ ] Legacy synchronization works where configured.
- [ ] Reconciliation detects mismatches.
- [ ] Notifications work through the centralized service.
- [ ] Unit tests pass.
- [ ] API tests pass.
- [ ] Concurrency tests pass.
- [ ] Robot Framework tests pass.
- [ ] End-to-end admission → bed → transfer → discharge workflow passes.

---

# 118. FINAL INSTRUCTION TO THE AI CODING AGENT

Build this module as a **production-quality Bed Management subsystem**, not as a mock dashboard.

Implement:

```text
Database
+
Backend APIs
+
Business services
+
Validation
+
RBAC
+
Audit
+
Frontend UI
+
Admission integration
+
Discharge integration
+
Housekeeping integration
+
Maintenance integration
+
Billing integration
+
Notification integration
+
RPA integration
+
Robot Framework tests
+
Error handling
+
Concurrency protection
+
Seed data
+
Automated tests
```

Use the existing project architecture and existing shared services wherever available.

Do not create duplicate implementations of:

- authentication
- RBAC
- notifications
- document generation
- audit
- exception management
- RPA job management

Extend the existing shared infrastructure.

Most importantly:

> **Bed Management manages physical beds. It does not make clinical decisions.**

> **A patient selects an accommodation category, not a physical bed.**

> **Clinical requirements override accommodation preference.**

> **The system must never silently downgrade a clinically required placement.**

> **The actual physical assignment, not the requested preference, is the source used by Billing for accommodation charging.**

> **A bed cannot become AVAILABLE until all required release conditions, including cleaning, are completed.**

> **RPA automates the workflow but never guesses when a human decision is required.**