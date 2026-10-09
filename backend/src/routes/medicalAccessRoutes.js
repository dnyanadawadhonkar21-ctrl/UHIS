const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const {
  createAccessRequest,
  getPatientAccessRequests,
  getDoctorAccessRequests,
  denyAccessRequest,
  allowAccessRequest,
  getDoctorRequestStatus,
  verifyAccessOTP,
  getAuthorizedPatientRecords,
  checkActiveSession,
  revokeAccessSession,
} = require('../controllers/medicalAccessController');

const router = express.Router();

// All medical-access routes require valid JWT authentication
router.use(authMiddleware);

// Doctor routes
router.post('/request', rbacMiddleware('DOCTOR'), createAccessRequest);
router.get('/doctor/requests', rbacMiddleware('DOCTOR'), getDoctorAccessRequests);
router.get('/doctor/status/:requestId', rbacMiddleware('DOCTOR'), getDoctorRequestStatus);
router.post('/doctor/verify-otp', rbacMiddleware('DOCTOR'), verifyAccessOTP);
router.post('/verify-otp', rbacMiddleware('DOCTOR'), verifyAccessOTP);
router.get('/records/:patientId', rbacMiddleware('DOCTOR'), getAuthorizedPatientRecords);
router.post('/session/revoke', rbacMiddleware('DOCTOR'), revokeAccessSession);
router.post('/session/:sessionId/revoke', rbacMiddleware('DOCTOR'), revokeAccessSession);
router.post('/doctor/revoke-session/:sessionId', rbacMiddleware('DOCTOR'), revokeAccessSession);
router.post('/revoke/:patientId', rbacMiddleware('DOCTOR'), revokeAccessSession);

// Patient routes
router.get('/patient/requests', rbacMiddleware('PATIENT'), getPatientAccessRequests);
router.post('/patient/allow/:requestId', rbacMiddleware('PATIENT'), allowAccessRequest);
router.post('/patient/deny/:requestId', rbacMiddleware('PATIENT'), denyAccessRequest);

// Session status check
router.get('/active-session/:patientId', checkActiveSession);

module.exports = router;
