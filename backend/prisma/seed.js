const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting UHIS Production Database Seed process...');

  // Clean existing tables (in order of relations)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.billing.deleteMany();
  await prisma.dispenseRecord.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.labReport.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.laboratory.deleteMany();
  await prisma.pharmacy.deleteMany();
  await prisma.department.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.user.deleteMany();

  const commonPassword = await bcrypt.hash('password123', 10);

  // 1. Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      fullName: 'Dr. Rajesh V. Kurup',
      email: 'admin@uhis.org',
      password: commonPassword,
      role: 'SUPER_ADMIN',
      phoneNumber: '+91 98765 00001',
    },
  });

  // 2. Hospital & Hospital Admin
  const hospitalAdminUser = await prisma.user.create({
    data: {
      fullName: 'Vikramaditya Rao',
      email: 'hospitaladmin@apollo.org',
      password: commonPassword,
      role: 'HOSPITAL_ADMIN',
      phoneNumber: '+91 98765 00002',
    },
  });

  const apolloHospital = await prisma.hospital.create({
    data: {
      name: 'Apollo Multi-Specialty Super Hospital',
      code: 'APOLLO-BLR-01',
      address: '154/11, Bannerghatta Main Rd, Opposite IIM-B',
      city: 'Bengaluru',
      state: 'Karnataka',
      contactNo: '+91 80 2630 4050',
      email: 'info@apollo-blr.org',
      website: 'https://apollo-uhis.org',
    },
  });

  // Departments
  const cardioDept = await prisma.department.create({
    data: {
      hospitalId: apolloHospital.id,
      name: 'Cardiology & Vascular Surgery',
      description: 'Advanced interventional cardiology and cardiac surgery unit.',
    },
  });

  const neuroDept = await prisma.department.create({
    data: {
      hospitalId: apolloHospital.id,
      name: 'Neurology & Brain Sciences',
      description: 'Comprehensive stroke, epilepsy, and neurodegenerative care.',
    },
  });

  // 3. Doctors
  const doctorUser1 = await prisma.user.create({
    data: {
      fullName: 'Dr. Suresh Sharma',
      email: 'dr.sharma@apollo.org',
      password: commonPassword,
      role: 'DOCTOR',
      phoneNumber: '+91 98765 00003',
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      userId: doctorUser1.id,
      hospitalId: apolloHospital.id,
      departmentId: cardioDept.id,
      specialization: 'Senior Consultant Cardiologist',
      licenseNumber: 'MCI-KAR-2012-9843',
      qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
      experienceYears: 16,
      consultationFee: 800.0,
      availableDays: 'Mon, Wed, Fri',
      timeSlot: '09:00 AM - 01:00 PM',
    },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      fullName: 'Dr. Ananya Deshmukh',
      email: 'dr.ananya@apollo.org',
      password: commonPassword,
      role: 'DOCTOR',
      phoneNumber: '+91 98765 00004',
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      userId: doctorUser2.id,
      hospitalId: apolloHospital.id,
      departmentId: neuroDept.id,
      specialization: 'Neuro-Physician',
      licenseNumber: 'MCI-KAR-2015-4421',
      qualification: 'MBBS, DNB (Neurology)',
      experienceYears: 10,
      consultationFee: 700.0,
      availableDays: 'Tue, Thu, Sat',
      timeSlot: '02:00 PM - 06:00 PM',
    },
  });

  // 4. Patient (ABHA Identity Ready)
  const patientUser = await prisma.user.create({
    data: {
      fullName: 'Rahul K. Verma',
      email: 'patient.rahul@gmail.com',
      password: commonPassword,
      role: 'PATIENT',
      phoneNumber: '+91 98765 00005',
    },
  });

  const patient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      abhaId: '91-4820-3941-8890',
      gender: 'MALE',
      dateOfBirth: new Date('1996-08-14'),
      bloodGroup: 'O+',
      address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
      emergencyContact: 'Sunita Verma (Mother)',
      emergencyPhone: '+91 98765 99999',
      allergies: 'Penicillin, Dust Mites',
      chronicConditions: 'Mild Essential Hypertension',
    },
  });

  // 5. Laboratory
  const labUser = await prisma.user.create({
    data: {
      fullName: 'MetroDiagnostics Central Lab',
      email: 'lab.metro@uhis.org',
      password: commonPassword,
      role: 'LABORATORY',
      phoneNumber: '+91 98765 00006',
    },
  });

  const lab = await prisma.laboratory.create({
    data: {
      userId: labUser.id,
      labName: 'MetroDiagnostics NABL Certified Lab',
      licenseNo: 'NABL-LAB-8832-2024',
      contactNo: '+91 80 4112 3344',
      address: '22, Koramangala 8th Block, Bengaluru',
    },
  });

  // 6. Pharmacy
  const pharmacyUser = await prisma.user.create({
    data: {
      fullName: 'CityMed 24x7 Digital Pharmacy',
      email: 'pharmacy.city@uhis.org',
      password: commonPassword,
      role: 'PHARMACY',
      phoneNumber: '+91 98765 00007',
    },
  });

  const pharmacy = await prisma.pharmacy.create({
    data: {
      userId: pharmacyUser.id,
      pharmacyName: 'CityMed 24x7 Digital Pharmacy',
      licenseNo: 'KA-DRUG-LIC-9901',
      contactNo: '+91 80 4999 1111',
      address: 'Retail Block A, Apollo Hospital Campus, Bengaluru',
    },
  });

  // 7. Receptionist
  const receptionistUser = await prisma.user.create({
    data: {
      fullName: 'Pria Nambiar',
      email: 'receptionist.pria@apollo.org',
      password: commonPassword,
      role: 'RECEPTIONIST',
      phoneNumber: '+91 98765 00008',
    },
  });

  // --- POPULATE MEDICAL RECORDS & TIMELINE ---

  // Appointments
  const appt1 = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor1.id,
      hospitalId: apolloHospital.id,
      appointmentDate: new Date('2026-07-10T10:30:00Z'),
      timeSlot: '10:30 AM',
      reason: 'Chest discomfort & palpitation after mild exertion.',
      status: 'COMPLETED',
      notes: 'ECG normal, advised Lipid Profile and Echo.',
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor2.id,
      hospitalId: apolloHospital.id,
      appointmentDate: new Date('2026-07-28T14:30:00Z'),
      timeSlot: '02:30 PM',
      reason: 'Follow-up consultation for periodic headache.',
      status: 'CONFIRMED',
      notes: 'Upcoming appointment.',
    },
  });

  // Prescription & Items
  const presc1 = await prisma.prescription.create({
    data: {
      appointmentId: appt1.id,
      patientId: patient.id,
      doctorId: doctor1.id,
      diagnosisText: 'Grade I Hypertension & Exercise Induced Palpitation',
      advice: 'Reduce dietary sodium (<2g/day). Perform 30 min daily brisk walking.',
      validUntil: new Date('2026-08-30'),
      items: {
        create: [
          {
            medicineName: 'Telmisartan',
            dosage: '40mg',
            frequency: '1-0-0 (Morning after breakfast)',
            durationDays: 30,
            instructions: 'Monitor BP weekly.',
          },
          {
            medicineName: 'Atorvastatin',
            dosage: '10mg',
            frequency: '0-0-1 (Night before sleep)',
            durationDays: 30,
            instructions: 'Take continuously.',
          },
        ],
      },
    },
  });

  // Diagnoses
  await prisma.diagnosis.create({
    data: {
      patientId: patient.id,
      doctorId: doctor1.id,
      icdCode: 'I10',
      conditionName: 'Essential (Primary) Hypertension',
      severity: 'MILD',
      clinicalNotes: 'Blood pressure recorded at 138/88 mmHg.',
    },
  });

  // Lab Reports
  await prisma.labReport.create({
    data: {
      laboratoryId: lab.id,
      patientId: patient.id,
      testName: 'Lipid Profile & Fasting Blood Sugar',
      testCategory: 'BLOOD',
      status: 'COMPLETED',
      resultData: JSON.stringify({
        totalCholesterol: '210 mg/dL (High)',
        hdl: '45 mg/dL',
        ldl: '135 mg/dL',
        triglycerides: '150 mg/dL',
        fastingGlucose: '98 mg/dL',
      }),
      remarks: 'Mild elevation in total cholesterol and LDL. Dietary control advised.',
    },
  });

  await prisma.labReport.create({
    data: {
      laboratoryId: lab.id,
      patientId: patient.id,
      testName: '2D Echocardiogram & Color Doppler',
      testCategory: 'RADIOLOGY',
      status: 'COMPLETED',
      resultData: JSON.stringify({
        ejectionFraction: '62% (Normal)',
        valvularFunction: 'Normal mitral and aortic valves.',
        leftVentricle: 'Normal wall motion.',
      }),
      remarks: 'Normal cardiac structure and systolic function.',
    },
  });

  // Medical Record Entries (Unified Timeline)
  await prisma.medicalRecord.create({
    data: {
      patientId: patient.id,
      doctorId: doctor1.id,
      recordType: 'CONSULTATION',
      title: 'Cardiology Initial OPD Consultation',
      description: 'Patient presented with chest tightness. Cardiac examination within normal limits.',
      recordDate: new Date('2026-07-10'),
    },
  });

  await prisma.medicalRecord.create({
    data: {
      patientId: patient.id,
      recordType: 'VACCINATION',
      title: 'Hepatitis B Booster Dose',
      description: 'Completed 3-dose Hepatitis B primary vaccination series.',
      recordDate: new Date('2025-11-20'),
    },
  });

  await prisma.medicalRecord.create({
    data: {
      patientId: patient.id,
      recordType: 'SURGERY',
      title: 'Laparoscopic Appendectomy',
      description: 'Uneventful surgery performed at Manipal Hospital. Full recovery.',
      recordDate: new Date('2023-04-15'),
    },
  });

  // Pharmacy Medicines Inventory
  await prisma.medicine.createMany({
    data: [
      {
        pharmacyId: pharmacy.id,
        name: 'Telmisartan 40mg',
        genericName: 'Telmisartan',
        brand: 'Telmikind',
        category: 'CARDIAC',
        unitPrice: 8.5,
        stockQuantity: 450,
        expiryDate: new Date('2027-12-31'),
      },
      {
        pharmacyId: pharmacy.id,
        name: 'Atorvastatin 10mg',
        genericName: 'Atorvastatin',
        brand: 'Lipvas',
        category: 'CARDIAC',
        unitPrice: 12.0,
        stockQuantity: 300,
        expiryDate: new Date('2027-10-30'),
      },
      {
        pharmacyId: pharmacy.id,
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin',
        brand: 'Mox 500',
        category: 'ANTIBIOTIC',
        unitPrice: 15.0,
        stockQuantity: 500,
        expiryDate: new Date('2027-06-30'),
      },
      {
        pharmacyId: pharmacy.id,
        name: 'Paracetamol 650mg',
        genericName: 'Paracetamol',
        brand: 'Dolo 650',
        category: 'ANALGESIC',
        unitPrice: 2.5,
        stockQuantity: 1200,
        expiryDate: new Date('2028-01-01'),
      },
    ],
  });

  // Dispense Record
  await prisma.dispenseRecord.create({
    data: {
      pharmacyId: pharmacy.id,
      prescriptionId: presc1.id,
      patientId: patient.id,
      status: 'DISPENSED',
      totalCost: 615.0,
    },
  });

  // Billing & Payment
  const bill = await prisma.billing.create({
    data: {
      hospitalId: apolloHospital.id,
      patientId: patient.id,
      invoiceNumber: 'INV-2026-8841',
      amount: 800.0,
      taxAmount: 40.0,
      discount: 0.0,
      totalAmount: 840.0,
      status: 'PAID',
      dueDate: new Date('2026-07-15'),
    },
  });

  await prisma.payment.create({
    data: {
      billingId: bill.id,
      amount: 840.0,
      paymentMode: 'UPI',
      transactionId: 'UPI-TXN-9988221100',
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: patientUser.id,
        title: 'Appointment Reminder',
        message: 'Your upcoming OPD consultation with Dr. Ananya Deshmukh is scheduled for July 28 at 02:30 PM.',
        type: 'INFO',
      },
      {
        userId: patientUser.id,
        title: 'Lab Report Completed',
        message: 'Your Lipid Profile & Fasting Blood Sugar report is ready for download.',
        type: 'SUCCESS',
      },
    ],
  });

  // Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        action: 'SYSTEM_INITIALIZATION',
        resource: 'DATABASE',
        details: 'UHIS Database initialized with standard seed configuration.',
      },
      {
        userId: doctorUser1.id,
        action: 'CREATE_PRESCRIPTION',
        resource: 'PRESCRIPTION',
        details: `Issued prescription for patient ABHA ID: ${patient.abhaId}`,
      },
    ],
  });

  console.log('✅ UHIS Database Seeding Completed Successfully!');
  console.log('\n--- DEMO LOGIN CREDENTIALS ---');
  console.log('1. Super Admin: admin@uhis.org | password: password123');
  console.log('2. Hospital Admin: hospitaladmin@apollo.org | password: password123');
  console.log('3. Doctor: dr.sharma@apollo.org | password: password123');
  console.log('4. Patient: patient.rahul@gmail.com | password: password123');
  console.log('5. Lab: lab.metro@uhis.org | password: password123');
  console.log('6. Pharmacy: pharmacy.city@uhis.org | password: password123');
  console.log('7. Receptionist: receptionist.pria@apollo.org | password: password123');
  console.log('-------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
