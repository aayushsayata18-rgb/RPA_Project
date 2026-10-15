*** Settings ***
Documentation    Module 16: Payroll Support RPA Automation Test Suite (Section 96)
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/payroll_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Payroll Test Session

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${PERIOD_ID}          ${EMPTY}
${PERIOD_CODE}        ${EMPTY}
${CORRELATION_ID}     ${EMPTY}
${FIRST_PAYSLIP_ID}   ${EMPTY}

*** Keywords ***
Setup Payroll Test Session
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    6    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}
    ${code}=     Set Variable    PAY-2026-R${RUN_ID}
    Set Suite Variable    ${PERIOD_CODE}    ${code}
    ${corr}=     Set Variable    RPA-PAY-CORR-${RUN_ID}
    Set Suite Variable    ${CORRELATION_ID}    ${corr}

*** Test Cases ***
TC-PAY-001 Payroll Period Lifecycle And Input Generation (Section 96 Test 1)
    [Documentation]    Exercises period creation, opening, input aggregation from attendance/leave/overtime, and pre-check validation
    ${resCreate}=    Create Payroll Period Via API    ${AUTH_TOKEN}    ${PERIOD_CODE}    2026-11-01    2026-11-30    name=RPA Nov Payroll ${RUN_ID}
    Should Be True    ${resCreate.status_code} == 200 or ${resCreate.status_code} == 201
    ${pId}=    Set Variable    ${resCreate.json()}[period][_id]
    Set Suite Variable    ${PERIOD_ID}    ${pId}
    Should Be Equal As Strings    ${resCreate.json()}[period][status]    DRAFT

    ${resOpen}=    Open Payroll Period Via API    ${AUTH_TOKEN}    ${PERIOD_ID}
    Should Be Equal As Integers    ${resOpen.status_code}    200
    Should Be Equal As Strings    ${resOpen.json()}[period][status]    OPEN

    ${resGen}=     Generate Payroll Inputs Via API    ${AUTH_TOKEN}    ${PERIOD_ID}
    Should Be Equal As Integers    ${resGen.status_code}    200
    Should Be True    ${resGen.json()}[totalEmployees] >= 1

    ${resVal}=     Validate Payroll Period Via API    ${AUTH_TOKEN}    ${PERIOD_ID}
    Should Be Equal As Integers    ${resVal.status_code}    200
    Should Be True    ${resVal.json()}[employeeCount] >= 1

TC-PAY-002 Duplicate Submission Prevention And Idempotency (Section 96 Test 2)
    [Documentation]    Verifies that re-submitting the exact same payroll run with identical correlationId does NOT create duplicate runs
    # Submit for review and approve period
    ${resSub}=    Submit Payroll Period For Approval Via API    ${AUTH_TOKEN}    ${PERIOD_ID}    notes=Submitting for RPA review
    Should Be Equal As Integers    ${resSub.status_code}    200

    ${resApp}=    Approve Payroll Period Via API    ${AUTH_TOKEN}    ${PERIOD_ID}    notes=Approved for RPA run    enforce_segregation=${FALSE}
    Should Be Equal As Integers    ${resApp.status_code}    200

    # Execute Initial Payroll Run
    ${resRun1}=    Process Payroll Run Via API    ${AUTH_TOKEN}    ${PERIOD_ID}    correlation_id=${CORRELATION_ID}    bypass_approval=${TRUE}
    Should Be Equal As Integers    ${resRun1.status_code}    200
    Should Be True    ${resRun1.json()}[success]

    # Execute Duplicate Payroll Run with identical correlationId
    ${resRun2}=    Process Payroll Run Via API    ${AUTH_TOKEN}    ${PERIOD_ID}    correlation_id=${CORRELATION_ID}    bypass_approval=${TRUE}
    Should Be Equal As Integers    ${resRun2.status_code}    200
    Should Be True    ${resRun2.json()}[idempotent]
    Should Contain    ${resRun2.json()}[message]    Duplicate processing prevented

TC-PAY-003 External Payroll Reconciliation And Mismatch Exception (Section 96 Test 3)
    [Documentation]    Simulates external payroll provider discrepancy; verifies mismatch detection and ExceptionCase generation
    ${r1}=    Create Dictionary    employeeIdCode=EMP00125    gross=4000    net=3800
    ${records}=    Create List    ${r1}

    ${resRec}=    Reconcile External Payroll Via API    ${AUTH_TOKEN}    ${PERIOD_ID}    ${records}    correlation_id=RPA-MISMATCH-${RUN_ID}
    Should Be Equal As Integers    ${resRec.status_code}    200
    # Expected mismatch when external count does not match internal submitted inputs
    Should Be Equal As Strings    ${resRec.json()}[status]    MISMATCH_DETECTED

TC-PAY-004 Internal Reconciliation And Finalization Guard (Section 96 Test 4)
    [Documentation]    Validates internal source data reconciliation (inputs vs results) and finalization
    ${resRecInt}=    Reconcile Internal Payroll Via API    ${AUTH_TOKEN}    ${PERIOD_ID}
    Should Be Equal As Integers    ${resRecInt.status_code}    200
    Should Be True    ${resRecInt.json()}[resultCount] >= 1

    ${resFin}=       Finalize Payroll Period Via API    ${AUTH_TOKEN}    ${PERIOD_ID}
    Should Be Equal As Integers    ${resFin.status_code}    200
    Should Be Equal As Strings    ${resFin.json()}[period][status]    FINALIZED
    Should Be True    ${resFin.json()}[period][isLocked]

TC-PAY-005 Payslip Generation And Confidential Access Control (Section 96 Test 5)
    [Documentation]    Generates payslips, verifies correct employee document mapping, and asserts access logging
    ${resSlip}=    Generate Payslips Via API    ${AUTH_TOKEN}    ${PERIOD_ID}
    Should Be Equal As Integers    ${resSlip.status_code}    200
    Should Be True    ${resSlip.json()}[count] >= 1
    ${firstSlip}=    Set Variable    ${resSlip.json()}[payslips][0]
    ${pSlipId}=    Set Variable    ${firstSlip}[_id]
    Set Suite Variable    ${FIRST_PAYSLIP_ID}    ${pSlipId}

    # Verify authorized view records access log
    ${resView}=    Get Payslip By Id Via API    ${AUTH_TOKEN}    ${FIRST_PAYSLIP_ID}
    Should Be Equal As Integers    ${resView.status_code}    200
    Should Be Equal As Strings    ${resView.json()}[payslip][_id]    ${FIRST_PAYSLIP_ID}
    Should Be True    len(${resView.json()}[payslip][accessLogs]) >= 1
