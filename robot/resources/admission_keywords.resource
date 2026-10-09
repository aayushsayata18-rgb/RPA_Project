*** Settings ***
Documentation    Admission Lifecycle Keywords for Module 4
Resource         common.resource

*** Keywords ***
Submit Admission Request
    [Arguments]    ${token}    ${patientId}    ${visitId}    ${clinicalRef}    ${source}=OPD    ${doctor}=DOC1001    ${preference}=GENERAL_WARD    ${clinicalCategory}=GENERAL_WARD
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    patientId=${patientId}    visitId=${visitId}    source=${source}    requestedBy=${doctor}    requestingDoctorId=${doctor}    clinicalRequirementReference=${clinicalRef}    accommodationPreference=${preference}    clinicalRequiredCategory=${clinicalCategory}
    ${response}=   POST    ${BASE_URL}/admissions/admission-requests    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Admission Request By ID
    [Arguments]    ${token}    ${requestId}    ${reason}=Approved per hospital policy
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/admissions/admission-requests/${requestId}/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Reject Admission Request By ID
    [Arguments]    ${token}    ${requestId}    ${reason}=Administrative validation failure
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/admissions/admission-requests/${requestId}/reject    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Assign Bed To Request
    [Arguments]    ${token}    ${requestId}    ${bedId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    bedId=${bedId}
    ${response}=   POST    ${BASE_URL}/admissions/admission-requests/${requestId}/assign-bed    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Complete Inpatient Admission
    [Arguments]    ${token}    ${requestId}    ${insuranceProvider}=Star Health Insurance    ${policyNumber}=POL-TEST-001
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${insDetails}= Create Dictionary    provider=${insuranceProvider}    policyNumber=${policyNumber}    preAuthStatus=APPROVED    approvedAmount=50000
    ${payload}=    Create Dictionary    admissionRequestId=${requestId}    insuranceDetails=${insDetails}
    ${response}=   POST    ${BASE_URL}/admissions    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Active Admission For Patient
    [Arguments]    ${token}    ${patientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/admissions/active/${patientId}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}

Process Emergency Intake
    [Arguments]    ${token}    ${provisionalName}=Unknown Emergency Patient    ${age}=30    ${gender}=MALE    ${condition}=Emergency trauma    ${doctor}=DOC1001    ${bedCategory}=EMERGENCY_BED
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    provisionalName=${provisionalName}    estimatedAge=${age}    gender=${gender}    apparentCondition=${condition}    requestingDoctorId=${doctor}    clinicalRequirementReference=EMG-ADMIT-ORDER    clinicalRequiredCategory=${bedCategory}    accommodationPreference=${bedCategory}
    ${response}=   POST    ${BASE_URL}/admissions/emergency    json=${payload}    headers=${headers}    expected_status=201
    RETURN         ${response.json()}[data]

Link Emergency Identity
    [Arguments]    ${token}    ${temporaryEmergencyId}    ${permanentPatientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    temporaryEmergencyId=${temporaryEmergencyId}    permanentPatientId=${permanentPatientId}
    ${response}=   POST    ${BASE_URL}/admissions/link-temporary-identity    json=${payload}    headers=${headers}    expected_status=200
    RETURN         ${response.json()}[data]
