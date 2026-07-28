const prisma = require('../config/prisma');

// Get Patient Profile & Health Card Details
const getPatientProfile = async (req, res, next) => {
  try {
    let patientId = req.params.patientId;

    if (!patientId) {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
        include: { user: true },
      });
      patientId = patient ? patient.id : null;
    }

    if (!patientId) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true } },
        medicalRecords: { take: 5, orderBy: { recordDate: 'desc' } },
        prescriptions: { take: 5, orderBy: { createdAt: 'desc' } },
        labReports: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    res.status(200).json({ success: true, patient });
  } catch (error) {
    next(error);
  }
};

// Get Centralized Unified Medical History Timeline
const getUnifiedTimeline = async (req, res, next) => {
  try {
    let patientId = req.params.patientId;

    if (!patientId && req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (patient) patientId = patient.id;
    }

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID required to fetch unified timeline.' });
    }

    // Audit log access for privacy compliance
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'VIEW_UNIFIED_TIMELINE',
        resource: 'MEDICAL_RECORD',
        details: `Accessed medical timeline for patientId: ${patientId}`,
      },
    });

    const [patient, medicalRecords, diagnoses, prescriptions, labReports, appointments] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId }, include: { user: true } }),
      prisma.medicalRecord.findMany({ where: { patientId }, include: { doctor: { include: { user: true } } } }),
      prisma.diagnosis.findMany({ where: { patientId }, include: { doctor: { include: { user: true } } } }),
      prisma.prescription.findMany({
        where: { patientId },
        include: { doctor: { include: { user: true } }, items: true },
      }),
      prisma.labReport.findMany({ where: { patientId }, include: { laboratory: true } }),
      prisma.appointment.findMany({
        where: { patientId },
        include: { doctor: { include: { user: true, hospital: true } } },
      }),
    ]);

    // Aggregate into unified chronological events
    const events = [];

    medicalRecords.forEach((mr) => {
      events.push({
        id: mr.id,
        category: 'MEDICAL_RECORD',
        type: mr.recordType,
        title: mr.title,
        description: mr.description,
        doctorName: mr.doctor?.user?.fullName || 'General Medical Staff',
        attachmentUrl: mr.attachmentUrl,
        date: mr.recordDate,
      });
    });

    diagnoses.forEach((d) => {
      events.push({
        id: d.id,
        category: 'DIAGNOSIS',
        type: 'DIAGNOSIS',
        title: `Diagnosed: ${d.conditionName} (${d.icdCode || 'ICD-10'})`,
        description: d.clinicalNotes || `Severity: ${d.severity}`,
        doctorName: d.doctor?.user?.fullName,
        severity: d.severity,
        date: d.diagnosedDate,
      });
    });

    prescriptions.forEach((p) => {
      events.push({
        id: p.id,
        category: 'PRESCRIPTION',
        type: 'PRESCRIPTION',
        title: `Digital Prescription #${p.id.slice(0, 8)}`,
        description: p.diagnosisText || 'Digital Medication Advice',
        items: p.items,
        doctorName: p.doctor?.user?.fullName,
        date: p.createdAt,
      });
    });

    labReports.forEach((lr) => {
      events.push({
        id: lr.id,
        category: 'LAB_REPORT',
        type: lr.testCategory,
        title: `${lr.testName} Report`,
        description: lr.remarks || `Status: ${lr.status}`,
        labName: lr.laboratory?.labName || 'Central Clinical Lab',
        status: lr.status,
        resultData: lr.resultData,
        fileUrl: lr.fileUrl,
        date: lr.sampleDate,
      });
    });

    appointments.forEach((a) => {
      events.push({
        id: a.id,
        category: 'APPOINTMENT',
        type: 'APPOINTMENT',
        title: `Consultation at ${a.doctor?.hospital?.name || 'Hospital'}`,
        description: `Reason: ${a.reason || 'Routine Checkup'} | Slot: ${a.timeSlot}`,
        doctorName: a.doctor?.user?.fullName,
        status: a.status,
        date: a.appointmentDate,
      });
    });

    // Sort descending by date
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      patient,
      timeline: events,
    });
  } catch (error) {
    next(error);
  }
};

// Book Appointment
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, hospitalId, appointmentDate, timeSlot, reason } = req.body;

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) {
      return res.status(400).json({ success: false, message: 'Patient profile not found.' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        hospitalId,
        appointmentDate: new Date(appointmentDate),
        timeSlot,
        reason,
        status: 'PENDING',
      },
      include: {
        doctor: { include: { user: true } },
        hospital: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel Appointment
const cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
    });

    res.status(200).json({ success: true, message: 'Appointment cancelled.', appointment: updated });
  } catch (error) {
    next(error);
  }
};

// Update Emergency Contact & Health Alerts
const updateEmergencyContacts = async (req, res, next) => {
  try {
    const { emergencyContact, emergencyPhone, allergies, chronicConditions, bloodGroup } = req.body;

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        emergencyContact,
        emergencyPhone,
        allergies,
        chronicConditions,
        bloodGroup,
      },
    });

    res.status(200).json({ success: true, message: 'Health details updated.', patient: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatientProfile,
  getUnifiedTimeline,
  bookAppointment,
  cancelAppointment,
  updateEmergencyContacts,
};
