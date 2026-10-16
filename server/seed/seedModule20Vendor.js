const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const VendorContact = require('../models/VendorContact');
const VendorAddress = require('../models/VendorAddress');
const VendorDocument = require('../models/VendorDocument');
const VendorVerification = require('../models/VendorVerification');
const VendorContract = require('../models/VendorContract');
const VendorPerformanceReview = require('../models/VendorPerformanceReview');
const VendorIssue = require('../models/VendorIssue');
const VendorCommunication = require('../models/VendorCommunication');
const VendorPaymentProfile = require('../models/VendorPaymentProfile');
const User = require('../models/User');

const seedModule20Vendor = async () => {
  console.log('[Seed Module 20]: Initiating Vendor Management Seeding...');

  await Promise.all([
    Vendor.deleteMany({}),
    VendorContact.deleteMany({}),
    VendorAddress.deleteMany({}),
    VendorDocument.deleteMany({}),
    VendorVerification.deleteMany({}),
    VendorContract.deleteMany({}),
    VendorPerformanceReview.deleteMany({}),
    VendorIssue.deleteMany({}),
    VendorCommunication.deleteMany({}),
    VendorPaymentProfile.deleteMany({}),
    User.deleteMany({ role: 'VENDOR' })
  ]);

  const now = new Date();
  const dateInDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  // 1. Authoritative Vendors Master (including Procurement VND-1001 to VND-1005 + new candidates)
  const vendorsData = [
    {
      vendorId: 'VND-1001',
      legalName: 'Apex Pharma Supplies Private Limited',
      displayName: 'Apex Pharma Supplies',
      vendorType: 'PHARMACEUTICAL_VENDOR',
      vendorCategory: ['MEDICINES', 'MEDICAL_CONSUMABLES'],
      registrationNumber: 'CIN-U24230MH2012PTC234123',
      taxIdentificationNumber: 'GSTIN27AAACA1234A1Z5',
      businessRegistrationNumber: 'BRN-MH-459821',
      website: 'https://apexpharma.in',
      email: 'sales@apexpharma.in',
      phone: '+91-9876543210',
      alternatePhone: '+91-22-28765432',
      address: 'Plot 45, Pharma Industrial Estate, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400069',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      verificationStatus: 'PASSED',
      preferredVendor: true,
      servicesOffered: ['Emergency antibiotic supply', 'Cold-chain vaccine transport', 'Bulk IV fluids'],
      approvalDecision: {
        decision: 'APPROVE',
        decisionReason: 'All statutory licenses, drug controller clearances, and quality audits verified.',
        approvedBy: 'Dr. Ramesh Sharma (Procurement Director)',
        approvedAt: dateInDays(-60)
      }
    },
    {
      vendorId: 'VND-1002',
      legalName: 'MediCore Surgicals Limited',
      displayName: 'MediCore Surgicals',
      vendorType: 'MEDICAL_DEVICE_VENDOR',
      vendorCategory: ['SURGICAL', 'EQUIPMENT'],
      registrationNumber: 'CIN-L33110DL2015PLC287410',
      taxIdentificationNumber: 'GSTIN07AABCM5678B1Z2',
      businessRegistrationNumber: 'BRN-DL-109234',
      website: 'https://medicoresurg.com',
      email: 'orders@medicoresurg.com',
      phone: '+91-9876543211',
      alternatePhone: '+91-11-26781234',
      address: 'B-12 Okhla Industrial Area Phase II',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      postalCode: '110020',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      verificationStatus: 'PASSED',
      preferredVendor: true,
      servicesOffered: ['Surgical implants', 'Laparoscopy instruments', 'Sterile drapes'],
      approvalDecision: {
        decision: 'APPROVE',
        decisionReason: 'CE and ISO 13485 certifications verified.',
        approvedBy: 'Dr. Ramesh Sharma',
        approvedAt: dateInDays(-45)
      }
    },
    {
      vendorId: 'VND-1003',
      legalName: 'BioLab Diagnostics India Pvt Ltd',
      displayName: 'BioLab Diagnostics India',
      vendorType: 'LAB_SUPPLIER',
      vendorCategory: ['LABORATORY'],
      registrationNumber: 'CIN-U85195KA2018PTC112345',
      taxIdentificationNumber: 'GSTIN29AABCB9012C1Z8',
      businessRegistrationNumber: 'BRN-KA-887412',
      website: 'https://biolabindia.com',
      email: 'support@biolabindia.com',
      phone: '+91-9876543212',
      address: '22 Electronic City Phase 1, Hosur Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560100',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      verificationStatus: 'PASSED',
      preferredVendor: false,
      servicesOffered: ['Biochemistry reagents', 'Hematology controls', 'PCR kits']
    },
    {
      vendorId: 'VND-1004',
      legalName: 'RadTech Imaging Equipment Pvt Ltd',
      displayName: 'RadTech Imaging Equipment',
      vendorType: 'EQUIPMENT_VENDOR',
      vendorCategory: ['RADIOLOGY', 'EQUIPMENT', 'MAINTENANCE'],
      registrationNumber: 'CIN-U32109TN2016PTC099887',
      taxIdentificationNumber: 'GSTIN33AACCR3456D1Z4',
      businessRegistrationNumber: 'BRN-TN-334910',
      website: 'https://radtechimaging.com',
      email: 'info@radtechimaging.com',
      phone: '+91-9876543213',
      address: '88 Guindy Industrial Estate',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      postalCode: '600032',
      status: 'ACTIVE',
      riskLevel: 'MEDIUM',
      verificationStatus: 'PASSED',
      preferredVendor: false,
      servicesOffered: ['X-Ray collimator maintenance', 'CT tube supplies', 'PACS hardware']
    },
    {
      vendorId: 'VND-1005',
      legalName: 'CleanCare Hospital Logistics Ltd',
      displayName: 'CleanCare Hospital Logistics',
      vendorType: 'FACILITY_VENDOR',
      vendorCategory: ['HOUSEKEEPING', 'FACILITY', 'GENERAL'],
      registrationNumber: 'CIN-U74999TG2019PLC077881',
      taxIdentificationNumber: 'GSTIN36AAACC7890E1Z9',
      businessRegistrationNumber: 'BRN-TG-665544',
      website: 'https://cleancarelogistics.com',
      email: 'care@cleancarelogistics.com',
      phone: '+91-9876543214',
      address: '15 HITEC City Main Rd',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      postalCode: '500081',
      status: 'ON_HOLD',
      riskLevel: 'MEDIUM',
      verificationStatus: 'PARTIAL',
      holdReason: 'Biomedical waste handling authorization renewal document is pending.',
      holdStart: dateInDays(-5),
      expectedResolutionDate: dateInDays(15),
      placedBy: 'Vendor Manager Ananya Sen'
    },
    {
      vendorId: 'VEN-2026-00006',
      legalName: 'MediTech Global Systems Inc',
      displayName: 'MediTech Global',
      vendorType: 'IT_VENDOR',
      vendorCategory: ['IT', 'MAINTENANCE'],
      registrationNumber: 'CIN-U72200MH2020PTC339911',
      taxIdentificationNumber: 'GSTIN27AABCM1122F1Z3',
      email: 'contact@meditechglobal.io',
      phone: '+91-9876543215',
      address: 'Tower 4, Mindspace, Malad West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400064',
      status: 'PENDING_APPROVAL',
      riskLevel: 'LOW',
      verificationStatus: 'PASSED',
      notes: 'Passed ISO 27001 IT security verification. Ready for Hospital Management approval.'
    },
    {
      vendorId: 'VEN-2026-00007',
      legalName: 'SafeDose Pharmaceuticals Pvt Ltd',
      displayName: 'SafeDose Pharma',
      vendorType: 'PHARMACEUTICAL_VENDOR',
      vendorCategory: ['MEDICINES'],
      registrationNumber: 'CIN-U24239GJ2022PTC128899',
      taxIdentificationNumber: 'GSTIN24AACCS9988G1Z1',
      email: 'regulatory@safedosepharma.com',
      phone: '+91-9876543216',
      address: 'GIDC Industrial Area, Ankleshwar',
      city: 'Ankleshwar',
      state: 'Gujarat',
      country: 'India',
      postalCode: '393002',
      status: 'PENDING_VERIFICATION',
      riskLevel: 'HIGH',
      verificationStatus: 'IN_PROGRESS',
      notes: 'New registration received online. Document verification in progress.'
    },
    {
      vendorId: 'VEN-2026-00008',
      legalName: 'RapidDeliver Express Surgicals Ltd',
      displayName: 'RapidDeliver Surgicals',
      vendorType: 'SUPPLIER',
      vendorCategory: ['SURGICAL', 'MEDICAL_CONSUMABLES'],
      registrationNumber: 'CIN-L51909WB2017PLC219900',
      taxIdentificationNumber: 'GSTIN19AABCR4455H1Z6',
      email: 'ops@rapiddeliversurg.com',
      phone: '+91-9876543217',
      address: 'Salt Lake Sector V',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      postalCode: '700091',
      status: 'SUSPENDED',
      riskLevel: 'CRITICAL',
      verificationStatus: 'FAILED',
      suspensionReason: 'Two critical contaminated glove batches and failure to provide root cause analysis within SLA.',
      suspendedAt: dateInDays(-10),
      suspendedBy: 'Chief Procurement Officer Dr. Rajesh Patel'
    },
    {
      vendorId: 'VEN-2026-00009',
      legalName: 'OldCare Legacy Supplies LLP',
      displayName: 'OldCare Legacy',
      vendorType: 'SERVICE_PROVIDER',
      vendorCategory: ['GENERAL', 'FACILITY'],
      registrationNumber: 'LLPIN-AAA-1234',
      taxIdentificationNumber: 'GSTIN27AAAFO1234I1Z7',
      email: 'info@oldcarelegacy.com',
      phone: '+91-9876543218',
      address: 'Fort Commercial Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
      status: 'DEACTIVATED',
      riskLevel: 'LOW',
      verificationStatus: 'PASSED',
      deactivationReason: 'Vendor ceased operations and business mutually terminated without outstanding dues.',
      deactivatedAt: dateInDays(-180),
      deactivatedBy: 'System Administrator'
    }
  ];

  await Vendor.insertMany(vendorsData);
  console.log(`[Seed Module 20]: Inserted ${vendorsData.length} Authoritative Vendors.`);

  // 2. Vendor Contacts
  const contactsData = [
    {
      vendorContactId: 'VCNT-10001',
      vendorId: 'VND-1001',
      name: 'Rohan Deshmukh',
      designation: 'Head of Hospital Sales',
      department: 'Institutional Sales',
      email: 'rohan.d@apexpharma.in',
      phone: '+91-9876543210',
      contactType: 'SALES',
      isPrimary: true,
      status: 'ACTIVE'
    },
    {
      vendorContactId: 'VCNT-10002',
      vendorId: 'VND-1001',
      name: 'Sneha Kulkarni',
      designation: 'Finance & Billing Manager',
      department: 'Accounts',
      email: 'accounts@apexpharma.in',
      phone: '+91-9876543220',
      contactType: 'ACCOUNTS',
      isPrimary: false,
      status: 'ACTIVE'
    },
    {
      vendorContactId: 'VCNT-10003',
      vendorId: 'VND-1002',
      name: 'Amitabh Verma',
      designation: 'Director of Healthcare Partnerships',
      department: 'Executive',
      email: 'a.verma@medicoresurg.com',
      phone: '+91-9876543211',
      contactType: 'PRIMARY',
      isPrimary: true,
      status: 'ACTIVE'
    },
    {
      vendorContactId: 'VCNT-10004',
      vendorId: 'VND-1003',
      name: 'Dr. Priya Nair',
      designation: 'Technical Support Lead',
      department: 'Diagnostics',
      email: 'priya.nair@biolabindia.com',
      phone: '+91-9876543212',
      contactType: 'TECHNICAL',
      isPrimary: true,
      status: 'ACTIVE'
    }
  ];
  await VendorContact.insertMany(contactsData);

  // Update primary contacts on vendors
  await Vendor.updateOne({ vendorId: 'VND-1001' }, { primaryContactId: 'VCNT-10001' });
  await Vendor.updateOne({ vendorId: 'VND-1002' }, { primaryContactId: 'VCNT-10003' });
  await Vendor.updateOne({ vendorId: 'VND-1003' }, { primaryContactId: 'VCNT-10004' });

  // 3. Vendor Addresses
  const addressesData = [
    {
      addressId: 'VADR-10001',
      vendorId: 'VND-1001',
      addressType: 'REGISTERED',
      line1: 'Plot 45, Pharma Industrial Estate, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400069',
      isPrimary: true,
      status: 'ACTIVE'
    },
    {
      addressId: 'VADR-10002',
      vendorId: 'VND-1001',
      addressType: 'WAREHOUSE',
      line1: 'Bhiwandi Logistics Hub, Shed 12',
      city: 'Thane',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '421302',
      isPrimary: false,
      status: 'ACTIVE'
    },
    {
      addressId: 'VADR-10003',
      vendorId: 'VND-1002',
      addressType: 'REGISTERED',
      line1: 'B-12 Okhla Industrial Area Phase II',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      postalCode: '110020',
      isPrimary: true,
      status: 'ACTIVE'
    }
  ];
  await VendorAddress.insertMany(addressesData);

  // 4. Vendor Documents (including Demo Scenario: Section 110 expiring in 20 days!)
  const documentsData = [
    {
      vendorDocumentId: 'VDOC-2026-00001',
      vendorId: 'VND-1001',
      documentType: 'Drug Manufacturing License',
      documentNumber: 'LIC-MH-FDA-2021-9988',
      title: 'State FDA Drug Manufacturing License Form 25/28',
      issueDate: dateInDays(-365),
      expiryDate: dateInDays(20), // Exactly 20 days -> triggers Section 110 Expiring Soon Alert!
      issuer: 'Food & Drug Administration Maharashtra',
      fileReference: 'https://docs.hospital.internal/vendors/VND-1001/fda_lic.pdf',
      fileName: 'fda_mfg_license.pdf',
      fileSize: 2450000,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
      verificationStatus: 'VERIFIED',
      uploadedBy: 'rohan.d@apexpharma.in',
      verifiedBy: 'Quality Assurance Officer Sunita Rao',
      verifiedAt: dateInDays(-300)
    },
    {
      vendorDocumentId: 'VDOC-2026-00002',
      vendorId: 'VND-1001',
      documentType: 'GST Registration Certificate',
      documentNumber: 'GSTIN27AAACA1234A1Z5',
      title: 'Form GST REG-06',
      issueDate: dateInDays(-700),
      expiryDate: dateInDays(700),
      issuer: 'Goods and Services Tax Network',
      fileReference: 'https://docs.hospital.internal/vendors/VND-1001/gst.pdf',
      fileName: 'gst_certificate.pdf',
      fileSize: 1100000,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
      verificationStatus: 'VERIFIED',
      uploadedBy: 'rohan.d@apexpharma.in',
      verifiedBy: 'Finance Officer Alok Verma',
      verifiedAt: dateInDays(-300)
    },
    {
      vendorDocumentId: 'VDOC-2026-00003',
      vendorId: 'VND-1001',
      documentType: 'ISO 9001:2015 Quality Certificate',
      documentNumber: 'ISO-QMS-2024-5544',
      title: 'Quality Management System Certificate',
      issueDate: dateInDays(-200),
      expiryDate: dateInDays(500),
      issuer: 'Bureau Veritas India',
      fileReference: 'https://docs.hospital.internal/vendors/VND-1001/iso9001.pdf',
      fileName: 'iso_certification.pdf',
      fileSize: 1800000,
      status: 'VERIFIED',
      verificationStatus: 'VERIFIED',
      uploadedBy: 'rohan.d@apexpharma.in',
      verifiedBy: 'Quality Assurance Officer Sunita Rao',
      verifiedAt: dateInDays(-190)
    },
    {
      vendorDocumentId: 'VDOC-2026-00004',
      vendorId: 'VND-1002',
      documentType: 'Medical Device Manufacturing License',
      documentNumber: 'MD-LIC-CDSCO-2023-112',
      title: 'CDSCO Class B & C Medical Device License',
      issueDate: dateInDays(-400),
      expiryDate: dateInDays(300),
      issuer: 'Central Drugs Standard Control Organisation (CDSCO)',
      fileReference: 'https://docs.hospital.internal/vendors/VND-1002/cdsco.pdf',
      fileName: 'cdsco_license.pdf',
      fileSize: 3100000,
      status: 'VERIFIED',
      verificationStatus: 'VERIFIED',
      uploadedBy: 'a.verma@medicoresurg.com',
      verifiedBy: 'Biomedical Engineer Vivek Sharma',
      verifiedAt: dateInDays(-380)
    },
    {
      vendorDocumentId: 'VDOC-2026-00005',
      vendorId: 'VND-1005',
      documentType: 'Biomedical Waste Handler Authorization',
      documentNumber: 'BMW-AUTH-PCB-2023-88',
      title: 'Pollution Control Board Biomedical Waste Clearance',
      issueDate: dateInDays(-400),
      expiryDate: dateInDays(-5), // Expired 5 days ago!
      issuer: 'Telangana State Pollution Control Board',
      fileReference: 'https://docs.hospital.internal/vendors/VND-1005/bmw.pdf',
      fileName: 'bmw_expired.pdf',
      fileSize: 1500000,
      status: 'EXPIRED',
      verificationStatus: 'REJECTED',
      uploadedBy: 'care@cleancarelogistics.com',
      verifiedBy: 'Environmental Health Officer N. Reddy',
      verifiedAt: dateInDays(-6)
    }
  ];
  await VendorDocument.insertMany(documentsData);

  // 5. Vendor Verifications
  const verificationsData = [
    {
      verificationId: 'VVRF-2026-00001',
      vendorId: 'VND-1001',
      verificationType: 'LICENSE',
      requestedAt: dateInDays(-65),
      startedAt: dateInDays(-64),
      completedAt: dateInDays(-60),
      status: 'PASSED',
      result: 'State FDA drug manufacturing license Form 25 verified online on state portal.',
      verifiedBy: 'Quality Assurance Officer Sunita Rao',
      evidence: [
        {
          type: 'REGISTRY_LOOKUP',
          source: 'Maharashtra FDA Portal',
          referenceId: 'LIC-MH-FDA-2021-9988',
          notes: 'Active status confirmed. No active warning letters.'
        }
      ]
    },
    {
      verificationId: 'VVRF-2026-00002',
      vendorId: 'VND-1001',
      verificationType: 'TAX',
      requestedAt: dateInDays(-65),
      startedAt: dateInDays(-64),
      completedAt: dateInDays(-62),
      status: 'PASSED',
      result: 'GSTIN active, returns filed up to date.',
      verifiedBy: 'Finance Officer Alok Verma'
    },
    {
      verificationId: 'VVRF-2026-00003',
      vendorId: 'VEN-2026-00007',
      verificationType: 'IDENTITY',
      requestedAt: dateInDays(-2),
      startedAt: dateInDays(-1),
      status: 'IN_PROGRESS',
      notes: 'MCA portal lookup completed. Corporate entity verified.'
    }
  ];
  await VendorVerification.insertMany(verificationsData);

  // 6. Vendor Contracts
  const contractsData = [
    {
      contractId: 'VCON-2026-00001',
      vendorId: 'VND-1001',
      contractNumber: 'CNT-2026-001',
      title: 'Annual Antibiotics & Critical Pharmaceuticals Rate Contract',
      contractType: 'RATE_CONTRACT',
      startDate: dateInDays(-180),
      endDate: dateInDays(185),
      status: 'ACTIVE',
      scope: 'Fixed price supply schedule for Tier-1 antibiotics, analgesics, and essential emergency formulations.',
      value: 12500000,
      currency: 'INR',
      renewalType: 'MANUAL',
      renewalNoticeDays: 30,
      approvedBy: 'Dr. Ramesh Sharma',
      approvedAt: dateInDays(-180),
      createdBy: 'PROCUREMENT_OFFICER'
    },
    {
      contractId: 'VCON-2026-00002',
      vendorId: 'VND-1002',
      contractNumber: 'CNT-2026-002',
      title: 'Master Surgical Implants & Consumables Framework Agreement',
      contractType: 'FRAMEWORK',
      startDate: dateInDays(-300),
      endDate: dateInDays(25), // Expiring in 25 days -> triggers Section 52 alert!
      status: 'EXPIRING',
      scope: 'Annual orthopedic, cardiothoracic, and general surgery implant consignment inventory.',
      value: 28000000,
      currency: 'INR',
      renewalType: 'MANUAL',
      renewalNoticeDays: 30,
      approvedBy: 'Dr. Ramesh Sharma',
      approvedAt: dateInDays(-300),
      createdBy: 'PROCUREMENT_OFFICER'
    },
    {
      contractId: 'VCON-2026-00003',
      vendorId: 'VND-1004',
      contractNumber: 'CNT-2026-003',
      title: 'Radiology Modality Comprehensive Maintenance Contract (CMC)',
      contractType: 'MAINTENANCE',
      startDate: dateInDays(-100),
      endDate: dateInDays(265),
      status: 'ACTIVE',
      scope: 'Quarterly preventive maintenance and 4-hour breakdown SLA for X-Ray and Ultrasound consoles.',
      value: 4500000,
      currency: 'INR',
      renewalType: 'MANUAL',
      renewalNoticeDays: 45,
      approvedBy: 'Dr. Ramesh Sharma',
      approvedAt: dateInDays(-100),
      createdBy: 'PROCUREMENT_OFFICER'
    }
  ];
  await VendorContract.insertMany(contractsData);

  // 7. Vendor Performance Reviews
  const reviewsData = [
    {
      reviewId: 'VREV-2026-00001',
      vendorId: 'VND-1001',
      periodStart: dateInDays(-90),
      periodEnd: dateInDays(-1),
      metrics: {
        onTimeDeliveryPercent: 96,
        quantityAccuracyPercent: 98,
        qualityRating: 5,
        responseTimeHours: 12,
        invoiceAccuracyPercent: 95,
        issueCount: 1,
        resolvedIssuesCount: 1,
        totalPurchaseOrders: 18,
        totalSpend: 4250000
      },
      overallScore: 96,
      ratingGrade: 'EXCELLENT',
      reviewStatus: 'COMPLETED',
      reviewedBy: 'Procurement Specialist Deepa Mehta',
      reviewedAt: dateInDays(-1),
      comments: 'Consistently exceptional fill rate and rapid response on emergency ICU stock-outs.'
    },
    {
      reviewId: 'VREV-2026-00002',
      vendorId: 'VND-1002',
      periodStart: dateInDays(-90),
      periodEnd: dateInDays(-1),
      metrics: {
        onTimeDeliveryPercent: 88,
        quantityAccuracyPercent: 94,
        qualityRating: 4,
        responseTimeHours: 24,
        invoiceAccuracyPercent: 90,
        issueCount: 2,
        resolvedIssuesCount: 2,
        totalPurchaseOrders: 12,
        totalSpend: 7800000
      },
      overallScore: 89,
      ratingGrade: 'GOOD',
      reviewStatus: 'COMPLETED',
      reviewedBy: 'Procurement Specialist Deepa Mehta',
      reviewedAt: dateInDays(-1),
      comments: 'Good overall performance, but logistics delays noted on customized titanium plates.'
    }
  ];
  await VendorPerformanceReview.insertMany(reviewsData);

  // 8. Vendor Issues
  const issuesData = [
    {
      issueId: 'VISS-2026-00001',
      vendorId: 'VND-1001',
      purchaseOrderId: 'PO-2026-00002',
      category: 'Late Delivery',
      severity: 'LOW',
      title: '24-hour delay on Ciprofloxacin 500mg batch',
      description: 'Shipment delayed by 1 day due to heavy rainfall and highway obstruction in Western Ghats.',
      reportedBy: 'Inpatient Pharmacy Storekeeper',
      status: 'RESOLVED',
      vendorResponse: {
        response: 'Emergency transit vehicle was re-routed through alternate state highway. Goods delivered intact.',
        respondedAt: dateInDays(-14),
        respondedBy: 'Rohan Deshmukh (Apex Pharma)'
      },
      resolution: 'Accepted with minor delay concession. Stock arrived before ward stock-out.',
      resolvedBy: 'Pharmacy Procurement Manager',
      resolvedAt: dateInDays(-13)
    },
    {
      issueId: 'VISS-2026-00002',
      vendorId: 'VND-1002',
      purchaseOrderId: 'PO-2026-00004',
      category: 'Wrong Quantity',
      severity: 'MEDIUM',
      title: 'Discrepancy in sterile surgical gown bundles',
      description: 'Box marked 50 units contained 45 units. 5 units short.',
      reportedBy: 'OT Consumable Receiving Desk',
      status: 'RESOLVED',
      vendorResponse: {
        response: 'Packing line error acknowledged. Credit note issued and 5 replacement units dispatched immediately.',
        respondedAt: dateInDays(-20),
        respondedBy: 'Amitabh Verma (MediCore)'
      },
      resolution: 'Credit note CRN-9021 verified by Finance. Issue closed.',
      resolvedBy: 'OT Stores In-Charge',
      resolvedAt: dateInDays(-18)
    },
    {
      issueId: 'VISS-2026-00003',
      vendorId: 'VEN-2026-00008',
      category: 'Quality Concern',
      severity: 'CRITICAL',
      title: 'Sterility breach in examination glove lot',
      description: 'Microbiology random audit found micro-perforations in surgical glove Lot #GLV-998.',
      reportedBy: 'Infection Control Committee Lead',
      assignedTo: 'Chief Procurement Officer Dr. Rajesh Patel',
      status: 'OPEN',
      notes: 'Vendor suspended pending comprehensive ISO 11137 sterile barrier inspection.'
    }
  ];
  await VendorIssue.insertMany(issuesData);

  // 9. Vendor Communications
  const communicationsData = [
    {
      communicationId: 'VCOM-2026-00001',
      vendorId: 'VND-1001',
      communicationType: 'Portal Message',
      subject: 'Acknowledgment of Q3 Performance Scorecard',
      message: 'Thank you for your high score on Q3 on-time deliveries. We look forward to renewing our annual antibiotic framework.',
      referenceType: 'GENERAL',
      direction: 'OUTBOUND',
      sender: 'Dr. Ramesh Sharma (Hospital Procurement)',
      recipient: 'Rohan Deshmukh (Apex Pharma)',
      status: 'DELIVERED'
    },
    {
      communicationId: 'VCOM-2026-00002',
      vendorId: 'VND-1001',
      communicationType: 'Email',
      subject: 'Upcoming Expiry: Drug Manufacturing License Form 25',
      message: 'Automated Notice: Your drug manufacturing license is expiring in 20 days. Please upload the renewed certificate.',
      referenceType: 'DOCUMENT',
      referenceId: 'VDOC-2026-00001',
      direction: 'OUTBOUND',
      sender: 'Hospital Compliance Automation Bot',
      recipient: 'sales@apexpharma.in',
      status: 'SENT'
    }
  ];
  await VendorCommunication.insertMany(communicationsData);

  // 10. Vendor Payment Profiles (Masked bank details)
  const paymentProfilesData = [
    {
      profileId: 'VPRF-2026-00001',
      vendorId: 'VND-1001',
      accountName: 'Apex Pharma Supplies Pvt Ltd Corporate Account',
      bankName: 'HDFC Bank Ltd',
      branchName: 'Andheri East Mid-Corporate Branch',
      ifscCode: 'HDFC0000123',
      maskedAccountNumber: 'XXXXXXXXXXXX5678',
      accountReference: 'CMS-HOSP-APEX-01',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Chief Financial Officer Alok Verma',
      verifiedAt: dateInDays(-60),
      isRestricted: true
    },
    {
      profileId: 'VPRF-2026-00002',
      vendorId: 'VND-1002',
      accountName: 'MediCore Surgicals Ltd Operating Account',
      bankName: 'State Bank of India',
      branchName: 'Okhla Industrial Area Branch',
      ifscCode: 'SBIN0001234',
      maskedAccountNumber: 'XXXXXXXXXXXX9876',
      accountReference: 'CMS-HOSP-MEDICORE-02',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Chief Financial Officer Alok Verma',
      verifiedAt: dateInDays(-45),
      isRestricted: true
    }
  ];
  await VendorPaymentProfile.insertMany(paymentProfilesData);

  // 11. Vendor Portal User Account (Section 10 & 75)
  // Vendor user credentials: vendor@apexpharma.in / Password@123
  const vendorUser = new User({
    userId: 'VUSR-00001',
    email: 'vendor@apexpharma.in',
    password: 'Password@123',
    firstName: 'Rohan',
    lastName: 'Deshmukh',
    phoneNumber: '+91-9876543210',
    role: 'VENDOR',
    linkedEntityId: 'VND-1001',
    isActive: true,
    isVerified: true
  });
  await vendorUser.save();
  console.log('[Seed Module 20]: Seeded Vendor Portal User: vendor@apexpharma.in (linked to VND-1001).');

  console.log('[Seed Module 20]: Vendor Management Seeding Completed Successfully!');
};

if (require.main === module) {
  const connectDB = require('../config/db');
  require('dotenv').config();
  connectDB().then(async () => {
    await seedModule20Vendor();
    process.exit(0);
  });
}

module.exports = seedModule20Vendor;
