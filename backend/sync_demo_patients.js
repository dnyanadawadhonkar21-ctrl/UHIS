const prisma = require('./src/config/prisma');
const bcrypt = require('bcrypt');

const demoPatients = [
  {
    fullName: "Rahul Verma",
    email: "patient22@uhis.org",
    abhaId: "91-4782-3391-6284",
    gender: "MALE",
    dateOfBirth: new Date("1998-04-12"),
    bloodGroup: "B+",
    height: "176 cm",
    weight: "74 kg",
    address: "42, Sector 14, Dwarka, New Delhi — 110078",
    emergencyContact: "Kavita Verma (Spouse)",
    emergencyPhone: "+91 98877 66554",
    phoneNumber: "+91 98765 43210",
    allergies: JSON.stringify([{ name: "Penicillin", severity: "SEVERE" }]),
    conditions: [{ name: "Essential Hypertension", icd: "I10", severity: "MILD" }],
  },
  {
    fullName: "Ramesh Patil",
    email: "patient23@uhis.org",
    abhaId: "91-3321-0011-4432",
    gender: "MALE",
    dateOfBirth: new Date("1989-08-20"),
    bloodGroup: "A+",
    height: "172 cm",
    weight: "68 kg",
    address: "12/B Shivaji Nagar, Pune — 411005",
    emergencyContact: "Sangeeta Patil (Spouse)",
    emergencyPhone: "+91 98221 00000",
    phoneNumber: "+91 98221 11223",
    allergies: JSON.stringify([{ name: "Dust Mites", severity: "MODERATE" }]),
    conditions: [{ name: "Acute Viral Pyrexia", icd: "R50.9", severity: "MODERATE" }],
  },
  {
    fullName: "Priya Sharma",
    email: "patient24@uhis.org",
    abhaId: "91-7743-2218-5561",
    gender: "FEMALE",
    dateOfBirth: new Date("1995-11-03"),
    bloodGroup: "O+",
    height: "160 cm",
    weight: "54 kg",
    address: "Flat 402, Green Glen Layout, Bengaluru — 560103",
    emergencyContact: "Raj Sharma (Brother)",
    emergencyPhone: "+91 98233 44556",
    phoneNumber: "+91 98233 55667",
    allergies: JSON.stringify([{ name: "Sulfa Drugs", severity: "MODERATE" }]),
    conditions: [{ name: "Migraine without Aura", icd: "G43.0", severity: "MILD" }],
  },
  {
    fullName: "Amit Kulkarni",
    email: "patient25@uhis.org",
    abhaId: "91-9912-4430-1102",
    gender: "MALE",
    dateOfBirth: new Date("1982-06-15"),
    bloodGroup: "B+",
    height: "174 cm",
    weight: "78 kg",
    address: "B-501, Kothrud Hills, Pune — 411038",
    emergencyContact: "Pooja Kulkarni (Spouse)",
    emergencyPhone: "+91 98111 22334",
    phoneNumber: "+91 98111 99887",
    allergies: JSON.stringify([]),
    conditions: [{ name: "Essential Hypertension", icd: "I10", severity: "MODERATE" }],
  },
  {
    fullName: "Sneha Deshmukh",
    email: "patient26@uhis.org",
    abhaId: "91-5508-7761-0099",
    gender: "FEMALE",
    dateOfBirth: new Date("1993-02-18"),
    bloodGroup: "AB+",
    height: "162 cm",
    weight: "59 kg",
    address: "704 Lake View Apts, Powai, Mumbai — 400076",
    emergencyContact: "Anand Deshmukh (Father)",
    emergencyPhone: "+91 98444 55667",
    phoneNumber: "+91 98444 11223",
    allergies: JSON.stringify([{ name: "Peanuts", severity: "SEVERE" }]),
    conditions: [{ name: "Type II Diabetes Mellitus", icd: "E11", severity: "MODERATE" }],
  },
  {
    fullName: "Arjun Mehta",
    email: "patient27@uhis.org",
    abhaId: "91-1122-8834-6670",
    gender: "MALE",
    dateOfBirth: new Date("1976-09-25"),
    bloodGroup: "O+",
    height: "178 cm",
    weight: "84 kg",
    address: "Plot 88, Banjara Hills, Hyderabad — 500034",
    emergencyContact: "Sunita Mehta (Spouse)",
    emergencyPhone: "+91 98555 66778",
    phoneNumber: "+91 98555 00112",
    allergies: JSON.stringify([]),
    conditions: [{ name: "Ischemic Heart Disease", icd: "I25.9", severity: "SEVERE" }],
  },
  {
    fullName: "Neha Joshi",
    email: "patient28@uhis.org",
    abhaId: "91-4490-1123-7788",
    gender: "FEMALE",
    dateOfBirth: new Date("1986-07-30"),
    bloodGroup: "A-",
    height: "165 cm",
    weight: "63 kg",
    address: "23, Model Town, Delhi — 110009",
    emergencyContact: "Vikas Joshi (Spouse)",
    emergencyPhone: "+91 98666 77889",
    phoneNumber: "+91 98666 22334",
    allergies: JSON.stringify([]),
    conditions: [{ name: "Lumbar Disc Herniation", icd: "M51.2", severity: "MODERATE" }],
  },
  {
    fullName: "Karan Shah",
    email: "patient29@uhis.org",
    abhaId: "91-8833-2211-9944",
    gender: "MALE",
    dateOfBirth: new Date("1979-12-10"),
    bloodGroup: "B-",
    height: "175 cm",
    weight: "76 kg",
    address: "55 Navrangpura, Ahmedabad — 380009",
    emergencyContact: "Rina Shah (Spouse)",
    emergencyPhone: "+91 98777 88990",
    phoneNumber: "+91 98777 33445",
    allergies: JSON.stringify([]),
    conditions: [{ name: "Routine Executive Health Checkup", icd: "Z00.0", severity: "MILD" }],
  }
];

async function syncDemoPatients() {
  console.log('🔄 Synchronizing demo OPD patients into database...');
  const commonPassword = await bcrypt.hash('password123', 10);

  // First give patient1 a unique ABDM ID so there is no conflict with Rahul Verma
  const pat1 = await prisma.user.findUnique({ where: { email: 'patient1@uhis.org' } });
  if (pat1) {
    await prisma.patient.updateMany({
      where: { userId: pat1.id },
      data: { abhaId: '91-1001-2002-3003' }
    });
  }

  for (const dp of demoPatients) {
    // Check if user exists by email
    let user = await prisma.user.findUnique({ where: { email: dp.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          fullName: dp.fullName,
          email: dp.email,
          password: commonPassword,
          role: 'PATIENT',
          phoneNumber: dp.phoneNumber,
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { fullName: dp.fullName, phoneNumber: dp.phoneNumber }
      });
    }

    // Check if patient exists
    let patient = await prisma.patient.findFirst({
      where: { userId: user.id }
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          userId: user.id,
          abhaId: dp.abhaId,
          gender: dp.gender,
          dateOfBirth: dp.dateOfBirth,
          bloodGroup: dp.bloodGroup,
          height: dp.height,
          weight: dp.weight,
          address: dp.address,
          emergencyContact: dp.emergencyContact,
          emergencyPhone: dp.emergencyPhone,
          allergies: dp.allergies,
        }
      });
    } else {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          abhaId: dp.abhaId,
          gender: dp.gender,
          dateOfBirth: dp.dateOfBirth,
          bloodGroup: dp.bloodGroup,
          height: dp.height,
          weight: dp.weight,
          address: dp.address,
          emergencyContact: dp.emergencyContact,
          emergencyPhone: dp.emergencyPhone,
          allergies: dp.allergies,
        }
      });
    }

    console.log(`✅ Synced patient: ${dp.fullName} | ABHA: ${dp.abhaId} | Email: ${dp.email}`);
  }

  console.log('🎉 All demo patients synchronized successfully!');
  await prisma.$disconnect();
}

syncDemoPatients().catch(err => {
  console.error('Error syncing demo patients:', err);
  process.exit(1);
});
