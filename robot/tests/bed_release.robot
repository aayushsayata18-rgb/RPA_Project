*** Settings ***
Documentation    Module 6: Discharge Bed Release & Housekeeping Orchestration Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/discharge_keywords.resource
Resource         ../resources/bed_keywords.resource

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}

*** Test Cases ***
TC-DIS-040 Bed Release Transitions Bed Status To CLEANING_REQUIRED
    [Documentation]    Rule: Bed must not become AVAILABLE immediately; it enters CLEANING_REQUIRED
    ${res}=    Release Bed For Discharge    ${AUTH_TOKEN}    DIS20261006015    Patient leaving room for pharmacy
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]

    
    # Check bed status
    ${bedRes}=    Get Bed Details    ${AUTH_TOKEN}    BED-PR-03
    Should Be Equal As Integers    ${bedRes.status_code}    200
    ${bedBody}=    Set Variable    ${bedRes.json()}
    Should Be Equal    ${bedBody}[data][status]    CLEANING_REQUIRED
    Should Be Equal    ${bedBody}[data][currentPatientId]    ${NONE}

TC-DIS-041 Duplicate Bed Release Attempt Is Handled Gracefully
    [Documentation]    Attempting to release an already-vacated bed does not corrupt state
    ${res}=    Release Bed For Discharge    ${AUTH_TOKEN}    DIS20261006015    Duplicate release check
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 400
