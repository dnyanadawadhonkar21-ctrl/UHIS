const express = require('express');
const router = express.Router();
const receptionistController = require('../controllers/receptionistController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.post('/walkin-patient', rbacMiddleware('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'), receptionistController.registerWalkInPatient);
router.get('/queue', rbacMiddleware('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'), receptionistController.getReceptionQueue);

module.exports = router;
