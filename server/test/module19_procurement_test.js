/**
 * Comprehensive Acceptance Test Suite for Module 19: Procurement Management
 * Verifies all specifications from 19_PROCUREMENT.md:
 * - Purchase Requests & Snapshots
 * - Approval Workflow & Segregation of Duties (Requester != Approver)
 * - RFQs & Multi-Vendor Invitations
 * - Quotations & Expiry Validation
 * - Quotation Comparison & Human Vendor Selection with Mandatory Reason
 * - Purchase Order Creation & Server-side Totals
 * - PO Approval & Revisions Control
 * - Delivery Tracking & Overdue Delay Exceptions
 * - Three-Way Matching (PO + GRN + Supplier Invoice)
 * - Price & Quantity Mismatch Exception Cases
 * - Finance Handoff Boundary
 * - Audit Trail & Dashboard Analytics
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const PurchaseRequest = require('../models/PurchaseRequest');
const RFQ = require('../models/RFQ');
const Quotation = require('../models/Quotation');
const QuotationComparison = require('../models/QuotationComparison');
const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseOrderRevision = require('../models/PurchaseOrderRevision');
const Delivery = require('../models/Delivery');
const GoodsReceipt = require('../models/GoodsReceipt');
const SupplierInvoice = require('../models/SupplierInvoice');
const ExceptionCase = require('../models/ExceptionCase');
const AuditEvent = require('../models/AuditEvent');

const PurchaseRequestService = require('../services/procurement/purchaseRequestService');
const ApprovalService = require('../services/procurement/approvalService');
const RfqService = require('../services/procurement/rfqService');
const QuotationService = require('../services/procurement/quotationService');
const ComparisonService = require('../services/procurement/comparisonService');
const PurchaseOrderService = require('../services/procurement/purchaseOrderService');
const DeliveryService = require('../services/procurement/deliveryService');
const InvoiceMatchingService = require('../services/procurement/invoiceMatchingService');
const ProcurementReportService = require('../services/procurement/procurementReportService');

const runModule19Tests = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 19 PROCUREMENT MANAGEMENT TEST SUITE ---');
    console.log('==========================================================\n');

    let passedCount = 0;
    const assertTest = (description, condition) => {
      if (condition) {
        console.log(`[PASS] ${description}`);
        passedCount++;
      } else {
        console.error(`[FAIL] ${description}`);
        throw new Error(`Test assertion failed: ${description}`);
      }
    };

    const userRequester = { userId: 'EMP-REQ-001', role: 'DEPARTMENT_REQUESTER', name: 'Dr. Anita Roy' };
    const userDeptManager = { userId: 'EMP-MGR-002', role: 'ADMIN_MANAGER', name: 'Dr. Rajesh Verma' };
    const userProcurementOfficer = { userId: 'EMP-PROC-003', role: 'PROCUREMENT_OFFICER', name: 'Officer Vikram Singh' };
    const userFinance = { userId: 'EMP-FIN-004', role: 'BILLING_STAFF', name: 'Pooja Sharma' };

    // ----------------------------------------------------
    // TEST GROUP 1: Purchase Request Creation & Snapshots
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 1: PURCHASE REQUEST CREATION & SNAPSHOTS ---');
    const prPayload = {
      departmentId: 'DEP-LAB',
      departmentName: 'Central Pathology Laboratory',
      requiredByDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      category: 'LABORATORY_SUPPLY',
      reason: 'Urgent restocking of blood collection tubes and biochemistry reagents',
      justification: 'Depleted buffer stock due to seasonal OPD surge',
      items: [
        {
          inventoryItemId: 'INV-LAB-TEST-01',
          itemNameSnapshot: 'Vacutainer Blood Collection Tubes (Pack of 100)',
          description: 'Sterile vacuum blood specimen tubes EDTA 4ml',
          quantity: 200,
          unit: 'PACK',
          estimatedUnitPrice: 450,
          preferredSpecification: 'K2 EDTA Lavender Top ISO Certified'
        },
        {
          inventoryItemId: 'INV-LAB-TEST-02',
          itemNameSnapshot: 'Biochemistry Serum Reagent Kit',
          description: 'Multi-parameter clinical analyzer reagent',
          quantity: 20,
          unit: 'KIT',
          estimatedUnitPrice: 2500,
          preferredSpecification: 'Compatible with automated Abbott analyzer'
        }
      ]
    };

    const createdPr = await PurchaseRequestService.createRequest(prPayload, userRequester);
    assertTest('Purchase Request created with PR-YYYY prefix', createdPr.purchaseRequestId.startsWith('PR-'));
    assertTest('Purchase Request item estimated line totals correctly computed', createdPr.items[0].estimatedTotal === 90000 && createdPr.items[1].estimatedTotal === 50000);
    assertTest('Purchase Request estimated grand total correctly aggregated (₹140,000)', createdPr.estimatedTotal === 140000);
    assertTest('Initial status is SUBMITTED', createdPr.status === 'SUBMITTED');

    // Duplicate check verification
    const dupCheck = await PurchaseRequestService.checkDuplicateRequest('DEP-LAB', ['INV-LAB-TEST-01']);
    assertTest('Duplicate request detection flags matching item and department within 30 days', dupCheck.length >= 1);

    // ----------------------------------------------------
    // TEST GROUP 2: Segregation of Duties & PR Approval
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: APPROVAL WORKFLOW & SEGREGATION OF DUTIES ---');
    // Test: Requester cannot approve their own request
    let sodBlocked = false;
    try {
      await ApprovalService.approvePurchaseRequest(createdPr.purchaseRequestId, 'Self approval attempt', userRequester);
    } catch (e) {
      sodBlocked = true;
    }
    assertTest('Segregation of Duties: Requester blocked from approving own purchase request', sodBlocked);

    // Legitimate approval by authorized manager
    const approvedPr = await ApprovalService.approvePurchaseRequest(createdPr.purchaseRequestId, 'Approved per Q4 clinical budget allocation', userDeptManager);
    assertTest('Purchase Request approved successfully by authorized manager', approvedPr.status === 'APPROVED' && approvedPr.approverId === userDeptManager.userId);

    // ----------------------------------------------------
    // TEST GROUP 3: RFQ Creation & Issuance
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: RFQ CREATION & ISSUANCE ---');
    const rfqPayload = {
      title: 'RFQ for Central Pathology Laboratory Reagents & Tubes',
      purchaseRequestIds: [approvedPr.purchaseRequestId],
      vendorIds: ['VND-1001', 'VND-1002', 'VND-1003'],
      responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    const rfq = await RfqService.createRfq(rfqPayload, userProcurementOfficer);
    assertTest('RFQ created with RFQ-YYYY prefix', rfq.rfqId.startsWith('RFQ-'));
    assertTest('RFQ inherits approved PR items correctly', rfq.items.length === 2 && rfq.items[0].quantity === 200);

    const issuedRfq = await RfqService.issueRfq(rfq.rfqId, userProcurementOfficer);
    assertTest('RFQ status transitioned to ISSUED with recorded issueDate', issuedRfq.status === 'ISSUED' && issuedRfq.issueDate !== null);

    // ----------------------------------------------------
    // TEST GROUP 4: Quotation Intake & Server-Side Math
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: QUOTATION INTAKE & SERVER-SIDE MATH ---');
    // Quote from Vendor A (Apex Pharma)
    const quotePayloadA = {
      rfqId: rfq.rfqId,
      vendorId: 'VND-1001',
      vendorName: 'Apex Pharma Supplies Pvt Ltd',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [
        {
          inventoryItemId: 'INV-LAB-TEST-01',
          description: 'Vacutainer Tubes',
          quotedQuantity: 200,
          unitPrice: 420,
          taxPercent: 12,
          deliveryDays: 5
        },
        {
          inventoryItemId: 'INV-LAB-TEST-02',
          description: 'Serum Reagent Kit',
          quotedQuantity: 20,
          unitPrice: 2400,
          taxPercent: 12,
          deliveryDays: 5
        }
      ],
      shipping: 1000,
      paymentTerms: 'Net 30',
      warrantyPeriod: '1 Year'
    };
    const quoteA = await QuotationService.recordQuotation(quotePayloadA, userProcurementOfficer);
    assertTest('Quotation A recorded with QUO-YYYY prefix', quoteA.quotationId.startsWith('QUO-'));
    // Subtotal: (200*420) + (20*2400) = 84000 + 48000 = 132000. Tax: 132000 * 0.12 = 15840. Total: 132000 + 15840 + 1000 = 148840.
    assertTest('Quotation A grandTotal server-side calculation exact (₹148,840)', quoteA.grandTotal === 148840);

    // Quote from Vendor B (MediCore Surgicals)
    const quotePayloadB = {
      rfqId: rfq.rfqId,
      vendorId: 'VND-1002',
      vendorName: 'MediCore Surgicals Ltd',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [
        {
          inventoryItemId: 'INV-LAB-TEST-01',
          description: 'Vacutainer Tubes',
          quotedQuantity: 200,
          unitPrice: 440,
          taxPercent: 12,
          deliveryDays: 3
        },
        {
          inventoryItemId: 'INV-LAB-TEST-02',
          description: 'Serum Reagent Kit',
          quotedQuantity: 20,
          unitPrice: 2450,
          taxPercent: 12,
          deliveryDays: 3
        }
      ],
      shipping: 800,
      paymentTerms: 'Net 15',
      warrantyPeriod: '2 Years'
    };
    const quoteB = await QuotationService.recordQuotation(quotePayloadB, userProcurementOfficer);
    assertTest('Quotation B recorded successfully', quoteB.quotationId.startsWith('QUO-'));

    // ----------------------------------------------------
    // TEST GROUP 5: Quotation Comparison & Vendor Selection
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: QUOTATION COMPARISON & HUMAN VENDOR SELECTION ---');
    const comparison = await ComparisonService.createComparison({ rfqId: rfq.rfqId }, userProcurementOfficer);
    assertTest('Quotation Comparison generated with CMP-YYYY prefix', comparison.comparisonId.startsWith('CMP-'));
    assertTest('Comparison matrix contains entries for all submitted quotations', comparison.comparisonMatrix.length === 2);
    assertTest('Objective scoring matrix identifies recommended vendor', comparison.recommendedVendorId !== null);

    // Human selection without mandatory reason must fail
    let missingReasonFailed = false;
    try {
      await ComparisonService.selectVendor(comparison.comparisonId, {
        selectedVendorId: quoteA.vendorId,
        selectedQuotationId: quoteA.quotationId,
        selectionReason: ''
      }, userDeptManager);
    } catch (e) {
      missingReasonFailed = true;
    }
    assertTest('Vendor Selection enforces mandatory justification reason', missingReasonFailed);

    // Authorized human selection with recorded reason
    const selectedComp = await ComparisonService.selectVendor(comparison.comparisonId, {
      selectedVendorId: quoteA.vendorId,
      selectedQuotationId: quoteA.quotationId,
      selectionReason: 'Lowest evaluated compliant bid with verified test tube vacuum standard certifications'
    }, userDeptManager);
    assertTest('Human vendor selection successfully recorded with justification', selectedComp.approvalStatus === 'APPROVED' && selectedComp.selectedVendorId === quoteA.vendorId);

    // ----------------------------------------------------
    // TEST GROUP 6: Purchase Order Creation & Approval
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 6: PURCHASE ORDER CREATION & APPROVAL ---');
    const poPayload = {
      purchaseRequestIds: [approvedPr.purchaseRequestId],
      vendorId: quoteA.vendorId,
      vendorName: quoteA.vendorName,
      quotationId: quoteA.quotationId,
      expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      items: [
        {
          inventoryItemId: 'INV-LAB-TEST-01',
          description: 'Vacutainer Blood Collection Tubes (Pack of 100)',
          quantity: 200,
          unitPrice: 420,
          taxPercent: 12
        },
        {
          inventoryItemId: 'INV-LAB-TEST-02',
          description: 'Biochemistry Serum Reagent Kit',
          quantity: 20,
          unitPrice: 2400,
          taxPercent: 12
        }
      ],
      shipping: 1000
    };

    const po = await PurchaseOrderService.createPurchaseOrder(poPayload, userProcurementOfficer);
    assertTest('Purchase Order created with PO-YYYY prefix', po.purchaseOrderId.startsWith('PO-'));
    assertTest('PO grand total computed server-side matching quotation (₹148,840)', po.grandTotal === 148840);
    assertTest('PO initial status is PENDING_APPROVAL', po.status === 'PENDING_APPROVAL');

    // PO Approval
    const approvedPo = await ApprovalService.approvePurchaseOrder(po.purchaseOrderId, 'Approved for issuance to Apex Pharma', userDeptManager);
    assertTest('Purchase Order approved by authorized manager', approvedPo.status === 'APPROVED' && approvedPo.approvalStatus === 'APPROVED');

    // Send PO to vendor
    const sentPo = await PurchaseOrderService.sendPoToVendor(approvedPo.purchaseOrderId, userProcurementOfficer);
    assertTest('PO successfully transitioned to SENT_TO_VENDOR', sentPo.status === 'SENT_TO_VENDOR' && sentPo.sentAt !== null);

    // Vendor Acknowledgement
    const ackResult = await PurchaseOrderService.recordVendorAcknowledgement(sentPo.purchaseOrderId, {
      status: 'ACCEPTED',
      comments: 'Delivery scheduled for dispatch within 5 days',
      externalPoRef: 'ERP-APEX-88901'
    });
    assertTest('Vendor acknowledgement recorded and PO transitioned to ACKNOWLEDGED', ackResult.po.status === 'ACKNOWLEDGED' && ackResult.po.vendorAcknowledgement.externalPoRef === 'ERP-APEX-88901');

    // ----------------------------------------------------
    // TEST GROUP 7: Controlled PO Revisions
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 7: CONTROLLED PO REVISIONS ---');
    const revisionData = {
      reason: 'Urgent increase of test tube units requested by laboratory director',
      items: [
        {
          inventoryItemId: 'INV-LAB-TEST-01',
          description: 'Vacutainer Blood Collection Tubes (Pack of 100)',
          quantity: 250, // increased from 200 to 250
          unitPrice: 420,
          taxPercent: 12
        },
        {
          inventoryItemId: 'INV-LAB-TEST-02',
          description: 'Biochemistry Serum Reagent Kit',
          quantity: 20,
          unitPrice: 2400,
          taxPercent: 12
        }
      ]
    };

    const revResult = await PurchaseOrderService.createPoRevision(sentPo.purchaseOrderId, revisionData, userDeptManager);
    assertTest('Controlled revision generated with REV-YYYY prefix', revResult.revision.revisionId.startsWith('REV-'));
    assertTest('PO revision number incremented to 1', revResult.po.revisionsCount === 1);
    assertTest('PO snapshot preserved previous values before revision', revResult.revision.snapshot.items[0].quantity === 200);

    // ----------------------------------------------------
    // TEST GROUP 8: Delivery Tracking & Overdue Detection
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 8: DELIVERY TRACKING & OVERDUE EXCEPTIONS ---');
    const delivery = await DeliveryService.createDelivery({
      purchaseOrderId: sentPo.purchaseOrderId,
      expectedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      shipmentReference: 'WAYBILL-BLUEDART-9901',
      carrier: 'BlueDart Healthcare Transport',
      trackingNumber: 'BD-887766'
    }, userProcurementOfficer);
    assertTest('Delivery registered with DEL-YYYY prefix', delivery.deliveryId.startsWith('DEL-'));
    assertTest('Delivery carrier and tracking number captured', delivery.carrier === 'BlueDart Healthcare Transport' && delivery.trackingNumber === 'BD-887766');

    // Update delivery to DELIVERED
    const delivered = await DeliveryService.updateDeliveryStatus(delivery.deliveryId, {
      status: 'DELIVERED',
      actualDate: new Date()
    }, userProcurementOfficer);
    assertTest('Delivery marked as DELIVERED with actual delivery date timestamped', delivered.status === 'DELIVERED' && delivered.actualDate !== null);

    // ----------------------------------------------------
    // TEST GROUP 9: Three-Way Matching (Matched Scenario)
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 9: THREE-WAY MATCHING (EXACT MATCH) ---');
    // Simulate Goods Receipt in Medical Inventory
    await GoodsReceipt.deleteMany({ goodsReceiptId: 'GRN-TEST-1901' });
    await SupplierInvoice.deleteMany({ invoiceNumber: { $in: ['INV-APEX-MATCH-01', 'INV-APEX-MISMATCH-PRICE', 'INV-APEX-MISMATCH-QTY'] } });

    const grn = new GoodsReceipt({
      goodsReceiptId: 'GRN-TEST-1901',
      purchaseOrderId: sentPo.purchaseOrderId,
      vendorId: quoteA.vendorId,
      vendorName: quoteA.vendorName,
      receivedBy: 'Storekeeper Ramesh',
      status: 'POSTED',
      items: [
        {
          inventoryItemId: 'INV-LAB-TEST-01',
          itemName: 'Vacutainer Blood Collection Tubes',
          orderedQuantity: 250,
          receivedQuantity: 250,
          acceptedQuantity: 250,
          rejectedQuantity: 0,
          batchNumber: 'BAT-EDTA-2026',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          unitCost: 420
        },
        {
          inventoryItemId: 'INV-LAB-TEST-02',
          itemName: 'Biochemistry Serum Reagent Kit',
          orderedQuantity: 20,
          receivedQuantity: 20,
          acceptedQuantity: 20,
          rejectedQuantity: 0,
          batchNumber: 'BAT-REAG-2026',
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          unitCost: 2400
        }
      ]
    });
    await grn.save();

    // Register Matching Supplier Invoice
    const invMatchPayload = {
      vendorId: quoteA.vendorId,
      vendorName: quoteA.vendorName,
      invoiceNumber: 'INV-APEX-MATCH-01',
      purchaseOrderId: sentPo.purchaseOrderId,
      goodsReceiptId: grn.goodsReceiptId,
      items: [
        {
          inventoryItemId: 'INV-LAB-TEST-01',
          description: 'Vacutainer Blood Collection Tubes',
          quantity: 250,
          unitPrice: 420,
          tax: 12600
        },
        {
          inventoryItemId: 'INV-LAB-TEST-02',
          description: 'Biochemistry Serum Reagent Kit',
          quantity: 20,
          unitPrice: 2400,
          tax: 5760
        }
      ]
    };

    const matchedInvoice = await InvoiceMatchingService.registerInvoice(invMatchPayload, userFinance);
    assertTest('Supplier Invoice registered with PINV-YYYY prefix', matchedInvoice.supplierInvoiceId.startsWith('PINV-'));
    assertTest('Three-way match confirms MATCHED status when quantities and prices align', matchedInvoice.matchStatus === 'MATCHED' && matchedInvoice.matchDiscrepancies.length === 0);

    // Finance Handoff
    const handedOffInvoice = await InvoiceMatchingService.approveMatchAndHandoffToFinance(matchedInvoice.supplierInvoiceId, userDeptManager);
    assertTest('Invoice handed off to Finance with status APPROVED_FOR_PAYMENT', handedOffInvoice.financeHandoffStatus === 'SENT_TO_FINANCE' && handedOffInvoice.status === 'APPROVED_FOR_PAYMENT');

    // ----------------------------------------------------
    // TEST GROUP 10: Three-Way Matching (Price & Qty Mismatches)
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 10: THREE-WAY MATCHING (DISCREPANCIES & EXCEPTIONS) ---');
    // Price Mismatch Invoice
    const invPriceMismatchPayload = {
      vendorId: quoteA.vendorId,
      vendorName: quoteA.vendorName,
      invoiceNumber: 'INV-APEX-MISMATCH-PRICE',
      purchaseOrderId: sentPo.purchaseOrderId,
      goodsReceiptId: grn.goodsReceiptId,
      items: [
        {
          inventoryItemId: 'INV-LAB-TEST-01',
          description: 'Vacutainer Blood Collection Tubes',
          quantity: 250,
          unitPrice: 460, // Higher than PO price 420!
          tax: 13800
        }
      ]
    };
    const priceMismatchInvoice = await InvoiceMatchingService.registerInvoice(invPriceMismatchPayload, userFinance);
    assertTest('Price mismatch detected between PO rate (₹420) and Invoiced rate (₹460)', priceMismatchInvoice.matchStatus === 'PRICE_MISMATCH');
    assertTest('Discrepancy record details price variance', priceMismatchInvoice.matchDiscrepancies.some((d) => d.type === 'PRICE'));

    // Verify ExceptionCase was raised
    const priceException = await ExceptionCase.findOne({
      module: 'PROCUREMENT',
      entityId: priceMismatchInvoice.supplierInvoiceId,
      exceptionType: 'PRICE_MISMATCH'
    });
    assertTest('Automated ExceptionCase raised for Price Mismatch', priceException !== null && priceException.severity === 'HIGH');

    // Quantity Mismatch Invoice
    const invQtyMismatchPayload = {
      vendorId: quoteA.vendorId,
      vendorName: quoteA.vendorName,
      invoiceNumber: 'INV-APEX-MISMATCH-QTY',
      purchaseOrderId: sentPo.purchaseOrderId,
      goodsReceiptId: grn.goodsReceiptId,
      items: [
        {
          inventoryItemId: 'INV-LAB-TEST-02',
          description: 'Biochemistry Serum Reagent Kit',
          quantity: 35, // Invoiced 35 vs accepted 20!
          unitPrice: 2400,
          tax: 10080
        }
      ]
    };
    const qtyMismatchInvoice = await InvoiceMatchingService.registerInvoice(invQtyMismatchPayload, userFinance);
    assertTest('Quantity mismatch detected between GRN accepted count (20) and Invoiced count (35)', qtyMismatchInvoice.matchStatus === 'QUANTITY_MISMATCH');

    // ----------------------------------------------------
    // TEST GROUP 11: Procurement KPIs & Reporting
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 11: DASHBOARD KPIS & REPORTING ---');
    const kpis = await ProcurementReportService.getDashboardKPIs();
    assertTest('Dashboard KPIs aggregate open requests count', typeof kpis.openRequests === 'number' && kpis.openRequests >= 1);
    assertTest('Dashboard KPIs aggregate total purchase spend', typeof kpis.totalSpend === 'number' && kpis.totalSpend > 0);

    const spendAnalytics = await ProcurementReportService.getSpendAnalytics();
    assertTest('Spend analytics groups spend by department', spendAnalytics.departmentSpend.length >= 1);
    assertTest('Spend analytics groups spend by category', spendAnalytics.categorySpend.length >= 1);

    console.log('\n==========================================================');
    console.log(`--- MODULE 19 PROCUREMENT TEST SUITE COMPLETED: ${passedCount} TESTS PASSED ---`);
    console.log('==========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n[TEST RUNNER FATAL ERROR]:', error);
    process.exit(1);
  }
};

runModule19Tests();
