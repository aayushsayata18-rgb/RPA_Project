*** Settings ***
Documentation    Browser Automation Abstraction for External HRMS / HIS Staff Management
Resource         common.resource

*** Keywords ***
Open External HR System
    [Arguments]    ${url}=${LEGACY_HRMS_URL}
    Log    Navigating browser to legacy HRMS portal: ${url}

Close External Session
    Log    Terminating active external browser session cleanly
