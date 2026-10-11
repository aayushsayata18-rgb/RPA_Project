*** Settings ***
Documentation    Keywords for querying staff in external systems

*** Keywords ***
Search Employee In External System
    [Arguments]    ${employee_id}
    Log    Searching external system for employee ID ${employee_id}
    Log    Search query completed for ${employee_id}
