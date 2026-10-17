const mongoose = require('mongoose');
const HousekeepingArea = require('../models/HousekeepingArea');
const HousekeepingChecklist = require('../models/HousekeepingChecklist');
const HousekeepingSchedule = require('../models/HousekeepingSchedule');
const HousekeepingTask = require('../models/HousekeepingTask');
const HousekeepingInspection = require('../models/HousekeepingInspection');
const HousekeepingSupplyRequest = require('../models/HousekeepingSupplyRequest');
const HousekeepingException = require('../models/HousekeepingException');
const User = require('../models/User');

const seedModule24Housekeeping = async () => {
  try {
    console.log('[Seed Module 24] Seeding Housekeeping Management Master & Demo Records...');

    // Find a housekeeping staff user if available
    const hkStaff = await User.findOne({ role: 'HOUSEKEEPING' }).lean();
    const staffId = hkStaff?.userId || 'EMP-HK-001';
    const staffName = hkStaff?.name || 'Alice Housekeeper';

    // 1. Seed Housekeeping Areas
    const areas = [
      {
        areaId: 'AREA-20261017-00101',
        areaCode: 'WARD-A-R101',
        name: 'Patient Room 101 (Ward A)',
        areaType: 'PATIENT_ROOM',
        bedId: 'BED-101-A',
        status: 'AVAILABLE',
        cleaningFrequency: 'ON_DISCHARGE',
        active: true,
        notes: 'Single occupancy private room with attached washroom.'
      },
      {
        areaId: 'AREA-20261017-00102',
        areaCode: 'WARD-A-R102',
        name: 'Patient Room 102 (Ward A)',
        areaType: 'PATIENT_ROOM',
        bedId: 'BED-102-B',
        status: 'CLEANING_REQUIRED',
        cleaningFrequency: 'ON_DISCHARGE',
        active: true,
        notes: 'Discharged patient bed awaiting terminal turnover cleaning.'
      },
      {
        areaId: 'AREA-20261017-00103',
        areaCode: 'ICU-ISO-01',
        name: 'ICU Isolation Suite 01',
        areaType: 'ICU',
        status: 'AVAILABLE',
        cleaningFrequency: 'DAILY',
        active: true,
        notes: 'Negative pressure isolation cubicle.'
      },
      {
        areaId: 'AREA-20261017-00104',
        areaCode: 'ER-CORR-01',
        name: 'Emergency Department Main Corridor',
        areaType: 'CORRIDOR',
        status: 'AVAILABLE',
        cleaningFrequency: 'HOURLY',
        active: true,
        notes: 'High-traffic clinical corridor.'
      },
      {
        areaId: 'AREA-20261017-00105',
        areaCode: 'OPD-WAIT-01',
        name: 'OPD Central Waiting Atrium',
        areaType: 'WAITING_AREA',
        status: 'AVAILABLE',
        cleaningFrequency: 'DAILY',
        active: true,
        notes: 'Public waiting area seating 80 individuals.'
      },
      {
        areaId: 'AREA-20261017-00106',
        areaCode: 'LAB-PATH-01',
        name: 'Central Pathology Laboratory Suite',
        areaType: 'LABORATORY',
        status: 'AVAILABLE',
        cleaningFrequency: 'DAILY',
        active: true,
        notes: 'Access-controlled clinical laboratory area.'
      },
      {
        areaId: 'AREA-20261017-00107',
        areaCode: 'RAD-MOD-01',
        name: 'CT Scan Suite 01',
        areaType: 'RADIOLOGY',
        status: 'AVAILABLE',
        cleaningFrequency: 'DAILY',
        active: true,
        notes: 'Radiology imaging suite.'
      }
    ];

    const seededAreas = [];
    for (const a of areas) {
      let doc = await HousekeepingArea.findOne({ areaId: a.areaId });
      if (!doc) {
        doc = await HousekeepingArea.create(a);
      }
      seededAreas.push(doc);
    }
    console.log(`[Seed Module 24] Seeded ${seededAreas.length} Housekeeping Areas.`);

    // 2. Seed Checklists
    const checklists = [
      {
        checklistId: 'CHK-HK-00101',
        title: 'Patient Room Discharge Turnover Checklist',
        areaType: 'PATIENT_ROOM',
        taskType: 'PATIENT_ROOM_TURNOVER',
        items: [
          { itemId: 'ITEM-1', label: 'Strip and bag all soiled bed linens and pillowcases', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-2', label: 'Disinfect mattress, pillow covers, and bed frames with approved disinfectant', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-3', label: 'Wipe all high-touch surfaces (overbed table, call buttons, IV poles)', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-4', label: 'Clean and sanitize private bathroom fixtures and toilet', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-5', label: 'Empty waste bins and replenish biohazard bags', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-6', label: 'Damp mop floor with hospital-grade surface disinfectant', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-7', label: 'Dress bed with fresh sanitized hospital bedsheets and pillowcase', required: true, responseType: 'BOOLEAN' }
        ],
        active: true
      },
      {
        checklistId: 'CHK-HK-00102',
        title: 'Routine Ward Floor Sanitation Checklist',
        areaType: 'WARD',
        taskType: 'ROUTINE_CLEANING',
        items: [
          { itemId: 'ITEM-1', label: 'Dust mop and wet mop main ward corridor and walkways', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-2', label: 'Wipe down nurses station countertops and telephone handsets', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-3', label: 'Disinfect hand sanitizer dispensers and public door handles', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-4', label: 'Empty trash cans and replace bin liners', required: true, responseType: 'BOOLEAN' }
        ],
        active: true
      },
      {
        checklistId: 'CHK-HK-00103',
        title: 'ICU & Isolation Terminal Decontamination Checklist',
        areaType: 'ICU',
        taskType: 'ISOLATION_TERMINAL_CLEAN',
        items: [
          { itemId: 'ITEM-1', label: 'Full PPE donned prior to room entry', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-2', label: 'Disinfect medical equipment exteriors and cables', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-3', label: 'Wipe walls up to 2 meters with germicidal solution', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-4', label: 'Run room UV disinfection robot / emitter cycle', required: true, responseType: 'BOOLEAN' },
          { itemId: 'ITEM-5', label: 'Sign and attach room decontamination clearance tag', required: true, responseType: 'BOOLEAN' }
        ],
        active: true
      }
    ];

    const seededChecklists = [];
    for (const c of checklists) {
      let doc = await HousekeepingChecklist.findOne({ checklistId: c.checklistId });
      if (!doc) {
        doc = await HousekeepingChecklist.create(c);
      }
      seededChecklists.push(doc);
    }
    console.log(`[Seed Module 24] Seeded ${seededChecklists.length} Housekeeping Checklists.`);

    // 3. Seed Routine Schedules
    const schedules = [
      {
        scheduleId: 'SCH-HK-00101',
        areaId: seededAreas[3]._id, // Corridor
        areaName: seededAreas[3].name,
        taskType: 'ROUTINE_CLEANING',
        frequency: 'DAILY',
        priority: 'ROUTINE',
        assignedToUserId: staffId,
        assignedToName: staffName,
        startDate: new Date(),
        nextDueDate: new Date(Date.now() + 8 * 60 * 60 * 1000),
        active: true
      },
      {
        scheduleId: 'SCH-HK-00102',
        areaId: seededAreas[2]._id, // ICU
        areaName: seededAreas[2].name,
        taskType: 'ROUTINE_CLEANING',
        frequency: 'SHIFT',
        priority: 'HIGH',
        assignedToUserId: staffId,
        assignedToName: staffName,
        startDate: new Date(),
        nextDueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
        active: true
      }
    ];

    for (const s of schedules) {
      const existing = await HousekeepingSchedule.findOne({ scheduleId: s.scheduleId });
      if (!existing) {
        await HousekeepingSchedule.create(s);
      }
    }
    console.log(`[Seed Module 24] Seeded ${schedules.length} Housekeeping Schedules.`);

    // 4. Seed Housekeeping Tasks
    const tasks = [
      {
        taskId: 'HK-20261017-00101',
        taskNumber: 'TASK-HK-00101',
        areaId: seededAreas[1]._id, // Room 102
        areaCode: seededAreas[1].areaCode,
        areaName: seededAreas[1].name,
        bedId: 'BED-102-B',
        bedNumber: '102-B',
        sourceModule: 'BED_MANAGEMENT',
        sourceEntityId: 'BED-102-B',
        taskType: 'PATIENT_ROOM_TURNOVER',
        priority: 'URGENT',
        description: 'Discharge room turnover cleaning for Bed 102-B in Ward A.',
        status: 'PENDING_INSPECTION',
        checklistId: seededChecklists[0]._id,
        checklistCompleted: true,
        checklistResponses: [
          { itemId: 'ITEM-1', label: 'Linens stripped', passed: true },
          { itemId: 'ITEM-2', label: 'Mattress sanitized', passed: true },
          { itemId: 'ITEM-3', label: 'Surfaces wiped', passed: true },
          { itemId: 'ITEM-4', label: 'Bathroom cleaned', passed: true },
          { itemId: 'ITEM-5', label: 'Waste emptied', passed: true },
          { itemId: 'ITEM-6', label: 'Floor mopped', passed: true },
          { itemId: 'ITEM-7', label: 'Bed dressed', passed: true }
        ],
        inspectionRequired: true,
        inspectionStatus: 'PENDING',
        assignedToUserId: staffId,
        assignedToName: staffName,
        actualStart: new Date(Date.now() - 45 * 60 * 1000),
        actualEnd: new Date(Date.now() - 5 * 60 * 1000),
        completionNotes: 'Turnover completed thoroughly. All items replaced.'
      },
      {
        taskId: 'HK-20261017-00102',
        taskNumber: 'TASK-HK-00102',
        areaId: seededAreas[3]._id, // ER Corridor
        areaCode: seededAreas[3].areaCode,
        areaName: seededAreas[3].name,
        sourceModule: 'MANUAL',
        taskType: 'SPILL_CLEANUP',
        priority: 'STAT',
        description: 'Urgent biohazard liquid spill reported in ER Corridor near triage desk.',
        status: 'IN_PROGRESS',
        assignedToUserId: staffId,
        assignedToName: staffName,
        actualStart: new Date(Date.now() - 10 * 60 * 1000),
        inspectionRequired: false
      },
      {
        taskId: 'HK-20261017-00103',
        taskNumber: 'TASK-HK-00103',
        areaId: seededAreas[0]._id, // Room 101
        areaCode: seededAreas[0].areaCode,
        areaName: seededAreas[0].name,
        bedId: 'BED-101-A',
        bedNumber: '101-A',
        sourceModule: 'BED_MANAGEMENT',
        sourceEntityId: 'BED-101-A',
        taskType: 'PATIENT_ROOM_TURNOVER',
        priority: 'URGENT',
        description: 'Patient room turnover cleaning for Bed 101-A.',
        status: 'VERIFIED',
        checklistId: seededChecklists[0]._id,
        checklistCompleted: true,
        inspectionRequired: true,
        inspectionStatus: 'PASSED',
        assignedToUserId: staffId,
        assignedToName: staffName,
        actualStart: new Date(Date.now() - 180 * 60 * 1000),
        actualEnd: new Date(Date.now() - 130 * 60 * 1000),
        completionNotes: 'Cleaned and inspected.'
      }
    ];

    const seededTasks = [];
    for (const t of tasks) {
      let doc = await HousekeepingTask.findOne({ taskId: t.taskId });
      if (!doc) {
        doc = await HousekeepingTask.create(t);
      }
      seededTasks.push(doc);
    }
    console.log(`[Seed Module 24] Seeded ${seededTasks.length} Housekeeping Tasks.`);

    // 5. Seed Housekeeping Inspection for Task 00103
    const inspection = {
      inspectionId: 'INSP-HK-20261017-00101',
      taskId: seededTasks[2]._id,
      taskNumber: seededTasks[2].taskId,
      areaId: seededAreas[0]._id,
      areaName: seededAreas[0].name,
      bedNumber: '101-A',
      inspectorUserId: 'SUPERVISOR-HK-01',
      inspectorName: 'Margaret Housekeeping Supervisor',
      inspectionDate: new Date(Date.now() - 120 * 60 * 1000),
      status: 'PASSED',
      rating: 5,
      checklistResults: [
        { itemId: 'ITEM-1', label: 'Visual cleanliness', passed: true },
        { itemId: 'ITEM-2', label: 'Odor check', passed: true },
        { itemId: 'ITEM-3', label: 'Biohazard disposal', passed: true }
      ],
      deficiencies: [],
      notes: 'Superb quality. Bed ready for incoming admission.'
    };

    const existingInsp = await HousekeepingInspection.findOne({ inspectionId: inspection.inspectionId });
    if (!existingInsp) {
      await HousekeepingInspection.create(inspection);
      await HousekeepingTask.findByIdAndUpdate(seededTasks[2]._id, {
        inspectionId: (await HousekeepingInspection.findOne({ inspectionId: inspection.inspectionId }))._id
      });
    }
    console.log('[Seed Module 24] Seeded Housekeeping Inspection.');

    // 6. Seed Supply Requests
    const supplyRequests = [
      {
        requestId: 'HSR-20261017-00101',
        taskId: seededTasks[0]._id,
        taskNumber: seededTasks[0].taskId,
        requestedByUserId: staffId,
        requestedByName: staffName,
        items: [
          { inventoryItemId: 'DISINFECT-QUAT-01', itemName: 'Hospital Quaternary Disinfectant (5L)', quantityRequested: 2, quantityIssued: 2, unit: 'BOTTLE' },
          { inventoryItemId: 'MICROFIBER-CLOTH-BLUE', itemName: 'Microfiber Cleaning Cloths (Blue)', quantityRequested: 10, quantityIssued: 10, unit: 'PACK' }
        ],
        status: 'ISSUED',
        approvedByUserId: 'SUPERVISOR-HK-01',
        issuedByUserId: 'INV-MGR-001',
        issuedAt: new Date(Date.now() - 40 * 60 * 1000),
        notes: 'Supplies issued for Ward A turnover.'
      },
      {
        requestId: 'HSR-20261017-00102',
        taskId: seededTasks[1]._id,
        taskNumber: seededTasks[1].taskId,
        requestedByUserId: staffId,
        requestedByName: staffName,
        items: [
          { inventoryItemId: 'SPILL-KIT-BIO', itemName: 'Universal Biohazard Spill Kit', quantityRequested: 1, quantityIssued: 0, unit: 'KIT' }
        ],
        status: 'APPROVED',
        approvedByUserId: 'SUPERVISOR-HK-01',
        notes: 'Urgent spill kit request for ER Corridor.'
      }
    ];

    for (const sr of supplyRequests) {
      const existing = await HousekeepingSupplyRequest.findOne({ requestId: sr.requestId });
      if (!existing) {
        await HousekeepingSupplyRequest.create(sr);
      }
    }
    console.log('[Seed Module 24] Seeded Housekeeping Supply Requests.');

    // 7. Seed Operational Exceptions
    const exceptions = [
      {
        exceptionId: 'HK-EX-20261017-00101',
        type: 'INSPECTION_FAILED',
        severity: 'MEDIUM',
        taskId: seededTasks[0]._id,
        taskNumber: seededTasks[0].taskId,
        areaId: seededAreas[1]._id,
        source: 'INSPECTION_SERVICE',
        description: 'Prior turnover attempt had missed underside of overbed table.',
        status: 'RESOLVED',
        resolution: 'Rework completed and verified by supervisor.',
        resolvedByUserId: 'SUPERVISOR-HK-01',
        resolvedAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        exceptionId: 'HK-EX-20261017-00102',
        type: 'SUPPLY_UNAVAILABLE',
        severity: 'HIGH',
        taskId: seededTasks[1]._id,
        taskNumber: seededTasks[1].taskId,
        source: 'SUPPLY_SERVICE',
        description: 'Shortage of Heavy-Duty Biohazard Bags in Central Supply Store.',
        status: 'OPEN',
        assignedToUserId: 'INV-MGR-001'
      }
    ];

    for (const ex of exceptions) {
      const existing = await HousekeepingException.findOne({ exceptionId: ex.exceptionId });
      if (!existing) {
        await HousekeepingException.create(ex);
      }
    }
    console.log('[Seed Module 24] Seeded Housekeeping Exceptions.');

    console.log('[Seed Module 24] Housekeeping Administration Master & Demo Seeding COMPLETE.');
  } catch (error) {
    console.error('[Seed Module 24 Error]:', error);
    throw error;
  }
};

module.exports = seedModule24Housekeeping;
