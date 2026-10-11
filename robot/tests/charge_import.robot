*** Settings ***
Documentation    Module 08: Billable Item Ingestion, Rate Card Lookup & Duplicate Prevention
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/billing_keywords.resource

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}
${PATIENT_ID}    P10001

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}

*** Test Cases ***
TC-BIL-001 Ingest and Validate Laboratory Billable Charge
    [Documentation]    Records a clinical laboratory charge and verifies rate calculation
    ${res}=    Create Billable Item    ${AUTH_TOKEN}    ${PATIENT_ID}    LABORATORY    LAB-CBC    Complete Blood Count    1    sourceId=LAB_ORD_9001
    Should Be Equal As Integers    ${res.status_code}    201
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    ${charge}=    Set Variable    ${body}[data]
    Dictionary Should Contain Key    ${charge}    chargeId
    Should Be Equal    ${charge}[status]    VALIDATED
    Should Be True    ${charge}[grossAmount] >= 500

TC-BIL-002 Ingest Radiology and Pharmacy Charges with Rate Card Lookup
    [Documentation]    Ingests radiology and pharmacy items resolving base prices from rate card
    ${resRad}=    Create Billable Item    ${AUTH_TOKEN}    ${PATIENT_ID}    RADIOLOGY    RAD-XRAY    Chest X-Ray PA View    1    sourceId=RAD_ORD_9002
    Should Be Equal As Integers    ${resRad.status_code}    201
    ${chargeRad}=    Set Variable    ${resRad.json()}[data]
    Should Be Equal As Numbers    ${chargeRad}[unitPrice]    1000

    ${resPharm}=   Create Billable Item    ${AUTH_TOKEN}    ${PATIENT_ID}    PHARMACY    PHARM-PARACET    Paracetamol Tabs    2    sourceId=PHARM_DISP_9003
    Should Be Equal As Integers    ${resPharm.status_code}    201
    ${chargePharm}=    Set Variable    ${resPharm.json()}[data]
    Should Be True    ${chargePharm}[grossAmount] > 0

TC-BIL-003 Prevent Duplicate Charge Ingestion with Idempotency Check
    [Documentation]    Ensures same originating source cannot submit duplicate charges
    # Re-submit the identical source item
    ${dupRes}=    Create Billable Item    ${AUTH_TOKEN}    ${PATIENT_ID}    LABORATORY    LAB-CBC    Complete Blood Count    1    sourceId=LAB_ORD_9001
    Should Be Equal As Integers    ${dupRes.status_code}    400
    ${body}=      Set Variable    ${dupRes.json()}
    Should Be Equal    ${body}[success]    ${FALSE}
    Should Contain    ${body}[error][message]    Duplicate charge
