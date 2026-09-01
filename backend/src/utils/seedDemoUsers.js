const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');

async function seedDemoUsers() {
  const commonPassword = await bcrypt.hash('password123', 10);

  // 1. Ensure Rahul Verma (Patient)
  let rahul = await prisma.user.findUnique({
    where: { email: 'patient@uhis.gov.in' },
    include: { patientProfile: true }
  });

  if (!rahul) {
    rahul = await prisma.user.create({
      data: {
        fullName: 'Rahul Verma',
        email: 'patient@uhis.gov.in',
        password: commonPassword,
        role: 'PATIENT',
        phoneNumber: '+91 98765 43210',
        patientProfile: {
          create: {
            abhaId: '91-4782-3391-6284',
            gender: 'MALE',
            dateOfBirth: new Date('1989-03-14'),
            bloodGroup: 'O+',
            height: '176 cm',
            weight: '74 kg',
            address: '42, Sector 14, Dwarka, New Delhi — 110078',
            emergencyContact: 'Kavita Verma',
            emergencyPhone: '+91 98877 66554',
            allergies: JSON.stringify([
              { id: 'AL001', name: 'Penicillin', category: 'Drug', severity: 'SEVERE', symptoms: 'Anaphylaxis, urticaria, angioedema', precautions: 'Avoid all beta-lactam antibiotics. Carry EpiPen.' },
              { id: 'AL002', name: 'Shellfish', category: 'Food', severity: 'MODERATE', symptoms: 'Hives, lip swelling, vomiting', precautions: 'Avoid all crustaceans and molluscs.' },
              { id: 'AL003', name: 'Dust Mites', category: 'Environmental', severity: 'MILD', symptoms: 'Sneezing, rhinorrhea, itchy eyes', precautions: 'Use HEPA filter.' }
            ]),
            chronicConditions: 'Type 2 Diabetes Mellitus, Essential Hypertension',
            pastSurgeries: 'Appendectomy (2012)',
            pastMedications: 'Metformin 500mg, Amlodipine 5mg, Atorvastatin 10mg'
          }
        }
      },
      include: { patientProfile: true }
    });
    console.log('✅ Created demo patient: Rahul Verma (patient@uhis.gov.in)');
  } else {
    console.log('ℹ️ Rahul Verma already exists in DB:', rahul.id);
  }

  // 2. Ensure Doctor (Dr. Anita Desai)
  let hospital = await prisma.hospital.findFirst();
  if (!hospital) {
    hospital = await prisma.hospital.create({
      data: {
        name: 'AIIMS New Delhi',
        code: 'AIIMS-ND',
        address: 'Ansari Nagar, New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        contactNo: '+91 11 26588500',
        email: 'info@aiims.edu',
      }
    });
  }

  let doctor = await prisma.user.findUnique({
    where: { email: 'doctor@uhis.gov.in' },
    include: { doctorProfile: true }
  });

  if (!doctor) {
    doctor = await prisma.user.create({
      data: {
        fullName: 'Dr. Anita Desai',
        email: 'doctor@uhis.gov.in',
        password: commonPassword,
        role: 'DOCTOR',
        phoneNumber: '+91 98111 22334',
        doctorProfile: {
          create: {
            hospitalId: hospital.id,
            specialization: 'Internal Medicine',
            licenseNumber: 'MCI-10042',
            qualification: 'MBBS, MD (Medicine)',
            experienceYears: 14,
            consultationFee: 800,
          }
        }
      },
      include: { doctorProfile: true }
    });
    console.log('✅ Created demo doctor: Dr. Anita Desai (doctor@uhis.gov.in)');
  }

  // 3. Super Admin
  let admin = await prisma.user.findUnique({ where: { email: 'admin@uhis.gov.in' } });
  if (!admin) {
    await prisma.user.create({
      data: {
        fullName: 'Vikas Aggarwal',
        email: 'admin@uhis.gov.in',
        password: commonPassword,
        role: 'SUPER_ADMIN',
        phoneNumber: '+91 99999 00000',
      }
    });
    console.log('✅ Created demo superadmin: Vikas Aggarwal (admin@uhis.gov.in)');
  }

  // 4. Hospital Admin
  let hospAdmin = await prisma.user.findUnique({ where: { email: 'hospital@uhis.gov.in' } });
  if (!hospAdmin) {
    await prisma.user.create({
      data: {
        fullName: 'Dr. Sandeep Nair',
        email: 'hospital@uhis.gov.in',
        password: commonPassword,
        role: 'HOSPITAL_ADMIN',
        phoneNumber: '+91 98222 33445',
      }
    });
    console.log('✅ Created demo hospital admin (hospital@uhis.gov.in)');
  }

  // 5. Lab
  let lab = await prisma.user.findUnique({ where: { email: 'lab@uhis.gov.in' }, include: { labProfile: true } });
  if (!lab) {
    await prisma.user.create({
      data: {
        fullName: 'Meera Krishnan',
        email: 'lab@uhis.gov.in',
        password: commonPassword,
        role: 'LABORATORY',
        phoneNumber: '+91 98333 44556',
        labProfile: {
          create: {
            labName: 'Central Pathology Lab — AIIMS',
            licenseNo: 'LAB-LIC-1001',
            contactNo: '+91 11 26588501',
            address: 'Block C, Ground Floor, AIIMS'
          }
        }
      }
    });
    console.log('✅ Created demo lab (lab@uhis.gov.in)');
  }

  // 6. Pharmacy
  let pharmacy = await prisma.user.findUnique({ where: { email: 'pharmacy@uhis.gov.in' }, include: { pharmacyProfile: true } });
  if (!pharmacy) {
    await prisma.user.create({
      data: {
        fullName: 'Ramesh Chand',
        email: 'pharmacy@uhis.gov.in',
        password: commonPassword,
        role: 'PHARMACY',
        phoneNumber: '+91 98444 55667',
        pharmacyProfile: {
          create: {
            pharmacyName: 'Main Hospital Pharmacy — Block B',
            licenseNo: 'PHARM-LIC-1001',
            contactNo: '+91 11 26588502',
            address: 'Block B, AIIMS New Delhi'
          }
        }
      }
    });
    console.log('✅ Created demo pharmacy (pharmacy@uhis.gov.in)');
  }

  // 7. Receptionist
  let receptionist = await prisma.user.findUnique({ where: { email: 'receptionist@uhis.gov.in' } });
  if (!receptionist) {
    await prisma.user.create({
      data: {
        fullName: 'Pooja Sharma',
        email: 'receptionist@uhis.gov.in',
        password: commonPassword,
        role: 'RECEPTIONIST',
        phoneNumber: '+91 98555 66778',
      }
    });
    console.log('✅ Created demo receptionist (receptionist@uhis.gov.in)');
  }
}

module.exports = seedDemoUsers;

// Only self-execute when run directly (node seedDemoUsers.js)
if (require.main === module) {
  seedDemoUsers()
    .then(() => prisma.$disconnect())
    .catch(e => {
      console.error('Demo seed error:', e);
      prisma.$disconnect();
    });
}
