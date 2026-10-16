const ModalityService = require('../../services/radiology/modalityService');

class ModalityController {
  static async listModalities(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        type: req.query.type,
        room: req.query.room,
        search: req.query.search
      };
      const modalities = await ModalityService.listModalities(filters);
      res.json({
        success: true,
        data: modalities
      });
    } catch (err) {
      next(err);
    }
  }

  static async getModalityById(req, res, next) {
    try {
      const modality = await ModalityService.getModalityById(req.params.id);
      res.json({
        success: true,
        data: modality
      });
    } catch (err) {
      next(err);
    }
  }

  static async createModality(req, res, next) {
    try {
      const modality = await ModalityService.createModality(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Radiology modality created successfully.',
        data: modality
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateModality(req, res, next) {
    try {
      const modality = await ModalityService.updateModality(req.params.id, req.body, req.user);
      res.json({
        success: true,
        message: 'Radiology modality updated successfully.',
        data: modality
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const result = await ModalityService.updateModalityStatus(req.params.id, status, req.user, reason);
      res.json({
        success: true,
        message: `Modality status updated to ${status}.`,
        data: result.modality,
        affectedBookingsCount: result.affectedBookingsCount,
        affectedBookings: result.affectedBookings
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ModalityController;
