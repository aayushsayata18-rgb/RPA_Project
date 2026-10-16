const RadiologyException = require('../../models/RadiologyException');
const IdGeneratorService = require('../../services/IdGeneratorService');
const AuditService = require('../../services/AuditService');

class ExceptionController {
  static async listExceptions(req, res, next) {
    try {
      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.severity) filters.severity = req.query.severity;
      if (req.query.type) filters.type = req.query.type;

      const exceptions = await RadiologyException.find(filters)
        .populate('patientId')
        .populate('orderId')
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: exceptions
      });
    } catch (err) {
      next(err);
    }
  }

  static async getExceptionById(req, res, next) {
    try {
      const exception = await RadiologyException.findOne({
        $or: [
          { _id: String(req.params.id).match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
          { exceptionId: req.params.id }
        ]
      })
        .populate('patientId')
        .populate('orderId')
        .lean();

      if (!exception) {
        throw new Error('Radiology Exception not found.');
      }

      res.json({
        success: true,
        data: exception
      });
    } catch (err) {
      next(err);
    }
  }

  static async createException(req, res, next) {
    try {
      const exceptionId = await IdGeneratorService.generateRadiologyExceptionId();
      const exception = new RadiologyException({
        exceptionId,
        ...req.body,
        source: req.body.source || 'MANUAL_ENTRY'
      });
      await exception.save();

      await AuditService.logAction({
        user: req.user,
        action: 'CREATE_RADIOLOGY_EXCEPTION',
        entity: 'RadiologyException',
        entityId: exception._id,
        description: `Logged operational exception ${exception.exceptionId}: ${exception.description}`
      });

      res.status(201).json({
        success: true,
        message: 'Radiology exception recorded.',
        data: exception
      });
    } catch (err) {
      next(err);
    }
  }

  static async resolveException(req, res, next) {
    try {
      const { resolution } = req.body;
      const exception = await RadiologyException.findOne({
        $or: [
          { _id: String(req.params.id).match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
          { exceptionId: req.params.id }
        ]
      });

      if (!exception) {
        throw new Error('Radiology exception not found.');
      }

      exception.status = 'RESOLVED';
      exception.resolution = resolution || 'Resolved by authorized administrator';
      exception.resolvedBy = req.user?._id || null;
      exception.resolvedAt = new Date();
      await exception.save();

      await AuditService.logAction({
        user: req.user,
        action: 'RESOLVE_RADIOLOGY_EXCEPTION',
        entity: 'RadiologyException',
        entityId: exception._id,
        description: `Resolved exception ${exception.exceptionId}`
      });

      res.json({
        success: true,
        message: 'Radiology exception marked as resolved.',
        data: exception
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ExceptionController;
