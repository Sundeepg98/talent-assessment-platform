#!/bin/bash

# Service Reorganization Script
# This script reorganizes the services folder structure

cd /var/projects/Others/talent-assessment-platform/backend/src/services

echo "📁 Creating domain folder structure..."
mkdir -p auth communication assessment interview infrastructure validation processing

echo "🗑️ Removing mock stub files..."
# Remove mock stubs (files that are just jest mocks)
rm -f emailService.js emailService.spec.js
rm -f emailVerificationService.js emailVerificationService.spec.js
rm -f tokenService.js tokenService.spec.js
rm -f refreshTokenService.js refreshTokenService.spec.js
rm -f passwordResetService.js passwordResetService.spec.js
rm -f sessionManagerService.js sessionManagerService.spec.js
rm -f twoFactorAuthService.js twoFactorAuthService.spec.js
rm -f fileValidatorService.js fileValidatorService.spec.js
rm -f videoInterviewService.js videoInterviewService.spec.js

echo "📦 Moving services to domain folders..."

# Auth services
mv -f TokenService.js TokenService.spec.js auth/ 2>/dev/null
mv -f refreshTokens.js refreshTokens.spec.js auth/ 2>/dev/null
mv -f passwordReset.js passwordReset.spec.js auth/ 2>/dev/null
mv -f twoFactorAuth.js twoFactorAuth.spec.js auth/ 2>/dev/null

# Communication services
mv -f emailVerification.js emailVerification.spec.js communication/ 2>/dev/null

# Assessment services
mv -f judge0Service.js judge0Service.spec.js assessment/ 2>/dev/null
mv -f mockJudge0Service.js mockJudge0Service.spec.js assessment/ 2>/dev/null
mv -f realJudge0Service.js realJudge0Service.spec.js assessment/ 2>/dev/null
mv -f questionService.js questionService.spec.js assessment/ 2>/dev/null
mv -f questionBank.js questionBank.spec.js assessment/ 2>/dev/null

# Interview services
mv -f videoInterview.js videoInterview.spec.js interview/ 2>/dev/null
mv -rf interviewAnalyzer interview/ 2>/dev/null

# Infrastructure services
mv -f cacheService.js cacheService.spec.js infrastructure/ 2>/dev/null
mv -f ServiceLocator.js ServiceLocator.spec.js infrastructure/ 2>/dev/null
mv -f serviceConfig.js serviceConfig.spec.js infrastructure/ 2>/dev/null
mv -f sessionManager.js sessionManager.spec.js infrastructure/ 2>/dev/null

# Validation services
mv -f fileValidator.js fileValidator.spec.js validation/ 2>/dev/null

# Processing services
mv -f pdfProcessor.js pdfProcessor.spec.js processing/ 2>/dev/null
mv -rf resume processing/ 2>/dev/null
mv -rf resumeAnalyzer processing/ 2>/dev/null
mv -rf textAnalysis processing/ 2>/dev/null

echo "✅ Reorganization complete!"
echo ""
echo "New structure:"
echo "services/"
echo "├── auth/"
echo "├── communication/"
echo "├── assessment/"
echo "├── interview/"
echo "├── infrastructure/"
echo "├── validation/"
echo "└── processing/"