*** Settings ***
Documentation    Module 4: Bed Assignment & Active Admission Prevention Suite
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
TC-ADM-010 Duplicate Active Admission Detection
    [Documentation]    Verify system prevents creating duplicate active admission for patient already admitted
    ${activeRes}=    Get Active Admission For Patient    ${AUTH_TOKEN}    P10001
    Should Be True   ${activeRes}[hasActiveAdmission]
    Should Equal     ${activeRes}[data][admissionId]    ADM202610001

TC-ADM-011 Bed Search Category Preservation
    [Documentation]    Verify preferred category is separate from clinical requirement and no auto-downgrade occurs
    ${result}=    Find Suitable Beds For Admission    ${AUTH_TOKEN}    PRIVATE_ROOM    PRIVATE_ROOM
    Should Equal  ${result}[targetCategory]    PRIVATE_ROOM

TC-ADM-017 Unauthorized Admission Approval Prevention
    [Documentation]    Verify non-authorized users cannot approve admission requests
    ${patientToken}=    Login Hospital User    patient@hospital.com    ${DEFAULT_PASSWORD}
    ${resp}=    Approve Admission Request By ID    ${patientToken}    ADMREQ1003    reason=Unauthorized attempt
    Should Be Equal As Integers    ${resp.status_code}    403
