require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Employee = require('../models/Employee');
const EmployeeHistory = require('../models/EmployeeHistory');
const AccessRequest = require('../models/AccessRequest');
const EmployeeExternalSync = require('../models/EmployeeExternalSync');
const Department = require('../models/Department');
const Role = require('../models/Role');
const User = require('../models/User');

const seedStaffData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
    console.log('--- SEEDING MODULE 12 STAFF MANAGEMENT RECORDS ---');

    // Ensure departments exist
    const departments = [
      { departmentId: 'DEP-RECEPTION', name: 'Front Desk & Reception', code: 'RECP' },
      { departmentId: 'DEP-NURSING', name: 'Nursing & Patient Care', code: 'NURS' },
      { departmentId: 'DEP-PHARMACY', name: 'Pharmacy Services', code: 'PHAR' },
      { departmentId: 'DEP-LAB', name: 'Pathology & Diagnostic Lab', code: 'PATH' },
      { departmentId: 'DEP-RAD', name: 'Radiology & Imaging', code: 'RAD' },
      { departmentId: 'DEP-BILLING', name: 'Billing & Cashier', code: 'BILL' },
      { departmentId: 'DEP-FINANCE', name: 'Finance & Accounts', code: 'FIN' },
      { departmentId: 'DEP-HK', name: 'Housekeeping & Sanitation', code: 'HK' },
      { departmentId: 'DEP-MAINT', name: 'Facilities & Maintenance', code: 'MAINT' },
      { departmentId: 'DEP-HR', name: 'Human Resources', code: 'HR' }
    ];

    for (const d of departments) {
      await Department.findOneAndUpdate(
        { departmentId: d.departmentId },
        { ...d, isActive: true },
        { upsert: true, new: true }
      );
    }

    const sampleStaff = [
      {
        employeeId: 'EMP10001',
        firstName: 'Priya',
        lastName: 'Shah',
        displayName: 'Priya Shah',
        gender: 'FEMALE',
        email: 'priya.shah@hospital.com',
        phone: '9820111111',
        employeeType: 'BILLING',
        employmentType: 'FULL_TIME',
        designation: 'Billing Executive',
        joiningDate: new Date('2024-01-15'),
        departmentAssignments: [
          {
            departmentId: 'DEP-BILLING',
            departmentName: 'Billing & Cashier',
            isPrimary: true,
            startDate: new Date('2024-01-15'),
            status: 'ACTIVE'
          }
        ],
        roleAssignments: [
          {
            roleCode: 'BILLING_STAFF',
            roleName: 'Billing Staff',
            startDate: new Date('2024-01-15'),
            status: 'ACTIVE'
          }
        ],
        status: 'ACTIVE',
        accessProvisioningStatus: 'PROVISIONED',
        qualifications: [{ qualification: 'B.Com Accounting', institution: 'Mumbai University', year: 2021 }]
      },
      {
        employeeId: 'EMP10002',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        displayName: 'Rajesh Kumar',
        gender: 'MALE',
        email: 'rajesh.kumar@hospital.com',
        phone: '9820222222',
        employeeType: 'NURSE',
        employmentType: 'FULL_TIME',
        designation: 'Head Inpatient Nurse',
        joiningDate: new Date('2023-06-01'),
        departmentAssignments: [
          {
            departmentId: 'DEP-NURSING',
            departmentName: 'Nursing & Patient Care',
            isPrimary: true,
            startDate: new Date('2023-06-01'),
            status: 'ACTIVE'
          }
        ],
        roleAssignments: [
          {
            roleCode: 'NURSE',
            roleName: 'Clinical Nurse',
            startDate: new Date('2023-06-01'),
            status: 'ACTIVE'
          }
        ],
        status: 'ACTIVE',
        accessProvisioningStatus: 'PROVISIONED',
        qualifications: [{ qualification: 'B.Sc Nursing', institution: 'Delhi Medical College', year: 2019 }]
      },
      {
        employeeId: 'EMP10003',
        firstName: 'Anjali',
        lastName: 'Verma',
        displayName: 'Anjali Verma',
        gender: 'FEMALE',
        email: 'anjali.verma@hospital.com',
        phone: '9820333333',
        employeeType: 'PHARMACIST',
        employmentType: 'FULL_TIME',
        designation: 'Senior Pharmacist',
        joiningDate: new Date('2023-11-10'),
        departmentAssignments: [
          {
            departmentId: 'DEP-PHARMACY',
            departmentName: 'Pharmacy Services',
            isPrimary: true,
            startDate: new Date('2023-11-10'),
            status: 'ACTIVE'
          }
        ],
        roleAssignments: [
          {
            roleCode: 'PHARMACIST',
            roleName: 'Pharmacist',
            startDate: new Date('2023-11-10'),
            status: 'ACTIVE'
          }
        ],
        status: 'ACTIVE',
        accessProvisioningStatus: 'PROVISIONED',
        qualifications: [{ qualification: 'B.Pharm', institution: 'Pune College of Pharmacy', year: 2020 }]
      },
      {
        employeeId: 'EMP10004',
        firstName: 'Vikram',
        lastName: 'Rao',
        displayName: 'Vikram Rao',
        gender: 'MALE',
        email: 'vikram.rao@hospital.com',
        phone: '9820444444',
        employeeType: 'LAB_TECHNICIAN',
        employmentType: 'FULL_TIME',
        designation: 'Senior Lab Technologist',
        joiningDate: new Date('2024-03-01'),
        departmentAssignments: [
          {
            departmentId: 'DEP-LAB',
            departmentName: 'Pathology & Diagnostic Lab',
            isPrimary: true,
            startDate: new Date('2024-03-01'),
            status: 'ACTIVE'
          }
        ],
        roleAssignments: [
          {
            roleCode: 'LAB_TECHNICIAN',
            roleName: 'Lab Technician',
            startDate: new Date('2024-03-01'),
            status: 'ACTIVE'
          }
        ],
        status: 'ACTIVE',
        accessProvisioningStatus: 'PROVISIONED',
        qualifications: [{ qualification: 'DMLT Pathology', institution: 'Nair Hospital', year: 2021 }]
      },
      {
        employeeId: 'EMP10005',
        firstName: 'Sneha',
        lastName: 'Patil',
        displayName: 'Sneha Patil',
        gender: 'FEMALE',
        email: 'sneha.patil@hospital.com',
        phone: '9820555555',
        employeeType: 'RECEPTIONIST',
        employmentType: 'FULL_TIME',
        designation: 'Front Desk Executive',
        joiningDate: new Date(),
        departmentAssignments: [
          {
            departmentId: 'DEP-RECEPTION',
            departmentName: 'Front Desk & Reception',
            isPrimary: true,
            startDate: new Date(),
            status: 'ACTIVE'
          }
        ],
        roleAssignments: [
          {
            roleCode: 'RECEPTIONIST',
            roleName: 'Receptionist',
            startDate: new Date(),
            status: 'ACTIVE'
          }
        ],
        status: 'PENDING_APPROVAL',
        accessProvisioningStatus: 'REQUESTED'
      },
      {
        employeeId: 'EMP10006',
        firstName: 'Manoj',
        lastName: 'Tiwari',
        displayName: 'Manoj Tiwari',
        gender: 'MALE',
        email: 'manoj.tiwari@hospital.com',
        phone: '9820666666',
        employeeType: 'HOUSEKEEPING',
        employmentType: 'CONTRACT',
        designation: 'Housekeeping Supervisor',
        joiningDate: new Date('2024-02-01'),
        departmentAssignments: [
          {
            departmentId: 'DEP-HK',
            departmentName: 'Housekeeping & Sanitation',
            isPrimary: true,
            startDate: new Date('2024-02-01'),
            status: 'ACTIVE'
          }
        ],
        roleAssignments: [
          {
            roleCode: 'HOUSEKEEPING',
            roleName: 'Housekeeping Staff',
            startDate: new Date('2024-02-01'),
            status: 'ACTIVE'
          }
        ],
        status: 'ACTIVE',
        accessProvisioningStatus: 'PROVISIONED'
      },
      {
        employeeId: 'EMP10007',
        firstName: 'Amit',
        lastName: 'Deshmukh',
        displayName: 'Amit Deshmukh',
        gender: 'MALE',
        email: 'amit.deshmukh@hospital.com',
        phone: '9820777777',
        employeeType: 'RADIOLOGY_TECHNICIAN',
        employmentType: 'FULL_TIME',
        designation: 'Radiology Technician',
        joiningDate: new Date('2023-08-15'),
        departmentAssignments: [
          {
            departmentId: 'DEP-RAD',
            departmentName: 'Radiology & Imaging',
            isPrimary: true,
            startDate: new Date('2023-08-15'),
            status: 'ACTIVE'
          }
        ],
        roleAssignments: [
          {
            roleCode: 'RADIOLOGY_TECHNICIAN',
            roleName: 'Radiology Technician',
            startDate: new Date('2023-08-15'),
            status: 'ACTIVE'
          }
        ],
        status: 'ON_LEAVE',
        accessProvisioningStatus: 'PROVISIONED'
      },
      {
        employeeId: 'EMP10008',
        firstName: 'Kavita',
        lastName: 'Nair',
        displayName: 'Kavita Nair',
        gender: 'FEMALE',
        email: 'kavita.nair@hospital.com',
        phone: '9820888888',
        employeeType: 'MAINTENANCE',
        employmentType: 'FULL_TIME',
        designation: 'Facilities Engineer',
        joiningDate: new Date('2024-04-10'),
        departmentAssignments: [
          {
            departmentId: 'DEP-MAINT',
            departmentName: 'Facilities & Maintenance',
            isPrimary: true,
            startDate: new Date('2024-04-10'),
            status: 'ACTIVE'
          }
        ],
        roleAssignments: [
          {
            roleCode: 'MAINTENANCE',
            roleName: 'Maintenance Staff',
            startDate: new Date('2024-04-10'),
            status: 'ACTIVE'
          }
        ],
        status: 'ACTIVE',
        accessProvisioningStatus: 'PROVISIONED'
      },
      {
        employeeId: 'EMP10009',
        firstName: 'Sunita',
        lastName: 'Joshi',
        displayName: 'Sunita Joshi',
        gender: 'FEMALE',
        email: 'sunita.joshi@hospital.com',
        phone: '9820999999',
        employeeType: 'HR',
        employmentType: 'INTERN',
        designation: 'HR Coordinator Intern',
        joiningDate: new Date(),
        departmentAssignments: [
          {
            departmentId: 'DEP-HR',
            departmentName: 'Human Resources',
            isPrimary: true,
            startDate: new Date(),
            status: 'ACTIVE'
          }
        ],
        roleAssignments: [
          {
            roleCode: 'HR_MANAGER',
            roleName: 'HR Officer',
            startDate: new Date(),
            status: 'ACTIVE'
          }
        ],
        status: 'DRAFT',
        accessProvisioningStatus: 'NOT_REQUESTED'
      },
      {
        employeeId: 'EMP10010',
        firstName: 'Suresh',
        lastName: 'Sharma',
        displayName: 'Suresh Sharma',
        gender: 'MALE',
        email: 'suresh.sharma@hospital.com',
        phone: '9820101010',
        employeeType: 'BILLING',
        employmentType: 'FULL_TIME',
        designation: 'Former Billing Associate',
        joiningDate: new Date('2022-01-10'),
        leavingDate: new Date('2024-09-30'),
        departmentAssignments: [
          {
            departmentId: 'DEP-BILLING',
            departmentName: 'Billing & Cashier',
            isPrimary: true,
            startDate: new Date('2022-01-10'),
            endDate: new Date('2024-09-30'),
            status: 'ENDED'
          }
        ],
        roleAssignments: [
          {
            roleCode: 'BILLING_STAFF',
            roleName: 'Billing Staff',
            startDate: new Date('2022-01-10'),
            endDate: new Date('2024-09-30'),
            status: 'REVOKED'
          }
        ],
        status: 'TERMINATED',
        accessProvisioningStatus: 'REVOKED',
        terminationDetails: {
          terminatedAt: new Date('2024-09-30'),
          terminatedBy: 'USR-HR-200',
          reason: 'Voluntary Resignation'
        }
      }
    ];

    for (const staff of sampleStaff) {
      await Employee.findOneAndUpdate(
        { employeeId: staff.employeeId },
        { ...staff, updatedBy: 'SEED_SCRIPT', createdBy: 'SEED_SCRIPT' },
        { upsert: true, new: true }
      );
      console.log(`[SEED] Saved staff ${staff.employeeId}: ${staff.displayName} (${staff.status})`);
    }

    console.log('[SEED COMPLETE] Module 12 Staff seeded successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[SEED ERROR]:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedStaffData();
