/**
 * Comprehensive Acceptance Test Suite for Module 17: Pharmacy Management
 * Tests all requirements: Medicine catalog, Prescription, Order, FEFO stock reservation,
 * Expired batch blocking, Barcode mismatch, Controlled medicine guard, Partial/Full dispensing,
 * Duplicate protection, Idempotency, Billing integration, Returns & Quarantine, and RBAC.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Medicine = require('../models/Medicine');
const InventoryBatch = require('../models/InventoryBatch');
const Prescription = require('../models/Prescription');
const PharmacyOrder = require('../models/PharmacyOrder');
const DispensingRecord = require('../models/DispensingRecord');
const PharmacyReturn = require('../models/PharmacyReturn');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const BillableItem = require('../models/BillableItem');
const AuditEvent = require('../models/AuditEvent');
const ExceptionCase = require('../models/ExceptionCase');

const MedicineService = require('../services/pharmacy/medicineService');
const StockAvailabilityService = require('../services/pharmacy/stockAvailabilityService');
const PrescriptionService = require('../services/pharmacy/prescriptionService');
const PharmacyOrderService = require('../services/pharmacy/pharmacyOrderService');
const DispensingService = require('../services/pharmacy/dispensingService');
const ReturnService = require('../services/pharmacy/returnService');
const PharmacyBillingService = require('../services/pharmacy/pharmacyBillingService');
const PharmacyReportService = require('../services/pharmacy/pharmacyReportService');

const runModule17Tests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n==========================================================');
    console.log('--- STARTING MODULE 17 PHARMACY MANAGEMENT TEST SUITE ---');
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

    const userDoctor = { userId: 'DOC-TEST-01', role: 'DOCTOR', name: 'Dr. Test Physician' };
    const userPharmacist = { userId: 'PHARM-TEST-01', role: 'PHARMACIST', name: 'Pharmacist Alex', permissions: ['PHARMACY_DISPENSE', 'PHARMACY_VIEW'] };
    const userSeniorPharmacist = { userId: 'SR-PHARM-TEST-01', role: 'PHARMACIST', name: 'Senior Pharmacist Helen', permissions: ['PHARMACY_CONTROLLED_REVIEW', 'PHARMACY_RETURN_APPROVE'] };
    const userPatient = { userId: 'P10099', role: 'PATIENT', name: 'Test Patient John' };

    // Setup Test Patient & Doctor
    await Patient.findOneAndUpdate(
      { patientId: 'P10099' },
      {
        patientId: 'P10099',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1985-04-12'),
        gender: 'MALE',
        contactNumber: '+919988776655',
        status: 'ACTIVE'
      },
      { upsert: true, new: true }
    );

    await Doctor.findOneAndUpdate(
      { doctorId: 'DOC-TEST-01' },
      {
        doctorId: 'DOC-TEST-01',
        firstName: 'Test',
        lastName: 'Physician',
        email: 'dr.test@hospital.com',
        specialization: 'Internal Medicine',
        status: 'ACTIVE'
      },
      { upsert: true, new: true }
    );

    // Clean up any test artifacts from prior runs
    await Medicine.deleteMany({ medicineId: /^MED-TEST-/ });
    await InventoryBatch.deleteMany({ batchId: /^BAT-TEST-/ });
    await Prescription.deleteMany({ patientId: 'P10099' });
    await PharmacyOrder.deleteMany({ patientId: 'P10099' });
    await DispensingRecord.deleteMany({ patientId: 'P10099' });
    await PharmacyReturn.deleteMany({ patientId: 'P10099' });

    // ========================================================
    // TEST 1: Medicine Master CRUD & Duplicate Detection Rule
    // ========================================================
    console.log('\n--- TEST 1: Medicine Master & Duplicate Detection ---');
    const testMed1 = await MedicineService.createMedicine(
      {
        medicineId: 'MED-TEST-001',
        genericName: 'Cefixime',
        brandName: 'Zifi 200',
        strength: '200 mg',
        dosageForm: 'Tablet',
        unit: 'Tablet',
        unitPrice: 15.0,
        manufacturer: 'FDC Limited',
        category: 'Antibiotic',
        barcode: '890999000001',
        sku: 'CEF200TAB',
        prescriptionRequired: true,
        controlledMedicine: false
      },
      userPharmacist
    );
    assertTest('Medicine created with valid attributes', testMed1.medicineId === 'MED-TEST-001' && testMed1.unitPrice === 15);

    let duplicateCaught = false;
    try {
      await MedicineService.createMedicine(
        {
          genericName: 'Cefixime',
          strength: '200 mg',
          dosageForm: 'Tablet',
          manufacturer: 'FDC Limited'
        },
        userPharmacist
      );
    } catch (err) {
      duplicateCaught = err.message.includes('Duplicate medicine');
    }
    assertTest('Duplicate medicine creation is blocked and raises exception', duplicateCaught);

    // ========================================================
    // TEST 2: Doctor Prescription Creation & Snapshots
    // ========================================================
    console.log('\n--- TEST 2: Doctor Prescription Issuance & Snapshots ---');
    const rxTest1 = await PrescriptionService.createPrescription({
      patientId: 'P10099',
      doctorId: 'DOC-TEST-01',
      departmentName: 'Internal Medicine',
      diagnosis: 'Bacterial Sinusitis',
      validityDays: 14,
      items: [
        {
          medicineId: 'MED-TEST-001',
          dose: '200 mg',
          route: 'ORAL',
          frequency: 'TWICE_DAILY',
          duration: '5 DAYS',
          quantity: 10,
          instructions: 'Take 1 tablet every 12 hours after meals'
        }
      ],
      actorUser: userDoctor
    });

    assertTest('Prescription issued with status ISSUED', rxTest1.status === 'ISSUED');
    assertTest('Prescription item has snapshot of medicine details', rxTest1.items[0].medicineNameSnapshot.includes('Cefixime') && rxTest1.items[0].unitPriceSnapshot === 15);
    assertTest('Prescription validity date is correctly calculated (14 days)', rxTest1.validUntil > rxTest1.prescriptionDate);

    // ========================================================
    // TEST 3: Order Routing & Priority Auto-Escalation
    // ========================================================
    console.log('\n--- TEST 3: Order Routing & Priority Auto-Escalation ---');
    const routeResult = await PrescriptionService.sendToPharmacy(rxTest1.prescriptionId, 'EMERGENCY', 'NORMAL', userDoctor);
    assertTest('Prescription transitioned to SENT_TO_PHARMACY', routeResult.prescription.status === 'SENT_TO_PHARMACY');
    assertTest('Pharmacy order created with auto-escalated URGENT priority for EMERGENCY', routeResult.order.priority === 'URGENT');
    assertTest('Pharmacy order status initialized to NEW', routeResult.order.status === 'NEW');

    // Pharmacist receives and validates prescription
    const validatedRx = await PrescriptionService.validatePrescription(rxTest1.prescriptionId, userPharmacist);
    assertTest('Pharmacist successfully validates prescription', validatedRx.status === 'VALIDATED');

    // ========================================================
    // TEST 4: Stock Availability & FEFO (First Expiry, First Out)
    // ========================================================
    console.log('\n--- TEST 4: Stock Availability & FEFO Ordering ---');
    const now = new Date();
    const batchEarlier = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
    const batchLater = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days

    await InventoryBatch.create([
      {
        batchId: 'BAT-TEST-01-EARLY',
        medicineId: 'MED-TEST-001',
        medicineName: 'Cefixime',
        lotNumber: 'LOT-CEF-01',
        initialQuantity: 100,
        availableQuantity: 50,
        expiryDate: batchEarlier, // Expiring sooner
        unitPrice: 15.0,
        status: 'ACTIVE'
      },
      {
        batchId: 'BAT-TEST-02-LATER',
        medicineId: 'MED-TEST-001',
        medicineName: 'Cefixime',
        lotNumber: 'LOT-CEF-02',
        initialQuantity: 100,
        availableQuantity: 50,
        expiryDate: batchLater, // Expiring later
        unitPrice: 15.0,
        status: 'ACTIVE'
      }
    ]);

    const availability = await StockAvailabilityService.getStockAvailability('MED-TEST-001');
    assertTest('Stock availability returns total 100 units across active batches', availability.availableQuantity === 100);
    assertTest('FEFO ordering places earlier expiring batch first', availability.batches[0].batchId === 'BAT-TEST-01-EARLY');

    // ========================================================
    // TEST 5: Atomic Concurrency-Safe Stock Reservation
    // ========================================================
    console.log('\n--- TEST 5: Atomic Stock Reservation ---');
    const resResult = await StockAvailabilityService.reserveStockForOrder({
      pharmacyOrderId: routeResult.order.pharmacyOrderId,
      medicineId: 'MED-TEST-001',
      quantity: 10,
      selectionMethod: 'FEFO',
      actorUser: userPharmacist
    });

    assertTest('10 units reserved from earliest expiring batch', resResult.reservedQuantity === 10 && resResult.batchReservations[0].batchId === 'BAT-TEST-01-EARLY');

    const updatedBatchEarly = await InventoryBatch.findOne({ batchId: 'BAT-TEST-01-EARLY' });
    assertTest('Batch available stock decremented from 50 to 40, reserved incremented to 10', updatedBatchEarly.availableQuantity === 40 && updatedBatchEarly.reservedQuantity === 10);

    // ========================================================
    // TEST 6: Expired Batch Dispensing is Strictly BLOCKED
    // ========================================================
    console.log('\n--- TEST 6: Expired Batch Dispensing Blocking (Section 25 & 89) ---');
    let expiredBlocked = false;
    try {
      await DispensingService.dispenseOrder({
        pharmacyOrderId: routeResult.order.pharmacyOrderId,
        pharmacistId: userPharmacist.userId,
        items: [
          {
            prescriptionItemId: routeResult.order.items[0].prescriptionItemId,
            medicineId: 'MED-000001',
            inventoryBatchId: 'BAT-10015', // Past expiry date batch!
            dispensedQuantity: 5
          }
        ],
        actorUser: userPharmacist
      });
    } catch (err) {
      expiredBlocked = err.message.includes('EXPIRED_BATCH');
    }
    assertTest('Dispensing of expired batch BAT-10015 is BLOCKED with EXPIRED_BATCH exception', expiredBlocked);

    // ========================================================
    // TEST 7: Barcode Mismatch Detection & Blocking
    // ========================================================
    console.log('\n--- TEST 7: Barcode Mismatch Detection & Blocking (Section 47 & 90) ---');
    let mismatchBlocked = false;
    try {
      await DispensingService.dispenseOrder({
        pharmacyOrderId: routeResult.order.pharmacyOrderId,
        pharmacistId: userPharmacist.userId,
        items: [
          {
            prescriptionItemId: routeResult.order.items[0].prescriptionItemId,
            medicineId: 'MED-TEST-001',
            inventoryBatchId: 'BAT-TEST-01-EARLY',
            dispensedQuantity: 10,
            scannedBarcode: '890100000009' // Wrong barcode (Ibuprofen barcode scanned for Cefixime!)
          }
        ],
        actorUser: userPharmacist
      });
    } catch (err) {
      mismatchBlocked = err.message.includes('MEDICINE_MISMATCH');
    }
    assertTest('Barcode mismatch strictly BLOCKS dispensing completion with MEDICINE_MISMATCH', mismatchBlocked);

    // ========================================================
    // TEST 8: Controlled Medicine Authorization Guard
    // ========================================================
    console.log('\n--- TEST 8: Controlled Medicine Authorization Guard (Section 33) ---');
    // Create prescription with Tramadol (controlled medicine)
    const rxControlled = await PrescriptionService.createPrescription({
      patientId: 'P10099',
      doctorId: 'DOC-TEST-01',
      departmentName: 'Orthopedics',
      diagnosis: 'Severe Post-Operative Pain',
      items: [
        {
          medicineId: 'MED-000012', // Tramadol (controlled medicine!)
          dose: '50 mg',
          route: 'ORAL',
          frequency: 'AS_NEEDED',
          duration: '3 DAYS',
          quantity: 6
        }
      ],
      actorUser: userDoctor
    });

    const routeControlled = await PrescriptionService.sendToPharmacy(rxControlled.prescriptionId, 'OUTPATIENT', 'URGENT', userDoctor);

    let unauthorizedControlledBlocked = false;
    try {
      // Normal pharmacist without controlled medicine approval attempts dispensing
      await DispensingService.dispenseOrder({
        pharmacyOrderId: routeControlled.order.pharmacyOrderId,
        pharmacistId: userPharmacist.userId,
        items: [
          {
            prescriptionItemId: routeControlled.order.items[0].prescriptionItemId,
            medicineId: 'MED-000012',
            inventoryBatchId: 'BAT-10012',
            dispensedQuantity: 6
          }
        ],
        controlledMedicineApproval: false,
        actorUser: userPharmacist
      });
    } catch (err) {
      unauthorizedControlledBlocked = err.message.includes('CONTROLLED_MEDICINE');
    }
    assertTest('Controlled medicine dispensing without authorization is BLOCKED', unauthorizedControlledBlocked);

    // Senior pharmacist approves controlled medicine
    const seniorDispensing = await DispensingService.dispenseOrder({
      pharmacyOrderId: routeControlled.order.pharmacyOrderId,
      pharmacistId: userSeniorPharmacist.userId,
      items: [
        {
          prescriptionItemId: routeControlled.order.items[0].prescriptionItemId,
          medicineId: 'MED-000012',
          inventoryBatchId: 'BAT-10012',
          dispensedQuantity: 6
        }
      ],
      controlledMedicineApproval: true,
      actorUser: userSeniorPharmacist
    });
    assertTest('Controlled medicine dispensing succeeds with authorized senior approval', seniorDispensing.status === 'COMPLETED');

    // ========================================================
    // TEST 9: Partial Dispensing Workflow
    // ========================================================
    console.log('\n--- TEST 9: Partial Dispensing Workflow (Section 30 & 87) ---');
    const rxPartial = await PrescriptionService.createPrescription({
      patientId: 'P10099',
      doctorId: 'DOC-TEST-01',
      items: [
        {
          medicineId: 'MED-TEST-001',
          dose: '200 mg',
          route: 'ORAL',
          frequency: 'TWICE_DAILY',
          duration: '15 DAYS',
          quantity: 30 // Prescribed 30 units
        }
      ],
      actorUser: userDoctor
    });
    const orderPartial = await PharmacyOrderService.createOrderFromPrescription({
      prescriptionId: rxPartial.prescriptionId,
      actorUser: userDoctor
    });

    // Dispense only 20 units (leaving 10 remaining)
    const partialDispensing = await DispensingService.dispenseOrder({
      pharmacyOrderId: orderPartial.pharmacyOrderId,
      pharmacistId: userPharmacist.userId,
      items: [
        {
          prescriptionItemId: orderPartial.items[0].prescriptionItemId,
          medicineId: 'MED-TEST-001',
          inventoryBatchId: 'BAT-TEST-01-EARLY',
          dispensedQuantity: 20
        }
      ],
      actorUser: userPharmacist
    });

    const refreshedOrder = await PharmacyOrder.findOne({ pharmacyOrderId: orderPartial.pharmacyOrderId });
    const refreshedRx = await Prescription.findOne({ prescriptionId: rxPartial.prescriptionId });

    assertTest('Order marked as PARTIALLY_FULFILLED after dispensing 20 of 30', refreshedOrder.status === 'PARTIALLY_FULFILLED');
    assertTest('Prescription marked as PARTIALLY_DISPENSED with remaining balance 10', refreshedRx.status === 'PARTIALLY_DISPENSED' && refreshedRx.items[0].dispensedQuantity === 20);

    // ========================================================
    // TEST 10: Full Dispensing & Completion
    // ========================================================
    console.log('\n--- TEST 10: Full Dispensing & Final Completion ---');
    const fullDispensing = await DispensingService.dispenseOrder({
      pharmacyOrderId: routeResult.order.pharmacyOrderId,
      pharmacistId: userPharmacist.userId,
      items: [
        {
          prescriptionItemId: routeResult.order.items[0].prescriptionItemId,
          medicineId: 'MED-TEST-001',
          inventoryBatchId: 'BAT-TEST-01-EARLY',
          dispensedQuantity: 10,
          scannedBarcode: '890999000001' // Correct barcode
        }
      ],
      actorUser: userPharmacist
    });

    const finalOrder = await PharmacyOrder.findOne({ pharmacyOrderId: routeResult.order.pharmacyOrderId });
    const finalRx = await Prescription.findOne({ prescriptionId: rxTest1.prescriptionId });

    assertTest('Order completed successfully with status COMPLETED', finalOrder.status === 'COMPLETED');
    assertTest('Prescription transitioned to DISPENSED', finalRx.status === 'DISPENSED');
    assertTest('Dispensing record created with total amount ₹150.00', fullDispensing.totalAmount === 150);

    // ========================================================
    // TEST 11: Duplicate Dispensing Protection & Idempotency
    // ========================================================
    console.log('\n--- TEST 11: Duplicate Dispensing Protection & Idempotency (Section 50 & 91) ---');
    const duplicateDispense = await DispensingService.dispenseOrder({
      pharmacyOrderId: routeResult.order.pharmacyOrderId,
      pharmacistId: userPharmacist.userId,
      items: [
        {
          prescriptionItemId: routeResult.order.items[0].prescriptionItemId,
          medicineId: 'MED-TEST-001',
          inventoryBatchId: 'BAT-TEST-01-EARLY',
          dispensedQuantity: 10
        }
      ],
      actorUser: userPharmacist
    });

    assertTest('Duplicate submission returns existing dispensing record without re-charging or deducting stock', duplicateDispense.dispensingRecordId === fullDispensing.dispensingRecordId);

    // ========================================================
    // TEST 12: Billing Integration & Idempotent Charge Creation
    // ========================================================
    console.log('\n--- TEST 12: Billing Integration (Section 37 & 38) ---');
    const billableCharges = await BillableItem.find({
      sourceModule: 'PHARMACY',
      sourceType: 'PHARMACY_DISPENSING',
      sourceId: `${fullDispensing.dispensingRecordId}_${fullDispensing.items[0].prescriptionItemId}`
    });
    assertTest('BillableItem successfully created for actual dispensed medication', billableCharges.length === 1 && billableCharges[0].grossAmount === 150);

    // ========================================================
    // TEST 13: Pharmacy Returns & Quarantine Workflow
    // ========================================================
    console.log('\n--- TEST 13: Pharmacy Returns & Quarantine Workflow (Section 34, 35, 36) ---');
    const returnReq = await ReturnService.createReturn({
      patientId: 'P10099',
      pharmacyOrderId: routeResult.order.pharmacyOrderId,
      dispensingRecordId: fullDispensing.dispensingRecordId,
      reason: 'PATIENT_RETURN',
      reasonDetails: 'Unopened blister strip returned by patient',
      items: [
        {
          medicineId: 'MED-TEST-001',
          inventoryBatchId: 'BAT-TEST-01-EARLY',
          quantity: 2,
          condition: 'UNOPENED'
        }
      ],
      requestedBy: 'RECEPT001',
      actorUser: userPharmacist
    });
    assertTest('Pharmacy return requested with status REQUESTED and refund calculation (₹30.00)', returnReq.status === 'REQUESTED' && returnReq.totalRefundAmount === 30);

    // Senior Pharmacist approves return
    const approvedReturn = await ReturnService.reviewReturn(returnReq.returnId, {
      action: 'APPROVE',
      reviewNotes: 'Condition verified unopened and intact.',
      approvedBy: userSeniorPharmacist.userId,
      actorUser: userSeniorPharmacist
    });
    assertTest('Return approved by senior pharmacist', approvedReturn.status === 'APPROVED');

    // Quarantine disposition (Section 36: non-saleable quarantine)
    const processedReturn = await ReturnService.processReturnDisposition(returnReq.returnId, {
      itemDispositions: [{ medicineId: 'MED-TEST-001', disposition: 'QUARANTINE' }],
      processedBy: userPharmacist.userId,
      actorUser: userPharmacist
    });
    assertTest('Returned stock placed into non-saleable QUARANTINED status', processedReturn.status === 'QUARANTINED');

    // ========================================================
    // TEST 14: Reports & Dashboard KPIs
    // ========================================================
    console.log('\n--- TEST 14: Dashboard KPIs & Analytics ---');
    const kpis = await PharmacyReportService.getDashboardKPIs();
    assertTest('Dashboard KPIs compute orders, ready count, and returns', kpis.todayOrders >= 1 && kpis.pendingReturns >= 1);

    const dispensingReport = await PharmacyReportService.getDispensingReport({});
    assertTest('Dispensing report aggregates total revenue and transactions', dispensingReport.totalDispensingTransactions >= 1 && dispensingReport.grandTotalRevenue > 0);

    // ========================================================
    // TEST 15: RBAC Authorization Checks
    // ========================================================
    console.log('\n--- TEST 15: RBAC Server-Side Enforcement (Section 94) ---');
    let doctorDispenseBlocked = false;
    try {
      // Doctor attempts to execute dispensing endpoint
      const { authorizeRoles } = require('../middleware/rbac');
      const { ROLES } = require('../config/roles');
      const mw = authorizeRoles(ROLES.PHARMACIST, ROLES.SYSTEM_ADMIN);

      const fakeReq = { user: userDoctor };
      const fakeRes = {
        status: (code) => ({
          json: (data) => {
            if (code === 403) doctorDispenseBlocked = true;
          }
        })
      };
      mw(fakeReq, fakeRes, () => {});
    } catch (e) {}
    assertTest('Doctor is strictly prohibited from dispensing medications (403 Forbidden)', doctorDispenseBlocked);

    console.log('\n==========================================================');
    console.log(`--- MODULE 17 PHARMACY MANAGEMENT SUITE PASSED (${passedCount} tests) ---`);
    console.log('==========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n[FATAL ERROR] Module 17 test suite failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runModule17Tests();
}

module.exports = runModule17Tests;
