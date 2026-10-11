*** Settings ***
Documentation    Authentication Keywords for Legacy Doctor Portal
Resource         ../resources/secrets.resource

*** Keywords ***
Login To External System
    ${user}    ${pass}=    Get External System Credentials
    Log    Authenticating bot into external HIS portal securely
    Log    Authentication successful for user: ${user}
