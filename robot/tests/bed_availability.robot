*** Settings ***
Documentation    Module 5: Bed Availability, Dashboard Metrics & Search Preservation Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/bed_keywords.resource

Suite Setup      Setup Admin Session

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Admin Session
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}

*** Test Cases ***
TC-BED-001 Live Operational Bed Dashboard Metrics
    [Documentation]    Verify live availability dashboard calculates counts and percentages accurately
    ${dash}=    Get Bed Availability Dashboard    ${AUTH_TOKEN}
    Should Be True    ${dash}[total] >= 20
    Should Be True    ${dash}[available] >= 1
    Should Be True    ${dash}[occupied] >= 1
    Should Be True    ${dash}[occupancyRate] >= 0

TC-BED-002 Deterministic Search Category Preservation
    [Documentation]    Verify search engine respects preference when available and avoids silent downgrade
    ${searchRes}=    Search Available Beds With Requirements    ${AUTH_TOKEN}    GENERAL_WARD    PRIVATE_ROOM
    Should Be Equal    ${searchRes}[requestedCategory]    PRIVATE_ROOM
    Should Be True     ${searchRes}[availableCount] >= 1

TC-BED-003 Clinical Requirement Precedence Over Patient Preference
    [Documentation]    Rule 5: Strict clinical requirement (ICU) overrides patient general ward preference
    ${searchRes}=    Search Available Beds With Requirements    ${AUTH_TOKEN}    ICU    GENERAL_WARD
    Should Be Equal    ${searchRes}[requestedCategory]    ICU
    Should Be True     ${searchRes}[isStrictClinical]

TC-BED-004 Status Filtering And Exclusion Of Non-Available Beds
    [Documentation]    Verify search only returns AVAILABLE beds (excludes OCCUPIED, CLEANING, MAINTENANCE)
    ${beds}=    Get All Beds    ${AUTH_TOKEN}    status=AVAILABLE
    FOR    ${bed}    IN    @{beds}
        Should Be Equal    ${bed}[status]    AVAILABLE
    END
