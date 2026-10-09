*** Settings ***
Documentation    Emergency Admission & Temporary Identity Domain Keywords
Resource         ../resources/common.resource
Resource         ../resources/admission_keywords.resource

*** Keywords ***
Execute Emergency Inpatient Intake
    [Arguments]    ${token}    ${provisionalName}    ${condition}
    ${data}=       Process Emergency Intake    ${token}    provisionalName=${provisionalName}    condition=${condition}
    Should Not Be Empty    ${data}[admissionId]
    Should Start With      ${data}[admissionId]    ADM
    RETURN         ${data}

Verify Emergency Temporary Record Linkage
    [Arguments]    ${token}    ${tempId}    ${permanentId}
    ${res}=        Link Emergency Identity    ${token}    ${tempId}    ${permanentId}
    Should Be Equal    ${res}[permanentPatientId]    ${permanentId}
    RETURN         ${res}
