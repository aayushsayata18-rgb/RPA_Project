*** Settings ***
Documentation    Module 25: Patient Feedback & Grievances RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
# --- SUBMISSION & QUERY KEYWORDS ---

Submit Feedback Via API
    [Arguments]    ${token}    ${subject}    ${description}    ${category}=Housekeeping    ${type}=COMPLAINT    ${priority}=MEDIUM    ${rating}=3    ${patientId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    subject=${subject}
    ...    description=${description}
    ...    category=${category}
    ...    type=${type}
    ...    priority=${priority}
    ...    rating=${rating}
    IF    '${patientId}' != '${EMPTY}'    Set To Dictionary    ${payload}    patientId=${patientId}
    ${response}=   POST    ${BASE_URL}/feedback    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Feedback Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${category}=${EMPTY}    ${priority}=${EMPTY}    ${type}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'      Set To Dictionary    ${params}    status=${status}
    IF    '${category}' != '${EMPTY}'    Set To Dictionary    ${params}    category=${category}
    IF    '${priority}' != '${EMPTY}'    Set To Dictionary    ${params}    priority=${priority}
    IF    '${type}' != '${EMPTY}'        Set To Dictionary    ${params}    type=${type}
    ${response}=   GET    ${BASE_URL}/feedback    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Feedback Detail Via API
    [Arguments]    ${token}    ${feedbackId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/feedback/${feedbackId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Assign Feedback Via API
    [Arguments]    ${token}    ${feedbackId}    ${departmentId}=${EMPTY}    ${assignedTo}=${EMPTY}    ${reason}=Operational assignment
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    IF    '${departmentId}' != '${EMPTY}'    Set To Dictionary    ${payload}    departmentId=${departmentId}
    IF    '${assignedTo}' != '${EMPTY}'      Set To Dictionary    ${payload}    assignedTo=${assignedTo}
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/assign    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Change Feedback Priority Via API
    [Arguments]    ${token}    ${feedbackId}    ${priority}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    priority=${priority}
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/priority    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Add Internal Note Via API
    [Arguments]    ${token}    ${feedbackId}    ${note}    ${visibility}=INTERNAL
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    note=${note}    visibility=${visibility}
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/internal-notes    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- INVESTIGATION KEYWORDS ---

Start Feedback Investigation Via API
    [Arguments]    ${token}    ${feedbackId}    ${investigatorId}=${EMPTY}    ${notes}=Investigation initiated
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    notes=${notes}
    IF    '${investigatorId}' != '${EMPTY}'    Set To Dictionary    ${payload}    investigatorId=${investigatorId}
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/investigation    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Update Feedback Investigation Via API
    [Arguments]    ${token}    ${feedbackId}    ${investigationId}    ${findings}    ${conclusion}    ${recommendation}    ${status}=COMPLETED
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    investigationId=${investigationId}
    ...    findings=${findings}
    ...    conclusion=${conclusion}
    ...    recommendation=${recommendation}
    ...    status=${status}
    ${response}=   PATCH    ${BASE_URL}/feedback/${feedbackId}/investigation    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Feedback Investigation Via API
    [Arguments]    ${token}    ${feedbackId}    ${investigationId}    ${notes}=Approved by manager
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    investigationId=${investigationId}
    ...    notes=${notes}
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/investigation/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- RESPONSE & RESOLUTION KEYWORDS ---

Draft Feedback Response Via API
    [Arguments]    ${token}    ${feedbackId}    ${responseText}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    responseText=${responseText}
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/response    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Feedback Response Via API
    [Arguments]    ${token}    ${feedbackId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/response/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Send Feedback Response Via API
    [Arguments]    ${token}    ${feedbackId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/response/send    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Resolve Feedback Via API
    [Arguments]    ${token}    ${feedbackId}    ${summary}=Resolved per protocol    ${actionTaken}=Checklist reinforced
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    summary=${summary}    actionTaken=${actionTaken}
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/resolve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Close Feedback Via API
    [Arguments]    ${token}    ${feedbackId}    ${notes}=Case closed
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    notes=${notes}
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/close    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Reopen Feedback Via API
    [Arguments]    ${token}    ${feedbackId}    ${reason}=Patient requested reconsideration
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/feedback/${feedbackId}/reopen    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- RPA KEYWORDS ---

Import External Complaint Via API
    [Arguments]    ${token}    ${externalSystem}    ${externalReference}    ${subject}    ${description}    ${category}=Housekeeping    ${priority}=MEDIUM
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    externalSystem=${externalSystem}
    ...    externalReference=${externalReference}
    ...    subject=${subject}
    ...    description=${description}
    ...    category=${category}
    ...    priority=${priority}
    ${response}=   POST    ${BASE_URL}/feedback/rpa/import    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Check SLA Breaches Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ${response}=   POST    ${BASE_URL}/feedback/sla/check-breaches    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Feedback Analytics Summary Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/feedback/reports/summary    headers=${headers}    expected_status=any
    RETURN         ${response}
