const AdmissionService = require('../services/AdmissionService');
const AdmissionChecklistService = require('../services/AdmissionChecklistService');
const AdmissionSyncService = require('../services/AdmissionSyncService');

class AdmissionController {
  /**
   * POST /admission-requests
   */
  static async createAdmissionRequest(req, res) {
    try {
      const result = await AdmissionService.createAdmissionRequest(req.body, req.user);
      return res.status(result.isExisting ? 200 : 201).json({
        success: true,
        data: result.admissionRequest,
        checklist: result.checklist,
        message: result.message || 'Admission request created successfully.'
      });
    } catch (error) {
      console.error('[AdmissionController.createAdmissionRequest Error]:', error);
      const isDuplicate = error.message.includes('DUPLICATE_ACTIVE_ADMISSION');
      return res.status(isDuplicate ? 409 : 400).json({
        success: false,
        error: {
          code: isDuplicate ? 'DUPLICATE_ACTIVE_ADMISSION' : 'ADMISSION_REQUEST_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * GET /admission-requests
   */
  static async listAdmissionRequests(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const filters = {
        status: req.query.status,
        source: req.query.source,
        patientId: req.query.patientId,
        priority: req.query.priority,
        requestingDoctorId: req.query.doctorId
      };

      const result = await AdmissionService.listAdmissionRequests(filters, page, limit);
      return res.json({
        success: true,
        data: result.requests,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit
        }
      });
    } catch (error) {
      console.error('[AdmissionController.listAdmissionRequests Error]:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * GET /admission-requests/:id
   */
  static async getAdmissionRequestById(req, res) {
    try {
      const { id } = req.params;
      const result = await AdmissionService.getAdmissionRequestById(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Admission request ${id} was not found.`
          }
        });
      }
      return res.json({
        success: true,
        data: result.request,
        checklist: result.checklist,
        history: result.history,
        bed: result.bed
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * POST /admission-requests/:id/approve
   */
  static async approveAdmissionRequest(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const updated = await AdmissionService.approveAdmissionRequest({
        admissionRequestId: id,
        reason,
        actorUser: req.user
      });
      return res.json({
        success: true,
        data: updated,
        message: 'Admission request approved successfully.'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'APPROVAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * POST /admission-requests/:id/reject
   */
  static async rejectAdmissionRequest(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const updated = await AdmissionService.rejectAdmissionRequest({
        admissionRequestId: id,
        reason,
        actorUser: req.user
      });
      return res.json({
        success: true,
        data: updated,
        message: 'Admission request rejected.'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REJECTION_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * POST /admission-requests/:id/cancel
   */
  static async cancelAdmissionRequest(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const updated = await AdmissionService.cancelAdmissionRequest({
        admissionRequestId: id,
        reason,
        actorUser: req.user
      });
      return res.json({
        success: true,
        data: updated,
        message: 'Admission request cancelled.'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANCELLATION_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * POST /admission-requests/:id/assign-bed
   */
  static async assignBed(req, res) {
    try {
      const { id } = req.params;
      const { bedId } = req.body;
      const result = await AdmissionService.assignBedToRequest({
        admissionRequestId: id,
        bedId,
        actorUser: req.user
      });
      return res.json({
        success: true,
        data: result.request,
        bed: result.bed,
        message: `Bed ${result.bed.bedNumber} assigned to admission request ${id}.`
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BED_ASSIGNMENT_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * POST /admissions (Create / Complete Admission directly or from request)
   */
  static async completeAdmission(req, res) {
    try {
      const admissionRequestId = req.params.admissionId || req.params.id || req.body.admissionRequestId;
      const { insuranceDetails, billingAccountId } = req.body;

      const admission = await AdmissionService.completeAdmission({
        admissionRequestId,
        insuranceDetails,
        billingAccountId,
        actorUser: req.user
      });

      return res.status(201).json({
        success: true,
        data: admission,
        message: `Patient successfully admitted. Admission ID: ${admission.admissionId}`
      });
    } catch (error) {
      console.error('[AdmissionController.completeAdmission Error]:', error);
      return res.status(400).json({
        success: false,
        error: {
          code: 'ADMISSION_COMPLETION_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * GET /admissions
   */
  static async listAdmissions(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const filters = {
        status: req.query.status,
        patientId: req.query.patientId,
        assignedWardId: req.query.wardId,
        admissionType: req.query.admissionType,
        source: req.query.source
      };

      // Patient Portal security boundary: patients can only view their own admissions
      if (req.user?.role === 'PATIENT' && req.user?.patientId) {
        filters.patientId = req.user.patientId;
      }

      const result = await AdmissionService.listAdmissions(filters, page, limit);
      return res.json({
        success: true,
        data: result.admissions,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * GET /admissions/active/:patientId
   */
  static async getActiveAdmission(req, res) {
    try {
      const { patientId } = req.params;

      // Patient Portal security boundary
      if (req.user?.role === 'PATIENT' && req.user?.patientId && req.user.patientId !== patientId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You are not authorized to view admissions for other patients.'
          }
        });
      }

      const activeAdmission = await AdmissionService.getActiveAdmission(patientId);
      return res.json({
        success: true,
        hasActiveAdmission: !!activeAdmission,
        data: activeAdmission
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * GET /admissions/:admissionId
   */
  static async getAdmissionById(req, res) {
    try {
      const { admissionId } = req.params;
      const result = await AdmissionService.getAdmissionById(admissionId);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Admission ${admissionId} was not found.`
          }
        });
      }

      // Security check for PATIENT role
      if (req.user?.role === 'PATIENT' && req.user?.patientId && req.user.patientId !== result.admission.patientId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied.'
          }
        });
      }

      return res.json({
        success: true,
        data: result.admission,
        request: result.request,
        checklist: result.checklist,
        history: result.history,
        bed: result.bed
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * POST /admissions/emergency
   */
  static async createEmergencyAdmission(req, res) {
    try {
      const result = await AdmissionService.createEmergencyAdmission({
        ...req.body,
        actorUser: req.user
      });
      return res.status(201).json({
        success: true,
        data: result.admission || result.admissionRequest,
        temporaryRecord: result.temporaryRecord,
        message: result.message || 'Emergency admission processed successfully.'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMERGENCY_ADMISSION_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * POST /admissions/link-temporary-identity
   */
  static async linkEmergencyTemporaryIdentity(req, res) {
    try {
      const { temporaryEmergencyId, permanentPatientId } = req.body;
      if (!temporaryEmergencyId || !permanentPatientId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'temporaryEmergencyId and permanentPatientId are required.'
          }
        });
      }

      const result = await AdmissionService.linkEmergencyTemporaryIdentity({
        temporaryEmergencyId,
        permanentPatientId,
        actorUser: req.user
      });

      return res.json({
        success: true,
        data: result,
        message: 'Temporary emergency record successfully linked to permanent patient master.'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'IDENTITY_LINKING_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * PUT /admissions/checklists/:checklistId/items/:code
   */
  static async updateChecklistItem(req, res) {
    try {
      const { checklistId, code } = req.params;
      const { status, notes } = req.body;
      const checklist = await AdmissionChecklistService.updateItemStatus({
        checklistId,
        code,
        status,
        notes,
        actorUser: req.user
      });
      return res.json({
        success: true,
        data: checklist,
        message: 'Checklist item updated.'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CHECKLIST_UPDATE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * POST /admissions/checklists/:checklistId/override
   */
  static async overrideChecklistItem(req, res) {
    try {
      const { checklistId } = req.params;
      const { code, overrideReason } = req.body;
      const checklist = await AdmissionChecklistService.overrideItem({
        checklistId,
        code,
        overrideReason,
        actorUser: req.user
      });
      return res.json({
        success: true,
        data: checklist,
        message: 'Checklist item overridden with administrative authorization.'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CHECKLIST_OVERRIDE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * POST /admissions/:admissionId/sync-external
   */
  static async syncExternalSystem(req, res) {
    try {
      const { admissionId } = req.params;
      const { forceFail } = req.body;
      const result = await AdmissionSyncService.syncAdmissionWithExternalSystem({
        admissionId,
        forceFail: !!forceFail,
        actorUser: req.user
      });
      return res.json({
        success: result.success,
        data: result
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = AdmissionController;
