#!/usr/bin/env node

/**
 * COPY EXISTING TESTS TO STANDARD LOCATIONS
 * 
 * Instead of creating generic tests, copy the existing working tests
 * from the old test directories to the new .spec.js locations
 */

const fs = require('fs');
const path = require('path');

console.log('📦 COPYING EXISTING TESTS TO STANDARD LOCATIONS\n');
console.log('═'.repeat(60));

// Map of source file to its existing test file
const testMappings = {
  'src/core/DependencyInjectionContainer.js': 'tests/unit/DependencyInjectionContainer.100.test.js',
  'src/core/DIContainerConfig.js': 'tests/tdd/DIContainerConfig.tdd.test.js',
  'src/application/useCases/identity/ForgotPasswordUseCase.js': 'tests/tdd/ForgotPasswordUseCase.tdd.test.js',
  'src/application/useCases/identity/LogoutUseCase.js': 'tests/tdd/LogoutUseCase.tdd.test.js',
  'src/application/useCases/identity/RefreshTokenUseCase.js': 'tests/tdd/RefreshTokenUseCase.tdd.test.js',
  'src/application/useCases/identity/ResetPasswordUseCase.js': 'tests/tdd/ResetPasswordUseCase.tdd.test.js',
  'src/application/useCases/identity/VerifyEmailUseCase.js': 'tests/tdd/VerifyEmailUseCase.tdd.test.js',
  'src/domain/shared/Entity.js': 'tests/tdd/Entity.tdd.test.js',
  'src/domain/shared/ValueObject.js': 'tests/tdd/ValueObject.tdd.test.js',
  // Add more mappings as needed
};

let copiedCount = 0;
let skippedCount = 0;

Object.entries(testMappings).forEach(([sourceFile, testFile]) => {
  const newTestPath = sourceFile.replace('.js', '.spec.js');
  const oldTestPath = path.join(__dirname, '..', testFile);
  const newTestFullPath = path.join(__dirname, '..', newTestPath);
  
  if (fs.existsSync(oldTestPath)) {
    // Read the old test
    let testContent = fs.readFileSync(oldTestPath, 'utf8');
    
    // Update require paths if needed
    const sourceBaseName = path.basename(sourceFile, '.js');
    testContent = testContent.replace(
      /require\(['"].*?\/([\w]+)['"\]\)/g,
      (match, fileName) => {
        if (fileName === sourceBaseName) {
          return `require('./${sourceBaseName}')`;
        }
        return match;
      }
    );
    
    // Update describe text to remove .tdd or .100 references
    testContent = testContent.replace(/\.tdd\./g, '.');
    testContent = testContent.replace(/\.100\./g, '.');
    testContent = testContent.replace(/TDD Tests?/gi, 'Tests');
    
    // Write to new location
    fs.writeFileSync(newTestFullPath, testContent);
    console.log(`✅ Copied: ${testFile} → ${newTestPath}`);
    copiedCount++;
  } else {
    console.log(`⚠️  Skipped: ${testFile} (not found)`);
    skippedCount++;
  }
});

console.log('\n' + '═'.repeat(60));
console.log(`\n📊 Migration Summary:`);
console.log(`   ✅ Copied: ${copiedCount} test files`);
console.log(`   ⚠️  Skipped: ${skippedCount} test files`);
console.log('\nNext steps:');
console.log('   1. Run: npm run test:coverage');
console.log('   2. Check coverage report');
console.log('   3. Add tests for uncovered files\n');