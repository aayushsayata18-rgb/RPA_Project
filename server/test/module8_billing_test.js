/**
 * Module 8: Billing & Payment Management Acceptance Test Suite
 * Comprehensive automated verification for 08_BILLING.md
 */

const mongoose = require('mongoose');
const BillingService = require('../services/BillingService');
const DischargePaymentService = require('../services/DischargePaymentService');
const IdGeneratorService = require('../services/IdGeneratorService');
const BillableItem = require('../models/BillableItem');
const Invoice = require('../models/Invoice');
const Deposit = require('../models/Deposit');
const FinancialAdjustment = require('../models/FinancialAdjustment');
const BillingQuery = require('../models/BillingQuery');
const PaymentTransaction = require('../models/PaymentTransaction');
const RateCard = require('../models/RateCard');
const Patient = require('../models/Patient');
const ExceptionCase = require('../models/ExceptionCase');

let passedCount = 0;
const assertTest = (name, condition, extraInfo = '') => {
  if (!condition) {
    console.error(`\n[FAIL] ${name} ${extraInfo}`);
    throw new Error(`Test assertion failed: ${name} ${extraInfo}`);
  }
  console.log(`[PASS] ${name}`);
  passedCount++;
};

const runModule8Tests = async () => {
  try {
    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 8 BILLING & PAYMENT TEST SUITE ---');
    console.log('==========================================================\n');

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');

    const testSuffix = Date.now();
    const testPatientId = `P-BILL-${testSuffix}`;

    // Ensure mock patient exists
    await Patient.findOneAndUpdate(
      { patientId: testPatientId },
      {
        patientId: testPatientId,
        firstName: 'Sunita',
        lastName: `Verma_${testSuffix}`,
        phone: '9820555123',
        email: `sunita.${testSuffix}@hospital.com`,
        status: 'ACTIVE'
      },
      { upsert: true, new: true }
    );

    // Ensure mock rate cards exist
    await RateCard.findOneAndUpdate(
      { serviceCode: 'CONS-SR' },
      {
        serviceCode: 'CONS-SR',
        serviceName: 'Senior Specialist Consultation',
        category: 'CONSULTATION',
        basePrice: 1200,
        taxRate: 0.05, // 5% GST
        active: true,
        effectiveFrom: new Date('2026-01-01')
      },
      { upsert: true, new: true }
    );

    await RateCard.findOneAndUpdate(
      { serviceCode: 'LAB-CBC' },
      {
        serviceCode: 'LAB-CBC',
        serviceName: 'Complete Blood Count (CBC)',
        category: 'LABORATORY',
        basePrice: 450,
        taxRate: 0,
        active: true,
        effectiveFrom: new Date('2026-01-01')
      },
      { upsert: true, new: true }
    );

    const userBillingStaff = { userId: 'USER-BILL-01', username: 'billing_staff', role: 'BILLING_STAFF' };
    const userFinanceMgr = { userId: 'USER-FIN-01', username: 'finance_manager', role: 'FINANCE_MANAGER' };
    const userRpaWorker = { userId: 'RPA-WORKER-01', username: 'rpa_bot', role: 'RPA_WORKER', isRpa: true };
    const userPatient = { userId: 'USER-PAT-01', username: 'patient_sunita', role: 'PATIENT' };

    // 1. Rate Card & Effective Pricing
    console.log('--- 1. Rate Card & Versioned Pricing Lookup ---');
    const rate1 = await BillingService.getEffectiveRate('CONS-SR');
    assertTest('Effective rate card resolved for service CONS-SR', rate1 !== null && rate1.basePrice === 1200 && rate1.taxRate === 0.05);

    // 2. Billable Items Ingestion & Deduplication
    console.log('\n--- 2. Billable Items Ingestion & Deduplication ---');
    const charge1 = await BillingService.addBillableItem({
      patientId: testPatientId,
      sourceModule: 'CONSULTATION',
      sourceType: 'OPD_VISIT',
      sourceId: `VISIT-OPD-${testSuffix}`,
      serviceCode: 'CONS-SR',
      quantity: 1,
      actorUser: userBillingStaff
    });

    assertTest('Billable item created with VALIDATED status', charge1.status === 'VALIDATED');
    assertTest('Billable item price and tax resolved from rate card (1200 + 60 = 1260)', charge1.grossAmount === 1200 && charge1.taxAmount === 60 && charge1.netAmount === 1260);

    // Duplicate charge rejection test
    let duplicateCaught = false;
    try {
      await BillingService.addBillableItem({
        patientId: testPatientId,
        sourceModule: 'CONSULTATION',
        sourceType: 'OPD_VISIT',
        sourceId: `VISIT-OPD-${testSuffix}`,
        serviceCode: 'CONS-SR',
        actorUser: userBillingStaff
      });
    } catch (dupErr) {
      duplicateCaught = dupErr.message.includes('Duplicate charge');
    }
    assertTest('Duplicate charge ingestion prevented for same source', duplicateCaught === true);

    // Ingest a second charge (Lab test)
    const charge2 = await BillingService.addBillableItem({
      patientId: testPatientId,
      sourceModule: 'LABORATORY',
      sourceType: 'LAB_ORDER',
      sourceId: `LAB-ORD-${testSuffix}`,
      serviceCode: 'LAB-CBC',
      quantity: 2, // 2 x 450 = 900
      actorUser: userBillingStaff
    });
    assertTest('Second billable item ingested with quantity multiplier (2 x 450 = 900)', charge2.grossAmount === 900 && charge2.netAmount === 900);

    // 3. Draft Invoice Generation & Multi-Service Aggregation
    console.log('\n--- 3. Draft Invoice Generation & Calculation ---');
    const draftInvoice = await BillingService.createDraftInvoice({
      patientId: testPatientId,
      invoiceType: 'OPD',
      coveredAmount: 500, // ₹500 covered by insurance
      actorUser: userBillingStaff
    });

    // Total gross: 1200 + 900 = 2100; Tax: 60; Covered: 500 => Payable: 2100 + 60 - 500 = 1660
    assertTest('Draft invoice created with status DRAFT', draftInvoice.status === 'DRAFT');
    assertTest('Invoice aggregated gross items correctly (2100)', draftInvoice.grossTotal === 2100);
    assertTest('Invoice calculated tax correctly (60)', draftInvoice.taxAmount === 60);
    assertTest('Invoice applied insurance covered amount (500)', draftInvoice.coveredAmount === 500);
    assertTest('Invoice net payable amount matches formula (1660)', draftInvoice.payableAmount === 1660);
    assertTest('Outstanding balance equals payable amount for new draft', draftInvoice.outstandingBalance === 1660);

    // 4. Deposit / Advance Handling
    console.log('\n--- 4. Patient Advance Deposit & Invoice Application ---');
    const deposit = await BillingService.recordDeposit({
      patientId: testPatientId,
      amount: 600,
      paymentMethod: 'UPI',
      notes: 'Advance deposit during OPD check-in',
      actorUser: userBillingStaff
    });

    assertTest('Patient advance deposit created with status ACTIVE', deposit.status === 'ACTIVE' && deposit.remainingAmount === 600);

    const depositApplyRes = await BillingService.applyDepositToInvoice({
      depositId: deposit.depositNumber,
      invoiceId: draftInvoice.invoiceId,
      amount: 600,
      actorUser: userBillingStaff
    });

    assertTest('Deposit applied to invoice successfully', depositApplyRes.appliedAmount === 600);
    assertTest('Deposit remaining amount updated to 0', depositApplyRes.deposit.remainingAmount === 0 && depositApplyRes.deposit.status === 'FULLY_APPLIED');
    assertTest('Invoice outstanding balance reduced by deposit amount (1660 - 600 = 1060)', depositApplyRes.invoice.outstandingBalance === 1060);

    // 5. Finalize Invoice & Immutability Enforcement
    console.log('\n--- 5. Invoice Finalization & Immutability Rules ---');
    const finRes = await BillingService.finalizeInvoice({
      invoiceId: draftInvoice.invoiceId,
      actorUser: userBillingStaff
    });

    assertTest('Invoice transitioned from DRAFT to FINALIZED', finRes.invoice.status === 'FINALIZED');

    // Verify referenced billable items are marked INVOICED
    const updatedCharge1 = await BillableItem.findOne({ chargeId: charge1.chargeId });
    assertTest('Referenced billable item marked INVOICED', updatedCharge1.status === 'INVOICED' && updatedCharge1.invoiceId === draftInvoice.invoiceId);

    // Repeated finalize returns existing state without error
    const replayFin = await BillingService.finalizeInvoice({
      invoiceId: draftInvoice.invoiceId,
      actorUser: userBillingStaff
    });
    assertTest('Idempotent finalize returns isExisting: true without modifying financials', replayFin.isExisting === true);

    // 6. Financial Adjustment Workflow & RPA Safety Boundary
    console.log('\n--- 6. Financial Adjustment & RPA Safety Guardrail ---');
    const adjReq = await BillingService.requestAdjustment({
      invoiceId: draftInvoice.invoiceId,
      type: 'DISCOUNT',
      amount: 60,
      reason: 'Senior citizen compassionate discount',
      actorUser: userBillingStaff
    });

    assertTest('Adjustment requested with status REQUESTED', adjReq.status === 'REQUESTED' && adjReq.amount === 60);

    // SAFETY RULE TEST: RPA Bot must NEVER independently approve an adjustment!
    let rpaBlocked = false;
    try {
      await BillingService.reviewAdjustment({
        adjustmentNumber: adjReq.adjustmentNumber,
        approved: true,
        actorUser: userRpaWorker
      });
    } catch (rpaErr) {
      rpaBlocked = rpaErr.message.includes('RPA agents are strictly prohibited');
    }
    assertTest('RPA worker strictly prohibited from independently approving financial adjustments', rpaBlocked === true);

    // Authorized Finance Manager approves adjustment
    const adjApproveRes = await BillingService.reviewAdjustment({
      adjustmentNumber: adjReq.adjustmentNumber,
      approved: true,
      actorUser: userFinanceMgr
    });

    assertTest('Adjustment approved and applied by Finance Manager', adjApproveRes.adjustment.status === 'APPLIED');
    assertTest('Invoice outstanding balance reduced by discount (1060 - 60 = 1000)', adjApproveRes.invoice.outstandingBalance === 1000);

    // 7. Payment Gateway Session Creation
    console.log('\n--- 7. Digital Payment Session Initialization ---');
    const sessionRes = await DischargePaymentService.createPaymentSession({
      invoiceId: draftInvoice.invoiceId,
      paymentMethod: 'ONLINE_GATEWAY',
      amount: 1000,
      actorUser: userPatient
    });

    assertTest('Digital payment session created with gatewayReferenceId', sessionRes.gatewayReferenceId !== null);
    const initialTx = await PaymentTransaction.findOne({ transactionId: sessionRes.transactionId });
    assertTest('Payment transaction initialized with status INITIATED', initialTx !== null && initialTx.status === 'INITIATED' && initialTx.amount === 1000);

    // 8. Payment Verification & Full Settlement
    console.log('\n--- 8. Payment Verification Callback & Settlement ---');
    const callbackRes = await DischargePaymentService.processPaymentCallback({
      transactionId: sessionRes.transactionId,
      status: 'SUCCESS',
      signature: 'MOCK_VALID_HASH_SIG',
      actorUser: userBillingStaff
    });

    assertTest('Payment callback verified successfully', callbackRes.success === true && callbackRes.status === 'SUCCESS');
    assertTest('Transaction marked as SUCCESS in ledger', callbackRes.transaction.status === 'SUCCESS');

    const settledInvoice = await Invoice.findOne({ invoiceId: draftInvoice.invoiceId });
    assertTest('Invoice status transitioned to PAID upon full settlement', settledInvoice.status === 'PAID');
    assertTest('Invoice outstanding balance settled to 0', settledInvoice.outstandingBalance === 0);
    assertTest('Invoice paidAmount recorded accurately (1000)', settledInvoice.paidAmount === 1000);

    // Idempotent callback replay
    const replayCallback = await DischargePaymentService.processPaymentCallback({
      transactionId: sessionRes.transactionId,
      status: 'SUCCESS',
      signature: 'MOCK_VALID_HASH_SIG',
      actorUser: userBillingStaff
    });
    assertTest('Replay payment callback detected as alreadyProcessed without duplicate credits', replayCallback.alreadyProcessed === true);

    // 9. Billing Dispute / Query Lifecycle
    console.log('\n--- 9. Billing Query & Dispute Resolution Lifecycle ---');
    const query = await BillingService.createBillingQuery({
      patientId: testPatientId,
      invoiceId: draftInvoice.invoiceId,
      category: 'CHARGE_CLARIFICATION',
      description: 'Requesting breakdown of laboratory test components.',
      actorUser: userPatient
    });

    assertTest('Billing query logged with status OPEN', query.status === 'OPEN');
    const disputedInvoice = await Invoice.findOne({ invoiceId: draftInvoice.invoiceId });
    assertTest('Invoice disputeStatus tagged as RAISED', disputedInvoice.disputeStatus === 'RAISED');

    const resolvedQuery = await BillingService.resolveBillingQuery({
      queryNumber: query.queryNumber,
      resolution: 'Provided itemized laboratory test report to patient via portal.',
      actorUser: userBillingStaff
    });

    assertTest('Billing query resolved by staff', resolvedQuery.status === 'RESOLVED');
    const clearedInvoice = await Invoice.findOne({ invoiceId: draftInvoice.invoiceId });
    assertTest('Invoice disputeStatus updated to RESOLVED', clearedInvoice.disputeStatus === 'RESOLVED');

    // 10. Financial Reconciliation & Exception Detection
    console.log('\n--- 10. Gateway Settlement Reconciliation & Discrepancies ---');
    const mockSettlementBatch = [
      // 1. Clean match
      {
        transactionId: sessionRes.transactionId,
        amount: 1000,
        status: 'SUCCESS'
      },
      // 2. Amount Mismatch
      {
        transactionId: sessionRes.transactionId,
        amount: 950, // shortfall
        status: 'SUCCESS'
      },
      // 3. Unknown Transaction
      {
        transactionId: 'TXN-UNKNOWN-99999',
        gatewayReferenceId: 'GW-UNKNOWN-99999',
        amount: 500,
        status: 'SUCCESS'
      }
    ];

    const reconResults = await BillingService.reconcileGatewaySettlement(mockSettlementBatch, userBillingStaff);
    assertTest('Reconciliation processed settlement batch', reconResults.totalRecords === 3);
    assertTest('Matched transaction correctly verified', reconResults.matched >= 1);
    assertTest('Mismatched transactions caught and flagged', reconResults.mismatched >= 2);

    // 11. Billing Dashboard Executive Summary Aggregations
    console.log('\n--- 11. Billing Executive Dashboard Metrics ---');
    const dashboard = await BillingService.getDashboardSummary();
    assertTest('Dashboard calculated gross receivables and revenues', dashboard.grossReceivables >= 0 && dashboard.todayRevenue >= 0);
    assertTest('Dashboard calculated collectionRate as a percentage', typeof dashboard.collectionRate === 'number' && dashboard.collectionRate >= 0);
    assertTest('Dashboard invoicesCount tracked accurately', dashboard.invoicesCount >= 1);

    console.log('\n==========================================================');
    console.log(`--- MODULE 8 TEST SUITE COMPLETE: ${passedCount} OF ${passedCount} PASSED ---`);
    console.log('==========================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[MODULE 8 TEST RUNNER FAILED]:', err);
    process.exit(1);
  }
};

runModule8Tests();
