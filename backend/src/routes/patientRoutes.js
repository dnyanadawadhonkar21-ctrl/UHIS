const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(authMiddleware);

// Level 1: Basic / Critical Patient Info (Doctor only, data minimized)
router.get('/:patientId/basic', rbacMiddleware('DOCTOR'), patientController.getPatientBasicInfo);

// Level 2: Full Patient Medical Info (Doctor only, requires verified patient OTP authorization)
router.get('/:patientId/full', rbacMiddleware('DOCTOR'), patientController.getPatientFullInfo);

// Patient Medical Records (Accessible to Patient for own records, or Doctor with verified emergency authorization)
router.get('/:patientId/medical-records', patientController.getPatientMedicalRecords);
router.get('/medical-records', patientController.getPatientMedicalRecords);

router.get('/profile/:patientId?', patientController.getPatientProfile);
router.get('/:patientId/profile', patientController.getPatientProfile);

router.get('/timeline/:patientId?', patientController.getUnifiedTimeline);

router.post('/appointments', rbacMiddleware('PATIENT', 'RECEPTIONIST'), patientController.bookAppointment);
router.put('/appointments/:appointmentId/cancel', patientController.cancelAppointment);
router.put('/profile', rbacMiddleware('PATIENT'), patientController.updatePatientProfile);

// Medical Records Endpoints
router.get('/medical-records', patientController.getMedicalRecords);
router.post(
  '/medical-records',
  rbacMiddleware('PATIENT'),
  upload.single('file'),
  patientController.uploadMedicalRecord
);
router.get('/medical-records/:id/file', patientController.getMedicalRecordFile);

module.exports = router;

