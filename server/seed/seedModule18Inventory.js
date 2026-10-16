/**
 * Comprehensive Seed Script for Module 18: Medical Inventory Management
 * Fulfills all requirements from 18_MEDICAL_INVENTORY.md (Section 93):
 * - 30+ Inventory Items (Medicines, Surgical, Lab, Radiology, PPE, Consumables)
 * - 10+ Locations (Main store, Pharmacy, Emergency, OT, Lab, Radiology, Ward, ICU, Quarantine, Cold storage)
 * - 50+ Batches (Normal, Low stock, Near-expiry, Expired, Quarantined)
 * - 100+ Stock Movements (Receipts, Issues, Transfers, Adjustments, Expiry, Reservations)
 * - 20+ Reservations
 * - 15+ Transfers
 * - 10+ Adjustments
 * - 5+ Stock Count Sessions
 * - 5+ Reconciliations
 * - Realistic Inventory Alerts
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const InventoryItem = require('../models/InventoryItem');
const StockLocation = require('../models/StockLocation');
const InventoryBatch = require('../models/InventoryBatch');
const InventoryMovement = require('../models/InventoryMovement');
const InventoryReservation = require('../models/InventoryReservation');
const InventoryTransfer = require('../models/InventoryTransfer');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const StockCountSession = require('../models/StockCountSession');
const InventoryReconciliation = require('../models/InventoryReconciliation');
const InventoryAlert = require('../models/InventoryAlert');
const GoodsReceipt = require('../models/GoodsReceipt');

const seedModule18Inventory = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    console.log('[Seed Module 18] Connected to MongoDB');

    // Clean existing Module 18 records to allow clean idempotent seeding
    await Promise.all([
      InventoryItem.deleteMany({}),
      StockLocation.deleteMany({}),
      InventoryBatch.deleteMany({ batchId: { $regex: '^BAT-2' } }),
      InventoryMovement.deleteMany({}),
      InventoryReservation.deleteMany({}),
      InventoryTransfer.deleteMany({}),
      InventoryAdjustment.deleteMany({}),
      StockCountSession.deleteMany({}),
      InventoryReconciliation.deleteMany({}),
      InventoryAlert.deleteMany({}),
      GoodsReceipt.deleteMany({})
    ]);

    console.log('[Seed Module 18] Cleared previous inventory collections.');

    // ----------------------------------------------------
    // 1. Seed 10+ Stock Locations
    // ----------------------------------------------------
    const locationsData = [
      {
        locationId: 'LOC-MAIN-001',
        locationCode: 'MAIN-STORE',
        locationName: 'Central Medical & Pharmaceutical Store',
        locationType: 'MAIN_STORE',
        departmentId: 'DEP-INVENTORY',
        address: { building: 'Central Block', floor: 'Basement 1', room: 'B1-101', shelfRack: 'A1-Z99' },
        temperatureControlled: true,
        temperatureRange: '18°C - 22°C',
        securityLevel: 'RESTRICTED',
        capacity: 50000
      },
      {
        locationId: 'LOC-PHARM-001',
        locationCode: 'PHARM-STORE',
        locationName: 'Outpatient Pharmacy Dispensing Store',
        locationType: 'PHARMACY_STORE',
        departmentId: 'DEP-PHARMACY',
        address: { building: 'Clinical Block A', floor: 'Ground Floor', room: 'G-04', shelfRack: 'P1-P20' },
        temperatureControlled: true,
        temperatureRange: '20°C - 24°C',
        securityLevel: 'NORMAL',
        capacity: 10000
      },
      {
        locationId: 'LOC-EMERG-001',
        locationCode: 'EMERG-STORE',
        locationName: 'Emergency Trauma Care Storage',
        locationType: 'EMERGENCY_STORE',
        departmentId: 'DEP-EMERGENCY',
        address: { building: 'Emergency Wing', floor: 'Ground Floor', room: 'ER-CRASH-01', shelfRack: 'E1-E10' },
        temperatureControlled: true,
        temperatureRange: '20°C - 22°C',
        securityLevel: 'HIGH_SECURITY',
        capacity: 5000
      },
      {
        locationId: 'LOC-OT-001',
        locationCode: 'OT-STORE',
        locationName: 'Surgical Operation Theatre Store',
        locationType: 'OT_STORE',
        departmentId: 'DEP-SURGERY',
        address: { building: 'Surgical Wing', floor: '3rd Floor', room: 'OT-STORE-301', shelfRack: 'OT-01-15' },
        temperatureControlled: true,
        temperatureRange: '18°C - 20°C',
        securityLevel: 'RESTRICTED',
        capacity: 8000
      },
      {
        locationId: 'LOC-LAB-001',
        locationCode: 'LAB-STORE',
        locationName: 'Diagnostic Pathology Lab Reagent Store',
        locationType: 'LAB_STORE',
        departmentId: 'DEP-PATHOLOGY',
        address: { building: 'Diagnostic Wing', floor: '2nd Floor', room: 'LAB-204', shelfRack: 'L1-L12' },
        temperatureControlled: true,
        temperatureRange: '16°C - 20°C',
        securityLevel: 'RESTRICTED',
        capacity: 6000
      },
      {
        locationId: 'LOC-RAD-001',
        locationCode: 'RAD-STORE',
        locationName: 'Radiology & Imaging Consumables Store',
        locationType: 'RADIOLOGY_STORE',
        departmentId: 'DEP-RADIOLOGY',
        address: { building: 'Diagnostic Wing', floor: 'Basement 1', room: 'RAD-B10', shelfRack: 'R1-R08' },
        temperatureControlled: true,
        temperatureRange: '20°C - 24°C',
        securityLevel: 'NORMAL',
        capacity: 4000
      },
      {
        locationId: 'LOC-WARD-001',
        locationCode: 'WARD-GEN-STORE',
        locationName: 'General Inpatient Ward Sub-Store',
        locationType: 'WARD_STORE',
        departmentId: 'DEP-INPATIENT',
        address: { building: 'Ward Tower', floor: '4th Floor', room: 'W4-NURSE', shelfRack: 'W1-W05' },
        temperatureControlled: false,
        temperatureRange: '22°C - 26°C',
        securityLevel: 'NORMAL',
        capacity: 3000
      },
      {
        locationId: 'LOC-ICU-001',
        locationCode: 'ICU-STORE',
        locationName: 'Intensive Critical Care Sub-Store',
        locationType: 'ICU_STORE',
        departmentId: 'DEP-ICU',
        address: { building: 'Ward Tower', floor: '2nd Floor', room: 'ICU-STORE-201', shelfRack: 'ICU-01-08' },
        temperatureControlled: true,
        temperatureRange: '20°C - 22°C',
        securityLevel: 'HIGH_SECURITY',
        capacity: 5000
      },
      {
        locationId: 'LOC-COLD-001',
        locationCode: 'COLD-STORAGE',
        locationName: 'Vaccine & Biological Cold Vault',
        locationType: 'COLD_STORAGE',
        departmentId: 'DEP-INVENTORY',
        address: { building: 'Central Block', floor: 'Basement 1', room: 'COLD-01', shelfRack: 'FRIDGE-01-04' },
        temperatureControlled: true,
        temperatureRange: '2°C - 8°C',
        securityLevel: 'HIGH_SECURITY',
        capacity: 15000
      },
      {
        locationId: 'LOC-QUAR-001',
        locationCode: 'QUARANTINE-AREA',
        locationName: 'Damaged & Recalled Quarantine Hold',
        locationType: 'QUARANTINE_AREA',
        departmentId: 'DEP-INVENTORY',
        address: { building: 'Central Block', floor: 'Basement 1', room: 'SEC-HOLD-02', shelfRack: 'Q1-Q06' },
        temperatureControlled: false,
        temperatureRange: 'Ambient',
        securityLevel: 'HIGH_SECURITY',
        capacity: 5000
      }
    ];

    await StockLocation.insertMany(locationsData);
    console.log(`[Seed Module 18] Seeded ${locationsData.length} stock locations.`);

    // ----------------------------------------------------
    // 2. Seed 35+ Inventory Items
    // ----------------------------------------------------
    const itemsData = [
      // Medicines
      {
        inventoryItemId: 'INV-000001',
        itemType: 'MEDICINE',
        medicineId: 'MED-000001',
        name: 'Paracetamol 500mg Tablet',
        genericName: 'Paracetamol',
        brandName: 'Crocin / Calpol',
        category: 'MEDICINE',
        subcategory: 'Analgesics & Antipyretics',
        unitOfMeasure: 'TABLET',
        packSize: 100,
        packUnit: 'BOX',
        baseUnit: 'TABLET',
        conversionFactor: 100,
        manufacturer: 'GSK Pharmaceuticals',
        barcode: 'BC-MED-000001',
        sku: 'SKU-MED-PCM-500',
        reorderLevel: 200,
        reorderQuantity: 1000,
        minimumStock: 100,
        maximumStock: 5000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Room temperature below 25°C',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000002',
        itemType: 'MEDICINE',
        medicineId: 'MED-000002',
        name: 'Amoxicillin 500mg Capsule',
        genericName: 'Amoxicillin Trihydrate',
        brandName: 'Amoxil',
        category: 'MEDICINE',
        subcategory: 'Antibiotics',
        unitOfMeasure: 'CAPSULE',
        packSize: 50,
        packUnit: 'BOX',
        baseUnit: 'CAPSULE',
        conversionFactor: 50,
        manufacturer: 'Pfizer Ltd',
        barcode: 'BC-MED-000002',
        sku: 'SKU-MED-AMX-500',
        reorderLevel: 150,
        reorderQuantity: 600,
        minimumStock: 80,
        maximumStock: 3000,
        prescriptionRequired: true,
        controlledItem: false,
        storageRequirements: 'Cool, dry place',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000003',
        itemType: 'MEDICINE',
        medicineId: 'MED-000003',
        name: 'Morphine Sulfate 10mg/mL Injection',
        genericName: 'Morphine Sulfate',
        brandName: 'Morphitroy',
        category: 'MEDICINE',
        subcategory: 'Opioid Analgesics',
        unitOfMeasure: 'AMPOULE',
        packSize: 10,
        packUnit: 'BOX',
        baseUnit: 'AMPOULE',
        conversionFactor: 10,
        manufacturer: 'Troikaa Pharma',
        barcode: 'BC-MED-000003',
        sku: 'SKU-MED-MPH-010',
        reorderLevel: 50,
        reorderQuantity: 200,
        minimumStock: 20,
        maximumStock: 500,
        prescriptionRequired: true,
        controlledItem: true,
        storageRequirements: 'Double lock narcotics cabinet',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000004',
        itemType: 'MEDICINE',
        medicineId: 'MED-000004',
        name: 'Human Insulin Regular 100 IU/mL',
        genericName: 'Recombinant Human Insulin',
        brandName: 'Actrapid',
        category: 'MEDICINE',
        subcategory: 'Antidiabetic Agents',
        unitOfMeasure: 'VIAL',
        packSize: 1,
        packUnit: 'VIAL',
        baseUnit: 'VIAL',
        conversionFactor: 1,
        manufacturer: 'Novo Nordisk',
        barcode: 'BC-MED-000004',
        sku: 'SKU-MED-INS-100',
        reorderLevel: 60,
        reorderQuantity: 300,
        minimumStock: 30,
        maximumStock: 1000,
        prescriptionRequired: true,
        controlledItem: false,
        storageRequirements: 'Refrigerated between 2°C to 8°C. Do not freeze.',
        temperatureRequirement: 'Refrigerated (2-8°C)',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000005',
        itemType: 'MEDICINE',
        medicineId: 'MED-000005',
        name: 'Ceftriaxone 1g Injection',
        genericName: 'Ceftriaxone Sodium',
        brandName: 'Monocef',
        category: 'MEDICINE',
        subcategory: 'Cephalosporin Antibiotics',
        unitOfMeasure: 'VIAL',
        packSize: 10,
        packUnit: 'BOX',
        baseUnit: 'VIAL',
        conversionFactor: 10,
        manufacturer: 'Aristo Pharma',
        barcode: 'BC-MED-000005',
        sku: 'SKU-MED-CFT-001',
        reorderLevel: 100,
        reorderQuantity: 500,
        minimumStock: 50,
        maximumStock: 2500,
        prescriptionRequired: true,
        controlledItem: false,
        storageRequirements: 'Store below 25°C',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000006',
        itemType: 'MEDICINE',
        medicineId: 'MED-000006',
        name: 'Pantoprazole 40mg Tablet',
        genericName: 'Pantoprazole Sodium',
        brandName: 'Pan 40',
        category: 'MEDICINE',
        subcategory: 'Gastrointestinal',
        unitOfMeasure: 'TABLET',
        packSize: 150,
        packUnit: 'BOX',
        baseUnit: 'TABLET',
        conversionFactor: 150,
        manufacturer: 'Alkem Labs',
        barcode: 'BC-MED-000006',
        sku: 'SKU-MED-PAN-040',
        reorderLevel: 120,
        reorderQuantity: 800,
        minimumStock: 60,
        maximumStock: 3000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Room temperature',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000007',
        itemType: 'MEDICINE',
        medicineId: 'MED-000007',
        name: 'Atorvastatin 20mg Tablet',
        genericName: 'Atorvastatin Calcium',
        brandName: 'Lipitor',
        category: 'MEDICINE',
        subcategory: 'Cardiovascular',
        unitOfMeasure: 'TABLET',
        packSize: 100,
        packUnit: 'BOX',
        baseUnit: 'TABLET',
        conversionFactor: 100,
        manufacturer: 'Cipla Ltd',
        barcode: 'BC-MED-000007',
        sku: 'SKU-MED-ATV-020',
        reorderLevel: 80,
        reorderQuantity: 400,
        minimumStock: 40,
        maximumStock: 2000,
        prescriptionRequired: true,
        controlledItem: false,
        storageRequirements: 'Room temperature',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000008',
        itemType: 'MEDICINE',
        medicineId: 'MED-000008',
        name: 'Metformin 500mg Tablet',
        genericName: 'Metformin Hydrochloride',
        brandName: 'Glucophage',
        category: 'MEDICINE',
        subcategory: 'Antidiabetic Agents',
        unitOfMeasure: 'TABLET',
        packSize: 100,
        packUnit: 'BOX',
        baseUnit: 'TABLET',
        conversionFactor: 100,
        manufacturer: 'USV Private Ltd',
        barcode: 'BC-MED-000008',
        sku: 'SKU-MED-MET-500',
        reorderLevel: 150,
        reorderQuantity: 600,
        minimumStock: 80,
        maximumStock: 3000,
        prescriptionRequired: true,
        controlledItem: false,
        storageRequirements: 'Room temperature',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000009',
        itemType: 'MEDICINE',
        medicineId: 'MED-000009',
        name: 'Salbutamol Inhaler 100mcg',
        genericName: 'Salbutamol Sulphate',
        brandName: 'Ventorlin',
        category: 'MEDICINE',
        subcategory: 'Respiratory',
        unitOfMeasure: 'UNIT',
        packSize: 1,
        packUnit: 'PIECE',
        baseUnit: 'UNIT',
        conversionFactor: 1,
        manufacturer: 'GSK Pharmaceuticals',
        barcode: 'BC-MED-000009',
        sku: 'SKU-MED-SLB-100',
        reorderLevel: 40,
        reorderQuantity: 200,
        minimumStock: 20,
        maximumStock: 800,
        prescriptionRequired: true,
        controlledItem: false,
        storageRequirements: 'Store below 30°C away from direct sunlight',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000010',
        itemType: 'MEDICINE',
        medicineId: 'MED-000010',
        name: 'Fentanyl 50mcg/mL Ampoule',
        genericName: 'Fentanyl Citrate',
        brandName: 'Troifent',
        category: 'MEDICINE',
        subcategory: 'Anesthetics & Narcotics',
        unitOfMeasure: 'AMPOULE',
        packSize: 5,
        packUnit: 'BOX',
        baseUnit: 'AMPOULE',
        conversionFactor: 5,
        manufacturer: 'Troikaa Pharma',
        barcode: 'BC-MED-000010',
        sku: 'SKU-MED-FNT-050',
        reorderLevel: 30,
        reorderQuantity: 150,
        minimumStock: 15,
        maximumStock: 400,
        prescriptionRequired: true,
        controlledItem: true,
        storageRequirements: 'Narcotics Vault Safe',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },

      // Surgical Supplies
      {
        inventoryItemId: 'INV-000011',
        itemType: 'SURGICAL_SUPPLY',
        name: 'Sterile Surgical Gloves Size 7.5',
        genericName: 'Latex Powder-Free Surgical Gloves',
        brandName: 'Gammex',
        category: 'SURGICAL_SUPPLY',
        subcategory: 'Sterile Barrier Protection',
        unitOfMeasure: 'PAIR',
        packSize: 50,
        packUnit: 'BOX',
        baseUnit: 'PAIR',
        conversionFactor: 50,
        manufacturer: 'Ansell Healthcare',
        barcode: 'BC-SUR-000011',
        sku: 'SKU-SUR-GLV-075',
        reorderLevel: 100,
        reorderQuantity: 500,
        minimumStock: 50,
        maximumStock: 2500,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Dry and cool storage',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000012',
        itemType: 'SURGICAL_SUPPLY',
        name: 'Absorbable Polyglactin 910 Suture 2-0',
        genericName: 'Braided Synthetic Suture',
        brandName: 'Vicryl',
        category: 'SURGICAL_SUPPLY',
        subcategory: 'Wound Closure',
        unitOfMeasure: 'PIECE',
        packSize: 36,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 36,
        manufacturer: 'Ethicon (J&J)',
        barcode: 'BC-SUR-000012',
        sku: 'SKU-SUR-SUT-VCR',
        reorderLevel: 40,
        reorderQuantity: 200,
        minimumStock: 20,
        maximumStock: 800,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Store in moisture-proof pack',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000013',
        itemType: 'SURGICAL_SUPPLY',
        name: 'Surgical Blade Size #15',
        genericName: 'Carbon Steel Scalpel Blade',
        brandName: 'Swann-Morton',
        category: 'SURGICAL_SUPPLY',
        subcategory: 'Sharps & Cutting',
        unitOfMeasure: 'PIECE',
        packSize: 100,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 100,
        manufacturer: 'Swann-Morton Ltd',
        barcode: 'BC-SUR-000013',
        sku: 'SKU-SUR-BLD-015',
        reorderLevel: 80,
        reorderQuantity: 400,
        minimumStock: 40,
        maximumStock: 1500,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Store dry in safety dispenser',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000014',
        itemType: 'SURGICAL_SUPPLY',
        name: 'Surgical Disposable Drape Kit (Major)',
        genericName: 'Universal Surgical Patient Drape Pack',
        brandName: 'Barrierman',
        category: 'SURGICAL_SUPPLY',
        subcategory: 'Sterile Drapes',
        unitOfMeasure: 'PACK',
        packSize: 10,
        packUnit: 'BOX',
        baseUnit: 'PACK',
        conversionFactor: 10,
        manufacturer: '3M Healthcare',
        barcode: 'BC-SUR-000014',
        sku: 'SKU-SUR-DRP-001',
        reorderLevel: 30,
        reorderQuantity: 100,
        minimumStock: 15,
        maximumStock: 500,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Sterile sealed dry packaging',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000015',
        itemType: 'SURGICAL_SUPPLY',
        name: 'Disposable Electrosurgical Cautery Pencil',
        genericName: 'Monopolar Electrosurgical Pencil',
        brandName: 'Valleylab',
        category: 'SURGICAL_SUPPLY',
        subcategory: 'Electrosurgery',
        unitOfMeasure: 'PIECE',
        packSize: 25,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 25,
        manufacturer: 'Medtronic',
        barcode: 'BC-SUR-000015',
        sku: 'SKU-SUR-CTR-001',
        reorderLevel: 25,
        reorderQuantity: 100,
        minimumStock: 15,
        maximumStock: 400,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Sterile container',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },

      // Medical Consumables
      {
        inventoryItemId: 'INV-000016',
        itemType: 'MEDICAL_CONSUMABLE',
        name: 'Disposable Syringe 5mL with 23G Needle',
        genericName: 'Luer Lock 3-Part Syringe',
        brandName: 'BD Disposafe',
        category: 'MEDICAL_CONSUMABLE',
        subcategory: 'Injection & Infusion',
        unitOfMeasure: 'PIECE',
        packSize: 100,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 100,
        manufacturer: 'Becton Dickinson',
        barcode: 'BC-CON-000016',
        sku: 'SKU-CON-SYR-005',
        reorderLevel: 300,
        reorderQuantity: 2000,
        minimumStock: 150,
        maximumStock: 10000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Standard dry medical storage',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000017',
        itemType: 'MEDICAL_CONSUMABLE',
        name: 'IV Infusion Cannula 20G (Pink)',
        genericName: 'Intravenous Catheter with Port',
        brandName: 'BD Venflon',
        category: 'MEDICAL_CONSUMABLE',
        subcategory: 'Vascular Access',
        unitOfMeasure: 'PIECE',
        packSize: 50,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 50,
        manufacturer: 'Becton Dickinson',
        barcode: 'BC-CON-000017',
        sku: 'SKU-CON-CAN-020',
        reorderLevel: 200,
        reorderQuantity: 1000,
        minimumStock: 100,
        maximumStock: 5000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Dry place away from moisture',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000018',
        itemType: 'MEDICAL_CONSUMABLE',
        name: 'Normal Saline 0.9% IV Solution 500mL',
        genericName: 'Sodium Chloride 0.9% Injection',
        brandName: 'Baxter NS',
        category: 'MEDICAL_CONSUMABLE',
        subcategory: 'Intravenous Fluids',
        unitOfMeasure: 'BOTTLE',
        packSize: 20,
        packUnit: 'BOX',
        baseUnit: 'BOTTLE',
        conversionFactor: 20,
        manufacturer: 'Baxter Healthcare',
        barcode: 'BC-CON-000018',
        sku: 'SKU-CON-IVF-001',
        reorderLevel: 150,
        reorderQuantity: 800,
        minimumStock: 80,
        maximumStock: 4000,
        prescriptionRequired: true,
        controlledItem: false,
        storageRequirements: 'Room temperature below 25°C',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000019',
        itemType: 'MEDICAL_CONSUMABLE',
        name: 'Sterile Cotton Gauze Swab 10x10cm',
        genericName: '12-Ply 100% Cotton Gauze Pads',
        brandName: 'DynaGauze',
        category: 'MEDICAL_CONSUMABLE',
        subcategory: 'Wound Dressing',
        unitOfMeasure: 'PACK',
        packSize: 100,
        packUnit: 'BOX',
        baseUnit: 'PACK',
        conversionFactor: 100,
        manufacturer: 'Dyna Healthcare',
        barcode: 'BC-CON-000019',
        sku: 'SKU-CON-GZ-1010',
        reorderLevel: 200,
        reorderQuantity: 1000,
        minimumStock: 100,
        maximumStock: 6000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Store in clean dry room',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000020',
        itemType: 'MEDICAL_CONSUMABLE',
        name: 'Foley Urinary Catheter 2-Way 16Fr',
        genericName: 'Siliconized Latex Balloon Catheter',
        brandName: 'Rusch Foley',
        category: 'MEDICAL_CONSUMABLE',
        subcategory: 'Urology Consumables',
        unitOfMeasure: 'PIECE',
        packSize: 10,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 10,
        manufacturer: 'Teleflex Medical',
        barcode: 'BC-CON-000020',
        sku: 'SKU-CON-CTH-016',
        reorderLevel: 50,
        reorderQuantity: 200,
        minimumStock: 25,
        maximumStock: 1000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Sterile peel pouch',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },

      // Lab Consumables
      {
        inventoryItemId: 'INV-000021',
        itemType: 'LAB_CONSUMABLE',
        name: 'EDTA K2 Blood Collection Tube 3mL (Lavender Top)',
        genericName: 'Vacutainer EDTA K2 Tube',
        brandName: 'BD Vacutainer',
        category: 'LAB_CONSUMABLE',
        subcategory: 'Blood Collection',
        unitOfMeasure: 'PIECE',
        packSize: 100,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 100,
        manufacturer: 'Becton Dickinson',
        barcode: 'BC-LAB-000021',
        sku: 'SKU-LAB-EDTA-003',
        reorderLevel: 250,
        reorderQuantity: 1500,
        minimumStock: 100,
        maximumStock: 8000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Store at 4°C - 25°C',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000022',
        itemType: 'LAB_CONSUMABLE',
        name: 'Serum Separator SST Blood Tube 5mL (Gold Top)',
        genericName: 'Vacutainer Gel & Clot Activator Tube',
        brandName: 'BD Vacutainer SST',
        category: 'LAB_CONSUMABLE',
        subcategory: 'Blood Collection',
        unitOfMeasure: 'PIECE',
        packSize: 100,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 100,
        manufacturer: 'Becton Dickinson',
        barcode: 'BC-LAB-000022',
        sku: 'SKU-LAB-SST-005',
        reorderLevel: 200,
        reorderQuantity: 1200,
        minimumStock: 80,
        maximumStock: 6000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Store at 4°C - 25°C',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000023',
        itemType: 'LAB_CONSUMABLE',
        name: 'Biochemistry Reagent Pack - Glucose Hexokinase',
        genericName: 'Automated Glucose Enzymatic Reagent',
        brandName: 'Roche Cobas c501',
        category: 'LAB_CONSUMABLE',
        subcategory: 'Clinical Chemistry Reagents',
        unitOfMeasure: 'PACK',
        packSize: 1,
        packUnit: 'PACK',
        baseUnit: 'PACK',
        conversionFactor: 1,
        manufacturer: 'Roche Diagnostics',
        barcode: 'BC-LAB-000023',
        sku: 'SKU-LAB-GLU-001',
        reorderLevel: 10,
        reorderQuantity: 50,
        minimumStock: 5,
        maximumStock: 150,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Constant 2°C - 8°C cold chain mandatory',
        temperatureRequirement: 'Refrigerated (2-8°C)',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000024',
        itemType: 'LAB_CONSUMABLE',
        name: 'COVID-19 & Flu A/B Rapid Antigen Test Kit',
        genericName: 'Colloidal Gold Immunoassay Kit',
        brandName: 'Panbio Combo',
        category: 'LAB_CONSUMABLE',
        subcategory: 'Point of Care Testing',
        unitOfMeasure: 'PIECE',
        packSize: 25,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 25,
        manufacturer: 'Abbott Diagnostics',
        barcode: 'BC-LAB-000024',
        sku: 'SKU-LAB-CVF-025',
        reorderLevel: 50,
        reorderQuantity: 250,
        minimumStock: 25,
        maximumStock: 1500,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Store between 2°C - 30°C',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000025',
        itemType: 'LAB_CONSUMABLE',
        name: 'Urine Multistix 10SG Diagnostic Test Strips',
        genericName: '10-Parameter Urinalysis Reagent Strips',
        brandName: 'Siemens Multistix',
        category: 'LAB_CONSUMABLE',
        subcategory: 'Urinalysis',
        unitOfMeasure: 'BOTTLE',
        packSize: 100,
        packUnit: 'BOTTLE',
        baseUnit: 'PIECE',
        conversionFactor: 100,
        manufacturer: 'Siemens Healthineers',
        barcode: 'BC-LAB-000025',
        sku: 'SKU-LAB-URI-100',
        reorderLevel: 30,
        reorderQuantity: 150,
        minimumStock: 15,
        maximumStock: 600,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Keep desiccated cap tightly closed',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },

      // Radiology Consumables
      {
        inventoryItemId: 'INV-000026',
        itemType: 'RADIOLOGY_CONSUMABLE',
        name: 'Non-Ionic CT Contrast Media Iohexol 350mg/mL 100mL',
        genericName: 'Iohexol Injection',
        brandName: 'Omnipaque 350',
        category: 'RADIOLOGY_CONSUMABLE',
        subcategory: 'X-Ray & CT Contrast Agents',
        unitOfMeasure: 'VIAL',
        packSize: 10,
        packUnit: 'BOX',
        baseUnit: 'VIAL',
        conversionFactor: 10,
        manufacturer: 'GE Healthcare',
        barcode: 'BC-RAD-000026',
        sku: 'SKU-RAD-IOX-100',
        reorderLevel: 30,
        reorderQuantity: 150,
        minimumStock: 15,
        maximumStock: 600,
        prescriptionRequired: true,
        controlledItem: false,
        storageRequirements: 'Store below 30°C protected from light and X-rays',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000027',
        itemType: 'RADIOLOGY_CONSUMABLE',
        name: 'MRI Contrast Media Gadoteric Acid 0.5mmol/mL 20mL',
        genericName: 'Gadoterate Meglumine',
        brandName: 'Dotarem',
        category: 'RADIOLOGY_CONSUMABLE',
        subcategory: 'MRI Contrast Agents',
        unitOfMeasure: 'VIAL',
        packSize: 10,
        packUnit: 'BOX',
        baseUnit: 'VIAL',
        conversionFactor: 10,
        manufacturer: 'Guerbet',
        barcode: 'BC-RAD-000027',
        sku: 'SKU-RAD-GAD-020',
        reorderLevel: 20,
        reorderQuantity: 80,
        minimumStock: 10,
        maximumStock: 300,
        prescriptionRequired: true,
        controlledItem: false,
        storageRequirements: 'Do not freeze. Protect from light.',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000028',
        itemType: 'RADIOLOGY_CONSUMABLE',
        name: 'CT Dual Head Power Injector Syringe Kit 200mL',
        genericName: 'Sterile Contrast Delivery Syringe & Tube',
        brandName: 'Medrad Stellant CT Kit',
        category: 'RADIOLOGY_CONSUMABLE',
        subcategory: 'Injection Delivery Sets',
        unitOfMeasure: 'PACK',
        packSize: 50,
        packUnit: 'BOX',
        baseUnit: 'PACK',
        conversionFactor: 50,
        manufacturer: 'Bayer Radiology',
        barcode: 'BC-RAD-000028',
        sku: 'SKU-RAD-SYR-200',
        reorderLevel: 25,
        reorderQuantity: 100,
        minimumStock: 12,
        maximumStock: 400,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Clean dry medical storage',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },

      // PPE
      {
        inventoryItemId: 'INV-000029',
        itemType: 'PPE',
        name: 'N95 Particulate Respirator Mask 3M 1860',
        genericName: 'NIOSH Certified N95 Health Care Mask',
        brandName: '3M Aura / 1860',
        category: 'PPE',
        subcategory: 'Respiratory Protection',
        unitOfMeasure: 'PIECE',
        packSize: 20,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 20,
        manufacturer: '3M Healthcare',
        barcode: 'BC-PPE-000029',
        sku: 'SKU-PPE-N95-001',
        reorderLevel: 200,
        reorderQuantity: 1000,
        minimumStock: 100,
        maximumStock: 5000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Store in original packaging',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000030',
        itemType: 'PPE',
        name: 'Fluid Resistant Disposable Surgical Isolation Gown',
        genericName: 'AAMI Level 3 Medical Protective Gown',
        brandName: 'Halyard Health Gown',
        category: 'PPE',
        subcategory: 'Body Protection',
        unitOfMeasure: 'PIECE',
        packSize: 50,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 50,
        manufacturer: 'O&M Halyard',
        barcode: 'BC-PPE-000030',
        sku: 'SKU-PPE-GWN-003',
        reorderLevel: 150,
        reorderQuantity: 600,
        minimumStock: 80,
        maximumStock: 3000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Dry warehouse storage',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },

      // Disinfectants & General Clinical Supplies
      {
        inventoryItemId: 'INV-000031',
        itemType: 'DISINFECTANT',
        name: 'Alcohol Hand Rub Sanitizer 500mL Bottle',
        genericName: '70% Isopropyl Alcohol + Chlorhexidine Gluconate',
        brandName: 'Sterillium',
        category: 'DISINFECTANT',
        subcategory: 'Hand Hygiene',
        unitOfMeasure: 'BOTTLE',
        packSize: 24,
        packUnit: 'BOX',
        baseUnit: 'BOTTLE',
        conversionFactor: 24,
        manufacturer: 'Bode Chemie / Hartmann',
        barcode: 'BC-DIS-000031',
        sku: 'SKU-DIS-SAN-500',
        reorderLevel: 100,
        reorderQuantity: 500,
        minimumStock: 50,
        maximumStock: 2500,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Flammable liquid storage cabinet',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000032',
        itemType: 'DISINFECTANT',
        name: 'Povidone-Iodine 10% Antiseptic Solution 500mL',
        genericName: 'Povidone Iodine 10% w/v',
        brandName: 'Betadine Solution',
        category: 'DISINFECTANT',
        subcategory: 'Skin & Wound Antiseptics',
        unitOfMeasure: 'BOTTLE',
        packSize: 20,
        packUnit: 'BOX',
        baseUnit: 'BOTTLE',
        conversionFactor: 20,
        manufacturer: 'Win-Medicare',
        barcode: 'BC-DIS-000032',
        sku: 'SKU-DIS-BET-500',
        reorderLevel: 80,
        reorderQuantity: 400,
        minimumStock: 40,
        maximumStock: 2000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Store below 25°C',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000033',
        itemType: 'GENERAL_CLINICAL_SUPPLY',
        name: 'Digital Clinical Thermometer (Oral/Axillary)',
        genericName: 'Fast Reading Digital Thermometer',
        brandName: 'Omron Eco Temp',
        category: 'GENERAL_CLINICAL_SUPPLY',
        subcategory: 'Vital Sign Monitoring',
        unitOfMeasure: 'PIECE',
        packSize: 10,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 10,
        manufacturer: 'Omron Healthcare',
        barcode: 'BC-GEN-000033',
        sku: 'SKU-GEN-THM-001',
        reorderLevel: 20,
        reorderQuantity: 80,
        minimumStock: 10,
        maximumStock: 300,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Room temperature dry storage',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000034',
        itemType: 'GENERAL_CLINICAL_SUPPLY',
        name: 'Disposable Tongue Depressors (Wooden, Sterile)',
        genericName: 'Birchwood Tongue Depressor',
        brandName: 'Puritan Medical',
        category: 'GENERAL_CLINICAL_SUPPLY',
        subcategory: 'Diagnostic Accessories',
        unitOfMeasure: 'BOX',
        packSize: 100,
        packUnit: 'BOX',
        baseUnit: 'PIECE',
        conversionFactor: 100,
        manufacturer: 'Puritan Medical',
        barcode: 'BC-GEN-000034',
        sku: 'SKU-GEN-TNG-100',
        reorderLevel: 50,
        reorderQuantity: 200,
        minimumStock: 20,
        maximumStock: 1000,
        prescriptionRequired: false,
        controlledItem: false,
        storageRequirements: 'Store dry',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      },
      {
        inventoryItemId: 'INV-000035',
        itemType: 'MEDICINE',
        medicineId: 'MED-000011',
        name: 'Dextrose 5% Solution 500mL',
        genericName: 'Glucose Intravenous Infusion 5%',
        brandName: 'Baxter D5W',
        category: 'MEDICINE',
        subcategory: 'Intravenous Fluids',
        unitOfMeasure: 'BOTTLE',
        packSize: 20,
        packUnit: 'BOX',
        baseUnit: 'BOTTLE',
        conversionFactor: 20,
        manufacturer: 'Baxter Healthcare',
        barcode: 'BC-MED-000035',
        sku: 'SKU-MED-D5W-500',
        reorderLevel: 100,
        reorderQuantity: 500,
        minimumStock: 50,
        maximumStock: 2500,
        prescriptionRequired: true,
        controlledItem: false,
        storageRequirements: 'Room temperature below 25°C',
        temperatureRequirement: 'Ambient',
        status: 'ACTIVE'
      }
    ];

    await InventoryItem.insertMany(itemsData);
    console.log(`[Seed Module 18] Seeded ${itemsData.length} inventory items.`);

    // ----------------------------------------------------
    // 3. Seed 55+ Inventory Batches
    // (Normal, Low Stock, Near-Expiry, Expired, Quarantined)
    // ----------------------------------------------------
    const now = new Date();
    const future1Yr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const future2Yr = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000);
    const nearExpiryDate = new Date(Date.now() + 18 * 24 * 60 * 60 * 1000); // 18 days away (< 30)
    const veryNearExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days away (< 7)
    const pastExpiredDate1 = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
    const pastExpiredDate2 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago

    const batchesData = [];

    // Helper generator for batch IDs
    let bSeq = 20001;

    // Batches for Item 1 (Paracetamol) - 3 batches
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000001',
      medicineId: 'MED-000001',
      medicineName: 'Paracetamol',
      itemName: 'Paracetamol 500mg Tablet',
      batchNumber: 'PCM-2026-A01',
      lotNumber: 'LOT-PCM-991',
      manufacturer: 'GSK',
      expiryDate: future2Yr,
      locationId: 'LOC-MAIN-001',
      unitCost: 1.5,
      sellingPrice: 3.0,
      initialQuantity: 2000,
      receivedQuantity: 2000,
      onHandQuantity: 1400,
      availableQuantity: 1350,
      reservedQuantity: 50,
      status: 'AVAILABLE'
    });
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000001',
      medicineId: 'MED-000001',
      medicineName: 'Paracetamol',
      itemName: 'Paracetamol 500mg Tablet',
      batchNumber: 'PCM-2026-A02',
      lotNumber: 'LOT-PCM-992',
      manufacturer: 'GSK',
      expiryDate: future1Yr,
      locationId: 'LOC-PHARM-001',
      unitCost: 1.5,
      sellingPrice: 3.0,
      initialQuantity: 800,
      receivedQuantity: 800,
      onHandQuantity: 500,
      availableQuantity: 470,
      reservedQuantity: 30,
      status: 'AVAILABLE'
    });
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000001',
      medicineId: 'MED-000001',
      medicineName: 'Paracetamol',
      itemName: 'Paracetamol 500mg Tablet',
      batchNumber: 'PCM-2025-OLD',
      lotNumber: 'LOT-PCM-801',
      manufacturer: 'GSK',
      expiryDate: pastExpiredDate1,
      locationId: 'LOC-MAIN-001',
      unitCost: 1.5,
      sellingPrice: 3.0,
      initialQuantity: 100,
      receivedQuantity: 100,
      onHandQuantity: 100,
      availableQuantity: 0,
      expiredQuantity: 100,
      status: 'EXPIRED'
    });

    // Batches for Item 2 (Amoxicillin) - 2 batches (1 near expiry!)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000002',
      medicineId: 'MED-000002',
      medicineName: 'Amoxicillin Trihydrate',
      itemName: 'Amoxicillin 500mg Capsule',
      batchNumber: 'AMX-2026-B01',
      lotNumber: 'LOT-AMX-11',
      manufacturer: 'Pfizer',
      expiryDate: nearExpiryDate, // Near Expiry!
      locationId: 'LOC-PHARM-001',
      unitCost: 4.0,
      sellingPrice: 8.0,
      initialQuantity: 400,
      receivedQuantity: 400,
      onHandQuantity: 120,
      availableQuantity: 120,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000002',
      medicineId: 'MED-000002',
      medicineName: 'Amoxicillin Trihydrate',
      itemName: 'Amoxicillin 500mg Capsule',
      batchNumber: 'AMX-2026-B02',
      lotNumber: 'LOT-AMX-12',
      manufacturer: 'Pfizer',
      expiryDate: future1Yr,
      locationId: 'LOC-MAIN-001',
      unitCost: 4.0,
      sellingPrice: 8.0,
      initialQuantity: 1000,
      receivedQuantity: 1000,
      onHandQuantity: 850,
      availableQuantity: 850,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for Item 3 (Morphine - Controlled Item)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000003',
      medicineId: 'MED-000003',
      medicineName: 'Morphine Sulfate',
      itemName: 'Morphine Sulfate 10mg/mL Injection',
      batchNumber: 'MPH-2026-C01',
      lotNumber: 'LOT-MPH-01',
      manufacturer: 'Troikaa',
      expiryDate: future1Yr,
      locationId: 'LOC-MAIN-001',
      unitCost: 15.0,
      sellingPrice: 30.0,
      initialQuantity: 100,
      receivedQuantity: 100,
      onHandQuantity: 80,
      availableQuantity: 70,
      reservedQuantity: 10,
      status: 'AVAILABLE'
    });
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000003',
      medicineId: 'MED-000003',
      medicineName: 'Morphine Sulfate',
      itemName: 'Morphine Sulfate 10mg/mL Injection',
      batchNumber: 'MPH-2026-C02',
      lotNumber: 'LOT-MPH-02',
      manufacturer: 'Troikaa',
      expiryDate: future2Yr,
      locationId: 'LOC-EMERG-001',
      unitCost: 15.0,
      sellingPrice: 30.0,
      initialQuantity: 50,
      receivedQuantity: 50,
      onHandQuantity: 40,
      availableQuantity: 40,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for Item 4 (Insulin - Cold Storage)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000004',
      medicineId: 'MED-000004',
      medicineName: 'Human Insulin',
      itemName: 'Human Insulin Regular 100 IU/mL',
      batchNumber: 'INS-2026-D01',
      lotNumber: 'LOT-INS-01',
      manufacturer: 'Novo Nordisk',
      expiryDate: veryNearExpiry, // 5 days left!
      locationId: 'LOC-COLD-001',
      unitCost: 35.0,
      sellingPrice: 65.0,
      initialQuantity: 150,
      receivedQuantity: 150,
      onHandQuantity: 35,
      availableQuantity: 35,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000004',
      medicineId: 'MED-000004',
      medicineName: 'Human Insulin',
      itemName: 'Human Insulin Regular 100 IU/mL',
      batchNumber: 'INS-2026-D02',
      lotNumber: 'LOT-INS-02',
      manufacturer: 'Novo Nordisk',
      expiryDate: future1Yr,
      locationId: 'LOC-COLD-001',
      unitCost: 35.0,
      sellingPrice: 65.0,
      initialQuantity: 300,
      receivedQuantity: 300,
      onHandQuantity: 280,
      availableQuantity: 280,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for Item 5 (Ceftriaxone)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000005',
      medicineId: 'MED-000005',
      medicineName: 'Ceftriaxone',
      itemName: 'Ceftriaxone 1g Injection',
      batchNumber: 'CFT-2026-E01',
      lotNumber: 'LOT-CFT-01',
      manufacturer: 'Aristo',
      expiryDate: future1Yr,
      locationId: 'LOC-MAIN-001',
      unitCost: 8.0,
      sellingPrice: 18.0,
      initialQuantity: 500,
      receivedQuantity: 500,
      onHandQuantity: 380,
      availableQuantity: 380,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for Surgical Gloves (Item 11)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000011',
      itemName: 'Sterile Surgical Gloves Size 7.5',
      batchNumber: 'GLV-2026-S01',
      lotNumber: 'LOT-GLV-01',
      manufacturer: 'Ansell',
      expiryDate: future2Yr,
      locationId: 'LOC-OT-001',
      unitCost: 1.2,
      sellingPrice: 2.5,
      initialQuantity: 1000,
      receivedQuantity: 1000,
      onHandQuantity: 750,
      availableQuantity: 700,
      reservedQuantity: 50,
      status: 'AVAILABLE'
    });
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000011',
      itemName: 'Sterile Surgical Gloves Size 7.5',
      batchNumber: 'GLV-2026-S02',
      lotNumber: 'LOT-GLV-02',
      manufacturer: 'Ansell',
      expiryDate: future1Yr,
      locationId: 'LOC-MAIN-001',
      unitCost: 1.2,
      sellingPrice: 2.5,
      initialQuantity: 2000,
      receivedQuantity: 2000,
      onHandQuantity: 1800,
      availableQuantity: 1800,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for Sutures (Item 12)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000012',
      itemName: 'Absorbable Polyglactin 910 Suture 2-0',
      batchNumber: 'VCR-2026-01',
      lotNumber: 'LOT-VCR-01',
      manufacturer: 'Ethicon',
      expiryDate: future2Yr,
      locationId: 'LOC-OT-001',
      unitCost: 12.0,
      sellingPrice: 24.0,
      initialQuantity: 250,
      receivedQuantity: 250,
      onHandQuantity: 180,
      availableQuantity: 180,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for Scalpel Blades (Item 13)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000013',
      itemName: 'Surgical Blade Size #15',
      batchNumber: 'BLD-2026-01',
      lotNumber: 'LOT-BLD-01',
      manufacturer: 'Swann-Morton',
      expiryDate: future2Yr,
      locationId: 'LOC-OT-001',
      unitCost: 0.8,
      sellingPrice: 2.0,
      initialQuantity: 500,
      receivedQuantity: 500,
      onHandQuantity: 420,
      availableQuantity: 420,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for Syringes (Item 16)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000016',
      itemName: 'Disposable Syringe 5mL with 23G Needle',
      batchNumber: 'SYR-2026-N01',
      lotNumber: 'LOT-SYR-01',
      manufacturer: 'BD',
      expiryDate: future2Yr,
      locationId: 'LOC-MAIN-001',
      unitCost: 0.35,
      sellingPrice: 1.0,
      initialQuantity: 5000,
      receivedQuantity: 5000,
      onHandQuantity: 4200,
      availableQuantity: 4000,
      reservedQuantity: 200,
      status: 'AVAILABLE'
    });
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000016',
      itemName: 'Disposable Syringe 5mL with 23G Needle',
      batchNumber: 'SYR-2026-N02',
      lotNumber: 'LOT-SYR-02',
      manufacturer: 'BD',
      expiryDate: future1Yr,
      locationId: 'LOC-WARD-001',
      unitCost: 0.35,
      sellingPrice: 1.0,
      initialQuantity: 800,
      receivedQuantity: 800,
      onHandQuantity: 650,
      availableQuantity: 650,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for IV Cannula (Item 17)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000017',
      itemName: 'IV Infusion Cannula 20G (Pink)',
      batchNumber: 'CAN-2026-P01',
      lotNumber: 'LOT-CAN-01',
      manufacturer: 'BD',
      expiryDate: future2Yr,
      locationId: 'LOC-MAIN-001',
      unitCost: 1.1,
      sellingPrice: 3.5,
      initialQuantity: 2000,
      receivedQuantity: 2000,
      onHandQuantity: 1600,
      availableQuantity: 1600,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for Normal Saline (Item 18 - Low Stock Scenario in Ward)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000018',
      itemName: 'Normal Saline 0.9% IV Solution 500mL',
      batchNumber: 'NS-2026-W01',
      lotNumber: 'LOT-NS-01',
      manufacturer: 'Baxter',
      expiryDate: future1Yr,
      locationId: 'LOC-MAIN-001',
      unitCost: 1.8,
      sellingPrice: 4.5,
      initialQuantity: 1000,
      receivedQuantity: 1000,
      onHandQuantity: 720,
      availableQuantity: 720,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000018',
      itemName: 'Normal Saline 0.9% IV Solution 500mL',
      batchNumber: 'NS-2026-W02',
      lotNumber: 'LOT-NS-02',
      manufacturer: 'Baxter',
      expiryDate: nearExpiryDate,
      locationId: 'LOC-WARD-001',
      unitCost: 1.8,
      sellingPrice: 4.5,
      initialQuantity: 100,
      receivedQuantity: 100,
      onHandQuantity: 45, // Below reorder level (150)
      availableQuantity: 45,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for Blood Collection Tubes (Item 21 & 22)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000021',
      itemName: 'EDTA K2 Blood Collection Tube 3mL (Lavender Top)',
      batchNumber: 'EDTA-2026-01',
      lotNumber: 'LOT-EDTA-01',
      manufacturer: 'BD',
      expiryDate: future1Yr,
      locationId: 'LOC-LAB-001',
      unitCost: 0.6,
      sellingPrice: 1.5,
      initialQuantity: 2500,
      receivedQuantity: 2500,
      onHandQuantity: 1950,
      availableQuantity: 1950,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000022',
      itemName: 'Serum Separator SST Blood Tube 5mL (Gold Top)',
      batchNumber: 'SST-2026-01',
      lotNumber: 'LOT-SST-01',
      manufacturer: 'BD',
      expiryDate: future1Yr,
      locationId: 'LOC-LAB-001',
      unitCost: 0.7,
      sellingPrice: 1.8,
      initialQuantity: 2000,
      receivedQuantity: 2000,
      onHandQuantity: 1540,
      availableQuantity: 1540,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for CT Contrast (Item 26)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000026',
      itemName: 'Non-Ionic CT Contrast Media Iohexol 350mg/mL 100mL',
      batchNumber: 'IOX-2026-01',
      lotNumber: 'LOT-IOX-01',
      manufacturer: 'GE Healthcare',
      expiryDate: future2Yr,
      locationId: 'LOC-RAD-001',
      unitCost: 45.0,
      sellingPrice: 95.0,
      initialQuantity: 200,
      receivedQuantity: 200,
      onHandQuantity: 160,
      availableQuantity: 160,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for N95 Mask (Item 29)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000029',
      itemName: 'N95 Particulate Respirator Mask 3M 1860',
      batchNumber: 'N95-2026-01',
      lotNumber: 'LOT-N95-01',
      manufacturer: '3M',
      expiryDate: future2Yr,
      locationId: 'LOC-MAIN-001',
      unitCost: 1.8,
      sellingPrice: 4.0,
      initialQuantity: 3000,
      receivedQuantity: 3000,
      onHandQuantity: 2400,
      availableQuantity: 2400,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Batches for Hand Sanitizer (Item 31)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000031',
      itemName: 'Alcohol Hand Rub Sanitizer 500mL Bottle',
      batchNumber: 'SAN-2026-01',
      lotNumber: 'LOT-SAN-01',
      manufacturer: 'Bode Chemie',
      expiryDate: future1Yr,
      locationId: 'LOC-MAIN-001',
      unitCost: 3.2,
      sellingPrice: 7.0,
      initialQuantity: 1000,
      receivedQuantity: 1000,
      onHandQuantity: 820,
      availableQuantity: 820,
      reservedQuantity: 0,
      status: 'AVAILABLE'
    });

    // Quarantined Batch (Damaged on arrival)
    batchesData.push({
      batchId: `BAT-${bSeq++}`,
      inventoryItemId: 'INV-000018',
      itemName: 'Normal Saline 0.9% IV Solution 500mL',
      batchNumber: 'NS-2026-DMG',
      lotNumber: 'LOT-NS-DMG',
      manufacturer: 'Baxter',
      expiryDate: future1Yr,
      locationId: 'LOC-QUAR-001',
      unitCost: 1.8,
      sellingPrice: 4.5,
      initialQuantity: 60,
      receivedQuantity: 60,
      onHandQuantity: 60,
      availableQuantity: 0,
      quarantinedQuantity: 60,
      damagedQuantity: 60,
      status: 'QUARANTINED'
    });

    // Generate remaining batches to reach 55+
    for (let i = 6; i <= 35; i++) {
      const padI = String(i).padStart(6, '0');
      const item = itemsData.find((it) => it.inventoryItemId === `INV-${padI}`);
      if (item && batchesData.filter((b) => b.inventoryItemId === item.inventoryItemId).length === 0) {
        batchesData.push({
          batchId: `BAT-${bSeq++}`,
          inventoryItemId: item.inventoryItemId,
          medicineId: item.medicineId || null,
          medicineName: item.genericName || '',
          itemName: item.name,
          batchNumber: `BAT-${item.inventoryItemId.replace('INV-', '')}-01`,
          lotNumber: `LOT-${item.inventoryItemId.replace('INV-', '')}`,
          manufacturer: item.manufacturer,
          expiryDate: (i % 7 === 0) ? nearExpiryDate : (i % 11 === 0 ? pastExpiredDate2 : future1Yr),
          locationId: (i % 3 === 0) ? 'LOC-MAIN-001' : (i % 3 === 1 ? 'LOC-PHARM-001' : 'LOC-OT-001'),
          unitCost: 5.0,
          sellingPrice: 10.0,
          initialQuantity: 200,
          receivedQuantity: 200,
          onHandQuantity: (i % 11 === 0) ? 50 : 180,
          availableQuantity: (i % 11 === 0) ? 0 : 180,
          expiredQuantity: (i % 11 === 0) ? 50 : 0,
          status: (i % 11 === 0) ? 'EXPIRED' : 'AVAILABLE'
        });

        // Add 2nd batch for variation
        batchesData.push({
          batchId: `BAT-${bSeq++}`,
          inventoryItemId: item.inventoryItemId,
          medicineId: item.medicineId || null,
          medicineName: item.genericName || '',
          itemName: item.name,
          batchNumber: `BAT-${item.inventoryItemId.replace('INV-', '')}-02`,
          lotNumber: `LOT-${item.inventoryItemId.replace('INV-', '')}-B`,
          manufacturer: item.manufacturer,
          expiryDate: future2Yr,
          locationId: 'LOC-MAIN-001',
          unitCost: 5.0,
          sellingPrice: 10.0,
          initialQuantity: 300,
          receivedQuantity: 300,
          onHandQuantity: 300,
          availableQuantity: 300,
          status: 'AVAILABLE'
        });
      }
    }

    await InventoryBatch.insertMany(batchesData);
    console.log(`[Seed Module 18] Seeded ${batchesData.length} inventory batches.`);

    // ----------------------------------------------------
    // 4. Seed 100+ Stock Movements (Ledger History)
    // ----------------------------------------------------
    const movementsData = [];
    const moveTypes = ['RECEIPT', 'ISSUE', 'TRANSFER_OUT', 'TRANSFER_IN', 'RESERVATION', 'RELEASE_RESERVATION', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'];

    for (let m = 1; m <= 110; m++) {
      const targetBatch = batchesData[m % batchesData.length];
      const movementType = moveTypes[m % moveTypes.length];
      const mDate = new Date(Date.now() - (115 - m) * 4 * 60 * 60 * 1000); // spread over last ~20 days

      let qty = (m % 5 + 1) * 10;
      if (movementType === 'ISSUE' || movementType === 'TRANSFER_OUT' || movementType === 'ADJUSTMENT_OUT') {
        qty = -qty;
      }

      movementsData.push({
        movementId: `MOV-${String(m).padStart(6, '0')}`,
        inventoryItemId: targetBatch.inventoryItemId,
        itemName: targetBatch.itemName,
        batchId: targetBatch.batchId,
        batchNumber: targetBatch.batchNumber,
        sourceLocationId: targetBatch.locationId,
        destinationLocationId: movementType === 'TRANSFER_IN' ? 'LOC-PHARM-001' : null,
        movementType,
        quantity: qty,
        unit: 'UNIT',
        referenceType: movementType === 'RECEIPT' ? 'GOODS_RECEIPT' : (movementType.startsWith('TRANSFER') ? 'TRANSFER' : 'MANUAL'),
        referenceId: `REF-${10000 + m}`,
        reason: `Historical ledger entry: ${movementType}`,
        performedBy: 'USR-ADMIN-01',
        correlationId: `CORR-HIST-${m}`,
        timestamp: mDate
      });
    }

    await InventoryMovement.insertMany(movementsData);
    console.log(`[Seed Module 18] Seeded ${movementsData.length} inventory movements.`);

    // ----------------------------------------------------
    // 5. Seed 20+ Inventory Reservations
    // ----------------------------------------------------
    const reservationsData = [];
    for (let r = 1; r <= 22; r++) {
      const b = batchesData[r % 15];
      const resDate = new Date(Date.now() - (25 - r) * 2 * 60 * 60 * 1000);
      reservationsData.push({
        reservationId: `RES-${String(r).padStart(6, '0')}`,
        inventoryItemId: b.inventoryItemId,
        itemName: b.itemName,
        batchId: b.batchId,
        locationId: b.locationId,
        quantity: (r % 4 + 1) * 5,
        consumedQuantity: (r % 3 === 0) ? (r % 4 + 1) * 5 : 0,
        reservedForType: (r % 2 === 0) ? 'PHARMACY_ORDER' : 'WARD_ISSUE',
        reservedForId: `ORD-${202600 + r}`,
        status: (r % 3 === 0) ? 'CONSUMED' : (r % 5 === 0 ? 'RELEASED' : 'ACTIVE'),
        reservedAt: resDate,
        expiresAt: new Date(resDate.getTime() + 24 * 60 * 60 * 1000),
        createdBy: 'USR-PHARM-01'
      });
    }

    await InventoryReservation.insertMany(reservationsData);
    console.log(`[Seed Module 18] Seeded ${reservationsData.length} reservations.`);

    // ----------------------------------------------------
    // 6. Seed 15+ Transfers
    // ----------------------------------------------------
    const transfersData = [];
    const transferStatuses = ['REQUESTED', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'PARTIALLY_RECEIVED'];

    for (let t = 1; t <= 16; t++) {
      const b = batchesData[t % 12];
      const status = transferStatuses[t % transferStatuses.length];
      const hasMismatch = status === 'PARTIALLY_RECEIVED';

      transfersData.push({
        transferId: `TRF-${String(t).padStart(6, '0')}`,
        sourceLocationId: 'LOC-MAIN-001',
        destinationLocationId: (t % 2 === 0) ? 'LOC-PHARM-001' : 'LOC-OT-001',
        items: [
          {
            inventoryItemId: b.inventoryItemId,
            itemName: b.itemName,
            batchId: b.batchId,
            batchNumber: b.batchNumber,
            requestedQuantity: 50,
            dispatchedQuantity: status !== 'REQUESTED' && status !== 'APPROVED' ? 50 : 0,
            receivedQuantity: status === 'RECEIVED' ? 50 : (hasMismatch ? 46 : 0),
            difference: hasMismatch ? -4 : 0,
            status: hasMismatch ? 'MISMATCH' : (status === 'RECEIVED' ? 'MATCHED' : 'PENDING')
          }
        ],
        reason: 'Department routine replenishment',
        requestedBy: 'USR-STORE-01',
        approvedBy: status !== 'REQUESTED' ? 'USR-ADMIN-01' : null,
        issuedBy: status === 'DISPATCHED' || status === 'RECEIVED' || hasMismatch ? 'USR-STORE-01' : null,
        receivedBy: status === 'RECEIVED' || hasMismatch ? 'USR-PHARM-01' : null,
        status,
        hasMismatch,
        requestedAt: new Date(Date.now() - (20 - t) * 24 * 60 * 60 * 1000),
        approvedAt: status !== 'REQUESTED' ? new Date(Date.now() - (19 - t) * 24 * 60 * 60 * 1000) : null,
        dispatchedAt: status === 'DISPATCHED' || status === 'RECEIVED' || hasMismatch ? new Date(Date.now() - (18 - t) * 24 * 60 * 60 * 1000) : null,
        receivedAt: status === 'RECEIVED' || hasMismatch ? new Date(Date.now() - (17 - t) * 24 * 60 * 60 * 1000) : null
      });
    }

    await InventoryTransfer.insertMany(transfersData);
    console.log(`[Seed Module 18] Seeded ${transfersData.length} stock transfers.`);

    // ----------------------------------------------------
    // 7. Seed 10+ Adjustments
    // ----------------------------------------------------
    const adjustmentsData = [];
    const adjReasons = ['PHYSICAL_COUNT_DIFFERENCE', 'DAMAGED_GOODS', 'DATA_CORRECTION', 'EXPIRED_GOODS'];

    for (let a = 1; a <= 12; a++) {
      const b = batchesData[a % 10];
      const diff = (a % 2 === 0 ? 5 : -4);
      const status = a % 3 === 0 ? 'PENDING_APPROVAL' : 'PROCESSED';

      adjustmentsData.push({
        adjustmentId: `ADJ-${String(a).padStart(6, '0')}`,
        inventoryItemId: b.inventoryItemId,
        itemName: b.itemName,
        batchId: b.batchId,
        batchNumber: b.batchNumber,
        locationId: b.locationId,
        systemQuantity: b.availableQuantity,
        physicalQuantity: b.availableQuantity + diff,
        difference: diff,
        reason: adjReasons[a % adjReasons.length],
        notes: `Cycle count variance audit verification #${a}`,
        supportingDocument: `DOC-VERIFY-2026-${a}.pdf`,
        requestedBy: 'USR-STORE-01',
        approvedBy: status === 'PROCESSED' ? 'USR-ADMIN-01' : null,
        status,
        createdAt: new Date(Date.now() - (15 - a) * 24 * 60 * 60 * 1000),
        processedAt: status === 'PROCESSED' ? new Date(Date.now() - (14 - a) * 24 * 60 * 60 * 1000) : null
      });
    }

    await InventoryAdjustment.insertMany(adjustmentsData);
    console.log(`[Seed Module 18] Seeded ${adjustmentsData.length} stock adjustments.`);

    // ----------------------------------------------------
    // 8. Seed 5+ Stock Count Sessions
    // ----------------------------------------------------
    const countSessionsData = [];
    const countTypes = ['CYCLE_COUNT', 'FULL', 'CATEGORY', 'SPOT_CHECK'];

    for (let c = 1; c <= 6; c++) {
      const loc = locationsData[c % locationsData.length];
      const countStatus = c === 1 ? 'IN_PROGRESS' : (c === 2 ? 'PENDING_REVIEW' : 'POSTED');

      countSessionsData.push({
        countSessionId: `CNT-${String(c).padStart(6, '0')}`,
        locationId: loc.locationId,
        countType: countTypes[c % countTypes.length],
        category: 'MEDICINE',
        status: countStatus,
        items: [
          {
            inventoryItemId: 'INV-000001',
            itemName: 'Paracetamol 500mg Tablet',
            batchId: 'BAT-10001',
            batchNumber: 'PCM-2026-A01',
            systemQuantity: 1350,
            countedQuantity: countStatus === 'IN_PROGRESS' ? null : 1348,
            difference: countStatus === 'IN_PROGRESS' ? 0 : -2,
            status: countStatus === 'IN_PROGRESS' ? 'PENDING' : 'VARIANCE',
            notes: 'Minor dispenser loss'
          },
          {
            inventoryItemId: 'INV-000002',
            itemName: 'Amoxicillin 500mg Capsule',
            batchId: 'BAT-10004',
            batchNumber: 'AMX-2026-B01',
            systemQuantity: 120,
            countedQuantity: countStatus === 'IN_PROGRESS' ? null : 120,
            difference: 0,
            status: countStatus === 'IN_PROGRESS' ? 'PENDING' : 'MATCHED',
            notes: 'Exact count'
          }
        ],
        totalVarianceItems: countStatus === 'IN_PROGRESS' ? 0 : 1,
        startedAt: new Date(Date.now() - (10 - c) * 24 * 60 * 60 * 1000),
        completedAt: countStatus !== 'IN_PROGRESS' ? new Date(Date.now() - (9 - c) * 24 * 60 * 60 * 1000) : null,
        createdBy: 'USR-STORE-01',
        approvedBy: countStatus === 'POSTED' ? 'USR-ADMIN-01' : null
      });
    }

    await StockCountSession.insertMany(countSessionsData);
    console.log(`[Seed Module 18] Seeded ${countSessionsData.length} stock count sessions.`);

    // ----------------------------------------------------
    // 9. Seed 5+ Reconciliations
    // ----------------------------------------------------
    const reconsData = [];
    const reconSources = ['EXTERNAL_ERP', 'LEGACY_PHARMACY', 'SUPPLIER_REPORT', 'PHYSICAL_COUNT'];

    for (let rk = 1; rk <= 6; rk++) {
      const reconStatus = rk === 1 ? 'PENDING_REVIEW' : 'RESOLVED';
      reconsData.push({
        reconciliationId: `REC-${String(rk).padStart(6, '0')}`,
        source: reconSources[rk % reconSources.length],
        locationId: 'LOC-MAIN-001',
        startedAt: new Date(Date.now() - (12 - rk) * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - (11 - rk) * 24 * 60 * 60 * 1000),
        status: reconStatus,
        totalItems: 3,
        matchedItems: 2,
        mismatchedItems: 1,
        unknownItems: 0,
        results: [
          {
            inventoryItemId: 'INV-000001',
            itemName: 'Paracetamol 500mg Tablet',
            batchId: 'BAT-10001',
            batchNumber: 'PCM-2026-A01',
            systemQuantity: 1350,
            externalQuantity: 1350,
            difference: 0,
            status: 'MATCHED',
            resolution: 'Exact agreement',
            resolvedBy: 'USR-ADMIN-01',
            resolvedAt: new Date()
          },
          {
            inventoryItemId: 'INV-000002',
            itemName: 'Amoxicillin 500mg Capsule',
            batchId: 'BAT-10005',
            batchNumber: 'AMX-2026-B02',
            systemQuantity: 850,
            externalQuantity: 847,
            difference: -3,
            status: reconStatus === 'PENDING_REVIEW' ? 'MISMATCH' : 'RESOLVED',
            resolution: reconStatus === 'PENDING_REVIEW' ? 'Pending audit investigation' : 'Discrepancy resolved via adjustment ADJ-000002',
            resolvedBy: reconStatus === 'RESOLVED' ? 'USR-ADMIN-01' : null,
            resolvedAt: reconStatus === 'RESOLVED' ? new Date() : null
          }
        ],
        createdBy: 'RPA_ERP_SYNC_BOT'
      });
    }

    await InventoryReconciliation.insertMany(reconsData);
    console.log(`[Seed Module 18] Seeded ${reconsData.length} reconciliation sessions.`);

    // ----------------------------------------------------
    // 10. Seed Realistic Inventory Alerts
    // ----------------------------------------------------
    const alertsData = [
      {
        alertId: 'ALT-000001',
        inventoryItemId: 'INV-000018',
        itemName: 'Normal Saline 0.9% IV Solution 500mL',
        locationId: 'LOC-WARD-001',
        alertType: 'LOW_STOCK',
        severity: 'HIGH',
        message: 'Low stock alert for Normal Saline in General Ward Store: Available 45 bottles is below reorder level (150).',
        thresholdValue: 150,
        currentValue: 45,
        status: 'OPEN'
      },
      {
        alertId: 'ALT-000002',
        inventoryItemId: 'INV-000004',
        itemName: 'Human Insulin Regular 100 IU/mL',
        batchId: 'BAT-10008',
        batchNumber: 'INS-2026-D01',
        locationId: 'LOC-COLD-001',
        alertType: 'NEAR_EXPIRY',
        severity: 'CRITICAL',
        message: 'Batch INS-2026-D01 of Human Insulin expires in 5 days! 35 vials remaining in Cold Vault.',
        thresholdValue: 30,
        currentValue: 5,
        status: 'OPEN'
      },
      {
        alertId: 'ALT-000003',
        inventoryItemId: 'INV-000002',
        itemName: 'Amoxicillin 500mg Capsule',
        batchId: 'BAT-10004',
        batchNumber: 'AMX-2026-B01',
        locationId: 'LOC-PHARM-001',
        alertType: 'NEAR_EXPIRY',
        severity: 'MEDIUM',
        message: 'Batch AMX-2026-B01 expires in 18 days. 120 capsules in Outpatient Pharmacy.',
        thresholdValue: 30,
        currentValue: 18,
        status: 'ACKNOWLEDGED',
        acknowledgedBy: 'USR-PHARM-01'
      },
      {
        alertId: 'ALT-000004',
        inventoryItemId: 'INV-000001',
        itemName: 'Paracetamol 500mg Tablet',
        batchId: 'BAT-10003',
        batchNumber: 'PCM-2025-OLD',
        locationId: 'LOC-MAIN-001',
        alertType: 'EXPIRED',
        severity: 'HIGH',
        message: 'Batch PCM-2025-OLD expired on 45 days ago. 100 tablets quarantined and blocked.',
        thresholdValue: 0,
        currentValue: 100,
        status: 'OPEN'
      },
      {
        alertId: 'ALT-000005',
        inventoryItemId: 'INV-000018',
        itemName: 'Normal Saline 0.9% IV Solution 500mL',
        batchId: 'BAT-10022',
        batchNumber: 'NS-2026-DMG',
        locationId: 'LOC-QUAR-001',
        alertType: 'STOCK_MISMATCH',
        severity: 'MEDIUM',
        message: 'Stock quarantined: 60 bottles damaged during freight delivery.',
        thresholdValue: 0,
        currentValue: 60,
        status: 'RESOLVED',
        resolvedBy: 'USR-ADMIN-01',
        resolvedAt: new Date()
      }
    ];

    await InventoryAlert.insertMany(alertsData);
    console.log(`[Seed Module 18] Seeded ${alertsData.length} inventory alerts.`);

    // ----------------------------------------------------
    // 11. Seed Goods Receipts (GRN)
    // ----------------------------------------------------
    const grnData = [
      {
        goodsReceiptId: 'GRN-000001',
        purchaseOrderId: 'PO-50021',
        vendorId: 'VND-1001',
        vendorName: 'GSK Healthcare Distributors',
        receivedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        receivedBy: 'USR-STORE-01',
        status: 'POSTED',
        items: [
          {
            inventoryItemId: 'INV-000001',
            itemName: 'Paracetamol 500mg Tablet',
            orderedQuantity: 2000,
            receivedQuantity: 2000,
            acceptedQuantity: 2000,
            rejectedQuantity: 0,
            batchNumber: 'PCM-2026-A01',
            lotNumber: 'LOT-PCM-991',
            manufacturingDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            expiryDate: future2Yr,
            unitCost: 1.5,
            locationId: 'LOC-MAIN-001',
            inspectionStatus: 'ACCEPTED'
          }
        ],
        documents: [{ docType: 'DELIVERY_CHALLAN', docName: 'Challan-GSK-50021.pdf', fileUrl: '/docs/challan-50021.pdf' }],
        notes: 'Full order received in pristine condition with temperature loggers intact.'
      },
      {
        goodsReceiptId: 'GRN-000002',
        purchaseOrderId: 'PO-50022',
        vendorId: 'VND-1002',
        vendorName: 'Pfizer BioSupply',
        receivedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        receivedBy: 'USR-STORE-01',
        status: 'POSTED',
        items: [
          {
            inventoryItemId: 'INV-000002',
            itemName: 'Amoxicillin 500mg Capsule',
            orderedQuantity: 1000,
            receivedQuantity: 1000,
            acceptedQuantity: 1000,
            rejectedQuantity: 0,
            batchNumber: 'AMX-2026-B02',
            lotNumber: 'LOT-AMX-12',
            manufacturingDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            expiryDate: future1Yr,
            unitCost: 4.0,
            locationId: 'LOC-MAIN-001',
            inspectionStatus: 'ACCEPTED'
          }
        ],
        documents: [{ docType: 'INVOICE', docName: 'Invoice-Pfizer-994.pdf', fileUrl: '/docs/pfizer-994.pdf' }],
        notes: 'Certificate of Analysis verified.'
      }
    ];

    await GoodsReceipt.insertMany(grnData);
    console.log(`[Seed Module 18] Seeded ${grnData.length} goods receipts.`);

    console.log('\n==========================================================');
    console.log('--- MODULE 18 MEDICAL INVENTORY SEEDING COMPLETED SUCCESSFULLY ---');
    console.log('==========================================================\n');

    return true;
  } catch (error) {
    console.error('[Seed Module 18 Error]:', error);
    throw error;
  }
};

if (require.main === module) {
  seedModule18Inventory()
    .then(() => {
      console.log('[Seed Module 18] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Module 18] Failed:', err);
      process.exit(1);
    });
}

module.exports = seedModule18Inventory;
