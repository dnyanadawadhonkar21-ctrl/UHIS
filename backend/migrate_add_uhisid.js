// Add uhisId column to SQLite and populate all patients with unique UHIS IDs
const prisma = require('./src/config/prisma');

async function addUhisIdColumn() {
  console.log('Step 1: Adding uhisId column to Patient table...');
  
  try {
    await prisma.$queryRawUnsafe('ALTER TABLE Patient ADD COLUMN uhisId TEXT');
    console.log('  ✅ Column uhisId added successfully.');
  } catch (e) {
    if (e.message && e.message.includes('duplicate column')) {
      console.log('  ⚠️ Column uhisId already exists, skipping.');
    } else {
      console.log('  ⚠️ ALTER TABLE result:', e.message);
    }
  }

  console.log('\nStep 2: Populating uhisId for all patients...');
  
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: 'asc' },
  });
  
  console.log(`  Found ${patients.length} patients.`);
  
  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    const uhisId = `PT-2026-${String(i + 1).padStart(3, '0')}`;
    
    await prisma.$queryRawUnsafe(
      'UPDATE Patient SET uhisId = ? WHERE id = ?',
      uhisId,
      p.id
    );
  }
  
  console.log(`  ✅ Assigned unique UHIS IDs (PT-2026-001 to PT-2026-${String(patients.length).padStart(3, '0')}) to all patients.`);

  console.log('\nStep 3: Creating unique index on uhisId...');
  try {
    await prisma.$queryRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Patient_uhisId_key" ON "Patient"("uhisId")');
    console.log('  ✅ Unique index Patient_uhisId_key created.');
  } catch (e) {
    console.log('  ⚠️ Index result:', e.message);
  }

  console.log('\nStep 4: Verifying demo OPD patients...');
  const demoEmails = [
    'patient22@uhis.org', 'patient23@uhis.org', 'patient24@uhis.org',
    'patient25@uhis.org', 'patient26@uhis.org', 'patient27@uhis.org',
    'patient28@uhis.org', 'patient29@uhis.org'
  ];
  
  const demoPatients = await prisma.patient.findMany({
    where: { user: { email: { in: demoEmails } } },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log('  Demo OPD patients:');
  for (const dp of demoPatients) {
    // Read uhisId directly since Prisma client may not know about it yet
    const raw = await prisma.$queryRawUnsafe(
      'SELECT uhisId FROM Patient WHERE id = ?', dp.id
    );
    const uhisId = raw[0]?.uhisId || 'NOT SET';
    console.log(`    ${dp.user.fullName} | ABHA: ${dp.abhaId} | UHIS: ${uhisId}`);
  }

  console.log('\n✅ Migration complete! uhisId is now a separate field from abhaId.');
}

addUhisIdColumn()
  .catch(console.error)
  .finally(() => process.exit(0));
