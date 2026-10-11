*** Settings ***
Documentation    Keywords for Insurer Portal Authentication
Resource         ../resources/secrets.resource
Resource         ../resources/browser.resource

*** Keywords ***
Authenticate With Insurer
    [Arguments]    ${provider_code}=STAR_HEALTH
    &{creds}=       Get Insurer Portal Credentials    ${provider_code}
    Log             Authenticating with insurer portal as ${creds.username}
    Should Not Be Empty    ${creds.password}
    Log             Authentication session token verified
