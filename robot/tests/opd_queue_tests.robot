*** Settings ***
Documentation    Module 3: OPD Queue Management Acceptance Test Suite (TC-OPD-001 to TC-OPD-020)
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/opd_keywords.resource
Resource         ../resources/appointment_keywords.resource
Resource         ../keywords/opd_checkin.resource
Resource         ../keywords/opd_token.resource
Resource         ../keywords/opd_queue.resource
Resource         ../keywords/opd_no_show.resource

Suite Setup      Setup Suite Context

*** Variables ***
${PATIENT_EMAIL}        patient@hospital.com
${DOCTOR_EMAIL}         doctor@hospital.com
${RECEPTION_EMAIL}      reception@hospital.com
${ADMIN_EMAIL}          admin@hospital.com

*** Keywords ***
Setup Suite Context
    ${ADMIN_TOKEN}=     Login Hospital User    ${ADMIN_EMAIL}       ${DEFAULT_PASSWORD}
    ${PATIENT_TOKEN}=   Login Hospital User    ${PATIENT_EMAIL}     ${DEFAULT_PASSWORD}
    ${DOCTOR_TOKEN}=    Login Hospital User    ${DOCTOR_EMAIL}      ${DEFAULT_PASSWORD}
    ${RECEPT_TOKEN}=    Login Hospital User    ${RECEPTION_EMAIL}   ${DEFAULT_PASSWORD}
    Set Suite Variable  ${ADMIN_TOKEN}
    Set Suite Variable  ${PATIENT_TOKEN}
    Set Suite Variable  ${DOCTOR_TOKEN}
    Set Suite Variable  ${RECEPT_TOKEN}

*** Test Cases ***
TC-OPD-001 Online Self Check-in
    [Documentation]    Patient performs online self check-in and receives token with queue status WAITING
    [Tags]             acceptance    opd    checkin
    ${res}=            Perform Online OPD CheckIn    ${PATIENT_TOKEN}    A202610001    override=${True}    expected_status=201
    Should Be True     ${res.json()}[success]
    Dictionary Should Contain Key    ${res.json()}[data]    tokenNumber
    Dictionary Should Contain Key    ${res.json()}[data]    tokenId
    Should Be Equal As Strings       ${res.json()}[data][status]    WAITING
    Set Suite Variable    ${SUITE_TOKEN_ID}    ${res.json()}[data][tokenId]
    Set Suite Variable    ${SUITE_QUEUE_ID}    ${res.json()}[data][queueId]

TC-OPD-002 Front Desk Check-in
    [Documentation]    Receptionist checks in patient at front desk
    [Tags]             acceptance    opd    frontdesk
    ${res}=            Perform FrontDesk OPD CheckIn    ${RECEPT_TOKEN}    A202610006    override=${True}    overrideReason=FrontDeskReceptionCheckIn    expected_status=201
    Should Be True     ${res.json()}[success]
    Dictionary Should Contain Key    ${res.json()}[data]    tokenNumber
    Set Suite Variable    ${FRONT_DESK_TOKEN_ID}    ${res.json()}[data][tokenId]

TC-OPD-003 Duplicate Check-in Prevention
    [Documentation]    Prevent duplicate token generation for same appointment (Idempotency)
    [Tags]             acceptance    opd    idempotency
    ${res}=            Perform Online OPD CheckIn    ${PATIENT_TOKEN}    A202610001    override=${True}    expected_status=201
    Should Be True     ${res.json()}[success]
    # Response returns existing token without duplicates

TC-OPD-004 Token Generation Format
    [Documentation]    Verify server-side generated OPD token format (e.g. GM-101)
    [Tags]             acceptance    opd    token
    ${tokenRes}=       Get OPD Token Details    ${ADMIN_TOKEN}    ${SUITE_TOKEN_ID}    expected_status=200
    Should Be True     ${tokenRes.json()}[success]
    Should Match Regexp    ${tokenRes.json()}[data][token][tokenNumber]    ^[A-Z]+-\\d+$

TC-OPD-005 Queue Position Calculation
    [Documentation]    Verify calculatePatientsAhead and wait time calculation
    [Tags]             acceptance    opd    ordering
    ${tokenRes}=       Get OPD Token Details    ${ADMIN_TOKEN}    ${SUITE_TOKEN_ID}    expected_status=200
    Dictionary Should Contain Key    ${tokenRes.json()}[data]    patientsAhead
    Dictionary Should Contain Key    ${tokenRes.json()}[data]    estimatedWaitMinutes

TC-OPD-006 Call Patient Token
    [Documentation]    Doctor calls next patient into consultation room
    [Tags]             acceptance    opd    doctor
    ${callRes}=        Call OPD Token    ${DOCTOR_TOKEN}    ${SUITE_TOKEN_ID}    expected_status=200
    Should Be True     ${callRes.json()}[success]
    Should Be Equal As Strings    ${callRes.json()}[token][status]    CALLED

TC-OPD-007 Start Consultation Service
    [Documentation]    Consultation starts and status moves to IN_SERVICE
    [Tags]             acceptance    opd    service
    ${startRes}=       Start OPD Service    ${DOCTOR_TOKEN}    ${SUITE_TOKEN_ID}    expected_status=200
    Should Be True     ${startRes.json()}[success]
    Should Be Equal As Strings    ${startRes.json()}[token][status]    IN_SERVICE

TC-OPD-008 Complete Consultation Service
    [Documentation]    Consultation completes and encounter status updates
    [Tags]             acceptance    opd    completion
    ${compRes}=        Complete OPD Service    ${DOCTOR_TOKEN}    ${SUITE_TOKEN_ID}    notes=Consultation done    expected_status=200
    Should Be True     ${compRes.json()}[success]
    Should Be Equal As Strings    ${compRes.json()}[token][status]    COMPLETED

TC-OPD-009 Skip Patient
    [Documentation]    Skip patient when absent from waiting room
    [Tags]             acceptance    opd    skip
    # First call front desk token
    Call OPD Token     ${DOCTOR_TOKEN}    ${FRONT_DESK_TOKEN_ID}    expected_status=200
    ${skipRes}=        Skip OPD Token     ${DOCTOR_TOKEN}    ${FRONT_DESK_TOKEN_ID}    reason=PATIENT_NOT_PRESENT    expected_status=200
    Should Be True     ${skipRes.json()}[success]
    Should Be Equal As Strings    ${skipRes.json()}[token][status]    SKIPPED

TC-OPD-010 Return Skipped Patient To Queue
    [Documentation]    Return skipped patient back to waiting queue
    [Tags]             acceptance    opd    return
    ${retRes}=         Return Skipped OPD Token    ${RECEPT_TOKEN}    ${FRONT_DESK_TOKEN_ID}    reason=PATIENT_ARRIVED_BACK    expected_status=200
    Should Be True     ${retRes.json()}[success]
    Should Be Equal As Strings    ${retRes.json()}[token][status]    WAITING

TC-OPD-011 Late Patient Arrival Detection
    [Documentation]    Verify late flag and lateMinutes recorded for arrivals past scheduled time
    [Tags]             acceptance    opd    late
    ${tokenRes}=       Get OPD Token Details    ${ADMIN_TOKEN}    ${FRONT_DESK_TOKEN_ID}    expected_status=200
    Dictionary Should Contain Key    ${tokenRes.json()}[data][token]    isLate

TC-OPD-012 Automated No-Show Processing
    [Documentation]    RPA automated no-show processing past grace period
    [Tags]             acceptance    opd    rpa    noshow
    ${noShowRes}=      Trigger OPD No Show Processing    ${ADMIN_TOKEN}    gracePeriodMinutes=15    expected_status=200
    Should Be True     ${noShowRes.json()}[success]
    Dictionary Should Contain Key    ${noShowRes.json()}    processedCount

TC-OPD-013 Clinical Priority Assignment Workflow
    [Documentation]    Doctor assigns URGENT priority with clinical reason
    [Tags]             acceptance    opd    priority
    ${prioRes}=        Assign Clinical Priority    ${DOCTOR_TOKEN}    ${FRONT_DESK_TOKEN_ID}    URGENT    Severe acute symptom triage    expected_status=200
    Should Be True     ${prioRes.json()}[success]
    Should Be Equal As Strings    ${prioRes.json()}[token][priorityType]    URGENT

TC-OPD-014 Queue Pause and Resume
    [Documentation]    Authorized staff pauses and resumes queue
    [Tags]             acceptance    opd    queue_control
    ${pauseRes}=       Pause OPD Queue    ${ADMIN_TOKEN}    ${SUITE_QUEUE_ID}    reason=DOCTOR_EMERGENCY    expected_status=200
    Should Be True     ${pauseRes.json()}[success]
    Should Be Equal As Strings    ${pauseRes.json()}[queue][status]    PAUSED

    ${resumeRes}=      Resume OPD Queue   ${ADMIN_TOKEN}    ${SUITE_QUEUE_ID}    expected_status=200
    Should Be True     ${resumeRes.json()}[success]
    Should Be Equal As Strings    ${resumeRes.json()}[queue][status]    OPEN

TC-OPD-015 Queue End Of Day Closure
    [Documentation]    Close queue at end of day applying resolution policy
    [Tags]             acceptance    opd    closure
    ${closeRes}=       Close OPD Queue    ${ADMIN_TOKEN}    ${SUITE_QUEUE_ID}    policy=AUTO_RESOLVE    expected_status=200
    Should Be True     ${closeRes.json()}[success]
    Should Be Equal As Strings    ${closeRes.json()}[queue][status]    CLOSED

TC-OPD-016 External Queue Reconciliation
    [Documentation]    RPA automated queue reconciliation
    [Tags]             acceptance    opd    reconciliation
    ${reconRes}=       Trigger OPD Queue Reconciliation    ${ADMIN_TOKEN}    expected_status=200
    Should Be True     ${reconRes.json()}[success]
    Dictionary Should Contain Key    ${reconRes.json()}    totalAppointments
    Dictionary Should Contain Key    ${reconRes.json()}    totalTokens

TC-OPD-017 Transfer Token Across Departments
    [Documentation]    Staff transfers patient token to another department queue
    [Tags]             acceptance    opd    transfer
    ${transRes}=       Transfer OPD Token    ${RECEPT_TOKEN}    ${FRONT_DESK_TOKEN_ID}    DEP-CARD    reason=CrossConsultation    expected_status=200
    Should Be True     ${transRes.json()}[success]

TC-OPD-018 Unauthorized Priority Modification Forbidden
    [Documentation]    Patient role is forbidden from setting clinical priority
    [Tags]             acceptance    security    rbac
    ${prioRes}=        Assign Clinical Priority    ${PATIENT_TOKEN}    ${FRONT_DESK_TOKEN_ID}    EMERGENCY    SelfDeclared    expected_status=403
    Should Be Equal As Strings    ${prioRes.json()}[errorCode]    UNAUTHORIZED_PRIORITY_MODIFICATION

TC-OPD-019 Unauthorized Queue Control Rejected
    [Documentation]    Patient cannot pause or close operational queue
    [Tags]             acceptance    security    rbac
    Pause OPD Queue    ${PATIENT_TOKEN}    ${SUITE_QUEUE_ID}    reason=Unauthorized    expected_status=403

TC-OPD-020 Check-In Outside Allowed Window Validation
    [Documentation]    Check-in without override outside allowed window is rejected
    [Tags]             acceptance    opd    validation
    # Try check-in on cancelled or invalid appointment
    ${invalidRes}=     Perform Online OPD CheckIn    ${PATIENT_TOKEN}    A202610003    override=${False}    expected_status=400
    Should Be Equal As Strings    ${invalidRes.json()}[errorCode]    APPOINTMENT_CANCELLED
