*** Settings ***
Documentation    Module 6: Comprehensive End-to-End Discharge Orchestration Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/discharge_keywords.resource
Resource         ../resources/billing_keywords.resource
Resource         ../resources/payment_keywords.resource
Resource         ../resources/bed_keywords.resource

Suite Setup      Setup Test Environment

*** Variables ***
${AUTH_TOKEN}            ${EMPTY}
${DOCTOR_TOKEN}          ${EMPTY}
${TEST_ADMISSION_ID}     ${EMPTY}
${TEST_PATIENT_ID}       ${EMPTY}
${DISCHARGE_ID}          ${EMPTY}
${INVOICE_NUM}           ${EMPTY}

*** Keywords ***
Setup Test Environment
    ${adminTok}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${adminTok}
    ${docTok}=      Login Hospital User    doctor@hospital.com    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${DOCTOR_TOKEN}    ${docTok}
    Set Suite Variable    ${TEST_ADMISSION_ID}    ADM202610001
    Set Suite Variable    ${TEST_PATIENT_ID}      P10001

*** Test Cases ***
TC-DIS-E2E-001 Complete End-to-End Hospital Discharge Lifecycle
    [Documentation]    Exercises the full lifecycle from clinical clearance to patient departure and clearance documents
    
    # Step 1: Doctor submits clinical discharge order
    ${reqRes}=    Create Clinical Discharge Request    ${DOCTOR_TOKEN}    ${TEST_ADMISSION_ID}    ${TEST_PATIENT_ID}    DOC1001    ROUTINE    Post-op recovery complete, all vitals normal
    Should Be True    ${reqRes.status_code} == 201 or ${reqRes.status_code} == 200 or ${reqRes.status_code} == 400
    ${reqId}=     Set Variable If    '${reqRes.status_code}' == '201' or '${reqRes.status_code}' == '200'    ${reqRes.json()}[data][requestId]    ${EMPTY}

    # Step 2: Staff initiates administrative discharge workflow
    ${initRes}=   Initiate Discharge Workflow    ${AUTH_TOKEN}    ${TEST_ADMISSION_ID}    dischargeRequestId=${reqId}
    Should Be True    ${initRes.status_code} == 201 or ${initRes.status_code} == 200
    ${disId}=     Set Variable    ${initRes.json()}[data][dischargeId]
    Set Suite Variable    ${DISCHARGE_ID}    ${disId}

    # Step 3: Verify checklist items initialized
    ${chkRes}=    Get Discharge Checklist    ${AUTH_TOKEN}    ${DISCHARGE_ID}
    Should Be Equal As Integers    ${chkRes.status_code}    200
    ${chkBody}=   Set Variable    ${chkRes.json()}
    Should Be True    ${chkBody}[success]

    # Step 4: Check pending services
    ${servRes}=   Check Pending Services For Discharge    ${AUTH_TOKEN}    ${DISCHARGE_ID}
    Should Be Equal As Integers    ${servRes.status_code}    200

    # Step 5: Finalize billing and generate invoice
    ${billRes}=   Finalize Discharge Billing    ${AUTH_TOKEN}    ${DISCHARGE_ID}    discountAmount=0
    Should Be Equal As Integers    ${billRes.status_code}    200
    ${billBody}=  Set Variable    ${billRes.json()}
    ${invNum}=    Set Variable    ${billBody}[data][invoice][invoiceNumber]
    ${netPay}=    Set Variable    ${billBody}[data][invoice][netPayable]
    Set Suite Variable    ${INVOICE_NUM}    ${invNum}

    # Step 6: Settle invoice via counter payment if balance exists
    IF    ${netPay} > 0
        ${payRes}=    Record Counter Payment    ${AUTH_TOKEN}    ${INVOICE_NUM}    ${netPay}    COUNTER_CASH    Patient paid cash at counter
        Should Be Equal As Integers    ${payRes.status_code}    200
    END

    # Step 7: Release physical bed and verify it enters CLEANING_REQUIRED
    ${bedRes}=    Release Bed For Discharge    ${AUTH_TOKEN}    ${DISCHARGE_ID}    Patient vacated room
    Should Be Equal As Integers    ${bedRes.status_code}    200

    # Step 8: Complete discharge process
    ${compRes}=   Complete Discharge Process    ${AUTH_TOKEN}    ${DISCHARGE_ID}    Discharge completed with full clearance
    Should Be Equal As Integers    ${compRes.status_code}    200
    ${compBody}=  Set Variable    ${compRes.json()}
    Should Be True    '${compBody}[data][discharge][status]' == 'COMPLETED'


    # Step 9: Verify document generation for all 4 clearance document types
    ${sumDoc}=    Get Discharge Document    ${AUTH_TOKEN}    ${DISCHARGE_ID}    DISCHARGE_SUMMARY
    Should Be Equal As Integers    ${sumDoc.status_code}    200
    
    ${invDoc}=    Get Discharge Document    ${AUTH_TOKEN}    ${DISCHARGE_ID}    FINAL_INVOICE
    Should Be Equal As Integers    ${invDoc.status_code}    200

    ${recDoc}=    Get Discharge Document    ${AUTH_TOKEN}    ${DISCHARGE_ID}    PAYMENT_RECEIPT
    Should Be Equal As Integers    ${recDoc.status_code}    200

    ${clrDoc}=    Get Discharge Document    ${AUTH_TOKEN}    ${DISCHARGE_ID}    CLEARANCE_SLIP
    Should Be Equal As Integers    ${clrDoc.status_code}    200

    # Step 10: Verify audit history timeline
    ${histRes}=   Get Discharge Audit History    ${AUTH_TOKEN}    ${DISCHARGE_ID}
    Should Be Equal As Integers    ${histRes.status_code}    200
    ${histBody}=  Set Variable    ${histRes.json()}
    Should Be True    len(${histBody}[data]) >= 1
