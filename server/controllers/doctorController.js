const DoctorService = require('../services/doctorService');
const DoctorScheduleService = require('../services/DoctorScheduleService');
const DoctorCredentialService = require('../services/doctorCredentialService');
const DoctorSyncService = require('../services/doctorSyncService');
const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');

class DoctorController {
  /**
   * GET /api/doctors/dashboard
   */
  static async getDashboard(req, res, next) {
    try {
      const metrics = await DoctorService.getDashboardMetrics();
      return res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctors/departments
   */
  static async getDepartments(req, res, next) {
    try {
      const departments = await DoctorScheduleService.getDepartments();
      return res.status(200).json({
        success: true,
        data: departments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctors/credentials/expiring
   */
  static async getExpiringCredentials(req, res, next) {
    try {
      const days = req.query.days ? parseInt(req.query.days, 10) : 30;
      const alerts = await DoctorCredentialService.getExpiringCredentials(days);
      return res.status(200).json({
        success: true,
        count: alerts.length,
        data: alerts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctors
   */
  static async getDoctors(req, res, next) {
    try {
      const doctors = await DoctorService.searchDoctors(req.query);
      return res.status(200).json({
        success: true,
        count: doctors.length,
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doctors
   */
  static async createDoctor(req, res, next) {
    try {
      const user = req.user || {};
      const doctor = await DoctorService.createDoctor(req.body, user);
      return res.status(201).json({
        success: true,
        message: 'Doctor profile created successfully.',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctors/:doctorId
   */
  static async getDoctorById(req, res, next) {
    try {
      const { doctorId } = req.params;
      const doctor = await DoctorService.searchDoctors({ doctorId });
      if (!doctor || doctor.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Doctor ${doctorId} not found.`,
          errorCode: 'DOCTOR_NOT_FOUND'
        });
      }

      const schedules = await DoctorScheduleService.getDoctorSchedules(doctorId);
      const syncStatus = await DoctorSyncService.getDoctorSyncStatus(doctorId);

      return res.status(200).json({
        success: true,
        data: {
          ...doctor[0],
          schedules,
          syncStatus
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/doctors/:doctorId
   */
  static async updateDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;
      const user = req.user || {};
      const doctor = await DoctorService.updateDoctor(doctorId, req.body, user);
      return res.status(200).json({
        success: true,
        message: 'Doctor profile updated successfully.',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/doctors/:doctorId/status
   */
  static async updateStatus(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { status, reason } = req.body;
      const user = req.user || {};

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required.',
          errorCode: 'MISSING_STATUS'
        });
      }

      const result = await DoctorService.changeDoctorStatus(doctorId, status, reason, user);
      return res.status(200).json({
        success: true,
        message: `Doctor status updated to ${status}.`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doctors/:doctorId/qualifications
   */
  static async addQualification(req, res, next) {
    try {
      const { doctorId } = req.params;
      const user = req.user || {};
      const doctor = await DoctorCredentialService.addQualification(doctorId, req.body, user);
      return res.status(201).json({
        success: true,
        message: 'Qualification added successfully.',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/doctors/:doctorId/qualifications/:qualificationId
   */
  static async updateQualification(req, res, next) {
    try {
      const { doctorId, qualificationId } = req.params;
      const user = req.user || {};
      const doctor = await DoctorCredentialService.updateQualification(doctorId, qualificationId, req.body, user);
      return res.status(200).json({
        success: true,
        message: 'Qualification updated successfully.',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doctors/:doctorId/registrations
   */
  static async addRegistration(req, res, next) {
    try {
      const { doctorId } = req.params;
      const user = req.user || {};
      const doctor = await DoctorCredentialService.addRegistration(doctorId, req.body, user);
      return res.status(201).json({
        success: true,
        message: 'Registration details added successfully.',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/doctors/:doctorId/registrations/:registrationId
   */
  static async updateRegistration(req, res, next) {
    try {
      const { doctorId, registrationId } = req.params;
      const user = req.user || {};
      const doctor = await DoctorCredentialService.updateRegistration(doctorId, registrationId, req.body, user);
      return res.status(200).json({
        success: true,
        message: 'Registration details updated successfully.',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doctors/:doctorId/departments
   */
  static async assignDepartment(req, res, next) {
    try {
      const { doctorId } = req.params;
      const user = req.user || {};
      const doctor = await DoctorService.assignDepartment(doctorId, req.body, user);
      return res.status(201).json({
        success: true,
        message: 'Department assigned successfully.',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doctors/:doctorId/departments/transfer
   */
  static async transferDepartment(req, res, next) {
    try {
      const { doctorId } = req.params;
      const user = req.user || {};
      const doctor = await DoctorService.transferDepartment(doctorId, req.body, user);
      return res.status(200).json({
        success: true,
        message: 'Department transfer executed successfully.',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doctors/:doctorId/sync
   */
  static async triggerSync(req, res, next) {
    try {
      const { doctorId } = req.params;
      const user = req.user || {};
      const syncResult = await DoctorSyncService.triggerDoctorSync(doctorId, { ...req.body, user });
      return res.status(200).json({
        success: true,
        message: 'Doctor external sync initiated.',
        data: syncResult
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctors/:doctorId/sync
   */
  static async getSyncStatus(req, res, next) {
    try {
      const { doctorId } = req.params;
      const syncs = await DoctorSyncService.getDoctorSyncStatus(doctorId);
      return res.status(200).json({
        success: true,
        data: syncs
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Backward-compat: GET /api/doctors/:doctorId/schedule
   */
  static async getDoctorSchedule(req, res, next) {
    try {
      const { doctorId } = req.params;
      const schedules = await DoctorScheduleService.getDoctorSchedules(doctorId);
      return res.status(200).json({
        success: true,
        data: schedules.length > 0 ? schedules[0] : null,
        schedules
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Backward-compat: POST /api/doctors/:doctorId/leave
   */
  static async recordLeave(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate, reason } = req.body;
      const user = req.user || {};

      const DoctorAvailabilityService = require('../services/doctorAvailabilityService');
      const result = await DoctorAvailabilityService.processApprovedLeave({
        doctorId,
        startDate,
        endDate,
        reason
      }, user);

      return res.status(200).json({
        success: true,
        message: 'Leave processed successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DoctorController;
