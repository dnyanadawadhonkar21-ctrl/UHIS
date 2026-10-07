const prisma = require('./src/config/prisma');
const app = require('./src/app');
const http = require('http');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./src/config/jwt');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 UHIS ID vs ABHA ID SEPARATION VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. DATABASE SCHEMA & CONSTRAINT INTEGRITY ---
  console.log('--- 1. DATABASE SCHEMA & CONSTRAINT INTEGRITY ---');

  const tableInfo = await prisma.$queryRawUnsafe('PRAGMA table_info(Patient)');
  const colNames = tableInfo.map(c => c.name);
  assert(colNames.includes('abhaId'), 'Patient table has separate abhaId column');
  assert(colNames.includes('uhisId'), 'Patient table has separate uhisId column');

  const indexList = await prisma.$queryRawUnsafe('PRAGMA index_list(Patient)');
  console.log('  Index list from SQLite:', indexList);
  const hasUhisIndex = indexList.some(i => i.name.toLowerCase().includes('uhisid') && (i.unique == 1 || i.unique === true));
  const hasAbhaIndex = indexList.some(i => i.name.toLowerCase().includes('abhaid') && (i.unique == 1 || i.unique === true));
  assert(hasUhisIndex, 'Patient table has UNIQUE index on uhisId');
  assert(hasAbhaIndex, 'Patient table has UNIQUE index on abhaId');

  // --- 2. EXISTING PATIENT DATA DIVERSITY & INTEGRITY ---
  console.log('\n--- 2. EXISTING PATIENT DATA DIVERSITY & INTEGRITY ---');

  const allPatients = await prisma.patient.findMany({
    select: { id: true, uhisId: true, abhaId: true, user: { select: { fullName: true } } }
  });

  const matchingIdCount = allPatients.filter(p => p.uhisId === p.abhaId).length;
  assert(matchingIdCount === 0, `Zero patients have uhisId === abhaId (checked ${allPatients.length} patients)`);

  const uniqueUhis = new Set(allPatients.map(p => p.uhisId));
  const uniqueAbha = new Set(allPatients.map(p => p.abhaId));
  assert(uniqueUhis.size === allPatients.length, `All ${allPatients.length} UHIS IDs are strictly unique`);
  assert(uniqueAbha.size === allPatients.length, `All ${allPatients.length} ABHA IDs are strictly unique`);

  // --- 3. PATIENT A vs PATIENT B COMPARISON (REQUIREMENT 10) ---
  console.log('\n--- 3. PATIENT A vs PATIENT B COMPARISON (REQUIREMENT 10) ---');

  const patientA = await prisma.patient.findFirst({
    where: { abhaId: '91-9912-4430-1102' },
    include: { user: true }
  });

  const patientB = await prisma.patient.findFirst({
    where: { abhaId: '91-7743-2218-5561' },
    include: { user: true }
  });

  assert(!!patientA, 'Found Patient A (Amit Kulkarni) in database');
  assert(!!patientB, 'Found Patient B (Priya Sharma) in database');

  if (patientA && patientB) {
    console.log(`\n  Patient A: ${patientA.user.fullName}`);
    console.log(`    ABHA ID: ${patientA.abhaId}`);
    console.log(`    UHIS ID: ${patientA.uhisId}`);
    assert(patientA.abhaId !== patientA.uhisId, 'Patient A: ABHA ID ≠ UHIS ID');
    assert(patientA.abhaId === '91-9912-4430-1102', 'Patient A: ABHA ID is 91-9912-4430-1102');
    assert(patientA.uhisId === 'PT-2026-025', 'Patient A: UHIS ID is PT-2026-025');

    console.log(`\n  Patient B: ${patientB.user.fullName}`);
    console.log(`    ABHA ID: ${patientB.abhaId}`);
    console.log(`    UHIS ID: ${patientB.uhisId}`);
    assert(patientB.abhaId !== patientB.uhisId, 'Patient B: ABHA ID ≠ UHIS ID');
    assert(patientB.abhaId === '91-7743-2218-5561', 'Patient B: ABHA ID is 91-7743-2218-5561');
    assert(patientB.uhisId === 'PT-2026-024', 'Patient B: UHIS ID is PT-2026-024');

    console.log('\n  Cross-Patient Diversity:');
    assert(patientA.abhaId !== patientB.abhaId, 'Patient A ABHA ID ≠ Patient B ABHA ID');
    assert(patientA.uhisId !== patientB.uhisId, 'Patient A UHIS ID ≠ Patient B UHIS ID');
  }

  // --- 4. START LOCAL SERVER & TEST HTTP ENDPOINTS WITH DOCTOR TOKEN ---
  console.log('\n--- 4. API ENDPOINT VERIFICATION ---');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  // Generate Doctor JWT Token for authorized requests
  let doctorUser = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
  if (!doctorUser) {
    doctorUser = await prisma.user.findFirst();
  }
  const doctorToken = jwt.sign(
    { id: doctorUser.id, role: 'DOCTOR', email: doctorUser.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const authHeaders = {
    'Authorization': `Bearer ${doctorToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // A. Profile endpoint for Patient A
    const resProfileA = await fetch(`${baseUrl}/patients/profile/${patientA.abhaId}`, { headers: authHeaders }).then(r => r.json());
    assert(resProfileA.success === true, 'GET /patients/profile/:abhaId returns success');
    const profilePatA = resProfileA.patientData?.patient;
    console.log(`    Returned Profile ABHA ID: ${profilePatA?.abhaId}`);
    console.log(`    Returned Profile UHIS ID: ${profilePatA?.uhisId}`);
    assert(profilePatA?.abhaId === '91-9912-4430-1102', 'Profile API returns correct abhaId for Patient A');
    assert(profilePatA?.uhisId === 'PT-2026-025', 'Profile API returns correct uhisId for Patient A');
    assert(profilePatA?.abhaId !== profilePatA?.uhisId, 'Profile API: abhaId !== uhisId');

    // B. Basic Info endpoint (Level 1) for Patient A
    const resBasicA = await fetch(`${baseUrl}/patients/${patientA.abhaId}/basic`, { headers: authHeaders }).then(r => r.json());
    assert(resBasicA.success === true, 'GET /patients/:id/basic returns success');
    const basicPatA = resBasicA.patient;
    console.log(`    Returned Basic Info ABHA ID: ${basicPatA?.abhaId}`);
    console.log(`    Returned Basic Info UHIS ID: ${basicPatA?.uhisId}`);
    assert(basicPatA?.abhaId === '91-9912-4430-1102', 'Basic Info API returns correct abhaId for Patient A');
    assert(basicPatA?.uhisId === 'PT-2026-025', 'Basic Info API returns correct uhisId for Patient A');
    assert(basicPatA?.abhaId !== basicPatA?.uhisId, 'Basic Info API: abhaId !== uhisId');

    // C. ABHA Search endpoint (Requirement 7)
    const resSearch = await fetch(`${baseUrl}/patients/search/abha?abhaId=91-9912-4430-1102`, { headers: authHeaders }).then(r => r.json());
    assert(resSearch.success === true, 'GET /patients/search/abha?abhaId=... returns success');
    const searchPatA = resSearch.patient;
    console.log(`    Returned Search ABHA ID: ${searchPatA?.abhaId}`);
    console.log(`    Returned Search UHIS ID: ${searchPatA?.uhisId}`);
    assert(searchPatA?.abhaId === '91-9912-4430-1102', 'Search by ABHA returns matching patient with abhaId 91-9912-4430-1102');
    assert(searchPatA?.uhisId === 'PT-2026-025', 'Search by ABHA returns separate uhisId PT-2026-025');
    assert(searchPatA?.abhaId !== searchPatA?.uhisId, 'Search by ABHA: abhaId !== uhisId');

    // D. Search with UHIS ID on abha search endpoint should NOT match (strictly searches ABHA ID)
    const resSearchUhisRaw = await fetch(`${baseUrl}/patients/search/abha?abhaId=PT-2026-025`, { headers: authHeaders });
    assert(resSearchUhisRaw.status === 404, 'Search with UHIS ID on ABHA endpoint returns 404 (strictly searches abhaId)');

    // --- 5. REGISTRATION FLOW VERIFICATION ---
    console.log('\n--- 5. REGISTRATION CREATES DISTINCT UHIS ID AND ABHA ID ---');

    const testEmail = `test.sep.${Date.now()}@uhis.org`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Separation Patient',
        email: testEmail,
        password: 'Password@123',
        role: 'PATIENT',
        gender: 'FEMALE',
        dateOfBirth: '1995-05-15',
        bloodGroup: 'A+',
      }),
    });

    assert(regRes.status === 201, 'New patient registered successfully with HTTP 201');

    const newPatient = await prisma.patient.findFirst({
      where: { user: { email: testEmail } },
      include: { user: true }
    });

    assert(!!newPatient, 'New patient retrieved from database');
    if (newPatient) {
      console.log(`    Registered ABHA ID: ${newPatient.abhaId}`);
      console.log(`    Registered UHIS ID: ${newPatient.uhisId}`);
      assert(newPatient.abhaId !== newPatient.uhisId, 'New patient: abhaId !== uhisId');
      assert(newPatient.abhaId.startsWith('91-'), 'New patient: abhaId follows 91-XXXX-XXXX-XXXX format');
      assert(newPatient.uhisId.startsWith('PT-2026-'), 'New patient: uhisId follows PT-2026-XXX format');

      // Clean up test patient
      await prisma.patient.delete({ where: { id: newPatient.id } });
      await prisma.user.delete({ where: { id: newPatient.userId } });
    }
  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
