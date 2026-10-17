const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const AreaService = require('../services/housekeeping/areaService');
const ChecklistService = require('../services/housekeeping/checklistService');
const ScheduleService = require('../services/housekeeping/scheduleService');
const TaskService = require('../services/housekeeping/taskService');
const InspectionService = require('../services/housekeeping/inspectionService');
const SupplyService = require('../services/housekeeping/supplyService');
const ExceptionService = require('../services/housekeeping/exceptionService');
const BedIntegrationService = require('../services/housekeeping/bedIntegrationService');
const HousekeepingRpaService = require('../services/housekeeping/housekeepingRpaService');

const HousekeepingArea = require('../models/HousekeepingArea');
const HousekeepingChecklist = require('../models/HousekeepingChecklist');
const HousekeepingSchedule = require('../models/HousekeepingSchedule');
const HousekeepingTask = require('../models/HousekeepingTask');
const HousekeepingInspection = require('../models/HousekeepingInspection');
const HousekeepingSupplyRequest = require('../models/HousekeepingSupplyRequest');
const HousekeepingException = require('../models/HousekeepingException');
const Bed = require('../models/Bed');
const User = require('../models/User');

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
    console.log('   MODULE 24: HOUSEKEEPING MANAGEMENT TEST SUITE       ');
    console.log('======================================================\n');

    const actorUser = {
      _id: new mongoose.Types.ObjectId(),
      userId: 'HK-SUP-001',
      name: 'Supervisor Sarah Jenkins',
      role: 'HOUSEKEEPING'
    };

    const workerUser = {
      _id: new mongoose.Types.ObjectId(),
      userId: 'HK-WRK-001',
      name: 'Staff John Doe',
      role: 'HOUSEKEEPING'
    };

    // --- 1. Area Registration & Status Management ---
    console.log('--- 1. Facility Area Master & Status Management ---');
    const areaCode = `WARD-A-${Date.now().toString().slice(-4)}`;
    const area = await AreaService.createArea({
      areaCode,
      name: `Special Isolation Room ${areaCode}`,
      areaType: 'PATIENT_ROOM',
      cleaningFrequency: 'DAILY',
      status: 'AVAILABLE',
      notes: 'Test Isolation Area'
    }, actorUser);

    assert(area && area.areaCode === areaCode, 'Create Facility Area master');
    assert(area.status === 'AVAILABLE', 'Initial area status is AVAILABLE');

    const updatedArea = await AreaService.updateAreaStatus(area._id, 'CLEANING_REQUIRED', 'Routine maintenance required', actorUser);
    assert(updatedArea.status === 'CLEANING_REQUIRED', 'Transition Area status to CLEANING_REQUIRED');

    // --- 2. Cleaning Checklist Designer ---
    console.log('\n--- 2. Cleaning Checklist Template Configuration ---');
    const checklistCode = `CHK-DIS-${Date.now().toString().slice(-4)}`;
    const checklist = await ChecklistService.createChecklist({
      checklistCode,
      title: 'Terminal Discharge Disinfection Checklist',
      applicableAreaType: 'PATIENT_ROOM',
      taskType: 'DISCHARGE_TURNOVER',
      items: [
        { itemCode: 'LINEN', label: 'Strip and bag all soiled bed linens', mandatory: true },
        { itemCode: 'SURF', label: 'Disinfect all high-touch horizontal surfaces', mandatory: true },
        { itemCode: 'MOP', label: 'Wet mop floor with hospital-grade disinfectant', mandatory: true }
      ]
    }, actorUser);

    assert(checklist && checklist.checklistCode === checklistCode, 'Create standardized cleaning checklist');
    assert(checklist.items.length === 3, 'Checklist items registered with mandatory flags');

    // --- 3. Routine Schedule Management ---
    console.log('\n--- 3. Routine Housekeeping Schedules ---');
    const scheduleCode = `SCH-DAILY-${Date.now().toString().slice(-4)}`;
    const schedule = await ScheduleService.createSchedule({
      scheduleCode,
      title: 'Daily Morning Corridor Sanitation',
      areaId: area._id,
      frequency: 'DAILY',
      shiftType: 'MORNING',
      priority: 'MEDIUM',
      defaultChecklistId: checklist._id
    }, actorUser);

    assert(schedule && schedule.scheduleCode === scheduleCode, 'Create recurring cleaning schedule');
    assert(schedule.status === 'ACTIVE', 'Schedule initial status is ACTIVE');

    // --- 4. Ad-Hoc Task Lifecycle ---
    console.log('\n--- 4. Housekeeping Task Lifecycle (Create, Assign, Start, Complete, Close) ---');
    const taskRes = await TaskService.createTask({
      areaId: area._id,
      taskType: 'ROUTINE_CLEANING',
      priority: 'HIGH',
      description: 'Spill cleanup in patient room',
      checklistId: checklist._id
    }, actorUser);

    const task = taskRes.task;
    assert(task && task.taskId.startsWith('HK-'), 'Generate atomic Task ID');
    assert(task.status === 'PENDING' || task.status === 'UNASSIGNED', 'Task initial status is PENDING/UNASSIGNED');

    // Assign Task
    const assignedTask = await TaskService.assignTask(task._id, {
      assignedTo: workerUser._id,
      assignedToId: workerUser.userId,
      assignedToName: workerUser.name
    }, actorUser);
    assert(assignedTask.status === 'ASSIGNED', 'Task status transitioned to ASSIGNED');

    // Start Task
    const startedTask = await TaskService.startTask(task._id, {}, workerUser);
    assert(startedTask.status === 'IN_PROGRESS', 'Task status transitioned to IN_PROGRESS');

    // Complete Task with Checklist
    const completedTask = await TaskService.completeTask(task._id, {
      checklistResponses: [
        { itemCode: 'LINEN', completed: true },
        { itemCode: 'SURF', completed: true },
        { itemCode: 'MOP', completed: true }
      ],
      completionNotes: 'Thorough disinfection completed successfully.'
    }, workerUser);
    assert(completedTask.status === 'COMPLETED', 'Task status transitioned to COMPLETED with checklist responses');

    // Close Task
    const closedTask = await TaskService.closeTask(task._id, { closingNotes: 'Task verified and closed.' }, actorUser);
    assert(closedTask.status === 'CLOSED', 'Task status transitioned to CLOSED');

    // --- 5. Bed Turnover Integration & Idempotency ---
    console.log('\n--- 5. Bed Turnover Integration & Anti-Duplicate Protection ---');
    // Find or create a test bed
    let testBed = await Bed.findOne();
    if (!testBed) {
      testBed = await Bed.create({
        bedNumber: 'B-TEST-101',
        ward: 'Ward A',
        status: 'CLEANING_REQUIRED'
      });
    } else {
      testBed.status = 'CLEANING_REQUIRED';
      await testBed.save();
    }

    const turnoverResult1 = await BedIntegrationService.triggerDischargeTurnover({
      bedId: testBed._id,
      bedNumber: testBed.bedNumber,
      admissionId: 'ADM-2026-TEST',
      priority: 'STAT',
      notes: 'Patient discharged. Terminal room turnaround required.'
    }, actorUser);

    assert(turnoverResult1 && turnoverResult1.task, 'Discharge turnover task generated');
    assert(turnoverResult1.task.taskType === 'DISCHARGE_TURNOVER', 'Task type is DISCHARGE_TURNOVER');
    assert(turnoverResult1.task.priority === 'STAT', 'STAT priority preserved for bed turnaround');

    // Idempotency: Triggering again for same bed while task is open must return existing task
    const turnoverResult2 = await BedIntegrationService.triggerDischargeTurnover({
      bedId: testBed._id,
      bedNumber: testBed.bedNumber,
      admissionId: 'ADM-2026-TEST',
      priority: 'STAT'
    }, actorUser);

    assert(turnoverResult2.isExisting === true, 'Anti-duplicate turnover protection prevents duplicate open tasks');
    assert(String(turnoverResult1.task._id) === String(turnoverResult2.task._id), 'Preserves existing turnover task instance');

    // --- 6. Quality Inspection & Rework Trigger ---
    console.log('\n--- 6. Supervisor Quality Inspection & Failed Inspection Rework ---');
    // Perform passing inspection
    const passInspection = await InspectionService.performInspection({
      taskId: completedTask._id,
      areaId: area._id,
      score: 95,
      passed: true,
      findings: 'All surfaces sanitized to infection control standards.',
      rectificationRequired: false
    }, actorUser);

    assert(passInspection && passInspection.passed === true, 'Quality inspection recorded with PASS status');

    // Perform failing inspection on another task -> triggers rework
    const failedInspection = await InspectionService.performInspection({
      taskId: turnoverResult1.task._id,
      areaId: area._id,
      score: 55,
      passed: false,
      findings: 'Surface dust remaining on windowsill. High-touch disinfection incomplete.',
      rectificationRequired: true
    }, actorUser);

    assert(failedInspection && failedInspection.passed === false, 'Quality inspection recorded with FAIL status');
    assert(failedInspection.reworkTaskId != null, 'Failing inspection automatically creates REWORK task');

    // --- 7. Consumables & Cleaning Supplies Management ---
    console.log('\n--- 7. Cleaning Consumables Requisition & Stock Issue ---');
    const supplyReq = await SupplyService.requestSupplies({
      requestedBy: workerUser.name,
      requestedById: workerUser.userId,
      department: 'HOUSEKEEPING',
      shiftType: 'MORNING',
      items: [
        { itemName: 'Chlorine Surface Disinfectant Tabs', quantityRequested: 5, unit: 'BOX' },
        { itemName: 'Microfiber Cleaning Cloths (Blue)', quantityRequested: 20, unit: 'PCS' }
      ],
      notes: 'Morning shift ward sanitation consumables'
    }, workerUser);

    assert(supplyReq && supplyReq.status === 'PENDING', 'Create Consumable Supply Request');

    const approvedSupply = await SupplyService.approveSupplyRequest(supplyReq._id, {
      approvedBy: actorUser.name,
      approvedById: actorUser.userId,
      approvalNotes: 'Approved for morning shift.'
    }, actorUser);
    assert(approvedSupply.status === 'APPROVED', 'Supply request transitioned to APPROVED');

    const issuedSupply = await SupplyService.issueSupplyRequest(supplyReq._id, {
      issuedBy: actorUser.name,
      issuedById: actorUser.userId,
      items: [
        { itemName: 'Chlorine Surface Disinfectant Tabs', quantityIssued: 5, unit: 'BOX' },
        { itemName: 'Microfiber Cleaning Cloths (Blue)', quantityIssued: 20, unit: 'PCS' }
      ]
    }, actorUser);
    assert(issuedSupply.status === 'ISSUED', 'Supply request transitioned to ISSUED');

    // --- 8. Operational Exceptions & Resolution ---
    console.log('\n--- 8. Operational Exceptions (Spills, Biohazard, Maintenance Block) ---');
    const exception = await ExceptionService.createException({
      exceptionType: 'BIOHAZARD_SPILL',
      severity: 'CRITICAL',
      areaId: area._id,
      areaCode: area.areaCode,
      description: 'Major blood spill in trauma corridor. Immediate PPE and biohazard kit required.',
      reportedBy: 'Nurse Clara Vance',
      reportedById: 'EMP-NURSE-01'
    }, actorUser);

    assert(exception && exception.status === 'OPEN', 'Log Critical Biohazard Exception');
    assert(exception.severity === 'CRITICAL', 'Exception severity marked as CRITICAL');

    const resolvedEx = await ExceptionService.resolveException(exception._id, {
      resolvedBy: actorUser.name,
      resolvedById: actorUser.userId,
      resolutionNotes: 'Biohazard spill contained and neutralized with sodium hypochlorite. Area declared safe.',
      correctiveActionTaken: 'Biohazard kit restocked.'
    }, actorUser);
    assert(resolvedEx.status === 'RESOLVED', 'Exception successfully transitioned to RESOLVED');

    // --- 9. RPA Automation & Turnover Dispatch ---
    console.log('\n--- 9. RPA Background Dispatch & External Turnover Sync ---');
    const rpaJob = await HousekeepingRpaService.triggerRpaJob({
      action: 'TURNOVER_DISPATCH',
      payload: { areaType: 'PATIENT_ROOM', autoAssign: true }
    }, actorUser);

    assert(rpaJob && rpaJob.jobId, 'RPA Job created for Housekeeping dispatch');
    assert(rpaJob.module === 'HOUSEKEEPING', 'RPA module is HOUSEKEEPING');

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n[Test Suite Error]:', err);
    process.exit(1);
  }
};

runTests();
