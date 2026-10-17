const Asset = require('../../models/Asset');
const AssetCategory = require('../../models/AssetCategory');
const MaintenanceWorkOrder = require('../../models/MaintenanceWorkOrder');
const MaintenanceRequest = require('../../models/MaintenanceRequest');
const AssetCalibrationRecord = require('../../models/AssetCalibrationRecord');
const MaintenanceContract = require('../../models/MaintenanceContract');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class AssetService {
  /**
   * Create Asset Category
   */
  static async createCategory(data, userId) {
    const payload = { ...data };
    if (!payload.categoryId) {
      payload.categoryId = payload.categoryCode || `CAT-${Date.now().toString().slice(-6)}`;
    }
    payload.createdBy = userId;
    const cat = new AssetCategory(payload);
    await cat.save();
    return cat;
  }

  /**
   * Get Asset Categories
   */
  static async getCategories(query = {}) {
    return await AssetCategory.find({ active: true, ...query }).sort({ name: 1 }).lean();
  }

  /**
   * Check for potential duplicate assets
   */
  static async detectDuplicates({ serialNumber, assetTag, externalAssetId, excludeId }) {
    const query = { $or: [] };
    if (serialNumber && serialNumber.trim()) {
      query.$or.push({ serialNumber: serialNumber.trim() });
    }
    if (assetTag && assetTag.trim()) {
      query.$or.push({ assetTag: assetTag.trim() });
    }
    if (externalAssetId && externalAssetId.trim()) {
      query.$or.push({ externalAssetId: externalAssetId.trim() });
    }

    if (query.$or.length === 0) return [];

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await Asset.find(query).populate('categoryId', 'name categoryId').lean();
  }

  /**
   * Register/Create new Asset
   */
  static async createAsset(data, userId) {
    // Check duplicates
    const duplicates = await this.detectDuplicates({
      serialNumber: data.serialNumber,
      assetTag: data.assetTag,
      externalAssetId: data.externalAssetId
    });

    if (duplicates.length > 0 && !data.forceCreate) {
      const dup = duplicates[0];
      const error = new Error(`Potential duplicate asset detected: ${dup.name} (${dup.assetTag || dup.serialNumber})`);
      error.statusCode = 409;
      error.details = { duplicateAsset: dup };
      throw error;
    }

    // Auto-generate assetId and assetTag if not supplied
    if (!data.assetId) {
      data.assetId = await IdGeneratorService.generateAssetId();
    }
    if (!data.assetTag) {
      let catCode = 'MED';
      if (data.categoryId) {
        const cat = await AssetCategory.findById(data.categoryId).lean();
        if (cat && cat.categoryId) {
          catCode = cat.categoryId.replace(/[^A-Z]/g, '').slice(0, 4) || 'MED';
        }
      }
      data.assetTag = await IdGeneratorService.generateAssetTag(catCode);
    }

    data.createdBy = userId;
    data.updatedBy = userId;

    const asset = new Asset(data);
    await asset.save();

    await AuditService.logEvent({
      action: 'ASSET_CREATED',
      module: 'MAINTENANCE',
      entityId: asset.assetId,
      performedBy: userId,
      details: { assetId: asset.assetId, name: asset.name, status: asset.status, criticality: asset.criticality }
    });

    return asset;
  }

  /**
   * Get paginated & filtered Assets
   */
  static async getAssets(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      status,
      criticality,
      departmentId,
      locationId,
      vendorId
    } = query;

    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.status = status;
    if (criticality) filter.criticality = criticality;
    if (departmentId) filter.departmentId = departmentId;
    if (locationId) filter.locationId = locationId;
    if (vendorId) filter.vendorId = vendorId;

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { assetId: regex },
        { assetTag: regex },
        { serialNumber: regex },
        { manufacturer: regex },
        { model: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      Asset.find(filter)
        .populate('categoryId', 'name categoryId maintenanceType defaultCriticality')
        .populate('departmentId', 'name code')
        .populate('assignedTo', 'firstName lastName email')
        .populate('vendorId', 'name vendorCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Asset.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1
    };
  }

  /**
   * Get single Asset by ID
   */
  static async getAssetById(id) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { $or: [{ assetId: id }, { assetTag: id }] };

    const asset = await Asset.findOne(query)
      .populate('categoryId')
      .populate('departmentId')
      .populate('assignedTo', 'firstName lastName email role')
      .populate('vendorId', 'name vendorCode contactPerson phone email')
      .populate('preventiveMaintenancePlanId')
      .lean();

    if (!asset) {
      const err = new Error('Asset not found');
      err.statusCode = 404;
      throw err;
    }

    return asset;
  }

  /**
   * Update Asset
   */
  static async updateAsset(id, updateData, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { assetId: id };

    updateData.updatedBy = userId;
    const asset = await Asset.findOneAndUpdate(query, updateData, { new: true, runValidators: true });
    if (!asset) {
      const err = new Error('Asset not found');
      err.statusCode = 404;
      throw err;
    }

    await AuditService.logEvent({
      action: 'ASSET_UPDATED',
      module: 'MAINTENANCE',
      entityId: asset.assetId,
      performedBy: userId,
      details: { changes: Object.keys(updateData) }
    });

    return asset;
  }

  /**
   * Update Asset Status with safety boundaries
   */
  static async updateAssetStatus(id, newStatus, reason, userId) {
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isMongoId ? { _id: id } : { assetId: id };

    const asset = await Asset.findOne(query);
    if (!asset) {
      const err = new Error('Asset not found');
      err.statusCode = 404;
      throw err;
    }

    const previousStatus = asset.status;
    asset.status = newStatus;
    if (newStatus === 'UNDER_MAINTENANCE' || newStatus === 'OUT_OF_SERVICE') {
      asset.maintenanceRequired = true;
    } else if (newStatus === 'ACTIVE' || newStatus === 'AVAILABLE') {
      asset.maintenanceRequired = false;
    }
    asset.updatedBy = userId;
    await asset.save();

    await AuditService.logEvent({
      action: 'ASSET_STATUS_CHANGED',
      module: 'MAINTENANCE',
      entityId: asset.assetId,
      performedBy: userId,
      details: { previousStatus, newStatus, reason }
    });

    return asset;
  }

  /**
   * Get full Asset history: work orders, requests, calibrations, contracts
   */
  static async getAssetHistory(id) {
    const asset = await this.getAssetById(id);

    const [workOrders, requests, calibrations, contracts] = await Promise.all([
      MaintenanceWorkOrder.find({ assetId: asset._id })
        .populate('assignedTechnicianId', 'firstName lastName')
        .populate('assignedVendorId', 'name')
        .sort({ createdAt: -1 })
        .lean(),
      MaintenanceRequest.find({ assetId: asset._id })
        .populate('requesterId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .lean(),
      AssetCalibrationRecord.find({ assetId: asset._id })
        .populate('performedBy', 'firstName lastName')
        .sort({ performedAt: -1 })
        .lean(),
      MaintenanceContract.find({ coveredAssets: asset._id })
        .populate('vendorId', 'name')
        .sort({ endDate: -1 })
        .lean()
    ]);

    // Build unified timeline
    const timeline = [];

    timeline.push({
      event: 'ASSET_CREATED',
      title: 'Asset Registered',
      date: asset.createdAt,
      details: `Installed in ${asset.departmentId?.name || 'Facility'}`
    });

    if (asset.installationDate) {
      timeline.push({
        event: 'INSTALLATION',
        title: 'Equipment Installed',
        date: asset.installationDate,
        details: `Manufacturer: ${asset.manufacturer || 'N/A'}, Model: ${asset.model || 'N/A'}`
      });
    }

    requests.forEach(r => {
      timeline.push({
        event: 'MAINTENANCE_REQUEST',
        title: `Request: ${r.title} (${r.status})`,
        date: r.requestedAt || r.createdAt,
        details: `Issue: ${r.issueType}, Priority: ${r.priority}, Reported by: ${r.requesterId?.firstName || 'Staff'}`
      });
    });

    workOrders.forEach(w => {
      timeline.push({
        event: 'WORK_ORDER',
        title: `Work Order: ${w.workOrderId} (${w.status})`,
        date: w.actualStart || w.createdAt,
        details: `Type: ${w.maintenanceType}, Tech: ${w.assignedTechnicianId?.firstName || w.assignedVendorId?.name || 'Unassigned'}`
      });
    });

    calibrations.forEach(c => {
      timeline.push({
        event: 'CALIBRATION',
        title: `Calibration: ${c.calibrationId} (${c.result})`,
        date: c.performedAt,
        details: `Performed by: ${c.performedByName || 'Certified Engineer'}, Due: ${new Date(c.dueDate).toLocaleDateString()}`
      });
    });

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      asset,
      workOrders,
      requests,
      calibrations,
      contracts,
      timeline
    };
  }
}

module.exports = AssetService;
