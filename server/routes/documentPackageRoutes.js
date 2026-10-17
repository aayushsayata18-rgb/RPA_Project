const express = require('express');
const router = express.Router();
const {
  createPackage,
  listPackages,
  getPackage,
  downloadPackage
} = require('../controllers/documentPackageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', listPackages);
router.post('/', createPackage);
router.get('/:packageId', getPackage);
router.get('/:packageId/download', downloadPackage);

module.exports = router;
