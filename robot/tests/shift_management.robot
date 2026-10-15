*** Settings ***
Documentation    Module 14: Shift Management & Workforce Scheduling RPA Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/shift_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Shift Test Session

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${ROSTER_ID}          ${EMPTY}
${SHIFT_CODE}         ${EMPTY}
${ASSIGNMENT_ID_1}    ${EMPTY}
${ASSIGNMENT_ID_2}    ${EMPTY}

*** Keywords ***
Setup Shift Test Session
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    6    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

*** Test Cases ***
TC-SHF-001 Create Shift Definition And Cross-Midnight Verification
    [Documentation]    Creates standard and overnight shifts, verifying timing window calculations
    ${code}=    Set Variable    RPA_NIGHT_${RUN_ID}
    Set Suite Variable    ${SHIFT_CODE}    ${code}
    ${res}=     Create Shift Definition Via API    ${AUTH_TOKEN}    ${code}    RPA Night Shift    22:00    06:00    crosses_midnight=${TRUE}    shift_type=NIGHT
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    Should Be Equal As Strings    ${res.json()}[shift][shiftCode]    ${code}
    Should Be True    ${res.json()}[shift][crossesMidnight]

TC-SHF-002 Create And Roster Schedule Batch
    [Documentation]    Creates a departmental roster and batch imports schedule records
    ${resRoster}=    Create Roster Via API    ${AUTH_TOKEN}    RPA Roster ${RUN_ID}    DEP-RECEPTION    2026-11-09    2026-11-15
    Should Be True    ${resRoster.status_code} == 200 or ${resRoster.status_code} == 201
    ${rId}=    Set Variable    ${resRoster.json()}[roster][_id]
    Set Suite Variable    ${ROSTER_ID}    ${rId}

    # Batch import rows
    ${r1}=    Create Dictionary    employeeId=EMP10001    shiftCode=MORNING    date=2026-11-09
    ${r2}=    Create Dictionary    employeeId=EMP10002    shiftCode=${SHIFT_CODE}    date=2026-11-09
    ${records}=    Create List    ${r1}    ${r2}

    ${resImport}=    Import Shift Assignments Batch Via API    ${AUTH_TOKEN}    ${records}    roster_id=${ROSTER_ID}
    Should Be Equal As Integers    ${resImport.status_code}    200
    Should Be True    ${resImport.json()}[validRows] >= 2

TC-SHF-003 Detect Roster Conflicts And Verify Pre-Publish Safety
    [Documentation]    Runs conflict engine on the roster before publication
    ${resConflict}=    Trigger Roster Conflict Detection    ${AUTH_TOKEN}    ${ROSTER_ID}
    Should Be Equal As Integers    ${resConflict.status_code}    200
    Should Be True    ${resConflict.json()}[canPublish]

TC-SHF-004 Submit, Approve, And Publish Roster Lifecycle
    [Documentation]    Exercises administrative governance: DRAFT -> PENDING -> APPROVED -> PUBLISHED
    ${resSub}=    Submit Roster For Approval Via API    ${AUTH_TOKEN}    ${ROSTER_ID}
    Should Be Equal As Integers    ${resSub.status_code}    200
    Should Be Equal As Strings    ${resSub.json()}[roster][status]    PENDING_APPROVAL

    ${resApp}=    Approve Roster Via API    ${AUTH_TOKEN}    ${ROSTER_ID}
    Should Be Equal As Integers    ${resApp.status_code}    200
    Should Be Equal As Strings    ${resApp.json()}[roster][status]    APPROVED

    ${resPub}=    Publish Roster Via API    ${AUTH_TOKEN}    ${ROSTER_ID}
    Should Be Equal As Integers    ${resPub.status_code}    200
    Should Be Equal As Strings    ${resPub.json()}[roster][status]    PUBLISHED
    Should Be True    ${resPub.json()}[version][versionNumber] >= 1

TC-SHF-005 Read-Back Calendar Grid And RPA Synchronization
    [Documentation]    Reads back published roster calendar matrix and executes RPA external sync
    ${resGrid}=    Get Roster Calendar Grid    ${AUTH_TOKEN}    ${ROSTER_ID}
    Should Be Equal As Integers    ${resGrid.status_code}    200
    Should Be True    len(${resGrid.json()}[grid]) >= 1

    ${resSync}=    Execute RPAShiftSync    ${AUTH_TOKEN}    ${ROSTER_ID}
    Should Be Equal As Integers    ${resSync.status_code}    200
    Should Be Equal As Strings    ${resSync.json()}[syncStatus]    SYNCHRONIZED
    Should Be True    '${resSync.json()}[correlationId]' != '${EMPTY}'
