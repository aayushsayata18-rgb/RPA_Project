*** Settings ***
Documentation    Module 18: Medical Inventory Management RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/inventory_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Inventory Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${ITEM_ID}            ${EMPTY}
${BATCH_ID}           ${EMPTY}
${BATCH_NUMBER}       ${EMPTY}
${RESERVATION_ID}     ${EMPTY}
${TRANSFER_ID}        ${EMPTY}
${ADJUSTMENT_ID}      ${EMPTY}
${RECON_ID}           ${EMPTY}

*** Keywords ***
Setup Inventory Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    6    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

*** Test Cases ***
TC-INV-001 Item Catalog Management And Availability Check
    [Documentation]    Verifies inventory item master creation and stock availability check
    ${bCode}=    Set Variable    BC-ROBOT-INV-${RUN_ID}
    ${resItem}=   Create Inventory Item Via API    ${AUTH_TOKEN}    Surgical Sponge Robot ${RUN_ID}    SURGICAL_SUPPLY    SURGICAL_SUPPLY    PACK    40    barcode=${bCode}
    Should Be True    ${resItem.status_code} == 200 or ${resItem.status_code} == 201
    ${iId}=       Set Variable    ${resItem.json()}[item][inventoryItemId]
    Set Suite Variable    ${ITEM_ID}    ${iId}

    # Query active inventory items
    ${resList}=   Get Inventory Items Via API    ${AUTH_TOKEN}    search=Surgical Sponge Robot
    Should Be Equal As Integers    ${resList.status_code}    200
    Should Be True    ${resList.json()}[total] >= 1

    # Check availability
    ${resAvail}=  Check Item Availability Via API    ${AUTH_TOKEN}    ${ITEM_ID}
    Should Be Equal As Integers    ${resAvail.status_code}    200
    Should Be True    ${resAvail.json()}[availability][onHandQuantity] >= 0

TC-INV-002 Goods Receipt And Automated Batch Registration
    [Documentation]    Receives purchase delivery, validates expiry, and verifies batch creation
    ${bNum}=      Set Variable    BAT-ROBOT-${RUN_ID}
    Set Suite Variable    ${BATCH_NUMBER}    ${bNum}
    ${itemDict}=  Create Dictionary
    ...    inventoryItemId=${ITEM_ID}
    ...    orderedQuantity=300
    ...    receivedQuantity=300
    ...    acceptedQuantity=300
    ...    rejectedQuantity=0
    ...    batchNumber=${bNum}
    ...    expiryDate=2028-12-31T00:00:00.000Z
    ...    unitCost=5.50
    ...    locationId=LOC-MAIN-001
    ${itemsList}=  Create List    ${itemDict}

    ${resGRN}=    Create Goods Receipt Via API    ${AUTH_TOKEN}    PO-ROBOT-${RUN_ID}    VND-1001    ${itemsList}
    Should Be True    ${resGRN.status_code} == 200 or ${resGRN.status_code} == 201
    ${bId}=       Set Variable    ${resGRN.json()}[batches][0][batchId]
    Set Suite Variable    ${BATCH_ID}    ${bId}
    Should Be Equal As Integers    ${resGRN.json()}[batches][0][availableQuantity]    300

TC-INV-003 Stock Reservation And Safe Release Flow
    [Documentation]    Tests atomic stock reservation and release back to availability
    ${resRes}=    Reserve Stock Via API    ${AUTH_TOKEN}    ${ITEM_ID}    50    WARD_ISSUE    WARD-REQ-${RUN_ID}
    Should Be True    ${resRes.status_code} == 200 or ${resRes.status_code} == 201
    ${rId}=       Set Variable    ${resRes.json()}[reservation][reservationId]
    Set Suite Variable    ${RESERVATION_ID}    ${rId}

    # Verify stock reduced from available
    ${resAvail}=  Check Item Availability Via API    ${AUTH_TOKEN}    ${ITEM_ID}    LOC-MAIN-001
    Should Be Equal As Integers    ${resAvail.json()}[availability][availableQuantity]    250
    Should Be Equal As Integers    ${resAvail.json()}[availability][reservedQuantity]    50

    # Release reservation
    ${resRel}=    Release Reservation Via API    ${AUTH_TOKEN}    ${RESERVATION_ID}    Procedure postponed
    Should Be Equal As Integers    ${resRel.status_code}    200
    Should Be Equal As Strings    ${resRel.json()}[reservation][status]    RELEASED

    # Verify stock restored
    ${resAvail2}=    Check Item Availability Via API    ${AUTH_TOKEN}    ${ITEM_ID}    LOC-MAIN-001
    Should Be Equal As Integers    ${resAvail2.json()}[availability][availableQuantity]    300

TC-INV-004 Department Stock Issue And Movement Ledger
    [Documentation]    Executes stock issue and verifies append-only movement ledger
    ${resIssue}=  Issue Stock Via API    ${AUTH_TOKEN}    ${ITEM_ID}    40    DEPARTMENT_ISSUE    DEP-REQ-${RUN_ID}
    Should Be Equal As Integers    ${resIssue.status_code}    200
    Should Be Equal As Integers    ${resIssue.json()}[issuedQuantity]    40
    Should Be Equal As Integers    ${resIssue.json()}[remainingBatchAvailable]    260

TC-INV-005 Inter-Store Transfer Lifecycle And Mismatch Handling
    [Documentation]    Requests, approves, dispatches, and receives transfer with mismatch flag
    ${tItem}=     Create Dictionary
    ...    inventoryItemId=${ITEM_ID}
    ...    batchId=${BATCH_ID}
    ...    requestedQuantity=50
    ${tItems}=    Create List    ${tItem}

    # Request
    ${resReq}=    Request Stock Transfer Via API    ${AUTH_TOKEN}    LOC-MAIN-001    LOC-OT-001    ${tItems}    Theatre Routine Issue
    Should Be True    ${resReq.status_code} == 200 or ${resReq.status_code} == 201
    ${trfId}=     Set Variable    ${resReq.json()}[transfer][transferId]
    Set Suite Variable    ${TRANSFER_ID}    ${trfId}

    # Approve
    ${resAppr}=   Approve Stock Transfer Via API    ${AUTH_TOKEN}    ${TRANSFER_ID}
    Should Be Equal As Integers    ${resAppr.status_code}    200

    # Dispatch
    ${resDisp}=   Dispatch Stock Transfer Via API    ${AUTH_TOKEN}    ${TRANSFER_ID}
    Should Be Equal As Integers    ${resDisp.status_code}    200

    # Receive with mismatch (Dispatched: 50, Received: 48)
    ${recvItem}=  Create Dictionary
    ...    inventoryItemId=${ITEM_ID}
    ...    batchId=${BATCH_ID}
    ...    receivedQuantity=48
    ${recvList}=  Create List    ${recvItem}

    ${resRecv}=   Receive Stock Transfer Via API    ${AUTH_TOKEN}    ${TRANSFER_ID}    ${recvList}
    Should Be Equal As Integers    ${resRecv.status_code}    200
    Should Be Equal As Strings    ${resRecv.json()}[transfer][hasMismatch]    True
    Should Be Equal As Strings    ${resRecv.json()}[transfer][status]    PARTIALLY_RECEIVED

TC-INV-006 Authorized Stock Adjustment Flow
    [Documentation]    Creates adjustment draft and approves modification
    ${resAdj}=    Create Stock Adjustment Via API    ${AUTH_TOKEN}    ${ITEM_ID}    ${BATCH_ID}    210    PHYSICAL_COUNT_DIFFERENCE    autoApprove=${TRUE}
    Should Be True    ${resAdj.status_code} == 200 or ${resAdj.status_code} == 201
    Should Be Equal As Strings    ${resAdj.json()}[adjustment][status]    PROCESSED

TC-INV-007 Stock Reconciliation And Expiry Alert Verification
    [Documentation]    Runs external feed reconciliation, discrepancy resolution, and alert scanning
    ${extItem}=   Create Dictionary
    ...    itemId=${ITEM_ID}
    ...    itemName=Surgical Sponge Robot ${RUN_ID}
    ...    batchNumber=${BATCH_NUMBER}
    ...    quantity=208
    ${extList}=   Create List    ${extItem}

    # Run Reconciliation
    ${resRecon}=  Run Stock Reconciliation Via API    ${AUTH_TOKEN}    EXTERNAL_ERP    LOC-MAIN-001    ${extList}
    Should Be True    ${resRecon.status_code} == 200 or ${resRecon.status_code} == 201
    ${rcId}=      Set Variable    ${resRecon.json()}[reconciliation][reconciliationId]
    Set Suite Variable    ${RECON_ID}    ${rcId}

    # Resolve discrepancy
    ${resResl}=   Resolve Reconciliation Discrepancy Via API    ${AUTH_TOKEN}    ${RECON_ID}    ${ITEM_ID}    ${BATCH_NUMBER}    CREATE_ADJUSTMENT
    Should Be Equal As Integers    ${resResl.status_code}    200

    # Scan Expiry & Low Stock Alerts
    ${resExp}=    Scan Expiry Alerts Via API    ${AUTH_TOKEN}    30
    Should Be Equal As Integers    ${resExp.status_code}    200

    ${resLow}=    Scan Low Stock Alerts Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resLow.status_code}    200

    # Verify Dashboard KPIs
    ${resKPI}=    Get Inventory Dashboard KPIs Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resKPI.status_code}    200
    Should Be True    ${resKPI.json()}[kpis][totalItems] >= 30
