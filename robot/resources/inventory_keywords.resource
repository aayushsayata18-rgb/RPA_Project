*** Settings ***
Documentation    Module 18: Medical Inventory Management RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
# --- ITEM MASTER KEYWORDS ---

Create Inventory Item Via API
    [Arguments]    ${token}    ${name}    ${category}    ${itemType}=MEDICINE    ${unitOfMeasure}=UNIT    ${reorderLevel}=50    ${barcode}=${EMPTY}    ${sku}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    name=${name}
    ...    category=${category}
    ...    itemType=${itemType}
    ...    unitOfMeasure=${unitOfMeasure}
    ...    reorderLevel=${reorderLevel}
    IF    '${barcode}' != '${EMPTY}'
        Set To Dictionary    ${payload}    barcode=${barcode}
    END
    IF    '${sku}' != '${EMPTY}'
        Set To Dictionary    ${payload}    sku=${sku}
    END
    ${response}=   POST    ${BASE_URL}/inventory/items    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Inventory Items Via API
    [Arguments]    ${token}    ${search}=${EMPTY}    ${category}=${EMPTY}    ${status}=ACTIVE
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${search}' != '${EMPTY}'
        Set To Dictionary    ${params}    search=${search}
    END
    IF    '${category}' != '${EMPTY}'
        Set To Dictionary    ${params}    category=${category}
    END
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    ${response}=   GET    ${BASE_URL}/inventory/items    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Inventory Item Details Via API
    [Arguments]    ${token}    ${itemId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/inventory/items/${itemId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Check Item Availability Via API
    [Arguments]    ${token}    ${itemId}    ${locationId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${locationId}' != '${EMPTY}'
        Set To Dictionary    ${params}    locationId=${locationId}
    END
    ${response}=   GET    ${BASE_URL}/inventory/availability/${itemId}    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- GOODS RECEIPT & BATCH KEYWORDS ---

Create Goods Receipt Via API
    [Arguments]    ${token}    ${poId}    ${vendorId}    ${items}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    purchaseOrderId=${poId}
    ...    vendorId=${vendorId}
    ...    items=${items}
    ${response}=   POST    ${BASE_URL}/inventory/goods-receipts    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- RESERVATION & ISSUE KEYWORDS ---

Reserve Stock Via API
    [Arguments]    ${token}    ${itemId}    ${quantity}    ${reservedForType}=WARD_ISSUE    ${reservedForId}=ROBOT-REQ-01
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    inventoryItemId=${itemId}
    ...    quantity=${quantity}
    ...    reservedForType=${reservedForType}
    ...    reservedForId=${reservedForId}
    ${response}=   POST    ${BASE_URL}/inventory/reservations    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Release Reservation Via API
    [Arguments]    ${token}    ${reservationId}    ${reason}=Routine Test Release
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/inventory/reservations/${reservationId}/release    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Issue Stock Via API
    [Arguments]    ${token}    ${itemId}    ${quantity}    ${referenceType}=DEPARTMENT_ISSUE    ${referenceId}=ROBOT-ISSUE-01
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    inventoryItemId=${itemId}
    ...    quantity=${quantity}
    ...    referenceType=${referenceType}
    ...    referenceId=${referenceId}
    ${response}=   POST    ${BASE_URL}/inventory/issues    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- TRANSFER KEYWORDS ---

Request Stock Transfer Via API
    [Arguments]    ${token}    ${sourceLoc}    ${destLoc}    ${items}    ${reason}=Routine Replenishment
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    sourceLocationId=${sourceLoc}
    ...    destinationLocationId=${destLoc}
    ...    items=${items}
    ...    reason=${reason}
    ${response}=   POST    ${BASE_URL}/inventory/transfers    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Stock Transfer Via API
    [Arguments]    ${token}    ${transferId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/inventory/transfers/${transferId}/approve    headers=${headers}    expected_status=any
    RETURN         ${response}

Dispatch Stock Transfer Via API
    [Arguments]    ${token}    ${transferId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/inventory/transfers/${transferId}/dispatch    headers=${headers}    expected_status=any
    RETURN         ${response}

Receive Stock Transfer Via API
    [Arguments]    ${token}    ${transferId}    ${items}=${None}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    IF    ${items} != ${None}
        Set To Dictionary    ${payload}    items=${items}
    END
    ${response}=   POST    ${BASE_URL}/inventory/transfers/${transferId}/receive    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- ADJUSTMENT & COUNT KEYWORDS ---

Create Stock Adjustment Via API
    [Arguments]    ${token}    ${itemId}    ${batchId}    ${physicalQty}    ${reason}=PHYSICAL_COUNT_DIFFERENCE    ${autoApprove}=${FALSE}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    inventoryItemId=${itemId}
    ...    batchId=${batchId}
    ...    physicalQuantity=${physicalQty}
    ...    reason=${reason}
    ...    autoApprove=${autoApprove}
    ${response}=   POST    ${BASE_URL}/inventory/adjustments    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Stock Adjustment Via API
    [Arguments]    ${token}    ${adjustmentId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/inventory/adjustments/${adjustmentId}/approve    headers=${headers}    expected_status=any
    RETURN         ${response}

Start Stock Count Session Via API
    [Arguments]    ${token}    ${locationId}=LOC-MAIN-001    ${countType}=CYCLE_COUNT
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    locationId=${locationId}
    ...    countType=${countType}
    ${response}=   POST    ${BASE_URL}/inventory/counts    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- RECONCILIATION & ALERTS KEYWORDS ---

Run Stock Reconciliation Via API
    [Arguments]    ${token}    ${source}    ${locationId}    ${records}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    source=${source}
    ...    locationId=${locationId}
    ...    externalRecords=${records}
    ${response}=   POST    ${BASE_URL}/inventory/reconciliations    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Resolve Reconciliation Discrepancy Via API
    [Arguments]    ${token}    ${reconId}    ${inventoryItemId}    ${batchNumber}    ${action}=CREATE_ADJUSTMENT
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    inventoryItemId=${inventoryItemId}
    ...    batchNumber=${batchNumber}
    ...    action=${action}
    ...    notes=Automated RPA resolution
    ${response}=   POST    ${BASE_URL}/inventory/reconciliations/${reconId}/resolve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Scan Low Stock Alerts Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/inventory/alerts/scan-low-stock    headers=${headers}    expected_status=any
    RETURN         ${response}

Scan Expiry Alerts Via API
    [Arguments]    ${token}    ${nearDays}=30
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary    nearExpiryDays=${nearDays}
    ${response}=   POST    ${BASE_URL}/inventory/alerts/scan-expiry    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Inventory Dashboard KPIs Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/inventory/dashboard/kpis    headers=${headers}    expected_status=any
    RETURN         ${response}
