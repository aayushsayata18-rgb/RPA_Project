*** Settings ***
Documentation    Module 07 — Record Integrity & Reference Reconciliation Tests
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
TC01: Verify Cross-Module Reference Integrity Check
    [Documentation]    Verifies that patient cross-module references are consistent
    ${res}=    Reconcile Patient References    ${ADMIN_TOKEN}    ${DEMO_PATIENT_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be Equal As Strings    ${res.json()}[success]    True
    Dictionary Should Contain Key    ${res.json()}[data]    healthy
