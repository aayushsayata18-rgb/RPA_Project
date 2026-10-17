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

  /**
   * Generate unique Payroll Period Code (e.g. PAY-2026-10)
   */
  static generatePayrollPeriodCode(year, month) {
    const y = year || new Date().getFullYear();
    const m = String(month || (new Date().getMonth() + 1)).padStart(2, '0');
    return `PAY-${y}-${m}`;
  }

  /**
   * Generate unique Payroll Input ID (e.g. PINP-2026-00001)
   */
  static async generatePayrollInputId() {
    const currentYear = new Date().getFullYear();
    const prefix = `PINP-${currentYear}-`;
    const key = `PAYROLL_INPUT_ID_${currentYear}`;

    let baseSeq = 1;
    try {
      const PayrollInput = require('../models/PayrollInput');
      const last = await PayrollInput.findOne({ inputId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ inputId: -1 })
        .select('inputId')
        .lean();
      if (last && last.inputId) {
        const numPart = last.inputId.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (_) {}

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
   * Generate unique Salary Assignment ID (e.g. SA-2026-00001)
   */
  static async generateSalaryAssignmentId() {
    const currentYear = new Date().getFullYear();
    const prefix = `SA-${currentYear}-`;
    const key = `SALARY_ASSIGNMENT_ID_${currentYear}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Overtime Record ID (e.g. OT-2026-00001)
   */
  static async generateOvertimeId() {
    const currentYear = new Date().getFullYear();
    const prefix = `OT-${currentYear}-`;
    const key = `OVERTIME_ID_${currentYear}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Payroll Run ID (e.g. PRUN-2026-00001)
   */
  static async generatePayrollRunId() {
    const currentYear = new Date().getFullYear();
    const prefix = `PRUN-${currentYear}-`;
    const key = `PAYROLL_RUN_ID_${currentYear}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Payroll Result ID (e.g. PRES-2026-00001)
   */
  static async generatePayrollResultId() {
    const currentYear = new Date().getFullYear();
    const prefix = `PRES-${currentYear}-`;
    const key = `PAYROLL_RESULT_ID_${currentYear}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Payslip Number (e.g. PSL-202610-00001)
   */
  static async generatePayslipNumber(periodCode) {
    const cleanedPeriod = (periodCode || '2026-10').replace(/[^0-9]/g, '');
    const prefix = `PSL-${cleanedPeriod}-`;
    const key = `PAYSLIP_NUM_${cleanedPeriod}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Payroll Query ID (e.g. PQ-2026-00001)
   */
  static async generatePayrollQueryId() {
    const currentYear = new Date().getFullYear();
    const prefix = `PQ-${currentYear}-`;
    const key = `PAYROLL_QUERY_ID_${currentYear}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Payroll Adjustment ID (e.g. PADJ-2026-00001)
   */
  static async generatePayrollAdjustmentId() {
    const currentYear = new Date().getFullYear();
    const prefix = `PADJ-${currentYear}-`;
    const key = `PAYROLL_ADJUSTMENT_ID_${currentYear}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const padded = String(counter.sequenceValue).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Medicine ID (e.g. MED-000101)
   */
  static async generateMedicineId() {
    const key = 'MEDICINE_ID';
    const prefix = 'MED-';

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let seq = counter.sequenceValue;
    if (seq < 101) {
      counter.sequenceValue = 101;
      await counter.save();
      seq = 101;
    }

    const padded = String(seq).padStart(6, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Prescription ID (e.g. RX-20261016-00101)
   */
  static async generatePrescriptionId() {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `RX-${ymd}-`;
    const key = `PRESCRIPTION_ID_${ymd}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let seq = counter.sequenceValue;
    if (seq < 101) {
      counter.sequenceValue = 101;
      await counter.save();
      seq = 101;
    }

    const padded = String(seq).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Pharmacy Order ID (e.g. PO-20261016-00101)
   */
  static async generatePharmacyOrderId() {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PO-${ymd}-`;
    const key = `PHARMACY_ORDER_ID_${ymd}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let seq = counter.sequenceValue;
    if (seq < 101) {
      counter.sequenceValue = 101;
      await counter.save();
      seq = 101;
    }

    const padded = String(seq).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Dispensing Record ID (e.g. DISP-20261016-00101)
   */
  static async generateDispensingRecordId() {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `DISP-${ymd}-`;
    const key = `DISPENSING_RECORD_ID_${ymd}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let seq = counter.sequenceValue;
    if (seq < 101) {
      counter.sequenceValue = 101;
      await counter.save();
      seq = 101;
    }

    const padded = String(seq).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Pharmacy Return ID (e.g. RET-20261016-00101)
   */
  static async generateReturnId() {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `RET-${ymd}-`;
    const key = `PHARMACY_RETURN_ID_${ymd}`;

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let seq = counter.sequenceValue;
    if (seq < 101) {
      counter.sequenceValue = 101;
      await counter.save();
      seq = 101;
    }

    const padded = String(seq).padStart(5, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Generate unique Inventory Batch ID (e.g. BAT-10001)
   */
  static async generateBatchId() {
    const key = 'INVENTORY_BATCH_ID';
    const prefix = 'BAT-';

    let baseSeq = 10001;
    try {
      const InventoryBatch = require('../models/InventoryBatch');
      const lastBatch = await InventoryBatch.findOne({ batchId: /^BAT-\d+$/ })
        .sort({ batchId: -1 })
        .select('batchId')
        .lean();
      if (lastBatch && lastBatch.batchId) {
        const num = parseInt(lastBatch.batchId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) {
          baseSeq = Math.max(baseSeq, num + 1);
        }
      }
    } catch (e) {
      // fallback
    }

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }

    return `${prefix}${seq}`;
  }

  /**
   * Generate unique Inventory Item ID (e.g. INV-000101)
   */
  static async generateInventoryItemId() {
    const key = 'INVENTORY_ITEM_ID';
    const prefix = 'INV-';
    let baseSeq = 101;
    try {
      const InventoryItem = require('../models/InventoryItem');
      const last = await InventoryItem.findOne({ inventoryItemId: /^INV-\d+$/ })
        .sort({ inventoryItemId: -1 })
        .select('inventoryItemId')
        .lean();
      if (last && last.inventoryItemId) {
        const num = parseInt(last.inventoryItemId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generate unique Stock Location ID (e.g. LOC-000101)
   */
  static async generateLocationId(codePrefix = 'LOC') {
    const key = `STOCK_LOCATION_ID_${codePrefix}`;
    let baseSeq = 101;
    try {
      const StockLocation = require('../models/StockLocation');
      const last = await StockLocation.findOne({ locationId: new RegExp(`^${codePrefix}-\\d+$`) })
        .sort({ locationId: -1 })
        .select('locationId')
        .lean();
      if (last && last.locationId) {
        const num = parseInt(last.locationId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${codePrefix}-${String(seq).padStart(4, '0')}`;
  }

  /**
   * Generate unique Stock Movement ID (e.g. MOV-000101)
   */
  static async generateMovementId() {
    const key = 'INVENTORY_MOVEMENT_ID';
    const prefix = 'MOV-';
    let baseSeq = 101;
    try {
      const InventoryMovement = require('../models/InventoryMovement');
      const last = await InventoryMovement.findOne({ movementId: /^MOV-\d+$/ })
        .sort({ movementId: -1 })
        .select('movementId')
        .lean();
      if (last && last.movementId) {
        const num = parseInt(last.movementId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generate unique Reservation ID (e.g. RES-000101)
   */
  static async generateReservationId() {
    const key = 'INVENTORY_RESERVATION_ID';
    const prefix = 'RES-';
    let baseSeq = 101;
    try {
      const InventoryReservation = require('../models/InventoryReservation');
      const last = await InventoryReservation.findOne({ reservationId: /^RES-\d+$/ })
        .sort({ reservationId: -1 })
        .select('reservationId')
        .lean();
      if (last && last.reservationId) {
        const num = parseInt(last.reservationId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generate unique Transfer ID (e.g. TRF-000101)
   */
  static async generateTransferId() {
    const key = 'INVENTORY_TRANSFER_ID';
    const prefix = 'TRF-';
    let baseSeq = 101;
    try {
      const InventoryTransfer = require('../models/InventoryTransfer');
      const last = await InventoryTransfer.findOne({ transferId: /^TRF-\d+$/ })
        .sort({ transferId: -1 })
        .select('transferId')
        .lean();
      if (last && last.transferId) {
        const num = parseInt(last.transferId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generate unique Adjustment ID (e.g. ADJ-000101)
   */
  static async generateAdjustmentId() {
    const key = 'INVENTORY_ADJUSTMENT_ID';
    const prefix = 'ADJ-';
    let baseSeq = 101;
    try {
      const InventoryAdjustment = require('../models/InventoryAdjustment');
      const last = await InventoryAdjustment.findOne({ adjustmentId: /^ADJ-\d+$/ })
        .sort({ adjustmentId: -1 })
        .select('adjustmentId')
        .lean();
      if (last && last.adjustmentId) {
        const num = parseInt(last.adjustmentId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generate unique Stock Count Session ID (e.g. CNT-000101)
   */
  static async generateCountSessionId() {
    const key = 'STOCK_COUNT_SESSION_ID';
    const prefix = 'CNT-';
    let baseSeq = 101;
    try {
      const StockCountSession = require('../models/StockCountSession');
      const last = await StockCountSession.findOne({ countSessionId: /^CNT-\d+$/ })
        .sort({ countSessionId: -1 })
        .select('countSessionId')
        .lean();
      if (last && last.countSessionId) {
        const num = parseInt(last.countSessionId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generate unique Reconciliation ID (e.g. REC-000101)
   */
  static async generateReconciliationId() {
    const key = 'INVENTORY_RECONCILIATION_ID';
    const prefix = 'REC-';
    let baseSeq = 101;
    try {
      const InventoryReconciliation = require('../models/InventoryReconciliation');
      const last = await InventoryReconciliation.findOne({ reconciliationId: /^REC-\d+$/ })
        .sort({ reconciliationId: -1 })
        .select('reconciliationId')
        .lean();
      if (last && last.reconciliationId) {
        const num = parseInt(last.reconciliationId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generate unique Goods Receipt ID (e.g. GRN-000101)
   */
  static async generateGoodsReceiptId() {
    const key = 'GOODS_RECEIPT_ID';
    const prefix = 'GRN-';
    let baseSeq = 101;
    try {
      const GoodsReceipt = require('../models/GoodsReceipt');
      const last = await GoodsReceipt.findOne({ goodsReceiptId: /^GRN-\d+$/ })
        .sort({ goodsReceiptId: -1 })
        .select('goodsReceiptId')
        .lean();
      if (last && last.goodsReceiptId) {
        const num = parseInt(last.goodsReceiptId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generate unique Inventory Alert ID (e.g. ALT-000101)
   */
  static async generateAlertId() {
    const key = 'INVENTORY_ALERT_ID';
    const prefix = 'ALT-';
    let baseSeq = 101;
    try {
      const InventoryAlert = require('../models/InventoryAlert');
      const last = await InventoryAlert.findOne({ alertId: /^ALT-\d+$/ })
        .sort({ alertId: -1 })
        .select('alertId')
        .lean();
      if (last && last.alertId) {
        const num = parseInt(last.alertId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  /**
   * Module 19: Procurement ID Generators
   */
  static async generatePurchaseRequestId() {
    const year = new Date().getFullYear();
    const key = `PURCHASE_REQUEST_ID_${year}`;
    const prefix = `PR-${year}-`;
    let baseSeq = 1;
    try {
      const PurchaseRequest = require('../models/PurchaseRequest');
      const last = await PurchaseRequest.findOne({ purchaseRequestId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ purchaseRequestId: -1 })
        .select('purchaseRequestId')
        .lean();
      if (last && last.purchaseRequestId) {
        const num = parseInt(last.purchaseRequestId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateRfqId() {
    const year = new Date().getFullYear();
    const key = `RFQ_ID_${year}`;
    const prefix = `RFQ-${year}-`;
    let baseSeq = 1;
    try {
      const RFQ = require('../models/RFQ');
      const last = await RFQ.findOne({ rfqId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ rfqId: -1 })
        .select('rfqId')
        .lean();
      if (last && last.rfqId) {
        const num = parseInt(last.rfqId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateQuotationId() {
    const year = new Date().getFullYear();
    const key = `QUOTATION_ID_${year}`;
    const prefix = `QUO-${year}-`;
    let baseSeq = 1;
    try {
      const Quotation = require('../models/Quotation');
      const last = await Quotation.findOne({ quotationId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ quotationId: -1 })
        .select('quotationId')
        .lean();
      if (last && last.quotationId) {
        const num = parseInt(last.quotationId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateComparisonId() {
    const year = new Date().getFullYear();
    const key = `COMPARISON_ID_${year}`;
    const prefix = `CMP-${year}-`;
    let baseSeq = 1;
    try {
      const QuotationComparison = require('../models/QuotationComparison');
      const last = await QuotationComparison.findOne({ comparisonId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ comparisonId: -1 })
        .select('comparisonId')
        .lean();
      if (last && last.comparisonId) {
        const num = parseInt(last.comparisonId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generatePurchaseOrderId() {
    const year = new Date().getFullYear();
    const key = `PURCHASE_ORDER_ID_${year}`;
    const prefix = `PO-${year}-`;
    let baseSeq = 1;
    try {
      const PurchaseOrder = require('../models/PurchaseOrder');
      const last = await PurchaseOrder.findOne({ purchaseOrderId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ purchaseOrderId: -1 })
        .select('purchaseOrderId')
        .lean();
      if (last && last.purchaseOrderId) {
        const num = parseInt(last.purchaseOrderId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generatePoRevisionId() {
    const year = new Date().getFullYear();
    const key = `PO_REVISION_ID_${year}`;
    const prefix = `REV-${year}-`;
    let baseSeq = 1;
    try {
      const PurchaseOrderRevision = require('../models/PurchaseOrderRevision');
      const last = await PurchaseOrderRevision.findOne({ revisionId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ revisionId: -1 })
        .select('revisionId')
        .lean();
      if (last && last.revisionId) {
        const num = parseInt(last.revisionId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateDeliveryId() {
    const year = new Date().getFullYear();
    const key = `DELIVERY_ID_${year}`;
    const prefix = `DEL-${year}-`;
    let baseSeq = 1;
    try {
      const Delivery = require('../models/Delivery');
      const last = await Delivery.findOne({ deliveryId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ deliveryId: -1 })
        .select('deliveryId')
        .lean();
      if (last && last.deliveryId) {
        const num = parseInt(last.deliveryId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateSupplierInvoiceId() {
    const year = new Date().getFullYear();
    const key = `SUPPLIER_INVOICE_ID_${year}`;
    const prefix = `PINV-${year}-`;
    let baseSeq = 1;
    try {
      const SupplierInvoice = require('../models/SupplierInvoice');
      const last = await SupplierInvoice.findOne({ supplierInvoiceId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ supplierInvoiceId: -1 })
        .select('supplierInvoiceId')
        .lean();
      if (last && last.supplierInvoiceId) {
        const num = parseInt(last.supplierInvoiceId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorChangeRequestId() {
    const year = new Date().getFullYear();
    const key = `VENDOR_CHANGE_REQUEST_ID_${year}`;
    const prefix = `VCR-${year}-`;
    let baseSeq = 1;
    try {
      const VendorChangeRequest = require('../models/VendorChangeRequest');
      const last = await VendorChangeRequest.findOne({ changeRequestId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ changeRequestId: -1 })
        .select('changeRequestId')
        .lean();
      if (last && last.changeRequestId) {
        const num = parseInt(last.changeRequestId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorId() {
    const year = new Date().getFullYear();
    const key = `VENDOR_ID_${year}`;
    const prefix = `VEN-${year}-`;
    let baseSeq = 1;
    try {
      const Vendor = require('../models/Vendor');
      const last = await Vendor.findOne({ vendorId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ vendorId: -1 })
        .select('vendorId')
        .lean();
      if (last && last.vendorId) {
        const num = parseInt(last.vendorId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorContactId() {
    const key = `VENDOR_CONTACT_ID`;
    const prefix = `VCNT-`;
    let baseSeq = 1;
    try {
      const VendorContact = require('../models/VendorContact');
      const last = await VendorContact.findOne({ vendorContactId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ vendorContactId: -1 })
        .select('vendorContactId')
        .lean();
      if (last && last.vendorContactId) {
        const num = parseInt(last.vendorContactId.replace(prefix, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorAddressId() {
    const key = `VENDOR_ADDRESS_ID`;
    const prefix = `VADR-`;
    let baseSeq = 1;
    try {
      const VendorAddress = require('../models/VendorAddress');
      const last = await VendorAddress.findOne({ addressId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ addressId: -1 })
        .select('addressId')
        .lean();
      if (last && last.addressId) {
        const num = parseInt(last.addressId.replace(prefix, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorDocumentId() {
    const year = new Date().getFullYear();
    const key = `VENDOR_DOCUMENT_ID_${year}`;
    const prefix = `VDOC-${year}-`;
    let baseSeq = 1;
    try {
      const VendorDocument = require('../models/VendorDocument');
      const last = await VendorDocument.findOne({ vendorDocumentId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ vendorDocumentId: -1 })
        .select('vendorDocumentId')
        .lean();
      if (last && last.vendorDocumentId) {
        const num = parseInt(last.vendorDocumentId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorVerificationId() {
    const year = new Date().getFullYear();
    const key = `VENDOR_VERIFICATION_ID_${year}`;
    const prefix = `VVRF-${year}-`;
    let baseSeq = 1;
    try {
      const VendorVerification = require('../models/VendorVerification');
      const last = await VendorVerification.findOne({ verificationId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ verificationId: -1 })
        .select('verificationId')
        .lean();
      if (last && last.verificationId) {
        const num = parseInt(last.verificationId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorContractId() {
    const year = new Date().getFullYear();
    const key = `VENDOR_CONTRACT_ID_${year}`;
    const prefix = `VCON-${year}-`;
    let baseSeq = 1;
    try {
      const VendorContract = require('../models/VendorContract');
      const last = await VendorContract.findOne({ contractId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ contractId: -1 })
        .select('contractId')
        .lean();
      if (last && last.contractId) {
        const num = parseInt(last.contractId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorReviewId() {
    const year = new Date().getFullYear();
    const key = `VENDOR_REVIEW_ID_${year}`;
    const prefix = `VREV-${year}-`;
    let baseSeq = 1;
    try {
      const VendorPerformanceReview = require('../models/VendorPerformanceReview');
      const last = await VendorPerformanceReview.findOne({ reviewId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ reviewId: -1 })
        .select('reviewId')
        .lean();
      if (last && last.reviewId) {
        const num = parseInt(last.reviewId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorIssueId() {
    const year = new Date().getFullYear();
    const key = `VENDOR_ISSUE_ID_${year}`;
    const prefix = `VISS-${year}-`;
    let baseSeq = 1;
    try {
      const VendorIssue = require('../models/VendorIssue');
      const last = await VendorIssue.findOne({ issueId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ issueId: -1 })
        .select('issueId')
        .lean();
      if (last && last.issueId) {
        const num = parseInt(last.issueId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorCommunicationId() {
    const year = new Date().getFullYear();
    const key = `VENDOR_COMMUNICATION_ID_${year}`;
    const prefix = `VCOM-${year}-`;
    let baseSeq = 1;
    try {
      const VendorCommunication = require('../models/VendorCommunication');
      const last = await VendorCommunication.findOne({ communicationId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ communicationId: -1 })
        .select('communicationId')
        .lean();
      if (last && last.communicationId) {
        const num = parseInt(last.communicationId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateVendorPaymentProfileId() {
    const year = new Date().getFullYear();
    const key = `VENDOR_PAYMENT_PROFILE_ID_${year}`;
    const prefix = `VPRF-${year}-`;
    let baseSeq = 1;
    try {
      const VendorPaymentProfile = require('../models/VendorPaymentProfile');
      const last = await VendorPaymentProfile.findOne({ profileId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ profileId: -1 })
        .select('profileId')
        .lean();
      if (last && last.profileId) {
        const num = parseInt(last.profileId.split('-')[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  /**
   * Module 21: Laboratory Administration ID Generators
   */
  static async generateLabTestId() {
    const key = 'LAB_TEST_ID';
    const prefix = 'LT-';
    let baseSeq = 1001;
    try {
      const LabTest = require('../models/LabTest');
      const last = await LabTest.findOne({ labTestId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ labTestId: -1 })
        .select('labTestId')
        .lean();
      if (last && last.labTestId) {
        const num = parseInt(last.labTestId.replace(/\D/g, ''), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  static async generateLabOrderId() {
    const year = new Date().getFullYear();
    const key = `LAB_ORDER_ID_${year}`;
    const prefix = `LAB-${year}-`;
    let baseSeq = 1;
    try {
      const LabOrder = require('../models/LabOrder');
      const last = await LabOrder.findOne({ orderId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ orderId: -1 })
        .select('orderId')
        .lean();
      if (last && last.orderId) {
        const parts = last.orderId.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateLabOrderItemId() {
    const year = new Date().getFullYear();
    const key = `LAB_ORDER_ITEM_ID_${year}`;
    const prefix = `LOI-${year}-`;
    let baseSeq = 1;
    try {
      const LabOrderItem = require('../models/LabOrderItem');
      const last = await LabOrderItem.findOne({ orderItemId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ orderItemId: -1 })
        .select('orderItemId')
        .lean();
      if (last && last.orderItemId) {
        const parts = last.orderItemId.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateAccessionNumber() {
    const year = new Date().getFullYear();
    const key = `LAB_ACCESSION_NO_${year}`;
    const prefix = `ACC-${year}-`;
    let baseSeq = 1;
    try {
      const LabSample = require('../models/LabSample');
      const last = await LabSample.findOne({ accessionNumber: new RegExp(`^${prefix}\\d+$`) })
        .sort({ accessionNumber: -1 })
        .select('accessionNumber')
        .lean();
      if (last && last.accessionNumber) {
        const parts = last.accessionNumber.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  static async generateLabSampleId() {
    const year = new Date().getFullYear();
    const key = `LAB_SAMPLE_ID_${year}`;
    const prefix = `SMP-${year}-`;
    let baseSeq = 1;
    try {
      const LabSample = require('../models/LabSample');
      const last = await LabSample.findOne({ sampleId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ sampleId: -1 })
        .select('sampleId')
        .lean();
      if (last && last.sampleId) {
        const parts = last.sampleId.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  static async generateLabResultId() {
    const year = new Date().getFullYear();
    const key = `LAB_RESULT_ID_${year}`;
    const prefix = `LRES-${year}-`;
    let baseSeq = 1;
    try {
      const LabResult = require('../models/LabResult');
      const last = await LabResult.findOne({ resultId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ resultId: -1 })
        .select('resultId')
        .lean();
      if (last && last.resultId) {
        const parts = last.resultId.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  static async generateLabReportId() {
    const year = new Date().getFullYear();
    const key = `LAB_REPORT_ID_${year}`;
    const prefix = `LRPT-${year}-`;
    let baseSeq = 1;
    try {
      const LabReport = require('../models/LabReport');
      const last = await LabReport.findOne({ reportId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ reportId: -1 })
        .select('reportId')
        .lean();
      if (last && last.reportId) {
        const parts = last.reportId.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  static async generateLabReportNumber() {
    const year = new Date().getFullYear();
    const key = `LAB_REPORT_NO_${year}`;
    const prefix = `LAB-RPT-${year}-`;
    let baseSeq = 1;
    try {
      const LabReport = require('../models/LabReport');
      const last = await LabReport.findOne({ reportNumber: new RegExp(`^${prefix}\\d+$`) })
        .sort({ reportNumber: -1 })
        .select('reportNumber')
        .lean();
      if (last && last.reportNumber) {
        const parts = last.reportNumber.split('-');
        const num = parseInt(parts[3], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateLabExceptionId() {
    const year = new Date().getFullYear();
    const key = `LAB_EXCEPTION_ID_${year}`;
    const prefix = `LEX-${year}-`;
    let baseSeq = 1;
    try {
      const LabException = require('../models/LabException');
      const last = await LabException.findOne({ exceptionId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ exceptionId: -1 })
        .select('exceptionId')
        .lean();
      if (last && last.exceptionId) {
        const parts = last.exceptionId.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateRadiologyExamId() {
    const key = 'RADIOLOGY_EXAM_ID';
    const prefix = 'RAD-EXM-';
    let baseSeq = 1;
    try {
      const RadiologyExam = require('../models/RadiologyExam');
      const last = await RadiologyExam.findOne({ examId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ examId: -1 })
        .select('examId')
        .lean();
      if (last && last.examId) {
        const parts = last.examId.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateRadiologyModalityId(type = 'RAD') {
    const cleanType = String(type).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'RAD';
    const key = `RADIOLOGY_MODALITY_ID_${cleanType}`;
    const prefix = `MOD-${cleanType}-`;
    let baseSeq = 1;
    try {
      const RadiologyModality = require('../models/RadiologyModality');
      const last = await RadiologyModality.findOne({ modalityId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ modalityId: -1 })
        .select('modalityId')
        .lean();
      if (last && last.modalityId) {
        const parts = last.modalityId.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(2, '0')}`;
  }

  static async generateRadiologyOrderId() {
    const year = new Date().getFullYear();
    const key = `RADIOLOGY_ORDER_ID_${year}`;
    const prefix = `RAD-${year}-`;
    let baseSeq = 1;
    try {
      const RadiologyOrder = require('../models/RadiologyOrder');
      const last = await RadiologyOrder.findOne({ orderId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ orderId: -1 })
        .select('orderId')
        .lean();
      if (last && last.orderId) {
        const parts = last.orderId.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateRadiologyScheduleId() {
    const year = new Date().getFullYear();
    const key = `RADIOLOGY_SCHEDULE_ID_${year}`;
    const prefix = `RAD-SCH-${year}-`;
    let baseSeq = 1;
    try {
      const RadiologySchedule = require('../models/RadiologySchedule');
      const last = await RadiologySchedule.findOne({ scheduleId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ scheduleId: -1 })
        .select('scheduleId')
        .lean();
      if (last && last.scheduleId) {
        const parts = last.scheduleId.split('-');
        const num = parseInt(parts[3], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateRadiologyAccessionNumber() {
    const year = new Date().getFullYear();
    const key = `RADIOLOGY_ACCESSION_NO_${year}`;
    const prefix = `RAD-ACC-${year}-`;
    let baseSeq = 1;
    try {
      const RadiologyStudy = require('../models/RadiologyStudy');
      const last = await RadiologyStudy.findOne({ accessionNumber: new RegExp(`^${prefix}\\d+$`) })
        .sort({ accessionNumber: -1 })
        .select('accessionNumber')
        .lean();
      if (last && last.accessionNumber) {
        const parts = last.accessionNumber.split('-');
        const num = parseInt(parts[3], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  static async generateRadiologyStudyId() {
    const year = new Date().getFullYear();
    const key = `RADIOLOGY_STUDY_ID_${year}`;
    const prefix = `RAD-STD-${year}-`;
    let baseSeq = 1;
    try {
      const RadiologyStudy = require('../models/RadiologyStudy');
      const last = await RadiologyStudy.findOne({ studyId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ studyId: -1 })
        .select('studyId')
        .lean();
      if (last && last.studyId) {
        const parts = last.studyId.split('-');
        const num = parseInt(parts[3], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateRadiologyReportNumber() {
    const year = new Date().getFullYear();
    const key = `RADIOLOGY_REPORT_NO_${year}`;
    const prefix = `RAD-RPT-${year}-`;
    let baseSeq = 1;
    try {
      const RadiologyReport = require('../models/RadiologyReport');
      const last = await RadiologyReport.findOne({ reportNumber: new RegExp(`^${prefix}\\d+$`) })
        .sort({ reportNumber: -1 })
        .select('reportNumber')
        .lean();
      if (last && last.reportNumber) {
        const parts = last.reportNumber.split('-');
        const num = parseInt(parts[3], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  static async generateRadiologyExceptionId() {
    const year = new Date().getFullYear();
    const key = `RADIOLOGY_EXCEPTION_ID_${year}`;
    const prefix = `RAD-EXP-${year}-`;
    let baseSeq = 1;
    try {
      const RadiologyException = require('../models/RadiologyException');
      const last = await RadiologyException.findOne({ exceptionId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ exceptionId: -1 })
        .select('exceptionId')
        .lean();
      if (last && last.exceptionId) {
        const parts = last.exceptionId.split('-');
        const num = parseInt(parts[3], 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let seq = counter.sequenceValue;
    if (seq < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
      seq = baseSeq;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  /**
   * Generate unique Housekeeping Area ID (e.g. AREA-20261017-00101)
   */
  static async generateHousekeepingAreaId() {
    const HousekeepingArea = require('../models/HousekeepingArea');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `HOUSEKEEPING_AREA_ID_${ymd}`;
    const prefix = `AREA-${ymd}-`;

    let baseSeq = 101;
    try {
      const last = await HousekeepingArea.findOne({ areaId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ areaId: -1 })
        .select('areaId')
        .lean();
      if (last && last.areaId) {
        const num = parseInt(last.areaId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Housekeeping Schedule ID (e.g. SCH-HK-00101)
   */
  static async generateHousekeepingScheduleId() {
    const HousekeepingSchedule = require('../models/HousekeepingSchedule');
    const key = `HOUSEKEEPING_SCHEDULE_ID`;
    const prefix = `SCH-HK-`;

    let baseSeq = 101;
    try {
      const last = await HousekeepingSchedule.findOne({ scheduleId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ scheduleId: -1 })
        .select('scheduleId')
        .lean();
      if (last && last.scheduleId) {
        const num = parseInt(last.scheduleId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Housekeeping Checklist ID (e.g. CHK-HK-00101)
   */
  static async generateHousekeepingChecklistId() {
    const HousekeepingChecklist = require('../models/HousekeepingChecklist');
    const key = `HOUSEKEEPING_CHECKLIST_ID`;
    const prefix = `CHK-HK-`;

    let baseSeq = 101;
    try {
      const last = await HousekeepingChecklist.findOne({ checklistId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ checklistId: -1 })
        .select('checklistId')
        .lean();
      if (last && last.checklistId) {
        const num = parseInt(last.checklistId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Housekeeping Inspection ID (e.g. INSP-HK-20261017-00101)
   */
  static async generateHousekeepingInspectionId() {
    const HousekeepingInspection = require('../models/HousekeepingInspection');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `HOUSEKEEPING_INSPECTION_ID_${ymd}`;
    const prefix = `INSP-HK-${ymd}-`;

    let baseSeq = 101;
    try {
      const last = await HousekeepingInspection.findOne({ inspectionId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ inspectionId: -1 })
        .select('inspectionId')
        .lean();
      if (last && last.inspectionId) {
        const num = parseInt(last.inspectionId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Housekeeping Supply Request ID (e.g. HSR-20261017-00101)
   */
  static async generateHousekeepingSupplyRequestId() {
    const HousekeepingSupplyRequest = require('../models/HousekeepingSupplyRequest');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `HOUSEKEEPING_SUPPLY_REQ_ID_${ymd}`;
    const prefix = `HSR-${ymd}-`;

    let baseSeq = 101;
    try {
      const last = await HousekeepingSupplyRequest.findOne({ requestId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ requestId: -1 })
        .select('requestId')
        .lean();
      if (last && last.requestId) {
        const num = parseInt(last.requestId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Housekeeping Exception ID (e.g. HK-EX-20261017-00101)
   */
  static async generateHousekeepingExceptionId() {
    const HousekeepingException = require('../models/HousekeepingException');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `HOUSEKEEPING_EXCEPTION_ID_${ymd}`;
    const prefix = `HK-EX-${ymd}-`;

    let baseSeq = 101;
    try {
      const last = await HousekeepingException.findOne({ exceptionId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ exceptionId: -1 })
        .select('exceptionId')
        .lean();
      if (last && last.exceptionId) {
        const num = parseInt(last.exceptionId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Asset ID (e.g. AST-00001)
   */
  static async generateAssetId() {
    const Asset = require('../models/Asset');
    const key = 'MAINTENANCE_ASSET_ID';
    const prefix = 'AST-';
    let baseSeq = 10001;
    try {
      const last = await Asset.findOne({ assetId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ assetId: -1 })
        .select('assetId')
        .lean();
      if (last && last.assetId) {
        const num = parseInt(last.assetId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Asset Tag (e.g. AST-MED-000001, AST-FAC-000001, AST-IT-000001)
   */
  static async generateAssetTag(categoryCode = 'MED') {
    const Asset = require('../models/Asset');
    const cleanCat = String(categoryCode || 'GEN').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'MED';
    const key = `ASSET_TAG_${cleanCat}`;
    const prefix = `AST-${cleanCat}-`;
    let baseSeq = 100001;
    try {
      const last = await Asset.findOne({ assetTag: new RegExp(`^${prefix}\\d+$`) })
        .sort({ assetTag: -1 })
        .select('assetTag')
        .lean();
      if (last && last.assetTag) {
        const num = parseInt(last.assetTag.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Maintenance Request ID (e.g. REQ-MNT-20261017-00101)
   */
  static async generateMaintenanceRequestId() {
    const MaintenanceRequest = require('../models/MaintenanceRequest');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `MAINT_REQUEST_ID_${ymd}`;
    const prefix = `REQ-MNT-${ymd}-`;
    let baseSeq = 101;
    try {
      const last = await MaintenanceRequest.findOne({ requestId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ requestId: -1 })
        .select('requestId')
        .lean();
      if (last && last.requestId) {
        const num = parseInt(last.requestId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Maintenance Work Order ID (e.g. WO-2026-000101 or PM-WO-2026-000101)
   */
  static async generateMaintenanceWorkOrderId(isPM = false) {
    const MaintenanceWorkOrder = require('../models/MaintenanceWorkOrder');
    const year = new Date().getFullYear();
    const tag = isPM ? 'PM-WO' : 'WO';
    const key = `MAINT_WORK_ORDER_ID_${tag}_${year}`;
    const prefix = `${tag}-${year}-`;
    let baseSeq = 101;
    try {
      const last = await MaintenanceWorkOrder.findOne({ workOrderId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ workOrderId: -1 })
        .select('workOrderId')
        .lean();
      if (last && last.workOrderId) {
        const num = parseInt(last.workOrderId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Preventive Maintenance Plan ID (e.g. PMP-00101)
   */
  static async generatePreventivePlanId() {
    const PreventiveMaintenancePlan = require('../models/PreventiveMaintenancePlan');
    const key = 'PREVENTIVE_PLAN_ID';
    const prefix = 'PMP-';
    let baseSeq = 101;
    try {
      const last = await PreventiveMaintenancePlan.findOne({ planId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ planId: -1 })
        .select('planId')
        .lean();
      if (last && last.planId) {
        const num = parseInt(last.planId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Maintenance Checklist ID (e.g. CHK-MNT-00101)
   */
  static async generateMaintenanceChecklistId() {
    const MaintenanceChecklist = require('../models/MaintenanceChecklist');
    const key = 'MAINT_CHECKLIST_ID';
    const prefix = 'CHK-MNT-';
    let baseSeq = 101;
    try {
      const last = await MaintenanceChecklist.findOne({ checklistId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ checklistId: -1 })
        .select('checklistId')
        .lean();
      if (last && last.checklistId) {
        const num = parseInt(last.checklistId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Maintenance Part Request ID (e.g. PR-MNT-20261017-00101)
   */
  static async generateMaintenancePartRequestId() {
    const MaintenancePartRequest = require('../models/MaintenancePartRequest');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `MAINT_PART_REQ_ID_${ymd}`;
    const prefix = `PR-MNT-${ymd}-`;
    let baseSeq = 101;
    try {
      const last = await MaintenancePartRequest.findOne({ requestId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ requestId: -1 })
        .select('requestId')
        .lean();
      if (last && last.requestId) {
        const num = parseInt(last.requestId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Maintenance Contract ID (e.g. AMC-2026-00101)
   */
  static async generateMaintenanceContractId() {
    const MaintenanceContract = require('../models/MaintenanceContract');
    const year = new Date().getFullYear();
    const key = `MAINT_CONTRACT_ID_${year}`;
    const prefix = `AMC-${year}-`;
    let baseSeq = 101;
    try {
      const last = await MaintenanceContract.findOne({ contractId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ contractId: -1 })
        .select('contractId')
        .lean();
      if (last && last.contractId) {
        const num = parseInt(last.contractId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Asset Calibration ID (e.g. CAL-2026-00101)
   */
  static async generateAssetCalibrationId() {
    const AssetCalibrationRecord = require('../models/AssetCalibrationRecord');
    const year = new Date().getFullYear();
    const key = `ASSET_CALIBRATION_ID_${year}`;
    const prefix = `CAL-${year}-`;
    let baseSeq = 101;
    try {
      const last = await AssetCalibrationRecord.findOne({ calibrationId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ calibrationId: -1 })
        .select('calibrationId')
        .lean();
      if (last && last.calibrationId) {
        const num = parseInt(last.calibrationId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Maintenance Exception ID (e.g. EX-MNT-20261017-00101)
   */
  static async generateMaintenanceExceptionId() {
    const MaintenanceException = require('../models/MaintenanceException');
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const key = `MAINT_EXCEPTION_ID_${ymd}`;
    const prefix = `EX-MNT-${ymd}-`;
    let baseSeq = 101;
    try {
      const last = await MaintenanceException.findOne({ exceptionId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ exceptionId: -1 })
        .select('exceptionId')
        .lean();
      if (last && last.exceptionId) {
        const num = parseInt(last.exceptionId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate unique Feedback ID (FB-YYYY-NNNNNN, e.g. FB-2026-000001)
   */
  static async generateFeedbackId() {
    const Feedback = require('../models/Feedback');
    const now = new Date();
    const year = now.getFullYear();
    const key = `FEEDBACK_ID_${year}`;
    const prefix = `FB-${year}-`;
    let baseSeq = 1;

    try {
      const last = await Feedback.findOne({ feedbackId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ feedbackId: -1 })
        .select('feedbackId')
        .lean();
      if (last && last.feedbackId) {
        const num = parseInt(last.feedbackId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Investigation ID (e.g. INV-FB-2026-000001)
   */
  static async generateInvestigationId() {
    const FeedbackInvestigation = require('../models/FeedbackInvestigation');
    const now = new Date();
    const year = now.getFullYear();
    const key = `FEEDBACK_INV_ID_${year}`;
    const prefix = `INV-FB-${year}-`;
    let baseSeq = 1;

    try {
      const last = await FeedbackInvestigation.findOne({ investigationId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ investigationId: -1 })
        .select('investigationId')
        .lean();
      if (last && last.investigationId) {
        const num = parseInt(last.investigationId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Internal Note ID (e.g. NOTE-FB-2026-000001)
   */
  static async generateFeedbackNoteId() {
    const FeedbackInternalNote = require('../models/FeedbackInternalNote');
    const now = new Date();
    const year = now.getFullYear();
    const key = `FEEDBACK_NOTE_ID_${year}`;
    const prefix = `NOTE-FB-${year}-`;
    let baseSeq = 1;

    try {
      const last = await FeedbackInternalNote.findOne({ noteId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ noteId: -1 })
        .select('noteId')
        .lean();
      if (last && last.noteId) {
        const num = parseInt(last.noteId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Feedback Assignment ID (e.g. ASGN-FB-2026-000001)
   */
  static async generateAssignmentId() {
    const FeedbackAssignmentHistory = require('../models/FeedbackAssignmentHistory');
    const now = new Date();
    const year = now.getFullYear();
    const key = `FEEDBACK_ASGN_ID_${year}`;
    const prefix = `ASGN-FB-${year}-`;
    let baseSeq = 1;

    try {
      const last = await FeedbackAssignmentHistory.findOne({ assignmentId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ assignmentId: -1 })
        .select('assignmentId')
        .lean();
      if (last && last.assignmentId) {
        const num = parseInt(last.assignmentId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Feedback SLA ID (e.g. SLA-FB-2026-000001)
   */
  static async generateFeedbackSlaId() {
    const FeedbackSLA = require('../models/FeedbackSLA');
    const now = new Date();
    const year = now.getFullYear();
    const key = `FEEDBACK_SLA_ID_${year}`;
    const prefix = `SLA-FB-${year}-`;
    let baseSeq = 1;

    try {
      const last = await FeedbackSLA.findOne({ slaId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ slaId: -1 })
        .select('slaId')
        .lean();
      if (last && last.slaId) {
        const num = parseInt(last.slaId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Notification ID (e.g. NTF-2026-000001)
   */
  static async generateNotificationId() {
    const Notification = require('../models/Notification');
    const now = new Date();
    const year = now.getFullYear();
    const key = `NOTIFICATION_ID_${year}`;
    const prefix = `NTF-${year}-`;
    let baseSeq = 1;

    try {
      const last = await Notification.findOne({ notificationId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ notificationId: -1 })
        .select('notificationId')
        .lean();
      if (last && last.notificationId) {
        const num = parseInt(last.notificationId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Notification Delivery ID (e.g. DLV-2026-000001)
   */
  static async generateNotificationDeliveryId() {
    const NotificationDelivery = require('../models/NotificationDelivery');
    const now = new Date();
    const year = now.getFullYear();
    const key = `NOTIFICATION_DELIVERY_ID_${year}`;
    const prefix = `DLV-${year}-`;
    let baseSeq = 1;

    try {
      const last = await NotificationDelivery.findOne({ deliveryId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ deliveryId: -1 })
        .select('deliveryId')
        .lean();
      if (last && last.deliveryId) {
        const num = parseInt(last.deliveryId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Notification Event ID (e.g. EVT-2026-000001)
   */
  static async generateNotificationEventId() {
    const NotificationEvent = require('../models/NotificationEvent');
    const now = new Date();
    const year = now.getFullYear();
    const key = `NOTIFICATION_EVENT_ID_${year}`;
    const prefix = `EVT-${year}-`;
    let baseSeq = 1;

    try {
      const last = await NotificationEvent.findOne({ eventId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ eventId: -1 })
        .select('eventId')
        .lean();
      if (last && last.eventId) {
        const num = parseInt(last.eventId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Notification Campaign ID (e.g. CMP-2026-000001)
   */
  static async generateNotificationCampaignId() {
    const NotificationCampaign = require('../models/NotificationCampaign');
    const now = new Date();
    const year = now.getFullYear();
    const key = `NOTIFICATION_CAMPAIGN_ID_${year}`;
    const prefix = `CMP-${year}-`;
    let baseSeq = 1;

    try {
      const last = await NotificationCampaign.findOne({ campaignId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ campaignId: -1 })
        .select('campaignId')
        .lean();
      if (last && last.campaignId) {
        const num = parseInt(last.campaignId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Document ID (e.g. DOC-2026-000001) (Module 27 Section 9)
   */
  static async generateDocumentId() {
    const GeneratedDocument = require('../models/GeneratedDocument');
    const now = new Date();
    const year = now.getFullYear();
    const key = `DOCUMENT_ID_${year}`;
    const prefix = `DOC-${year}-`;
    let baseSeq = 1;

    try {
      const last = await GeneratedDocument.findOne({ documentId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ documentId: -1 })
        .select('documentId')
        .lean();
      if (last && last.documentId) {
        const num = parseInt(last.documentId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Document Package ID (e.g. PKG-2026-000001) (Module 27 Section 59)
   */
  static async generateDocumentPackageId() {
    const DocumentPackage = require('../models/DocumentPackage');
    const now = new Date();
    const year = now.getFullYear();
    const key = `DOCUMENT_PACKAGE_ID_${year}`;
    const prefix = `PKG-${year}-`;
    let baseSeq = 1;

    try {
      const last = await DocumentPackage.findOne({ packageId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ packageId: -1 })
        .select('packageId')
        .lean();
      if (last && last.packageId) {
        const num = parseInt(last.packageId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Template ID (e.g. TPL-2026-000001)
   */
  static async generateTemplateId() {
    const DocumentTemplate = require('../models/DocumentTemplate');
    const now = new Date();
    const year = now.getFullYear();
    const key = `DOCUMENT_TEMPLATE_ID_${year}`;
    const prefix = `TPL-${year}-`;
    let baseSeq = 1;

    try {
      const last = await DocumentTemplate.findOne({ templateId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ templateId: -1 })
        .select('templateId')
        .lean();
      if (last && last.templateId) {
        const num = parseInt(last.templateId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Report Execution ID (e.g. EXEC-2026-000001) (Module 28 Section 8)
   */
  static async generateReportExecutionId() {
    const ReportExecution = require('../models/ReportExecution');
    const now = new Date();
    const year = now.getFullYear();
    const key = `REPORT_EXECUTION_ID_${year}`;
    const prefix = `EXEC-${year}-`;
    let baseSeq = 1;

    try {
      const last = await ReportExecution.findOne({ executionId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ executionId: -1 })
        .select('executionId')
        .lean();
      if (last && last.executionId) {
        const num = parseInt(last.executionId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Report Definition ID (e.g. RPT-2026-000001) (Module 28 Section 7)
   */
  static async generateReportDefinitionId() {
    const ReportDefinition = require('../models/ReportDefinition');
    const now = new Date();
    const year = now.getFullYear();
    const key = `REPORT_DEFINITION_ID_${year}`;
    const prefix = `RPT-${year}-`;
    let baseSeq = 1;

    try {
      const last = await ReportDefinition.findOne({ reportId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ reportId: -1 })
        .select('reportId')
        .lean();
      if (last && last.reportId) {
        const num = parseInt(last.reportId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Report Schedule ID (e.g. SCHED-2026-000001)
   */
  static async generateReportScheduleId() {
    const ReportSchedule = require('../models/ReportSchedule');
    const now = new Date();
    const year = now.getFullYear();
    const key = `REPORT_SCHEDULE_ID_${year}`;
    const prefix = `SCHED-${year}-`;
    let baseSeq = 1;

    try {
      const last = await ReportSchedule.findOne({ scheduleId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ scheduleId: -1 })
        .select('scheduleId')
        .lean();
      if (last && last.scheduleId) {
        const num = parseInt(last.scheduleId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }

  /**
   * Generate unique Analytics Alert Rule ID (e.g. RULE-2026-000001)
   */
  static async generateAnalyticsAlertRuleId() {
    const AnalyticsAlertRule = require('../models/AnalyticsAlertRule');
    const now = new Date();
    const year = now.getFullYear();
    const key = `ANALYTICS_ALERT_RULE_ID_${year}`;
    const prefix = `RULE-${year}-`;
    let baseSeq = 1;

    try {
      const last = await AnalyticsAlertRule.findOne({ ruleId: new RegExp(`^${prefix}\\d+$`) })
        .sort({ ruleId: -1 })
        .select('ruleId')
        .lean();
      if (last && last.ruleId) {
        const num = parseInt(last.ruleId.substring(prefix.length), 10);
        if (!isNaN(num)) baseSeq = Math.max(baseSeq, num + 1);
      }
    } catch (e) {}

    const counter = await SequenceCounter.findOneAndUpdate(
      { key },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (counter.sequenceValue < baseSeq) {
      counter.sequenceValue = baseSeq;
      await counter.save();
    }
    return `${prefix}${String(counter.sequenceValue).padStart(6, '0')}`;
  }
}

module.exports = IdGeneratorService;



