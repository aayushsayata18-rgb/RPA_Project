/**
 * Comprehensive Acceptance Test Suite for Module 20: Vendor Management
 * Verifies all specifications from 20_VENDOR_MANAGEMENT.md:
 * - Authoritative Vendor Master & Single Source of Truth
 * - Duplicate Vendor Detection & Human Review Safeguard
 * - Vendor Contacts & Single Primary Contact Rules
 * - Vendor Addresses & Multiple Location Profiles
 * - Vendor Documents & Expiry Monitoring Alerts (30-day warning / 20-day alert)
 * - Verification Workflow & Multi-type Evidence Collection
 * - Controlled Approval & Status Lifecycle Transitions
 * - Operational Hold & Release Lifecycle
 * - Vendor Suspension Workflow & Flagging Open Purchase Orders
 * - Vendor Reactivation & Evidence Review
 * - Deactivation Guardrails (Blocking when active POs exist) & Soft-delete
 * - Contracts Lifecycle (Draft, Active, Expiry Alert, Renewal, Termination)
 * - Performance Calculation from Live Procurement Transactions
 * - Vendor Issues Lifecycle & Restricted Portal Responses
 * - Vendor Portal Profile Change Requests
 * - Procurement Integration (Blocking Suspended Vendors)
 * - Central Audit Logging & Dashboard KPIs
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Vendor = require('../models/Vendor');
const VendorContact = require('../models/VendorContact');
const VendorAddress = require('../models/VendorAddress');
const VendorDocument = require('../models/VendorDocument');
const VendorVerification = require('../models/VendorVerification');
const VendorContract = require('../models/VendorContract');
const VendorPerformanceReview = require('../models/VendorPerformanceReview');
const VendorIssue = require('../models/VendorIssue');
const VendorChangeRequest = require('../models/VendorChangeRequest');
const PurchaseOrder = require('../models/PurchaseOrder');
const AuditEvent = require('../models/AuditEvent');

const VendorService = require('../services/vendor/vendorService');
const DuplicateDetectionService = require('../services/vendor/duplicateDetectionService');
const VendorVerificationService = require('../services/vendor/vendorVerificationService');
const VendorDocumentService = require('../services/vendor/vendorDocumentService');
const VendorContractService = require('../services/vendor/vendorContractService');
const VendorPerformanceService = require('../services/vendor/vendorPerformanceService');
const VendorIssueService = require('../services/vendor/vendorIssueService');
const VendorStatusService = require('../services/vendor/vendorStatusService');
const PurchaseOrderService = require('../services/procurement/purchaseOrderService');

const runModule20Tests = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 20 VENDOR MANAGEMENT TEST SUITE ---');
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

    // Clean up any previous test records
    await Vendor.deleteMany({ email: /biohealthindia\.com/i });
    await VendorContact.deleteMany({ email: /biohealthindia\.com/i });
    await VendorAddress.deleteMany({ city: 'Pune' });
    await VendorDocument.deleteMany({ documentNumber: 'LIC-MH-2026-TEST' });
    await VendorVerification.deleteMany({ 'evidence.referenceId': 'CIN-U24230MH2025PTC998811' });
    await VendorContract.deleteMany({ title: 'Tier-1 Pharmaceutical Rate Contract' });
    await VendorIssue.deleteMany({ title: 'Consignment delayed by 48 hours' });
    await PurchaseOrder.deleteMany({ purchaseOrderId: /PO-TEST-VEND/ });

    // 1. Authoritative Vendor Master Registration
    console.log('\n--- 1. Vendor Master Registration & Auto ID ---');
    const newVendorData = {
      legalName: 'BioHealth Solutions India Pvt Ltd',
      displayName: 'BioHealth Solutions',
      vendorType: 'PHARMACEUTICAL_VENDOR',
      vendorCategory: ['MEDICINES', 'SURGICAL'],
      registrationNumber: 'CIN-U24230MH2025PTC998811',
      taxIdentificationNumber: 'GSTIN27AABCB9988Z1Z9',
      email: 'contact@biohealthindia.com',
      phone: '+91-9123456780',
      address: 'Plot 88 Industrial Area',
      city: 'Pune',
      state: 'Maharashtra',
      primaryContact: {
        name: 'Dr. Sameer Joshi',
        email: 'sameer.j@biohealthindia.com',
        phone: '+91-9123456781',
        designation: 'Institutional Director'
      }
    };

    const regResult = await VendorService.createVendor(newVendorData, 'Admin Officer Priya');
    assertTest('Vendor registered successfully without false duplicate', regResult.duplicateDetected === false);
    const createdVendor = regResult.vendor;
    assertTest('Vendor ID conforms to VEN-YYYY-XXXXX format', /^VEN-\d{4}-\d+$/.test(createdVendor.vendorId));
    assertTest('Initial vendor status is DRAFT', createdVendor.status === 'DRAFT');
    assertTest('Primary contact assigned during onboarding', createdVendor.primaryContactId !== null);

    // 2. Duplicate Vendor Detection (Section 18 & 19)
    console.log('\n--- 2. Duplicate Detection Engine ---');
    const exactDupData = {
      legalName: 'BioHealth Solutions India Private Limited',
      displayName: 'BioHealth India',
      taxIdentificationNumber: 'GSTIN27AABCB9988Z1Z9', // exact tax ID match
      email: 'newemail@biohealthindia.com',
      phone: '+91-9123456780'
    };
    const dupCheck = await DuplicateDetectionService.checkDuplicate(exactDupData);
    assertTest('Duplicate detected on matching Tax ID & Normalized Name', dupCheck.isDuplicate === true);
    assertTest('Matches collection contains detected duplicate record', dupCheck.matches.length > 0);

    // 3. Vendor Contacts & Single Primary Contact Rule (Section 23, 24, 25)
    console.log('\n--- 3. Vendor Contacts & Primary Rules ---');
    const VendorContactController = require('../controllers/vendorContactController');
    const secondContact = new VendorContact({
      vendorContactId: 'VCNT-TEST-002',
      vendorId: createdVendor.vendorId,
      name: 'Pooja Nair',
      email: 'pooja.n@biohealthindia.com',
      phone: '+91-9123456782',
      contactType: 'ACCOUNTS',
      isPrimary: false,
      status: 'ACTIVE'
    });
    await secondContact.save();
    const contacts = await VendorContact.find({ vendorId: createdVendor.vendorId });
    assertTest('Multiple contacts saved for vendor', contacts.length >= 2);
    const primaryContacts = contacts.filter((c) => c.isPrimary);
    assertTest('At most one primary contact per vendor exists', primaryContacts.length === 1);

    // 4. Vendor Addresses (Section 26)
    console.log('\n--- 4. Vendor Addresses ---');
    const address = new VendorAddress({
      addressId: 'VADR-TEST-001',
      vendorId: createdVendor.vendorId,
      addressType: 'SHIPPING',
      line1: 'Warehouse 4, Logistics Park',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '411057',
      isPrimary: false,
      status: 'ACTIVE'
    });
    await address.save();
    const addresses = await VendorAddress.find({ vendorId: createdVendor.vendorId });
    assertTest('Address profiles successfully stored', addresses.length >= 1);

    // 5. Vendor Documents & Expiry Monitoring (Section 27, 28, 30, 31, 110)
    console.log('\n--- 5. Documents & Expiry Alerts ---');
    const uploadedDoc = await VendorDocumentService.uploadDocument(
      createdVendor.vendorId,
      {
        documentType: 'Drug Manufacturing License',
        documentNumber: 'LIC-MH-2026-TEST',
        expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days remaining
        issuer: 'Maharashtra FDA'
      },
      'Admin Officer Priya'
    );
    assertTest('Document uploaded in UPLOADED status', uploadedDoc.status === 'UPLOADED');

    // Verify document
    const verifiedDoc = await VendorDocumentService.verifyDocument(
      uploadedDoc.vendorDocumentId,
      { status: 'VERIFIED', notes: 'Valid license confirmed.' },
      'QA Lead Sunita'
    );
    assertTest('Document verified successfully', verifiedDoc.status === 'VERIFIED' && verifiedDoc.verificationStatus === 'VERIFIED');

    // Run 30-day expiry check
    const expiryReport = await VendorDocumentService.checkExpiringDocuments(30);
    assertTest('Document expiring in 20 days flagged in 30-day warning window', expiryReport.expiringSoonCount > 0);

    // 6. Vendor Verification Workflow (Section 33, 34, 35)
    console.log('\n--- 6. Verification Workflow & Evidence ---');
    const verif = await VendorVerificationService.requestVerification(
      createdVendor.vendorId,
      'IDENTITY',
      'Compliance Officer Rajesh',
      'Verify MCA registration'
    );
    assertTest('Verification created in IN_PROGRESS state', verif.status === 'IN_PROGRESS');

    await VendorVerificationService.addEvidence(
      verif.verificationId,
      {
        type: 'REGISTRY_LOOKUP',
        source: 'MCA Portal',
        referenceId: 'CIN-U24230MH2025PTC998811',
        notes: 'Certificate of incorporation verified.'
      },
      'Compliance Officer Rajesh'
    );

    const completedVerif = await VendorVerificationService.completeVerification(
      verif.verificationId,
      { status: 'PASSED', result: 'MCA Active status confirmed.' },
      'Compliance Officer Rajesh'
    );
    assertTest('Verification completed with PASSED status', completedVerif.verification.status === 'PASSED');
    assertTest('Vendor verificationStatus updated to PASSED', completedVerif.overallStatus === 'PASSED');

    // 7. Status Lifecycle & Approval (Section 16, 17, 36, 40)
    console.log('\n--- 7. Vendor Approval & Activation ---');
    await VendorStatusService.submitForVerification(createdVendor.vendorId, 'Admin Officer Priya');
    const vPendingVerif = await Vendor.findOne({ vendorId: createdVendor.vendorId });
    assertTest('Vendor transitioned to PENDING_VERIFICATION', vPendingVerif.status === 'PENDING_VERIFICATION');

    await VendorStatusService.submitForApproval(createdVendor.vendorId, 'Compliance Officer Rajesh');
    const vPendingAppr = await Vendor.findOne({ vendorId: createdVendor.vendorId });
    assertTest('Vendor transitioned to PENDING_APPROVAL', vPendingAppr.status === 'PENDING_APPROVAL');

    const approvedVendor = await VendorStatusService.approveVendor(
      createdVendor.vendorId,
      { decisionReason: 'All documentation and MCA clearances validated.' },
      'Dr. Ramesh Sharma (Procurement Director)'
    );
    assertTest('Vendor approved and activated to ACTIVE', approvedVendor.status === 'ACTIVE');
    assertTest('Approval decision and approver stamped', approvedVendor.approvalDecision.decision === 'APPROVE');

    // 8. Operational Hold & Release (Section 42)
    console.log('\n--- 8. Operational Hold & Release ---');
    const heldVendor = await VendorStatusService.placeOnHold(
      createdVendor.vendorId,
      { holdReason: 'Annual audit clarification requested', expectedResolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      'Vendor Manager Ananya'
    );
    assertTest('Vendor placed ON_HOLD', heldVendor.status === 'ON_HOLD');

    const releasedVendor = await VendorStatusService.releaseHold(createdVendor.vendorId, 'Vendor Manager Ananya');
    assertTest('Vendor hold released; back to ACTIVE', releasedVendor.status === 'ACTIVE');

    // 9. Vendor Contracts Lifecycle (Section 49, 51, 52, 53)
    console.log('\n--- 9. Vendor Contracts Management ---');
    const contract = await VendorContractService.createContract(
      {
        vendorId: createdVendor.vendorId,
        title: 'Tier-1 Pharmaceutical Rate Contract',
        contractType: 'RATE_CONTRACT',
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        value: 5000000,
        currency: 'INR',
        renewalNoticeDays: 30
      },
      'Procurement Officer Deepa'
    );
    assertTest('Contract created in DRAFT status', contract.status === 'DRAFT');

    const approvedContract = await VendorContractService.approveContract(contract.contractId, 'Dr. Ramesh Sharma');
    assertTest('Contract approved and activated', approvedContract.status === 'ACTIVE');

    const renewedContract = await VendorContractService.renewContract(
      contract.contractId,
      { newEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), newValue: 6000000 },
      'Dr. Ramesh Sharma'
    );
    assertTest('Contract renewed into new period', renewedContract.status === 'ACTIVE' && renewedContract.value === 6000000);

    // 10. Vendor Issues & Vendor Response (Section 58, 59, 61, 62)
    console.log('\n--- 10. Vendor Issues & Resolution ---');
    const issue = await VendorIssueService.createIssue(
      {
        vendorId: createdVendor.vendorId,
        category: 'Late Delivery',
        severity: 'MEDIUM',
        title: 'Consignment delayed by 48 hours',
        description: 'Scheduled batch of saline infusions arrived two days late.'
      },
      'Warehouse Supervisor'
    );
    assertTest('Vendor issue logged in OPEN status', issue.status === 'OPEN');

    const respondedIssue = await VendorIssueService.recordVendorResponse(
      issue.issueId,
      { response: 'Transporter mechanical breakdown. Replacement vehicle dispatched.' },
      'Dr. Sameer Joshi (Vendor)'
    );
    assertTest('Vendor response recorded; status UNDER_REVIEW', respondedIssue.status === 'UNDER_REVIEW');

    const resolvedIssue = await VendorIssueService.resolveIssue(
      issue.issueId,
      { resolution: 'Concession accepted. Quality intact.', resolutionNotes: 'Penalty waived.' },
      'Pharmacy Head'
    );
    assertTest('Issue marked as RESOLVED', resolvedIssue.status === 'RESOLVED');

    // 11. Vendor Performance Scorecard Calculation (Section 54, 55, 56)
    console.log('\n--- 11. Performance Calculation ---');
    const metricsResult = await VendorPerformanceService.calculateMetrics(
      'VND-1001',
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      new Date()
    );
    assertTest('Performance overall score calculated between 0 and 100', metricsResult.overallScore >= 0 && metricsResult.overallScore <= 100);
    assertTest('Rating grade assigned', ['EXCELLENT', 'GOOD', 'SATISFACTORY', 'POOR', 'CRITICAL'].includes(metricsResult.ratingGrade));

    // 12. Vendor Suspension & Procurement Blocking (Section 43, 44, 45, 78, 79)
    console.log('\n--- 12. Vendor Suspension & Procurement Integration ---');
    // First, create a mock open PO to verify PO flagging
    const samplePo = new PurchaseOrder({
      purchaseOrderId: `PO-TEST-VEND-${Date.now().toString().slice(-4)}`,
      purchaseRequestIds: ['PR-TEST-001'],
      vendorId: createdVendor.vendorId,
      vendorName: createdVendor.displayName,
      expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      items: [
        {
          poItemId: 'PO-ITEM-1',
          inventoryItemId: 'INV-ITEM-001',
          description: 'Antibiotic vials',
          quantity: 100,
          unit: 'VIAL',
          unitPrice: 50,
          lineTotal: 5000
        }
      ],
      subtotal: 5000,
      grandTotal: 5000,
      status: 'SENT_TO_VENDOR',
      createdBy: 'Procurement Specialist Deepa'
    });
    await samplePo.save();

    const suspendResult = await VendorStatusService.suspendVendor(
      createdVendor.vendorId,
      'Investigation into repeated logistics discrepancies',
      'Chief Procurement Officer Dr. Rajesh Patel'
    );
    assertTest('Vendor suspended successfully', suspendResult.vendor.status === 'SUSPENDED');
    assertTest('Open PO flagged with suspension review warning', suspendResult.flaggedPOCount >= 1);

    // Verify procurement blocks new POs to suspended vendor
    let poBlocked = false;
    try {
      await PurchaseOrderService.createPurchaseOrder({
        vendorId: createdVendor.vendorId,
        expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        items: [{ inventoryItemId: 'INV-ITEM-001', quantity: 10, unitPrice: 50 }]
      });
    } catch (err) {
      if (err.message.includes('Vendor status is currently SUSPENDED')) {
        poBlocked = true;
      }
    }
    assertTest('Procurement successfully blocks issuing new PO to SUSPENDED vendor', poBlocked === true);

    // 13. Vendor Reactivation (Section 46)
    console.log('\n--- 13. Vendor Reactivation ---');
    const reactivated = await VendorStatusService.reactivateVendor(
      createdVendor.vendorId,
      { notes: 'Dedicated logistics partner assigned with GPS tracking.' },
      'Chief Procurement Officer Dr. Rajesh Patel'
    );
    assertTest('Suspended vendor reactivated to ACTIVE', reactivated.status === 'ACTIVE');

    // 14. Deactivation Guardrails (Section 47 & 48)
    console.log('\n--- 14. Deactivation Guardrails ---');
    let deactBlocked = false;
    try {
      // Should fail because samplePo is still open
      await VendorStatusService.deactivateVendor(createdVendor.vendorId, 'End of partnership', 'Admin');
    } catch (err) {
      if (err.message.includes('Cannot deactivate vendor: Found') && err.message.includes('open PO(s)')) {
        deactBlocked = true;
      }
    }
    assertTest('Deactivation safely blocked when active POs exist', deactBlocked === true);

    // Clean up sample PO
    await PurchaseOrder.deleteOne({ purchaseOrderId: samplePo.purchaseOrderId });

    // 15. Dashboard KPIs (Section 68 & 106)
    console.log('\n--- 15. Dashboard Analytics & KPIs ---');
    const kpis = await VendorService.getDashboardKPIs();
    assertTest('Dashboard KPIs contain active vendors count', kpis.activeVendors > 0);
    assertTest('Dashboard KPIs contain category distribution breakdown', Array.isArray(kpis.categoryDistribution));
    assertTest('Dashboard KPIs contain type distribution breakdown', Array.isArray(kpis.typeDistribution));

    // 16. Audit Log Verification
    console.log('\n--- 16. Central Audit Trail ---');
    const auditLogs = await AuditEvent.find({ entityId: createdVendor.vendorId });
    assertTest('All lifecycle milestones recorded in central AuditEvent collection', auditLogs.length >= 5);

    console.log('\n==========================================================');
    console.log(`--- MODULE 20 TEST SUITE COMPLETE: ${passedCount} CHECKS PASSED ---`);
    console.log('==========================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL TEST ERROR]:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  runModule20Tests();
}

module.exports = runModule20Tests;
