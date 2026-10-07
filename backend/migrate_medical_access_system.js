const prisma = require('./src/config/prisma');

async function migrateMedicalAccessSystem() {
  console.log('--- Migrating Database for Medical Record Access Request System ---');

  // 1. Create MedicalAccessRequest table
  console.log('Step 1: Creating MedicalAccessRequest table...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MedicalAccessRequest" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "doctorId" TEXT NOT NULL,
      "patientId" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "denialReason" TEXT,
      "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "respondedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MedicalAccessRequest_doctorId_idx" ON "MedicalAccessRequest"("doctorId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MedicalAccessRequest_patientId_idx" ON "MedicalAccessRequest"("patientId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MedicalAccessRequest_status_idx" ON "MedicalAccessRequest"("status");`);
  console.log('  ✅ MedicalAccessRequest table and indices verified.');

  // 2. Create AccessOTP table
  console.log('Step 2: Creating AccessOTP table...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AccessOTP" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "accessRequestId" TEXT NOT NULL UNIQUE,
      "otpHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expiresAt" DATETIME NOT NULL,
      "verifiedAt" DATETIME,
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      FOREIGN KEY ("accessRequestId") REFERENCES "MedicalAccessRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AccessOTP_accessRequestId_idx" ON "AccessOTP"("accessRequestId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AccessOTP_status_idx" ON "AccessOTP"("status");`);
  console.log('  ✅ AccessOTP table and indices verified.');

  // 3. Create MedicalAccessSession table
  console.log('Step 3: Creating MedicalAccessSession table...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MedicalAccessSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "accessRequestId" TEXT NOT NULL UNIQUE,
      "doctorId" TEXT NOT NULL,
      "patientId" TEXT NOT NULL,
      "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expiresAt" DATETIME NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("accessRequestId") REFERENCES "MedicalAccessRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MedicalAccessSession_accessRequestId_idx" ON "MedicalAccessSession"("accessRequestId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MedicalAccessSession_doctorId_idx" ON "MedicalAccessSession"("doctorId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MedicalAccessSession_patientId_idx" ON "MedicalAccessSession"("patientId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MedicalAccessSession_status_idx" ON "MedicalAccessSession"("status");`);
  console.log('  ✅ MedicalAccessSession table and indices verified.');

  // 4. Add data column to Notification table if not present
  console.log('Step 4: Ensuring data column on Notification table...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Notification" ADD COLUMN "data" TEXT;`);
    console.log('  ✅ Added "data" column to Notification table.');
  } catch (err) {
    if (err.message && (err.message.includes('duplicate column') || err.message.includes('already exists'))) {
      console.log('  ℹ️ "data" column already exists on Notification table.');
    } else {
      console.log('  ℹ️ Notification column notice:', err.message);
    }
  }

  console.log('✅ Database migration for Medical Record Access Request System completed successfully!');
}

migrateMedicalAccessSystem()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
