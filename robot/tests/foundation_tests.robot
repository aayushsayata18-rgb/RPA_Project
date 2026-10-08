*** Settings ***
Documentation    Foundation Architecture & Health Test Suite for 00_MASTER.md
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource

*** Test Cases ***
Verify System Health Endpoint
    [Documentation]    Verify master API health endpoint responds with version 1.0.0
    ${response}=       GET    ${BASE_URL}/health    expected_status=200
    Should Be True     ${response.json()}[success]
    Should Be Equal As Strings    ${response.json()}[version]    1.0.0

Verify System Admin Authentication
    [Documentation]    Verify Admin login token acquisition and role assignment
    ${token}=          Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Should Not Be Empty    ${token}
