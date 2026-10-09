*** Settings ***
Documentation    Module 2 Appointment Management — Reminders & No-Show Automation Suite
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../resources/appointment_keywords.resource
Resource         ../../resources/doctor_schedule_keywords.resource

*** Variables ***
${PAST_DATE}    2026-10-01
${DOCTOR_ID}    DOC1002
${PATIENT_ID}   P10005

*** Test Cases ***
TC-APT-007 Process Automated No-Show Policy
    [Documentation]    Verify appointments past grace period without arrival check-in are updated to NO_SHOW.
    ${admin_token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    ${no_show_res}=    Execute No Show Automation    ${admin_token}    ${PAST_DATE}    15
    Should Be True     ${no_show_res}[gracePeriodMinutes] == 15
    Should Be Equal As Strings    ${no_show_res}[date]    ${PAST_DATE}

TC-APT-008 Record Doctor Leave Exception
    [Documentation]    Verify doctor leave recording registers leave period and audits affected bookings.
    ${doctor_token}=   Login Hospital User    doctor@hospital.com    ${DEFAULT_PASSWORD}
    ${leave_res}=      Record Doctor Leave Period    ${doctor_token}    DOC1001    2026-11-01    2026-11-05    Annual Cardiology Symposium
    Should Be Equal As Strings    ${leave_res}[doctorId]    DOC1001
    Should Be Equal As Strings    ${leave_res}[leave][reason]    Annual Cardiology Symposium
