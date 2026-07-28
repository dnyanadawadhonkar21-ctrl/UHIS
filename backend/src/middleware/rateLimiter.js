const rateLimit = require('express-rate-limit');

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // limit auth attempts to 30 per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait before trying again.',
  },
});

module.exports = { apiRateLimiter, authRateLimiter };
