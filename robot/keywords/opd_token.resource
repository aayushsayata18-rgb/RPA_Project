*** Settings ***
Documentation    Keywords for OPD Token lifecycle automation
Resource         ../resources/opd_keywords.resource

*** Keywords ***
Call And Verify Token Status
    [Arguments]    ${token}    ${tokenId}
    ${res}=        Call OPD Token    ${token}    ${tokenId}
    Should Be True    ${res.json()}[success]
    Should Be Equal As Strings    ${res.json()}[token][status]    CALLED

Start And Verify Service Status
    [Arguments]    ${token}    ${tokenId}
    ${res}=        Start OPD Service    ${token}    ${tokenId}
    Should Be True    ${res.json()}[success]
    Should Be Equal As Strings    ${res.json()}[token][status]    IN_SERVICE

Complete And Verify Service Status
    [Arguments]    ${token}    ${tokenId}
    ${res}=        Complete OPD Service    ${token}    ${tokenId}
    Should Be True    ${res.json()}[success]
    Should Be Equal As Strings    ${res.json()}[token][status]    COMPLETED

Skip And Verify Token Status
    [Arguments]    ${token}    ${tokenId}
    ${res}=        Skip OPD Token    ${token}    ${tokenId}    reason=PATIENT_NOT_PRESENT
    Should Be True    ${res.json()}[success]
    Should Be Equal As Strings    ${res.json()}[token][status]    SKIPPED

Return Skipped Token And Verify
    [Arguments]    ${token}    ${tokenId}
    ${res}=        Return Skipped OPD Token    ${token}    ${tokenId}
    Should Be True    ${res.json()}[success]
    Should Be Equal As Strings    ${res.json()}[token][status]    WAITING
