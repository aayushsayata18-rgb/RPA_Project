*** Settings ***
Documentation    Module 07 — RPA Document Import & Deduplication Tests
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/patient_records.resource

Suite Setup      Setup Suite Tokens

*** Variables ***
${DEMO_PATIENT_ID}    P10045

*** Keywords ***
Setup Suite Tokens
    ${ADMIN_TOKEN}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${ADMIN_TOKEN}

*** Test Cases ***
TC01: Verify RPA Document Import Initial Ingestion
    [Documentation]    Imports historical report with unique source document ID
    ${sourceId}=    Set Variable    LEGACY-DOC-TEST-771
    ${checksum}=    Set Variable    sha256-sample-hash-771
    ${res}=         Import Legacy Document With RPA    ${ADMIN_TOKEN}    ${DEMO_PATIENT_ID}    Historical MRI Scan Report 2025    RADIOLOGY_REPORT    ${sourceId}    ${checksum}
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be Equal As Strings    ${res.json()}[success]    True
    Should Be Equal As Strings    ${res.json()}[duplicateDetected]    False

TC02: Verify RPA Duplicate Detection Prevents Redundancy
    [Documentation]    Re-importing document with same source ID or checksum skips duplicate creation
    ${sourceId}=    Set Variable    LEGACY-DOC-TEST-771
    ${checksum}=    Set Variable    sha256-sample-hash-771
    ${res}=         Import Legacy Document With RPA    ${ADMIN_TOKEN}    ${DEMO_PATIENT_ID}    Historical MRI Scan Report 2025 Duplicate    RADIOLOGY_REPORT    ${sourceId}    ${checksum}
    Should Be Equal As Integers    ${res.status_code}    200
    Should Be Equal As Strings    ${res.json()}[duplicateDetected]    True
