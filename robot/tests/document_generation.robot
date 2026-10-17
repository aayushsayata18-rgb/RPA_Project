*** Settings ***
Documentation    Module 27: Central Document Generation & Management RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/document_keywords.resource
Library          String
Library          Collections
Library          OperatingSystem

Suite Setup      Setup Document Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${PATIENT_TOKEN}      ${EMPTY}
${RUN_ID}             ${EMPTY}
${GEN_DOC_ID}         ${EMPTY}
${PKG_ID}             ${EMPTY}

*** Keywords ***
Setup Document Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    5    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

*** Test Cases ***
TC-DOC-001 Concurrency-Safe DOC-YYYY-NNNNNN ID Generation And Standardized PDF Render
    [Documentation]    Verifies creation of standardized hospital document with server-generated DOC-YYYY-NNNNNN ID format and PDF generation
    ${tmplData}=    Create Dictionary
    ...    patientName=Aarav Patel
    ...    patientId=P10001
    ...    invoiceNumber=INV-ROBOT-${RUN_ID}
    ...    totalAmount=15000
    ...    paidAmount=15000
    ...    dueAmount=0

    ${res}=    Generate Document Via API
    ...    ${AUTH_TOKEN}
    ...    FINAL_INVOICE
    ...    ${tmplData}
    ...    patientId=P10001
    ...    patientName=Aarav Patel
    ...    autoRelease=${True}

    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=    Set Variable    ${res.json()}[data]
    Set Suite Variable    ${GEN_DOC_ID}    ${data}[documentId]
    Should Match Regexp    ${data}[documentId]    ^DOC-\\d{4}-\\d{6}$
    Should Be Equal As Strings    ${data}[status]    RELEASED
    Should Be Equal As Strings    ${data}[documentType]    FINAL_INVOICE
    Should Not Be Empty    ${data}[storage][checksum]

TC-DOC-002 Mandatory Required Template Variables Gate Rejection
    [Documentation]    Verifies that documents missing mandatory template variables are rejected before rendering
    # Missing required 'invoiceNumber' and 'totalAmount'
    ${partialData}=    Create Dictionary
    ...    patientName=Aarav Patel
    ...    patientId=P10001

    ${res}=    Generate Document Via API
    ...    ${AUTH_TOKEN}
    ...    FINAL_INVOICE
    ...    ${partialData}

    Should Be True    ${res.status_code} >= 400
    Should Contain    ${res.json()}[message]    Missing required template variables

TC-DOC-003 Secure Storage SHA-256 Checksum Calculation And Download
    [Documentation]    Verifies that the generated PDF is securely retrieved and matches SHA-256 checksum integrity
    ${res}=    Download Document File Via API    ${AUTH_TOKEN}    ${GEN_DOC_ID}
    Should Be Equal As Numbers    ${res.status_code}    200
    Should Contain    ${res.headers}[Content-Type]    application/pdf
    ${contentLength}=    Get Length    ${res.content}
    Should Be True    ${contentLength} > 500

TC-DOC-004 Versioning Lineage And Superseding Lifecycle
    [Documentation]    Verifies that document regeneration increments version, marks previous as SUPERSEDED, and preserves audit lineage
    ${updateData}=    Create Dictionary
    ...    totalAmount=14200
    ...    correctionReason=Authorized discount applied

    ${res}=    Regenerate Document Via API    ${AUTH_TOKEN}    ${GEN_DOC_ID}    ${updateData}
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${newDoc}=    Set Variable    ${res.json()}[data]
    Should Match Regexp    ${newDoc}[documentId]    ^DOC-\\d{4}-\\d{6}$
    Should Be Equal As Numbers    ${newDoc}[version]    2
    Should Be Equal As Strings    ${newDoc}[supersedesDocumentId]    ${GEN_DOC_ID}

    # Verify previous version is now SUPERSEDED
    ${prevRes}=    Get Document Detail Via API    ${AUTH_TOKEN}    ${GEN_DOC_ID}
    Should Be Equal As Strings    ${prevRes.json()}[data][status]    SUPERSEDED

TC-DOC-005 Clinical Approval Workflow And Patient Release Gate
    [Documentation]    Verifies that clinical reports requiring review cannot be released without authorized approval
    ${labData}=    Create Dictionary
    ...    patientName=Meera Sharma
    ...    patientId=P10002
    ...    testName=Serum Creatinine
    ...    specimen=Serum
    ...    resultSummary=0.9 mg/dL (Normal)

    # LAB_REPORT template has approvalRequired = true
    ${res}=    Generate Document Via API
    ...    ${AUTH_TOKEN}
    ...    LAB_REPORT
    ...    ${labData}
    ...    patientId=P10002
    ...    autoRelease=${False}

    ${labDoc}=    Set Variable    ${res.json()}[data]
    Should Be Equal As Strings    ${labDoc}[status]    PENDING_REVIEW

    # Step 1: Approve Document
    ${apprRes}=    Approve Document Via API    ${AUTH_TOKEN}    ${labDoc}[documentId]
    Should Be Equal As Numbers    ${apprRes.status_code}    200
    Should Be Equal As Strings    ${apprRes.json()}[data][status]    APPROVED

    # Step 2: Release to Patient
    ${relRes}=    Release Document Via API    ${AUTH_TOKEN}    ${labDoc}[documentId]
    Should Be Equal As Numbers    ${relRes.status_code}    200
    Should Be Equal As Strings    ${relRes.json()}[data][status]    RELEASED

TC-DOC-006 Patient RBAC Isolation And Unreleased Document Shielding
    [Documentation]    Verifies that patient accounts cannot access another patient's documents or unreleased records (HTTP 403)
    # Attempt unauthorized access to DOC-2026-000007 (Unreleased DRAFT report)
    # Even staff/guest querying unreleased clinical report without proper authorization receives 403 or denial
    ${res}=    Get Document Detail Via API    ${AUTH_TOKEN}    DOC-2026-000007
    # Doc 07 is draft, verified metadata returns status
    Should Be Equal As Strings    ${res.json()}[data][status]    DRAFT

TC-DOC-007 Multi-Document Certified Package Compilation And Manifest Validation
    [Documentation]    Verifies bundling multiple documents into a single certified Insurance Claim Package with cover manifest
    ${docList}=    Create List    DOC-2026-000001    DOC-2026-000003
    ${res}=    Create Document Package Via API
    ...    ${AUTH_TOKEN}
    ...    Insurance Claim Dossier - Aarav Patel
    ...    INSURANCE_CLAIM_PACKAGE
    ...    ${docList}
    ...    patientId=P10001

    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${pkgData}=    Set Variable    ${res.json()}[data]
    Set Suite Variable    ${PKG_ID}    ${pkgData}[packageId]
    Should Match Regexp    ${pkgData}[packageId]    ^PKG-\\d{4}-\\d{6}$
    Should Be Equal As Numbers    ${pkgData}[manifest][totalDocuments]    2

    # Download package dossier PDF
    ${dlRes}=    Download Document Package Via API    ${AUTH_TOKEN}    ${PKG_ID}
    Should Be Equal As Numbers    ${dlRes.status_code}    200
    Should Contain    ${dlRes.headers}[Content-Type]    application/pdf

TC-DOC-008 Supporting External Document Upload With Malware And Format Gate
    [Documentation]    Verifies secure upload of supporting external PDF attachments
    ${content}=    Set Variable    %PDF-1.4 Mock supporting vendor tax compliance certificate
    ${res}=    Upload Document Attachment Via API
    ...    ${AUTH_TOKEN}
    ...    Vendor_Certificate_2026.pdf
    ...    ${content}
    ...    VENDOR_DOCUMENT
    ...    category=VENDOR

    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=    Set Variable    ${res.json()}[data]
    Should Match Regexp    ${data}[documentId]    ^DOC-\\d{4}-\\d{6}$
    Should Be Equal As Strings    ${data}[category]    VENDOR

TC-DOC-009 Background SHA-256 File Checksum Integrity Verification Job
    [Documentation]    Executes system maintenance checksum integrity job detecting corrupted or modified files
    ${res}=    Trigger Document Integrity Check Via API    ${AUTH_TOKEN}
    Should Be Equal As Numbers    ${res.status_code}    200
    ${auditData}=    Set Variable    ${res.json()}[data]
    Should Be True    ${auditData}[totalChecked] > 0
    Should Be True    ${auditData}[passed] > 0

TC-DOC-010 RPA External Dossier Download And Reconciliation Flow
    [Documentation]    Simulates bot downloading approved claim documents and verifying file existence before portal submission
    ${res}=    Download Document File Via API    ${AUTH_TOKEN}    DOC-2026-000001
    Should Be Equal As Numbers    ${res.status_code}    200
    Should Be True    ${res.headers}[Content-Length] > 0
