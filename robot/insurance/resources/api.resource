*** Settings ***
Documentation    Backend API Integration Keywords for Insurance Verification
Library          RequestsLibrary
Resource         common.resource

*** Keywords ***
Get Verification Request
    [Arguments]    ${token}    ${verificationId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/insurance/verifications/${verificationId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Verification Result
    [Arguments]    ${token}    ${verificationId}    ${payload}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/insurance/verifications/${verificationId}/manual    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
