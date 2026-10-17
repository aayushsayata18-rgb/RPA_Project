*** Settings ***
Documentation    Module 28: Cross-Module Reconciliation & Data Quality Tests
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../keywords/reports/reconciliation_keywords.robot
Library          Collections

Suite Setup      Setup Suite Token

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Suite Token
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}

*** Test Cases ***
TC-RPT-REC-001 Run Data Quality Audit Surveillance
    [Documentation]    Executes autonomous data quality surveillance and verifies finding schema
    ${res}=    Trigger Data Quality Audit Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${res.status_code}    200
    ${data}=    Set Variable    ${res.json()}[data]
    Dictionary Should Contain Key    ${data}    auditTimestamp
    Dictionary Should Contain Key    ${data}    totalFindings
    Dictionary Should Contain Key    ${data}    findings

TC-RPT-REC-002 Cross-Module Revenue Period Reconciliation
    [Documentation]    Compares period-over-period financial reconciliation metrics
    ${res}=    Get Cross Module Reconciliation Metrics Via API    ${AUTH_TOKEN}    REVENUE
    Should Be Equal As Integers    ${res.status_code}    200
    ${data}=    Set Variable    ${res.json()}[data]
    Dictionary Should Contain Key    ${data}    currentPeriod
    Dictionary Should Contain Key    ${data}    previousPeriod
    Dictionary Should Contain Key    ${data}    changePercent
    Dictionary Should Contain Key    ${data}    direction
