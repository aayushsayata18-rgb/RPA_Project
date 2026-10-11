*** Settings ***
Documentation    API Integration Keywords for Staff Management RPA Synchronization
Library          RequestsLibrary
Resource         common.resource

*** Keywords ***
Get Approved Employee Profile
    [Arguments]    ${token}    ${employee_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/employees/${employee_id}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Approved Access Request
    [Arguments]    ${token}    ${request_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/access-requests/${request_id}    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Synchronization Result
    [Arguments]    ${token}    ${employee_id}    ${sync_type}    ${status}    ${verified}=${True}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    syncType=${sync_type}    status=${status}    verifiedByReadBack=${verified}
    ${response}=   POST   ${BASE_URL}/employees/${employee_id}/sync    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
