#!/bin/bash
# Fix TDD Violations - Create all missing tests
# This script creates comprehensive test suites for all services

echo "================================================"
echo "🔧 FIXING TDD VIOLATIONS"
echo "================================================"
echo ""
echo "Creating test files that SHOULD have been written FIRST..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd backend

# Create tests directory structure
mkdir -p tests/unit/services
mkdir -p tests/integration/services
mkdir -p tests/e2e/services

echo "📝 Creating Unit Test Files..."
echo "================================"

# 1. Password Reset Test
cat > tests/unit/services/passwordReset.test.js << 'EOF'
const PasswordResetService = require('../../../src/services/passwordReset');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

describe('PasswordResetService - TDD Tests', () => {
  let service;

  beforeEach(() => {
    service = new PasswordResetService();
    process.env.EMAIL_USER = 'test@example.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  describe('generateResetToken', () => {
    it('should generate a unique reset token', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      
      const token = service.generateResetToken(userId, email);
      
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes in hex
    });

    it('should store token with expiry time', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      
      const token = service.generateResetToken(userId, email);
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      const stored = service.resetTokens.get(hashedToken);
      expect(stored).toBeDefined();
      expect(stored.userId).toBe(userId);
      expect(stored.expiry).toBeGreaterThan(Date.now());
    });
  });

  describe('validateResetToken', () => {
    it('should validate a valid token', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const token = service.generateResetToken(userId, email);
      
      const result = service.validateResetToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe(userId);
    });

    it('should reject expired token', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const token = service.generateResetToken(userId, email);
      
      // Manually expire the token
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const stored = service.resetTokens.get(hashedToken);
      stored.expiry = Date.now() - 1000;
      
      const result = service.validateResetToken(token);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
    });
  });
});
EOF

echo -e "${GREEN}✅ passwordReset.test.js created${NC}"

# 2. Two Factor Auth Test
cat > tests/unit/services/twoFactorAuth.test.js << 'EOF'
const TwoFactorAuthService = require('../../../src/services/twoFactorAuth');

describe('TwoFactorAuthService - TDD Tests', () => {
  let service;

  beforeEach(() => {
    service = new TwoFactorAuthService();
  });

  describe('generateSecret', () => {
    it('should generate a secret with correct properties', () => {
      const email = 'user@example.com';
      
      const result = service.generateSecret(email);
      
      expect(result.secret).toBeDefined();
      expect(result.otpauth_url).toBeDefined();
      expect(result.backup_codes).toBeDefined();
      expect(result.backup_codes.length).toBe(10);
    });

    it('should generate unique backup codes', () => {
      const email = 'user@example.com';
      
      const result = service.generateSecret(email);
      const uniqueCodes = new Set(result.backup_codes);
      
      expect(uniqueCodes.size).toBe(10);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid TOTP token', () => {
      // This would need speakeasy mock
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '123456';
      
      jest.spyOn(require('speakeasy').totp, 'verify').mockReturnValue(true);
      
      const result = service.verifyToken(secret, token);
      
      expect(result.valid).toBe(true);
    });

    it('should reject invalid token', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = 'wrong';
      
      jest.spyOn(require('speakeasy').totp, 'verify').mockReturnValue(false);
      
      const result = service.verifyToken(secret, token);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify and consume valid backup code', () => {
      const userId = 'user123';
      const codes = ['CODE1', 'CODE2', 'CODE3'];
      service.backupCodes.set(userId, codes);
      
      const result = service.verifyBackupCode(userId, 'CODE2');
      
      expect(result.valid).toBe(true);
      expect(result.remaining).toBe(2);
      expect(service.backupCodes.get(userId)).not.toContain('CODE2');
    });
  });
});
EOF

echo -e "${GREEN}✅ twoFactorAuth.test.js created${NC}"

# 3. Session Manager Test
cat > tests/unit/services/sessionManager.test.js << 'EOF'
const SessionManager = require('../../../src/services/sessionManager');

describe('SessionManager - TDD Tests', () => {
  let manager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  describe('createSession', () => {
    it('should create a new session with unique ID', () => {
      const userId = 'user123';
      const userInfo = { name: 'John Doe', role: 'candidate' };
      
      const sessionId = manager.createSession(userId, userInfo);
      
      expect(sessionId).toBeDefined();
      expect(sessionId.length).toBe(64);
    });

    it('should store session data correctly', () => {
      const userId = 'user123';
      const userInfo = { name: 'John Doe', role: 'candidate' };
      
      const sessionId = manager.createSession(userId, userInfo);
      const session = manager.getSession(sessionId);
      
      expect(session.userId).toBe(userId);
      expect(session.name).toBe('John Doe');
      expect(session.role).toBe('candidate');
    });
  });

  describe('getSession', () => {
    it('should retrieve valid session', () => {
      const userId = 'user123';
      const sessionId = manager.createSession(userId, {});
      
      const session = manager.getSession(sessionId);
      
      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
    });

    it('should return null for expired session', () => {
      const userId = 'user123';
      const sessionId = manager.createSession(userId, {});
      
      // Manually expire session
      const session = manager.activeSessions.get(sessionId);
      session.lastActivity = new Date(Date.now() - 25 * 60 * 60 * 1000);
      
      const result = manager.getSession(sessionId);
      
      expect(result).toBeNull();
    });

    it('should update lastActivity on retrieval', () => {
      const sessionId = manager.createSession('user123', {});
      const before = new Date();
      
      setTimeout(() => {
        const session = manager.getSession(sessionId);
        expect(session.lastActivity).toBeGreaterThan(before);
      }, 10);
    });
  });

  describe('destroyAllUserSessions', () => {
    it('should destroy all sessions for a user', () => {
      const userId = 'user123';
      const session1 = manager.createSession(userId, {});
      const session2 = manager.createSession(userId, {});
      const session3 = manager.createSession('other', {});
      
      const count = manager.destroyAllUserSessions(userId);
      
      expect(count).toBe(2);
      expect(manager.getSession(session1)).toBeNull();
      expect(manager.getSession(session2)).toBeNull();
      expect(manager.getSession(session3)).toBeDefined();
    });
  });
});
EOF

echo -e "${GREEN}✅ sessionManager.test.js created${NC}"

# 4. Refresh Tokens Test
cat > tests/unit/services/refreshTokens.test.js << 'EOF'
const RefreshTokenService = require('../../../src/services/refreshTokens');
const jwt = require('jsonwebtoken');

describe('RefreshTokenService - TDD Tests', () => {
  let service;

  beforeEach(() => {
    service = new RefreshTokenService();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', () => {
      const userId = 'user123';
      const userData = { email: 'test@example.com' };
      
      const result = service.generateTokenPair(userId, userData);
      
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(900);
      expect(result.tokenType).toBe('Bearer');
    });

    it('should set correct expiry times', () => {
      const userId = 'user123';
      const userData = {};
      
      const result = service.generateTokenPair(userId, userData);
      
      const accessDecoded = jwt.verify(result.accessToken, process.env.JWT_SECRET);
      const refreshDecoded = jwt.verify(result.refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const now = Math.floor(Date.now() / 1000);
      expect(accessDecoded.exp - now).toBeLessThanOrEqual(900);
      expect(refreshDecoded.exp - now).toBeLessThanOrEqual(604800);
    });
  });

  describe('rotateTokens', () => {
    it('should rotate valid refresh token', async () => {
      const userId = 'user123';
      const { refreshToken } = service.generateTokenPair(userId, {});
      
      const result = await service.rotateTokens(refreshToken);
      
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject reused token', async () => {
      const userId = 'user123';
      const { refreshToken } = service.generateTokenPair(userId, {});
      
      await service.rotateTokens(refreshToken);
      const result = await service.rotateTokens(refreshToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Token reuse detected');
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for user', () => {
      const userId = 'user123';
      service.generateTokenPair(userId, {});
      service.generateTokenPair(userId, {});
      
      const count = service.revokeAllUserTokens(userId);
      
      expect(count).toBe(2);
    });
  });
});
EOF

echo -e "${GREEN}✅ refreshTokens.test.js created${NC}"

# 5. PDF Processor Test
cat > tests/unit/services/pdfProcessor.test.js << 'EOF'
const PDFProcessor = require('../../../src/services/pdfProcessor');

describe('PDFProcessor - TDD Tests', () => {
  let processor;

  beforeEach(() => {
    processor = new PDFProcessor();
  });

  describe('validatePDF', () => {
    it('should validate PDF signature', async () => {
      const validPDF = Buffer.from('%PDF-1.4\n...');
      
      const result = await processor.validatePDF(validPDF);
      
      expect(result.valid).toBe(true);
    });

    it('should reject non-PDF file', async () => {
      const invalidFile = Buffer.from('Not a PDF file');
      
      const result = await processor.validatePDF(invalidFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid PDF signature');
    });
  });

  describe('extractText', () => {
    it('should extract text from PDF buffer', async () => {
      // Would need pdf-parse mock
      const mockBuffer = Buffer.from('mock pdf');
      jest.mock('pdf-parse');
      
      const result = await processor.extractText(mockBuffer);
      
      expect(result.success).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.pages).toBeDefined();
    });
  });

  describe('parseResumeSections', () => {
    it('should parse standard resume sections', () => {
      const text = `John Doe
      john@example.com
      
      EXPERIENCE
      Software Developer at Tech Corp
      
      EDUCATION
      BS Computer Science
      
      SKILLS
      JavaScript, Python`;
      
      const sections = processor.parseResumeSections(text);
      
      expect(sections.contactInfo.email).toBe('john@example.com');
      expect(sections.experience).toContain('Software Developer');
      expect(sections.education).toContain('Computer Science');
      expect(sections.skills).toContain('JavaScript');
    });
  });
});
EOF

echo -e "${GREEN}✅ pdfProcessor.test.js created${NC}"

# 6. File Validator Test
cat > tests/unit/services/fileValidator.test.js << 'EOF'
const FileValidator = require('../../../src/services/fileValidator');

describe('FileValidator - TDD Tests', () => {
  let validator;

  beforeEach(() => {
    validator = new FileValidator();
  });

  describe('validateFile', () => {
    it('should validate allowed file types', async () => {
      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024,
        buffer: Buffer.from('%PDF-1.4')
      };
      
      const result = await validator.validateFile(file, 'documents');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject disallowed extensions', async () => {
      const file = {
        originalname: 'virus.exe',
        mimetype: 'application/x-msdownload',
        size: 1024,
        buffer: Buffer.from('MZ')
      };
      
      const result = await validator.validateFile(file, 'documents');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("File extension '.exe' not allowed for documents");
    });

    it('should reject oversized files', async () => {
      const file = {
        originalname: 'huge.pdf',
        mimetype: 'application/pdf',
        size: 20 * 1024 * 1024,
        buffer: Buffer.from('%PDF')
      };
      
      const result = await validator.validateFile(file, 'documents');
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exceeds limit');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove dangerous characters', () => {
      const dangerous = '../../../etc/passwd';
      
      const safe = validator.sanitizeFilename(dangerous);
      
      expect(safe).not.toContain('..');
      expect(safe).not.toContain('/');
    });

    it('should add timestamp for uniqueness', () => {
      const filename = 'document.pdf';
      
      const safe = validator.sanitizeFilename(filename);
      
      expect(safe).toMatch(/document_\d+\.pdf/);
    });
  });

  describe('isExecutable', () => {
    it('should detect executable extensions', () => {
      expect(validator.isExecutable('file.exe')).toBe(true);
      expect(validator.isExecutable('file.bat')).toBe(true);
      expect(validator.isExecutable('file.sh')).toBe(true);
      expect(validator.isExecutable('file.pdf')).toBe(false);
    });
  });

  describe('scanContent', () => {
    it('should detect dangerous patterns', async () => {
      const dangerous = Buffer.from('<script>alert("XSS")</script>');
      
      const result = await validator.scanContent(dangerous);
      
      expect(result.dangerous).toBe(true);
      expect(result.reason).toContain('Suspicious pattern');
    });

    it('should pass clean content', async () => {
      const clean = Buffer.from('This is a normal document content.');
      
      const result = await validator.scanContent(clean);
      
      expect(result.dangerous).toBe(false);
    });
  });
});
EOF

echo -e "${GREEN}✅ fileValidator.test.js created${NC}"

# 7. Real Judge0 Service Test
cat > tests/unit/services/realJudge0Service.test.js << 'EOF'
const RealJudge0Service = require('../../../src/services/realJudge0Service');
const axios = require('axios');

jest.mock('axios');

describe('RealJudge0Service - TDD Tests', () => {
  let service;

  beforeEach(() => {
    service = new RealJudge0Service();
    process.env.JUDGE0_API_KEY = 'test-key';
    axios.create.mockReturnValue({
      post: jest.fn(),
      get: jest.fn()
    });
  });

  describe('getLanguageId', () => {
    it('should return correct language IDs', () => {
      expect(service.getLanguageId('javascript')).toBe(63);
      expect(service.getLanguageId('python')).toBe(71);
      expect(service.getLanguageId('java')).toBe(62);
      expect(service.getLanguageId('unknown')).toBe(63); // defaults to JS
    });
  });

  describe('submitCode', () => {
    it('should submit code successfully', async () => {
      const mockToken = 'test-token-123';
      service.client.post.mockResolvedValue({ data: { token: mockToken }});
      
      const result = await service.submitCode('console.log("test")', 'javascript');
      
      expect(result.success).toBe(true);
      expect(result.token).toBe(mockToken);
    });

    it('should handle submission errors', async () => {
      service.client.post.mockRejectedValue(new Error('API Error'));
      
      const result = await service.submitCode('bad code', 'javascript');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });

  describe('getSubmission', () => {
    it('should get accepted submission', async () => {
      const mockSubmission = {
        status: { id: 3, description: 'Accepted' },
        stdout: Buffer.from('Hello World').toString('base64'),
        time: '0.001',
        memory: 128
      };
      service.client.get.mockResolvedValue({ data: mockSubmission });
      
      const result = await service.getSubmission('token123');
      
      expect(result.success).toBe(true);
      expect(result.finished).toBe(true);
      expect(result.stdout).toBe('Hello World');
    });

    it('should handle compilation error', async () => {
      const mockSubmission = {
        status: { id: 6, description: 'Compilation Error' },
        compile_output: Buffer.from('Syntax error').toString('base64')
      };
      service.client.get.mockResolvedValue({ data: mockSubmission });
      
      const result = await service.getSubmission('token123');
      
      expect(result.success).toBe(false);
      expect(result.finished).toBe(true);
      expect(result.error).toBe('Syntax error');
    });
  });

  describe('executeCode', () => {
    it('should execute code end-to-end', async () => {
      const mockToken = 'exec-token';
      service.client.post.mockResolvedValue({ data: { token: mockToken }});
      service.client.get.mockResolvedValue({
        data: {
          status: { id: 3 },
          stdout: Buffer.from('42').toString('base64')
        }
      });
      
      const result = await service.executeCode('print(42)', 'python');
      
      expect(result.success).toBe(true);
      expect(result.stdout).toBe('42');
    });
  });
});
EOF

echo -e "${GREEN}✅ realJudge0Service.test.js created${NC}"

echo ""
echo "📊 Generating Test Coverage Report..."
echo "======================================"

# Create test runner script
cat > run-tests-with-coverage.sh << 'EOF'
#!/bin/bash
echo "Running all tests with coverage..."

# Install missing dev dependencies
npm install --save-dev jest supertest @types/jest

# Run tests with coverage
npm test -- --coverage --coverageReporters=text-summary

# Check coverage thresholds
npm test -- --coverage --coverageThresholds='{
  "global": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  }
}'
EOF

chmod +x run-tests-with-coverage.sh

echo ""
echo "================================================"
echo "✅ TDD VIOLATION FIX COMPLETE"
echo "================================================"
echo ""
echo -e "${GREEN}Created Test Files:${NC}"
echo "  ✅ emailVerification.test.js (example)"
echo "  ✅ passwordReset.test.js"
echo "  ✅ twoFactorAuth.test.js"
echo "  ✅ sessionManager.test.js"
echo "  ✅ refreshTokens.test.js"
echo "  ✅ pdfProcessor.test.js"
echo "  ✅ fileValidator.test.js"
echo "  ✅ realJudge0Service.test.js"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "These tests were created AFTER implementation (violation of TDD)."
echo "In future, ALWAYS write tests FIRST!"
echo ""
echo "📋 Next Steps:"
echo "1. Run tests: npm test"
echo "2. Check coverage: ./run-tests-with-coverage.sh"
echo "3. Fix any failing tests"
echo "4. Achieve 80%+ coverage"
echo ""
echo "Remember: RED → GREEN → REFACTOR"
echo "================================================"