const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const LabTestService = require('../services/laboratory/labTestService');
const LabOrderService = require('../services/laboratory/labOrderService');
const SampleService = require('../services/laboratory/sampleService');
const ResultService = require('../services/laboratory/resultService');
const ReportService = require('../services/laboratory/reportService');
const LaboratoryBillingService = require('../services/laboratory/billingService');
const LaboratoryInventoryService = require('../services/laboratory/inventoryService');
const LisIntegrationService = require('../services/laboratory/lisIntegrationService');
const LaboratoryRpaService = require('../services/laboratory/laboratoryRpaService');

const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const LabTest = require('../models/LabTest');
const LabOrder = require('../models/LabOrder');
const LabOrderItem = require('../models/LabOrderItem');
const LabSample = require('../models/LabSample');
const LabResult = require('../models/LabResult');
const LabReport = require('../models/LabReport');
const LabException = require('../models/LabException');
const BillingCharge = require('../models/BillingCharge');
const InventoryMovement = require('../models/InventoryMovement');
const InventoryItem = require('../models/InventoryItem');

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  };

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('\n======================================================');
    console.log('   MODULE 21: LABORATORY ADMINISTRATION TEST SUITE    ');
    console.log('======================================================\n');

    const adminUser = await User.findOne({ role: 'SYSTEM_ADMIN' }) || { userId: 'ADM001', role: 'SYSTEM_ADMIN', _id: new mongoose.Types.ObjectId() };
    const techUser = await User.findOne({ role: 'LAB_TECHNICIAN' }) || { userId: 'TECH001', role: 'LAB_TECHNICIAN', _id: new mongoose.Types.ObjectId(), firstName: 'Pooja', lastName: 'Verma' };
    const verifierUser = { userId: 'PATH001', role: 'DOCTOR', _id: new mongoose.Types.ObjectId(), firstName: 'Dr. Ananya', lastName: 'Roy' };
    const patient = await Patient.findOne() || { _id: new mongoose.Types.ObjectId(), patientId: 'P10045', firstName: 'Aarav', lastName: 'Sharma' };
    const doctor = await Doctor.findOne() || { _id: new mongoose.Types.ObjectId() };

    // --- TEST 1: Test Master Catalog Operations ---
    console.log('\n--- 1. Laboratory Test Master Catalog ---');
    const testCode = `TEST_RPA_${Date.now().toString().slice(-4)}`;
    const newTest = await LabTestService.createTest(
      {
        code: testCode,
        name: 'Serum Electrolytes Ion-Selective Electrode',
        category: 'BIOCHEMISTRY',
        specimenType: 'SERUM',
        containerType: 'SERUM_SEPARATOR_GOLD',
        priceReference: 550,
        parameters: [
          { code: 'NA', name: 'Sodium', unit: 'mmol/L', referenceRange: '135 - 145' },
          { code: 'K', name: 'Potassium', unit: 'mmol/L', referenceRange: '3.5 - 5.0' },
          { code: 'CL', name: 'Chloride', unit: 'mmol/L', referenceRange: '98 - 107' }
        ]
      },
      adminUser
    );
    assert(newTest && newTest.labTestId && newTest.code === testCode, 'Create Lab Test in catalog');

    const updatedTest = await LabTestService.updateTestStatus(newTest.labTestId, 'ACTIVE', adminUser);
    assert(updatedTest.status === 'ACTIVE', 'Update Test status to ACTIVE');

    // --- TEST 2: Lab Order Creation & Duplicate Detection ---
    console.log('\n--- 2. Lab Order Creation & Duplicate Detection ---');
    const orderRes = await LabOrderService.createOrder({
      patientId: patient._id,
      patientCode: patient.patientId,
      orderingDoctorId: doctor._id,
      testIds: [newTest.code],
      priority: 'URGENT',
      clinicalNote: 'Suspected electrolyte imbalance.',
      source: 'DOCTOR_PORTAL',
      user: adminUser
    });
    const order = orderRes.order;
    const items = orderRes.items;
    assert(order && order.orderId.startsWith('LAB-'), `Order created with ID ${order.orderId}`);
    assert(items.length === 1 && items[0].testCodeSnapshot === testCode, 'Order Item correctly created with snapshot');

    // Duplicate check must detect this active order
    const dupCheck = await LabOrderService.checkDuplicateOrder({
      patientId: patient._id,
      testCodes: [testCode]
    });
    assert(dupCheck.isDuplicate === true, 'Duplicate Lab Order correctly detected for open test');

    // Attempting duplicate creation without override MUST throw
    let duplicateBlocked = false;
    try {
      await LabOrderService.createOrder({
        patientId: patient._id,
        patientCode: patient.patientId,
        orderingDoctorId: doctor._id,
        testIds: [newTest.code],
        user: adminUser
      });
    } catch (e) {
      duplicateBlocked = e.code === 'DUPLICATE_LAB_ORDER';
    }
    assert(duplicateBlocked, 'Duplicate order creation blocked by system validation');

    // --- TEST 3: Accessioning & Sample Collection ---
    console.log('\n--- 3. Accessioning & Sample Collection ---');
    const orderItem = items[0];
    const registeredSample = await LabSample.findOne({ orderItemId: orderItem._id });
    assert(registeredSample && registeredSample.accessionNumber.startsWith('ACC-'), `Accession Number generated: ${registeredSample.accessionNumber}`);

    const collectedSample = await SampleService.collectSample({
      sampleIdOrAccession: registeredSample.accessionNumber,
      collectionLocation: 'WARD_4_BED_12',
      notes: 'Clean venipuncture performed',
      user: techUser
    });
    assert(collectedSample.status === 'COLLECTED', 'Sample marked as COLLECTED');

    const receivedSample = await SampleService.receiveSample({
      identifier: collectedSample.accessionNumber,
      processingLocation: 'BIOCHEMISTRY_BENCH_1',
      user: techUser
    });
    assert(receivedSample.status === 'RECEIVED', 'Sample successfully received in lab');

    const acceptedSample = await SampleService.acceptSample({
      identifier: receivedSample.accessionNumber,
      user: techUser
    });
    assert(acceptedSample.status === 'ACCEPTED', 'Sample accepted for analytical processing');

    // --- TEST 4: Sample Rejection Workflow ---
    console.log('\n--- 4. Sample Rejection & Operational Exception ---');
    const rejOrderRes = await LabOrderService.createOrder({
      patientId: patient._id,
      patientCode: patient.patientId,
      orderingDoctorId: doctor._id,
      testIds: [newTest.code],
      allowDuplicateOverride: true,
      user: adminUser
    });
    const rejItem = rejOrderRes.items[0];
    const rejSample = await LabSample.findOne({ orderItemId: rejItem._id });

    const rejectRes = await SampleService.rejectSample({
      identifier: rejSample.accessionNumber,
      rejectionReason: 'LEAKED_CONTAINER',
      rejectionNotes: 'Sample container cap compromised during transit.',
      recollectionRequired: true,
      user: techUser
    });
    assert(rejectRes.sample.status === 'REJECTED', 'Sample status updated to REJECTED');
    assert(rejectRes.exception && rejectRes.exception.type === 'SAMPLE_REJECTED', 'LabException created for rejected sample');

    // --- TEST 5: Result Entry, Segregation of Duties & Verification ---
    console.log('\n--- 5. Result Entry, Segregation of Duties & Verification ---');
    const enteredResult = await ResultService.enterResult({
      orderItemId: orderItem._id,
      resultValue: '138',
      unit: 'mmol/L',
      referenceRangeSnapshot: '135 - 145 mmol/L',
      abnormalFlag: 'NORMAL',
      parameters: [
        { parameterCode: 'NA', parameterName: 'Sodium', resultValue: '138', unit: 'mmol/L', referenceRangeSnapshot: '135 - 145' },
        { parameterCode: 'K', parameterName: 'Potassium', resultValue: '4.2', unit: 'mmol/L', referenceRangeSnapshot: '3.5 - 5.0' },
        { parameterCode: 'CL', parameterName: 'Chloride', resultValue: '102', unit: 'mmol/L', referenceRangeSnapshot: '98 - 107' }
      ],
      technicianNotes: 'Calibrated analyzer run #4.',
      submitForVerification: true,
      user: techUser
    });
    assert(enteredResult.status === 'PENDING_VERIFICATION', 'Result entered and submitted for verification');

    const verifiedResult = await ResultService.verifyResult({
      resultId: enteredResult.resultId,
      verifierNotes: 'Electrochemistry profile confirmed.',
      user: verifierUser
    });
    assert(verifiedResult.status === 'VERIFIED', `Result ${verifiedResult.resultId} verified`);

    // --- TEST 6: Controlled Result Amendment ---
    console.log('\n--- 6. Controlled Result Amendment ---');
    const amendedResult = await ResultService.amendResult({
      resultId: verifiedResult.resultId,
      amendmentReason: 'Repeat run requested by treating doctor for second confirmation',
      resultValue: '139',
      parameters: [
        { parameterCode: 'NA', parameterName: 'Sodium', resultValue: '139', unit: 'mmol/L', referenceRangeSnapshot: '135 - 145' },
        { parameterCode: 'K', parameterName: 'Potassium', resultValue: '4.3', unit: 'mmol/L', referenceRangeSnapshot: '3.5 - 5.0' },
        { parameterCode: 'CL', parameterName: 'Chloride', resultValue: '103', unit: 'mmol/L', referenceRangeSnapshot: '98 - 107' }
      ],
      user: verifierUser
    });
    assert(amendedResult.status === 'AMENDED' && amendedResult.version === 2, 'Result amended to version 2');
    assert(amendedResult.auditTrail.length >= 3, 'Audit trail records entry, verification, and amendment');

    // --- TEST 7: Report Generation, Finalization & Release ---
    console.log('\n--- 7. Lab Report Generation & Release ---');
    const report = await ReportService.generateReport({
      orderId: order.orderId,
      clinicalComments: 'Normal serum electrolytes.',
      user: verifierUser
    });
    assert(report && report.reportNumber.startsWith('LAB-RPT-'), `Report generated: ${report.reportNumber}`);

    const releasedReport = await ReportService.releaseReport({
      reportIdentifier: report.reportNumber,
      user: verifierUser
    });
    assert(releasedReport.status === 'RELEASED', 'Report status marked as RELEASED');

    // Audit download
    const downloadedReport = await ReportService.recordReportDownload({
      reportIdentifier: releasedReport.reportNumber,
      user: adminUser,
      ipAddress: '127.0.0.1'
    });
    assert(downloadedReport.downloadAuditLog.length > 0, 'Report download audited with IP and timestamp');

    // --- TEST 8: Billing Idempotency ---
    console.log('\n--- 8. Billing Integration & Idempotency ---');
    const billing1 = await LaboratoryBillingService.createChargeForOrderItem({
      order,
      orderItem,
      user: adminUser
    });
    const billing2 = await LaboratoryBillingService.createChargeForOrderItem({
      order,
      orderItem,
      user: adminUser
    });
    assert(billing2.isDuplicate === true, 'Billing duplicate prevention preserved existing charge without duplicate charges');

    // --- TEST 9: Inventory Consumable Deduction & Duplicate Protection ---
    console.log('\n--- 9. Medical Inventory Consumption & Duplicate Protection ---');
    const invItem = await InventoryItem.findOne() || { inventoryItemId: 'INV-TEST-001', name: 'Electrolyte Reagent Kit' };
    const inv1 = await LaboratoryInventoryService.consumeConsumable({
      orderItemId: orderItem.orderItemId,
      inventoryItemId: invItem.inventoryItemId,
      quantity: 1,
      user: techUser
    });
    assert(inv1.isDuplicate === false && inv1.movement, 'Consumable movement recorded');

    const inv2 = await LaboratoryInventoryService.consumeConsumable({
      orderItemId: orderItem.orderItemId,
      inventoryItemId: invItem.inventoryItemId,
      quantity: 1,
      user: techUser
    });
    assert(inv2.isDuplicate === true, 'Duplicate inventory consumption strictly prevented');

    // --- TEST 10: Mock External LIS Sync, Mismatch Handling & Reconciliation ---
    console.log('\n--- 10. External LIS Synchronization & RPA ---');
    const lisSync = await LisIntegrationService.syncOrderToExternalLis({
      orderIdentifier: order.orderId,
      user: adminUser
    });
    assert(lisSync.success === true && lisSync.externalLisOrderId, `External LIS Synced: ${lisSync.externalLisOrderId}`);

    // Idempotent LIS sync attempt
    const lisSyncDup = await LisIntegrationService.syncOrderToExternalLis({
      orderIdentifier: order.orderId,
      user: adminUser
    });
    assert(lisSyncDup.isDuplicate === true, 'External LIS order synchronization idempotency verified');

    // RPA Job trigger and execution
    const rpaJob = await LaboratoryRpaService.triggerLabRpaJob({
      action: 'LAB_LIS_ORDER_ENTRY',
      orderId: order.orderId,
      user: adminUser
    });
    assert(rpaJob && rpaJob.jobId, `RPA Job created: ${rpaJob.jobId}`);

    const rpaExec = await LaboratoryRpaService.executeLabRpaJob({
      jobId: rpaJob.jobId,
      user: adminUser
    });
    assert(rpaExec.job.status === 'SUCCESS', 'RPA Job executed successfully');

    // LIS Mismatch simulation creates exception
    const mismatchRes = await LisIntegrationService.syncOrderToExternalLis({
      orderIdentifier: rejOrderRes.order.orderId,
      simulateMismatch: true,
      user: adminUser
    });
    assert(mismatchRes.success === false && mismatchRes.exception.type === 'PATIENT_MISMATCH', 'External identity mismatch stopped and routed to exception');

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
