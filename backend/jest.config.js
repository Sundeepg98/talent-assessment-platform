module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.spec.js',
    '!src/**/*.test.js',
    '!src/test/**'
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  coverageThreshold: {
    global: {
      branches: 80,   // Start with achievable threshold
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleDirectories: ['node_modules', 'src'],
  testTimeout: 10000,
  clearMocks: false, // Don't use mocks
  resetMocks: false,
  restoreMocks: false
};
