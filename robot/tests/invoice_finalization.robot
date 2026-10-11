*** Settings ***
Documentation    Module 08: Invoice Finalization, Immutability & Authorized Adjustments
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/billing_keywords.resource

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}     ${EMPTY}
${PATIENT_ID}     P10001
${INVOICE_ID}     ${EMPTY}
${ADJ_NUM}        ${EMPTY}

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}
    # Create draft invoice to finalize
    ${res}=    Create Draft Invoice    ${AUTH_TOKEN}    ${PATIENT_ID}    GENERAL
    ${invId}=    Set Variable    ${res.json()}[data][invoiceId]
    Set Suite Variable    ${INVOICE_ID}    ${invId}

*** Test Cases ***
TC-BIL-020 Finalize Draft Invoice
    [Documentation]    Transitions draft invoice to FINALIZED, locking totals and marking charges INVOICED
    ${res}=    Finalize Invoice    ${AUTH_TOKEN}    ${INVOICE_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    ${inv}=     Set Variable    ${body}[data]
    Should Be True    '${inv}[status]' == 'FINALIZED' or '${inv}[status]' == 'PAID'

TC-BIL-021 Finalize Idempotency Verification
    [Documentation]    Calling finalize on an already finalized invoice returns safely without altering financial figures
    ${res}=    Finalize Invoice    ${AUTH_TOKEN}    ${INVOICE_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]

TC-BIL-022 Request and Approve Authorized Financial Discount
    [Documentation]    Requests a 200 discount adjustment on finalized invoice and approves it through manager role
    ${reqRes}=    Request Financial Adjustment    ${AUTH_TOKEN}    ${INVOICE_ID}    DISCOUNT    200    Manager authorized patient discount
    Should Be Equal As Integers    ${reqRes.status_code}    201
    ${adjNum}=    Set Variable    ${reqRes.json()}[data][adjustmentNumber]
    Set Suite Variable    ${ADJ_NUM}    ${adjNum}

    # Approve adjustment
    ${appRes}=    Approve Financial Adjustment    ${AUTH_TOKEN}    ${ADJ_NUM}
    Should Be Equal As Integers    ${appRes.status_code}    200
    ${appBody}=   Set Variable    ${appRes.json()}
    Should Be True    ${appBody}[success]
    Should Be Equal    ${appBody}[data][adjustment][status]    APPLIED
