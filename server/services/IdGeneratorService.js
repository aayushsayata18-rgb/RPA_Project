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
   * Generate unique Billable Item / Charge ID (e.g. CHG-20261009-00101)
   */
  static async generateBillableItemId() {
    const BillableItem = require('../models/BillableItem');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `BILLABLE_ITEM_ID_${ymd}`;
    const prefix = `CHG-${ymd}-`;

    const lastItem = await BillableItem.findOne({ chargeId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ chargeId: -1 })
      .select('chargeId')
      .lean();

    let baseSeq = 101;
    if (lastItem && lastItem.chargeId) {
      const numPart = lastItem.chargeId.substring(prefix.length);
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
   * Generate unique Deposit Number (e.g. DEP-20261009-00101)
   */
  static async generateDepositNumber() {
    const Deposit = require('../models/Deposit');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `DEPOSIT_NUMBER_${ymd}`;
    const prefix = `DEP-${ymd}-`;

    const lastDep = await Deposit.findOne({ depositNumber: new RegExp(`^${prefix}\\d+$`) })
      .sort({ depositNumber: -1 })
      .select('depositNumber')
      .lean();

    let baseSeq = 101;
    if (lastDep && lastDep.depositNumber) {
      const numPart = lastDep.depositNumber.substring(prefix.length);
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
   * Generate unique Adjustment Number (e.g. ADJ-20261009-00101)
   */
  static async generateAdjustmentNumber() {
    const FinancialAdjustment = require('../models/FinancialAdjustment');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `ADJUSTMENT_NUMBER_${ymd}`;
    const prefix = `ADJ-${ymd}-`;

    const lastAdj = await FinancialAdjustment.findOne({ adjustmentNumber: new RegExp(`^${prefix}\\d+$`) })
      .sort({ adjustmentNumber: -1 })
      .select('adjustmentNumber')
      .lean();

    let baseSeq = 101;
    if (lastAdj && lastAdj.adjustmentNumber) {
      const numPart = lastAdj.adjustmentNumber.substring(prefix.length);
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
   * Generate unique Billing Query Number (e.g. QRY-20261009-00101)
   */
  static async generateBillingQueryNumber() {
    const BillingQuery = require('../models/BillingQuery');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `BILLING_QUERY_NUMBER_${ymd}`;
    const prefix = `QRY-${ymd}-`;

    const lastQry = await BillingQuery.findOne({ queryNumber: new RegExp(`^${prefix}\\d+$`) })
      .sort({ queryNumber: -1 })
      .select('queryNumber')
      .lean();

    let baseSeq = 101;
    if (lastQry && lastQry.queryNumber) {
      const numPart = lastQry.queryNumber.substring(prefix.length);
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
   * Generate unique Rate ID (e.g. RATE-1001)
   */
  static async generateRateId() {
    const counter = await SequenceCounter.findOneAndUpdate(
      { key: 'RATE_ID' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let baseSeq = 1001;
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }

    return `RATE-${counter.sequenceValue}`;
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

  /**
   * Generate unique Policy ID (e.g. INS-POL-00045)
   */
  static async generatePolicyId() {
    const counter = await SequenceCounter.findOneAndUpdate(
      { key: 'INSURANCE_POLICY_ID' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let baseSeq = 10001;
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `INS-POL-${padded}`;
  }

  /**
   * Generate unique Verification ID (e.g. IV-2026-000123)
   */
  static async generateVerificationId() {
    const InsuranceVerification = require('../models/InsuranceVerification');
    const year = new Date().getFullYear();
    const prefix = `IV-${year}-`;
    const key = `INSURANCE_VERIFICATION_ID_${year}`;

    const lastVer = await InsuranceVerification.findOne({ verificationId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ verificationId: -1 })
      .select('verificationId')
      .lean();

    let baseSeq = 101;
    if (lastVer && lastVer.verificationId) {
      const numPart = lastVer.verificationId.substring(prefix.length);
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

    const padded = String(counter.sequenceValue).padStart(6, '0');
    return `${prefix}${padded}`;
  }
  /**
   * Generate unique Insurance Claim ID (e.g. CLM-2026-00098)
   */
  static async generateClaimId() {
    const InsuranceClaim = require('../models/InsuranceClaim');
    const year = new Date().getFullYear();
    const prefix = `CLM-${year}-`;
    const key = `INSURANCE_CLAIM_ID_${year}`;

    const lastClaim = await InsuranceClaim.findOne({ claimId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ claimId: -1 })
      .select('claimId')
      .lean();

    let baseSeq = 101;
    if (lastClaim && lastClaim.claimId) {
      const numPart = lastClaim.claimId.substring(prefix.length);
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

    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Claim Document ID (e.g. DOC-2026-000101)
   */
  static async generateClaimDocumentId() {
    const InsuranceClaimDocument = require('../models/InsuranceClaimDocument');
    const year = new Date().getFullYear();
    const prefix = `DOC-${year}-`;
    const key = `CLAIM_DOC_ID_${year}`;

    const lastDoc = await InsuranceClaimDocument.findOne({ documentId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ documentId: -1 })
      .select('documentId')
      .lean();

    let baseSeq = 101;
    if (lastDoc && lastDoc.documentId) {
      const num = parseInt(lastDoc.documentId.substring(prefix.length), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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

    const padded = String(counter.sequenceValue).padStart(6, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Claim Query Reference/ID (e.g. CQ-2026-000101)
   */
  static async generateClaimQueryId() {
    const InsuranceClaimQuery = require('../models/InsuranceClaimQuery');
    const year = new Date().getFullYear();
    const prefix = `CQ-${year}-`;
    const key = `CLAIM_QUERY_ID_${year}`;

    const lastQuery = await InsuranceClaimQuery.findOne({ queryId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ queryId: -1 })
      .select('queryId')
      .lean();

    let baseSeq = 101;
    if (lastQuery && lastQuery.queryId) {
      const num = parseInt(lastQuery.queryId.substring(prefix.length), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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

    const padded = String(counter.sequenceValue).padStart(6, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Claim Settlement ID (e.g. STL-2026-000101)
   */
  static async generateClaimSettlementId() {
    const InsuranceClaimSettlement = require('../models/InsuranceClaimSettlement');
    const year = new Date().getFullYear();
    const prefix = `STL-${year}-`;
    const key = `CLAIM_SETTLEMENT_ID_${year}`;

    const lastStl = await InsuranceClaimSettlement.findOne({ settlementId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ settlementId: -1 })
      .select('settlementId')
      .lean();

    let baseSeq = 101;
    if (lastStl && lastStl.settlementId) {
      const num = parseInt(lastStl.settlementId.substring(prefix.length), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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

    const padded = String(counter.sequenceValue).padStart(6, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate permanent Employee ID (e.g. EMP10001, EMP10002) concurrency-safe
   */
  static async generateEmployeeId() {
    const Employee = require('../models/Employee');
    const prefix = 'EMP';
    const key = 'EMPLOYEE_ID';

    const lastEmp = await Employee.findOne({ employeeId: /^EMP\d+$/ })
      .sort({ employeeId: -1 })
      .select('employeeId')
      .lean();

    let baseSeq = 10001;
    if (lastEmp && lastEmp.employeeId) {
      const num = parseInt(lastEmp.employeeId.replace(/\D/g, ''), 10);
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
   * Generate unique Access Request ID (e.g. ACC10001, ACC10002)
   */
  static async generateAccessRequestId() {
    const AccessRequest = require('../models/AccessRequest');
    const prefix = 'ACC';
    const key = 'ACCESS_REQUEST_ID';

    const lastReq = await AccessRequest.findOne({ requestId: /^ACC\d+$/ })
      .sort({ requestId: -1 })
      .select('requestId')
      .lean();

    let baseSeq = 10001;
    if (lastReq && lastReq.requestId) {
      const num = parseInt(lastReq.requestId.replace(/\D/g, ''), 10);
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
   * Generate unique Attendance ID (e.g. ATT10001, ATT10002)
   */
  static async generateAttendanceId() {
    const Attendance = require('../models/Attendance');
    const prefix = 'ATT';
    const key = 'ATTENDANCE_ID';

    const lastRecord = await Attendance.findOne({ attendanceId: /^ATT\d+$/ })
      .sort({ attendanceId: -1 })
      .select('attendanceId')
      .lean();

    let baseSeq = 10001;
    if (lastRecord && lastRecord.attendanceId) {
      const num = parseInt(lastRecord.attendanceId.replace(/\D/g, ''), 10);
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
   * Generate unique Attendance Correction ID (e.g. ATC10001)
   */
  static async generateAttendanceCorrectionId() {
    const AttendanceCorrection = require('../models/AttendanceCorrection');
    const prefix = 'ATC';
    const key = 'ATTENDANCE_CORRECTION_ID';

    const lastRecord = await AttendanceCorrection.findOne({ requestId: /^ATC\d+$/ })
      .sort({ requestId: -1 })
      .select('requestId')
      .lean();

    let baseSeq = 10001;
    if (lastRecord && lastRecord.requestId) {
      const num = parseInt(lastRecord.requestId.replace(/\D/g, ''), 10);
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
   * Generate unique Attendance Import Batch ID (e.g. BAT10001)
   */
  static async generateAttendanceBatchId() {
    const AttendanceImportBatch = require('../models/AttendanceImportBatch');
    const prefix = 'BAT';
    const key = 'ATTENDANCE_BATCH_ID';

    const lastRecord = await AttendanceImportBatch.findOne({ batchId: /^BAT\d+$/ })
      .sort({ batchId: -1 })
      .select('batchId')
      .lean();

    let baseSeq = 10001;
    if (lastRecord && lastRecord.batchId) {
      const num = parseInt(lastRecord.batchId.replace(/\D/g, ''), 10);
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
   * Generate unique Attendance Event ID (e.g. EVT10001)
   */
  static async generateAttendanceEventId() {
    const AttendanceEvent = require('../models/AttendanceEvent');
    const prefix = 'EVT';
    const key = 'ATTENDANCE_EVENT_ID';

    const lastRecord = await AttendanceEvent.findOne({ eventId: /^EVT\d+$/ })
      .sort({ eventId: -1 })
      .select('eventId')
      .lean();

    let baseSeq = 10001;
    if (lastRecord && lastRecord.eventId) {
      const num = parseInt(lastRecord.eventId.replace(/\D/g, ''), 10);
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
   * Generate unique Shift Definition ID (e.g. SHF10001)
   */
  static async generateShiftId() {
    const Shift = require('../models/Shift');
    const prefix = 'SHF';
    const key = 'SHIFT_ID';

    const last = await Shift.findOne({ shiftId: /^SHF\d+$/ })
      .sort({ shiftId: -1 })
      .select('shiftId')
      .lean();

    let baseSeq = 10001;
    if (last && last.shiftId) {
      const num = parseInt(last.shiftId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Roster ID (e.g. RST10001)
   */
  static async generateRosterId() {
    const Roster = require('../models/Roster');
    const prefix = 'RST';
    const key = 'ROSTER_ID';

    const last = await Roster.findOne({ rosterId: /^RST\d+$/ })
      .sort({ rosterId: -1 })
      .select('rosterId')
      .lean();

    let baseSeq = 10001;
    if (last && last.rosterId) {
      const num = parseInt(last.rosterId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Roster Version ID (e.g. RV10001)
   */
  static async generateRosterVersionId() {
    const RosterVersion = require('../models/RosterVersion');
    const prefix = 'RV';
    const key = 'ROSTER_VERSION_ID';

    const last = await RosterVersion.findOne({ versionId: /^RV\d+$/ })
      .sort({ versionId: -1 })
      .select('versionId')
      .lean();

    let baseSeq = 10001;
    if (last && last.versionId) {
      const num = parseInt(last.versionId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Shift Assignment ID (e.g. ASN10001)
   */
  static async generateShiftAssignmentId() {
    const ShiftAssignment = require('../models/ShiftAssignment');
    const prefix = 'ASN';
    const key = 'SHIFT_ASSIGNMENT_ID';

    const last = await ShiftAssignment.findOne({ assignmentId: /^ASN\d+$/ })
      .sort({ assignmentId: -1 })
      .select('assignmentId')
      .lean();

    let baseSeq = 10001;
    if (last && last.assignmentId) {
      const num = parseInt(last.assignmentId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Shift Change Request ID (e.g. SCR10001)
   */
  static async generateShiftChangeRequestId() {
    const ShiftChangeRequest = require('../models/ShiftChangeRequest');
    const prefix = 'SCR';
    const key = 'SHIFT_CHANGE_REQUEST_ID';

    const last = await ShiftChangeRequest.findOne({ requestId: /^SCR\d+$/ })
      .sort({ requestId: -1 })
      .select('requestId')
      .lean();

    let baseSeq = 10001;
    if (last && last.requestId) {
      const num = parseInt(last.requestId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Shift Swap Request ID (e.g. SSR10001)
   */
  static async generateShiftSwapRequestId() {
    const ShiftSwapRequest = require('../models/ShiftSwapRequest');
    const prefix = 'SSR';
    const key = 'SHIFT_SWAP_REQUEST_ID';

    const last = await ShiftSwapRequest.findOne({ swapId: /^SSR\d+$/ })
      .sort({ swapId: -1 })
      .select('swapId')
      .lean();

    let baseSeq = 10001;
    if (last && last.swapId) {
      const num = parseInt(last.swapId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Shift Conflict ID (e.g. CNF10001)
   */
  static async generateShiftConflictId() {
    const ShiftConflict = require('../models/ShiftConflict');
    const prefix = 'CNF';
    const key = 'SHIFT_CONFLICT_ID';

    const last = await ShiftConflict.findOne({ conflictId: /^CNF\d+$/ })
      .sort({ conflictId: -1 })
      .select('conflictId')
      .lean();

    let baseSeq = 10001;
    if (last && last.conflictId) {
      const num = parseInt(last.conflictId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Employee Availability ID (e.g. AVL10001)
   */
  static async generateAvailabilityId() {
    const EmployeeAvailability = require('../models/EmployeeAvailability');
    const prefix = 'AVL';
    const key = 'AVAILABILITY_ID';

    const last = await EmployeeAvailability.findOne({ availabilityId: /^AVL\d+$/ })
      .sort({ availabilityId: -1 })
      .select('availabilityId')
      .lean();

    let baseSeq = 10001;
    if (last && last.availabilityId) {
      const num = parseInt(last.availabilityId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Shift Coverage ID (e.g. COV10001)
   */
  static async generateCoverageId() {
    const ShiftCoverage = require('../models/ShiftCoverage');
    const prefix = 'COV';
    const key = 'SHIFT_COVERAGE_ID';

    const last = await ShiftCoverage.findOne({ coverageId: /^COV\d+$/ })
      .sort({ coverageId: -1 })
      .select('coverageId')
      .lean();

    let baseSeq = 10001;
    if (last && last.coverageId) {
      const num = parseInt(last.coverageId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Leave Request ID (e.g. LR-2026-00001)
   */
  static async generateLeaveRequestId() {
    const LeaveRequest = require('../models/LeaveRequest');
    const currentYear = new Date().getFullYear();
    const prefix = `LR-${currentYear}-`;
    const key = `LEAVE_REQUEST_ID_${currentYear}`;

    const last = await LeaveRequest.findOne({ requestNumber: new RegExp(`^${prefix}\\d+$`) })
      .sort({ requestNumber: -1 })
      .select('requestNumber')
      .lean();

    let baseSeq = 1;
    if (last && last.requestNumber) {
      const numPart = last.requestNumber.substring(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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

    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Leave Type ID (e.g. LT-1001)
   */
  static async generateLeaveTypeId() {
    const LeaveType = require('../models/LeaveType');
    const prefix = 'LT-';
    const key = 'LEAVE_TYPE_ID';

    const last = await LeaveType.findOne({ leaveTypeId: /^LT-\d+$/ })
      .sort({ leaveTypeId: -1 })
      .select('leaveTypeId')
      .lean();

    let baseSeq = 1001;
    if (last && last.leaveTypeId) {
      const num = parseInt(last.leaveTypeId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Leave Policy ID (e.g. LP-1001)
   */
  static async generateLeavePolicyId() {
    const LeavePolicy = require('../models/LeavePolicy');
    const prefix = 'LP-';
    const key = 'LEAVE_POLICY_ID';

    const last = await LeavePolicy.findOne({ policyId: /^LP-\d+$/ })
      .sort({ policyId: -1 })
      .select('policyId')
      .lean();

    let baseSeq = 1001;
    if (last && last.policyId) {
      const num = parseInt(last.policyId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Leave Balance ID (e.g. BAL-10001)
   */
  static async generateLeaveBalanceId() {
    const LeaveBalance = require('../models/LeaveBalance');
    const prefix = 'BAL-';
    const key = 'LEAVE_BALANCE_ID';

    const last = await LeaveBalance.findOne({ balanceId: /^BAL-\d+$/ })
      .sort({ balanceId: -1 })
      .select('balanceId')
      .lean();

    let baseSeq = 10001;
    if (last && last.balanceId) {
      const num = parseInt(last.balanceId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Leave Balance Transaction ID (e.g. TXN-10001)
   */
  static async generateLeaveTransactionId() {
    const LeaveBalanceTransaction = require('../models/LeaveBalanceTransaction');
    const prefix = 'TXN-';
    const key = 'LEAVE_TXN_ID';

    const last = await LeaveBalanceTransaction.findOne({ transactionId: /^TXN-\d+$/ })
      .sort({ transactionId: -1 })
      .select('transactionId')
      .lean();

    let baseSeq = 10001;
    if (last && last.transactionId) {
      const num = parseInt(last.transactionId.replace(/\D/g, ''), 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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
   * Generate unique Leave Cancellation Request ID (e.g. LCR-2026-00001)
   */
  static async generateLeaveCancellationId() {
    const LeaveCancellationRequest = require('../models/LeaveCancellationRequest');
    const currentYear = new Date().getFullYear();
    const prefix = `LCR-${currentYear}-`;
    const key = `LEAVE_CANCELLATION_ID_${currentYear}`;

    const last = await LeaveCancellationRequest.findOne({ cancellationId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ cancellationId: -1 })
      .select('cancellationId')
      .lean();

    let baseSeq = 1;
    if (last && last.cancellationId) {
      const numPart = last.cancellationId.substring(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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

    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Holiday ID (e.g. HOL-2026-0001)
   */
  static async generateHolidayId() {
    const HolidayCalendar = require('../models/HolidayCalendar');
    const currentYear = new Date().getFullYear();
    const prefix = `HOL-${currentYear}-`;
    const key = `HOLIDAY_ID_${currentYear}`;

    const last = await HolidayCalendar.findOne({ holidayId: new RegExp(`^${prefix}\\d+$`) })
      .sort({ holidayId: -1 })
      .select('holidayId')
      .lean();

    let baseSeq = 1;
    if (last && last.holidayId) {
      const numPart = last.holidayId.substring(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
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

    const padded = String(counter.sequenceValue).padStart(4, '0');
    return `${prefix}${padded}`;
  }
}

module.exports = IdGeneratorService;


