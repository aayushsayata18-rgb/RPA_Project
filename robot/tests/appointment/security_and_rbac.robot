*** Settings ***
Documentation    Module 2 Appointment Management — Security & RBAC Isolation Suite
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../resources/appointment_keywords.resource

*** Test Cases ***
TC-APT-013 Unauthorized Booking Attempt Without Token
    [Documentation]    Verify unauthenticated users cannot book appointments.
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${payload}=    Create Dictionary    patientId=P10001    doctorId=DOC1001    appointmentDate=2026-10-30    startTime=10:00
    ${response}=   POST    ${BASE_URL}/appointments    json=${payload}    headers=${headers}    expected_status=401
    Should Be Equal As Strings    ${response.json()}[success]    ${False}

TC-APT-014 Patient Sees Only Own Appointments
    [Documentation]    Verify patient token query only returns appointments for their own linked Patient ID.
    ${patient_token}=  Login Hospital User    patient@hospital.com    ${DEFAULT_PASSWORD}
    ${headers}=        Create Dictionary    Authorization=Bearer ${patient_token}
    ${response}=       GET    ${BASE_URL}/appointments    headers=${headers}    expected_status=200
    ${appointments}=   Set Variable    ${response.json()}[data][appointments]
    FOR    ${apt}    IN    @{appointments}
        Should Be Equal As Strings    ${apt}[patientId]    P10001
    END
