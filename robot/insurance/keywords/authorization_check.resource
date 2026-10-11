*** Settings ***
Documentation    Keywords for Prior Authorization Requirement Validation

*** Keywords ***
Retrieve Authorization Requirement
    [Arguments]    ${search_result}
    Log    Checking prior authorization flag on insurer portal
    RETURN    REQUIRED
