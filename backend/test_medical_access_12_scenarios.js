const http = require('http');
const app = require('./src/app');
const prisma = require('./src/config/prisma');

let server;
const PORT = 5299;

function request({ path, method = 'GET', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = raw;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    if (details) console.error('     Details:', details);
    failed++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 UHIS DOCTOR → PATIENT MEDICAL RECORD ACCESS TEST SUITE');
  console.log('   Testing 12 Required Core Business Flow Scenarios');
  console.log('================================================================\n');

  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  try {
    // Clean up test medical access records
    await prisma.$executeRawUnsafe('DELETE FROM "MedicalAccessSession";');
    await prisma.$executeRawUnsafe('DELETE FROM "AccessOTP";');
    await prisma.$executeRawUnsafe('DELETE FROM "MedicalAccessRequest";');
    await prisma.$executeRawUnsafe('DELETE FROM "Notification" WHERE "type" = \'MEDICAL_ACCESS_REQUEST\';');

    // 1. Authenticate Doctor 1 (doctor22@uhis.org)
    const doc1Login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'doctor22@uhis.org', password: 'password123' },
    });
    assert(doc1Login.status === 200 && doc1Login.body.token, 'Doctor 1 logged in successfully');
    const doc1Token = doc1Login.body.token;

    // 2. Authenticate Doctor 2 (doctor23@uhis.org)
    const doc2Login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'doctor23@uhis.org', password: 'password123' },
    });
    assert(doc2Login.status === 200 && doc2Login.body.token, 'Doctor 2 logged in successfully');
    const doc2Token = doc2Login.body.token;

    // 3. Authenticate Patient A (patient22@uhis.org)
    const patALogin = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'patient22@uhis.org', password: 'password123' },
    });
    assert(patALogin.status === 200 && patALogin.body.token, 'Patient A logged in successfully');
    const patAToken = patALogin.body.token;
    const patA = await prisma.patient.findFirst({
      where: { user: { email: 'patient22@uhis.org' } },
      include: { user: true },
    });

    // 4. Authenticate Patient B (patient23@uhis.org)
    const patBLogin = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'patient23@uhis.org', password: 'password123' },
    });
    assert(patBLogin.status === 200 && patBLogin.body.token, 'Patient B logged in successfully');
    const patBToken = patBLogin.body.token;
    const patB = await prisma.patient.findFirst({
      where: { user: { email: 'patient23@uhis.org' } },
      include: { user: true },
    });

    console.log(`\nActors resolved:`);
    console.log(`  Doctor 1: ${doc1Login.body.user.fullName}`);
    console.log(`  Doctor 2: ${doc2Login.body.user.fullName}`);
    console.log(`  Patient A: ${patA.user.fullName} (${patA.abhaId})`);
    console.log(`  Patient B: ${patB.user.fullName} (${patB.abhaId})`);

    // =========================================================================
    // TEST 1: Doctor requests Patient A. Patient A receives notification. Patient B receives nothing.
    // =========================================================================
    console.log('\n--- SCENARIO 1: Doctor requests Patient A notification isolation ---');
    const req1 = await request({
      path: '/api/v1/medical-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { patientId: patA.id, reason: 'Cardiology consultation and review' },
    });
    assert(req1.status === 201 && req1.body.success, 'Doctor 1 created access request for Patient A');
    const req1Id = req1.body.request.id;

    // Check notifications for Patient A
    const patANotifs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Notification" WHERE "userId" = $1 AND "type" = 'MEDICAL_ACCESS_REQUEST' ORDER BY "createdAt" DESC;`,
      patA.userId
    );
    assert(patANotifs.length >= 1, 'Patient A received the medical record access notification');
    const notifData = JSON.parse(patANotifs[0].data || '{}');
    assert(notifData.accessRequestId === req1Id, 'Patient A notification links to exact access request ID');

    // Check notifications for Patient B
    const patBNotifs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Notification" WHERE "userId" = $1 AND "type" = 'MEDICAL_ACCESS_REQUEST';`,
      patB.userId
    );
    const patBHasReq1 = patBNotifs.some(n => {
      try { return JSON.parse(n.data).accessRequestId === req1Id; } catch (e) { return false; }
    });
    assert(!patBHasReq1, 'Patient B received NOTHING (Zero notifications for Patient A request)');

    // =========================================================================
    // TEST 2: Patient A clicks DENY. No OTP generated. Doctor cannot access records.
    // =========================================================================
    console.log('\n--- SCENARIO 2: Patient A clicks DENY ---');
    const denyRes = await request({
      path: `/api/v1/medical-access/patient/deny/${req1Id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patAToken}` },
      body: { denialReason: 'Patient prefers in-person consultation' },
    });
    assert(denyRes.status === 200 && denyRes.body.status === 'DENIED', 'Patient A successfully denied access request');

    // Verify NO OTP generated
    const otpForDenied = await prisma.$queryRawUnsafe(
      `SELECT * FROM "AccessOTP" WHERE "accessRequestId" = $1;`,
      req1Id
    );
    assert(!otpForDenied || otpForDenied.length === 0, 'No OTP was generated for denied request');

    // Doctor checks status
    const statusCheckDenied = await request({
      path: `/api/v1/medical-access/doctor/status/${req1Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc1Token}` },
    });
    assert(statusCheckDenied.body.request.status === 'DENIED', 'Doctor sees status DENIED: "Patient denied medical record access."');

    // Doctor cannot access records
    const recordAccessDenied = await request({
      path: `/api/v1/medical-access/records/${patA.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc1Token}` },
    });
    assert(recordAccessDenied.status === 403, 'Doctor cannot access Patient A records (HTTP 403 Forbidden)');

    // =========================================================================
    // TEST 3: Patient A clicks ALLOW. OTP generated specifically for that request.
    // =========================================================================
    console.log('\n--- SCENARIO 3: Patient A clicks ALLOW & generates secure 6-digit OTP ---');
    const req2 = await request({
      path: '/api/v1/medical-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { patientId: patA.id, reason: 'Follow-up diagnostic record check' },
    });
    const req2Id = req2.body.request.id;

    const allowRes = await request({
      path: `/api/v1/medical-access/patient/allow/${req2Id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patAToken}` },
    });
    assert(allowRes.status === 200 && allowRes.body.otp, 'Patient A successfully approved request and received OTP');
    const otpGenerated = allowRes.body.otp;
    assert(/^\d{6}$/.test(otpGenerated), `Generated OTP is a 6-digit number (${otpGenerated})`);
    assert(allowRes.body.expiresInSeconds === 300, 'OTP validity is exactly 5 minutes (300 seconds)');

    // Verify in DB: Stored as bcrypt hash, not plaintext
    const dbOtp = await prisma.$queryRawUnsafe(
      `SELECT * FROM "AccessOTP" WHERE "accessRequestId" = $1;`,
      req2Id
    );
    assert(dbOtp.length > 0, 'AccessOTP record exists in database for this request');
    assert(dbOtp[0].otpHash !== otpGenerated, 'OTP is securely hashed with bcrypt in the database (never plain)');

    // =========================================================================
    // TEST 4: Doctor enters correct OTP within 5 minutes. Access session created.
    // =========================================================================
    console.log('\n--- SCENARIO 4: Doctor enters correct OTP within 5 minutes ---');
    const verifyRes = await request({
      path: '/api/v1/medical-access/doctor/verify-otp',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { accessRequestId: req2Id, otp: otpGenerated, patientId: patA.id },
    });
    assert(verifyRes.status === 200 && verifyRes.body.session, 'Doctor verified OTP successfully and MedicalAccessSession created');
    const session = verifyRes.body.session;
    assert(session.status === 'ACTIVE', 'MedicalAccessSession status is ACTIVE');

    // Doctor can now view medical records
    const viewRecordsRes = await request({
      path: `/api/v1/medical-access/records/${patA.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc1Token}` },
    });
    assert(viewRecordsRes.status === 200 && viewRecordsRes.body.patientData, 'Doctor successfully retrieved authorized medical records');
    assert(viewRecordsRes.body.patientData.patient.abhaId === patA.abhaId, 'Retrieved records match Patient A');

    // =========================================================================
    // TEST 5: Doctor enters incorrect OTP. Access denied.
    // =========================================================================
    console.log('\n--- SCENARIO 5: Doctor enters incorrect OTP ---');
    // Clear previous session so doctor can test new request flow
    await prisma.$executeRawUnsafe('DELETE FROM "MedicalAccessSession";');

    const req3 = await request({
      path: '/api/v1/medical-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { patientId: patA.id, reason: 'Test incorrect OTP' },
    });
    const req3Id = req3.body.request.id;
    await request({
      path: `/api/v1/medical-access/patient/allow/${req3Id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patAToken}` },
    });

    const wrongOtpRes = await request({
      path: '/api/v1/medical-access/doctor/verify-otp',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { accessRequestId: req3Id, otp: '000000', patientId: patA.id },
    });
    assert(wrongOtpRes.status === 400, 'Verification rejected with HTTP 400 for incorrect OTP');
    assert(wrongOtpRes.body.message === 'Invalid or expired OTP.', 'Returned sanitized error message');

    // =========================================================================
    // TEST 6: Doctor enters correct OTP after 5 minutes. Access denied.
    // =========================================================================
    console.log('\n--- SCENARIO 6: Doctor enters correct OTP after 5 minutes (Expired OTP) ---');
    await prisma.$executeRawUnsafe('DELETE FROM "MedicalAccessSession";');
    const req4 = await request({
      path: '/api/v1/medical-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { patientId: patA.id, reason: 'Test expired OTP' },
    });
    const req4Id = req4.body.request.id;
    const allowReq4 = await request({
      path: `/api/v1/medical-access/patient/allow/${req4Id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patAToken}` },
    });
    const otp4 = allowReq4.body.otp;

    // Simulate OTP expiration (set expiresAt 10 seconds in the past)
    await prisma.$executeRawUnsafe(
      `UPDATE "AccessOTP" SET "expiresAt" = datetime('now', '-10 seconds') WHERE "accessRequestId" = $1;`,
      req4Id
    );

    const expiredOtpRes = await request({
      path: '/api/v1/medical-access/doctor/verify-otp',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { accessRequestId: req4Id, otp: otp4, patientId: patA.id },
    });
    assert(expiredOtpRes.status === 400, 'Expired OTP rejected with HTTP 400');
    assert(expiredOtpRes.body.message === 'Invalid or expired OTP.', 'Error message: Invalid or expired OTP.');

    // =========================================================================
    // TEST 7: Doctor successfully verifies OTP. After 15 minutes, API access rejected.
    // =========================================================================
    console.log('\n--- SCENARIO 7: 15-minute temporary access expiry enforced ---');
    const req5 = await request({
      path: '/api/v1/medical-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { patientId: patA.id, reason: 'Test 15-minute expiration' },
    });
    const req5Id = req5.body.request.id;
    const allowReq5 = await request({
      path: `/api/v1/medical-access/patient/allow/${req5Id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patAToken}` },
    });
    const otp5 = allowReq5.body.otp;

    const verify5 = await request({
      path: '/api/v1/medical-access/doctor/verify-otp',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { accessRequestId: req5Id, otp: otp5, patientId: patA.id },
    });
    assert(verify5.status === 200, 'Session created initially');

    // Simulate 15 minutes passing (set session expiresAt to 10 seconds in the past)
    await prisma.$executeRawUnsafe(
      `UPDATE "MedicalAccessSession" SET "expiresAt" = datetime('now', '-10 seconds') WHERE "accessRequestId" = $1;`,
      req5Id
    );

    const expiredAccessRes = await request({
      path: `/api/v1/medical-access/records/${patA.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc1Token}` },
    });
    assert(expiredAccessRes.status === 403, 'After 15 minutes, API access is rejected (HTTP 403 Forbidden)');
    assert(expiredAccessRes.body.error === 'ACCESS_EXPIRED', 'Error code: ACCESS_EXPIRED');

    // =========================================================================
    // TEST 8: Doctor tries to reuse the same OTP. Access denied.
    // =========================================================================
    console.log('\n--- SCENARIO 8: Doctor tries to reuse already used OTP ---');
    await prisma.$executeRawUnsafe('DELETE FROM "MedicalAccessSession";');
    const req6 = await request({
      path: '/api/v1/medical-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { patientId: patA.id, reason: 'Test OTP reuse prevention' },
    });
    const req6Id = req6.body.request.id;
    const allowReq6 = await request({
      path: `/api/v1/medical-access/patient/allow/${req6Id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patAToken}` },
    });
    const otp6 = allowReq6.body.otp;

    // First use: must succeed
    const firstUseRes = await request({
      path: '/api/v1/medical-access/doctor/verify-otp',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { accessRequestId: req6Id, otp: otp6, patientId: patA.id },
    });
    assert(firstUseRes.status === 200, 'First OTP verification succeeded');

    // Second use: must be denied
    const secondUseRes = await request({
      path: '/api/v1/medical-access/doctor/verify-otp',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { accessRequestId: req6Id, otp: otp6, patientId: patA.id },
    });
    assert(secondUseRes.status === 400, 'Reusing the same OTP is denied (HTTP 400)');
    assert(secondUseRes.body.message === 'Invalid or expired OTP.', 'Single-use guarantee preserved');

    // =========================================================================
    // TEST 9: Doctor tries to access Patient B using Patient A's OTP. Access denied.
    // =========================================================================
    console.log('\n--- SCENARIO 9: Doctor tries to access Patient B using Patient A OTP ---');
    await prisma.$executeRawUnsafe('DELETE FROM "MedicalAccessSession";');
    const reqPatA = await request({
      path: '/api/v1/medical-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { patientId: patA.id, reason: 'Cross-patient test for Patient A' },
    });
    const allowPatA = await request({
      path: `/api/v1/medical-access/patient/allow/${reqPatA.body.request.id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patAToken}` },
    });
    const otpA = allowPatA.body.otp;

    const reqPatB = await request({
      path: '/api/v1/medical-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { patientId: patB.id, reason: 'Cross-patient test for Patient B' },
    });
    await request({
      path: `/api/v1/medical-access/patient/allow/${reqPatB.body.request.id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patBToken}` },
    });

    // Try to verify Patient B's request with Patient A's OTP
    const crossVerifyRes = await request({
      path: '/api/v1/medical-access/doctor/verify-otp',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { accessRequestId: reqPatB.body.request.id, otp: otpA, patientId: patB.id },
    });
    assert(crossVerifyRes.status === 400, 'Access denied when using Patient A OTP on Patient B request');

    // Try passing Patient B id on Patient A request
    const wrongPatientIdRes = await request({
      path: '/api/v1/medical-access/doctor/verify-otp',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { accessRequestId: reqPatA.body.request.id, otp: otpA, patientId: patB.id },
    });
    assert(wrongPatientIdRes.status === 403, 'Cross-patient mismatched patientId rejected with HTTP 403');

    // =========================================================================
    // TEST 10: Doctor refreshes page after 15 minutes. Backend still rejects access.
    // =========================================================================
    console.log('\n--- SCENARIO 10: Backend rejects access on page refresh after 15 mins ---');
    // Ensure all sessions for Patient A are expired
    await prisma.$executeRawUnsafe(
      `UPDATE "MedicalAccessSession" SET "expiresAt" = datetime('now', '-30 seconds'), "status" = 'EXPIRED' WHERE "patientId" = $1;`,
      patA.id
    );

    const refresh1 = await request({
      path: `/api/v1/medical-access/records/${patA.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc1Token}` },
    });
    assert(refresh1.status === 403, 'First refresh: 403 Access Expired');

    const refresh2 = await request({
      path: `/api/v1/medical-access/records/${patA.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc1Token}` },
    });
    assert(refresh2.status === 403, 'Second refresh: 403 Access Expired (Backend strictly persistent)');

    const refreshLevel2 = await request({
      path: `/api/v1/patients/${patA.id}/full`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc1Token}` },
    });
    assert(refreshLevel2.status === 403, 'Protected /patients/:patientId/full also rejects with 403 Access Expired');

    // =========================================================================
    // TEST 11: Two different doctors request same patient. Independent IDs & sessions.
    // =========================================================================
    console.log('\n--- SCENARIO 11: Multi-doctor independent requests for same patient ---');
    // Doctor 1 requests Patient B
    const doc1ReqB = await request({
      path: '/api/v1/medical-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc1Token}` },
      body: { patientId: patB.id, reason: 'Consultation from Doctor 1' },
    });
    const doc1ReqBId = doc1ReqB.body.request.id;

    // Doctor 2 requests Patient B
    const doc2ReqB = await request({
      path: '/api/v1/medical-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc2Token}` },
      body: { patientId: patB.id, reason: 'Second opinion from Doctor 2' },
    });
    const doc2ReqBId = doc2ReqB.body.request.id;

    assert(doc1ReqBId !== doc2ReqBId, `Doctor 1 ID (${doc1ReqBId}) !== Doctor 2 ID (${doc2ReqBId})`);

    // Patient B denies Doctor 1, but approves Doctor 2
    await request({
      path: `/api/v1/medical-access/patient/deny/${doc1ReqBId}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patBToken}` },
    });
    const doc2Approval = await request({
      path: `/api/v1/medical-access/patient/allow/${doc2ReqBId}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${patBToken}` },
    });
    const otpDoc2 = doc2Approval.body.otp;

    // Doctor 1 CANNOT access Patient B
    const doc1AccessB = await request({
      path: `/api/v1/medical-access/records/${patB.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc1Token}` },
    });
    assert(doc1AccessB.status === 403, 'Doctor 1 access to Patient B is DENIED (HTTP 403)');

    // Doctor 2 verifies their OTP
    const doc2Verify = await request({
      path: '/api/v1/medical-access/doctor/verify-otp',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc2Token}` },
      body: { accessRequestId: doc2ReqBId, otp: otpDoc2, patientId: patB.id },
    });
    assert(doc2Verify.status === 200, 'Doctor 2 successfully verified their independent OTP');

    // Doctor 2 CAN access Patient B
    const doc2AccessB = await request({
      path: `/api/v1/medical-access/records/${patB.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc2Token}` },
    });
    assert(doc2AccessB.status === 200, 'Doctor 2 successfully accesses Patient B records');

    // Doctor 1 STILL CANNOT access Patient B
    const doc1StillDenied = await request({
      path: `/api/v1/medical-access/records/${patB.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc1Token}` },
    });
    assert(doc1StillDenied.status === 403, 'Doctor 1 is still denied access (Doctor 2 session is isolated)');

    // =========================================================================
    // TEST 12: Doctor requests two different patients. Isolation between patients.
    // =========================================================================
    console.log('\n--- SCENARIO 12: Doctor requests Patient A & B: Session isolation ---');
    // Ensure Doctor 2 has active session for Patient B (from Test 11).
    // Doctor 2 does NOT have a session for Patient A.
    const doc2TryPatientA = await request({
      path: `/api/v1/medical-access/records/${patA.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc2Token}` },
    });
    assert(doc2TryPatientA.status === 403, 'Doctor 2 cannot access Patient A (Active session for Patient B does not leak to Patient A)');

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log('\n================================================================');
    console.log(`📊 TEST EXECUTION SUMMARY:`);
    console.log(`   Total Asserts: ${passed + failed}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log('================================================================\n');

    if (failed === 0) {
      console.log('🎉 ALL 12 TEST SCENARIOS PASSED WITH 100% SUCCESS!');
    } else {
      throw new Error(`${failed} test assertions failed.`);
    }

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  }
}

runTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
