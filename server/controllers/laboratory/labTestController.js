const LabTestService = require('../../services/laboratory/labTestService');
const { validateTestCreation } = require('../../validators/labValidators');

class LabTestController {
  static async listTests(req, res, next) {
    try {
      const { query, category, status, page, limit } = req.query;
      const result = await LabTestService.listTests({ query, category, status, page, limit });
      res.json({
        success: true,
        data: result.tests,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTestById(req, res, next) {
    try {
      const test = await LabTestService.getTestById(req.params.id);
      res.json({
        success: true,
        data: test
      });
    } catch (err) {
      next(err);
    }
  }

  static async createTest(req, res, next) {
    try {
      const validation = validateTestCreation(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join(' ')
          }
        });
      }

      const test = await LabTestService.createTest(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Laboratory test created successfully.',
        data: test
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateTest(req, res, next) {
    try {
      const test = await LabTestService.updateTest(req.params.id, req.body, req.user);
      res.json({
        success: true,
        message: 'Laboratory test updated successfully.',
        data: test
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateTestStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status || !['DRAFT', 'ACTIVE', 'INACTIVE', 'RETIRED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Valid status is required (DRAFT, ACTIVE, INACTIVE, RETIRED).'
          }
        });
      }

      const test = await LabTestService.updateTestStatus(req.params.id, status, req.user);
      res.json({
        success: true,
        message: `Laboratory test status changed to ${status}.`,
        data: test
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LabTestController;
