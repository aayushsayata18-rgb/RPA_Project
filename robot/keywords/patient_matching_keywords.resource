*** Settings ***
Documentation    Patient Identity Matching & Duplicate Detection Keywords
Resource         ../resources/common.resource

*** Keywords ***
Check Duplicate Candidates
    [Arguments]    ${patientPayload}
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/patients/check-duplicates    json=${patientPayload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}

Review Ambiguous Identity Registration
    [Arguments]    ${token}    ${registrationId}    ${decision}    ${selectedPatientId}=${EMPTY}    ${notes}=Verified by RPA
    ${payload}=    Create Dictionary    decision=${decision}    selectedPatientId=${selectedPatientId}    reviewNotes=${notes}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/registrations/${registrationId}/review    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}
