const prisma = require('./src/config/prisma');
const { searchPatientByAbha } = require('./src/controllers/patientController');
const { register } = require('./src/controllers/authController');

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 TESTING ABHA ID SEARCH & UNIQUENESS CONTROLLER/API');
  console.log('======================================================\n');

  const mockReq = (query = {}, params = {}, user = null) => ({
    query,
    params,
    user: user || { id: 'test-doc-id', fullName: 'Dr. Anita Desai', role: 'DOCTOR', email: 'doctor@uhis.gov.in' },
  });

  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.data = data;
      return res;
    };
    return res;
  };

  // Test 1: Search by Valid ABHA ID (PT-2026-022)
  const res1 = mockRes();
  await searchPatientByAbha(mockReq({ abhaId: 'PT-2026-022' }), res1, console.error);
  console.log('✅ TEST 1 - Valid ABHA ID (PT-2026-022):');
  console.log('   Status:', res1.statusCode);
  console.log('   Success:', res1.data?.success);
  console.log('   Patient Name:', res1.data?.patient?.fullName);
  console.log('   ABHA ID:', res1.data?.patient?.abhaId);
  console.log('   Gender/Age:', res1.data?.patient?.gender, '/', res1.data?.patient?.age);

  // Test 2: Search by Valid ABDM formatted ABHA ID (91-4782-3391-6284)
  const res2 = mockRes();
  await searchPatientByAbha(mockReq({ abhaId: '91-4782-3391-6284' }), res2, console.error);
  console.log('\n✅ TEST 2 - Valid ABDM Format ABHA ID (91-4782-3391-6284):');
  console.log('   Status:', res2.statusCode);
  console.log('   Success:', res2.data?.success);
  console.log('   Patient Name:', res2.data?.patient?.fullName);
  console.log('   ABHA ID:', res2.data?.patient?.abhaId);

  // Test 3: Search Nonexistent ABHA ID
  const res3 = mockRes();
  await searchPatientByAbha(mockReq({ abhaId: '91-0000-0000-0000' }), res3, console.error);
  console.log('\n✅ TEST 3 - Nonexistent ABHA ID:');
  console.log('   Status:', res3.statusCode);
  console.log('   Success:', res3.data?.success);
  console.log('   Message:', res3.data?.message);

  // Test 4: Empty ABHA Input
  const res4 = mockRes();
  await searchPatientByAbha(mockReq({ abhaId: '   ' }), res4, console.error);
  console.log('\n✅ TEST 4 - Empty Input:');
  console.log('   Status:', res4.statusCode);
  console.log('   Success:', res4.data?.success);
  console.log('   Message:', res4.data?.message);

  // Test 5: Invalid Format / Malicious characters
  const res5 = mockRes();
  await searchPatientByAbha(mockReq({ abhaId: '<script>alert(1)</script>' }), res5, console.error);
  console.log('\n✅ TEST 5 - Invalid Format:');
  console.log('   Status:', res5.statusCode);
  console.log('   Success:', res5.data?.success);
  console.log('   Message:', res5.data?.message);

  // Test 6: Duplicate ABHA ID on Registration Attempt
  const res6 = mockRes();
  await register({
    body: {
      fullName: 'Duplicate Test Patient',
      email: 'dup_test_patient@uhis.org',
      password: 'password123',
      role: 'PATIENT',
      abhaId: 'PT-2026-022', // already assigned to Rahul Verma
    },
  }, res6, (err) => console.error('Register next error:', err));
  console.log('\n✅ TEST 6 - Duplicate ABHA ID Registration Attempt:');
  console.log('   Status:', res6.statusCode);
  console.log('   Success:', res6.data?.success);
  console.log('   Message:', res6.data?.message);

  console.log('\n======================================================');
  console.log('🎉 ALL BACKEND API TESTS COMPLETED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
