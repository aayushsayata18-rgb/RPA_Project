*** Settings ***
Documentation    Module 08: Online Digital Payment Gateway Session, Webhook Verification & Receipting
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/billing_keywords.resource
Resource         ../resources/payment_keywords.resource

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}     ${EMPTY}
${PATIENT_ID}     P10001
${INVOICE_ID}     ${EMPTY}
${TXN_ID}         ${EMPTY}
${GW_REF}         ${EMPTY}

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}
    # Create and finalize invoice
    ${draft}=       Create Draft Invoice    ${AUTH_TOKEN}    ${PATIENT_ID}    GENERAL
    ${invId}=       Set Variable    ${draft.json()}[data][invoiceId]
    ${fin}=         Finalize Invoice    ${AUTH_TOKEN}    ${invId}
    Set Suite Variable    ${INVOICE_ID}    ${invId}

*** Test Cases ***
TC-BIL-030 Create Digital Payment Gateway Session
    [Documentation]    Creates mock payment gateway order session with transaction ID
    ${res}=    Create Payment Gateway Session    ${AUTH_TOKEN}    ${INVOICE_ID}    300    ONLINE_GATEWAY
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    ${txId}=    Set Variable    ${body}[data][transactionId]
    ${gwRef}=   Set Variable    ${body}[data][gatewayReferenceId]
    Set Suite Variable    ${TXN_ID}    ${txId}
    Set Suite Variable    ${GW_REF}    ${gwRef}
    Should Not Be Empty    ${TXN_ID}

TC-BIL-031 Verify Payment Gateway Callback and Issue Receipt
    [Documentation]    Simulates gateway webhook callback with signature, marks payment SUCCESS and issues receipt
    ${res}=    Verify Payment Signature Callback    ${AUTH_TOKEN}    ${TXN_ID}    mock_sig_${TXN_ID}    ONLINE_GATEWAY    SUCCESS
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    Should Be Equal    ${body}[data][status]    SUCCESS

    # Verify receipt details
    ${rcptRes}=    Get Payment Receipt Details    ${AUTH_TOKEN}    ${TXN_ID}
    Should Be Equal As Integers    ${rcptRes.status_code}    200
    ${rcpt}=       Set Variable    ${rcptRes.json()}[data]
    Should Be Equal    ${rcpt}[transactionId]    ${TXN_ID}
    Should Be Equal As Numbers    ${rcpt}[amount]    300

TC-BIL-032 Ensure Duplicate Webhook Callback Is Idempotent
    [Documentation]    Repeated webhook with same transaction ID returns safely without adding duplicate credit
    ${dupRes}=    Trigger Payment Gateway Webhook    MOCK    ${TXN_ID}    ${GW_REF}    SUCCESS
    Should Be Equal As Integers    ${dupRes.status_code}    200
    ${body}=      Set Variable    ${dupRes.json()}
    Should Be True    ${body}[success]
    Should Be True    ${body}[alreadyProcessed]
