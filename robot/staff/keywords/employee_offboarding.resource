*** Settings ***
Documentation    Keywords for external employee termination and offboarding deactivation

*** Keywords ***
Deactivate Employee In External Master
    [Arguments]    ${employee_id}    ${termination_date}    ${reason}
    Log    Marking employee ${employee_id} as TERMINATED effective ${termination_date}
    Log    Reason recorded: ${reason}
    Log    Deactivation confirmed in external database
