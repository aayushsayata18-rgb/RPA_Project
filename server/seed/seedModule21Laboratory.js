const mongoose = require('mongoose');
const LabTest = require('../models/LabTest');
const LabOrder = require('../models/LabOrder');
const LabOrderItem = require('../models/LabOrderItem');
const LabSample = require('../models/LabSample');
const LabResult = require('../models/LabResult');
const LabReport = require('../models/LabReport');
const LabException = require('../models/LabException');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const seedModule21Laboratory = async () => {
  try {
    console.log('[Seed Module 21] Seeding Laboratory Administration Master & Demo Records...');

    // Resolve reference users/doctors/patients
    const [adminUser, techUser, doctorUser, demoPatient, demoDoctor] = await Promise.all([
      User.findOne({ role: 'SYSTEM_ADMIN' }),
      User.findOne({ role: 'LAB_TECHNICIAN' }),
      User.findOne({ role: 'DOCTOR' }),
      Patient.findOne({ patientId: 'P10045' }) || Patient.findOne(),
      Doctor.findOne()
    ]);

    // 1. Seed Laboratory Test Master Catalog
    const testCatalog = [
      {
        labTestId: 'LT-1001',
        code: 'CBC',
        name: 'Complete Blood Count (CBC Panel)',
        category: 'HEMATOLOGY',
        description: 'Comprehensive evaluation of cellular blood components including red cells, white cells and platelets.',
        specimenType: 'WHOLE_BLOOD',
        containerType: 'EDTA_TUBE_LAVENDER',
        collectionInstructions: 'Draw 3ml blood into EDTA lavender-top vacuum tube. Invert gently 8-10 times.',
        preparationInstructions: 'No special patient preparation required.',
        fastingRequired: false,
        turnaroundTimeMinutes: 60,
        priceReference: 450,
        status: 'ACTIVE',
        parameters: [
          { code: 'HB', name: 'Hemoglobin', unit: 'g/dL', referenceRange: '13.0 - 17.0 (M), 12.0 - 15.0 (F)', dataType: 'NUMERIC' },
          { code: 'WBC', name: 'Total Leukocyte Count (WBC)', unit: '/cumm', referenceRange: '4,000 - 11,000', dataType: 'NUMERIC' },
          { code: 'PLT', name: 'Platelet Count', unit: '/cumm', referenceRange: '150,000 - 450,000', dataType: 'NUMERIC' },
          { code: 'RBC', name: 'Total RBC Count', unit: 'million/cumm', referenceRange: '4.5 - 5.5', dataType: 'NUMERIC' },
          { code: 'HCT', name: 'Hematocrit (PCV)', unit: '%', referenceRange: '40 - 50 (M), 36 - 46 (F)', dataType: 'NUMERIC' }
        ],
        reagentsRequired: [
          { itemName: 'Hematology Diluent 20L', quantity: 1, unit: 'PACK' },
          { itemName: 'EDTA Vacutainer Tubes (Lavender)', quantity: 1, unit: 'PIECE' }
        ]
      },
      {
        labTestId: 'LT-1002',
        code: 'GLUCOSE',
        name: 'Fasting Blood Glucose (FBG)',
        category: 'BIOCHEMISTRY',
        description: 'Quantitative measurement of fasting blood sugar levels for metabolic & diabetes screening.',
        specimenType: 'PLASMA',
        containerType: 'FLUORIDE_GREY',
        collectionInstructions: 'Collect in Sodium Fluoride gray-top tube to inhibit glycolysis.',
        preparationInstructions: 'Strict 8 to 10 hours overnight fasting required. Water intake allowed.',
        fastingRequired: true,
        turnaroundTimeMinutes: 45,
        priceReference: 150,
        status: 'ACTIVE',
        parameters: [
          { code: 'FBG', name: 'Fasting Plasma Glucose', unit: 'mg/dL', referenceRange: '70 - 99 (Normal), 100 - 125 (Impaired)', dataType: 'NUMERIC' }
        ],
        reagentsRequired: [
          { itemName: 'Glucose GOD-POD Enzyme Reagent', quantity: 1, unit: 'VIAL' },
          { itemName: 'Fluoride Vacutainer Tubes (Grey)', quantity: 1, unit: 'PIECE' }
        ]
      },
      {
        labTestId: 'LT-1003',
        code: 'LFT',
        name: 'Liver Function Test (Comprehensive LFT)',
        category: 'BIOCHEMISTRY',
        description: 'Battery of hepatic biochemical assays measuring enzymes, bilirubin, and proteins.',
        specimenType: 'SERUM',
        containerType: 'SERUM_SEPARATOR_GOLD',
        collectionInstructions: 'Collect 4ml into SST yellow/gold tube. Allow clot for 20 minutes before centrifugation.',
        preparationInstructions: 'Avoid fatty meal 12 hours prior to collection.',
        fastingRequired: true,
        turnaroundTimeMinutes: 90,
        priceReference: 850,
        status: 'ACTIVE',
        parameters: [
          { code: 'TBIL', name: 'Total Bilirubin', unit: 'mg/dL', referenceRange: '0.2 - 1.2', dataType: 'NUMERIC' },
          { code: 'DBIL', name: 'Direct Bilirubin', unit: 'mg/dL', referenceRange: '0.0 - 0.3', dataType: 'NUMERIC' },
          { code: 'SGOT', name: 'AST / SGOT', unit: 'U/L', referenceRange: '10 - 40', dataType: 'NUMERIC' },
          { code: 'SGPT', name: 'ALT / SGPT', unit: 'U/L', referenceRange: '7 - 56', dataType: 'NUMERIC' },
          { code: 'ALP', name: 'Alkaline Phosphatase', unit: 'U/L', referenceRange: '44 - 147', dataType: 'NUMERIC' },
          { code: 'TP', name: 'Total Protein', unit: 'g/dL', referenceRange: '6.0 - 8.3', dataType: 'NUMERIC' }
        ]
      },
      {
        labTestId: 'LT-1004',
        code: 'KFT',
        name: 'Kidney Function Test (Renal Profile)',
        category: 'BIOCHEMISTRY',
        description: 'Assesses renal clearance, glomerular filtration rate, electrolyte balance and urea nitrogen.',
        specimenType: 'SERUM',
        containerType: 'SERUM_SEPARATOR_GOLD',
        collectionInstructions: 'Collect 3ml in SST gold tube.',
        preparationInstructions: 'Routine hydration recommended.',
        fastingRequired: false,
        turnaroundTimeMinutes: 90,
        priceReference: 750,
        status: 'ACTIVE',
        parameters: [
          { code: 'BUN', name: 'Blood Urea Nitrogen', unit: 'mg/dL', referenceRange: '7 - 20', dataType: 'NUMERIC' },
          { code: 'CREAT', name: 'Serum Creatinine', unit: 'mg/dL', referenceRange: '0.7 - 1.3 (M), 0.6 - 1.1 (F)', dataType: 'NUMERIC' },
          { code: 'URIC', name: 'Uric Acid', unit: 'mg/dL', referenceRange: '3.5 - 7.2', dataType: 'NUMERIC' },
          { code: 'EGFR', name: 'eGFR Estimated', unit: 'mL/min/1.73m2', referenceRange: '> 90', dataType: 'NUMERIC' }
        ]
      },
      {
        labTestId: 'LT-1005',
        code: 'LIPID',
        name: 'Lipid Profile Comprehensive',
        category: 'BIOCHEMISTRY',
        description: 'Cardiovascular risk stratification profiling cholesterol, high/low density lipoproteins and triglycerides.',
        specimenType: 'SERUM',
        containerType: 'SERUM_SEPARATOR_GOLD',
        collectionInstructions: 'Draw 3ml in yellow-top tube.',
        preparationInstructions: '12-hour overnight fasting required. Avoid alcohol 24h before test.',
        fastingRequired: true,
        turnaroundTimeMinutes: 90,
        priceReference: 650,
        status: 'ACTIVE',
        parameters: [
          { code: 'CHOL', name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200 (Desirable)', dataType: 'NUMERIC' },
          { code: 'TRIG', name: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150', dataType: 'NUMERIC' },
          { code: 'HDL', name: 'HDL Cholesterol', unit: 'mg/dL', referenceRange: '> 40 (M), > 50 (F)', dataType: 'NUMERIC' },
          { code: 'LDL', name: 'LDL Cholesterol Calculated', unit: 'mg/dL', referenceRange: '< 100 (Optimal)', dataType: 'NUMERIC' }
        ]
      },
      {
        labTestId: 'LT-1006',
        code: 'URINE',
        name: 'Urinalysis Routine & Microscopy',
        category: 'URINALYSIS',
        description: 'Physical, chemical dipstick, and microscopic examination of urine specimen.',
        specimenType: 'URINE',
        containerType: 'STERILE_CONTAINER',
        collectionInstructions: 'Collect clean-catch midstream urine sample in sterile container. Deliver to lab within 1 hour.',
        preparationInstructions: 'Clean periurethral area prior to voiding.',
        fastingRequired: false,
        turnaroundTimeMinutes: 45,
        priceReference: 200,
        status: 'ACTIVE',
        parameters: [
          { code: 'U_COL', name: 'Color', unit: '', referenceRange: 'Pale Yellow - Amber', dataType: 'TEXT' },
          { code: 'U_APP', name: 'Transparency', unit: '', referenceRange: 'Clear', dataType: 'TEXT' },
          { code: 'U_PH', name: 'pH Reaction', unit: '', referenceRange: '4.6 - 8.0', dataType: 'NUMERIC' },
          { code: 'U_PROT', name: 'Urine Protein', unit: '', referenceRange: 'Negative', dataType: 'TEXT' },
          { code: 'U_GLUC', name: 'Urine Glucose', unit: '', referenceRange: 'Negative', dataType: 'TEXT' }
        ]
      },
      {
        labTestId: 'LT-1007',
        code: 'TSH',
        name: 'Thyroid Stimulating Hormone (TSH Ultrasensitive)',
        category: 'IMMUNOLOGY',
        description: 'Chemiluminescence immunoassay for thyroid function screening.',
        specimenType: 'SERUM',
        containerType: 'SERUM_SEPARATOR_GOLD',
        collectionInstructions: 'Draw morning sample in SST tube.',
        preparationInstructions: 'Avoid biotin supplements 48 hours before testing.',
        fastingRequired: false,
        turnaroundTimeMinutes: 120,
        priceReference: 500,
        status: 'ACTIVE',
        parameters: [
          { code: 'TSH_VAL', name: 'TSH 3rd Generation', unit: 'uIU/mL', referenceRange: '0.45 - 4.50', dataType: 'NUMERIC' }
        ]
      },
      {
        labTestId: 'LT-1008',
        code: 'CRP',
        name: 'C-Reactive Protein (Quantitative hs-CRP)',
        category: 'SEROLOGY',
        description: 'Acute phase inflammatory biomarker measured by immunoturbidimetry.',
        specimenType: 'SERUM',
        containerType: 'SERUM_SEPARATOR_GOLD',
        collectionInstructions: 'Draw 3ml in SST tube.',
        preparationInstructions: 'No special preparation.',
        fastingRequired: false,
        turnaroundTimeMinutes: 60,
        priceReference: 400,
        status: 'ACTIVE',
        parameters: [
          { code: 'CRP_VAL', name: 'hs-CRP Quantitative', unit: 'mg/L', referenceRange: '< 3.0 (Normal Risk)', dataType: 'NUMERIC' }
        ]
      }
    ];

    for (const test of testCatalog) {
      await LabTest.findOneAndUpdate(
        { code: test.code },
        { ...test, createdBy: adminUser?._id, updatedBy: adminUser?._id },
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed Module 21] Seeded ${testCatalog.length} laboratory test master items.`);

    // 2. Seed Completed Demo Order (P10045: CBC + GLUCOSE)
    const cbcTest = await LabTest.findOne({ code: 'CBC' });
    const glucoseTest = await LabTest.findOne({ code: 'GLUCOSE' });

    if (demoPatient && cbcTest && glucoseTest) {
      const order1Id = 'LAB-2026-00001';
      let order1 = await LabOrder.findOne({ orderId: order1Id });

      if (!order1) {
        order1 = new LabOrder({
          orderId: order1Id,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          patientName: `${demoPatient.firstName} ${demoPatient.lastName}`,
          patientGender: demoPatient.gender || 'Male',
          patientAge: 42,
          admissionIdString: 'ADM10023',
          orderingDoctorId: demoDoctor?._id || adminUser?._id,
          orderingDoctorName: 'Dr. Ramesh Verma (Cardiology)',
          orderDateTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
          priority: 'NORMAL',
          clinicalNote: 'Pre-procedure baseline evaluation.',
          status: 'RELEASED',
          collectionLocation: 'CENTRAL_PHLEBOTOMY',
          billingReferenceId: 'CHG-10023-02',
          billingStatus: 'BILLED',
          externalLisOrderId: 'LIS-ORD-2026-904128',
          externalLisSyncStatus: 'SYNCED',
          externalLisSyncAt: new Date(Date.now() - 3.8 * 60 * 60 * 1000),
          source: 'DOCTOR_PORTAL'
        });
        await order1.save();

        // Items
        const item1 = new LabOrderItem({
          orderItemId: 'LOI-2026-00001',
          orderId: order1._id,
          orderIdString: order1.orderId,
          labTestId: cbcTest._id,
          testCodeSnapshot: cbcTest.code,
          testNameSnapshot: cbcTest.name,
          specimenTypeSnapshot: cbcTest.specimenType,
          containerTypeSnapshot: cbcTest.containerType,
          priceSnapshot: cbcTest.priceReference,
          status: 'RELEASED'
        });
        await item1.save();

        const item2 = new LabOrderItem({
          orderItemId: 'LOI-2026-00002',
          orderId: order1._id,
          orderIdString: order1.orderId,
          labTestId: glucoseTest._id,
          testCodeSnapshot: glucoseTest.code,
          testNameSnapshot: glucoseTest.name,
          specimenTypeSnapshot: glucoseTest.specimenType,
          containerTypeSnapshot: glucoseTest.containerType,
          priceSnapshot: glucoseTest.priceReference,
          status: 'RELEASED'
        });
        await item2.save();

        // Samples
        const sample1 = new LabSample({
          sampleId: 'SMP-2026-000001',
          accessionNumber: 'ACC-2026-000001',
          orderId: order1._id,
          orderIdString: order1.orderId,
          orderItemId: item1._id,
          orderItemIdString: item1.orderItemId,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          patientName: order1.patientName,
          specimenType: cbcTest.specimenType,
          containerType: cbcTest.containerType,
          collectionDateTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
          collectedByName: 'Sunita Sharma (Phlebotomist)',
          receivedDateTime: new Date(Date.now() - 3.2 * 60 * 60 * 1000),
          receivedByName: 'Pooja Verma (Lab Tech)',
          status: 'COMPLETED'
        });
        await sample1.save();

        const sample2 = new LabSample({
          sampleId: 'SMP-2026-000002',
          accessionNumber: 'ACC-2026-000002',
          orderId: order1._id,
          orderIdString: order1.orderId,
          orderItemId: item2._id,
          orderItemIdString: item2.orderItemId,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          patientName: order1.patientName,
          specimenType: glucoseTest.specimenType,
          containerType: glucoseTest.containerType,
          collectionDateTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
          collectedByName: 'Sunita Sharma (Phlebotomist)',
          receivedDateTime: new Date(Date.now() - 3.2 * 60 * 60 * 1000),
          receivedByName: 'Pooja Verma (Lab Tech)',
          status: 'COMPLETED'
        });
        await sample2.save();

        item1.sampleId = sample1._id;
        item1.sampleAccessionNumber = sample1.accessionNumber;
        await item1.save();

        item2.sampleId = sample2._id;
        item2.sampleAccessionNumber = sample2.accessionNumber;
        await item2.save();

        // Results
        const res1 = new LabResult({
          resultId: 'LRES-2026-000001',
          orderId: order1._id,
          orderIdString: order1.orderId,
          orderItemId: item1._id,
          sampleId: sample1._id,
          sampleAccessionNumber: sample1.accessionNumber,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          testId: cbcTest._id,
          testCodeSnapshot: cbcTest.code,
          testNameSnapshot: cbcTest.name,
          resultValue: '14.2',
          unit: 'g/dL',
          referenceRangeSnapshot: '13.0 - 17.0 g/dL',
          abnormalFlag: 'NORMAL',
          parameters: [
            { parameterCode: 'HB', parameterName: 'Hemoglobin', resultValue: '14.2', unit: 'g/dL', referenceRangeSnapshot: '13.0 - 17.0', abnormalFlag: 'NORMAL' },
            { parameterCode: 'WBC', parameterName: 'WBC Count', resultValue: '6,800', unit: '/cumm', referenceRangeSnapshot: '4,000 - 11,000', abnormalFlag: 'NORMAL' },
            { parameterCode: 'PLT', parameterName: 'Platelets', resultValue: '260,000', unit: '/cumm', referenceRangeSnapshot: '150,000 - 450,000', abnormalFlag: 'NORMAL' },
            { parameterCode: 'RBC', parameterName: 'RBC Count', resultValue: '4.85', unit: 'million/cumm', referenceRangeSnapshot: '4.5 - 5.5', abnormalFlag: 'NORMAL' },
            { parameterCode: 'HCT', parameterName: 'Hematocrit', resultValue: '42.5', unit: '%', referenceRangeSnapshot: '40 - 50', abnormalFlag: 'NORMAL' }
          ],
          status: 'VERIFIED',
          enteredByName: 'Pooja Verma (Lab Tech)',
          enteredAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
          verifiedByName: 'Dr. Ananya Roy (Pathologist)',
          verifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          version: 1
        });
        await res1.save();

        const res2 = new LabResult({
          resultId: 'LRES-2026-000002',
          orderId: order1._id,
          orderIdString: order1.orderId,
          orderItemId: item2._id,
          sampleId: sample2._id,
          sampleAccessionNumber: sample2.accessionNumber,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          testId: glucoseTest._id,
          testCodeSnapshot: glucoseTest.code,
          testNameSnapshot: glucoseTest.name,
          resultValue: '92',
          unit: 'mg/dL',
          referenceRangeSnapshot: '70 - 99 mg/dL',
          abnormalFlag: 'NORMAL',
          status: 'VERIFIED',
          enteredByName: 'Pooja Verma (Lab Tech)',
          enteredAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
          verifiedByName: 'Dr. Ananya Roy (Pathologist)',
          verifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          version: 1
        });
        await res2.save();

        item1.resultId = res1._id;
        item2.resultId = res2._id;
        await item1.save();
        await item2.save();

        // Report
        const report1 = new LabReport({
          reportId: 'LRPT-2026-000001',
          reportNumber: 'LAB-RPT-2026-00001',
          orderId: order1._id,
          orderIdString: order1.orderId,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          patientName: order1.patientName,
          reportVersion: 1,
          status: 'RELEASED',
          verifiedByName: 'Dr. Ananya Roy (Pathologist)',
          verifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          releasedByName: 'Dr. Ananya Roy (Pathologist)',
          releasedAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000),
          clinicalComments: 'All measured indices within normal biological reference intervals.',
          resultsSnapshot: [
            {
              orderItemId: item1.orderItemId,
              testCode: cbcTest.code,
              testName: cbcTest.name,
              specimenType: cbcTest.specimenType,
              status: 'VERIFIED',
              resultValue: '14.2',
              unit: 'g/dL',
              referenceRange: '13.0 - 17.0 g/dL',
              abnormalFlag: 'NORMAL',
              parameters: res1.parameters
            },
            {
              orderItemId: item2.orderItemId,
              testCode: glucoseTest.code,
              testName: glucoseTest.name,
              specimenType: glucoseTest.specimenType,
              status: 'VERIFIED',
              resultValue: '92',
              unit: 'mg/dL',
              referenceRange: '70 - 99 mg/dL',
              abnormalFlag: 'NORMAL',
              parameters: []
            }
          ]
        });
        await report1.save();

        item1.reportId = report1._id;
        item2.reportId = report1._id;
        await item1.save();
        await item2.save();
      }
    }

    // 3. Seed In-Progress Orders: Collection Queue & Verification Queue
    const lftTest = await LabTest.findOne({ code: 'LFT' });
    const kftTest = await LabTest.findOne({ code: 'KFT' });

    if (demoPatient && lftTest && kftTest) {
      const order2Id = 'LAB-2026-00002';
      let order2 = await LabOrder.findOne({ orderId: order2Id });

      if (!order2) {
        order2 = new LabOrder({
          orderId: order2Id,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          patientName: `${demoPatient.firstName} ${demoPatient.lastName}`,
          patientGender: demoPatient.gender || 'Male',
          patientAge: 42,
          orderingDoctorId: demoDoctor?._id || adminUser?._id,
          orderingDoctorName: 'Dr. Ramesh Verma',
          orderDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          priority: 'URGENT',
          clinicalNote: 'Suspected hepatic enzyme elevation.',
          status: 'AWAITING_COLLECTION',
          collectionLocation: 'WARD_3_BED_102'
        });
        await order2.save();

        const itemLft = new LabOrderItem({
          orderItemId: 'LOI-2026-00003',
          orderId: order2._id,
          orderIdString: order2.orderId,
          labTestId: lftTest._id,
          testCodeSnapshot: lftTest.code,
          testNameSnapshot: lftTest.name,
          specimenTypeSnapshot: lftTest.specimenType,
          containerTypeSnapshot: lftTest.containerType,
          priceSnapshot: lftTest.priceReference,
          status: 'AWAITING_COLLECTION'
        });
        await itemLft.save();

        const sampleLft = new LabSample({
          sampleId: 'SMP-2026-000003',
          accessionNumber: 'ACC-2026-000003',
          orderId: order2._id,
          orderIdString: order2.orderId,
          orderItemId: itemLft._id,
          orderItemIdString: itemLft.orderItemId,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          patientName: order2.patientName,
          specimenType: lftTest.specimenType,
          containerType: lftTest.containerType,
          status: 'REGISTERED'
        });
        await sampleLft.save();
        itemLft.sampleId = sampleLft._id;
        itemLft.sampleAccessionNumber = sampleLft.accessionNumber;
        await itemLft.save();
      }

      // Order 3: STAT in Verification Queue
      const order3Id = 'LAB-2026-00003';
      let order3 = await LabOrder.findOne({ orderId: order3Id });

      if (!order3) {
        order3 = new LabOrder({
          orderId: order3Id,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          patientName: `${demoPatient.firstName} ${demoPatient.lastName}`,
          orderingDoctorId: demoDoctor?._id || adminUser?._id,
          orderingDoctorName: 'Dr. Sneha Roy',
          orderDateTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
          priority: 'STAT',
          clinicalNote: 'Acute renal profile check STAT.',
          status: 'IN_PROCESS',
          collectionLocation: 'ICU_BED_04'
        });
        await order3.save();

        const itemKft = new LabOrderItem({
          orderItemId: 'LOI-2026-00004',
          orderId: order3._id,
          orderIdString: order3.orderId,
          labTestId: kftTest._id,
          testCodeSnapshot: kftTest.code,
          testNameSnapshot: kftTest.name,
          specimenTypeSnapshot: kftTest.specimenType,
          containerTypeSnapshot: kftTest.containerType,
          priceSnapshot: kftTest.priceReference,
          status: 'RESULT_ENTERED'
        });
        await itemKft.save();

        const sampleKft = new LabSample({
          sampleId: 'SMP-2026-000004',
          accessionNumber: 'ACC-2026-000004',
          orderId: order3._id,
          orderIdString: order3.orderId,
          orderItemId: itemKft._id,
          orderItemIdString: itemKft.orderItemId,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          patientName: order3.patientName,
          specimenType: kftTest.specimenType,
          containerType: kftTest.containerType,
          collectionDateTime: new Date(Date.now() - 50 * 60 * 1000),
          collectedByName: 'Rajesh Patil (Staff Nurse)',
          receivedDateTime: new Date(Date.now() - 40 * 60 * 1000),
          receivedByName: 'Pooja Verma (Lab Tech)',
          status: 'IN_PROCESS'
        });
        await sampleKft.save();

        const resKft = new LabResult({
          resultId: 'LRES-2026-000003',
          orderId: order3._id,
          orderIdString: order3.orderId,
          orderItemId: itemKft._id,
          sampleId: sampleKft._id,
          sampleAccessionNumber: sampleKft.accessionNumber,
          patientId: demoPatient._id,
          patientCode: demoPatient.patientId,
          testId: kftTest._id,
          testCodeSnapshot: kftTest.code,
          testNameSnapshot: kftTest.name,
          resultValue: '1.8',
          unit: 'mg/dL',
          referenceRangeSnapshot: '0.7 - 1.3 mg/dL',
          abnormalFlag: 'HIGH',
          parameters: [
            { parameterCode: 'BUN', parameterName: 'Blood Urea Nitrogen', resultValue: '28', unit: 'mg/dL', referenceRangeSnapshot: '7 - 20', abnormalFlag: 'HIGH' },
            { parameterCode: 'CREAT', parameterName: 'Serum Creatinine', resultValue: '1.8', unit: 'mg/dL', referenceRangeSnapshot: '0.7 - 1.3', abnormalFlag: 'HIGH' },
            { parameterCode: 'URIC', parameterName: 'Uric Acid', resultValue: '6.4', unit: 'mg/dL', referenceRangeSnapshot: '3.5 - 7.2', abnormalFlag: 'NORMAL' },
            { parameterCode: 'EGFR', parameterName: 'eGFR Estimated', resultValue: '48', unit: 'mL/min/1.73m2', referenceRangeSnapshot: '> 90', abnormalFlag: 'LOW' }
          ],
          technicianNotes: 'STAT values entered. Repeat analysis confirms elevated Creatinine.',
          status: 'PENDING_VERIFICATION',
          enteredByName: 'Pooja Verma (Lab Tech)',
          enteredAt: new Date(Date.now() - 20 * 60 * 1000),
          version: 1
        });
        await resKft.save();

        itemKft.sampleId = sampleKft._id;
        itemKft.sampleAccessionNumber = sampleKft.accessionNumber;
        itemKft.resultId = resKft._id;
        await itemKft.save();
      }
    }

    // 4. Seed Rejection Exception Scenario
    const rejectedSample = await LabSample.findOne({ accessionNumber: 'ACC-2026-000099' });
    if (!rejectedSample) {
      const rejSample = new LabSample({
        sampleId: 'SMP-2026-000099',
        accessionNumber: 'ACC-2026-000099',
        orderId: demoPatient._id,
        orderIdString: 'LAB-2026-00099',
        patientId: demoPatient._id,
        patientCode: demoPatient.patientId,
        patientName: `${demoPatient.firstName} ${demoPatient.lastName}`,
        specimenType: 'WHOLE_BLOOD',
        containerType: 'EDTA_TUBE_LAVENDER',
        collectionDateTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        status: 'REJECTED',
        rejectionReason: 'MISSING_LABEL',
        rejectionNotes: 'Specimen received without patient identity barcode label. Phlebotomy notified for fresh recollection.',
        recollectionRequired: true
      });
      await rejSample.save();

      const rejException = new LabException({
        exceptionId: 'LEX-2026-00001',
        type: 'SAMPLE_REJECTED',
        severity: 'HIGH',
        patientId: demoPatient._id,
        patientCode: demoPatient.patientId,
        orderIdString: 'LAB-2026-00099',
        sampleAccessionNumber: 'ACC-2026-000099',
        description: 'Sample rejected at reception desk due to missing identification label. Fresh recollection task assigned.',
        source: 'MERN_VALIDATION',
        status: 'OPEN'
      });
      await rejException.save();
    }

    console.log('[Seed Module 21] Seeded demo orders, samples, verification queue, and operational exceptions.');
  } catch (error) {
    console.error('[Seed Module 21 Error]:', error);
    throw error;
  }
};

module.exports = seedModule21Laboratory;
