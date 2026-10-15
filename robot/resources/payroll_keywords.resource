*** Settings ***
Documentation    Module 16: Payroll Support RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
Create Payroll Period Via API
    [Arguments]    ${token}    ${period_code}    ${start_date}    ${end_date}    ${frequency}=MONTHLY    ${name}=Payroll
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    periodCode=${period_code}
    ...    name=${name}
    ...    startDate=${start_date}
    ...    endDate=${end_date}
    ...    frequency=${frequency}
    ${response}=   POST    ${BASE_URL}/payroll/periods    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Open Payroll Period Via API
    [Arguments]    ${token}    ${period_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/payroll/periods/${period_id}/open    headers=${headers}    expected_status=any
    RETURN         ${response}

Generate Payroll Inputs Via API
    [Arguments]    ${token}    ${period_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/payroll/periods/${period_id}/generate-inputs    headers=${headers}    expected_status=any
    RETURN         ${response}

Validate Payroll Period Via API
    [Arguments]    ${token}    ${period_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/payroll/periods/${period_id}/validate    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Payroll Period For Approval Via API
    [Arguments]    ${token}    ${period_id}    ${notes}=Submitted for review
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    notes=${notes}
    ${response}=   POST    ${BASE_URL}/payroll/periods/${period_id}/submit-review    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Payroll Period Via API
    [Arguments]    ${token}    ${period_id}    ${notes}=Approved by manager    ${enforce_segregation}=${FALSE}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    notes=${notes}    enforceSegregation=${enforce_segregation}
    ${response}=   POST    ${BASE_URL}/payroll/periods/${period_id}/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Process Payroll Run Via API
    [Arguments]    ${token}    ${period_id}    ${correlation_id}=${EMPTY}    ${bypass_approval}=${FALSE}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    correlationId=${correlation_id}    bypassApproval=${bypass_approval}
    ${response}=   POST    ${BASE_URL}/payroll/periods/${period_id}/process    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Finalize Payroll Period Via API
    [Arguments]    ${token}    ${period_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/payroll/periods/${period_id}/finalize    headers=${headers}    expected_status=any
    RETURN         ${response}

Reconcile Internal Payroll Via API
    [Arguments]    ${token}    ${period_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/payroll/periods/${period_id}/reconcile    headers=${headers}    expected_status=any
    RETURN         ${response}

Reconcile External Payroll Via API
    [Arguments]    ${token}    ${period_id}    ${records}    ${correlation_id}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    records=${records}    correlationId=${correlation_id}
    ${response}=   POST    ${BASE_URL}/payroll/periods/${period_id}/reconcile-external    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Generate Payslips Via API
    [Arguments]    ${token}    ${period_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/payroll/periods/${period_id}/generate-payslips    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Payslip By Id Via API
    [Arguments]    ${token}    ${payslip_id}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET     ${BASE_URL}/payroll/payslips/${payslip_id}    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Payroll Query Via API
    [Arguments]    ${token}    ${employee_id_code}    ${category}    ${subject}    ${description}    ${period_code}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    employeeIdCode=${employee_id_code}
    ...    category=${category}
    ...    subject=${subject}
    ...    description=${description}
    ...    periodCode=${period_code}
    ${response}=   POST    ${BASE_URL}/payroll/queries    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
