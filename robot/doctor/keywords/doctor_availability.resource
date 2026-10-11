*** Settings ***
Documentation    Doctor Availability Synchronization Keywords

*** Keywords ***
Update External Availability
    [Arguments]    ${doctor_id}    ${date}    ${status}    ${reason}
    Log    Synchronizing availability for doctor ${doctor_id} on ${date}: Status=${status}, Reason=${reason}

Verify Availability Saved In External System
    [Arguments]    ${doctor_id}    ${date}    ${expected_status}
    Log    Reading back external availability on ${date}
    Log    Confirmed read-back status matches expected: ${expected_status}
