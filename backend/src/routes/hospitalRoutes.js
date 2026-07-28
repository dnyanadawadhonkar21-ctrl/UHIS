const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/metrics', rbacMiddleware('HOSPITAL_ADMIN', 'SUPER_ADMIN'), hospitalController.getHospitalMetrics);
router.post('/doctors', rbacMiddleware('HOSPITAL_ADMIN', 'SUPER_ADMIN'), hospitalController.createDoctor);

module.exports = router;
