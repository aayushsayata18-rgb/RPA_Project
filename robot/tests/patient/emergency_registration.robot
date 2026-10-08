*** Settings ***
Documentation    Module 1 Acceptance Tests: Emergency Intake & Temporary Record Linking
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../keywords/emergency_registration_keywords.resource

*** Test Cases ***
TC-REG-005 Emergency Unknown Patient Temporary ID
    [Documentation]    Verify an unknown emergency trauma patient receives a temporary emergency ID (TEMP-2026-xxxxx) and emergency visit
    ${token}=    Login Hospital User    reception@hospital.com    ${DEFAULT_PASSWORD}

    ${res}=    Submit Emergency Fast Intake
    ...    token=${token}
    ...    provisionalName=Unknown Trauma Male Age 28
    ...    estimatedAge=28
    ...    gender=MALE
    ...    condition=Severe blunt trauma

    Should Be True    ${res}[success]
    Should Be True    ${res}[data][isTemporary]
    Should Match Regexp    ${res}[data][temporaryEmergencyId]    ^TEMP-\\d{4}-\\d{5}$

    # Verify visit created
    ${visitId}=    Set Variable    ${res}[data][visitId]
    Should Match Regexp    ${visitId}    ^V\\d{9}$

TC-REG-006 Emergency Identity Linking
    [Documentation]    Verify linking a temporary emergency ID to permanent Patient ID P10002 updates status to LINKED and preserves encounter history
    ${token}=    Login Hospital User    reception@hospital.com    ${DEFAULT_PASSWORD}

    # Create temporary case
    ${intakeRes}=    Submit Emergency Fast Intake
    ...    token=${token}
    ...    provisionalName=Unidentified Female Pedestrian
    ...    estimatedAge=30
    ...    gender=FEMALE

    ${tempId}=    Set Variable    ${intakeRes}[data][temporaryEmergencyId]

    # Link to existing Patient P10002 (Priya Sharma)
    ${linkRes}=    Link Temporary Emergency Record
    ...    token=${token}
    ...    temporaryEmergencyId=${tempId}
    ...    targetPatientId=P10002

    Should Be True    ${linkRes}[success]
    Should Be Equal As Strings    ${linkRes}[data][permanentPatientId]    P10002
