*** Settings ***
Documentation    Claim Submission Confirmation & Reference Capture Keywords (10_INSURANCE_CLAIMS.md Section 61 & 72)
Library          String

*** Keywords ***
Review Claim Submission
    Log    Reviewing populated fields on insurer portal pre-submission

Click Insurer Submit Button
    Log    Triggering authoritative electronic submission button

Capture Insurer Claim Reference
    [Arguments]    ${mock_ref}=${EMPTY}
    IF    '${mock_ref}' != '${EMPTY}'
        ${ref}=    Set Variable    ${mock_ref}
    ELSE
        ${rand}=   Generate Random String    6    [NUMBERS]
        ${ref}=    Set Variable    INS-CLM-${rand}
    END
    Log    Authoritative insurer claim reference captured: ${ref}
    RETURN    ${ref}
