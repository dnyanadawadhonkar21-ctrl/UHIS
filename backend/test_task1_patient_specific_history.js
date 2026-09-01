const http = require('http');
const prisma = require('./src/config/prisma');

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

async function runTests() {
  console.log('================================================================');
  console.log('🧪 UHIS TASK 1: PATIENT-SPECIFIC MEDICAL HISTORY TEST SUITE');
  console.log('================================================================\n');

  try {
    // 1. Doctor Login
    console.log('--- 1. Authenticate Doctor ---');
    const loginRes = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'doctor@uhis.gov.in', password: 'password123' },
    });
    assert(loginRes.status === 200 && loginRes.body.token, 'Doctor successfully authenticated', loginRes.body);
    const doctorToken = loginRes.body.token;

    // 2. Fetch Rahul Verma Profile
    console.log('\n--- 2. Fetch Patient 1: Rahul Verma (RV-2026-001) ---');
    const rahulRes = await request({
      path: '/api/v1/patients/profile/RV-2026-001',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    console.log('Rahul response status:', rahulRes.status, 'body:', rahulRes.body);
    assert(rahulRes.status === 200 && rahulRes.body.success, 'Rahul Verma profile endpoint returned HTTP 200');
    const rData = rahulRes.body.patientData;

    assert(rData.patient.fullName === 'Rahul Verma', `Patient name is Rahul Verma (got "${rData.patient.fullName}")`);
    assert(rData.patient.uhisId === 'RV-2026-001', `UHIS ID is RV-2026-001`);
    assert(rData.patient.bloodGroup === 'B+', `Blood group is B+`);
    assert(rData.patient.gender === 'Male', `Gender is Male`);
    assert(rData.allergies.some((a) => a.name === 'Penicillin'), `Allergies include Penicillin`);
    assert(rData.diseases.some((d) => d.name.includes('Asthma')), `Diagnoses include Asthma`);
    assert(rData.diseases.some((d) => d.name.includes('Diabetes')), `Diagnoses include Type 2 Diabetes`);
    assert(rData.medications.some((m) => m.name.includes('Salbutamol')), `Medications include Salbutamol`);
    assert(rData.medications.some((m) => m.name.includes('Metformin')), `Medications include Metformin`);
    assert(rData.patient.pastSurgeries.includes('Appendectomy'), `Past surgeries includes Appendectomy`);
    assert(rData.medicalRecords.some((mr) => mr.title.includes('Chest X-Ray')), `Medical records include Chest X-Ray`);
    assert(Object.keys(rData.historyByYear).length > 0, `Medical history is grouped by year (${Object.keys(rData.historyByYear).join(', ')})`);

    // 3. Fetch Aboli Joshi Profile
    console.log('\n--- 3. Fetch Patient 2: Aboli Joshi (AJ-2026-002) ---');
    const aboliRes = await request({
      path: '/api/v1/patients/profile/AJ-2026-002',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(aboliRes.status === 200 && aboliRes.body.success, 'Aboli Joshi profile endpoint returned HTTP 200');
    const aData = aboliRes.body.patientData;
    assert(aData.patient.fullName === 'Aboli Joshi', `Patient name is Aboli Joshi (got "${aData.patient.fullName}")`);
    assert(aData.patient.uhisId === 'AJ-2026-002', `UHIS ID is AJ-2026-002`);
    assert(aData.patient.bloodGroup === 'A+', `Blood group is A+`);
    assert(aData.patient.gender === 'Female', `Gender is Female`);
    assert(aData.allergies.some((a) => a.name === 'Dust Mites'), `Allergies include Dust Mites`);
    assert(aData.allergies.some((a) => a.name === 'Shellfish'), `Allergies include Shellfish`);
    assert(aData.diseases.some((d) => d.name.includes('Migraine')), `Diagnoses include Migraine without Aura`);
    assert(aData.diseases.some((d) => d.name.includes('Hypothyroidism')), `Diagnoses include Hypothyroidism`);
    assert(aData.medications.some((m) => m.name.includes('Levothyroxine')), `Medications include Levothyroxine Sodium`);
    assert(aData.medications.some((m) => m.name.includes('Naproxen')), `Medications include Naproxen`);
    assert(aData.patient.pastSurgeries === 'None', `Past surgeries is None`);
    assert(aData.medicalRecords.some((mr) => mr.title.includes('Brain MRI')), `Medical records include Brain MRI`);

    // 4. Fetch Sunita Sharma Profile
    console.log('\n--- 4. Fetch Patient 3: Sunita Sharma (SS-2026-003) ---');
    const sunitaRes = await request({
      path: '/api/v1/patients/profile/SS-2026-003',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(sunitaRes.status === 200 && sunitaRes.body.success, 'Sunita Sharma profile endpoint returned HTTP 200');
    const sData = sunitaRes.body.patientData;
    assert(sData.patient.fullName === 'Sunita Sharma', `Patient name is Sunita Sharma`);
    assert(sData.patient.uhisId === 'SS-2026-003', `UHIS ID is SS-2026-003`);
    assert(sData.patient.bloodGroup === 'O-', `Blood group is O-`);
    assert(sData.patient.gender === 'Female', `Gender is Female`);
    assert(sData.diseases.some((d) => d.name.includes('Hypertension')), `Diagnoses include Essential Hypertension`);
    assert(sData.diseases.some((d) => d.name.includes('Coronary Artery Disease')), `Diagnoses include Coronary Artery Disease`);
    assert(sData.patient.pastSurgeries.includes('Cholecystectomy'), `Past surgeries includes Laparoscopic Cholecystectomy`);

    // 5. Verify Isolation Between Patients
    console.log('\n--- 5. Patient Data Isolation Verification ---');
    assert(rData.patient.uhisId !== aData.patient.uhisId, 'Rahul and Aboli have different UHIS IDs');
    assert(rData.patient.fullName !== aData.patient.fullName, 'Rahul and Aboli have different Full Names');
    assert(rData.patient.bloodGroup !== aData.patient.bloodGroup, 'Rahul (B+) and Aboli (A+) have different Blood Groups');
    assert(rData.diseases[0].name !== aData.diseases[0].name, 'Rahul and Aboli have different primary medical diagnoses');
    assert(rData.medications[0].name !== aData.medications[0].name, 'Rahul and Aboli have different medication regimens');

    // 6. Doctor Appointments Queue
    console.log('\n--- 6. Doctor OPD Appointments Queue ---');
    const aptRes = await request({
      path: '/api/v1/doctors/appointments',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(aptRes.status === 200 && aptRes.body.success, 'Doctor appointments retrieved with HTTP 200');
    assert(aptRes.body.appointments.length >= 2, `Doctor has at least 2 OPD appointments in database (${aptRes.body.appointments.length} found)`);

    console.log('\n================================================================');
    console.log(`🏁 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runTests();
