*** Settings ***
Documentation    RPA Test: Synchronize Doctor Availability and Leave to External HIS
Resource         ../resources/browser.resource
Resource         ../resources/api.resource
Resource         ../keywords/doctor_login.resource
Resource         ../keywords/doctor_search.resource
Resource         ../keywords/doctor_availability.resource
Resource         ../keywords/doctor_evidence.resource

*** Test Cases ***
Synchronize Doctor Availability
    [Documentation]    Synchronizes doctor date-specific leave and unavailability exception to external HIS
    ${doctor_id}=    Set Variable    DOC10001
    ${date}=         Set Variable    2026-10-15
    ${status}=       Set Variable    LEAVE
    ${reason}=       Set Variable    Approved Annual Leave

    Open External Hospital System
    Login To External System

    Search Doctor In External System            ${doctor_id}
    Update External Availability                ${doctor_id}    ${date}    ${status}    ${reason}
    Verify Availability Saved In External System    ${doctor_id}    ${date}    ${status}
    Capture Doctor Sync Evidence                ${doctor_id}    availability_sync_verified

    Close External Session
