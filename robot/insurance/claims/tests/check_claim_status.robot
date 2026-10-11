*** Settings ***
Documentation    Insurance Claim Status Polling RPA (10_INSURANCE_CLAIMS.md Section 60)
Resource         ../resources/common.resource
Resource         ../resources/browser.resource
Resource         ../keywords/claim_login.resource
Resource         ../keywords/claim_status.resource
Resource         ../keywords/claim_evidence.resource

*** Test Cases ***
Check Insurance Claim Status When Under Review
    [Documentation]    Polls insurer portal for pending claim status and normalizes response
    [Tags]             claims    rpa    status

    Open Insurer Claims Portal
    Login To Insurer Claims Portal    STAR_HEALTH

    Search Claim In Insurer Portal    claim_reference=INS-CLM-778821
    ${raw_status}=                    Read Claim Portal Status    mock_status=PROCESSING
    ${normalized}=                    Normalize Portal Claim Status    ${raw_status}

    Should Be Equal                   ${normalized}    UNDER_REVIEW

    Close Insurer Claims Portal
    Log                               Claim status polling completed: Normalized=${normalized}

Check Insurance Claim Status When Approved
    [Documentation]    Verifies portal status check when claim is approved with settlement amount
    [Tags]             claims    rpa    status    approval

    Open Insurer Claims Portal
    Login To Insurer Claims Portal    STAR_HEALTH

    Search Claim In Insurer Portal    claim_reference=INS-CLM-778821
    ${raw_status}=                    Read Claim Portal Status    mock_status=APPROVED
    ${normalized}=                    Normalize Portal Claim Status    ${raw_status}
    &{decision}=                      Read Insurer Financial Decision    approved=115000    rejected=0

    Should Be Equal                   ${normalized}    APPROVED
    Should Be Equal As Numbers        ${decision.approved_amount}    115000

    Close Insurer Claims Portal
    Log                               Claim approval polled successfully: Amount=${decision.approved_amount}
