const express = require('express');
const router = express.Router();
const { getExceptions, resolveException } = require('../controllers/exceptionController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getExceptions);
router.put('/:exceptionId/resolve', resolveException);

module.exports = router;
