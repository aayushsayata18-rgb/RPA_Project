*** Settings ***
Documentation    Secure Credential Management for Insurer Portals (09_INSURANCE_VERIFICATION.md Section 24)
Library          OperatingSystem

*** Keywords ***
Get Insurer Portal Credentials
    [Arguments]    ${provider_code}=STAR_HEALTH
    ${username}=    Get Environment Variable    INSURER_PORTAL_USER    default=portal_service_account
    ${password}=    Get Environment Variable    INSURER_PORTAL_PASS    default=SecurePortalKey2026!
    &{creds}=       Create Dictionary    username=${username}    password=${password}
    RETURN          &{creds}

Get Insurer Api Key
    [Arguments]    ${provider_code}=STAR_HEALTH
    ${apiKey}=      Get Environment Variable    INSURER_API_KEY    default=STAR-LIVE-SEC-99881
    RETURN          ${apiKey}
