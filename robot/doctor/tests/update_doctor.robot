*** Settings ***
Documentation    RPA Test: Synchronize Doctor Profile Updates to External HIS
Resource         ../resources/browser.resource
Resource         ../resources/api.resource
Resource         ../keywords/doctor_login.resource
Resource         ../keywords/doctor_search.resource
Resource         ../keywords/doctor_profile.resource
Resource         ../keywords/doctor_evidence.resource

*** Test Cases ***
Update Doctor In External System
    [Documentation]    Updates existing doctor profile attributes, performs read-back and captures evidence
    ${doctor_id}=    Set Variable    DOC10001
    ${doctor_name}=  Set Variable    Dr. Amit Patel
    ${dept}=         Set Variable    Emergency Medicine
    ${spec}=         Set Variable    Cardiology

    Open External Hospital System
    Login To External System

    Search Doctor In External System          ${doctor_id}
    Enter Doctor Profile In External System   ${doctor_id}    ${doctor_name}    ${dept}    ${spec}
    Verify Profile Saved In External System   ${doctor_id}    ${doctor_name}
    Capture Doctor Sync Evidence              ${doctor_id}    profile_update_verified

    Close External Session
