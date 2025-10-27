# 🧪 Platform Testing Documentation

This directory contains all platform-wide tests that validate the entire system.

## 📁 Test Structure

```
tests/
├── e2e/                 # End-to-end tests
│   ├── e2e-test.js     # Main E2E test suite
│   └── reports/        # Test execution reports
├── integration/        # Cross-service integration tests (future)
└── performance/        # Load and stress tests (future)
```

## 🎯 Test Types

### End-to-End Tests (`/e2e`)
- **Purpose**: Validate complete user workflows across all services
- **Scope**: Frontend → Backend → Database → AI Services
- **Run**: `npm run test:e2e` from root directory

### Component-Specific Tests
- **Backend Tests**: Located in `/backend/tests/`
  - Unit tests: `/backend/tests/unit/`
  - Integration tests: `/backend/tests/integration/`
  - Run: `cd backend && npm test`

- **Frontend Tests**: Located in `/frontend/tests/` (to be added)
  - Component tests
  - UI integration tests
  - Run: `cd frontend && npm test`

## 🚀 Running Tests

### From Root Directory:
```bash
# Run all tests
npm run test:all

# Run only E2E tests
npm run test:e2e

# Run only backend tests
npm run test:backend

# Run only frontend tests
npm run test:frontend
```

### Prerequisites:
1. MongoDB must be running
2. Backend server on port 5000
3. Frontend server on port 5173 (for full E2E)

## 📊 Test Coverage

| Component | Unit Tests | Integration Tests | E2E Tests |
|-----------|------------|-------------------|-----------|
| Authentication | ✅ | ✅ | ✅ |
| Resume Processing | ⚠️ | ❌ | ⚠️ |
| Coding Assessment | ❌ | ❌ | ✅ |
| Interview System | ❌ | ❌ | ✅ |
| Frontend | ❌ | ❌ | ⚠️ |

## 📝 Test Reports

Test reports are automatically generated in:
- E2E Reports: `/tests/e2e/e2e-test-report.json`
- Backend Coverage: `/backend/coverage/`
- Frontend Coverage: `/frontend/coverage/` (when added)

## 🔧 Adding New Tests

### E2E Test:
1. Add test cases to `/tests/e2e/e2e-test.js`
2. Follow the existing pattern using axios for API calls
3. Update this README with new test coverage

### Backend Test:
1. Unit tests go in `/backend/tests/unit/`
2. Integration tests in `/backend/tests/integration/`
3. Use Jest framework

### Frontend Test:
1. Component tests in `/frontend/tests/components/`
2. Use Vitest + React Testing Library
3. Follow React testing best practices

## 🐛 Known Issues

1. **Resume Tests**: Need sample PDF files for testing
2. **Coding Assessment**: Judge0 API subscription required
3. **Interview System**: Routes need registration in app.js
4. **Frontend Tests**: Not yet implemented

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [E2E Testing Best Practices](https://testingjavascript.com/)