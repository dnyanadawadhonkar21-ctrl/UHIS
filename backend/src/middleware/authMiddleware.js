const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const prisma = require('../config/prisma');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        patientProfile: true,
        doctorProfile: true,
        labProfile: true,
        pharmacyProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
