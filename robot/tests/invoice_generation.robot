*** Settings ***
Documentation    Module 08: Draft Invoicing, Deposit Application & Exact Money Calculation
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/billing_keywords.resource

Suite Setup      Setup Hospital Session

*** Variables ***
${AUTH_TOKEN}     ${EMPTY}
${PATIENT_ID}     P10001
${INVOICE_ID}     ${EMPTY}
${DEPOSIT_NUM}    ${EMPTY}

*** Keywords ***
Setup Hospital Session
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}

*** Test Cases ***
TC-BIL-010 Generate Itemized Draft Invoice
    [Documentation]    Aggregates billable items and creates a draft invoice with itemized line items
    ${res}=    Create Draft Invoice    ${AUTH_TOKEN}    ${PATIENT_ID}    GENERAL    depositAmount=0    coveredAmount=0    discountAmount=0
    Should Be Equal As Integers    ${res.status_code}    201
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    ${inv}=     Set Variable    ${body}[data]
    Set Suite Variable    ${INVOICE_ID}    ${inv}[invoiceId]
    Should Be Equal    ${inv}[status]    DRAFT
    Should Be True    ${inv}[grossTotal] > 0
    Should Be True    ${inv}[payableAmount] > 0
    Should Be True    len(${inv}[items]) >= 1

TC-BIL-011 Record and Apply Patient Advance Deposit
    [Documentation]    Records patient advance deposit and applies to draft invoice reducing payable amount
    # Record deposit
    ${depRes}=    Record Patient Deposit    ${AUTH_TOKEN}    ${PATIENT_ID}    500    CASH
    Should Be Equal As Integers    ${depRes.status_code}    201
    ${depBody}=   Set Variable    ${depRes.json()}
    ${depNum}=    Set Variable    ${depBody}[data][depositNumber]
    Set Suite Variable    ${DEPOSIT_NUM}    ${depNum}
    Should Be Equal As Numbers    ${depBody}[data][remainingAmount]    500

    # Apply to invoice
    ${appRes}=    Apply Deposit To Invoice    ${AUTH_TOKEN}    ${DEPOSIT_NUM}    ${INVOICE_ID}    500
    Should Be Equal As Integers    ${appRes.status_code}    200
    ${appBody}=   Set Variable    ${appRes.json()}
    Should Be True    ${appBody}[success]
    ${updatedInv}=    Set Variable    ${appBody}[data][invoice]
    Should Be Equal As Numbers    ${updatedInv}[depositAmount]    500

TC-BIL-012 Retrieve Itemized Invoice With Correct Balances
    [Documentation]    Fetches invoice details and verifies balance reflects gross minus deposit
    ${res}=    Get Invoice Details    ${AUTH_TOKEN}    ${INVOICE_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    ${inv}=    Set Variable    ${res.json()}[data]
    Should Be Equal    ${inv}[invoiceId]    ${INVOICE_ID}
    Should Be Equal As Numbers    ${inv}[depositAmount]    500
    Should Be Equal As Numbers    ${inv}[outstandingBalance]    ${inv}[payableAmount]
