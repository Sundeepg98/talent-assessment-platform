const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '..', 'src', 'services');

// Create directories
const dirs = ['auth', 'communication', 'assessment', 'interview', 'infrastructure', 'validation', 'processing'];
dirs.forEach(dir => {
  const dirPath = path.join(servicesDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created: ${dir}/`);
  }
});

// Delete mock stubs
const mockStubs = [
  'emailService.js', 'emailService.spec.js',
  'emailVerificationService.js', 'emailVerificationService.spec.js',
  'tokenService.js', 'tokenService.spec.js',
  'refreshTokenService.js', 'refreshTokenService.spec.js',
  'passwordResetService.js', 'passwordResetService.spec.js',
  'sessionManagerService.js', 'sessionManagerService.spec.js',
  'twoFactorAuthService.js', 'twoFactorAuthService.spec.js',
  'fileValidatorService.js', 'fileValidatorService.spec.js',
  'videoInterviewService.js', 'videoInterviewService.spec.js'
];

mockStubs.forEach(file => {
  const filePath = path.join(servicesDir, file);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Only delete if it's a mock file (contains jest.fn and is small)
      if (content.includes('jest.fn') && content.length < 500) {
        fs.unlinkSync(filePath);
        console.log(`Deleted mock: ${file}`);
      }
    } catch (e) {
      console.error(`Error processing ${file}:`, e.message);
    }
  }
});

// Move files to new locations
const moves = [
  // Auth
  ['TokenService.js', 'auth/TokenService.js'],
  ['TokenService.spec.js', 'auth/TokenService.spec.js'],
  ['refreshTokens.js', 'auth/refreshTokens.js'],
  ['refreshTokens.spec.js', 'auth/refreshTokens.spec.js'],
  ['passwordReset.js', 'auth/passwordReset.js'],
  ['passwordReset.spec.js', 'auth/passwordReset.spec.js'],
  ['twoFactorAuth.js', 'auth/twoFactorAuth.js'],
  ['twoFactorAuth.spec.js', 'auth/twoFactorAuth.spec.js'],
  
  // Communication
  ['emailVerification.js', 'communication/emailVerification.js'],
  ['emailVerification.spec.js', 'communication/emailVerification.spec.js'],
  
  // Assessment
  ['judge0Service.js', 'assessment/judge0Service.js'],
  ['judge0Service.spec.js', 'assessment/judge0Service.spec.js'],
  ['mockJudge0Service.js', 'assessment/mockJudge0Service.js'],
  ['mockJudge0Service.spec.js', 'assessment/mockJudge0Service.spec.js'],
  ['realJudge0Service.js', 'assessment/realJudge0Service.js'],
  ['realJudge0Service.spec.js', 'assessment/realJudge0Service.spec.js'],
  ['questionService.js', 'assessment/questionService.js'],
  ['questionService.spec.js', 'assessment/questionService.spec.js'],
  ['questionBank.js', 'assessment/questionBank.js'],
  ['questionBank.spec.js', 'assessment/questionBank.spec.js'],
  
  // Interview
  ['videoInterview.js', 'interview/videoInterview.js'],
  ['videoInterview.spec.js', 'interview/videoInterview.spec.js'],
  
  // Infrastructure
  ['cacheService.js', 'infrastructure/cacheService.js'],
  ['cacheService.spec.js', 'infrastructure/cacheService.spec.js'],
  ['ServiceLocator.js', 'infrastructure/ServiceLocator.js'],
  ['ServiceLocator.spec.js', 'infrastructure/ServiceLocator.spec.js'],
  ['serviceConfig.js', 'infrastructure/serviceConfig.js'],
  ['serviceConfig.spec.js', 'infrastructure/serviceConfig.spec.js'],
  ['sessionManager.js', 'infrastructure/sessionManager.js'],
  ['sessionManager.spec.js', 'infrastructure/sessionManager.spec.js'],
  
  // Validation
  ['fileValidator.js', 'validation/fileValidator.js'],
  ['fileValidator.spec.js', 'validation/fileValidator.spec.js'],
  
  // Processing
  ['pdfProcessor.js', 'processing/pdfProcessor.js'],
  ['pdfProcessor.spec.js', 'processing/pdfProcessor.spec.js']
];

moves.forEach(([from, to]) => {
  const fromPath = path.join(servicesDir, from);
  const toPath = path.join(servicesDir, to);
  
  if (fs.existsSync(fromPath) && !fs.existsSync(toPath)) {
    try {
      fs.renameSync(fromPath, toPath);
      console.log(`Moved: ${from} → ${to}`);
    } catch (e) {
      console.error(`Failed to move ${from}:`, e.message);
    }
  }
});

// Move directories
const dirMoves = [
  ['interviewAnalyzer', 'interview/interviewAnalyzer'],
  ['resume', 'processing/resume'],
  ['resumeAnalyzer', 'processing/resumeAnalyzer'],
  ['textAnalysis', 'processing/textAnalysis']
];

dirMoves.forEach(([from, to]) => {
  const fromPath = path.join(servicesDir, from);
  const toPath = path.join(servicesDir, to);
  
  if (fs.existsSync(fromPath) && !fs.existsSync(toPath)) {
    try {
      fs.renameSync(fromPath, toPath);
      console.log(`Moved directory: ${from} → ${to}`);
    } catch (e) {
      console.error(`Failed to move directory ${from}:`, e.message);
    }
  }
});

console.log('\n✅ Reorganization complete!');