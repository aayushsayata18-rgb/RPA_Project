const Doctor = require('../models/Doctor');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class DoctorCredentialService {
  /**
   * Calculate registration status based on expiryDate and threshold
   * @param {Date} expiryDate
   * @param {number} warningDays - Default 30 days
   */
  static evaluateRegistrationStatus(expiryDate, warningDays = 30) {
    if (!expiryDate) return 'VALID';
    const now = new Date();
    const exp = new Date(expiryDate);

    if (exp < now) {
      return 'EXPIRED';
    }

    const diffMs = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= warningDays) {
      return 'EXPIRING_SOON';
    }

    return 'VALID';
  }

  /**
   * Add qualification to doctor profile
   */
  static async addQualification(doctorId, qualificationData, user = {}) {
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const newQual = {
      qualification: qualificationData.qualification,
      institution: qualificationData.institution || '',
      year: qualificationData.year || null,
      verificationStatus: qualificationData.verificationStatus || 'PENDING_VERIFICATION',
      documentUrl: qualificationData.documentUrl || ''
    };

    doctor.qualifications.push(newQual);
    await doctor.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'HR_MANAGER',
      action: 'DOCTOR_QUALIFICATION_UPDATED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctorId,
      details: `Added qualification: ${newQual.qualification} from ${newQual.institution || 'Unknown'}`
    });

    return doctor;
  }

  /**
   * Update existing qualification
   */
  static async updateQualification(doctorId, qualificationId, updateData, user = {}) {
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const qual = doctor.qualifications.id(qualificationId);
    if (!qual) throw new Error(`Qualification ${qualificationId} not found.`);

    if (updateData.qualification !== undefined) qual.qualification = updateData.qualification;
    if (updateData.institution !== undefined) qual.institution = updateData.institution;
    if (updateData.year !== undefined) qual.year = updateData.year;
    if (updateData.verificationStatus !== undefined) qual.verificationStatus = updateData.verificationStatus;
    if (updateData.documentUrl !== undefined) qual.documentUrl = updateData.documentUrl;

    await doctor.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'HR_MANAGER',
      action: 'DOCTOR_QUALIFICATION_UPDATED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctorId,
      details: `Updated qualification: ${qual.qualification}`
    });

    return doctor;
  }

  /**
   * Add professional registration details
   */
  static async addRegistration(doctorId, regData, user = {}) {
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const status = this.evaluateRegistrationStatus(regData.expiryDate);

    const newReg = {
      registrationNumber: regData.registrationNumber,
      registrationAuthority: regData.registrationAuthority,
      issueDate: regData.issueDate || null,
      expiryDate: regData.expiryDate || null,
      status: regData.status || status,
      documentUrl: regData.documentUrl || ''
    };

    doctor.registrationDetails.push(newReg);
    await doctor.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'HR_MANAGER',
      action: 'DOCTOR_REGISTRATION_UPDATED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctorId,
      details: `Added registration: ${newReg.registrationNumber} (${newReg.registrationAuthority}), Status: ${newReg.status}`
    });

    return doctor;
  }

  /**
   * Update professional registration details
   */
  static async updateRegistration(doctorId, registrationId, updateData, user = {}) {
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const reg = doctor.registrationDetails.id(registrationId);
    if (!reg) throw new Error(`Registration record ${registrationId} not found.`);

    if (updateData.registrationNumber !== undefined) reg.registrationNumber = updateData.registrationNumber;
    if (updateData.registrationAuthority !== undefined) reg.registrationAuthority = updateData.registrationAuthority;
    if (updateData.issueDate !== undefined) reg.issueDate = updateData.issueDate;
    if (updateData.expiryDate !== undefined) reg.expiryDate = updateData.expiryDate;
    if (updateData.documentUrl !== undefined) reg.documentUrl = updateData.documentUrl;

    reg.status = updateData.status || this.evaluateRegistrationStatus(reg.expiryDate);

    await doctor.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'HR_MANAGER',
      action: 'DOCTOR_REGISTRATION_UPDATED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctorId,
      details: `Updated registration: ${reg.registrationNumber}, Status: ${reg.status}`
    });

    return doctor;
  }

  /**
   * Scan all doctors for upcoming credential expirations (Section 45 & 78)
   */
  static async getExpiringCredentials(warningDays = 30) {
    const doctors = await Doctor.find({ status: { $in: ['ACTIVE', 'PENDING_APPROVAL', 'ON_LEAVE'] } }).lean();
    const alerts = [];

    const now = new Date();

    for (const doc of doctors) {
      if (doc.registrationDetails && doc.registrationDetails.length > 0) {
        for (const reg of doc.registrationDetails) {
          if (reg.expiryDate) {
            const exp = new Date(reg.expiryDate);
            const diffMs = exp.getTime() - now.getTime();
            const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (daysRemaining <= warningDays) {
              const status = daysRemaining < 0 ? 'EXPIRED' : 'EXPIRING_SOON';
              alerts.push({
                doctorId: doc.doctorId,
                doctorName: doc.displayName || doc.fullName,
                departmentName: doc.departmentName,
                registrationNumber: reg.registrationNumber,
                registrationAuthority: reg.registrationAuthority,
                expiryDate: reg.expiryDate,
                daysRemaining,
                status
              });
            }
          }
        }
      }
    }

    return alerts;
  }
}

module.exports = DoctorCredentialService;
