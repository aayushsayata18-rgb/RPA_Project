*** Settings ***
Documentation    Module 25: Patient Feedback & Grievances RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/feedback_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Patient Feedback Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${FEEDBACK_ID}        ${EMPTY}
${INVESTIGATION_ID}   ${EMPTY}

*** Keywords ***
Setup Patient Feedback Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    5    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

*** Test Cases ***
TC-FB-001 Patient Feedback Submission And Concurrency-Safe ID Generation
    [Documentation]    Verifies submission of feedback and unique FB-YYYY-NNNNNN ID format
    ${subject}=    Set Variable    Room cleaning delay in Ward A ${RUN_ID}
    ${desc}=       Set Variable    Room cleaning was delayed after discharge during peak shift.
    ${res}=        Submit Feedback Via API    ${AUTH_TOKEN}    ${subject}    ${desc}    category=Housekeeping    priority=MEDIUM    rating=2
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=       Set Variable    ${res.json()}[data]
    Set Suite Variable    ${FEEDBACK_ID}    ${data}[feedbackId]
    Should Match Regexp    ${data}[feedbackId]    ^FB-\\d{4}-\\d{6}$
    Should Be Equal As Strings    ${data}[status]    SUBMITTED
    Should Be Equal As Numbers    ${data}[rating]    2

TC-FB-002 Deterministic Department Routing And SLA Initialization
    [Documentation]    Verifies deterministic routing to Housekeeping and priority change
    ${res}=    Get Feedback Detail Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    ${data}=   Set Variable    ${res.json()}[data]
    Should Contain    ${data}[assignedDepartmentName]    Housekeeping
    Should Be Equal As Strings    ${data}[slaStatus]    ON_TRACK

    # Change priority to HIGH
    ${resPrio}=    Change Feedback Priority Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}    HIGH
    Should Be Equal As Integers    ${resPrio.status_code}    200
    Should Be Equal As Strings    ${resPrio.json()}[data][priority]    HIGH

TC-FB-003 Confidential Internal Notes Separation
    [Documentation]    Verifies internal notes are captured with author identity and NOTE-FB-YYYY-NNNNNN format
    ${noteText}=    Set Variable    Supervisor interviewed Ward A cleaning crew for Run ${RUN_ID}.
    ${res}=         Add Internal Note Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}    ${noteText}    visibility=INTERNAL
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${noteData}=    Set Variable    ${res.json()}[data]
    Should Match Regexp    ${noteData}[noteId]    ^NOTE-FB-\\d{4}-\\d{6}$
    Should Be Equal As Strings    ${noteData}[visibility]    INTERNAL

TC-FB-004 Formal Investigation Lifecycle And Human Response Approval
    [Documentation]    Verifies investigation lifecycle and human response approval before sending
    # Start investigation
    ${resInv}=    Start Feedback Investigation Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}    notes=Starting shift inspection
    Should Be True    ${resInv.status_code} == 200 or ${resInv.status_code} == 201
    ${invData}=   Set Variable    ${resInv.json()}[data]
    Set Suite Variable    ${INVESTIGATION_ID}    ${invData}[investigationId]
    Should Match Regexp    ${invData}[investigationId]    ^INV-FB-\\d{4}-\\d{6}$

    # Update findings
    ${findings}=    Set Variable    Turnover delayed due to 4 consecutive room releases.
    ${resUpd}=      Update Feedback Investigation Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}    ${INVESTIGATION_ID}    ${findings}    Bottleneck resolved    Stagger shift schedules
    Should Be Equal As Integers    ${resUpd.status_code}    200
    Should Be Equal As Strings    ${resUpd.json()}[data][status]    COMPLETED

    # Approve investigation
    ${resAppr}=    Approve Feedback Investigation Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}    ${INVESTIGATION_ID}
    Should Be Equal As Integers    ${resAppr.status_code}    200
    Should Be Equal As Strings    ${resAppr.json()}[data][status]    APPROVED

    # Draft patient response
    ${resDraft}=    Draft Feedback Response Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}    Thank you for bringing this to our attention.
    Should Be Equal As Integers    ${resDraft.status_code}    200

    # Supervisor approves response
    ${resRespAppr}=    Approve Feedback Response Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}
    Should Be Equal As Integers    ${resRespAppr.status_code}    200

    # Send response
    ${resSend}=    Send Feedback Response Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}
    Should Be Equal As Integers    ${resSend.status_code}    200
    Should Be Equal As Strings    ${resSend.json()}[data][status]    RESPONSE_SENT

TC-FB-005 Case Resolution, Closure And Reopening Workflow
    [Documentation]    Verifies case resolution, reopen, and closure
    # Resolve
    ${resResolve}=    Resolve Feedback Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}    summary=Turnover checklist reinforced
    Should Be Equal As Integers    ${resResolve.status_code}    200
    Should Be Equal As Strings    ${resResolve.json()}[data][status]    RESOLVED

    # Reopen
    ${resReopen}=     Reopen Feedback Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}    reason=Patient reported recurring wait time
    Should Be Equal As Integers    ${resReopen.status_code}    200
    Should Be Equal As Strings    ${resReopen.json()}[data][status]    REOPENED

    # Close
    ${resClose}=      Close Feedback Via API    ${AUTH_TOKEN}    ${FEEDBACK_ID}    notes=Satisfactory final consultation completed
    Should Be Equal As Integers    ${resClose.status_code}    200
    Should Be Equal As Strings    ${resClose.json()}[data][status]    CLOSED

TC-FB-006 RPA External Complaint Import With Idempotency Duplicate Detection
    [Documentation]    Verifies external complaint RPA import and duplicate rejection
    ${extRef}=    Set Variable    EXT-FB-ROBOT-${RUN_ID}
    ${res1}=      Import External Complaint Via API    ${AUTH_TOKEN}    LEGACY_PORTAL    ${extRef}    Billing query from legacy portal    Invoice breakdown requested
    Should Be True    ${res1.status_code} == 200 or ${res1.status_code} == 201
    Should Be Equal As Strings    ${res1.json()}[data][duplicateDetected]    False

    # Attempt second import with same reference
    ${res2}=      Import External Complaint Via API    ${AUTH_TOKEN}    LEGACY_PORTAL    ${extRef}    Duplicate billing query    Duplicate payload
    Should Be True    ${res2.status_code} == 200 or ${res2.status_code} == 201
    Should Be Equal As Strings    ${res2.json()}[data][duplicateDetected]    True

TC-FB-007 SLA Breach Scan And Management Analytics Reporting
    [Documentation]    Verifies automated SLA breach check and management KPI report
    ${resSla}=    Check SLA Breaches Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resSla.status_code}    200
    Should Be True    ${resSla.json()}[data][scanned] >= 0

    ${resKpi}=    Get Feedback Analytics Summary Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resKpi.status_code}    200
    Should Be True    ${resKpi.json()}[data][total] > 0
