#!/bin/bash
cd /var/projects/Others/talent-assessment-platform/backend
npx jest tests/unit/useCases/RegisterUserUseCase.test.js --config jest.config.js --no-coverage --json 2>/dev/null | jq '.numPassedTests, .numTotalTests' 2>/dev/null | paste -sd'/' | awk '{print "RegisterUserUseCase: "$0" tests passing"}'