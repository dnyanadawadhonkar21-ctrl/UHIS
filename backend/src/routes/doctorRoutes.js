const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/appointments', rbacMiddleware('DOCTOR'), doctorController.getDoctorAppointments);
router.put('/appointments/:appointmentId/status', rbacMiddleware('DOCTOR'), doctorController.updateAppointmentStatus);
router.post('/prescriptions', rbacMiddleware('DOCTOR'), doctorController.createPrescription);
router.post('/diagnoses', rbacMiddleware('DOCTOR'), doctorController.createDiagnosis);

module.exports = router;
