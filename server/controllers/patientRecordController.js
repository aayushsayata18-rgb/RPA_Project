const PatientRecordService = require('../services/PatientRecordService');
const PatientRecordSyncService = require('../services/PatientRecordSyncService');

/**
 * Controller for Module 07: Patient Records
 */
class PatientRecordController {
  async getPatientSummary(req, res, next) {
    try {
      const { patientId } = req.params;
      const summary = await PatientRecordService.getPatientSummary(patientId, req.user, req);
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientTimeline(req, res, next) {
    try {
      const { patientId } = req.params;
      const timeline = await PatientRecordService.getPatientTimeline(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data: timeline
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientVisits(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientVisits(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientAppointments(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientAppointments(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientAdmissions(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientAdmissions(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientBedHistory(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientBedHistory(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientDischarges(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientDischarges(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientBilling(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientBilling(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientInsurance(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientInsurance(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientLaboratory(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientLaboratory(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientRadiology(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientRadiology(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientPharmacy(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientPharmacy(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientDocuments(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientDocuments(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const doc = await PatientRecordService.downloadDocument(documentId, req.user, req);
      res.json({
        success: true,
        data: doc
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientAccessHistory(req, res, next) {
    try {
      const { patientId } = req.params;
      const data = await PatientRecordService.getPatientAccessHistory(patientId, req.query, req.user, req);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async logAccess(req, res, next) {
    try {
      const { patientId } = req.params;
      const { action, resourceType, resourceId, purpose, metadata } = req.body;
      await PatientRecordService.logAccess({
        patientId,
        user: req.user,
        action: action || 'PATIENT_RECORD_VIEWED',
        resourceType: resourceType || 'PATIENT_SUMMARY',
        resourceId,
        purpose: purpose || 'ADMINISTRATION',
        metadata,
        req
      });
      res.json({
        success: true,
        message: 'Access logged successfully.'
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePatientProfile(req, res, next) {
    try {
      const { patientId } = req.params;
      const { updates, reason } = req.body;
      const result = await PatientRecordService.updatePatientProfileWithAudit(
        patientId,
        updates || req.body,
        reason || 'Demographic update',
        req.user,
        req
      );
      res.json({
        success: true,
        message: 'Patient profile updated and audited successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async syncLegacyRecord(req, res, next) {
    try {
      const result = await PatientRecordSyncService.syncLegacyPatientRecord({
        ...req.body,
        user: req.user,
        correlationId: req.headers['x-correlation-id']
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async importLegacyDocument(req, res, next) {
    try {
      const result = await PatientRecordSyncService.importLegacyDocument({
        ...req.body,
        user: req.user,
        correlationId: req.headers['x-correlation-id']
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async reconcilePatientRecord(req, res, next) {
    try {
      const { patientId } = req.params;
      const result = await PatientRecordSyncService.reconcilePatientReferences(patientId);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PatientRecordController();
