*** Settings ***
Documentation    Module 09: Capture Portal Verification Evidence (Section 26 & 76)
Resource         ../resources/common.resource
Resource         ../keywords/evidence_capture.resource

*** Test Cases ***
Capture Portal Screenshot Evidence
    [Documentation]    Captures and validates storage reference for portal verification screenshot
    ${path}=    Capture Verification Evidence    IV-2026-TEST-EVID
    Should Contain    ${path}    /evidence/insurance/portal_IV-2026-TEST-EVID.png
