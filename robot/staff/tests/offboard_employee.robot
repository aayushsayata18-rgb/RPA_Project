*** Settings ***
Documentation    RPA Test: Administrative Offboarding, Access Revocation & System Deactivation (Sections 33 & 35)
Resource         ../resources/browser.resource
Resource         ../keywords/employee_login.resource
Resource         ../keywords/employee_access.resource
Resource         ../keywords/employee_offboarding.resource
Resource         ../keywords/employee_evidence.resource

*** Test Cases ***
Offboard Employee And Revoke Access
    [Documentation]    Deactivates employee profile in external master and revokes system user credentials
    ${employee_id}=         Set Variable    EMP10001
    ${username}=            Set Variable    USR-EMP10001
    ${termination_date}=    Set Variable    2026-10-31
    ${reason}=              Set Variable    Voluntary Separation

    Open External HR System
    Login To External HR System

    Deactivate Employee In External Master          ${employee_id}    ${termination_date}    ${reason}
    Revoke Employee Access In External Target       ${employee_id}    ${username}

    Capture Staff Sync Evidence                     ${employee_id}    offboarding_revocation_verified
    Close External Session
