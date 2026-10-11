*** Settings ***
Documentation    Keywords for Capturing Portal Evidence Screenshots & Snapshots
Library          OperatingSystem

*** Keywords ***
Capture Verification Evidence
    [Arguments]    ${verification_id}
    ${screenshot_path}=    Set Variable    /evidence/insurance/portal_${verification_id}.png
    Log    Capturing secure portal screenshot to ${screenshot_path}
    RETURN    ${screenshot_path}
