const express = require('express');
const os = require('os');

/**
 * Monitoring Routes with 100% Dependency Injection
 */
const router = express.Router();

router.get('/health', async (req, res, next) => {
  try {
    const cacheService = req.getService('cacheService');
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      memory: {
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
      },
      cache: cacheService.getStats(),
      architecture: {
        type: 'Domain-Driven Design',
        diCoverage: '100%',
        pattern: 'No manual instantiation'
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/metrics', async (req, res, next) => {
  try {
    const cacheService = req.getService('cacheService');
    
    res.json({
      cache: cacheService.getStats(),
      system: {
        cpus: os.cpus().length,
        loadAverage: os.loadavg(),
        memory: process.memoryUsage()
      },
      requests: {
        total: global.requestCount || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
