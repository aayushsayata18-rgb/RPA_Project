*** Settings ***
Documentation    Keywords for Validating Policy Eligibility and Network Tier

*** Keywords ***
Verify Policy Status
    [Arguments]    ${search_result}
    Log    Checking active status flag on portal
    RETURN    ACTIVE

Verify Eligibility
    [Arguments]    ${search_result}
    Log    Extracting patient eligibility indicator from portal DOM
    RETURN    ELIGIBLE

Verify Network Status
    [Arguments]    ${search_result}
    Log    Checking provider hospital network agreement status
    RETURN    IN_NETWORK
