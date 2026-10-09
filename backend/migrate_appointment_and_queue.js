const prisma = require('./src/config/prisma');

async function migrateAppointmentAndQueue() {
  console.log('=== Migrating Database for Find a Doctor & Appointment Booking System ===');

  // Step 1: Create DoctorAvailability table
  console.log('Step 1: Creating DoctorAvailability table...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DoctorAvailability" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "doctorId" TEXT NOT NULL,
      "hospitalId" TEXT NOT NULL,
      "slotDate" DATETIME NOT NULL,
      "startTime" TEXT NOT NULL,
      "endTime" TEXT NOT NULL,
      "slotDuration" INTEGER NOT NULL DEFAULT 30,
      "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
      "appointmentId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("hospitalId") REFERENCES "Hospital" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DoctorAvailability_doctorId_idx" ON "DoctorAvailability"("doctorId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DoctorAvailability_slotDate_idx" ON "DoctorAvailability"("slotDate");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DoctorAvailability_status_idx" ON "DoctorAvailability"("status");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "DoctorAvailability_doctor_hosp_slot_idx" ON "DoctorAvailability"("doctorId", "hospitalId", "slotDate", "startTime");`);
  console.log('  ✅ DoctorAvailability table and indices verified.');

  // Step 2: Create DoctorQueue table
  console.log('Step 2: Creating DoctorQueue table...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DoctorQueue" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "appointmentId" TEXT NOT NULL UNIQUE,
      "doctorId" TEXT NOT NULL,
      "patientId" TEXT NOT NULL,
      "hospitalId" TEXT NOT NULL,
      "queueDate" DATETIME NOT NULL,
      "queueNumber" INTEGER NOT NULL,
      "tokenNumber" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'BOOKED',
      "checkInTime" DATETIME,
      "calledAt" DATETIME,
      "consultedAt" DATETIME,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("hospitalId") REFERENCES "Hospital" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DoctorQueue_doctorId_idx" ON "DoctorQueue"("doctorId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DoctorQueue_patientId_idx" ON "DoctorQueue"("patientId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DoctorQueue_queueDate_idx" ON "DoctorQueue"("queueDate");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "DoctorQueue_doctor_date_queueNum_idx" ON "DoctorQueue"("doctorId", "queueDate", "queueNumber");`);
  console.log('  ✅ DoctorQueue table and indices verified.');

  // Step 3: Add queueNumber and tokenNumber columns to Appointment table if missing
  console.log('Step 3: Checking Appointment table columns...');
  const apptColumns = await prisma.$queryRawUnsafe(`PRAGMA table_info("Appointment");`);
  const colNames = apptColumns.map((c) => c.name);

  if (!colNames.includes('queueNumber')) {
    console.log('  Adding queueNumber to Appointment...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Appointment" ADD COLUMN "queueNumber" INTEGER;`);
  }
  if (!colNames.includes('tokenNumber')) {
    console.log('  Adding tokenNumber to Appointment...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Appointment" ADD COLUMN "tokenNumber" TEXT;`);
  }
  console.log('  ✅ Appointment table columns verified.');

  // Step 4: Seed availability for existing doctors
  console.log('Step 4: Seeding availability slots for doctors...');
  const doctors = await prisma.doctor.findMany({
    select: { id: true, hospitalId: true },
  });

  const timeSlots = [
    { start: "09:00 AM", end: "09:30 AM" },
    { start: "09:30 AM", end: "10:00 AM" },
    { start: "10:00 AM", end: "10:30 AM" },
    { start: "10:30 AM", end: "11:00 AM" },
    { start: "11:00 AM", end: "11:30 AM" },
    { start: "11:30 AM", end: "12:00 PM" },
    { start: "02:00 PM", end: "02:30 PM" },
    { start: "02:30 PM", end: "03:00 PM" },
    { start: "03:00 PM", end: "03:30 PM" },
    { start: "03:30 PM", end: "04:00 PM" },
    { start: "04:00 PM", end: "04:30 PM" },
    { start: "04:30 PM", end: "05:00 PM" },
  ];

  // Generate for upcoming 14 days from current date
  const now = new Date();
  let createdSlots = 0;

  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    // Skip Sunday (0)
    if (slotDate.getDay() === 0) continue;

    const dateStr = slotDate.toISOString().split('T')[0];
    const normalizedSlotDate = new Date(`${dateStr}T00:00:00.000Z`);

    // For each doctor, generate 4-6 staggered slots per day
    for (let i = 0; i < doctors.length; i++) {
      const doc = doctors[i];
      // Select 6 slots per doctor using deterministic rotation
      const startIdx = (i + dayOffset) % 6;
      const docSlots = [
        timeSlots[startIdx],
        timeSlots[startIdx + 1],
        timeSlots[startIdx + 2],
        timeSlots[6 + (startIdx % 6)],
        timeSlots[6 + ((startIdx + 1) % 6)],
      ];

      for (const slot of docSlots) {
        try {
          const id = `slot_${doc.id.substring(0, 8)}_${dateStr}_${slot.start.replace(/[^A-Za-z0-9]/g, '')}`;
          await prisma.$executeRawUnsafe(`
            INSERT OR IGNORE INTO "DoctorAvailability" 
            ("id", "doctorId", "hospitalId", "slotDate", "startTime", "endTime", "slotDuration", "status", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, 30, 'AVAILABLE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
          `, id, doc.id, doc.hospitalId, normalizedSlotDate, slot.start, slot.end);
          createdSlots++;
        } catch (e) {
          // ignore duplicate
        }
      }
    }
  }

  console.log(`  ✅ Processed availability generation (${createdSlots} slot checkpoints).`);
  console.log('=== Migration & Seeding Complete ===');
}

if (require.main === module) {
  migrateAppointmentAndQueue()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrateAppointmentAndQueue;
