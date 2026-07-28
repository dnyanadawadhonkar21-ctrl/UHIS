const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

const registerWalkInPatient = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, gender, dateOfBirth } = req.body;

    const dummyPassword = await bcrypt.hash('patient123', 10);
    const userEmail = email || `patient_${Date.now()}@uhis.org`;

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName,
          email: userEmail,
          password: dummyPassword,
          role: 'PATIENT',
          phoneNumber,
        },
      });

      const abhaId = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const patient = await tx.patient.create({
        data: {
          userId: newUser.id,
          abhaId,
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
