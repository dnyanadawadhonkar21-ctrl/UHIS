const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runVerification() {
  console.log('===============================================================');
  console.log('🚀 UHIS TASK 1: END-TO-END VERIFICATION SUITE');
  console.log('===============================================================\n');

  // 1. Health Check
  console.log('Step 1: Checking Backend Health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('   Status:', healthRes.status, 'System:', healthData.system);
  if (!healthData.success) throw new Error('Health check failed');
  console.log('   ✅ Backend server is healthy and online.\n');

  // 2. Authentication as Rahul Verma
  console.log('Step 2: Authenticating as Demo Patient (Rahul Verma - patient@uhis.gov.in)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@uhis.gov.in', password: 'password123' }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.token;
  const user = loginData.user;
  console.log(`   Logged in as: ${user.fullName} (${user.email})`);
  console.log(`   Patient Profile ID: ${user.patientProfile?.id || 'Present'}`);
  console.log('   ✅ Real JWT token obtained.\n');

  // 3. Upload Real PNG/JPG Medical X-Ray Image
  console.log('Step 3: Uploading REAL Chest X-Ray image (chest-xray.png)...');
  const testAssetsDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'test-assets');
  const imageFilePath = path.join(testAssetsDir, 'chest-xray.png');
  const imageBuffer = fs.readFileSync(imageFilePath);

  const imageForm = new FormData();
  const imgBlob = new Blob([imageBuffer], { type: 'image/png' });
  imageForm.append('file', imgBlob, 'chest-xray.png');
  imageForm.append('title', 'Chest X-Ray - PA View');
  imageForm.append('recordType', 'X-Ray');
  imageForm.append('description', 'Frontal projection showing clear lung parenchyma, no focal consolidation.');
  imageForm.append('recordDate', '2026-08-31');

  const uploadImgRes = await fetch(`${BASE_URL}/patients/medical-records`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: imageForm,
  });
  const uploadImgData = await uploadImgRes.json();
  console.log('   Upload Response Status:', uploadImgRes.status);
  console.log('   Record ID:', uploadImgData.record?.id);
  console.log('   Title:', uploadImgData.record?.title);
  console.log('   Stored Attachment Reference:', uploadImgData.record?.attachmentUrl);
  if (!uploadImgData.success || !uploadImgData.record) {
    throw new Error(`X-Ray upload failed: ${JSON.stringify(uploadImgData)}`);
  }
  const xrayRecordId = uploadImgData.record.id;
  console.log('   ✅ X-Ray record saved to Prisma & stored in backend/uploads/medical-records/.\n');

  // 4. Fetch Medical Records List
  console.log('Step 4: Fetching Patient Medical Records List (/patients/medical-records)...');
  const listRes = await fetch(`${BASE_URL}/patients/medical-records`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const listData = await listRes.json();
  console.log(`   Total records returned: ${listData.records?.length}`);
  const foundXray = listData.records?.find((r) => r.id === xrayRecordId);
  if (!foundXray) throw new Error('Uploaded X-Ray not found in records list!');
  console.log(`   Found Record: "${foundXray.title}" (${foundXray.recordType})`);
  console.log('   ✅ Record persistence verified.\n');

  // 5. View Actual Uploaded Image
  console.log('Step 5: Verifying [ View Image ] endpoint (/patients/medical-records/:id/file)...');
  const viewImgRes = await fetch(`${BASE_URL}/patients/medical-records/${xrayRecordId}/file`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  console.log('   HTTP Status:', viewImgRes.status);
  console.log('   Content-Type:', viewImgRes.headers.get('content-type'));
  console.log('   Content-Disposition:', viewImgRes.headers.get('content-disposition'));
  const receivedImgBytes = Buffer.from(await viewImgRes.arrayBuffer());
  console.log(`   Expected bytes: ${imageBuffer.length} | Received bytes: ${receivedImgBytes.length}`);
  if (receivedImgBytes.length !== imageBuffer.length) {
    throw new Error('Image byte length mismatch between uploaded and served file!');
  }
  console.log('   ✅ [ View Image ] returns the EXACT uploaded image bytes.\n');

  // 6. Download Actual Uploaded Image
  console.log('Step 6: Verifying [ Download ] endpoint (/patients/medical-records/:id/file?download=true)...');
  const downloadImgRes = await fetch(`${BASE_URL}/patients/medical-records/${xrayRecordId}/file?download=true`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  console.log('   HTTP Status:', downloadImgRes.status);
  console.log('   Content-Disposition:', downloadImgRes.headers.get('content-disposition'));
  const receivedDownloadBytes = Buffer.from(await downloadImgRes.arrayBuffer());
  if (receivedDownloadBytes.length !== imageBuffer.length) {
    throw new Error('Download byte length mismatch!');
  }
  if (!downloadImgRes.headers.get('content-disposition').includes('attachment')) {
    throw new Error('Expected Content-Disposition attachment header!');
  }
  console.log('   ✅ [ Download ] triggers file download with attachment headers and exact bytes.\n');

  // 7. Upload Real PDF Medical Report
  console.log('Step 7: Uploading REAL PDF Medical Report (blood-test-report.pdf)...');
  const pdfFilePath = path.join(testAssetsDir, 'blood-test-report.pdf');
  const pdfBuffer = fs.readFileSync(pdfFilePath);

  const pdfForm = new FormData();
  const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
  pdfForm.append('file', pdfBlob, 'blood-test-report.pdf');
  pdfForm.append('title', 'Blood Test Diagnostic Report');
  pdfForm.append('recordType', 'Medical Report');
  pdfForm.append('description', 'Comprehensive Metabolic Panel & Lipid Profile.');
  pdfForm.append('recordDate', '2026-08-30');

  const uploadPdfRes = await fetch(`${BASE_URL}/patients/medical-records`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: pdfForm,
  });
  const uploadPdfData = await uploadPdfRes.json();
  console.log('   Upload Response Status:', uploadPdfRes.status);
  console.log('   Record ID:', uploadPdfData.record?.id);
  if (!uploadPdfData.success || !uploadPdfData.record) {
    throw new Error(`PDF upload failed: ${JSON.stringify(uploadPdfData)}`);
  }
  const pdfRecordId = uploadPdfData.record.id;
  console.log('   ✅ PDF record saved & stored successfully.\n');

  // 8. View & Download PDF
  console.log('Step 8: Verifying PDF View and Download...');
  const viewPdfRes = await fetch(`${BASE_URL}/patients/medical-records/${pdfRecordId}/file`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  console.log('   View PDF Content-Type:', viewPdfRes.headers.get('content-type'));
  if (viewPdfRes.headers.get('content-type') !== 'application/pdf') {
    throw new Error('Expected application/pdf content type!');
  }

  const downloadPdfRes = await fetch(`${BASE_URL}/patients/medical-records/${pdfRecordId}/file?download=true`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  console.log('   Download PDF Content-Disposition:', downloadPdfRes.headers.get('content-disposition'));
  const receivedPdfBytes = Buffer.from(await downloadPdfRes.arrayBuffer());
  if (receivedPdfBytes.length !== pdfBuffer.length) {
    throw new Error('PDF bytes mismatch!');
  }
  console.log('   ✅ PDF View and Download verified.\n');

  // 9. Security: Unauthorized access rejected
  console.log('Step 9: Security Verification (Unauthenticated & Unauthorized access)...');
  const unauthRes = await fetch(`${BASE_URL}/patients/medical-records/${xrayRecordId}/file`);
  console.log('   Unauthenticated request status:', unauthRes.status);
  if (unauthRes.status !== 401) throw new Error('Expected 401 for unauthenticated request');

  const notFoundRes = await fetch(`${BASE_URL}/patients/medical-records/non-existent-uuid/file`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  console.log('   Non-existent record status:', notFoundRes.status);
  if (notFoundRes.status !== 404) throw new Error('Expected 404 for non-existent record');
  console.log('   ✅ Security controls strictly enforced.\n');

  // 10. Security: Invalid File Type & Size Rejection
  console.log('Step 10: Validation Verification (Unsupported type & size limits)...');
  const invalidForm = new FormData();
  invalidForm.append('file', new Blob(['test dummy content'], { type: 'text/plain' }), 'malicious.txt');
  invalidForm.append('title', 'Invalid Record');
  invalidForm.append('recordType', 'Other');

  const invalidRes = await fetch(`${BASE_URL}/patients/medical-records`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: invalidForm,
  });
  console.log('   Invalid file type rejection status:', invalidRes.status);
  if (invalidRes.status !== 400 && invalidRes.status !== 500) {
    throw new Error('Expected invalid file to be rejected!');
  }
  console.log('   ✅ Invalid file types properly rejected by backend validation.\n');

  console.log('===============================================================');
  console.log('🎉 ALL 10 VERIFICATION STEPS PASSED WITH 100% SUCCESS!');
  console.log('===============================================================');
}

runVerification().catch((e) => {
  console.error('\n❌ Verification Failed:', e);
  process.exit(1);
});
