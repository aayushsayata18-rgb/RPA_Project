*** Settings ***
Documentation    Module 19: Procurement Management RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/procurement_keywords.resource
Resource         ../resources/inventory_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Procurement Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${ITEM_ID}            ${EMPTY}
${PR_ID}              ${EMPTY}
${RFQ_ID}             ${EMPTY}
${QUO_ID}             ${EMPTY}
${CMP_ID}             ${EMPTY}
${PO_ID}              ${EMPTY}
${DEL_ID}             ${EMPTY}
${GRN_ID}             ${EMPTY}
${INV_ID}             ${EMPTY}

*** Keywords ***
Setup Procurement Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    6    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

    # Pre-register real inventory item to satisfy Goods Receipt validation
    ${bCode}=    Set Variable    BC-PROC-ROBOT-${rand}
    ${resItem}=   Create Inventory Item Via API    ${AUTH_TOKEN}    Sterile Surgical Pack Robot ${rand}    SURGICAL_SUPPLY    SURGICAL_SUPPLY    PACK    50    barcode=${bCode}
    ${itemId}=    Set Variable    ${resItem.json()}[item][inventoryItemId]
    Set Suite Variable    ${ITEM_ID}    ${itemId}

*** Test Cases ***
TC-PROC-001 Purchase Request Creation And Approval Lifecycle
    [Documentation]    Verifies PR intake, item snapshot calculations, and managerial authorization
    ${itemDict}=  Create Dictionary
    ...    inventoryItemId=${ITEM_ID}
    ...    itemNameSnapshot=Sterile Surgical Pack Robot ${RUN_ID}
    ...    description=High-grade surgical consumables
    ...    quantity=100
    ...    unit=PACK
    ...    estimatedUnitPrice=350
    ${itemsList}=  Create List    ${itemDict}

    ${resPR}=    Create Purchase Request Via API    ${AUTH_TOKEN}    DEP-SURGERY    Operation Theatre & Surgery    ${itemsList}    HIGH    SURGICAL_SUPPLY    Department operational restocking
    Should Be True    ${resPR.status_code} == 200 or ${resPR.status_code} == 201
    ${prId}=     Set Variable    ${resPR.json()}[request][purchaseRequestId]
    Set Suite Variable    ${PR_ID}    ${prId}
    Should Start With    ${PR_ID}    PR-
    Should Be Equal As Integers    ${resPR.json()}[request][estimatedTotal]    35000

    # Approve PR
    ${resApprove}=    Approve Purchase Request Via API    ${AUTH_TOKEN}    ${PR_ID}    Approved by Department Head
    Should Be Equal As Integers    ${resApprove.status_code}    200
    Should Be Equal As Strings     ${resApprove.json()}[request][status]    APPROVED

TC-PROC-002 RFQ Issuance Quotation Intake And Comparison Matrix
    [Documentation]    Creates RFQ, issues to vendors, and records quotes
    ${prList}=       Create List    ${PR_ID}
    ${vendorList}=   Create List    VND-1001    VND-1002    VND-1003

    ${resRFQ}=       Create RFQ Via API    ${AUTH_TOKEN}    Pathology & Surgical Supplies RFQ ${RUN_ID}    ${prList}    ${vendorList}
    Should Be True    ${resRFQ.status_code} == 200 or ${resRFQ.status_code} == 201
    ${rfqId}=        Set Variable    ${resRFQ.json()}[rfq][rfqId]
    Set Suite Variable    ${RFQ_ID}    ${rfqId}
    Should Start With    ${RFQ_ID}    RFQ-

    # Issue RFQ
    ${resIssue}=     Issue RFQ Via API    ${AUTH_TOKEN}    ${RFQ_ID}
    Should Be Equal As Integers    ${resIssue.status_code}    200
    Should Be Equal As Strings     ${resIssue.json()}[rfq][status]    ISSUED

    # Record Quotation from Vendor VND-1001
    ${quoteItem}=    Create Dictionary
    ...    inventoryItemId=${ITEM_ID}
    ...    description=Sterile Surgical Pack Robot ${RUN_ID}
    ...    quotedQuantity=100
    ...    unitPrice=320
    ...    taxPercent=12
    ...    deliveryDays=4
    ${quoteItems}=   Create List    ${quoteItem}

    ${resQuote}=     Record Quotation Via API    ${AUTH_TOKEN}    ${RFQ_ID}    VND-1001    Apex Pharma Supplies Pvt Ltd    ${quoteItems}    shipping=500
    Should Be True    ${resQuote.status_code} == 200 or ${resQuote.status_code} == 201
    ${quoId}=        Set Variable    ${resQuote.json()}[quotation][quotationId]
    Set Suite Variable    ${QUO_ID}    ${quoId}
    Should Start With    ${QUO_ID}    QUO-

TC-PROC-003 Human Vendor Selection And PO Generation Flow
    [Documentation]    Executes comparison matrix, enforces mandatory justification reason, and selects winning vendor
    ${resCmp}=       Generate Quotation Comparison Via API    ${AUTH_TOKEN}    ${RFQ_ID}
    Should Be True    ${resCmp.status_code} == 200 or ${resCmp.status_code} == 201
    ${cmpId}=        Set Variable    ${resCmp.json()}[comparison][comparisonId]
    Set Suite Variable    ${CMP_ID}    ${cmpId}
    Should Start With    ${CMP_ID}    CMP-

    # Human vendor selection with mandatory reason
    ${resSelect}=    Select Vendor Via API    ${AUTH_TOKEN}    ${CMP_ID}    VND-1001    ${QUO_ID}    Lowest compliant bid with 4-day delivery timeline and ISO certification
    Should Be Equal As Integers    ${resSelect.status_code}    200
    Should Be Equal As Strings     ${resSelect.json()}[comparison][approvalStatus]    APPROVED

    # Create Purchase Order
    ${poItem}=       Create Dictionary
    ...    inventoryItemId=${ITEM_ID}
    ...    description=Sterile Surgical Pack Robot ${RUN_ID}
    ...    quantity=100
    ...    unitPrice=320
    ...    taxPercent=12
    ${poItems}=      Create List    ${poItem}
    ${prList}=       Create List    ${PR_ID}

    ${resPO}=        Create Purchase Order Via API    ${AUTH_TOKEN}    VND-1001    Apex Pharma Supplies Pvt Ltd    ${poItems}    ${prList}    ${QUO_ID}    shipping=500
    Should Be True    ${resPO.status_code} == 200 or ${resPO.status_code} == 201
    ${poId}=         Set Variable    ${resPO.json()}[purchaseOrder][purchaseOrderId]
    Set Suite Variable    ${PO_ID}    ${poId}
    Should Start With    ${PO_ID}    PO-

TC-PROC-004 PO Approval Transmission And Vendor Acknowledgement
    [Documentation]    Approves PO, transmits to vendor, and records vendor acceptance
    ${resApprovePO}=    Approve Purchase Order Via API    ${AUTH_TOKEN}    ${PO_ID}    PO Approved for dispatch
    Should Be Equal As Integers    ${resApprovePO.status_code}    200
    Should Be Equal As Strings     ${resApprovePO.json()}[purchaseOrder][status]    APPROVED

    # Send PO
    ${resSend}=      Send Purchase Order To Vendor Via API    ${AUTH_TOKEN}    ${PO_ID}
    Should Be Equal As Integers    ${resSend.status_code}    200
    Should Be Equal As Strings     ${resSend.json()}[purchaseOrder][status]    SENT_TO_VENDOR

    # Acknowledge PO
    ${resAck}=       Record Vendor Acknowledgement Via API    ${AUTH_TOKEN}    ${PO_ID}    ACCEPTED    Order accepted and placed in warehouse production queue    ERP-ROBOT-${RUN_ID}
    Should Be Equal As Integers    ${resAck.status_code}    200
    Should Be Equal As Strings     ${resAck.json()}[po][status]    ACKNOWLEDGED

TC-PROC-005 Delivery Tracking And Physical Receipt Linkage
    [Documentation]    Registers carrier shipment and confirms physical delivery arrival
    ${resDel}=       Register Delivery Via API    ${AUTH_TOKEN}    ${PO_ID}    CHALLAN-ROBOT-${RUN_ID}    BlueDart Healthcare Transport    BD-ROBOT-${RUN_ID}
    Should Be True    ${resDel.status_code} == 200 or ${resDel.status_code} == 201
    ${delId}=        Set Variable    ${resDel.json()}[delivery][deliveryId]
    Set Suite Variable    ${DEL_ID}    ${delId}
    Should Start With    ${DEL_ID}    DEL-

    # Mark as delivered
    ${resDelivered}=  Update Delivery Status Via API    ${AUTH_TOKEN}    ${DEL_ID}    DELIVERED
    Should Be Equal As Integers    ${resDelivered.status_code}    200
    Should Be Equal As Strings     ${resDelivered.json()}[delivery][status]    DELIVERED

TC-PROC-006 Three-Way Match Reconciliation And Finance Handoff
    [Documentation]    Creates matching invoice, executes automated 3-way match, and hands off to Finance
    # Step 1: Create Goods Receipt (Inventory Integration)
    ${grnItem}=      Create Dictionary
    ...    inventoryItemId=${ITEM_ID}
    ...    orderedQuantity=100
    ...    receivedQuantity=100
    ...    acceptedQuantity=100
    ...    rejectedQuantity=0
    ...    batchNumber=BAT-ROBOT-${RUN_ID}
    ...    expiryDate=2028-12-31T00:00:00.000Z
    ...    unitCost=320
    ...    locationId=LOC-MAIN-001
    ${grnItems}=     Create List    ${grnItem}

    ${resGRN}=       Create Goods Receipt Via API    ${AUTH_TOKEN}    ${PO_ID}    VND-1001    ${grnItems}
    Should Be True    ${resGRN.status_code} == 200 or ${resGRN.status_code} == 201
    ${grnId}=        Set Variable    ${resGRN.json()}[goodsReceipt][goodsReceiptId]
    Set Suite Variable    ${GRN_ID}    ${grnId}

    # Step 2: Register Matching Supplier Invoice
    ${invItem}=      Create Dictionary
    ...    inventoryItemId=${ITEM_ID}
    ...    description=Sterile Surgical Pack Robot ${RUN_ID}
    ...    quantity=100
    ...    unitPrice=320
    ...    tax=3840
    ${invItems}=     Create List    ${invItem}

    ${invNum}=       Set Variable    INV-ROBOT-MATCH-${RUN_ID}
    ${resInv}=       Register Supplier Invoice Via API    ${AUTH_TOKEN}    VND-1001    Apex Pharma Supplies Pvt Ltd    ${invNum}    ${PO_ID}    ${invItems}    goodsReceiptId=${GRN_ID}
    Should Be True    ${resInv.status_code} == 200 or ${resInv.status_code} == 201
    ${invId}=        Set Variable    ${resInv.json()}[invoice][supplierInvoiceId]
    Set Suite Variable    ${INV_ID}    ${invId}
    Should Be Equal As Strings     ${resInv.json()}[invoice][matchStatus]    MATCHED

    # Step 3: Approve match and hand off to Finance
    ${resHandoff}=   Approve Invoice And Handoff To Finance Via API    ${AUTH_TOKEN}    ${INV_ID}
    Should Be Equal As Integers    ${resHandoff.status_code}    200
    Should Be Equal As Strings     ${resHandoff.json()}[invoice][financeHandoffStatus]    SENT_TO_FINANCE

TC-PROC-007 Discrepancy Exception Handling For Price Mismatch
    [Documentation]    Detects price discrepancy on supplier invoice and ensures exception case creation
    ${mismatchItem}=  Create Dictionary
    ...    inventoryItemId=${ITEM_ID}
    ...    description=Sterile Surgical Pack Robot ${RUN_ID}
    ...    quantity=100
    ...    unitPrice=360
    ...    tax=4320
    ${mismatchItems}=  Create List    ${mismatchItem}

    ${mismatchInvNum}=  Set Variable    INV-ROBOT-MISMATCH-${RUN_ID}
    ${resMismatch}=     Register Supplier Invoice Via API    ${AUTH_TOKEN}    VND-1001    Apex Pharma Supplies Pvt Ltd    ${mismatchInvNum}    ${PO_ID}    ${mismatchItems}    goodsReceiptId=${GRN_ID}
    Should Be True    ${resMismatch.status_code} == 200 or ${resMismatch.status_code} == 201
    Should Be Equal As Strings     ${resMismatch.json()}[invoice][matchStatus]    PRICE_MISMATCH
    Should Be Equal As Strings     ${resMismatch.json()}[invoice][status]    MISMATCH

TC-PROC-008 Procurement Dashboard KPIs And Executive Analytics
    [Documentation]    Verifies real-time aggregation of procurement metrics and KPIs
    ${resStats}=     Get Procurement Dashboard Stats Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resStats.status_code}    200
    Should Be True    ${resStats.json()}[stats][openRequests] >= 1
    Should Be True    ${resStats.json()}[stats][totalSpend] > 0
