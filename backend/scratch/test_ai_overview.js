const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAiOverview() {
  const rahul = await prisma.patient.findFirst({
    where: { user: { email: 'patient@uhis.gov.in' } },
    include: { user: true }
  });

  if (!rahul) {
    console.error('Rahul not found in DB!');
    return;
  }

  console.log('Testing AI Overview for Rahul Verma (ID: ' + rahul.id + ')...');

  const patient = await prisma.patient.findUnique({
    where: { id: rahul.id },
    include: {
      user: { select: { fullName: true, email: true, phoneNumber: true } },
      medicalRecords: { orderBy: { recordDate: 'desc' } },
      prescriptions: {
        include: { items: true, doctor: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      },
      labReports: { orderBy: { createdAt: 'desc' } },
      diagnoses: {
        include: { doctor: { include: { user: true, hospital: true } } },
        orderBy: { diagnosedDate: 'desc' },
      },
      appointments: {
        where: { status: 'COMPLETED' },
        include: {
          doctor: { include: { user: true, hospital: true } },
          hospital: true,
          prescriptions: { include: { items: true } },
        },
        orderBy: { appointmentDate: 'desc' },
      },
    },
  });

  console.log('User:', patient.user.fullName);
  console.log('Allergies string:', patient.allergies);
  console.log('Appointments completed:', patient.appointments.length);
  console.log('Prescriptions:', patient.prescriptions.length);
}

testAiOverview().finally(() => prisma.$disconnect());
