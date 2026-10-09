*** Settings ***
Documentation    Payment Gateway & Counter Settlement Keywords for Module 6
Resource         common.resource

*** Keywords ***
Create Payment Gateway Session
    [Arguments]    ${token}    ${invoiceNumber}    ${amount}    ${paymentMethod}=ONLINE_GATEWAY
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    invoiceNumber=${invoiceNumber}    amount=${amount}    paymentMethod=${paymentMethod}
    ${response}=   POST    ${BASE_URL}/payments/create-session    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Verify Payment Signature Callback
    [Arguments]    ${token}    ${gatewayPaymentId}    ${signature}    ${paymentMethod}=ONLINE_GATEWAY    ${status}=SUCCESS
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    gatewayPaymentId=${gatewayPaymentId}    signature=${signature}    paymentMethod=${paymentMethod}    status=${status}
    ${response}=   POST    ${BASE_URL}/payments/verify    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}


Record Counter Payment
    [Arguments]    ${token}    ${invoiceNumber}    ${amount}    ${paymentMethod}=COUNTER_CASH    ${notes}=Settled at hospital cashier
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    invoiceNumber=${invoiceNumber}
    ...    amount=${amount}
    ...    paymentMethod=${paymentMethod}
    ...    notes=${notes}
    ${response}=   POST    ${BASE_URL}/payments/counter    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Payment Receipt Details
    [Arguments]    ${token}    ${receiptNumber}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/payments/receipt/${receiptNumber}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Payments For Invoice
    [Arguments]    ${token}    ${invoiceNumber}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/payments/invoice/${invoiceNumber}    headers=${headers}    expected_status=any
    RETURN         ${response}
