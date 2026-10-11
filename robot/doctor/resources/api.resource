*** Settings ***
Documentation    API Integration Keywords for Doctor Synchronization
Library          RequestsLibrary
Resource         common.resource

*** Keywords ***
Get Approved Doctor Profile
    [Arguments]    ${token}    ${doctor_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/doctors/${doctor_id}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Approved Doctor Schedule
    [Arguments]    ${token}    ${doctor_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/doctors/${doctor_id}/schedules    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Synchronization Result
    [Arguments]    ${token}    ${doctor_id}    ${sync_type}    ${status}    ${verified}=${True}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    syncType=${sync_type}    status=${status}    verifiedByReadBack=${verified}
    ${response}=   POST   ${BASE_URL}/doctors/${doctor_id}/sync    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
