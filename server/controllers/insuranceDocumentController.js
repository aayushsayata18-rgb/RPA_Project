const InsuranceEvidenceService = require('../services/insuranceEvidenceService');

class InsuranceDocumentController {
  static async uploadEvidence(req, res) {
    try {
      const doc = await InsuranceEvidenceService.recordEvidence({
        ...req.body,
        verificationId: req.params.verificationId || req.body.verificationId,
        uploadedBy: req.user?.username || req.user?.userId || 'STAFF',
        source: req.user?.role === 'PATIENT' ? 'PATIENT_UPLOAD' : 'STAFF_UPLOAD'
      });
      res.status(201).json({ success: true, message: 'Document saved successfully', document: doc });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getVerificationEvidence(req, res) {
    try {
      const evidence = await InsuranceEvidenceService.getVerificationEvidence(req.params.verificationId);
      res.json({ success: true, count: evidence.length, evidence });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getPolicyDocuments(req, res) {
    try {
      const documents = await InsuranceEvidenceService.getPolicyDocuments(req.params.policyId);
      res.json({ success: true, count: documents.length, documents });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = InsuranceDocumentController;
