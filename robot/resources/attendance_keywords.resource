*** Settings ***
Documentation    Attendance Management & Biometric RPA Keywords for Module 13
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
Record Punch Event
    [Arguments]    ${token}    ${employee_id_code}    ${direction}    ${event_time}    ${source}=BIOMETRIC    ${source_event_id}=${EMPTY}    ${device_id}=BIO-GATE-1
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    employeeIdCode=${employee_id_code}
    ...    direction=${direction}
    ...    eventDateTime=${event_time}
    ...    source=${source}
    ...    deviceId=${device_id}
    IF    '${source_event_id}' != '${EMPTY}'
        Set To Dictionary    ${payload}    sourceEventId=${source_event_id}
    END
    ${response}=   POST    ${BASE_URL}/attendance/punch    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Attendance Batch Import
    [Arguments]    ${token}    ${records}    ${source}=CSV    ${file_name}=attendance_batch.csv
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    records=${records}
    ...    source=${source}
    ...    fileName=${file_name}
    ${response}=   POST    ${BASE_URL}/attendance/import    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Attendance Batch
    [Arguments]    ${token}    ${batch_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET     ${BASE_URL}/attendance/imports/${batch_id}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Daily Attendance List
    [Arguments]    ${token}    ${date}=${EMPTY}    ${status}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${date}' != '${EMPTY}'
        Set To Dictionary    ${params}    date=${date}
    END
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    ${response}=   GET     ${BASE_URL}/attendance    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Attendance By Id
    [Arguments]    ${token}    ${attendance_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET     ${BASE_URL}/attendance/${attendance_id}    headers=${headers}    expected_status=any
    RETURN         ${response}

Trigger Attendance Reconciliation
    [Arguments]    ${token}    ${date}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    IF    '${date}' != '${EMPTY}'
        Set To Dictionary    ${payload}    date=${date}
    END
    ${response}=   POST    ${BASE_URL}/attendance/reconcile    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Request Attendance Correction
    [Arguments]    ${token}    ${attendance_id}    ${reason}    ${req_check_in}=${EMPTY}    ${req_check_out}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    IF    '${req_check_in}' != '${EMPTY}'
        Set To Dictionary    ${payload}    requestedCheckIn=${req_check_in}
    END
    IF    '${req_check_out}' != '${EMPTY}'
        Set To Dictionary    ${payload}    requestedCheckOut=${req_check_out}
    END
    ${response}=   POST    ${BASE_URL}/attendance/${attendance_id}/correction    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Attendance Correction
    [Arguments]    ${token}    ${correction_id}    ${comments}=Approved based on verified punch log
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reviewerComments=${comments}
    ${response}=   POST    ${BASE_URL}/attendance/corrections/${correction_id}/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Reject Attendance Correction
    [Arguments]    ${token}    ${correction_id}    ${comments}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reviewerComments=${comments}
    ${response}=   POST    ${BASE_URL}/attendance/corrections/${correction_id}/reject    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Record Manual Attendance
    [Arguments]    ${token}    ${employee_id_code}    ${date}    ${reason}    ${check_in}=${EMPTY}    ${check_out}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    employeeIdCode=${employee_id_code}
    ...    date=${date}
    ...    reason=${reason}
    IF    '${check_in}' != '${EMPTY}'
        Set To Dictionary    ${payload}    checkInTime=${check_in}
    END
    IF    '${check_out}' != '${EMPTY}'
        Set To Dictionary    ${payload}    checkOutTime=${check_out}
    END
    ${response}=   POST    ${BASE_URL}/attendance/manual    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
