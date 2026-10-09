const DischargeService = require('../services/DischargeService');
const DischargeRequest = require('../models/DischargeRequest');

class DischargeRequestController {
  /**
   * Create a new clinical discharge request
   */
  static async createRequest(req, res) {
    try {
      const request = await DischargeService.createDischargeRequest({
        ...req.body,
        requestedByUserId: req.user?.userId,
        requestedByRole: req.user?.role || 'DOCTOR',
        doctorName: req.user?.name || req.body.doctorName,
        actorUser: req.user,
        correlationId: req.headers['x-correlation-id']
      });

      return res.status(201).json({
        success: true,
        message: 'Clinical discharge request created successfully.',
        data: request
      });
    } catch (err) {
      console.error('[DischargeRequestController.createRequest Error]:', err);
      return res.status(400).json({
        success: false,
        error: { code: 'DISCHARGE_REQUEST_FAILED', message: err.message }
      });
    }
  }

  /**
   * Get discharge request by ID
   */
  static async getRequestById(req, res) {
    try {
      const { id } = req.params;
      const request = await DischargeRequest.findOne({
        $or: [{ requestId: id }, { _id: id }]
      }).lean();

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'REQUEST_NOT_FOUND', message: `Discharge request ${id} not found.` }
        });
      }

      return res.json({
        success: true,
        data: request
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'REQUEST_FETCH_FAILED', message: err.message }
      });
    }
  }

  /**
   * List discharge requests
   */
  static async listRequests(req, res) {
    try {
      const { status, patientId, admissionId, page = 1, limit = 20 } = req.query;
      const query = {};
      if (status) query.status = status;
      if (patientId) query.patientId = patientId;
      if (admissionId) query.admissionId = admissionId;

      const skip = (Number(page) - 1) * Number(limit);
      const [requests, total] = await Promise.all([
        DischargeRequest.find(query).sort({ requestedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        DischargeRequest.countDocuments(query)
      ]);

      return res.json({
        success: true,
        data: requests,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'REQUEST_LIST_FAILED', message: err.message }
      });
    }
  }

  /**
   * Cancel discharge request
   */
  static async cancelRequest(req, res) {
    try {
      const { id } = req.params;
      const { cancellationReason } = req.body;
      const request = await DischargeRequest.findOne({ requestId: id });
      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'REQUEST_NOT_FOUND', message: `Discharge request ${id} not found.` }
        });
      }

      request.status = 'CANCELLED';
      request.cancelledAt = new Date();
      request.cancellationReason = cancellationReason || 'Cancelled by staff';
      request.cancelledBy = req.user?.userId || 'STAFF';
      await request.save();

      return res.json({
        success: true,
        message: 'Discharge request cancelled.',
        data: request
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUEST_CANCEL_FAILED', message: err.message }
      });
    }
  }
}

module.exports = DischargeRequestController;
