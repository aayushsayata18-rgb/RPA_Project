*** Settings ***
Documentation    Insurance Claim Submission Robot Automation (10_INSURANCE_CLAIMS.md Section 61)
Resource         ../resources/common.resource
Resource         ../resources/browser.resource
Resource         ../resources/secrets.resource
Resource         ../keywords/claim_login.resource
Resource         ../keywords/claim_creation.resource
Resource         ../keywords/claim_documents.resource
Resource         ../keywords/claim_submission.resource
Resource         ../keywords/claim_evidence.resource

*** Test Cases ***
Submit Insurance Claim Successfully
    [Documentation]    End-to-end portal automated claim creation, document upload, and reference capture
    [Tags]             claims    rpa    submission

    Open Insurer Claims Portal
    Login To Insurer Claims Portal    STAR_HEALTH
    Navigate To Claims Section

    Enter Patient Details             patient_id=P10045    patient_name=Rahul Shah
    Enter Policy Details              policy_number=POL-STAR-4421    member_id=MEM-9921
    Enter Claim Invoicing Details     invoice_id=INV-2026-001245    total_amount=115000    claim_type=INPATIENT

    @{docs}=                          Create List    final_invoice.pdf    discharge_summary.pdf    insurance_card.pdf
    Upload Claim Document Files       @{docs}

    Review Claim Submission
    Click Insurer Submit Button

    ${claim_ref}=                     Capture Insurer Claim Reference
    Should Not Be Empty               ${claim_ref}

    ${evidence}=                      Capture Submission Confirmation Evidence    ${claim_ref}
    Should Contain                    ${evidence}    ${claim_ref}

    Close Insurer Claims Portal
    Log                               Claim submission completed successfully with reference: ${claim_ref}
