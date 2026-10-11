*** Settings ***
Documentation    Module 09: Robot Framework Portal Verification Flow (Section 23)
Resource         ../resources/common.resource
Resource         ../resources/browser.resource
Resource         ../keywords/insurer_login.resource
Resource         ../keywords/policy_search.resource
Resource         ../keywords/eligibility_check.resource
Resource         ../keywords/coverage_check.resource
Resource         ../keywords/authorization_check.resource
Resource         ../keywords/evidence_capture.resource
Resource         ../keywords/verification_result.resource

*** Test Cases ***
Verify Insurance Policy Portal Flow
    [Documentation]    Executes the standard end-to-end portal verification flow
    Open Insurer Session
    Authenticate With Insurer    STAR_HEALTH

    ${search}=    Search Patient Policy    POL-ABC-45892    MEM-78291
    ${pStatus}=   Verify Policy Status    ${search}
    ${elig}=      Verify Eligibility    ${search}
    ${net}=       Verify Network Status    ${search}
    ${cov}=       Retrieve Coverage Information    ${search}
    ${auth}=      Retrieve Authorization Requirement    ${search}

    ${evidence}=  Capture Verification Evidence    IV-2026-000123
    ${output}=    Build Normalized Verification Result    VERIFIED    ${elig}    ${pStatus}    ${net}    ${cov}    ${auth}    ${evidence}

    Should Be Equal    ${output.status}    VERIFIED
    Should Be Equal    ${output.eligibilityStatus}    ELIGIBLE
    Should Be Equal    ${output.networkStatus}    IN_NETWORK

    Close Insurer Session
