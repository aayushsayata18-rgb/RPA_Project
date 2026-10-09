const Patient = require('../models/Patient');
const Admission = require('../models/Admission');
const Discharge = require('../models/Discharge');
const ExceptionService = require('./ExceptionService');

class DischargeValidationService {
  /**
   * Validate patient and admission for discharge processing
   */
  static async validatePatientAndAdmission({ patientId, admissionId, correlationId, actorUser }) {
    // 1. Validate Patient exists
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      await ExceptionService.createException({
        code: 'PATIENT_NOT_FOUND',
        module: 'DISCHARGE',
        severity: 'HIGH',
        message: `Patient ${patientId} not found in system for discharge processing.`,
        referenceType: 'Patient',
        referenceId: patientId,
        correlationId,
        reportedBy: actorUser?.userId || 'SYSTEM'
      });
      return {
        isValid: false,
        errorCode: 'PATIENT_NOT_FOUND',
        message: `Patient with ID ${patientId} not found.`
      };
    }

    // 2. Validate Admission exists
    const admission = await Admission.findOne({ admissionId });
    if (!admission) {
      await ExceptionService.createException({
        code: 'ADMISSION_NOT_FOUND',
        module: 'DISCHARGE',
        severity: 'HIGH',
        message: `Admission ${admissionId} not found in system for discharge processing.`,
        referenceType: 'Admission',
        referenceId: admissionId,
        correlationId,
        reportedBy: actorUser?.userId || 'SYSTEM'
      });
      return {
        isValid: false,
        errorCode: 'ADMISSION_NOT_FOUND',
        message: `Admission with ID ${admissionId} not found.`
      };
    }

    // 3. Validate Admission belongs to Patient
    if (admission.patientId !== patientId) {
      await ExceptionService.createException({
        code: 'DISCHARGE_IDENTITY_MISMATCH',
        module: 'DISCHARGE',
        severity: 'CRITICAL',
        message: `Admission ${admissionId} patient mismatch: expected ${patientId}, got ${admission.patientId}.`,
        referenceType: 'Admission',
        referenceId: admissionId,
        correlationId,
        reportedBy: actorUser?.userId || 'SYSTEM'
      });
      return {
        isValid: false,
        errorCode: 'DISCHARGE_IDENTITY_MISMATCH',
        message: `Admission ${admissionId} does not belong to patient ${patientId}.`
      };
    }

    // 4. Validate Admission status
    if (admission.status === 'DISCHARGED') {
      return {
        isValid: false,
        errorCode: 'DISCHARGE_ALREADY_COMPLETED',
        message: `Admission ${admissionId} has already been discharged.`
      };
    }

    if (admission.status === 'CANCELLED') {
      return {
        isValid: false,
        errorCode: 'ADMISSION_CANCELLED',
        message: `Admission ${admissionId} is marked as CANCELLED.`
      };
    }

    // 5. Check for active duplicate discharge
    const existingActiveDischarge = await Discharge.findOne({
      admissionId,
      status: { $nin: ['CANCELLED', 'COMPLETED'] }
    });

    if (existingActiveDischarge) {
      return {
        isValid: false,
        errorCode: 'DISCHARGE_ALREADY_EXISTS',
        message: `An active discharge record (${existingActiveDischarge.dischargeNumber}) already exists for admission ${admissionId}.`,
        existingDischarge: existingActiveDischarge
      };
    }

    return {
      isValid: true,
      patient,
      admission
    };
  }
}

module.exports = DischargeValidationService;
