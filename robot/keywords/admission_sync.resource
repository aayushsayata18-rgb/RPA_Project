*** Settings ***
Documentation    RPA Legacy Synchronization Keywords for Admissions
Resource         ../resources/common.resource

*** Keywords ***
Trigger RPA Sync For Admission
    [Arguments]    ${token}    ${admissionId}    ${forceFail}=${FALSE}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    forceFail=${forceFail}
    ${response}=   POST    ${BASE_URL}/admissions/${admissionId}/sync-external    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
