*** Settings ***
Documentation    Keywords for Searching Patient Policy on Insurer Portal

*** Keywords ***
Search Patient Policy
    [Arguments]    ${policy_number}    ${member_id}=${EMPTY}
    Log    Navigating to Policy Search form
    Log    Entering policyNumber: ${policy_number} and memberId: ${member_id}
    Log    Executing policy search query
    &{search_result}=    Create Dictionary    found=${TRUE}    policyNumber=${policy_number}
    RETURN    &{search_result}
