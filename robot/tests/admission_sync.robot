*** Settings ***
Documentation    Module 4: RPA External Hospital Synchronization & Notification Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/admission_keywords.resource
Resource         ../keywords/admission_sync.resource

Suite Setup      Setup Admin Session

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Admin Session
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}

*** Test Cases ***
TC-ADM-012 External HIS System Synchronization Success
    [Documentation]    Verify RPA synchronizes admission to external HIS and captures external admission ID
    ${resp}=    Trigger RPA Sync For Admission    ${AUTH_TOKEN}    ADM202610001
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=    Set Variable    ${resp.json()}
    Should Be True    ${body}[success]
    Should Equal      ${body}[data][syncStatus]    SYNCED
    Should Start With ${body}[data][externalAdmissionId]    EXT-ADM

TC-ADM-013 External Synchronization Failure & Exception Handling
    [Documentation]    Verify RPA handles external sync timeout and raises exception case
    ${resp}=    Trigger RPA Sync For Admission    ${AUTH_TOKEN}    ADM202610001    forceFail=${TRUE}
    ${body}=    Set Variable    ${resp.json()}
    Should Not Be True    ${body}[success]
    Should Equal      ${body}[data][syncStatus]    FAILED
