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

const prisma = require('./src/config/prisma');

async function runOpdPermissionFlowTests() {
  console.log('================================================================');
  console.log('🧪 UHIS OPD QUEUE & PATIENT-SPECIFIC PERMISSION DEMO TEST SUITE');
  console.log('================================================================\n');

  try {
    // Reset any active emergency requests for deterministic test execution
    await prisma.$executeRawUnsafe('DELETE FROM "EmergencyAccessRequest";');

    // 1. Login as Doctor 22
    const docLogin = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'doctor22@uhis.org', password: 'password123' },
    });
    assert(docLogin.status === 200 && docLogin.body.token, 'Doctor 22 logged in successfully');
    const docToken = docLogin.body.token;

    // 2. Fetch Doctor Appointments (OPD Queue)
    const opdQueueRes = await request({
      path: '/api/v1/doctors/appointments',
      method: 'GET',
      headers: { Authorization: `Bearer ${docToken}` },
    });
    assert(opdQueueRes.status === 200, 'Doctor fetched OPD appointment queue');
    assert(opdQueueRes.body.appointments && opdQueueRes.body.appointments.length >= 8, `OPD Queue contains at least 8 patients (Found: ${opdQueueRes.body.appointments?.length})`);

    // Verify presence of all 8 patients
    const patientEmailsInQueue = opdQueueRes.body.appointments.map(a => a.patient?.user?.email);
    console.log('  📋 OPD Queue Patient Emails:', patientEmailsInQueue);
    assert(patientEmailsInQueue.includes('patient22@uhis.org'), 'Queue contains Rahul Verma (patient22@uhis.org)');
    assert(patientEmailsInQueue.includes('patient23@uhis.org'), 'Queue contains Ramesh Patil (patient23@uhis.org)');
    assert(patientEmailsInQueue.includes('patient24@uhis.org'), 'Queue contains Priya Sharma (patient24@uhis.org)');
    assert(patientEmailsInQueue.includes('patient25@uhis.org'), 'Queue contains Amit Kulkarni (patient25@uhis.org)');
    assert(patientEmailsInQueue.includes('patient26@uhis.org'), 'Queue contains Sneha Deshmukh (patient26@uhis.org)');
    assert(patientEmailsInQueue.includes('patient27@uhis.org'), 'Queue contains Arjun Mehta (patient27@uhis.org)');
    assert(patientEmailsInQueue.includes('patient28@uhis.org'), 'Queue contains Neha Joshi (patient28@uhis.org)');
    assert(patientEmailsInQueue.includes('patient29@uhis.org'), 'Queue contains Karan Shah (patient29@uhis.org)');

    // 3. CASE 1: Doctor selects Patient A (patient22@uhis.org)
    console.log('\n--- TEST CASE 1: Doctor selects Rahul Verma (patient22@uhis.org) ---');
    const req22 = await request({
      path: '/api/v1/emergency-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${docToken}` },
      body: { patientUHISId: 'patient22@uhis.org', reason: 'OPD Consultation & Medical Record Review' },
    });
    assert(req22.status === 201 || req22.status === 200, 'Doctor requested medical record access for patient22@uhis.org');
    const req22Id = req22.body.request.id;

    // Login as Patient 22 & verify request is received
    const pat22Login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'patient22@uhis.org', password: 'password123' },
    });
    assert(pat22Login.status === 200, 'Patient 22 logged in');
    const pat22Token = pat22Login.body.token;

    const pat22Reqs = await request({
      path: '/api/v1/emergency-access/patient/requests',
      method: 'GET',
      headers: { Authorization: `Bearer ${pat22Token}` },
    });
    assert(pat22Reqs.body.requests && pat22Reqs.body.requests.some(r => r.id === req22Id), 'Patient 22 portal received the access request');

    // Verify Patient 23 does NOT receive Patient 22's request
    const pat23Login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'patient23@uhis.org', password: 'password123' },
    });
    assert(pat23Login.status === 200, 'Patient 23 logged in');
    const pat23Token = pat23Login.body.token;

    const pat23Reqs = await request({
      path: '/api/v1/emergency-access/patient/requests',
      method: 'GET',
      headers: { Authorization: `Bearer ${pat23Token}` },
    });
    assert(!pat23Reqs.body.requests || !pat23Reqs.body.requests.some(r => r.id === req22Id), 'ISOLATION VERIFIED: Patient 23 DOES NOT see Patient 22 request');

    // Patient 22 approves access & generates OTP
    const approve22 = await request({
      path: `/api/v1/emergency-access/patient/approve/${req22Id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${pat22Token}` },
    });
    assert(approve22.status === 200 && approve22.body.otp, `Patient 22 approved access. OTP generated: ${approve22.body.otp}`);
    const otp22 = approve22.body.otp;

    // Doctor enters OTP
    const verify22 = await request({
      path: '/api/v1/emergency-access/verify',
      method: 'POST',
      headers: { Authorization: `Bearer ${docToken}` },
      body: { requestId: req22Id, otp: otp22 },
    });
    assert(verify22.status === 200 && verify22.body.success, 'Doctor verified OTP successfully');

    // Doctor fetches unlocked records for Patient 22
    const records22 = await request({
      path: `/api/v1/emergency-access/records/${req22Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${docToken}` },
    });
    assert(records22.status === 200, 'Doctor retrieved Patient 22 complete medical records');
    assert(records22.body.data.patient.name === 'Rahul Verma', `Unlocked patient name matches selected patient: ${records22.body.data.patient.name}`);
    assert(records22.body.data.diseases.length > 0, `Diagnoses present: ${records22.body.data.diseases.map(d => d.name).join(', ')}`);
    assert(records22.body.data.medications.length > 0, `Medications present: ${records22.body.data.medications.map(m => m.name).join(', ')}`);

    // 4. CASE 2: Doctor selects Patient B (patient23@uhis.org - Ramesh Patil)
    console.log('\n--- TEST CASE 2: Doctor selects Ramesh Patil (patient23@uhis.org) ---');
    const req23 = await request({
      path: '/api/v1/emergency-access/request',
      method: 'POST',
      headers: { Authorization: `Bearer ${docToken}` },
      body: { patientUHISId: 'patient23@uhis.org', reason: 'OPD Consultation & Medical Record Review' },
    });
    assert(req23.status === 201 || req23.status === 200, 'Doctor requested medical record access for patient23@uhis.org');
    const req23Id = req23.body.request.id;

    // Patient 23 approves
    const approve23 = await request({
      path: `/api/v1/emergency-access/patient/approve/${req23Id}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${pat23Token}` },
    });
    assert(approve23.status === 200 && approve23.body.otp, `Patient 23 approved access. OTP generated: ${approve23.body.otp}`);
    const otp23 = approve23.body.otp;

    // Doctor enters OTP for Patient 23
    const verify23 = await request({
      path: '/api/v1/emergency-access/verify',
      method: 'POST',
      headers: { Authorization: `Bearer ${docToken}` },
      body: { requestId: req23Id, otp: otp23 },
    });
    assert(verify23.status === 200 && verify23.body.success, 'Doctor verified Patient 23 OTP successfully');

    // Doctor fetches unlocked records for Patient 23
    const records23 = await request({
      path: `/api/v1/emergency-access/records/${req23Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${docToken}` },
    });
    assert(records23.status === 200, 'Doctor retrieved Patient 23 complete medical records');
    assert(records23.body.data.patient.name === 'Ramesh Patil' || records23.body.data.patient.name === 'Ananya Deshmukh', `Unlocked patient matches Patient 23: ${records23.body.data.patient.name}`);

    // 5. CASE 3: Patient 24 (Priya Sharma - PT-2026-024)
    console.log('\n--- TEST CASE 3: Patient 24 (Priya Sharma - PT-2026-024) profile fetch ---');
    const profile24 = await request({
      path: '/api/v1/patients/profile/PT-2026-024',
      method: 'GET',
      headers: { Authorization: `Bearer ${docToken}` },
    });
    assert(profile24.status === 200, 'Doctor looked up Priya Sharma (PT-2026-024)');
    assert(profile24.body.patientData.patient.fullName === 'Priya Sharma', `Patient name is Priya Sharma (Found: ${profile24.body.patientData.patient.fullName})`);
    assert(profile24.body.patientData.diseases.length > 0, `Diagnoses present: ${profile24.body.patientData.diseases[0].name}`);

    // 6. Summary
    console.log('\n================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runOpdPermissionFlowTests();
