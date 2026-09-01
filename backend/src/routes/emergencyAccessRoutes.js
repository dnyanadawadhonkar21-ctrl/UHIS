const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const {
  requestEmergencyAccess,
  getPatientEmergencyRequests,
  approveEmergencyAccess,
  rejectEmergencyAccess,
  verifyEmergencyAccess,
  getEmergencyPatientRecords,
  getActiveEmergencyAccess,
} = require('../controllers/emergencyAccessController');

const router = express.Router();

// All emergency-access routes require valid JWT authentication
router.use(authMiddleware);

// Doctor-only routes
router.post('/request', rbacMiddleware('DOCTOR'), requestEmergencyAccess);
router.post('/verify', rbacMiddleware('DOCTOR'), verifyEmergencyAccess);
router.get('/records/:requestId', rbacMiddleware('DOCTOR'), getEmergencyPatientRecords);

// Patient-only routes
router.get('/patient/requests', rbacMiddleware('PATIENT'), getPatientEmergencyRequests);
router.post('/patient/approve/:id', rbacMiddleware('PATIENT'), approveEmergencyAccess);
router.post('/patient/reject/:id', rbacMiddleware('PATIENT'), rejectEmergencyAccess);

// Common / Active check
router.get('/active', getActiveEmergencyAccess);

module.exports = router;
