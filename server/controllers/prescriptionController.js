const PrescriptionService = require('../services/pharmacy/prescriptionService');

class PrescriptionController {
  static async createPrescription(req, res, next) {
    try {
      const data = {
        ...req.body,
        doctorId: req.body.doctorId || req.user?.userId,
        doctorName: req.body.doctorName || req.user?.name || req.user?.username
      };
      const prescription = await PrescriptionService.createPrescription({
        ...data,
        actorUser: req.user
      });
      return res.status(201).json({
        success: true,
        message: `Prescription '${prescription.prescriptionId}' created successfully.`,
        prescription
      });
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ success: false, message: err.message });
      }
      if (err.message.includes('cannot be prescribed') || err.message.includes('INACTIVE') || err.message.includes('DISCONTINUED')) {
        return res.status(422).json({ success: false, message: err.message, errorCode: 'INVALID_MEDICINE_STATUS' });
      }
      next(err);
    }
  }

  static async getPrescriptions(req, res, next) {
    try {
      const query = { ...req.query };
      // If patient is viewing, restrict to own prescriptions
      if (req.user?.role === 'PATIENT') {
        query.patientId = req.user.userId;
      }
      const result = await PrescriptionService.getPrescriptions(query);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getPrescriptionById(req, res, next) {
    try {
      const prescription = await PrescriptionService.getPrescriptionById(req.params.id);
      // Privacy check: Patient can only view own prescription
      if (req.user?.role === 'PATIENT' && prescription.patientId !== req.user.userId) {
        return res.status(403).json({ success: false, message: 'Access denied to other patient prescriptions.' });
      }
      return res.json({ success: true, prescription });
    } catch (err) {
      next(err);
    }
  }

  static async sendToPharmacy(req, res, next) {
    try {
      const { orderType, priority } = req.body;
      const result = await PrescriptionService.sendToPharmacy(req.params.id, orderType, priority, req.user);
      return res.json({
        success: true,
        message: `Prescription '${req.params.id}' sent to Pharmacy.`,
        ...result
      });
    } catch (err) {
      if (err.message.includes('expired')) {
        return res.status(422).json({ success: false, message: err.message, errorCode: 'PRESCRIPTION_EXPIRED' });
      }
      next(err);
    }
  }

  static async validatePrescription(req, res, next) {
    try {
      const prescription = await PrescriptionService.validatePrescription(req.params.id, req.user);
      return res.json({
        success: true,
        message: `Prescription '${req.params.id}' validated by pharmacist.`,
        prescription
      });
    } catch (err) {
      if (err.message.includes('expired')) {
        return res.status(422).json({ success: false, message: err.message, errorCode: 'PRESCRIPTION_EXPIRED' });
      }
      next(err);
    }
  }

  static async holdPrescription(req, res, next) {
    try {
      const { reason } = req.body;
      const prescription = await PrescriptionService.holdPrescription(req.params.id, reason, req.user);
      return res.json({
        success: true,
        message: `Prescription '${req.params.id}' placed ON_HOLD.`,
        prescription
      });
    } catch (err) {
      next(err);
    }
  }

  static async cancelPrescription(req, res, next) {
    try {
      const { reason } = req.body;
      const prescription = await PrescriptionService.cancelPrescription(req.params.id, reason, req.user);
      return res.json({
        success: true,
        message: `Prescription '${req.params.id}' cancelled.`,
        prescription
      });
    } catch (err) {
      if (err.message.includes('already dispensed')) {
        return res.status(409).json({ success: false, message: err.message });
      }
      next(err);
    }
  }
}

module.exports = PrescriptionController;
