const express = require('express');
const router = express.Router();
const { getJobs, createJob, updateJobStatus } = require('../controllers/rpaController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// Worker callback endpoint (can authenticate via token or secret)
router.post('/jobs/:jobId/status', updateJobStatus);

router.use(protect);
router.get('/jobs', authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER, ROLES.HOSPITAL_MANAGEMENT), getJobs);
router.post('/jobs', authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.ADMIN_MANAGER), createJob);

module.exports = router;
