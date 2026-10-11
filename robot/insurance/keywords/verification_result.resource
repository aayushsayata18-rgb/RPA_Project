*** Settings ***
Documentation    Keywords for Building Normalized Verification Contract Output (09_INSURANCE_VERIFICATION.md Section 63)

*** Keywords ***
Build Normalized Verification Result
    [Arguments]    ${status}    ${eligibility}    ${policy_status}    ${network}    ${coverage}    ${auth_req}    ${evidence_path}
    &{result}=    Create Dictionary
    ...    success=${TRUE}
    ...    status=${status}
    ...    policyStatus=${policy_status}
    ...    eligibilityStatus=${eligibility}
    ...    networkStatus=${network}
    ...    effectiveDate=2026-01-01
    ...    expiryDate=2026-12-31
    ...    coverage=${coverage}
    ...    authorizationRequired=${auth_req}
    ...    externalReference=PORTAL-RPA-88291
    ...    evidence=${evidence_path}
    RETURN    &{result}
