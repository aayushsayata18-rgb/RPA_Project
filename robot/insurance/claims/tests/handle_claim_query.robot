*** Settings ***
Documentation    Insurance Claim Query & Supplementary Document RPA Automation
Resource         ../resources/common.resource
Resource         ../resources/browser.resource
Resource         ../keywords/claim_login.resource
Resource         ../keywords/claim_creation.resource
Resource         ../keywords/claim_documents.resource
Resource         ../keywords/claim_status.resource
Resource         ../keywords/claim_evidence.resource

*** Test Cases ***
Poll Insurer Queries And Upload Requested Documents
    [Documentation]    Identifies query raised on claim, prepares upload and captures evidence
    [Tags]             claims    rpa    query

    Open Insurer Claims Portal
    Login To Insurer Claims Portal    STAR_HEALTH

    Search Claim In Insurer Portal    claim_reference=INS-CLM-778821
    ${raw_status}=                    Read Claim Portal Status    mock_status=MORE_DOCUMENTS
    ${normalized}=                    Normalize Portal Claim Status    ${raw_status}

    Should Be Equal                   ${normalized}    MORE_INFORMATION_REQUIRED

    @{supplementary_docs}=            Create List    lab_report_hematology.pdf
    Upload Claim Document Files       @{supplementary_docs}

    ${evidence}=                      Capture Insurer Query Evidence    query_ref=QRY-9921
    Should Not Be Empty               ${evidence}

    Close Insurer Claims Portal
    Log                               Query response uploaded and evidence captured: ${evidence}
