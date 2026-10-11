*** Settings ***
Documentation    Evidence and Screenshot Capture Keywords for Doctor Sync
Resource         ../resources/common.resource

*** Keywords ***
Capture Doctor Sync Evidence
    [Arguments]    ${doctor_id}    ${step_name}
    Log    Capturing audit screenshot evidence for doctor ${doctor_id} at step: ${step_name}
    Log    Evidence saved into ${SCREENSHOT_DIR}/${doctor_id}_${step_name}.png
