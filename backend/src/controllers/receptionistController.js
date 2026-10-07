const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

const registerWalkInPatient = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, gender, dateOfBirth, abhaId: customAbhaId } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Patient full name is required.' });
    }

    const dummyPassword = await bcrypt.hash('patient123', 10);
    const userEmail = (email && email.trim()) ? email.trim().toLowerCase() : `patient_${Date.now()}@uhis.org`;

    let finalAbhaId = null;
    if (customAbhaId && typeof customAbhaId === 'string' && customAbhaId.trim()) {
      const trimmedAbha = customAbhaId.trim();
      if (trimmedAbha.length < 3 || trimmedAbha.length > 35 || !/^[A-Za-z0-9-]+$/.test(trimmedAbha)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ABHA ID format. Please enter a valid ABHA ID (e.g., 91-4782-3391-6284).',
        });
      }
      const existingAbha = await prisma.patient.findUnique({ where: { abhaId: trimmedAbha } });
      if (existingAbha) {
        return res.status(400).json({
          success: false,
          message: 'This ABHA ID is already registered in the system.',
        });
      }
      finalAbhaId = trimmedAbha;
    } else {
      // Generate unique 14-digit ABHA ID
      let candidate = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      let exists = await prisma.patient.findUnique({ where: { abhaId: candidate } });
      while (exists) {
        candidate = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        exists = await prisma.patient.findUnique({ where: { abhaId: candidate } });
      }
      finalAbhaId = candidate;
    }

    // Generate unique UHIS ID (e.g. PT-2026-001)
    const patientCount = await prisma.patient.count();
    let candidateUhis = `PT-${new Date().getFullYear()}-${String(patientCount + 1).padStart(3, '0')}`;
    let uhisExists = await prisma.patient.findUnique({ where: { uhisId: candidateUhis } });
    let uhisAttempt = 1;
    while (uhisExists) {
      candidateUhis = `PT-${new Date().getFullYear()}-${String(patientCount + 1 + uhisAttempt).padStart(3, '0')}`;
      uhisExists = await prisma.patient.findUnique({ where: { uhisId: candidateUhis } });
      uhisAttempt++;
    }

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: userEmail,
          password: dummyPassword,
          role: 'PATIENT',
          phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        },
      });

      const patient = await tx.patient.create({
        data: {
          userId: newUser.id,
          uhisId: candidateUhis,
          abhaId: finalAbhaId,
          gender: gender || 'MALE',
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1995-01-01'),
          bloodGroup: 'B+',
        },
      });

      return { newUser, patient };
    });

    res.status(201).json({
      success: true,
      message: 'Walk-in patient registered with digital ABHA ID.',
      patient: result,
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

const getReceptionQueue = async (req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: true,
        department: true,
        appointments: {
          where: {
            appointmentDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          include: { patient: { include: { user: true } } },
        },
      },
    });

    res.status(200).json({ success: true, doctorsQueue: doctors });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerWalkInPatient,
  getReceptionQueue,
};
