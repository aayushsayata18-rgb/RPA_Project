*** Settings ***
Documentation    Appointment Management Keywords for Hospital RPA Platform
Resource         common.resource
Resource         authentication.resource

*** Keywords ***
Get Available Slots
    [Arguments]    ${token}    ${doctorId}    ${date}    ${appointmentType}=NEW_CONSULTATION
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/appointments/available-slots?doctorId=${doctorId}&date=${date}&appointmentType=${appointmentType}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}

Book Appointment
    [Arguments]    ${token}    ${patientId}    ${doctorId}    ${date}    ${startTime}    ${appointmentType}=NEW_CONSULTATION    ${reason}=Routine Consultation
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    doctorId=${doctorId}
    ...    appointmentDate=${date}
    ...    startTime=${startTime}
    ...    appointmentType=${appointmentType}
    ...    reason=${reason}
    ${response}=   POST    ${BASE_URL}/appointments    json=${payload}    headers=${headers}    expected_status=201
    RETURN         ${response.json()}[data]

Attempt Double Booking
    [Arguments]    ${token}    ${patientId}    ${doctorId}    ${date}    ${startTime}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    doctorId=${doctorId}
    ...    appointmentDate=${date}
    ...    startTime=${startTime}
    ...    reason=Double Booking Attempt
    ${response}=   POST    ${BASE_URL}/appointments    json=${payload}    headers=${headers}    expected_status=409
    RETURN         ${response.json()}

Get Appointment Details
    [Arguments]    ${token}    ${appointmentId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/appointments/${appointmentId}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Cancel Appointment By ID
    [Arguments]    ${token}    ${appointmentId}    ${reason}=PATIENT_REQUEST    ${notes}=Cancelled via Robot test
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}    notes=${notes}
    ${response}=   POST    ${BASE_URL}/appointments/${appointmentId}/cancel    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Reschedule Appointment By ID
    [Arguments]    ${token}    ${appointmentId}    ${newDate}    ${newStartTime}    ${reason}=Rescheduled via Robot
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    newDate=${newDate}    newStartTime=${newStartTime}    reason=${reason}
    ${response}=   POST    ${BASE_URL}/appointments/${appointmentId}/reschedule    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Check In Patient Appointment
    [Arguments]    ${token}    ${appointmentId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/appointments/${appointmentId}/check-in    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]

Execute No Show Automation
    [Arguments]    ${token}    ${date}=2026-10-01    ${gracePeriodMinutes}=15
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    date=${date}    gracePeriodMinutes=${gracePeriodMinutes}
    ${response}=   POST    ${BASE_URL}/appointments/process-no-shows    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]
