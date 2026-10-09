*** Settings ***
Documentation    Bed Management & Ward Query Keywords for Module 4
Resource         common.resource

*** Keywords ***
Get All Wards
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/beds/wards    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Get All Beds
    [Arguments]    ${token}    ${wardId}=${EMPTY}    ${status}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${wardId}' != '${EMPTY}'
        Set To Dictionary    ${params}    wardId=${wardId}
    END
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    ${response}=   GET    ${BASE_URL}/beds/beds    params=${params}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Find Suitable Beds For Admission
    [Arguments]    ${token}    ${clinicalCategory}    ${preferenceCategory}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    clinicalRequirementCategory=${clinicalCategory}    accommodationPreference=${preferenceCategory}
    ${response}=   POST    ${BASE_URL}/beds/beds/suitable    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Reserve Hospital Bed
    [Arguments]    ${token}    ${bedId}    ${patientId}    ${admissionRequestId}    ${durationMinutes}=60
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    patientId=${patientId}    admissionRequestId=${admissionRequestId}    durationMinutes=${durationMinutes}
    ${response}=   POST    ${BASE_URL}/beds/beds/${bedId}/reserve    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Release Bed Reservation
    [Arguments]    ${token}    ${bedId}    ${admissionRequestId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    admissionRequestId=${admissionRequestId}
    ${response}=   POST    ${BASE_URL}/beds/beds/${bedId}/release    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]
