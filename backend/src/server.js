require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    // Verify Database Connection
    await prisma.$connect();
    console.log('✅ Connected successfully to UHIS Database via Prisma ORM.');

    // Ensure demo users exist (additive, non-destructive)
    const seedDemoUsers = require('./utils/seedDemoUsers');
    await seedDemoUsers().catch(e => console.warn('⚠️ Demo user seeding skipped:', e.message));

    app.listen(PORT, () => {
      console.log(`🚀 UHIS Server listening on port ${PORT} [${process.env.NODE_ENV || 'development'} mode]`);
      console.log(`📡 Health Check URL: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to Database:', error);
    process.exit(1);
  }
}

main();
