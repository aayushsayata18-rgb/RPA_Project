const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const VendorController = require('../controllers/vendorController');
const VendorContactController = require('../controllers/vendorContactController');
const VendorDocumentController = require('../controllers/vendorDocumentController');
const VendorVerificationController = require('../controllers/vendorVerificationController');
const VendorContractController = require('../controllers/vendorContractController');
const VendorPerformanceController = require('../controllers/vendorPerformanceController');
const VendorIssueController = require('../controllers/vendorIssueController');

// All vendor management routes require authentication
router.use(protect);

// 1. Analytics, Expiry Checks & Issues Across Vendors
router.get('/stats', VendorController.getDashboardKPIs);
router.post('/check-duplicate', VendorController.checkDuplicate);
router.get('/documents/check-expiry', VendorDocumentController.checkExpiry);
router.post('/documents/check-expiry', VendorDocumentController.checkExpiry);
router.get('/contracts/check-expiring', VendorContractController.checkExpiring);
router.post('/contracts/check-expiring', VendorContractController.checkExpiring);
router.get('/issues/all', VendorIssueController.listAllIssues);
router.post('/issues/:issueId/respond', VendorIssueController.respondToIssue);
router.patch('/issues/:issueId/status', VendorIssueController.updateStatus);
router.post('/change-requests/:id/review', VendorController.reviewChangeRequest);

// 2. Vendor Master CRUD
router.get('/', VendorController.getVendors);
router.post('/', VendorController.createVendor);
router.get('/:id', VendorController.getVendorById);
router.put('/:id', VendorController.updateVendor);
router.patch('/:id/status', VendorController.updateStatus);
router.post('/:id/communications', VendorController.logCommunication);
router.get('/:id/change-requests', VendorController.getChangeRequests);

// 3. Contacts & Addresses
router.get('/:id/contacts', VendorContactController.getContacts);
router.post('/:id/contacts', VendorContactController.createContact);
router.put('/:id/contacts/:contactId', VendorContactController.updateContact);
router.delete('/:id/contacts/:contactId', VendorContactController.deleteContact);
router.get('/:id/addresses', VendorContactController.getAddresses);
router.post('/:id/addresses', VendorContactController.createAddress);

// 4. Documents
router.get('/:id/documents', VendorDocumentController.getDocuments);
router.post('/:id/documents', VendorDocumentController.uploadDocument);
router.post('/:id/documents/:documentId/verify', VendorDocumentController.verifyDocument);
router.post('/:id/documents/:documentId/reject', VendorDocumentController.rejectDocument);

// 5. Verification
router.get('/:id/verification', VendorVerificationController.getVerifications);
router.post('/:id/verification', VendorVerificationController.requestVerification);
router.post('/:id/verification/:verificationId/evidence', VendorVerificationController.addEvidence);
router.post('/:id/verification/:verificationId/complete', VendorVerificationController.completeVerification);

// 6. Contracts
router.get('/:id/contracts', VendorContractController.getContracts);
router.post('/:id/contracts', VendorContractController.createContract);
router.put('/:id/contracts/:contractId', VendorContractController.updateContract);
router.post('/:id/contracts/:contractId/approve', VendorContractController.approveContract);
router.post('/:id/contracts/:contractId/renew', VendorContractController.renewContract);
router.post('/:id/contracts/:contractId/terminate', VendorContractController.terminateContract);

// 7. Performance
router.get('/:id/performance', VendorPerformanceController.getPerformance);
router.post('/:id/performance/reviews', VendorPerformanceController.createReview);
router.post('/:id/performance/reviews/:reviewId/complete', VendorPerformanceController.completeReview);

// 8. Issues
router.get('/:id/issues', VendorIssueController.getIssuesByVendor);
router.post('/:id/issues', VendorIssueController.createIssue);
router.post('/:id/issues/:issueId/resolve', VendorIssueController.resolveIssue);

module.exports = router;
