*** Settings ***
Documentation    Module 08: Complete End-to-End Billing, Payment & Query Lifecycle Test
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/billing_keywords.resource
Resource         ../resources/payment_keywords.resource
Library          String

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}     ${EMPTY}
${PATIENT_ID}     P10001
${INVOICE_ID}     ${EMPTY}
${DEPOSIT_NUM}    ${EMPTY}
${TXN_ID}         ${EMPTY}
${QUERY_NUM}      ${EMPTY}
${RUN_ID}         ${EMPTY}

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}
    ${rand}=        Generate Random String    6    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

*** Test Cases ***
TC-BIL-E2E-001 Ingest Multiple Billable Services
    [Documentation]    Ingests Consultation, Laboratory and Pharmacy billable items
    ${cRes}=    Create Billable Item    ${AUTH_TOKEN}    ${PATIENT_ID}    CONSULTATION    CONS-SPEC    Specialist Consultation    1    sourceId=CONS_E2E_${RUN_ID}
    Should Be Equal As Integers    ${cRes.status_code}    201

    ${lRes}=    Create Billable Item    ${AUTH_TOKEN}    ${PATIENT_ID}    LABORATORY    LAB-LFT    Liver Function Panel    1    sourceId=LAB_E2E_${RUN_ID}
    Should Be Equal As Integers    ${lRes.status_code}    201

    ${pRes}=    Create Billable Item    ${AUTH_TOKEN}    ${PATIENT_ID}    PHARMACY    PHARM-IVFLUID    Normal Saline IV    2    sourceId=PHARM_E2E_${RUN_ID}
    Should Be Equal As Integers    ${pRes.status_code}    201

TC-BIL-E2E-002 Record Advance Deposit For Patient
    [Documentation]    Records an advance deposit of 500 for the patient
    ${dRes}=    Record Patient Deposit    ${AUTH_TOKEN}    ${PATIENT_ID}    500    CASH
    Should Be Equal As Integers    ${dRes.status_code}    201
    ${depNum}=  Set Variable    ${dRes.json()}[data][depositNumber]
    Set Suite Variable    ${DEPOSIT_NUM}    ${depNum}

TC-BIL-E2E-003 Create Draft Invoice and Apply Deposit
    [Documentation]    Generates draft invoice and applies the advance deposit
    ${iRes}=    Create Draft Invoice    ${AUTH_TOKEN}    ${PATIENT_ID}    GENERAL
    Should Be Equal As Integers    ${iRes.status_code}    201
    ${invId}=   Set Variable    ${iRes.json()}[data][invoiceId]
    Set Suite Variable    ${INVOICE_ID}    ${invId}

    ${appRes}=  Apply Deposit To Invoice    ${AUTH_TOKEN}    ${DEPOSIT_NUM}    ${INVOICE_ID}    500
    Should Be Equal As Integers    ${appRes.status_code}    200

TC-BIL-E2E-004 Finalize Invoice
    [Documentation]    Finalizes draft invoice, locking totals and transitioning status to FINALIZED
    ${fRes}=    Finalize Invoice    ${AUTH_TOKEN}    ${INVOICE_ID}
    Should Be Equal As Integers    ${fRes.status_code}    200
    ${body}=    Set Variable    ${fRes.json()}
    Should Be Equal    ${body}[data][status]    FINALIZED

TC-BIL-E2E-005 Record Counter Payment Settling Remaining Balance
    [Documentation]    Cashier records counter POS payment settling the entire balance to 0
    ${invRes}=  Get Invoice Details    ${AUTH_TOKEN}    ${INVOICE_ID}
    ${bal}=     Set Variable    ${invRes.json()}[data][outstandingBalance]

    ${payRes}=  Record Counter Payment    ${AUTH_TOKEN}    ${INVOICE_ID}    ${bal}    COUNTER_UPI    Settled by patient at billing desk
    Should Be Equal As Integers    ${payRes.status_code}    200
    ${txId}=    Set Variable    ${payRes.json()}[data][transactionId]
    Set Suite Variable    ${TXN_ID}    ${txId}

TC-BIL-E2E-006 Verify Final Settled Invoice State
    [Documentation]    Invoice status is PAID, balance is 0 and receipt is available
    ${finalRes}=    Get Invoice Details    ${AUTH_TOKEN}    ${INVOICE_ID}
    Should Be Equal As Integers    ${finalRes.status_code}    200
    ${finalInv}=    Set Variable    ${finalRes.json()}[data]
    Should Be Equal    ${finalInv}[status]    PAID
    Should Be Equal As Numbers    ${finalInv}[outstandingBalance]    0

    ${rcptRes}=     Get Payment Receipt Details    ${AUTH_TOKEN}    ${TXN_ID}
    Should Be Equal As Integers    ${rcptRes.status_code}    200
    Should Be Equal    ${rcptRes.json()}[data][status]    SUCCESS

TC-BIL-E2E-007 Create and Resolve Patient Billing Query
    [Documentation]    Patient submits inquiry about lab charge and billing team resolves it
    ${qRes}=    Create Billing Query    ${AUTH_TOKEN}    ${PATIENT_ID}    ${INVOICE_ID}    Clarification on LFT Panel item
    Should Be Equal As Integers    ${qRes.status_code}    201
    ${qNum}=    Set Variable    ${qRes.json()}[data][queryNumber]
    Set Suite Variable    ${QUERY_NUM}    ${qNum}

    ${rRes}=    Resolve Billing Query    ${AUTH_TOKEN}    ${QUERY_NUM}    Explained test breakdown and doctor order reference
    Should Be Equal As Integers    ${rRes.status_code}    200
    Should Be Equal    ${rRes.json()}[data][status]    RESOLVED
