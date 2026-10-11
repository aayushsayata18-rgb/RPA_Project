*** Settings ***
Documentation    Browser Automation Abstraction for External Hospital HIS
Resource         common.resource

*** Keywords ***
Open External Hospital System
    [Arguments]    ${url}=${LEGACY_HIS_URL}
    Log    Navigating browser to legacy HIS doctor management portal: ${url}

Close External Session
    Log    Terminating active external browser session cleanly
