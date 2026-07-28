const prisma = require('../config/prisma');

const getDoctorAppointments = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: { include: { user: true } },
        hospital: true,
      },
      orderBy: { appointmentDate: 'asc' },
    });

    res.status(200).json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body; // CONFIRMED, CANCELLED, COMPLETED

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status, notes },
      include: { patient: { include: { user: true } } },
    });

    res.status(200).json({ success: true, message: `Appointment status updated to ${status}.`, appointment });
  } catch (error) {
    next(error);
  }
};

const createPrescription = async (req, res, next) => {
  try {
    const { appointmentId, patientId, diagnosisText, advice, validUntil, items } = req.body;

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const prescription = await prisma.prescription.create({
      data: {
        appointmentId,
        patientId,
        doctorId: doctor.id,
        diagnosisText,
        advice,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: {
          create: items.map((item) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            durationDays: parseInt(item.durationDays || 5),
            instructions: item.instructions,
          })),
        },
      },
      include: { items: true, patient: { include: { user: true } } },
    });

    // Also automatically create a medical record entry for consultation
    await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId: doctor.id,
        recordType: 'CONSULTATION',
        title: `Digital Prescription & OPD Consultation`,
        description: diagnosisText || advice || 'Prescription issued by Doctor.',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Digital prescription created successfully.',
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

const createDiagnosis = async (req, res, next) => {
  try {
    const { patientId, icdCode, conditionName, severity, clinicalNotes } = req.body;

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const diagnosis = await prisma.diagnosis.create({
      data: {
        patientId,
        doctorId: doctor.id,
        icdCode,
        conditionName,
        severity: severity || 'MODERATE',
        clinicalNotes,
      },
    });

    res.status(201).json({ success: true, message: 'Diagnosis recorded.', diagnosis });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctorAppointments,
  updateAppointmentStatus,
  createPrescription,
  createDiagnosis,
};
