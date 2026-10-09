*** Settings ***
Documentation    Billing & Invoicing Keywords for Module 6
Resource         common.resource

*** Keywords ***
Record Billing Charge
    [Arguments]    ${token}    ${admissionId}    ${patientId}    ${department}    ${serviceName}    ${rate}    ${quantity}=1    ${isPendingApproval}=${FALSE}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    admissionId=${admissionId}
    ...    patientId=${patientId}
    ...    department=${department}
    ...    serviceName=${serviceName}
    ...    unitPrice=${rate}
    ...    quantity=${quantity}
    ...    isPendingApproval=${isPendingApproval}
    ${response}=   POST    ${BASE_URL}/billing/charges    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Charges For Admission
    [Arguments]    ${token}    ${admissionId}    ${status}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary    admissionId=${admissionId}
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    ${response}=   GET    ${BASE_URL}/billing/charges    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Invoice Details
    [Arguments]    ${token}    ${invoiceNumber}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/billing/invoices/${invoiceNumber}    headers=${headers}    expected_status=any
    RETURN         ${response}

Apply Deposit Adjustment To Invoice
    [Arguments]    ${token}    ${invoiceNumber}    ${amount}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    amount=${amount}
    ${response}=   POST    ${BASE_URL}/billing/invoices/${invoiceNumber}/apply-deposit    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
