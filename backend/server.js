require("dotenv").config();

/**
 * Production Server Entry Point
 *
 * Uses the factory function to create and initialize the application.
 * This ensures proper async initialization while keeping production code simple.
 *
 * DDD/DI PRINCIPLES MAINTAINED:
 * - This file is just infrastructure/bootstrapping
 * - All DI wiring happens in ApplicationContainer (composition root)
 * - Domain logic remains pure and unchanged
 * - Factory pattern is recommended by DDD/DI experts
 */

const createApp = require('./src/createApp');

// Create and start the application
createApp({
  shouldListen: true,
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI,
  port: process.env.PORT || 5000
})
  .then((app) => {
    // Export app for potential imports (e.g., for integration testing)
    module.exports = app;
  })
  .catch(err => {
    console.error('❌ Failed to start server:', err);
    console.error(err.stack);
    process.exit(1);
  });
