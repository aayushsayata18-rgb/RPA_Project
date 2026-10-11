*** Settings ***
Documentation    Secure Credential Retrieval for External Systems (Environment Variables)
Library          OperatingSystem

*** Keywords ***
Get External System Credentials
    ${user}=    Get Environment Variable    HIS_RPA_USERNAME    default=his_rpa_bot
    ${pass}=    Get Environment Variable    HIS_RPA_PASSWORD    default=ProtectedSecret#2026
    RETURN      ${user}    ${pass}
