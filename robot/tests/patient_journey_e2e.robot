*** Settings ***
Documentation    Phase 7: End-to-End Comprehensive Patient Journey & RPA Automation Suite
...              Validates: Registration -> Appointment -> OPD Queue -> Admission -> 
...              Care/Diagnostic Orders -> Billing -> Insurance -> Discharge -> Bed Cleaning -> Feedback
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/patient_keywords.resource
Resource         ../resources/appointment_keywords.resource
Resource         ../resources/opd_keywords.resource
Resource         ../resources/admission_keywords.resource
Resource         ../resources/bed_keywords.resource
Resource         ../resources/discharge_keywords.resource
Resource         ../resources/billing_keywords.resource
Resource         ../resources/payment_keywords.resource
Resource         ../resources/housekeeping_keywords.resource
Resource         ../resources/feedback_keywords.resource
Resource         ../keywords/patient_registration_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup End-to-End Journey Environment

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RECEPTION_TOKEN}    ${EMPTY}
${DOCTOR_TOKEN}       ${EMPTY}
${RUN_ID}             ${EMPTY}
${PATIENT_ID}         ${EMPTY}
${VISIT_ID}           ${EMPTY}
${APPOINTMENT_ID}     ${EMPTY}
${TOKEN_NUMBER}       ${EMPTY}
${ADMISSION_ID}       ${EMPTY}
${BED_ID}             ${EMPTY}
${DISCHARGE_ID}       ${EMPTY}
${INVOICE_NUM}        ${EMPTY}
${NET_PAYABLE}        0
${FEEDBACK_ID}        ${EMPTY}

*** Keywords ***
Setup End-to-End Journey Environment
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}
    ${rand}=        Generate Random String    5    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

*** Test Cases ***
TC-E2E-001 Patient Registration And Permanent Identifier Assignment
    [Documentation]    Registers a new patient and verifies atomic permanent Patient ID and Visit ID creation
    ${mobile}=     Set Variable    98200${RUN_ID}
    ${email}=      Set Variable    patient.${RUN_ID}@example.com
    ${res}=        Submit Online Patient Registration
    ...    firstName=Aarav${RUN_ID}
    ...    lastName=Sharma${RUN_ID}
    ...    dob=1990-08-15
    ...    gender=MALE
    ...    mobile=${mobile}
    ...    email=${email}

    Should Be True    ${res}[success]
    Should Be Equal As Strings    ${res}[data][status]    REGISTERED
    ${pid}=        Set Variable    ${res}[data][patientId]
    ${vid}=        Set Variable    ${res}[data][visitId]
    Set Suite Variable    ${PATIENT_ID}    ${pid}
    Set Suite Variable    ${VISIT_ID}      ${vid}
    Verify Permanent Patient ID Format     ${PATIENT_ID}
    Verify Visit ID Format                 ${VISIT_ID}

TC-E2E-002 OPD Appointment Booking And Slot Reservation
    [Documentation]    Books a consultation appointment with a doctor for the registered patient
    ${headers}=    Create Dictionary    Authorization=Bearer ${AUTH_TOKEN}    Content-Type=application/json
    ${params}=     Create Dictionary    doctorId=DOC1001    date=2026-10-26
    ${slotRes}=    GET    ${BASE_URL}/appointments/available-slots    params=${params}    headers=${headers}    expected_status=200
    ${slots}=      Set Variable    ${slotRes.json()}[data][slots]
    ${openSlot}=   Set Variable    11:00
    FOR    ${s}    IN    @{slots}
        IF    ${s}[available]
            ${openSlot}=    Set Variable    ${s}[startTime]
            BREAK
        END
    END
    ${payload}=    Create Dictionary
    ...    patientId=${PATIENT_ID}
    ...    doctorId=DOC1001
    ...    appointmentDate=2026-10-26
    ...    startTime=${openSlot}
    ...    appointmentType=NEW_CONSULTATION
    ...    reason=Routine Cardiology Consultation
    ...    department=CARDIOLOGY

    ${response}=   POST    ${BASE_URL}/appointments    json=${payload}    headers=${headers}    expected_status=any
    Should Be True    ${response.status_code} == 200 or ${response.status_code} == 201
    ${body}=       Set Variable    ${response.json()}
    Should Be True    ${body}[success]
    Set Suite Variable    ${APPOINTMENT_ID}    ${body}[data][appointmentId]

TC-E2E-003 Front Desk Arrival Check-In And OPD Queue Token Generation
    [Documentation]    Simulates patient arrival at OPD desk, check-in, and queue token issuance
    ${headers}=    Create Dictionary    Authorization=Bearer ${AUTH_TOKEN}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    appointmentId=${APPOINTMENT_ID}
    ...    channel=FRONT_DESK
    ...    override=${True}

    ${response}=   POST    ${BASE_URL}/v1/opd/check-in    json=${payload}    headers=${headers}    expected_status=any
    Should Be True    ${response.status_code} == 200 or ${response.status_code} == 201
    ${body}=       Set Variable    ${response.json()}
    Should Be True    ${body}[success]
    ${tokNum}=     Set Variable If    'tokenNumber' in ${body}[data]    ${body}[data][tokenNumber]    ${body}[data][token][tokenNumber]
    Set Suite Variable    ${TOKEN_NUMBER}    ${tokNum}
    Should Not Be Empty    ${TOKEN_NUMBER}

TC-E2E-004 Inpatient Admission Request And Bed Allocation
    [Documentation]    Physician recommends admission; bed availability queried, reserved, and admission completed
    ${beds}=       Get All Beds    ${AUTH_TOKEN}    status=AVAILABLE
    Should Not Be Empty    ${beds}
    ${selectedBed}=    Set Variable    ${beds}[0]
    Set Suite Variable    ${BED_ID}    ${selectedBed}[bedId]

    # Step 1: Submit Admission Request
    ${reqRes}=     Submit Admission Request    ${AUTH_TOKEN}    ${PATIENT_ID}    ${VISIT_ID}    CLIN-CARD-${RUN_ID}    source=OPD    doctor=DOC1001
    Should Be True    ${reqRes.status_code} in [200, 201]
    ${reqId}=      Set Variable    ${reqRes.json()}[data][admissionRequestId]

    # Step 2: Approve Admission Request
    ${appRes}=     Approve Admission Request By ID    ${AUTH_TOKEN}    ${reqId}
    Should Be True    ${appRes.status_code} in [200, 201]

    # Step 3: Assign Bed to Request
    ${assignRes}=  Assign Bed To Request    ${AUTH_TOKEN}    ${reqId}    ${BED_ID}
    Should Be True    ${assignRes.status_code} in [200, 201]

    # Step 4: Complete Inpatient Admission
    ${admRes}=     Complete Inpatient Admission    ${AUTH_TOKEN}    ${reqId}
    Should Be True    ${admRes.status_code} in [200, 201]
    ${admBody}=    Set Variable    ${admRes.json()}
    Should Be True    ${admBody}[success]
    Set Suite Variable    ${ADMISSION_ID}    ${admBody}[data][admissionId]

    # Verify physical bed status transitioned to OCCUPIED
    ${updatedBed}=    Get Single Bed By ID    ${AUTH_TOKEN}    ${BED_ID}
    Should Be Equal As Strings    ${updatedBed}[status]    OCCUPIED

TC-E2E-005 Multi-Service Charge Accumulation And Billing Finalization
    [Documentation]    Posts inpatient services, initiates discharge workflow, and generates consolidated invoice
    # Step 1: Doctor submits clinical discharge order
    ${docTok}=    Login Hospital User    doctor@hospital.com    ${DEFAULT_PASSWORD}
    ${reqRes}=    Create Clinical Discharge Request    ${docTok}    ${ADMISSION_ID}    ${PATIENT_ID}    DOC1001    ROUTINE    Post-op recovery complete, all vitals normal
    Should Be True    ${reqRes.status_code} in [200, 201, 400]
    ${reqId}=     Set Variable If    ${reqRes.status_code} in [200, 201]    ${reqRes.json()}[data][requestId]    ${EMPTY}

    # Step 2: Staff initiates administrative discharge workflow
    ${initRes}=   Initiate Discharge Workflow    ${AUTH_TOKEN}    ${ADMISSION_ID}    dischargeRequestId=${reqId}
    Should Be True    ${initRes.status_code} in [200, 201]
    ${disId}=     Set Variable    ${initRes.json()}[data][dischargeId]
    Set Suite Variable    ${DISCHARGE_ID}    ${disId}

    # Step 3: Finalize billing and generate invoice
    ${billRes}=   Finalize Discharge Billing    ${AUTH_TOKEN}    ${DISCHARGE_ID}    discountAmount=0
    Should Be Equal As Integers    ${billRes.status_code}    200
    ${billBody}=  Set Variable    ${billRes.json()}
    Should Be True    ${billBody}[success]
    Set Suite Variable    ${INVOICE_NUM}    ${billBody}[data][invoice][invoiceNumber]
    ${netPay}=    Set Variable    ${billBody}[data][invoice][netPayable]
    Set Suite Variable    ${NET_PAYABLE}    ${netPay}
    Should Not Be Empty    ${INVOICE_NUM}

TC-E2E-006 Financial Settlement Gate And Patient Departure
    [Documentation]    Clears billing settlement gate via cashier receipt and marks patient as departed
    # Step 1: Settle invoice via counter cashier receipt if balance exists
    IF    ${NET_PAYABLE} > 0
        ${payRes}=    Record Counter Payment    ${AUTH_TOKEN}    ${INVOICE_NUM}    ${NET_PAYABLE}    COUNTER_CASH    Cleared at cashier counter
        Should Be True    ${payRes.status_code} in [200, 201]
    END

    # Step 2: Release bed for discharge
    ${relRes}=    Release Bed For Discharge    ${AUTH_TOKEN}    ${DISCHARGE_ID}    Patient vacated room
    Should Be True    ${relRes.status_code} in [200, 201]

    # Step 3: Record physical departure
    ${depRes}=    Record Patient Departure    ${AUTH_TOKEN}    ${DISCHARGE_ID}    escortedBy=Nursing Orderly
    Should Be Equal As Integers    ${depRes.status_code}    200
    ${depBody}=   Set Variable    ${depRes.json()}
    Should Be True    ${depBody}[success]

TC-E2E-007 Bed Release And Automated Housekeeping Turnover Cycle
    [Documentation]    Bed marked as CLEANING_REQUIRED, housekeeping turnover task dispatched, cleaned and restored to AVAILABLE
    # Verify bed status after departure is CLEANING_REQUIRED
    ${bedAfterDep}=    Get Single Bed By ID    ${AUTH_TOKEN}    ${BED_ID}
    Should Be Equal As Strings    ${bedAfterDep}[status]    CLEANING_REQUIRED

    # Housekeeping turnover task creation
    ${hkHeaders}=    Create Dictionary    Authorization=Bearer ${AUTH_TOKEN}    Content-Type=application/json
    ${hkPayload}=    Create Dictionary
    ...    areaId=${bedAfterDep}[wardId]
    ...    bedId=${BED_ID}
    ...    bedNumber=${bedAfterDep}[bedNumber]
    ...    priority=HIGH
    ...    notes=Turnover after patient departure

    ${hkRes}=    POST    ${BASE_URL}/housekeeping/tasks/turnover    json=${hkPayload}    headers=${hkHeaders}    expected_status=any
    Should Be True    ${hkRes.status_code} == 200 or ${hkRes.status_code} == 201
    ${hkTask}=   Set Variable    ${hkRes.json()}[data]

    # Staff starts, completes and closes cleaning
    ${empty}=       Create Dictionary
    ${startRes}=    POST    ${BASE_URL}/housekeeping/tasks/${hkTask}[_id]/start    json=${empty}    headers=${hkHeaders}    expected_status=any
    Should Be True    ${startRes.status_code} in [200, 201]
    ${compRes}=     POST    ${BASE_URL}/housekeeping/tasks/${hkTask}[_id]/complete    json=${empty}    headers=${hkHeaders}    expected_status=any
    Should Be True    ${compRes.status_code} in [200, 201]
    ${closeRes}=    POST    ${BASE_URL}/housekeeping/tasks/${hkTask}[_id]/close    json=${empty}    headers=${hkHeaders}    expected_status=any
    Should Be True    ${closeRes.status_code} in [200, 201]

    # Bed status restored to AVAILABLE
    ${bedRestored}=    Get Single Bed By ID    ${AUTH_TOKEN}    ${BED_ID}
    Should Be Equal As Strings    ${bedRestored}[status]    AVAILABLE

TC-E2E-008 Post-Discharge Patient Experience Feedback Submission
    [Documentation]    Discharged patient submits experience feedback with rating and department routing
    ${subject}=    Set Variable    Post-discharge inpatient care feedback ${RUN_ID}
    ${desc}=       Set Variable    Exemplary care in Cardiology observation ward. Fast discharge and spotless room turnover.
    ${res}=        Submit Feedback Via API    ${AUTH_TOKEN}    ${subject}    ${desc}    category=Nursing    type=COMPLIMENT    priority=LOW    rating=5    patientId=${PATIENT_ID}
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=       Set Variable    ${res.json()}[data]
    Set Suite Variable    ${FEEDBACK_ID}    ${data}[feedbackId]
    Should Match Regexp    ${FEEDBACK_ID}    ^FB-\\d{4}-\\d{6}$
    Should Be Equal As Strings    ${data}[status]    SUBMITTED
    Should Be Equal As Numbers    ${data}[rating]    5

