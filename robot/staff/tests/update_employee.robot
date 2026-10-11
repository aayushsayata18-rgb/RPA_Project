*** Settings ***
Documentation    RPA Test: Synchronize Department Transfer & Designation Update to External System
Resource         ../resources/browser.resource
Resource         ../keywords/employee_login.resource
Resource         ../keywords/employee_search.resource
Resource         ../keywords/employee_profile.resource
Resource         ../keywords/employee_evidence.resource

*** Test Cases ***
Update Employee Department In External System
    [Documentation]    Updates department and designation after internal transfer approval, verifies by read-back
    ${employee_id}=       Set Variable    EMP10001
    ${new_designation}=   Set Variable    Senior Billing Executive
    ${new_dept}=          Set Variable    Finance & Accounts

    Open External HR System
    Login To External HR System

    Search Employee In External System                 ${employee_id}
    Update Employee Designation In External System     ${employee_id}    ${new_designation}    ${new_dept}
    Verify Employee Saved By Read Back                 ${employee_id}    Priya Shah

    Capture Staff Sync Evidence                        ${employee_id}    department_transfer_verified
    Close External Session
