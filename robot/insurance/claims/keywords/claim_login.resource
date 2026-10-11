*** Settings ***
Documentation    Portal Authentication Keywords
Resource         ../resources/secrets.resource

*** Keywords ***
Login To Insurer Claims Portal
    [Arguments]    ${provider_code}=STAR_HEALTH
    &{creds}=      Get Insurer Claims Credentials    ${provider_code}
    Log            Authenticating with insurer portal as ${creds.username}
    Log            Insurer claims session established successfully
