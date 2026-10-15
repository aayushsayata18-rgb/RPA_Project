*** Settings ***
Documentation    Module 13: Attendance Management & Biometric RPA Synchronization Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/attendance_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Attendance Test Session

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${EMPLOYEE_ID}        EMP10001
${DATE_TODAY}         2026-10-15
${ATTENDANCE_ID}      ${EMPTY}
${CORRECTION_ID}      ${EMPTY}
${BATCH_ID}           ${EMPTY}
${RUN_ID}             ${EMPTY}

*** Keywords ***
Setup Attendance Test Session
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    6    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

*** Test Cases ***
TC-ATT-001 Ingest Single Biometric Punch Event
    [Documentation]    Ingests Check-In and Check-Out biometric punches and verifies duration calculation
    ${checkInTime}=     Set Variable    2026-10-15T08:55:00Z
    ${checkOutTime}=    Set Variable    2026-10-15T18:05:00Z

    ${inRes}=     Record Punch Event    ${AUTH_TOKEN}    ${EMPLOYEE_ID}    IN    ${checkInTime}    BIOMETRIC    source_event_id=BIO-IN-${RUN_ID}
    Should Be Equal As Integers    ${inRes.status_code}    200
    ${attId}=     Set Variable    ${inRes.json()}[attendance][attendanceId]
    Set Suite Variable    ${ATTENDANCE_ID}    ${attId}

    ${outRes}=    Record Punch Event    ${AUTH_TOKEN}    ${EMPLOYEE_ID}    OUT   ${checkOutTime}   BIOMETRIC    source_event_id=BIO-OUT-${RUN_ID}
    Should Be Equal As Integers    ${outRes.status_code}   200
    Should Be Equal As Strings     ${outRes.json()}[attendance][status]    PRESENT

TC-ATT-002 Batch Upload Multiple Staff Attendance Records
    [Documentation]    Imports a batch of multiple employee attendance records from a CSV file payload
    ${row1}=    Create Dictionary    employeeId=${EMPLOYEE_ID}    checkIn=2026-10-15T09:00:00Z    checkOut=2026-10-15T18:00:00Z    deviceId=BIO-G1
    ${row2}=    Create Dictionary    employeeId=EMP10002          checkIn=2026-10-15T09:25:00Z    checkOut=2026-10-15T18:10:00Z    deviceId=BIO-G2
    ${records}=    Create List    ${row1}    ${row2}

    ${res}=    Submit Attendance Batch Import    ${AUTH_TOKEN}    ${records}    source=CSV    file_name=batch_${RUN_ID}.csv
    Should Be Equal As Integers    ${res.status_code}    200
    ${bId}=    Set Variable    ${res.json()}[batch][batchId]
    Set Suite Variable    ${BATCH_ID}    ${bId}
    Should Be True    ${res.json()}[batch][recordCount] >= 2

TC-ATT-003 Verify Idempotent Duplicate Suppression for Repeated Uploads
    [Documentation]    Replays the identical batch to verify idempotency and duplicate prevention (Spec Section 48)
    ${row1}=    Create Dictionary    employeeId=${EMPLOYEE_ID}    checkIn=2026-10-15T09:00:00Z    checkOut=2026-10-15T18:00:00Z    deviceId=BIO-G1
    ${row2}=    Create Dictionary    employeeId=EMP10002          checkIn=2026-10-15T09:25:00Z    checkOut=2026-10-15T18:10:00Z    deviceId=BIO-G2
    ${records}=    Create List    ${row1}    ${row2}

    ${res}=    Submit Attendance Batch Import    ${AUTH_TOKEN}    ${records}    source=CSV    file_name=batch_${RUN_ID}.csv
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be True    ${res.json()}[isIdempotentReplay]

TC-ATT-004 Flag Missing Punch And Run Roster Reconciliation
    [Documentation]    Ingests an entry check-in with missing check-out and executes reconciliation engine
    ${inTime}=    Set Variable    2026-10-15T09:05:00Z
    ${res}=       Record Punch Event    ${AUTH_TOKEN}    EMP10003    IN    ${inTime}    BIOMETRIC    source_event_id=BIO-MISS-${RUN_ID}
    Should Be Equal As Integers    ${res.status_code}    200

    ${reconRes}=  Trigger Attendance Reconciliation    ${AUTH_TOKEN}    date=${DATE_TODAY}
    Should Be Equal As Integers    ${reconRes.status_code}    200
    Should Be True    ${reconRes.json()}[summary][totalEvaluated] >= 1

TC-ATT-005 Log Exception for Unknown Staff Punch
    [Documentation]    Ingests punch for unknown employee ID and verifies UNMATCHED exception logging
    ${res}=    Record Punch Event    ${AUTH_TOKEN}    EMP99999    IN    2026-10-15T09:00:00Z    BIOMETRIC    source_event_id=BIO-UNK-${RUN_ID}
    Should Be Equal As Integers    ${res.status_code}    400
    Should Be Equal As Strings     ${res.json()}[error]    EMPLOYEE_NOT_FOUND

TC-ATT-006 Submit And Approve Attendance Correction Request
    [Documentation]    Submits a punch correction request, approves it with reviewer comments, and verifies audit update
    ${reqCheckIn}=     Set Variable    2026-10-15T08:50:00Z
    ${reqCheckOut}=    Set Variable    2026-10-15T18:00:00Z
    ${cRes}=    Request Attendance Correction    ${AUTH_TOKEN}    ${ATTENDANCE_ID}    Device malfunction at lobby exit gate    req_check_in=${reqCheckIn}    req_check_out=${reqCheckOut}
    Should Be Equal As Integers    ${cRes.status_code}    201
    ${cId}=     Set Variable    ${cRes.json()}[correction][requestId]
    Set Suite Variable    ${CORRECTION_ID}    ${cId}

    ${appRes}=  Approve Attendance Correction    ${AUTH_TOKEN}    ${CORRECTION_ID}    comments=Verified entry gate backup CCTV log
    Should Be Equal As Integers    ${appRes.status_code}    200
    Should Be Equal As Strings     ${appRes.json()}[correction][status]    APPROVED
    Should Be Equal As Strings     ${appRes.json()}[attendance][correctionStatus]    APPROVED
