*** Settings ***
Documentation    Module 1 Acceptance Tests: Identity Review Queue & Decision Processing
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../keywords/patient_matching_keywords.resource

*** Test Cases ***
TC-REG-007 Review Ambiguous Registration - Confirm Existing Patient
    [Documentation]    Verify receptionist can resolve an ambiguous registration by confirming existing patient identity
    ${token}=    Login Hospital User    reception@hospital.com    ${DEFAULT_PASSWORD}

    # Review seeded ambiguous registration REG202610055
    ${res}=    Review Ambiguous Identity Registration
    ...    token=${token}
    ...    registrationId=REG202610055
    ...    decision=CONFIRM_EXISTING
    ...    selectedPatientId=P10004
    ...    notes=Confirmed with patient at front desk

    Should Be True    ${res}[success]
    Should Be Equal As Strings    ${res}[data][status]    REGISTERED
    Should Be Equal As Strings    ${res}[data][patientId]    P10004
