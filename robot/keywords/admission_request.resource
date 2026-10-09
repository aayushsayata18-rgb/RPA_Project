*** Settings ***
Documentation    Admission Request Domain Keywords for Robot Framework
Resource         ../resources/common.resource
Resource         ../resources/admission_keywords.resource

*** Keywords ***
Validate Request Creation
    [Arguments]    ${token}    ${patientId}    ${visitId}    ${clinicalRef}    ${expectedStatus}=PENDING_APPROVAL
    ${resp}=       Submit Admission Request    ${token}    ${patientId}    ${visitId}    ${clinicalRef}
    Should Be Equal As Integers    ${resp.status_code}    201
    ${body}=       Set Variable    ${resp.json()}
    Should Be True    ${body}[success]
    Should Be Equal    ${body}[data][status]    ${expectedStatus}
    Should Start With  ${body}[data][admissionRequestId]    ADMREQ
    RETURN         ${body}[data]
