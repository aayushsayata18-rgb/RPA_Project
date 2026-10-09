require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const HospitalConfiguration = require('../models/HospitalConfiguration');
const NotificationTemplate = require('../models/NotificationTemplate');
const DocumentTemplate = require('../models/DocumentTemplate');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Registration = require('../models/Registration');
const EmergencyTemporaryRecord = require('../models/EmergencyTemporaryRecord');
const ExceptionCase = require('../models/ExceptionCase');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');
const AppointmentHistory = require('../models/AppointmentHistory');
const AppointmentReminder = require('../models/AppointmentReminder');
const { ROLES, PORTAL_ROLES } = require('../config/roles');
const { ROLE_PERMISSIONS, PERMISSIONS } = require('../config/permissions');

const seedMaster = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('[Seed Master] MongoDB Connected successfully.');

    // 1. Seed Roles
    console.log('[Seed Master] Seeding 17 System Roles...');
    for (const roleCode of Object.values(ROLES)) {
      let portal = 'ADMIN_PORTAL';
      if (PORTAL_ROLES.PATIENT_PORTAL.includes(roleCode)) portal = 'PATIENT_PORTAL';
      else if (PORTAL_ROLES.CLINICAL_PORTAL.includes(roleCode)) portal = 'CLINICAL_PORTAL';
      else if (PORTAL_ROLES.OPERATIONS_PORTAL.includes(roleCode)) portal = 'OPERATIONS_PORTAL';
      else if (PORTAL_ROLES.FINANCE_PORTAL.includes(roleCode)) portal = 'FINANCE_PORTAL';

      await Role.findOneAndUpdate(
        { roleCode },
        {
          roleCode,
          name: roleCode.replace(/_/g, ' '),
          description: `Default system role for ${roleCode}`,
          portal,
          permissions: ROLE_PERMISSIONS[roleCode] || [],
          isSystemDefault: true,
          isActive: true
        },
        { upsert: true, new: true }
      );
    }

    // 2. Seed Default Hospital Configurations (00_MASTER.md Section 44 & 76)
    console.log('[Seed Master] Seeding Configurable Hospital Business Rules...');
    const defaultConfigs = [
      {
        configKey: 'APPOINTMENT_REMINDER_HOURS_BEFORE',
        category: 'APPOINTMENT',
        displayName: 'Appointment Reminder Notice (Hours)',
        value: 24,
        valueType: 'NUMBER',
        description: 'Hours before scheduled appointment to trigger SMS/Email reminder.'
      },
      {
        configKey: 'OPD_CHECKIN_GRACE_PERIOD_MINUTES',
        category: 'OPD',
        displayName: 'OPD Check-In Grace Period (Minutes)',
        value: 30,
        valueType: 'NUMBER',
        description: 'Allowed check-in time after scheduled appointment before marking No-Show.'
      },
      {
        configKey: 'PAYMENT_REMINDER_INTERVAL_HOURS',
        category: 'BILLING',
        displayName: 'Payment Reminder Interval (Hours)',
        value: 24,
        valueType: 'NUMBER',
        description: 'Interval between payment reminder notices for unpaid invoices.'
      },
      {
        configKey: 'MAX_PAYMENT_REMINDERS_COUNT',
        category: 'BILLING',
        displayName: 'Maximum Payment Reminders',
        value: 3,
        valueType: 'NUMBER',
        description: 'Maximum automated payment reminders before staff escalation.'
      },
      {
        configKey: 'HOUSEKEEPING_CLEANING_SLA_MINUTES',
        category: 'BED',
        displayName: 'Bed Cleaning SLA (Minutes)',
        value: 45,
        valueType: 'NUMBER',
        description: 'Standard expected duration for discharge bed cleaning turnover.'
      },
      {
        configKey: 'RPA_AUTO_RETRY_LIMIT',
        category: 'RPA',
        displayName: 'RPA Automated Retry Limit',
        value: 3,
        valueType: 'NUMBER',
        description: 'Maximum automatic retry attempts for transient RPA execution failures.'
      }
    ];

    for (const cfg of defaultConfigs) {
      await HospitalConfiguration.findOneAndUpdate(
        { configKey: cfg.configKey },
        cfg,
        { upsert: true, new: true }
      );
    }

    // 3. Seed Default Notification Templates
    console.log('[Seed Master] Seeding Central Notification Templates...');
    const defaultTemplates = [
      {
        templateCode: 'PATIENT_REGISTRATION_COMPLETED',
        name: 'Patient Registration Confirmation',
        event: 'PATIENT_REGISTRATION_COMPLETED',
        channel: 'ALL',
        subjectTemplate: 'Welcome to Hospital Administrative Platform - Registration Confirmed',
        bodyTemplate: 'Dear {{patientName}}, your registration is confirmed! Permanent Patient ID: {{patientId}}, Initial Visit ID: {{visitId}}. Please preserve this Patient ID for all future visits.',
        variables: ['patientName', 'patientId', 'visitId']
      },
      {
        templateCode: 'APPOINTMENT_CONFIRMATION',
        name: 'Appointment Confirmation',
        event: 'APPOINTMENT_CONFIRMED',
        channel: 'ALL',
        subjectTemplate: 'Appointment Confirmed - Hospital Platform',
        bodyTemplate: 'Dear {{patientName}}, your appointment with Dr. {{doctorName}} is confirmed for {{appointmentDateTime}}. Appointment ID: {{appointmentId}}.',
        variables: ['patientName', 'doctorName', 'appointmentDateTime', 'appointmentId']
      },
      {
        templateCode: 'APPOINTMENT_REMINDER_SMS',
        name: 'Appointment Reminder SMS',
        event: 'APPOINTMENT_REMINDER_SMS',
        channel: 'SMS',
        bodyTemplate: 'Reminder: Hello {{patientName}}, you have an upcoming appointment with Dr. {{doctorName}} on {{appointmentDateTime}} (Room: {{roomNumber}}). Appointment ID: {{appointmentId}}.',
        variables: ['patientName', 'doctorName', 'appointmentDateTime', 'appointmentId', 'roomNumber']
      },
      {
        templateCode: 'APPOINTMENT_REMINDER_EMAIL',
        name: 'Appointment Reminder Email',
        event: 'APPOINTMENT_REMINDER_EMAIL',
        channel: 'EMAIL',
        subjectTemplate: 'Upcoming Appointment Reminder - {{appointmentId}}',
        bodyTemplate: 'Dear {{patientName}},\n\nThis is a friendly reminder for your scheduled appointment with Dr. {{doctorName}} on {{appointmentDateTime}} at Room {{roomNumber}}.\n\nAppointment ID: {{appointmentId}}\n\nPlease arrive 15 minutes early for check-in.',
        variables: ['patientName', 'doctorName', 'appointmentDateTime', 'appointmentId', 'roomNumber']
      },
      {
        templateCode: 'APPOINTMENT_CANCELLED_SMS',
        name: 'Appointment Cancelled Notice',
        event: 'APPOINTMENT_CANCELLED_SMS',
        channel: 'ALL',
        subjectTemplate: 'Appointment Cancelled - {{appointmentId}}',
        bodyTemplate: 'Dear {{patientName}}, your appointment {{appointmentId}} with Dr. {{doctorName}} on {{appointmentDate}} at {{appointmentTime}} has been cancelled.',
        variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime', 'appointmentId']
      },
      {
        templateCode: 'APPOINTMENT_RESCHEDULED_SMS',
        name: 'Appointment Rescheduled Notice',
        event: 'APPOINTMENT_RESCHEDULED_SMS',
        channel: 'ALL',
        subjectTemplate: 'Appointment Rescheduled - {{appointmentId}}',
        bodyTemplate: 'Dear {{patientName}}, your appointment has been rescheduled. New appointment ID: {{appointmentId}} with Dr. {{doctorName}} on {{appointmentDateTime}}.',
        variables: ['patientName', 'doctorName', 'appointmentDateTime', 'appointmentId', 'previousAppointmentId']
      },
      {
        templateCode: 'APPOINTMENT_NO_SHOW_SMS',
        name: 'Appointment No-Show Notice',
        event: 'APPOINTMENT_NO_SHOW_SMS',
        channel: 'SMS',
        bodyTemplate: 'Hello {{patientName}}, we noticed you missed your scheduled appointment ({{appointmentId}}) with Dr. {{doctorName}}. You may rebook anytime via our patient portal.',
        variables: ['patientName', 'doctorName', 'appointmentId']
      },
      {
        templateCode: 'OPD_TOKEN_GENERATED',
        name: 'OPD Token Notice',
        event: 'OPD_CHECKIN_COMPLETE',
        channel: 'SMS',
        bodyTemplate: 'Hello {{patientName}}, you are checked in! Your OPD Token is {{tokenNumber}} for Room {{roomNumber}}.',
        variables: ['patientName', 'tokenNumber', 'roomNumber']
      },
      {
        templateCode: 'BILLING_INVOICE_GENERATED',
        name: 'Invoice Payment Notice',
        event: 'INVOICE_GENERATED',
        channel: 'ALL',
        subjectTemplate: 'Hospital Bill Generated - {{invoiceId}}',
        bodyTemplate: 'Dear {{patientName}}, your final invoice {{invoiceId}} of amount ₹{{amount}} is generated. Please complete payment via portal.',
        variables: ['patientName', 'invoiceId', 'amount']
      }
    ];

    for (const tmpl of defaultTemplates) {
      await NotificationTemplate.findOneAndUpdate(
        { templateCode: tmpl.templateCode },
        tmpl,
        { upsert: true, new: true }
      );
    }

    // 4. Seed Default Document Templates
    console.log('[Seed Master] Seeding Central Document Templates...');
    const defaultDocTemplates = [
      {
        templateCode: 'REGISTRATION_RECEIPT_TMPL',
        name: 'Patient Registration Receipt',
        documentType: 'REGISTRATION_RECEIPT',
        templateHtml: `
          <div style="font-family: Arial, sans-serif; padding: 30px; border: 2px solid #0284c7; border-radius: 8px;">
            <h1 style="color: #0369a1; margin-bottom: 4px;">Hospital Administrative Platform</h1>
            <p style="color: #64748b; font-size: 14px;">Official Patient Registration Slip</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <table style="width: 100%; font-size: 14px; line-height: 1.8;">
              <tr><td><strong>Patient ID:</strong></td><td>{{patientId}}</td></tr>
              <tr><td><strong>Full Name:</strong></td><td>{{patientName}}</td></tr>
              <tr><td><strong>Gender / Age:</strong></td><td>{{gender}} / {{age}}</td></tr>
              <tr><td><strong>Contact:</strong></td><td>{{phoneNumber}}</td></tr>
              <tr><td><strong>Registration Date:</strong></td><td>{{registeredAt}}</td></tr>
            </table>
          </div>
        `,
        variables: ['patientId', 'patientName', 'gender', 'age', 'phoneNumber', 'registeredAt']
      }
    ];

    for (const docTmpl of defaultDocTemplates) {
      await DocumentTemplate.findOneAndUpdate(
        { templateCode: docTmpl.templateCode },
        docTmpl,
        { upsert: true, new: true }
      );
    }

    // 5. Seed Core Seed Users
    console.log('[Seed Master] Seeding Default Users for all portals...');
    const defaultUsers = [
      {
        userId: 'USR-SYSADMIN-001',
        email: 'admin@hospital.com',
        password: 'Password@123',
        firstName: 'System',
        lastName: 'Administrator',
        phoneNumber: '9876543210',
        role: ROLES.SYSTEM_ADMIN,
        isActive: true,
        isVerified: true
      },
      {
        userId: 'USR-RECEPTION-001',
        email: 'reception@hospital.com',
        password: 'Password@123',
        firstName: 'Rita',
        lastName: 'Sharma',
        phoneNumber: '9876543211',
        role: ROLES.RECEPTIONIST,
        isActive: true,
        isVerified: true
      },
      {
        userId: 'USR-DOCTOR-001',
        email: 'doctor@hospital.com',
        password: 'Password@123',
        firstName: 'Dr. Rajesh',
        lastName: 'Verma',
        phoneNumber: '9876543212',
        role: ROLES.DOCTOR,
        linkedEntityId: 'DOC-1001',
        isActive: true,
        isVerified: true
      },
      {
        userId: 'USR-NURSE-001',
        email: 'nurse@hospital.com',
        password: 'Password@123',
        firstName: 'Anjali',
        lastName: 'Menon',
        phoneNumber: '9876543213',
        role: ROLES.NURSE,
        isActive: true,
        isVerified: true
      },
      {
        userId: 'USR-BILLING-001',
        email: 'billing@hospital.com',
        password: 'Password@123',
        firstName: 'Vikas',
        lastName: 'Gupta',
        phoneNumber: '9876543214',
        role: ROLES.BILLING_STAFF,
        isActive: true,
        isVerified: true
      },
      {
        userId: 'USR-INSURANCE-001',
        email: 'insurance@hospital.com',
        password: 'Password@123',
        firstName: 'Sunita',
        lastName: 'Rao',
        phoneNumber: '9876543215',
        role: ROLES.INSURANCE_REPRESENTATIVE,
        isActive: true,
        isVerified: true
      },
      {
        userId: 'USR-PATIENT-001',
        email: 'patient@hospital.com',
        password: 'Password@123',
        firstName: 'Aarav',
        lastName: 'Patel',
        phoneNumber: '9876543216',
        role: ROLES.PATIENT,
        linkedEntityId: 'P10001',
        isActive: true,
        isVerified: true
      }
    ];

    for (const u of defaultUsers) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        await User.create(u);
        console.log(`  -> Created demo user: ${u.email} (${u.role})`);
      } else {
        console.log(`  -> Demo user already exists: ${u.email}`);
      }
    }

    // 6. Seed Module 1: Patient Master, Visits & Registrations (01_PATIENT_REGISTRATION.md Section 80)
    console.log('[Seed Master] Seeding Module 1 Patient Master & Visit Encounters...');

    const demoPatients = [
      {
        patientId: 'P10001',
        firstName: 'Aarav',
        middleName: 'K',
        lastName: 'Patel',
        fullName: 'Aarav K Patel',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'MALE',
        bloodGroup: 'B+',
        mobile: '9876543216',
        email: 'patient@hospital.com',
        address: {
          line1: '402, Shivalik Heights',
          line2: 'Satellite Road',
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          postalCode: '380015'
        },
        emergencyContact: {
          name: 'Meera Patel',
          relationship: 'Spouse',
          mobile: '9876543219'
        },
        identityDocuments: [{ type: 'AADHAAR', reference: '1234-5678-9012', verified: true }],
        status: 'ACTIVE',
        registrationSource: 'ONLINE_SELF_REGISTRATION'
      },
      {
        patientId: 'P10002',
        firstName: 'Priya',
        middleName: '',
        lastName: 'Sharma',
        fullName: 'Priya Sharma',
        dateOfBirth: new Date('1994-08-22'),
        gender: 'FEMALE',
        bloodGroup: 'O+',
        mobile: '9876543220',
        email: 'priya.sharma@example.com',
        address: {
          line1: 'B-12, Green Park',
          line2: 'Ring Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '400001'
        },
        emergencyContact: {
          name: 'Ramesh Sharma',
          relationship: 'Father',
          mobile: '9876543221'
        },
        identityDocuments: [{ type: 'PASSPORT', reference: 'P9876543', verified: true }],
        status: 'ACTIVE',
        registrationSource: 'FRONT_DESK'
      },
      {
        patientId: 'P10003',
        firstName: 'Amit',
        middleName: 'R',
        lastName: 'Mehta',
        fullName: 'Amit R Mehta',
        dateOfBirth: new Date('1985-11-10'),
        gender: 'MALE',
        bloodGroup: 'A+',
        mobile: '9876543230',
        email: 'amit.mehta@example.com',
        address: {
          line1: 'Flat 101, Surya Complex',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          postalCode: '110001'
        },
        emergencyContact: {
          name: 'Kavita Mehta',
          relationship: 'Spouse',
          mobile: '9876543231'
        },
        identityDocuments: [{ type: 'DRIVING_LICENSE', reference: 'DL-0420110012345', verified: true }],
        status: 'ACTIVE',
        registrationSource: 'FRONT_DESK'
      },
      {
        patientId: 'P10004',
        firstName: 'Neha',
        middleName: '',
        lastName: 'Shah',
        fullName: 'Neha Shah',
        dateOfBirth: new Date('1998-05-10'),
        gender: 'FEMALE',
        bloodGroup: 'AB+',
        mobile: '9876543240',
        email: 'neha.shah@example.com',
        address: {
          line1: '14, Palm Avenue',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          postalCode: '560001'
        },
        status: 'ACTIVE',
        registrationSource: 'FRONT_DESK'
      },
      {
        patientId: 'P10005',
        firstName: 'Rohan',
        middleName: 'D',
        lastName: 'Desai',
        fullName: 'Rohan D Desai',
        dateOfBirth: new Date('1978-02-14'),
        gender: 'MALE',
        bloodGroup: 'O-',
        mobile: '9876543250',
        email: 'rohan.desai@example.com',
        address: {
          line1: '55, Ocean Drive',
          city: 'Goa',
          state: 'Goa',
          country: 'India',
          postalCode: '403001'
        },
        status: 'ACTIVE',
        registrationSource: 'FRONT_DESK'
      }
    ];

    const patientMap = {};
    for (const pat of demoPatients) {
      const savedPatient = await Patient.findOneAndUpdate(
        { patientId: pat.patientId },
        pat,
        { upsert: true, new: true }
      );
      patientMap[pat.patientId] = savedPatient;
      console.log(`  -> Seeded Patient Master: ${pat.patientId} - ${pat.fullName}`);
    }

    // Seed multiple visits for P10001 to prove Patient Identity != Encounter
    console.log('[Seed Master] Seeding Multiple Encounters for permanent Patient P10001...');
    const demoVisits = [
      {
        visitId: 'V202610001',
        patientId: 'P10001',
        patientRef: patientMap['P10001']._id,
        visitType: 'OPD',
        department: 'GENERAL_MEDICINE',
        chiefComplaint: 'Seasonal viral fever and body ache',
        status: 'COMPLETED',
        visitDate: new Date('2026-10-01T09:30:00Z'),
        registrationSource: 'ONLINE_SELF_REGISTRATION'
      },
      {
        visitId: 'V202610045',
        patientId: 'P10001',
        patientRef: patientMap['P10001']._id,
        visitType: 'FOLLOW_UP',
        department: 'GENERAL_MEDICINE',
        chiefComplaint: 'Follow-up consultation after fever recovery',
        status: 'COMPLETED',
        visitDate: new Date('2026-10-04T11:00:00Z'),
        registrationSource: 'FRONT_DESK'
      },
      {
        visitId: 'V202610098',
        patientId: 'P10001',
        patientRef: patientMap['P10001']._id,
        visitType: 'DIAGNOSTIC',
        department: 'CARDIOLOGY',
        chiefComplaint: 'Routine annual cardiovascular screening',
        status: 'IN_PROGRESS',
        visitDate: new Date('2026-10-08T08:00:00Z'),
        registrationSource: 'FRONT_DESK'
      },
      {
        visitId: 'V202610002',
        patientId: 'P10002',
        patientRef: patientMap['P10002']._id,
        visitType: 'OPD',
        department: 'DERMATOLOGY',
        chiefComplaint: 'Skin allergic rash on forearm',
        status: 'COMPLETED',
        visitDate: new Date('2026-10-02T14:15:00Z'),
        registrationSource: 'FRONT_DESK'
      }
    ];

    for (const vis of demoVisits) {
      await Visit.findOneAndUpdate({ visitId: vis.visitId }, vis, { upsert: true, new: true });
      console.log(`  -> Seeded Visit Encounter: ${vis.visitId} for ${vis.patientId}`);
    }

    // Seed Emergency Temporary Record
    console.log('[Seed Master] Seeding Emergency Temporary Record & Active Case...');
    const tempEmergency = {
      temporaryId: 'TEMPREC-2026-001',
      temporaryEmergencyId: 'TEMP-2026-00452',
      provisionalName: 'Unknown Trauma Patient (Male ~35)',
      estimatedAge: 35,
      gender: 'MALE',
      apparentCondition: 'Road traffic collision; blunt thoracic trauma',
      broughtBy: { name: 'Good Samaritan Patrol', relationship: 'First Responder', contact: '9876543999' },
      emergencyVisitId: 'V202610099',
      status: 'ACTIVE',
      identityVerificationStatus: 'PENDING',
      correlationId: 'CORR-20261008-009901'
    };
    await EmergencyTemporaryRecord.findOneAndUpdate(
      { temporaryEmergencyId: tempEmergency.temporaryEmergencyId },
      tempEmergency,
      { upsert: true, new: true }
    );

    await Visit.findOneAndUpdate(
      { visitId: 'V202610099' },
      {
        visitId: 'V202610099',
        patientId: 'TEMP-2026-00452',
        visitType: 'EMERGENCY',
        priority: 'EMERGENCY',
        department: 'EMERGENCY_AND_TRAUMA',
        chiefComplaint: 'Road traffic collision trauma intake',
        status: 'IN_PROGRESS',
        registrationSource: 'EMERGENCY'
      },
      { upsert: true, new: true }
    );

    // Seed Ambiguous Identity Exception Case
    console.log('[Seed Master] Seeding Ambiguous Identity Review Case...');
    const ambiguousReg = {
      registrationId: 'REG202610055',
      patientId: 'PENDING_VERIFICATION',
      visitId: 'PENDING_VERIFICATION',
      source: 'ONLINE_SELF_REGISTRATION',
      status: 'IDENTITY_VERIFICATION_REQUIRED',
      identityMatchStatus: 'POSSIBLE_MATCH',
      potentialMatches: [
        {
          patientId: 'P10004',
          fullName: 'Neha Shah',
          mobile: '9876543240',
          dateOfBirth: new Date('1998-05-10'),
          gender: 'FEMALE',
          matchScore: 78,
          matchReasons: ['Full name match', 'Date of birth match', 'Gender match']
        }
      ],
      submittedData: {
        firstName: 'Neha',
        lastName: 'Shah',
        dateOfBirth: new Date('1998-05-10'),
        gender: 'FEMALE',
        mobile: '9876599999',
        email: 'neha.new@example.com'
      },
      correlationId: 'CORR-20261008-005501'
    };
    await Registration.findOneAndUpdate(
      { registrationId: ambiguousReg.registrationId },
      ambiguousReg,
      { upsert: true, new: true }
    );

    await ExceptionCase.findOneAndUpdate(
      { exceptionId: 'EXC-2026-0001' },
      {
        exceptionId: 'EXC-2026-0001',
        type: 'PATIENT_IDENTITY_AMBIGUITY',
        severity: 'HIGH',
        priority: 'HIGH',
        module: 'PATIENT_REGISTRATION',
        entityType: 'REGISTRATION',
        entityId: 'REG202610055',
        correlationId: 'CORR-20261008-005501',
        status: 'OPEN',
        details: 'Ambiguous match detected for Neha Shah (DOB: 1998-05-10). Candidate match P10004 found. Requires front-desk review.'
      },
      { upsert: true, new: true }
    );

    // 7. Seed Module 2: Departments & Specialties
    console.log('[Seed Master] Seeding Module 2 Departments & Clinical Specialties...');
    const demoDepartments = [
      {
        departmentId: 'DEP-CARD',
        name: 'Department of Cardiology',
        code: 'CARD',
        description: 'Advanced adult & pediatric cardiovascular diagnostics, interventions, and preventive cardiology.',
        specialties: [{ specialtyId: 'SPEC-CARD-01', name: 'Cardiology', description: 'General & Interventional Cardiology' }],
        headOfDepartment: 'Dr. Rajesh Verma',
        location: { building: 'Tower A', floor: '2nd Floor', wing: 'East Wing' },
        isActive: true
      },
      {
        departmentId: 'DEP-GMED',
        name: 'Department of General Medicine',
        code: 'GMED',
        description: 'Comprehensive primary care, chronic disease management, and internal medicine.',
        specialties: [{ specialtyId: 'SPEC-GMED-01', name: 'General Medicine', description: 'Internal Medicine & Family Care' }],
        headOfDepartment: 'Dr. Anita Patel',
        location: { building: 'Main OPD Block', floor: 'Ground Floor', wing: 'West Wing' },
        isActive: true
      },
      {
        departmentId: 'DEP-DERM',
        name: 'Department of Dermatology',
        code: 'DERM',
        description: 'Clinical dermatology, trichology, and dermatological procedures.',
        specialties: [{ specialtyId: 'SPEC-DERM-01', name: 'Dermatology', description: 'Skin & Allergy Care' }],
        headOfDepartment: 'Dr. Vikram Shah',
        location: { building: 'Tower B', floor: '1st Floor', wing: 'North Wing' },
        isActive: true
      },
      {
        departmentId: 'DEP-ORTH',
        name: 'Department of Orthopedics',
        code: 'ORTH',
        description: 'Bone, joint, spine, sports medicine, and trauma reconstruction surgery.',
        specialties: [{ specialtyId: 'SPEC-ORTH-01', name: 'Orthopedics', description: 'Joint & Musculoskeletal Care' }],
        headOfDepartment: 'Dr. Sunil Desai',
        location: { building: 'Tower A', floor: '3rd Floor', wing: 'Central Wing' },
        isActive: true
      },
      {
        departmentId: 'DEP-PED',
        name: 'Department of Pediatrics',
        code: 'PED',
        description: 'Neonatal, infant, child, and adolescent healthcare & immunization.',
        specialties: [{ specialtyId: 'SPEC-PED-01', name: 'Pediatrics', description: 'Child Health & Growth' }],
        headOfDepartment: 'Dr. Priya Nair',
        location: { building: 'Tower B', floor: '2nd Floor', wing: 'South Wing' },
        isActive: true
      }
    ];

    for (const dep of demoDepartments) {
      await Department.findOneAndUpdate({ departmentId: dep.departmentId }, dep, { upsert: true, new: true });
      console.log(`  -> Seeded Department: ${dep.departmentId} - ${dep.name}`);
    }

    // 8. Seed Module 2: Doctor Profiles
    console.log('[Seed Master] Seeding Module 2 Doctor Master Profiles...');
    const demoDoctors = [
      {
        doctorId: 'DOC1001',
        firstName: 'Rajesh',
        lastName: 'Verma',
        fullName: 'Dr. Rajesh Verma',
        departmentId: 'DEP-CARD',
        departmentName: 'Department of Cardiology',
        specialty: 'Cardiology',
        qualifications: ['MBBS', 'MD (Internal Medicine)', 'DM (Cardiology)', 'FACC'],
        experienceYears: 14,
        consultationFee: 800,
        roomNumber: 'OPD-201',
        contactNumber: '9876543212',
        email: 'doctor@hospital.com',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 1,
        bio: 'Senior Interventional Cardiologist specializing in preventive heart health and coronary care.',
        status: 'ACTIVE'
      },
      {
        doctorId: 'DOC1002',
        firstName: 'Anita',
        lastName: 'Patel',
        fullName: 'Dr. Anita Patel',
        departmentId: 'DEP-GMED',
        departmentName: 'Department of General Medicine',
        specialty: 'General Medicine',
        qualifications: ['MBBS', 'MD (Internal Medicine)'],
        experienceYears: 10,
        consultationFee: 500,
        roomNumber: 'OPD-102',
        contactNumber: '9876543261',
        email: 'anita.patel@hospital.com',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 1,
        bio: 'Consultant Physician with expertise in lifestyle disorders, infectious diseases, and elder care.',
        status: 'ACTIVE'
      },
      {
        doctorId: 'DOC1003',
        firstName: 'Vikram',
        lastName: 'Shah',
        fullName: 'Dr. Vikram Shah',
        departmentId: 'DEP-DERM',
        departmentName: 'Department of Dermatology',
        specialty: 'Dermatology',
        qualifications: ['MBBS', 'MD (Dermatology & Venereology)'],
        experienceYears: 8,
        consultationFee: 600,
        roomNumber: 'OPD-103',
        contactNumber: '9876543262',
        email: 'vikram.shah@hospital.com',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 1,
        bio: 'Consultant Dermatologist specializing in clinical dermatology and laser treatments.',
        status: 'ACTIVE'
      },
      {
        doctorId: 'DOC1004',
        firstName: 'Sunil',
        lastName: 'Desai',
        fullName: 'Dr. Sunil Desai',
        departmentId: 'DEP-ORTH',
        departmentName: 'Department of Orthopedics',
        specialty: 'Orthopedics',
        qualifications: ['MBBS', 'MS (Orthopedics)', 'MCh (Joint Replacement)'],
        experienceYears: 12,
        consultationFee: 750,
        roomNumber: 'OPD-304',
        contactNumber: '9876543263',
        email: 'sunil.desai@hospital.com',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 1,
        bio: 'Orthopedic surgeon with extensive experience in knee/hip arthroplasty and sports injuries.',
        status: 'ACTIVE'
      },
      {
        doctorId: 'DOC1005',
        firstName: 'Priya',
        lastName: 'Nair',
        fullName: 'Dr. Priya Nair',
        departmentId: 'DEP-PED',
        departmentName: 'Department of Pediatrics',
        specialty: 'Pediatrics',
        qualifications: ['MBBS', 'MD (Pediatrics)', 'DCH'],
        experienceYears: 7,
        consultationFee: 500,
        roomNumber: 'OPD-205',
        contactNumber: '9876543264',
        email: 'priya.nair@hospital.com',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 1,
        bio: 'Child health specialist focused on developmental pediatrics and pediatric nutrition.',
        status: 'ACTIVE'
      }
    ];

    const standardDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const standardShifts = [
      { shiftName: 'Morning Shift', startTime: '09:00', endTime: '12:00' },
      { shiftName: 'Afternoon Shift', startTime: '14:00', endTime: '17:00' }
    ];
    const standardBreaks = [{ startTime: '13:00', endTime: '14:00', reason: 'Lunch Break' }];

    for (const doc of demoDoctors) {
      await Doctor.findOneAndUpdate({ doctorId: doc.doctorId }, doc, { upsert: true, new: true });
      console.log(`  -> Seeded Doctor: ${doc.doctorId} - ${doc.fullName} (${doc.specialty})`);

      // Seed Doctor Schedule
      const weeklyAvailability = standardDays.map((dayOfWeek) => ({
        dayOfWeek,
        isAvailable: true,
        shifts: standardShifts,
        breaks: standardBreaks,
        maxCapacityPerSlot: 1
      }));

      await DoctorSchedule.findOneAndUpdate(
        { doctorId: doc.doctorId },
        {
          doctorId: doc.doctorId,
          weeklyAvailability,
          slotDurationMinutes: 30,
          defaultMaxCapacityPerSlot: 1,
          leaves: [],
          blockedSlots: [],
          isActive: true
        },
        { upsert: true, new: true }
      );
    }

    // 9. Seed Module 2: Realistic Demo Appointments Across Statuses
    console.log('[Seed Master] Seeding Demo Appointments across all status lifecycles...');
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const demoAppointments = [
      {
        appointmentId: 'A202610001',
        patientId: 'P10001',
        patientName: 'Aarav K Patel',
        patientPhone: '9876543216',
        patientEmail: 'patient@hospital.com',
        doctorId: 'DOC1001',
        doctorName: 'Dr. Rajesh Verma',
        departmentId: 'DEP-CARD',
        departmentName: 'Department of Cardiology',
        specialty: 'Cardiology',
        appointmentDate: today,
        appointmentDateStr: todayStr,
        startTime: '10:30',
        endTime: '11:00',
        appointmentType: 'NEW_CONSULTATION',
        source: 'PATIENT_PORTAL',
        status: 'CONFIRMED',
        bookingReference: 'REF-A202610001-98A1',
        reason: 'Routine preventive cardiac review and ECG interpretation',
        checkInStatus: 'NOT_CHECKED_IN',
        reminderStatus: 'SCHEDULED',
        roomNumber: 'OPD-201',
        consultationFee: 800,
        correlationId: 'CORR-20261009-APT001'
      },
      {
        appointmentId: 'A202610002',
        patientId: 'P10002',
        patientName: 'Priya Sharma',
        patientPhone: '9876543220',
        patientEmail: 'priya.sharma@example.com',
        doctorId: 'DOC1003',
        doctorName: 'Dr. Vikram Shah',
        departmentId: 'DEP-DERM',
        departmentName: 'Department of Dermatology',
        specialty: 'Dermatology',
        appointmentDate: today,
        appointmentDateStr: todayStr,
        startTime: '11:00',
        endTime: '11:30',
        appointmentType: 'FOLLOW_UP',
        source: 'FRONT_DESK',
        status: 'COMPLETED',
        bookingReference: 'REF-A202610002-33F2',
        reason: 'Follow-up for forearm skin allergy check',
        checkInStatus: 'CHECKED_IN',
        checkedInAt: today,
        reminderStatus: 'DELIVERED',
        roomNumber: 'OPD-103',
        consultationFee: 600,
        correlationId: 'CORR-20261009-APT002'
      },
      {
        appointmentId: 'A202610003',
        patientId: 'P10003',
        patientName: 'Amit R Mehta',
        patientPhone: '9876543230',
        patientEmail: 'amit.mehta@example.com',
        doctorId: 'DOC1004',
        doctorName: 'Dr. Sunil Desai',
        departmentId: 'DEP-ORTH',
        departmentName: 'Department of Orthopedics',
        specialty: 'Orthopedics',
        appointmentDate: today,
        appointmentDateStr: todayStr,
        startTime: '09:30',
        endTime: '10:00',
        appointmentType: 'NEW_CONSULTATION',
        source: 'PATIENT_PORTAL',
        status: 'CANCELLED',
        cancellationReason: 'PATIENT_REQUEST',
        cancellationNotes: 'Patient out of town on work travel.',
        cancelledAt: today,
        bookingReference: 'REF-A202610003-88B1',
        reason: 'Right shoulder joint stiffness and discomfort',
        checkInStatus: 'NOT_CHECKED_IN',
        reminderStatus: 'CANCELLED',
        roomNumber: 'OPD-304',
        consultationFee: 750,
        correlationId: 'CORR-20261009-APT003'
      },
      {
        appointmentId: 'A202610004',
        patientId: 'P10004',
        patientName: 'Neha Shah',
        patientPhone: '9876543240',
        patientEmail: 'neha.shah@example.com',
        doctorId: 'DOC1002',
        doctorName: 'Dr. Anita Patel',
        departmentId: 'DEP-GMED',
        departmentName: 'Department of General Medicine',
        specialty: 'General Medicine',
        appointmentDate: today,
        appointmentDateStr: todayStr,
        startTime: '14:00',
        endTime: '14:30',
        appointmentType: 'NEW_CONSULTATION',
        source: 'PATIENT_PORTAL',
        status: 'RESCHEDULED',
        rescheduledToAppointmentId: 'A202610006',
        rescheduledAt: today,
        bookingReference: 'REF-A202610004-77A9',
        reason: 'Recurrent migraine evaluation',
        checkInStatus: 'NOT_CHECKED_IN',
        reminderStatus: 'CANCELLED',
        roomNumber: 'OPD-102',
        consultationFee: 500,
        correlationId: 'CORR-20261009-APT004'
      },
      {
        appointmentId: 'A202610005',
        patientId: 'P10005',
        patientName: 'Rohan D Desai',
        patientPhone: '9876543250',
        patientEmail: 'rohan.desai@example.com',
        doctorId: 'DOC1001',
        doctorName: 'Dr. Rajesh Verma',
        departmentId: 'DEP-CARD',
        departmentName: 'Department of Cardiology',
        specialty: 'Cardiology',
        appointmentDate: today,
        appointmentDateStr: todayStr,
        startTime: '09:00',
        endTime: '09:30',
        appointmentType: 'NEW_CONSULTATION',
        source: 'FRONT_DESK',
        status: 'NO_SHOW',
        checkInStatus: 'NO_SHOW',
        bookingReference: 'REF-A202610005-55C1',
        reason: 'Chest heaviness on exertion',
        reminderStatus: 'DELIVERED',
        roomNumber: 'OPD-201',
        consultationFee: 800,
        correlationId: 'CORR-20261009-APT005'
      },
      {
        appointmentId: 'A202610006',
        patientId: 'P10004',
        patientName: 'Neha Shah',
        patientPhone: '9876543240',
        patientEmail: 'neha.shah@example.com',
        doctorId: 'DOC1002',
        doctorName: 'Dr. Anita Patel',
        departmentId: 'DEP-GMED',
        departmentName: 'Department of General Medicine',
        specialty: 'General Medicine',
        appointmentDate: tomorrow,
        appointmentDateStr: tomorrowStr,
        startTime: '15:00',
        endTime: '15:30',
        appointmentType: 'NEW_CONSULTATION',
        source: 'PATIENT_PORTAL',
        status: 'CONFIRMED',
        rescheduledFromAppointmentId: 'A202610004',
        bookingReference: 'REF-A202610006-99D3',
        reason: 'Recurrent migraine evaluation (Rescheduled)',
        checkInStatus: 'NOT_CHECKED_IN',
        reminderStatus: 'SCHEDULED',
        roomNumber: 'OPD-102',
        consultationFee: 500,
        correlationId: 'CORR-20261009-APT006'
      }
    ];

    for (const apt of demoAppointments) {
      await Appointment.findOneAndUpdate({ appointmentId: apt.appointmentId }, apt, { upsert: true, new: true });

      // Add History Entry
      await AppointmentHistory.findOneAndUpdate(
        { appointmentId: apt.appointmentId, action: apt.status === 'CONFIRMED' ? 'CREATED' : apt.status },
        {
          historyId: `HIST-${apt.appointmentId}-${apt.status}`,
          appointmentId: apt.appointmentId,
          action: apt.status === 'CONFIRMED' ? 'CREATED' : apt.status,
          newStatus: apt.status,
          newDate: apt.appointmentDateStr,
          newStartTime: apt.startTime,
          newDoctorId: apt.doctorId,
          reason: `Seeded ${apt.status} appointment`,
          actorUserId: 'SEED_MASTER',
          actorRole: 'SYSTEM',
          correlationId: apt.correlationId,
          details: `Initial demo record for appointment ${apt.appointmentId}`
        },
        { upsert: true, new: true }
      );

      console.log(`  -> Seeded Appointment: ${apt.appointmentId} [${apt.status}] for ${apt.patientName} with ${apt.doctorName}`);
    }

    console.log('\n[Seed Master] Seed completed successfully with Module 1 & Module 2 Master Data!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Master Error]:', error);
    process.exit(1);
  }
};

seedMaster();

