const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

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
        medicalRecords: { orderBy: { recordDate: 'desc' } },
        prescriptions: { include: { items: true, doctor: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
        labReports: { orderBy: { createdAt: 'desc' } },
        diagnoses: { include: { doctor: { include: { user: true, hospital: true } } } },
      },
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: patient.userId },
      orderBy: { createdAt: 'desc' }
    });

    let allergies = [];
    if (patient.allergies) {
       try { allergies = JSON.parse(patient.allergies); } catch(e) { allergies = [{ id: 'a0', name: patient.allergies, category: 'OTHER', severity: 'MILD' }]; }
    }

    const diseases = patient.diagnoses.map(d => ({
       id: d.id,
       name: d.conditionName,
       icdCode: d.icdCode,
       diagnosedDate: d.diagnosedDate,
       severity: d.severity,
       status: 'ACTIVE',
       treatingDoctor: d.doctor?.user?.fullName || 'General Physician',
       hospital: d.doctor?.hospital?.name || 'Hospital',
       notes: d.clinicalNotes
    }));

    const vaccinations = patient.medicalRecords
       .filter(mr => mr.recordType === 'VACCINATION')
       .map(mr => {
          let extra = {};
          try { extra = JSON.parse(mr.description); } catch(e) {}
          return {
             id: mr.id,
             vaccine: extra.vaccine || mr.title,
             dose: extra.dose || 'Unknown',
             dateAdministered: mr.recordDate,
             hospital: extra.hospital || 'Hospital',
             batchNumber: extra.batchNumber || 'N/A',
             nextDue: extra.nextDue,
             status: extra.status || 'COMPLETED'
          };
       });

    const medications = [];
    patient.prescriptions.forEach(p => {
       p.items.forEach(item => {
          const startDate = new Date(p.createdAt);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + item.durationDays);
          medications.push({
             id: item.id,
             name: item.medicineName,
             dosage: item.dosage,
             frequency: item.frequency,
             startDate: startDate,
             endDate: endDate.toLocaleDateString(),
             prescribedBy: p.doctor?.user?.fullName || 'Doctor',
             instructions: item.instructions
          });
       });
    });

    const alerts = notifications.map(n => ({
       id: n.id,
       type: n.type,
       severity: n.type === 'ALLERGY_WARNING' ? 'CRITICAL' : n.type === 'VACCINE_DUE' ? 'WARNING' : 'INFO',
       title: n.title,
       message: n.message,
       action: 'View Details'
    }));

    const patientData = {
       patient,
       diseases,
       allergies,
       vaccinations,
       medications,
       labReports: patient.labReports,
       alerts
    };

    res.status(200).json({ success: true, patientData });
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

// Update Patient Profile
const updatePatientProfile = async (req, res, next) => {
  try {
    const { address, phoneNumber, height, weight, emergencyContact, emergencyPhone, bloodGroup } = req.body;

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id }, include: { user: true } });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        address,
        height,
        weight,
        emergencyContact,
        emergencyPhone,
        bloodGroup,
      },
    });

    if (phoneNumber && phoneNumber !== patient.user.phoneNumber) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { phoneNumber }
      });
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully.', patient: updated });
  } catch (error) {
    next(error);
  }
};

// Upload Medical Record (File + Metadata)
const uploadMedicalRecord = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please attach an image (JPG, PNG, WEBP) or PDF file (max 10MB).',
      });
    }

    const { title, recordType = 'Medical Report', description, recordDate } = req.body;

    if (!title || !title.trim()) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({
        success: false,
        message: 'Record title is required.',
      });
    }

    let patient = req.user.patientProfile;
    if (!patient) {
      patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
      });
    }

    if (!patient) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found for authenticated user.',
      });
    }

    // Relative attachment reference (safe, portable, no absolute path)
    const attachmentUrl = `medical-records/${req.file.filename}`;

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: patient.id,
        recordType: recordType || 'Medical Report',
        title: title.trim(),
        description: description ? description.trim() : '',
        attachmentUrl: attachmentUrl,
        recordDate: recordDate ? new Date(recordDate) : new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPLOAD_MEDICAL_RECORD',
        resource: 'MEDICAL_RECORD',
        details: `Uploaded ${record.recordType}: ${record.title} (${req.file.originalname})`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Medical record uploaded successfully.',
      record,
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(error);
  }
};

// Get Medical Records for Authenticated Patient
const getMedicalRecords = async (req, res, next) => {
  try {
    let patientId = null;

    if (req.user.role === 'PATIENT') {
      const patient = req.user.patientProfile || await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (patient) patientId = patient.id;
    } else if (req.query.patientId) {
      patientId = req.query.patientId;
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID required to fetch medical records.',
      });
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { recordDate: 'desc' },
      include: {
        doctor: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      records,
    });
  } catch (error) {
    next(error);
  }
};

// Stream/Download Stored Medical Record File
const getMedicalRecordFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found.',
      });
    }

    // Verify authorization
    const isOwner = req.user.patientProfile && req.user.patientProfile.id === record.patientId;
    const isOwnerByUserId = (await prisma.patient.findUnique({ where: { userId: req.user.id } }))?.id === record.patientId;
    const isClinician = ['DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role);

    if (!isOwner && !isOwnerByUserId && !isClinician) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view or download this file.',
      });
    }

    if (!record.attachmentUrl) {
      return res.status(404).json({
        success: false,
        message: 'No file attachment associated with this record.',
      });
    }

    // Secure path resolution preventing traversal
    const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads');
    const safeRelPath = path.normalize(record.attachmentUrl).replace(/^(\.\.[\/\\])+/, '');
    const absoluteFilePath = path.resolve(uploadsRoot, safeRelPath);

    if (!absoluteFilePath.startsWith(uploadsRoot) || !fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Attachment file not found on server.',
      });
    }

    const ext = path.extname(absoluteFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isDownload = req.query.download === 'true' || req.query.download === '1';

    // Format safe download filename
    const cleanTitle = record.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const downloadFilename = `${cleanTitle}${ext}`;

    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${downloadFilename}"`);
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const fileStream = fs.createReadStream(absoluteFilePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatientProfile,
  getUnifiedTimeline,
  bookAppointment,
  cancelAppointment,
  updatePatientProfile,
  uploadMedicalRecord,
  getMedicalRecords,
  getMedicalRecordFile,
};
