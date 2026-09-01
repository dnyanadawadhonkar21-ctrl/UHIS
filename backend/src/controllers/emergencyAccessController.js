const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');

// Database helper functions for EmergencyAccessRequest (supports SQLite directly)
const db = {
  async findById(id) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT r.*, 
              d."specialization" as doctorSpecialization,
              uDoc."fullName" as doctorName,
              h."name" as hospitalName,
              p."abhaId" as patientUHISId,
              uPat."fullName" as patientName,
              p."userId" as patientUserId
       FROM "EmergencyAccessRequest" r
       LEFT JOIN "Doctor" d ON r."doctorId" = d."id"
       LEFT JOIN "User" uDoc ON d."userId" = uDoc."id"
       LEFT JOIN "Hospital" h ON d."hospitalId" = h."id"
       LEFT JOIN "Patient" p ON r."patientId" = p."id"
       LEFT JOIN "User" uPat ON p."userId" = uPat."id"
       WHERE r."id" = $1 LIMIT 1;`,
      id
    );
    return rows && rows.length > 0 ? rows[0] : null;
  },

  async findActiveDoctorPatient(doctorId, patientId) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "EmergencyAccessRequest"
       WHERE "doctorId" = $1 AND "patientId" = $2 AND "status" = 'VERIFIED' AND datetime("accessExpiresAt") > datetime('now')
       LIMIT 1;`,
      doctorId, patientId
    );
    return rows && rows.length > 0 ? rows[0] : null;
  },

  async create(patientId, doctorId, reason) {
    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "EmergencyAccessRequest" ("id", "patientId", "doctorId", "reason", "status", "createdAt")
       VALUES ($1, $2, $3, $4, 'PENDING', CURRENT_TIMESTAMP);`,
      id, patientId, doctorId, reason
    );
    return this.findById(id);
  },

  async updateApproval(id, otpHash, expiresAt) {
    await prisma.$executeRawUnsafe(
      `UPDATE "EmergencyAccessRequest"
       SET "status" = 'APPROVED', "otpHash" = $1, "expiresAt" = $2, "approvedAt" = CURRENT_TIMESTAMP, "attempts" = 0
       WHERE "id" = $3;`,
      otpHash, expiresAt, id
    );
    return this.findById(id);
  },

  async updateReject(id) {
    await prisma.$executeRawUnsafe(
      `UPDATE "EmergencyAccessRequest"
       SET "status" = 'REJECTED', "otpHash" = NULL
       WHERE "id" = $1;`,
      id
    );
    return this.findById(id);
  },

  async incrementAttempts(id, newAttempts) {
    await prisma.$executeRawUnsafe(
      `UPDATE "EmergencyAccessRequest"
       SET "attempts" = $1
       WHERE "id" = $2;`,
      newAttempts, id
    );
  },

  async updateExpired(id) {
    await prisma.$executeRawUnsafe(
      `UPDATE "EmergencyAccessRequest"
       SET "status" = 'EXPIRED', "otpHash" = NULL
       WHERE "id" = $1;`,
      id
    );
  },

  async updateVerified(id, accessExpiresAt) {
    await prisma.$executeRawUnsafe(
      `UPDATE "EmergencyAccessRequest"
       SET "status" = 'VERIFIED', "verifiedAt" = CURRENT_TIMESTAMP, "accessExpiresAt" = $1, "otpHash" = NULL
       WHERE "id" = $2;`,
      accessExpiresAt, id
    );
    return this.findById(id);
  },

  async findByPatient(patientId) {
    return await prisma.$queryRawUnsafe(
      `SELECT r.*, 
              d."specialization" as doctorSpecialization,
              uDoc."fullName" as doctorName,
              h."name" as hospitalName
       FROM "EmergencyAccessRequest" r
       LEFT JOIN "Doctor" d ON r."doctorId" = d."id"
       LEFT JOIN "User" uDoc ON d."userId" = uDoc."id"
       LEFT JOIN "Hospital" h ON d."hospitalId" = h."id"
       WHERE r."patientId" = $1 AND r."status" IN ('PENDING', 'APPROVED', 'VERIFIED')
       ORDER BY r."createdAt" DESC;`,
      patientId
    );
  },

  async findByDoctor(doctorId) {
    return await prisma.$queryRawUnsafe(
      `SELECT r.*, 
              p."abhaId" as patientUHISId,
              uPat."fullName" as patientName
       FROM "EmergencyAccessRequest" r
       LEFT JOIN "Patient" p ON r."patientId" = p."id"
       LEFT JOIN "User" uPat ON p."userId" = uPat."id"
       WHERE r."doctorId" = $1 AND r."status" IN ('PENDING', 'APPROVED', 'VERIFIED')
       ORDER BY r."createdAt" DESC;`,
      doctorId
    );
  }
};

/**
 * 1. DOCTOR: Request Emergency Access
 * POST /api/v1/emergency-access/request
 * Body: { patientUHISId, reason }
 */
const requestEmergencyAccess = async (req, res, next) => {
  try {
    const { patientUHISId, reason } = req.body;

    // Doctor authentication & verification check (Source of truth: JWT req.user)
    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only verified doctors can request emergency access.',
      });
    }

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

    // Reason validation (mandatory)
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Emergency reason is mandatory.',
      });
    }

    // Patient lookup (safe lookup by abhaId or id)
    if (!patientUHISId || typeof patientUHISId !== 'string' || !patientUHISId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Patient UHIS ID is required.',
      });
    }

    const trimmedId = patientUHISId.trim();
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
      include: { user: true },
    });


    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.',
      });
    }

    // Check if there is already an active VERIFIED access
    const existingActive = await db.findActiveDoctorPatient(doctor.id, patient.id);
    if (existingActive) {
      return res.status(200).json({
        success: true,
        message: 'You already have an active emergency access authorization for this patient.',
        request: {
          id: existingActive.id,
          status: 'VERIFIED',
          accessExpiresAt: existingActive.accessExpiresAt,
          patientName: patient.user?.fullName || 'Patient',
          patientUHISId: patient.abhaId,
        },
      });
    }

    // Create EmergencyAccessRequest with status PENDING (OTP is NOT generated yet!)
    const accessRequest = await db.create(patient.id, doctor.id, reason.trim());

    // Record in AuditLog: FULL_ACCESS_REQUESTED
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'FULL_ACCESS_REQUESTED',
        resource: 'EMERGENCY_ACCESS',
        details: `Doctor ${doctor.user.fullName} (${doctor.licenseNumber}) requested emergency access for patient ${patient.user?.fullName || 'Patient'} (${patient.abhaId}). Reason: ${reason.trim()}`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    // Create Notification for the Patient
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: '🚨 Emergency Access Request',
        message: `Dr. ${doctor.user.fullName} (${doctor.hospital?.name || 'Hospital'}) is requesting temporary access to your UHIS medical records. Reason: ${reason.trim()}`,
        type: 'EMERGENCY_ACCESS_REQUEST',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Emergency access request submitted. Awaiting patient OTP approval.',
      request: {
        id: accessRequest.id,
        patientName: patient.user?.fullName || 'Patient',
        patientUHISId: patient.abhaId,
        doctorName: doctor.user.fullName,
        hospitalName: doctor.hospital?.name || 'UHIS Network Hospital',
        reason: accessRequest.reason,
        status: accessRequest.status,
        createdAt: accessRequest.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. PATIENT: Get all emergency requests for current patient
 * GET /api/v1/emergency-access/patient/requests
 */
const getPatientEmergencyRequests = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'PATIENT') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only patients can access patient emergency requests.',
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    const requests = await db.findByPatient(patient.id);

    // Check expiration for APPROVED (OTP expired) and VERIFIED (Access expired)
    const now = new Date();
    const formatted = requests.map((r) => {
      let currentStatus = r.status;
      if (r.status === 'APPROVED' && r.expiresAt && now > new Date(r.expiresAt)) {
        currentStatus = 'EXPIRED';
      } else if (r.status === 'VERIFIED' && r.accessExpiresAt && now > new Date(r.accessExpiresAt)) {
        currentStatus = 'EXPIRED';
      }
      return {
        id: r.id,
        doctorId: r.doctorId,
        doctorName: r.doctorName || 'Verified Doctor',
        doctorSpecialization: r.doctorSpecialization || 'Medicine',
        hospitalName: r.hospitalName || 'Hospital',
        reason: r.reason,
        status: currentStatus,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        accessExpiresAt: r.accessExpiresAt,
        approvedAt: r.approvedAt,
      };
    });

    return res.status(200).json({
      success: true,
      requests: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. PATIENT: Approve Emergency Request & Generate Secure 6-Digit OTP
 * POST /api/v1/emergency-access/patient/approve/:id
 */
const approveEmergencyAccess = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== 'PATIENT') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only patients can approve access.',
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    const accessRequest = await db.findById(id);

    if (!accessRequest || accessRequest.patientId !== patient.id) {
      return res.status(404).json({
        success: false,
        message: 'Emergency access request not found or not owned by you.',
      });
    }

    if (accessRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Request cannot be approved because current status is ${accessRequest.status}.`,
      });
    }

    // 1. Generate genuinely random 6-digit OTP using cryptographically secure random generator
    const otpNumber = crypto.randomInt(100000, 1000000);
    const plainOtp = otpNumber.toString();

    // 2. Hash the OTP using bcrypt (never store plaintext OTP!)
    const otpHash = await bcrypt.hash(plainOtp, 10);

    // 3. Set expiration to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 4. Update request status to APPROVED
    const updated = await db.updateApproval(id, otpHash, expiresAt);

    // 5. Audit log (Plaintext OTP is NEVER recorded in audit log)
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'FULL_ACCESS_APPROVED',
        resource: 'EMERGENCY_ACCESS',
        details: `Patient ${patient.user.fullName} approved emergency access request ${id} for Doctor ${accessRequest.doctorName}. OTP issued with 5-minute validity.`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    // 6. Return OTP ONLY to the authenticated patient session
    return res.status(200).json({
      success: true,
      message: 'Emergency access approved. Share this OTP with the doctor.',
      otp: plainOtp,
      expiresAt: updated.expiresAt,
      doctorName: accessRequest.doctorName,
      hospitalName: accessRequest.hospitalName || 'UHIS Hospital',
      reason: accessRequest.reason,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PATIENT: Reject Emergency Request
 * POST /api/v1/emergency-access/patient/reject/:id
 */
const rejectEmergencyAccess = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== 'PATIENT') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only patients can reject access.',
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    const accessRequest = await db.findById(id);

    if (!accessRequest || accessRequest.patientId !== patient.id) {
      return res.status(404).json({
        success: false,
        message: 'Emergency access request not found.',
      });
    }

    await db.updateReject(id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'FULL_ACCESS_REJECTED',
        resource: 'EMERGENCY_ACCESS',
        details: `Patient ${patient.user.fullName} rejected emergency access request ${id} from Doctor ${accessRequest.doctorName}`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Emergency access request rejected.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. DOCTOR: Verify OTP
 * POST /api/v1/emergency-access/verify
 * Body: { requestId, otp }
 */
const verifyEmergencyAccess = async (req, res, next) => {
  try {
    const { requestId, otp } = req.body;

    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only doctors can verify emergency access.',
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      });
    }

    if (!requestId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and 6-digit OTP are required.',
      });
    }

    const accessRequest = await db.findById(requestId);

    if (!accessRequest || accessRequest.doctorId !== doctor.id) {
      return res.status(404).json({
        success: false,
        message: 'Emergency access request not found for your account.',
      });
    }

    // Check status
    if (accessRequest.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Patient has not approved the access request yet. Please ask the patient to approve.',
      });
    }

    if (accessRequest.status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'OTP has already been verified and consumed. Access is active.',
        requestId: accessRequest.id,
        accessExpiresAt: accessRequest.accessExpiresAt,
      });
    }

    if (accessRequest.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Patient rejected this emergency access request.',
      });
    }

    if (accessRequest.status === 'EXPIRED') {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request emergency access again.',
      });
    }

    // Check OTP expiration
    const now = new Date();
    if (!accessRequest.expiresAt || now > new Date(accessRequest.expiresAt)) {
      await db.updateExpired(requestId);

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'EMERGENCY_ACCESS_EXPIRED',
          resource: 'EMERGENCY_ACCESS',
          details: `Doctor ${doctor.user.fullName} attempted OTP verification on expired request ${requestId}`,
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        },
      });

      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request emergency access again.',
      });
    }

    // Check attempt limit (max 5 attempts)
    if (accessRequest.attempts >= 5) {
      await db.updateReject(requestId);

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'FULL_ACCESS_REJECTED',
          resource: 'EMERGENCY_ACCESS',
          details: `Emergency access request ${requestId} locked: maximum OTP attempts exceeded`,
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        },
      });

      return res.status(400).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please submit a new request.',
      });
    }

    // Verify OTP securely using bcrypt comparison
    const isMatch = await bcrypt.compare(String(otp).trim(), accessRequest.otpHash);

    if (!isMatch) {
      const newAttempts = accessRequest.attempts + 1;
      await db.incrementAttempts(requestId, newAttempts);

      // Audit log failed attempt (Do not log plaintext OTP)
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'OTP_VERIFICATION_FAILED',
          resource: 'EMERGENCY_ACCESS',
          details: `Failed OTP attempt (${newAttempts}/5) by Doctor ${doctor.user.fullName} on request ${requestId}`,
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        },
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check the OTP and try again.',
        attemptsRemaining: 5 - newAttempts,
      });
    }

    // Successful Verification: Grant temporary 15-minute READ-ONLY access
    const accessExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const verified = await db.updateVerified(requestId, accessExpiresAt);

    // Audit log success: OTP_VERIFICATION_SUCCESS
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'OTP_VERIFICATION_SUCCESS',
        resource: 'EMERGENCY_ACCESS',
        details: `Doctor ${doctor.user.fullName} successfully verified OTP. Emergency READ-ONLY access granted to Patient ${accessRequest.patientName} (${accessRequest.patientUHISId}) until ${accessExpiresAt}`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });


    return res.status(200).json({
      success: true,
      message: 'Emergency access granted. Read-only access authorized for 15 minutes.',
      requestId: verified.id,
      patientId: verified.patientId,
      patientName: accessRequest.patientName,
      patientUHISId: accessRequest.patientUHISId,
      accessExpiresAt: verified.accessExpiresAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. DOCTOR: Fetch Patient Records Under Verified Emergency Access
 * GET /api/v1/emergency-access/records/:requestId
 */
const getEmergencyPatientRecords = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only doctors can access emergency patient records.',
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      });
    }

    const accessRequest = await db.findById(requestId);

    if (!accessRequest || accessRequest.doctorId !== doctor.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized for this emergency access request.',
      });
    }

    if (accessRequest.status !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        message: `Emergency access not active. Current status is ${accessRequest.status}.`,
      });
    }

    // Strict Backend Expiration Check
    const now = new Date();
    if (!accessRequest.accessExpiresAt || now > new Date(accessRequest.accessExpiresAt)) {
      await db.updateExpired(requestId);

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'EMERGENCY_ACCESS_EXPIRED',
          resource: 'PATIENT_RECORDS',
          details: `Doctor ${doctor.user.fullName} attempted reading records on expired emergency request ${requestId}`,
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        },
      });

      return res.status(403).json({
        success: false,
        message: 'Emergency access has expired. Please request emergency access again.',
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: accessRequest.patientId },
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
        message: 'Patient data not found.',
      });
    }

    // Parse allergies
    let allergies = [];
    if (patient.allergies) {
      try { allergies = JSON.parse(patient.allergies); } catch (e) {
        allergies = [{ id: 'a0', name: patient.allergies, category: 'OTHER', severity: 'MILD' }];
      }
    }

    // Parse conditions/diagnoses
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

    // Parse vaccinations
    const vaccinations = patient.medicalRecords
      .filter((mr) => mr.recordType === 'VACCINATION')
      .map((mr) => {
        let extra = {};
        try { extra = JSON.parse(mr.description); } catch (e) {}
        return {
          id: mr.id,
          vaccine: extra.vaccine || mr.title,
          dose: extra.dose || 'Standard',
          dateAdministered: mr.recordDate,
          hospital: extra.hospital || 'Hospital',
          batchNumber: extra.batchNumber || 'N/A',
          nextDue: extra.nextDue,
          status: extra.status || 'COMPLETED',
        };
      });

    // Parse medications from prescriptions
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

    // Parse other medical records / radiology / lab
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

    // Audit log: Patient records accessed through emergency access
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PATIENT_RECORDS_EMERGENCY_ACCESSED',
        resource: 'PATIENT_RECORDS',
        details: `Doctor ${doctor.user.fullName} accessed emergency READ-ONLY records for Patient ${patient.user?.fullName} (${patient.abhaId}). Reason: ${accessRequest.reason}`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    return res.status(200).json({
      success: true,
      readOnly: true,
      accessExpiresAt: accessRequest.accessExpiresAt,
      reason: accessRequest.reason,
      doctorName: doctor.user.fullName,
      data: {
        patient: {
          id: patient.id,
          name: patient.user?.fullName || 'Patient',
          fullName: patient.user?.fullName || 'Patient',
          abhaId: patient.abhaId,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth,
          bloodGroup: patient.bloodGroup,
          height: patient.height || '176 cm',
          weight: patient.weight || '74 kg',
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
          phone: patient.user?.phoneNumber,
          pastSurgeries: patient.pastSurgeries || 'None',
        },
        allergies,
        diseases,
        vaccinations,
        medications,
        medicalRecords,
        labReports,
      },
      patientData: {
        patient: {
          id: patient.id,
          name: patient.user?.fullName || 'Patient',
          fullName: patient.user?.fullName || 'Patient',
          abhaId: patient.abhaId,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth,
          bloodGroup: patient.bloodGroup,
          height: patient.height || '176 cm',
          weight: patient.weight || '74 kg',
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
          phone: patient.user?.phoneNumber,
          pastSurgeries: patient.pastSurgeries || 'None',
        },
        allergies,
        diseases,
        vaccinations,
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
 * 7. Check Active Emergency Access (Doctor or Patient)
 * GET /api/v1/emergency-access/active
 */
const getActiveEmergencyAccess = async (req, res, next) => {
  try {
    const now = new Date();

    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
      });
      if (!doctor) {
        return res.status(200).json({ success: true, activeRequests: [] });
      }

      const active = await db.findByDoctor(doctor.id);

      const formatted = active.map((r) => {
        let isExpired = false;
        if (r.status === 'APPROVED' && r.expiresAt && now > new Date(r.expiresAt)) isExpired = true;
        if (r.status === 'VERIFIED' && r.accessExpiresAt && now > new Date(r.accessExpiresAt)) isExpired = true;

        return {
          id: r.id,
          patientId: r.patientId,
          patientName: r.patientName || 'Patient',
          patientUHISId: r.patientUHISId,
          reason: r.reason,
          status: isExpired ? 'EXPIRED' : r.status,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt,
          accessExpiresAt: r.accessExpiresAt,
          attempts: r.attempts,
        };
      });

      return res.status(200).json({ success: true, activeRequests: formatted });
    } else if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
      });
      if (!patient) {
        return res.status(200).json({ success: true, activeRequests: [] });
      }

      const active = await db.findByPatient(patient.id);

      const formatted = active.map((r) => {
        let isExpired = false;
        if (r.status === 'APPROVED' && r.expiresAt && now > new Date(r.expiresAt)) isExpired = true;
        if (r.status === 'VERIFIED' && r.accessExpiresAt && now > new Date(r.accessExpiresAt)) isExpired = true;

        return {
          id: r.id,
          doctorId: r.doctorId,
          doctorName: r.doctorName || 'Verified Doctor',
          hospitalName: r.hospitalName || 'Hospital',
          reason: r.reason,
          status: isExpired ? 'EXPIRED' : r.status,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt,
          accessExpiresAt: r.accessExpiresAt,
        };
      });

      return res.status(200).json({ success: true, activeRequests: formatted });
    }

    return res.status(200).json({ success: true, activeRequests: [] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestEmergencyAccess,
  getPatientEmergencyRequests,
  approveEmergencyAccess,
  rejectEmergencyAccess,
  verifyEmergencyAccess,
  getEmergencyPatientRecords,
  getActiveEmergencyAccess,
};
