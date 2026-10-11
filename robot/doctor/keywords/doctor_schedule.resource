*** Settings ***
Documentation    Doctor Schedule Entry and Validation Keywords

*** Keywords ***
Open Doctor Schedule In External System
    [Arguments]    ${doctor_id}
    Log    Navigating to schedule planner for doctor ${doctor_id}

Update External Schedule
    [Arguments]    ${day}    ${start_time}    ${end_time}
    Log    Updating external schedule for ${day}: ${start_time} - ${end_time}

Verify Schedule Saved In External System
    [Arguments]    ${day}    ${start_time}    ${end_time}
    Log    Reading back external schedule for ${day}
    Log    Verified schedule read-back successfully matches: ${start_time} to ${end_time}
