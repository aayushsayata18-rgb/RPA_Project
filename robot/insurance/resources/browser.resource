*** Settings ***
Documentation    Browser Setup & Teardown Helpers for Insurer Portals
Library          OperatingSystem
Resource         common.resource

*** Keywords ***
Open Insurer Session
    [Arguments]    ${portal_url}=${INSURER_PORTAL_URL}
    Log    Opening browser session to ${portal_url} in headless mode

Close Insurer Session
    Log    Closing insurer portal browser session and clearing cache
