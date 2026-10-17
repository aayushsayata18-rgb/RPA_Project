const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const AssetService = require('../services/maintenance/assetService');
const RequestService = require('../services/maintenance/requestService');
const WorkOrderService = require('../services/maintenance/workOrderService');
const PreventiveService = require('../services/maintenance/preventiveService');
const ChecklistService = require('../services/maintenance/checklistService');
const PartsService = require('../services/maintenance/partsService');
const ContractService = require('../services/maintenance/contractService');
const CalibrationService = require('../services/maintenance/calibrationService');
const MaintenanceExceptionService = require('../services/maintenance/maintenanceExceptionService');
const MaintenanceAnalyticsService = require('../services/maintenance/maintenanceAnalyticsService');
const MaintenanceRpaService = require('../services/maintenance/maintenanceRpaService');

const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const MaintenanceWorkOrder = require('../models/MaintenanceWorkOrder');
const PreventiveMaintenancePlan = require('../models/PreventiveMaintenancePlan');
const MaintenanceChecklist = require('../models/MaintenanceChecklist');
const MaintenancePartRequest = require('../models/MaintenancePartRequest');
const MaintenanceContract = require('../models/MaintenanceContract');
const AssetCalibrationRecord = require('../models/AssetCalibrationRecord');
const MaintenanceException = require('../models/MaintenanceException');
const Vendor = require('../models/Vendor');
const Department = require('../models/Department');
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
    console.log('   MODULE 23: MAINTENANCE MANAGEMENT TEST SUITE       ');
    console.log('======================================================\n');

    const actorUserId = new mongoose.Types.ObjectId();
    const techUserId = new mongoose.Types.ObjectId();

    // Ensure dummy department and vendor exist
    let dept = await Department.findOne();
    if (!dept) {
      dept = new Department({ name: 'Biomedical Engineering', code: 'BIOMED' });
      await dept.save();
    }

    let vendor = await Vendor.findOne();
    if (!vendor) {
      vendor = new Vendor({
        vendorId: 'VND-MNT-001',
        name: 'MedEquip Biomedical Solutions',
        category: 'MEDICAL_EQUIPMENT',
        status: 'ACTIVE'
      });
      await vendor.save();
    }

    // --- 1. Asset Category & Asset Master Registration ---
    console.log('--- 1. Asset Master, Category & Deduplication ---');
    const catCode = `CAT-VENT-${Date.now().toString().slice(-4)}`;
    const category = await AssetService.createCategory({
      categoryId: catCode,
      name: `Life Support Ventilators ${Date.now().toString().slice(-4)}`,
      riskClassification: 'HIGH',
      calibrationRequired: true,
      description: 'Critical ICU life support ventilators'
    }, actorUserId);
    assert(category && category.categoryId === catCode, 'Create Asset Category');

    const randSerial = `SN-VENT-${Date.now().toString().slice(-6)}`;
    const asset = await AssetService.createAsset({
      name: 'ICU Servo-U Ventilator',
      serialNumber: randSerial,
      model: 'Servo-U V3',
      manufacturer: 'Getinge Maquet',
      categoryId: category._id,
      departmentId: dept._id,
      criticality: 'CRITICAL',
      riskClassification: 'HIGH',
      status: 'ACTIVE'
    }, actorUserId);
    assert(asset && asset.serialNumber === randSerial, 'Register Asset in Asset Master');
    assert(asset.assetTag && asset.assetTag.startsWith('AST-'), 'Auto-generate unique Asset Tag');
    assert(asset.status === 'ACTIVE', 'Initial Asset Status is ACTIVE');

    // Duplicate detection
    let dupBlocked = false;
    try {
      await AssetService.createAsset({
        name: 'Duplicate ICU Ventilator',
        serialNumber: randSerial,
        model: 'Servo-U V3',
        manufacturer: 'Getinge Maquet'
      }, actorUserId);
    } catch (e) {
      dupBlocked = true;
    }
    assert(dupBlocked, 'Duplicate asset registration strictly prevented');

    // --- 2. Maintenance Breakdown Request Lifecycle & SLA Triage ---
    console.log('\n--- 2. Breakdown Request & Triage Lifecycle ---');
    const request = await RequestService.createRequest({
      assetId: asset._id,
      title: 'Ventilator display touch panel intermittent blackout',
      description: 'Screen randomly blanks out during ICU patient ventilation mode changes',
      priority: 'MEDIUM',
      issueType: 'BREAKDOWN'
    }, actorUserId);
    assert(request && request.requestId, 'Create Breakdown Maintenance Request');
    assert(request.status === 'SUBMITTED', 'Initial Request Status is SUBMITTED');

    // Triage request
    const triaged = await RequestService.triageRequest(request._id.toString(), {
      status: 'APPROVED',
      priority: 'HIGH',
      triageNotes: 'Escalated to HIGH due to critical ICU life support status'
    }, actorUserId);
    assert(triaged.status === 'APPROVED', 'Request status transitioned to APPROVED during triage');
    assert(triaged.priority === 'HIGH', 'Request priority escalated to HIGH during triage');

    // --- 3. Work Order Conversion & Technician Assignment ---
    console.log('\n--- 3. Work Order Conversion & Assignment ---');
    const workOrder = await RequestService.createWorkOrderFromRequest(request._id.toString(), {
      title: 'Replace LCD digitizer ribbon and run safety calibration',
      maintenanceType: 'CORRECTIVE',
      assignedTechnicianId: techUserId
    }, actorUserId);
    assert(workOrder && workOrder.workOrderId, 'Convert Request to Work Order');
    assert(workOrder.status === 'ASSIGNED', 'Work Order status assigned to Lead Technician');

    // Verify Asset marked as UNDER_MAINTENANCE
    const assetUnderMaint = await Asset.findById(asset._id);
    assert(assetUnderMaint.status === 'UNDER_MAINTENANCE', 'Asset status shifted to UNDER_MAINTENANCE upon WO creation');

    // --- 4. Work Order Execution Lifecycle (Schedule, Start, Hold, Resume) ---
    console.log('\n--- 4. Work Order Execution Lifecycle ---');
    const scheduledWO = await WorkOrderService.scheduleWorkOrder(workOrder._id.toString(), {
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 3600000)
    }, actorUserId);
    assert(scheduledWO.status === 'SCHEDULED', 'Work Order transitioned to SCHEDULED');

    const startedWO = await WorkOrderService.startWorkOrder(workOrder._id.toString(), actorUserId);
    assert(startedWO.status === 'IN_PROGRESS', 'Work Order transitioned to IN_PROGRESS');
    assert(startedWO.actualStart !== null, 'Work Order actual start timestamp recorded');

    const heldWO = await WorkOrderService.holdWorkOrder(workOrder._id.toString(), {
      status: 'ON_HOLD',
      holdReason: 'Awaiting OEM replacement digitizer PCB ribbon'
    }, actorUserId);
    assert(heldWO.status === 'ON_HOLD', 'Work Order transitioned to ON_HOLD');

    const resumedWO = await WorkOrderService.resumeWorkOrder(workOrder._id.toString(), actorUserId);
    assert(resumedWO.status === 'IN_PROGRESS', 'Work Order resumed to IN_PROGRESS');

    // --- 5. Critical Safety Boundary: Completion & Pending Inspection ---
    console.log('\n--- 5. Critical Safety Boundary: Completion & Verification ---');
    const completedWO = await WorkOrderService.completeWorkOrder(workOrder._id.toString(), {
      completionNotes: 'Display digitizer replaced. Electrical leakage current tested: 42 uA (pass < 100 uA).',
      actualCost: 350
    }, actorUserId);
    assert(completedWO.status === 'COMPLETED', 'Work Order transitioned to COMPLETED');
    assert(completedWO.verificationStatus === 'PENDING', 'Work Order verification status is PENDING');

    // Safety boundary check: Asset MUST NOT be marked ACTIVE automatically!
    const assetPostCompletion = await Asset.findById(asset._id);
    assert(assetPostCompletion.status === 'PENDING_INSPECTION', 'SAFETY BOUNDARY: Asset status is PENDING_INSPECTION (not active)');

    // --- 6. Supervisor Verification & Formal Closure ---
    console.log('\n--- 6. Supervisor Verification & Return to Service ---');
    const verifiedWO = await WorkOrderService.verifyWorkOrder(workOrder._id.toString(), {
      verified: true,
      verificationNotes: 'Biomedical engineering supervisor physical QA inspection passed and signed off'
    }, actorUserId);
    assert(verifiedWO.verificationStatus === 'VERIFIED', 'Work Order verified by authorized engineer');

    const closedWO = await WorkOrderService.closeWorkOrder(workOrder._id.toString(), {
      returnAssetToStatus: 'ACTIVE',
      notes: 'Work order successfully resolved and signed off'
    }, actorUserId);
    assert(closedWO.status === 'CLOSED', 'Work Order formally CLOSED');

    const assetRestored = await Asset.findById(asset._id);
    assert(assetRestored.status === 'ACTIVE', 'Asset safely returned to service as ACTIVE after authorized verification');

    // --- 7. Preventive Maintenance Plan & Due Work Order Generation ---
    console.log('\n--- 7. Preventive Maintenance (PM) Plans ---');
    const pmPlan = await PreventiveService.createPlan({
      assetId: asset._id,
      title: 'Quarterly Pneumatic & Filter Overhaul',
      frequencyType: 'QUARTERLY',
      intervalValue: 90,
      instructions: 'Replace bacterial filters, check O2 cell calibration, test battery backup.',
      nextDueDate: new Date(Date.now() - 3600000) // already due
    }, actorUserId);
    assert(pmPlan && pmPlan.planId, 'Create Preventive Maintenance Plan');

    const pmGenResult = await PreventiveService.generateDueWorkOrders(actorUserId);
    assert(pmGenResult.count >= 1, 'Generate Due PM Work Orders via batch engine');

    // --- 8. Standardized Maintenance Checklist Creation ---
    console.log('\n--- 8. Maintenance Checklists ---');
    const checklistCode = `CHK-VENT-${Date.now().toString().slice(-4)}`;
    const checklist = await ChecklistService.createChecklist({
      checklistCode,
      name: 'Ventilator Standard Maintenance Checklist',
      category: 'MEDICAL_DEVICE',
      steps: [
        { stepNumber: 1, instruction: 'Check AC power cord and chassis grounding resistance', mandatory: true },
        { stepNumber: 2, instruction: 'Verify O2 sensor calibration at 21% and 100% FiO2', mandatory: true },
        { stepNumber: 3, instruction: 'Test audible and visual alarms during disconnect', mandatory: true }
      ]
    }, actorUserId);
    assert(checklist && checklist.checklistCode === checklistCode, 'Create standardized Maintenance Checklist');
    assert(checklist.steps.length === 3, 'Checklist registered with mandatory inspection steps');

    // --- 9. Spare Parts Requisition & Issuance ---
    console.log('\n--- 9. Spare Parts Requisition & Inventory Cost Tracking ---');
    const partReq = await PartsService.createPartRequest({
      workOrderId: workOrder._id,
      partName: 'O2 Sensor Galvanic Cell (OEM)',
      partNumber: 'GET-O2-900',
      quantityRequested: 1,
      unitCost: 180,
      totalCost: 180,
      urgency: 'HIGH'
    }, actorUserId);
    assert(partReq && partReq.requestId, 'Create Spare Part Requisition');
    assert(partReq.status === 'PENDING' || partReq.status === 'REQUESTED', 'Part request status is PENDING / REQUESTED');

    const approvedPart = await PartsService.approvePartRequest(partReq._id.toString(), actorUserId);
    assert(approvedPart.status === 'APPROVED', 'Part request approved by supervisor');

    const issuedPart = await PartsService.issuePart(partReq._id.toString(), { quantityIssued: 1 }, actorUserId);
    assert(issuedPart.status === 'ISSUED', 'Part issued and applied to Work Order cost breakdown');

    // --- 10. AMC Service Contract Tracking ---
    console.log('\n--- 10. Service Contracts & AMC Management ---');
    const contractNum = `AMC-GET-${Date.now().toString().slice(-4)}`;
    const contract = await ContractService.createContract({
      contractNumber: contractNum,
      title: 'Comprehensive AMC - Getinge ICU Ventilators',
      vendorId: vendor._id,
      contractType: 'AMC_COMPREHENSIVE',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      annualCost: 14500,
      coveredAssets: [asset._id]
    }, actorUserId);
    assert(contract && contract.contractNumber === contractNum, 'Create Comprehensive AMC Contract');
    assert(contract.status === 'ACTIVE', 'Contract initial status is ACTIVE');

    // --- 11. Biomedical Calibration Recording & Compliance ---
    console.log('\n--- 11. Biomedical Calibration & Certification ---');
    const calibCert = `CAL-CERT-${Date.now().toString().slice(-5)}`;
    const calibration = await CalibrationService.createCalibration({
      assetId: asset._id,
      certificateNumber: calibCert,
      calibrationDate: new Date(),
      result: 'PASS',
      measuredAccuracy: 99.8,
      agency: 'Apex BioCal Calibration Laboratories'
    }, actorUserId);
    assert(calibration && calibration.certificateNumber === calibCert, 'Record Biomedical Calibration Certificate');
    assert(calibration.result === 'PASS', 'Calibration verification confirmed as PASS');

    // --- 12. Operational Exception Handling & Resolution ---
    console.log('\n--- 12. Operational Exceptions & Resolution ---');
    const exception = await MaintenanceExceptionService.createException({
      type: 'EQUIPMENT_DOWNTIME_BREACH',
      severity: 'HIGH',
      assetId: asset._id,
      workOrderId: workOrder._id,
      description: 'Ventilator repair delayed over 4 hours awaiting spare parts shipment'
    }, actorUserId);
    assert(exception && exception.exceptionId, 'Log Critical Maintenance Exception');
    assert(exception.status === 'OPEN', 'Exception initial status is OPEN');

    const resolvedEx = await MaintenanceExceptionService.resolveException(exception._id.toString(), {
      resolutionNotes: 'Spare parts received via emergency dispatch, repair resumed successfully'
    }, actorUserId);
    assert(resolvedEx.status === 'RESOLVED', 'Exception successfully marked RESOLVED');

    // --- 13. Maintenance Analytics (MTTR / MTBF & KPIs) ---
    console.log('\n--- 13. Maintenance Analytics & KPIs ---');
    const metrics = await MaintenanceAnalyticsService.getDashboardMetrics();
    assert(metrics && metrics.assets && metrics.workOrders, 'Retrieve Dashboard Metrics');
    assert(typeof metrics.kpis.mttrMinutes === 'number', 'Calculate Mean Time To Repair (MTTR)');

    const reliability = await MaintenanceAnalyticsService.getMttrMtbfAnalytics();
    assert(reliability && reliability.mtbfHours > 0, 'Calculate MTBF and equipment availability percentage');

    // --- 14. RPA CMMS Integration & Synchronization ---
    console.log('\n--- 14. RPA CMMS Export & Schedule Dispatch ---');
    const cmmsExport = await MaintenanceRpaService.exportWorkOrderToCmms(workOrder.workOrderId, actorUserId);
    assert(cmmsExport && cmmsExport.success, 'Export Work Order to external CMMS via RPA');

    const rpaDispatch = await MaintenanceRpaService.triggerPmDispatch(actorUserId);
    assert(rpaDispatch && rpaDispatch.success, 'Trigger PM schedule dispatch via RPA');

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Suite encountered unhandled error:', err);
    process.exit(1);
  }
};

runTests();
