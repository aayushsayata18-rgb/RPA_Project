require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const DoctorAvailability = require('../models/DoctorAvailability');
const Department = require('../models/Department');
const DoctorExternalSync = require('../models/DoctorExternalSync');

const seedModule11Doctors = async () => {
  try {
    console.log('[Seed Module 11] Seeding Doctor Management Master Data...');

    // Drop legacy unique index on doctorId if present from older Module 2
    try {
      await DoctorSchedule.collection.dropIndex('doctorId_1');
      console.log('  -> Dropped obsolete unique index doctorId_1 from doctorschedules');
    } catch (e) {
      // index might not exist or already dropped
    }

    // 1. Seed Demo Doctors (Section 75)
    const demoDoctors = [
      {
        doctorId: 'DOC10001',
        title: 'Dr.',
        firstName: 'Amit',
        middleName: 'K',
        lastName: 'Patel',
        displayName: 'Dr. Amit Patel',
        fullName: 'Dr. Amit Patel',
        gender: 'MALE',
        dateOfBirth: new Date('1980-04-12'),
        phone: '9876543210',
        contactNumber: '9876543210',
        email: 'amit.patel@hospital.com',
        departmentId: 'DEP-CARD',
        departmentName: 'Department of Cardiology',
        specialty: 'Cardiology',
        qualifications: [
          { qualification: 'MBBS', institution: 'XYZ Medical College', year: 2004, verificationStatus: 'VERIFIED' },
          { qualification: 'MD (Cardiology)', institution: 'ABC University', year: 2008, verificationStatus: 'VERIFIED' }
        ],
        specializations: [
          { name: 'Cardiology', primary: true },
          { name: 'Internal Medicine', primary: false }
        ],
        registrationDetails: [
          {
            registrationNumber: 'REG-123456',
            registrationAuthority: 'National Medical Commission',
            issueDate: new Date('2008-06-15'),
            expiryDate: new Date('2028-06-15'),
            status: 'VALID'
          }
        ],
        departments: [
          {
            departmentId: 'DEP-CARD',
            departmentName: 'Department of Cardiology',
            isPrimary: true,
            startDate: new Date('2015-01-10'),
            status: 'ACTIVE'
          }
        ],
        consultationSettings: {
          consultationDurationMinutes: 30,
          consultationFee: 800,
          currency: 'INR'
        },
        consultationFee: 800,
        slotDurationMinutes: 30,
        roomNumber: 'OPD-201',
        experienceYears: 18,
        status: 'ACTIVE',
        availabilityStatus: 'AVAILABLE',
        employmentType: 'FULL_TIME'
      },
      {
        doctorId: 'DOC10002',
        title: 'Dr.',
        firstName: 'Pooja',
        middleName: 'M',
        lastName: 'Iyer',
        displayName: 'Dr. Pooja Iyer',
        fullName: 'Dr. Pooja Iyer',
        gender: 'FEMALE',
        dateOfBirth: new Date('1985-09-20'),
        phone: '9876543211',
        contactNumber: '9876543211',
        email: 'pooja.iyer@hospital.com',
        departmentId: 'DEP-GMED',
        departmentName: 'Department of General Medicine',
        specialty: 'General Medicine',
        qualifications: [
          { qualification: 'MBBS', institution: 'Grant Medical College', year: 2009, verificationStatus: 'VERIFIED' },
          { qualification: 'MD (Internal Medicine)', institution: 'AIIMS Delhi', year: 2013, verificationStatus: 'VERIFIED' }
        ],
        specializations: [
          { name: 'General Medicine', primary: true }
        ],
        registrationDetails: [
          {
            registrationNumber: 'REG-223344',
            registrationAuthority: 'Maharashtra Medical Council',
            issueDate: new Date('2013-08-01'),
            // Expiring soon (15 days ahead) for Section 45 & 78 testing
            expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            status: 'EXPIRING_SOON'
          }
        ],
        departments: [
          {
            departmentId: 'DEP-GMED',
            departmentName: 'Department of General Medicine',
            isPrimary: true,
            startDate: new Date('2018-03-01'),
            status: 'ACTIVE'
          }
        ],
        consultationSettings: {
          consultationDurationMinutes: 30,
          consultationFee: 600,
          currency: 'INR'
        },
        consultationFee: 600,
        slotDurationMinutes: 30,
        roomNumber: 'OPD-102',
        experienceYears: 13,
        status: 'ACTIVE',
        availabilityStatus: 'AVAILABLE',
        employmentType: 'FULL_TIME'
      },
      {
        doctorId: 'DOC10003',
        title: 'Dr.',
        firstName: 'Suresh',
        middleName: 'B',
        lastName: 'Rao',
        displayName: 'Dr. Suresh Rao',
        fullName: 'Dr. Suresh Rao',
        gender: 'MALE',
        dateOfBirth: new Date('1982-12-05'),
        phone: '9876543215',
        contactNumber: '9876543215',
        email: 'suresh.rao@hospital.com',
        departmentId: 'DEP-ORTH',
        departmentName: 'Department of Orthopedics',
        specialty: 'Orthopedics',
        qualifications: [
          { qualification: 'MBBS', institution: 'Bangalore Medical College', year: 2006, verificationStatus: 'VERIFIED' },
          { qualification: 'MS (Orthopedics)', institution: 'KMC Manipal', year: 2010, verificationStatus: 'VERIFIED' }
        ],
        specializations: [
          { name: 'Orthopedics', primary: true }
        ],
        registrationDetails: [
          {
            registrationNumber: 'REG-778899',
            registrationAuthority: 'Karnataka Medical Council',
            issueDate: new Date('2010-09-10'),
            expiryDate: new Date('2030-09-10'),
            status: 'VALID'
          }
        ],
        departments: [
          {
            departmentId: 'DEP-ORTH',
            departmentName: 'Department of Orthopedics',
            isPrimary: true,
            startDate: new Date('2019-06-15'),
            status: 'ACTIVE'
          }
        ],
        consultationSettings: {
          consultationDurationMinutes: 30,
          consultationFee: 750,
          currency: 'INR'
        },
        consultationFee: 750,
        slotDurationMinutes: 30,
        roomNumber: 'OPD-304',
        experienceYears: 14,
        status: 'ON_LEAVE',
        availabilityStatus: 'ON_LEAVE',
        employmentType: 'FULL_TIME'
      },
      {
        doctorId: 'DOC10004',
        title: 'Dr.',
        firstName: 'Ananya',
        middleName: '',
        lastName: 'Sen',
        displayName: 'Dr. Ananya Sen',
        fullName: 'Dr. Ananya Sen',
        gender: 'FEMALE',
        dateOfBirth: new Date('1991-03-18'),
        phone: '9876543218',
        contactNumber: '9876543218',
        email: 'ananya.sen@hospital.com',
        departmentId: 'DEP-DERM',
        departmentName: 'Department of Dermatology',
        specialty: 'Dermatology',
        qualifications: [
          { qualification: 'MBBS', institution: 'Calcutta Medical College', year: 2016, verificationStatus: 'PENDING_VERIFICATION' },
          { qualification: 'MD (Dermatology)', institution: 'IPGMER Kolkata', year: 2020, verificationStatus: 'PENDING_VERIFICATION' }
        ],
        specializations: [
          { name: 'Dermatology', primary: true }
        ],
        registrationDetails: [
          {
            registrationNumber: 'REG-990011',
            registrationAuthority: 'West Bengal Medical Council',
            issueDate: new Date('2020-11-20'),
            expiryDate: new Date('2030-11-20'),
            status: 'PENDING_VERIFICATION'
          }
        ],
        departments: [
          {
            departmentId: 'DEP-DERM',
            departmentName: 'Department of Dermatology',
            isPrimary: true,
            startDate: new Date(),
            status: 'ACTIVE'
          }
        ],
        consultationSettings: {
          consultationDurationMinutes: 30,
          consultationFee: 500,
          currency: 'INR'
        },
        consultationFee: 500,
        slotDurationMinutes: 30,
        roomNumber: 'OPD-103',
        experienceYears: 6,
        status: 'PENDING_APPROVAL',
        availabilityStatus: 'UNAVAILABLE',
        employmentType: 'FULL_TIME'
      },
      {
        doctorId: 'DOC10005',
        title: 'Dr.',
        firstName: 'Karan',
        middleName: 'V',
        lastName: 'Malhotra',
        displayName: 'Dr. Karan Malhotra',
        fullName: 'Dr. Karan Malhotra',
        gender: 'MALE',
        dateOfBirth: new Date('1975-07-25'),
        phone: '9876543219',
        contactNumber: '9876543219',
        email: 'karan.malhotra@hospital.com',
        departmentId: 'DEP-CARD',
        departmentName: 'Department of Cardiology',
        specialty: 'Cardiology',
        qualifications: [
          { qualification: 'MBBS', institution: 'AFMC Pune', year: 1999, verificationStatus: 'VERIFIED' }
        ],
        specializations: [
          { name: 'Cardiology', primary: true }
        ],
        registrationDetails: [
          {
            registrationNumber: 'REG-445566',
            registrationAuthority: 'Delhi Medical Council',
            issueDate: new Date('2000-01-01'),
            expiryDate: new Date('2020-01-01'), // Expired
            status: 'EXPIRED'
          }
        ],
        departments: [
          {
            departmentId: 'DEP-CARD',
            departmentName: 'Department of Cardiology',
            isPrimary: true,
            startDate: new Date('2010-01-01'),
            endDate: new Date('2025-12-31'),
            status: 'ENDED'
          }
        ],
        consultationSettings: {
          consultationDurationMinutes: 30,
          consultationFee: 1000,
          currency: 'INR'
        },
        consultationFee: 1000,
        slotDurationMinutes: 30,
        roomNumber: 'OPD-202',
        experienceYears: 24,
        status: 'INACTIVE',
        availabilityStatus: 'UNAVAILABLE',
        employmentType: 'CONSULTANT'
      }
    ];

    for (const doc of demoDoctors) {
      await Doctor.findOneAndUpdate({ doctorId: doc.doctorId }, doc, { upsert: true, new: true });
      console.log(`  -> Seeded Doctor Master: ${doc.doctorId} - ${doc.displayName} (${doc.status})`);
    }

    // 2. Seed Doctor Recurring Schedules (Section 75)
    // Monday 09:00 - 13:00, Wednesday 09:00 - 13:00, Friday 14:00 - 18:00 for DOC10001
    const demoSchedules = [
      {
        scheduleId: 'SCH-DOC10001-MON',
        doctorId: 'DOC10001',
        departmentId: 'DEP-CARD',
        departmentName: 'Department of Cardiology',
        dayOfWeek: 1, // Monday
        dayOfWeekName: 'MONDAY',
        startTime: '09:00',
        endTime: '13:00',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 1,
        roomNumber: 'OPD-201',
        effectiveFrom: new Date('2026-01-01'),
        status: 'ACTIVE'
      },
      {
        scheduleId: 'SCH-DOC10001-WED',
        doctorId: 'DOC10001',
        departmentId: 'DEP-CARD',
        departmentName: 'Department of Cardiology',
        dayOfWeek: 3, // Wednesday
        dayOfWeekName: 'WEDNESDAY',
        startTime: '09:00',
        endTime: '13:00',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 1,
        roomNumber: 'OPD-201',
        effectiveFrom: new Date('2026-01-01'),
        status: 'ACTIVE'
      },
      {
        scheduleId: 'SCH-DOC10001-FRI',
        doctorId: 'DOC10001',
        departmentId: 'DEP-CARD',
        departmentName: 'Department of Cardiology',
        dayOfWeek: 5, // Friday
        dayOfWeekName: 'FRIDAY',
        startTime: '14:00',
        endTime: '18:00',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 1,
        roomNumber: 'OPD-201',
        effectiveFrom: new Date('2026-01-01'),
        status: 'ACTIVE'
      },
      // Tuesday & Thursday 09:00 - 12:00 for DOC10002
      {
        scheduleId: 'SCH-DOC10002-TUE',
        doctorId: 'DOC10002',
        departmentId: 'DEP-GMED',
        departmentName: 'Department of General Medicine',
        dayOfWeek: 2, // Tuesday
        dayOfWeekName: 'TUESDAY',
        startTime: '09:00',
        endTime: '12:00',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 1,
        roomNumber: 'OPD-102',
        effectiveFrom: new Date('2026-01-01'),
        status: 'ACTIVE'
      },
      {
        scheduleId: 'SCH-DOC10002-THU',
        doctorId: 'DOC10002',
        departmentId: 'DEP-GMED',
        departmentName: 'Department of General Medicine',
        dayOfWeek: 4, // Thursday
        dayOfWeekName: 'THURSDAY',
        startTime: '09:00',
        endTime: '12:00',
        slotDurationMinutes: 30,
        maxCapacityPerSlot: 1,
        roomNumber: 'OPD-102',
        effectiveFrom: new Date('2026-01-01'),
        status: 'ACTIVE'
      }
    ];

    for (const sch of demoSchedules) {
      await DoctorSchedule.findOneAndUpdate({ scheduleId: sch.scheduleId }, sch, { upsert: true, new: true });
      console.log(`  -> Seeded Schedule: ${sch.scheduleId} for ${sch.doctorId} (${sch.dayOfWeekName} ${sch.startTime}-${sch.endTime})`);
    }

    // 3. Seed Availability Exception & Leave (Section 76)
    const demoAvailability = [
      {
        availabilityId: 'AVL-DOC10001-LEAVE-01',
        doctorId: 'DOC10001',
        date: new Date('2026-10-15'),
        dateStr: '2026-10-15',
        startTime: '09:00',
        endTime: '13:00',
        status: 'LEAVE',
        reason: 'Approved Annual Leave',
        source: 'LEAVE_MANAGEMENT'
      },
      {
        availabilityId: 'AVL-DOC10002-UNAVL-01',
        doctorId: 'DOC10002',
        date: new Date('2026-10-16'),
        dateStr: '2026-10-16',
        startTime: '10:00',
        endTime: '12:00',
        status: 'UNAVAILABLE',
        reason: 'Administrative Department Review Session',
        source: 'MANUAL'
      }
    ];

    for (const avl of demoAvailability) {
      await DoctorAvailability.findOneAndUpdate({ availabilityId: avl.availabilityId }, avl, { upsert: true, new: true });
      console.log(`  -> Seeded Availability Exception: ${avl.availabilityId} for ${avl.doctorId} (${avl.dateStr}: ${avl.status})`);
    }

    // 4. Seed RPA Doctor External Sync Status (Section 72)
    const demoSync = [
      {
        syncId: 'SYNC-DOC-10001-01',
        doctorId: 'DOC10001',
        externalSystem: 'LEGACY_HIS',
        externalDoctorId: 'DOC10001',
        syncType: 'PROFILE_SYNC',
        status: 'SYNCED',
        lastSyncedAt: new Date(),
        verifiedByReadBack: true,
        correlationId: 'CORR-DOC-20261011-001'
      }
    ];

    for (const syn of demoSync) {
      await DoctorExternalSync.findOneAndUpdate({ syncId: syn.syncId }, syn, { upsert: true, new: true });
      console.log(`  -> Seeded RPA External Sync: ${syn.syncId} (${syn.status})`);
    }

    console.log('[Seed Module 11] Doctor Management Seed Completed Successfully.\n');
  } catch (error) {
    console.error('[Seed Module 11] Error seeding doctors:', error);
    throw error;
  }
};

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db')
    .then(async () => {
      await seedModule11Doctors();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedModule11Doctors;
