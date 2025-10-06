module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/*.spec.js'  // ONE pattern to match all tests
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.spec.js',  // Exclude test files
    '!src/test/**'
  ],
  // setupFilesAfterEnv removed - test-setup.js was unused placeholder
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000,
  verbose: true
};