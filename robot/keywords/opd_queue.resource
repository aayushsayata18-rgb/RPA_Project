*** Settings ***
Documentation    Keywords for OPD Queue lifecycle automation
Resource         ../resources/opd_keywords.resource

*** Keywords ***
Pause And Verify Queue
    [Arguments]    ${token}    ${queueId}    ${reason}=DOCTOR_BREAK
    ${res}=        Pause OPD Queue    ${token}    ${queueId}    reason=${reason}
    Should Be True    ${res.json()}[success]
    Should Be Equal As Strings    ${res.json()}[queue][status]    PAUSED

Resume And Verify Queue
    [Arguments]    ${token}    ${queueId}
    ${res}=        Resume OPD Queue    ${token}    ${queueId}
    Should Be True    ${res.json()}[success]
    Should Be Equal As Strings    ${res.json()}[queue][status]    OPEN

Close And Verify Queue
    [Arguments]    ${token}    ${queueId}
    ${res}=        Close OPD Queue    ${token}    ${queueId}
    Should Be True    ${res.json()}[success]
    Should Be Equal As Strings    ${res.json()}[queue][status]    CLOSED
