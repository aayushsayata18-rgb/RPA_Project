*** Settings ***
Documentation    Module 08: Payment Gateway Failure Handling & Retry Workflow
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/billing_keywords.resource
Resource         ../resources/payment_keywords.resource

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}     ${EMPTY}
${PATIENT_ID}     P10001
${INVOICE_ID}     ${EMPTY}
${TXN_FAIL_ID}    ${EMPTY}

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
TC-BIL-040 Initialize Payment Gateway Session For Failed Attempt
    [Documentation]    Creates session which user cancels or gateway reports failed
    ${res}=    Create Payment Gateway Session    ${AUTH_TOKEN}    ${INVOICE_ID}    250    ONLINE_GATEWAY
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    ${txId}=    Set Variable    ${body}[data][transactionId]
    Set Suite Variable    ${TXN_FAIL_ID}    ${txId}

TC-BIL-041 Process Gateway Failure Callback
    [Documentation]    Gateway notifies failure; payment transaction is marked FAILED while invoice total remains intact
    ${res}=    Verify Payment Signature Callback    ${AUTH_TOKEN}    ${TXN_FAIL_ID}    mock_sig_fail    ONLINE_GATEWAY    FAILED
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be Equal    ${body}[data][status]    FAILED

    # Check invoice still has balance
    ${invRes}=    Get Invoice Details    ${AUTH_TOKEN}    ${INVOICE_ID}
    Should Be Equal As Integers    ${invRes.status_code}    200
    ${inv}=       Set Variable    ${invRes.json()}[data]
    Should Be True    ${inv}[outstandingBalance] > 0

TC-BIL-042 Patient Retries Payment via Cashier Counter
    [Documentation]    Following gateway failure, cashier collects counter cash payment settling the invoice
    ${res}=    Record Counter Payment    ${AUTH_TOKEN}    ${INVOICE_ID}    250    COUNTER_CASH    Patient paid cash after gateway failure
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    Dictionary Should Contain Key    ${body}[data]    receiptNumber
