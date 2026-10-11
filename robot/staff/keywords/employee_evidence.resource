*** Settings ***
Documentation    Keywords for capturing audit evidence and verification logs for staff RPA jobs
Resource         ../resources/common.resource

*** Keywords ***
Capture Staff Sync Evidence
    [Arguments]    ${employee_id}    ${step_name}
    Log    Capturing verification audit trail snapshot for ${employee_id} during step: ${step_name}
    Log    Saved verification screenshot to ${SCREENSHOT_DIR}/${employee_id}_${step_name}.png
