/**
 * Seed Script: Module 17 Pharmacy Management Demo Data
 * Creates realistic demo medicines (20+), batches (including near-expiry and expired),
 * prescriptions (50+), pharmacy orders (50+), dispensing records, returns, and demo scenarios.
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
const Visit = require('../models/Visit');
const Admission = require('../models/Admission');
const BillableItem = require('../models/BillableItem');
const RPAJob = require('../models/RPAJob');
const ExceptionCase = require('../models/ExceptionCase');

const demoMedicines = [
  {
    medicineId: 'MED-000001',
    genericName: 'Paracetamol',
    brandName: 'Crocin Advance',
    strength: '500 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 2.5,
    manufacturer: 'GSK Pharmaceuticals',
    category: 'Analgesic',
    barcode: '890100000001',
    sku: 'PCM500TAB',
    prescriptionRequired: false,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Relief of mild to moderate pain and fever.',
    reorderLevel: 500
  },
  {
    medicineId: 'MED-000002',
    genericName: 'Amoxicillin',
    brandName: 'Mox 500',
    strength: '500 mg',
    dosageForm: 'Capsule',
    unit: 'Capsule',
    unitPrice: 8.0,
    manufacturer: 'Sun Pharma',
    category: 'Antibiotic',
    barcode: '890100000002',
    sku: 'AMX500CAP',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Broad-spectrum penicillin antibiotic.',
    reorderLevel: 300
  },
  {
    medicineId: 'MED-000003',
    genericName: 'Omeprazole',
    brandName: 'Omez',
    strength: '20 mg',
    dosageForm: 'Capsule',
    unit: 'Capsule',
    unitPrice: 5.5,
    manufacturer: 'Dr. Reddy Laboratories',
    category: 'Antacid',
    barcode: '890100000003',
    sku: 'OMP20CAP',
    prescriptionRequired: false,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Proton pump inhibitor for acid reflux and GERD.',
    reorderLevel: 250
  },
  {
    medicineId: 'MED-000004',
    genericName: 'Cetirizine',
    brandName: 'Cetzine',
    strength: '10 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 3.0,
    manufacturer: 'Cipla Ltd',
    category: 'Antihistamine',
    barcode: '890100000004',
    sku: 'CTZ10TAB',
    prescriptionRequired: false,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Second-generation antihistamine for allergic rhinitis.',
    reorderLevel: 400
  },
  {
    medicineId: 'MED-000005',
    genericName: 'Azithromycin',
    brandName: 'Azithral 500',
    strength: '500 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 22.0,
    manufacturer: 'Alembic Pharma',
    category: 'Antibiotic',
    barcode: '890100000005',
    sku: 'AZI500TAB',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Macrolide antibiotic for respiratory bacterial infections.',
    reorderLevel: 200
  },
  {
    medicineId: 'MED-000006',
    genericName: 'Metformin Hydrochloride',
    brandName: 'Glyciphage 500',
    strength: '500 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 4.2,
    manufacturer: 'Franco-Indian Pharma',
    category: 'Antidiabetic',
    barcode: '890100000006',
    sku: 'MET500TAB',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'First-line biguanide oral medication for type 2 diabetes.',
    reorderLevel: 600
  },
  {
    medicineId: 'MED-000007',
    genericName: 'Atorvastatin',
    brandName: 'Atorva 10',
    strength: '10 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 9.5,
    manufacturer: 'Zydus Cadila',
    category: 'Cardiovascular',
    barcode: '890100000007',
    sku: 'ATV10TAB',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Statin medication to treat dyslipidemia and cardiovascular prevention.',
    reorderLevel: 300
  },
  {
    medicineId: 'MED-000008',
    genericName: 'Pantoprazole',
    brandName: 'Pan 40',
    strength: '40 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 7.0,
    manufacturer: 'Alkem Laboratories',
    category: 'Antacid',
    barcode: '890100000008',
    sku: 'PAN40TAB',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Proton pump inhibitor for erosive esophagitis and gastritis.',
    reorderLevel: 450
  },
  {
    medicineId: 'MED-000009',
    genericName: 'Ibuprofen',
    brandName: 'Brufen 400',
    strength: '400 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 3.5,
    manufacturer: 'Abbott Healthcare',
    category: 'Analgesic',
    barcode: '890100000009',
    sku: 'IBU400TAB',
    prescriptionRequired: false,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Nonsteroidal anti-inflammatory drug (NSAID).',
    reorderLevel: 500
  },
  {
    medicineId: 'MED-000010',
    genericName: 'Ciprofloxacin',
    brandName: 'Ciplox 500',
    strength: '500 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 6.5,
    manufacturer: 'Cipla Ltd',
    category: 'Antibiotic',
    barcode: '890100000010',
    sku: 'CIP500TAB',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Fluoroquinolone antibiotic for bacterial infections.',
    reorderLevel: 250
  },
  {
    medicineId: 'MED-000011',
    genericName: 'Losartan Potassium',
    brandName: 'Losacar 50',
    strength: '50 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 5.0,
    manufacturer: 'Zydus Cadila',
    category: 'Cardiovascular',
    barcode: '890100000011',
    sku: 'LOS50TAB',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Angiotensin II receptor antagonist used for hypertension.',
    reorderLevel: 300
  },
  {
    medicineId: 'MED-000012',
    genericName: 'Tramadol Hydrochloride',
    brandName: 'Tramazac 50',
    strength: '50 mg',
    dosageForm: 'Capsule',
    unit: 'Capsule',
    unitPrice: 12.0,
    manufacturer: 'Zydus Cadila',
    category: 'Analgesic',
    barcode: '890100000012',
    sku: 'TRM50CAP',
    prescriptionRequired: true,
    controlledMedicine: true, // Controlled medicine!
    storageRequirements: 'Double-Locked Narcotics Cabinet',
    status: 'ACTIVE',
    description: 'Centrally acting opioid analgesic for moderate to severe pain.',
    reorderLevel: 100
  },
  {
    medicineId: 'MED-000013',
    genericName: 'Morphine Sulphate',
    brandName: 'Morphit 10',
    strength: '10 mg/ml',
    dosageForm: 'Injection',
    unit: 'Ampoule',
    unitPrice: 45.0,
    manufacturer: 'Neon Laboratories',
    category: 'Analgesic',
    barcode: '890100000013',
    sku: 'MOR10INJ',
    prescriptionRequired: true,
    controlledMedicine: true, // Controlled medicine!
    storageRequirements: 'Vault / Locked Safe (Cool & Dark)',
    status: 'ACTIVE',
    description: 'Potent opioid analgesic indicated for severe acute pain.',
    reorderLevel: 50
  },
  {
    medicineId: 'MED-000014',
    genericName: 'Insulin Glargine',
    brandName: 'Lantus SoloStar',
    strength: '100 IU/ml',
    dosageForm: 'Injection',
    unit: 'Pen',
    unitPrice: 450.0,
    manufacturer: 'Sanofi India',
    category: 'Antidiabetic',
    barcode: '890100000014',
    sku: 'INS100PEN',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Refrigerated (2°C - 8°C)',
    status: 'ACTIVE',
    description: 'Long-acting basal insulin analog for diabetes mellitus management.',
    reorderLevel: 80
  },
  {
    medicineId: 'MED-000015',
    genericName: 'Salbutamol Inhaler',
    brandName: 'Asthalin Inhaler',
    strength: '100 mcg/puff',
    dosageForm: 'Inhaler',
    unit: 'Canister',
    unitPrice: 110.0,
    manufacturer: 'Cipla Ltd',
    category: 'Respiratory',
    barcode: '890100000015',
    sku: 'SAL100INH',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Short-acting beta-2 agonist bronchodilator for asthma relief.',
    reorderLevel: 150
  },
  {
    medicineId: 'MED-000016',
    genericName: 'Ondansetron',
    brandName: 'Emeset 4',
    strength: '4 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 6.0,
    manufacturer: 'Cipla Ltd',
    category: 'Antiemetic',
    barcode: '890100000016',
    sku: 'OND4TAB',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: '5-HT3 receptor antagonist used to prevent nausea and vomiting.',
    reorderLevel: 300
  },
  {
    medicineId: 'MED-000017',
    genericName: 'Levothyroxine Sodium',
    brandName: 'Thyronorm 50',
    strength: '50 mcg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 2.2,
    manufacturer: 'Abbott India',
    category: 'Endocrine',
    barcode: '890100000017',
    sku: 'THY50TAB',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Cool & Dry (Below 25°C)',
    status: 'ACTIVE',
    description: 'Synthetic thyroid hormone for hypothyroidism.',
    reorderLevel: 400
  },
  {
    medicineId: 'MED-000018',
    genericName: 'Clopidogrel',
    brandName: 'Deplatt 75',
    strength: '75 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 8.5,
    manufacturer: 'Torrent Pharma',
    category: 'Cardiovascular',
    barcode: '890100000018',
    sku: 'CLP75TAB',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Antiplatelet medication used to reduce risk of heart disease and stroke.',
    reorderLevel: 250
  },
  {
    medicineId: 'MED-000019',
    genericName: 'Ranitidine Hydrochloride',
    brandName: 'Rantac 150',
    strength: '150 mg',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 1.5,
    manufacturer: 'JB Chemicals',
    category: 'Antacid',
    barcode: '890100000019',
    sku: 'RAN150TAB',
    prescriptionRequired: false,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'DISCONTINUED', // Discontinued status demo
    description: 'H2 blocker discontinued per regulatory directives.',
    reorderLevel: 0
  },
  {
    medicineId: 'MED-000020',
    genericName: 'Doxycycline',
    brandName: 'Doxt-SL',
    strength: '100 mg',
    dosageForm: 'Capsule',
    unit: 'Capsule',
    unitPrice: 7.5,
    manufacturer: 'Dr. Reddy Laboratories',
    category: 'Antibiotic',
    barcode: '890100000020',
    sku: 'DOX100CAP',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Tetracycline antibiotic for skin, dental, and bacterial infections.',
    reorderLevel: 200
  },
  {
    medicineId: 'MED-000021',
    genericName: 'Rifampicin',
    brandName: 'R-Cinex',
    strength: '450 mg',
    dosageForm: 'Capsule',
    unit: 'Capsule',
    unitPrice: 18.0,
    manufacturer: 'Lupin Ltd',
    category: 'Antitubercular',
    barcode: '890100000021',
    sku: 'RIF450CAP',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    status: 'ACTIVE',
    description: 'Antibacterial drug used in the treatment of tuberculosis.',
    reorderLevel: 150
  }
];

const seedModule17 = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('[Seed Module 17] Connected to database');

    // 1. Seed Medicine Master (21 Medicines)
    console.log('[Seed Module 17] Seeding Medicines...');
    for (const m of demoMedicines) {
      await Medicine.findOneAndUpdate(
        { medicineId: m.medicineId },
        { $set: m },
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed Module 17] Seeded ${demoMedicines.length} Medicines.`);

    // 2. Seed Inventory Batches
    console.log('[Seed Module 17] Seeding Inventory Batches...');
    const now = new Date();
    const farFuture = new Date(now.getFullYear() + 2, 6, 30);
    const nearExpiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // Expiring in 15 days!
    const pastExpiryDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // Expired 60 days ago!

    const demoBatches = [
      // Paracetamol normal batch
      {
        batchId: 'BAT-10001',
        medicineId: 'MED-000001',
        medicineName: 'Paracetamol',
        lotNumber: 'LOT-PCM-2026-A',
        initialQuantity: 1000,
        availableQuantity: 850,
        reservedQuantity: 50,
        expiryDate: farFuture,
        unitCost: 1.2,
        unitPrice: 2.5,
        supplier: 'Apex Healthcare Distribution',
        status: 'ACTIVE'
      },
      // Amoxicillin normal batch
      {
        batchId: 'BAT-10002',
        medicineId: 'MED-000002',
        medicineName: 'Amoxicillin',
        lotNumber: 'LOT-AMX-2026-B',
        initialQuantity: 500,
        availableQuantity: 420,
        reservedQuantity: 0,
        expiryDate: farFuture,
        unitCost: 4.5,
        unitPrice: 8.0,
        supplier: 'Apex Healthcare Distribution',
        status: 'ACTIVE'
      },
      // Omeprazole near-expiry batch (Section 26 & 43)
      {
        batchId: 'BAT-10003',
        medicineId: 'MED-000003',
        medicineName: 'Omeprazole',
        lotNumber: 'LOT-OMP-2026-N',
        initialQuantity: 300,
        availableQuantity: 65,
        reservedQuantity: 0,
        expiryDate: nearExpiryDate, // Within 15 days!
        unitCost: 2.8,
        unitPrice: 5.5,
        supplier: 'Dr. Reddy Supply',
        status: 'ACTIVE'
      },
      // Cetirizine normal batch
      {
        batchId: 'BAT-10004',
        medicineId: 'MED-000004',
        medicineName: 'Cetirizine',
        lotNumber: 'LOT-CTZ-2026-A',
        initialQuantity: 600,
        availableQuantity: 500,
        reservedQuantity: 0,
        expiryDate: farFuture,
        unitCost: 1.5,
        unitPrice: 3.0,
        supplier: 'Cipla Distribution',
        status: 'ACTIVE'
      },
      // Azithromycin normal batch
      {
        batchId: 'BAT-10005',
        medicineId: 'MED-000005',
        medicineName: 'Azithromycin',
        lotNumber: 'LOT-AZI-2026-C',
        initialQuantity: 200,
        availableQuantity: 180,
        reservedQuantity: 0,
        expiryDate: farFuture,
        unitCost: 12.0,
        unitPrice: 22.0,
        supplier: 'Alembic Distribution',
        status: 'ACTIVE'
      },
      // Tramadol (Controlled) batch
      {
        batchId: 'BAT-10012',
        medicineId: 'MED-000012',
        medicineName: 'Tramadol Hydrochloride',
        lotNumber: 'LOT-TRM-NARCO-01',
        initialQuantity: 150,
        availableQuantity: 90,
        reservedQuantity: 0,
        expiryDate: farFuture,
        unitCost: 6.0,
        unitPrice: 12.0,
        supplier: 'Controlled Drug Depot',
        status: 'ACTIVE'
      },
      // Morphine (Controlled) batch
      {
        batchId: 'BAT-10013',
        medicineId: 'MED-000013',
        medicineName: 'Morphine Sulphate',
        lotNumber: 'LOT-MOR-NARCO-02',
        initialQuantity: 50,
        availableQuantity: 35,
        reservedQuantity: 0,
        expiryDate: farFuture,
        unitCost: 25.0,
        unitPrice: 45.0,
        supplier: 'Controlled Drug Depot',
        status: 'ACTIVE'
      },
      // Demo Scenario 4: Expired batch BAT-10015 (Section 89)
      {
        batchId: 'BAT-10015',
        medicineId: 'MED-000001', // Paracetamol expired batch
        medicineName: 'Paracetamol',
        lotNumber: 'LOT-PCM-OLD-EXP',
        initialQuantity: 100,
        availableQuantity: 100,
        reservedQuantity: 0,
        expiryDate: pastExpiryDate, // EXPIRED!
        unitCost: 1.0,
        unitPrice: 2.5,
        supplier: 'Apex Healthcare Distribution',
        status: 'EXPIRED'
      },
      // Partial stock demo batch (Only 20 available) for Doxycycline
      {
        batchId: 'BAT-10020',
        medicineId: 'MED-000020',
        medicineName: 'Doxycycline',
        lotNumber: 'LOT-DOX-PARTIAL',
        initialQuantity: 50,
        availableQuantity: 20, // Only 20 available! (Scenario 87)
        reservedQuantity: 0,
        expiryDate: farFuture,
        unitCost: 4.0,
        unitPrice: 7.5,
        supplier: 'Dr. Reddy Supply',
        status: 'ACTIVE'
      }
    ];

    for (const b of demoBatches) {
      await InventoryBatch.findOneAndUpdate(
        { batchId: b.batchId },
        { $set: b },
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed Module 17] Seeded ${demoBatches.length} Inventory Batches.`);

    // 3. Ensure Demo Patients and Doctors exist
    let patientP10045 = await Patient.findOne({ patientId: 'P10045' });
    if (!patientP10045) {
      patientP10045 = await Patient.create({
        patientId: 'P10045',
        firstName: 'Anjali',
        lastName: 'Sharma',
        dateOfBirth: new Date('1990-05-14'),
        gender: 'FEMALE',
        contactNumber: '+919876543210',
        email: 'anjali.sharma@example.com',
        bloodGroup: 'B+',
        status: 'ACTIVE'
      });
    }

    let doctorDoc1001 = await Doctor.findOne({ doctorId: 'DOC1001' });
    if (!doctorDoc1001) {
      doctorDoc1001 = await Doctor.create({
        doctorId: 'DOC1001',
        firstName: 'Arun',
        lastName: 'Verma',
        email: 'dr.arun@hospital.com',
        specialization: 'General Medicine',
        licenseNumber: 'MCI-2015-4421',
        departmentName: 'General Medicine',
        status: 'ACTIVE'
      });
    }

    // 4. Seed Demo Scenario 1 — Outpatient (Section 86)
    // Patient: P10045, Visit: V20031, Prescription: RX30015, Paracetamol 500mg x 15, Order: PO40021
    console.log('[Seed Module 17] Seeding Demo Scenario 1 (Outpatient full dispensing)...');
    const rx30015 = await Prescription.findOneAndUpdate(
      { prescriptionId: 'RX30015' },
      {
        $set: {
          prescriptionId: 'RX30015',
          patientId: 'P10045',
          patientName: 'Anjali Sharma',
          visitId: 'V20031',
          doctorId: 'DOC1001',
          doctorName: 'Dr. Arun Verma',
          departmentName: 'General Medicine',
          diagnosis: 'Acute Viral Pharyngitis with Pyrexia',
          prescriptionDate: now,
          validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: 'DISPENSED',
          items: [
            {
              prescriptionItemId: 'RXI-30015-1',
              medicineId: 'MED-000001',
              medicineNameSnapshot: 'Paracetamol (Crocin Advance)',
              strengthSnapshot: '500 mg',
              dosageFormSnapshot: 'Tablet',
              unitPriceSnapshot: 2.5,
              dose: '500 mg',
              route: 'ORAL',
              frequency: 'THREE_TIMES_DAILY',
              duration: '5 DAYS',
              quantity: 15,
              dispensedQuantity: 15,
              unit: 'Tablet',
              instructions: 'Take 1 tablet after meals three times daily.',
              refillAllowed: false,
              status: 'DISPENSED'
            }
          ]
        }
      },
      { upsert: true, new: true }
    );

    const po40021 = await PharmacyOrder.findOneAndUpdate(
      { pharmacyOrderId: 'PO40021' },
      {
        $set: {
          pharmacyOrderId: 'PO40021',
          prescriptionId: 'RX30015',
          patientId: 'P10045',
          patientName: 'Anjali Sharma',
          visitId: 'V20031',
          doctorId: 'DOC1001',
          doctorName: 'Dr. Arun Verma',
          orderType: 'OUTPATIENT',
          priority: 'NORMAL',
          status: 'COMPLETED',
          requestedAt: now,
          processedAt: now,
          completedAt: now,
          pharmacistId: 'PHARM001',
          pharmacistName: 'Vikram Joshi (RPh)',
          items: [
            {
              prescriptionItemId: 'RXI-30015-1',
              medicineId: 'MED-000001',
              medicineName: 'Paracetamol',
              dosageForm: 'Tablet',
              strength: '500 mg',
              prescribedQuantity: 15,
              reservedQuantity: 15,
              dispensedQuantity: 15,
              unit: 'Tablet',
              unitPrice: 2.5,
              batchReservations: [{ batchId: 'BAT-10001', quantity: 15, expiryDate: farFuture }],
              status: 'DISPENSED'
            }
          ]
        }
      },
      { upsert: true, new: true }
    );

    const disp50001 = await DispensingRecord.findOneAndUpdate(
      { dispensingRecordId: 'DISP-20261016-00001' },
      {
        $set: {
          dispensingRecordId: 'DISP-20261016-00001',
          pharmacyOrderId: 'PO40021',
          prescriptionId: 'RX30015',
          patientId: 'P10045',
          patientName: 'Anjali Sharma',
          visitId: 'V20031',
          pharmacistId: 'PHARM001',
          pharmacistName: 'Vikram Joshi (RPh)',
          dispensedAt: now,
          status: 'COMPLETED',
          totalAmount: 37.5,
          idempotencyKey: 'IDEMP-PO40021-DISP01',
          items: [
            {
              prescriptionItemId: 'RXI-30015-1',
              medicineId: 'MED-000001',
              medicineName: 'Paracetamol',
              inventoryBatchId: 'BAT-10001',
              batchExpiryDate: farFuture,
              prescribedQuantity: 15,
              dispensedQuantity: 15,
              unit: 'Tablet',
              unitPrice: 2.5,
              totalPrice: 37.5,
              dispensingStatus: 'DISPENSED',
              substitution: false,
              instructions: 'Take 1 tablet after meals three times daily.'
            }
          ]
        }
      },
      { upsert: true, new: true }
    );

    // 5. Seed 50+ Prescriptions and 50+ Pharmacy Orders for realistic queue and reporting
    console.log('[Seed Module 17] Seeding 50+ Prescriptions and Pharmacy Orders...');
    const orderTypes = ['OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'WARD_STOCK', 'DISCHARGE_MEDICATION'];
    const priorities = ['NORMAL', 'NORMAL', 'NORMAL', 'URGENT', 'STAT'];
    const pStatuses = ['ISSUED', 'SENT_TO_PHARMACY', 'UNDER_REVIEW', 'VALIDATED', 'PARTIALLY_DISPENSED', 'DISPENSED', 'ON_HOLD'];
    const oStatuses = ['NEW', 'RECEIVED', 'VALIDATING', 'READY_FOR_DISPENSING', 'PARTIALLY_FULFILLED', 'DISPENSED', 'COMPLETED', 'ON_HOLD'];

    for (let i = 1; i <= 55; i++) {
      const pNum = String(i).padStart(5, '0');
      const rxId = `RX-202610-${pNum}`;
      const poId = `PO-202610-${pNum}`;
      const patId = `P100${(i % 10) + 1}`;
      const med1 = demoMedicines[i % demoMedicines.length];
      const med2 = demoMedicines[(i + 3) % demoMedicines.length];

      const pStatus = pStatuses[i % pStatuses.length];
      const oStatus = oStatuses[i % oStatuses.length];
      const ordType = orderTypes[i % orderTypes.length];
      const priority = priorities[i % priorities.length];

      const reqDate = new Date(now.getTime() - (i % 7) * 24 * 60 * 60 * 1000);

      await Prescription.findOneAndUpdate(
        { prescriptionId: rxId },
        {
          $set: {
            prescriptionId: rxId,
            patientId: patId,
            patientName: `Patient ${patId}`,
            doctorId: 'DOC1001',
            doctorName: 'Dr. Arun Verma',
            departmentName: 'General Medicine',
            diagnosis: i % 2 === 0 ? 'Upper Respiratory Tract Infection' : 'Hypertension & Dyslipidemia',
            prescriptionDate: reqDate,
            validUntil: new Date(reqDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            status: pStatus,
            items: [
              {
                prescriptionItemId: `${rxId}-1`,
                medicineId: med1.medicineId,
                medicineNameSnapshot: `${med1.genericName} (${med1.brandName})`,
                strengthSnapshot: med1.strength,
                dosageFormSnapshot: med1.dosageForm,
                unitPriceSnapshot: med1.unitPrice,
                dose: '1 unit',
                route: 'ORAL',
                frequency: 'TWICE_DAILY',
                duration: '5 DAYS',
                quantity: 10,
                dispensedQuantity: pStatus === 'DISPENSED' ? 10 : pStatus === 'PARTIALLY_DISPENSED' ? 5 : 0,
                unit: med1.unit,
                instructions: 'Take after food',
                status: pStatus === 'DISPENSED' ? 'DISPENSED' : 'PENDING'
              },
              {
                prescriptionItemId: `${rxId}-2`,
                medicineId: med2.medicineId,
                medicineNameSnapshot: `${med2.genericName} (${med2.brandName})`,
                strengthSnapshot: med2.strength,
                dosageFormSnapshot: med2.dosageForm,
                unitPriceSnapshot: med2.unitPrice,
                dose: '1 unit',
                route: 'ORAL',
                frequency: 'ONCE_DAILY',
                duration: '10 DAYS',
                quantity: 10,
                dispensedQuantity: pStatus === 'DISPENSED' ? 10 : 0,
                unit: med2.unit,
                instructions: 'Take at night',
                status: pStatus === 'DISPENSED' ? 'DISPENSED' : 'PENDING'
              }
            ]
          }
        },
        { upsert: true, new: true }
      );

      await PharmacyOrder.findOneAndUpdate(
        { pharmacyOrderId: poId },
        {
          $set: {
            pharmacyOrderId: poId,
            prescriptionId: rxId,
            patientId: patId,
            patientName: `Patient ${patId}`,
            doctorId: 'DOC1001',
            doctorName: 'Dr. Arun Verma',
            orderType: ordType,
            priority: priority,
            status: oStatus,
            requestedAt: reqDate,
            pharmacistId: 'PHARM001',
            pharmacistName: 'Vikram Joshi (RPh)',
            items: [
              {
                prescriptionItemId: `${rxId}-1`,
                medicineId: med1.medicineId,
                medicineName: med1.genericName,
                dosageForm: med1.dosageForm,
                strength: med1.strength,
                prescribedQuantity: 10,
                reservedQuantity: oStatus === 'READY_FOR_DISPENSING' || oStatus === 'COMPLETED' ? 10 : 0,
                dispensedQuantity: oStatus === 'COMPLETED' ? 10 : 0,
                unit: med1.unit,
                unitPrice: med1.unitPrice,
                status: oStatus === 'COMPLETED' ? 'DISPENSED' : 'PENDING'
              }
            ]
          }
        },
        { upsert: true, new: true }
      );
    }
    console.log('[Seed Module 17] Seeded 55 Prescriptions and 55 Pharmacy Orders.');

    // 6. Seed Pharmacy Returns
    console.log('[Seed Module 17] Seeding Pharmacy Returns...');
    await PharmacyReturn.findOneAndUpdate(
      { returnId: 'RET-20261016-00001' },
      {
        $set: {
          returnId: 'RET-20261016-00001',
          patientId: 'P10045',
          patientName: 'Anjali Sharma',
          pharmacyOrderId: 'PO40021',
          dispensingRecordId: 'DISP-20261016-00001',
          reason: 'PATIENT_RETURN',
          reasonDetails: 'Patient felt better after 2 days; unopened blister strip returned.',
          status: 'REQUESTED',
          items: [
            {
              medicineId: 'MED-000001',
              medicineName: 'Paracetamol',
              inventoryBatchId: 'BAT-10001',
              quantity: 5,
              unit: 'Tablet',
              unitPrice: 2.5,
              refundAmount: 12.5,
              condition: 'UNOPENED',
              disposition: 'QUARANTINE'
            }
          ],
          totalRefundAmount: 12.5,
          requestedBy: 'RECEPT001'
        }
      },
      { upsert: true, new: true }
    );

    console.log('[Seed Module 17] Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Module 17] Error seeding pharmacy data:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedModule17();
}

module.exports = seedModule17;
