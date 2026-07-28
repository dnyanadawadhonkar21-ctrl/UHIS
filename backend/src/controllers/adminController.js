const prisma = require('../config/prisma');

const getSystemStats = async (req, res, next) => {
  try {
    const [usersCount, hospitalsCount, doctorsCount, patientsCount, auditLogsCount, appointmentsCount] = await Promise.all([
      prisma.user.count(),
      prisma.hospital.count(),
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.auditLog.count(),
      prisma.appointment.count(),
    ]);

    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { fullName: true, email: true, role: true } } },
    });

    const hospitals = await prisma.hospital.findMany({
      include: { _count: { select: { doctors: true, appointments: true } } },
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers: usersCount,
        totalHospitals: hospitalsCount,
        totalDoctors: doctorsCount,
        totalPatients: patientsCount,
        totalAuditLogs: auditLogsCount,
        totalAppointments: appointmentsCount,
      },
      hospitals,
      recentAuditLogs,
    });
  } catch (error) {
    next(error);
  }
};

const createHospital = async (req, res, next) => {
  try {
    const { name, code, address, city, state, contactNo, email, website } = req.body;

    const hospital = await prisma.hospital.create({
      data: {
        name,
        code: code || `HOSP-${Math.floor(1000 + Math.random() * 9000)}`,
        address,
        city,
        state,
        contactNo,
        email,
        website,
      },
    });

    res.status(201).json({ success: true, message: 'Hospital onboarded successfully.', hospital });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { fullName: true, email: true, role: true } } },
    });

    res.status(200).json({ success: true, auditLogs: logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemStats,
  createHospital,
  getAuditLogs,
};
