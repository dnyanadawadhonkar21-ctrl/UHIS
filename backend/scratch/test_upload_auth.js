const path = require('path');
const fs = require('fs');
const http = require('http');

async function runTests() {
  const app = require('../src/app');
  const prisma = require('../src/config/prisma');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  console.log(`\n======================================================`);
  console.log(`🏥 TESTING MEDICAL RECORD UPLOAD & AUTHENTICATION FLOW`);
  console.log(`======================================================\n`);

  try {
    // 1. Test unauthenticated request -> should fail with 401
    console.log('1. Testing upload WITHOUT token...');
    const noAuthRes = await fetch(`${baseUrl}/patients/medical-records`, {
      method: 'POST',
      body: new FormData(),
    });
    const noAuthData = await noAuthRes.json();
    console.log(`   Status: ${noAuthRes.status}`);
    console.log(`   Response: ${JSON.stringify(noAuthData)}`);
    if (noAuthRes.status === 401 && noAuthData.message.includes('No authentication token provided')) {
      console.log('   ✅ PASS: Correctly rejected with 401 "No authentication token provided"\n');
    } else {
      throw new Error('Expected 401 No authentication token provided');
    }

    // 2. Login as Rahul Verma
    console.log('2. Authenticating as Rahul Verma (patient@uhis.gov.in)...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'patient@uhis.gov.in',
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.token;
    console.log(`   ✅ PASS: Logged in successfully. User: ${loginData.user.fullName}`);
    console.log(`   Token received: ${token.slice(0, 25)}...\n`);

    // 3. Create dummy X-Ray image
    const samplePngPath = path.join(__dirname, 'sample_chest_xray.png');
    // Minimal valid 1x1 PNG bytes
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

    // 4. Upload Medical Record with Authorization header
    console.log('3. Uploading Chest X-Ray with Authorization header...');
    const formData = new FormData();
    const fileBlob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('file', fileBlob, 'chest_xray_scan.png');
    formData.append('title', 'Chest PA Radiograph - Routine');
    formData.append('recordType', 'X-Ray');
    formData.append('recordDate', '2026-09-01');
    formData.append('description', 'Bilateral lung fields clear. No focal consolidation or effusion.');

    const uploadRes = await fetch(`${baseUrl}/patients/medical-records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    console.log(`   Status: ${uploadRes.status}`);
    console.log(`   Response:`, uploadData);
    if (!uploadRes.ok || !uploadData.success || !uploadData.record) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    }
    const recordId = uploadData.record.id;
    console.log(`   ✅ PASS: Medical record created with ID: ${recordId}\n`);

    // 5. Fetch Medical Records list
    console.log('4. Fetching medical records list for Rahul Verma...');
    const listRes = await fetch(`${baseUrl}/patients/medical-records`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const listData = await listRes.json();
    console.log(`   Total records: ${listData.records?.length || 0}`);
    const foundRecord = listData.records?.find(r => r.id === recordId);
    if (!foundRecord) {
      throw new Error(`Uploaded record ${recordId} not found in records list`);
    }
    console.log(`   ✅ PASS: Found record "${foundRecord.title}" in dashboard list\n`);

    // 6. Test View File
    console.log(`5. Testing View File (/patients/medical-records/${recordId}/file)...`);
    const viewRes = await fetch(`${baseUrl}/patients/medical-records/${recordId}/file`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    console.log(`   Status: ${viewRes.status}`);
    console.log(`   Content-Type: ${viewRes.headers.get('content-type')}`);
    if (!viewRes.ok || !viewRes.headers.get('content-type')?.includes('image/png')) {
      throw new Error(`View file failed: status ${viewRes.status}`);
    }
    const viewBuffer = Buffer.from(await viewRes.arrayBuffer());
    console.log(`   Bytes received: ${viewBuffer.length}`);
    console.log(`   ✅ PASS: View returned real image (${viewBuffer.length} bytes)\n`);

    // 7. Test Download File
    console.log(`6. Testing Download File (/patients/medical-records/${recordId}/file?download=true)...`);
    const downloadRes = await fetch(`${baseUrl}/patients/medical-records/${recordId}/file?download=true`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    console.log(`   Status: ${downloadRes.status}`);
    console.log(`   Content-Disposition: ${downloadRes.headers.get('content-disposition')}`);
    if (!downloadRes.ok || !downloadRes.headers.get('content-disposition')?.includes('attachment')) {
      throw new Error(`Download file failed: status ${downloadRes.status}`);
    }
    console.log(`   ✅ PASS: Download returned real file with attachment disposition\n`);

    console.log(`🎉 ALL TESTS PASSED SUCCESSFULLY!`);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch(err => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
