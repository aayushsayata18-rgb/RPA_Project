*** Settings ***
Documentation    Module 28: Legacy Report Portal Extraction Keywords (Section 144-146)
Resource         ../../resources/common.resource
Library          RequestsLibrary
Library          Collections
Library          OperatingSystem

*** Keywords ***
Extract Legacy Portal Report
    [Arguments]    ${token}    ${reportType}    ${period}
    [Documentation]    Simulates automated legacy system report retrieval
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary    type=${reportType}    period=${period}
    ${response}=   GET    ${BASE_URL}/reports/analytics/trends    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Validate Extracted File Integrity
    [Arguments]    ${content}    ${minBytes}=10
    ${len}=    Get Length    ${content}
    Should Be True    ${len} >= ${minBytes}
