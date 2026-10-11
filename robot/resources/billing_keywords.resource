*** Settings ***
Documentation    Billing & Invoicing Automation Keywords for Module 8
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

Create Billable Item
    [Arguments]    ${token}    ${patientId}    ${sourceModule}    ${serviceCode}    ${description}    ${quantity}=1    ${unitPrice}=${EMPTY}    ${admissionId}=${EMPTY}    ${sourceId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    sourceModule=${sourceModule}
    ...    serviceCode=${serviceCode}
    ...    description=${description}
    ...    quantity=${quantity}
    IF    '${unitPrice}' != '${EMPTY}'
        Set To Dictionary    ${payload}    unitPrice=${unitPrice}
    END
    IF    '${admissionId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    admissionId=${admissionId}
    END
    IF    '${sourceId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    sourceId=${sourceId}
    END
    ${response}=   POST    ${BASE_URL}/billing/billable-items    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Billable Items
    [Arguments]    ${token}    ${patientId}=${EMPTY}    ${status}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${patientId}' != '${EMPTY}'
        Set To Dictionary    ${params}    patientId=${patientId}
    END
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    ${response}=   GET    ${BASE_URL}/billing/billable-items    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Validate Billable Item
    [Arguments]    ${token}    ${chargeId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/billing/billable-items/${chargeId}/validate    headers=${headers}    expected_status=any
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

Create Draft Invoice
    [Arguments]    ${token}    ${patientId}    ${invoiceType}=GENERAL    ${admissionId}=${EMPTY}    ${depositAmount}=0    ${coveredAmount}=0    ${discountAmount}=0
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    invoiceType=${invoiceType}
    ...    depositAmount=${depositAmount}
    ...    coveredAmount=${coveredAmount}
    ...    discountAmount=${discountAmount}
    IF    '${admissionId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    admissionId=${admissionId}
    END
    ${response}=   POST    ${BASE_URL}/billing/invoices    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Finalize Invoice
    [Arguments]    ${token}    ${invoiceId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/billing/invoices/${invoiceId}/finalize    headers=${headers}    expected_status=any
    RETURN         ${response}

Cancel Invoice
    [Arguments]    ${token}    ${invoiceId}    ${reason}=Cancelled by user
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    cancellationReason=${reason}
    ${response}=   POST    ${BASE_URL}/billing/invoices/${invoiceId}/cancel    json=${payload}    headers=${headers}    expected_status=any
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

Record Patient Deposit
    [Arguments]    ${token}    ${patientId}    ${amount}    ${paymentMethod}=CASH    ${admissionId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    patientId=${patientId}    amount=${amount}    paymentMethod=${paymentMethod}
    IF    '${admissionId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    admissionId=${admissionId}
    END
    ${response}=   POST    ${BASE_URL}/billing/deposits    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Apply Deposit To Invoice
    [Arguments]    ${token}    ${depositNumber}    ${invoiceId}    ${amount}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    invoiceId=${invoiceId}
    IF    '${amount}' != '${EMPTY}'
        Set To Dictionary    ${payload}    amount=${amount}
    END
    ${response}=   POST    ${BASE_URL}/billing/deposits/${depositNumber}/apply    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Request Financial Adjustment
    [Arguments]    ${token}    ${invoiceId}    ${type}    ${amount}    ${reason}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    invoiceId=${invoiceId}    type=${type}    amount=${amount}    reason=${reason}
    ${response}=   POST    ${BASE_URL}/billing/adjustments    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Financial Adjustment
    [Arguments]    ${token}    ${adjustmentNumber}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/billing/adjustments/${adjustmentNumber}/approve    headers=${headers}    expected_status=any
    RETURN         ${response}

Create Billing Query
    [Arguments]    ${token}    ${patientId}    ${invoiceId}    ${description}    ${category}=CHARGE_CLARIFICATION
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    patientId=${patientId}    invoiceId=${invoiceId}    description=${description}    category=${category}
    ${response}=   POST    ${BASE_URL}/billing/queries    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Resolve Billing Query
    [Arguments]    ${token}    ${queryNumber}    ${resolution}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    resolution=${resolution}
    ${response}=   POST    ${BASE_URL}/billing/queries/${queryNumber}/resolve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Master Rate Cards
    [Arguments]    ${token}    ${category}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${category}' != '${EMPTY}'
        Set To Dictionary    ${params}    category=${category}
    END
    ${response}=   GET    ${BASE_URL}/billing/rates    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Reconcile Payment Ledger
    [Arguments]    ${token}    ${settlementList}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    settlementRecords=${settlementList}
    ${response}=   POST    ${BASE_URL}/billing/reports/reconcile    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
