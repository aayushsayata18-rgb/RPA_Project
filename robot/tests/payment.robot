*** Settings ***
Documentation    Module 6: Payment Processing, Gateway Signature & Cashier Settlement Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/discharge_keywords.resource
Resource         ../resources/billing_keywords.resource
Resource         ../resources/payment_keywords.resource

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}
${INVOICE_NUM}   ${EMPTY}

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}
    # Ensure billing is finalized to have an invoice
    ${disRes}=    Get Discharge Details    ${AUTH_TOKEN}    DIS20261006015
    ${inv}=       Set Variable    ${disRes.json()}[data][finalInvoiceNumber]
    Set Suite Variable    ${INVOICE_NUM}    ${inv}

*** Test Cases ***
TC-DIS-030 Create Payment Gateway Session For Online Settlement
    [Documentation]    Creates mock payment gateway order session with unique transaction reference
    ${res}=    Create Payment Gateway Session    ${AUTH_TOKEN}    ${INVOICE_NUM}    100.00    ONLINE_GATEWAY
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    Dictionary Should Contain Key    ${body}[data]    sessionId
    Dictionary Should Contain Key    ${body}[data]    transactionId

TC-DIS-031 Verify Payment Gateway Callback
    [Documentation]    Verifies simulated gateway callback with signature and marks transaction PAID
    # Create a session first
    ${sessRes}=    Create Payment Gateway Session    ${AUTH_TOKEN}    ${INVOICE_NUM}    150.00    ONLINE_GATEWAY
    ${txId}=       Set Variable    ${sessRes.json()}[data][transactionId]
    
    # Callback verification
    ${verRes}=     Verify Payment Signature Callback    ${AUTH_TOKEN}    ${txId}    mock_sig_${txId}    ONLINE_GATEWAY
    Should Be Equal As Integers    ${verRes.status_code}    200
    ${body}=       Set Variable    ${verRes.json()}
    Should Be True    ${body}[success]
    Should Be True    '${body}[data][status]' == 'SUCCESS' or '${body}[data][status]' == 'PAID'


TC-DIS-032 Record Counter Cash Settlement
    [Documentation]    Hospital cashier records POS/Cash settlement with immediate receipt issuance
    ${res}=    Record Counter Payment    ${AUTH_TOKEN}    ${INVOICE_NUM}    200.00    COUNTER_CASH    Settled at billing desk
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    Dictionary Should Contain Key    ${body}[data]    receiptNumber


TC-DIS-033 Retrieve Payment Receipts For Invoice
    [Documentation]    Fetch all payment transactions and receipts recorded for an invoice
    ${res}=    Get Payments For Invoice    ${AUTH_TOKEN}    ${INVOICE_NUM}
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    len(${body}[data]) >= 1
