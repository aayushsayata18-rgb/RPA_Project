*** Settings ***
Documentation    Module 17: Pharmacy Management RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
# --- MEDICINE CATALOG KEYWORDS ---

Create Medicine Via API
    [Arguments]    ${token}    ${brandName}    ${genericName}    ${dosageForm}=TABLET    ${strength}=500mg    ${unitPrice}=10.00    ${isControlled}=${FALSE}    ${barcode}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    brandName=${brandName}
    ...    genericName=${genericName}
    ...    dosageForm=${dosageForm}
    ...    strength=${strength}
    ...    unitPrice=${unitPrice}
    ...    isControlledMedicine=${isControlled}
    IF    '${barcode}' != '${EMPTY}'
        Set To Dictionary    ${payload}    barcode=${barcode}
    END
    ${response}=   POST    ${BASE_URL}/pharmacy/medicines    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Medicines Via API
    [Arguments]    ${token}    ${search}=${EMPTY}    ${status}=ACTIVE
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${search}' != '${EMPTY}'
        Set To Dictionary    ${params}    search=${search}
    END
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    ${response}=   GET    ${BASE_URL}/pharmacy/medicines    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Medicine Details Via API
    [Arguments]    ${token}    ${medicineId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/pharmacy/medicines/${medicineId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Check Medicine Availability Via API
    [Arguments]    ${token}    ${medicineId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/pharmacy/availability/${medicineId}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- PRESCRIPTION KEYWORDS ---

Create Prescription Via API
    [Arguments]    ${token}    ${patientId}    ${doctorId}    ${encounterType}=OUTPATIENT    ${diagnosis}=General Consultation    ${items}=${None}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    doctorId=${doctorId}
    ...    encounterType=${encounterType}
    ...    diagnosis=${diagnosis}
    IF    ${items} != ${None}
        Set To Dictionary    ${payload}    items=${items}
    END
    ${response}=   POST    ${BASE_URL}/pharmacy/prescriptions    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Prescriptions Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${patientId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    IF    '${patientId}' != '${EMPTY}'
        Set To Dictionary    ${params}    patientId=${patientId}
    END
    ${response}=   GET    ${BASE_URL}/pharmacy/prescriptions    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Prescription Details Via API
    [Arguments]    ${token}    ${prescriptionId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/pharmacy/prescriptions/${prescriptionId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Send Prescription To Pharmacy Via API
    [Arguments]    ${token}    ${prescriptionId}    ${orderType}=OUTPATIENT    ${priority}=ROUTINE
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    orderType=${orderType}    priority=${priority}
    ${response}=   POST    ${BASE_URL}/pharmacy/prescriptions/${prescriptionId}/send    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Validate Prescription Via API
    [Arguments]    ${token}    ${prescriptionId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/pharmacy/prescriptions/${prescriptionId}/validate    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- PHARMACY ORDER KEYWORDS ---

Get Pharmacy Orders Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${priority}=${EMPTY}    ${orderType}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    IF    '${priority}' != '${EMPTY}'
        Set To Dictionary    ${params}    priority=${priority}
    END
    IF    '${orderType}' != '${EMPTY}'
        Set To Dictionary    ${params}    orderType=${orderType}
    END
    ${response}=   GET    ${BASE_URL}/pharmacy/orders    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Pharmacy Order By Id Via API
    [Arguments]    ${token}    ${orderId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/pharmacy/orders/${orderId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Reserve Stock For Order Via API
    [Arguments]    ${token}    ${orderId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/pharmacy/orders/${orderId}/reserve    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- DISPENSING KEYWORDS ---

Dispense Pharmacy Order Via API
    [Arguments]    ${token}    ${orderId}    ${dispensedItems}    ${correlationId}=${EMPTY}    ${idempotencyKey}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    pharmacyOrderId=${orderId}    dispensedItems=${dispensedItems}
    IF    '${correlationId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    correlationId=${correlationId}
    END
    IF    '${idempotencyKey}' != '${EMPTY}'
        Set To Dictionary    ${payload}    idempotencyKey=${idempotencyKey}
    END
    ${response}=   POST    ${BASE_URL}/pharmacy/dispensing    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Dispensing Records Via API
    [Arguments]    ${token}    ${patientId}=${EMPTY}    ${orderId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${patientId}' != '${EMPTY}'
        Set To Dictionary    ${params}    patientId=${patientId}
    END
    IF    '${orderId}' != '${EMPTY}'
        Set To Dictionary    ${params}    pharmacyOrderId=${orderId}
    END
    ${response}=   GET    ${BASE_URL}/pharmacy/dispensing    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Dispensing Record By Id Via API
    [Arguments]    ${token}    ${dispensingRecordId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/pharmacy/dispensing/${dispensingRecordId}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- PHARMACY RETURNS KEYWORDS ---

Create Pharmacy Return Via API
    [Arguments]    ${token}    ${patientId}    ${dispensingRecordId}    ${reason}=MEDICATION_DISCONTINUED    ${items}=${None}    ${notes}=Returned undamaged
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    dispensingRecordId=${dispensingRecordId}
    ...    reason=${reason}
    ...    notes=${notes}
    IF    ${items} != ${None}
        Set To Dictionary    ${payload}    items=${items}
    END
    ${response}=   POST    ${BASE_URL}/pharmacy/returns    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Pharmacy Returns Via API
    [Arguments]    ${token}    ${status}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    ${response}=   GET    ${BASE_URL}/pharmacy/returns    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Pharmacy Return Via API
    [Arguments]    ${token}    ${returnId}    ${disposition}=QUARANTINE_NON_SALEABLE
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    action=APPROVE    quarantineDisposition=${disposition}
    ${response}=   POST    ${BASE_URL}/pharmacy/returns/${returnId}/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- ALERTS & REPORTS KEYWORDS ---

Get Pharmacy KPIs Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/pharmacy/reports/kpis    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Near Expiry Alerts Via API
    [Arguments]    ${token}    ${days}=30
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary    days=${days}
    ${response}=   GET    ${BASE_URL}/pharmacy/reports/near-expiry    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Out Of Stock Alerts Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/pharmacy/reports/out-of-stock    headers=${headers}    expected_status=any
    RETURN         ${response}
