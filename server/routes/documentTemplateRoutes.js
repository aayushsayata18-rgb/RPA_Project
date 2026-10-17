const express = require('express');
const router = express.Router();
const {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  approveTemplate,
  activateTemplate,
  deactivateTemplate,
  previewTemplate
} = require('../controllers/documentTemplateController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', listTemplates);
router.post('/', createTemplate);
router.get('/:id', getTemplate);
router.patch('/:id', updateTemplate);
router.post('/:id/approve', approveTemplate);
router.post('/:id/activate', activateTemplate);
router.post('/:id/deactivate', deactivateTemplate);
router.post('/:id/preview', previewTemplate);

module.exports = router;
