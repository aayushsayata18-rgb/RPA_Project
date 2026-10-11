*** Settings ***
Documentation    Module 09: Complete Insurance Policy Verification & Management Lifecycle Test
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/insurance_keywords.resource

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${PATIENT_ID}         P10045
${POLICY_ID}          ${EMPTY}
${POLICY_NUM}         ${EMPTY}
${VERIFICATION_ID}    ${EMPTY}

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}

*** Test Cases ***
TC-INS-001 Create Patient Insurance Policy
    [Documentation]    Registers a new health insurance policy for patient
    ${pNum}=        Set Variable    POL-STAR-E2E-01
    Set Suite Variable    ${POLICY_NUM}    ${pNum}
    ${res}=         Create Insurance Policy    ${AUTH_TOKEN}    ${PATIENT_ID}    Star Health Insurance    ${POLICY_NUM}    Rahul Shah    MEM-RF-01    isPrimary=${TRUE}    planName=Family Floater Plus
    Should Be True    ${res.status_code} == 201 or ${res.status_code} == 409
    IF    ${res.status_code} == 201
        ${polId}=    Set Variable    ${res.json()}[policy][policyId]
        Set Suite Variable    ${POLICY_ID}    ${polId}
    ELSE
        ${polId}=    Set Variable    ${res.json()}[existingPolicy][policyId]
        Set Suite Variable    ${POLICY_ID}    ${polId}
    END
    Should Not Be Empty    ${POLICY_ID}

TC-INS-002 Duplicate Insurance Policy Detection
    [Documentation]    Submitting identical policy details triggers duplicate policy rejection
    ${res}=         Check Duplicate Insurance Policy    ${AUTH_TOKEN}    ${PATIENT_ID}    Star Health Insurance    ${POLICY_NUM}    MEM-RF-01
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be True    ${res.json()}[isDuplicate] == ${TRUE}

TC-INS-003 Request Insurance Verification
    [Documentation]    Queues verification request with insurer gateway
    ${res}=         Request Policy Verification    ${AUTH_TOKEN}    ${POLICY_ID}    API    API
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 202
    ${vId}=         Set Variable    ${res.json()}[verificationId]
    Set Suite Variable    ${VERIFICATION_ID}    ${vId}
    Should Not Be Empty    ${VERIFICATION_ID}

TC-INS-004 Retrieve Verification Dossier
    [Documentation]    Fetches complete verification dossier with status and financial limits
    Sleep           1s
    ${res}=         Get Verification Dossier    ${AUTH_TOKEN}    ${VERIFICATION_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    ${status}=      Set Variable    ${res.json()}[verification][status]
    Should Be True    '${status}' in ['VERIFIED', 'QUEUED', 'IN_PROGRESS']

TC-INS-005 Upload Verification Supporting Evidence
    [Documentation]    Attaches verification document or screenshot to the verification record
    ${res}=         Upload Verification Evidence    ${AUTH_TOKEN}    ${VERIFICATION_ID}    ${PATIENT_ID}    ${POLICY_ID}    star_health_portal_proof.pdf
    Should Be Equal As Integers    ${res.status_code}    201
    Should Be Equal    ${res.json()}[document][documentType]    PORTAL_SCREENSHOT

TC-INS-006 Billing Integration Active Verification Check
    [Documentation]    Billing and Inpatient modules query active verified coverage for patient
    ${res}=         Get Active Policy For Billing    ${AUTH_TOKEN}    ${PATIENT_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be True    ${res.json()}[hasInsurance] == ${TRUE}
    Should Be Equal    ${res.json()}[policy][status]    ACTIVE

TC-INS-007 Verification Dashboard Statistics Retrieval
    [Documentation]    Dashboard cards retrieve verified, pending and manual review KPI metrics
    ${res}=         Get Insurance Statistics    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be True    ${res.json()}[stats][totalVerifications] >= 1
