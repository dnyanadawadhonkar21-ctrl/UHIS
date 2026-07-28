const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/orders', rbacMiddleware('LABORATORY', 'DOCTOR', 'SUPER_ADMIN'), labController.getLabOrders);
router.post('/orders', rbacMiddleware('LABORATORY', 'DOCTOR'), labController.createLabReportOrder);
router.put('/orders/:reportId/results', rbacMiddleware('LABORATORY'), labController.updateLabReportResult);

module.exports = router;
