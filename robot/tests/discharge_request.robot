*** Settings ***
Documentation    Module 6: Clinical Discharge Request & Validation Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/discharge_keywords.resource

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}       ${EMPTY}
${DOCTOR_TOKEN}     ${EMPTY}
${PATIENT_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}
    ${docTok}=      Login Hospital User    doctor@hospital.com    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${DOCTOR_TOKEN}    ${docTok}
    ${patTok}=      Login Hospital User    patient@hospital.com    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${PATIENT_TOKEN}    ${patTok}

*** Test Cases ***
TC-DIS-001 Doctor Submits Valid Routine Discharge Request
    [Documentation]    Doctor orders clinical discharge for an admitted patient
    ${res}=    Create Clinical Discharge Request    ${DOCTOR_TOKEN}    ADM202610001    P10001    DOC1001    ROUTINE    Patient vital signs stable, cleared for discharge
    Should Be True    ${res.status_code} == 201 or ${res.status_code} == 200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    Should Be Equal    ${body}[data][admissionId]    ADM202610001
    Should Be Equal    ${body}[data][patientId]    P10001
    Should Be Equal    ${body}[data][status]    REQUESTED


TC-DIS-002 Patient Role Unauthorized To Issue Doctor Discharge Order
    [Documentation]    Verify RBAC prevents patients from issuing clinical discharge requests
    ${res}=    Create Clinical Discharge Request    ${PATIENT_TOKEN}    ADM202610001    P10001    DOC1001    ROUTINE    Self discharge attempt
    Should Be Equal As Integers    ${res.status_code}    403

TC-DIS-003 Discharge Request On Non-Existent Admission Fails
    [Documentation]    Discharge request against invalid admission ID should return 404 or 400
    ${res}=    Create Clinical Discharge Request    ${DOCTOR_TOKEN}    ADM999999    P10045    DOC1001    ROUTINE    Invalid admission test
    Should Be True    ${res.status_code} == 404 or ${res.status_code} == 400

TC-DIS-004 List and Filter Discharge Requests
    [Documentation]    Staff and Doctor can query pending or approved clinical requests
    ${res}=    Get All Discharge Requests    ${AUTH_TOKEN}    status=REQUESTED
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    len(${body}[data]) >= 1

