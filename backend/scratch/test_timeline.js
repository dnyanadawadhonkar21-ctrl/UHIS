const prisma = require('../src/config/prisma');

async function testTimeline() {
  const rahul = await prisma.user.findUnique({
    where: { email: 'patient@uhis.gov.in' },
    include: { patientProfile: true }
  });

  const patientId = rahul.patientProfile.id;

  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: {
      doctor: { include: { user: true, hospital: true } },
      hospital: true,
      prescriptions: { include: { items: true } },
    },
    orderBy: { appointmentDate: 'desc' },
  });

  const events = appointments.map((a) => {
    let parsedNotes = {};
    if (a.notes) {
      try {
        parsedNotes = JSON.parse(a.notes);
      } catch (e) {
        parsedNotes = { doctorNotes: a.notes };
      }
    }

    const visitPrescriptions = [];
    if (a.prescriptions && a.prescriptions.length > 0) {
      a.prescriptions.forEach((p) => {
        (p.items || []).forEach((item) => {
          visitPrescriptions.push({
            id: item.id,
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.durationDays ? `${item.durationDays} days` : 'As directed',
            durationDays: item.durationDays,
            instructions: item.instructions || 'Take as instructed by physician.',
          });
        });
      });
    }

    return {
      id: a.id,
      category: 'DOCTOR_VISIT',
      type: 'VISIT',
      date: a.appointmentDate,
      visitDate: a.appointmentDate,
      timeSlot: a.timeSlot || '10:00 AM',
      doctorName: a.doctor?.user?.fullName || 'Dr. Anita Desai',
      doctorSpecialization: a.doctor?.specialization || 'Internal Medicine',
      doctorQualification: a.doctor?.qualification || 'MBBS, MD',
      hospitalName: a.hospital?.name || a.doctor?.hospital?.name || 'AIIMS New Delhi',
      hospitalAddress: a.hospital?.address || a.doctor?.hospital?.address || 'New Delhi',
      reason: parsedNotes.chiefComplaint || a.reason || 'Clinical Consultation',
      chiefComplaint: parsedNotes.chiefComplaint || a.reason || 'Routine Consultation',
      symptoms: Array.isArray(parsedNotes.symptoms) ? parsedNotes.symptoms : (parsedNotes.symptoms ? [parsedNotes.symptoms] : []),
      findings: parsedNotes.findings || 'General physical examination performed.',
      diagnosis: parsedNotes.diagnosis || a.prescriptions?.[0]?.diagnosisText || 'Clinical OPD Consultation',
      icdCode: parsedNotes.icdCode || '',
      severity: parsedNotes.severity || 'MODERATE',
      vitals: parsedNotes.vitals || null,
      testsRecommended: Array.isArray(parsedNotes.testsRecommended) ? parsedNotes.testsRecommended : (parsedNotes.testsRecommended ? [parsedNotes.testsRecommended] : []),
      prescriptions: visitPrescriptions,
      doctorNotes: parsedNotes.doctorNotes || a.notes || '',
      followUp: parsedNotes.followUp || null,
      status: a.status || 'COMPLETED',
    };
  });

  console.log('Doctor visits formatted count:', events.length);
  events.forEach((ev, idx) => {
    console.log(`\n=== VISIT ${idx + 1} ===`);
    console.log(`Date & Time: ${ev.date} (${ev.timeSlot})`);
    console.log(`Doctor: ${ev.doctorName} (${ev.doctorSpecialization}, ${ev.hospitalName})`);
    console.log(`Chief Complaint: ${ev.chiefComplaint}`);
    console.log(`Symptoms: ${JSON.stringify(ev.symptoms)}`);
    console.log(`Findings: ${ev.findings}`);
    console.log(`Diagnosis: ${ev.diagnosis} [${ev.icdCode}]`);
    console.log(`Vitals:`, JSON.stringify(ev.vitals));
    console.log(`Tests Recommended:`, JSON.stringify(ev.testsRecommended));
    console.log(`Prescriptions (${ev.prescriptions.length}):`, JSON.stringify(ev.prescriptions));
    console.log(`Doctor Notes: ${ev.doctorNotes}`);
    console.log(`Follow-up: ${ev.followUp}`);
  });
}

testTimeline().then(() => prisma.$disconnect());
