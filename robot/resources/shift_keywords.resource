*** Settings ***
Documentation    Shift Management & Scheduling RPA Keywords for Module 14
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
Create Shift Definition Via API
    [Arguments]    ${token}    ${code}    ${name}    ${start_time}    ${end_time}    ${crosses_midnight}=${FALSE}    ${shift_type}=GENERAL
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    shiftCode=${code}
    ...    shiftName=${name}
    ...    startTime=${start_time}
    ...    endTime=${end_time}
    ...    crossesMidnight=${crosses_midnight}
    ...    shiftType=${shift_type}
    ${response}=   POST    ${BASE_URL}/shifts/definitions    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Shift Definitions List
    [Arguments]    ${token}    ${status}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    ${response}=   GET    ${BASE_URL}/shifts/definitions    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Create Roster Via API
    [Arguments]    ${token}    ${name}    ${dept_id}    ${start_date}    ${end_date}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    rosterName=${name}
    ...    departmentId=${dept_id}
    ...    periodStart=${start_date}
    ...    periodEnd=${end_date}
    ${response}=   POST    ${BASE_URL}/shifts/rosters    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Roster For Approval Via API
    [Arguments]    ${token}    ${roster_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/shifts/rosters/${roster_id}/submit    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Roster Via API
    [Arguments]    ${token}    ${roster_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/shifts/rosters/${roster_id}/approve    headers=${headers}    expected_status=any
    RETURN         ${response}

Publish Roster Via API
    [Arguments]    ${token}    ${roster_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/shifts/rosters/${roster_id}/publish    headers=${headers}    expected_status=any
    RETURN         ${response}

Create Shift Assignment Via API
    [Arguments]    ${token}    ${employee_id}    ${shift_id}    ${assignment_date}    ${roster_id}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    employeeId=${employee_id}
    ...    shiftId=${shift_id}
    ...    assignmentDate=${assignment_date}
    IF    '${roster_id}' != '${EMPTY}'
        Set To Dictionary    ${payload}    rosterId=${roster_id}
    END
    ${response}=   POST    ${BASE_URL}/shifts/assignments    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Import Shift Assignments Batch Via API
    [Arguments]    ${token}    ${records}    ${roster_id}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    records=${records}
    IF    '${roster_id}' != '${EMPTY}'
        Set To Dictionary    ${payload}    rosterId=${roster_id}
    END
    ${response}=   POST    ${BASE_URL}/shifts/assignments/import    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Roster Calendar Grid
    [Arguments]    ${token}    ${roster_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/shifts/rosters/${roster_id}/calendar    headers=${headers}    expected_status=any
    RETURN         ${response}

Trigger Roster Conflict Detection
    [Arguments]    ${token}    ${roster_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    rosterId=${roster_id}
    ${response}=   POST    ${BASE_URL}/shifts/conflicts/detect    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Shift Swap Request Via API
    [Arguments]    ${token}    ${req_emp}    ${req_assign}    ${target_emp}    ${target_assign}    ${reason}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    requesterEmployeeId=${req_emp}
    ...    requesterAssignmentId=${req_assign}
    ...    targetEmployeeId=${target_emp}
    ...    targetAssignmentId=${target_assign}
    ...    reason=${reason}
    ${response}=   POST    ${BASE_URL}/shifts/swap-requests    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Execute RPAShiftSync
    [Arguments]    ${token}    ${roster_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    rosterId=${roster_id}
    ${response}=   POST    ${BASE_URL}/shifts/rpa/sync    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
