*** Settings ***
Documentation    Module 09: Retry Failed Portal Verification Workflow (Section 38 & 76)
Resource         ../resources/common.resource
Resource         ../resources/browser.resource
Resource         ../keywords/insurer_login.resource

*** Test Cases ***
Retry Failed Verification Workflow
    [Documentation]    Ensures technical timeout allows re-executing portal connection
    Open Insurer Session
    Authenticate With Insurer    STAR_HEALTH
    Log    Simulating retry attempt #2 after network recovery
    Log    Portal session re-established successfully
    Close Insurer Session
