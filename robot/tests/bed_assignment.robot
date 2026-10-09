*** Settings ***
Documentation    Module 5: Physical Bed Assignment, Idempotency & Conflict Prevention Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/admission_keywords.resource
Resource         ../resources/bed_keywords.resource

Suite Setup      Setup Admin Session

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Admin Session
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}

*** Test Cases ***
TC-BED-020 Physical Bed Assignment
    [Documentation]    Verify assigning an available physical bed marks it OCCUPIED and creates assignment record
    ${res}=    Direct Assign Bed    ${AUTH_TOKEN}    BED-GW-02    P10004    ADM202610004    patientName=Neha Shah
    Should Be Equal As Integers    ${res.status_code}    201
    ${body}=    Set Variable    ${res.json()}
    Should Be Equal    ${body}[data][status]    OCCUPIED
    Should Be Equal    ${body}[data][currentPatientId]    P10004

TC-BED-021 Prevention of Double Occupancy on Same Physical Bed
    [Documentation]    Rule 7: A physical bed cannot be simultaneously assigned to two active patients
    ${resConflict}=    Direct Assign Bed    ${AUTH_TOKEN}    BED-GW-02    P10005    ADM202610005    patientName=Rohan Desai
    Should Be True    ${resConflict.status_code} == 409 or ${resConflict.status_code} == 400
    Should Contain    ${resConflict.json()}[error][message]    no longer available

TC-BED-022 RBAC Unauthorized Bed Assignment Prevention
    [Documentation]    Verify unauthorized users (e.g. PATIENT) cannot assign beds
    ${patientToken}=    Login Hospital User    patient@hospital.com    ${DEFAULT_PASSWORD}
    ${resp}=    Direct Assign Bed    ${patientToken}    BED-GW-03    P10005    ADM202610005
    Should Be Equal As Integers    ${resp.status_code}    403
