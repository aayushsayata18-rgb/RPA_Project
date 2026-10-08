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
        subjectTemplate: 'Appointment Confirmed - Hospital Automation',
        bodyTemplate: 'Dear {{patientName}}, your appointment with Dr. {{doctorName}} is confirmed for {{appointmentDateTime}}. Appointment ID: {{appointmentId}}.',
        variables: ['patientName', 'doctorName', 'appointmentDateTime', 'appointmentId']
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

    console.log('\n[Seed Master] Seed completed successfully with Module 1 Master Data!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Master Error]:', error);
    process.exit(1);
  }
};

seedMaster();
