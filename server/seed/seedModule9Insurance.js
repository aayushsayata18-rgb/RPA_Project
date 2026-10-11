const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const InsurancePolicy = require('../models/InsurancePolicy');
const InsuranceVerification = require('../models/InsuranceVerification');
const InsuranceVerificationAttempt = require('../models/InsuranceVerificationAttempt');
const InsuranceDocument = require('../models/InsuranceDocument');
const ExceptionCase = require('../models/ExceptionCase');
const Patient = require('../models/Patient');

const seedInsurance = async () => {
  try {
    const isStandalone = mongoose.connection.readyState === 0;
    if (isStandalone) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
      console.log('[Seed Module 9] Connected to MongoDB');
    }

    console.log('[Seed Module 9] Seeding insurance master & verification scenarios...');

    // 1. Primary Policy for Rahul Shah (P10045) per 09_INSURANCE_VERIFICATION.md Section 67 & 68
    const rahul = await Patient.findOne({ patientId: 'P10045' });
    const rahulRef = rahul ? rahul._id : null;

    const primaryPolicy = await InsurancePolicy.findOneAndUpdate(
      { policyNumber: 'POL-ABC-45892' },
      {
        policyId: 'POL-ABC-45892',
        patientId: 'P10045',
        patientRef: rahulRef,
        patientName: 'Rahul Shah',
        policyNumber: 'POL-ABC-45892',
        memberId: 'MEM-78291',
        groupNumber: 'GRP-TECH-101',
        providerName: 'Example Health Insurance',
        providerCode: 'EXAMPLE_HEALTH',
        planName: 'Gold Health Plan',
        planType: 'COMPREHENSIVE',
        policyHolderName: 'Rahul Shah',
        relationshipToPatient: 'SELF',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
        isPrimary: true,
        priority: 1,
        networkStatus: 'IN_NETWORK',
        coverageType: 'COMPREHENSIVE_GOLD',
        coverageLimit: 500000,
        coverageUsed: 75000,
        coverageRemaining: 425000,
        deductibleAmount: 5000,
        deductibleUsed: 2000,
        deductibleRemaining: 3000,
        copayAmount: 500,
        coPayPercentage: 10,
        authorizationRequired: 'REQUIRED',
        lastVerifiedAt: new Date('2026-10-06T10:30:00Z'),
        lastVerificationStatus: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        lastVerificationId: 'IV-2026-000123',
        source: 'API'
      },
      { upsert: true, new: true }
    );

    // Verification IV-2026-000123
    await InsuranceVerification.findOneAndUpdate(
      { verificationId: 'IV-2026-000123' },
      {
        verificationId: 'IV-2026-000123',
        patientId: 'P10045',
        patientRef: rahulRef,
        patientName: 'Rahul Shah',
        policyId: 'POL-ABC-45892',
        policyRef: primaryPolicy._id,
        requestedBy: 'REC_FRONTDESK_01',
        verificationSource: 'API',
        integrationType: 'OFFICIAL_API',
        status: 'VERIFIED',
        requestedAt: new Date('2026-10-06T10:28:00Z'),
        startedAt: new Date('2026-10-06T10:28:30Z'),
        completedAt: new Date('2026-10-06T10:30:00Z'),
        insurerName: 'Example Health Insurance',
        providerCode: 'EXAMPLE_HEALTH',
        policyNumber: 'POL-ABC-45892',
        memberId: 'MEM-78291',
        eligibilityStatus: 'ELIGIBLE',
        policyStatus: 'ACTIVE',
        effectiveDate: new Date('2026-01-01'),
        expiryDate: new Date('2026-12-31'),
        networkStatus: 'IN_NETWORK',
        coverageType: 'COMPREHENSIVE_GOLD',
        coverageLimit: 500000,
        coverageUsed: 75000,
        coverageRemaining: 425000,
        deductibleAmount: 5000,
        deductibleUsed: 2000,
        deductibleRemaining: 3000,
        copayAmount: 500,
        authorizationRequired: 'REQUIRED',
        verificationReference: 'INS-VER-778821',
        correlationId: 'CORR-20261006-000123',
        insurerResponseSummary: {
          verificationStatus: 'CONFIRMED',
          tier: 'PREFERRED_PROVIDER'
        }
      },
      { upsert: true, new: true }
    );

    // 2. Secondary Policy for Rahul Shah
    await InsurancePolicy.findOneAndUpdate(
      { policyNumber: 'POL-XYZ-88192' },
      {
        policyId: 'POL-XYZ-88192',
        patientId: 'P10045',
        patientRef: rahulRef,
        patientName: 'Rahul Shah',
        policyNumber: 'POL-XYZ-88192',
        memberId: 'MEM-XYZ-01',
        providerName: 'MediShield Health Care',
        providerCode: 'MEDI_SHIELD',
        planName: 'MediShield Supplementary',
        status: 'ACTIVE',
        isPrimary: false,
        priority: 2,
        networkStatus: 'IN_NETWORK',
        coverageLimit: 200000,
        coverageRemaining: 180000,
        lastVerifiedAt: new Date('2026-10-06T11:00:00Z'),
        lastVerificationStatus: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        lastVerificationId: 'IV-2026-000124',
        source: 'API'
      },
      { upsert: true, new: true }
    );

    // 3. Expired Policy scenario
    await InsurancePolicy.findOneAndUpdate(
      { policyNumber: 'POL-EXPIRED-9901' },
      {
        policyId: 'POL-EXPIRED-9901',
        patientId: 'P10002',
        patientName: 'Anita Sharma',
        policyNumber: 'POL-EXPIRED-9901',
        memberId: 'MEM-EXP-02',
        providerName: 'Star Health Insurance',
        providerCode: 'STAR_HEALTH',
        planName: 'Classic Family Floater',
        status: 'EXPIRED',
        isPrimary: true,
        networkStatus: 'OUT_OF_NETWORK',
        lastVerifiedAt: new Date('2026-10-07T09:00:00Z'),
        lastVerificationStatus: 'EXPIRED',
        verificationStatus: 'EXPIRED',
        lastVerificationId: 'IV-2026-000125',
        source: 'API'
      },
      { upsert: true, new: true }
    );

    await InsuranceVerification.findOneAndUpdate(
      { verificationId: 'IV-2026-000125' },
      {
        verificationId: 'IV-2026-000125',
        patientId: 'P10002',
        patientName: 'Anita Sharma',
        policyId: 'POL-EXPIRED-9901',
        requestedBy: 'REC_FRONTDESK_01',
        verificationSource: 'API',
        integrationType: 'OFFICIAL_API',
        status: 'EXPIRED',
        insurerName: 'Star Health Insurance',
        policyNumber: 'POL-EXPIRED-9901',
        memberId: 'MEM-EXP-02',
        eligibilityStatus: 'NOT_ELIGIBLE',
        policyStatus: 'EXPIRED',
        networkStatus: 'OUT_OF_NETWORK',
        completedAt: new Date('2026-10-07T09:05:00Z')
      },
      { upsert: true, new: true }
    );

    // 4. Ambiguous Policy Match Scenario (Section 29)
    await InsurancePolicy.findOneAndUpdate(
      { policyNumber: 'POL-AMBIGUOUS-5501' },
      {
        policyId: 'POL-AMBIGUOUS-5501',
        patientId: 'P10003',
        patientName: 'Suresh Patel',
        policyNumber: 'POL-AMBIGUOUS-5501',
        memberId: 'MEM-AMB-03',
        providerName: 'Star Health Insurance',
        providerCode: 'STAR_HEALTH',
        status: 'DRAFT',
        isPrimary: true,
        lastVerificationStatus: 'AMBIGUOUS',
        verificationStatus: 'AMBIGUOUS',
        lastVerificationId: 'IV-2026-000127',
        source: 'API'
      },
      { upsert: true, new: true }
    );

    const ambVerification = await InsuranceVerification.findOneAndUpdate(
      { verificationId: 'IV-2026-000127' },
      {
        verificationId: 'IV-2026-000127',
        patientId: 'P10003',
        patientName: 'Suresh Patel',
        policyId: 'POL-AMBIGUOUS-5501',
        requestedBy: 'REC_FRONTDESK_01',
        verificationSource: 'API',
        status: 'AMBIGUOUS',
        insurerName: 'Star Health Insurance',
        policyNumber: 'POL-AMBIGUOUS-5501',
        memberId: 'MEM-AMB-03',
        eligibilityStatus: 'UNKNOWN',
        policyStatus: 'UNKNOWN',
        networkStatus: 'UNKNOWN',
        errorMessage: 'Multiple matching member records returned by insurer registry',
        completedAt: new Date('2026-10-08T14:10:00Z')
      },
      { upsert: true, new: true }
    );

    // Connected Exception Case
    await ExceptionCase.findOneAndUpdate(
      { entityId: 'IV-2026-000127' },
      {
        exceptionId: 'EXC-AMB-20261008-01',
        module: 'INSURANCE_VERIFICATION',
        entityType: 'InsuranceVerification',
        entityId: 'IV-2026-000127',
        exceptionType: 'AMBIGUOUS_RESPONSE',
        description: 'Multiple member matches returned by insurer. Manual staff review required.',
        severity: 'HIGH',
        source: 'API',
        currentStatus: 'OPEN',
        assignedRole: 'INSURANCE_REPRESENTATIVE',
        metadata: {
          verificationId: 'IV-2026-000127',
          policyId: 'POL-AMBIGUOUS-5501',
          patientId: 'P10003'
        }
      },
      { upsert: true, new: true }
    );

    // 5. Partially Verified Scenario
    await InsurancePolicy.findOneAndUpdate(
      { policyNumber: 'POL-PARTIAL-4401' },
      {
        policyId: 'POL-PARTIAL-4401',
        patientId: 'P10004',
        patientName: 'Priya Mehta',
        policyNumber: 'POL-PARTIAL-4401',
        memberId: 'MEM-PART-04',
        providerName: 'Example Health Insurance',
        providerCode: 'EXAMPLE_HEALTH',
        status: 'ACTIVE',
        isPrimary: true,
        networkStatus: 'IN_NETWORK',
        lastVerificationStatus: 'PARTIALLY_VERIFIED',
        verificationStatus: 'PARTIALLY_VERIFIED',
        lastVerificationId: 'IV-2026-000129',
        source: 'INSURER_PORTAL'
      },
      { upsert: true, new: true }
    );

    await InsuranceVerification.findOneAndUpdate(
      { verificationId: 'IV-2026-000129' },
      {
        verificationId: 'IV-2026-000129',
        patientId: 'P10004',
        patientName: 'Priya Mehta',
        policyId: 'POL-PARTIAL-4401',
        requestedBy: 'REC_FRONTDESK_01',
        verificationSource: 'INSURER_PORTAL',
        integrationType: 'BROWSER_AUTOMATION',
        status: 'PARTIALLY_VERIFIED',
        insurerName: 'Example Health Insurance',
        policyNumber: 'POL-PARTIAL-4401',
        memberId: 'MEM-PART-04',
        eligibilityStatus: 'ELIGIBLE',
        policyStatus: 'ACTIVE',
        networkStatus: 'IN_NETWORK',
        coverageLimit: null,
        authorizationRequired: 'UNKNOWN',
        completedAt: new Date('2026-10-09T10:00:00Z')
      },
      { upsert: true, new: true }
    );

    // 6. Evidence Document
    await InsuranceDocument.findOneAndUpdate(
      { documentId: 'DOC-INS-778821' },
      {
        documentId: 'DOC-INS-778821',
        patientId: 'P10045',
        policyId: 'POL-ABC-45892',
        verificationId: 'IV-2026-000123',
        documentType: 'INSURANCE_CARD',
        fileName: 'rahul_shah_insurance_card.pdf',
        storageKey: 'insurance/P10045/card_rahul_shah.pdf',
        fileUrl: '/uploads/insurance/rahul_shah_card.pdf',
        mimeType: 'application/pdf',
        fileSize: 245000,
        uploadedBy: 'P10045',
        source: 'PATIENT_UPLOAD'
      },
      { upsert: true, new: true }
    );

    console.log('[Seed Module 9] Seed completed successfully!');
    if (isStandalone) {
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed Module 9 Error]:', err);
    if (mongoose.connection.readyState !== 0) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedInsurance();
}

module.exports = seedInsurance;
