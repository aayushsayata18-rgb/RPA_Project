const Patient = require('../models/Patient');
const Admission = require('../models/Admission');
const ExceptionService = require('./ExceptionService');

class DischargeInsuranceService {
  /**
   * Verify patient insurance coverage and authorization for discharge
   */
  static async getInsuranceStatus({ patientId, admissionId, correlationId, actorUser }) {
    const patient = await Patient.findOne({ patientId }).lean();
    const admission = await Admission.findOne({ admissionId }).lean();

    let insuranceStatus = 'NOT_APPLICABLE';
    let coveredAmount = 0;
    let policyDetails = null;

    if (admission?.insuranceStatus && admission.insuranceStatus !== 'NOT_APPLICABLE') {
      insuranceStatus = admission.insuranceStatus;
      policyDetails = admission.insuranceDetails || null;
    } else if (patient?.insurance && patient.insurance.provider) {
      insuranceStatus = patient.insurance.isVerified ? 'VERIFIED' : 'PENDING';
      policyDetails = patient.insurance;
    }

    if (insuranceStatus === 'PENDING' || insuranceStatus === 'UNDER_REVIEW') {
      await ExceptionService.createException({
        code: 'INSURANCE_PENDING',
        module: 'DISCHARGE_INSURANCE',
        severity: 'MEDIUM',
        message: `Insurance authorization is still under review/pending for admission ${admissionId}.`,
        referenceType: 'Admission',
        referenceId: admissionId,
        correlationId,
        reportedBy: actorUser?.userId || 'SYSTEM'
      });
    }

    if (insuranceStatus === 'VERIFIED' || insuranceStatus === 'APPROVED') {
      coveredAmount = policyDetails?.approvedAmount || policyDetails?.coverageAmount || 0;
    }

    return {
      insuranceStatus,
      policyDetails,
      coveredAmount,
      isApproved: insuranceStatus === 'VERIFIED' || insuranceStatus === 'APPROVED' || insuranceStatus === 'NOT_APPLICABLE'
    };
  }

  /**
   * Verify insurance for discharge workflow
   */
  static async verifyDischargeInsurance({ dischargeId, admissionId, actorUser, correlationId }) {
    const Admission = require('../models/Admission');
    const admission = await Admission.findOne({ admissionId });
    const patientId = admission?.patientId;
    const status = await this.getInsuranceStatus({ patientId, admissionId, correlationId, actorUser });
    return {
      success: true,
      dischargeId,
      admissionId,
      ...status
    };
  }
}

module.exports = DischargeInsuranceService;
