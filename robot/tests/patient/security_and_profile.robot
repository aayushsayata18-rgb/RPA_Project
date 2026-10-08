*** Settings ***
Documentation    Module 1 Acceptance Tests: Security, RBAC & Profile Management
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../resources/patient_keywords.resource

*** Test Cases ***
TC-REG-007 Patient Profile Permitted Update
    [Documentation]    Verify patient can update permitted demographic fields (mobile, email, address)
    ${token}=    Login Hospital User    patient@hospital.com    ${DEFAULT_PASSWORD}

    ${updateData}=    Create Dictionary
    ...    mobile=9876543216
    ...    email=aarav.updated@example.com

    ${res}=    Update Patient Demographics
    ...    token=${token}
    ...    patientId=P10001
    ...    updatePayload=${updateData}

    Should Be True    ${res}[success]
    Should Be Equal As Strings    ${res}[data][email]    aarav.updated@example.com

TC-REG-010 Unauthorized Profile Access Rejection
    [Documentation]    Verify a patient cannot view or tamper with another patient's records (RBAC verification)
    ${token}=    Login Hospital User    patient@hospital.com    ${DEFAULT_PASSWORD}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json

    # Attempt to access P10002 (Priya Sharma) using Aarav Patel's token (linked to P10001)
    ${res}=    GET    ${BASE_URL}/patients/P10002    headers=${headers}    expected_status=403
    Should Be Equal As Numbers    ${res.status_code}    403
