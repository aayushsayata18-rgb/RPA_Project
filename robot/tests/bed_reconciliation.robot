*** Settings ***
Documentation    Module 5: RPA Bed State Reconciliation & Mismatch Exception Detection Suite
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
TC-BED-050 RPA Inventory Reconciliation Detects Status Mismatch
    [Documentation]    Rule 71: External inventory mismatch creates BED_STATE_MISMATCH exception without blindly overwriting
    ${legacyList}=    Create List
    ${item1}=         Create Dictionary    bedId=BED-PR-01    status=AVAILABLE    # In MERN BED-PR-01 is OCCUPIED
    ${item2}=         Create Dictionary    bedId=BED-GW-03    status=AVAILABLE
    Append To List    ${legacyList}    ${item1}
    Append To List    ${legacyList}    ${item2}

    ${reconRes}=      Reconcile Beds With Legacy System    ${AUTH_TOKEN}    ${legacyList}
    Should Be Equal As Integers    ${reconRes}[totalCompared]    2
    Should Be True    ${reconRes}[mismatchCount] >= 1
    Should Be Equal   ${reconRes}[mismatches][0][type]    STATUS_MISMATCH

TC-BED-051 Status History Audit Verification
    [Documentation]    Rule 81: Every important status change creates immutable audit history
    ${history}=       Get Bed Status History    ${AUTH_TOKEN}    BED-PR-01
    Should Be True    len(${history}[statusHistory]) >= 1
