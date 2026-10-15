const DispensingService = require('../services/pharmacy/dispensingService');

class DispensingController {
  static async dispense(req, res, next) {
    try {
      const data = {
        ...req.body,
        pharmacistId: req.body.pharmacistId || req.user?.userId,
        pharmacistName: req.body.pharmacistName || req.user?.name || req.user?.username,
        items: req.body.items || req.body.dispensedItems,
        actorUser: req.user
      };
      const record = await DispensingService.dispenseOrder(data);
      return res.status(201).json({
        success: true,
        message: `Dispensing completed successfully. Record ID: ${record.dispensingRecordId}.`,
        record,
        dispensingRecord: record
      });
    } catch (err) {
      if (err.message.includes('BARCODE_MISMATCH') || err.message.includes('Barcode') || err.message.includes('MEDICINE_MISMATCH') || err.message.includes('No items were successfully prepared')) {
        return res.status(400).json({ success: false, message: err.message, errorCode: 'MEDICINE_MISMATCH' });
      }
      if (err.message.includes('EXPIRED_BATCH')) {
        return res.status(422).json({ success: false, message: err.message, errorCode: 'EXPIRED_BATCH' });
      }
      if (err.message.includes('CONTROLLED_MEDICINE')) {
        return res.status(403).json({ success: false, message: err.message, errorCode: 'CONTROLLED_MEDICINE_APPROVAL_REQUIRED' });
      }
      if (err.message.includes('already been completed') || err.message.includes('Duplicate')) {
        return res.status(409).json({ success: false, message: err.message, errorCode: 'DUPLICATE_DISPENSING' });
      }
      if (err.message.includes('not found')) {
        return res.status(404).json({ success: false, message: err.message });
      }
      next(err);
    }
  }

  static async getDispensingRecords(req, res, next) {
    try {
      const query = { ...req.query };
      if (req.user?.role === 'PATIENT') {
        query.patientId = req.user.userId;
      }
      const result = await DispensingService.getDispensingRecords(query);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getDispensingRecordById(req, res, next) {
    try {
      const record = await DispensingService.getDispensingRecordById(req.params.id);
      if (req.user?.role === 'PATIENT' && record.patientId !== req.user.userId) {
        return res.status(403).json({ success: false, message: 'Access denied to other patient dispensing records.' });
      }
      return res.json({ success: true, record });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DispensingController;
