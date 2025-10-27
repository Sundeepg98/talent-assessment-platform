require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talent-assessment');
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({ email: { $in: ['test@example.com', 'test2@example.com'] } });
    console.log('🗑️  Cleared existing test users');

    const hashedPassword = await bcrypt.hash('Test123!', 10);
    const testUser = await User.create({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User'
    });

    console.log('✅ Created test user:', testUser.email);
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: Test123!');

    await mongoose.disconnect();
    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
