*** Settings ***
Documentation    Module 08: Bank / Gateway Settlement Ledger Reconciliation Suite
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

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}
    # Create invoice and paid transaction
    ${draft}=       Create Draft Invoice    ${AUTH_TOKEN}    ${PATIENT_ID}    GENERAL
    ${invId}=       Set Variable    ${draft.json()}[data][invoiceId]
    ${fin}=         Finalize Invoice    ${AUTH_TOKEN}    ${invId}
    Set Suite Variable    ${INVOICE_ID}    ${invId}

    ${sess}=        Create Payment Gateway Session    ${AUTH_TOKEN}    ${INVOICE_ID}    500    ONLINE_GATEWAY
    ${txId}=        Set Variable    ${sess.json()}[data][transactionId]
    Set Suite Variable    ${TXN_ID}    ${txId}
    ${ver}=         Verify Payment Signature Callback    ${AUTH_TOKEN}    ${TXN_ID}    mock_sig    ONLINE_GATEWAY    SUCCESS

*** Test Cases ***
TC-BIL-050 Reconcile Matched Settlement Record
    [Documentation]    Compares bank settlement report against verified hospital transaction
    ${matchedRecord}=    Create Dictionary    transactionId=${TXN_ID}    amount=500    status=SUCCESS
    ${recordsList}=      Create List    ${matchedRecord}
    ${res}=              Reconcile Payment Ledger    ${AUTH_TOKEN}    ${recordsList}
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=             Set Variable    ${res.json()}
    Should Be True       ${body}[success]
    Should Be Equal As Integers    ${body}[data][matched]    1
    Should Be Equal As Integers    ${body}[data][mismatched]    0

TC-BIL-051 Detect Amount Mismatch and Create Exception Case
    [Documentation]    Flags settlement record where gateway amount differs from hospital record
    ${mismatchRecord}=    Create Dictionary    transactionId=${TXN_ID}    amount=450    status=SUCCESS
    ${recordsList}=       Create List    ${mismatchRecord}
    ${res}=               Reconcile Payment Ledger    ${AUTH_TOKEN}    ${recordsList}
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=              Set Variable    ${res.json()}
    Should Be True        ${body}[success]
    Should Be Equal As Integers    ${body}[data][mismatched]    1
    Should Be True        len(${body}[data][exceptions]) >= 1
