const InsurancePolicyService = require('../services/insurancePolicyService');

class InsurancePolicyController {
  static async createPolicy(req, res) {
    try {
      const policy = await InsurancePolicyService.createPolicy(req.body, req.user || {});
      res.status(201).json({
        success: true,
        message: 'Insurance policy created successfully',
        policy
      });
    } catch (err) {
      if (err.code === 'DUPLICATE_POLICY') {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_POLICY',
          message: err.message,
          existingPolicy: err.existingPolicy
        });
      }
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getPolicyById(req, res) {
    try {
      const policy = await InsurancePolicyService.getPolicyById(req.params.id);
      res.json({ success: true, policy });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  static async getPatientPolicies(req, res) {
    try {
      const { patientId } = req.params;
      const policies = await InsurancePolicyService.getPatientPolicies(patientId);
      res.json({ success: true, count: policies.length, policies });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getActivePolicyForBilling(req, res) {
    try {
      const { patientId } = req.params;
      const data = await InsurancePolicyService.getActivePolicyForBilling(patientId);
      res.json({ success: true, ...data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async updatePolicy(req, res) {
    try {
      const policy = await InsurancePolicyService.updatePolicy(req.params.id, req.body, req.user || {});
      res.json({ success: true, message: 'Policy updated successfully', policy });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async deletePolicy(req, res) {
    try {
      const result = await InsurancePolicyService.archivePolicy(req.params.id, req.user || {});
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async checkDuplicate(req, res) {
    try {
      const duplicate = await InsurancePolicyService.findDuplicatePolicy(req.body);
      res.json({
        success: true,
        isDuplicate: !!duplicate,
        existingPolicy: duplicate
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = InsurancePolicyController;
