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

  // 2. Ensure Main Hospital (AIIMS New Delhi)
  let hospital = await prisma.hospital.findFirst({
    where: { name: 'AIIMS New Delhi' }
  });
  if (!hospital) {
    hospital = await prisma.hospital.findFirst();
  }
  if (!hospital) {
    hospital = await prisma.hospital.create({
      data: {
        name: 'AIIMS New Delhi',
        code: 'AIIMS-ND',
        address: 'Ansari Nagar East, New Delhi — 110029',
        city: 'New Delhi',
        state: 'Delhi',
        contactNo: '+91 11 26588500',
        email: 'info@aiims.edu',
      }
    });
  }

  // 3. Ensure Doctor (Dr. Anita Desai - Internal Medicine)
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
            qualification: 'MBBS, MD (General Medicine)',
            experienceYears: 14,
            consultationFee: 800,
          }
        }
      },
      include: { doctorProfile: true }
    });
    console.log('✅ Created demo doctor: Dr. Anita Desai (doctor@uhis.gov.in)');
  }

  // 4. Ensure Eye Specialist Doctor (Dr. Kavita Singhal - Ophthalmology)
  let eyeDoctorUser = await prisma.user.findUnique({
    where: { email: 'dr.kavita@uhis.gov.in' },
    include: { doctorProfile: true }
  });
  if (!eyeDoctorUser) {
    eyeDoctorUser = await prisma.user.create({
      data: {
        fullName: 'Dr. Kavita Singhal',
        email: 'dr.kavita@uhis.gov.in',
        password: commonPassword,
        role: 'DOCTOR',
        phoneNumber: '+91 98111 55667',
        doctorProfile: {
          create: {
            hospitalId: hospital.id,
            specialization: 'Ophthalmology & Retina',
            licenseNumber: 'MCI-18820',
            qualification: 'MBBS, MS (Ophthalmology), FICO',
            experienceYears: 11,
            consultationFee: 900,
          }
        }
      },
      include: { doctorProfile: true }
    });
  }

  // 5. Seed Rahul Verma's Completed Doctor Visits (Doctor Visit Timeline)
  if (rahul.patientProfile) {
    const patientId = rahul.patientProfile.id;
    const existingAppts = await prisma.appointment.count({ where: { patientId } });

    if (existingAppts === 0) {
      console.log('🏥 Seeding rich historical doctor visits for Rahul Verma...');

      // VISIT 1 (Most Recent): 15 Aug 2026 10:30 AM - Dr. Anita Desai (Chronic Care Review)
      const appt1 = await prisma.appointment.create({
        data: {
          patientId,
          doctorId: doctor.doctorProfile.id,
          hospitalId: hospital.id,
          appointmentDate: new Date('2026-08-15T10:30:00.000Z'),
          timeSlot: '10:30 AM',
          reason: '6-monthly comprehensive Diabetes Mellitus & Hypertension review; reporting mild afternoon fatigue.',
          status: 'COMPLETED',
          notes: JSON.stringify({
            chiefComplaint: '6-monthly comprehensive Diabetes Mellitus & Hypertension review; reporting mild afternoon fatigue.',
            symptoms: ['Mild afternoon fatigue', 'No chest discomfort', 'No palpitations', 'No shortness of breath'],
            findings: 'Patient alert and oriented. Bilateral vesicular breath sounds clear. Normal heart sounds S1/S2 without murmurs. No peripheral pedal edema. Bilateral pedal pulses intact.',
            diagnosis: 'Type 2 Diabetes Mellitus (Controlled) & Essential Hypertension (Grade I)',
            icdCode: 'E11.9 / I10',
            severity: 'MODERATE',
            vitals: {
              bp: '128/82 mmHg',
              pulse: '72 bpm',
              temp: '98.4 °F',
              spo2: '99%',
              weight: '74 kg',
              height: '176 cm'
            },
            testsRecommended: ['HbA1c Glycated Hemoglobin', 'Fasting Blood Sugar (FBS)', 'Lipid Profile', 'Urine Albumin-to-Creatinine Ratio (UACR)'],
            doctorNotes: 'Glycemic control and blood pressure are satisfactory. Continue current oral hypoglycemic and anti-hypertensive regimen. Maintain 30 mins brisk walking 5 days/week. Restrict dietary sodium (<2g/day) and processed carbohydrates.',
            followUp: '2026-11-15 (in 3 months with repeat HbA1c and lipid report)'
          })
        }
      });

      const rx1 = await prisma.prescription.create({
        data: {
          appointmentId: appt1.id,
          patientId,
          doctorId: doctor.doctorProfile.id,
          diagnosisText: 'Type 2 Diabetes Mellitus (Controlled), Essential Hypertension',
          advice: 'Continue strict diabetic diet, low salt intake, and regular home blood pressure monitoring.',
          validUntil: new Date('2026-11-15'),
          items: {
            create: [
              {
                medicineName: 'Metformin 500mg',
                dosage: '500mg',
                frequency: '1-0-1 (Twice daily with meals)',
                durationDays: 90,
                instructions: 'Take immediately after breakfast and dinner. Do not skip meals.'
              },
              {
                medicineName: 'Telmisartan 40mg',
                dosage: '40mg',
                frequency: '1-0-0 (Morning after breakfast)',
                durationDays: 90,
                instructions: 'Take consistently at same time each morning. Monitor BP weekly.'
              },
              {
                medicineName: 'Atorvastatin 10mg',
                dosage: '10mg',
                frequency: '0-0-1 (Night before sleep)',
                durationDays: 90,
                instructions: 'Take at bedtime. Avoid grapefruit juice.'
              }
            ]
          }
        }
      });

      await prisma.diagnosis.create({
        data: {
          patientId,
          doctorId: doctor.doctorProfile.id,
          conditionName: 'Type 2 Diabetes Mellitus (Controlled)',
          icdCode: 'E11.9',
          severity: 'MODERATE',
          clinicalNotes: 'HbA1c 6.8% (Target <7.0%). Well controlled on Metformin 500mg BD.',
          diagnosedDate: new Date('2026-08-15T10:30:00.000Z')
        }
      });

      // VISIT 2: 10 May 2026 11:15 AM - Dr. Anita Desai (Acute Upper Respiratory & Allergy)
      const appt2 = await prisma.appointment.create({
        data: {
          patientId,
          doctorId: doctor.doctorProfile.id,
          hospitalId: hospital.id,
          appointmentDate: new Date('2026-05-10T11:15:00.000Z'),
          timeSlot: '11:15 AM',
          reason: 'Acute upper respiratory symptoms, nasal congestion, dry cough & mild fever for 3 days.',
          status: 'COMPLETED',
          notes: JSON.stringify({
            chiefComplaint: 'Acute upper respiratory congestion, rhinorrhea, frequent sneezing, dry throat, and low-grade fever for 3 days.',
            symptoms: ['Nasal congestion & rhinorrhea', 'Sore throat & dry cough', 'Episodic sneezing', 'Body aches', 'Mild fever (100.1 °F)'],
            findings: 'Mild pharyngeal erythema, tonsils non-hypertrophied with no exudates. Chest auscultation reveals clear vesicular sounds bilaterally, no wheeze or crepitations. Tympanic membranes pearly grey.',
            diagnosis: 'Acute Viral Rhinosinusitis & Seasonal Allergic Rhinitis Flare-up',
            icdCode: 'J01.90 / J30.1',
            severity: 'MILD',
            vitals: {
              bp: '132/86 mmHg',
              pulse: '84 bpm',
              temp: '100.1 °F',
              spo2: '98%',
              weight: '74.5 kg',
              height: '176 cm'
            },
            testsRecommended: ['Complete Blood Count (CBC) if symptoms worsen or persist > 5 days'],
            doctorNotes: 'Steam inhalation twice daily. Warm saline gargles 3-4 times daily. High fluid intake (2.5L warm water/broths). 3 days rest. STRICT WARNING: Patient has severe Penicillin allergy on record — beta-lactam antibiotics strictly avoided.',
            followUp: 'SOS if fever exceeds 101°F or shortness of breath occurs; otherwise review in 1 week if unresolved.'
          })
        }
      });

      await prisma.prescription.create({
        data: {
          appointmentId: appt2.id,
          patientId,
          doctorId: doctor.doctorProfile.id,
          diagnosisText: 'Acute Viral Rhinosinusitis & Seasonal Allergic Rhinitis',
          advice: 'Steam inhalation twice daily. Rest and avoid cold exposures.',
          validUntil: new Date('2026-05-20'),
          items: {
            create: [
              {
                medicineName: 'Paracetamol 650mg (Dolo)',
                dosage: '650mg',
                frequency: '1-0-1 (Twice daily after food / SOS)',
                durationDays: 5,
                instructions: 'Take after food for fever or body ache. Maximum 3 tablets in 24 hours.'
              },
              {
                medicineName: 'Montelukast + Levocetirizine (10mg/5mg)',
                dosage: '1 tablet',
                frequency: '0-0-1 (Night before sleep)',
                durationDays: 10,
                instructions: 'Take at night. May cause mild drowsiness. Relieves nasal allergy symptoms.'
              },
              {
                medicineName: 'Saline Nasal Spray (0.9% NaCl)',
                dosage: '2 puffs each nostril',
                frequency: 'Three times daily',
                durationDays: 7,
                instructions: 'Administer 5 minutes prior to steam inhalation.'
              }
            ]
          }
        }
      });

      // VISIT 3: 22 Jan 2026 03:00 PM - Dr. Kavita Singhal (Diabetic Eye & Retinal Screening)
      const appt3 = await prisma.appointment.create({
        data: {
          patientId,
          doctorId: eyeDoctorUser.doctorProfile.id,
          hospitalId: hospital.id,
          appointmentDate: new Date('2026-01-22T15:00:00.000Z'),
          timeSlot: '03:00 PM',
          reason: 'Annual diabetic retinal evaluation & routine visual acuity checkup.',
          status: 'COMPLETED',
          notes: JSON.stringify({
            chiefComplaint: 'Annual diabetic eye examination and screen for diabetic retinopathy. Reports mild screen-induced digital eye strain.',
            symptoms: ['Mild digital eye strain after prolonged computer use', 'No blurring of vision', 'No floaters or flashes', 'No eye pain'],
            findings: 'Visual Acuity: 6/6 OU with existing corrective spectacle lenses. Intraocular Pressure (IOP): 14 mmHg OD, 15 mmHg OS (Normal <21). Dilated Fundus Examination: Sharp optic disc margins, cup-to-disc ratio 0.3 bilaterally. Macula healthy, no microaneurysms, blot hemorrhages, or exudates. Retinal vasculature normal.',
            diagnosis: 'Diabetic Retinopathy Screening — Normal (No Diabetic Microvascular Lesions OU)',
            icdCode: 'Z13.5',
            severity: 'MILD',
            vitals: {
              bp: '130/84 mmHg',
              pulse: '76 bpm',
              temp: '98.6 °F',
              spo2: '99%',
              weight: '75 kg',
              height: '176 cm'
            },
            testsRecommended: ['Annual Dilated Fundus Screening in 12 months (Jan 2027)'],
            doctorNotes: 'Retina is healthy with zero diabetic microvascular retinopathy changes. Advised 20-20-20 screen rule (every 20 mins look at 20 feet for 20 seconds). Maintain tight glycemic control.',
            followUp: '2027-01-22 (Annual Diabetic Retinal Screening)'
          })
        }
      });

      await prisma.prescription.create({
        data: {
          appointmentId: appt3.id,
          patientId,
          doctorId: eyeDoctorUser.doctorProfile.id,
          diagnosisText: 'Normal Diabetic Retinal Exam & Digital Eye Strain',
          advice: 'Practice 20-20-20 screen rule. Lubricating eye drops for comfort during screen work.',
          validUntil: new Date('2026-04-22'),
          items: {
            create: [
              {
                medicineName: 'Carboxymethylcellulose 0.5% Eye Drops (Refresh Tears)',
                dosage: '1 drop in both eyes',
                frequency: '3-4 times daily as needed',
                durationDays: 30,
                instructions: 'Instill 1 drop in each eye during prolonged computer/screen work for dry eye relief.'
              }
            ]
          }
        }
      });

      // VISIT 4: 18 Sep 2025 09:45 AM - Dr. Anita Desai (Quarterly Chronic Disease Assessment)
      const appt4 = await prisma.appointment.create({
        data: {
          patientId,
          doctorId: doctor.doctorProfile.id,
          hospitalId: hospital.id,
          appointmentDate: new Date('2025-09-18T09:45:00.000Z'),
          timeSlot: '09:45 AM',
          reason: 'Routine quarterly diabetes & hypertension follow-up; review of borderline lipid profile.',
          status: 'COMPLETED',
          notes: JSON.stringify({
            chiefComplaint: 'Quarterly chronic disease management review. Discussing borderline high LDL cholesterol from recent routine labs.',
            symptoms: ['Asymptomatic', 'Occasional post-meal abdominal fullness', 'Good exercise tolerance'],
            findings: 'Cardiovascular: Normal S1, S2, regular rhythm, no cardiac murmurs. Abdomen: Soft, non-tender, no hepatosplenomegaly. Respiratory: Clear vesicular breath sounds bilaterally.',
            diagnosis: 'Essential Hypertension (Grade I) & Mixed Dyslipidemia',
            icdCode: 'I10 / E78.2',
            severity: 'MODERATE',
            vitals: {
              bp: '136/88 mmHg',
              pulse: '78 bpm',
              temp: '98.4 °F',
              spo2: '98%',
              weight: '75.5 kg',
              height: '176 cm'
            },
            testsRecommended: ['Fasting Lipid Profile', 'Comprehensive Metabolic Panel (CMP)', 'Serum Creatinine & Electrolytes'],
            doctorNotes: 'BP slightly borderline at 136/88. Advised strict dietary moderation with reduction in saturated fats and refined sugar. Initiated low-dose Statin for cardioprotective lipid management. Maintain daily home BP log.',
            followUp: '2026-01-18 (Routine 4-monthly review with updated lipid profile)'
          })
        }
      });

      await prisma.prescription.create({
        data: {
          appointmentId: appt4.id,
          patientId,
          doctorId: doctor.doctorProfile.id,
          diagnosisText: 'Essential Hypertension, Mixed Dyslipidemia, Type 2 Diabetes',
          advice: 'Low-sodium, low-fat diet. Daily 30 min exercise. Home BP recording.',
          validUntil: new Date('2025-12-18'),
          items: {
            create: [
              {
                medicineName: 'Telmisartan 40mg',
                dosage: '40mg',
                frequency: '1-0-0 (Morning after breakfast)',
                durationDays: 90,
                instructions: 'Take in morning. Check blood pressure twice weekly.'
              },
              {
                medicineName: 'Atorvastatin 10mg',
                dosage: '10mg',
                frequency: '0-0-1 (Night before sleep)',
                durationDays: 90,
                instructions: 'Take at bedtime. Advised to recheck lipid profile in 3 months.'
              },
              {
                medicineName: 'Metformin 500mg',
                dosage: '500mg',
                frequency: '1-0-1 (Twice daily with meals)',
                durationDays: 90,
                instructions: 'Take with morning and evening meals.'
              }
            ]
          }
        }
      });

      console.log('✅ Successfully seeded 4 completed doctor visits with rich clinical data & prescriptions for Rahul Verma!');
    } else {
      console.log(`ℹ️ Rahul Verma already has ${existingAppts} appointments in DB.`);
    }
  }

  // 6. Super Admin
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

  // 7. Hospital Admin
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

  // 8. Lab
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

  // 9. Pharmacy
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

  // 10. Receptionist
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
