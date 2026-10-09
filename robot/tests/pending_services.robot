*** Settings ***
Documentation    Module 6: Pending Services & Billing Prerequisite Verification Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/discharge_keywords.resource
Resource         ../resources/billing_keywords.resource

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}

*** Test Cases ***
TC-DIS-010 Check Pending Unbilled Services On Active Discharge
    [Documentation]    Verify pending service checker detects pending lab/radiology/pharmacy charges
    ${res}=    Check Pending Services For Discharge    ${AUTH_TOKEN}    DIS20261006015
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    # Should contain pending summary
    Dictionary Should Contain Key    ${body}[data]    hasPendingServices
    Dictionary Should Contain Key    ${body}[data]    pendingItems


TC-DIS-011 Add Service Charge For Admitted Patient
    [Documentation]    Record a laboratory diagnostic charge on admission
    ${res}=    Record Billing Charge    ${AUTH_TOKEN}    ADM10023    P10045    LABORATORY    Complete Blood Count    550.00    1
    Should Be Equal As Integers    ${res.status_code}    201
    ${body}=    Set Variable    ${res.json()}
    Should Be Equal    ${body}[data][serviceName]    Complete Blood Count
    Should Be Equal As Numbers    ${body}[data][totalPrice]    550.00

TC-DIS-012 Retrieve Itemized Charges For Admission
    [Documentation]    Fetch all charges recorded for admission
    ${res}=    Get Charges For Admission    ${AUTH_TOKEN}    ADM10023
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    len(${body}[data]) >= 1
