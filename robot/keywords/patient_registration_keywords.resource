*** Settings ***
Documentation    Patient Registration RPA keywords (Online & Front-Desk)
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource

*** Keywords ***
Submit Online Patient Registration
    [Arguments]    ${firstName}    ${lastName}    ${dob}    ${gender}    ${mobile}    ${email}=${EMPTY}
    ${patientDict}=    Create Dictionary
    ...    firstName=${firstName}
    ...    lastName=${lastName}
    ...    dateOfBirth=${dob}
    ...    gender=${gender}
    ...    mobile=${mobile}
    ...    email=${email}
    ${payload}=    Create Dictionary
    ...    source=ONLINE_SELF_REGISTRATION
    ...    visitType=OPD
    ...    department=GENERAL_MEDICINE
    ...    patient=${patientDict}
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/registrations    json=${payload}    headers=${headers}    expected_status=201
    RETURN         ${response.json()}

Submit Front Desk Existing Patient Registration
    [Arguments]    ${token}    ${existingPatientId}    ${visitType}=OPD    ${department}=GENERAL_MEDICINE
    ${payload}=    Create Dictionary
    ...    existingPatientId=${existingPatientId}
    ...    source=FRONT_DESK
    ...    visitType=${visitType}
    ...    department=${department}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/registrations    json=${payload}    headers=${headers}    expected_status=201
    RETURN         ${response.json()}

Verify Permanent Patient ID Format
    [Arguments]    ${patientId}
    Should Match Regexp    ${patientId}    ^P\\d{5}$

Verify Visit ID Format
    [Arguments]    ${visitId}
    Should Match Regexp    ${visitId}    ^V\\d{9}$
