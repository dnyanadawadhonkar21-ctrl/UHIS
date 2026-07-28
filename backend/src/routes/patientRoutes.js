const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/profile/:patientId?', patientController.getPatientProfile);
router.get('/timeline/:patientId?', patientController.getUnifiedTimeline);
router.post('/appointments', rbacMiddleware('PATIENT', 'RECEPTIONIST'), patientController.bookAppointment);
router.put('/appointments/:appointmentId/cancel', patientController.cancelAppointment);
router.put('/health-details', rbacMiddleware('PATIENT'), patientController.updateEmergencyContacts);

module.exports = router;
