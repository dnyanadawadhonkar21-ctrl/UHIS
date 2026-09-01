const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');


async function seedCanonical() {
  console.log('🌱 Seeding Canonical UHIS Doctor & Patient accounts...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Ensure Apollo Hospital exists
  let hospital = await prisma.hospital.findFirst({
    where: { name: { contains: 'Apollo' } },
  });

  if (!hospital) {
    hospital = await prisma.hospital.create({
      data: {
        name: 'Apollo Hospital — Central Facility',
        code: 'HOSP-APOLLO-01',
        address: 'Sarita Vihar, Mathura Road',
        city: 'New Delhi',
        state: 'Delhi',
        contactNo: '+91 11 2692 5858',
        email: 'info@apollo.uhis.org',
        website: 'https://apollo.uhis.org',
      },
    });
  }

  // Ensure Department exists
  let dept = await prisma.department.findFirst({
    where: { hospitalId: hospital.id, name: 'General Medicine' },
  });

  if (!dept) {
    dept = await prisma.department.create({
      data: {
        hospitalId: hospital.id,
        name: 'General Medicine',
        description: 'Internal and Emergency Medicine',
      },
    });
  }

  // 2. Canonical Doctor: Dr. Sharma (doctor@uhis.gov.in & doctor1@uhis.org)
  const doctorEmails = ['doctor@uhis.gov.in', 'doctor1@uhis.org'];
  let primaryDocUser = null;
  let primaryDoctor = null;

  for (const email of doctorEmails) {
    let dUser = await prisma.user.findUnique({ where: { email } });
    if (!dUser) {
      dUser = await prisma.user.create({
        data: {
          fullName: 'Dr. Sharma',
          email,
          password: passwordHash,
          role: 'DOCTOR',
          phoneNumber: '+91 98765 43210',
          isActive: true,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: dUser.id },
        data: { fullName: 'Dr. Sharma', password: passwordHash, role: 'DOCTOR', isActive: true },
      });
    }

    let docProfile = await prisma.doctor.findUnique({ where: { userId: dUser.id } });
    if (!docProfile) {
      docProfile = await prisma.doctor.create({
        data: {
          userId: dUser.id,
          hospitalId: hospital.id,
          departmentId: dept.id,
          specialization: 'General Physician / Emergency Medicine',
          licenseNumber: 'MCI-2026-9482',
          qualification: 'MBBS, MD (Internal Medicine)',
          experienceYears: 14,
          consultationFee: 750,
        },
      });
    }

    if (!primaryDocUser) {
      primaryDocUser = dUser;
      primaryDoctor = docProfile;
    }
  }

  // 3. Canonical Patient: Rahul Verma (patient@uhis.gov.in & patient1@uhis.org)
  const patientEmails = ['patient@uhis.gov.in', 'patient1@uhis.org'];
  let primaryPatientUser = null;
  let primaryPatient = null;

  const allergyData = JSON.stringify([
    {
      id: 'alg-001',
      name: 'Penicillin',
      category: 'MEDICINE',
      severity: 'SEVERE',
      symptoms: 'Anaphylaxis, acute hives, bronchospasm',
      precautions: 'Strictly avoid all beta-lactam antibiotics. Keep Epinephrine nearby.',
    },
    {
      id: 'alg-002',
      name: 'Sulfa Drugs',
      category: 'MEDICINE',
      severity: 'MODERATE',
      symptoms: 'Erythematous skin rash, pruritus',
      precautions: 'Avoid Cotrimoxazole / Trimethoprim-sulfamethoxazole.',
    },
  ]);

  for (const email of patientEmails) {
    let pUser = await prisma.user.findUnique({ where: { email } });
    if (!pUser) {
      pUser = await prisma.user.create({
        data: {
          fullName: 'Rahul Verma',
          email,
          password: passwordHash,
          role: 'PATIENT',
          phoneNumber: '+91 98112 34567',
          isActive: true,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: pUser.id },
        data: { fullName: 'Rahul Verma', password: passwordHash, role: 'PATIENT', isActive: true },
      });
    }

    let pProfile = await prisma.patient.findUnique({ where: { userId: pUser.id } });
    if (!pProfile) {
      pProfile = await prisma.patient.create({
        data: {
          userId: pUser.id,
          abhaId: email === 'patient@uhis.gov.in' ? 'RV-2026-001' : '91-4782-3391-6284',
          gender: 'MALE',
          dateOfBirth: new Date('2000-03-14'),
          bloodGroup: 'B+',
          address: 'B-402, Green Valley Apartments, Sarita Vihar, New Delhi',
          emergencyContact: 'Kavita Verma (Spouse)',
          emergencyPhone: '+91 98877 66554',
          allergies: allergyData,
          chronicConditions: 'Asthma (Moderate Persistent), Type 2 Diabetes Mellitus',
          pastSurgeries: 'Appendectomy (2019)',
          height: '176 cm',
          weight: '74 kg',
        },
      });
    } else {
      await prisma.patient.update({
        where: { id: pProfile.id },
        data: {
          abhaId: email === 'patient@uhis.gov.in' ? 'RV-2026-001' : '91-4782-3391-6284',
          gender: 'MALE',
          dateOfBirth: new Date('2000-03-14'),
          bloodGroup: 'B+',
          allergies: allergyData,
          emergencyContact: 'Kavita Verma (Spouse)',
          emergencyPhone: '+91 98877 66554',
        },
      });
    }

    if (!primaryPatientUser) {
      primaryPatientUser = pUser;
      primaryPatient = pProfile;
    }
  }

  // 4. Seed Rahul Verma's full medical history for all matching patient accounts
  const allRahulPatients = await prisma.patient.findMany({
    where: {
      OR: [
        { abhaId: 'RV-2026-001' },
        { abhaId: '91-4782-3391-6284' },
        { user: { email: { in: patientEmails } } },
      ],
    },
  });

  // Ensure uploads directory exists
  const fs = require('fs');
  const path = require('path');
  const backendUploadsDir = path.join(__dirname, '../uploads');
  const frontendUploadsDir = path.join(__dirname, '../../frontend/public/uploads');

  if (!fs.existsSync(backendUploadsDir)) fs.mkdirSync(backendUploadsDir, { recursive: true });
  if (!fs.existsSync(frontendUploadsDir)) fs.mkdirSync(frontendUploadsDir, { recursive: true });

  // Generate lightweight valid SVG/JPEG radiograph image placeholder
  const sampleXRaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" width="100%" height="100%">
    <rect width="600" height="700" fill="#0b0f19"/>
    <rect x="20" y="20" width="560" height="660" rx="8" fill="#111827" stroke="#1f2937" stroke-width="2"/>
    <text x="40" y="55" fill="#10B981" font-family="monospace" font-size="14" font-weight="bold">UHIS DIGITAL RADIOGRAPHY · AP/PA VIEW</text>
    <text x="40" y="75" fill="#9CA3AF" font-family="sans-serif" font-size="12">PATIENT: RAHUL VERMA (RV-2026-001) · AGE: 24 · GENDER: M</text>
    <text x="40" y="95" fill="#6B7280" font-family="sans-serif" font-size="11">FACILITY: APOLLO RADIOLOGY SUITE 4 · DATE: 2024-02-20</text>
    
    <!-- Thoracic Cage & Ribs Outline Simulation -->
    <path d="M 300,140 L 300,520" stroke="#374151" stroke-width="8" stroke-linecap="round"/>
    <!-- Clavicles -->
    <path d="M 180,180 Q 250,160 300,165 Q 350,160 420,180" fill="none" stroke="#6B7280" stroke-width="6" stroke-linecap="round"/>
    <!-- Ribs Left -->
    <path d="M 290,200 Q 180,210 160,250" fill="none" stroke="#374151" stroke-width="5" stroke-linecap="round"/>
    <path d="M 290,240 Q 170,260 150,310" fill="none" stroke="#374151" stroke-width="5" stroke-linecap="round"/>
    <path d="M 290,280 Q 165,310 145,370" fill="none" stroke="#374151" stroke-width="5" stroke-linecap="round"/>
    <path d="M 290,320 Q 165,360 145,430" fill="none" stroke="#374151" stroke-width="5" stroke-linecap="round"/>
    <path d="M 290,360 Q 170,410 155,480" fill="none" stroke="#374151" stroke-width="5" stroke-linecap="round"/>
    
    <!-- Ribs Right -->
    <path d="M 310,200 Q 420,210 440,250" fill="none" stroke="#374151" stroke-width="5" stroke-linecap="round"/>
    <path d="M 310,240 Q 430,260 450,310" fill="none" stroke="#374151" stroke-width="5" stroke-linecap="round"/>
    <path d="M 310,280 Q 435,310 455,370" fill="none" stroke="#374151" stroke-width="5" stroke-linecap="round"/>
    <path d="M 310,320 Q 435,360 455,430" fill="none" stroke="#374151" stroke-width="5" stroke-linecap="round"/>
    <path d="M 310,360 Q 430,410 445,480" fill="none" stroke="#374151" stroke-width="5" stroke-linecap="round"/>
    
    <!-- Cardiac Silhouette -->
    <path d="M 280,260 Q 340,320 370,410 Q 320,440 260,430 Q 230,370 280,260 Z" fill="#1f2937" opacity="0.85" stroke="#4b5563" stroke-width="2"/>
    
    <!-- Diaphragm domes -->
    <path d="M 130,510 Q 210,450 290,490" fill="none" stroke="#4b5563" stroke-width="4"/>
    <path d="M 310,490 Q 390,440 470,510" fill="none" stroke="#4b5563" stroke-width="4"/>
    
    <rect x="40" y="600" width="520" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="60" y="625" fill="#E2E8F0" font-family="sans-serif" font-size="12" font-weight="bold">RADIOLOGIST FINDINGS (CLEAR):</text>
    <text x="60" y="645" fill="#94A3B8" font-family="sans-serif" font-size="11">No focal consolidation, pneumothorax, or pleural effusion. Normal cardiac size and contour.</text>
  </svg>`;

  fs.writeFileSync(path.join(backendUploadsDir, 'chest-xray-sample.jpg'), sampleXRaySvg, 'utf8');
  fs.writeFileSync(path.join(frontendUploadsDir, 'chest-xray-sample.jpg'), sampleXRaySvg, 'utf8');

  for (const patientObj of allRahulPatients) {
    // Delete existing demo records for this patient
    await prisma.diagnosis.deleteMany({ where: { patientId: patientObj.id } });
    await prisma.prescription.deleteMany({ where: { patientId: patientObj.id } });
    await prisma.labReport.deleteMany({ where: { patientId: patientObj.id } });
    await prisma.medicalRecord.deleteMany({ where: { patientId: patientObj.id } });

    // Diagnoses
    await prisma.diagnosis.create({
      data: {
        patientId: patientObj.id,
        doctorId: primaryDoctor.id,
        conditionName: 'Asthma (Moderate Persistent)',
        icdCode: 'J45.40',
        severity: 'MODERATE',
        diagnosedDate: new Date('2022-04-10'),
        clinicalNotes: 'Patient experiences nocturnal wheezing and shortness of breath with physical exertion. Controlled with inhaled corticosteroid/bronchodilator.',
      },
    });

    await prisma.diagnosis.create({
      data: {
        patientId: patientObj.id,
        doctorId: primaryDoctor.id,
        conditionName: 'Type 2 Diabetes Mellitus',
        icdCode: 'E11.9',
        severity: 'MODERATE',
        diagnosedDate: new Date('2023-01-15'),
        clinicalNotes: 'HbA1c 6.8%. Fasting blood sugar 128 mg/dL. Managed with Metformin and dietary lifestyle modifications.',
      },
    });

    // Prescriptions
    await prisma.prescription.create({
      data: {
        patientId: patientObj.id,
        doctorId: primaryDoctor.id,
        advice: 'Take medications regularly. Follow-up after 3 months.',
        diagnosisText: 'Asthma with comorbid Type 2 Diabetes Mellitus',
        items: {
          create: [
            {
              medicineName: 'Salbutamol 100mcg Inhaler',
              dosage: '2 puffs',
              frequency: 'As needed (PRN)',
              durationDays: 90,
              instructions: 'Inhale 2 puffs during acute bronchospasm / wheezing',
            },
            {
              medicineName: 'Metformin 500mg',
              dosage: '1 tablet',
              frequency: 'Twice daily (1-0-1)',
              durationDays: 90,
              instructions: 'Take immediately after breakfast and dinner',
            },
            {
              medicineName: 'Montelukast 10mg',
              dosage: '1 tablet',
              frequency: 'Once daily at bedtime (0-0-1)',
              durationDays: 30,
              instructions: 'Take at night with water',
            },
          ],
        },
      },
    });

    // Lab Reports
    await prisma.labReport.create({
      data: {
        patientId: patientObj.id,
        testName: 'Complete Blood Count (CBC) & HbA1c Panel',
        testCategory: 'HEMATOLOGY',
        sampleDate: new Date('2024-02-18'),
        status: 'COMPLETED',
        resultData: 'Hb: 14.2 g/dL | WBC: 6,800 /mcL | Platelets: 240,000 /mcL | HbA1c: 6.8% | Fasting Glucose: 124 mg/dL',
        remarks: 'Glycemic control stable. Normal blood counts.',
      },
    });

    await prisma.labReport.create({
      data: {
        patientId: patientObj.id,
        testName: 'Lipid Profile & Serum Creatinine',
        testCategory: 'BIOCHEMISTRY',
        sampleDate: new Date('2024-02-18'),
        status: 'COMPLETED',
        resultData: 'Total Cholesterol: 188 mg/dL | Triglycerides: 142 mg/dL | HDL: 46 mg/dL | LDL: 114 mg/dL | Creatinine: 0.9 mg/dL',
        remarks: 'Renal function and lipid parameters within normal biological reference limits.',
      },
    });

    // Medical Records & Uploaded X-Ray image
    await prisma.medicalRecord.create({
      data: {
        patientId: patientObj.id,
        recordType: 'RADIOLOGY',
        title: 'Chest X-Ray PA View (Digital Radiography)',
        description: 'Lungs are clear with no focal consolidation, pneumothorax, or pleural effusion. Cardiothoracic ratio is normal.',
        recordDate: new Date('2024-02-20'),
        attachmentUrl: '/uploads/chest-xray-sample.jpg',
      },
    });

    await prisma.medicalRecord.create({
      data: {
        patientId: patientObj.id,
        recordType: 'VACCINATION',
        title: 'COVID-19 Booster & Influenza Vaccine',
        description: 'Covishield Booster Dose (Batch: 4892A) and Annual Quadrivalent Influenza Vaccine administered in left deltoid.',
        recordDate: new Date('2023-11-10'),
      },
    });

    await prisma.medicalRecord.create({
      data: {
        patientId: patientObj.id,
        recordType: 'CONSULTATION',
        title: 'Pulmonary Specialist Consultation Note',
        description: 'Comprehensive respiratory assessment. SpO2 98% on room air. Peak Expiratory Flow Rate (PEFR) within normal range. Maintain current inhaler therapy.',
        recordDate: new Date('2024-01-10'),
      },
    });
  }

  // 5. Canonical Demo Patient 2: Aboli Joshi (AJ-2026-002)
  const aboliUser = await prisma.user.upsert({
    where: { email: 'aboli.joshi@uhis.org' },
    update: { fullName: 'Aboli Joshi', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98234 11223' },
    create: { fullName: 'Aboli Joshi', email: 'aboli.joshi@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98234 11223' },
  });

  const aboliAllergies = JSON.stringify([
    { id: 'alg-aj1', name: 'Dust Mites', category: 'ENVIRONMENTAL', severity: 'MODERATE', symptoms: 'Rhinorrhea, sneezing, wheezing', precautions: 'Use HEPA air purifier. Regular allergen bedding wash.' },
    { id: 'alg-aj2', name: 'Shellfish', category: 'FOOD', severity: 'SEVERE', symptoms: 'Facial angioedema, urticaria', precautions: 'Avoid all crustaceans and marine invertebrates.' },
  ]);

  const aboliPatient = await prisma.patient.upsert({
    where: { userId: aboliUser.id },
    update: {
      abhaId: 'AJ-2026-002',
      gender: 'FEMALE',
      dateOfBirth: new Date('1997-06-20'),
      bloodGroup: 'A+',
      address: 'Flat 301, Marvel Heights, Koregaon Park, Pune',
      emergencyContact: 'Rohan Joshi (Brother)',
      emergencyPhone: '+91 98234 11223',
      allergies: aboliAllergies,
      chronicConditions: 'Migraine without Aura, Hypothyroidism, Iron Deficiency Anemia',
      pastSurgeries: 'None',
      height: '162 cm',
      weight: '58 kg',
    },
    create: {
      userId: aboliUser.id,
      abhaId: 'AJ-2026-002',
      gender: 'FEMALE',
      dateOfBirth: new Date('1997-06-20'),
      bloodGroup: 'A+',
      address: 'Flat 301, Marvel Heights, Koregaon Park, Pune',
      emergencyContact: 'Rohan Joshi (Brother)',
      emergencyPhone: '+91 98234 11223',
      allergies: aboliAllergies,
      chronicConditions: 'Migraine without Aura, Hypothyroidism, Iron Deficiency Anemia',
      pastSurgeries: 'None',
      height: '162 cm',
      weight: '58 kg',
    },
  });

  await prisma.diagnosis.deleteMany({ where: { patientId: aboliPatient.id } });
  await prisma.prescription.deleteMany({ where: { patientId: aboliPatient.id } });
  await prisma.labReport.deleteMany({ where: { patientId: aboliPatient.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: aboliPatient.id } });

  await prisma.diagnosis.create({
    data: { patientId: aboliPatient.id, doctorId: primaryDoctor.id, conditionName: 'Migraine without Aura', icdCode: 'G43.0', severity: 'MILD', diagnosedDate: new Date('2024-01-15'), clinicalNotes: 'Unilateral pulsating headache triggered by stress and lack of sleep. Responds to Naproxen and dark-room rest.' },
  });
  await prisma.diagnosis.create({
    data: { patientId: aboliPatient.id, doctorId: primaryDoctor.id, conditionName: 'Hypothyroidism (Autoimmune / Primary)', icdCode: 'E03.9', severity: 'MODERATE', diagnosedDate: new Date('2021-08-10'), clinicalNotes: 'Elevated TSH on routine health screening. Well-maintained on Levothyroxine 50mcg daily fasting.' },
  });
  await prisma.diagnosis.create({
    data: { patientId: aboliPatient.id, doctorId: primaryDoctor.id, conditionName: 'Iron Deficiency Anemia (Microcytic)', icdCode: 'D50.9', severity: 'MILD', diagnosedDate: new Date('2023-04-18'), clinicalNotes: 'Fatigue and low ferritin. Hemoglobin improved on oral iron supplementation.' },
  });

  await prisma.prescription.create({
    data: {
      patientId: aboliPatient.id,
      doctorId: primaryDoctor.id,
      diagnosisText: 'Primary Hypothyroidism with Chronic Migraine Prophylaxis',
      advice: 'Take Levothyroxine strictly 30 mins before morning breakfast. Keep hydration adequate.',
      items: {
        create: [
          { medicineName: 'Levothyroxine Sodium 50mcg', dosage: '1 tablet', frequency: 'Once daily morning (1-0-0)', durationDays: 90, instructions: 'Take empty stomach with plain water' },
          { medicineName: 'Ferrous Ascorbate + Folic Acid', dosage: '1 tablet', frequency: 'Once daily after lunch (0-1-0)', durationDays: 60, instructions: 'Avoid milk or calcium within 2 hours of dose' },
          { medicineName: 'Naproxen 250mg', dosage: '1 tablet', frequency: 'PRN for acute headache', durationDays: 15, instructions: 'Take with food at onset of migraine aura/throbbing' },
        ],
      },
    },
  });

  await prisma.labReport.create({
    data: {
      patientId: aboliPatient.id,
      testName: 'Thyroid Function Profile (T3, T4, TSH)',
      testCategory: 'ENDOCRINOLOGY',
      sampleDate: new Date('2024-02-10'),
      status: 'COMPLETED',
      resultData: 'TSH: 3.12 uIU/mL (Normal 0.4-4.2) | Free T4: 1.28 ng/dL | Free T3: 3.1 pg/mL',
      remarks: 'Euthyroid state achieved on current Levothyroxine replacement posology.',
    },
  });

  await prisma.labReport.create({
    data: {
      patientId: aboliPatient.id,
      testName: 'Complete Blood Count & Serum Ferritin',
      testCategory: 'HEMATOLOGY',
      sampleDate: new Date('2023-11-20'),
      status: 'COMPLETED',
      resultData: 'Hemoglobin: 12.4 g/dL | RBC: 4.2 M/uL | Serum Ferritin: 38 ng/mL (Normal 15-150)',
      remarks: 'Anemia resolved with oral hematinic therapy.',
    },
  });

  await prisma.medicalRecord.create({
    data: {
      patientId: aboliPatient.id,
      recordType: 'RADIOLOGY',
      title: 'Brain MRI (Non-Contrast Neuroimaging)',
      description: 'Normal cerebral parenchyma. No intracranial mass lesion, infarction, or vascular anomaly detected. Normal ventricles and sulcal spaces.',
      recordDate: new Date('2024-01-20'),
      attachmentUrl: '/uploads/chest-xray-sample.jpg',
    },
  });

  await prisma.medicalRecord.create({
    data: {
      patientId: aboliPatient.id,
      recordType: 'CONSULTATION',
      title: 'Neurology Consultation & Migraine Management Plan',
      description: 'Patient advised on sleep hygiene, trigger avoidance, and preventive medication protocol.',
      recordDate: new Date('2024-01-15'),
    },
  });

  // 6. Canonical Demo Patient 3: Sunita Sharma (SS-2026-003)
  const sunitaUser = await prisma.user.upsert({
    where: { email: 'sunita.sharma@uhis.org' },
    update: { fullName: 'Sunita Sharma', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98190 44332' },
    create: { fullName: 'Sunita Sharma', email: 'sunita.sharma@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98190 44332' },
  });

  const sunitaAllergies = JSON.stringify([
    { id: 'alg-ss1', name: 'Aspirin & NSAIDs', category: 'MEDICINE', severity: 'SEVERE', symptoms: 'Gastric hemorrhage, bronchospasm', precautions: 'Contraindicated for all acetylsalicylic acid formulations.' },
  ]);

  const sunitaPatient = await prisma.patient.upsert({
    where: { userId: sunitaUser.id },
    update: {
      abhaId: 'SS-2026-003',
      gender: 'FEMALE',
      dateOfBirth: new Date('1972-04-12'),
      bloodGroup: 'O-',
      address: '22/B, Bandra West, Mumbai — 400050',
      emergencyContact: 'Rajesh Sharma (Spouse)',
      emergencyPhone: '+91 98190 44332',
      allergies: sunitaAllergies,
      chronicConditions: 'Essential Hypertension, Coronary Artery Disease (Stable), Knee Osteoarthritis',
      pastSurgeries: 'Laparoscopic Cholecystectomy (2018)',
      height: '158 cm',
      weight: '68 kg',
    },
    create: {
      userId: sunitaUser.id,
      abhaId: 'SS-2026-003',
      gender: 'FEMALE',
      dateOfBirth: new Date('1972-04-12'),
      bloodGroup: 'O-',
      address: '22/B, Bandra West, Mumbai — 400050',
      emergencyContact: 'Rajesh Sharma (Spouse)',
      emergencyPhone: '+91 98190 44332',
      allergies: sunitaAllergies,
      chronicConditions: 'Essential Hypertension, Coronary Artery Disease (Stable), Knee Osteoarthritis',
      pastSurgeries: 'Laparoscopic Cholecystectomy (2018)',
      height: '158 cm',
      weight: '68 kg',
    },
  });

  await prisma.diagnosis.deleteMany({ where: { patientId: sunitaPatient.id } });
  await prisma.prescription.deleteMany({ where: { patientId: sunitaPatient.id } });
  await prisma.labReport.deleteMany({ where: { patientId: sunitaPatient.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: sunitaPatient.id } });

  await prisma.diagnosis.create({
    data: { patientId: sunitaPatient.id, doctorId: primaryDoctor.id, conditionName: 'Essential Hypertension', icdCode: 'I10', severity: 'MODERATE', diagnosedDate: new Date('2021-03-12'), clinicalNotes: 'BP 150/94 on presentation. Controlled on dual ARB-CCB therapy.' },
  });
  await prisma.diagnosis.create({
    data: { patientId: sunitaPatient.id, doctorId: primaryDoctor.id, conditionName: 'Coronary Artery Disease (Stable Angina)', icdCode: 'I25.1', severity: 'MODERATE', diagnosedDate: new Date('2023-06-25'), clinicalNotes: 'Exertional angina CCS Class II. Normal ejection fraction (58%). Statin and antiplatelet regimen.' },
  });
  await prisma.diagnosis.create({
    data: { patientId: sunitaPatient.id, doctorId: primaryDoctor.id, conditionName: 'Bilateral Knee Osteoarthritis', icdCode: 'M17.0', severity: 'MODERATE', diagnosedDate: new Date('2024-02-05'), clinicalNotes: 'Grade II joint space narrowing. Quadriceps strengthening exercises advised.' },
  });

  await prisma.prescription.create({
    data: {
      patientId: sunitaPatient.id,
      doctorId: primaryDoctor.id,
      diagnosisText: 'Hypertension & CAD Secondary Prevention',
      advice: 'Low sodium cardiac diet. Check blood pressure twice weekly.',
      items: {
        create: [
          { medicineName: 'Telmisartan 40mg + Amlodipine 5mg', dosage: '1 tablet', frequency: 'Morning (1-0-0)', durationDays: 90, instructions: 'Take after breakfast' },
          { medicineName: 'Clopidogrel 75mg', dosage: '1 tablet', frequency: 'After lunch (0-1-0)', durationDays: 90, instructions: 'Antiplatelet therapy' },
          { medicineName: 'Atorvastatin 20mg', dosage: '1 tablet', frequency: 'At bedtime (0-0-1)', durationDays: 90, instructions: 'Take at night for lipid control' },
          { medicineName: 'Glucosamine Sulfate 500mg', dosage: '1 tablet', frequency: 'Twice daily (1-0-1)', durationDays: 60, instructions: 'Cartilage support' },
        ],
      },
    },
  });

  await prisma.labReport.create({
    data: {
      patientId: sunitaPatient.id,
      testName: 'Lipid Profile & Serum Electrolytes',
      testCategory: 'BIOCHEMISTRY',
      sampleDate: new Date('2024-01-18'),
      status: 'COMPLETED',
      resultData: 'Total Cholesterol: 164 mg/dL | LDL: 88 mg/dL | HDL: 48 mg/dL | Triglycerides: 138 mg/dL | Sodium: 140 mEq/L | Potassium: 4.3 mEq/L',
      remarks: 'Target LDL achieved (<100 mg/dL). Electrolytes normal.',
    },
  });

  await prisma.medicalRecord.create({
    data: {
      patientId: sunitaPatient.id,
      recordType: 'RADIOLOGY',
      title: 'Bilateral Knee X-Ray AP / Lateral Standing',
      description: 'Mild medial compartment joint space narrowing with early subchondral sclerosis. No osteophyte detachment or joint effusion.',
      recordDate: new Date('2024-02-05'),
      attachmentUrl: '/uploads/chest-xray-sample.jpg',
    },
  });

  await prisma.medicalRecord.create({
    data: {
      patientId: sunitaPatient.id,
      recordType: 'CONSULTATION',
      title: '2D Echocardiography & Cardiology Assessment',
      description: 'Normal LV cavity size and systolic function. LVEF 58%. Grade 1 LV diastolic dysfunction. No regional wall motion abnormality.',
      recordDate: new Date('2023-06-25'),
    },
  });

  // 7. Canonical Demo Patient 4: Mohd. Tariq Khan (TK-2026-004)
  const tariqUser = await prisma.user.upsert({
    where: { email: 'tariq.khan@uhis.org' },
    update: { fullName: 'Mohd. Tariq Khan', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 97112 55667' },
    create: { fullName: 'Mohd. Tariq Khan', email: 'tariq.khan@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 97112 55667' },
  });

  const tariqAllergies = JSON.stringify([
    { id: 'alg-tk1', name: 'Cephalosporins', category: 'MEDICINE', severity: 'MODERATE', symptoms: 'Urticarial rash, fever', precautions: 'Avoid all 1st and 2nd generation cephalosporin antibiotics.' },
  ]);

  const tariqPatient = await prisma.patient.upsert({
    where: { userId: tariqUser.id },
    update: {
      abhaId: 'TK-2026-004',
      gender: 'MALE',
      dateOfBirth: new Date('1980-09-14'),
      bloodGroup: 'AB+',
      address: 'House 44, Jamia Nagar, Okhla, New Delhi — 110025',
      emergencyContact: 'Farhana Khan (Spouse)',
      emergencyPhone: '+91 97112 55667',
      allergies: tariqAllergies,
      chronicConditions: 'Chronic Bronchitis / COPD Stage I, GERD, Dyslipidemia',
      pastSurgeries: 'None',
      height: '180 cm',
      weight: '82 kg',
    },
    create: {
      userId: tariqUser.id,
      abhaId: 'TK-2026-004',
      gender: 'MALE',
      dateOfBirth: new Date('1980-09-14'),
      bloodGroup: 'AB+',
      address: 'House 44, Jamia Nagar, Okhla, New Delhi — 110025',
      emergencyContact: 'Farhana Khan (Spouse)',
      emergencyPhone: '+91 97112 55667',
      allergies: tariqAllergies,
      chronicConditions: 'Chronic Bronchitis / COPD Stage I, GERD, Dyslipidemia',
      pastSurgeries: 'None',
      height: '180 cm',
      weight: '82 kg',
    },
  });

  await prisma.diagnosis.deleteMany({ where: { patientId: tariqPatient.id } });
  await prisma.prescription.deleteMany({ where: { patientId: tariqPatient.id } });
  await prisma.labReport.deleteMany({ where: { patientId: tariqPatient.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: tariqPatient.id } });

  await prisma.diagnosis.create({
    data: { patientId: tariqPatient.id, doctorId: primaryDoctor.id, conditionName: 'Chronic Obstructive Pulmonary Disease (Stage I)', icdCode: 'J44.9', severity: 'MODERATE', diagnosedDate: new Date('2023-10-12'), clinicalNotes: 'Post-bronchodilator FEV1/FVC 68%, FEV1 82% predicted. Ex-smoker. Managed with daily ICS/LABA inhaler.' },
  });
  await prisma.diagnosis.create({
    data: { patientId: tariqPatient.id, doctorId: primaryDoctor.id, conditionName: 'Gastroesophageal Reflux Disease (GERD)', icdCode: 'K21.9', severity: 'MILD', diagnosedDate: new Date('2022-05-14'), clinicalNotes: 'Heartburn and acid regurgitation worse in supine position. Responds to PPI.' },
  });

  await prisma.prescription.create({
    data: {
      patientId: tariqPatient.id,
      doctorId: primaryDoctor.id,
      diagnosisText: 'COPD Maintenance & Acid Peptic Management',
      advice: 'Rinse mouth thoroughly after inhaler use. Avoid eating 2 hours before lying down.',
      items: {
        create: [
          { medicineName: 'Budesonide + Formoterol 200/6mcg Inhaler', dosage: '1 puff', frequency: 'Twice daily (1-0-1)', durationDays: 90, instructions: 'Inhale using spacer device, rinse mouth' },
          { medicineName: 'Pantoprazole 40mg', dosage: '1 tablet', frequency: 'Morning before food (1-0-0)', durationDays: 30, instructions: 'Take 30 min before morning meal' },
          { medicineName: 'Rosuvastatin 10mg', dosage: '1 tablet', frequency: 'Bedtime (0-0-1)', durationDays: 90, instructions: 'Take after dinner' },
        ],
      },
    },
  });

  await prisma.labReport.create({
    data: {
      patientId: tariqPatient.id,
      testName: 'Pulmonary Function Test (Spirometry)',
      testCategory: 'PULMONOLOGY',
      sampleDate: new Date('2023-10-12'),
      status: 'COMPLETED',
      resultData: 'FVC: 3.92 L (91% pred) | FEV1: 2.68 L (82% pred) | FEV1/FVC Ratio: 0.68 | Bronchodilator response: +11%',
      remarks: 'Mild obstructive ventilatory defect with partial reversibility.',
    },
  });

  await prisma.medicalRecord.create({
    data: {
      patientId: tariqPatient.id,
      recordType: 'RADIOLOGY',
      title: 'Chest Radiograph & HRCT Thorax Protocol',
      description: 'Lungs hyperinflated. Mild peribronchial thickening without bronchiectasis. Costophrenic angles sharp.',
      recordDate: new Date('2023-10-10'),
      attachmentUrl: '/uploads/chest-xray-sample.jpg',
    },
  });

  // 8. Canonical Demo Patient 5: Priya Sundaram (PS-2026-005)
  const priyaUser = await prisma.user.upsert({
    where: { email: 'priya.sundaram@uhis.org' },
    update: { fullName: 'Priya Sundaram', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98401 77889' },
    create: { fullName: 'Priya Sundaram', email: 'priya.sundaram@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98401 77889' },
  });

  const priyaAllergies = JSON.stringify([
    { id: 'alg-ps1', name: 'Peanuts & Tree Nuts', category: 'FOOD', severity: 'SEVERE', symptoms: 'Laryngeal edema, anaphylaxis', precautions: 'Absolute dietary restriction. Carry autoinjector epinephrine.' },
  ]);

  const priyaPatient = await prisma.patient.upsert({
    where: { userId: priyaUser.id },
    update: {
      abhaId: 'PS-2026-005',
      gender: 'FEMALE',
      dateOfBirth: new Date('1993-11-28'),
      bloodGroup: 'B-',
      address: '14, Anna Nagar 2nd Avenue, Chennai — 600040',
      emergencyContact: 'Karthik Sundaram (Spouse)',
      emergencyPhone: '+91 98401 77889',
      allergies: priyaAllergies,
      chronicConditions: 'Seasonal Allergic Rhinitis, Atopic Eczema, Polycystic Ovary Syndrome (PCOS)',
      pastSurgeries: 'None',
      height: '165 cm',
      weight: '60 kg',
    },
    create: {
      userId: priyaUser.id,
      abhaId: 'PS-2026-005',
      gender: 'FEMALE',
      dateOfBirth: new Date('1993-11-28'),
      bloodGroup: 'B-',
      address: '14, Anna Nagar 2nd Avenue, Chennai — 600040',
      emergencyContact: 'Karthik Sundaram (Spouse)',
      emergencyPhone: '+91 98401 77889',
      allergies: priyaAllergies,
      chronicConditions: 'Seasonal Allergic Rhinitis, Atopic Eczema, Polycystic Ovary Syndrome (PCOS)',
      pastSurgeries: 'None',
      height: '165 cm',
      weight: '60 kg',
    },
  });

  await prisma.diagnosis.deleteMany({ where: { patientId: priyaPatient.id } });
  await prisma.prescription.deleteMany({ where: { patientId: priyaPatient.id } });
  await prisma.labReport.deleteMany({ where: { patientId: priyaPatient.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: priyaPatient.id } });

  await prisma.diagnosis.create({
    data: { patientId: priyaPatient.id, doctorId: primaryDoctor.id, conditionName: 'Allergic Rhinitis & Atopic Dermatitis', icdCode: 'J30.1', severity: 'MODERATE', diagnosedDate: new Date('2020-11-04'), clinicalNotes: 'Perennial nasal congestion with seasonal springtime flares. Eczematous flexural dermatitis.' },
  });
  await prisma.diagnosis.create({
    data: { patientId: priyaPatient.id, doctorId: primaryDoctor.id, conditionName: 'Polycystic Ovary Syndrome (PCOS)', icdCode: 'E28.2', severity: 'MILD', diagnosedDate: new Date('2022-07-19'), clinicalNotes: 'Oligomenorrhea and polycystic morphology on pelvic ultrasound. Managed with Inositol and lifestyle modifications.' },
  });

  await prisma.prescription.create({
    data: {
      patientId: priyaPatient.id,
      doctorId: primaryDoctor.id,
      diagnosisText: 'Allergic Rhinitis & PCOS Posology',
      advice: 'Apply topical emollient immediately post-shower. Regular aerobic exercise.',
      items: {
        create: [
          { medicineName: 'Bilastine 20mg', dosage: '1 tablet', frequency: 'Once daily morning (1-0-0)', durationDays: 30, instructions: 'Non-sedating antihistamine' },
          { medicineName: 'Fluticasone Propionate Nasal Spray', dosage: '1 spray each nostril', frequency: 'Once daily (1-0-0)', durationDays: 60, instructions: 'Spray into each nostril in morning' },
          { medicineName: 'Myo-Inositol + D-Chiro Inositol', dosage: '1 sachet in water', frequency: 'Twice daily (1-0-1)', durationDays: 90, instructions: 'Dissolve in water before meals' },
        ],
      },
    },
  });

  await prisma.labReport.create({
    data: {
      patientId: priyaPatient.id,
      testName: 'Total Serum IgE & Absolute Eosinophil Count',
      testCategory: 'IMMUNOLOGY',
      sampleDate: new Date('2024-01-28'),
      status: 'COMPLETED',
      resultData: 'Total IgE: 242 IU/mL (Elevated, ref <100) | AEC: 480 /uL | Eosinophils: 6.2%',
      remarks: 'Immune profile consistent with active atopic diathesis.',
    },
  });

  await prisma.medicalRecord.create({
    data: {
      patientId: priyaPatient.id,
      recordType: 'CONSULTATION',
      title: 'Allergy & Immunology Comprehensive Panel Note',
      description: 'Skin prick testing positive for dust mites and birch pollen. Antihistamine and nasal steroid regimen reviewed.',
      recordDate: new Date('2024-01-28'),
    },
  });

  // 9. Seed Appointments for Dr. Sharma for all canonical patients
  await prisma.appointment.deleteMany({ where: { doctorId: primaryDoctor.id } });

  const patientQueue = [
    { p: primaryPatient, token: 'T-01', time: '09:00 AM', status: 'in-consultation', reason: 'Asthma flare-up & seasonal cough · 2 days', notes: 'Patient complaining of nocturnal cough' },
    { p: aboliPatient, token: 'T-02', time: '09:30 AM', status: 'waiting', reason: 'Severe unilateral throbbing headache with photophobia · 1 day', notes: 'Migraine follow-up' },
    { p: sunitaPatient, token: 'T-03', time: '10:00 AM', status: 'waiting', reason: 'Chest discomfort and exertion shortness of breath · 3 hours', notes: 'Hypertension & Angina review' },
    { p: tariqPatient, token: 'T-04', time: '10:30 AM', status: 'waiting', reason: 'Persistent productive cough and evening fever · 2 weeks', notes: 'COPD assessment' },
    { p: priyaPatient, token: 'T-05', time: '11:00 AM', status: 'waiting', reason: 'Acute allergic skin rash and facial urticaria · 4 hours', notes: 'Allergy flare' },
  ];

  for (const item of patientQueue) {
    if (item.p) {
      await prisma.appointment.create({
        data: {
          patientId: item.p.id,
          doctorId: primaryDoctor.id,
          hospitalId: hospital.id,
          appointmentDate: new Date(),
          timeSlot: item.time,
          reason: item.reason,
          status: item.status,
          notes: item.notes,
        },
      });
    }
  }

  // 10. Demo Account Pairs for Emergency OTP Demo
  // PAIR 1: doctor22@uhis.org <-> patient22@uhis.org
  const doc22User = await prisma.user.upsert({
    where: { email: 'doctor22@uhis.org' },
    update: { fullName: 'Dr. Rajesh Verma', password: passwordHash, role: 'DOCTOR', isActive: true, phoneNumber: '+91 98221 22001' },
    create: { fullName: 'Dr. Rajesh Verma', email: 'doctor22@uhis.org', password: passwordHash, role: 'DOCTOR', isActive: true, phoneNumber: '+91 98221 22001' },
  });
  const doc22 = await prisma.doctor.upsert({
    where: { userId: doc22User.id },
    update: { specialization: 'Cardiology & Intensive Care', licenseNumber: 'MCI-2026-DOC22', qualification: 'MD, DM (Cardiology)', experienceYears: 14, hospitalId: hospital.id, departmentId: dept.id },
    create: { userId: doc22User.id, specialization: 'Cardiology & Intensive Care', licenseNumber: 'MCI-2026-DOC22', qualification: 'MD, DM (Cardiology)', experienceYears: 14, hospitalId: hospital.id, departmentId: dept.id },
  });

  const pat22User = await prisma.user.upsert({
    where: { email: 'patient22@uhis.org' },
    update: { fullName: 'Rahul Verma', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98112 34567' },
    create: { fullName: 'Rahul Verma', email: 'patient22@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98112 34567' },
  });
  const pat22Allergies = JSON.stringify([
    { id: 'alg-p22-1', name: 'Penicillin', category: 'MEDICINE', severity: 'SEVERE', symptoms: 'Anaphylaxis, acute hives, bronchospasm', precautions: 'Strictly avoid all beta-lactams.' },
    { id: 'alg-p22-2', name: 'Sulfa Drugs', category: 'MEDICINE', severity: 'MODERATE', symptoms: 'Erythematous rash, pruritus', precautions: 'Avoid Trimethoprim-sulfamethoxazole.' },
  ]);
  const pat22 = await prisma.patient.upsert({
    where: { userId: pat22User.id },
    update: {
      abhaId: 'PT-2026-022',
      gender: 'MALE',
      dateOfBirth: new Date('2000-03-14'),
      bloodGroup: 'B+',
      address: 'B-402, Green Valley Apartments, Sarita Vihar, New Delhi',
      emergencyContact: 'Kavita Verma (Spouse)',
      emergencyPhone: '+91 98877 66554',
      allergies: pat22Allergies,
      chronicConditions: 'Asthma (Moderate Persistent), Type 2 Diabetes Mellitus',
      pastSurgeries: 'Appendectomy (2019)',
      height: '176 cm',
      weight: '74 kg',
    },
    create: {
      userId: pat22User.id,
      abhaId: 'PT-2026-022',
      gender: 'MALE',
      dateOfBirth: new Date('2000-03-14'),
      bloodGroup: 'B+',
      address: 'B-402, Green Valley Apartments, Sarita Vihar, New Delhi',
      emergencyContact: 'Kavita Verma (Spouse)',
      emergencyPhone: '+91 98877 66554',
      allergies: pat22Allergies,
      chronicConditions: 'Asthma (Moderate Persistent), Type 2 Diabetes Mellitus',
      pastSurgeries: 'Appendectomy (2019)',
      height: '176 cm',
      weight: '74 kg',
    },
  });


  await prisma.diagnosis.deleteMany({ where: { patientId: pat22.id } });
  await prisma.prescription.deleteMany({ where: { patientId: pat22.id } });
  await prisma.labReport.deleteMany({ where: { patientId: pat22.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: pat22.id } });

  await prisma.diagnosis.create({
    data: { patientId: pat22.id, doctorId: doc22.id, conditionName: 'Asthma (Moderate Persistent)', icdCode: 'J45.40', severity: 'MODERATE', diagnosedDate: new Date('2022-04-10'), clinicalNotes: 'Controlled on inhaled bronchodilator therapy.' },
  });
  await prisma.diagnosis.create({
    data: { patientId: pat22.id, doctorId: doc22.id, conditionName: 'Type 2 Diabetes Mellitus', icdCode: 'E11.9', severity: 'MODERATE', diagnosedDate: new Date('2023-01-15'), clinicalNotes: 'HbA1c 6.8%. Managed with Metformin.' },
  });
  await prisma.prescription.create({
    data: {
      patientId: pat22.id,
      doctorId: doc22.id,
      diagnosisText: 'Asthma & T2DM Maintenance Regimen',
      advice: 'Maintain regular inhaler technique and blood glucose monitoring.',
      items: {
        create: [
          { medicineName: 'Salbutamol 100mcg Inhaler', dosage: '2 puffs', frequency: 'As needed (PRN)', durationDays: 90, instructions: 'Inhale during acute bronchospasm' },
          { medicineName: 'Metformin 500mg', dosage: '1 tab', frequency: 'Morning & Night (1-0-1)', durationDays: 90, instructions: 'Take immediately after meals' },
          { medicineName: 'Montelukast 10mg', dosage: '1 tab', frequency: 'Night (0-0-1)', durationDays: 90, instructions: 'Take at bedtime' },
        ],
      },
    },
  });
  await prisma.labReport.create({
    data: {
      patientId: pat22.id,
      testName: 'Complete Blood Count & HbA1c Panel',
      testCategory: 'HEMATOLOGY',
      sampleDate: new Date('2024-02-18'),
      status: 'COMPLETED',
      resultData: 'Hb: 14.2 g/dL | WBC: 6,800 /mcL | Platelets: 240,000 /mcL | HbA1c: 6.8% | Fasting Glucose: 124 mg/dL',
      remarks: 'Glycemic control stable. Normal blood counts.',
    },
  });
  await prisma.labReport.create({
    data: {
      patientId: pat22.id,
      testName: 'Lipid Profile & Serum Creatinine',
      testCategory: 'BIOCHEMISTRY',
      sampleDate: new Date('2024-02-18'),
      status: 'COMPLETED',
      resultData: 'Total Cholesterol: 188 mg/dL | Triglycerides: 142 mg/dL | HDL: 46 mg/dL | LDL: 114 mg/dL | Creatinine: 0.9 mg/dL',
      remarks: 'Renal function and lipid parameters within normal biological reference limits.',
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: pat22.id,
      recordType: 'RADIOLOGY',
      title: 'Chest X-Ray PA View (Digital Radiography)',
      description: 'Lungs are clear with no focal consolidation, pneumothorax, or pleural effusion. Cardiothoracic ratio is normal.',
      recordDate: new Date('2024-02-20'),
      attachmentUrl: '/uploads/chest-xray-sample.jpg',
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: pat22.id,
      recordType: 'CONSULTATION',
      title: 'Pulmonary Specialist Consultation Note',
      description: 'Comprehensive respiratory assessment. SpO2 98% on room air. Peak Expiratory Flow Rate within normal range.',
      recordDate: new Date('2024-01-10'),
    },
  });


  // PAIR 2: doctor23@uhis.org <-> patient23@uhis.org
  const doc23User = await prisma.user.upsert({
    where: { email: 'doctor23@uhis.org' },
    update: { fullName: 'Dr. Sneha Kulkarni', password: passwordHash, role: 'DOCTOR', isActive: true, phoneNumber: '+91 98221 23001' },
    create: { fullName: 'Dr. Sneha Kulkarni', email: 'doctor23@uhis.org', password: passwordHash, role: 'DOCTOR', isActive: true, phoneNumber: '+91 98221 23001' },
  });
  const doc23 = await prisma.doctor.upsert({
    where: { userId: doc23User.id },
    update: { specialization: 'Pulmonology & Critical Care', licenseNumber: 'MCI-2026-DOC23', qualification: 'MD (Pulmonary Medicine)', experienceYears: 11, hospitalId: hospital.id, departmentId: dept.id },
    create: { userId: doc23User.id, specialization: 'Pulmonology & Critical Care', licenseNumber: 'MCI-2026-DOC23', qualification: 'MD (Pulmonary Medicine)', experienceYears: 11, hospitalId: hospital.id, departmentId: dept.id },
  });

  const pat23User = await prisma.user.upsert({
    where: { email: 'patient23@uhis.org' },
    update: { fullName: 'Ananya Deshmukh', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98221 23002' },
    create: { fullName: 'Ananya Deshmukh', email: 'patient23@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98221 23002' },
  });
  const pat23Allergies = JSON.stringify([{ id: 'alg-p23', name: 'Sulfa Drugs', category: 'MEDICINE', severity: 'MODERATE', symptoms: 'Skin rash & hives' }]);
  const pat23 = await prisma.patient.upsert({
    where: { userId: pat23User.id },
    update: {
      abhaId: 'PT-2026-023',
      gender: 'FEMALE',
      dateOfBirth: new Date('1990-07-22'),
      bloodGroup: 'A+',
      address: '12, MG Road, Pune',
      emergencyContact: 'Aditya Deshmukh (Spouse)',
      emergencyPhone: '+91 98221 23002',
      allergies: pat23Allergies,
      chronicConditions: 'Bronchial Asthma (Moderate)',
      pastSurgeries: 'None',
      height: '160 cm',
      weight: '55 kg',
    },
    create: {
      userId: pat23User.id,
      abhaId: 'PT-2026-023',
      gender: 'FEMALE',
      dateOfBirth: new Date('1990-07-22'),
      bloodGroup: 'A+',
      address: '12, MG Road, Pune',
      emergencyContact: 'Aditya Deshmukh (Spouse)',
      emergencyPhone: '+91 98221 23002',
      allergies: pat23Allergies,
      chronicConditions: 'Bronchial Asthma (Moderate)',
      pastSurgeries: 'None',
      height: '160 cm',
      weight: '55 kg',
    },
  });

  await prisma.diagnosis.deleteMany({ where: { patientId: pat23.id } });
  await prisma.prescription.deleteMany({ where: { patientId: pat23.id } });
  await prisma.labReport.deleteMany({ where: { patientId: pat23.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: pat23.id } });

  await prisma.diagnosis.create({
    data: { patientId: pat23.id, doctorId: doc23.id, conditionName: 'Bronchial Asthma (Moderate Persistent)', icdCode: 'J45.40', severity: 'MODERATE', diagnosedDate: new Date('2023-02-18'), clinicalNotes: 'Exacerbated by seasonal allergens. FEV1 78%.' },
  });
  await prisma.prescription.create({
    data: {
      patientId: pat23.id,
      doctorId: doc23.id,
      diagnosisText: 'Asthma Inhalation Therapy',
      advice: 'Use inhaler with spacer device twice daily.',
      items: {
        create: [
          { medicineName: 'Budesonide 200mcg Inhaler', dosage: '1 puff', frequency: 'Twice daily (1-0-1)', durationDays: 90, instructions: 'Rinse mouth after inhalation' },
          { medicineName: 'Montelukast 10mg', dosage: '1 tab', frequency: 'Bedtime (0-0-1)', durationDays: 60, instructions: 'Take at night' },
        ],
      },
    },
  });
  await prisma.labReport.create({
    data: {
      patientId: pat23.id,
      testName: 'Pulmonary Function Spirometry & Peak Flow',
      testCategory: 'PULMONOLOGY',
      sampleDate: new Date('2023-11-05'),
      status: 'COMPLETED',
      resultData: 'FEV1: 2.1 L (78% predicted) | FVC: 2.8 L (88% predicted) | Post-bronchodilator reversibility: +14%',
      remarks: 'Moderate reversible airway obstruction.',
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: pat23.id,
      recordType: 'RADIOLOGY',
      title: 'Chest Radiography (PA View)',
      description: 'Lungs hyperinflated. Clear lung fields without focal infiltrates.',
      recordDate: new Date('2023-11-05'),
      attachmentUrl: '/uploads/chest-xray-sample.jpg',
    },
  });

  // PAIR 3: doctor24@uhis.org <-> patient24@uhis.org
  const doc24User = await prisma.user.upsert({
    where: { email: 'doctor24@uhis.org' },
    update: { fullName: 'Dr. Amit Sen', password: passwordHash, role: 'DOCTOR', isActive: true, phoneNumber: '+91 98221 24001' },
    create: { fullName: 'Dr. Amit Sen', email: 'doctor24@uhis.org', password: passwordHash, role: 'DOCTOR', isActive: true, phoneNumber: '+91 98221 24001' },
  });
  const doc24 = await prisma.doctor.upsert({
    where: { userId: doc24User.id },
    update: { specialization: 'Neurology & Neuro-Rehabilitation', licenseNumber: 'MCI-2026-DOC24', qualification: 'MD, DM (Neurology)', experienceYears: 18, hospitalId: hospital.id, departmentId: dept.id },
    create: { userId: doc24User.id, specialization: 'Neurology & Neuro-Rehabilitation', licenseNumber: 'MCI-2026-DOC24', qualification: 'MD, DM (Neurology)', experienceYears: 18, hospitalId: hospital.id, departmentId: dept.id },
  });

  const pat24User = await prisma.user.upsert({
    where: { email: 'patient24@uhis.org' },
    update: { fullName: 'Priya Sharma', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98233 44556' },
    create: { fullName: 'Priya Sharma', email: 'patient24@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98233 44556' },
  });
  const pat24Allergies = JSON.stringify([{ id: 'alg-p24', name: 'NSAIDs (Ibuprofen)', category: 'MEDICINE', severity: 'MODERATE', symptoms: 'Gastric pain & heartburn' }]);
  const pat24 = await prisma.patient.upsert({
    where: { userId: pat24User.id },
    update: {
      abhaId: 'PT-2026-024',
      gender: 'FEMALE',
      dateOfBirth: new Date('1997-08-24'),
      bloodGroup: 'O+',
      address: '88, Viman Nagar, Pune',
      emergencyContact: 'Raj Sharma (Brother)',
      emergencyPhone: '+91 98233 44556',
      allergies: pat24Allergies,
      chronicConditions: 'Chronic Migraine with Aura',
      pastSurgeries: 'None',
      height: '160 cm',
      weight: '54 kg',
    },
    create: {
      userId: pat24User.id,
      abhaId: 'PT-2026-024',
      gender: 'FEMALE',
      dateOfBirth: new Date('1997-08-24'),
      bloodGroup: 'O+',
      address: '88, Viman Nagar, Pune',
      emergencyContact: 'Raj Sharma (Brother)',
      emergencyPhone: '+91 98233 44556',
      allergies: pat24Allergies,
      chronicConditions: 'Chronic Migraine with Aura',
      pastSurgeries: 'None',
      height: '160 cm',
      weight: '54 kg',
    },
  });

  await prisma.diagnosis.deleteMany({ where: { patientId: pat24.id } });
  await prisma.prescription.deleteMany({ where: { patientId: pat24.id } });
  await prisma.labReport.deleteMany({ where: { patientId: pat24.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: pat24.id } });

  await prisma.diagnosis.create({
    data: { patientId: pat24.id, doctorId: doc24.id, conditionName: 'Chronic Migraine with Photophobia', icdCode: 'G43.909', severity: 'MODERATE', diagnosedDate: new Date('2023-05-12'), clinicalNotes: 'Unilateral pulsating headache triggered by stress and bright light.' },
  });
  await prisma.prescription.create({
    data: {
      patientId: pat24.id,
      doctorId: doc24.id,
      diagnosisText: 'Migraine Prophylaxis & Acute Abortive Regimen',
      advice: 'Avoid known triggers, maintain sleep hygiene.',
      items: {
        create: [
          { medicineName: 'Sumatriptan 50mg', dosage: '1 tab', frequency: 'At onset of aura (PRN)', durationDays: 30, instructions: 'Take with full glass of water' },
          { medicineName: 'Propranolol 40mg', dosage: '1 tab', frequency: 'Daily morning (1-0-0)', durationDays: 90, instructions: 'Preventative daily dose' },
        ],
      },
    },
  });
  await prisma.labReport.create({
    data: {
      patientId: pat24.id,
      testName: 'Complete Blood Count & Serum Ferritin',
      testCategory: 'HEMATOLOGY',
      sampleDate: new Date('2023-12-10'),
      status: 'COMPLETED',
      resultData: 'Hb: 12.8 g/dL | Ferritin: 45 ng/mL | Platelets: 280,000 /mcL',
      remarks: 'Hematological parameters within normal limits.',
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: pat24.id,
      recordType: 'RADIOLOGY',
      title: 'MRI Brain Non-Contrast',
      description: 'Normal brain parenchyma. No acute intracranial hemorrhage or mass effect.',
      recordDate: new Date('2023-05-12'),
      attachmentUrl: '/uploads/chest-xray-sample.jpg',
    },
  });

  // PATIENT 25: Amit Kulkarni (PT-2026-025)
  const pat25User = await prisma.user.upsert({
    where: { email: 'patient25@uhis.org' },
    update: { fullName: 'Amit Kulkarni', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98111 22334' },
    create: { fullName: 'Amit Kulkarni', email: 'patient25@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98111 22334' },
  });
  const pat25Allergies = JSON.stringify([{ id: 'alg-p25', name: 'Aspirin', category: 'MEDICINE', severity: 'MILD', symptoms: 'Urticaria' }]);
  const pat25 = await prisma.patient.upsert({
    where: { userId: pat25User.id },
    update: {
      abhaId: 'PT-2026-025',
      gender: 'MALE',
      dateOfBirth: new Date('1984-02-12'),
      bloodGroup: 'B+',
      address: '24, Baner Road, Pune',
      emergencyContact: 'Pooja Kulkarni (Spouse)',
      emergencyPhone: '+91 98111 22334',
      allergies: pat25Allergies,
      chronicConditions: 'Essential Hypertension (Stage 2)',
      pastSurgeries: 'None',
      height: '174 cm',
      weight: '78 kg',
    },
    create: {
      userId: pat25User.id,
      abhaId: 'PT-2026-025',
      gender: 'MALE',
      dateOfBirth: new Date('1984-02-12'),
      bloodGroup: 'B+',
      address: '24, Baner Road, Pune',
      emergencyContact: 'Pooja Kulkarni (Spouse)',
      emergencyPhone: '+91 98111 22334',
      allergies: pat25Allergies,
      chronicConditions: 'Essential Hypertension (Stage 2)',
      pastSurgeries: 'None',
      height: '174 cm',
      weight: '78 kg',
    },
  });
  await prisma.diagnosis.deleteMany({ where: { patientId: pat25.id } });
  await prisma.prescription.deleteMany({ where: { patientId: pat25.id } });
  await prisma.labReport.deleteMany({ where: { patientId: pat25.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: pat25.id } });
  await prisma.diagnosis.create({
    data: { patientId: pat25.id, doctorId: doc22.id, conditionName: 'Primary Essential Hypertension', icdCode: 'I10', severity: 'MODERATE', diagnosedDate: new Date('2022-09-14'), clinicalNotes: 'Average clinic BP 148/92 mmHg.' },
  });
  await prisma.prescription.create({
    data: {
      patientId: pat25.id,
      doctorId: doc22.id,
      diagnosisText: 'Antihypertensive Maintenance Therapy',
      advice: 'Low sodium diet, daily 30 min brisk walk.',
      items: {
        create: [
          { medicineName: 'Telmisartan 40mg', dosage: '1 tab', frequency: 'Morning (1-0-0)', durationDays: 90, instructions: 'Take with breakfast' },
          { medicineName: 'Amlodipine 5mg', dosage: '1 tab', frequency: 'Night (0-0-1)', durationDays: 90, instructions: 'Take at bedtime' },
        ],
      },
    },
  });
  await prisma.labReport.create({
    data: {
      patientId: pat25.id,
      testName: 'Renal Function & Electrolytes Panel',
      testCategory: 'BIOCHEMISTRY',
      sampleDate: new Date('2024-01-20'),
      status: 'COMPLETED',
      resultData: 'Serum Creatinine: 1.0 mg/dL | eGFR: >90 mL/min | Potassium: 4.4 mmol/L | Sodium: 139 mmol/L',
      remarks: 'Normal renal biochemistry and electrolyte balance.',
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: pat25.id,
      recordType: 'RADIOLOGY',
      title: 'Echocardiogram 2D Doppler',
      description: 'Concentric left ventricular hypertrophy. Ejection fraction 62%. Normal diastolic filling.',
      recordDate: new Date('2024-01-20'),
      attachmentUrl: '/uploads/chest-xray-sample.jpg',
    },
  });

  // PATIENT 26: Sneha Deshmukh (PT-2026-026)
  const pat26User = await prisma.user.upsert({
    where: { email: 'patient26@uhis.org' },
    update: { fullName: 'Sneha Deshmukh', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98444 55667' },
    create: { fullName: 'Sneha Deshmukh', email: 'patient26@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98444 55667' },
  });
  const pat26Allergies = JSON.stringify([]);
  const pat26 = await prisma.patient.upsert({
    where: { userId: pat26User.id },
    update: {
      abhaId: 'PT-2026-026',
      gender: 'FEMALE',
      dateOfBirth: new Date('1995-10-30'),
      bloodGroup: 'AB+',
      address: '15, Kothrud, Pune',
      emergencyContact: 'Anand Deshmukh (Father)',
      emergencyPhone: '+91 98444 55667',
      allergies: pat26Allergies,
      chronicConditions: 'Type 2 Diabetes Mellitus',
      pastSurgeries: 'None',
      height: '162 cm',
      weight: '59 kg',
    },
    create: {
      userId: pat26User.id,
      abhaId: 'PT-2026-026',
      gender: 'FEMALE',
      dateOfBirth: new Date('1995-10-30'),
      bloodGroup: 'AB+',
      address: '15, Kothrud, Pune',
      emergencyContact: 'Anand Deshmukh (Father)',
      emergencyPhone: '+91 98444 55667',
      allergies: pat26Allergies,
      chronicConditions: 'Type 2 Diabetes Mellitus',
      pastSurgeries: 'None',
      height: '162 cm',
      weight: '59 kg',
    },
  });
  await prisma.diagnosis.deleteMany({ where: { patientId: pat26.id } });
  await prisma.prescription.deleteMany({ where: { patientId: pat26.id } });
  await prisma.labReport.deleteMany({ where: { patientId: pat26.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: pat26.id } });
  await prisma.diagnosis.create({
    data: { patientId: pat26.id, doctorId: doc22.id, conditionName: 'Type 2 Diabetes Mellitus without complications', icdCode: 'E11.9', severity: 'MILD', diagnosedDate: new Date('2023-04-10'), clinicalNotes: 'Good glycemic control on oral hypoglycemics.' },
  });
  await prisma.prescription.create({
    data: {
      patientId: pat26.id,
      doctorId: doc22.id,
      diagnosisText: 'Oral Hypoglycemic Maintenance',
      advice: 'Dietary carbohydrate restriction.',
      items: {
        create: [
          { medicineName: 'Metformin 500mg SR', dosage: '1 tab', frequency: 'Twice daily with meals (1-0-1)', durationDays: 90, instructions: 'Take after meals' },
        ],
      },
    },
  });
  await prisma.labReport.create({
    data: {
      patientId: pat26.id,
      testName: 'Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose',
      testCategory: 'BIOCHEMISTRY',
      sampleDate: new Date('2024-02-15'),
      status: 'COMPLETED',
      resultData: 'HbA1c: 6.4% | Fasting Glucose: 112 mg/dL | Postprandial Glucose: 138 mg/dL',
      remarks: 'Glycemic targets well achieved.',
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: pat26.id,
      recordType: 'CONSULTATION',
      title: 'Endocrine & Nutritional Evaluation',
      description: 'Routine quarterly diabetes checkup. BMI 22.5 kg/m2.',
      recordDate: new Date('2024-02-15'),
    },
  });

  // PATIENT 27: Arjun Mehta (PT-2026-027)
  const pat27User = await prisma.user.upsert({
    where: { email: 'patient27@uhis.org' },
    update: { fullName: 'Arjun Mehta', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98555 66778' },
    create: { fullName: 'Arjun Mehta', email: 'patient27@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98555 66778' },
  });
  const pat27Allergies = JSON.stringify([{ id: 'alg-p27', name: 'Contrast Dye', category: 'OTHER', severity: 'SEVERE', symptoms: 'Anaphylactoid reaction' }]);
  const pat27 = await prisma.patient.upsert({
    where: { userId: pat27User.id },
    update: {
      abhaId: 'PT-2026-027',
      gender: 'MALE',
      dateOfBirth: new Date('1978-06-15'),
      bloodGroup: 'O+',
      address: '77, Kalyani Nagar, Pune',
      emergencyContact: 'Sunita Mehta (Spouse)',
      emergencyPhone: '+91 98555 66778',
      allergies: pat27Allergies,
      chronicConditions: 'Coronary Artery Disease, Stable Angina',
      pastSurgeries: 'Percutaneous Coronary Intervention (2021)',
      height: '178 cm',
      weight: '84 kg',
    },
    create: {
      userId: pat27User.id,
      abhaId: 'PT-2026-027',
      gender: 'MALE',
      dateOfBirth: new Date('1978-06-15'),
      bloodGroup: 'O+',
      address: '77, Kalyani Nagar, Pune',
      emergencyContact: 'Sunita Mehta (Spouse)',
      emergencyPhone: '+91 98555 66778',
      allergies: pat27Allergies,
      chronicConditions: 'Coronary Artery Disease, Stable Angina',
      pastSurgeries: 'Percutaneous Coronary Intervention (2021)',
      height: '178 cm',
      weight: '84 kg',
    },
  });
  await prisma.diagnosis.deleteMany({ where: { patientId: pat27.id } });
  await prisma.prescription.deleteMany({ where: { patientId: pat27.id } });
  await prisma.labReport.deleteMany({ where: { patientId: pat27.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: pat27.id } });
  await prisma.diagnosis.create({
    data: { patientId: pat27.id, doctorId: doc22.id, conditionName: 'Chronic Ischemic Heart Disease / Stable Angina', icdCode: 'I25.9', severity: 'SEVERE', diagnosedDate: new Date('2021-08-10'), clinicalNotes: 'Exertional substernal discomfort relieved by rest.' },
  });
  await prisma.prescription.create({
    data: {
      patientId: pat27.id,
      doctorId: doc22.id,
      diagnosisText: 'Anti-Anginal & Antiplatelet Secondary Prevention',
      advice: 'Immediate sublingual nitrate if chest pain > 5 min.',
      items: {
        create: [
          { medicineName: 'Atorvastatin 40mg', dosage: '1 tab', frequency: 'Bedtime (0-0-1)', durationDays: 90, instructions: 'Take before sleep' },
          { medicineName: 'Clopidogrel 75mg', dosage: '1 tab', frequency: 'Morning (1-0-0)', durationDays: 90, instructions: 'Antiplatelet maintenance' },
          { medicineName: 'Metoprolol Succinate 50mg', dosage: '1 tab', frequency: 'Morning (1-0-0)', durationDays: 90, instructions: 'Beta blocker cardio-protection' },
        ],
      },
    },
  });
  await prisma.labReport.create({
    data: {
      patientId: pat27.id,
      testName: 'Cardiac Troponin-I & Lipid Extended Panel',
      testCategory: 'CARDIOLOGY',
      sampleDate: new Date('2024-02-10'),
      status: 'COMPLETED',
      resultData: 'Troponin-I: <0.01 ng/mL (Negative) | Total Chol: 154 mg/dL | LDL: 68 mg/dL | HDL: 48 mg/dL',
      remarks: 'No acute myocardial necrosis. Target LDL < 70 achieved.',
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: pat27.id,
      recordType: 'RADIOLOGY',
      title: 'Coronary CT Angiography (Non-Contrast Calcium Score)',
      description: 'LAD stent patent. Agatston calcium score 120 (Moderate).',
      recordDate: new Date('2024-02-10'),
      attachmentUrl: '/uploads/chest-xray-sample.jpg',
    },
  });

  // PATIENT 28: Neha Joshi (PT-2026-028)
  const pat28User = await prisma.user.upsert({
    where: { email: 'patient28@uhis.org' },
    update: { fullName: 'Neha Joshi', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98666 77889' },
    create: { fullName: 'Neha Joshi', email: 'patient28@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98666 77889' },
  });
  const pat28 = await prisma.patient.upsert({
    where: { userId: pat28User.id },
    update: {
      abhaId: 'PT-2026-028',
      gender: 'FEMALE',
      dateOfBirth: new Date('1988-04-20'),
      bloodGroup: 'A-',
      address: '52, Model Colony, Pune',
      emergencyContact: 'Vikas Joshi (Spouse)',
      emergencyPhone: '+91 98666 77889',
      allergies: JSON.stringify([]),
      chronicConditions: 'Lumbar Spondylosis with L5-S1 Radiculopathy',
      pastSurgeries: 'None',
      height: '165 cm',
      weight: '63 kg',
    },
    create: {
      userId: pat28User.id,
      abhaId: 'PT-2026-028',
      gender: 'FEMALE',
      dateOfBirth: new Date('1988-04-20'),
      bloodGroup: 'A-',
      address: '52, Model Colony, Pune',
      emergencyContact: 'Vikas Joshi (Spouse)',
      emergencyPhone: '+91 98666 77889',
      allergies: JSON.stringify([]),
      chronicConditions: 'Lumbar Spondylosis with L5-S1 Radiculopathy',
      pastSurgeries: 'None',
      height: '165 cm',
      weight: '63 kg',
    },
  });
  await prisma.diagnosis.deleteMany({ where: { patientId: pat28.id } });
  await prisma.prescription.deleteMany({ where: { patientId: pat28.id } });
  await prisma.labReport.deleteMany({ where: { patientId: pat28.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: pat28.id } });
  await prisma.diagnosis.create({
    data: { patientId: pat28.id, doctorId: doc22.id, conditionName: 'Lumbar Disc Herniation with Sciatica', icdCode: 'M51.16', severity: 'MODERATE', diagnosedDate: new Date('2023-07-15'), clinicalNotes: 'L5-S1 disc protrusion causing left leg radicular pain.' },
  });
  await prisma.prescription.create({
    data: {
      patientId: pat28.id,
      doctorId: doc22.id,
      diagnosisText: 'Spinal Radiculopathy & Neuro-Analgesic Regimen',
      advice: 'Core strengthening exercises, lumbar support belt.',
      items: {
        create: [
          { medicineName: 'Gabapentin 300mg', dosage: '1 tab', frequency: 'Night (0-0-1)', durationDays: 60, instructions: 'Take at bedtime' },
          { medicineName: 'Paracetamol 650mg', dosage: '1 tab', frequency: 'As needed (PRN)', durationDays: 30, instructions: 'For pain flare-ups' },
        ],
      },
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: pat28.id,
      recordType: 'RADIOLOGY',
      title: 'MRI Lumbar Spine (L1-S1)',
      description: 'L5-S1 left posterolateral disc protrusion indenting the left descending S1 nerve root.',
      recordDate: new Date('2023-07-15'),
      attachmentUrl: '/uploads/chest-xray-sample.jpg',
    },
  });

  // PATIENT 29: Karan Shah (PT-2026-029)
  const pat29User = await prisma.user.upsert({
    where: { email: 'patient29@uhis.org' },
    update: { fullName: 'Karan Shah', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98777 88990' },
    create: { fullName: 'Karan Shah', email: 'patient29@uhis.org', password: passwordHash, role: 'PATIENT', isActive: true, phoneNumber: '+91 98777 88990' },
  });
  const pat29 = await prisma.patient.upsert({
    where: { userId: pat29User.id },
    update: {
      abhaId: 'PT-2026-029',
      gender: 'MALE',
      dateOfBirth: new Date('1981-12-05'),
      bloodGroup: 'B-',
      address: '33, Shivaji Nagar, Pune',
      emergencyContact: 'Rina Shah (Spouse)',
      emergencyPhone: '+91 98777 88990',
      allergies: JSON.stringify([]),
      chronicConditions: 'None (Executive Health Screen)',
      pastSurgeries: 'None',
      height: '175 cm',
      weight: '76 kg',
    },
    create: {
      userId: pat29User.id,
      abhaId: 'PT-2026-029',
      gender: 'MALE',
      dateOfBirth: new Date('1981-12-05'),
      bloodGroup: 'B-',
      address: '33, Shivaji Nagar, Pune',
      emergencyContact: 'Rina Shah (Spouse)',
      emergencyPhone: '+91 98777 88990',
      allergies: JSON.stringify([]),
      chronicConditions: 'None (Executive Health Screen)',
      pastSurgeries: 'None',
      height: '175 cm',
      weight: '76 kg',
    },
  });
  await prisma.diagnosis.deleteMany({ where: { patientId: pat29.id } });
  await prisma.prescription.deleteMany({ where: { patientId: pat29.id } });
  await prisma.labReport.deleteMany({ where: { patientId: pat29.id } });
  await prisma.medicalRecord.deleteMany({ where: { patientId: pat29.id } });
  await prisma.diagnosis.create({
    data: { patientId: pat29.id, doctorId: doc22.id, conditionName: 'Annual Executive Health Screening', icdCode: 'Z00.00', severity: 'MILD', diagnosedDate: new Date('2024-01-05'), clinicalNotes: 'Routine annual checkup. All vital signs normal.' },
  });
  await prisma.labReport.create({
    data: {
      patientId: pat29.id,
      testName: 'Executive Comprehensive Wellness Panel (CBC, LFT, KFT, Lipids)',
      testCategory: 'BIOCHEMISTRY',
      sampleDate: new Date('2024-01-05'),
      status: 'COMPLETED',
      resultData: 'Hb: 15.1 g/dL | Fasting Glucose: 92 mg/dL | Total Chol: 172 mg/dL | Serum Creatinine: 0.88 mg/dL | SGOT: 24 U/L | SGPT: 28 U/L',
      remarks: 'All parameters within optimal reference ranges.',
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: pat29.id,
      recordType: 'CONSULTATION',
      title: 'Executive Wellness Summary',
      description: 'Comprehensive annual medical examination completed. Patient in excellent health.',
      recordDate: new Date('2024-01-05'),
    },
  });

  // Seed Full 8-Patient OPD Appointments for Demo Doctors
  const allPatients = [
    { p: pat22, token: 'T-01', time: '09:00 AM', reason: 'Cardiology follow-up & seasonal cough', priority: 'urgent', status: 'in-consultation', notes: 'Evaluating CAD stent patency and cough.' },
    { p: pat23, token: 'T-02', time: '09:30 AM', reason: 'High grade fever & chills · 2 days', priority: 'routine', status: 'waiting', notes: 'Acute febrile illness evaluation.' },
    { p: pat24, token: 'T-03', time: '10:00 AM', reason: 'Throbbing unilateral migraine & photophobia', priority: 'routine', status: 'waiting', notes: 'Neurology consult for migraine prophylaxis.' },
    { p: pat25, token: 'T-04', time: '10:30 AM', reason: 'Essential hypertension follow-up & BP check', priority: 'routine', status: 'waiting', notes: 'Hypertension maintenance.' },
    { p: pat26, token: 'T-05', time: '11:00 AM', reason: 'Type 2 Diabetes follow-up & HbA1c review', priority: 'routine', status: 'waiting', notes: 'Quarterly diabetic evaluation.' },
    { p: pat27, token: 'T-06', time: '11:30 AM', reason: 'Substernal chest discomfort & exertional dyspnea', priority: 'urgent', status: 'waiting', notes: 'Urgent cardiology evaluation.' },
    { p: pat28, token: 'T-07', time: '12:00 PM', reason: 'Chronic lumbar back pain & radiculopathy', priority: 'routine', status: 'waiting', notes: 'Orthopedic and pain management.' },
    { p: pat29, token: 'T-08', time: '12:30 PM', reason: 'Annual routine executive health checkup', priority: 'routine', status: 'waiting', notes: 'Executive wellness screening.' },
  ];

  const doctorsToSeed = [doc22, primaryDoctor, doc23, doc24].filter(Boolean);
  for (const doc of doctorsToSeed) {
    await prisma.appointment.deleteMany({ where: { doctorId: doc.id } });
    for (const apt of allPatients) {
      await prisma.appointment.create({
        data: {
          patientId: apt.p.id,
          doctorId: doc.id,
          hospitalId: hospital.id,
          appointmentDate: new Date(),
          timeSlot: apt.time,
          reason: apt.reason,
          status: apt.status,
          notes: apt.notes,
        },
      });
    }
  }

  console.log('✅ Canonical & Demo Doctor/Patient Pairs successfully seeded in SQLite:');
  console.log(`   T-01: Rahul Verma (patient22@uhis.org) - PT-2026-022`);
  console.log(`   T-02: Ramesh Patil (patient23@uhis.org) - PT-2026-023`);
  console.log(`   T-03: Priya Sharma (patient24@uhis.org) - PT-2026-024`);
  console.log(`   T-04: Amit Kulkarni (patient25@uhis.org) - PT-2026-025`);
  console.log(`   T-05: Sneha Deshmukh (patient26@uhis.org) - PT-2026-026`);
  console.log(`   T-06: Arjun Mehta (patient27@uhis.org) - PT-2026-027`);
  console.log(`   T-07: Neha Joshi (patient28@uhis.org) - PT-2026-028`);
  console.log(`   T-08: Karan Shah (patient29@uhis.org) - PT-2026-029`);

  await prisma.$disconnect();
}

seedCanonical().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});



