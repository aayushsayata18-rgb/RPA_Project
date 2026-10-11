*** Settings ***
Documentation    Doctor Lookup in External HIS System

*** Keywords ***
Search Doctor In External System
    [Arguments]    ${doctor_id}
    Log    Searching for doctor record [${doctor_id}] in external HIS
    RETURN    ${True}
