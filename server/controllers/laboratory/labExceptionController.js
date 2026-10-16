const LabException = require('../../models/LabException');
const IdGeneratorService = require('../../services/IdGeneratorService');
const AuditService = require('../../services/AuditService');

class LabExceptionController {
  static async listExceptions(req, res, next) {
    try {
      const { status, severity, type, search, page = 1, limit = 50 } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (severity) filter.severity = severity;
      if (type) filter.type = type;
      if (search) {
        filter.$or = [
          { exceptionId: { $regex: search, $options: 'i' } },
          { patientCode: { $regex: search, $options: 'i' } },
          { orderIdString: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
      const [exceptions, total] = await Promise.all([
        LabException.find(filter)
          .populate('patientId', 'firstName lastName patientId')
          .populate('assignedTo', 'firstName lastName userId role')
          .populate('resolvedBy', 'firstName lastName userId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10))
          .lean(),
        LabException.countDocuments(filter)
      ]);

      const mappedExceptions = exceptions.map(ex => ({
        ...ex,
        labExceptionId: ex.exceptionId,
        exceptionType: ex.type,
        labOrderId: ex.orderIdString || '',
        sampleId: ex.sampleAccessionNumber || (ex.sampleId ? String(ex.sampleId) : '')
      }));

      res.json({
        success: true,
        data: mappedExceptions,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getExceptionById(req, res, next) {
    try {
      const exception = await LabException.findOne({
        $or: [
          { exceptionId: req.params.id },
          { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }
        ]
      })
        .populate('patientId')
        .populate('orderId')
        .populate('sampleId')
        .populate('assignedTo')
        .populate('resolvedBy')
        .lean();

      if (!exception) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EXCEPTION_NOT_FOUND',
            message: `Laboratory exception '${req.params.id}' was not found.`
          }
        });
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
      const { type, severity, description, orderIdString, patientCode, sampleAccessionNumber } = req.body;
      const exceptionId = await IdGeneratorService.generateLabExceptionId();

      const exception = new LabException({
        exceptionId,
        type: type || 'SAMPLE_MISMATCH',
        severity: severity || 'MEDIUM',
        description: description || 'Operational laboratory exception recorded.',
        orderIdString,
        patientCode,
        sampleAccessionNumber,
        source: 'USER_ACTION',
        status: 'OPEN'
      });

      await exception.save();

      await AuditService.logAction({
        action: 'LAB_EXCEPTION_RECORDED',
        module: 'LABORATORY',
        entityId: exception.exceptionId,
        entityType: 'LabException',
        performedBy: req.user?.userId || 'SYSTEM',
        performedByRole: req.user?.role || 'SYSTEM',
        description: `Logged laboratory exception ${exception.exceptionId} (${exception.type})`
      });

      res.status(201).json({
        success: true,
        message: 'Laboratory exception recorded successfully.',
        data: exception
      });
    } catch (err) {
      next(err);
    }
  }

  static async resolveException(req, res, next) {
    try {
      const { resolution } = req.body;
      const exception = await LabException.findOne({
        $or: [
          { exceptionId: req.params.id },
          { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }
        ]
      });

      if (!exception) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EXCEPTION_NOT_FOUND',
            message: `Laboratory exception '${req.params.id}' was not found.`
          }
        });
      }

      exception.status = 'RESOLVED';
      exception.resolution = resolution || 'Resolved by authorized administrator';
      exception.resolvedBy = req.user?._id || null;
      exception.resolvedAt = new Date();
      await exception.save();

      await AuditService.logAction({
        action: 'LAB_EXCEPTION_RESOLVED',
        module: 'LABORATORY',
        entityId: exception.exceptionId,
        entityType: 'LabException',
        performedBy: req.user?.userId || 'SYSTEM',
        performedByRole: req.user?.role || 'SYSTEM',
        description: `Resolved laboratory exception ${exception.exceptionId}: ${exception.resolution}`
      });

      res.json({
        success: true,
        message: `Exception ${exception.exceptionId} resolved successfully.`,
        data: exception
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LabExceptionController;
