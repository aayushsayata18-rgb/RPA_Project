*** Settings ***
Documentation    Module 28: Cross-Module Reconciliation & Data Quality Keywords (Section 98-99, 134-135)
Resource         ../../resources/common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
Trigger Data Quality Audit Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/reports/quality/audit    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Cross Module Reconciliation Metrics Via API
    [Arguments]    ${token}    ${metric}=REVENUE
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary    metric=${metric}
    ${response}=   GET    ${BASE_URL}/reports/analytics/comparison    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}
