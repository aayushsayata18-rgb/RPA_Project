*** Settings ***
Documentation    Emergency Intake & Identity Linking Keywords
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource

*** Keywords ***
Submit Emergency Fast Intake
    [Arguments]    ${token}    ${provisionalName}    ${estimatedAge}=30    ${gender}=MALE    ${condition}=Emergency Trauma
    ${payload}=    Create Dictionary
    ...    provisionalName=${provisionalName}
    ...    estimatedAge=${estimatedAge}
    ...    gender=${gender}
    ...    apparentCondition=${condition}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/registrations/emergency    json=${payload}    headers=${headers}    expected_status=201
    RETURN         ${response.json()}

Link Temporary Emergency Record
    [Arguments]    ${token}    ${temporaryEmergencyId}    ${targetPatientId}
    ${payload}=    Create Dictionary    targetPatientId=${targetPatientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/registrations/emergency/${temporaryEmergencyId}/link    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}
