*** Settings ***
Documentation    RPA Test: Onboard Approved Staff Master into External HRMS / Legacy HIS (Sections 39 & 41)
Resource         ../resources/browser.resource
Resource         ../resources/api.resource
Resource         ../keywords/employee_login.resource
Resource         ../keywords/employee_search.resource
Resource         ../keywords/employee_profile.resource
Resource         ../keywords/employee_evidence.resource

*** Test Cases ***
Onboard Employee In External HR System
    [Documentation]    Reads approved staff profile, navigates external portal, enters record, verifies by read-back, captures evidence
    ${employee_id}=    Set Variable    EMP10001
    ${name}=           Set Variable    Priya Shah
    ${dept}=           Set Variable    Billing & Cashier
    ${role}=           Set Variable    BILLING_STAFF
    ${emp_type}=       Set Variable    FULL_TIME

    Open External HR System
    Login To External HR System

    Search Employee In External System             ${employee_id}
    Enter Employee Record In External System       ${employee_id}    ${name}    ${dept}    ${role}    ${emp_type}
    Verify Employee Saved By Read Back             ${employee_id}    ${name}

    Capture Staff Sync Evidence                    ${employee_id}    onboard_verified
    Close External Session
