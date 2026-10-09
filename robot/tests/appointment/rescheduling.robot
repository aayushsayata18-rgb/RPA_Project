*** Settings ***
Documentation    Module 2 Appointment Management — Rescheduling & History Suite
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../resources/appointment_keywords.resource

*** Variables ***
${TEST_DATE}    2026-10-24
${NEW_DATE}     2026-10-26
${DOCTOR_ID}    DOC1004
${PATIENT_ID}   P10001

*** Test Cases ***
TC-APT-006 Reschedule Appointment
    [Documentation]    Verify rescheduling preserves original appointment as RESCHEDULED and creates new linked appointment as CONFIRMED.
    ${patient_token}=  Login Hospital User    patient@hospital.com    ${DEFAULT_PASSWORD}
    ${apt}=            Book Appointment       ${patient_token}    ${PATIENT_ID}    ${DOCTOR_ID}    ${TEST_DATE}    09:30    NEW_CONSULTATION    Orthopedic consultation
    Should Be Equal As Strings    ${apt}[status]    CONFIRMED

    # Reschedule to new date and time
    ${reschedule_res}= Reschedule Appointment By ID    ${patient_token}    ${apt}[appointmentId]    ${NEW_DATE}    10:00    Patient requested Monday slot
    ${orig_apt}=       Set Variable    ${reschedule_res}[originalAppointment]
    ${new_apt}=        Set Variable    ${reschedule_res}[newAppointment]

    Should Be Equal As Strings    ${orig_apt}[status]                        RESCHEDULED
    Should Be Equal As Strings    ${new_apt}[status]                         CONFIRMED
    Should Be Equal As Strings    ${new_apt}[appointmentDateStr]             ${NEW_DATE}
    Should Be Equal As Strings    ${new_apt}[startTime]                      10:00
    Should Be Equal As Strings    ${new_apt}[rescheduledFromAppointmentId]   ${apt}[appointmentId]
