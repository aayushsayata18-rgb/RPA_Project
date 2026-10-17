*** Settings ***
Documentation    Module 28: Reports & Management Analytics RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections
Library          OperatingSystem

*** Keywords ***
# --- CATALOG & EXECUTION KEYWORDS ---

Get Report Catalog Via API
    [Arguments]    ${token}    ${category}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${category}' != '${EMPTY}'
        Set To Dictionary    ${params}    category=${category}
    END
    ${response}=   GET    ${BASE_URL}/reports/catalog    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Report Definition Via API
    [Arguments]    ${token}    ${reportId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/reports/catalog/${reportId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Execute Report Via API
    [Arguments]    ${token}    ${reportId}    ${format}=CSV    ${parameters}=${None}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    format=${format}
    IF    ${parameters} != ${None}
        Set To Dictionary    ${payload}    parameters=${parameters}
    END
    ${response}=   POST    ${BASE_URL}/reports/execute/${reportId}    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Report Execution Status Via API
    [Arguments]    ${token}    ${executionId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/reports/executions/${executionId}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Report Executions Via API
    [Arguments]    ${token}    ${limit}=10
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary    limit=${limit}
    ${response}=   GET    ${BASE_URL}/reports/executions    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Download Report File Via API
    [Arguments]    ${token}    ${executionId}    ${format}=csv
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary    format=${format}
    ${response}=   GET    ${BASE_URL}/reports/executions/${executionId}/download    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- DASHBOARDS & KPIS KEYWORDS ---

Get Departmental Dashboard Via API
    [Arguments]    ${token}    ${type}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/reports/dashboard/${type}    headers=${headers}    expected_status=any
    RETURN         ${response}

List KPIs Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/reports/kpis    headers=${headers}    expected_status=any
    RETURN         ${response}

Calculate KPIs Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/reports/kpis/calculate    headers=${headers}    expected_status=any
    RETURN         ${response}

Get KPI Trend Via API
    [Arguments]    ${token}    ${code}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/reports/kpis/${code}/trend    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- SCHEDULES & ALERTS KEYWORDS ---

List Report Schedules Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/reports/schedules    headers=${headers}    expected_status=any
    RETURN         ${response}

Create Report Schedule Via API
    [Arguments]    ${token}    ${reportCode}    ${frequency}=DAILY    ${format}=CSV    ${recipients}=${None}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reportCode=${reportCode}    frequency=${frequency}    format=${format}
    IF    ${recipients} != ${None}
        Set To Dictionary    ${payload}    recipients=${recipients}
    END
    ${response}=   POST    ${BASE_URL}/reports/schedules    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Update Report Schedule Via API
    [Arguments]    ${token}    ${scheduleId}    ${updates}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   PATCH   ${BASE_URL}/reports/schedules/${scheduleId}    json=${updates}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Analytics Alert Rules Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/reports/alerts    headers=${headers}    expected_status=any
    RETURN         ${response}

Acknowledge Alert Rule Via API
    [Arguments]    ${token}    ${ruleId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/reports/alerts/${ruleId}/acknowledge    headers=${headers}    expected_status=any
    RETURN         ${response}

Resolve Alert Rule Via API
    [Arguments]    ${token}    ${ruleId}    ${note}=Resolved by automated RPA
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    note=${note}
    ${response}=   POST    ${BASE_URL}/reports/alerts/${ruleId}/resolve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
