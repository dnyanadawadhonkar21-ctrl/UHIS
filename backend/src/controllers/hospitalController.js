const prisma = require('../config/prisma');

const getHospitalMetrics = async (req, res, next) => {
  try {
    const [totalDoctors, totalPatients, totalAppointments, totalDepartments, totalBillings] = await Promise.all([
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.department.count(),
      prisma.billing.aggregate({ _sum: { totalAmount: true } }),
    ]);

    const recentAppointments = await prisma.appointment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        hospital: true,
      },
    });

    const doctorsList = await prisma.doctor.findMany({
      include: {
        user: true,
        department: true,
        hospital: true,
      },
    });

    res.status(200).json({
      success: true,
      metrics: {
        doctors: totalDoctors,
        patients: totalPatients,
        appointments: totalAppointments,
        departments: totalDepartments,
        totalRevenue: totalBillings._sum.totalAmount || 0,
      },
      doctors: doctorsList,
      recentAppointments,
    });
  } catch (error) {
    next(error);
  }
};

const createDoctor = async (req, res, next) => {
  try {
    const { fullName, email, password, specialization, licenseNumber, qualification, experienceYears, consultationFee, departmentId, hospitalId } = req.body;

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password || 'doctor123', 10);

    const hospital = hospitalId
      ? { id: hospitalId }
      : await prisma.hospital.findFirst();

    if (!hospital) return res.status(400).json({ success: false, message: 'No hospital available for assignment.' });

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            hospitalId: hospital.id,
            departmentId,
            specialization,
            licenseNumber,
            qualification,
            experienceYears: parseInt(experienceYears || 5),
            consultationFee: parseFloat(consultationFee || 500),
          },
        },
      },
      include: { doctorProfile: true },
    });

    res.status(201).json({ success: true, message: 'Doctor account created.', doctor: newUser });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHospitalMetrics,
  createDoctor,
};
