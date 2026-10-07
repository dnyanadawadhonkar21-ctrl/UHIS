const http = require('http');
const prisma = require('./src/config/prisma');
const app = require('./src/app');

let server;
let port = 5055;
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

function request({ path, method = 'GET', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
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

async function runCompleteAbhaFlowTests() {
  console.log('================================================================');
  console.log('🧪 UHIS COMPREHENSIVE ABHA ID INTEGRATION & OPD WORKFLOW TEST');
  console.log('================================================================\n');

  // Start local test server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(port, resolve));
  console.log(`📡 Test server running on http://127.0.0.1:${port}\n`);

  try {
    // -------------------------------------------------------------
    // STEP 1: PATIENT REGISTRATION & UNIQUE ABHA ID ASSIGNMENT
    // -------------------------------------------------------------
    console.log('--- STEP 1: PATIENT REGISTRATION WITH UNIQUE ABHA ID ---');
    const testAbha1 = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const testEmail1 = `testpatient_${Date.now()}@uhis.org`;

    const reg1 = await request({
      path: '/api/v1/auth/register',
      method: 'POST',
      body: {
        fullName: 'Aarav Sharma',
        email: testEmail1,
        password: 'password123',
        role: 'PATIENT',
        phoneNumber: '+91 98765 11223',
        gender: 'MALE',
        dateOfBirth: '1992-07-20',
        bloodGroup: 'O+',
        height: '178 cm',
        weight: '72 kg',
        address: '15, Park Street, New Delhi',
        emergencyContact: 'Meera Sharma (Spouse) · +91 98765 99887',
        abhaId: testAbha1,
      },
    });

    assert(reg1.status === 201, 'Patient Aarav Sharma registered successfully with HTTP 201', reg1.body);
    assert(reg1.body?.user?.abhaId === testAbha1, `Returned ABHA ID matches registered ID (${testAbha1})`, reg1.body);

    // Verify in database
    const patientInDb = await prisma.patient.findUnique({
      where: { abhaId: testAbha1 },
      include: { user: true },
    });
    assert(patientInDb !== null, 'Patient record verified in database by unique ABHA ID', patientInDb);
    assert(patientInDb?.user?.fullName === 'Aarav Sharma', 'Patient user fullName matches Aarav Sharma');

    // -------------------------------------------------------------
    // STEP 2: DUPLICATE ABHA ID PREVENTION (DATABASE & API LEVEL)
    // -------------------------------------------------------------
    console.log('\n--- STEP 2: DUPLICATE ABHA ID PREVENTION ---');
    const testEmail2 = `testpatient2_${Date.now()}@uhis.org`;

    const regDuplicate = await request({
      path: '/api/v1/auth/register',
      method: 'POST',
      body: {
        fullName: 'Duplicate Aarav Attempt',
        email: testEmail2,
        password: 'password123',
        role: 'PATIENT',
        abhaId: testAbha1, // Attempting to reuse same ABHA ID
      },
    });

    assert(regDuplicate.status === 400, 'Duplicate ABHA registration rejected with HTTP 400', regDuplicate.body);
    assert(
      regDuplicate.body?.message === 'This ABHA ID is already registered in the system.',
      'Clear error message returned: "This ABHA ID is already registered in the system."',
      regDuplicate.body
    );

    // -------------------------------------------------------------
    // STEP 3: DOCTOR AUTHENTICATION & LOGIN
    // -------------------------------------------------------------
    console.log('\n--- STEP 3: DOCTOR AUTHENTICATION ---');
    // Ensure doctor user exists
    let doctorUser = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
    if (!doctorUser) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('password123', 10);
      doctorUser = await prisma.user.create({
        data: {
          fullName: 'Dr. Anita Desai',
          email: 'doctor_test@uhis.gov.in',
          password: hash,
          role: 'DOCTOR',
        },
      });
    }

    const docLogin = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: doctorUser.email, password: 'password123' },
    });

    assert(docLogin.status === 200, 'Doctor logged in successfully with HTTP 200', docLogin.body);
    const doctorToken = docLogin.body?.token;
    assert(!!doctorToken, 'Doctor JWT authentication token received');

    const authHeaders = { Authorization: `Bearer ${doctorToken}` };

    // -------------------------------------------------------------
    // STEP 4: DOCTOR SEARCHES PATIENT BY ABHA ID
    // -------------------------------------------------------------
    console.log('\n--- STEP 4: DOCTOR SEARCHES PATIENT BY ABHA ID ---');

    // Case A: Valid search with exact matching patient
    const searchMatch = await request({
      path: `/api/v1/patients/search/abha?abhaId=${testAbha1}`,
      method: 'GET',
      headers: authHeaders,
    });

    assert(searchMatch.status === 200, 'Search by valid ABHA ID returns HTTP 200', searchMatch.body);
    assert(searchMatch.body?.success === true, 'Search response indicates success');
    assert(searchMatch.body?.patient?.fullName === 'Aarav Sharma', 'Search correctly retrieved Aarav Sharma');
    assert(searchMatch.body?.patient?.abhaId === testAbha1, `Retrieved ABHA ID matches ${testAbha1}`);
    assert(searchMatch.body?.patient?.bloodGroup === 'O+', 'Retrieved Blood Group is O+');

    // Case B: Search with nonexistent ABHA ID
    const searchNotFound = await request({
      path: '/api/v1/patients/search/abha?abhaId=91-9999-9999-9999',
      method: 'GET',
      headers: authHeaders,
    });

    assert(searchNotFound.status === 404, 'Search for nonexistent ABHA ID returns HTTP 404', searchNotFound.body);
    assert(
      searchNotFound.body?.message === 'No patient found with this ABHA ID.',
      'Message is exact: "No patient found with this ABHA ID."',
      searchNotFound.body
    );

    // Case C: Empty Search Input
    const searchEmpty = await request({
      path: '/api/v1/patients/search/abha?abhaId=',
      method: 'GET',
      headers: authHeaders,
    });

    assert(searchEmpty.status === 400, 'Empty ABHA ID search returns HTTP 400', searchEmpty.body);
    assert(
      searchEmpty.body?.message === 'Please enter an ABHA ID.',
      'Message is exact: "Please enter an ABHA ID."',
      searchEmpty.body
    );

    // Case D: Invalid Format Search Input
    const searchInvalid = await request({
      path: '/api/v1/patients/search/abha?abhaId=%3Cscript%3Etest',
      method: 'GET',
      headers: authHeaders,
    });

    assert(searchInvalid.status === 400, 'Invalid format search returns HTTP 400', searchInvalid.body);
    assert(searchInvalid.body?.message.includes('Invalid ABHA ID format'), 'Message alerts invalid format', searchInvalid.body);

    // -------------------------------------------------------------
    // STEP 5: PATIENT PROFILE RETRIEVAL USING ABHA ID
    // -------------------------------------------------------------
    console.log('\n--- STEP 5: PATIENT PROFILE RETRIEVAL USING ABHA ID ---');
    const profileRes = await request({
      path: `/api/v1/patients/profile/${testAbha1}`,
      method: 'GET',
      headers: authHeaders,
    });

    assert(profileRes.status === 200, 'Patient Profile retrieved using ABHA ID with HTTP 200', profileRes.body);
    assert(profileRes.body?.patientData?.patient?.fullName === 'Aarav Sharma', 'Profile fullName is Aarav Sharma');
    assert(profileRes.body?.patientData?.patient?.abhaId === testAbha1, `Profile ABHA ID is ${testAbha1}`);

    // -------------------------------------------------------------
    // STEP 6: OPD CONSULTATION & MEDICAL RECORD WORKFLOW CONTINUES
    // -------------------------------------------------------------
    console.log('\n--- STEP 6: CONSULTATION & OPD WORKFLOW CONTINUATION ---');
    const basicInfoRes = await request({
      path: `/api/v1/patients/${testAbha1}/basic`,
      method: 'GET',
      headers: authHeaders,
    });

    assert(basicInfoRes.status === 200, 'Doctor accessed Level 1 basic info using ABHA ID with HTTP 200', basicInfoRes.body);
    assert(basicInfoRes.body?.patient?.fullName === 'Aarav Sharma', 'Level 1 patient name is Aarav Sharma');
    assert(
      basicInfoRes.body?.patient?.uhisId !== testAbha1 && basicInfoRes.body?.patient?.uhisId?.startsWith('PT-2026-'),
      'Level 1 uhisId is separate from ABHA ID (PT-2026-XXX format)'
    );

    // Clean up temporary test patient
    await prisma.patient.delete({ where: { abhaId: testAbha1 } }).catch(() => {});
    await prisma.user.delete({ where: { email: testEmail1 } }).catch(() => {});

    console.log('\n================================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      throw new Error(`${failed} test(s) failed.`);
    }
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
  }
}

runCompleteAbhaFlowTests()
  .then(() => {
    console.log('🎉 Complete End-to-End ABHA Flow Verified Successfully!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Test suite execution failed:', err);
    process.exit(1);
  });
