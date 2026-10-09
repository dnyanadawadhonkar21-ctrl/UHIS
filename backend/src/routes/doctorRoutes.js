const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

// Doctor discovery & availability (accessible to authenticated users e.g. PATIENT, DOCTOR)
router.get('/search', doctorController.searchDoctors);
router.get('/specializations', doctorController.getSpecializations);
router.get('/:doctorId/profile', doctorController.getDoctorProfile);
router.get('/:doctorId/availability', doctorController.getDoctorAvailability);

// Doctor specific OPD queue & appointments
router.get('/appointments', rbacMiddleware('DOCTOR'), doctorController.getDoctorAppointments);
router.get('/queue', rbacMiddleware('DOCTOR'), doctorController.getDoctorQueue);
router.put('/appointments/:appointmentId/status', rbacMiddleware('DOCTOR'), doctorController.updateAppointmentStatus);
router.post('/prescriptions', rbacMiddleware('DOCTOR'), doctorController.createPrescription);
router.post('/diagnoses', rbacMiddleware('DOCTOR'), doctorController.createDiagnosis);

module.exports = router;
