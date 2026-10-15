*** Settings ***
Documentation    Leave Management RPA Automation Keywords for Module 15
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
Create Leave Type Via API
    [Arguments]    ${token}    ${code}    ${name}    ${unit}=DAYS    ${allow_half_day}=${TRUE}    ${allow_partial_day}=${FALSE}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    code=${code}
    ...    name=${name}
    ...    unit=${unit}
    ...    allowHalfDay=${allow_half_day}
    ...    allowPartialDay=${allow_partial_day}
    ...    status=ACTIVE
    ${response}=   POST    ${BASE_URL}/leave/types    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Create Leave Policy Via API
    [Arguments]    ${token}    ${policy_code}    ${leave_type_id}    ${annual_entitlement}    ${accrual_method}=MONTHLY
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    policyCode=${policy_code}
    ...    name=Policy for ${policy_code}
    ...    leaveTypeId=${leave_type_id}
    ...    annualEntitlement=${annual_entitlement}
    ...    accrualMethod=${accrual_method}
    ...    status=ACTIVE
    ${response}=   POST    ${BASE_URL}/leave/policies    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Leave Request Via API
    [Arguments]    ${token}    ${employee_id}    ${leave_type_id}    ${start_date}    ${end_date}    ${reason}    ${day_type}=FULL_DAY
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    employeeId=${employee_id}
    ...    leaveTypeId=${leave_type_id}
    ...    startDate=${start_date}
    ...    endDate=${end_date}
    ...    dayType=${day_type}
    ...    reason=${reason}
    ${response}=   POST    ${BASE_URL}/leave/requests    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Leave Request Via API
    [Arguments]    ${token}    ${request_id}    ${notes}=Approved via RPA
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    notes=${notes}
    ${response}=   POST    ${BASE_URL}/leave/requests/${request_id}/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Reject Leave Request Via API
    [Arguments]    ${token}    ${request_id}    ${reason}=Operational staffing requirement
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/leave/requests/${request_id}/reject    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Withdraw Leave Request Via API
    [Arguments]    ${token}    ${request_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/leave/requests/${request_id}/withdraw    headers=${headers}    expected_status=any
    RETURN         ${response}

Request Leave Cancellation Via API
    [Arguments]    ${token}    ${request_id}    ${reason}=Event postponed
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/leave/requests/${request_id}/cancellation    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Leave Cancellation Via API
    [Arguments]    ${token}    ${cancellation_id}    ${comments}=Approved cancellation
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    comments=${comments}
    ${response}=   POST    ${BASE_URL}/leave/cancellations/${cancellation_id}/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Leave Balances Via API
    [Arguments]    ${token}    ${employee_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/leave/balances/${employee_id}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Leave Ledger Via API
    [Arguments]    ${token}    ${employee_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/leave/ledger/${employee_id}    headers=${headers}    expected_status=any
    RETURN         ${response}

Import Leave Batch Via RPA API
    [Arguments]    ${token}    ${records}    ${correlation_id}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    records=${records}
    IF    '${correlation_id}' != '${EMPTY}'
        Set To Dictionary    ${payload}    correlationId=${correlation_id}
    END
    ${response}=   POST    ${BASE_URL}/leave/rpa/import    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Execute RPA Leave Sync
    [Arguments]    ${token}    ${correlation_id}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    IF    '${correlation_id}' != '${EMPTY}'
        Set To Dictionary    ${payload}    correlationId=${correlation_id}
    END
    ${response}=   POST    ${BASE_URL}/leave/rpa/sync    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Leave Summary Report Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/leave/reports/summary    headers=${headers}    expected_status=any
    RETURN         ${response}
