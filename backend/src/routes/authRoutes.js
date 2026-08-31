const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
