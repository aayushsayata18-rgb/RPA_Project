*** Settings ***
Documentation    RPA Test: Automated User Account Provisioning in Target Systems (Sections 40 & 41)
Resource         ../resources/browser.resource
Resource         ../keywords/employee_login.resource
Resource         ../keywords/employee_access.resource
Resource         ../keywords/employee_evidence.resource

*** Test Cases ***
Provision Staff User Account
    [Documentation]    Provisions approved role into system portal, verifies access grants, captures evidence
    ${employee_id}=    Set Variable    EMP10001
    ${username}=       Set Variable    USR-EMP10001
    ${role_code}=      Set Variable    BILLING_STAFF

    Open External HR System
    Login To External HR System

    Provision Employee Account In External Target    ${employee_id}    ${username}    ${role_code}
    Verify Access In External Target                 ${username}       ${role_code}

    Capture Staff Sync Evidence                      ${employee_id}    access_provisioned_verified
    Close External Session
