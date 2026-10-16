const ResultService = require('../../services/laboratory/resultService');
const { validateResultEntry, validateResultAmendment } = require('../../validators/labValidators');

class LabResultController {
  static async enterResult(req, res, next) {
    try {
      const validation = validateResultEntry(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join(' ')
          }
        });
      }

      const result = await ResultService.enterResult({
        ...req.body,
        user: req.user
      });

      res.status(201).json({
        success: true,
        message: req.body.submitForVerification
          ? 'Result entered and submitted for verification.'
          : 'Result draft saved successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getVerificationQueue(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const result = await ResultService.getVerificationQueue({ search, page, limit });
      res.json({
        success: true,
        data: result.queue,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async getResultById(req, res, next) {
    try {
      const result = await ResultService.getResultById(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyResult(req, res, next) {
    try {
      const { verifierNotes } = req.body;
      const result = await ResultService.verifyResult({
        resultId: req.params.id,
        verifierNotes,
        user: req.user
      });
      res.json({
        success: true,
        message: `Result ${result.resultId} verified successfully.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async amendResult(req, res, next) {
    try {
      const validation = validateResultAmendment(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join(' ')
          }
        });
      }

      const result = await ResultService.amendResult({
        resultId: req.params.id,
        ...req.body,
        user: req.user
      });

      res.json({
        success: true,
        message: `Laboratory result amended successfully (version ${result.version}).`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LabResultController;
