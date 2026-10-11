const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RateCard = require('../models/RateCard');
const BillableItem = require('../models/BillableItem');
const Deposit = require('../models/Deposit');
const IdGeneratorService = require('../services/IdGeneratorService');

dotenv.config({ path: __dirname + '/../.env' });

const RATE_SEEDS = [
  // Room Stay
  { serviceCode: 'ROOM-GEN', serviceName: 'General Ward Stay', category: 'ROOM_ACCOMMODATION', unit: 'PER_DAY', totalPrice: 1000, basePrice: 1000, taxRate: 0 },
  { serviceCode: 'ROOM-SEMI', serviceName: 'Semi-Private Room Stay', category: 'ROOM_ACCOMMODATION', unit: 'PER_DAY', totalPrice: 2500, basePrice: 2500, taxRate: 0 },
  { serviceCode: 'ROOM-PRIV', serviceName: 'Private Room Stay', category: 'ROOM_ACCOMMODATION', unit: 'PER_DAY', totalPrice: 4500, basePrice: 4500, taxRate: 0 },
  { serviceCode: 'ROOM-ICU', serviceName: 'Intensive Care Unit (ICU)', category: 'ROOM_ACCOMMODATION', unit: 'PER_DAY', totalPrice: 8000, basePrice: 8000, taxRate: 0 },

  // Consultation
  { serviceCode: 'CONS-GEN', serviceName: 'General Physician Consultation', category: 'CONSULTATION', unit: 'PER_VISIT', totalPrice: 800, basePrice: 800, taxRate: 0 },
  { serviceCode: 'CONS-SPEC', serviceName: 'Specialist Doctor Consultation', category: 'CONSULTATION', unit: 'PER_VISIT', totalPrice: 1500, basePrice: 1500, taxRate: 0 },
  { serviceCode: 'CONS-EMRG', serviceName: 'Emergency Triage & Consultation', category: 'CONSULTATION', unit: 'PER_VISIT', totalPrice: 2000, basePrice: 2000, taxRate: 0 },

  // Laboratory
  { serviceCode: 'LAB-CBC', serviceName: 'Complete Blood Count (CBC)', category: 'LABORATORY', unit: 'PER_TEST', totalPrice: 500, basePrice: 500, taxRate: 0.05 },
  { serviceCode: 'LAB-LFT', serviceName: 'Liver Function Test (LFT)', category: 'LABORATORY', unit: 'PER_TEST', totalPrice: 900, basePrice: 900, taxRate: 0.05 },
  { serviceCode: 'LAB-KFT', serviceName: 'Kidney Function Test (KFT)', category: 'LABORATORY', unit: 'PER_TEST', totalPrice: 850, basePrice: 850, taxRate: 0.05 },
  { serviceCode: 'LAB-LIPID', serviceName: 'Lipid Profile Panel', category: 'LABORATORY', unit: 'PER_TEST', totalPrice: 750, basePrice: 750, taxRate: 0.05 },
  { serviceCode: 'LAB-URINE', serviceName: 'Routine Urine Examination', category: 'LABORATORY', unit: 'PER_TEST', totalPrice: 300, basePrice: 300, taxRate: 0.05 },

  // Radiology
  { serviceCode: 'RAD-XRAY', serviceName: 'Digital Chest X-Ray PA View', category: 'RADIOLOGY', unit: 'PER_SCAN', totalPrice: 1000, basePrice: 1000, taxRate: 0.05 },
  { serviceCode: 'RAD-USG', serviceName: 'Abdominal Ultrasound (USG)', category: 'RADIOLOGY', unit: 'PER_SCAN', totalPrice: 1800, basePrice: 1800, taxRate: 0.05 },
  { serviceCode: 'RAD-CT', serviceName: 'CT Scan Brain Non-Contrast', category: 'RADIOLOGY', unit: 'PER_SCAN', totalPrice: 4500, basePrice: 4500, taxRate: 0.05 },
  { serviceCode: 'RAD-MRI', serviceName: 'MRI Spine 1.5T', category: 'RADIOLOGY', unit: 'PER_SCAN', totalPrice: 7500, basePrice: 7500, taxRate: 0.05 },

  // Pharmacy
  { serviceCode: 'PHARM-PARACET', serviceName: 'Paracetamol 650mg Tabs', category: 'PHARMACY', unit: 'PER_STRIP', totalPrice: 45, basePrice: 45, taxRate: 0.12 },
  { serviceCode: 'PHARM-AMOXIC', serviceName: 'Amoxicillin 500mg Caps', category: 'PHARMACY', unit: 'PER_STRIP', totalPrice: 120, basePrice: 120, taxRate: 0.12 },
  { serviceCode: 'PHARM-IVFLUID', serviceName: 'Normal Saline IV 500ml', category: 'PHARMACY', unit: 'PER_BOTTLE', totalPrice: 180, basePrice: 180, taxRate: 0.12 },

  // Procedures & Nursing
  { serviceCode: 'NUR-DAY', serviceName: 'Daily Inpatient Nursing Care', category: 'NURSING', unit: 'PER_DAY', totalPrice: 600, basePrice: 600, taxRate: 0 },
  { serviceCode: 'PROC-DRESS', serviceName: 'Wound Dressing & Disinfection', category: 'PROCEDURE', unit: 'PER_SESSION', totalPrice: 400, basePrice: 400, taxRate: 0.05 }
];

async function seedBillingData() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db';
  console.log('Connecting to MongoDB for Billing Master Seeding at:', uri);
  await mongoose.connect(uri);

  console.log('Checking Rate Cards...');
  for (const r of RATE_SEEDS) {
    const existing = await RateCard.findOne({ serviceCode: r.serviceCode });
    if (!existing) {
      const rateId = await IdGeneratorService.generateRateId();
      await RateCard.create({
        rateId,
        serviceCode: r.serviceCode,
        serviceName: r.serviceName,
        category: r.category,
        unit: r.unit,
        basePrice: r.basePrice,
        taxRate: r.taxRate,
        active: true,
        effectiveFrom: new Date('2026-01-01')
      });
      console.log(`+ Seeded Rate: ${r.serviceCode} - ${r.serviceName} (₹${r.basePrice})`);
    }
  }

  console.log('Billing master rates verified.');
  await mongoose.disconnect();
}

if (require.main === module) {
  seedBillingData()
    .then(() => {
      console.log('Billing master data seeded successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Billing seed error:', err);
      process.exit(1);
    });
}

module.exports = { seedBillingData };
