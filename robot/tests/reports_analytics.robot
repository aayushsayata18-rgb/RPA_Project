*** Settings ***
Documentation    Module 28: Reports & Management Analytics RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/report_keywords.resource
Library          String
Library          Collections
Library          OperatingSystem

Suite Setup      Setup Reports Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${EXEC_ID}            ${EMPTY}
${SCHEDULE_ID}        ${EMPTY}
${ALERT_RULE_ID}      ${EMPTY}

*** Keywords ***
Setup Reports Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}

*** Test Cases ***
TC-RPT-001 Discover Report Catalog And Validate Standard 24 Reports
    [Documentation]    Verifies that the catalog exposes 24 standard hospital reports across clinical, operational, financial, and HR domains
    ${res}=    Get Report Catalog Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${res.status_code}    200
    ${reports}=    Set Variable    ${res.json()}[data]
    ${count}=    Get Length    ${reports}
    Should Be True    ${count} >= 24

    # Verify key report codes exist
    ${codes}=    Create List
    FOR    ${rpt}    IN    @{reports}
        Append To List    ${codes}    ${rpt}[reportCode]
    END
    List Should Contain Value    ${codes}    PATIENT_REGISTRATION_SUMMARY
    List Should Contain Value    ${codes}    BED_OCCUPANCY
    List Should Contain Value    ${codes}    BILLING_SUMMARY
    List Should Contain Value    ${codes}    RPA_EXECUTION
    List Should Contain Value    ${codes}    ADMISSION_SUMMARY

TC-RPT-002 Concurrency-Safe Report Execution For Bed Occupancy
    [Documentation]    Executes BED_OCCUPANCY synchronously and verifies EXEC-YYYY-NNNNNN identifier format
    ${res}=    Execute Report Via API    ${AUTH_TOKEN}    BED_OCCUPANCY    format=CSV
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=    Set Variable    ${res.json()}[data]
    Set Suite Variable    ${EXEC_ID}    ${data}[executionId]

    Should Match Regexp    ${data}[executionId]    ^EXEC-\\d{4}-\\d{6}$
    Should Be Equal As Strings    ${data}[reportCode]    BED_OCCUPANCY
    Should Be Equal As Strings    ${data}[status]        COMPLETED
    Should Be True    ${data}[rowCount] >= 0
    Should Not Be Empty    ${data}[fileChecksum]

TC-RPT-003 Multi-Format Report Export And File Download (CSV & PDF)
    [Documentation]    Executes report export in PDF format and validates file download with authentication
    ${resPdf}=    Execute Report Via API    ${AUTH_TOKEN}    BED_OCCUPANCY    format=PDF
    Should Be True    ${resPdf.status_code} == 200 or ${resPdf.status_code} == 201
    ${pdfData}=    Set Variable    ${resPdf.json()}[data]
    ${pdfExecId}=  Set Variable    ${pdfData}[executionId]

    # Download CSV format
    ${dlCsv}=    Download Report File Via API    ${AUTH_TOKEN}    ${EXEC_ID}    format=csv
    Should Be Equal As Integers    ${dlCsv.status_code}    200
    ${csvBytes}=    Get Length    ${dlCsv.content}
    Should Be True    ${csvBytes} > 0

    # Download PDF format
    ${dlPdf}=    Download Report File Via API    ${AUTH_TOKEN}    ${pdfExecId}    format=pdf
    Should Be Equal As Integers    ${dlPdf.status_code}    200
    ${pdfBytes}=    Get Length    ${dlPdf.content}
    Should Be True    ${pdfBytes} > 0

TC-RPT-004 Execution Status Query And Audited Metadata
    [Documentation]    Queries execution status by executionId and verifies completion metrics
    ${res}=    Get Report Execution Status Via API    ${AUTH_TOKEN}    ${EXEC_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    ${data}=    Set Variable    ${res.json()}[data]
    Should Be Equal As Strings    ${data}[executionId]    ${EXEC_ID}
    Should Be Equal As Strings    ${data}[status]         COMPLETED
    Should Be True    ${data}[durationMs] >= 0

TC-RPT-005 Real-Time Executive Management Dashboard Aggregation
    [Documentation]    Verifies that the executive management dashboard produces live metrics for revenue, occupancy, and bot success
    ${res}=    Get Departmental Dashboard Via API    ${AUTH_TOKEN}    management
    Should Be Equal As Integers    ${res.status_code}    200
    ${dash}=    Set Variable    ${res.json()}[data]
    Dictionary Should Contain Key    ${dash}    kpiSummary
    ${kpi}=     Set Variable    ${dash}[kpiSummary]
    Dictionary Should Contain Key    ${kpi}    totalPatients
    Dictionary Should Contain Key    ${kpi}    bedOccupancyRate
    Dictionary Should Contain Key    ${kpi}    totalBilledINR
    Dictionary Should Contain Key    ${kpi}    rpaSuccessRate

TC-RPT-006 Clinical And Operations Dashboard Metrics
    [Documentation]    Verifies operations dashboard metrics covering beds, appointments, and diagnostic worklists
    ${res}=    Get Departmental Dashboard Via API    ${AUTH_TOKEN}    operations
    Should Be Equal As Integers    ${res.status_code}    200
    ${ops}=    Set Variable    ${res.json()}[data]
    Dictionary Should Contain Key    ${ops}    beds
    Dictionary Should Contain Key    ${ops}    activeOpdQueueTokens
    Dictionary Should Contain Key    ${ops}    pendingDiagnosticLabs

TC-RPT-007 Enterprise KPI Calculation And Trend Tracking
    [Documentation]    Triggers real-time enterprise KPI recalculation and verifies snapshots and trends
    ${calcRes}=    Calculate KPIs Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${calcRes.status_code}    200

    ${listRes}=    List KPIs Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${listRes.status_code}    200
    ${kpis}=       Set Variable    ${listRes.json()}[data]
    ${count}=      Get Length      ${kpis}
    Should Be True    ${count} >= 8

    # Query trend for BED_OCCUPANCY_RATE
    ${trendRes}=   Get KPI Trend Via API    ${AUTH_TOKEN}    BED_OCCUPANCY_RATE
    Should Be Equal As Integers    ${trendRes.status_code}    200
    ${trends}=     Set Variable    ${trendRes.json()}[data]
    ${tCount}=     Get Length      ${trends}
    Should Be True    ${tCount} >= 1

TC-RPT-008 Analytics Alert Rule Lifecycle
    [Documentation]    Lists alert rules, acknowledges a triggered alert, and resolves it with audit note
    ${listRes}=    List Analytics Alert Rules Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${listRes.status_code}    200
    ${rules}=      Set Variable    ${listRes.json()}[data]
    ${rCount}=     Get Length      ${rules}
    Should Be True    ${rCount} >= 1

    ${firstRule}=  Set Variable    ${rules}[0]
    ${ruleId}=     Set Variable    ${firstRule}[_id]
    Set Suite Variable    ${ALERT_RULE_ID}    ${ruleId}

    # Acknowledge alert rule
    ${ackRes}=     Acknowledge Alert Rule Via API    ${AUTH_TOKEN}    ${ALERT_RULE_ID}
    Should Be Equal As Integers    ${ackRes.status_code}    200
    ${ackData}=    Set Variable    ${ackRes.json()}[data]
    Should Be Equal As Strings    ${ackData}[status]    ACKNOWLEDGED

    # Resolve alert rule
    ${resRes}=     Resolve Alert Rule Via API    ${AUTH_TOKEN}    ${ALERT_RULE_ID}    Resolved via automated Robot test
    Should Be Equal As Integers    ${resRes.status_code}    200
    ${resData}=    Set Variable    ${resRes.json()}[data]
    Should Be Equal As Strings    ${resData}[status]    RESOLVED

TC-RPT-009 Automated Report Schedule Creation And Recurrence Toggling
    [Documentation]    Creates a recurring report schedule (SCHED-YYYY-NNNNNN) and toggles enabled status
    ${createRes}=  Create Report Schedule Via API    ${AUTH_TOKEN}    BED_OCCUPANCY    DAILY    CSV
    Should Be True    ${createRes.status_code} == 200 or ${createRes.status_code} == 201
    ${schedData}=  Set Variable    ${createRes.json()}[data]
    Set Suite Variable    ${SCHEDULE_ID}    ${schedData}[scheduleId]

    Should Match Regexp    ${schedData}[scheduleId]    ^SCHED-\\d{4}-\\d{6}$
    Should Be Equal As Strings    ${schedData}[reportCode]    BED_OCCUPANCY
    Should Be Equal As Strings    ${schedData}[frequency]     DAILY

    # Toggle schedule enabled state
    ${updPayload}=    Create Dictionary    enabled=${False}
    ${updRes}=     Update Report Schedule Via API    ${AUTH_TOKEN}    ${SCHEDULE_ID}    ${updPayload}
    Should Be Equal As Integers    ${updRes.status_code}    200
    ${updData}=    Set Variable    ${updRes.json()}[data]
    Should Be Equal As Strings    ${updData}[enabled]    False
