*** Settings ***
Documentation    Keywords for OPD Check-in automation
Resource         ../resources/opd_keywords.resource

*** Keywords ***
Verify Online CheckIn Generates Token
    [Arguments]    ${token}    ${appointmentId}
    ${res}=        Perform Online OPD CheckIn    ${token}    ${appointmentId}    override=${True}
    Should Be True    ${res.json()}[success]
    Dictionary Should Contain Key    ${res.json()}[data]    tokenNumber
    Dictionary Should Contain Key    ${res.json()}[data]    tokenId
    Should Be Equal As Strings       ${res.json()}[data][status]    WAITING
    RETURN         ${res.json()}[data]

Verify Duplicate CheckIn Prevented
    [Arguments]    ${token}    ${appointmentId}
    ${res}=        Perform Online OPD CheckIn    ${token}    ${appointmentId}    override=${True}
    Should Be True    ${res.json()}[success]
    RETURN         ${res.json()}
