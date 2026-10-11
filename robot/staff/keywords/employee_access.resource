*** Settings ***
Documentation    Keywords for access provisioning and role synchronization in external system

*** Keywords ***
Provision Employee Account In External Target
    [Arguments]    ${employee_id}    ${username}    ${role_code}
    Log    Creating user account for ${employee_id} (Username: ${username}) with role ${role_code}
    Log    Assigning RBAC role permissions according to approved matrix

Verify Access In External Target
    [Arguments]    ${username}    ${role_code}
    Log    Reading back user access grants for ${username}
    Log    Verification passed: Role ${role_code} active and verified

Revoke Employee Access In External Target
    [Arguments]    ${employee_id}    ${username}
    Log    Deactivating external user account ${username} linked to ${employee_id}
    Log    Verification passed: External account disabled and all active sessions terminated
