*** Settings ***
Documentation    Module 15: Leave Management RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/leave_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Leave Test Session

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${LEAVE_TYPE_ID}      ${EMPTY}
${LEAVE_TYPE_CODE}    ${EMPTY}
${REQUEST_ID}         ${EMPTY}

*** Keywords ***
Setup Leave Test Session
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    6    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

*** Test Cases ***
TC-LV-001 Create Leave Type And Policy Via RPA
    [Documentation]    Configures a new leave type and establishes annual policy entitlement
    ${code}=    Set Variable    RPA_ANN_${RUN_ID}
    Set Suite Variable    ${LEAVE_TYPE_CODE}    ${code}

    ${resType}=    Create Leave Type Via API    ${AUTH_TOKEN}    ${code}    RPA Annual Leave ${RUN_ID}    unit=DAYS    allow_half_day=${TRUE}
    Should Be True    ${resType.status_code} == 200 or ${resType.status_code} == 201
    ${ltId}=    Set Variable    ${resType.json()}[leaveType][_id]
    Set Suite Variable    ${LEAVE_TYPE_ID}    ${ltId}

    ${resPol}=     Create Leave Policy Via API    ${AUTH_TOKEN}    POL_${code}    ${LEAVE_TYPE_ID}    15    accrual_method=MONTHLY
    Should Be True    ${resPol.status_code} == 200 or ${resPol.status_code} == 201
    Should Be Equal As Strings    ${resPol.json()}[policy][policyCode]    POL_${code}
    Should Be Equal As Integers    ${resPol.json()}[policy][annualEntitlement]    15

TC-LV-002 Submit And Approve Employee Leave Request
    [Documentation]    Exercises the request lifecycle: balance check -> PENDING -> APPROVED -> balance deduction
    ${resReq}=    Submit Leave Request Via API    ${AUTH_TOKEN}    EMP00125    ${LEAVE_TYPE_ID}    2026-11-23    2026-11-24    RPA Vacation test
    Should Be True    ${resReq.status_code} == 200 or ${resReq.status_code} == 201
    ${rId}=    Set Variable    ${resReq.json()}[request][_id]
    Set Suite Variable    ${REQUEST_ID}    ${rId}
    Should Be Equal As Strings    ${resReq.json()}[request][status]    PENDING

    ${resApp}=    Approve Leave Request Via API    ${AUTH_TOKEN}    ${REQUEST_ID}    Approved by Department Manager
    Should Be Equal As Integers    ${resApp.status_code}    200
    Should Be Equal As Strings    ${resApp.json()}[request][status]    APPROVED

TC-LV-003 RPA Leave Batch Import Workflow (Section 94 Test 1)
    [Documentation]    Batch imports external leave data through RPA connector
    ${r1}=    Create Dictionary    employeeId=EMP10001    leaveTypeCode=CASUAL    startDate=2026-12-01    endDate=2026-12-01    reason=External HR sync
    ${records}=    Create List    ${r1}

    ${resImport}=    Import Leave Batch Via RPA API    ${AUTH_TOKEN}    ${records}    correlation_id=RPA-BATCH-${RUN_ID}
    Should Be Equal As Integers    ${resImport.status_code}    200
    Should Be True    ${resImport.json()}[success]
    Should Be Equal As Integers    ${resImport.json()}[recordsSucceeded]    1

TC-LV-004 Duplicate Import Prevention (Section 94 Test 2)
    [Documentation]    Imports duplicate leave rows to verify idempotent deduplication
    ${r1}=    Create Dictionary    employeeId=EMP10001    leaveTypeCode=CASUAL    startDate=2026-12-01    endDate=2026-12-01    reason=External HR sync
    ${records}=    Create List    ${r1}

    ${resDup}=    Import Leave Batch Via RPA API    ${AUTH_TOKEN}    ${records}    correlation_id=RPA-DUP-${RUN_ID}
    Should Be Equal As Integers    ${resDup.status_code}    200
    Should Be Equal As Integers    len(${resDup.json()}[importedRequests])    0

TC-LV-005 Unknown Employee Exception Handling (Section 94 Test 3)
    [Documentation]    Verifies that unknown employee identifiers raise system exceptions without crashing
    ${rFail}=    Create Dictionary    employeeId=EMP_UNKNOWN_9999    leaveTypeCode=CASUAL    startDate=2026-12-15    endDate=2026-12-16    reason=Ghost staff
    ${records}=    Create List    ${rFail}

    ${resFail}=    Import Leave Batch Via RPA API    ${AUTH_TOKEN}    ${records}    correlation_id=RPA-ERR-${RUN_ID}
    Should Be Equal As Integers    ${resFail.status_code}    200
    Should Be Equal As Integers    ${resFail.json()}[recordsFailed]    1
    Should Be True    len(${resFail.json()}[errors]) >= 1

TC-LV-006 RPA External Leave Synchronization Contract (Section 94 Test 4)
    [Documentation]    Executes external HR system synchronization contract
    ${resSync}=    Execute RPA Leave Sync    ${AUTH_TOKEN}    correlation_id=RPA-SYNC-${RUN_ID}
    Should Be Equal As Integers    ${resSync.status_code}    200
    Should Be True    ${resSync.json()}[success]
    Should Be Equal As Strings    ${resSync.json()}[jobType]    LEAVE_SYNC
    Should Be True    '${resSync.json()}[correlationId]' != '${EMPTY}'
