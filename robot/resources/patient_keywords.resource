*** Settings ***
Documentation    Shared reusable Patient API keywords for Robot Framework
Resource         common.resource
Resource         authentication.resource

*** Keywords ***
Search Patient In Master
    [Arguments]    ${token}    ${query}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary    query=${query}
    ${response}=   GET    ${BASE_URL}/patients/search    params=${params}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}

Get Patient By Id
    [Arguments]    ${token}    ${patientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/patients/${patientId}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}

Get Patient Encounters
    [Arguments]    ${token}    ${patientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/visits/patient/${patientId}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}

Update Patient Demographics
    [Arguments]    ${token}    ${patientId}    ${updatePayload}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   PATCH    ${BASE_URL}/patients/${patientId}    json=${updatePayload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}
