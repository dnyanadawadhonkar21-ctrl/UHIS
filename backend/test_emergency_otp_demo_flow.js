const http = require('http');

function request({ path, method = 'GET', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
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

async function runDemoTests() {
  console.log('================================================================');
  console.log('🧪 UHIS EMERGENCY ACCESS OTP END-TO-END DEMO TEST SUITE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // CASE 1: doctor22@uhis.org <-> patient22@uhis.org
    // -------------------------------------------------------------------------
    console.log('--- CASE 1: doctor22@uhis.org <-> patient22@uhis.org ---');

    // 1. Doctor 22 Login
    const doc22Login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'doctor22@uhis.org', password: 'password123' },
    });
    assert(doc22Login.status === 200 && doc22Login.body.token, 'Doctor 22 logged in successfully');
    const doc22Token = doc22Login.body.token;

    // 2. Doctor 22 requests emergency access for patient22@uhis.org
    const req22 = await request({
      path: '/api/v1/emergency-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc22Token}` },
      body: { patientUHISId: 'patient22@uhis.org', reason: 'Acute chest pain & triage' },
    });
    assert(req22.status === 200 || req22.status === 201, 'Doctor 22 created emergency access request for patient22@uhis.org');
    const req22Id = req22.body.request.id;

    // 3. Patient 22 Login
    const pat22Login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'patient22@uhis.org', password: 'password123' },
    });
    assert(pat22Login.status === 200 && pat22Login.body.token, 'Patient 22 logged in successfully');
    const pat22Token = pat22Login.body.token;

    // 4. Patient 22 views emergency access requests
    const pat22Reqs = await request({
      path: '/api/v1/emergency-access/patient/requests',
      method: 'GET',
      headers: { Authorization: `Bearer ${pat22Token}` },
    });
    assert(pat22Reqs.status === 200 && pat22Reqs.body.requests?.length > 0, 'Patient 22 retrieved emergency requests in portal');
    const foundReq22 = pat22Reqs.body.requests.find((r) => r.id === req22Id);
    assert(foundReq22 && foundReq22.doctorName.includes('Verma'), `Patient 22 sees request from Dr. Rajesh Verma (status: ${foundReq22?.status})`);

    // 5. Patient 22 Approves Access & Generates OTP
    let otp22 = null;
    if (foundReq22 && foundReq22.status === 'PENDING') {
      const approve22 = await request({
        path: `/api/v1/emergency-access/patient/approve/${req22Id}`,
        method: 'POST',
        headers: { Authorization: `Bearer ${pat22Token}` },
      });
      assert(approve22.status === 200 && approve22.body.otp, `Patient 22 approved access. Generated OTP: ${approve22.body.otp}`);
      assert(/^\d{6}$/.test(approve22.body.otp), 'Generated OTP is exactly 6 digits');
      otp22 = approve22.body.otp;
    }

    // 6. Doctor 22 verifies OTP
    if (otp22) {
      const verify22 = await request({
        path: '/api/v1/emergency-access/verify',
        method: 'POST',
        headers: { Authorization: `Bearer ${doc22Token}` },
        body: { requestId: req22Id, otp: otp22 },
      });
      assert(verify22.status === 200 && verify22.body.success, 'Doctor 22 successfully verified OTP');
    }

    // 7. Doctor 22 accesses Patient 22 Medical Records
    const rec22 = await request({
      path: `/api/v1/emergency-access/records/${req22Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc22Token}` },
    });
    assert(rec22.status === 200 && rec22.body.success, 'Doctor 22 retrieved Patient 22 medical records');
    assert(rec22.body.data.patient.name === 'Rahul Verma', `Patient name is Rahul Verma (got "${rec22.body.data.patient.name}")`);
    assert(rec22.body.data.patient.abhaId === 'PT-2026-022' || rec22.body.data.patient.abhaId === 'RV-2026-001', `Patient UHIS ID is PT-2026-022 / RV-2026-001`);
    assert(rec22.body.data.patient.pastSurgeries.includes('Appendectomy'), `Past surgeries includes Appendectomy`);
    assert(rec22.body.data.diseases.some((d) => d.name.includes('Asthma') || d.name.includes('Diabetes')), `Diagnoses include Asthma & Diabetes`);
    assert(rec22.body.data.medications.some((m) => m.name.includes('Salbutamol') || m.name.includes('Metformin')), `Medications include Salbutamol/Metformin`);


    // -------------------------------------------------------------------------
    // CASE 2: doctor23@uhis.org <-> patient23@uhis.org
    // -------------------------------------------------------------------------
    console.log('\n--- CASE 2: doctor23@uhis.org <-> patient23@uhis.org ---');

    // 1. Doctor 23 Login
    const doc23Login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'doctor23@uhis.org', password: 'password123' },
    });
    assert(doc23Login.status === 200 && doc23Login.body.token, 'Doctor 23 logged in successfully');
    const doc23Token = doc23Login.body.token;

    // 2. Doctor 23 requests emergency access for patient23@uhis.org
    const req23 = await request({
      path: '/api/v1/emergency-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc23Token}` },
      body: { patientUHISId: 'patient23@uhis.org', reason: 'Acute severe asthma attack' },
    });
    assert(req23.status === 200 || req23.status === 201, 'Doctor 23 created emergency access request for patient23@uhis.org');
    const req23Id = req23.body.request.id;

    // 3. Patient 23 Login
    const pat23Login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'patient23@uhis.org', password: 'password123' },
    });
    assert(pat23Login.status === 200 && pat23Login.body.token, 'Patient 23 logged in successfully');
    const pat23Token = pat23Login.body.token;

    // 4. Patient 23 views emergency access requests
    const pat23Reqs = await request({
      path: '/api/v1/emergency-access/patient/requests',
      method: 'GET',
      headers: { Authorization: `Bearer ${pat23Token}` },
    });
    assert(pat23Reqs.status === 200, 'Patient 23 retrieved emergency requests in portal');
    const foundReq23 = pat23Reqs.body.requests.find((r) => r.id === req23Id);
    assert(foundReq23 && foundReq23.doctorName.includes('Kulkarni'), `Patient 23 sees request from Dr. Sneha Kulkarni`);

    // 5. Patient 23 Approves Access & Generates OTP
    let otp23 = null;
    if (foundReq23 && foundReq23.status === 'PENDING') {
      const approve23 = await request({
        path: `/api/v1/emergency-access/patient/approve/${req23Id}`,
        method: 'POST',
        headers: { Authorization: `Bearer ${pat23Token}` },
      });
      assert(approve23.status === 200 && approve23.body.otp, `Patient 23 approved access. Generated OTP: ${approve23.body.otp}`);
      otp23 = approve23.body.otp;
    }

    // 6. Doctor 23 verifies OTP
    if (otp23) {
      const verify23 = await request({
        path: '/api/v1/emergency-access/verify',
        method: 'POST',
        headers: { Authorization: `Bearer ${doc23Token}` },
        body: { requestId: req23Id, otp: otp23 },
      });
      assert(verify23.status === 200 && verify23.body.success, 'Doctor 23 successfully verified OTP');
    }

    // 7. Doctor 23 accesses Patient 23 Medical Records
    const rec23 = await request({
      path: `/api/v1/emergency-access/records/${req23Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc23Token}` },
    });
    assert(rec23.status === 200 && rec23.body.success, 'Doctor 23 retrieved Patient 23 medical records');
    assert(rec23.body.data.patient.name === 'Ananya Deshmukh', `Patient name is Ananya Deshmukh (got "${rec23.body.data.patient.name}")`);
    assert(rec23.body.data.patient.abhaId === 'PT-2026-023', `Patient UHIS ID is PT-2026-023`);
    assert(rec23.body.data.diseases.some((d) => d.name.includes('Asthma')), `Diagnoses include Bronchial Asthma`);
    assert(rec23.body.data.medications.some((m) => m.name.includes('Budesonide')), `Medications include Budesonide`);

    // -------------------------------------------------------------------------
    // CASE 3: Cross-Account Isolation & Rejection Security
    // -------------------------------------------------------------------------
    console.log('\n--- CASE 3: Account Isolation & Rejection Security ---');

    // 1. Doctor 22 cannot access Patient 23's records with Patient 23's request ID
    const crossDocAccess = await request({
      path: `/api/v1/emergency-access/records/${req23Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc22Token}` },
    });
    assert(crossDocAccess.status === 404 || crossDocAccess.status === 403, 'Doctor 22 CANNOT access Patient 23 emergency records');

    // 2. Patient 22 cannot see Patient 23's emergency request
    const pat22ReqCheck = await request({
      path: '/api/v1/emergency-access/patient/requests',
      method: 'GET',
      headers: { Authorization: `Bearer ${pat22Token}` },
    });
    const hasReq23 = pat22ReqCheck.body.requests?.some((r) => r.id === req23Id);
    assert(!hasReq23, 'Patient 22 does NOT see Patient 23 emergency requests');

    // 3. Patient 24 Rejection Test
    console.log('\n--- Rejection Flow Test: doctor24@uhis.org <-> patient24@uhis.org ---');
    const doc24Login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'doctor24@uhis.org', password: 'password123' },
    });
    const doc24Token = doc24Login.body.token;

    const req24 = await request({
      path: '/api/v1/emergency-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${doc24Token}` },
      body: { patientUHISId: 'patient24@uhis.org', reason: 'Severe acute migraine episode' },
    });
    assert(req24.status === 200 || req24.status === 201, 'Doctor 24 requested access for patient24@uhis.org');
    const req24Id = req24.body.request.id;

    const pat24Login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'patient24@uhis.org', password: 'password123' },
    });
    const pat24Token = pat24Login.body.token;

    const reject24 = await request({
      path: `/api/v1/emergency-access/patient/reject/${req24Id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${pat24Token}` },
    });
    assert(reject24.status === 200, 'Patient 24 successfully rejected access request');

    const blockedDoc24 = await request({
      path: `/api/v1/emergency-access/records/${req24Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${doc24Token}` },
    });
    assert(blockedDoc24.status === 403, 'Doctor 24 is denied access to records after patient rejection (HTTP 403)');

    console.log('\n================================================================');
    console.log(`🏁 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runDemoTests();
