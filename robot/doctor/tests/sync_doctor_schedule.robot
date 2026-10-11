*** Settings ***
Documentation    RPA Test: Synchronize Approved Doctor Schedule to External HIS (Section 40)
Resource         ../resources/browser.resource
Resource         ../resources/api.resource
Resource         ../keywords/doctor_login.resource
Resource         ../keywords/doctor_search.resource
Resource         ../keywords/doctor_schedule.resource
Resource         ../keywords/doctor_evidence.resource

*** Test Cases ***
Synchronize Doctor Schedule
    [Documentation]    Synchronizes doctor recurring schedule, verifies read-back and captures evidence
    ${doctor_id}=    Set Variable    DOC10001
    ${day}=          Set Variable    Monday
    ${start_time}=   Set Variable    09:00
    ${end_time}=     Set Variable    13:00

    Open External Hospital System
    Login To External System

    Search Doctor In External System          ${doctor_id}
    Open Doctor Schedule In External System   ${doctor_id}
    Update External Schedule                  ${day}    ${start_time}    ${end_time}

    Verify Schedule Saved In External System  ${day}    ${start_time}    ${end_time}
    Capture Doctor Sync Evidence              ${doctor_id}    schedule_sync_verified

    Close External Session
