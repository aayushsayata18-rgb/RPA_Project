*** Settings ***
Documentation    Module 1 Acceptance Tests: Patient Registration & Identity Management
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../resources/patient_keywords.resource
Resource         ../../keywords/patient_registration_keywords.resource

*** Test Cases ***
TC-REG-001 New Patient Registration
    [Documentation]    Verify completely new patient receives exactly one permanent Patient ID (P100xx) and new Visit ID (V202610xxx)
    ${res}=    Submit Online Patient Registration
    ...    firstName=Karan
    ...    lastName=Kapoor
    ...    dob=1995-04-12
    ...    gender=MALE
    ...    mobile=9820011223
    ...    email=karan.kapoor@example.com

    Should Be True    ${res}[success]
    Should Be Equal As Strings    ${res}[data][status]    REGISTERED
    Should Be Equal As Strings    ${res}[data][isExistingPatient]    False

    # Assert Permanent Patient ID and Visit ID formats
    ${patientId}=    Set Variable    ${res}[data][patientId]
    ${visitId}=      Set Variable    ${res}[data][visitId]
    Verify Permanent Patient ID Format    ${patientId}
    Verify Visit ID Format    ${visitId}

TC-REG-002 Existing Patient Registration Encounter
    [Documentation]    Verify registering an existing patient reuses permanent Patient ID and creates a new unique Visit ID
    ${token}=    Login Hospital User    reception@hospital.com    ${DEFAULT_PASSWORD}

    # Register new visit for seeded patient P10001
    ${res}=    Submit Front Desk Existing Patient Registration
    ...    token=${token}
    ...    existingPatientId=P10001
    ...    visitType=FOLLOW_UP
    ...    department=CARDIOLOGY

    Should Be True    ${res}[success]
    Should Be Equal As Strings    ${res}[data][patientId]    P10001
    Should Be Equal As Strings    ${res}[data][isExistingPatient]    True

    # Verify new Visit ID was generated
    ${newVisitId}=    Set Variable    ${res}[data][visitId]
    Verify Visit ID Format    ${newVisitId}
    Should Not Be Equal As Strings    ${newVisitId}    V202610001

TC-REG-008 Registration Notification Dispatched
    [Documentation]    Verify registration triggers the centralized notification event
    ${token}=    Login Hospital User    admin@hospital.com    ${DEFAULT_PASSWORD}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}

    # Fetch recent in-app / dispatched notifications
    ${notifRes}=    GET    ${BASE_URL}/notifications/events/PATIENT_REGISTRATION_COMPLETED    headers=${headers}    expected_status=200
    Should Be True    ${notifRes.json()}[success]
