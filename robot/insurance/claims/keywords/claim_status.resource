*** Settings ***
Documentation    Claim Status Polling and Normalization Keywords (10_INSURANCE_CLAIMS.md Section 60 & 34)
Library          Collections
Library          String

*** Keywords ***
Search Claim In Insurer Portal
    [Arguments]    ${claim_reference}
    Log    Searching portal records for claim: ${claim_reference}

Read Claim Portal Status
    [Arguments]    ${mock_status}=PROCESSING
    Log    Insurer raw status string: ${mock_status}
    RETURN    ${mock_status}

Normalize Portal Claim Status
    [Arguments]    ${raw_status}
    ${status_upper}=    Convert To Upper Case    ${raw_status}
    IF    '${status_upper}' == 'APPROVED' or '${status_upper}' == 'PASSED'
        RETURN    APPROVED
    ELSE IF    '${status_upper}' == 'PARTIALLY_APPROVED'
        RETURN    PARTIALLY_APPROVED
    ELSE IF    '${status_upper}' == 'REJECTED' or '${status_upper}' == 'DENIED'
        RETURN    REJECTED
    ELSE IF    '${status_upper}' == 'QUERY' or '${status_upper}' == 'ACTION_REQUIRED'
        RETURN    QUERY
    ELSE IF    '${status_upper}' == 'MORE_DOCUMENTS' or '${status_upper}' == 'ADDITIONAL_DOCUMENTS'
        RETURN    MORE_INFORMATION_REQUIRED
    ELSE IF    '${status_upper}' == 'PAID' or '${status_upper}' == 'SETTLED'
        RETURN    PAID
    ELSE
        RETURN    UNDER_REVIEW
    END

Read Insurer Financial Decision
    [Arguments]    ${approved}=0    ${rejected}=0
    &{decision}=   Create Dictionary    approved_amount=${approved}    rejected_amount=${rejected}
    RETURN         &{decision}
