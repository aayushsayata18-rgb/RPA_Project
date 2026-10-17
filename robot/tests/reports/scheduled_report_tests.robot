*** Settings ***
Documentation    Module 28: Scheduled Reports Lifecycle Tests
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
TC-RPT-SCH-001 Create Recurring Daily Report Schedule
    [Documentation]    Creates a scheduled report and validates SCHED-YYYY-NNNNNN identifier
    ${res}=    Create Report Schedule Via API    ${AUTH_TOKEN}    BED_OCCUPANCY    DAILY    CSV
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=    Set Variable    ${res.json()}[data]
    Should Match Regexp    ${data}[scheduleId]    ^SCHED-\\d{4}-\\d{6}$
    Should Be Equal As Strings    ${data}[reportCode]    BED_OCCUPANCY
    Should Be Equal As Strings    ${data}[frequency]     DAILY

TC-RPT-SCH-002 List Configured Report Schedules
    [Documentation]    Lists report schedules and verifies non-empty response
    ${res}=    List Report Schedules Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${res.status_code}    200
    ${schedules}=    Set Variable    ${res.json()}[data]
    ${count}=    Get Length    ${schedules}
    Should Be True    ${count} >= 1
