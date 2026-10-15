const MedicineService = require('../services/pharmacy/medicineService');
const StockAvailabilityService = require('../services/pharmacy/stockAvailabilityService');

class PharmacyMedicineController {
  static async getMedicines(req, res, next) {
    try {
      const result = await MedicineService.getMedicines(req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getMedicineById(req, res, next) {
    try {
      const medicine = await MedicineService.getMedicineById(req.params.medicineId);
      return res.json({ success: true, medicine });
    } catch (err) {
      next(err);
    }
  }

  static async createMedicine(req, res, next) {
    try {
      const medicine = await MedicineService.createMedicine(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: `Medicine '${medicine.genericName}' created successfully.`,
        medicine
      });
    } catch (err) {
      if (err.message.includes('Duplicate medicine')) {
        return res.status(409).json({ success: false, message: err.message, errorCode: 'DUPLICATE_MEDICINE' });
      }
      next(err);
    }
  }

  static async updateMedicine(req, res, next) {
    try {
      const medicine = await MedicineService.updateMedicine(req.params.medicineId, req.body, req.user);
      return res.json({
        success: true,
        message: `Medicine '${medicine.medicineId}' updated successfully.`,
        medicine
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateMedicineStatus(req, res, next) {
    try {
      const { status } = req.body;
      const medicine = await MedicineService.updateMedicineStatus(req.params.medicineId, status, req.user);
      return res.json({
        success: true,
        message: `Status of medicine '${medicine.medicineId}' changed to ${status}.`,
        medicine
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAvailability(req, res, next) {
    try {
      const availability = await StockAvailabilityService.getStockAvailability(req.params.medicineId);
      return res.json({ success: true, availability });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PharmacyMedicineController;
