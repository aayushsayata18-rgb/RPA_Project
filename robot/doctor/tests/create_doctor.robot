*** Settings ***
Documentation    RPA Test: Synchronize Approved Doctor Master Creation to External HIS (Section 40)
Resource         ../resources/browser.resource
Resource         ../resources/api.resource
Resource         ../keywords/doctor_login.resource
Resource         ../keywords/doctor_search.resource
Resource         ../keywords/doctor_profile.resource
Resource         ../keywords/doctor_evidence.resource

*** Test Cases ***
Create Doctor In External System
    [Documentation]    Reads approved doctor profile, creates entry in legacy HIS, verifies with read-back, captures evidence
    ${doctor_id}=    Set Variable    DOC10001
    ${doctor_name}=  Set Variable    Dr. Amit Patel
    ${dept}=         Set Variable    Cardiology
    ${spec}=         Set Variable    Cardiology

    Open External Hospital System
    Login To External System

    Enter Doctor Profile In External System    ${doctor_id}    ${doctor_name}    ${dept}    ${spec}
    Verify Profile Saved In External System    ${doctor_id}    ${doctor_name}
    Capture Doctor Sync Evidence               ${doctor_id}    profile_creation_verified

    Close External Session
