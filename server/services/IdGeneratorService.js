const SequenceCounter = require('../models/SequenceCounter');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Registration = require('../models/Registration');
const EmergencyTemporaryRecord = require('../models/EmergencyTemporaryRecord');
const { v4: uuidv4 } = require('uuid');

class IdGeneratorService {
  /**
   * Generate permanent Patient ID (e.g. P10001, P10002) guaranteed unique
   */
  static async generatePatientId() {
    // Find highest existing Patient ID in database
    const lastPatient = await Patient.findOne({ patientId: /^P\d+$/ })
      .sort({ patientId: -1 })
      .select('patientId')
      .lean();

    let baseSeq = 10001;
    if (lastPatient && lastPatient.patientId) {
      const num = parseInt(lastPatient.patientId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) {
        baseSeq = Math.max(baseSeq, num + 1);
      }
    }

    const counter = await SequenceCounter.findOneAndUpdate(
      { key: 'PATIENT_ID' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }

    return `P${counter.sequenceValue}`;
  }

  /**
   * Generate unique Visit ID (e.g. V202610001)
   */
  static async generateVisitId() {
    const currentYear = new Date().getFullYear();
    const key = `VISIT_ID_${currentYear}`;
    const prefix = `V${currentYear}`;

    const lastVisit = await Visit.findOne({ visitId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ visitId: -1 })
      .select('visitId')
      .lean();

    let baseSeq = 10001;
    if (lastVisit && lastVisit.visitId) {
      const numPart = lastVisit.visitId.substring(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num)) {
        baseSeq = Math.max(baseSeq, num + 1);
      }
    }

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }

    return `${prefix}${counter.sequenceValue}`;
  }

  /**
   * Generate unique Registration ID (e.g. REG202610001)
   */
  static async generateRegistrationId() {
    const currentYear = new Date().getFullYear();
    const key = `REGISTRATION_ID_${currentYear}`;
    const prefix = `REG${currentYear}`;

    const lastReg = await Registration.findOne({ registrationId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ registrationId: -1 })
      .select('registrationId')
      .lean();

    let baseSeq = 10001;
    if (lastReg && lastReg.registrationId) {
      const numPart = lastReg.registrationId.substring(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num)) {
        baseSeq = Math.max(baseSeq, num + 1);
      }
    }

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }

    return `${prefix}${counter.sequenceValue}`;
  }

  /**
   * Generate Temporary Emergency ID (e.g. TEMP-2026-00452)
   */
  static async generateTemporaryEmergencyId() {
    const currentYear = new Date().getFullYear();
    const key = `TEMP_EMERGENCY_ID_${currentYear}`;
    const prefix = `TEMP-${currentYear}-`;

    const lastTemp = await EmergencyTemporaryRecord.findOne({ temporaryEmergencyId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ temporaryEmergencyId: -1 })
      .select('temporaryEmergencyId')
      .lean();

    let baseSeq = 101;
    if (lastTemp && lastTemp.temporaryEmergencyId) {
      const numPart = lastTemp.temporaryEmergencyId.substring(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num)) {
        baseSeq = Math.max(baseSeq, num + 1);
      }
    }

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }

    const paddedSeq = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${paddedSeq}`;
  }

  /**
   * Generate correlation ID (e.g. CORR-20261006-000123)
   */
  static generateCorrelationId() {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const shortCode = uuidv4().substring(0, 6).toUpperCase();
    return `CORR-${ymd}-${shortCode}`;
  }
}

module.exports = IdGeneratorService;
