#!/usr/bin/env node

/**
 * Service Reorganization Script
 * Cleans up the services folder by:
 * 1. Removing mock stub files
 * 2. Creating proper domain folders
 * 3. Moving services to appropriate locations
 * 4. Standardizing naming conventions
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '..', 'src', 'services');

// Mock stub files to remove (these are just jest mocks, not real services)
const mockStubsToRemove = [
  'emailService.js',
  'emailVerificationService.js', 
  'tokenService.js',
  'refreshTokenService.js',
  'passwordResetService.js',
  'sessionManagerService.js',
  'twoFactorAuthService.js',
  'fileValidatorService.js',
  'videoInterviewService.js'
];

// Domain folder structure
const domainFolders = {
  auth: [
    'TokenService',
    'refreshTokens',
    'passwordReset',
    'twoFactorAuth'
  ],
  communication: [
    'emailVerification'
  ],
  assessment: [
    'judge0Service',
    'mockJudge0Service',
    'realJudge0Service',
    'questionService',
    'questionBank'
  ],
  interview: [
    'videoInterview',
    'interviewAnalyzer'
  ],
  infrastructure: [
    'cacheService',
    'ServiceLocator',
    'serviceConfig',
    'sessionManager'
  ],
  validation: [
    'fileValidator'
  ],
  processing: [
    'pdfProcessor',
    'resume',
    'resumeAnalyzer',
    'textAnalysis'
  ]
};

// Step 1: Create domain folders
console.log('📁 Creating domain folder structure...');
Object.keys(domainFolders).forEach(folder => {
  const folderPath = path.join(servicesDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`  ✅ Created: ${folder}/`);
  }
});

// Step 2: Remove mock stub files
console.log('\n🗑️  Removing mock stub files...');
mockStubsToRemove.forEach(file => {
  const filePath = path.join(servicesDir, file);
  if (fs.existsSync(filePath)) {
    // Check if it's actually a mock file
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('jest.fn()') && content.length < 500) {
      fs.unlinkSync(filePath);
      console.log(`  ✅ Removed mock stub: ${file}`);
      
      // Also remove its spec file if it exists
      const specFile = file.replace('.js', '.spec.js');
      const specPath = path.join(servicesDir, specFile);
      if (fs.existsSync(specPath)) {
        fs.unlinkSync(specPath);
        console.log(`  ✅ Removed mock spec: ${specFile}`);
      }
    }
  }
});

// Step 3: Move services to appropriate folders
console.log('\n📦 Moving services to domain folders...');

// Helper function to move a file/folder
function moveItem(source, destination) {
  if (fs.existsSync(source)) {
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Move the item
    fs.renameSync(source, destination);
    return true;
  }
  return false;
}

// Move services to their domain folders
Object.entries(domainFolders).forEach(([domain, services]) => {
  services.forEach(service => {
    // Handle different file patterns
    const patterns = [
      `${service}.js`,
      `${service}.spec.js`,
      service // for directories
    ];
    
    patterns.forEach(pattern => {
      const source = path.join(servicesDir, pattern);
      const destination = path.join(servicesDir, domain, pattern);
      
      if (fs.existsSync(source) && source !== destination) {
        const stats = fs.statSync(source);
        if (stats.isDirectory() || stats.isFile()) {
          if (moveItem(source, destination)) {
            console.log(`  ✅ Moved: ${pattern} → ${domain}/`);
          }
        }
      }
    });
  });
});

// Step 4: Create service index files for each domain
console.log('\n📝 Creating index files for domains...');
Object.keys(domainFolders).forEach(domain => {
  const indexPath = path.join(servicesDir, domain, 'index.js');
  const services = domainFolders[domain];
  
  const exports = services.map(service => {
    // Check if it's a directory or a file
    const servicePath = path.join(servicesDir, domain, service);
    if (fs.existsSync(servicePath)) {
      if (fs.statSync(servicePath).isDirectory()) {
        return `  ${service}: require('./${service}'),`;
      } else if (fs.existsSync(`${servicePath}.js`)) {
        return `  ${service}: require('./${service}'),`;
      }
    }
    return null;
  }).filter(Boolean).join('\n');
  
  const indexContent = `/**
 * ${domain.charAt(0).toUpperCase() + domain.slice(1)} Services
 * Domain: ${domain}
 */

module.exports = {
${exports}
};
`;
  
  fs.writeFileSync(indexPath, indexContent);
  console.log(`  ✅ Created: ${domain}/index.js`);
});

// Step 5: Create main services index
console.log('\n📋 Creating main services index...');
const mainIndexContent = `/**
 * Services Index
 * Central export for all service domains
 * 
 * Organization:
 * - auth: Authentication and authorization services
 * - communication: Email and notification services
 * - assessment: Code execution and testing services
 * - interview: Interview and analysis services
 * - infrastructure: Core infrastructure services
 * - validation: Input validation services
 * - processing: File and text processing services
 */

module.exports = {
  auth: require('./auth'),
  communication: require('./communication'),
  assessment: require('./assessment'),
  interview: require('./interview'),
  infrastructure: require('./infrastructure'),
  validation: require('./validation'),
  processing: require('./processing')
};

// Legacy exports for backward compatibility (to be removed)
// These will be deprecated in the next major version
const legacyExports = {
  // Map old names to new locations
  EmailVerificationService: require('./communication/emailVerification'),
  TokenService: require('./auth/TokenService'),
  Judge0Service: require('./assessment/judge0Service'),
  CacheService: require('./infrastructure/cacheService'),
  SessionManager: require('./infrastructure/sessionManager'),
  FileValidator: require('./validation/fileValidator'),
  PDFProcessor: require('./processing/pdfProcessor')
};

// Add legacy exports with deprecation warnings
Object.keys(legacyExports).forEach(key => {
  Object.defineProperty(module.exports, key, {
    get() {
      console.warn(\`⚠️  DEPRECATED: Direct access to '\${key}' is deprecated. Use 'services.<domain>.<service>' instead.\`);
      return legacyExports[key];
    }
  });
});
`;

fs.writeFileSync(path.join(servicesDir, 'index.js'), mainIndexContent);
console.log('  ✅ Created: services/index.js');

// Step 6: Report summary
console.log('\n📊 Reorganization Summary:');
console.log('  ✅ Created domain folder structure');
console.log('  ✅ Removed mock stub files');
console.log('  ✅ Moved services to appropriate domains');
console.log('  ✅ Created index files for navigation');
console.log('\n⚠️  Next Steps:');
console.log('  1. Run tests to ensure nothing broke');
console.log('  2. Update imports in other files');
console.log('  3. Remove legacy exports after updating imports');

console.log('\n✨ Service reorganization complete!');