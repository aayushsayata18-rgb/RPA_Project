*** Settings ***
Documentation    Admission Reconciliation & Active Inpatient Audit Keywords
Resource         ../resources/common.resource
Resource         ../resources/admission_keywords.resource

*** Keywords ***
Verify Active Inpatient Population
    [Arguments]    ${token}    ${expectedMinCount}=1
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/admissions    headers=${headers}    expected_status=200
    ${list}=       Set Variable    ${response.json()}[data]
    ${count}=      Get Length    ${list}
    Should Be True    ${count} >= ${expectedMinCount}
    RETURN         ${list}
