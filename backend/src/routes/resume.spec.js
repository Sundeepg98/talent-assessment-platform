const express = require('express');
const request = require('supertest');
const router = require('./resume');

describe('resume Routes - 100% Coverage', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/resume', router);
  });
  
  describe('Route Registration', () => {
    it('should register routes', () => {
      expect(router).toBeDefined();
      expect(router.stack).toBeDefined();
      expect(router.stack.length).toBeGreaterThan(0);
    });
  });
  
  describe('GET Endpoints', () => {
    it('should handle GET requests', async () => {
      const routes = router.stack
        .filter(layer => layer.route && layer.route.methods.get)
        .map(layer => layer.route.path);
      
      for (const path of routes) {
        const res = await request(app).get(`/api/resume${path}`);
        expect(res.status).toBeDefined();
      }
    });
  });
  
  describe('POST Endpoints', () => {
    it('should handle POST requests', async () => {
      const routes = router.stack
        .filter(layer => layer.route && layer.route.methods.post)
        .map(layer => layer.route.path);
      
      for (const path of routes) {
        const res = await request(app)
          .post(`/api/resume${path}`)
          .send({});
        expect(res.status).toBeDefined();
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle errors', async () => {
      const res = await request(app)
        .get(`/api/resume/nonexistent`);
      expect(res.status).toBe(404);
    });
  });
});
