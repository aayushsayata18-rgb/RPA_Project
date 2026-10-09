*** Settings ***
Documentation    Keywords for OPD No Show and Reconciliation automation
Resource         ../resources/opd_keywords.resource

*** Keywords ***
Execute And Verify No Show Run
    [Arguments]    ${token}    ${graceMinutes}=15
    ${res}=        Trigger OPD No Show Processing    ${token}    gracePeriodMinutes=${graceMinutes}
    Should Be True    ${res.json()}[success]
    Dictionary Should Contain Key    ${res.json()}    processedCount

Execute And Verify Queue Reconciliation
    [Arguments]    ${token}
    ${res}=        Trigger OPD Queue Reconciliation    ${token}
    Should Be True    ${res.json()}[success]
    Dictionary Should Contain Key    ${res.json()}    totalAppointments
    Dictionary Should Contain Key    ${res.json()}    totalTokens
