const mongoose = require('mongoose');
const PurchaseRequest = require('../models/PurchaseRequest');
const RFQ = require('../models/RFQ');
const Quotation = require('../models/Quotation');
const QuotationComparison = require('../models/QuotationComparison');
const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseOrderRevision = require('../models/PurchaseOrderRevision');
const Delivery = require('../models/Delivery');
const SupplierInvoice = require('../models/SupplierInvoice');
const VendorChangeRequest = require('../models/VendorChangeRequest');
const ExceptionCase = require('../models/ExceptionCase');

const seedModule19Procurement = async () => {
  console.log('[Seed Module 19]: Initiating Procurement Management Seeding...');

  await Promise.all([
    PurchaseRequest.deleteMany({}),
    RFQ.deleteMany({}),
    Quotation.deleteMany({}),
    QuotationComparison.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    PurchaseOrderRevision.deleteMany({}),
    Delivery.deleteMany({}),
    SupplierInvoice.deleteMany({}),
    VendorChangeRequest.deleteMany({}),
    ExceptionCase.deleteMany({ module: 'PROCUREMENT' })
  ]);

  const vendors = [
    { id: 'VND-1001', name: 'Apex Pharma Supplies Pvt Ltd', email: 'sales@apexpharma.in', phone: '+91-9876543210' },
    { id: 'VND-1002', name: 'MediCore Surgicals Ltd', email: 'orders@medicoresurg.com', phone: '+91-9876543211' },
    { id: 'VND-1003', name: 'BioLab Diagnostics India', email: 'support@biolabindia.com', phone: '+91-9876543212' },
    { id: 'VND-1004', name: 'RadTech Imaging Equipment', email: 'info@radtechimaging.com', phone: '+91-9876543213' },
    { id: 'VND-1005', name: 'CleanCare Hospital Logistics', email: 'care@cleancarelogistics.com', phone: '+91-9876543214' }
  ];

  const departments = [
    { id: 'DEP-EMERGENCY', name: 'Emergency & Trauma' },
    { id: 'DEP-ICU', name: 'Intensive Care Unit (ICU)' },
    { id: 'DEP-SURGERY', name: 'Operation Theatre & Surgery' },
    { id: 'DEP-LAB', name: 'Central Laboratory & Pathology' },
    { id: 'DEP-RADIOLOGY', name: 'Radiology & Imaging' },
    { id: 'DEP-PHARMACY', name: 'Central Hospital Pharmacy' },
    { id: 'DEP-GENERAL', name: 'General Medicine & Inpatient' }
  ];

  const categories = [
    'MEDICINE',
    'MEDICAL_CONSUMABLE',
    'SURGICAL_SUPPLY',
    'LABORATORY_SUPPLY',
    'RADIOLOGY_SUPPLY',
    'PPE',
    'EQUIPMENT',
    'MAINTENANCE_MATERIAL',
    'HOUSEKEEPING_MATERIAL',
    'GENERAL_SUPPLIES'
  ];

  // 1. Generate 30 Purchase Requests
  console.log('[Seed Module 19]: Creating 30 Purchase Requests...');
  const prDocs = [];
  const prStatuses = [
    'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_APPROVAL', 'APPROVED',
    'APPROVED', 'APPROVED', 'REJECTED', 'RETURNED_FOR_CORRECTION', 'RFQ_IN_PROGRESS',
    'RFQ_IN_PROGRESS', 'PO_CREATED', 'PO_CREATED', 'PO_CREATED', 'ORDERED',
    'ORDERED', 'ORDERED', 'FULFILLED', 'FULFILLED', 'CLOSED'
  ];

  for (let i = 1; i <= 30; i++) {
    const prId = `PR-2026-${String(i).padStart(5, '0')}`;
    const dept = departments[(i - 1) % departments.length];
    const cat = categories[(i - 1) % categories.length];
    const status = prStatuses[(i - 1) % prStatuses.length];
    const priority = i % 7 === 0 ? 'URGENT' : (i % 4 === 0 ? 'HIGH' : (i % 2 === 0 ? 'NORMAL' : 'LOW'));

    const items = [
      {
        requestItemId: `PR-ITEM-${i}-1`,
        inventoryItemId: `INV-${cat.substring(0, 3)}-${100 + i}`,
        itemNameSnapshot: `${cat.replace(/_/g, ' ')} Standard Pack #${i}`,
        description: `High-grade hospital specification ${cat.toLowerCase().replace(/_/g, ' ')} for clinical operations.`,
        quantity: 50 + (i * 10),
        unit: i % 3 === 0 ? 'BOX' : (i % 2 === 0 ? 'PACK' : 'UNIT'),
        estimatedUnitPrice: 120 + (i * 15),
        estimatedTotal: (50 + (i * 10)) * (120 + (i * 15)),
        preferredSpecification: 'ISO-13485 / CE Certified Medical Grade',
        requiredByDate: new Date(Date.now() + (10 + (i * 2)) * 24 * 60 * 60 * 1000)
      }
    ];

    if (i % 3 === 0) {
      items.push({
        requestItemId: `PR-ITEM-${i}-2`,
        inventoryItemId: `INV-${cat.substring(0, 3)}-${200 + i}`,
        itemNameSnapshot: `${cat.replace(/_/g, ' ')} Consumable Batch #${i}`,
        description: `Supplementary auxiliary consumable accessories.`,
        quantity: 20 + i,
        unit: 'PIECE',
        estimatedUnitPrice: 250,
        estimatedTotal: (20 + i) * 250,
        preferredSpecification: 'Latex free / Hypoallergenic',
        requiredByDate: new Date(Date.now() + (12 + (i * 2)) * 24 * 60 * 60 * 1000)
      });
    }

    const estimatedTotal = items.reduce((acc, curr) => acc + curr.estimatedTotal, 0);

    prDocs.push({
      purchaseRequestId: prId,
      requesterId: `EMP-${1000 + (i % 10)}`,
      requesterName: `Staff Requester ${(i % 10) + 1}`,
      departmentId: dept.id,
      departmentName: dept.name,
      requestDate: new Date(Date.now() - (35 - i) * 24 * 60 * 60 * 1000),
      requiredByDate: new Date(Date.now() + (15 + i) * 24 * 60 * 60 * 1000),
      priority,
      category: cat,
      items,
      reason: `Restocking and department supply replenishment for ${dept.name}`,
      justification: `Current buffer inventory dropped below safety threshold for upcoming quarter operations.`,
      status,
      estimatedTotal,
      approverId: ['APPROVED', 'PO_CREATED', 'ORDERED', 'FULFILLED', 'CLOSED'].includes(status) ? 'USR-MGR-01' : null,
      approverName: ['APPROVED', 'PO_CREATED', 'ORDERED', 'FULFILLED', 'CLOSED'].includes(status) ? 'Dr. Sarah Jenkins (Procurement Head)' : null,
      approvedAt: ['APPROVED', 'PO_CREATED', 'ORDERED', 'FULFILLED', 'CLOSED'].includes(status) ? new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000) : null,
      rejectionReason: status === 'REJECTED' ? 'Budget ceiling exceeded for current month. Please re-apply next cycle.' : '',
      rejectedBy: status === 'REJECTED' ? 'USR-MGR-01' : null,
      rejectedAt: status === 'REJECTED' ? new Date() : null,
      correctionReason: status === 'RETURNED_FOR_CORRECTION' ? 'Please provide detailed technical specifications and quantity breakdown.' : '',
      returnedBy: status === 'RETURNED_FOR_CORRECTION' ? 'USR-MGR-01' : null,
      returnedAt: status === 'RETURNED_FOR_CORRECTION' ? new Date() : null,
      timeline: [
        {
          status: 'DRAFT',
          actorId: `EMP-${1000 + (i % 10)}`,
          actorName: `Staff Requester ${(i % 10) + 1}`,
          role: 'REQUESTER',
          note: 'Request initialized',
          timestamp: new Date(Date.now() - (35 - i) * 24 * 60 * 60 * 1000)
        },
        {
          status: status,
          actorId: 'USR-MGR-01',
          actorName: 'Dr. Sarah Jenkins',
          role: 'PROCUREMENT_MANAGER',
          note: `Transitioned status to ${status}`,
          timestamp: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000)
        }
      ]
    });
  }
  await PurchaseRequest.insertMany(prDocs);

  // 2. Generate 15 RFQs
  console.log('[Seed Module 19]: Creating 15 RFQs...');
  const rfqDocs = [];
  const rfqStatuses = ['DRAFT', 'ISSUED', 'PARTIALLY_RESPONDED', 'RESPONDED', 'RESPONDED', 'CLOSED', 'CLOSED'];
  for (let i = 1; i <= 15; i++) {
    const rfqId = `RFQ-2026-${String(i).padStart(5, '0')}`;
    const linkedPr = prDocs[i % prDocs.length];
    const invitedVendors = [vendors[0].id, vendors[1].id, vendors[2].id];
    if (i % 2 === 0) invitedVendors.push(vendors[3].id);
    if (i % 3 === 0) invitedVendors.push(vendors[4].id);

    rfqDocs.push({
      rfqId,
      title: `RFQ for ${linkedPr.category.replace(/_/g, ' ')} Requirements - Batch ${i}`,
      purchaseRequestIds: [linkedPr.purchaseRequestId],
      vendorIds: invitedVendors,
      items: linkedPr.items.map((it, idx) => ({
        rfqItemId: `RFQ-ITEM-${i}-${idx + 1}`,
        inventoryItemId: it.inventoryItemId,
        description: it.itemNameSnapshot,
        quantity: it.quantity,
        unit: it.unit,
        specification: it.preferredSpecification,
        requiredDeliveryDate: it.requiredByDate
      })),
      issueDate: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000),
      responseDeadline: new Date(Date.now() + (10 + i) * 24 * 60 * 60 * 1000),
      status: rfqStatuses[i % rfqStatuses.length],
      termsAndConditions: 'Standard 30-day payment terms, warranty required, delivery to Central Stores Bay 2.',
      notes: 'All quotes must include GST and freight charges.',
      createdBy: 'USR-OFFICER-01',
      issuedBy: 'USR-OFFICER-01'
    });
  }
  await RFQ.insertMany(rfqDocs);

  // 3. Generate 40 Quotations
  console.log('[Seed Module 19]: Creating 40 Quotations...');
  const quoteDocs = [];
  let quoteCounter = 1;
  for (let i = 1; i <= 15; i++) {
    const rfq = rfqDocs[i - 1];
    const vendorsForRfq = rfq.vendorIds.slice(0, 3);

    vendorsForRfq.forEach((vId, vIdx) => {
      const vendorObj = vendors.find((v) => v.id === vId) || vendors[0];
      const qId = `QUO-2026-${String(quoteCounter++).padStart(5, '0')}`;

      // Price varies slightly per vendor (vendor 0 cheaper, vendor 1 faster, vendor 2 higher warranty)
      const priceMultiplier = 0.95 + (vIdx * 0.08);
      const deliveryDays = 5 + (vIdx * 3);

      let subtotal = 0;
      let taxTotal = 0;
      const items = rfq.items.map((it, itIdx) => {
        const unitPrice = Math.round((120 + (i * 10)) * priceMultiplier);
        const lineTax = Math.round(unitPrice * it.quantity * 0.12);
        const lineTotal = (unitPrice * it.quantity) + lineTax;
        subtotal += unitPrice * it.quantity;
        taxTotal += lineTax;

        return {
          quotationItemId: `QUO-ITEM-${qId}-${itIdx + 1}`,
          inventoryItemId: it.inventoryItemId,
          description: it.description,
          quotedQuantity: it.quantity,
          unitPrice,
          taxPercent: 12,
          tax: lineTax,
          discount: 0,
          lineTotal,
          deliveryDays,
          brand: `${vendorObj.name.split(' ')[0]} Brand`,
          manufacturer: `${vendorObj.name}`,
          specification: it.specification,
          compliance: true
        };
      });

      const grandTotal = subtotal + taxTotal;
      const validUntil = new Date(Date.now() + (25 - vIdx * 5) * 24 * 60 * 60 * 1000);
      const status = quoteCounter % 8 === 0 ? 'EXPIRED' : (vIdx === 0 ? 'ACCEPTED' : (vIdx === 1 ? 'SHORTLISTED' : 'RECEIVED'));

      quoteDocs.push({
        quotationId: qId,
        rfqId: rfq.rfqId,
        vendorId: vendorObj.id,
        vendorName: vendorObj.name,
        vendorContactEmail: vendorObj.email,
        vendorContactPhone: vendorObj.phone,
        quotationReference: `REF-${vendorObj.id.replace('VND-', '')}-${i * 10 + vIdx}`,
        quotationDate: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000),
        validUntil,
        items,
        subtotal,
        tax: taxTotal,
        discount: 0,
        shipping: 500,
        otherCharges: 0,
        grandTotal: grandTotal + 500,
        paymentTerms: vIdx === 1 ? 'Net 15' : 'Net 30',
        deliveryTerms: 'FOB Destination',
        warrantyPeriod: vIdx === 2 ? '2 Years' : '1 Year',
        documents: [{ docName: `Quotation_${vendorObj.id}.pdf`, fileUrl: `/docs/quotes/${qId}.pdf` }],
        status,
        notes: `Competitive bid submitted for ${rfq.title}`
      });
    });
  }
  await Quotation.insertMany(quoteDocs);

  // 4. Generate 10 Quotation Comparisons
  console.log('[Seed Module 19]: Creating 10 Quotation Comparisons...');
  const compDocs = [];
  for (let i = 1; i <= 10; i++) {
    const compId = `CMP-2026-${String(i).padStart(5, '0')}`;
    const rfq = rfqDocs[i - 1];
    const relatedQuotes = quoteDocs.filter((q) => q.rfqId === rfq.rfqId);

    const matrix = relatedQuotes.map((q, idx) => ({
      vendorId: q.vendorId,
      vendorName: q.vendorName,
      quotationId: q.quotationId,
      grandTotal: q.grandTotal,
      deliveryDays: 5 + (idx * 2),
      warrantyPeriod: q.warrantyPeriod,
      paymentTerms: q.paymentTerms,
      complianceScore: 100,
      priceScore: 95 - (idx * 10),
      deliveryScore: 90 - (idx * 8),
      overallScore: 92 - (idx * 9),
      isCompliant: true,
      notes: 'Compliant with all clinical and hospital specs'
    }));

    const winningQuote = relatedQuotes[0] || quoteDocs[0];

    compDocs.push({
      comparisonId: compId,
      rfqId: rfq.rfqId,
      title: `Comparative Matrix - ${rfq.title}`,
      purchaseRequestIds: rfq.purchaseRequestIds,
      quotationIds: relatedQuotes.map((q) => q.quotationId),
      comparisonMatrix: matrix,
      recommendedVendorId: winningQuote.vendorId,
      recommendedQuotationId: winningQuote.quotationId,
      recommendationReason: 'Lowest compliant bid with fastest delivery timeline.',
      selectedVendorId: winningQuote.vendorId,
      selectedQuotationId: winningQuote.quotationId,
      selectionReason: 'Lowest compliant quotation with proven past delivery performance and verified quality certifications.',
      selectedBy: 'USR-MGR-01',
      selectedAt: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
      approvalStatus: 'APPROVED',
      approvedBy: 'USR-MGR-01',
      approvedAt: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
      notes: 'Approved by procurement committee'
    });
  }
  await QuotationComparison.insertMany(compDocs);

  // 5. Generate 20 Purchase Orders
  console.log('[Seed Module 19]: Creating 20 Purchase Orders...');
  const poDocs = [];
  const poStatuses = [
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'APPROVED', 'SENT_TO_VENDOR',
    'ACKNOWLEDGED', 'ACKNOWLEDGED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'DELIVERED',
    'PARTIALLY_RECEIVED', 'RECEIVED', 'RECEIVED', 'CLOSED', 'CLOSED',
    'SENT_TO_VENDOR', 'ACKNOWLEDGED', 'DELIVERED', 'RECEIVED', 'CANCELLED'
  ];

  for (let i = 1; i <= 20; i++) {
    const poId = `PO-2026-${String(i).padStart(5, '0')}`;
    const vendor = vendors[(i - 1) % vendors.length];
    const status = poStatuses[i - 1];
    const qty = 50 + (i * 10);
    const unitPrice = 150 + (i * 10);
    const subtotal = qty * unitPrice;
    const tax = Math.round(subtotal * 0.12);
    const grandTotal = subtotal + tax;

    poDocs.push({
      purchaseOrderId: poId,
      purchaseRequestIds: [`PR-2026-${String(i).padStart(5, '0')}`],
      vendorId: vendor.id,
      vendorName: vendor.name,
      quotationId: `QUO-2026-${String(i).padStart(5, '0')}`,
      orderDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
      expectedDeliveryDate: new Date(Date.now() + (5 + i) * 24 * 60 * 60 * 1000),
      currency: 'INR',
      items: [
        {
          poItemId: `PO-ITEM-${i}-1`,
          inventoryItemId: `INV-MED-${100 + i}`,
          description: `Hospital Certified Clinical Supplies Batch ${i}`,
          quantity: qty,
          unit: 'PACK',
          unitPrice,
          taxPercent: 12,
          tax,
          discount: 0,
          lineTotal: grandTotal,
          requiredByDate: new Date(Date.now() + (5 + i) * 24 * 60 * 60 * 1000),
          specification: 'Medical Grade ISO Certified',
          deliveredQuantity: ['PARTIALLY_DELIVERED', 'DELIVERED', 'RECEIVED', 'CLOSED'].includes(status) ? (status === 'PARTIALLY_DELIVERED' ? Math.round(qty * 0.6) : qty) : 0,
          receivedQuantity: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'].includes(status) ? (status === 'PARTIALLY_RECEIVED' ? Math.round(qty * 0.5) : qty) : 0
        }
      ],
      subtotal,
      tax,
      discount: 0,
      shipping: 500,
      grandTotal: grandTotal + 500,
      paymentTerms: 'Net 30',
      deliveryTerms: 'FOB Destination',
      billingAddress: 'Apex Care Hospital, Finance Division, Building A',
      shippingAddress: 'Apex Care Hospital, Central Stores / Receiving Bay 2',
      status,
      approvalStatus: ['DRAFT', 'PENDING_APPROVAL'].includes(status) ? 'PENDING' : 'APPROVED',
      approvedBy: ['DRAFT', 'PENDING_APPROVAL'].includes(status) ? null : 'USR-MGR-01',
      approvedByName: ['DRAFT', 'PENDING_APPROVAL'].includes(status) ? null : 'Dr. Sarah Jenkins',
      approvedAt: ['DRAFT', 'PENDING_APPROVAL'].includes(status) ? null : new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000),
      vendorAcknowledgement: {
        status: ['ACKNOWLEDGED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'RECEIVED', 'CLOSED'].includes(status) ? 'ACCEPTED' : 'PENDING',
        acknowledgedAt: ['ACKNOWLEDGED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'RECEIVED', 'CLOSED'].includes(status) ? new Date(Date.now() - (18 - i) * 24 * 60 * 60 * 1000) : null,
        comments: 'Order acknowledged and added to dispatch schedule.',
        externalPoRef: `ERP-PO-${10000 + i}`
      },
      revisionsCount: i % 5 === 0 ? 1 : 0,
      currentRevisionId: i % 5 === 0 ? `REV-2026-${String(i).padStart(5, '0')}` : null,
      externalReference: `SAP-PO-${20000 + i}`,
      createdBy: 'USR-OFFICER-01',
      sentAt: new Date(Date.now() - (22 - i) * 24 * 60 * 60 * 1000),
      notes: `Standard PO issued for monthly hospital restocking`
    });
  }
  await PurchaseOrder.insertMany(poDocs);

  // 6. Generate 15 Deliveries
  console.log('[Seed Module 19]: Creating 15 Deliveries...');
  const delDocs = [];
  const delStatuses = [
    'EXPECTED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'PARTIALLY_DELIVERED',
    'DELAYED', 'DELAYED', 'DELIVERED', 'DELIVERED', 'IN_TRANSIT',
    'DELIVERED', 'DELIVERED', 'SHIPPED', 'EXPECTED', 'DELIVERED'
  ];

  for (let i = 1; i <= 15; i++) {
    const delId = `DEL-2026-${String(i).padStart(5, '0')}`;
    const po = poDocs[i - 1];
    const status = delStatuses[i - 1];
    const isDelayed = status === 'DELAYED';

    delDocs.push({
      deliveryId: delId,
      purchaseOrderId: po.purchaseOrderId,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      expectedDate: isDelayed ? new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) : new Date(Date.now() + (3 + i) * 24 * 60 * 60 * 1000),
      actualDate: status === 'DELIVERED' ? new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000) : null,
      shipmentReference: `CHALLAN-2026-${1000 + i}`,
      carrier: i % 2 === 0 ? 'BlueDart Express Logistics' : 'SafeXpress Healthcare Transport',
      trackingNumber: `TRK-${900000 + i}`,
      items: po.items.map((pi) => ({
        inventoryItemId: pi.inventoryItemId,
        itemName: pi.description,
        orderedQuantity: pi.quantity,
        shippedQuantity: status === 'PARTIALLY_DELIVERED' ? Math.round(pi.quantity * 0.6) : pi.quantity,
        receivedQuantity: status === 'DELIVERED' ? pi.quantity : 0
      })),
      status,
      delayDays: isDelayed ? 4 : 0,
      goodsReceiptId: status === 'DELIVERED' ? `GRN-2026-${String(i).padStart(5, '0')}` : null,
      notes: isDelayed ? 'Supplier shipment held up in transit due to transport strike.' : 'Standard logistics dispatch.'
    });
  }
  await Delivery.insertMany(delDocs);

  // 7. Generate 15 Supplier Invoices
  console.log('[Seed Module 19]: Creating 15 Supplier Invoices...');
  const invDocs = [];
  const matchStatuses = [
    'MATCHED', 'MATCHED', 'MATCHED', 'PRICE_MISMATCH', 'QUANTITY_MISMATCH',
    'MATCHED', 'MATCHED', 'MISSING_RECEIPT', 'PARTIAL_MATCH', 'MATCHED',
    'MATCHED', 'PRICE_MISMATCH', 'MATCHED', 'MATCHED', 'MATCHED'
  ];

  for (let i = 1; i <= 15; i++) {
    const invId = `PINV-2026-${String(i).padStart(5, '0')}`;
    const po = poDocs[i - 1];
    const matchStatus = matchStatuses[i - 1];
    const isPriceMismatch = matchStatus === 'PRICE_MISMATCH';
    const isQtyMismatch = matchStatus === 'QUANTITY_MISMATCH';

    const invItems = po.items.map((pi, idx) => {
      const unitPrice = isPriceMismatch ? pi.unitPrice + 25 : pi.unitPrice; // Price mismatch demo
      const quantity = isQtyMismatch ? pi.quantity + 20 : pi.quantity; // Quantity mismatch demo
      const lineTotal = quantity * unitPrice;

      return {
        invoiceItemId: `INV-ITEM-${i}-${idx + 1}`,
        inventoryItemId: pi.inventoryItemId,
        description: pi.description,
        quantity,
        unitPrice,
        tax: Math.round(lineTotal * 0.12),
        discount: 0,
        lineTotal: lineTotal + Math.round(lineTotal * 0.12)
      };
    });

    const subtotal = invItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    const tax = invItems.reduce((acc, curr) => acc + curr.tax, 0);
    const grandTotal = subtotal + tax;

    const discrepancies = [];
    if (isPriceMismatch) {
      discrepancies.push({
        type: 'PRICE',
        field: 'unitPrice',
        inventoryItemId: po.items[0].inventoryItemId,
        poValue: po.items[0].unitPrice,
        invoiceValue: po.items[0].unitPrice + 25,
        difference: 25,
        description: `Unit price mismatch: PO is ₹${po.items[0].unitPrice}, Invoice is ₹${po.items[0].unitPrice + 25} (₹25 overbilled per unit).`
      });
    }
    if (isQtyMismatch) {
      discrepancies.push({
        type: 'QUANTITY',
        field: 'quantity',
        inventoryItemId: po.items[0].inventoryItemId,
        poValue: po.items[0].quantity,
        invoiceValue: po.items[0].quantity + 20,
        difference: 20,
        description: `Invoiced quantity exceeds PO quantity by 20 units.`
      });
    }

    invDocs.push({
      supplierInvoiceId: invId,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      invoiceNumber: `INV-VND-${1000 + i}`,
      purchaseOrderId: po.purchaseOrderId,
      goodsReceiptId: `GRN-2026-${String(i).padStart(5, '0')}`,
      invoiceDate: new Date(Date.now() - (12 - i) * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + (18 + i) * 24 * 60 * 60 * 1000),
      currency: 'INR',
      items: invItems,
      subtotal,
      tax,
      discount: 0,
      grandTotal,
      matchStatus,
      matchDiscrepancies: discrepancies,
      status: matchStatus === 'MATCHED' ? 'APPROVED_FOR_PAYMENT' : 'MISMATCH',
      financeHandoffStatus: matchStatus === 'MATCHED' ? 'SENT_TO_FINANCE' : 'NOT_HANDED_OFF',
      approvedBy: matchStatus === 'MATCHED' ? 'USR-MGR-01' : null,
      approvedAt: matchStatus === 'MATCHED' ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
      notes: matchStatus === 'MATCHED' ? 'Three-way match verified. Approved for finance release.' : 'Discrepancy flagged for human audit.'
    });
  }
  await SupplierInvoice.insertMany(invDocs);

  // 8. Generate 10 Exceptions
  console.log('[Seed Module 19]: Creating 10 Procurement Exceptions...');
  const exceptions = [
    {
      exceptionId: 'EXC-PROC-001',
      module: 'PROCUREMENT',
      entityType: 'SupplierInvoice',
      entityId: 'PINV-2026-00004',
      exceptionType: 'PRICE_MISMATCH',
      severity: 'HIGH',
      description: 'Unit price mismatch: Supplier invoice billed at ₹185 vs approved PO unit price ₹160.',
      currentStatus: 'OPEN',
      assignedRole: 'BILLING_STAFF'
    },
    {
      exceptionId: 'EXC-PROC-002',
      module: 'PROCUREMENT',
      entityType: 'SupplierInvoice',
      entityId: 'PINV-2026-00005',
      exceptionType: 'QUANTITY_MISMATCH',
      severity: 'HIGH',
      description: 'Quantity mismatch: Invoiced 120 units but GRN only accepted 100 units.',
      currentStatus: 'OPEN',
      assignedRole: 'BILLING_STAFF'
    },
    {
      exceptionId: 'EXC-PROC-003',
      module: 'PROCUREMENT',
      entityType: 'Delivery',
      entityId: 'DEL-2026-00006',
      exceptionType: 'DELIVERY_DELAY',
      severity: 'MEDIUM',
      description: 'Shipment DEL-2026-00006 is 4 days overdue from expected delivery schedule.',
      currentStatus: 'OPEN',
      assignedRole: 'PROCUREMENT_OFFICER'
    },
    {
      exceptionId: 'EXC-PROC-004',
      module: 'PROCUREMENT',
      entityType: 'PurchaseRequest',
      entityId: 'PR-2026-00008',
      exceptionType: 'DUPLICATE_REQUEST',
      severity: 'LOW',
      description: 'Potential duplicate request detected: Similar request created within last 30 days.',
      currentStatus: 'RESOLVED',
      assignedRole: 'PROCUREMENT_OFFICER',
      resolution: 'Verified with department head: Legitimate repeat monthly requirement.'
    },
    {
      exceptionId: 'EXC-PROC-005',
      module: 'PROCUREMENT',
      entityType: 'PurchaseOrder',
      entityId: 'PO-2026-00010',
      exceptionType: 'VENDOR_CHANGE_REQUEST',
      severity: 'MEDIUM',
      description: 'Vendor requested 5-day delivery date extension due to raw material shipment bottleneck.',
      currentStatus: 'OPEN',
      assignedRole: 'PROCUREMENT_MANAGER'
    },
    {
      exceptionId: 'EXC-PROC-006',
      module: 'PROCUREMENT',
      entityType: 'SupplierInvoice',
      entityId: 'PINV-2026-00012',
      exceptionType: 'PRICE_MISMATCH',
      severity: 'HIGH',
      description: 'Unit price discrepancy: Vendor billed higher rate without authorized PO revision.',
      currentStatus: 'OPEN',
      assignedRole: 'BILLING_STAFF'
    },
    {
      exceptionId: 'EXC-PROC-007',
      module: 'PROCUREMENT',
      entityType: 'Delivery',
      entityId: 'DEL-2026-00007',
      exceptionType: 'DELIVERY_DELAY',
      severity: 'MEDIUM',
      description: 'Carrier SafeXpress delayed consignment due to transit breakdown.',
      currentStatus: 'OPEN',
      assignedRole: 'PROCUREMENT_OFFICER'
    },
    {
      exceptionId: 'EXC-PROC-008',
      module: 'PROCUREMENT',
      entityType: 'PurchaseOrder',
      entityId: 'PO-2026-00016',
      exceptionType: 'PO_MISMATCH',
      severity: 'LOW',
      description: 'Possible duplicate purchase order for same vendor and stock item.',
      currentStatus: 'RESOLVED',
      assignedRole: 'PROCUREMENT_MANAGER',
      resolution: 'Confirmed distinct purchase requisition batches.'
    },
    {
      exceptionId: 'EXC-PROC-009',
      module: 'PROCUREMENT',
      entityType: 'SupplierInvoice',
      entityId: 'PINV-2026-00008',
      exceptionType: 'MISSING_RECEIPT',
      severity: 'MEDIUM',
      description: 'Supplier submitted invoice prior to physical goods receipt confirmation by warehouse.',
      currentStatus: 'OPEN',
      assignedRole: 'BILLING_STAFF'
    },
    {
      exceptionId: 'EXC-PROC-010',
      module: 'PROCUREMENT',
      entityType: 'Delivery',
      entityId: 'DEL-2026-00014',
      exceptionType: 'DELIVERY_DELAY',
      severity: 'LOW',
      description: 'Courier tracking reported customs clearance inspection delay.',
      currentStatus: 'RESOLVED',
      assignedRole: 'PROCUREMENT_OFFICER',
      resolution: 'Customs cleared; delivery scheduled for next business day.'
    }
  ];

  await ExceptionCase.insertMany(exceptions);

  console.log('[Seed Module 19]: Procurement Management Seeding Completed Successfully!');
};

module.exports = seedModule19Procurement;

if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    await seedModule19Procurement();
    process.exit(0);
  });
}
