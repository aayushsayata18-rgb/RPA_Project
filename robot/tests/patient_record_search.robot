*** Settings ***
Documentation    Module 07 — Patient Record Search & Longitudinal Summary Tests
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
    ${PATIENT_TOKEN}=  Login Hospital User    patient@hospital.com    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${PATIENT_TOKEN}

*** Test Cases ***
TC01: Verify Admin Can Fetch Patient Master Summary
    [Documentation]    Admin loads Rahul Shah P10045 aggregated summary record
    ${res}=    Get Patient Summary Record    ${ADMIN_TOKEN}    ${DEMO_PATIENT_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    ${data}=    Set Variable    ${res.json()}[data]
    Should Be Equal As Strings    ${data}[patient][patientId]    ${DEMO_PATIENT_ID}
    Should Be Equal As Strings    ${data}[patient][fullName]     Rahul Shah
    Dictionary Should Contain Key    ${data}    financialOverview
    Dictionary Should Contain Key    ${data}    recentDocuments

TC02: Verify Longitudinal Timeline Assembly
    [Documentation]    Aggregated timeline contains all multi-module encounters
    ${res}=    Get Patient Longitudinal Timeline    ${ADMIN_TOKEN}    ${DEMO_PATIENT_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    ${data}=    Set Variable    ${res.json()}[data]
    Should Be True    ${data}[total] > 0
    ${events}=    Set Variable    ${data}[events]
    Log    Total timeline events found: ${data}[total]

TC03: Verify Patient Digital Document Library
    [Documentation]    Document library organizes administrative and clinical files
    ${res}=    Get Patient Documents Library    ${ADMIN_TOKEN}    ${DEMO_PATIENT_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    ${data}=    Set Variable    ${res.json()}[data]
    Should Be True    ${data}[total] >= 4
