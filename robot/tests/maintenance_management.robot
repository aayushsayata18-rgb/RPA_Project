*** Settings ***
Documentation    Module 23: Maintenance Management RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/maintenance_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Maintenance Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${ASSET_ID}           ${EMPTY}
${ASSET_SERIAL}       ${EMPTY}
${CATEGORY_ID}        ${EMPTY}
${REQUEST_ID}         ${EMPTY}
${WORK_ORDER_ID}      ${EMPTY}
${PM_PLAN_ID}         ${EMPTY}
${CHECKLIST_ID}       ${EMPTY}
${PART_REQ_ID}        ${EMPTY}
${CONTRACT_ID}        ${EMPTY}
${EXCEPTION_ID}       ${EMPTY}

*** Keywords ***
Setup Maintenance Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    5    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}
    Set Suite Variable    ${ASSET_SERIAL}    SN-MNT-${rand}

*** Test Cases ***
TC-MNT-001 Asset Registration Tagging And Duplicate Prevention
    [Documentation]    Verifies asset master registration, auto-tag generation, and deduplication
    ${res}=    Create Asset Via API    ${AUTH_TOKEN}    Ventilator Unit ${RUN_ID}    ${ASSET_SERIAL}    model=Servo-U    manufacturer=Getinge    criticality=CRITICAL    riskClassification=HIGH
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=   Set Variable    ${res.json()}[data]
    Set Suite Variable    ${ASSET_ID}    ${data}[_id]
    Should Be Equal As Strings    ${data}[serialNumber]    ${ASSET_SERIAL}
    Should Be Equal As Strings    ${data}[status]    AVAILABLE
    Should Not Be Empty           ${data}[assetTag]

    # Attempting to register the same serial number must be rejected as duplicate
    ${dupRes}=    Create Asset Via API    ${AUTH_TOKEN}    Duplicate Ventilator ${RUN_ID}    ${ASSET_SERIAL}
    Should Be True    ${dupRes.status_code} == 400 or ${dupRes.status_code} == 409

TC-MNT-002 Asset Category Master Setup
    [Documentation]    Verifies category creation with risk classification and calibration requirement
    ${catCode}=    Set Variable    CAT-BIO-${RUN_ID}
    ${res}=        Create Asset Category Via API    ${AUTH_TOKEN}    ${catCode}    Life Support Equipment ${RUN_ID}    riskClassification=HIGH    calibrationRequired=${True}
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=       Set Variable    ${res.json()}[data]
    Set Suite Variable    ${CATEGORY_ID}    ${data}[_id]
    Should Not Be Empty    ${data}[categoryId]

TC-MNT-003 Maintenance Breakdown Request Lifecycle And SLA Triage
    [Documentation]    Verifies breakdown request submission, triage, priority escalation, and SLA calculation
    ${res}=    Create Maintenance Request Via API    ${AUTH_TOKEN}    ${ASSET_ID}    Display flickers intermittent    Screen blanks during mode change    priority=MEDIUM    requestType=BREAKDOWN
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=   Set Variable    ${res.json()}[data]
    Set Suite Variable    ${REQUEST_ID}    ${data}[_id]
    Should Be Equal As Strings    ${data}[status]    SUBMITTED

    ${triageRes}=    Triage Maintenance Request Via API    ${AUTH_TOKEN}    ${REQUEST_ID}    status=APPROVED    priority=HIGH    triageNotes=Escalated to High due to ICU criticality
    Should Be Equal As Integers    ${triageRes.status_code}    200
    Should Be Equal As Strings     ${triageRes.json()}[data][status]    APPROVED
    Should Be Equal As Strings     ${triageRes.json()}[data][priority]    HIGH

TC-MNT-004 Request Conversion To Work Order
    [Documentation]    Verifies converting approved maintenance request into a Work Order
    ${res}=    Convert Request To Work Order Via API    ${AUTH_TOKEN}    ${REQUEST_ID}    workOrderType=CORRECTIVE    priority=HIGH
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=   Set Variable    ${res.json()}[data]
    Set Suite Variable    ${WORK_ORDER_ID}    ${data}[_id]
    Should Be Equal As Strings    ${data}[status]    OPEN
    Should Be Equal As Strings    ${data}[maintenanceType]    CORRECTIVE

TC-MNT-005 Work Order Lifecycle Transitions
    [Documentation]    Verifies work order start, hold, and resume states
    # Start Work Order
    ${startRes}=    Start Work Order Via API    ${AUTH_TOKEN}    ${WORK_ORDER_ID}
    Should Be Equal As Integers    ${startRes.status_code}    200
    Should Be Equal As Strings     ${startRes.json()}[data][status]    IN_PROGRESS

    # Hold Work Order
    ${holdRes}=     Hold Work Order Via API    ${AUTH_TOKEN}    ${WORK_ORDER_ID}    holdReason=Waiting for PCB board
    Should Be Equal As Integers    ${holdRes.status_code}    200
    Should Be Equal As Strings     ${holdRes.json()}[data][status]    ON_HOLD

    # Resume Work Order
    ${resumeRes}=   Resume Work Order Via API    ${AUTH_TOKEN}    ${WORK_ORDER_ID}
    Should Be Equal As Integers    ${resumeRes.status_code}    200
    Should Be Equal As Strings     ${resumeRes.json()}[data][status]    IN_PROGRESS

TC-MNT-006 Safety Boundary Enforcement On Completion
    [Documentation]    CRITICAL SAFETY GATE: Completing work order must move asset to PENDING_INSPECTION and NOT immediately return to service
    ${compRes}=    Complete Work Order Via API    ${AUTH_TOKEN}    ${WORK_ORDER_ID}    completionSummary=Power supply replaced and calibrated    actualDurationMinutes=45
    Should Be Equal As Integers    ${compRes.status_code}    200
    Should Be Equal As Strings     ${compRes.json()}[data][status]    COMPLETED

    # Verify asset is PENDING_INSPECTION
    ${assetRes}=   Get Asset By Id Via API    ${AUTH_TOKEN}    ${ASSET_ID}
    Should Be Equal As Integers    ${assetRes.status_code}    200
    Should Be Equal As Strings     ${assetRes.json()}[data][status]    PENDING_INSPECTION

TC-MNT-007 Supervisor Verification And Asset Return To Service
    [Documentation]    Verifies authorized supervisor sign-off and deliberate asset return to service
    # Verify Work Order
    ${verifyRes}=    Verify Work Order Via API    ${AUTH_TOKEN}    ${WORK_ORDER_ID}    verified=${True}    verificationNotes=QA bio-safety electrical check passed
    Should Be Equal As Integers    ${verifyRes.status_code}    200
    Should Be Equal As Strings     ${verifyRes.json()}[data][verificationStatus]    VERIFIED

    # Close Work Order returning asset to ACTIVE
    ${closeRes}=     Close Work Order Via API    ${AUTH_TOKEN}    ${WORK_ORDER_ID}    assetReturnStatus=ACTIVE    closingNotes=Equipment safe for patient use
    Should Be Equal As Integers    ${closeRes.status_code}    200
    Should Be Equal As Strings     ${closeRes.json()}[data][status]    CLOSED

    # Verify asset is ACTIVE
    ${assetRes}=     Get Asset By Id Via API    ${AUTH_TOKEN}    ${ASSET_ID}
    Should Be Equal As Integers    ${assetRes.status_code}    200
    Should Be Equal As Strings     ${assetRes.json()}[data][status]    ACTIVE

TC-MNT-008 Preventive Maintenance Plan Setup And Cyclic Generation
    [Documentation]    Verifies PM plan scheduling and cyclic dispatch execution
    ${planRes}=    Create PM Plan Via API    ${AUTH_TOKEN}    ${ASSET_ID}    Monthly ICU Calibration PPM ${RUN_ID}    frequency=MONTHLY    intervalDays=30
    Should Be True    ${planRes.status_code} == 200 or ${planRes.status_code} == 201
    ${data}=       Set Variable    ${planRes.json()}[data]
    Set Suite Variable    ${PM_PLAN_ID}    ${data}[_id]
    Should Be True    ${data}[active]

    # Generate due PM work orders
    ${genRes}=     Generate Due PM Work Orders Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${genRes.status_code}    200

TC-MNT-009 Maintenance Checklist Master Configuration
    [Documentation]    Verifies checklist templates with mandatory procedural inspection steps
    ${code}=    Set Variable    CHK-ICU-${RUN_ID}
    ${res}=     Create Maintenance Checklist Via API    ${AUTH_TOKEN}    ${code}    ICU Ventilator Bio-safety Protocol ${RUN_ID}
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=    Set Variable    ${res.json()}[data]
    Set Suite Variable    ${CHECKLIST_ID}    ${data}[_id]
    Should Be Equal As Strings    ${data}[checklistId]    ${code}

TC-MNT-010 Spare Parts Requisition Approval And Issuance
    [Documentation]    Verifies spare parts request, supervisor approval, and inventory issuance
    ${reqRes}=    Create Part Request Via API    ${AUTH_TOKEN}    ${WORK_ORDER_ID}    O2 Sensor Cell    quantityRequested=2    unitCost=200
    Should Be True    ${reqRes.status_code} == 200 or ${reqRes.status_code} == 201
    ${data}=      Set Variable    ${reqRes.json()}[data]
    Set Suite Variable    ${PART_REQ_ID}    ${data}[_id]
    Should Be Equal As Strings    ${data}[status]    REQUESTED

    # Approve Part Request
    ${appRes}=    Approve Part Request Via API    ${AUTH_TOKEN}    ${PART_REQ_ID}
    Should Be Equal As Integers    ${appRes.status_code}    200
    Should Be Equal As Strings     ${appRes.json()}[data][status]    APPROVED

    # Issue Part Request
    ${issRes}=    Issue Part Request Via API    ${AUTH_TOKEN}    ${PART_REQ_ID}
    Should Be Equal As Integers    ${issRes.status_code}    200
    Should Be Equal As Strings     ${issRes.json()}[data][status]    ISSUED

TC-MNT-011 Service Contract AMC CMC Management
    [Documentation]    Verifies vendor service contract registration and asset coverage
    ${cNum}=    Set Variable    AMC-GETINGE-${RUN_ID}
    ${res}=     Create Service Contract Via API    ${AUTH_TOKEN}    ${cNum}    Annual Comprehensive Warranty ${RUN_ID}    contractType=AMC    annualCost=15000
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=    Set Variable    ${res.json()}[data]
    Set Suite Variable    ${CONTRACT_ID}    ${data}[_id]
    Should Be Equal As Strings    ${data}[contractNumber]    ${cNum}
    Should Be Equal As Strings    ${data}[status]    ACTIVE

TC-MNT-012 Biomedical Calibration Record And Maintenance Analytics
    [Documentation]    Verifies calibration certificate recording, tolerance validation, and maintenance dashboard KPIs
    ${certNum}=    Set Variable    CAL-${RUN_ID}-2026
    ${calRes}=     Create Calibration Record Via API    ${AUTH_TOKEN}    ${ASSET_ID}    ${certNum}    result=PASS    measuredAccuracy=99.9
    Should Be True    ${calRes.status_code} == 200 or ${calRes.status_code} == 201
    ${calData}=    Set Variable    ${calRes.json()}[data]
    Should Be Equal As Strings    ${calData}[result]    PASS

    # Analytics Dashboard
    ${dashRes}=    Get Maintenance Dashboard Metrics Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${dashRes.status_code}    200
    ${stats}=      Set Variable    ${dashRes.json()}[data]
    Should Not Be Empty    ${stats}

    # MTTR & MTBF
    ${mttrRes}=    Get Maintenance MTTR MTBF Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${mttrRes.status_code}    200

    # RPA Integration Trigger
    ${rpaRes}=     Export CMMS Data Via RPA API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${rpaRes.status_code}    200
