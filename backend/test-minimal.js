/**
 * Minimal test to isolate the supertest issue
 */
const express = require('express');
const request = require('supertest');

async function testMinimal() {
  console.log('Creating Express app...');
  const app = express();

  console.log('typeof app:', typeof app);
  console.log('app._router before route:', app._router);

  app.use(express.json());

  app.get('/test', (req, res) => {
    res.json({ message: 'Hello from test' });
  });

  console.log('app._router after route:', app._router);

  console.log('\nTesting with supertest...');
  const response = await request(app).get('/test');

  console.log('Response status:', response.status);
  console.log('Response body:', response.body);

  if (response.status === 200) {
    console.log('\n✅ Minimal test PASSED');
  } else {
    console.log('\n❌ Minimal test FAILED');
  }
}

testMinimal().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
