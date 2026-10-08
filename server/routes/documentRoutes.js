const express = require('express');
const router = express.Router();
const { getDocument, listDocuments } = require('../controllers/documentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', listDocuments);
router.get('/:documentId', getDocument);

module.exports = router;
