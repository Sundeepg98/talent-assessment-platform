/**
 * Test createApp directly without Jest
 */
const createApp = require('./src/createApp');
const request = require('supertest');

async function test() {
  console.log('Testing createApp factory...\n');

  try {
    const app = await createApp({
      mongoUri: 'mongodb://localhost:27017/talent-assessment-test',
      shouldListen: false
    });

    console.log('\n📊 App created, checking type...');
    console.log('typeof app:', typeof app);
    console.log('app is function?', typeof app === 'function');
    console.log('app.use exists?', typeof app.use === 'function');

    console.log('\n🧪 Testing health endpoint with supertest...');
    const response = await request(app).get('/health');

    console.log('Response status:', response?.status || 'undefined');
    console.log('Response body:', response?.body || 'undefined');

    if (response && response.status === 200) {
      console.log('\n✅ createApp test PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ createApp test FAILED - undefined response');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
