const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const DoctorSchedule = require('../models/DoctorSchedule');
const DoctorAvailability = require('../models/DoctorAvailability');
const DoctorExternalSync = require('../models/DoctorExternalSync');
const Appointment = require('../models/Appointment');
const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');
const DoctorCredentialService = require('./doctorCredentialService');

class DoctorService {
  /**
   * Generate next sequential doctorId (e.g. DOC10001)
   */
  static async generateDoctorId() {
    const lastDoc = await Doctor.findOne({ doctorId: /^DOC\d+/ })
      .sort({ doctorId: -1 })
      .select('doctorId')
      .lean();

    if (!lastDoc || !lastDoc.doctorId) {
      return 'DOC10001';
    }

    const numPart = parseInt(lastDoc.doctorId.replace('DOC', ''), 10);
    if (isNaN(numPart)) {
      return `DOC${Date.now().toString().slice(-5)}`;
    }

    return `DOC${numPart + 1}`;
  }

  /**
   * Create new Doctor profile (Section 14)
   */
  static async createDoctor(doctorData, user = {}) {
    const doctorId = doctorData.doctorId || (await this.generateDoctorId());

    // Check duplicate
    const existing = await Doctor.findOne({
      $or: [{ doctorId }, { email: doctorData.email.toLowerCase() }]
    });
    if (existing) {
      const err = new Error(
        existing.doctorId === doctorId
          ? `Doctor ID ${doctorId} already exists.`
          : `Doctor with email ${doctorData.email} already exists.`
      );
      err.status = 400;
      err.errorCode = 'DUPLICATE_DOCTOR';
      throw err;
    }

    // Prepare departments array
    let departments = doctorData.departments || [];
    if (departments.length === 0 && doctorData.departmentId) {
      departments.push({
        departmentId: doctorData.departmentId,
        departmentName: doctorData.departmentName || '',
        isPrimary: true,
        startDate: new Date(),
        status: 'ACTIVE'
      });
    }

    // Prepare specializations array
    let specializations = doctorData.specializations || [];
    if (specializations.length === 0 && doctorData.specialty) {
      specializations.push({
        name: doctorData.specialty,
        primary: true
      });
    }

    // Prepare registrations
    let registrationDetails = doctorData.registrationDetails || [];
    if (doctorData.registrationNumber) {
      registrationDetails.push({
        registrationNumber: doctorData.registrationNumber,
        registrationAuthority: doctorData.registrationAuthority || 'National Medical Commission',
        issueDate: doctorData.registrationIssueDate || null,
        expiryDate: doctorData.registrationExpiryDate || null,
        status: DoctorCredentialService.evaluateRegistrationStatus(doctorData.registrationExpiryDate)
      });
    }

    const initialStatus = doctorData.status || 'PENDING_APPROVAL';

    const doctor = new Doctor({
      doctorId,
      userId: doctorData.userId || null,
      employeeId: doctorData.employeeId || null,
      title: doctorData.title || 'Dr.',
      firstName: doctorData.firstName,
      middleName: doctorData.middleName || '',
      lastName: doctorData.lastName,
      displayName: doctorData.displayName || `${doctorData.title || 'Dr.'} ${doctorData.firstName} ${doctorData.lastName}`.trim(),
      gender: doctorData.gender || 'PREFER_NOT_TO_SAY',
      dateOfBirth: doctorData.dateOfBirth ? new Date(doctorData.dateOfBirth) : null,
      phone: doctorData.phone || doctorData.contactNumber || '',
      contactNumber: doctorData.phone || doctorData.contactNumber || '',
      email: doctorData.email.toLowerCase(),
      alternatePhone: doctorData.alternatePhone || '',
      profilePhoto: doctorData.profilePhoto || '',
      qualifications: doctorData.qualifications || [],
      specializations,
      specialty: doctorData.specialty || (specializations[0] ? specializations[0].name : ''),
      registrationDetails,
      departments,
      departmentId: doctorData.departmentId || (departments[0] ? departments[0].departmentId : ''),
      departmentName: doctorData.departmentName || (departments[0] ? departments[0].departmentName : ''),
      consultationSettings: {
        consultationDurationMinutes: doctorData.consultationDurationMinutes || 30,
        consultationFee: doctorData.consultationFee || 500,
        currency: doctorData.currency || 'INR'
      },
      consultationFee: doctorData.consultationFee || 500,
      slotDurationMinutes: doctorData.consultationDurationMinutes || 30,
      roomNumber: doctorData.roomNumber || 'OPD-101',
      experienceYears: doctorData.experienceYears || 0,
      bio: doctorData.bio || '',
      status: initialStatus,
      joiningDate: doctorData.joiningDate ? new Date(doctorData.joiningDate) : new Date(),
      employmentType: doctorData.employmentType || 'FULL_TIME',
      availabilityStatus: initialStatus === 'ACTIVE' ? 'AVAILABLE' : 'UNAVAILABLE',
      documents: doctorData.documents || [],
      notes: doctorData.notes || '',
      createdBy: user.userId || 'SYSTEM'
    });

    await doctor.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'HR_MANAGER',
      action: 'DOCTOR_CREATED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctor.doctorId,
      details: `Created doctor ${doctor.displayName} (${doctor.doctorId}). Status: ${doctor.status}`
    });

    if (doctor.status === 'PENDING_APPROVAL') {
      await AuditService.logEvent({
        userId: user.userId || 'SYSTEM',
        role: user.role || 'HR_MANAGER',
        action: 'DOCTOR_APPROVAL_REQUESTED',
        module: 'DOCTOR_MANAGEMENT',
        entityType: 'Doctor',
        entityId: doctor.doctorId,
        details: `Approval review pending for doctor ${doctor.displayName}`
      });
    }

    return doctor;
  }

  /**
   * Update Doctor Profile (Section 42)
   */
  static async updateDoctor(doctorId, updateData, user = {}) {
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const beforeState = {
      displayName: doctor.displayName,
      phone: doctor.phone,
      email: doctor.email,
      departmentId: doctor.departmentId,
      status: doctor.status
    };

    const allowedFields = [
      'title',
      'firstName',
      'middleName',
      'lastName',
      'displayName',
      'gender',
      'dateOfBirth',
      'phone',
      'alternatePhone',
      'email',
      'profilePhoto',
      'bio',
      'roomNumber',
      'experienceYears',
      'employmentType',
      'notes',
      'joiningDate',
      'leavingDate'
    ];

    for (const f of allowedFields) {
      if (updateData[f] !== undefined) {
        doctor[f] = updateData[f];
      }
    }

    if (updateData.consultationSettings) {
      doctor.consultationSettings = {
        ...doctor.consultationSettings,
        ...updateData.consultationSettings
      };
      if (doctor.consultationSettings.consultationFee) {
        doctor.consultationFee = doctor.consultationSettings.consultationFee;
      }
      if (doctor.consultationSettings.consultationDurationMinutes) {
        doctor.slotDurationMinutes = doctor.consultationSettings.consultationDurationMinutes;
      }
    } else if (updateData.consultationFee !== undefined) {
      doctor.consultationFee = updateData.consultationFee;
      if (doctor.consultationSettings) doctor.consultationSettings.consultationFee = updateData.consultationFee;
    }

    doctor.updatedBy = user.userId || 'SYSTEM';
    await doctor.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'HR_MANAGER',
      action: 'DOCTOR_UPDATED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctorId,
      before: beforeState,
      after: {
        displayName: doctor.displayName,
        phone: doctor.phone,
        email: doctor.email,
        departmentId: doctor.departmentId,
        status: doctor.status
      },
      details: `Updated doctor profile ${doctorId}`
    });

    return doctor;
  }

  /**
   * Change doctor status (Section 5, 55, 56, 57)
   */
  static async changeDoctorStatus(doctorId, newStatus, reason = '', user = {}) {
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const validStatuses = [
      'DRAFT',
      'PENDING_APPROVAL',
      'ACTIVE',
      'ON_LEAVE',
      'SUSPENDED',
      'INACTIVE',
      'TERMINATED'
    ];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid doctor status: ${newStatus}`);
    }

    const oldStatus = doctor.status;
    doctor.status = newStatus;
    doctor.updatedBy = user.userId || 'SYSTEM';

    if (newStatus === 'ACTIVE') {
      doctor.availabilityStatus = 'AVAILABLE';
    } else if (newStatus === 'ON_LEAVE') {
      doctor.availabilityStatus = 'ON_LEAVE';
    } else {
      doctor.availabilityStatus = 'UNAVAILABLE';
    }

    if (newStatus === 'TERMINATED') {
      doctor.leavingDate = new Date();
    }

    await doctor.save();

    // If doctor is deactivated, suspended, or terminated, flag future appointments
    let affectedAppointments = [];
    if (['INACTIVE', 'SUSPENDED', 'TERMINATED'].includes(newStatus)) {
      const now = new Date();
      affectedAppointments = await Appointment.find({
        doctorId,
        appointmentDate: { $gte: now },
        status: { $in: ['REQUESTED', 'PENDING_REVIEW', 'SCHEDULED', 'CONFIRMED'] }
      }).lean();

      if (affectedAppointments.length > 0) {
        await ExceptionCase.create({
          exceptionId: `EXC-DOC-STAT-${Date.now()}`,
          exceptionType: 'DOCTOR_STATUS_APPOINTMENT_IMPACT',
          title: `Doctor ${doctorId} Status Changed to ${newStatus}`,
          description: `Doctor ${doctorId} transitioned to ${newStatus}. ${affectedAppointments.length} future appointments require rescheduling or reassignment.`,
          severity: 'HIGH',
          module: 'DOCTOR_MANAGEMENT',
          entityType: 'Doctor',
          entityId: doctorId,
          currentStatus: 'OPEN'
        });
      }
    }

    let auditAction = 'DOCTOR_UPDATED';
    if (newStatus === 'ACTIVE' && oldStatus === 'PENDING_APPROVAL') auditAction = 'DOCTOR_APPROVED';
    if (newStatus === 'ACTIVE' && oldStatus === 'INACTIVE') auditAction = 'DOCTOR_ACTIVATED';
    if (newStatus === 'INACTIVE') auditAction = 'DOCTOR_DEACTIVATED';
    if (newStatus === 'TERMINATED') auditAction = 'DOCTOR_TERMINATED';

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'ADMIN_MANAGER',
      action: auditAction,
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctorId,
      before: { status: oldStatus },
      after: { status: newStatus },
      details: `Status changed from ${oldStatus} to ${newStatus}. Reason: ${reason || 'Administrative action'}. Affected future appointments: ${affectedAppointments.length}`
    });

    return {
      doctor,
      oldStatus,
      newStatus,
      affectedAppointmentsCount: affectedAppointments.length,
      affectedAppointments
    };
  }

  /**
   * Assign or Add department to doctor (Section 12)
   */
  static async assignDepartment(doctorId, departmentData, user = {}) {
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const dept = await Department.findOne({ departmentId: departmentData.departmentId });
    const departmentName = dept ? dept.name : departmentData.departmentName || '';

    if (departmentData.isPrimary) {
      // Demote existing primary departments
      doctor.departments.forEach((d) => {
        if (d.isPrimary) d.isPrimary = false;
      });
      doctor.departmentId = departmentData.departmentId;
      doctor.departmentName = departmentName;
    }

    const newAssignment = {
      departmentId: departmentData.departmentId,
      departmentName,
      isPrimary: !!departmentData.isPrimary,
      startDate: departmentData.startDate ? new Date(departmentData.startDate) : new Date(),
      status: 'ACTIVE'
    };

    doctor.departments.push(newAssignment);
    await doctor.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'ADMIN_MANAGER',
      action: 'DOCTOR_DEPARTMENT_ASSIGNED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctorId,
      details: `Assigned department ${departmentName} (${departmentData.departmentId}) to doctor ${doctorId}. Primary: ${newAssignment.isPrimary}`
    });

    return doctor;
  }

  /**
   * Department Transfer Workflow (Section 13)
   */
  static async transferDepartment(doctorId, transferData, user = {}) {
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const { targetDepartmentId, effectiveDate = new Date(), reason = '' } = transferData;

    const targetDept = await Department.findOne({ departmentId: targetDepartmentId });
    if (!targetDept) throw new Error(`Target department ${targetDepartmentId} not found.`);

    const oldDeptId = doctor.departmentId;
    const oldDeptName = doctor.departmentName;

    // End current active primary department assignment
    doctor.departments.forEach((d) => {
      if (d.isPrimary && d.status === 'ACTIVE') {
        d.status = 'TRANSFERRED';
        d.endDate = new Date(effectiveDate);
        d.isPrimary = false;
      }
    });

    // Create new primary department assignment
    doctor.departments.push({
      departmentId: targetDepartmentId,
      departmentName: targetDept.name,
      isPrimary: true,
      startDate: new Date(effectiveDate),
      status: 'ACTIVE'
    });

    doctor.departmentId = targetDepartmentId;
    doctor.departmentName = targetDept.name;
    await doctor.save();

    await AuditService.logEvent({
      userId: user.userId || 'SYSTEM',
      role: user.role || 'ADMIN_MANAGER',
      action: 'DOCTOR_DEPARTMENT_CHANGED',
      module: 'DOCTOR_MANAGEMENT',
      entityType: 'Doctor',
      entityId: doctorId,
      before: { departmentId: oldDeptId, departmentName: oldDeptName },
      after: { departmentId: targetDepartmentId, departmentName: targetDept.name },
      details: `Transferred doctor ${doctorId} from ${oldDeptName} to ${targetDept.name}. Effective: ${effectiveDate}. Reason: ${reason}`
    });

    return doctor;
  }

  /**
   * Search and filter doctors (Section 16 & 58)
   */
  static async searchDoctors(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = { $ne: 'TERMINATED' };
    }

    if (filters.departmentId) {
      query.$or = [
        { departmentId: filters.departmentId },
        { 'departments.departmentId': filters.departmentId }
      ];
    }

    if (filters.specialty) {
      query.$or = [
        { specialty: new RegExp(filters.specialty, 'i') },
        { 'specializations.name': new RegExp(filters.specialty, 'i') }
      ];
    }

    if (filters.registrationNumber) {
      query['registrationDetails.registrationNumber'] = new RegExp(filters.registrationNumber, 'i');
    }

    if (filters.doctorId) {
      query.doctorId = new RegExp(filters.doctorId, 'i');
    }

    if (filters.search) {
      query.$or = [
        { displayName: new RegExp(filters.search, 'i') },
        { fullName: new RegExp(filters.search, 'i') },
        { firstName: new RegExp(filters.search, 'i') },
        { lastName: new RegExp(filters.search, 'i') },
        { doctorId: new RegExp(filters.search, 'i') },
        { email: new RegExp(filters.search, 'i') },
        { phone: new RegExp(filters.search, 'i') },
        { specialty: new RegExp(filters.search, 'i') },
        { departmentName: new RegExp(filters.search, 'i') }
      ];
    }

    return await Doctor.find(query).sort({ displayName: 1 }).lean();
  }

  /**
   * Doctor Master Dashboard Statistics (Section 73)
   */
  static async getDashboardMetrics() {
    const totalDoctors = await Doctor.countDocuments({});
    const activeDoctors = await Doctor.countDocuments({ status: 'ACTIVE' });
    const onLeave = await Doctor.countDocuments({ status: 'ON_LEAVE' });
    const inactive = await Doctor.countDocuments({ status: 'INACTIVE' });
    const pendingApproval = await Doctor.countDocuments({ status: 'PENDING_APPROVAL' });
    const suspended = await Doctor.countDocuments({ status: 'SUSPENDED' });

    const expiringAlerts = await DoctorCredentialService.getExpiringCredentials(30);
    const syncFailures = await DoctorExternalSync.countDocuments({ status: 'FAILED' });

    // Active schedules count
    const totalSchedules = await DoctorSchedule.countDocuments({ status: 'ACTIVE' });

    return {
      totalDoctors,
      activeDoctors,
      onLeave,
      inactive,
      pendingApproval,
      suspended,
      credentialExpiring: expiringAlerts.length,
      expiringAlerts,
      syncFailures,
      totalSchedules
    };
  }
}

module.exports = DoctorService;
