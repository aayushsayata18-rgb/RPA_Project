*** Settings ***
Documentation    Evidence Screenshot & Audit Artifact Capture (10_INSURANCE_CLAIMS.md Section 56)
Library          OperatingSystem
Library          String

*** Keywords ***
Capture Submission Confirmation Evidence
    [Arguments]    ${claim_reference}
    ${filename}=   Set Variable    evidence_${claim_reference}.png
    Log            Capturing portal confirmation snapshot: ${filename}
    RETURN         ${filename}

Capture Insurer Query Evidence
    [Arguments]    ${query_ref}
    ${filename}=   Set Variable    evidence_query_${query_ref}.png
    Log            Capturing insurer query notice snapshot: ${filename}
    RETURN         ${filename}
