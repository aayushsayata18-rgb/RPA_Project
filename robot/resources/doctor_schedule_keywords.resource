*** Settings ***
Documentation    Doctor & Schedule Keywords for Hospital RPA Platform
Resource         common.resource
Resource         authentication.resource

*** Keywords ***
Get Doctor Master Directory
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/doctors    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Get Doctor Schedule Details
    [Arguments]    ${token}    ${doctorId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/doctors/${doctorId}/schedule    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Record Doctor Leave Period
    [Arguments]    ${token}    ${doctorId}    ${startDate}    ${endDate}    ${reason}=Medical Conference
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    startDate=${startDate}    endDate=${endDate}    reason=${reason}
    ${response}=   POST    ${BASE_URL}/doctors/${doctorId}/leave    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]
