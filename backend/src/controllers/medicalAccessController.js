const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');

/**
 * Database helper operations for MedicalAccessRequest, AccessOTP, and MedicalAccessSession
 * Interacts directly with SQLite database via prisma
 */
const accessDb = {
  async findRequestById(id) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT r.*,
              d."specialization" as "doctorSpecialization",
              d."licenseNumber" as "doctorLicense",
              uDoc."fullName" as "doctorName",
              uDoc."id" as "doctorUserId",
              h."name" as "hospitalName",
              p."uhisId" as "patientUhisId",
              p."abhaId" as "patientAbhaId",
              uPat."fullName" as "patientName",
              uPat."email" as "patientEmail",
              p."userId" as "patientUserId"
       FROM "MedicalAccessRequest" r
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

  async findPendingByDoctorPatient(doctorId, patientId) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "MedicalAccessRequest"
       WHERE "doctorId" = $1 AND "patientId" = $2 AND "status" = 'PENDING'
       ORDER BY "requestedAt" DESC LIMIT 1;`,
      doctorId,
      patientId
    );
    return rows && rows.length > 0 ? rows[0] : null;
  },

  async findActiveSession(doctorId, patientId) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT s.*, r."reason"
       FROM "MedicalAccessSession" s
       JOIN "MedicalAccessRequest" r ON s."accessRequestId" = r."id"
       WHERE s."doctorId" = $1 AND s."patientId" = $2 
         AND s."status" = 'ACTIVE' 
         AND datetime(s."expiresAt") > datetime('now')
       ORDER BY s."startedAt" DESC LIMIT 1;`,
      doctorId,
      patientId
    );
    return rows && rows.length > 0 ? rows[0] : null;
  },

  async findSessionById(sessionId) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "MedicalAccessSession" WHERE "id" = $1 LIMIT 1;`,
      sessionId
    );
    return rows && rows.length > 0 ? rows[0] : null;
  },

  async findOtpByRequestId(accessRequestId) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "AccessOTP" WHERE "accessRequestId" = $1 LIMIT 1;`,
      accessRequestId
    );
    return rows && rows.length > 0 ? rows[0] : null;
  },

  async createRequest(doctorId, patientId, reason) {
    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "MedicalAccessRequest" 
       ("id", "doctorId", "patientId", "reason", "status", "requestedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      id,
      doctorId,
      patientId,
      reason
    );
    return this.findRequestById(id);
  },

  async updateRequestStatus(id, status, denialReason = null) {
    await prisma.$executeRawUnsafe(
      `UPDATE "MedicalAccessRequest"
       SET "status" = $1, "denialReason" = $2, "respondedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $3;`,
      status,
      denialReason,
      id
    );
    return this.findRequestById(id);
  },

  async createOtp(accessRequestId, otpHash, expiresAt) {
    const id = crypto.randomUUID();
    // Delete any previous OTP record for this request if re-approved
    await prisma.$executeRawUnsafe(
      `DELETE FROM "AccessOTP" WHERE "accessRequestId" = $1;`,
      accessRequestId
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AccessOTP"
       ("id", "accessRequestId", "otpHash", "createdAt", "expiresAt", "attempts", "status")
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 0, 'ACTIVE');`,
      id,
      accessRequestId,
      otpHash,
      expiresAt
    );
    return this.findOtpByRequestId(accessRequestId);
  },

  async incrementOtpAttempts(accessRequestId, newAttempts) {
    await prisma.$executeRawUnsafe(
      `UPDATE "AccessOTP" SET "attempts" = $1 WHERE "accessRequestId" = $2;`,
      newAttempts,
      accessRequestId
    );
  },

  async markOtpUsed(accessRequestId) {
    await prisma.$executeRawUnsafe(
      `UPDATE "AccessOTP" 
       SET "status" = 'USED', "verifiedAt" = CURRENT_TIMESTAMP
       WHERE "accessRequestId" = $1;`,
      accessRequestId
    );
  },

  async invalidateOtp(accessRequestId, status = 'INVALIDATED') {
    await prisma.$executeRawUnsafe(
      `UPDATE "AccessOTP" SET "status" = $1 WHERE "accessRequestId" = $2;`,
      status,
      accessRequestId
    );
  },

  async createSession(accessRequestId, doctorId, patientId, durationMinutes = 15) {
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    // Delete any prior active session for this specific request
    await prisma.$executeRawUnsafe(
      `DELETE FROM "MedicalAccessSession" WHERE "accessRequestId" = $1;`,
      accessRequestId
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "MedicalAccessSession"
       ("id", "accessRequestId", "doctorId", "patientId", "startedAt", "expiresAt", "status", "createdAt")
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, 'ACTIVE', CURRENT_TIMESTAMP);`,
      id,
      accessRequestId,
      doctorId,
      patientId,
      expiresAt
    );
    return this.findSessionById(id);
  },

  async expireSession(sessionId) {
    await prisma.$executeRawUnsafe(
      `UPDATE "MedicalAccessSession" SET "status" = 'EXPIRED' WHERE "id" = $1;`,
      sessionId
    );
  },

  async revokeSession(sessionId, reason = 'Doctor ended access session') {
    await prisma.$executeRawUnsafe(
      `UPDATE "MedicalAccessSession" 
       SET "status" = 'REVOKED', "endedAt" = CURRENT_TIMESTAMP, "revocationReason" = $1
       WHERE "id" = $2;`,
      reason,
      sessionId
    );
    return this.findSessionById(sessionId);
  },

  async revokeActiveSessionsForPatient(doctorId, patientId, reason = 'Doctor ended access session') {
    await prisma.$executeRawUnsafe(
      `UPDATE "MedicalAccessSession"
       SET "status" = 'REVOKED', "endedAt" = CURRENT_TIMESTAMP, "revocationReason" = $1
       WHERE "doctorId" = $2 AND "patientId" = $3 AND "status" = 'ACTIVE';`,
      reason,
      doctorId,
      patientId
    );
  },

  async findByPatient(patientId) {
    return await prisma.$queryRawUnsafe(
      `SELECT r.*,
              d."specialization" as "doctorSpecialization",
              uDoc."fullName" as "doctorName",
              h."name" as "hospitalName",
              o."expiresAt" as "otpExpiresAt",
              o."status" as "otpStatus",
              s."expiresAt" as "sessionExpiresAt",
              s."status" as "sessionStatus"
       FROM "MedicalAccessRequest" r
       LEFT JOIN "Doctor" d ON r."doctorId" = d."id"
       LEFT JOIN "User" uDoc ON d."userId" = uDoc."id"
       LEFT JOIN "Hospital" h ON d."hospitalId" = h."id"
       LEFT JOIN "AccessOTP" o ON r."id" = o."accessRequestId"
       LEFT JOIN "MedicalAccessSession" s ON r."id" = s."accessRequestId"
       WHERE r."patientId" = $1
       ORDER BY r."createdAt" DESC;`,
      patientId
    );
  },

  async findByDoctor(doctorId) {
    return await prisma.$queryRawUnsafe(
      `SELECT r.*,
              p."uhisId" as "patientUhisId",
              p."abhaId" as "patientAbhaId",
              uPat."fullName" as "patientName",
              o."expiresAt" as "otpExpiresAt",
              o."status" as "otpStatus",
              s."id" as "sessionId",
              s."expiresAt" as "sessionExpiresAt",
              s."status" as "sessionStatus"
       FROM "MedicalAccessRequest" r
       LEFT JOIN "Patient" p ON r."patientId" = p."id"
       LEFT JOIN "User" uPat ON p."userId" = uPat."id"
       LEFT JOIN "AccessOTP" o ON r."id" = o."accessRequestId"
       LEFT JOIN "MedicalAccessSession" s ON r."id" = s."accessRequestId"
       WHERE r."doctorId" = $1
       ORDER BY r."createdAt" DESC;`,
      doctorId
    );
  },
};

/**
 * STEP 1 & 2: Doctor Requests Access to a Particular Patient
 * POST /api/v1/medical-access/request
 * Body: { patientId, reason }
 */
const createAccessRequest = async (req, res, next) => {
  try {
    const { patientId, reason } = req.body;

    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only verified doctors can request medical record access.',
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

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason for medical record access is mandatory.',
      });
    }

    if (!patientId || typeof patientId !== 'string' || !patientId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Patient identifier (ID, UHIS ID, or ABHA ID) is required.',
      });
    }

    const trimmedId = patientId.trim();
    const patient = await prisma.patient.findFirst({
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
      include: { user: true },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found in UHIS database.',
      });
    }

    // Section 12: Prevent Multiple Active Requests
    // 1. Check if doctor already has an active 15-minute MedicalAccessSession
    const existingActiveSession = await accessDb.findActiveSession(doctor.id, patient.id);
    if (existingActiveSession) {
      return res.status(200).json({
        success: true,
        alreadyActive: true,
        message: 'You already have an active medical record access session for this patient.',
        session: {
          id: existingActiveSession.id,
          accessRequestId: existingActiveSession.accessRequestId,
          startedAt: existingActiveSession.startedAt,
          expiresAt: existingActiveSession.expiresAt,
          status: existingActiveSession.status,
          patientId: patient.id,
          patientName: patient.user?.fullName || 'Patient',
          patientUhisId: patient.uhisId,
          patientAbhaId: patient.abhaId,
        },
      });
    }

    // 2. Check if an active PENDING request already exists for this doctor & patient
    const existingPending = await accessDb.findPendingByDoctorPatient(doctor.id, patient.id);
    if (existingPending) {
      return res.status(400).json({
        success: false,
        duplicate: true,
        message: 'An access request is already pending for this patient.',
        request: {
          id: existingPending.id,
          status: existingPending.status,
          requestedAt: existingPending.requestedAt,
          patientName: patient.user?.fullName || 'Patient',
          patientUhisId: patient.uhisId,
          patientAbhaId: patient.abhaId,
        },
      });
    }

    // Create MedicalAccessRequest with initial status PENDING (OTP is NOT generated yet!)
    const accessRequest = await accessDb.createRequest(doctor.id, patient.id, reason.trim());

    // Record in AuditLog: DOCTOR_ACCESS_REQUESTED
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DOCTOR_ACCESS_REQUESTED',
        resource: 'MEDICAL_ACCESS_REQUEST',
        details: `Doctor ${doctor.user.fullName} (${doctor.licenseNumber}) requested medical record access for Patient ${patient.user?.fullName || 'Patient'} (${patient.abhaId}). Reason: ${reason.trim()}`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    // STEP 3: Create Patient Notification (ONLY for that specific patient)
    const notificationPayload = {
      accessRequestId: accessRequest.id,
      doctorId: doctor.id,
      patientId: patient.id,
      reason: reason.trim(),
      doctorName: doctor.user.fullName,
      hospitalName: doctor.hospital?.name || 'UHIS Hospital',
      requestedAt: accessRequest.requestedAt,
    };

    const notifId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "data", "createdAt")
       VALUES ($1, $2, $3, $4, 'MEDICAL_ACCESS_REQUEST', $5, CURRENT_TIMESTAMP);`,
      notifId,
      patient.userId,
      'Medical Record Access Request',
      `Dr. ${doctor.user.fullName} is requesting access to your medical records.`,
      JSON.stringify(notificationPayload)
    );

    return res.status(201).json({
      success: true,
      message: 'Access request sent to patient. Waiting for patient approval.',
      request: {
        id: accessRequest.id,
        doctorId: doctor.id,
        doctorName: doctor.user.fullName,
        hospitalName: doctor.hospital?.name || 'UHIS Hospital',
        patientId: patient.id,
        patientName: patient.user?.fullName || 'Patient',
        patientUhisId: patient.uhisId,
        patientAbhaId: patient.abhaId,
        reason: accessRequest.reason,
        status: accessRequest.status,
        requestedAt: accessRequest.requestedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * STEP 3: Patient views their access requests
 * GET /api/v1/medical-access/patient/requests
 */
const getPatientAccessRequests = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'PATIENT') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only patients can view their access requests.',
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

    const requests = await accessDb.findByPatient(patient.id);

    const now = new Date();
    const formatted = requests.map((r) => {
      let currentStatus = r.status;
      if (r.status === 'APPROVED' && r.otpExpiresAt && now > new Date(r.otpExpiresAt)) {
        currentStatus = 'EXPIRED';
      } else if (r.status === 'COMPLETED' && r.sessionExpiresAt && now > new Date(r.sessionExpiresAt)) {
        currentStatus = 'EXPIRED';
      }

      return {
        id: r.id,
        doctorId: r.doctorId,
        doctorName: r.doctorName || 'Doctor',
        doctorSpecialization: r.doctorSpecialization || 'Physician',
        hospitalName: r.hospitalName || 'UHIS Hospital',
        reason: r.reason,
        status: currentStatus,
        denialReason: r.denialReason,
        requestedAt: r.requestedAt,
        respondedAt: r.respondedAt,
        createdAt: r.createdAt,
        otpExpiresAt: r.otpExpiresAt,
        sessionExpiresAt: r.sessionExpiresAt,
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
 * STEP 4: Patient Chooses DENY
 * POST /api/v1/medical-access/patient/deny/:requestId
 * Body: { denialReason }
 */
const denyAccessRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { denialReason } = req.body;

    if (!req.user || req.user.role !== 'PATIENT') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only patients can respond to access requests.',
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

    const accessRequest = await accessDb.findRequestById(requestId);

    if (!accessRequest || accessRequest.patientId !== patient.id) {
      return res.status(404).json({
        success: false,
        message: 'Medical access request not found or not owned by you.',
      });
    }

    if (accessRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Request cannot be denied because current status is already ${accessRequest.status}.`,
      });
    }

    // Update access request: PENDING -> DENIED
    const updated = await accessDb.updateRequestStatus(
      requestId,
      'DENIED',
      denialReason?.trim() || 'Patient denied access.'
    );

    // Audit log: PATIENT_ACCESS_DENIED
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PATIENT_ACCESS_DENIED',
        resource: 'MEDICAL_ACCESS_REQUEST',
        details: `Patient ${patient.user.fullName} denied medical record access request ${requestId} from Doctor ${accessRequest.doctorName}. Denial reason: ${updated.denialReason}`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    // Notify doctor
    if (accessRequest.doctorUserId) {
      const notifId = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "data", "createdAt")
         VALUES ($1, $2, $3, $4, 'MEDICAL_ACCESS_DENIED', $5, CURRENT_TIMESTAMP);`,
        notifId,
        accessRequest.doctorUserId,
        'Medical Record Access Denied',
        `Patient ${patient.user.fullName} denied your medical record access request.`,
        JSON.stringify({
          accessRequestId: requestId,
          patientId: patient.id,
          patientName: patient.user.fullName,
          status: 'DENIED',
          denialReason: updated.denialReason,
        })
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Patient denied medical record access.',
      status: 'DENIED',
      respondedAt: updated.respondedAt,
      denialReason: updated.denialReason,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * STEP 5, 6, 7: Patient Chooses ALLOW -> Generate 6-Digit OTP with 5-Minute Expiry
 * POST /api/v1/medical-access/patient/allow/:requestId
 */
const allowAccessRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    if (!req.user || req.user.role !== 'PATIENT') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only patients can approve access requests.',
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

    const accessRequest = await accessDb.findRequestById(requestId);

    if (!accessRequest || accessRequest.patientId !== patient.id) {
      return res.status(404).json({
        success: false,
        message: 'Medical access request not found or not owned by you.',
      });
    }

    if (accessRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Request cannot be approved because current status is ${accessRequest.status}.`,
      });
    }

    // STEP 6: Generate secure 6-digit OTP (100000 to 999999)
    const otpNumber = crypto.randomInt(100000, 1000000);
    const plainOtp = otpNumber.toString();

    // Hash OTP using bcrypt (never store plaintext OTP!)
    const otpHash = await bcrypt.hash(plainOtp, 10);

    // Valid for exactly 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Update request: PENDING -> APPROVED
    await accessDb.updateRequestStatus(requestId, 'APPROVED', null);

    // Save AccessOTP record linked to accessRequestId
    await accessDb.createOtp(requestId, otpHash, expiresAt.toISOString());

    // Audit log: PATIENT_ACCESS_APPROVED
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PATIENT_ACCESS_APPROVED',
        resource: 'MEDICAL_ACCESS_REQUEST',
        details: `Patient ${patient.user.fullName} approved medical record access request ${requestId} for Doctor ${accessRequest.doctorName}.`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    // Audit log: OTP_GENERATED (Plain OTP is strictly NOT stored in audit logs)
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'OTP_GENERATED',
        resource: 'ACCESS_OTP',
        details: `Single-use 6-digit OTP generated for access request ${requestId}. Valid for 5 minutes until ${expiresAt.toISOString()}.`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    // Notify doctor that request is APPROVED and waiting for patient's OTP
    if (accessRequest.doctorUserId) {
      const notifId = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "data", "createdAt")
         VALUES ($1, $2, $3, $4, 'MEDICAL_ACCESS_APPROVED', $5, CURRENT_TIMESTAMP);`,
        notifId,
        accessRequest.doctorUserId,
        'Medical Record Access Approved',
        `Patient ${patient.user.fullName} approved your access request. Ask patient for the 6-digit OTP to unlock medical records.`,
        JSON.stringify({
          accessRequestId: requestId,
          patientId: patient.id,
          patientName: patient.user.fullName,
          status: 'APPROVED',
          expiresAt: expiresAt.toISOString(),
        })
      );
    }

    // Return plain OTP ONLY to the authenticated patient
    return res.status(200).json({
      success: true,
      message: 'Access Approved. Share this OTP with the requesting doctor.',
      otp: plainOtp,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: 300,
      doctorName: accessRequest.doctorName,
      hospitalName: accessRequest.hospitalName || 'UHIS Hospital',
      reason: accessRequest.reason,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Doctor checks status of request
 * GET /api/v1/medical-access/doctor/status/:requestId
 */
const getDoctorRequestStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Doctor role required.',
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const accessRequest = await accessDb.findRequestById(requestId);

    if (!accessRequest || accessRequest.doctorId !== doctor.id) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found for your account.',
      });
    }

    const otpRecord = await accessDb.findOtpByRequestId(requestId);
    const session = await prisma.$queryRawUnsafe(
      `SELECT * FROM "MedicalAccessSession" WHERE "accessRequestId" = $1 LIMIT 1;`,
      requestId
    );

    const now = new Date();
    let currentStatus = accessRequest.status;
    let otpExpired = false;
    let sessionExpired = false;

    if (otpRecord && otpRecord.expiresAt && now > new Date(otpRecord.expiresAt)) {
      otpExpired = true;
    }

    if (session && session.length > 0) {
      const sess = session[0];
      if (sess.expiresAt && now > new Date(sess.expiresAt)) {
        sessionExpired = true;
      }
    }

    return res.status(200).json({
      success: true,
      request: {
        id: accessRequest.id,
        status: currentStatus,
        patientName: accessRequest.patientName,
        patientUhisId: accessRequest.patientUhisId,
        patientAbhaId: accessRequest.patientAbhaId,
        reason: accessRequest.reason,
        requestedAt: accessRequest.requestedAt,
        respondedAt: accessRequest.respondedAt,
        denialReason: accessRequest.denialReason,
        otpExpired,
        otpExpiresAt: otpRecord?.expiresAt || null,
        otpStatus: otpRecord?.status || null,
        session: session && session.length > 0 ? {
          id: session[0].id,
          status: sessionExpired ? 'EXPIRED' : session[0].status,
          startedAt: session[0].startedAt,
          expiresAt: session[0].expiresAt,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * STEP 8, 9, 10: Doctor Submits & Verifies OTP -> Creates 15-Minute MedicalAccessSession
 * POST /api/v1/medical-access/doctor/verify-otp
 * Body: { accessRequestId, otp, patientId? }
 */
const verifyAccessOTP = async (req, res, next) => {
  try {
    const { accessRequestId, otp, patientId } = req.body;

    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only doctors can verify medical access OTP.',
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

    if (!accessRequestId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Access request ID and 6-digit OTP are required.',
      });
    }

    // 1. Access request exists
    const accessRequest = await accessDb.findRequestById(accessRequestId);
    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // 2. Access request belongs to this doctor
    if (accessRequest.doctorId !== doctor.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized for this access request.',
      });
    }

    // 3. Access request belongs to this patient (if patientId passed)
    if (patientId) {
      const trimmedTarget = patientId.trim();
      const patientMatches =
        accessRequest.patientId === trimmedTarget ||
        accessRequest.patientUhisId === trimmedTarget ||
        accessRequest.patientAbhaId === trimmedTarget;

      if (!patientMatches) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: OTP does not belong to this patient.',
        });
      }
    }

    // 4. Access request status is APPROVED
    if (accessRequest.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Patient has not approved the access request yet. Please ask the patient to approve.',
      });
    }

    if (accessRequest.status === 'DENIED') {
      return res.status(400).json({
        success: false,
        message: 'Patient denied medical record access.',
      });
    }

    // 5 & 6. OTP exists and belongs to this access request
    const otpRecord = await accessDb.findOtpByRequestId(accessRequestId);
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // 7. OTP has not already been used
    if (otpRecord.status === 'USED' || otpRecord.verifiedAt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // 8. OTP has not expired (5 minutes duration)
    const now = new Date();
    if (!otpRecord.expiresAt || now > new Date(otpRecord.expiresAt) || otpRecord.status === 'EXPIRED') {
      await accessDb.invalidateOtp(accessRequestId, 'EXPIRED');
      await accessDb.updateRequestStatus(accessRequestId, 'EXPIRED', 'OTP expired after 5 minutes');

      // Audit log failed attempt
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'OTP_VERIFICATION_FAILED',
          resource: 'ACCESS_OTP',
          details: `Doctor ${doctor.user.fullName} attempted verification with expired OTP on access request ${accessRequestId}`,
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        },
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // 9. OTP attempts have not exceeded the allowed limit (max 5)
    if (otpRecord.attempts >= 5 || otpRecord.status === 'INVALIDATED') {
      await accessDb.invalidateOtp(accessRequestId, 'INVALIDATED');
      await accessDb.updateRequestStatus(accessRequestId, 'DENIED', 'Max OTP attempts exceeded');

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'OTP_VERIFICATION_FAILED',
          resource: 'ACCESS_OTP',
          details: `Maximum OTP verification attempts (5) exceeded on access request ${accessRequestId}`,
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        },
      });

      return res.status(400).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please submit a new access request.',
      });
    }

    // 10. Submitted OTP matches the stored OTP hash
    const isMatch = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
    if (!isMatch) {
      const newAttempts = otpRecord.attempts + 1;
      await accessDb.incrementOtpAttempts(accessRequestId, newAttempts);

      if (newAttempts >= 5) {
        await accessDb.invalidateOtp(accessRequestId, 'INVALIDATED');
        await accessDb.updateRequestStatus(accessRequestId, 'DENIED', 'Max OTP attempts exceeded');
      }

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'OTP_VERIFICATION_FAILED',
          resource: 'ACCESS_OTP',
          details: `Failed OTP attempt (${newAttempts}/5) by Doctor ${doctor.user.fullName} on access request ${accessRequestId}`,
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        },
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
        attemptsRemaining: Math.max(0, 5 - newAttempts),
      });
    }

    // STEP 10: Successful Verification -> Consume OTP
    await accessDb.markOtpUsed(accessRequestId);
    await accessDb.updateRequestStatus(accessRequestId, 'COMPLETED');

    // Audit log: OTP_VERIFICATION_SUCCESS
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'OTP_VERIFICATION_SUCCESS',
        resource: 'ACCESS_OTP',
        details: `Doctor ${doctor.user.fullName} successfully verified OTP for access request ${accessRequestId}.`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    // SECTION 2: Create MedicalAccessSession (Duration: EXACTLY 15 minutes)
    const session = await accessDb.createSession(
      accessRequestId,
      doctor.id,
      accessRequest.patientId,
      15 // 15 minutes
    );

    // Audit log: MEDICAL_ACCESS_STARTED
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'MEDICAL_ACCESS_STARTED',
        resource: 'MEDICAL_ACCESS_SESSION',
        details: `15-minute temporary medical record access session ${session.id} started for Doctor ${doctor.user.fullName} to Patient ${accessRequest.patientName} (${accessRequest.patientAbhaId}). Expires at ${session.expiresAt}`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    // Notify patient that access session is active
    if (accessRequest.patientUserId) {
      const notifId = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "data", "createdAt")
         VALUES ($1, $2, $3, $4, 'MEDICAL_ACCESS_ACTIVATED', $5, CURRENT_TIMESTAMP);`,
        notifId,
        accessRequest.patientUserId,
        'Medical Record Access Active',
        `Dr. ${doctor.user.fullName} has verified the OTP. Temporary 15-minute access to your medical records has started.`,
        JSON.stringify({
          sessionId: session.id,
          accessRequestId: accessRequest.id,
          doctorId: doctor.id,
          doctorName: doctor.user.fullName,
          expiresAt: session.expiresAt,
        })
      );
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Temporary 15-minute medical record access granted.',
      session: {
        id: session.id,
        accessRequestId: session.accessRequestId,
        doctorId: session.doctorId,
        patientId: session.patientId,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        status: session.status,
      },
      patient: {
        id: accessRequest.patientId,
        fullName: accessRequest.patientName,
        uhisId: accessRequest.patientUhisId,
        abhaId: accessRequest.patientAbhaId,
      },
      accessExpiresAt: session.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SECTION 3, 4, 5: Fetch Patient Medical Records Under Verified MedicalAccessSession
 * GET /api/v1/medical-access/records/:patientId
 * Strict 15-minute backend expiration enforcement!
 */
const getAuthorizedPatientRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only authorized doctors can access medical records.',
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      include: { user: true, hospital: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      });
    }

    const trimmedId = (patientId || '').trim();
    const patient = await prisma.patient.findFirst({
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
        diagnoses: { include: { doctor: { include: { user: true, hospital: true } } } },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found.',
      });
    }

    // SECTION 3: BACKEND SECURITY REQUIREMENT - Check Active MedicalAccessSession
    const session = await accessDb.findActiveSession(doctor.id, patient.id);

    if (!session) {
      // Check if there was an expired session to provide clear expired message
      const recentSessions = await prisma.$queryRawUnsafe(
        `SELECT * FROM "MedicalAccessSession"
         WHERE "doctorId" = $1 AND "patientId" = $2
         ORDER BY "createdAt" DESC LIMIT 1;`,
        doctor.id,
        patient.id
      );

      const recentSession = recentSessions && recentSessions.length > 0 ? recentSessions[0] : null;
      const now = new Date();

      if (recentSession && recentSession.status === 'REVOKED') {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_REVOKED',
          message: 'Medical record access has been ended and revoked. A new patient OTP authorization is required.',
        });
      }

      if (recentSession && (recentSession.status === 'EXPIRED' || (recentSession.expiresAt && now > new Date(recentSession.expiresAt)))) {
        if (recentSession.status !== 'EXPIRED') {
          await accessDb.expireSession(recentSession.id);
        }

        // Audit log: MEDICAL_ACCESS_EXPIRED
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'MEDICAL_ACCESS_EXPIRED',
            resource: 'MEDICAL_ACCESS_SESSION',
            details: `Doctor ${doctor.user.fullName} attempted reading records after 15-minute session ${recentSession.id} expired for Patient ${patient.user.fullName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
          },
        });

        return res.status(403).json({
          success: false,
          error: 'ACCESS_EXPIRED',
          message: 'Medical record access has expired. Your 15-minute access window has ended.',
        });
      }

      // Check backward compatibility with EmergencyAccessRequest
      const emergencyAuth = await prisma.$queryRawUnsafe(
        `SELECT * FROM "EmergencyAccessRequest"
         WHERE "doctorId" = $1 AND "patientId" = $2 AND "status" = 'VERIFIED'
           AND datetime("accessExpiresAt") > datetime('now')
         LIMIT 1;`,
        doctor.id,
        patient.id
      );

      if (!emergencyAuth || emergencyAuth.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'AUTHORIZATION_REQUIRED',
          message: 'Medical records access requires verified patient OTP authorization.',
        });
      }
    } else {
      // STRICT EXPIRATION CHECK: currentTime >= expiresAt
      const now = new Date();
      if (new Date(session.expiresAt) <= now) {
        await accessDb.expireSession(session.id);

        // Audit log: MEDICAL_ACCESS_EXPIRED
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'MEDICAL_ACCESS_EXPIRED',
            resource: 'MEDICAL_ACCESS_SESSION',
            details: `Doctor ${doctor.user.fullName} attempted reading records on expired session ${session.id} for Patient ${patient.user.fullName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
          },
        });

        return res.status(403).json({
          success: false,
          error: 'ACCESS_EXPIRED',
          message: 'Medical record access has expired. Your 15-minute access window has ended.',
        });
      }
    }

    // Parse allergies
    let allergies = [];
    if (patient.allergies) {
      try {
        allergies = JSON.parse(patient.allergies);
      } catch (e) {
        allergies = [{ id: 'a0', name: patient.allergies, category: 'OTHER', severity: 'MILD' }];
      }
    }

    // Parse diseases / diagnoses
    const diseases = (patient.diagnoses || []).map((d) => ({
      id: d.id,
      name: d.conditionName,
      icdCode: d.icdCode,
      diagnosedDate: d.diagnosedDate,
      severity: d.severity,
      status: 'ACTIVE',
      treatingDoctor: d.doctor?.user?.fullName || 'Doctor',
      hospital: d.doctor?.hospital?.name || 'Hospital',
      notes: d.clinicalNotes,
    }));

    // Parse vaccinations
    const vaccinations = (patient.medicalRecords || [])
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

    // Parse medications
    const medications = [];
    (patient.prescriptions || []).forEach((p) => {
      (p.items || []).forEach((item) => {
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

    // Medical records & Lab reports
    const medicalRecords = (patient.medicalRecords || []).map((mr) => ({
      id: mr.id,
      title: mr.title,
      recordType: mr.recordType,
      description: mr.description,
      recordDate: mr.recordDate,
      attachmentUrl: mr.attachmentUrl,
    }));

    const labReports = (patient.labReports || []).map((lr) => ({
      id: lr.id,
      testName: lr.testName,
      testCategory: lr.testCategory,
      sampleDate: lr.sampleDate,
      status: lr.status,
      resultData: lr.resultData,
      fileUrl: lr.fileUrl,
      remarks: lr.remarks,
    }));

    // Calculate age
    let age = 30;
    if (patient.dateOfBirth) {
      const birth = new Date(patient.dateOfBirth);
      const diff = Date.now() - birth.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    const expiresAt = session?.expiresAt || null;
    const remainingSeconds = expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 900;

    return res.status(200).json({
      success: true,
      readOnly: true,
      accessExpiresAt: expiresAt,
      remainingSeconds,
      session: session ? {
        id: session.id,
        accessRequestId: session.accessRequestId,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        status: session.status,
      } : null,
      patientData: {
        patient: {
          id: patient.id,
          name: patient.user?.fullName || 'Patient',
          fullName: patient.user?.fullName || 'Patient',
          uhisId: patient.uhisId,
          abhaId: patient.abhaId,
          gender: patient.gender,
          age,
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
      data: {
        patient: {
          id: patient.id,
          name: patient.user?.fullName || 'Patient',
          fullName: patient.user?.fullName || 'Patient',
          uhisId: patient.uhisId,
          abhaId: patient.abhaId,
          gender: patient.gender,
          age,
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
 * Check active MedicalAccessSession status for doctor and patient
 * GET /api/v1/medical-access/active-session/:patientId
 */
const checkActiveSession = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
      });

      if (!doctor) {
        return res.status(200).json({ success: true, active: false });
      }

      const trimmedId = (patientId || '').trim();
      const patient = await prisma.patient.findFirst({
        where: {
          OR: [
            { id: trimmedId },
            { uhisId: trimmedId },
            { abhaId: trimmedId },
          ],
        },
      });

      if (!patient) {
        return res.status(200).json({ success: true, active: false });
      }

      const session = await accessDb.findActiveSession(doctor.id, patient.id);

      if (!session) {
        return res.status(200).json({ success: true, active: false });
      }

      const remainingSeconds = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));

      return res.status(200).json({
        success: true,
        active: true,
        session: {
          id: session.id,
          accessRequestId: session.accessRequestId,
          startedAt: session.startedAt,
          expiresAt: session.expiresAt,
          remainingSeconds,
          status: session.status,
        },
      });
    }

    return res.status(200).json({ success: true, active: false });
  } catch (error) {
    next(error);
  }
};

/**
 * SECTION 8: Listing the authenticated doctor's access requests
 * GET /api/v1/medical-access/doctor/requests
 */
const getDoctorAccessRequests = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Doctor role required.',
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const requests = await accessDb.findByDoctor(doctor.id);

    const now = new Date();
    const formatted = requests.map((r) => {
      let currentStatus = r.status;
      if (r.status === 'APPROVED' && r.otpExpiresAt && now > new Date(r.otpExpiresAt)) {
        currentStatus = 'EXPIRED';
      } else if (r.status === 'COMPLETED' && r.sessionExpiresAt && now > new Date(r.sessionExpiresAt)) {
        currentStatus = 'EXPIRED';
      }

      return {
        id: r.id,
        patientId: r.patientId,
        patientName: r.patientName,
        patientUhisId: r.patientUhisId,
        patientAbhaId: r.patientAbhaId,
        reason: r.reason,
        status: currentStatus,
        requestedAt: r.requestedAt,
        respondedAt: r.respondedAt,
        denialReason: r.denialReason,
        otpExpiresAt: r.otpExpiresAt,
        sessionId: r.sessionId,
        sessionExpiresAt: r.sessionExpiresAt,
        sessionStatus: r.sessionStatus,
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
 * SECTION 6 & 8: Ending/revoking an active access session early
 * POST /api/v1/medical-access/session/revoke
 * or POST /api/v1/medical-access/session/:sessionId/revoke
 * or POST /api/v1/medical-access/revoke/:patientId
 * Body: { sessionId?, patientId?, reason? }
 */
const revokeAccessSession = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Doctor role required to revoke access sessions.',
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const targetSessionId = req.params.sessionId || req.body.sessionId;
    const rawPatientId = req.params.patientId || req.body.patientId;
    const reason = req.body.reason || 'Doctor concluded examination and closed access session.';

    let session = null;
    if (targetSessionId) {
      session = await accessDb.findSessionById(targetSessionId);
    } else if (rawPatientId) {
      const trimmedId = rawPatientId.trim();
      const patient = await prisma.patient.findFirst({
        where: {
          OR: [
            { id: trimmedId },
            { uhisId: trimmedId },
            { abhaId: trimmedId },
          ],
        },
      });
      if (patient) {
        session = await accessDb.findActiveSession(doctor.id, patient.id);
      }
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active medical access session not found to revoke.',
      });
    }

    if (session.doctorId !== doctor.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this medical access session.',
      });
    }

    // Revoke session in database
    await accessDb.revokeSession(session.id, reason);

    // Audit log: MEDICAL_ACCESS_REVOKED
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'MEDICAL_ACCESS_REVOKED',
        resource: 'MEDICAL_ACCESS_SESSION',
        details: `Doctor ${doctor.user.fullName} revoked medical access session ${session.id} for Patient ${session.patientId}. Reason: ${reason}`,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Medical record access session ended early and revoked successfully.',
      session: {
        id: session.id,
        status: 'REVOKED',
        endedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  accessDb,
  createAccessRequest,
  getPatientAccessRequests,
  getDoctorAccessRequests,
  denyAccessRequest,
  allowAccessRequest,
  getDoctorRequestStatus,
  verifyAccessOTP,
  getAuthorizedPatientRecords,
  checkActiveSession,
  revokeAccessSession,
};
