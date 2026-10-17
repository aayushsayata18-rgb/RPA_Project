const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const ExamService = require('../services/radiology/examService');
const ModalityService = require('../services/radiology/modalityService');
const OrderService = require('../services/radiology/orderService');
const ScheduleService = require('../services/radiology/scheduleService');
const StudyService = require('../services/radiology/studyService');
const ReportService = require('../services/radiology/reportService');
const RadiologyBillingService = require('../services/radiology/billingService');
const RadiologyInventoryService = require('../services/radiology/inventoryService');
const RisIntegrationService = require('../services/radiology/risIntegrationService');
const PacsIntegrationService = require('../services/radiology/pacsIntegrationService');
const RadiologyRpaService = require('../services/radiology/radiologyRpaService');
const ExceptionService = require('../services/radiology/exceptionService');

const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const RadiologyExam = require('../models/RadiologyExam');
const RadiologyModality = require('../models/RadiologyModality');
const RadiologyOrder = require('../models/RadiologyOrder');
const RadiologySchedule = require('../models/RadiologySchedule');
const RadiologyStudy = require('../models/RadiologyStudy');
const RadiologyReport = require('../models/RadiologyReport');
const RadiologyException = require('../models/RadiologyException');
const BillingCharge = require('../models/BillingCharge');
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
    console.log('   MODULE 22: RADIOLOGY ADMINISTRATION TEST SUITE     ');
    console.log('======================================================\n');

    const adminUser = await User.findOne({ role: 'SYSTEM_ADMIN' }) || {
      userId: 'ADM001',
      role: 'SYSTEM_ADMIN',
      _id: new mongoose.Types.ObjectId(),
      firstName: 'System',
      lastName: 'Admin'
    };
    const techUser = await User.findOne({ role: 'RADIOLOGY_TECHNICIAN' }) || {
      userId: 'RADTECH001',
      role: 'RADIOLOGY_TECHNICIAN',
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Marcus',
      lastName: 'Vance'
    };
    const radiologistUser = {
      userId: 'RAD001',
      role: 'DOCTOR',
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Dr. Helen',
      lastName: 'Cho'
    };
    const patient = await Patient.findOne() || {
      _id: new mongoose.Types.ObjectId(),
      patientId: 'P10001',
      firstName: 'Aarav',
      lastName: 'Patel'
    };
    const doctor = await Doctor.findOne() || {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Rajesh',
      lastName: 'Verma'
    };

    // --- TEST 1: Exam Catalog & Modality Setup ---
    console.log('\n--- 1. Examination Catalog & Modality Registration ---');
    const examCode = `RAD-CT-TEST-${Date.now().toString().slice(-4)}`;
    const newExam = await ExamService.createExam(
      {
        code: examCode,
        name: 'Contrast Enhanced Thoracic CT',
        category: 'COMPUTED_TOMOGRAPHY',
        modalityType: 'CT',
        bodyPart: 'Chest / Thorax',
        description: 'Multi-slice contrast CT for pulmonary and mediastinal evaluation.',
        preparationInstructions: '4 hours NPO fasting. Serum creatinine required.',
        fastingRequired: true,
        appointmentRequired: true,
        estimatedDurationMinutes: 25,
        turnaroundTimeMinutes: 60,
        priceReference: 450,
        requiresContrast: true
      },
      adminUser
    );
    assert(newExam && newExam.examId && newExam.code === examCode, 'Create Radiology Exam in catalog');

    const modalityCode = `MOD-CT-${Date.now().toString().slice(-4)}`;
    const newModality = await ModalityService.createModality(
      {
        modalityId: modalityCode,
        name: '128-Slice High Definition CT Suite',
        type: 'CT',
        room: 'CT Room 204, East Wing',
        status: 'AVAILABLE',
        operatingHours: {
          start: '08:00',
          end: '20:00',
          slotDurationMinutes: 30,
          bufferMinutes: 10
        }
      },
      adminUser
    );
    assert(newModality && newModality.modalityId === modalityCode, 'Register Modality Suite');
    assert(newModality.status === 'AVAILABLE', 'Modality status verified as AVAILABLE');

    // --- TEST 2: Radiology Order Placement & 72h Duplicate Prevention ---
    console.log('\n--- 2. Order Placement & 72h Duplicate Prevention ---');
    const dupPreCheck = await OrderService.checkDuplicateOrder({
      patientId: patient._id,
      examId: newExam._id
    });
    assert(dupPreCheck.isDuplicate === false, 'Pre-order duplicate check confirms no duplicate orders exist');

    const orderRes = await OrderService.createOrder({
      patientId: patient._id,
      orderingDoctorId: doctor._id,
      examId: newExam._id,
      priority: 'URGENT',
      clinicalIndication: 'Suspected pulmonary embolism with pleuritic chest pain.',
      contraindications: 'No known allergy to iodinated contrast.',
      requiresContrast: true,
      allergiesNoted: 'None reported',
      fastingRequired: true,
      provisionalDiagnosis: 'Pulmonary Embolism',
      user: adminUser
    });
    assert(orderRes && orderRes.orderId.startsWith('RAD-'), `Radiology order placed: ${orderRes.orderId}`);
    assert(orderRes.status === 'PREPARATION_REQUIRED' || orderRes.status === 'ORDERED', 'Order status flags preparation requirement');

    // Duplicate check must now detect existing active order within 72h
    const dupPostCheck = await OrderService.checkDuplicateOrder({
      patientId: patient._id,
      examId: newExam._id
    });
    assert(dupPostCheck.isDuplicate === true, 'Duplicate order detection flags active order within 72-hour window');

    // Attempting duplicate creation without override must throw error
    let duplicateBlocked = false;
    try {
      await OrderService.createOrder({
        patientId: patient._id,
        orderingDoctorId: doctor._id,
        examId: newExam._id,
        priority: 'ROUTINE',
        clinicalIndication: 'Duplicate test attempt',
        user: adminUser
      });
    } catch (e) {
      duplicateBlocked = e.code === 'DUPLICATE_RADIOLOGY_ORDER';
    }
    assert(duplicateBlocked, 'Unapproved duplicate order requisition blocked by clinical validation');

    // --- TEST 3: Concurrency-Safe Modality Scheduling & Conflict Prevention ---
    console.log('\n--- 3. Modality Scheduling & Anti-Double-Booking Protection ---');
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    tomorrow.setHours(10, 0, 0, 0);
    const slotStart = new Date(tomorrow);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60000);

    const schedule = await ScheduleService.bookSchedule({
      orderId: orderRes._id,
      modalityId: newModality._id,
      scheduledStart: slotStart,
      scheduledEnd: slotEnd,
      notes: 'Scheduled for contrast thoracic CT',
      user: adminUser
    });
    assert(schedule && schedule.scheduleId.startsWith('RAD-SCH-'), `Schedule booked: ${schedule.scheduleId}`);
    assert(schedule.status === 'CONFIRMED', 'Schedule status is CONFIRMED');

    // Overlapping slot booking attempt on same modality MUST throw conflict error (HTTP 409)
    let conflictPrevented = false;
    try {
      const overlapStart = new Date(slotStart.getTime() + 15 * 60000);
      const overlapEnd = new Date(slotEnd.getTime() + 15 * 60000);
      await ScheduleService.bookSchedule({
        orderId: orderRes._id,
        modalityId: newModality._id,
        scheduledStart: overlapStart,
        scheduledEnd: overlapEnd,
        user: adminUser
      });
    } catch (e) {
      conflictPrevented = e.code === 'RAD_SLOT_CONFLICT';
    }
    assert(conflictPrevented, 'Concurrency conflict / double-booking prevented on modality slot');

    // --- TEST 4: Reception Patient Check-In & Safety Questionnaire ---
    console.log('\n--- 4. Reception Check-In & Safety Screening ---');
    const checkInResult = await ScheduleService.checkIn({
      scheduleId: schedule.scheduleId,
      preparationConfirmed: true,
      notes: 'Patient completed 4h fasting. Renal function eGFR: 88 mL/min (normal).',
      user: adminUser
    });
    const checkedInSchedule = checkInResult.schedule || checkInResult;
    assert(checkedInSchedule.status === 'CHECKED_IN', 'Schedule status transitioned to CHECKED_IN');

    // Incomplete preparation check
    const prepExceptionSchedule = await ScheduleService.bookSchedule({
      orderId: orderRes._id,
      modalityId: newModality._id,
      scheduledStart: new Date(Date.now() + 48 * 3600 * 1000),
      user: adminUser
    });
    await ScheduleService.checkIn({
      scheduleId: prepExceptionSchedule.scheduleId,
      preparationConfirmed: false,
      notes: 'Patient drank milk 1 hour ago',
      user: adminUser
    });
    const prepException = await RadiologyException.findOne({
      scheduleId: prepExceptionSchedule._id,
      type: 'PREPARATION_INCOMPLETE'
    });
    assert(prepException !== null, 'Incomplete patient prep routes to RadiologyException');

    // --- TEST 5: Procedure Execution & Atomic Accession Generation ---
    console.log('\n--- 5. Procedure Execution & Atomic Accession Number Generation ---');
    const startedStudy = await StudyService.startExamination(orderRes._id, {
      modalityId: newModality._id,
      user: techUser
    });
    assert(startedStudy.accessionNumber.startsWith('RAD-ACC-'), `Atomic accession number assigned: ${startedStudy.accessionNumber}`);
    assert(startedStudy.studyStatus === 'IN_PROGRESS', 'Study status transitioned to IN_PROGRESS');

    const completedStudy = await StudyService.completeExamination(startedStudy._id, {
      imageCount: 120,
      contrastAdministered: true,
      contrastDetails: {
        agentName: 'Omnipaque 350',
        lotNumber: 'LOT-OMNI-2026-9',
        doseMl: 75,
        route: 'IV'
      },
      technicianNotes: 'IV contrast administered smoothly without extravasation. Scan complete.',
      user: techUser
    });
    assert(completedStudy.studyStatus === 'COMPLETED', 'Study marked as COMPLETED');
    assert(completedStudy.imageReference.includes(startedStudy.accessionNumber), 'PACS mock image link populated');

    // --- TEST 6: Reporting Draft, Radiologist Verification & Release ---
    console.log('\n--- 6. Diagnostic Reporting Draft, Verification & Release ---');
    const draftReport = await ReportService.createDraftReport({
      studyId: completedStudy._id,
      findings: 'Thoracic aorta and main pulmonary arteries opacified. No filling defect identified. Lungs are clear.',
      impression: 'Negative for acute pulmonary embolism. Normal thoracic contrast CT.',
      recommendations: 'No further imaging needed at this time.',
      user: radiologistUser
    });
    assert(draftReport.reportNumber.startsWith('RAD-RPT-'), `Report drafted: ${draftReport.reportNumber}`);
    assert(draftReport.status === 'DRAFT', 'Report status is DRAFT');

    const verifiedReport = await ReportService.verifyReport(draftReport._id, radiologistUser);
    assert(verifiedReport.status === 'FINALIZED', 'Report verified and signed by radiologist (FINALIZED)');

    const releasedReport = await ReportService.releaseReport(verifiedReport._id, radiologistUser);
    assert(releasedReport.status === 'RELEASED', 'Report released to patient and referring physician');
    assert(releasedReport.releasedAt !== null, 'Report release timestamp recorded');

    // --- TEST 7: Auditable Amendment Versioning ---
    console.log('\n--- 7. Auditable Amendment Workflow ---');
    const amendedReport = await ReportService.amendReport(
      releasedReport._id,
      {
        amendmentReason: 'Secondary review with comparison to previous 2025 non-contrast CT',
        findings: 'Compared to baseline scan dated 14-Aug-2025. Stable cardiothoracic silhouette. No pulmonary embolism.',
        impression: 'Stable normal thoracic CT. No acute cardiopulmonary disease.',
        user: radiologistUser
      }
    );
    assert(amendedReport.reportVersion === 2, `Amended report version incremented to V${amendedReport.reportVersion}`);
    assert(amendedReport.isAmended === true, 'Report flagged as amended');
    assert(amendedReport.previousReportId.toString() === releasedReport._id.toString(), 'Links to previous report version');

    const originalRechecked = await RadiologyReport.findById(releasedReport._id);
    assert(originalRechecked.status === 'AMENDED', 'Original report version archived with status AMENDED');

    // --- TEST 8: Billing Idempotency & Inventory Deductions ---
    console.log('\n--- 8. Automated Billing & Inventory Deductions ---');
    const billing1 = await RadiologyBillingService.createRadiologyCharge({
      order: orderRes,
      study: completedStudy,
      user: adminUser
    });
    assert(billing1.charge && billing1.charge.serviceType === 'RADIOLOGY', 'Initial billing charge verified for study');

    const billing2 = await RadiologyBillingService.createRadiologyCharge({
      order: orderRes,
      study: completedStudy,
      user: adminUser
    });
    assert(billing2.isDuplicatePrevented === true, 'Duplicate billing charge strictly prevented');

    const invItem = await InventoryItem.findOne() || { _id: new mongoose.Types.ObjectId(), name: 'Omnipaque 350 Contrast Vial' };
    const inv1 = await RadiologyInventoryService.recordConsumableUsage({
      study: completedStudy,
      consumables: [{ itemId: invItem._id, quantity: 1, itemName: 'Omnipaque 350' }],
      user: techUser
    });
    assert(Array.isArray(inv1) && inv1[0].movement, 'Contrast inventory consumption movement recorded');

    const inv2 = await RadiologyInventoryService.recordConsumableUsage({
      study: completedStudy,
      consumables: [{ itemId: invItem._id, quantity: 1, itemName: 'Omnipaque 350' }],
      user: techUser
    });
    assert(Array.isArray(inv2) && inv2[0].isDuplicate === true, 'Duplicate consumable inventory deduction prevented');

    // --- TEST 9: Mock RIS / PACS Sync & RPA Automation ---
    console.log('\n--- 9. Mock RIS/PACS Integration & RPA Bot Automation ---');
    const risSync = await RisIntegrationService.syncOrderToRis(orderRes._id, adminUser);
    assert(risSync.success === true && risSync.externalRisOrderId, `RIS Order Synced: ${risSync.externalRisOrderId}`);

    const pacsSync = await PacsIntegrationService.syncPacsMetadata(completedStudy.accessionNumber, adminUser);
    assert(pacsSync.success === true && (pacsSync.externalStudyUID || pacsSync.studyUID), 'PACS metadata synchronized');

    const rpaJob = await RadiologyRpaService.triggerJob({
      operation: 'RAD_ORDER_EXTERNAL_SYNC',
      entityId: orderRes.orderId,
      dryRun: true,
      user: adminUser
    });
    assert(rpaJob && rpaJob.jobId, `RPA Bot Job created: ${rpaJob.jobId}`);
    assert(rpaJob.status === 'SUCCESS' || rpaJob.status === 'QUEUED', 'RPA Job registered with valid status');

    // --- TEST 10: Operational Exception Resolution Lifecycle ---
    console.log('\n--- 10. Operational Exception Resolution Lifecycle ---');
    const openExceptions = await ExceptionService.listExceptions({ status: 'OPEN' });
    assert(openExceptions.length > 0, `Found ${openExceptions.length} active exceptions in queue`);

    const targetExc = openExceptions[0];
    const resolvedExc = await ExceptionService.resolveException(
      targetExc.exceptionId,
      'Reviewed with clinical supervisor and rescheduled appropriately.',
      adminUser
    );
    assert(resolvedExc.status === 'RESOLVED', 'Radiology exception resolved with audit notes');

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
