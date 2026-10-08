require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const HospitalConfiguration = require('../models/HospitalConfiguration');
const NotificationTemplate = require('../models/NotificationTemplate');
const DocumentTemplate = require('../models/DocumentTemplate');
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

    // 3. Seed Default Notification Templates (00_MASTER.md Section 26)
    console.log('[Seed Master] Seeding Central Notification Templates...');
    const defaultTemplates = [
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

    // 4. Seed Default Document Templates (00_MASTER.md Section 42)
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
        phoneNumber: '+91 9876543210',
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
        phoneNumber: '+91 9876543211',
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
        phoneNumber: '+91 9876543212',
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
        phoneNumber: '+91 9876543213',
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
        phoneNumber: '+91 9876543214',
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
        phoneNumber: '+91 9876543215',
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
        phoneNumber: '+91 9876543216',
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

    console.log('\n[Seed Master] Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Master Error]:', error);
    process.exit(1);
  }
};

seedMaster();
