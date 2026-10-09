*** Settings ***
Documentation    Module 5: Two-Phase Safe Bed Transfer Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/bed_keywords.resource

Suite Setup      Setup Admin Session

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Admin Session
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}

*** Test Cases ***
TC-BED-030 Two-Phase Safe Bed Transfer
    [Documentation]    Rule 28 & 29: Secures destination bed before vacating old bed and creating cleaning task
    # Patient Aarav Patel (P10001) in BED-PR-03 transfers to BED-PR-01
    ${transferRes}=    Transfer Bed Safely    ${AUTH_TOKEN}    P10001    ADM202610001    BED-PR-03    BED-PR-01    reason=Deluxe suite transfer
    Should Be Equal As Integers    ${transferRes.status_code}    200
    ${body}=    Set Variable    ${transferRes.json()}
    Should Be Equal    ${body}[data][newBed][status]    OCCUPIED
    Should Be Equal    ${body}[data][previousBed][status]    CLEANING_REQUIRED
    Should Be True     ${body}[data][housekeepingTaskId] != '${EMPTY}'

TC-BED-031 Transfer Destination Conflict Protection
    [Documentation]    Rule 30: If destination bed is unavailable, transfer is rejected and source bed remains occupied
    ${conflictRes}=    Transfer Bed Safely    ${AUTH_TOKEN}    P10001    ADM202610001    BED-PR-01    BED-PR-01    reason=Same bed transfer
    Should Be Equal As Integers    ${conflictRes.status_code}    400
