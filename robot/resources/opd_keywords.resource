*** Settings ***
Documentation    Module 3 OPD Queue Management Resource Keywords
Resource         common.resource
Resource         authentication.resource

*** Keywords ***
Perform Online OPD CheckIn
    [Arguments]    ${token}    ${appointmentId}    ${channel}=ONLINE_SELF_CHECKIN    ${override}=${False}    ${expected_status}=201
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    appointmentId=${appointmentId}    channel=${channel}    override=${override}
    ${response}=   POST    ${BASE_URL}/v1/opd/check-in    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Perform FrontDesk OPD CheckIn
    [Arguments]    ${token}    ${appointmentId}    ${override}=${False}    ${overrideReason}=${EMPTY}    ${expected_status}=201
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    appointmentId=${appointmentId}    channel=FRONT_DESK    override=${override}    overrideReason=${overrideReason}
    ${response}=   POST    ${BASE_URL}/v1/opd/check-in    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Get OPD Queues List
    [Arguments]    ${token}    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/v1/opd/queues    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Get OPD Queue By Id
    [Arguments]    ${token}    ${queueId}    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/v1/opd/queues/${queueId}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Get OPD Token Details
    [Arguments]    ${token}    ${tokenId}    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/v1/opd/tokens/${tokenId}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Call OPD Token
    [Arguments]    ${token}    ${tokenId}    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/v1/opd/tokens/${tokenId}/call    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Start OPD Service
    [Arguments]    ${token}    ${tokenId}    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/v1/opd/tokens/${tokenId}/start    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Complete OPD Service
    [Arguments]    ${token}    ${tokenId}    ${notes}=Consultation completed    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    notes=${notes}
    ${response}=   POST    ${BASE_URL}/v1/opd/tokens/${tokenId}/complete    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Skip OPD Token
    [Arguments]    ${token}    ${tokenId}    ${reason}=PATIENT_NOT_PRESENT    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/v1/opd/tokens/${tokenId}/skip    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Return Skipped OPD Token
    [Arguments]    ${token}    ${tokenId}    ${reason}=PATIENT_RETURNED    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/v1/opd/tokens/${tokenId}/return    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Transfer OPD Token
    [Arguments]    ${token}    ${tokenId}    ${targetDepartmentId}    ${reason}=CROSS_CONSULTATION    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    targetDepartmentId=${targetDepartmentId}    reason=${reason}
    ${response}=   POST    ${BASE_URL}/v1/opd/tokens/${tokenId}/transfer    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Assign Clinical Priority
    [Arguments]    ${token}    ${tokenId}    ${priorityType}    ${priorityReason}    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    priorityType=${priorityType}    priorityReason=${priorityReason}
    ${response}=   POST    ${BASE_URL}/v1/opd/tokens/${tokenId}/priority    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Pause OPD Queue
    [Arguments]    ${token}    ${queueId}    ${reason}=DOCTOR_UNAVAILABLE    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/v1/opd/queues/${queueId}/pause    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Resume OPD Queue
    [Arguments]    ${token}    ${queueId}    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/v1/opd/queues/${queueId}/resume    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Close OPD Queue
    [Arguments]    ${token}    ${queueId}    ${policy}=AUTO_RESOLVE    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    policy=${policy}
    ${response}=   POST    ${BASE_URL}/v1/opd/queues/${queueId}/close    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Trigger OPD No Show Processing
    [Arguments]    ${token}    ${gracePeriodMinutes}=15    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    gracePeriodMinutes=${gracePeriodMinutes}
    ${response}=   POST    ${BASE_URL}/v1/opd/no-show/process    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}

Trigger OPD Queue Reconciliation
    [Arguments]    ${token}    ${expected_status}=200
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/v1/opd/reconcile    headers=${headers}    expected_status=${expected_status}
    RETURN         ${response}
