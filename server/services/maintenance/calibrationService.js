const AssetCalibrationRecord = require('../../models/AssetCalibrationRecord');
const Asset = require('../../models/Asset');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class CalibrationService {
  /**
   * Log/Create Calibration Record
   */
  static async createCalibration(data, userId) {
    if (!data.assetId) {
      const err = new Error('Asset ID is required for calibration');
      err.statusCode = 400;
      throw err;
    }

    const asset = await Asset.findById(data.assetId);
    if (!asset) {
      const err = new Error('Asset not found');
      err.statusCode = 404;
      throw err;
    }

    if (!data.calibrationId) {
      data.calibrationId = await IdGeneratorService.generateAssetCalibrationId();
    }

    if (!data.performedAt) data.performedAt = new Date();
    if (!data.dueDate) {
      // Default 1 year from performed date
      const d = new Date(data.performedAt);
      d.setFullYear(d.getFullYear() + 1);
      data.dueDate = d;
    }

    data.performedBy = data.performedBy || userId;
    data.createdBy = userId;

    const record = new AssetCalibrationRecord(data);
    await record.save();

    await AuditService.logEvent({
      action: 'CALIBRATION_RECORDED',
      module: 'MAINTENANCE',
      entityId: record.calibrationId,
      performedBy: userId,
      details: {
        calibrationId: record.calibrationId,
        assetId: asset.assetId,
        result: record.result,
        dueDate: record.dueDate
      }
    });

    return record;
  }

  /**
   * Get all calibration records
   */
  static async getCalibrations(query = {}) {
    const { assetId, result, page = 1, limit = 20 } = query;
    const filter = {};
    if (assetId) filter.assetId = assetId;
    if (result) filter.result = result;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      AssetCalibrationRecord.find(filter)
        .populate('assetId', 'name assetId assetTag status criticality model manufacturer')
        .populate('performedBy', 'firstName lastName email')
        .populate('performedByVendorId', 'name')
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      AssetCalibrationRecord.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1
    };
  }

  /**
   * Get single calibration record
   */
  static async getCalibrationById(id) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { calibrationId: id };

    const record = await AssetCalibrationRecord.findOne(query)
      .populate('assetId')
      .populate('performedBy')
      .populate('performedByVendorId')
      .lean();

    if (!record) {
      const err = new Error('Calibration record not found');
      err.statusCode = 404;
      throw err;
    }

    return record;
  }

  /**
   * Update calibration record
   */
  static async updateCalibration(id, updateData, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { calibrationId: id };

    const record = await AssetCalibrationRecord.findOneAndUpdate(query, updateData, { new: true });
    if (!record) {
      const err = new Error('Calibration record not found');
      err.statusCode = 404;
      throw err;
    }

    return record;
  }
}

module.exports = CalibrationService;
