const mongoose = require('mongoose');
const RadiologyExam = require('../models/RadiologyExam');
const RadiologyModality = require('../models/RadiologyModality');
const RadiologyOrder = require('../models/RadiologyOrder');
const RadiologySchedule = require('../models/RadiologySchedule');
const RadiologyStudy = require('../models/RadiologyStudy');
const RadiologyReport = require('../models/RadiologyReport');
const RadiologyException = require('../models/RadiologyException');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const BillingCharge = require('../models/BillingCharge');
const RPAJob = require('../models/RPAJob');

const seedModule22Radiology = async () => {
  try {
    console.log('[Seed Module 22] Seeding Radiology Administration Master & Demo Records...');

    // 1. Seed Radiology Examination Catalog
    const examCatalog = [
      {
        examId: 'RAD-EXM-00001',
        code: 'RAD-XR-001',
        name: 'Chest X-Ray (PA & Lateral)',
        category: 'DIAGNOSTIC_XRAY',
        modalityType: 'X_RAY',
        bodyPart: 'Chest / Thorax',
        description: 'Standard two-view posteroanterior and lateral radiographic examination of the chest and thoracic cavity.',
        preparationInstructions: 'Remove metallic necklaces and clothing above the waist. Hospital gown provided.',
        fastingRequired: false,
        appointmentRequired: false,
        estimatedDurationMinutes: 15,
        turnaroundTimeMinutes: 60,
        chargeCode: 'RAD-XR-001',
        priceReference: 85,
        status: 'ACTIVE'
      },
      {
        examId: 'RAD-EXM-00002',
        code: 'RAD-CT-001',
        name: 'CT Head / Brain without Contrast',
        category: 'COMPUTED_TOMOGRAPHY',
        modalityType: 'CT',
        bodyPart: 'Head / Brain',
        description: 'High-resolution non-contrast computed tomography scan of the brain, calvarium, and ventricular system.',
        preparationInstructions: 'Remove hair pins, earrings, eyeglasses, and dental prostheses prior to entering the scan room.',
        fastingRequired: false,
        appointmentRequired: true,
        estimatedDurationMinutes: 30,
        turnaroundTimeMinutes: 90,
        chargeCode: 'RAD-CT-001',
        priceReference: 350,
        status: 'ACTIVE'
      },
      {
        examId: 'RAD-EXM-00003',
        code: 'RAD-CT-002',
        name: 'CT Abdomen & Pelvis with Contrast',
        category: 'COMPUTED_TOMOGRAPHY',
        modalityType: 'CT',
        bodyPart: 'Abdomen & Pelvis',
        description: 'Contrast-enhanced multi-detector CT imaging of the abdominal visceral organs, vasculature, and retroperitoneum.',
        preparationInstructions: 'Strict fasting for 4 hours prior. Drink oral contrast 1 hour before scheduled scan. Serum creatinine required.',
        fastingRequired: true,
        appointmentRequired: true,
        estimatedDurationMinutes: 45,
        turnaroundTimeMinutes: 120,
        chargeCode: 'RAD-CT-002',
        priceReference: 580,
        status: 'ACTIVE'
      },
      {
        examId: 'RAD-EXM-00004',
        code: 'RAD-MRI-001',
        name: 'MRI Brain with Neuro-Sequences',
        category: 'MAGNETIC_RESONANCE',
        modalityType: 'MRI',
        bodyPart: 'Brain',
        description: 'Multiparametric magnetic resonance imaging of brain parenchyma with T1, T2, FLAIR, and DWI sequences.',
        preparationInstructions: 'Complete MRI safety screening. Strictly no metallic implants, pacemakers, or magnetic jewelry allowed.',
        fastingRequired: false,
        appointmentRequired: true,
        estimatedDurationMinutes: 45,
        turnaroundTimeMinutes: 150,
        chargeCode: 'RAD-MRI-001',
        priceReference: 720,
        status: 'ACTIVE'
      },
      {
        examId: 'RAD-EXM-00005',
        code: 'RAD-MRI-002',
        name: 'MRI Knee Joint (Right/Left)',
        category: 'MAGNETIC_RESONANCE',
        modalityType: 'MRI',
        bodyPart: 'Knee Joint',
        description: 'Targeted high-field MRI assessment of meniscal cartilage, cruciate ligaments, and articular structures.',
        preparationInstructions: 'Wear loose clothing free of metal zippers. Arrive 20 minutes prior for ferromagnetic screening.',
        fastingRequired: false,
        appointmentRequired: true,
        estimatedDurationMinutes: 40,
        turnaroundTimeMinutes: 120,
        chargeCode: 'RAD-MRI-002',
        priceReference: 650,
        status: 'ACTIVE'
      },
      {
        examId: 'RAD-EXM-00006',
        code: 'RAD-US-001',
        name: 'Ultrasound Whole Abdomen & Pelvis',
        category: 'ULTRASOUND',
        modalityType: 'ULTRASOUND',
        bodyPart: 'Abdomen & Pelvis',
        description: 'Non-invasive acoustic imaging of the liver, gallbladder, pancreas, spleen, kidneys, and urinary bladder.',
        preparationInstructions: 'Fast for 6 hours before scan. Maintain a full urinary bladder by drinking 1 liter of plain water 1 hour prior.',
        fastingRequired: true,
        appointmentRequired: true,
        estimatedDurationMinutes: 30,
        turnaroundTimeMinutes: 60,
        chargeCode: 'RAD-US-001',
        priceReference: 160,
        status: 'ACTIVE'
      },
      {
        examId: 'RAD-EXM-00007',
        code: 'RAD-MAM-001',
        name: 'Bilateral Digital Diagnostic Mammography',
        category: 'MAMMOGRAPHY',
        modalityType: 'MAMMOGRAPHY',
        bodyPart: 'Breast',
        description: 'Low-dose digital radiographic screening and diagnostic views (CC and MLO) of both breasts.',
        preparationInstructions: 'Do not use deodorant, talcum powder, or lotion on underarms or breasts on the day of examination.',
        fastingRequired: false,
        appointmentRequired: true,
        estimatedDurationMinutes: 30,
        turnaroundTimeMinutes: 90,
        chargeCode: 'RAD-MAM-001',
        priceReference: 220,
        status: 'ACTIVE'
      }
    ];

    for (const examData of examCatalog) {
      await RadiologyExam.findOneAndUpdate(
        { code: examData.code },
        { ...examData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`[Seed Module 22] Seeded ${examCatalog.length} Radiology Examination master catalog items.`);

    // 2. Seed Modalities (Physical Resources)
    const modalitiesCatalog = [
      {
        modalityId: 'MOD-CT-01',
        name: 'Somatom 128-Slice Multidetector CT',
        type: 'CT',
        location: 'Radiology Pavilion, Ground Floor',
        room: 'CT Suite 1',
        manufacturer: 'Siemens Healthineers',
        model: 'SOMATOM Definition AS',
        serialReference: 'CT-SN-882194',
        status: 'AVAILABLE',
        operatingHours: {
          start: '08:00',
          end: '20:00',
          slotDurationMinutes: 30,
          bufferMinutes: 10,
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        },
        maintenanceSchedule: {
          nextMaintenanceDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          lastMaintenanceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          maintenanceFrequencyDays: 90,
          notes: 'Preventive detector calibration scheduled.'
        },
        externalSystemId: 'RIS-MOD-CT01'
      },
      {
        modalityId: 'MOD-MRI-01',
        name: 'Magnetom 3.0T Wide-Bore MRI',
        type: 'MRI',
        location: 'Radiology Pavilion, Ground Floor',
        room: 'MRI Suite 1',
        manufacturer: 'Siemens Healthineers',
        model: 'MAGNETOM Vida 3T',
        serialReference: 'MRI-SN-994102',
        status: 'AVAILABLE',
        operatingHours: {
          start: '07:30',
          end: '21:00',
          slotDurationMinutes: 45,
          bufferMinutes: 15,
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        },
        maintenanceSchedule: {
          nextMaintenanceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          lastMaintenanceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          maintenanceFrequencyDays: 90,
          notes: 'Helium cold head pressure normal.'
        },
        externalSystemId: 'RIS-MOD-MRI01'
      },
      {
        modalityId: 'MOD-XRAY-01',
        name: 'Digital Floor-Mounted X-Ray Room 1',
        type: 'X_RAY',
        location: 'Outpatient Radiology, Room 102',
        room: 'X-Ray Bay A',
        manufacturer: 'GE Healthcare',
        model: 'Definium 646 HD',
        serialReference: 'XR-SN-331045',
        status: 'AVAILABLE',
        operatingHours: {
          start: '08:00',
          end: '20:00',
          slotDurationMinutes: 15,
          bufferMinutes: 5,
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        },
        maintenanceSchedule: {
          nextMaintenanceDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
          notes: 'Tube focal spot verified.'
        },
        externalSystemId: 'RIS-MOD-XR01'
      },
      {
        modalityId: 'MOD-US-01',
        name: 'EPIQ Ultrasound Doppler Console',
        type: 'ULTRASOUND',
        location: 'Radiology Ultrasound Suite 2',
        room: 'US Room 2',
        manufacturer: 'Philips Healthcare',
        model: 'EPIQ Elite',
        serialReference: 'US-SN-552910',
        status: 'AVAILABLE',
        operatingHours: {
          start: '08:30',
          end: '18:30',
          slotDurationMinutes: 30,
          bufferMinutes: 10,
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        },
        maintenanceSchedule: {
          nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: 'Convex and linear transducers inspected.'
        },
        externalSystemId: 'RIS-MOD-US01'
      },
      {
        modalityId: 'MOD-MAM-01',
        name: '3D Tomosynthesis Mammography Unit',
        type: 'MAMMOGRAPHY',
        location: 'Women\'s Imaging Center',
        room: 'Mammography Suite',
        manufacturer: 'Hologic',
        model: 'Dimensions 3D',
        serialReference: 'MAM-SN-772183',
        status: 'AVAILABLE',
        operatingHours: {
          start: '09:00',
          end: '17:00',
          slotDurationMinutes: 30,
          bufferMinutes: 10,
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
        },
        maintenanceSchedule: {
          nextMaintenanceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          notes: 'AEC compression plate calibrated.'
        },
        externalSystemId: 'RIS-MOD-MAM01'
      }
    ];

    for (const modalityData of modalitiesCatalog) {
      await RadiologyModality.findOneAndUpdate(
        { modalityId: modalityData.modalityId },
        { ...modalityData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`[Seed Module 22] Seeded ${modalitiesCatalog.length} Radiology Modalities.`);

    // 3. Find demo patient and doctor
    let patient = await Patient.findOne({ patientId: 'P10001' });
    if (!patient) patient = await Patient.findOne();
    let doctor = await Doctor.findOne();

    const ctExam = await RadiologyExam.findOne({ code: 'RAD-CT-001' });
    const ctModality = await RadiologyModality.findOne({ modalityId: 'MOD-CT-01' });

    if (patient && ctExam && ctModality) {
      // 4. Seed Completed Order + Study + Report (Demo E2E Flow)
      const order1 = await RadiologyOrder.findOneAndUpdate(
        { orderId: 'RAD-2026-10001' },
        {
          orderId: 'RAD-2026-10001',
          patientId: patient._id,
          patientCode: patient.patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          orderingDoctorId: doctor ? doctor._id : patient._id,
          orderingDoctorName: 'Dr. Sarah Jenkins',
          examId: ctExam._id,
          examNameSnapshot: ctExam.name,
          examCodeSnapshot: ctExam.code,
          modalityTypeSnapshot: ctExam.modalityType,
          bodyPartSnapshot: ctExam.bodyPart,
          priority: 'NORMAL',
          clinicalNote: 'Persistent cephalalgia and vertigo for 2 weeks.',
          orderDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'RELEASED',
          externalRisOrderId: 'RIS-2026-881290',
          externalPacsStudyId: 'PACS-RAD-ACC-2026-000001',
          source: 'DOCTOR_PORTAL'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const schedule1 = await RadiologySchedule.findOneAndUpdate(
        { scheduleId: 'RAD-SCH-2026-00001' },
        {
          scheduleId: 'RAD-SCH-2026-00001',
          orderId: order1._id,
          patientId: patient._id,
          patientName: order1.patientName,
          examId: ctExam._id,
          examName: ctExam.name,
          modalityId: ctModality._id,
          modalityName: ctModality.name,
          room: ctModality.room,
          scheduledStart: new Date(Date.now() - 20 * 60 * 60 * 1000),
          scheduledEnd: new Date(Date.now() - 19.5 * 60 * 60 * 1000),
          status: 'COMPLETED',
          confirmedAt: new Date(Date.now() - 22 * 60 * 60 * 1000)
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const study1 = await RadiologyStudy.findOneAndUpdate(
        { accessionNumber: 'RAD-ACC-2026-000001' },
        {
          studyId: 'RAD-STD-2026-00001',
          accessionNumber: 'RAD-ACC-2026-000001',
          orderId: order1._id,
          patientId: patient._id,
          patientName: order1.patientName,
          examId: ctExam._id,
          examName: ctExam.name,
          modalityId: ctModality._id,
          modalityType: ctExam.modalityType,
          room: ctModality.room,
          performedDateTime: new Date(Date.now() - 20 * 60 * 60 * 1000),
          completedDateTime: new Date(Date.now() - 19.5 * 60 * 60 * 1000),
          performedByName: 'Alex Wright, RT(R)(CT)',
          studyStatus: 'COMPLETED',
          externalPacsStudyId: 'PACS-RAD-ACC-2026-000001',
          externalStudyUID: '1.2.840.10008.5.1.4.1.1.2.9812401',
          imageReference: 'https://pacs.hospital.org/viewer?accession=RAD-ACC-2026-000001',
          technicianNotes: 'Non-contrast volumetric axial acquisition complete. Motion artifact absent.'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await RadiologyReport.findOneAndUpdate(
        { reportNumber: 'RAD-RPT-2026-00001' },
        {
          reportId: 'RAD-RPT-ID-00001',
          reportNumber: 'RAD-RPT-2026-00001',
          studyId: study1._id,
          orderId: order1._id,
          patientId: patient._id,
          patientName: order1.patientName,
          radiologistId: doctor ? doctor.userId || doctor._id : patient._id,
          radiologistName: 'Dr. Marcus Vance, MD (Radiology)',
          clinicalHistory: 'Headache and dizziness evaluation.',
          technique: 'Axial non-contrast computed tomography of the brain from skull base to vertex.',
          findings: 'Parenchymal attenuation appears normal. No evidence of acute intracranial hemorrhage, mass effect, or territorial infarction. Ventricular system, basal cisterns, and cerebral sulci are within normal limits for age. Calvarium and skull base intact.',
          impression: 'Unremarkable non-contrast CT brain. No acute intracranial pathology identified.',
          recommendations: 'Clinical correlation and follow-up as indicated.',
          reportText: 'FINDINGS: Unremarkable CT head.\nIMPRESSION: Normal brain parenchyma.',
          status: 'RELEASED',
          reportVersion: 1,
          verifiedByName: 'Dr. Marcus Vance, MD',
          verifiedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
          releasedByName: 'Dr. Marcus Vance, MD',
          releasedAt: new Date(Date.now() - 17.5 * 60 * 60 * 1000)
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Seed Billing Charge for Order 1
      await BillingCharge.findOneAndUpdate(
        { chargeId: 'CHG-RAD-10001' },
        {
          chargeId: 'CHG-RAD-10001',
          patientId: patient.patientId || String(patient._id),
          admissionId: 'OPD-NON-ADMITTED',
          serviceType: 'RADIOLOGY',
          serviceName: `Radiology Examination: ${ctExam.name} (${ctExam.code})`,
          serviceReferenceId: String(order1._id),
          unitPrice: ctExam.priceReference,
          quantity: 1,
          totalAmount: ctExam.priceReference,
          status: 'PENDING',
          chargeDate: new Date(Date.now() - 19.5 * 60 * 60 * 1000)
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 5. Seed In-Progress Order (Procedure Queue)
      const mriExam = await RadiologyExam.findOne({ code: 'RAD-MRI-001' });
      const mriModality = await RadiologyModality.findOne({ modalityId: 'MOD-MRI-01' });

      if (mriExam && mriModality) {
        const order2 = await RadiologyOrder.findOneAndUpdate(
          { orderId: 'RAD-2026-10002' },
          {
            orderId: 'RAD-2026-10002',
            patientId: patient._id,
            patientCode: patient.patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            orderingDoctorId: doctor ? doctor._id : patient._id,
            orderingDoctorName: 'Dr. Sarah Jenkins',
            examId: mriExam._id,
            examNameSnapshot: mriExam.name,
            examCodeSnapshot: mriExam.code,
            modalityTypeSnapshot: mriExam.modalityType,
            bodyPartSnapshot: mriExam.bodyPart,
            priority: 'URGENT',
            clinicalNote: 'Suspected demyelinating disease / optic neuritis.',
            orderDateTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
            status: 'IN_PROGRESS',
            source: 'DOCTOR_PORTAL'
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await RadiologyStudy.findOneAndUpdate(
          { accessionNumber: 'RAD-ACC-2026-000002' },
          {
            studyId: 'RAD-STD-2026-00002',
            accessionNumber: 'RAD-ACC-2026-000002',
            orderId: order2._id,
            patientId: patient._id,
            patientName: order2.patientName,
            examId: mriExam._id,
            examName: mriExam.name,
            modalityId: mriModality._id,
            modalityType: mriExam.modalityType,
            room: mriModality.room,
            performedDateTime: new Date(),
            performedByName: 'Elena Rostova, RT(MR)',
            studyStatus: 'IN_PROGRESS',
            technicianNotes: 'Patient positioned with head coil. T1 axial in progress.'
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      // 6. Seed Operational Exception Scenario
      await RadiologyException.findOneAndUpdate(
        { exceptionId: 'RAD-EXP-2026-00001' },
        {
          exceptionId: 'RAD-EXP-2026-00001',
          type: 'PREPARATION_INCOMPLETE',
          severity: 'HIGH',
          patientId: patient._id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          description: 'Patient reported consuming food 1 hour prior to Contrast CT Abdomen. Required 4h fasting not met.',
          source: 'RECEPTION_CHECKIN',
          status: 'OPEN'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log('[Seed Module 22] Radiology Administration Seeding Completed Successfully!');
  } catch (err) {
    console.error('[Seed Module 22 Error]:', err);
    throw err;
  }
};

module.exports = seedModule22Radiology;
