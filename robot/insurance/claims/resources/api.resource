*** Settings ***
Documentation    Backend Claims API Integration
Library          RequestsLibrary
Resource         common.resource

*** Keywords ***
Fetch Claim Details From Backend
    [Arguments]    ${token}    ${claim_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/insurance/claims/${claim_id}    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Claim Result To Backend
    [Arguments]    ${token}    ${claim_id}    ${payload}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/insurance/claims/${claim_id}/check-status    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
