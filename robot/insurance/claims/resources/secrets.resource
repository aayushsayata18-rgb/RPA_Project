*** Settings ***
Documentation    Secure Insurer Credential Retrieval (10_INSURANCE_CLAIMS.md Section 62)
Library          OperatingSystem

*** Keywords ***
Get Insurer Claims Credentials
    [Arguments]    ${provider_code}=STAR_HEALTH
    ${username}=    Get Environment Variable    INSURER_CLAIMS_USER    default=claims_rpa_agent
    ${password}=    Get Environment Variable    INSURER_CLAIMS_PASS    default=ClaimsAutomationPass2026!
    &{creds}=       Create Dictionary    username=${username}    password=${password}
    RETURN          &{creds}

Get Insurer Claims Api Token
    [Arguments]    ${provider_code}=STAR_HEALTH
    ${token}=       Get Environment Variable    INSURER_CLAIMS_TOKEN    default=SEC-CLAIMS-TOKEN-99881
    RETURN          ${token}
