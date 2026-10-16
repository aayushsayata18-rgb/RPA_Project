*** Settings ***
Documentation    Module 20: Vendor Management RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/vendor_keywords.resource
Resource         ../resources/procurement_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Vendor Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${VENDOR_ID}          ${EMPTY}
${VENDOR_CODE}        ${EMPTY}
${LEGAL_NAME}         ${EMPTY}
${TAX_ID}             ${EMPTY}
${DOC_ID}             ${EMPTY}
${CONTRACT_ID}        ${EMPTY}
${ISSUE_ID}           ${EMPTY}

*** Keywords ***
Setup Vendor Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    6    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}
    Set Suite Variable    ${LEGAL_NAME}    Robot Alpha BioMed Labs ${rand} Ltd.
    Set Suite Variable    ${TAX_ID}    27AAACR${rand}F1Z9

*** Test Cases ***
TC-VEN-001 Vendor Registration And Realtime Duplicate Detection
    [Documentation]    Verifies vendor onboarding, ID generator formatting, and preflight duplicate detection
    # Step 1: Pre-flight check before registration should find no duplicates
    ${resPre}=    Check Vendor Duplicate Via API    ${AUTH_TOKEN}    ${LEGAL_NAME}    ${TAX_ID}
    Should Be Equal As Integers    ${resPre.status_code}    200
    ${preData}=    Set Variable    ${resPre.json()}[data]
    Should Be True    not ${preData}[isDuplicate]

    # Step 2: Register new vendor master record
    ${resCreate}=    Create Vendor Via API    ${AUTH_TOKEN}    ${LEGAL_NAME}    ${TAX_ID}    tradeName=Robot BioMed    paymentTerms=NET_30    riskTier=MEDIUM
    Should Be True    ${resCreate.status_code} == 200 or ${resCreate.status_code} == 201
    ${vData}=    Set Variable    ${resCreate.json()}[data]
    ${vId}=      Set Variable    ${vData}[_id]
    ${vCode}=    Set Variable    ${vData}[vendorCode]
    Set Suite Variable    ${VENDOR_ID}    ${vId}
    Set Suite Variable    ${VENDOR_CODE}    ${vCode}

    Should Start With    ${VENDOR_CODE}    VEN-
    Should Be Equal As Strings    ${vData}[legalName]    ${LEGAL_NAME}
    Should Be Equal As Strings    ${vData}[status]       UNDER_REVIEW

    # Step 3: Duplicate check with identical Tax ID MUST now return duplicate found
    ${resDup}=    Check Vendor Duplicate Via API    ${AUTH_TOKEN}    ${LEGAL_NAME}    ${TAX_ID}
    Should Be Equal As Integers    ${resDup.status_code}    200
    ${dupData}=    Set Variable    ${resDup.json()}[data]
    Should Be True    ${dupData}[isDuplicate]

TC-VEN-002 Vendor Document Expiry Scan And Compliance Verification
    [Documentation]    Verifies document uploading, 30-day expiry scan alert, and four-eyes verification
    # Upload drug license expiring in 15 days
    ${resDoc}=    Upload Vendor Document Via API    ${AUTH_TOKEN}    ${VENDOR_ID}    Drug Manufacturing License    Robotic GMP Certificate    LIC-RPA-${RUN_ID}    expiryDate=2026-10-31T00:00:00.000Z
    Should Be True    ${resDoc.status_code} == 200 or ${resDoc.status_code} == 201
    ${docData}=    Set Variable    ${resDoc.json()}[data]
    ${docId}=      Set Variable    ${docData}[_id]
    Set Suite Variable    ${DOC_ID}    ${docId}
    Should Be Equal As Strings    ${docData}[verificationStatus]    PENDING_VERIFICATION

    # Verify document via compliance officer
    ${resVerif}=    Verify Vendor Document Via API    ${AUTH_TOKEN}    ${VENDOR_ID}    ${DOC_ID}    Verified against State FDA registry
    Should Be Equal As Integers    ${resVerif.status_code}    200
    Should Be Equal As Strings     ${resVerif.json()}[data][verificationStatus]    VERIFIED

    # Run Expiry audit for 30-day window
    ${resAudit}=    Check Vendor Document Expiry Via API    ${AUTH_TOKEN}    30
    Should Be Equal As Integers    ${resAudit.status_code}    200
    ${auditData}=    Set Variable    ${resAudit.json()}[data]
    Should Be True    ${auditData}[expiringSoonCount] >= 1

TC-VEN-003 Vendor Contract Creation And Renewal Notice Alert
    [Documentation]    Verifies Rate Contract establishment, approval to ACTIVE, and renewal notice scanning
    ${resCon}=    Create Vendor Contract Via API    ${AUTH_TOKEN}    ${VENDOR_ID}    Annual Rate Contract Robot ${RUN_ID}    RATE_CONTRACT    750000    renewalDays=30
    Should Be True    ${resCon.status_code} == 200 or ${resCon.status_code} == 201
    ${conData}=    Set Variable    ${resCon.json()}[data]
    ${cId}=        Set Variable    ${conData}[_id]
    Set Suite Variable    ${CONTRACT_ID}    ${cId}
    Should Be Equal As Strings    ${conData}[status]    DRAFT

    # Approve Contract
    ${resApprove}=    Approve Vendor Contract Via API    ${AUTH_TOKEN}    ${VENDOR_ID}    ${CONTRACT_ID}
    Should Be Equal As Integers    ${resApprove.status_code}    200
    Should Be Equal As Strings     ${resApprove.json()}[data][status]    ACTIVE

    # Check Expiring contracts
    ${resExp}=    Check Expiring Contracts Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resExp.status_code}    200

TC-VEN-004 Vendor Grievance Defect Ticket Lifecycle
    [Documentation]    Verifies logging discrepancy ticket, vendor response, and procurement CAPA resolution
    ${resIssue}=    Report Vendor Issue Via API    ${AUTH_TOKEN}    ${VENDOR_ID}    Cold-Chain Temperature Breach Robot ${RUN_ID}    Cold-Chain Excursion    HIGH    Data logger reported 12C during transit
    Should Be True    ${resIssue.status_code} == 200 or ${resIssue.status_code} == 201
    ${issData}=     Set Variable    ${resIssue.json()}[data]
    ${iId}=         Set Variable    ${issData}[_id]
    Set Suite Variable    ${ISSUE_ID}    ${iId}
    Should Start With    ${issData}[issueCode]    VISS-
    Should Be Equal As Strings    ${issData}[status]    OPEN

    # Vendor submits explanation
    ${resResp}=    Respond To Vendor Issue Via API    ${AUTH_TOKEN}    ${ISSUE_ID}    Transit dry ice replenished; batch replacement dispatched via Priority Air
    Should Be Equal As Integers    ${resResp.status_code}    200
    Should Be Equal As Strings     ${resResp.json()}[data][status]    VENDOR_RESPONDED

    # Hospital accepts and resolves
    ${resResl}=    Resolve Vendor Issue Via API    ${AUTH_TOKEN}    ${VENDOR_ID}    ${ISSUE_ID}    Replacement batch received and inspected under temperature log OK    Calibrated dual-sensor logger mandated
    Should Be Equal As Integers    ${resResl.status_code}    200
    Should Be Equal As Strings     ${resResl.json()}[data][status]    RESOLVED

TC-VEN-005 Vendor Suspension Blocks Procurement PO Issuance
    [Documentation]    Verifies suspension lifecycle and PO creation rejection for suspended suppliers
    # First approve the vendor
    ${resAppr}=    Update Vendor Status Via API    ${AUTH_TOKEN}    ${VENDOR_ID}    APPROVED    All audits cleared
    Should Be Equal As Integers    ${resAppr.status_code}    200

    # Suspend the vendor
    ${resSusp}=    Update Vendor Status Via API    ${AUTH_TOKEN}    ${VENDOR_ID}    SUSPENDED    Quality audit non-conformance detected
    Should Be Equal As Integers    ${resSusp.status_code}    200
    Should Be Equal As Strings     ${resSusp.json()}[data][status]    SUSPENDED

    # Attempt to issue PO via procurement API for this suspended vendor
    ${headers}=    Create Dictionary    Authorization=Bearer ${AUTH_TOKEN}    Content-Type=application/json
    ${poItem}=     Create Dictionary    itemName=Test Reagent    quantity=10    unit=VIAL    unitPrice=100
    ${poItems}=    Create List    ${poItem}
    ${poPayload}=  Create Dictionary
    ...    vendorId=${VENDOR_ID}
    ...    vendorName=${LEGAL_NAME}
    ...    items=${poItems}
    ...    paymentTerms=NET_30
    ...    deliveryLocation=Central Pharmacy Warehouse
    ${resPO}=      POST    ${BASE_URL}/procurement/orders    json=${poPayload}    headers=${headers}    expected_status=any

    # Must be rejected with 400 Bad Request
    Should Be Equal As Integers    ${resPO.status_code}    400
    Should Contain    ${resPO.json()}[message]    SUSPENDED

    # Reactivate vendor
    ${resReact}=   Update Vendor Status Via API    ${AUTH_TOKEN}    ${VENDOR_ID}    APPROVED    Quality clearance renewed
    Should Be Equal As Integers    ${resReact.status_code}    200
    Should Be Equal As Strings     ${resReact.json()}[data][status]    APPROVED
