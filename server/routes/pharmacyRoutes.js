const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

const PharmacyMedicineController = require('../controllers/pharmacyMedicineController');
const PrescriptionController = require('../controllers/prescriptionController');
const PharmacyOrderController = require('../controllers/pharmacyOrderController');
const DispensingController = require('../controllers/dispensingController');
const PharmacyReturnController = require('../controllers/pharmacyReturnController');
const PharmacyReportController = require('../controllers/pharmacyReportController');

// All pharmacy routes require authenticated token
router.use(protect);

// ==========================================
// 1. Medicine Catalog APIs
// ==========================================
router.get('/medicines', PharmacyMedicineController.getMedicines);
router.get('/medicines/:medicineId', PharmacyMedicineController.getMedicineById);
router.post(
  '/medicines',
  authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  PharmacyMedicineController.createMedicine
);
router.put(
  '/medicines/:medicineId',
  authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  PharmacyMedicineController.updateMedicine
);
router.patch(
  '/medicines/:medicineId/status',
  authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  PharmacyMedicineController.updateMedicineStatus
);

// Stock availability
router.get('/availability/:medicineId', PharmacyMedicineController.getAvailability);

// ==========================================
// 2. Prescription APIs
// ==========================================
router.get('/prescriptions', PrescriptionController.getPrescriptions);
router.get('/prescriptions/:id', PrescriptionController.getPrescriptionById);

// Only DOCTOR, ADMIN_MANAGER, SYSTEM_ADMIN can create prescriptions (Pharmacists & Billing cannot!)
router.post(
  '/prescriptions',
  authorizeRoles(ROLES.DOCTOR, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  PrescriptionController.createPrescription
);

router.post('/prescriptions/:id/send', PrescriptionController.sendToPharmacy);
router.post(
  '/prescriptions/:id/validate',
  authorizeRoles(ROLES.PHARMACIST, ROLES.SYSTEM_ADMIN),
  PrescriptionController.validatePrescription
);
router.post('/prescriptions/:id/hold', PrescriptionController.holdPrescription);
router.post(
  '/prescriptions/:id/cancel',
  authorizeRoles(ROLES.DOCTOR, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  PrescriptionController.cancelPrescription
);

// ==========================================
// 3. Pharmacy Order APIs
// ==========================================
router.get('/orders', PharmacyOrderController.getOrders);
router.get('/orders/:id', PharmacyOrderController.getOrderById);
router.post(
  '/orders/:id/receive',
  authorizeRoles(ROLES.PHARMACIST, ROLES.SYSTEM_ADMIN),
  PharmacyOrderController.receiveOrder
);
router.post(
  '/orders/:id/reserve',
  authorizeRoles(ROLES.PHARMACIST, ROLES.SYSTEM_ADMIN),
  PharmacyOrderController.reserveStock
);
router.delete(
  '/orders/:id/reservation',
  authorizeRoles(ROLES.PHARMACIST, ROLES.SYSTEM_ADMIN),
  PharmacyOrderController.releaseReservation
);
router.post(
  '/orders/:id/hold',
  authorizeRoles(ROLES.PHARMACIST, ROLES.SYSTEM_ADMIN),
  PharmacyOrderController.holdOrder
);
router.post(
  '/orders/:id/cancel',
  authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  PharmacyOrderController.cancelOrder
);

// ==========================================
// 4. Dispensing APIs (Doctors & Billing Staff FORBIDDEN)
// ==========================================
router.post(
  '/dispensing',
  authorizeRoles(ROLES.PHARMACIST, ROLES.SYSTEM_ADMIN),
  DispensingController.dispense
);
router.get('/dispensing', DispensingController.getDispensingRecords);
router.get('/dispensing/:id', DispensingController.getDispensingRecordById);

// ==========================================
// 5. Pharmacy Return APIs
// ==========================================
router.post('/returns', PharmacyReturnController.createReturn);
router.get('/returns', PharmacyReturnController.getReturns);
router.get('/returns/:id', PharmacyReturnController.getReturnById);
router.post(
  '/returns/:id/approve',
  authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  PharmacyReturnController.reviewReturn
);
router.post(
  '/returns/:id/process',
  authorizeRoles(ROLES.PHARMACIST, ROLES.SYSTEM_ADMIN),
  PharmacyReturnController.processReturn
);
router.post(
  '/returns/:id/reject',
  authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN_MANAGER, ROLES.SYSTEM_ADMIN),
  (req, res, next) => {
    req.body.action = 'REJECT';
    PharmacyReturnController.reviewReturn(req, res, next);
  }
);

// ==========================================
// 6. Reports & Analytics APIs
// ==========================================
router.get('/reports/kpis', PharmacyReportController.getDashboardKPIs);
router.get('/reports/dispensing', PharmacyReportController.getDispensingReport);
router.get('/reports/orders', PharmacyReportController.getOrdersReport);
router.get('/reports/out-of-stock', PharmacyReportController.getOutOfStockReport);
router.get('/reports/near-expiry', PharmacyReportController.getNearExpiryReport);

module.exports = router;
