const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/stats', rbacMiddleware('SUPER_ADMIN'), adminController.getSystemStats);
router.post('/hospitals', rbacMiddleware('SUPER_ADMIN'), adminController.createHospital);
router.get('/audit-logs', rbacMiddleware('SUPER_ADMIN'), adminController.getAuditLogs);

module.exports = router;
