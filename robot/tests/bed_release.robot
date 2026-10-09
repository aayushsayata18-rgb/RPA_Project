*** Settings ***
Documentation    Module 5: Discharge Bed Release, Housekeeping Turnover & State Transition Suite
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
TC-BED-040 Discharge Release Triggers Cleaning Required
    [Documentation]    Rule 8 & 31: Discharge never directly marks bed AVAILABLE; it becomes CLEANING_REQUIRED
    # Release Bed BED-GW-02
    ${releaseRes}=    Release Bed On Discharge    ${AUTH_TOKEN}    BED-GW-02    ADM202610004
    Should Be Equal    ${releaseRes}[status]    CLEANING_REQUIRED
    Should Be True     ${releaseRes}[housekeepingTaskCreated]

TC-BED-041 Housekeeping Completion Returns Bed To Available
    [Documentation]    Rule 8 & 32: When housekeeping marks task completed, bed status transitions to AVAILABLE
    ${cleanRes}=    Complete Bed Cleaning Task    ${AUTH_TOKEN}    BED-GW-02
    Should Be True     ${cleanRes}[success]
    Should Be Equal    ${cleanRes}[data][status]    AVAILABLE

TC-BED-042 Rejection Of Invalid State Transitions
    [Documentation]    Rule 12 & 34: Occupied bed cannot be placed directly into MAINTENANCE without transfer
    ${invalidRes}=    Update Bed Status Control    ${AUTH_TOKEN}    BED-PR-01    MAINTENANCE    reason=Illegal transition attempt
    Should Be Equal As Integers    ${invalidRes.status_code}    400
    Should Contain    ${invalidRes.json()}[error][message]    Cannot put an OCCUPIED bed directly into MAINTENANCE
