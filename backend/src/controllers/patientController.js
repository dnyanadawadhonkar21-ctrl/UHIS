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
            { uhisId: trimmedId },
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

    // Dynamic age calculation
    let age = 30;
    if (patient.dateOfBirth) {
      const birthDate = new Date(patient.dateOfBirth);
      if (!isNaN(birthDate.getTime())) {
        const diffMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(diffMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }
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

    const visits = (patient.appointments || []).map((a) => {
      let parsedNotes = {};
      if (a.notes) {
        try {
          parsedNotes = JSON.parse(a.notes);
        } catch (e) {
          parsedNotes = { doctorNotes: a.notes };
        }
      }

      const visitPrescriptions = [];
      if (a.prescriptions && a.prescriptions.length > 0) {
        a.prescriptions.forEach((p) => {
          (p.items || []).forEach((item) => {
            visitPrescriptions.push({
              id: item.id,
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.durationDays ? `${item.durationDays} days` : 'As directed',
              durationDays: item.durationDays,
              instructions: item.instructions || 'As directed',
            });
          });
        });
      }

      return {
        id: a.id,
        doctor: a.doctor?.user?.fullName || 'Doctor',
        specialty: a.doctor?.specialization || 'Internal Medicine',
        facility: a.hospital?.name || a.doctor?.hospital?.name || 'Hospital',
        hospitalAddress: a.hospital?.address || a.doctor?.hospital?.address || 'New Delhi',
        date: a.appointmentDate ? new Date(a.appointmentDate).toISOString().split('T')[0] : 'N/A',
        appointmentDate: a.appointmentDate,
        timeSlot: a.timeSlot || '10:00 AM',
        reason: parsedNotes.chiefComplaint || a.reason || 'OPD Consultation',
        chiefComplaint: parsedNotes.chiefComplaint || a.reason || 'OPD Consultation',
        symptoms: Array.isArray(parsedNotes.symptoms) ? parsedNotes.symptoms : (parsedNotes.symptoms ? [parsedNotes.symptoms] : []),
        findings: parsedNotes.findings || '',
        diagnosis: parsedNotes.diagnosis || a.prescriptions?.[0]?.diagnosisText || 'Clinical Consultation',
        icdCode: parsedNotes.icdCode || '',
        severity: parsedNotes.severity || 'MODERATE',
        vitals: parsedNotes.vitals || null,
        testsRecommended: Array.isArray(parsedNotes.testsRecommended) ? parsedNotes.testsRecommended : (parsedNotes.testsRecommended ? [parsedNotes.testsRecommended] : []),
        prescriptions: visitPrescriptions,
        doctorNotes: parsedNotes.doctorNotes || a.notes || '',
        followUp: parsedNotes.followUp || null,
        status: (a.status || 'SCHEDULED').toLowerCase(),
      };
    });

    const visits = (patient.appointments || []).map((a) => {
      let parsedNotes = {};
      if (a.notes) {
        try {
          parsedNotes = JSON.parse(a.notes);
        } catch (e) {
          parsedNotes = { doctorNotes: a.notes };
        }
      }

      const visitPrescriptions = [];
      if (a.prescriptions && a.prescriptions.length > 0) {
        a.prescriptions.forEach((p) => {
          (p.items || []).forEach((item) => {
            visitPrescriptions.push({
              id: item.id,
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.durationDays ? `${item.durationDays} days` : 'As directed',
              durationDays: item.durationDays,
              instructions: item.instructions || 'As directed',
            });
          });
        });
      }

      return {
        id: a.id,
        doctor: a.doctor?.user?.fullName || 'Doctor',
        specialty: a.doctor?.specialization || 'Internal Medicine',
        facility: a.hospital?.name || a.doctor?.hospital?.name || 'Hospital',
        hospitalAddress: a.hospital?.address || a.doctor?.hospital?.address || 'New Delhi',
        date: a.appointmentDate ? new Date(a.appointmentDate).toISOString().split('T')[0] : 'N/A',
        appointmentDate: a.appointmentDate,
        timeSlot: a.timeSlot || '10:00 AM',
        reason: parsedNotes.chiefComplaint || a.reason || 'OPD Consultation',
        chiefComplaint: parsedNotes.chiefComplaint || a.reason || 'OPD Consultation',
        symptoms: Array.isArray(parsedNotes.symptoms) ? parsedNotes.symptoms : (parsedNotes.symptoms ? [parsedNotes.symptoms] : []),
        findings: parsedNotes.findings || '',
        diagnosis: parsedNotes.diagnosis || a.prescriptions?.[0]?.diagnosisText || 'Clinical Consultation',
        icdCode: parsedNotes.icdCode || '',
        severity: parsedNotes.severity || 'MODERATE',
        vitals: parsedNotes.vitals || null,
        testsRecommended: Array.isArray(parsedNotes.testsRecommended) ? parsedNotes.testsRecommended : (parsedNotes.testsRecommended ? [parsedNotes.testsRecommended] : []),
        prescriptions: visitPrescriptions,
        doctorNotes: parsedNotes.doctorNotes || a.notes || '',
        followUp: parsedNotes.followUp || null,
        status: (a.status || 'SCHEDULED').toLowerCase(),
      };
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
    const alerts = notifications.map(n => ({
       id: n.id,
       type: n.type,
       severity: n.type === 'ALLERGY_WARNING' ? 'CRITICAL' : n.type === 'VACCINE_DUE' ? 'WARNING' : 'INFO',
       title: n.title,
       message: n.message,
       action: 'View Details'
    }));


    // Calculate age
    let age = 30;
    if (patient.dateOfBirth) {
      age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
    }

    const patientData = {
      patient: {
        id: patient.id,
        userId: patient.userId,
        uhisId: patient.uhisId || 'PT-2026-000',
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
      alerts,
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
      prisma.medicalRecord.findMany({
        where: { patientId },
        include: { doctor: { include: { user: true } } },
        orderBy: { recordDate: 'desc' },
      }),
      prisma.diagnosis.findMany({
        where: { patientId },
        include: { doctor: { include: { user: true } } },
        orderBy: { diagnosedDate: 'desc' },
      }),
      prisma.prescription.findMany({
        where: { patientId },
        include: { doctor: { include: { user: true, hospital: true } }, items: true, appointment: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.labReport.findMany({
        where: { patientId },
        include: { laboratory: true },
        orderBy: { sampleDate: 'desc' },
      }),
      prisma.appointment.findMany({
        where: { patientId },
        include: {
          doctor: { include: { user: true, hospital: true } },
          hospital: true,
          prescriptions: { include: { items: true } },
        },
        orderBy: { appointmentDate: 'desc' },
      }),
    ]);

    // Aggregate into unified chronological events
    const events = [];

    // 1. Process Completed Doctor Visits (Appointments)
    appointments.forEach((a) => {
      let parsedNotes = {};
      if (a.notes) {
        try {
          parsedNotes = JSON.parse(a.notes);
        } catch (e) {
          parsedNotes = { doctorNotes: a.notes };
        }
      }

      const visitPrescriptions = [];
      if (a.prescriptions && a.prescriptions.length > 0) {
        a.prescriptions.forEach((p) => {
          (p.items || []).forEach((item) => {
            visitPrescriptions.push({
              id: item.id,
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.durationDays ? `${item.durationDays} days` : 'As directed',
              durationDays: item.durationDays,
              instructions: item.instructions || 'Take as instructed by physician.',
            });
          });
        });
      }

      events.push({
        id: a.id,
        category: 'DOCTOR_VISIT',
        type: 'VISIT',
        date: a.appointmentDate,
        visitDate: a.appointmentDate,
        timeSlot: a.timeSlot || '10:00 AM',
        doctorName: a.doctor?.user?.fullName || 'Dr. Anita Desai',
        doctorSpecialization: a.doctor?.specialization || 'Internal Medicine',
        doctorQualification: a.doctor?.qualification || 'MBBS, MD',
        hospitalName: a.hospital?.name || a.doctor?.hospital?.name || 'AIIMS New Delhi',
        hospitalAddress: a.hospital?.address || a.doctor?.hospital?.address || 'New Delhi',
        reason: parsedNotes.chiefComplaint || a.reason || 'Clinical Consultation',
        chiefComplaint: parsedNotes.chiefComplaint || a.reason || 'Routine Consultation',
        symptoms: Array.isArray(parsedNotes.symptoms)
          ? parsedNotes.symptoms
          : parsedNotes.symptoms
          ? [parsedNotes.symptoms]
          : [],
        findings: parsedNotes.findings || 'General physical examination performed. Vitals recorded within acceptable parameters.',
        diagnosis: parsedNotes.diagnosis || a.prescriptions?.[0]?.diagnosisText || 'Clinical OPD Consultation',
        icdCode: parsedNotes.icdCode || '',
        severity: parsedNotes.severity || 'MODERATE',
        vitals: parsedNotes.vitals || null,
        testsRecommended: Array.isArray(parsedNotes.testsRecommended)
          ? parsedNotes.testsRecommended
          : parsedNotes.testsRecommended
          ? [parsedNotes.testsRecommended]
          : [],
        prescriptions: visitPrescriptions,
        doctorNotes: parsedNotes.doctorNotes || (typeof a.notes === 'string' && !a.notes.startsWith('{') ? a.notes : 'Continue prescribed medications and adhere to dietary guidance.'),
        followUp: parsedNotes.followUp || null,
        status: a.status || 'COMPLETED',
      });
    });

    // 2. Process Uploaded Medical Records (X-Rays, Scans, Diagnostic Reports)
    medicalRecords.forEach((mr) => {
      events.push({
        id: mr.id,
        category: 'MEDICAL_RECORD',
        type: mr.recordType || 'Medical Report',
        title: mr.title,
        description: mr.description,
        doctorName: mr.doctor?.user?.fullName || 'Self / Clinical Staff',
        attachmentUrl: mr.attachmentUrl,
        date: mr.recordDate || mr.createdAt,
        status: 'RECORDED',
      });
    });

    // Sort descending by date (newest first)
    events.sort((a, b) => new Date(b.date || b.visitDate) - new Date(a.date || a.visitDate));

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
module.exports = {
  getPatientProfile,
  getUnifiedTimeline,
  getPatientAiOverview,
  bookAppointment,
  cancelAppointment,
  updatePatientProfile,
  uploadMedicalRecord,
  getMedicalRecords,
  getMedicalRecordFile,
  getPatientBasicInfo,
  getPatientFullInfo,
  getPatientMedicalRecords,
  searchPatientByAbha,
};



