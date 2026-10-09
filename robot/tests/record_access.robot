*** Settings ***
Documentation    Module 07 — Record Access Control & Security Privacy Tests
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
    ${DOCTOR_TOKEN}=   Login Hospital User    doctor@hospital.com    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${DOCTOR_TOKEN}
    ${BILLING_TOKEN}=  Login Hospital User    billing@hospital.com    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${BILLING_TOKEN}

*** Test Cases ***
TC01: Verify Doctor Access To Clinical Patient Summary
    [Documentation]    Doctor accesses patient record portfolio
    ${res}=    Get Patient Summary Record    ${DOCTOR_TOKEN}    ${DEMO_PATIENT_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be Equal As Strings    ${res.json()}[data][patient][patientId]    ${DEMO_PATIENT_ID}

TC02: Verify Billing Staff Access To Inpatient Record
    [Documentation]    Billing staff accesses patient financial summary
    ${res}=    Get Patient Summary Record    ${BILLING_TOKEN}    ${DEMO_PATIENT_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    Dictionary Should Contain Key    ${res.json()}[data]    financialOverview

TC03: Verify Authorized Document Download
    [Documentation]    Doctor downloads verified lab report DOC-LAB-10045
    ${res}=    Download Patient Document With Token    ${DOCTOR_TOKEN}    DOC-LAB-10045
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be Equal As Strings    ${res.json()}[data][documentId]    DOC-LAB-10045

TC04: Verify Profile Update With Audit Trail
    [Documentation]    Admin modifies contact details with change reason
    ${updates}=    Create Dictionary    notes=Updated via Robot Suite Execution
    ${res}=        Update Patient Profile With Audit    ${ADMIN_TOKEN}    ${DEMO_PATIENT_ID}    ${updates}    Robot automation audit test
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be Equal As Strings    ${res.json()}[success]    True
