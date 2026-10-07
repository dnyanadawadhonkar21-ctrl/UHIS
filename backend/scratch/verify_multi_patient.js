const path = require('path');
const fs = require('fs');
const http = require('http');

async function runMultiPatientTests() {
  const app = require('../src/app');
  const prisma = require('../src/config/prisma');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  console.log(`\n=============================================================`);
  console.log(`🏥 UHIS MULTI-PATIENT SYSTEM & DATA ISOLATION VERIFICATION`);
  console.log(`=============================================================\n`);

  try {
    const timestamp = Date.now();
    const aboliEmail = `aboli.joshi.${timestamp}@uhis.local`;
    const drishyaEmail = `drishya.sharma.${timestamp}@uhis.local`;

    // -------------------------------------------------------------
    // TEST 1: Register Patient 1 (Aboli Joshi)
    // -------------------------------------------------------------
    console.log(`[TEST 1] Registering Patient 1: Aboli Joshi (${aboliEmail})...`);
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Aboli Joshi',
        email: aboliEmail,
        password: 'password123',
        phoneNumber: '+91 98765 11223',
        gender: 'FEMALE',
        dateOfBirth: '1996-08-14',
        bloodGroup: 'B+',
        height: '165 cm',
        weight: '58 kg',
        address: 'Shivaji Nagar, Pune, Maharashtra',
        emergencyContact: 'Suresh Joshi',
        emergencyPhone: '+91 98765 99887'
      }),
    });
    const regData = await regRes.json();
    if (!regRes.ok || !regData.success || !regData.token) {
      throw new Error(`Aboli registration failed: ${JSON.stringify(regData)}`);
    }
    const aboliToken = regData.token;
    const aboliUserId = regData.user.id;
    console.log(`   ✅ PASS: Account created. User ID: ${aboliUserId}`);
    console.log(`   Token received: ${aboliToken.slice(0, 25)}...\n`);

    // -------------------------------------------------------------
    // TEST 2: Check Aboli's Dashboard & Profile (Empty State)
    // -------------------------------------------------------------
    console.log(`[TEST 2] Verifying Aboli's Profile & Empty Medical Sections...`);
    const aboliProfileRes = await fetch(`${baseUrl}/patients/profile`, {
      headers: { 'Authorization': `Bearer ${aboliToken}` },
    });
    const aboliProfileData = await aboliProfileRes.json();
    if (!aboliProfileRes.ok || !aboliProfileData.success) {
      throw new Error(`Failed to fetch Aboli's profile: ${JSON.stringify(aboliProfileData)}`);
    }

    const aboliPatient = aboliProfileData.patientData.patient;
    const aboliAbhaId = aboliPatient.abhaId;
    console.log(`   Patient Name: ${aboliPatient.user?.fullName}`);
    console.log(`   Assigned ABHA ID: ${aboliAbhaId}`);
    console.log(`   Calculated Age: ${aboliProfileData.patientData.age} years`);
    console.log(`   Conditions Count: ${aboliProfileData.patientData.diseases?.length}`);
    console.log(`   Medications Count: ${aboliProfileData.patientData.medications?.length}`);
    console.log(`   Lab Reports Count: ${aboliProfileData.patientData.labReports?.length}`);
    console.log(`   Allergies Count: ${aboliProfileData.patientData.allergies?.length}`);

    if (aboliPatient.user?.fullName !== 'Aboli Joshi') {
      throw new Error(`Expected 'Aboli Joshi' but got '${aboliPatient.user?.fullName}'`);
    }
    if (aboliProfileData.patientData.diseases.length !== 0 || aboliProfileData.patientData.medications.length !== 0) {
      throw new Error(`Expected empty medical sections for newly registered patient!`);
    }
    console.log(`   ✅ PASS: New patient has authentic profile and clean empty medical profile.\n`);

    // -------------------------------------------------------------
    // TEST 3: Upload X-Ray for Patient 1 (Aboli Joshi)
    // -------------------------------------------------------------
    console.log(`[TEST 3] Uploading Chest X-Ray under Aboli Joshi's account...`);
    const samplePngPath = path.join(__dirname, 'sample_aboli_xray.png');
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(samplePngPath, pngBuffer);

    const formData = new FormData();
    formData.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'aboli_chest_xray.png');
    formData.append('title', 'Aboli Chest PA X-Ray');
    formData.append('recordType', 'X-Ray');
    formData.append('recordDate', '2026-09-20');
    formData.append('description', 'Clear lung fields, normal cardiac silhouette.');

    const uploadRes = await fetch(`${baseUrl}/patients/medical-records`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${aboliToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.success || !uploadData.record) {
      throw new Error(`Upload failed for Aboli: ${JSON.stringify(uploadData)}`);
    }
    const aboliRecordId = uploadData.record.id;
    console.log(`   ✅ PASS: X-Ray uploaded with record ID: ${aboliRecordId}`);

    // Verify Aboli can view and download her own file
    const viewRes = await fetch(`${baseUrl}/patients/medical-records/${aboliRecordId}/file`, {
      headers: { 'Authorization': `Bearer ${aboliToken}` },
    });
    if (!viewRes.ok || !viewRes.headers.get('content-type')?.includes('image/png')) {
      throw new Error(`View failed for Aboli's file: ${viewRes.status}`);
    }
    console.log(`   ✅ PASS: View file stream verified for Aboli (${(await viewRes.arrayBuffer()).byteLength} bytes)`);

    const downloadRes = await fetch(`${baseUrl}/patients/medical-records/${aboliRecordId}/file?download=true`, {
      headers: { 'Authorization': `Bearer ${aboliToken}` },
    });
    if (!downloadRes.ok || !downloadRes.headers.get('content-disposition')?.includes('attachment')) {
      throw new Error(`Download failed for Aboli's file: ${downloadRes.status}`);
    }
    console.log(`   ✅ PASS: Download file verified with attachment disposition.\n`);

    // -------------------------------------------------------------
    // TEST 4: Login as Rahul Verma and Check Strict Data Isolation
    // -------------------------------------------------------------
    console.log(`[TEST 4] Authenticating as Demo Patient: Rahul Verma (patient@uhis.gov.in)...`);
    const rahulLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@uhis.gov.in', password: 'password123' }),
    });
    const rahulLoginData = await rahulLoginRes.json();
    if (!rahulLoginRes.ok || !rahulLoginData.token) {
      throw new Error(`Rahul login failed: ${JSON.stringify(rahulLoginData)}`);
    }
    const rahulToken = rahulLoginData.token;
    console.log(`   Logged in as: ${rahulLoginData.user.fullName}`);

    // Fetch Rahul's records
    const rahulRecordsRes = await fetch(`${baseUrl}/patients/medical-records`, {
      headers: { 'Authorization': `Bearer ${rahulToken}` },
    });
    const rahulRecordsData = await rahulRecordsRes.json();
    const foundAboliInRahul = rahulRecordsData.records?.find(r => r.id === aboliRecordId || r.title.includes('Aboli'));
    if (foundAboliInRahul) {
      throw new Error(`CRITICAL SECURITY FAILURE: Aboli's X-ray found in Rahul's record list!`);
    }
    console.log(`   ✅ PASS: Rahul's record list does NOT contain Aboli's X-ray.`);

    // Attempt unauthorized access by Rahul to Aboli's file
    console.log(`   Testing unauthorized file access by Rahul on Aboli's file ID (${aboliRecordId})...`);
    const unauthViewRes = await fetch(`${baseUrl}/patients/medical-records/${aboliRecordId}/file`, {
      headers: { 'Authorization': `Bearer ${rahulToken}` },
    });
    const unauthData = await unauthViewRes.json();
    console.log(`   Access attempt status: ${unauthViewRes.status}`);
    if (unauthViewRes.status === 403) {
      console.log(`   ✅ PASS: Access denied with 403 Forbidden ("${unauthData.message}")\n`);
    } else {
      throw new Error(`Expected 403 Forbidden but got ${unauthViewRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 5: Register Patient 2 (Drishya Sharma)
    // -------------------------------------------------------------
    console.log(`[TEST 5] Registering Patient 2: Drishya Sharma (${drishyaEmail})...`);
    const drishyaRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Drishya Sharma',
        email: drishyaEmail,
        password: 'password123',
        phoneNumber: '+91 99887 76655',
        gender: 'FEMALE',
        dateOfBirth: '2001-03-25',
        bloodGroup: 'A+',
      }),
    });
    const drishyaRegData = await drishyaRegRes.json();
    if (!drishyaRegRes.ok || !drishyaRegData.token) {
      throw new Error(`Drishya registration failed: ${JSON.stringify(drishyaRegData)}`);
    }
    const drishyaToken = drishyaRegData.token;

    const drishyaRecordsRes = await fetch(`${baseUrl}/patients/medical-records`, {
      headers: { 'Authorization': `Bearer ${drishyaToken}` },
    });
    const drishyaRecordsData = await drishyaRecordsRes.json();
    if (drishyaRecordsData.records?.length !== 0) {
      throw new Error(`Expected 0 records for Drishya, got ${drishyaRecordsData.records.length}`);
    }
    console.log(`   ✅ PASS: Drishya Sharma has an independent account with 0 records.\n`);

    // -------------------------------------------------------------
    // TEST 6: Test Profile Editing for Aboli Joshi
    // -------------------------------------------------------------
    console.log(`[TEST 6] Testing Profile Update for Aboli Joshi...`);
    const updateRes = await fetch(`${baseUrl}/patients/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aboliToken}`,
      },
      body: JSON.stringify({
        height: '168 cm',
        weight: '60 kg',
        address: 'Kothrud, Pune, Maharashtra',
        emergencyContact: 'Anita Joshi',
        emergencyPhone: '+91 98888 77777',
        bloodGroup: 'B+',
      }),
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok || !updateData.success) {
      throw new Error(`Profile update failed: ${JSON.stringify(updateData)}`);
    }
    console.log(`   Updated Address: ${updateData.patient.address}`);
    console.log(`   Updated Height: ${updateData.patient.height}`);
    console.log(`   ✅ PASS: Profile updated successfully.\n`);

    console.log(`=============================================================`);
    console.log(`🎉 ALL MULTI-PATIENT VERIFICATION TESTS PASSED SUCCESSFULLY!`);
    console.log(`=============================================================\n`);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runMultiPatientTests().catch((err) => {
  console.error('\n❌ Multi-patient test failed:', err);
  process.exit(1);
});
