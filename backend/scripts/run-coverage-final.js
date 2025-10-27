#!/usr/bin/env node

/**
 * FINAL COVERAGE RUN WITH STANDARDIZED TESTS
 * 
 * This script ensures all tests are properly configured and runs coverage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎯 FINAL COVERAGE RUN\n');
console.log('═'.repeat(60));

// Step 1: Check if MongoDB is running
console.log('\n🔍 Checking MongoDB...');
try {
  execSync('pgrep mongod', { stdio: 'ignore' });
  console.log('   ✅ MongoDB is running');
} catch (e) {
  console.log('   ⚠️  MongoDB not running - starting it...');
  try {
    execSync('sudo systemctl start mongod');
    console.log('   ✅ MongoDB started');
  } catch (err) {
    console.log('   ❌ Failed to start MongoDB');
  }
}

// Step 2: Set up test environment
console.log('\n🔧 Setting up test environment...');
const envContent = `
NODE_ENV=test
PORT=5001
MONGO_URI=mongodb://localhost:27017/test-db
JWT_SECRET=test-secret
JUDGE0_API_KEY=test-judge0-key
GEMINI_API_KEY=test-gemini-key
`;
fs.writeFileSync(path.join(__dirname, '../.env.test'), envContent);
console.log('   ✅ Test environment configured');

// Step 3: Run coverage with proper config
console.log('\n📊 Running coverage tests...\n');
console.log('═'.repeat(60));

try {
  // Run tests with coverage
  const result = execSync('npm run test:coverage', {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'test' },
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log(result);
  
  // Parse coverage summary
  const coverageFile = path.join(__dirname, '../coverage/coverage-summary.json');
  if (fs.existsSync(coverageFile)) {
    const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    const total = coverage.total;
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 FINAL COVERAGE RESULTS:\n');
    console.log(`   Lines:      ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
    console.log(`   Branches:   ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
    console.log(`   Functions:  ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
    console.log(`   Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
    
    // Check if we reached 100%
    if (total.lines.pct === 100) {
      console.log('\n🎉 CONGRATULATIONS! 100% CODE COVERAGE ACHIEVED! 🎉');
    } else {
      const gap = 100 - total.lines.pct;
      console.log(`\n⚠️  Gap to 100%: ${gap.toFixed(2)}%`);
      
      // Find uncovered files
      const uncovered = [];
      Object.entries(coverage).forEach(([file, data]) => {
        if (file !== 'total' && data.lines.pct < 100) {
          uncovered.push({
            file: file.replace(/^.*src/, 'src'),
            coverage: data.lines.pct
          });
        }
      });
      
      if (uncovered.length > 0) {
        console.log('\n📝 Files needing more coverage:');
        uncovered
          .sort((a, b) => a.coverage - b.coverage)
          .slice(0, 10)
          .forEach(f => {
            console.log(`   ${f.coverage.toFixed(1)}% - ${f.file}`);
          });
      }
    }
  }
  
} catch (error) {
  console.error('❌ Tests failed:', error.message);
  
  // Still try to show coverage if available
  const coverageFile = path.join(__dirname, '../coverage/coverage-summary.json');
  if (fs.existsSync(coverageFile)) {
    const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    const total = coverage.total;
    
    console.log('\n📊 Coverage despite failures:');
    console.log(`   Lines: ${total.lines.pct}%`);
    console.log(`   Branches: ${total.branches.pct}%`);
  }
}

console.log('\n' + '═'.repeat(60));
console.log('\n✅ Coverage run complete!\n');