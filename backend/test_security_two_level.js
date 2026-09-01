const http = require('http');
const app = require('./src/app');
const prisma = require('./src/config/prisma');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./src/config/jwt');

let server;
let port = 5199;

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runSecurityTests() {
  console.log('================================================================');
  console.log('🔒 UHIS TWO-LEVEL DATA ACCESS & OTP SECURITY TEST SUITE');
  console.log('================================================================\n');

  // Start temporary server
  await new Promise((resolve) => {
    server = app.listen(port, resolve);
  });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message, details) {
    const num = testsPassed + testsFailed + 1;
    if (condition) {
      console.log(`  ✅ PASS [${num}]: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL [${num}]: ${message}`, details !== undefined ? details : '');
      testsFailed++;
    }
  }



  try {
    // 1. Get real doctor and patient users from DB
    const doctorUser = await prisma.user.findFirst({
      where: { email: 'doctor@uhis.gov.in', role: 'DOCTOR' },
      include: { doctorProfile: true },
    });

    const patientUser = await prisma.user.findFirst({
      where: { email: 'patient@uhis.gov.in', role: 'PATIENT' },
      include: { patientProfile: true },
    });

    const otherPatientUser = await prisma.user.findFirst({
      where: { role: 'PATIENT', NOT: { id: patientUser.id } },
      include: { patientProfile: true },
    });

    const doctorToken = jwt.sign({ id: doctorUser.id, role: 'DOCTOR', email: doctorUser.email }, JWT_SECRET, { expiresIn: '1h' });
    const patientToken = jwt.sign({ id: patientUser.id, role: 'PATIENT', email: patientUser.email }, JWT_SECRET, { expiresIn: '1h' });

    console.log(`Doctor: ${doctorUser.fullName} (ID: ${doctorUser.doctorProfile.id})`);
    console.log(`Patient 1: ${patientUser.fullName} (ABHA: ${patientUser.patientProfile.abhaId})`);
    console.log(`Patient 2: ${otherPatientUser.fullName} (ABHA: ${otherPatientUser.patientProfile.abhaId})\n`);

    // Clean up past emergency requests for these two
    await prisma.$executeRawUnsafe(
      `DELETE FROM "EmergencyAccessRequest" WHERE "doctorId" = $1 AND "patientId" = $2;`,
      doctorUser.doctorProfile.id, patientUser.patientProfile.id
    );

    // -------------------------------------------------------------
    // TEST A: Unauthenticated user requests full patient data -> 401
    // -------------------------------------------------------------
    console.log('--- TEST A: Unauthenticated Request ---');
    const resA = await request({
      path: `/api/v1/patients/${patientUser.patientProfile.abhaId}/full`,
      method: 'GET',
    });
    assert(resA.status === 401, `Unauthenticated request returns HTTP 401 (got ${resA.status})`);

    // -------------------------------------------------------------
    // TEST B: Authenticated PATIENT attempts full doctor access -> 403
    // -------------------------------------------------------------
    console.log('\n--- TEST B: Patient Role Accessing Doctor Endpoint ---');
    const resB = await request({
      path: `/api/v1/patients/${patientUser.patientProfile.abhaId}/full`,
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(resB.status === 403, `Patient role on /full returns HTTP 403 (got ${resB.status})`);

    // -------------------------------------------------------------
    // TEST C: Doctor requests full data WITHOUT patient authorization -> 403
    // -------------------------------------------------------------
    console.log('\n--- TEST C: Doctor Full Access Without Authorization ---');
    const resC = await request({
      path: `/api/v1/patients/${patientUser.patientProfile.abhaId}/full`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(resC.status === 403, `Doctor request without authorization returns HTTP 403 (got ${resC.status})`);
    assert(resC.body.error === 'AUTHORIZATION_REQUIRED', `Response indicates AUTHORIZATION_REQUIRED`);

    // -------------------------------------------------------------
    // TEST D: Level 1 Basic / Critical Info Retrieval (Data Minimization) -> 200
    // -------------------------------------------------------------
    console.log('\n--- TEST D: Level 1 Basic / Critical Information Retrieval ---');
    const resD = await request({
      path: `/api/v1/patients/${patientUser.patientProfile.abhaId}/basic`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(resD.status === 200, `Level 1 request returns HTTP 200 (got ${resD.status})`);
    assert(resD.body.level === 1 && resD.body.accessLevel === 'BASIC_CRITICAL_ONLY', `Returns Level 1 data structure`);
    assert(resD.body.patient.fullName === 'Rahul Verma', `Returns patient name: ${resD.body.patient.fullName}`);
    assert(resD.body.patient.allergies.length >= 1, `Returns critical allergies: ${resD.body.patient.allergies.map(a => a.name).join(', ')}`);
    assert(resD.body.patient.prescriptions === undefined, `Data Minimization: Prescriptions NOT present in Level 1`);
    assert(resD.body.patient.medicalRecords === undefined, `Data Minimization: Medical records/images NOT present in Level 1`);

    // -------------------------------------------------------------
    // TEST E: Doctor creates Emergency Access Request -> 200 (status PENDING, NO OTP to doctor)
    // -------------------------------------------------------------
    console.log('\n--- TEST E: Doctor Requests Emergency Access ---');
    const resE = await request({
      path: `/api/v1/emergency-access/request`,
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
    }, {
      patientUHISId: patientUser.patientProfile.abhaId,
      reason: 'Emergency treatment — acute trauma evaluation',
    });
    assert((resE.status === 200 || resE.status === 201) && resE.body.success, `Emergency request submitted successfully (HTTP ${resE.status})`);

    const requestId = resE.body.request.id;
    assert(resE.body.request.status === 'PENDING', `Request status is PENDING`);
    assert(resE.body.otp === undefined, `Doctor is NOT given the OTP`);

    // -------------------------------------------------------------
    // TEST F: Patient Approves Request -> Generates Cryptographic 6-digit OTP
    // -------------------------------------------------------------
    console.log('\n--- TEST F: Patient Approves Access & Generates OTP ---');
    const resF = await request({
      path: `/api/v1/emergency-access/patient/approve/${requestId}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(resF.status === 200 && resF.body.success, `Patient approved emergency request`);
    assert(typeof resF.body.otp === 'string' && resF.body.otp.length === 6 && /^\d{6}$/.test(resF.body.otp), `Generated valid 6-digit OTP: ${resF.body.otp}`);
    const generatedOtp = resF.body.otp;

    // Verify DB does NOT store plaintext OTP
    const dbReq = await prisma.$queryRawUnsafe(`SELECT * FROM "EmergencyAccessRequest" WHERE "id" = $1;`, requestId);
    assert(dbReq[0].otpHash && dbReq[0].otpHash.startsWith('$2'), `Database stores bcrypt hash, NOT plaintext OTP`);
    assert(dbReq[0].otpHash !== generatedOtp, `Hash is completely different from plaintext OTP`);

    // -------------------------------------------------------------
    // TEST G: Doctor enters INCORRECT OTP -> 400 Rejection & Attempt Increment
    // -------------------------------------------------------------
    console.log('\n--- TEST G: Doctor Submits Incorrect OTP ---');
    const resG = await request({
      path: `/api/v1/emergency-access/verify`,
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
    }, {
      requestId: requestId,
      otp: '000000',
    });
    assert(resG.status === 400, `Incorrect OTP rejected with HTTP 400 (got ${resG.status})`);
    assert(resG.body.attemptsRemaining === 4, `Attempt counter decremented: ${resG.body.attemptsRemaining} remaining`);

    // -------------------------------------------------------------
    // TEST H: Doctor enters CORRECT OTP -> 200 Verified & Temporary 15-min Access
    // -------------------------------------------------------------
    console.log('\n--- TEST H: Doctor Submits Correct OTP ---');
    const resH = await request({
      path: `/api/v1/emergency-access/verify`,
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
    }, {
      requestId: requestId,
      otp: generatedOtp,
    });
    assert(resH.status === 200 && resH.body.success, `Correct OTP verified with HTTP 200`);
    assert(resH.body.accessExpiresAt !== undefined, `Temporary access granted with expiration: ${resH.body.accessExpiresAt}`);

    // Verify OTP hash is wiped (Single-use token!)
    const dbVerified = await prisma.$queryRawUnsafe(`SELECT * FROM "EmergencyAccessRequest" WHERE "id" = $1;`, requestId);
    assert(dbVerified[0].otpHash === null, `OTP hash is wiped in DB (Single-use token consumed)`);
    assert(dbVerified[0].status === 'VERIFIED', `Request status updated to VERIFIED`);

    // -------------------------------------------------------------
    // TEST I: Doctor attempts to REUSE the same OTP -> Rejected
    // -------------------------------------------------------------
    console.log('\n--- TEST I: OTP Single-Use Enforcement ---');
    const resI = await request({
      path: `/api/v1/emergency-access/verify`,
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
    }, {
      requestId: requestId,
      otp: generatedOtp,
    });
    assert(resI.status === 400, `Reused OTP is rejected with HTTP 400 (got ${resI.status})`);

    // -------------------------------------------------------------
    // TEST J: Level 2 Full Patient Medical Records Retrieval -> 200 (READ-ONLY)
    // -------------------------------------------------------------
    console.log('\n--- TEST J: Level 2 Full Medical Records Access ---');
    const resJ = await request({
      path: `/api/v1/patients/${patientUser.patientProfile.abhaId}/full`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(resJ.status === 200 && resJ.body.success, `Authorized full records returned with HTTP 200`, resJ.body);
    assert(resJ.body.readOnly === true, `Access mode is strictly READ-ONLY`, resJ.body);
    assert(resJ.body.patientData?.diseases?.length >= 1, `Returns full diagnoses (${resJ.body.patientData?.diseases?.length} items)`);
    assert(resJ.body.patientData?.medications?.length >= 1, `Returns active prescriptions (${resJ.body.patientData?.medications?.length} items)`);
    assert(resJ.body.patientData?.medicalRecords?.length >= 1, `Returns medical records (${resJ.body.patientData?.medicalRecords?.length} items)`, resJ.body.patientData?.medicalRecords);

    // TEST J2: Dedicated /medical-records endpoint authorized retrieval
    console.log('\n--- TEST J2: GET /patients/:patientId/medical-records ---');
    const resJ2 = await request({
      path: `/api/v1/patients/${patientUser.patientProfile.abhaId}/medical-records`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(resJ2.status === 200 && resJ2.body.success, `Authorized doctor retrieves /medical-records with HTTP 200`);
    assert(resJ2.body.readOnly === true, `Medical records access mode is strictly READ-ONLY`);
    assert(resJ2.body.medicalRecords.some(r => r.recordType === 'RADIOLOGY' && r.attachmentUrl), `Contains Chest X-Ray radiograph with attachmentUrl`);
    assert(resJ2.body.labReports.length >= 1, `Contains Blood Test / Lab Reports (${resJ2.body.labReports.length} reports)`);
    assert(resJ2.body.prescriptions.length >= 1, `Contains Prescriptions (${resJ2.body.prescriptions.length} prescriptions)`);

    // TEST J3: Patient self-access on medical-records
    console.log('\n--- TEST J3: Patient Portal Self-Access to Medical Records ---');
    const resJ3 = await request({
      path: `/api/v1/patients/medical-records`,
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(resJ3.status === 200 && resJ3.body.success, `Patient successfully retrieves own medical records with HTTP 200`);
    assert(resJ3.body.readOnly === false, `Patient access is owner access (readOnly = false)`);

    // -------------------------------------------------------------
    // TEST K: Patient Isolation (Doctor cannot access Patient 2 with Patient 1 authorization)
    // -------------------------------------------------------------
    console.log('\n--- TEST K: Patient Isolation Enforcement ---');
    const resK = await request({
      path: `/api/v1/patients/${otherPatientUser.patientProfile.abhaId}/full`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(resK.status === 403, `Attempting access on unauthorized patient returns HTTP 403 (got ${resK.status})`);

    const resK2 = await request({
      path: `/api/v1/patients/${otherPatientUser.patientProfile.abhaId}/medical-records`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(resK2.status === 403, `Attempting /medical-records on unauthorized patient returns HTTP 403 (got ${resK2.status})`);

    // -------------------------------------------------------------
    // TEST K3: Expiration Enforcement
    // -------------------------------------------------------------
    console.log('\n--- TEST K3: Access Expiration Enforcement ---');
    await prisma.$executeRawUnsafe(
      `UPDATE "EmergencyAccessRequest" SET "accessExpiresAt" = datetime('now', '-10 seconds') WHERE "id" = $1;`,
      requestId
    );
    const resExpired = await request({
      path: `/api/v1/patients/${patientUser.patientProfile.abhaId}/medical-records`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(resExpired.status === 403, `Expired emergency access is rejected with HTTP 403 (got ${resExpired.status})`);
    assert(resExpired.body.error === 'ACCESS_EXPIRED', `Response indicates ACCESS_EXPIRED`);


    // -------------------------------------------------------------
    // TEST L: Audit Log Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST L: Audit Log Integrity Verification ---');
    const requiredActions = [
      'BASIC_PATIENT_DATA_ACCESSED',
      'FULL_ACCESS_REQUESTED',
      'FULL_ACCESS_APPROVED',
      'OTP_VERIFICATION_FAILED',
      'OTP_VERIFICATION_SUCCESS',
      'FULL_MEDICAL_DATA_ACCESSED',
    ];

    for (const action of requiredActions) {
      const log = await prisma.auditLog.findFirst({
        where: { action },
        orderBy: { timestamp: 'desc' },
      });
      assert(!!log, `AuditLog contains action: ${action}`);
    }


  } catch (error) {
    console.error('Test execution error:', error);
    testsFailed++;
  } finally {
    server.close();
    await prisma.$disconnect();

    console.log('\n================================================================');
    console.log(`🏁 TEST SUMMARY: ${testsPassed} PASSED | ${testsFailed} FAILED`);
    console.log('================================================================\n');

    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

runSecurityTests();
