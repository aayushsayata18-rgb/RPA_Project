*** Settings ***
Documentation    RPA Test: Role Modification & Permissions Synchronization in Target Application
Resource         ../resources/browser.resource
Resource         ../keywords/employee_login.resource
Resource         ../keywords/employee_access.resource
Resource         ../keywords/employee_evidence.resource

*** Test Cases ***
Update Staff Role In External Application
    [Documentation]    Updates user role to new approved privileges and verifies that old permissions are not retained
    ${employee_id}=    Set Variable    EMP10001
    ${username}=       Set Variable    USR-EMP10001
    ${new_role}=       Set Variable    FINANCE_ADMIN

    Open External HR System
    Login To External HR System

    Provision Employee Account In External Target    ${employee_id}    ${username}    ${new_role}
    Verify Access In External Target                 ${username}       ${new_role}

    Capture Staff Sync Evidence                      ${employee_id}    role_update_verified
    Close External Session
