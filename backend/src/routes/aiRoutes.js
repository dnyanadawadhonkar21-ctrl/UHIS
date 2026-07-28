const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/symptom-checker', aiController.analyzeSymptoms);
router.post('/health-risk-score', aiController.calculateHealthRiskScore);
router.post('/classify-report', aiController.classifyMedicalReport);
router.post('/prescription-ocr', aiController.parsePrescriptionOCR);

module.exports = router;
