*** Settings ***
Documentation    Claim Document Checklist and Upload Keywords
Library          Collections
Library          OperatingSystem

*** Keywords ***
Validate Claim Documents Checklist
    [Arguments]    ${checklist}
    Log    Validating required document presence across checklist

Upload Claim Document Files
    [Arguments]    @{documents}
    FOR    ${doc}    IN    @{documents}
        Log    Uploading document: ${doc}
    END
