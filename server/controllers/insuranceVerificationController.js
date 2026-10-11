const InsuranceVerificationService = require('../services/insuranceVerificationService');
const InsuranceVerification = require('../models/InsuranceVerification');

class InsuranceVerificationController {
  static async requestVerification(req, res) {
    try {
      const { policyId } = req.params;
      const result = await InsuranceVerificationService.requestVerification(
        policyId,
        req.body,
        req.user || {}
      );
      res.status(202).json({
        success: true,
        message: result.isExisting ? 'Active verification already running' : 'Verification queued successfully',
        ...result
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getVerificationById(req, res) {
    try {
      const verification = await InsuranceVerificationService.getVerificationById(req.params.verificationId);
      res.json({ success: true, verification });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  static async getPolicyVerifications(req, res) {
    try {
      const { policyId } = req.params;
      const verifications = await InsuranceVerification.find({ policyId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, count: verifications.length, verifications });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getPatientVerifications(req, res) {
    try {
      const { patientId } = req.params;
      const verifications = await InsuranceVerification.find({ patientId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, count: verifications.length, verifications });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async listVerifications(req, res) {
    try {
      const data = await InsuranceVerificationService.listVerifications(req.query);
      res.json({ success: true, ...data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async retryVerification(req, res) {
    try {
      const { verificationId } = req.params;
      const verification = await InsuranceVerificationService.retryVerification(verificationId, req.user || {});
      res.json({
        success: true,
        message: 'Verification retry executed',
        verification
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async recordManualVerification(req, res) {
    try {
      const { verificationId } = req.params;
      const verification = await InsuranceVerificationService.recordManualVerification(
        verificationId,
        req.body,
        req.user || {}
      );
      res.json({
        success: true,
        message: 'Manual verification saved successfully',
        verification
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getDashboardStats(req, res) {
    try {
      const stats = await InsuranceVerificationService.getDashboardStats();
      res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = InsuranceVerificationController;
