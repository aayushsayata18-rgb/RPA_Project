*** Settings ***
Documentation    Module 28: Automated Report Download & File Integrity Test Suite
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../keywords/reports/report_keywords.resource
Library          Collections
Library          String

Suite Setup      Setup Suite Token

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Suite Token
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}

*** Test Cases ***
TC-RPT-DL-001 Execute Report And Validate CSV Download
    [Documentation]    Executes Bed Occupancy report and downloads resulting CSV file
    ${res}=    Execute Report Via API    ${AUTH_TOKEN}    BED_OCCUPANCY    format=CSV
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${execId}=    Set Variable    ${res.json()}[data][executionId]

    ${dlRes}=    Download Report File Via API    ${AUTH_TOKEN}    ${execId}    format=csv
    Should Be Equal As Integers    ${dlRes.status_code}    200
    ${bytes}=    Get Length    ${dlRes.content}
    Should Be True    ${bytes} > 0

TC-RPT-DL-002 Execute Report And Validate PDF Download
    [Documentation]    Executes Bed Occupancy report and downloads resulting PDF file
    ${res}=    Execute Report Via API    ${AUTH_TOKEN}    BED_OCCUPANCY    format=PDF
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${execId}=    Set Variable    ${res.json()}[data][executionId]

    ${dlRes}=    Download Report File Via API    ${AUTH_TOKEN}    ${execId}    format=pdf
    Should Be Equal As Integers    ${dlRes.status_code}    200
    ${bytes}=    Get Length    ${dlRes.content}
    Should Be True    ${bytes} > 0
