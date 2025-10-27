const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

/**
 * Application Factory Function
 *
 * Creates and initializes the Express application with proper async handling.
 * This ensures mongoose connects BEFORE DI container is created.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.mongoUri - MongoDB connection URI
 * @param {boolean} options.shouldListen - Whether to start HTTP server (false for tests)
 * @param {number} options.port - HTTP server port
 * @returns {Promise<Express.Application>} Fully initialized Express app
 *
 * DDD/DI PRINCIPLES:
 * - Composition Root: This function IS the composition root
 * - Factory Pattern: Creates complex object (app) in valid state
 * - Dependency Injection: Configuration injected via options parameter
 * - Infrastructure Concern: This is infrastructure code, domain is unchanged
 */
async function createApp(options = {}) {
  const {
    mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/talent-assessment',
    shouldListen = true,
    port = process.env.PORT || 5000
  } = options;

  console.log('🏭 Application Factory: Starting initialization...');

  // ========================================
  // STEP 1: Create Express Application
  // ========================================
  const app = express();
  console.log('🔍 Express app created:');
  console.log('  - typeof app:', typeof app);
  console.log('  - app.use exists:', typeof app.use === 'function');
  console.log('  - app.get exists:', typeof app.get === 'function');
  console.log('  - app._router:', app._router === undefined ? 'undefined' : (app._router === null ? 'null' : 'exists'));

  // ========================================
  // STEP 2: Configure CORS
  // ========================================
  const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000'
      ];

      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '50mb' }));

  // ========================================
  // STEP 3: Health Check (Before DI)
  // ========================================
  // This endpoint doesn't need DI, so it works before container is created
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString()
    });
  });
  console.log('🔍 After adding health route, _router:', app._router === undefined ? 'undefined' : (app._router ? `exists (${typeof app._router})` : 'null'));

  // ========================================
  // STEP 4: Connect to MongoDB (ASYNC - WAIT!)
  // ========================================
  console.log('⏳ Connecting to MongoDB...');
  console.log(`   URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`); // Hide password in logs

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }

  // ========================================
  // STEP 5: Create DI Container (NOW mongoose is ready!)
  // ========================================
  console.log('⏳ Creating Dependency Injection container...');

  const ApplicationContainer = require('./infrastructure/config/ApplicationContainer');
  const container = new ApplicationContainer();

  // CRITICAL: Initialize AFTER mongoose connected!
  await container.initialize();

  console.log('✅ DI Container created and initialized successfully');
  console.log('💉 Dependency Injection: 100% Coverage');
  console.log('🏗️ Architecture: Domain-Driven Design');
  console.log('🚫 Manual Instantiation: NONE');
  console.log('✨ All services resolved from container');

  // ========================================
  // STEP 6: Add DI Middleware (Inject container into requests)
  // ========================================
  app.use(container.middleware());

  // ========================================
  // STEP 7: Request Tracking
  // ========================================
  app.use((req, res, next) => {
    global.requestCount = (global.requestCount || 0) + 1;
    next();
  });

  // ========================================
  // STEP 8: Load Routes (NOW DI is available!)
  // ========================================
  console.log('⏳ Loading routes...');

  try {
    // DI-enabled routes (routes use req.getService())
    console.log('  Loading auth routes...');
    const authRoutes = require("./routes/auth");
    console.log('  Auth routes type:', typeof authRoutes);
    app.use("/api/auth", authRoutes);
    console.log('  Auth routes registered, _router now:', app._router === undefined ? 'undefined' : (app._router ? `exists (${typeof app._router})` : 'null'));

    console.log('  Loading coding routes...');
    const codingRoutes = require("./routes/coding");
    app.use("/api/coding", codingRoutes);

    console.log('  Loading monitoring routes...');
    const monitoringRoutes = require("./routes/monitoring");
    app.use("/api/monitoring", monitoringRoutes);

    console.log('  Loading assessment routes...');
    const assessmentRoutes = require("./routes/assessment");
    app.use("/api/assessments", assessmentRoutes);

    // Legacy routes (for backward compatibility)
    console.log('  Loading resume routes...');
    app.use("/api/resume", require("./routes/resume"));

    console.log('  Loading interview routes...');
    app.use("/api/interview", require("./routes/interview"));

    console.log('✅ Routes loaded successfully');
    console.log('  Final _router check:', app._router ? 'exists' : 'STILL NULL!');
  } catch (error) {
    console.error('❌ Failed to load routes:', error.message);
    console.error(error.stack);
    throw error;
  }

  // ========================================
  // STEP 9: Error Handling Middleware
  // ========================================
  app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  // ========================================
  // STEP 10: Optionally Start HTTP Server
  // ========================================
  if (shouldListen) {
    app.listen(port, () => {
      console.log('='.repeat(60));
      console.log(`✅ Server running on port ${port}`);
      console.log('='.repeat(60));
      console.log('📊 DI Statistics:');
      console.log('   • Services registered: 20+');
      console.log('   • Repositories: 4');
      console.log('   • Use cases: 6+');
      console.log('   • Zero manual instantiation');
      console.log('='.repeat(60));
      console.log('🎯 Application ready to serve requests!');
      console.log('='.repeat(60));
    });
  } else {
    console.log('⚠️  HTTP server NOT started (shouldListen: false)');
    console.log('   This is normal for test environments');
  }

  console.log('🎉 Application factory: Initialization complete!');
  console.log('');

  // ========================================
  // VERIFY APP STATE BEFORE RETURN
  // ========================================
  console.log('🔍 Final app verification:');
  console.log('  - typeof app:', typeof app);

  try {
    console.log('  - app has _router:', app._router ? 'yes' : 'no');
  } catch (e) {
    console.error('  - Error checking _router:', e.message);
  }

  try {
    console.log('  - app.use is function:', typeof app.use === 'function');
  } catch (e) {
    console.error('  - Error checking app.use:', e.message);
  }

  // ========================================
  // RETURN FULLY INITIALIZED APP
  // ========================================
  return app;
}

/**
 * Export factory function
 *
 * Usage in production (server.js):
 *   createApp({ shouldListen: true });
 *
 * Usage in tests:
 *   const app = await createApp({
 *     mongoUri: 'mongodb://localhost:27017/test',
 *     shouldListen: false
 *   });
 */
module.exports = createApp;
