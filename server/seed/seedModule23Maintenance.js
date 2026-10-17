require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
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
const Department = require('../models/Department');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

const seedModule23Maintenance = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
      console.log('[Seed Module 23] Connected to MongoDB.');
    }
    console.log('[Seed Module 23] Seeding Maintenance Management Master & Demo Records...');

    // Find reference entities
    const adminUser = await User.findOne({ role: { $in: ['SYSTEM_ADMIN', 'ADMIN_MANAGER'] } }).lean();
    const maintUser = await User.findOne({ role: 'MAINTENANCE' }).lean() || adminUser;
    const adminId = adminUser?._id || new mongoose.Types.ObjectId();
    const techId = maintUser?._id || adminId;

    const deptBiomed = await Department.findOne({ code: 'BIOMED' }).lean() ||
      await Department.findOne({ code: 'RAD' }).lean() ||
      await Department.findOne().lean();

    const vendor = await Vendor.findOne().lean();
    const vendorId = vendor?._id || new mongoose.Types.ObjectId();

    // 1. Seed Asset Categories
    const categoriesData = [
      {
        categoryId: 'CAT-MED',
        name: 'Medical Equipment',
        description: 'Diagnostic and patient treatment devices',
        maintenanceType: 'BIOMEDICAL',
        defaultCriticality: 'HIGH',
        active: true
      },
      {
        categoryId: 'CAT-BIOMED',
        name: 'Biomedical Life Support',
        description: 'Ventilators, anesthesia, dialysis machines',
        maintenanceType: 'BIOMEDICAL',
        defaultCriticality: 'CRITICAL',
        active: true
      },
      {
        categoryId: 'CAT-HVAC',
        name: 'HVAC & Climate Control',
        description: 'Chillers, central air handling, HEPA filtration',
        maintenanceType: 'HVAC',
        defaultCriticality: 'HIGH',
        active: true
      },
      {
        categoryId: 'CAT-ELEC',
        name: 'Electrical Infrastructure',
        description: 'Emergency diesel generators, UPS banks, transformers',
        maintenanceType: 'ELECTRICAL',
        defaultCriticality: 'CRITICAL',
        active: true
      },
      {
        categoryId: 'CAT-IT',
        name: 'IT & Computing',
        description: 'Hospital workstations, servers, clinical bedside terminals',
        maintenanceType: 'IT',
        defaultCriticality: 'MEDIUM',
        active: true
      },
      {
        categoryId: 'CAT-FAC',
        name: 'Facility & Plumbing',
        description: 'Elevators, medical gas pipelines, booster pumps',
        maintenanceType: 'FACILITY',
        defaultCriticality: 'MEDIUM',
        active: true
      }
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      let doc = await AssetCategory.findOne({ categoryId: cat.categoryId });
      if (!doc) {
        doc = await AssetCategory.create(cat);
      }
      categoryMap[cat.categoryId] = doc._id;
    }
    console.log('[Seed Module 23] Seeded Asset Categories.');

    // 2. Seed Maintenance Checklists
    const checklistsData = [
      {
        checklistId: 'CHK-MNT-00101',
        name: 'Ventilator Monthly Preventive Checklist',
        category: 'BIOMEDICAL',
        version: 1,
        items: [
          { itemId: 'CHK-01', description: 'Inspect gas inlet filters and O-rings', required: true, responseType: 'PASS_FAIL' },
          { itemId: 'CHK-02', description: 'Perform battery discharge & charging cycle test', required: true, responseType: 'PASS_FAIL' },
          { itemId: 'CHK-03', description: 'Calibrate O2 cell and flow sensor', required: true, responseType: 'PASS_FAIL' },
          { itemId: 'CHK-04', description: 'Verify audible and visual alarms (Apnea, Disconnect)', required: true, responseType: 'PASS_FAIL' },
          { itemId: 'CHK-05', description: 'Verify electrical leakage current under 100uA', required: true, responseType: 'PASS_FAIL' }
        ],
        status: 'ACTIVE'
      },
      {
        checklistId: 'CHK-MNT-00102',
        name: 'Central HVAC Monthly Air Handler Inspection',
        category: 'HVAC',
        version: 1,
        items: [
          { itemId: 'CHK-11', description: 'Check belt tension and pulley alignment', required: true, responseType: 'PASS_FAIL' },
          { itemId: 'CHK-12', description: 'Inspect and replace pre-filters if differential pressure > 1.5 in. w.g.', required: true, responseType: 'PASS_FAIL' },
          { itemId: 'CHK-13', description: 'Verify condensate drain pan clear of standing water', required: true, responseType: 'PASS_FAIL' },
          { itemId: 'CHK-14', description: 'Measure motor operating current vs nameplate rating', required: true, responseType: 'PASS_FAIL' }
        ],
        status: 'ACTIVE'
      },
      {
        checklistId: 'CHK-MNT-00103',
        name: 'Diesel Generator Weekly Exerciser Test',
        category: 'ELECTRICAL',
        version: 1,
        items: [
          { itemId: 'CHK-21', description: 'Check coolant level and oil level', required: true, responseType: 'PASS_FAIL' },
          { itemId: 'CHK-22', description: 'Verify day tank fuel level above 85%', required: true, responseType: 'PASS_FAIL' },
          { itemId: 'CHK-23', description: 'Start engine on manual test for 30 minutes', required: true, responseType: 'PASS_FAIL' },
          { itemId: 'CHK-24', description: 'Verify automatic transfer switch (ATS) signal readiness', required: true, responseType: 'PASS_FAIL' }
        ],
        status: 'ACTIVE'
      }
    ];

    const checklistMap = {};
    for (const chk of checklistsData) {
      let doc = await MaintenanceChecklist.findOne({ checklistId: chk.checklistId });
      if (!doc) {
        doc = await MaintenanceChecklist.create(chk);
      }
      checklistMap[chk.checklistId] = doc._id;
    }
    console.log('[Seed Module 23] Seeded Maintenance Checklists.');

    // 3. Seed Assets
    const assetsData = [
      {
        assetId: 'AST-00001',
        assetTag: 'AST-MED-000001',
        name: 'Siemens MAGNETOM 1.5T MRI Scanner',
        categoryId: categoryMap['CAT-MED'],
        subcategory: 'Diagnostic Radiology',
        description: 'Superconducting high-field magnetic resonance imaging system',
        manufacturer: 'Siemens Healthineers',
        model: 'MAGNETOM Sola',
        serialNumber: 'SN-MRI-99042',
        purchaseDate: new Date('2022-03-15'),
        installationDate: new Date('2022-04-10'),
        warrantyStartDate: new Date('2022-04-10'),
        warrantyEndDate: new Date('2025-04-10'),
        warrantyProvider: 'Siemens Healthineers India',
        departmentId: deptBiomed?._id,
        status: 'ACTIVE',
        criticality: 'CRITICAL',
        maintenanceRequired: false,
        notes: 'Room 01, Radiology Suite. Cryogen level monitored 24/7.'
      },
      {
        assetId: 'AST-00002',
        assetTag: 'AST-BIOMED-000001',
        name: 'Dräger Evita V800 ICU Ventilator',
        categoryId: categoryMap['CAT-BIOMED'],
        subcategory: 'Critical Care Ventilation',
        description: 'Invasive and non-invasive high-end mechanical ventilator',
        manufacturer: 'Dräger Medical',
        model: 'Evita V800',
        serialNumber: 'DRAG-V800-4412',
        purchaseDate: new Date('2023-01-20'),
        installationDate: new Date('2023-01-25'),
        warrantyStartDate: new Date('2023-01-25'),
        warrantyEndDate: new Date('2026-01-25'),
        departmentId: deptBiomed?._id,
        status: 'AVAILABLE',
        criticality: 'CRITICAL',
        maintenanceRequired: false,
        notes: 'ICU Bedside Unit 04. Annual sensor overhaul.'
      },
      {
        assetId: 'AST-00003',
        assetTag: 'AST-MED-000002',
        name: 'Philips IntelliVue MX750 Patient Monitor',
        categoryId: categoryMap['CAT-MED'],
        subcategory: 'Patient Monitoring',
        description: 'Multi-parameter bedside monitor with ECG, SpO2, NIBP, EtCO2',
        manufacturer: 'Philips Healthcare',
        model: 'MX750',
        serialNumber: 'PH-MON-10293',
        purchaseDate: new Date('2023-06-10'),
        installationDate: new Date('2023-06-15'),
        departmentId: deptBiomed?._id,
        status: 'UNDER_MAINTENANCE',
        criticality: 'HIGH',
        maintenanceRequired: true,
        notes: 'Display flickering intermittently during cardiac telemetry.'
      },
      {
        assetId: 'AST-00004',
        assetTag: 'AST-FAC-000001',
        name: 'Daikin Central Chiller 250 TR',
        categoryId: categoryMap['CAT-HVAC'],
        subcategory: 'Central Cooling Plant',
        description: 'Water-cooled centrifugal chiller serving OT and ICU air handlers',
        manufacturer: 'Daikin Applied',
        model: 'WMC-250',
        serialNumber: 'DK-CHILL-8812',
        purchaseDate: new Date('2021-08-01'),
        installationDate: new Date('2021-09-01'),
        departmentId: deptBiomed?._id,
        status: 'ACTIVE',
        criticality: 'CRITICAL',
        maintenanceRequired: false,
        notes: 'Basement Plant Room 02.'
      },
      {
        assetId: 'AST-00005',
        assetTag: 'AST-ELEC-000001',
        name: 'Cummins 500 kVA Emergency Diesel Generator',
        categoryId: categoryMap['CAT-ELEC'],
        subcategory: 'Emergency Power Backup',
        description: 'Silent diesel generator with auto-start transfer panel',
        manufacturer: 'Cummins Power Systems',
        model: 'QSK19-G4',
        serialNumber: 'CUM-GEN-500-11',
        purchaseDate: new Date('2020-05-10'),
        installationDate: new Date('2020-06-01'),
        departmentId: deptBiomed?._id,
        status: 'ACTIVE',
        criticality: 'CRITICAL',
        maintenanceRequired: false,
        notes: 'Substation Yard East. Weekly testing schedule.'
      },
      {
        assetId: 'AST-00006',
        assetTag: 'AST-IT-000001',
        name: 'Dell OptiPlex 7090 Front-Desk Workstation',
        categoryId: categoryMap['CAT-IT'],
        subcategory: 'End-User Computing',
        description: 'Hospital reception registration desk computer',
        manufacturer: 'Dell Technologies',
        model: 'OptiPlex 7090 SFF',
        serialNumber: 'DELL-FD-7721',
        purchaseDate: new Date('2023-09-12'),
        installationDate: new Date('2023-09-14'),
        departmentId: deptBiomed?._id,
        status: 'ACTIVE',
        criticality: 'LOW',
        maintenanceRequired: false,
        notes: 'Reception Counter Desk 01.'
      }
    ];

    const seededAssets = [];
    for (const ast of assetsData) {
      let doc = await Asset.findOne({ assetId: ast.assetId });
      if (!doc) {
        doc = await Asset.create(ast);
      }
      seededAssets.push(doc);
    }
    console.log('[Seed Module 23] Seeded Assets Master.');

    // 4. Seed Preventive Maintenance Plans
    const plansData = [
      {
        planId: 'PMP-00101',
        title: 'Monthly Ventilator Calibration & Seal Inspection',
        assetId: seededAssets[1]._id,
        maintenanceType: 'PREVENTIVE',
        frequencyType: 'MONTHLY',
        intervalValue: 1,
        nextDueDate: new Date(Date.now() + 5 * 86400000), // Due in 5 days
        lastCompletedDate: new Date(Date.now() - 25 * 86400000),
        checklistId: checklistMap['CHK-MNT-00101'],
        assignedTechnicianId: techId,
        active: true,
        instructions: 'Follow Dräger service manual section 4.1 for pneumatic calibration.'
      },
      {
        planId: 'PMP-00102',
        title: 'Quarterly Chiller Condenser Descaling & Chemical Treatment',
        assetId: seededAssets[3]._id,
        maintenanceType: 'PREVENTIVE',
        frequencyType: 'QUARTERLY',
        intervalValue: 1,
        nextDueDate: new Date(Date.now() + 20 * 86400000),
        lastCompletedDate: new Date(Date.now() - 70 * 86400000),
        checklistId: checklistMap['CHK-MNT-00102'],
        vendorId,
        active: true,
        instructions: 'Check refrigerant pressure and water hardness levels.'
      },
      {
        planId: 'PMP-00103',
        title: 'Weekly Standby Generator Test Run',
        assetId: seededAssets[4]._id,
        maintenanceType: 'PREVENTIVE',
        frequencyType: 'WEEKLY',
        intervalValue: 1,
        nextDueDate: new Date(Date.now() - 1 * 86400000), // Overdue by 1 day
        lastCompletedDate: new Date(Date.now() - 8 * 86400000),
        checklistId: checklistMap['CHK-MNT-00103'],
        assignedTechnicianId: techId,
        active: true,
        instructions: 'Record exhaust temperature, RPM, and phase voltage under load.'
      }
    ];

    for (const p of plansData) {
      const existing = await PreventiveMaintenancePlan.findOne({ planId: p.planId });
      if (!existing) {
        await PreventiveMaintenancePlan.create(p);
      }
    }
    console.log('[Seed Module 23] Seeded Preventive Maintenance Plans.');

    // 5. Seed Maintenance Requests
    const requestsData = [
      {
        requestId: 'REQ-MNT-20261017-00101',
        assetId: seededAssets[2]._id, // Philips Patient Monitor
        requesterId: adminId,
        departmentId: deptBiomed?._id,
        category: 'BIOMEDICAL',
        issueType: 'MALFUNCTION',
        title: 'Bedside Monitor Display Flickering & ECG Artifacts',
        description: 'Screen randomly flashes black and SpO2 readings drop to 0% intermittently.',
        priority: 'HIGH',
        status: 'WORK_ORDER_CREATED',
        source: 'WEB_PORTAL',
        requestedAt: new Date(Date.now() - 4 * 3600000)
      },
      {
        requestId: 'REQ-MNT-20261017-00102',
        assetId: seededAssets[5]._id, // Workstation
        requesterId: adminId,
        departmentId: deptBiomed?._id,
        category: 'IT',
        issueType: 'MALFUNCTION',
        title: 'Barcode Scanner Not Responding on Reception PC',
        description: 'USB handheld scanner fails to scan patient wristbands.',
        priority: 'MEDIUM',
        status: 'SUBMITTED',
        source: 'WEB_PORTAL',
        requestedAt: new Date(Date.now() - 2 * 3600000)
      }
    ];

    const seededRequests = [];
    for (const req of requestsData) {
      let doc = await MaintenanceRequest.findOne({ requestId: req.requestId });
      if (!doc) {
        doc = await MaintenanceRequest.create(req);
      }
      seededRequests.push(doc);
    }
    console.log('[Seed Module 23] Seeded Maintenance Requests.');

    // 6. Seed Maintenance Work Orders
    const workOrdersData = [
      {
        workOrderId: 'WO-2026-000101',
        requestId: seededRequests[0]._id,
        assetId: seededAssets[2]._id,
        departmentId: deptBiomed?._id,
        maintenanceType: 'CORRECTIVE',
        priority: 'HIGH',
        title: 'Repair Telemetry Cable & Replace SpO2 Trunk Board',
        description: 'Investigate signal interference, test internal display inverter, and replace faulty sensor cable.',
        assignedTechnicianId: techId,
        assignedBy: adminId,
        assignedAt: new Date(Date.now() - 3 * 3600000),
        status: 'IN_PROGRESS',
        actualStart: new Date(Date.now() - 2 * 3600000),
        downtimeStart: new Date(Date.now() - 3 * 3600000),
        estimatedCost: 3500,
        actualCost: 1200,
        costBreakdown: { laborCost: 800, partsCost: 400, vendorCost: 0, otherCost: 0 },
        slaStatus: 'WITHIN_SLA',
        resolutionDue: new Date(Date.now() + 6 * 3600000)
      },
      {
        workOrderId: 'PM-WO-2026-000102',
        assetId: seededAssets[0]._id, // MRI
        departmentId: deptBiomed?._id,
        maintenanceType: 'PREVENTIVE',
        priority: 'HIGH',
        title: 'Quarterly RF Coil Tuning & Helium Pressure Audit',
        description: 'Routine maintenance of RF amplifier and gradient coils by authorized vendor.',
        assignedVendorId: vendorId,
        assignedBy: adminId,
        assignedAt: new Date(Date.now() - 48 * 3600000),
        scheduledStart: new Date(Date.now() + 24 * 3600000),
        scheduledEnd: new Date(Date.now() + 28 * 3600000),
        status: 'SCHEDULED',
        estimatedCost: 15000,
        slaStatus: 'NOT_STARTED'
      },
      {
        workOrderId: 'WO-2026-000103',
        assetId: seededAssets[1]._id, // Ventilator
        departmentId: deptBiomed?._id,
        maintenanceType: 'PREVENTIVE',
        priority: 'MEDIUM',
        title: 'Monthly Flow Sensor Zero Calibration',
        description: 'Pre-use calibration and bacterial filter replacement.',
        assignedTechnicianId: techId,
        status: 'COMPLETED',
        actualStart: new Date(Date.now() - 24 * 3600000),
        actualEnd: new Date(Date.now() - 22 * 3600000),
        downtimeStart: new Date(Date.now() - 24 * 3600000),
        downtimeEnd: new Date(Date.now() - 22 * 3600000),
        downtimeDurationMinutes: 120,
        actualCost: 650,
        verificationStatus: 'VERIFIED',
        verifiedBy: adminId,
        verifiedAt: new Date(Date.now() - 21 * 3600000),
        slaStatus: 'COMPLETED'
      }
    ];

    const seededWorkOrders = [];
    for (const wo of workOrdersData) {
      let doc = await MaintenanceWorkOrder.findOne({ workOrderId: wo.workOrderId });
      if (!doc) {
        doc = await MaintenanceWorkOrder.create(wo);
      }
      seededWorkOrders.push(doc);
    }
    console.log('[Seed Module 23] Seeded Maintenance Work Orders.');

    // Link WO to Request 1
    if (seededRequests[0] && seededWorkOrders[0]) {
      seededRequests[0].workOrderId = seededWorkOrders[0]._id;
      await seededRequests[0].save();
    }

    // 7. Seed Part Requests
    const partsData = [
      {
        requestId: 'PR-MNT-20261017-00101',
        workOrderId: seededWorkOrders[0]._id,
        partName: 'Philips MX750 SpO2 Trunk Cable 8-Pin',
        partNumber: 'M1191B',
        quantityRequested: 1,
        quantityIssued: 1,
        unitCost: 400,
        totalCost: 400,
        status: 'ISSUED',
        requestedBy: techId,
        approvedBy: adminId,
        approvedAt: new Date(Date.now() - 2 * 3600000),
        issuedBy: adminId,
        issuedAt: new Date(Date.now() - 1 * 3600000)
      },
      {
        requestId: 'PR-MNT-20261017-00102',
        workOrderId: seededWorkOrders[0]._id,
        partName: 'Main Display LCD Inverter Board',
        partNumber: 'INV-PH-750',
        quantityRequested: 1,
        quantityIssued: 0,
        unitCost: 1800,
        totalCost: 1800,
        status: 'REQUESTED',
        requestedBy: techId
      }
    ];

    for (const pr of partsData) {
      const existing = await MaintenancePartRequest.findOne({ requestId: pr.requestId });
      if (!existing) {
        await MaintenancePartRequest.create(pr);
      }
    }
    console.log('[Seed Module 23] Seeded Maintenance Part Requests.');

    // 8. Seed Contracts (AMC)
    const contractsData = [
      {
        contractId: 'AMC-2026-00101',
        vendorId,
        contractNumber: 'CNT-SIEM-2025-99',
        contractType: 'CMC',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        coveredAssets: [seededAssets[0]._id],
        serviceFrequency: 'QUARTERLY',
        terms: 'Comprehensive Maintenance Contract covering cryogen top-up, RF coils, and 24/7 remote diagnostics.',
        cost: 450000,
        status: 'ACTIVE',
        renewalReminderDate: new Date('2026-11-30')
      },
      {
        contractId: 'AMC-2026-00102',
        vendorId,
        contractNumber: 'CNT-DAIKIN-2024-12',
        contractType: 'AMC',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        coveredAssets: [seededAssets[3]._id],
        serviceFrequency: 'MONTHLY',
        terms: 'Annual maintenance of chiller compressor and water treatment system.',
        cost: 180000,
        status: 'ACTIVE',
        renewalReminderDate: new Date('2025-03-01')
      }
    ];

    for (const c of contractsData) {
      const existing = await MaintenanceContract.findOne({ contractId: c.contractId });
      if (!existing) {
        await MaintenanceContract.create(c);
      }
    }
    console.log('[Seed Module 23] Seeded Maintenance Contracts.');

    // 9. Seed Calibration Records
    const calData = [
      {
        calibrationId: 'CAL-2026-00101',
        assetId: seededAssets[1]._id, // Ventilator
        performedBy: techId,
        performedByName: 'Robert Taylor (Certified Biomedical Engineer)',
        performedAt: new Date(Date.now() - 30 * 86400000),
        dueDate: new Date(Date.now() + 335 * 86400000),
        result: 'PASS',
        certificateNumber: 'NABL-CAL-2026-4401',
        status: 'PASSED',
        standardsUsed: 'Fluke VT650 Gas Flow Analyzer (Cal Ref #FLK-990)',
        temperature: '22°C',
        humidity: '48%',
        notes: 'Volume delivery accuracy within ±2.5% across all tidal volume settings.'
      },
      {
        calibrationId: 'CAL-2026-00102',
        assetId: seededAssets[2]._id, // Monitor
        performedBy: techId,
        performedByName: 'Sarah Jenkins (Biomedical Tech)',
        performedAt: new Date(Date.now() - 120 * 86400000),
        dueDate: new Date(Date.now() + 245 * 86400000),
        result: 'PASS',
        certificateNumber: 'NABL-CAL-2026-2180',
        status: 'PASSED',
        standardsUsed: 'ProSim 8 Vital Signs Simulator',
        temperature: '23°C',
        humidity: '50%',
        notes: 'NIBP pressure transducer calibrated to 200 mmHg reference.'
      }
    ];

    for (const cal of calData) {
      const existing = await AssetCalibrationRecord.findOne({ calibrationId: cal.calibrationId });
      if (!existing) {
        await AssetCalibrationRecord.create(cal);
      }
    }
    console.log('[Seed Module 23] Seeded Calibration Records.');

    // 10. Seed Exceptions
    const exceptionsData = [
      {
        exceptionId: 'EX-MNT-20261017-00101',
        type: 'PART_UNAVAILABLE',
        severity: 'HIGH',
        assetId: seededAssets[2]._id,
        workOrderId: seededWorkOrders[0]._id,
        description: 'Replacement Display Inverter Board (INV-PH-750) not available in Central Medical Inventory.',
        source: 'PARTS_SERVICE',
        status: 'OPEN',
        assignedTo: adminId
      },
      {
        exceptionId: 'EX-MNT-20261017-00102',
        type: 'CONTRACT_EXPIRED',
        severity: 'MEDIUM',
        assetId: seededAssets[4]._id,
        description: 'Generator AMC with Cummins requires renewal within 30 days.',
        source: 'CONTRACT_SERVICE',
        status: 'UNDER_REVIEW',
        assignedTo: adminId
      }
    ];

    for (const ex of exceptionsData) {
      const existing = await MaintenanceException.findOne({ exceptionId: ex.exceptionId });
      if (!existing) {
        await MaintenanceException.create(ex);
      }
    }
    console.log('[Seed Module 23] Seeded Maintenance Exceptions.');

    console.log('[Seed Module 23] Maintenance Management Master & Demo Seeding COMPLETE.');
  } catch (error) {
    console.error('[Seed Module 23 Error]:', error);
    throw error;
  }
};

module.exports = seedModule23Maintenance;
