*** Settings ***
Documentation    Browser Control for Insurer Claims Portal
Resource         common.resource

*** Keywords ***
Open Insurer Claims Portal
    [Arguments]    ${portal_url}=${INSURER_PORTAL_URL}
    Log    Launching browser for insurer portal: ${portal_url}

Close Insurer Claims Portal
    Log    Closing insurer portal browser session securely
