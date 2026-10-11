const InsuranceExceptionService = require('../services/insuranceExceptionService');
const ExceptionCase = require('../models/ExceptionCase');

class InsuranceExceptionController {
  static async listExceptions(req, res) {
    try {
      const exceptions = await InsuranceExceptionService.listExceptions(req.query);
      res.json({ success: true, count: exceptions.length, exceptions });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getExceptionById(req, res) {
    try {
      const exception = await ExceptionCase.findOne({
        exceptionId: req.params.id,
        module: 'INSURANCE_VERIFICATION'
      }).lean();
      if (!exception) return res.status(404).json({ success: false, message: 'Exception not found' });
      res.json({ success: true, exception });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async assignException(req, res) {
    try {
      const { assignedTo } = req.body;
      const exception = await InsuranceExceptionService.assignException(req.params.id, assignedTo, req.user || {});
      res.json({ success: true, message: 'Exception assigned successfully', exception });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async resolveException(req, res) {
    try {
      const result = await InsuranceExceptionService.resolveException(req.params.id, req.body, req.user || {});
      res.json({ success: true, message: 'Exception resolved successfully', ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = InsuranceExceptionController;
