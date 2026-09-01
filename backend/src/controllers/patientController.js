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
    let patientId = req.params.patientId || req.query.patientId;

    let patient = null;

    if (patientId && patientId.trim()) {
      const trimmedId = patientId.trim();
      patient = await prisma.patient.findFirst({
        where: {
          OR: [
            { id: trimmedId },
            { abhaId: trimmedId },
            { userId: trimmedId },
            { user: { email: trimmedId } },
            { user: { fullName: trimmedId } },
          ],
        },
        include: {
          user: { select: { fullName: true, email: true, phoneNumber: true } },
          medicalRecords: { orderBy: { recordDate: 'desc' } },
          prescriptions: { include: { items: true, doctor: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
          labReports: { orderBy: { createdAt: 'desc' } },
          diagnoses: { include: { doctor: { include: { user: true, hospital: true } } }, orderBy: { diagnosedDate: 'desc' } },
        },
      });
    } else if (req.user && req.user.id) {
      patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
        include: {
          user: { select: { fullName: true, email: true, phoneNumber: true } },
          medicalRecords: { orderBy: { recordDate: 'desc' } },
          prescriptions: { include: { items: true, doctor: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
          labReports: { orderBy: { createdAt: 'desc' } },
          diagnoses: { include: { doctor: { include: { user: true, hospital: true } } }, orderBy: { diagnosedDate: 'desc' } },
        },
      });
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: patient.userId },
      orderBy: { createdAt: 'desc' },
    });

    let allergies = [];
    if (patient.allergies) {
      try {
        allergies = JSON.parse(patient.allergies);
      } catch (e) {
        allergies = patient.allergies.split(',').map((a, idx) => ({
          id: `alg-${idx}`,
          name: a.trim(),
          category: 'MEDICINE',
          severity: 'MODERATE',
          reaction: 'Allergic reaction',
        }));
      }
    }

    const diseases = (patient.diagnoses || []).map((d) => ({
      id: d.id,
      name: d.conditionName,
      icdCode: d.icdCode,
      diagnosedDate: d.diagnosedDate,
      severity: d.severity,
      status: 'ACTIVE',
      treatingDoctor: d.doctor?.user?.fullName || 'General Physician',
      hospital: d.doctor?.hospital?.name || 'Hospital',
      notes: d.clinicalNotes,
    }));

    const vaccinations = (patient.medicalRecords || [])
      .filter((mr) => mr.recordType === 'VACCINATION')
      .map((mr) => {
        let extra = {};
        try { extra = JSON.parse(mr.description); } catch (e) { }
        return {
          id: mr.id,
          vaccine: extra.vaccine || mr.title,
          dose: extra.dose || 'Standard Dose',
          dateAdministered: mr.recordDate,
          hospital: extra.hospital || 'Hospital Facility',
          batchNumber: extra.batchNumber || 'N/A',
          nextDue: extra.nextDue,
          status: extra.status || 'COMPLETED',
        };
      });

    const medications = [];
    (patient.prescriptions || []).forEach((p) => {
      (p.items || []).forEach((item) => {
        const startDate = new Date(p.createdAt);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (item.durationDays || 30));
        medications.push({
          id: item.id,
          name: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          startDate: startDate,
          endDate: endDate.toLocaleDateString(),
          prescribedBy: p.doctor?.user?.fullName || 'Dr. Sharma',
          instructions: item.instructions || 'Take as directed',
        });
      });
    });

    // Build timeline grouped by Year for Medical History view
    const historyEvents = [];

    // Add Diagnoses to history
    (patient.diagnoses || []).forEach((d) => {
      const date = d.diagnosedDate ? new Date(d.diagnosedDate) : new Date();
      const year = date.getFullYear();
      historyEvents.push({
        year,
        date: date.toISOString().slice(0, 10),
        type: 'DIAGNOSIS',
        title: `${d.conditionName} (${d.icdCode || 'ICD-10'})`,
        detail: d.clinicalNotes || `Diagnosed by ${d.doctor?.user?.fullName || 'Physician'}`,
        severity: d.severity,
      });
    });

    // Add Medical Records / Consultations / Radiographs
    (patient.medicalRecords || []).forEach((mr) => {
      const date = mr.recordDate ? new Date(mr.recordDate) : new Date(mr.createdAt);
      const year = date.getFullYear();
      historyEvents.push({
        year,
        date: date.toISOString().slice(0, 10),
        type: mr.recordType || 'MEDICAL_RECORD',
        title: mr.title,
        detail: mr.description || 'Clinical documentation',
        attachmentUrl: mr.attachmentUrl,
      });
    });

    // Add Lab Reports
    (patient.labReports || []).forEach((lr) => {
      const date = lr.sampleDate ? new Date(lr.sampleDate) : new Date(lr.createdAt);
      const year = date.getFullYear();
      historyEvents.push({
        year,
        date: date.toISOString().slice(0, 10),
        type: 'LAB_REPORT',
        title: `Lab Test · ${lr.testName}`,
        detail: lr.resultData || lr.remarks || 'Test completed',
      });
    });

    // Sort all events descending
    historyEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group events by year map
    const historyByYear = {};
    historyEvents.forEach((ev) => {
      if (!historyByYear[ev.year]) {
        historyByYear[ev.year] = [];
      }
      historyByYear[ev.year].push(ev);
    });

    // Calculate age
    let age = 30;
    if (patient.dateOfBirth) {
      age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
    }

    const patientData = {
      patient: {
        id: patient.id,
        userId: patient.userId,
        uhisId: patient.abhaId,
        abhaId: patient.abhaId,
        fullName: patient.user?.fullName || 'Patient',
        name: patient.user?.fullName || 'Patient',
        age,
        gender: patient.gender === 'MALE' ? 'Male' : patient.gender === 'FEMALE' ? 'Female' : 'Other',
        bloodGroup: patient.bloodGroup || 'O+',
        height: patient.height || '170 cm',
        weight: patient.weight || '65 kg',
        phone: patient.user?.phoneNumber || '+91 98765 43210',
        phoneNumber: patient.user?.phoneNumber || '+91 98765 43210',
        email: patient.user?.email || '',
        address: patient.address || 'Address on file',
        emergencyContact: patient.emergencyContact || 'Contact on file',
        emergencyPhone: patient.emergencyPhone || '+91 98877 66554',
        allergies: allergies.map((a) => a.name || a.allergen || 'Allergy').join(', '),
        criticalConditions: patient.chronicConditions || diseases.map((d) => d.name).join(', ') || 'None reported',
        pastSurgeries: patient.pastSurgeries || 'None',
      },
      diseases,
      allergies,
      vaccinations,
      medications,
      labReports: patient.labReports || [],
      medicalRecords: patient.medicalRecords || [],
      historyByYear,
      pastSurgeries: patient.pastSurgeries ? [patient.pastSurgeries] : [],
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
        try { fs.unlinkSync(req.file.path); } catch (e) { }
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
        try { fs.unlinkSync(req.file.path); } catch (e) { }
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
      try { fs.unlinkSync(req.file.path); } catch (e) { }
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

// ============================================================================
// LEVEL 1: Basic / Critical Patient Information (Data Minimization)
// GET /api/v1/patients/:patientId/basic
// ============================================================================
const getPatientBasicInfo = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Strict Doctor Role Authorization
    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        level: 1,
        message: 'Access forbidden: Only verified doctors can access patient information.',
      });
    }

    if (!patientId || typeof patientId !== 'string' || !patientId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Patient identifier is required.',
      });
    }

    const trimmedId = patientId.trim();

    // Locate the real patient in the database (supports ABHA ID, UUID, or user fields)
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { abhaId: trimmedId },
          { id: trimmedId },
          { userId: trimmedId },
          { user: { email: trimmedId } },
          { user: { fullName: trimmedId } },
        ],
      },
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true } },
        diagnoses: { select: { conditionName: true, severity: true } },
      },
    });


    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found in UHIS database.',
      });
    }

    // Calculate age
    let age = null;
    if (patient.dateOfBirth) {
      const birth = new Date(patient.dateOfBirth);
      const diff = Date.now() - birth.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    // Parse allergies (Critical info)
    let allergies = [];
    if (patient.allergies) {
      try {
        const parsed = JSON.parse(patient.allergies);
        allergies = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        allergies = [{ name: patient.allergies, severity: 'MODERATE' }];
      }
    }

    // Extract critical/chronic conditions
    const criticalConditions = patient.diagnoses.map((d) => ({
      name: d.conditionName,
      severity: d.severity || 'MODERATE',
    }));

    // Mask emergency phone for privacy
    let maskedEmergencyPhone = patient.emergencyPhone || '';
    if (maskedEmergencyPhone.length > 5) {
      maskedEmergencyPhone = maskedEmergencyPhone.slice(0, 4) + ' ••• ' + maskedEmergencyPhone.slice(-2);
    }

    // Create AuditLog entry: BASIC_PATIENT_DATA_ACCESSED
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'BASIC_PATIENT_DATA_ACCESSED',
        resource: 'PATIENT_BASIC',
        details: `Doctor ${req.user.fullName} accessed Level 1 basic/critical information for Patient ${patient.user?.fullName || 'Patient'} (${patient.abhaId})`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    // DATA MINIMIZATION: Return ONLY Level 1 fields. Never expose prescriptions, full EHR, or files.
    return res.status(200).json({
      success: true,
      level: 1,
      accessLevel: 'BASIC_CRITICAL_ONLY',
      patient: {
        id: patient.id,
        uhisId: patient.abhaId,
        fullName: patient.user?.fullName || 'Patient',
        age: age || 24,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup || 'B+',
        allergies: allergies.map((a) => ({
          name: a.name || a.allergen || 'Allergy',
          severity: a.severity || 'SEVERE',
          reaction: a.symptoms || a.reaction || 'Allergic reaction',
          precautions: a.precautions || 'Avoid exposure',
        })),
        criticalConditions,
        emergencyContact: patient.emergencyContact ? `${patient.emergencyContact} (${maskedEmergencyPhone || 'Contact on file'})` : 'Emergency contact on record',
      },
      fullAccessRequired: true,
      message: 'Basic / critical patient information retrieved. Complete medical records remain protected under Level 2 security.',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// LEVEL 2: Full Patient Medical Information (Requires Patient OTP Verification)
// GET /api/v1/patients/:patientId/full
// ============================================================================
const getPatientFullInfo = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // 1. Authenticated user required
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // 2. Doctor role required
    if (req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        level: 2,
        error: 'ACCESS_DENIED',
        message: 'Access forbidden: Only authorized doctors can access full patient medical records.',
      });
    }

    // 3. Find Doctor profile
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      include: { user: true, hospital: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found for this account.',
      });
    }

    // 4. Find Patient in database
    const trimmedId = (patientId || '').trim();
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { abhaId: trimmedId },
          { id: trimmedId },
          { userId: trimmedId },
          { user: { email: trimmedId } },
          { user: { fullName: trimmedId } },
        ],
      },
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true } },
        medicalRecords: { orderBy: { recordDate: 'desc' } },
        prescriptions: { include: { items: true, doctor: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
        labReports: { orderBy: { createdAt: 'desc' } },
        diagnoses: { include: { doctor: { include: { user: true, hospital: true } } } },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found in database.',
      });
    }

    // 5. Check if an active, VERIFIED authorization exists for doctorId + patientId
    const activeAuth = await prisma.$queryRawUnsafe(
      `SELECT * FROM "EmergencyAccessRequest"
       WHERE "doctorId" = $1 AND "patientId" = $2 AND "status" = 'VERIFIED'
       ORDER BY "verifiedAt" DESC LIMIT 1;`,
      doctor.id, patient.id
    );

    const authRecord = activeAuth && activeAuth.length > 0 ? activeAuth[0] : null;

    // 6. Strict Authorization Check
    if (!authRecord) {
      console.log(`[AUTH CHECK] No VERIFIED request for doctorId=${doctor.id} patientId=${patient.id}. Found:`, activeAuth);
      // Create AuditLog: FULL_ACCESS_DENIED
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'FULL_ACCESS_DENIED',
          resource: 'PATIENT_FULL',
          details: `Doctor ${doctor.user.fullName} attempted unauthorized full medical record access for Patient ${patient.user.fullName} (${patient.abhaId}) without patient approval.`,
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        },
      });

      return res.status(403).json({
        success: false,
        level: 2,
        error: 'AUTHORIZATION_REQUIRED',
        message: 'Full medical access requires patient authorization. Please submit an access request and verify the patient OTP.',
      });
    }


    // 7. Strict Backend Expiration Check
    const now = new Date();
    if (!authRecord.accessExpiresAt || now > new Date(authRecord.accessExpiresAt)) {
      await prisma.$executeRawUnsafe(
        `UPDATE "EmergencyAccessRequest" SET "status" = 'EXPIRED' WHERE "id" = $1;`,
        authRecord.id
      );

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'EMERGENCY_ACCESS_EXPIRED',
          resource: 'PATIENT_FULL',
          details: `Doctor ${doctor.user.fullName} attempted reading records on expired emergency authorization ${authRecord.id}`,
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        },
      });

      return res.status(403).json({
        success: false,
        level: 2,
        error: 'ACCESS_EXPIRED',
        message: 'Emergency access authorization has expired. Please submit a new access request.',
      });
    }

    // Parse allergies
    let allergies = [];
    if (patient.allergies) {
      try { allergies = JSON.parse(patient.allergies); } catch (e) {
        allergies = [{ id: 'a0', name: patient.allergies, category: 'OTHER', severity: 'MILD' }];
      }
    }

    // Parse conditions
    const diseases = patient.diagnoses.map((d) => ({
      id: d.id,
      name: d.conditionName,
      icdCode: d.icdCode,
      diagnosedDate: d.diagnosedDate,
      severity: d.severity,
      status: 'ACTIVE',
      treatingDoctor: d.doctor?.user?.fullName || 'General Physician',
      hospital: d.doctor?.hospital?.name || 'Hospital',
      notes: d.clinicalNotes,
    }));

    // Parse medications
    const medications = [];
    patient.prescriptions.forEach((p) => {
      p.items.forEach((item) => {
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
          instructions: item.instructions,
        });
      });
    });

    // Parse medical records & X-rays / files
    const medicalRecords = patient.medicalRecords.map((mr) => ({
      id: mr.id,
      title: mr.title,
      recordType: mr.recordType,
      description: mr.description,
      recordDate: mr.recordDate,
      attachmentUrl: mr.attachmentUrl,
    }));

    const labReports = patient.labReports.map((lr) => ({
      id: lr.id,
      testName: lr.testName,
      testCategory: lr.testCategory,
      sampleDate: lr.sampleDate,
      status: lr.status,
      resultData: lr.resultData,
      fileUrl: lr.fileUrl,
      remarks: lr.remarks,
    }));

    // Create AuditLog: FULL_MEDICAL_DATA_ACCESSED
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'FULL_MEDICAL_DATA_ACCESSED',
        resource: 'PATIENT_FULL',
        details: `Doctor ${doctor.user.fullName} accessed Level 2 full medical records for Patient ${patient.user.fullName} (${patient.abhaId}) under authorization ${authRecord.id}`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    // Calculate age
    let age = null;
    if (patient.dateOfBirth) {
      const birth = new Date(patient.dateOfBirth);
      const diff = Date.now() - birth.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    return res.status(200).json({
      success: true,
      level: 2,
      accessLevel: 'FULL_READ_ONLY_AUTHORIZED',
      readOnly: true,
      accessExpiresAt: authRecord.accessExpiresAt,
      reason: authRecord.reason,
      doctorName: doctor.user.fullName,
      patientData: {
        patient: {
          id: patient.id,
          name: patient.user?.fullName || 'Patient',
          abhaId: patient.abhaId,
          gender: patient.gender,
          age: age || 24,
          dateOfBirth: patient.dateOfBirth,
          bloodGroup: patient.bloodGroup,
          height: patient.height || '176 cm',
          weight: patient.weight || '74 kg',
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
          phone: patient.user?.phoneNumber,
        },
        allergies,
        diseases,
        medications,
        medicalRecords,
        labReports,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/patients/:patientId/medical-records
 * Retrieves existing patient medical records (X-Ray, Blood Test, Prescriptions, Medical Documents).
 * Allowed for:
 * 1. PATIENT: Accessing their own medical records
 * 2. DOCTOR: ONLY when having an ACTIVE, VERIFIED Emergency Access Authorization that is not expired.
 * All other access attempts return HTTP 403 Forbidden.
 */
const getPatientMedicalRecords = async (req, res, next) => {
  try {
    const rawPatientId = req.params.patientId || req.query.patientId;
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access medical records.',
      });
    }

    // 1. Resolve Patient
    let patient = null;
    if (rawPatientId) {
      const trimmedId = rawPatientId.trim();
      patient = await prisma.patient.findFirst({
        where: {
          OR: [
            { abhaId: trimmedId },
            { id: trimmedId },
            { userId: trimmedId },
            { user: { email: trimmedId } },
            { user: { fullName: trimmedId } },
          ],
        },
        include: {
          user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          medicalRecords: { orderBy: { recordDate: 'desc' } },
          prescriptions: { include: { items: true, doctor: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
          labReports: { orderBy: { createdAt: 'desc' } },
          diagnoses: { include: { doctor: { include: { user: true, hospital: true } } } },
        },
      });
    } else if (userRole === 'PATIENT') {
      patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
        include: {
          user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          medicalRecords: { orderBy: { recordDate: 'desc' } },
          prescriptions: { include: { items: true, doctor: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
          labReports: { orderBy: { createdAt: 'desc' } },
          diagnoses: { include: { doctor: { include: { user: true, hospital: true } } } },
        },
      });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient medical record not found.',
      });
    }

    let authRecord = null;

    // 2. Role-Based Authorization
    if (userRole === 'PATIENT') {
      if (patient.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Access forbidden: Patients can only access their own medical records.',
        });
      }
    } else if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
        include: { user: true },
      });

      if (!doctor) {
        return res.status(403).json({
          success: false,
          message: 'Doctor profile not found or inactive.',
        });
      }

      // Check active VERIFIED emergency authorization in SQLite
      const activeAuth = await prisma.$queryRawUnsafe(
        `SELECT * FROM "EmergencyAccessRequest"
         WHERE "doctorId" = $1 AND "patientId" = $2 AND "status" = 'VERIFIED'
         ORDER BY "verifiedAt" DESC LIMIT 1;`,
        doctor.id, patient.id
      );

      authRecord = activeAuth && activeAuth.length > 0 ? activeAuth[0] : null;

      if (!authRecord) {
        // Create AuditLog: FULL_ACCESS_DENIED
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'FULL_ACCESS_DENIED',
            resource: 'PATIENT_MEDICAL_RECORDS',
            details: `Doctor ${doctor.user.fullName} attempted unauthorized medical records access for Patient ${patient.user.fullName} (${patient.abhaId}) without verified OTP.`,
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
          },
        });

        return res.status(403).json({
          success: false,
          error: 'AUTHORIZATION_REQUIRED',
          message: 'Medical records access requires verified patient OTP authorization.',
        });
      }

      // Check expiration
      const now = new Date();
      if (!authRecord.accessExpiresAt || now > new Date(authRecord.accessExpiresAt)) {
        await prisma.$executeRawUnsafe(
          `UPDATE "EmergencyAccessRequest" SET "status" = 'EXPIRED' WHERE "id" = $1;`,
          authRecord.id
        );

        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'EMERGENCY_ACCESS_EXPIRED',
            resource: 'PATIENT_MEDICAL_RECORDS',
            details: `Doctor ${doctor.user.fullName} attempted accessing medical records on expired authorization ${authRecord.id}`,
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
          },
        });

        return res.status(403).json({
          success: false,
          error: 'ACCESS_EXPIRED',
          message: 'Emergency access authorization has expired. Please submit a new access request.',
        });
      }

      // Audit log success
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'FULL_MEDICAL_DATA_ACCESSED',
          resource: 'PATIENT_MEDICAL_RECORDS',
          details: `Doctor ${doctor.user.fullName} retrieved medical records for Patient ${patient.user.fullName} (${patient.abhaId}) under authorization ${authRecord.id}`,
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        },
      });
    } else {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Access forbidden for this role.',
      });
    }

    // 3. Format Medical Records
    const medicalRecords = patient.medicalRecords.map((mr) => ({
      id: mr.id,
      title: mr.title,
      recordType: mr.recordType,
      category: mr.recordType === 'RADIOLOGY' ? 'X-Ray & Imaging' : mr.recordType === 'VACCINATION' ? 'Vaccination' : 'Medical Document',
      description: mr.description,
      recordDate: mr.recordDate,
      attachmentUrl: mr.attachmentUrl,
      fileUrl: mr.attachmentUrl,
      canViewImage: !!mr.attachmentUrl || mr.recordType === 'RADIOLOGY',
      canDownload: true,
    }));

    const labReports = patient.labReports.map((lr) => ({
      id: lr.id,
      title: lr.testName,
      testName: lr.testName,
      testCategory: lr.testCategory,
      category: 'Blood & Lab Test',
      recordType: 'LAB_REPORT',
      sampleDate: lr.sampleDate,
      recordDate: lr.sampleDate,
      status: lr.status,
      resultData: lr.resultData,
      description: lr.resultData || lr.remarks || 'Laboratory diagnostic panel',
      fileUrl: lr.fileUrl,
      remarks: lr.remarks,
      canViewRecord: true,
      canDownload: true,
    }));

    const prescriptions = patient.prescriptions.map((p) => ({
      id: p.id,
      title: `Prescription: ${p.diagnosisText || 'Clinical Rx'}`,
      category: 'Prescription',
      recordType: 'PRESCRIPTION',
      recordDate: p.createdAt,
      diagnosisText: p.diagnosisText,
      advice: p.advice,
      prescribingDoctor: p.doctor?.user?.fullName || 'Physician',
      items: p.items.map((i) => ({
        id: i.id,
        name: i.medicineName,
        dosage: i.dosage,
        frequency: i.frequency,
        durationDays: i.durationDays,
        instructions: i.instructions,
      })),
      description: p.items.map((i) => `${i.medicineName} (${i.dosage}, ${i.frequency})`).join('; '),
      canViewRecord: true,
      canDownload: true,
    }));

    // Unified list of records for the dashboard
    const allRecords = [
      ...medicalRecords,
      ...labReports,
      ...prescriptions,
    ].sort((a, b) => new Date(b.recordDate || 0) - new Date(a.recordDate || 0));

    return res.status(200).json({
      success: true,
      readOnly: userRole === 'DOCTOR',
      accessLevel: userRole === 'DOCTOR' ? 'FULL_READ_ONLY_AUTHORIZED' : 'PATIENT_OWNER',
      accessExpiresAt: authRecord ? authRecord.accessExpiresAt : null,
      patient: {
        id: patient.id,
        name: patient.user?.fullName || 'Patient',
        fullName: patient.user?.fullName || 'Patient',
        abhaId: patient.abhaId,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
      },
      medicalRecords,
      labReports,
      prescriptions,
      records: allRecords,
    });
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
  getPatientBasicInfo,
  getPatientFullInfo,
  getPatientMedicalRecords,
};


