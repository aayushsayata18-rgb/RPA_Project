*** Settings ***
Documentation    Module 5: Concurrency-Safe Bed Reservation & Expiration Suite
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
TC-BED-010 Atomic Concurrency Safe Bed Reservation
    [Documentation]    Verify creating an atomic hold on an available bed transitions status to RESERVED
    ${res}=    Reserve Hospital Bed    ${AUTH_TOKEN}    BED-GW-01    P10002    Priya Sharma    durationMinutes=45
    Should Be Equal As Integers    ${res.status_code}    201
    ${body}=    Set Variable    ${res.json()}
    Should Be Equal    ${body}[data][status]    RESERVED
    Should Be Equal    ${body}[data][reservedForPatientId]    P10002

TC-BED-011 Duplicate Reservation Conflict Prevention
    [Documentation]    Verify system prevents a second user from reserving an already reserved bed
    ${res2}=    Reserve Hospital Bed    ${AUTH_TOKEN}    BED-GW-01    P10005    Rohan Desai
    Should Be Equal As Integers    ${res2.status_code}    400
    Should Contain    ${res2.json()}[error][message]    no longer available

TC-BED-012 Reservation Release Returns Bed To Available
    [Documentation]    Verify manual cancellation of hold returns bed to AVAILABLE status
    ${released}=    Release Bed Reservation    ${AUTH_TOKEN}    BED-GW-01
    Should Be Equal    ${released}[status]    AVAILABLE
