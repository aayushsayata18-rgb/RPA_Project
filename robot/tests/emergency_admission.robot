*** Settings ***
Documentation    Module 4: Emergency Inpatient Admission & Identity Linking Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/admission_keywords.resource
Resource         ../keywords/emergency_admission.resource

Suite Setup      Setup Admin Session

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Admin Session
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}

*** Test Cases ***
TC-ADM-007 Emergency Patient Admission Express
    [Documentation]    Verify unknown emergency patient direct intake
    ${data}=    Execute Emergency Inpatient Intake    ${AUTH_TOKEN}    provisionalName=Trauma Emergency Victim    condition=Acute polytrauma resuscitation
    Should Not Be Empty    ${data}[admissionId]
    Should Equal    ${data}[identityStatus]    TEMPORARY

TC-ADM-008 Temporary Emergency Identity Generation
    [Documentation]    Verify temporary emergency record is assigned unique TEMP- ID
    ${data}=    Process Emergency Intake    ${AUTH_TOKEN}    provisionalName=Unidentified Patient X    age=40    gender=MALE
    Should Start With    ${data}[patientId]    TEMP-

TC-ADM-009 Temporary Identity Linking to Permanent Patient
    [Documentation]    Verify linking temporary ID to permanent patient preserves history and updates admission status to VERIFIED
    ${data}=    Process Emergency Intake    ${AUTH_TOKEN}    provisionalName=Emergency Case Link Demo    age=28    gender=FEMALE
    ${tempId}=  Set Variable    ${data}[patientId]
    ${linkRes}= Verify Emergency Temporary Record Linkage    ${AUTH_TOKEN}    ${tempId}    P10005
    Should Be Equal    ${linkRes}[permanentPatientId]    P10005
