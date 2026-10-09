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
   * Generate unique Appointment ID (e.g. A202610001)
   */
  static async generateAppointmentId() {
    const Appointment = require('../models/Appointment');
    const currentYear = new Date().getFullYear();
    const key = `APPOINTMENT_ID_${currentYear}`;
    const prefix = `A${currentYear}`;

    const lastApt = await Appointment.findOne({ appointmentId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ appointmentId: -1 })
      .select('appointmentId')
      .lean();

    let baseSeq = 10001;
    if (lastApt && lastApt.appointmentId) {
      const numPart = lastApt.appointmentId.substring(prefix.length);
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
   * Generate unique Token ID (e.g. TOKEN-20261009-00102)
   */
  static async generateTokenId() {
    const OPDToken = require('../models/OPDToken');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `OPD_TOKEN_ID_${ymd}`;
    const prefix = `TOKEN-${ymd}-`;

    const lastToken = await OPDToken.findOne({ tokenId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ tokenId: -1 })
      .select('tokenId')
      .lean();

    let baseSeq = 101;
    if (lastToken && lastToken.tokenId) {
      const numPart = lastToken.tokenId.substring(prefix.length);
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
   * Generate unique CheckIn ID (e.g. CHK-20261009-0001)
   */
  static async generateCheckInId() {
    const CheckIn = require('../models/CheckIn');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `CHECKIN_ID_${ymd}`;
    const prefix = `CHK-${ymd}-`;

    const lastCheckin = await CheckIn.findOne({ checkInId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ checkInId: -1 })
      .select('checkInId')
      .lean();

    let baseSeq = 1;
    if (lastCheckin && lastCheckin.checkInId) {
      const numPart = lastCheckin.checkInId.substring(prefix.length);
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

    const paddedSeq = String(counter.sequenceValue).padStart(4, '0');
    return `${prefix}${paddedSeq}`;
  }

  /**
   * Generate atomic daily Token Number for a department (e.g. GM-101, CARD-201)
   */
  static async generateTokenNumber(prefix = 'GM', dateStr = null) {
    const cleanPrefix = (prefix || 'GM').toUpperCase().trim();
    const todayStr = dateStr || new Date().toISOString().slice(0, 10);
    const key = `OPD_TOKEN_SEQ_${cleanPrefix}_${todayStr}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Default starting number is 100 + counter (e.g. 101, 102...)
    let seq = counter.sequenceValue;
    if (seq < 101) {
      counter.sequenceValue = 101;
      await counter.save();
      seq = 101;
    }

    return {
      tokenNumber: `${cleanPrefix}-${seq}`,
      sequenceNumber: seq
    };
  }

  /**
   * Generate unique Queue ID (e.g. QUEUE-GM-20261009 or QUEUE-DOC1001-20261009)
   */
  static generateQueueId(prefix = 'GM', dateStr = null) {
    const cleanPrefix = (prefix || 'GM').toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    const todayStr = (dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    return `QUEUE-${cleanPrefix}-${todayStr}`;
  }

  /**
   * Generate unique Admission ID (e.g. ADM202610001, ADM202610002)
   */
  static async generateAdmissionId() {
    const Admission = require('../models/Admission');
    const currentYear = new Date().getFullYear();
    const key = `ADMISSION_ID_${currentYear}`;
    const prefix = `ADM${currentYear}`;

    const lastAdmission = await Admission.findOne({ admissionId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ admissionId: -1 })
      .select('admissionId')
      .lean();

    let baseSeq = 10001;
    if (lastAdmission && lastAdmission.admissionId) {
      const numPart = lastAdmission.admissionId.substring(prefix.length);
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
   * Generate unique Admission Request ID (e.g. ADMREQ202610001 or ADMREQ1001)
   */
  static async generateAdmissionRequestId() {
    const AdmissionRequest = require('../models/AdmissionRequest');
    const currentYear = new Date().getFullYear();
    const key = `ADMISSION_REQUEST_ID_${currentYear}`;
    const prefix = `ADMREQ${currentYear}`;

    const lastReq = await AdmissionRequest.findOne({ admissionRequestId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ admissionRequestId: -1 })
      .select('admissionRequestId')
      .lean();

    let baseSeq = 10001;
    if (lastReq && lastReq.admissionRequestId) {
      const numPart = lastReq.admissionRequestId.substring(prefix.length);
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
   * Generate unique Checklist ID (e.g. CHKLIST-20261009-00101)
   */
  static async generateChecklistId() {
    const AdmissionChecklist = require('../models/AdmissionChecklist');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `ADMISSION_CHECKLIST_ID_${ymd}`;
    const prefix = `CHKLIST-${ymd}-`;

    const lastChk = await AdmissionChecklist.findOne({ checklistId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ checklistId: -1 })
      .select('checklistId')
      .lean();

    let baseSeq = 101;
    if (lastChk && lastChk.checklistId) {
      const numPart = lastChk.checklistId.substring(prefix.length);
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
   * Generate unique Bed Assignment ID (e.g. ASSIGN-20261009-00101)
   */
  static async generateAssignmentId() {
    const BedAssignment = require('../models/BedAssignment');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `BED_ASSIGNMENT_ID_${ymd}`;
    const prefix = `ASSIGN-${ymd}-`;

    const lastAssign = await BedAssignment.findOne({ assignmentId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ assignmentId: -1 })
      .select('assignmentId')
      .lean();

    let baseSeq = 101;
    if (lastAssign && lastAssign.assignmentId) {
      const numPart = lastAssign.assignmentId.substring(prefix.length);
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
   * Generate unique Bed Reservation ID (e.g. RES-20261009-00101)
   */
  static async generateReservationId() {
    const BedReservation = require('../models/BedReservation');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `BED_RESERVATION_ID_${ymd}`;
    const prefix = `RES-${ymd}-`;

    const lastRes = await BedReservation.findOne({ reservationId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ reservationId: -1 })
      .select('reservationId')
      .lean();

    let baseSeq = 101;
    if (lastRes && lastRes.reservationId) {
      const numPart = lastRes.reservationId.substring(prefix.length);
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
   * Generate unique Housekeeping Task ID (e.g. HK-20261009-00101)
   */
  static async generateHousekeepingTaskId() {
    const HousekeepingTask = require('../models/HousekeepingTask');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `HOUSEKEEPING_TASK_ID_${ymd}`;
    const prefix = `HK-${ymd}-`;

    const lastTask = await HousekeepingTask.findOne({ taskId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ taskId: -1 })
      .select('taskId')
      .lean();

    let baseSeq = 101;
    if (lastTask && lastTask.taskId) {
      const numPart = lastTask.taskId.substring(prefix.length);
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
   * Generate unique Waiting List ID (e.g. WAIT-20261009-00101)
   */
  static async generateWaitingListId() {
    const BedWaitingList = require('../models/BedWaitingList');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `BED_WAITING_LIST_ID_${ymd}`;
    const prefix = `WAIT-${ymd}-`;

    const lastWait = await BedWaitingList.findOne({ waitingListId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ waitingListId: -1 })
      .select('waitingListId')
      .lean();

    let baseSeq = 101;
    if (lastWait && lastWait.waitingListId) {
      const numPart = lastWait.waitingListId.substring(prefix.length);
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
   * Generate unique Discharge Request ID (e.g. DREQ-20261009-00101)
   */
  static async generateDischargeRequestId() {
    const DischargeRequest = require('../models/DischargeRequest');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `DISCHARGE_REQUEST_ID_${ymd}`;
    const prefix = `DREQ-${ymd}-`;

    const lastReq = await DischargeRequest.findOne({ requestId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ requestId: -1 })
      .select('requestId')
      .lean();

    let baseSeq = 101;
    if (lastReq && lastReq.requestId) {
      const numPart = lastReq.requestId.substring(prefix.length);
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
   * Generate unique Discharge Number (e.g. DIS-20261009-00101)
   */
  static async generateDischargeNumber() {
    const Discharge = require('../models/Discharge');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `DISCHARGE_NUMBER_${ymd}`;
    const prefix = `DIS-${ymd}-`;

    const lastDis = await Discharge.findOne({ dischargeNumber: new RegExp(`^${prefix}\\d+$`) })
      .sort({ dischargeNumber: -1 })
      .select('dischargeNumber')
      .lean();

    let baseSeq = 101;
    if (lastDis && lastDis.dischargeNumber) {
      const numPart = lastDis.dischargeNumber.substring(prefix.length);
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
   * Generate unique Invoice ID (e.g. INV-20261009-00101)
   */
  static async generateInvoiceId() {
    const Invoice = require('../models/Invoice');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `INVOICE_ID_${ymd}`;
    const prefix = `INV-${ymd}-`;

    const lastInv = await Invoice.findOne({ invoiceId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ invoiceId: -1 })
      .select('invoiceId')
      .lean();

    let baseSeq = 101;
    if (lastInv && lastInv.invoiceId) {
      const numPart = lastInv.invoiceId.substring(prefix.length);
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
   * Generate unique Payment Transaction ID (e.g. PAY-20261009-00101)
   */
  static async generatePaymentTransactionId() {
    const PaymentTransaction = require('../models/PaymentTransaction');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `PAYMENT_TXN_ID_${ymd}`;
    const prefix = `PAY-${ymd}-`;

    const lastTxn = await PaymentTransaction.findOne({ transactionId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ transactionId: -1 })
      .select('transactionId')
      .lean();

    let baseSeq = 101;
    if (lastTxn && lastTxn.transactionId) {
      const numPart = lastTxn.transactionId.substring(prefix.length);
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
