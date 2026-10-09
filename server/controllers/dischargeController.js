const DischargeService = require('../services/DischargeService');
const DischargeBillingService = require('../services/DischargeBillingService');
const DischargeInsuranceService = require('../services/DischargeInsuranceService');
const PendingServiceChecker = require('../services/PendingServiceChecker');
const DischargeBedService = require('../services/DischargeBedService');
const DischargeDocumentService = require('../services/DischargeDocumentService');
const DischargeChecklist = require('../models/DischargeChecklist');
const DischargeHistory = require('../models/DischargeHistory');

class DischargeController {
  /**
   * List discharges with filtering and pagination
   */
  static async listDischarges(req, res) {
    try {
      const result = await DischargeService.listDischarges(req.query);
      return res.json({
        success: true,
        data: result.discharges,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages
        }
      });
    } catch (err) {
      console.error('[DischargeController.listDischarges Error]:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'DISCHARGE_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get discharge details by ID
   */
  static async getDischargeById(req, res) {
    try {
      const { id } = req.params;
      const discharge = await DischargeService.getDischargeById(id);
      if (!discharge) {
        return res.status(404).json({
          success: false,
          error: { code: 'DISCHARGE_NOT_FOUND', message: `Discharge ${id} not found.` }
        });
      }
      return res.json({ success: true, data: discharge });
    } catch (err) {
      console.error('[DischargeController.getDischargeById Error]:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'DISCHARGE_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * Initiate a discharge record
   */
  static async initiateDischarge(req, res) {
    try {
      const discharge = await DischargeService.initiateDischarge({
        ...req.body,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });
      return res.status(201).json({
        success: true,
        message: 'Discharge process initiated successfully.',
        data: discharge
      });
    } catch (err) {
      console.error('[DischargeController.initiateDischarge Error]:', err);
      return res.status(400).json({
        success: false,
        error: { code: 'DISCHARGE_INITIATE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Process/advance discharge workflow
   */
  static async processDischarge(req, res) {
    try {
      const { id } = req.params;
      const result = await DischargeService.processDischargeWorkflow({
        dischargeId: id,
        ...req.body,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });
      return res.json({
        success: true,
        message: result.message || 'Discharge workflow processed successfully.',
        data: result
      });
    } catch (err) {
      console.error('[DischargeController.processDischarge Error]:', err);
      return res.status(400).json({
        success: false,
        error: { code: 'DISCHARGE_PROCESS_FAILED', message: err.message }
      });
    }
  }

  /**
   * Complete discharge
   */
  static async completeDischarge(req, res) {
    try {
      const { id } = req.params;
      const result = await DischargeService.completeDischarge({
        dischargeId: id,
        ...req.body,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });
      return res.json({
        success: true,
        message: 'Discharge completed successfully.',
        data: result
      });
    } catch (err) {
      console.error('[DischargeController.completeDischarge Error]:', err);
      return res.status(400).json({
        success: false,
        error: { code: 'DISCHARGE_COMPLETE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Cancel discharge
   */
  static async cancelDischarge(req, res) {
    try {
      const { id } = req.params;
      const { cancellationReason, reason } = req.body;
      const discharge = await DischargeService.cancelDischarge({
        dischargeId: id,
        cancellationReason: cancellationReason || reason,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });
      return res.json({
        success: true,
        message: 'Discharge cancelled successfully.',
        data: discharge
      });
    } catch (err) {
      console.error('[DischargeController.cancelDischarge Error]:', err);
      return res.status(400).json({
        success: false,
        error: { code: 'DISCHARGE_CANCEL_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get pending service items for discharge
   */
  static async getPendingItems(req, res) {
    try {
      const { id } = req.params;
      const discharge = await DischargeService.getDischargeById(id);
      if (!discharge) {
        return res.status(404).json({
          success: false,
          error: { code: 'DISCHARGE_NOT_FOUND', message: 'Discharge record not found.' }
        });
      }

      const pending = await PendingServiceChecker.checkPendingServices({
        patientId: discharge.patientId,
        admissionId: discharge.admissionId
      });

      return res.json({
        success: true,
        data: pending
      });
    } catch (err) {
      console.error('[DischargeController.getPendingItems Error]:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'PENDING_ITEMS_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get discharge checklist
   */
  static async getChecklist(req, res) {
    try {
      const { id } = req.params;
      const checklist = await DischargeChecklist.findOne({
        $or: [{ dischargeId: id }, { dischargeNumber: id }]
      }).lean();

      return res.json({
        success: true,
        data: checklist || { checklist: [] }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'CHECKLIST_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * Update discharge checklist
   */
  static async updateChecklist(req, res) {
    try {
      const { id } = req.params;
      const { items, notes } = req.body;
      const checklist = await DischargeChecklist.findOne({
        $or: [{ dischargeId: id }, { dischargeNumber: id }]
      });

      if (!checklist) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHECKLIST_NOT_FOUND', message: 'Checklist not found.' }
        });
      }

      if (items && typeof items === 'object') {
        Object.entries(items).forEach(([key, val]) => {
          if (checklist.checklist && typeof checklist.checklist.set === 'function') {
            checklist.checklist.set(key, val);
          } else if (checklist.items) {
            checklist.items[key] = val;
          }
        });
      }
      if (notes) checklist.notes = notes;
      await checklist.save();

      return res.json({
        success: true,
        message: 'Checklist updated successfully.',
        data: checklist
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'CHECKLIST_UPDATE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Finalize billing for discharge
   */
  static async finalizeBilling(req, res) {
    try {
      const { id } = req.params;
      const { discountAmount } = req.body;
      const discharge = await DischargeService.getDischargeById(id);
      if (!discharge) {
        return res.status(404).json({
          success: false,
          error: { code: 'DISCHARGE_NOT_FOUND', message: 'Discharge record not found.' }
        });
      }

      const result = await DischargeBillingService.finalizeDischargeBilling({
        dischargeId: discharge.dischargeNumber || discharge.dischargeId,
        admissionId: discharge.admissionId,
        discountAmount: Number(discountAmount || 0),
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: 'Billing finalized successfully.',
        data: result
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'BILLING_FINALIZE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Verify insurance for discharge
   */
  static async verifyInsurance(req, res) {
    try {
      const { id } = req.params;
      const discharge = await DischargeService.getDischargeById(id);
      if (!discharge) {
        return res.status(404).json({
          success: false,
          error: { code: 'DISCHARGE_NOT_FOUND', message: 'Discharge record not found.' }
        });
      }

      const result = await DischargeInsuranceService.verifyDischargeInsurance({
        dischargeId: discharge.dischargeNumber || discharge.dischargeId,
        admissionId: discharge.admissionId,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: 'Insurance verification completed.',
        data: result
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSURANCE_VERIFY_FAILED', message: err.message }
      });
    }
  }

  /**
   * Release bed manually from discharge
   */
  static async releaseBed(req, res) {
    try {
      const { id } = req.params;
      const discharge = await DischargeService.getDischargeById(id);
      if (!discharge) {
        return res.status(404).json({
          success: false,
          error: { code: 'DISCHARGE_NOT_FOUND', message: 'Discharge record not found.' }
        });
      }

      const result = await DischargeBedService.releaseBedOnDischarge({
        admissionId: discharge.admissionId,
        bedId: discharge.assignedBedId,
        dischargeId: discharge.dischargeNumber || discharge.dischargeId,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: 'Bed released and housekeeping task generated.',
        data: result
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'BED_RELEASE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get discharge audit history timeline
   */
  static async getHistory(req, res) {
    try {
      const { id } = req.params;
      const history = await DischargeHistory.find({
        $or: [{ dischargeId: id }, { dischargeNumber: id }]
      }).sort({ timestamp: 1 }).lean();

      return res.json({
        success: true,
        data: history
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'HISTORY_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get single discharge document or all documents
   */
  static async getDocument(req, res) {
    try {
      const { id, type } = req.params;
      const discharge = await DischargeService.getDischargeById(id);
      if (!discharge) {
        return res.status(404).json({
          success: false,
          error: { code: 'DISCHARGE_NOT_FOUND', message: 'Discharge record not found.' }
        });
      }

      if (type) {
        const doc = await DischargeDocumentService.generateDocument({
          documentType: type.toUpperCase(),
          dischargeId: discharge.dischargeNumber || discharge.dischargeId,
          admissionId: discharge.admissionId,
          patientId: discharge.patientId,
          actorUser: req.user,
          correlationId: req.headers['x-correlation-id']
        });
        return res.json({
          success: true,
          data: doc
        });
      }

      const docs = await DischargeDocumentService.getDischargeDocuments(discharge.dischargeNumber || id);
      return res.json({
        success: true,
        data: docs
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'DOCUMENT_GENERATE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get discharge documents
   */
  static async getDocuments(req, res) {
    try {
      const { id } = req.params;
      const docs = await DischargeDocumentService.getDischargeDocuments(id);
      return res.json({
        success: true,
        data: docs
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DOCUMENTS_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * Dispute a charge
   */
  static async disputeCharge(req, res) {
    try {
      const { id } = req.params;
      const { chargeId, reason } = req.body;
      const result = await DischargeBillingService.raiseBillingQuery({
        dischargeId: id,
        chargeId,
        disputeReason: reason,
        raisedBy: req.user?.userId,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.json({
        success: true,
        message: 'Billing dispute submitted.',
        data: result
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'DISPUTE_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get discharge summary dashboard stats
   */
  static async getStats(req, res) {
    try {
      const stats = await DischargeService.getDischargeStats();
      return res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'STATS_FETCH_FAILED', message: err.message }
      });
    }
  }
}

module.exports = DischargeController;
