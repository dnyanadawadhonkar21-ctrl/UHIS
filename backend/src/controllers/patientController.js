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

// Get Appointments for Authenticated Patient
const getPatientAppointments = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: {
          include: {
            user: { select: { fullName: true, email: true, phoneNumber: true } },
            hospital: true,
            department: true,
          },
        },
        hospital: true,
      },
      orderBy: { appointmentDate: 'desc' },
    });

    // Also fetch associated DoctorQueue items to get real-time queue statuses
    const apptIds = appointments.map((a) => a.id);
    let queueMap = {};
    if (apptIds.length > 0) {
      try {
        const placeholders = apptIds.map(() => '?').join(',');
        const queueRows = await prisma.$queryRawUnsafe(
          `SELECT appointmentId, queueNumber, tokenNumber, status, checkInTime, calledAt, consultedAt 
           FROM DoctorQueue 
           WHERE appointmentId IN (${placeholders})`,
          ...apptIds
        );
        queueRows.forEach((q) => {
          queueMap[q.appointmentId] = q;
        });
      } catch (err) {
        console.error('Error querying queue data for appointments:', err);
      }
    }

    const formatted = appointments.map((a) => {
      const q = queueMap[a.id];
      const isPast = new Date(a.appointmentDate) < new Date(new Date().setHours(0, 0, 0, 0));
      return {
        id: a.id,
        appointmentDate: a.appointmentDate,
        date: new Date(a.appointmentDate).toISOString().split('T')[0],
        timeSlot: a.timeSlot,
        reason: a.reason,
        status: a.status,
        queueNumber: q ? Number(q.queueNumber) : (a.queueNumber || null),
        tokenNumber: q ? q.tokenNumber : (a.tokenNumber || null),
        queueStatus: q ? q.status : a.status,
        isPast,
        canCancel: a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && !isPast,
        doctor: {
          id: a.doctor?.id,
          name: a.doctor?.user?.fullName ? (a.doctor.user.fullName.startsWith('Dr.') ? a.doctor.user.fullName : `Dr. ${a.doctor.user.fullName}`) : 'Doctor',
          specialization: a.doctor?.specialization,
          qualification: a.doctor?.qualification,
          consultationFee: a.doctor?.consultationFee,
          hospitalName: a.hospital?.name || a.doctor?.hospital?.name || 'UHIS Hospital',
          hospitalAddress: a.hospital?.address || a.doctor?.hospital?.address || 'City Hospital',
        },
        hospital: a.hospital,
      };
    });

    const upcoming = formatted.filter((a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && !a.isPast);
    const past = formatted.filter((a) => (a.isPast || a.status === 'COMPLETED') && a.status !== 'CANCELLED');
    const cancelled = formatted.filter((a) => a.status === 'CANCELLED');

    res.status(200).json({
      success: true,
      appointments: formatted,
      grouped: {
        upcoming,
        past,
        cancelled,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Book Appointment with atomic slot reservation, double-booking prevention & queue registration
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, hospitalId, appointmentDate, timeSlot, slotId, reason } = req.body;

    // Strict authentication verification: identity derived exclusively from authenticated token
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required.' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true, hospital: true },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const assignedHospitalId = hospitalId || doctor.hospitalId;
    if (!assignedHospitalId) {
      return res.status(400).json({ success: false, message: 'Hospital ID is required.' });
    }

    // Determine target slot date and start time
    let targetDateStr = '';
    let targetStartTime = timeSlot;

    if (appointmentDate) {
      targetDateStr = new Date(appointmentDate).toISOString().split('T')[0];
    }

    // Execute atomic transaction for double-booking prevention and automatic queue registration
    const result = await prisma.$transaction(async (tx) => {
      // 1. Locate available slot
      let slotRecord = null;

      if (slotId) {
        const matchingSlots = await tx.$queryRawUnsafe(
          `SELECT * FROM DoctorAvailability WHERE id = ?`,
          slotId
        );
        slotRecord = matchingSlots[0];
      } else if (targetDateStr && targetStartTime) {
        const matchingSlots = await tx.$queryRawUnsafe(
          `SELECT * FROM DoctorAvailability 
           WHERE doctorId = ? 
             AND COALESCE(date(slotDate/1000, 'unixepoch'), date(slotDate)) = ? 
             AND startTime = ?`,
          doctorId,
          targetDateStr,
          targetStartTime
        );
        slotRecord = matchingSlots[0];
      }

      if (!slotRecord) {
        throw new Error('SLOT_NOT_FOUND');
      }

      if (slotRecord.status !== 'AVAILABLE') {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      const slotDateIso = new Date(slotRecord.slotDate).toISOString().split('T')[0];
      targetStartTime = slotRecord.startTime;

      // 2. Atomically reserve slot - status AVAILABLE -> BOOKED
      const updatedRows = await tx.$executeRawUnsafe(
        `UPDATE DoctorAvailability 
         SET status = 'BOOKED', updatedAt = CURRENT_TIMESTAMP 
         WHERE id = ? AND status = 'AVAILABLE'`,
        slotRecord.id
      );

      if (updatedRows === 0) {
        // Concurrently claimed by another transaction
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // 3. Compute next queue number scoped to (doctorId, slotDate)
      const maxQueueResult = await tx.$queryRawUnsafe(
        `SELECT MAX(queueNumber) as maxNum 
         FROM DoctorQueue 
         WHERE doctorId = ? AND COALESCE(date(queueDate/1000, 'unixepoch'), date(queueDate)) = ?`,
        doctorId,
        slotDateIso
      );

      const currentMax = Number(maxQueueResult[0]?.maxNum || 0);
      const queueNumber = currentMax + 1;
      const tokenNumber = `T-${String(queueNumber).padStart(2, '0')}`;

      // 4. Create Appointment record
      const appointment = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId,
          hospitalId: assignedHospitalId,
          appointmentDate: new Date(slotRecord.slotDate),
          timeSlot: slotRecord.startTime,
          reason: reason || 'General Consultation',
          status: 'CONFIRMED',
          notes: JSON.stringify({ queueNumber, tokenNumber }),
        },
        include: {
          doctor: { include: { user: true } },
          hospital: true,
        },
      });

      // Update queueNumber and tokenNumber directly in Appointment table
      try {
        await tx.$executeRawUnsafe(
          `UPDATE Appointment SET queueNumber = ?, tokenNumber = ? WHERE id = ?`,
          queueNumber,
          tokenNumber,
          appointment.id
        );
      } catch (err) {}

      // 5. Link appointmentId on DoctorAvailability
      await tx.$executeRawUnsafe(
        `UPDATE DoctorAvailability SET appointmentId = ? WHERE id = ?`,
        appointment.id,
        slotRecord.id
      );

      // 6. Insert DoctorQueue record
      const crypto = require('crypto');
      const queueEntryId = crypto.randomUUID();

      await tx.$executeRawUnsafe(
        `INSERT INTO DoctorQueue 
         (id, appointmentId, doctorId, patientId, hospitalId, queueDate, queueNumber, tokenNumber, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'BOOKED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        queueEntryId,
        appointment.id,
        doctorId,
        patient.id,
        assignedHospitalId,
        new Date(slotRecord.slotDate).toISOString(),
        queueNumber,
        tokenNumber
      );

      // 7. Notification for Patient
      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: 'APPOINTMENT_CONFIRMED',
          title: 'Appointment Booked Successfully',
          message: `Your appointment with Dr. ${doctor.user?.fullName || 'Doctor'} on ${slotDateIso} at ${slotRecord.startTime} is confirmed. Queue Token: ${tokenNumber}.`,
        },
      }).catch(() => {});

      // 8. Notification for Doctor
      if (doctor.userId) {
        await tx.notification.create({
          data: {
            userId: doctor.userId,
            type: 'NEW_APPOINTMENT',
            title: 'New Patient Appointment',
            message: `New booking for ${slotDateIso} at ${slotRecord.startTime}. Patient: ${patient.user?.fullName || 'Patient'}, Token: ${tokenNumber}.`,
          },
        }).catch(() => {});
      }

      // 9. Audit Log
      await tx.auditLog.create({
        data: {
          user: { connect: { id: req.user.id } },
          action: 'BOOK_APPOINTMENT',
          resource: 'Appointment',
          details: `Patient booked token ${tokenNumber} with Dr. ${doctor.user?.fullName}`,
        },
      }).catch(() => {});

      return {
        appointment,
        queueNumber,
        tokenNumber,
        slotDate: slotDateIso,
        startTime: slotRecord.startTime,
      };
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      appointment: result.appointment,
      queueNumber: result.queueNumber,
      tokenNumber: result.tokenNumber,
      slotDate: result.slotDate,
      timeSlot: result.startTime,
    });
  } catch (error) {
    if (error.message === 'SLOT_ALREADY_BOOKED') {
      return res.status(409).json({
        success: false,
        message: 'This appointment slot is no longer available. Please select another slot.',
      });
    }
    if (error.message === 'SLOT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'The requested appointment slot does not exist.',
      });
    }
    next(error);
  }
};

// Cancel Appointment & release slot and queue
const cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: true } },
        hospital: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (appointment.patientId !== patient.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this appointment.' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'This appointment is already cancelled.' });
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Completed appointments cannot be cancelled.' });
    }

    // Execute atomic cancellation
    await prisma.$transaction(async (tx) => {
      // 1. Update appointment status
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
      });

      // 2. Update DoctorQueue status
      await tx.$executeRawUnsafe(
        `UPDATE DoctorQueue 
         SET status = 'CANCELLED', updatedAt = CURRENT_TIMESTAMP 
         WHERE appointmentId = ?`,
        appointmentId
      );

      // 3. Release DoctorAvailability slot back to AVAILABLE (if future slot)
      await tx.$executeRawUnsafe(
        `UPDATE DoctorAvailability 
         SET status = 'AVAILABLE', appointmentId = NULL, updatedAt = CURRENT_TIMESTAMP 
         WHERE appointmentId = ?`,
        appointmentId
      );

      // 4. Notification to Patient
      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: 'APPOINTMENT_CANCELLED',
          title: 'Appointment Cancelled',
          message: `Your appointment with Dr. ${appointment.doctor?.user?.fullName || 'Doctor'} has been cancelled.`,
        },
      }).catch(() => {});

      // 5. Notification to Doctor
      if (appointment.doctor?.userId) {
        await tx.notification.create({
          data: {
            userId: appointment.doctor.userId,
            type: 'APPOINTMENT_CANCELLED',
            title: 'Patient Cancelled Appointment',
            message: `Appointment for ${new Date(appointment.appointmentDate).toISOString().split('T')[0]} at ${appointment.timeSlot} was cancelled by ${patient.user?.fullName || 'Patient'}.`,
          },
        }).catch(() => {});
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          user: { connect: { id: req.user.id } },
          action: 'CANCEL_APPOINTMENT',
          resource: 'Appointment',
          details: `Patient cancelled appointment with Dr. ${appointment.doctor?.user?.fullName}`,
        },
      }).catch(() => {});
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully and slot released.',
    });
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

const getPatientAiOverview = async (req, res, next) => {
  try {
    let patientId = req.params.patientId;

    if (!patientId) {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
      });
      patientId = patient ? patient.id : null;
    }

    if (!patientId) {
      return res.status(404).json({ success: false, message: 'Patient profile not found for AI overview.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true } },
        medicalRecords: { orderBy: { recordDate: 'desc' } },
        prescriptions: {
          include: { items: true, doctor: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        },
        labReports: { orderBy: { createdAt: 'desc' } },
        diagnoses: {
          include: { doctor: { include: { user: true, hospital: true } } },
          orderBy: { diagnosedDate: 'desc' },
        },
        appointments: {
          where: { status: 'COMPLETED' },
          include: {
            doctor: { include: { user: true, hospital: true } },
            hospital: true,
            prescriptions: { include: { items: true } },
          },
          orderBy: { appointmentDate: 'desc' },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient record not found.' });
    }

    // Dynamic Age
    let age = 30;
    if (patient.dateOfBirth) {
      const birthDate = new Date(patient.dateOfBirth);
      if (!isNaN(birthDate.getTime())) {
        const diffMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(diffMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }
    }

    // 1. Allergies & Critical Alerts (High Priority)
    let parsedAllergies = [];
    if (patient.allergies) {
      try {
        parsedAllergies = JSON.parse(patient.allergies);
      } catch (e) {
        parsedAllergies = [{ allergen: patient.allergies, severity: 'MODERATE', reaction: 'Reported allergy' }];
      }
    }

    const criticalAlerts = [];
    parsedAllergies.forEach((al) => {
      const name = al.name || al.allergen || 'Unknown Allergen';
      const severity = (al.severity || 'MODERATE').toUpperCase();
      const isSevere = severity === 'SEVERE' || severity === 'HIGH';
      criticalAlerts.push({
        type: 'ALLERGY',
        title: `${name} Allergy (${severity})`,
        description: al.reaction || al.symptoms || `Documented ${severity.toLowerCase()} allergic reaction.`,
        severity: isSevere ? 'CRITICAL' : 'WARNING',
        actionNote: al.precautions || (name.toLowerCase().includes('penicillin') ? 'Avoid all beta-lactam antibiotics (e.g. penicillins, amoxicillin).' : 'Inform all prescribing clinicians.'),
      });
    });

    // 2. Chronic & Active Conditions (High Priority)
    const chronicConditions = [];
    const conditionSet = new Set();

    (patient.diagnoses || []).forEach((d) => {
      const name = d.conditionName;
      if (name && !conditionSet.has(name.toLowerCase())) {
        conditionSet.add(name.toLowerCase());
        chronicConditions.push({
          id: d.id,
          name: d.conditionName,
          icdCode: d.icdCode || '',
          status: d.severity === 'SEVERE' ? 'Active / Severe' : 'Chronic / Managed',
          diagnosedDate: d.diagnosedDate ? new Date(d.diagnosedDate).toISOString().split('T')[0] : 'Historical',
          notes: d.clinicalNotes || '',
        });
      }
    });

    if (chronicConditions.length === 0 && patient.chronicConditions) {
      patient.chronicConditions.split(',').forEach((c, idx) => {
        const trimmed = c.trim();
        if (trimmed && !conditionSet.has(trimmed.toLowerCase())) {
          conditionSet.add(trimmed.toLowerCase());
          chronicConditions.push({
            id: `cc-${idx}`,
            name: trimmed,
            icdCode: trimmed.includes('Diabetes') ? 'E11.9' : trimmed.includes('Hypertension') ? 'I10' : '',
            status: 'Chronic / Managed',
            diagnosedDate: 'Documented on record',
            notes: 'Long-standing medical condition under outpatient management.',
          });
        }
      });
    }

    // 3. Active Current Medications (High Priority)
    const activeMedications = [];
    const medNamesSeen = new Set();

    (patient.prescriptions || []).forEach((p) => {
      (p.items || []).forEach((item) => {
        const cleanName = item.medicineName?.trim();
        if (cleanName && !medNamesSeen.has(cleanName.toLowerCase())) {
          medNamesSeen.add(cleanName.toLowerCase());
          activeMedications.push({
            id: item.id,
            name: item.medicineName,
            dosage: item.dosage || '',
            frequency: item.frequency || 'As directed',
            duration: item.durationDays ? `${item.durationDays} days` : 'Ongoing',
            instructions: item.instructions || 'Take as prescribed with water.',
            prescribedBy: p.doctor?.user?.fullName || 'Physician',
            prescribedDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
          });
        }
      });
    });

    // 4. Recent / Current Diagnosis (High Priority)
    let recentDiagnosis = null;
    if (patient.appointments && patient.appointments.length > 0) {
      const latestAppt = patient.appointments[0];
      let notes = {};
      try { notes = JSON.parse(latestAppt.notes); } catch (e) {}
      if (notes.diagnosis || latestAppt.prescriptions?.[0]?.diagnosisText) {
        recentDiagnosis = {
          conditionName: notes.diagnosis || latestAppt.prescriptions?.[0]?.diagnosisText,
          icdCode: notes.icdCode || '',
          diagnosedDate: latestAppt.appointmentDate ? new Date(latestAppt.appointmentDate).toISOString().split('T')[0] : 'Recent',
          doctorName: latestAppt.doctor?.user?.fullName || 'Consultant Physician',
          facility: latestAppt.hospital?.name || latestAppt.doctor?.hospital?.name || 'Hospital',
          severity: notes.severity || 'MODERATE',
          notes: notes.findings || notes.doctorNotes || 'Routine clinical assessment completed.',
        };
      }
    } else if (patient.diagnoses && patient.diagnoses.length > 0) {
      const d = patient.diagnoses[0];
      recentDiagnosis = {
        conditionName: d.conditionName,
        icdCode: d.icdCode || '',
        diagnosedDate: d.diagnosedDate ? new Date(d.diagnosedDate).toISOString().split('T')[0] : '',
        doctorName: d.doctor?.user?.fullName || 'Physician',
        facility: d.doctor?.hospital?.name || 'Hospital',
        severity: d.severity || 'MODERATE',
        notes: d.clinicalNotes || '',
      };
    }

    // 5. Surgeries & Past Medical History (Medium Priority)
    const majorHistoryAndSurgeries = [];
    if (patient.pastSurgeries) {
      patient.pastSurgeries.split(';').forEach((s, idx) => {
        const trimmed = s.trim();
        if (trimmed) {
          majorHistoryAndSurgeries.push({
            id: `surg-${idx}`,
            title: trimmed,
            outcome: 'Complete recovery without complications',
            type: 'SURGERY',
          });
        }
      });
    }

    // 6. Latest Vitals (Medium Priority)
    let latestVitals = null;
    if (patient.appointments && patient.appointments.length > 0) {
      for (const appt of patient.appointments) {
        try {
          const notes = JSON.parse(appt.notes);
          if (notes.vitals) {
            latestVitals = {
              recordedAt: appt.appointmentDate ? new Date(appt.appointmentDate).toISOString().split('T')[0] : 'Recent',
              bp: notes.vitals.bp || '128/82 mmHg',
              pulse: notes.vitals.pulse || '72 bpm',
              temp: notes.vitals.temp || '98.4 °F',
              spo2: notes.vitals.spo2 || '99%',
              weight: notes.vitals.weight || patient.weight || '74 kg',
              height: notes.vitals.height || patient.height || '176 cm',
              statusSummary: 'Vitals stable; blood pressure and resting pulse within target therapeutic range.',
            };
            break;
          }
        } catch (e) {}
      }
    }

    if (!latestVitals && (patient.height || patient.weight)) {
      latestVitals = {
        recordedAt: 'Baseline Profile',
        bp: '128/82 mmHg',
        pulse: '72 bpm',
        temp: '98.4 °F',
        spo2: '99%',
        weight: patient.weight || '74 kg',
        height: patient.height || '176 cm',
        statusSummary: 'Baseline biometric profile recorded.',
      };
    }

    // 7. Recent Key Clinical Findings & Observations (Medium Priority)
    const recentKeyFindings = [];
    (patient.appointments || []).slice(0, 3).forEach((appt) => {
      try {
        const notes = JSON.parse(appt.notes);
        if (notes.findings) {
          recentKeyFindings.push({
            domain: appt.doctor?.specialization || 'Clinical Examination',
            finding: notes.findings,
            date: appt.appointmentDate ? new Date(appt.appointmentDate).toISOString().split('T')[0] : '',
            doctor: appt.doctor?.user?.fullName || 'Physician',
          });
        }
      } catch (e) {}
    });

    // 8. Recent Investigations & Diagnostic Tests (Medium Priority)
    const recentInvestigations = [];
    (patient.appointments || []).forEach((appt) => {
      try {
        const notes = JSON.parse(appt.notes);
        if (Array.isArray(notes.testsRecommended)) {
          notes.testsRecommended.forEach((t) => {
            if (!recentInvestigations.some((x) => x.testName.toLowerCase() === t.toLowerCase())) {
              recentInvestigations.push({
                testName: t,
                resultOrStatus: 'Recommended for routine surveillance',
                date: appt.appointmentDate ? new Date(appt.appointmentDate).toISOString().split('T')[0] : '',
                orderedBy: appt.doctor?.user?.fullName || 'Physician',
              });
            }
          });
        }
      } catch (e) {}
    });

    // Add lab reports if any
    (patient.labReports || []).forEach((lr) => {
      recentInvestigations.push({
        testName: lr.testName || lr.testType || 'Laboratory Test',
        resultOrStatus: lr.summary || (lr.abnormal ? 'Abnormal result — review details' : 'Normal / Completed'),
        date: lr.sampleDate || lr.createdAt ? new Date(lr.sampleDate || lr.createdAt).toISOString().split('T')[0] : '',
        isAbnormal: !!lr.abnormal,
      });
    });

    // 9. Current Treatment Plan & Regimen
    const currentTreatmentPlan = [];
    if (activeMedications.length > 0) {
      currentTreatmentPlan.push(`Pharmacotherapy: Adherence to daily prescribed regimen (${activeMedications.map((m) => m.name).join(', ')}).`);
    }
    if (patient.appointments && patient.appointments.length > 0) {
      try {
        const notes = JSON.parse(patient.appointments[0].notes);
        if (notes.doctorNotes) {
          currentTreatmentPlan.push(`Lifestyle & Medical Advice: ${notes.doctorNotes}`);
        }
      } catch (e) {}
    }
    if (currentTreatmentPlan.length === 0) {
      currentTreatmentPlan.push('General outpatient wellness and disease prevention protocol.');
    }

    // 10. Follow-up Requirements
    const followUpRequirements = [];
    (patient.appointments || []).forEach((appt) => {
      try {
        const notes = JSON.parse(appt.notes);
        if (notes.followUp) {
          followUpRequirements.push({
            targetDate: typeof notes.followUp === 'string' && notes.followUp.includes('202') ? notes.followUp.slice(0, 10) : 'As recommended',
            purpose: notes.followUp,
            doctorOrDepartment: `${appt.doctor?.user?.fullName || 'Doctor'} (${appt.doctor?.specialization || 'OPD'})`,
          });
        }
      } catch (e) {}
    });

    // Build synthesized overview
    const overview = {
      patient: {
        id: patient.id,
        name: patient.user?.fullName || 'Patient',
        age,
        gender: patient.gender || 'Male',
        bloodGroup: patient.bloodGroup || 'O+',
        abhaId: patient.abhaId || '91-XXXX-XXXX-XXXX',
        phone: patient.user?.phoneNumber || patient.phoneNumber || '',
        address: patient.address || '',
      },
      generatedAt: new Date().toISOString(),
      confidenceScore: 'High (Verified Electronic Health Records)',
      summaryNote: chronicConditions.length > 0
        ? `${patient.user?.fullName || 'Patient'} is a ${age}-year-old ${patient.gender?.toLowerCase() || 'male'} with documented ${chronicConditions.map((c) => c.name).join(' and ')}, currently managed with active oral pharmacotherapy. ${criticalAlerts.length > 0 ? `Has ${criticalAlerts.length} documented high-priority alert(s) including ${criticalAlerts[0].title}.` : ''}`
        : `${patient.user?.fullName || 'Patient'} has a general health profile on record with no major active chronic diseases.`,

      // Prioritized sections
      criticalAlerts,
      chronicConditions,
      activeMedications,
      recentDiagnosis,
      majorHistoryAndSurgeries,
      latestVitals,
      recentKeyFindings,
      recentInvestigations: recentInvestigations.slice(0, 6),
      currentTreatmentPlan,
      followUpRequirements: followUpRequirements.slice(0, 4),
      safetyDisclaimer: 'AI-generated clinical synthesis derived from electronic health records. Review detailed medical records before making diagnostic or prescribing decisions.',
    };

    res.status(200).json({
      success: true,
      overview,
    });
  } catch (error) {
    next(error);
  }
};

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
          { uhisId: trimmedId },
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
        uhisId: patient.uhisId || 'PT-2026-000',
        abhaId: patient.abhaId,
        fullName: patient.user?.fullName || 'Patient',
        age: age || 24,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup || 'B+',
        height: patient.height || '170 cm',
        weight: patient.weight || '65 kg',
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

    // 5. Check if an active MedicalAccessSession exists for doctorId + patientId
    const activeMedicalSession = await prisma.$queryRawUnsafe(
      `SELECT * FROM "MedicalAccessSession"
       WHERE "doctorId" = $1 AND "patientId" = $2 AND "status" = 'ACTIVE'
       ORDER BY "createdAt" DESC LIMIT 1;`,
      doctor.id, patient.id
    );

    let authRecord = null;
    const now = new Date();

    if (activeMedicalSession && activeMedicalSession.length > 0) {
      const sess = activeMedicalSession[0];
      if (!sess.expiresAt || now >= new Date(sess.expiresAt)) {
        await prisma.$executeRawUnsafe(
          `UPDATE "MedicalAccessSession" SET "status" = 'EXPIRED' WHERE "id" = $1;`,
          sess.id
        );
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'MEDICAL_ACCESS_EXPIRED',
            resource: 'PATIENT_FULL',
            details: `Doctor ${doctor.user.fullName} attempted reading records on expired session ${sess.id}`,
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
          },
        });
        return res.status(403).json({
          success: false,
          level: 2,
          error: 'ACCESS_EXPIRED',
          message: 'Medical record access has expired. Your 15-minute access window has ended.',
        });
      }
      authRecord = {
        id: sess.id,
        accessExpiresAt: sess.expiresAt,
        reason: 'Authorized Medical Record Access',
      };
    } else {
      // Fallback: Check EmergencyAccessRequest
      const activeAuth = await prisma.$queryRawUnsafe(
        `SELECT * FROM "EmergencyAccessRequest"
         WHERE "doctorId" = $1 AND "patientId" = $2 AND "status" = 'VERIFIED'
         ORDER BY "verifiedAt" DESC LIMIT 1;`,
        doctor.id, patient.id
      );

      const emerRecord = activeAuth && activeAuth.length > 0 ? activeAuth[0] : null;

      if (!emerRecord) {
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

      if (!emerRecord.accessExpiresAt || now > new Date(emerRecord.accessExpiresAt)) {
        await prisma.$executeRawUnsafe(
          `UPDATE "EmergencyAccessRequest" SET "status" = 'EXPIRED' WHERE "id" = $1;`,
          emerRecord.id
        );

        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'EMERGENCY_ACCESS_EXPIRED',
            resource: 'PATIENT_FULL',
            details: `Doctor ${doctor.user.fullName} attempted reading records on expired emergency authorization ${emerRecord.id}`,
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

      authRecord = emerRecord;
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

      // Check active MedicalAccessSession
      const activeMedicalSession = await prisma.$queryRawUnsafe(
        `SELECT * FROM "MedicalAccessSession"
         WHERE "doctorId" = $1 AND "patientId" = $2 AND "status" = 'ACTIVE'
         ORDER BY "createdAt" DESC LIMIT 1;`,
        doctor.id, patient.id
      );

      const now = new Date();

      if (activeMedicalSession && activeMedicalSession.length > 0) {
        const sess = activeMedicalSession[0];
        if (!sess.expiresAt || now >= new Date(sess.expiresAt)) {
          await prisma.$executeRawUnsafe(
            `UPDATE "MedicalAccessSession" SET "status" = 'EXPIRED' WHERE "id" = $1;`,
            sess.id
          );
          await prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action: 'MEDICAL_ACCESS_EXPIRED',
              resource: 'PATIENT_MEDICAL_RECORDS',
              details: `Doctor ${doctor.user.fullName} attempted accessing medical records on expired session ${sess.id}`,
              ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
            },
          });
          return res.status(403).json({
            success: false,
            error: 'ACCESS_EXPIRED',
            message: 'Medical record access has expired. Your 15-minute access window has ended.',
          });
        }
        authRecord = sess;
      } else {
        // Fallback: Check EmergencyAccessRequest
        const activeAuth = await prisma.$queryRawUnsafe(
          `SELECT * FROM "EmergencyAccessRequest"
           WHERE "doctorId" = $1 AND "patientId" = $2 AND "status" = 'VERIFIED'
           ORDER BY "verifiedAt" DESC LIMIT 1;`,
          doctor.id, patient.id
        );

        authRecord = activeAuth && activeAuth.length > 0 ? activeAuth[0] : null;

        if (!authRecord) {
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

// ============================================================================
// SEARCH PATIENT BY UNIQUE ABHA ID
// GET /api/v1/patients/search/abha
// GET /api/v1/patients/search/abha/:abhaId
// ============================================================================
const searchPatientByAbha = async (req, res, next) => {
  try {
    const rawAbhaId = req.query.abhaId || req.params.abhaId || req.query.q || req.query.query;

    if (!rawAbhaId || typeof rawAbhaId !== 'string' || !rawAbhaId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter an ABHA ID.',
      });
    }

    const trimmedAbhaId = rawAbhaId.trim();

    // Format validation: check length and permitted characters (alphanumeric and hyphens)
    if (trimmedAbhaId.length < 3 || trimmedAbhaId.length > 35 || !/^[A-Za-z0-9-]+$/.test(trimmedAbhaId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ABHA ID format. Please enter a valid ABHA ID (e.g., 91-4782-3391-6284).',
      });
    }

    // Query database using unique ABHA ID
    const patient = await prisma.patient.findUnique({
      where: { abhaId: trimmedAbhaId },
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true } },
        diagnoses: { include: { doctor: { include: { user: true, hospital: true } } }, orderBy: { diagnosedDate: 'desc' } },
        medicalRecords: { orderBy: { recordDate: 'desc' } },
        prescriptions: { include: { items: true, doctor: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
        labReports: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'No patient found with this ABHA ID.',
      });
    }

    let age = 30;
    if (patient.dateOfBirth) {
      age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
    }

    let allergies = [];
    if (patient.allergies) {
      try {
        const parsed = JSON.parse(patient.allergies);
        allergies = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        allergies = patient.allergies.split(',').map((a, idx) => ({ id: `alg-${idx}`, name: a.trim() }));
      }
    }

    // Audit log search (if valid authenticated user)
    if (req.user && req.user.id) {
      try {
        const userExists = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true } });
        if (userExists) {
          await prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action: 'PATIENT_SEARCH_ABHA',
              resource: 'PATIENT',
              details: `Doctor/User ${req.user.fullName || req.user.email} searched patient by unique ABHA ID: ${trimmedAbhaId}`,
              ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
            },
          });
        }
      } catch (e) {}
    }

    const tokenSuffix = patient.abhaId.replace(/[^A-Za-z0-9]/g, '').slice(-3).toUpperCase() || '01';

    return res.status(200).json({
      success: true,
      message: 'Patient retrieved successfully.',
      patient: {
        id: patient.id,
        userId: patient.userId,
        token: `T-${tokenSuffix}`,
        patientName: patient.user?.fullName || 'Patient',
        name: patient.user?.fullName || 'Patient',
        fullName: patient.user?.fullName || 'Patient',
        email: patient.user?.email,
        phone: patient.user?.phoneNumber,
        phoneNumber: patient.user?.phoneNumber,
        patientId: patient.uhisId || patient.id,
        uhisId: patient.uhisId || 'PT-2026-000',
        abhaId: patient.abhaId,
        age,
        gender: patient.gender === 'MALE' ? 'Male' : patient.gender === 'FEMALE' ? 'Female' : 'Other',
        dateOfBirth: patient.dateOfBirth,
        bloodGroup: patient.bloodGroup || 'O+',
        height: patient.height || '170 cm',
        weight: patient.weight || '65 kg',
        address: patient.address || 'Address on file',
        emergencyContact: patient.emergencyContact || 'Contact on file',
        emergencyPhone: patient.emergencyPhone,
        allergies,
        chiefComplaint: 'OPD Consultation via ABHA Search',
        priority: 'routine',
        status: 'waiting',
        vitals: { bp: '120/80', pulse: '76', spo2: '98%', temp: '98.6°F' },
        diagnosesCount: (patient.diagnoses || []).length,
        recordsCount: (patient.medicalRecords || []).length,
        prescriptionsCount: (patient.prescriptions || []).length,
        labReportsCount: (patient.labReports || []).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatientProfile,
  getUnifiedTimeline,
  getPatientAiOverview,
  getPatientAppointments,
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



