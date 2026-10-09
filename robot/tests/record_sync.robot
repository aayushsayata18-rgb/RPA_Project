*** Settings ***
Documentation    Module 07 — RPA Legacy Record Synchronization & Ambiguity Tests
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/patient_records.resource

Suite Setup      Setup Suite Tokens

*** Variables ***
${DEMO_PATIENT_ID}    P10045

*** Keywords ***
Setup Suite Tokens
    ${ADMIN_TOKEN}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${ADMIN_TOKEN}

*** Test Cases ***
TC01: Verify Successful RPA Legacy Record Sync
    [Documentation]    RPA synchronizes demographic data for P10045
    ${payload}=    Create Dictionary    email=rahul.shah@example.com
    ${res}=        Trigger RPA Legacy Record Sync    ${ADMIN_TOKEN}    ${DEMO_PATIENT_ID}    ${payload}
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be Equal As Strings    ${res.json()}[success]    True

TC02: Verify RPA Halts On Non-Existent Patient
    [Documentation]    RPA attempts to sync unknown patient record and registers exception
    ${payload}=    Create Dictionary    email=ghost@example.com
    ${res}=        Trigger RPA Legacy Record Sync    ${ADMIN_TOKEN}    P99999_NON_EXISTENT    ${payload}
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be Equal As Strings    ${res.json()}[success]    False
    Should Be Equal As Strings    ${res.json()}[errorCode]  PATIENT_NOT_FOUND
