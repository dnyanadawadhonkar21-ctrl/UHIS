const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

// Helper to generate unique ABDM-compliant ABHA ID (14 digits with hyphens: 91-XXXX-XXXX-XXXX)
const generateAbhaId = async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const part1 = '91';
    const part2 = Math.floor(1000 + Math.random() * 9000);
    const part3 = Math.floor(1000 + Math.random() * 9000);
    const part4 = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${part1}-${part2}-${part3}-${part4}`;
    const exists = await prisma.patient.findUnique({ where: { abhaId: candidate } });
    if (!exists) {
      return candidate;
    }
  }
  return `91-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Helper to generate unique UHIS ID (e.g. PT-2026-001)
const generateUhisId = async () => {
  const currentYear = new Date().getFullYear();
  const count = await prisma.patient.count();
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = `PT-${currentYear}-${String(count + 1 + attempt).padStart(3, '0')}`;
    const exists = await prisma.patient.findUnique({ where: { uhisId: candidate } });
    if (!exists) {
      return candidate;
    }
  }
  return `PT-${currentYear}-${Date.now().toString().slice(-4)}`;
};

const register = async (req, res, next) => {
  try {
    const {
      fullName, email, password, role = 'PATIENT', phoneNumber, gender, dateOfBirth,
      bloodGroup, height, weight, address, emergencyContact, emergencyPhone,
      allergies, chronicConditions, pastSurgeries, pastMedications,
      abhaId: customAbhaId
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    let finalAbhaId = null;
    let finalUhisId = null;
    if (role === 'PATIENT') {
      finalUhisId = await generateUhisId();
      if (customAbhaId && typeof customAbhaId === 'string' && customAbhaId.trim()) {
        const trimmedAbha = customAbhaId.trim();
        // Validation: length and format
        if (trimmedAbha.length < 3 || trimmedAbha.length > 35 || !/^[A-Za-z0-9-]+$/.test(trimmedAbha)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid ABHA ID format. Please enter a valid ABHA ID (e.g., 91-4782-3391-6284).',
          });
        }
        // Unique check before creation
        const existingAbha = await prisma.patient.findUnique({ where: { abhaId: trimmedAbha } });
        if (existingAbha) {
          return res.status(400).json({
            success: false,
            message: 'This ABHA ID is already registered in the system.',
          });
        }
        finalAbhaId = trimmedAbha;
      } else {
        finalAbhaId = await generateAbhaId();
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          role,
          phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        },
      });

      // Auto-create profile if PATIENT
      if (role === 'PATIENT') {
        await tx.patient.create({
          data: {
            userId: newUser.id,
            uhisId: finalUhisId,
            abhaId: finalAbhaId,
            gender: gender || 'MALE',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1998-05-15'),
            bloodGroup: bloodGroup || 'O+',
            height: height || null,
            weight: weight || null,
            address: address || null,
            emergencyContact: emergencyContact || null,
            emergencyPhone: emergencyPhone || null,
            allergies: allergies || null,
            chronicConditions: chronicConditions || null,
            pastSurgeries: pastSurgeries || null,
            pastMedications: pastMedications || null,
          },
        });
      }

      return newUser;
    });

    const token = jwt.sign({ id: result.id, role: result.role, email: result.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: result.id,
        action: 'USER_REGISTER',
        resource: 'AUTH',
        details: `User registered with role ${result.role}${finalAbhaId ? ` and ABHA ID ${finalAbhaId}` : ''}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: result.id,
        fullName: result.fullName,
        email: result.email,
        role: result.role,
        abhaId: finalAbhaId,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const target = String(error.meta?.target || error.message || '');
      if (target.includes('abhaId')) {
        return res.status(400).json({
          success: false,
          message: 'This ABHA ID is already registered in the system.',
        });
      }
      if (target.includes('email')) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already registered.',
        });
      }
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patientProfile: true,
        doctorProfile: true,
        labProfile: true,
        pharmacyProfile: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Check email and password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'AUTH',
        ipAddress: req.ip,
        details: `Successful login for ${user.email}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        patientProfile: user.patientProfile,
        doctorProfile: user.doctorProfile,
        labProfile: user.labProfile,
        pharmacyProfile: user.pharmacyProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        patientProfile: true,
        doctorProfile: { include: { hospital: true, department: true } },
        labProfile: true,
        pharmacyProfile: true,
      },
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user account found with this email.' });
    }

    // Production ready simulation token
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email (simulated for demo). Use reset-password endpoint.',
      resetToken: 'simulated_reset_token_uhis_2026',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password required.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You may now log in.',
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords required.' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid current password.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
