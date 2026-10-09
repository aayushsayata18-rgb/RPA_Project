*** Settings ***
Documentation    Module 6: Billing Reconciliation, Accommodation Stay Calculation & Invoicing Suite
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
TC-DIS-020 Finalize Discharge Billing and Generate Itemized Invoice
    [Documentation]    Calculates stay duration, aggregates service line items, applies deposits and outputs final invoice
    ${res}=    Finalize Discharge Billing    ${AUTH_TOKEN}    DIS20261006015    discountAmount=0
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]
    ${invoice}=    Set Variable    ${body}[data][invoice]
    Dictionary Should Contain Key    ${invoice}    invoiceNumber
    Dictionary Should Contain Key    ${invoice}    grossAmount
    Dictionary Should Contain Key    ${invoice}    netPayable
    Should Be True    ${invoice}[grossAmount] > 0

TC-DIS-021 Insurance Pre-Authorization Verification Check
    [Documentation]    Verifies insurance deduction without inventing unapproved coverage
    ${res}=    Verify Discharge Insurance    ${AUTH_TOKEN}    DIS20261006015
    Should Be Equal As Integers    ${res.status_code}    200
    ${body}=    Set Variable    ${res.json()}
    Should Be True    ${body}[success]


TC-DIS-022 Retrieve Final Itemized Invoice Details
    [Documentation]    Fetches generated invoice record with line items breakdown
    ${disRes}=    Get Discharge Details    ${AUTH_TOKEN}    DIS20261006015
    Should Be Equal As Integers    ${disRes.status_code}    200
    ${invNum}=    Set Variable    ${disRes.json()}[data][finalInvoiceNumber]
    
    ${invRes}=    Get Invoice Details    ${AUTH_TOKEN}    ${invNum}
    Should Be Equal As Integers    ${invRes.status_code}    200
    ${body}=    Set Variable    ${invRes.json()}
    Should Be Equal    ${body}[data][invoiceNumber]    ${invNum}
    Should Be True    len(${body}[data][lineItems]) >= 1
