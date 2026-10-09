*** Settings ***
Documentation    Bed Management & Operational Inventory Keywords for Module 5
Resource         common.resource

*** Keywords ***
Get Bed Availability Dashboard
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/beds/availability    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Get All Wards
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/beds/wards    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Get All Beds
    [Arguments]    ${token}    ${wardId}=${EMPTY}    ${status}=${EMPTY}    ${bedType}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${wardId}' != '${EMPTY}'
        Set To Dictionary    ${params}    wardId=${wardId}
    END
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    IF    '${bedType}' != '${EMPTY}'
        Set To Dictionary    ${params}    bedType=${bedType}
    END
    ${response}=   GET    ${BASE_URL}/beds    params=${params}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Get Bed Details
    [Arguments]    ${token}    ${bedId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/beds/${bedId}    headers=${headers}    expected_status=any
    RETURN         ${response}


Find Suitable Beds For Admission
    [Arguments]    ${token}    ${clinicalCategory}    ${preferenceCategory}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    clinicalRequirementCategory=${clinicalCategory}    accommodationPreference=${preferenceCategory}
    ${response}=   POST    ${BASE_URL}/beds/suitable    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}

Search Available Beds With Requirements
    [Arguments]    ${token}    ${requiredCategory}    ${preferenceCategory}    ${gender}=ANY
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${clinReq}=    Create Dictionary    requiredCategory=${requiredCategory}
    ${accPref}=    Create Dictionary    category=${preferenceCategory}
    ${payload}=    Create Dictionary    clinicalRequirement=${clinReq}    accommodationPreference=${accPref}    gender=${gender}
    ${response}=   POST    ${BASE_URL}/beds/search    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}

Reserve Hospital Bed
    [Arguments]    ${token}    ${bedId}    ${patientId}    ${patientName}=${EMPTY}    ${durationMinutes}=60
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    bedId=${bedId}    patientId=${patientId}    patientName=${patientName}    durationMinutes=${durationMinutes}
    ${response}=   POST    ${BASE_URL}/bed-reservations    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Release Bed Reservation
    [Arguments]    ${token}    ${bedId}    ${admissionRequestId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    admissionRequestId=${admissionRequestId}
    ${response}=   POST    ${BASE_URL}/beds/${bedId}/cancel-reservation    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Direct Assign Bed
    [Arguments]    ${token}    ${bedId}    ${patientId}    ${admissionId}    ${patientName}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    bedId=${bedId}    patientId=${patientId}    admissionId=${admissionId}    patientName=${patientName}
    ${response}=   POST    ${BASE_URL}/bed-assignments    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Transfer Bed Safely
    [Arguments]    ${token}    ${patientId}    ${admissionId}    ${fromBedId}    ${toBedId}    ${reason}=Transfer test
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    patientId=${patientId}    admissionId=${admissionId}    fromBedId=${fromBedId}    toBedId=${toBedId}    reason=${reason}
    ${response}=   POST    ${BASE_URL}/bed-transfers    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Release Bed On Discharge
    [Arguments]    ${token}    ${bedId}    ${admissionId}    ${reason}=Discharge completed
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    admissionId=${admissionId}    releaseReason=${reason}
    ${response}=   POST    ${BASE_URL}/beds/${bedId}/release    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}

Update Bed Status Control
    [Arguments]    ${token}    ${bedId}    ${status}    ${reason}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    status=${status}    reason=${reason}
    ${response}=   PATCH   ${BASE_URL}/beds/${bedId}/status    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Complete Bed Cleaning Task
    [Arguments]    ${token}    ${bedId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    bedId=${bedId}
    ${response}=   POST    ${BASE_URL}/housekeeping/complete    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}

Reconcile Beds With Legacy System
    [Arguments]    ${token}    ${legacyInventoryList}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    legacyInventory=${legacyInventoryList}
    ${response}=   POST    ${BASE_URL}/beds/reconcile    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Get Bed Status History
    [Arguments]    ${token}    ${bedId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/beds/${bedId}/history    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]
