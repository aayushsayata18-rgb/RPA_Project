*** Settings ***
Documentation    Module 17: Pharmacy Management RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/pharmacy_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Pharmacy Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${PATIENT_ID}         P10045
${DOCTOR_ID}          DOC-10001
${MEDICINE_ID}        ${EMPTY}
${PRESCRIPTION_ID}    ${EMPTY}
${ORDER_ID}           ${EMPTY}
${DISPENSING_ID}      ${EMPTY}
${BARCODE}            ${EMPTY}

*** Keywords ***
Setup Pharmacy Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    6    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

*** Test Cases ***
TC-PHARM-001 Catalog Management And Stock Availability Query
    [Documentation]    Verifies medicine registration and stock availability check
    ${bCode}=    Set Variable    BC-ROBOT-${RUN_ID}
    Set Suite Variable    ${BARCODE}    ${bCode}
    ${resMed}=    Create Medicine Via API    ${AUTH_TOKEN}    Paracetamol Robot ${RUN_ID}    Paracetamol-RPA-${RUN_ID}    TABLET    500mg    12.50    barcode=${bCode}
    Should Be True    ${resMed.status_code} == 200 or ${resMed.status_code} == 201
    ${mId}=       Set Variable    ${resMed.json()}[medicine][medicineId]
    Set Suite Variable    ${MEDICINE_ID}    ${mId}

    # Query active medicines list
    ${resList}=   Get Medicines Via API    ${AUTH_TOKEN}    search=Paracetamol
    Should Be Equal As Integers    ${resList.status_code}    200
    Should Be True    len(${resList.json()}[medicines]) >= 1

    # Check Stock availability for seeded medicine (MED-000001 Paracetamol)
    ${resAvail}=  Check Medicine Availability Via API    ${AUTH_TOKEN}    MED-000001
    Should Be Equal As Integers    ${resAvail.status_code}    200
    Should Be True    ${resAvail.json()}[availability][availableQuantity] >= 0

TC-PHARM-002 Complete Prescription Lifecycle And Order Creation
    [Documentation]    Exercises doctor prescription creation, send-to-pharmacy, pharmacist validation, and order generation
    # Create prescription items
    ${item}=    Create Dictionary
    ...    medicineId=MED-000001
    ...    medicineName=Paracetamol
    ...    dosage=1 tablet
    ...    frequency=TID
    ...    durationDays=5
    ...    quantity=15
    ...    instructions=After meals
    ${items}=    Create List    ${item}

    ${resRx}=    Create Prescription Via API    ${AUTH_TOKEN}    ${PATIENT_ID}    ${DOCTOR_ID}    OUTPATIENT    Acute Tension Headache    ${items}
    Should Be True    ${resRx.status_code} == 200 or ${resRx.status_code} == 201
    ${rxId}=     Set Variable    ${resRx.json()}[prescription][prescriptionId]
    Set Suite Variable    ${PRESCRIPTION_ID}    ${rxId}
    Should Be Equal As Strings    ${resRx.json()}[prescription][status]    ISSUED

    # Send to pharmacy (generates operational pharmacy order)
    ${resSend}=  Send Prescription To Pharmacy Via API    ${AUTH_TOKEN}    ${PRESCRIPTION_ID}    OUTPATIENT    NORMAL
    Should Be Equal As Integers    ${resSend.status_code}    200
    ${ordId}=    Set Variable    ${resSend.json()}[order][pharmacyOrderId]
    Set Suite Variable    ${ORDER_ID}    ${ordId}

    # Pharmacist clinical validation
    ${resVal}=   Validate Prescription Via API    ${AUTH_TOKEN}    ${PRESCRIPTION_ID}
    Should Be Equal As Integers    ${resVal.status_code}    200
    Should Be Equal As Strings    ${resVal.json()}[prescription][status]    VALIDATED

TC-PHARM-003 Stock Reservation And Dispensing Workflow
    [Documentation]    Verifies automated stock reservation and dispensing with verification
    # Reserve stock
    ${resRes}=    Reserve Stock For Order Via API    ${AUTH_TOKEN}    ${ORDER_ID}
    Should Be Equal As Integers    ${resRes.status_code}    200
    Should Be True    '${resRes.json()}[orderStatus]' in ['NEW', 'RECEIVED', 'READY_FOR_DISPENSING', 'PARTIALLY_FULFILLED']

    # Dispense the item with correct barcode
    ${dispItem}=    Create Dictionary
    ...    medicineId=MED-000001
    ...    batchId=BAT-10001
    ...    quantityDispensed=15
    ...    unitPrice=2.50
    ...    scannedBarcode=890100000001
    ${dispList}=    Create List    ${dispItem}

    ${resDisp}=    Dispense Pharmacy Order Via API    ${AUTH_TOKEN}    ${ORDER_ID}    ${dispList}    correlationId=RPA-DISP-${RUN_ID}    idempotencyKey=IK-ROBOT-${RUN_ID}
    Should Be True    ${resDisp.status_code} == 200 or ${resDisp.status_code} == 201
    ${dispRecId}=    Set Variable    ${resDisp.json()}[dispensingRecord][dispensingRecordId]
    Set Suite Variable    ${DISPENSING_ID}    ${dispRecId}

TC-PHARM-004 Barcode Mismatch Interlock Protection
    [Documentation]    Verifies that scanning an incorrect barcode rejects dispensing immediately
    # Create another prescription to test safety interlock
    ${item}=    Create Dictionary
    ...    medicineId=MED-000001
    ...    medicineName=Paracetamol
    ...    dosage=1 tablet
    ...    frequency=TID
    ...    durationDays=3
    ...    quantity=9
    ${items}=    Create List    ${item}
    ${resRx}=    Create Prescription Via API    ${AUTH_TOKEN}    ${PATIENT_ID}    ${DOCTOR_ID}    OUTPATIENT    Fever    ${items}
    ${rxId}=     Set Variable    ${resRx.json()}[prescription][prescriptionId]
    ${resSend}=  Send Prescription To Pharmacy Via API    ${AUTH_TOKEN}    ${rxId}    OUTPATIENT    NORMAL
    ${ordId}=    Set Variable    ${resSend.json()}[order][pharmacyOrderId]
    Validate Prescription Via API    ${AUTH_TOKEN}    ${rxId}

    ${badItem}=    Create Dictionary
    ...    medicineId=MED-000001
    ...    batchId=BAT-10001
    ...    quantityDispensed=9
    ...    unitPrice=2.50
    ...    scannedBarcode=WRONG-BARCODE-999
    ${badList}=    Create List    ${badItem}

    ${resFail}=    Dispense Pharmacy Order Via API    ${AUTH_TOKEN}    ${ordId}    ${badList}
    # Must fail barcode verification with HTTP 400 or 422
    Should Be True    ${resFail.status_code} == 400 or ${resFail.status_code} == 422

TC-PHARM-005 Pharmacy Return And Non-Saleable Quarantine
    [Documentation]    Exercises return request creation and approval into non-saleable quarantine
    ${retItem}=    Create Dictionary
    ...    medicineId=MED-000001
    ...    batchId=BAT-10001
    ...    quantity=5
    ...    quantityReturned=5
    ...    reason=PATIENT_RETURN
    ...    condition=UNOPENED
    ${retList}=    Create List    ${retItem}

    ${resRet}=    Create Pharmacy Return Via API    ${AUTH_TOKEN}    ${PATIENT_ID}    ${DISPENSING_ID}    reason=PATIENT_RETURN    items=${retList}
    Should Be True    ${resRet.status_code} == 200 or ${resRet.status_code} == 201
    ${retId}=     Set Variable    ${resRet.json()}[pharmacyReturn][returnId]

    # Senior Pharmacist approves return into quarantine
    ${resApp}=    Approve Pharmacy Return Via API    ${AUTH_TOKEN}    ${retId}    disposition=QUARANTINE_NON_SALEABLE
    Should Be Equal As Integers    ${resApp.status_code}    200
    Should Be Equal As Strings    ${resApp.json()}[pharmacyReturn][status]    APPROVED
    Should Be Equal As Strings    ${resApp.json()}[pharmacyReturn][items][0][disposition]    QUARANTINE

TC-PHARM-006 Stock And Expiry Alerts Monitoring
    [Documentation]    Verifies automated alerts query for near-expiry and out-of-stock batches
    ${resAlerts}=    Get Near Expiry Alerts Via API    ${AUTH_TOKEN}    days=90
    Should Be Equal As Integers    ${resAlerts.status_code}    200
    Should Be True    ${resAlerts.json()}[success]

    ${resStock}=     Get Out Of Stock Alerts Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resStock.status_code}    200
    Should Be True    ${resStock.json()}[success]

TC-PHARM-007 Pharmacy Executive Reports And KPIs
    [Documentation]    Verifies pharmacy executive summary statistics and KPI aggregation
    ${resKPI}=    Get Pharmacy KPIs Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resKPI.status_code}    200
    Should Be True    ${resKPI.json()}[success]
