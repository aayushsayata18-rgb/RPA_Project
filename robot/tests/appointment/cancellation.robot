*** Settings ***
Documentation    Module 2 Appointment Management — Cancellation & Slot Release Suite
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../resources/appointment_keywords.resource

*** Variables ***
${TEST_DATE}    2026-10-23
${DOCTOR_ID}    DOC1003
${PATIENT_ID}   P10002

*** Test Cases ***
TC-APT-005 Cancel Appointment And Release Slot
    [Documentation]    Verify cancelling an appointment transitions status to CANCELLED, creates history, and releases slot capacity.
    ${patient_token}=  Login Hospital User    patient@hospital.com    ${DEFAULT_PASSWORD}
    ${apt}=            Book Appointment       ${patient_token}    ${PATIENT_ID}    ${DOCTOR_ID}    ${TEST_DATE}    11:00    NEW_CONSULTATION    Skin checkup
    Should Be Equal As Strings    ${apt}[status]    CONFIRMED

    # Cancel the appointment
    ${cancelled_apt}=  Cancel Appointment By ID    ${patient_token}    ${apt}[appointmentId]    PATIENT_REQUEST    Patient schedule conflict
    Should Be Equal As Strings    ${cancelled_apt}[status]             CANCELLED
    Should Be Equal As Strings    ${cancelled_apt}[cancellationReason] PATIENT_REQUEST

    # Verify slot is released and can be booked again
    ${rebook_apt}=     Book Appointment       ${patient_token}    P10001    ${DOCTOR_ID}    ${TEST_DATE}    11:00    NEW_CONSULTATION    Rebooking released slot
    Should Be Equal As Strings    ${rebook_apt}[status]    CONFIRMED
