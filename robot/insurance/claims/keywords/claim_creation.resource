*** Settings ***
Documentation    Form Filling Keywords for Claims Portal Navigation
Library          OperatingSystem

*** Keywords ***
Navigate To Claims Section
    Log    Navigating to claims submission module on portal

Enter Patient Details
    [Arguments]    ${patient_id}    ${patient_name}
    Log    Populating patient identity: ID=${patient_id}, Name=${patient_name}

Enter Policy Details
    [Arguments]    ${policy_number}    ${member_id}
    Log    Populating policy details: Policy=${policy_number}, Member=${member_id}

Enter Claim Invoicing Details
    [Arguments]    ${invoice_id}    ${total_amount}    ${claim_type}
    Log    Populating financial details: Invoice=${invoice_id}, Amount=${total_amount}, Type=${claim_type}
