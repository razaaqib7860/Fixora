const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const SLAConfig = require('./models/SLAConfig');
const HostelContact = require('./models/HostelContact');
const Notice = require('./models/Notice');
const User = require('./models/User');
const { checkAndEscalateOverdue } = require('./services/slaService');

const PORT = env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();

    // Ensure system defaults are seeded
    await SLAConfig.seedDefaults();
    await HostelContact.seedDefaults();

    const admin = await User.findOne({ role: 'ADMIN' });
    if (admin) {
      await Notice.seedDefaults(admin);
    }

    console.log('[System Setup] Defaults seeded: SLAs, Contacts, Notices.');

    // Run initial overdue scan
    await checkAndEscalateOverdue();

    // Run background overdue check every 5 minutes
    setInterval(() => {
      checkAndEscalateOverdue();
    }, 5 * 60 * 1000);

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Hostel Management API Server running on port ${PORT}`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Health: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });

    const shutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[Server Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
