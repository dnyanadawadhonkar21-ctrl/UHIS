const prisma = require('../src/config/prisma');

async function check() {
  const rahul = await prisma.user.findUnique({
    where: { email: 'patient@uhis.gov.in' },
    include: {
      patientProfile: {
        include: {
          appointments: true,
          prescriptions: { include: { items: true } },
          diagnoses: true,
          medicalRecords: true,
          labReports: true
        }
      }
    }
  });
  console.log('Rahul in DB:', JSON.stringify(rahul, null, 2));

  const anita = await prisma.user.findUnique({
    where: { email: 'doctor@uhis.gov.in' },
    include: {
      doctorProfile: {
        include: { hospital: true }
      }
    }
  });
  console.log('Anita in DB:', JSON.stringify(anita, null, 2));
}

check().then(() => prisma.$disconnect());
