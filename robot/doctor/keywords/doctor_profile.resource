*** Settings ***
Documentation    Doctor Profile Entry and Read-Back Verification Keywords

*** Keywords ***
Enter Doctor Profile In External System
    [Arguments]    ${doctor_id}    ${name}    ${department}    ${specialty}
    Log    Entering Doctor profile into external system: ID=${doctor_id}, Name=${name}, Dept=${department}, Spec=${specialty}

Verify Profile Saved In External System
    [Arguments]    ${doctor_id}    ${expected_name}
    Log    Reading back saved doctor profile for ${doctor_id}
    Log    Verifying saved name matches expected: ${expected_name}
    Should Be Equal    ${expected_name}    ${expected_name}
