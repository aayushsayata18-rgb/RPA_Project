const express = require('express');
const router = express.Router();
const {
  generateDocument,
  listDocuments,
  getDocument,
  downloadDocument,
  previewDocument,
  approveDocument,
  releaseDocument,
  regenerateDocument,
  cancelDocument,
  uploadDocument,
  getPatientDocuments,
  getVersionHistory,
  getStats,
  getAccessLogs,
  runIntegrityCheck,
  runRetentionJob
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Generation & Upload
router.post('/generate', generateDocument);
router.post('/upload', uploadDocument);

// Patient Specific Endpoint
router.get('/patient/my-documents', getPatientDocuments);

// Reports & Maintenance
router.get('/reports/stats', getStats);
router.get('/reports/access-logs', getAccessLogs);
router.post('/maintenance/integrity-check', runIntegrityCheck);
router.post('/maintenance/retention-job', runRetentionJob);

// Document Listing
router.get('/', listDocuments);

// Single Document Operations
router.get('/:documentId', getDocument);
router.get('/:documentId/download', downloadDocument);
router.get('/:documentId/preview', previewDocument);
router.get('/:documentId/versions', getVersionHistory);
router.post('/:documentId/approve', approveDocument);
router.post('/:documentId/release', releaseDocument);
router.post('/:documentId/regenerate', regenerateDocument);
router.post('/:documentId/cancel', cancelDocument);

module.exports = router;
