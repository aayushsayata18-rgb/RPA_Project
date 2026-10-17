*** Settings ***
Documentation    Module 24: Housekeeping Management RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/housekeeping_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Housekeeping Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${AREA_ID}            ${EMPTY}
${AREA_CODE}          ${EMPTY}
${CHECKLIST_ID}       ${EMPTY}
${TASK_ID}            ${EMPTY}
${BED_ID}             ${EMPTY}

*** Keywords ***
Setup Housekeeping Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    5    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}
    Set Suite Variable    ${AREA_CODE}    WARD-HK-${rand}
    Set Suite Variable    ${BED_ID}    BED-HK-${rand}

*** Test Cases ***
TC-HK-001 Facility Area Master And Status Management
    [Documentation]    Verifies facility area creation and status transitions
    ${res}=    Create Housekeeping Area Via API    ${AUTH_TOKEN}    ${AREA_CODE}    Isolation Ward ${RUN_ID}    areaType=PATIENT_ROOM
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=   Set Variable    ${res.json()}[data]
    Set Suite Variable    ${AREA_ID}    ${data}[_id]
    Should Be Equal As Strings    ${data}[status]    AVAILABLE

    ${resStatus}=    Update Housekeeping Area Status Via API    ${AUTH_TOKEN}    ${AREA_ID}    CLEANING_REQUIRED
    Should Be Equal As Integers    ${resStatus.status_code}    200
    Should Be Equal As Strings    ${resStatus.json()}[data][status]    CLEANING_REQUIRED

TC-HK-002 Cleaning Checklist Template Setup
    [Documentation]    Verifies checklist template creation with mandatory items
    ${code}=    Set Variable    CHK-HK-${RUN_ID}
    ${res}=     Create Housekeeping Checklist Via API    ${AUTH_TOKEN}    ${code}    Terminal Discharge Disinfection ${RUN_ID}
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=    Set Variable    ${res.json()}[data]
    Set Suite Variable    ${CHECKLIST_ID}    ${data}[_id]
    Should Be Equal As Strings    ${data}[checklistCode]    ${code}

TC-HK-003 Recurring Cleaning Schedule Management
    [Documentation]    Verifies recurring cleaning schedule creation
    ${code}=    Set Variable    SCH-HK-${RUN_ID}
    ${res}=     Create Housekeeping Schedule Via API    ${AUTH_TOKEN}    ${code}    Morning Corridor Sanitation ${RUN_ID}    ${AREA_ID}    frequency=DAILY
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=    Set Variable    ${res.json()}[data]
    Should Be Equal As Strings    ${data}[status]    ACTIVE

TC-HK-004 Cleaning Task Lifecycle
    [Documentation]    Verifies task creation, start, complete, and close transitions
    ${res}=    Create Housekeeping Task Via API    ${AUTH_TOKEN}    ${AREA_ID}    taskType=ROUTINE_CLEANING    priority=HIGH    description=Floor Sanitation
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=   Set Variable    ${res.json()}[data]
    Set Suite Variable    ${TASK_ID}    ${data}[_id]

    ${resStart}=    Start Housekeeping Task Via API    ${AUTH_TOKEN}    ${TASK_ID}
    Should Be Equal As Integers    ${resStart.status_code}    200
    Should Be Equal As Strings    ${resStart.json()}[data][status]    IN_PROGRESS

    ${resComp}=    Complete Housekeeping Task Via API    ${AUTH_TOKEN}    ${TASK_ID}    completionNotes=Sanitation fully finished
    Should Be Equal As Integers    ${resComp.status_code}    200
    Should Be Equal As Strings    ${resComp.json()}[data][status]    COMPLETED

    ${resClose}=   Close Housekeeping Task Via API    ${AUTH_TOKEN}    ${TASK_ID}
    Should Be Equal As Integers    ${resClose.status_code}    200
    Should Be Equal As Strings    ${resClose.json()}[data][status]    CLOSED

TC-HK-005 Room Turnover Dispatch And Deduplication
    [Documentation]    Verifies room turnover generation and idempotency protection
    ${res1}=    Trigger Room Turnover Via API    ${AUTH_TOKEN}    ${BED_ID}    Bed ${RUN_ID}    priority=STAT
    Should Be True    ${res1.status_code} == 200 or ${res1.status_code} == 201
    Should Be Equal As Strings    ${res1.json()}[data][taskType]    DISCHARGE_TURNOVER

    # Duplicate call must be idempotent
    ${res2}=    Trigger Room Turnover Via API    ${AUTH_TOKEN}    ${BED_ID}    Bed ${RUN_ID}    priority=STAT
    Should Be True    ${res2.status_code} == 200 or ${res2.status_code} == 201
    Should Be Equal As Strings    ${res2.json()}[data][taskId]    ${res1.json()}[data][taskId]

    # Verify board
    ${resBoard}=    Get Turnover Board Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resBoard.status_code}    200

TC-HK-006 Supervisor Quality Inspection
    [Documentation]    Verifies supervisor audit recording and score verification
    ${res}=    Perform Housekeeping Inspection Via API    ${AUTH_TOKEN}    ${TASK_ID}    score=96    passed=True    findings=Exceeds clean standards
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=   Set Variable    ${res.json()}[data]
    Should Be Equal As Strings    ${data}[status]    PASSED

TC-HK-007 Cleaning Consumables Requisition And Approval
    [Documentation]    Verifies consumable supplies request and supervisor approval
    ${resReq}=    Request Housekeeping Supplies Via API    ${AUTH_TOKEN}    itemName=Quaternary Disinfectant 5L    quantityRequested=2    unit=BOTTLE
    Should Be True    ${resReq.status_code} == 200 or ${resReq.status_code} == 201
    ${data}=      Set Variable    ${resReq.json()}[data]

    ${resAppr}=   Approve Housekeeping Supplies Via API    ${AUTH_TOKEN}    ${data}[_id]
    Should Be Equal As Integers    ${resAppr.status_code}    200
    Should Be Equal As Strings    ${resAppr.json()}[data][status]    APPROVED

TC-HK-008 Operational Exception Logging And Resolution
    [Documentation]    Verifies exception tracking for biohazard spills and shortages
    ${resEx}=    Create Housekeeping Exception Via API    ${AUTH_TOKEN}    exceptionType=BIOHAZARD_SPILL    severity=CRITICAL    description=Trauma room blood spill
    Should Be True    ${resEx.status_code} == 200 or ${resEx.status_code} == 201
    ${data}=     Set Variable    ${resEx.json()}[data]
    Should Be Equal As Strings    ${data}[status]    OPEN

    ${resRes}=   Resolve Housekeeping Exception Via API    ${AUTH_TOKEN}    ${data}[_id]    resolutionNotes=Decontaminated with hypochlorite solution
    Should Be Equal As Integers    ${resRes.status_code}    200
    Should Be Equal As Strings    ${resRes.json()}[data][status]    RESOLVED

TC-HK-009 RPA Background Dispatch And Turnover Sync
    [Documentation]    Verifies RPA automated job dispatch and bed scan
    ${resRpa}=    Trigger Housekeeping RPA Sync Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resRpa.status_code}    200
    Should Be True    'totalBedsScanned' in ${resRpa.json()}[data]

TC-HK-010 Housekeeping Operations Analytics And KPIs
    [Documentation]    Verifies dashboard KPIs, task breakdowns, and pass rate
    ${resMetrics}=    Get Housekeeping Dashboard Metrics Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resMetrics.status_code}    200
    ${metrics}=       Set Variable    ${resMetrics.json()}[data]
    Should Be True    'totalTasks' in ${metrics}
    Should Be True    'inspectionPassRate' in ${metrics}
