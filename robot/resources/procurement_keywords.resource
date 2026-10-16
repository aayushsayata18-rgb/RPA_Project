*** Settings ***
Documentation    Module 19: Procurement Management RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
# --- PURCHASE REQUEST KEYWORDS ---

Create Purchase Request Via API
    [Arguments]    ${token}    ${departmentId}    ${departmentName}    ${items}    ${priority}=NORMAL    ${category}=GENERAL_SUPPLIES    ${reason}=Restocking
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    departmentId=${departmentId}
    ...    departmentName=${departmentName}
    ...    items=${items}
    ...    priority=${priority}
    ...    category=${category}
    ...    reason=${reason}
    ...    requiredByDate=2028-12-31T00:00:00.000Z
    ${response}=   POST    ${BASE_URL}/procurement/requests    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Purchase Request Via API
    [Arguments]    ${token}    ${requestId}    ${notes}=Approved
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    notes=${notes}
    ${response}=   POST    ${BASE_URL}/procurement/requests/${requestId}/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Reject Purchase Request Via API
    [Arguments]    ${token}    ${requestId}    ${reason}=Budget limit exceeded
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/procurement/requests/${requestId}/reject    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- RFQ KEYWORDS ---

Create RFQ Via API
    [Arguments]    ${token}    ${title}    ${prIds}    ${vendorIds}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    title=${title}
    ...    purchaseRequestIds=${prIds}
    ...    vendorIds=${vendorIds}
    ...    responseDeadline=2028-12-31T00:00:00.000Z
    ${response}=   POST    ${BASE_URL}/procurement/rfqs    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Issue RFQ Via API
    [Arguments]    ${token}    ${rfqId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/procurement/rfqs/${rfqId}/issue    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- QUOTATION & COMPARISON KEYWORDS ---

Record Quotation Via API
    [Arguments]    ${token}    ${rfqId}    ${vendorId}    ${vendorName}    ${items}    ${shipping}=0
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    rfqId=${rfqId}
    ...    vendorId=${vendorId}
    ...    vendorName=${vendorName}
    ...    validUntil=2028-12-31T00:00:00.000Z
    ...    items=${items}
    ...    shipping=${shipping}
    ${response}=   POST    ${BASE_URL}/procurement/quotations    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Generate Quotation Comparison Via API
    [Arguments]    ${token}    ${rfqId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    rfqId=${rfqId}
    ${response}=   POST    ${BASE_URL}/procurement/comparisons    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Select Vendor Via API
    [Arguments]    ${token}    ${comparisonId}    ${vendorId}    ${quotationId}    ${reason}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    selectedVendorId=${vendorId}
    ...    selectedQuotationId=${quotationId}
    ...    selectionReason=${reason}
    ${response}=   POST    ${BASE_URL}/procurement/comparisons/${comparisonId}/select    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- PURCHASE ORDER KEYWORDS ---

Create Purchase Order Via API
    [Arguments]    ${token}    ${vendorId}    ${vendorName}    ${items}    ${prIds}    ${quotationId}=${EMPTY}    ${shipping}=0
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    vendorId=${vendorId}
    ...    vendorName=${vendorName}
    ...    purchaseRequestIds=${prIds}
    ...    expectedDeliveryDate=2028-12-31T00:00:00.000Z
    ...    items=${items}
    ...    shipping=${shipping}
    IF    '${quotationId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    quotationId=${quotationId}
    END
    ${response}=   POST    ${BASE_URL}/procurement/purchase-orders    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Purchase Order Via API
    [Arguments]    ${token}    ${poId}    ${notes}=Approved
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    notes=${notes}
    ${response}=   POST    ${BASE_URL}/procurement/purchase-orders/${poId}/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Send Purchase Order To Vendor Via API
    [Arguments]    ${token}    ${poId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/procurement/purchase-orders/${poId}/send    headers=${headers}    expected_status=any
    RETURN         ${response}

Record Vendor Acknowledgement Via API
    [Arguments]    ${token}    ${poId}    ${status}=ACCEPTED    ${comments}=Confirmed    ${externalPoRef}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    status=${status}    comments=${comments}    externalPoRef=${externalPoRef}
    ${response}=   POST    ${BASE_URL}/procurement/purchase-orders/${poId}/acknowledge    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- DELIVERY KEYWORDS ---

Register Delivery Via API
    [Arguments]    ${token}    ${poId}    ${shipmentReference}    ${carrier}=BlueDart    ${trackingNumber}=TRK-1001
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    purchaseOrderId=${poId}
    ...    shipmentReference=${shipmentReference}
    ...    carrier=${carrier}
    ...    trackingNumber=${trackingNumber}
    ...    expectedDate=2028-12-31T00:00:00.000Z
    ${response}=   POST    ${BASE_URL}/procurement/deliveries    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Update Delivery Status Via API
    [Arguments]    ${token}    ${deliveryId}    ${status}=DELIVERED
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    status=${status}
    ${response}=   PUT    ${BASE_URL}/procurement/deliveries/${deliveryId}    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- THREE-WAY MATCHING & INVOICE KEYWORDS ---

Register Supplier Invoice Via API
    [Arguments]    ${token}    ${vendorId}    ${vendorName}    ${invoiceNumber}    ${poId}    ${items}    ${goodsReceiptId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    vendorId=${vendorId}
    ...    vendorName=${vendorName}
    ...    invoiceNumber=${invoiceNumber}
    ...    purchaseOrderId=${poId}
    ...    items=${items}
    IF    '${goodsReceiptId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    goodsReceiptId=${goodsReceiptId}
    END
    ${response}=   POST    ${BASE_URL}/procurement/invoices    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Invoice And Handoff To Finance Via API
    [Arguments]    ${token}    ${invoiceId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/procurement/invoices/${invoiceId}/approve    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Procurement Dashboard Stats Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/procurement/stats    headers=${headers}    expected_status=any
    RETURN         ${response}
