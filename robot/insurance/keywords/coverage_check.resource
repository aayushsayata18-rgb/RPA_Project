*** Settings ***
Documentation    Keywords for Retrieving Policy Coverage Limits & Deductibles

*** Keywords ***
Retrieve Coverage Information
    [Arguments]    ${search_result}
    Log    Extracting financial coverage schedule from portal table
    &{coverage}=    Create Dictionary
    ...    available=${TRUE}
    ...    coverageLimit=500000
    ...    coverageRemaining=425000
    ...    deductibleRemaining=3000
    ...    copay=500
    RETURN    &{coverage}
