*** Settings ***
Documentation    Module 2 Appointment Management — Booking & Concurrency Suite
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../resources/appointment_keywords.resource
Resource         ../../resources/doctor_schedule_keywords.resource

*** Variables ***
${TEST_DATE}    2026-10-22
${DOCTOR_ID}    DOC1001
${PATIENT_ID}   P10001

*** Test Cases ***
TC-APT-001 Query Doctor Available Slots
    [Documentation]    Verify doctor slot generation calculates working hours and breaks accurately.
    ${admin_token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    ${slots_res}=      Get Available Slots    ${admin_token}    ${DOCTOR_ID}    ${TEST_DATE}
    Should Be True     ${slots_res}[success]
    ${slots}=          Set Variable    ${slots_res}[data][slots]
    Length Should Be Larger Than    ${slots}    0
    ${first_slot}=     Set Variable    ${slots}[0]
    Should Be Equal As Strings    ${first_slot}[startTime]    09:00
    Should Be True     ${first_slot}[available]

TC-APT-002 Book Appointment With Specific Doctor
    [Documentation]    Verify patient can book an available slot and receive a unique Appointment ID with CONFIRMED status.
    ${patient_token}=  Login Hospital User    patient@hospital.com    ${DEFAULT_PASSWORD}
    ${apt}=            Book Appointment       ${patient_token}    ${PATIENT_ID}    ${DOCTOR_ID}    ${TEST_DATE}    10:00    NEW_CONSULTATION    General cardiac checkup
    Should Be Equal As Strings    ${apt}[status]             CONFIRMED
    Should Be Equal As Strings    ${apt}[appointmentDateStr] ${TEST_DATE}
    Should Be Equal As Strings    ${apt}[startTime]          10:00
    Should Match Regexp           ${apt}[appointmentId]      ^A\\d{9}$

TC-APT-003 Book Referred Consultation Appointment
    [Documentation]    Verify booking appointment with doctor referral metadata preserved.
    ${reception_token}= Login Hospital User   reception@hospital.com    ${DEFAULT_PASSWORD}
    ${apt}=             Book Appointment      ${reception_token}    P10002    DOC1002    ${TEST_DATE}    14:00    REFERRED_CONSULTATION    Specialist referral consultation
    Should Be Equal As Strings    ${apt}[status]             CONFIRMED
    Should Be Equal As Strings    ${apt}[appointmentType]    REFERRED_CONSULTATION

TC-APT-004 Prevent Double Booking On Occupied Slot
    [Documentation]    Verify backend rejects simultaneous duplicate booking for an occupied slot capacity.
    ${reception_token}= Login Hospital User   reception@hospital.com    ${DEFAULT_PASSWORD}
    ${error_res}=       Attempt Double Booking    ${reception_token}    P10003    ${DOCTOR_ID}    ${TEST_DATE}    10:00
    Should Be Equal As Strings    ${error_res}[success]    ${False}
    Should Be Equal As Strings    ${error_res}[errorCode]  APPOINTMENT_SLOT_UNAVAILABLE
