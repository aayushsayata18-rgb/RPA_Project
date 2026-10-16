const StockLocation = require('../models/StockLocation');
const IdGeneratorService = require('../services/IdGeneratorService');
const AuditService = require('../services/AuditService');

class StockLocationController {
  static async getLocations(req, res, next) {
    try {
      const { locationType, status, parentLocationId } = req.query;
      const filter = {};
      if (locationType) filter.locationType = locationType;
      if (status) filter.status = status;
      if (parentLocationId) filter.parentLocationId = parentLocationId;

      const locations = await StockLocation.find(filter).sort({ locationCode: 1 }).lean();
      res.json({ success: true, locations });
    } catch (err) {
      next(err);
    }
  }

  static async getLocationById(req, res, next) {
    try {
      const location = await StockLocation.findOne({
        $or: [{ locationId: req.params.id }, { locationCode: req.params.id }]
      }).lean();

      if (!location) {
        return res.status(404).json({ success: false, error: { message: 'Location not found.' } });
      }

      res.json({ success: true, location });
    } catch (err) {
      next(err);
    }
  }

  static async createLocation(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const {
        locationCode,
        locationName,
        locationType,
        departmentId,
        parentLocationId,
        address,
        temperatureControlled,
        temperatureRange,
        securityLevel,
        capacity,
        managerUserId
      } = req.body;

      if (!locationCode || !locationName) {
        return res.status(400).json({
          success: false,
          error: { message: 'locationCode and locationName are required.' }
        });
      }

      const locationId = req.body.locationId || (await IdGeneratorService.generateLocationId('LOC'));

      const location = new StockLocation({
        locationId,
        locationCode: locationCode.toUpperCase(),
        locationName,
        locationType: locationType || 'MAIN_STORE',
        departmentId: departmentId || '',
        parentLocationId: parentLocationId || null,
        address: address || {},
        temperatureControlled: Boolean(temperatureControlled),
        temperatureRange: temperatureRange || '15°C - 25°C',
        securityLevel: securityLevel || 'NORMAL',
        capacity: Number(capacity || 10000),
        status: 'ACTIVE',
        managerUserId: managerUserId || user.userId
      });

      await location.save();

      await AuditService.logEvent({
        eventType: 'LOCATION_CREATED',
        module: 'MEDICAL_INVENTORY',
        performedBy: user.userId,
        targetEntity: 'StockLocation',
        targetId: locationId,
        details: { locationCode, locationName, locationType }
      });

      res.status(201).json({ success: true, location });
    } catch (err) {
      next(err);
    }
  }

  static async updateLocation(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const location = await StockLocation.findOneAndUpdate(
        { locationId: req.params.id },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!location) {
        return res.status(404).json({ success: false, error: { message: 'Location not found.' } });
      }

      await AuditService.logEvent({
        eventType: 'LOCATION_UPDATED',
        module: 'MEDICAL_INVENTORY',
        performedBy: user.userId,
        targetEntity: 'StockLocation',
        targetId: req.params.id,
        details: req.body
      });

      res.json({ success: true, location });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StockLocationController;
