*** Settings ***
Documentation    Module 28: Reports & Management Analytics Core Keywords
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Library          RequestsLibrary
Library          Collections
Library          OperatingSystem

*** Keywords ***
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
    [Arguments]    ${token}    ${reportId}    ${format}=CSV    ${filters}=${None}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    format=${format}
    IF    ${filters} != ${None}
        Set To Dictionary    ${payload}    filters=${filters}
    END
    ${response}=   POST    ${BASE_URL}/reports/execute/${reportId}    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Report Execution Status Via API
    [Arguments]    ${token}    ${executionId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/reports/executions/${executionId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Download Report File Via API
    [Arguments]    ${token}    ${executionId}    ${format}=csv
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary    format=${format}
    ${response}=   GET    ${BASE_URL}/reports/executions/${executionId}/download    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

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
