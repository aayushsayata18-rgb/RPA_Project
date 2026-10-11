*** Settings ***
Documentation    Insurance Claim Evidence Capture & Audit Preservation
Resource         ../resources/common.resource
Resource         ../resources/browser.resource
Resource         ../keywords/claim_login.resource
Resource         ../keywords/claim_submission.resource
Resource         ../keywords/claim_evidence.resource

*** Test Cases ***
Capture Submission Evidence And Verify Traceability
    [Documentation]    Ensures portal screenshot and confirmation identifiers are properly extracted
    [Tags]             claims    rpa    evidence

    Open Insurer Claims Portal
    Login To Insurer Claims Portal    STAR_HEALTH

    ${ref}=             Capture Insurer Claim Reference    mock_ref=INS-CLM-881920
    ${evidence_file}=   Capture Submission Confirmation Evidence    ${ref}

    Should Be Equal     ${evidence_file}    evidence_${ref}.png

    Close Insurer Claims Portal
    Log                 Evidence captured: ${evidence_file} for Reference: ${ref}
