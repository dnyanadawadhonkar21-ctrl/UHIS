const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// --- DATA ARRAYS FOR PROCEDURAL GENERATION ---

const firstNamesM = ['Rahul', 'Amit', 'Vikram', 'Suresh', 'Ramesh', 'Arjun', 'Karan', 'Aditya', 'Rohan', 'Vishal', 'Sanjay', 'Prakash', 'Anil', 'Sunil', 'Rajesh', 'Manish', 'Nitin', 'Vivek', 'Sachin', 'Deepak', 'Gaurav', 'Tarun', 'Prashant', 'Ashish', 'Ravi'];
const firstNamesF = ['Priya', 'Ananya', 'Sneha', 'Neha', 'Pooja', 'Kavita', 'Sunita', 'Anita', 'Riya', 'Aisha', 'Divya', 'Swati', 'Meera', 'Ritu', 'Nisha', 'Aarti', 'Kiran', 'Meena', 'Shweta', 'Pallavi', 'Rashmi', 'Jyoti', 'Shilpa', 'Vandana', 'Preeti'];
const lastNames = ['Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Reddy', 'Rao', 'Iyer', 'Deshmukh', 'Joshi', 'Chopra', 'Kapoor', 'Das', 'Sen', 'Nair', 'Menon', 'Gupta', 'Mishra', 'Tiwari', 'Pandey', 'Yadav', 'Chauhan', 'Thakur', 'Bhat', 'Kulkarni'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const cities = ['Bengaluru', 'Mumbai', 'New Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];

const specializations = [
  { dept: 'Cardiology', spec: 'Cardiologist', prefix: 'Cardio' },
  { dept: 'Neurology', spec: 'Neurologist', prefix: 'Neuro' },
  { dept: 'Orthopedics', spec: 'Orthopedic Surgeon', prefix: 'Ortho' },
  { dept: 'Pediatrics', spec: 'Pediatrician', prefix: 'Pedia' },
  { dept: 'Oncology', spec: 'Oncologist', prefix: 'Onco' },
  { dept: 'Endocrinology', spec: 'Endocrinologist', prefix: 'Endo' },
  { dept: 'Gastroenterology', spec: 'Gastroenterologist', prefix: 'Gastro' },
  { dept: 'Dermatology', spec: 'Dermatologist', prefix: 'Derma' },
  { dept: 'Psychiatry', spec: 'Psychiatrist', prefix: 'Psych' },
  { dept: 'General Medicine', spec: 'General Physician', prefix: 'GenMed' },
];

const conditions = [
  { name: 'Type II Diabetes Mellitus', icd: 'E11', severity: 'MODERATE' },
  { name: 'Essential Hypertension', icd: 'I10', severity: 'MILD' },
  { name: 'Asthma', icd: 'J45', severity: 'MODERATE' },
  { name: 'Pulmonary Tuberculosis', icd: 'A15', severity: 'SEVERE' },
  { name: 'Dengue Fever', icd: 'A90', severity: 'SEVERE' },
  { name: 'Malaria (Plasmodium falciparum)', icd: 'B50', severity: 'SEVERE' },
  { name: 'Typhoid Fever', icd: 'A01.0', severity: 'MODERATE' },
  { name: 'Migraine without Aura', icd: 'G43.0', severity: 'MILD' },
  { name: 'Iron Deficiency Anemia', icd: 'D50', severity: 'MILD' },
  { name: 'Osteoarthritis of Knee', icd: 'M17', severity: 'MODERATE' }
];

const medicines = [
  { name: 'Paracetamol 650mg', category: 'ANALGESIC', brand: 'Dolo 650', dose: '650mg' },
  { name: 'Telmisartan 40mg', category: 'CARDIAC', brand: 'Telma 40', dose: '40mg' },
  { name: 'Metformin 500mg', category: 'ANTI-DIABETIC', brand: 'Glycomet', dose: '500mg' },
  { name: 'Atorvastatin 10mg', category: 'CARDIAC', brand: 'Lipvas', dose: '10mg' },
  { name: 'Amoxicillin 500mg', category: 'ANTIBIOTIC', brand: 'Novamox', dose: '500mg' },
  { name: 'Pantoprazole 40mg', category: 'ANTACID', brand: 'Pan 40', dose: '40mg' },
  { name: 'Cetirizine 10mg', category: 'ANTIHISTAMINE', brand: 'Cetzine', dose: '10mg' },
  { name: 'Azithromycin 500mg', category: 'ANTIBIOTIC', brand: 'Azithral', dose: '500mg' }
];

const allergiesList = [
  { name: 'Penicillin', cat: 'MEDICINE', sev: 'SEVERE', sym: 'Anaphylaxis, hives' },
  { name: 'Dust Mites', cat: 'ENVIRONMENTAL', sev: 'MODERATE', sym: 'Sneezing, asthma' },
  { name: 'Peanuts', cat: 'FOOD', sev: 'SEVERE', sym: 'Throat swelling' },
  { name: 'Pollen', cat: 'ENVIRONMENTAL', sev: 'MILD', sym: 'Runny nose' },
  { name: 'Sulfa Drugs', cat: 'MEDICINE', sev: 'MODERATE', sym: 'Skin rash' }
];

const vaccinesList = ['COVID-19 (Covishield)', 'Hepatitis B', 'Influenza (Flu Shot)', 'Tetanus Toxoid', 'Typhoid (Vi)'];
const labTests = [
  { name: 'Complete Blood Count (CBC)', cat: 'BLOOD' },
  { name: 'Lipid Profile', cat: 'BLOOD' },
  { name: 'HbA1c', cat: 'BLOOD' },
  { name: 'Thyroid Function Test', cat: 'BLOOD' },
  { name: 'Urine Routine', cat: 'URINE' },
  { name: 'Chest X-Ray', cat: 'RADIOLOGY' }
];

// --- HELPER FUNCTIONS ---
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPhone = () => `+91 ${randomInt(7000000000, 9999999999)}`;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function main() {
  console.log('🌱 Starting Large-Scale UHIS Production Database Seed process...');

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
  await prisma.user.create({
    data: { fullName: 'System Administrator', email: 'admin@uhis.org', password: commonPassword, role: 'SUPER_ADMIN', phoneNumber: '+91 9999900000' },
  });

  // 2. Base Infrastructure (5 Hospitals, 5 Labs, 5 Pharmacies)
  const hospitals = [];
  const labs = [];
  const pharmacies = [];
  const depts = [];

  for (let i = 1; i <= 5; i++) {
    // Hospital
    const hUser = await prisma.user.create({
      data: { fullName: `Admin Hospital ${i}`, email: `admin.hospital${i}@uhis.org`, password: commonPassword, role: 'HOSPITAL_ADMIN', phoneNumber: randomPhone() }
    });
    const hospital = await prisma.hospital.create({
      data: { name: `Apollo / Fortis Branch ${i}`, code: `HOSP-${i}`, address: `Street ${i}, Main Road`, city: randomElement(cities), state: 'State', contactNo: randomPhone(), email: `info@hosp${i}.org`, website: `https://hosp${i}.org` }
    });
    hospitals.push(hospital);

    // Departments for this hospital
    for (const spec of specializations) {
      const dept = await prisma.department.create({
        data: { hospitalId: hospital.id, name: spec.dept, description: `${spec.dept} Department` }
      });
      depts.push(dept);
    }

    // Lab
    const lUser = await prisma.user.create({
      data: { fullName: `Lab Admin ${i}`, email: `lab${i}@uhis.org`, password: commonPassword, role: 'LABORATORY', phoneNumber: randomPhone() }
    });
    const lab = await prisma.laboratory.create({
      data: { userId: lUser.id, labName: `Central Diagnostic Lab ${i}`, licenseNo: `LAB-LIC-${i}`, contactNo: randomPhone(), address: `Block ${i}` }
    });
    labs.push(lab);

    // Pharmacy
    const pUser = await prisma.user.create({
      data: { fullName: `Pharmacy Admin ${i}`, email: `pharmacy${i}@uhis.org`, password: commonPassword, role: 'PHARMACY', phoneNumber: randomPhone() }
    });
    const pharmacy = await prisma.pharmacy.create({
      data: { userId: pUser.id, pharmacyName: `24x7 Digital Pharmacy ${i}`, licenseNo: `PHARM-LIC-${i}`, contactNo: randomPhone(), address: `Campus ${i}` }
    });
    pharmacies.push(pharmacy);
  }

  // 3. Generate 100 Doctors
  console.log('👨‍⚕️ Generating 100 Doctors...');
  const doctors = [];
  for (let i = 1; i <= 100; i++) {
    const isMale = Math.random() > 0.5;
    const fName = randomElement(isMale ? firstNamesM : firstNamesF);
    const lName = randomElement(lastNames);
    const spec = randomElement(specializations);
    const hosp = randomElement(hospitals);
    // Find matching dept in this hosp
    const dept = depts.find(d => d.hospitalId === hosp.id && d.name === spec.dept);

    const docUser = await prisma.user.create({
      data: { fullName: `Dr. ${fName} ${lName}`, email: `doctor${i}@uhis.org`, password: commonPassword, role: 'DOCTOR', phoneNumber: randomPhone() }
    });

    const doc = await prisma.doctor.create({
      data: {
        userId: docUser.id,
        hospitalId: hosp.id,
        departmentId: dept.id,
        specialization: spec.spec,
        licenseNumber: `MCI-${randomInt(1000, 9999)}`,
        qualification: 'MBBS, MD',
        experienceYears: randomInt(2, 30),
        consultationFee: randomElement([500, 700, 800, 1000, 1200]),
      }
    });
    doctors.push({ ...doc, user: docUser });
  }

  // 4. Generate 100 Patients with full medical histories
  console.log('🤒 Generating 100 Patients and their medical records...');
  for (let i = 1; i <= 100; i++) {
    const isMale = Math.random() > 0.5;
    const fName = randomElement(isMale ? firstNamesM : firstNamesF);
    const lName = randomElement(lastNames);
    
    const patUser = await prisma.user.create({
      data: { fullName: `${fName} ${lName}`, email: `patient${i}@uhis.org`, password: commonPassword, role: 'PATIENT', phoneNumber: randomPhone() }
    });

    // Generate random allergies
    const patAllergies = [];
    if (Math.random() > 0.7) { // 30% have allergies
      const numAllergies = randomInt(1, 2);
      for (let j = 0; j < numAllergies; j++) {
        const al = randomElement(allergiesList);
        if (!patAllergies.find(a => a.name === al.name)) {
          patAllergies.push({ id: `a${j}`, name: al.name, category: al.cat, severity: al.sev, symptoms: al.sym, dateRecorded: randomDate(new Date('2015-01-01'), new Date()).toISOString(), precautions: 'Avoid exposure' });
        }
      }
    }

    const patient = await prisma.patient.create({
      data: {
        userId: patUser.id,
        abhaId: `91-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        gender: isMale ? 'MALE' : 'FEMALE',
        dateOfBirth: randomDate(new Date('1950-01-01'), new Date('2010-12-31')),
        bloodGroup: randomElement(bloodGroups),
        address: `Flat ${randomInt(100, 999)}, Sector ${randomInt(1, 20)}, ${randomElement(cities)}`,
        emergencyContact: `${randomElement(firstNamesM)} ${lName}`,
        emergencyPhone: randomPhone(),
        allergies: patAllergies.length > 0 ? JSON.stringify(patAllergies) : null,
      }
    });

    // Diagnoses (0 to 3 conditions)
    const numCond = randomInt(0, 3);
    for (let c = 0; c < numCond; c++) {
      const cond = randomElement(conditions);
      const doc = randomElement(doctors);
      await prisma.diagnosis.create({
        data: {
          patientId: patient.id,
          doctorId: doc.id,
          icdCode: cond.icd,
          conditionName: cond.name,
          severity: cond.severity,
          diagnosedDate: randomDate(new Date('2018-01-01'), new Date()),
        }
      });
    }

    // Vaccinations (1 to 4)
    const numVacc = randomInt(1, 4);
    for (let v = 0; v < numVacc; v++) {
      const vName = randomElement(vaccinesList);
      await prisma.medicalRecord.create({
        data: {
          patientId: patient.id,
          recordType: 'VACCINATION',
          title: vName,
          description: JSON.stringify({ vaccine: vName, dose: 'Standard', hospital: `Clinic ${randomElement(cities)}`, batchNumber: `B-${randomInt(1000,9999)}`, nextDue: null, status: 'COMPLETED' }),
          recordDate: randomDate(new Date('2010-01-01'), new Date()),
        }
      });
    }

    // Appointments & Prescriptions (1 to 3)
    const numAppt = randomInt(1, 3);
    for (let a = 0; a < numAppt; a++) {
      const doc = randomElement(doctors);
      const apptDate = randomDate(new Date('2025-01-01'), new Date('2026-12-31'));
      const status = apptDate > new Date() ? 'CONFIRMED' : 'COMPLETED';

      const appt = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doc.id,
          hospitalId: doc.hospitalId,
          appointmentDate: apptDate,
          timeSlot: '10:00 AM',
          status: status,
        }
      });

      if (status === 'COMPLETED') {
        const presc = await prisma.prescription.create({
          data: {
            appointmentId: appt.id,
            patientId: patient.id,
            doctorId: doc.id,
            diagnosisText: 'Routine checkup and diagnosis.',
            validUntil: new Date(apptDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            createdAt: apptDate,
          }
        });

        // 1-2 Meds
        const numMeds = randomInt(1, 2);
        for(let m = 0; m < numMeds; m++) {
           const med = randomElement(medicines);
           await prisma.prescriptionItem.create({
             data: {
               prescriptionId: presc.id,
               medicineName: med.name,
               dosage: med.dose,
               frequency: '1-0-1',
               durationDays: randomInt(5, 30),
             }
           });
        }
      }
    }

    // Lab Reports (0 to 3)
    const numLabs = randomInt(0, 3);
    for (let l = 0; l < numLabs; l++) {
      const test = randomElement(labTests);
      const labFac = randomElement(labs);
      await prisma.labReport.create({
        data: {
          laboratoryId: labFac.id,
          patientId: patient.id,
          testName: test.name,
          testCategory: test.cat,
          status: 'COMPLETED',
          resultData: JSON.stringify({ result: 'Within normal limits' }),
          sampleDate: randomDate(new Date('2025-01-01'), new Date()),
        }
      });
    }

    // Notifications (Health Alerts)
    if (patAllergies.length > 0) {
       await prisma.notification.create({
         data: {
           userId: patUser.id,
           title: 'Allergy Warning',
           message: `You have severe allergies listed. Stay safe.`,
           type: 'ALLERGY_WARNING',
         }
       });
    }
  }

  console.log('✅ UHIS Database Seeding Completed Successfully! 100 Patients & 100 Doctors Generated.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
