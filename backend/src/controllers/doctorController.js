const prisma = require('../config/prisma');

// Search Doctors with filters (name, specialization, hospital) and sorting
const searchDoctors = async (req, res, next) => {
  try {
    const { name, specialization, hospitalId, sortBy, page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 12);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (specialization && specialization !== 'ALL') {
      where.specialization = specialization;
    }

    if (hospitalId && hospitalId !== 'ALL') {
      where.hospitalId = hospitalId;
    }

    if (name && name.trim()) {
      const cleanName = name.trim().replace(/^dr\.?\s+/i, ''); // handle 'Dr.' prefix search gracefully
      where.user = {
        fullName: {
          contains: cleanName,
        },
      };
    }

    let orderBy = [{ experienceYears: 'desc' }];
    if (sortBy === 'fee_asc') {
      orderBy = [{ consultationFee: 'asc' }];
    } else if (sortBy === 'fee_desc') {
      orderBy = [{ consultationFee: 'desc' }];
    } else if (sortBy === 'experience') {
      orderBy = [{ experienceYears: 'desc' }];
    } else if (sortBy === 'name') {
      orderBy = [{ user: { fullName: 'asc' } }];
    }

    const [totalDoctors, doctors] = await Promise.all([
      prisma.doctor.count({ where }),
      prisma.doctor.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          hospital: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              contactNo: true,
            },
          },
          department: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Attach next available slot for each doctor in the page
    const doctorIds = doctors.map((d) => d.id);
    let nextSlotsMap = {};

    if (doctorIds.length > 0) {
      try {
        const placeholders = doctorIds.map(() => '?').join(',');
        const nextSlots = await prisma.$queryRawUnsafe(
          `SELECT doctorId, slotDate, startTime 
           FROM DoctorAvailability 
           WHERE doctorId IN (${placeholders}) 
             AND status = 'AVAILABLE' 
             AND COALESCE(date(slotDate/1000, 'unixepoch'), date(slotDate)) >= date('now')
           GROUP BY doctorId
           ORDER BY slotDate ASC, startTime ASC`,
          ...doctorIds
        );

        nextSlots.forEach((slot) => {
          const dateStr = new Date(slot.slotDate).toISOString().split('T')[0];
          nextSlotsMap[slot.doctorId] = `${dateStr} at ${slot.startTime}`;
        });
      } catch (err) {
        console.error('Error fetching next available slots:', err);
      }
    }

    const formattedDoctors = doctors.map((doc) => ({
      id: doc.id,
      name: doc.user?.fullName ? (doc.user.fullName.startsWith('Dr.') ? doc.user.fullName : `Dr. ${doc.user.fullName}`) : 'Doctor',
      specialization: doc.specialization,
      qualification: doc.qualification || 'MBBS, MD',
      experienceYears: doc.experienceYears || 0,
      consultationFee: doc.consultationFee || 500,
      hospital: doc.hospital,
      department: doc.department?.name || doc.specialization,
      email: doc.user?.email,
      phone: doc.user?.phoneNumber,
      nextAvailable: nextSlotsMap[doc.id] || 'Available this week',
    }));

    res.status(200).json({
      success: true,
      count: totalDoctors,
      page: pageNum,
      totalPages: Math.ceil(totalDoctors / limitNum),
      doctors: formattedDoctors,
    });
  } catch (error) {
    next(error);
  }
};

// Get distinct specializations from database
const getSpecializations = async (req, res, next) => {
  try {
    const list = await prisma.doctor.findMany({
      select: { specialization: true },
      distinct: ['specialization'],
      orderBy: { specialization: 'asc' },
    });

    const specializations = list.map((item) => item.specialization).filter(Boolean);
    res.status(200).json({ success: true, specializations });
  } catch (error) {
    next(error);
  }
};

// Get detailed doctor profile with upcoming available dates
const getDoctorProfile = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        hospital: true,
        department: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Fetch upcoming dates that have available slots
    let availableDates = [];
    try {
      const datesData = await prisma.$queryRawUnsafe(
        `SELECT COALESCE(date(slotDate/1000, 'unixepoch'), date(slotDate)) as slotDate, COUNT(*) as availableCount 
         FROM DoctorAvailability 
         WHERE doctorId = ? 
           AND status = 'AVAILABLE' 
           AND COALESCE(date(slotDate/1000, 'unixepoch'), date(slotDate)) >= date('now')
         GROUP BY COALESCE(date(slotDate/1000, 'unixepoch'), date(slotDate)) 
         ORDER BY slotDate ASC 
         LIMIT 14`,
        doctorId
      );

      availableDates = datesData.map((d) => ({
        date: d.slotDate,
        availableSlotsCount: Number(d.availableCount),
      }));
    } catch (err) {
      console.error('Error fetching doctor available dates:', err);
    }

    res.status(200).json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.user?.fullName ? (doctor.user.fullName.startsWith('Dr.') ? doctor.user.fullName : `Dr. ${doctor.user.fullName}`) : 'Doctor',
        specialization: doctor.specialization,
        qualification: doctor.qualification || 'MBBS, MD',
        experienceYears: doctor.experienceYears || 0,
        consultationFee: doctor.consultationFee || 500,
        licenseNumber: doctor.licenseNumber,
        hospital: doctor.hospital,
        department: doctor.department?.name || doctor.specialization,
        email: doctor.user?.email,
        phone: doctor.user?.phoneNumber,
        availableDates,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get doctor availability slots for a specific date
const getDoctorAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    let { date } = req.query;

    if (!date) {
      // Default to today in YYYY-MM-DD
      date = new Date().toISOString().split('T')[0];
    }

    const slots = await prisma.$queryRawUnsafe(
      `SELECT id, doctorId, hospitalId, slotDate, startTime, endTime, slotDuration, status 
       FROM DoctorAvailability 
       WHERE doctorId = ? 
         AND COALESCE(date(slotDate/1000, 'unixepoch'), date(slotDate)) = ? 
         AND status = 'AVAILABLE'
       ORDER BY startTime ASC`,
      doctorId,
      date
    );

    res.status(200).json({
      success: true,
      date,
      slots: slots.map((s) => ({
        id: s.id,
        doctorId: s.doctorId,
        hospitalId: s.hospitalId,
        date: new Date(s.slotDate).toISOString().split('T')[0],
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.slotDuration,
        status: s.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get appointments for authenticated doctor
const getDoctorAppointments = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const { date } = req.query;
    const where = { doctorId: doctor.id };
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { user: true } },
        hospital: true,
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { queueNumber: 'asc' },
      ],
    });

    res.status(200).json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

// Get live queue for authenticated doctor
const getDoctorQueue = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const queryDate = req.query.date || new Date().toISOString().split('T')[0];

    // Query DoctorQueue entries for this doctor on the date
    const queueEntries = await prisma.$queryRawUnsafe(
      `SELECT q.id, q.appointmentId, q.doctorId, q.patientId, q.hospitalId, 
              q.queueDate, q.queueNumber, q.tokenNumber, q.status, 
              q.checkInTime, q.calledAt, q.consultedAt, q.notes,
              a.timeSlot, a.reason, a.status as appointmentStatus,
              u.fullName as patientName, u.email as patientEmail, u.phoneNumber as patientPhone,
              p.abhaId, p.gender, p.dateOfBirth, p.bloodGroup
       FROM DoctorQueue q
       JOIN Appointment a ON q.appointmentId = a.id
       JOIN Patient p ON q.patientId = p.id
       JOIN User u ON p.userId = u.id
       WHERE q.doctorId = ? 
         AND COALESCE(date(q.queueDate/1000, 'unixepoch'), date(q.queueDate)) = ?
       ORDER BY q.queueNumber ASC`,
      doctor.id,
      queryDate
    );

    res.status(200).json({
      success: true,
      date: queryDate,
      queue: queueEntries.map((entry) => ({
        id: entry.id,
        appointmentId: entry.appointmentId,
        doctorId: entry.doctorId,
        patientId: entry.patientId,
        queueNumber: Number(entry.queueNumber),
        tokenNumber: entry.tokenNumber,
        status: entry.status,
        timeSlot: entry.timeSlot,
        reason: entry.reason,
        checkInTime: entry.checkInTime,
        calledAt: entry.calledAt,
        consultedAt: entry.consultedAt,
        patient: {
          name: entry.patientName,
          email: entry.patientEmail,
          phone: entry.patientPhone,
          abhaId: entry.abhaId,
          gender: entry.gender,
          bloodGroup: entry.bloodGroup,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Update Appointment & Queue Status
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body; // e.g. CONFIRMED, CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    // Validate ownership
    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: { include: { user: true } } },
    });

    if (!existing || existing.doctorId !== doctor.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this appointment.' });
    }

    const apptStatusMap = {
      CHECKED_IN: 'CONFIRMED',
      IN_CONSULTATION: 'CONFIRMED',
      WAITING: 'CONFIRMED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      NO_SHOW: 'CANCELLED',
      CONFIRMED: 'CONFIRMED',
    };

    const newApptStatus = apptStatusMap[status] || status;

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: newApptStatus, notes: notes || existing.notes },
      include: { patient: { include: { user: true } } },
    });

    // Synchronize DoctorQueue
    try {
      const nowIso = new Date().toISOString();
      let extraUpdate = '';
      if (status === 'CHECKED_IN') extraUpdate = `, checkInTime = '${nowIso}'`;
      else if (status === 'IN_CONSULTATION') extraUpdate = `, calledAt = '${nowIso}'`;
      else if (status === 'COMPLETED') extraUpdate = `, consultedAt = '${nowIso}'`;

      await prisma.$executeRawUnsafe(
        `UPDATE DoctorQueue 
         SET status = ?, updatedAt = CURRENT_TIMESTAMP ${extraUpdate}
         WHERE appointmentId = ?`,
        status,
        appointmentId
      );
    } catch (qErr) {
      console.error('Error synchronizing DoctorQueue:', qErr);
    }

    // Notify Patient of queue/appointment update
    if (existing.patient?.userId) {
      await prisma.notification.create({
        data: {
          userId: existing.patient.userId,
          type: 'APPOINTMENT_UPDATE',
          title: 'Appointment Status Updated',
          message: `Your appointment status with Dr. ${req.user.fullName || 'Doctor'} has been updated to ${status}.`,
        },
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}.`,
      appointment,
    });
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
  searchDoctors,
  getSpecializations,
  getDoctorProfile,
  getDoctorAvailability,
  getDoctorAppointments,
  getDoctorQueue,
  updateAppointmentStatus,
  createPrescription,
  createDiagnosis,
};

