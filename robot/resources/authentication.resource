*** Settings ***
Documentation    Authentication keywords for Hospital RPA platform
Resource         common.resource

*** Keywords ***
Login Hospital User
    [Arguments]    ${email}    ${password}
    ${payload}=    Create Dictionary    email=${email}    password=${password}
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/auth/login    json=${payload}    headers=${headers}    expected_status=200
    ${token}=      Set Variable    ${response.json()}[data][token]
    RETURN         ${token}
