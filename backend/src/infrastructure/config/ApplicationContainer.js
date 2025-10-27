const awilix = require('awilix');
const path = require('path');
const mongoose = require('mongoose');

/**
 * Application Dependency Injection Container
 * Central registry for all services, repositories, and use cases
 */
class ApplicationContainer {
  constructor() {
    this.container = awilix.createContainer({
      injectionMode: awilix.InjectionMode.PROXY
    });
    this._initialized = false;
  }

  /**
   * Initialize container - MUST be called after mongoose.connect() completes!
   * This ensures all mongoose models can be loaded safely.
   */
  async initialize() {
    if (this._initialized) {
      console.log('⚠️  Container already initialized, skipping...');
      return;
    }

    console.log('💉 Initializing 100% DI Container...');
    this.registerAll();
    this._initialized = true;
  }

  registerAll() {
    this.registerModels();
    this.registerInfrastructure();
    this.registerRepositories();
    this.registerDomainServices();
    this.registerUseCases();
    this.registerMiddleware();
    console.log('✅ 100% DI Container Ready!');
  }

  registerModels() {
    // Register Mongoose models (Infrastructure layer)
    // Load models directly - mongoose.models is undefined until connection established
    this.container.register({
      // DDD: Use infrastructure UserModel, not the old anemic model
      UserModel: awilix.asValue(
        require('../persistence/mongodb/models/UserModel')
      ),
      // DDD: Assessment Model for persistence
      AssessmentModel: awilix.asValue(
        require('../persistence/mongodb/models/AssessmentModel')
      ),

      InterviewModel: awilix.asValue(
        require('../persistence/mongodb/models/InterviewModel')
      )
    });
  }

  registerInfrastructure() {
    // External services
    this.container.register({
      // 🚀 NEW: Docker Execution Service (FREE, replaces Judge0)
      dockerExecutionService: awilix.asClass(require('../../services/assessment/DockerExecutionService'))
        .singleton(),

      // 🚀 NEW: Enhanced Local Code Quality Service (100% OFFLINE + Advanced Features)
      // Features: Security detection, PEP 8, TypeScript support, better scoring
      codeQualityService: awilix.asClass(require('../../services/assessment/EnhancedLocalCodeQualityService'))
        .singleton(),

      // 🚀 NEW: Hybrid Scoring Service (60% Docker + 40% Local Quality Analysis)
      hybridScoringService: awilix.asClass(require('../../services/assessment/HybridScoringService'))
        .singleton()
        .inject(() => ({
          dockerService: awilix.asFunction(() => this.container.resolve('dockerExecutionService')),
          codeQualityService: awilix.asFunction(() => this.container.resolve('codeQualityService'))
        })),

      // Legacy Judge0 Service - KEPT for backward compatibility
      // NEW: Defaults to DockerExecutionService (FREE) unless JUDGE0_API_KEY is set
      judge0Service: awilix.asClass(
        (process.env.JUDGE0_API_KEY && process.env.JUDGE0_API_KEY !== 'test-judge0-key')
          ? require('../../services/assessment/judge0Service')
          : require('../../services/assessment/DockerExecutionService')
      )
        .singleton()
        .inject(() => ({
          apiKey: process.env.JUDGE0_API_KEY || 'docker-execution',
          baseUrl: process.env.JUDGE0_BASE_URL || 'https://judge0-ce.p.rapidapi.com',
          apiHost: 'judge0-ce.p.rapidapi.com'
        })),

      // Gemini AI Service
      geminiService: awilix.asClass(require('../../ai-services/llm/geminiService'))
        .singleton()
        .inject(() => ({
          apiKey: process.env.GEMINI_API_KEY || 'test-gemini-key'
        })),

      // Python AI Service (Real ML using scikit-learn + sentence-transformers)
      pythonAIService: awilix.asClass(require('../../services/ai/PythonAIService'))
        .singleton()
        .inject(() => ({
          baseURL: process.env.PYTHON_AI_URL || 'http://localhost:8000',
          timeout: 30000
        })),

      // ✅ Resume ML Service - 3-Level Hybrid ML (Self-contained)
      resumeMLService: awilix.asClass(require('../../services/resume/ResumeMLService'))
        .singleton()
        .inject(() => ({
          pythonPath: 'python3',
          geminiKey: process.env.GEMINI_API_KEY || '',  // ✅ Inject Gemini API key for Level 3
          timeout: 30000
        })),

      // Cache Service
      cacheService: awilix.asClass(require('../../infrastructure/cache/cacheService'))
        .singleton()
        .inject(() => ({
          ttl: 3600000,
          maxSize: 100
        })),

      // Token Service
      tokenService: awilix.asClass(require('../../services/auth/TokenService'))
        .singleton()
        .inject(() => ({
          jwt: require('jsonwebtoken'),
          crypto: require('crypto'),
          accessTokenSecret: process.env.JWT_SECRET || 'your-secret-key',
          refreshTokenSecret: process.env.JWT_SECRET || 'your-secret-key',
          accessTokenExpiry: '15m',
          refreshTokenExpiry: '7d',
          verificationTokenExpiry: '24h',
          algorithm: 'HS256',
          issuer: 'talent-assessment-platform',
          audience: 'talent-assessment-users',
          blacklistStore: new Set(),
          metadataStore: new Map()
        })),

      // Email Service
      emailService: awilix.asFunction(() => ({
        sendVerificationEmail: async (email, token) => {
          console.log(`[Email] Verification sent to ${email}`);
          return true;
        },
        sendPasswordResetEmail: async (email, token) => {
          console.log(`[Email] Password reset sent to ${email}`);
          return true;
        },
        sendWelcomeEmail: async (email) => {
          console.log(`[Email] Welcome email sent to ${email}`);
          return true;
        }
      })).singleton(),

      // Session Manager
      sessionManager: awilix.asClass(require('../../infrastructure/session/sessionManager'))
        .singleton()
        .inject(() => ({
          sessionSecret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
          mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI,
          nodeEnv: process.env.NODE_ENV || 'development',
          cookieMaxAge: 1000 * 60 * 60 * 24, // 24 hours
          sessionTtl: 24 * 60 * 60, // TTL in seconds
          maxInactivity: 1000 * 60 * 60 * 24 // 24 hours in ms
        })),

      // PDF Processor
      pdfProcessor: awilix.asClass(require('../../services/processing/pdfProcessor'))
        .inject(() => ({ pdfLibrary: null }))
        .singleton(),

      // Question Service
      questionService: awilix.asClass(require('../../services/assessment/questionService'))
        .singleton(),

      // File Validator
      fileValidator: awilix.asClass(require('../../services/validation/fileValidator'))
        .singleton(),

      // Password Service
      passwordService: awilix.asFunction(() => ({
        hash: async (password) => {
          const bcrypt = require('bcryptjs');
          return await bcrypt.hash(password, 10);
        },
        compare: async (password, hash) => {
          const bcrypt = require('bcryptjs');
          return await bcrypt.compare(password, hash);
        }
      })).singleton()
    });
  }

  registerRepositories() {
    this.container.register({
      // DDD: User Repository - Proper domain repository implementation
      userRepository: awilix.asClass(
        require('../persistence/mongodb/repositories/UserRepository')
      ).singleton(),

      // DDD: Assessment Repository - Handles Assessment aggregates
      assessmentRepository: awilix.asClass(
        require('../persistence/mongodb/repositories/AssessmentRepository')
      ).singleton(),

      // DDD: Interview Repository - Handles InterviewSession aggregates
      interviewRepository: awilix.asClass(
        require('../persistence/mongodb/repositories/InterviewRepository')
      ).singleton(),

      // Submission Repository (legacy - to be migrated to DDD)
      submissionRepository: awilix.asFunction(({ SubmissionModel }) => ({
        create: async (submissionData) => {
          const submission = new SubmissionModel(submissionData);
          return await submission.save();
        },
        findById: async (id) => {
          return await SubmissionModel.findById(id);
        },
        findByUserId: async (userId) => {
          return await SubmissionModel.find({ userId });
        },
        updateStatus: async (id, status, results) => {
          return await SubmissionModel.findByIdAndUpdate(
            id,
            { status, results, updatedAt: new Date() },
            { new: true }
          );
        }
      })).singleton(),

      // Resume Repository (legacy - to be migrated to DDD)
      resumeRepository: awilix.asFunction(({ ResumeAnalysisModel }) => ({
        create: async (analysisData) => {
          const analysis = new ResumeAnalysisModel(analysisData);
          return await analysis.save();
        },
        findByUserId: async (userId) => {
          return await ResumeAnalysisModel.find({ userId });
        },
        findLatest: async (userId) => {
          return await ResumeAnalysisModel
            .findOne({ userId })
            .sort({ createdAt: -1 });
        }
      })).singleton()
    });
  }

  registerDomainServices() {
    // Domain services that orchestrate business logic
    this.container.register({
      // Authentication Domain Service
      authenticationService: awilix.asFunction(({ tokenService, passwordService, userRepository }) => ({
        authenticate: async (email, password) => {
          const user = await userRepository.findByEmail(email);
          if (!user) throw new Error('Invalid credentials');

          // DDD: User has Password VO with hash property
          const passwordHash = user.password.hash || user.password.value || user.password;
          const isValid = await passwordService.compare(password, passwordHash);
          if (!isValid) throw new Error('Invalid credentials');

          // DDD: User has Email VO and UserId VO
          const userId = user.id.value || user.id;
          const userEmail = user.email.value || user.email;

          const token = tokenService.generateAccessToken({
            uid: userId,
            email: userEmail
          });

          return { user, token };
        }
      })).singleton(),

      // Interview Analysis Service
      interviewAnalysisService: awilix.asFunction(({ geminiService, cacheService }) => ({
        analyzeResponse: async (question, response) => {
          const cacheKey = `interview:${question}:${response}`.substring(0, 100);

          const cached = cacheService.get(cacheKey);
          if (cached) return cached;

          const analysis = await geminiService.analyzeInterview(question, response);
          cacheService.set(cacheKey, analysis);

          return analysis;
        }
      })).singleton(),

      // Interview Analyzer (Python-based ML analyzer)
      interviewAnalyzer: awilix.asClass(
        require('../../services/interview/interviewAnalyzer')
      ).singleton(),

      // Resume Analyzer - COMMENTED OUT (file doesn't exist yet)
      // resumeAnalyzer: awilix.asClass(
      //   require('../../services/processing/resumeAnalyzer')
      // ).singleton(),

      // Real Interview Session Service with MongoDB persistence
      interviewSessionService: awilix.asClass(
        require('../../services/interview/InterviewSessionService')
      ).singleton(),

      // Real Question Bank Service with categorized questions
      questionBankService: awilix.asClass(
        require('../../services/interview/QuestionBankService')
      ).singleton()
    });
  }

  registerUseCases() {
    this.container.register({
      // Authentication Use Cases
      registerUserUseCase: awilix.asFunction(({ userRepository, passwordService, tokenService, emailService }) => ({
        execute: async ({ email, password, name }) => {
          // Validation
          if (!email || !password || !name) {
            const error = new Error('Email, password, and name are required');
            error.status = 400;
            throw error;
          }

          const existingUser = await userRepository.findByEmail(email);
          if (existingUser) {
            const error = new Error('User already exists');
            error.status = 400;
            throw error;
          }

          const hashedPassword = await passwordService.hash(password);
          const user = await userRepository.create({
            email,
            password: hashedPassword,
            name
          });

          // DDD: User entity has 'id' (UserId VO), not '_id'
          const userId = user.id.value || user.id;
          const userEmail = user.email.value || user.email;

          const token = tokenService.generateAccessToken({ uid: userId, email: userEmail });
          await emailService.sendVerificationEmail(email, token);

          return { user, token };
        }
      })).scoped(),

      loginUseCase: awilix.asFunction(({ authenticationService }) => ({
        execute: async ({ email, password }) => {
          return await authenticationService.authenticate(email, password);
        }
      })).scoped(),

      // Code Submission Use Cases
      submitCodeUseCase: awilix.asFunction(({ judge0Service, submissionRepository, cacheService }) => ({
        execute: async ({ userId, sourceCode, languageId, stdin }) => {
          const submission = await submissionRepository.create({
            userId,
            sourceCode,
            languageId,
            stdin
          });
          
          const judge0Result = await judge0Service.submitCode(sourceCode, languageId, stdin);
          
          await submissionRepository.updateStatus(
            submission._id,
            'submitted',
            { token: judge0Result.token }
          );
          
          return { submissionId: submission._id, token: judge0Result.token };
        }
      })).scoped(),

      getSubmissionStatusUseCase: awilix.asFunction(({ judge0Service, submissionRepository }) => ({
        execute: async ({ token, submissionId }) => {
          const status = await judge0Service.getSubmission(token);
          
          if (submissionId) {
            await submissionRepository.updateStatus(submissionId, status.status.description, status);
          }
          
          return status;
        }
      })).scoped(),

      // Interview Use Cases
      analyzeInterviewUseCase: awilix.asFunction(({ interviewAnalysisService, interviewRepository }) => ({
        execute: async ({ userId, question, response }) => {
          const analysis = await interviewAnalysisService.analyzeResponse(question, response);
          
          const interview = await interviewRepository.create({
            candidateId: userId,
            question,
            response,
            analysis
          });
          
          return interview;
        }
      })).scoped(),

      // Resume Use Cases
      analyzeResumeUseCase: awilix.asFunction(({ pdfProcessor, geminiService, resumeRepository, cacheService }) => ({
        execute: async ({ file, userId, jobDescription }) => {
          const text = await pdfProcessor.extractText(file.buffer);

          const cacheKey = `resume:${userId}:${jobDescription}`.substring(0, 100);
          let analysis = cacheService.get(cacheKey);

          if (!analysis) {
            analysis = await geminiService.analyzeResume(text, jobDescription);
            cacheService.set(cacheKey, analysis);
          }

          await resumeRepository.create({
            userId,
            resumeText: text,
            jobDescription,
            analysis
          });

          return analysis;
        }
      })).scoped(),

      // DDD: Assessment Use Cases
      createAssessmentUseCase: awilix.asFunction(({ assessmentRepository }) => ({
        execute: async ({ title, description, durationMinutes, createdBy, category, difficulty }) => {
          const Assessment = require('../../../domain/assessment/aggregates/Assessment');
          const AssessmentId = require('../../../domain/assessment/valueObjects/AssessmentId');
          const Duration = require('../../../domain/assessment/valueObjects/Duration');
          const Score = require('../../../domain/assessment/valueObjects/Score');

          const assessment = new Assessment({
            id: AssessmentId.generate(),
            title,
            description,
            duration: Duration.fromMinutes(durationMinutes || 60),
            createdBy,
            category: category || 'general',
            difficulty: difficulty || 'medium',
            passingScore: Score.create(60)
          });

          return await assessmentRepository.save(assessment);
        }
      })).scoped(),

      publishAssessmentUseCase: awilix.asFunction(({ assessmentRepository }) => ({
        execute: async ({ assessmentId }) => {
          const assessment = await assessmentRepository.findById(assessmentId);
          if (!assessment) {
            throw new Error('Assessment not found');
          }

          assessment.publish();
          return await assessmentRepository.save(assessment);
        }
      })).scoped(),

      addQuestionToAssessmentUseCase: awilix.asFunction(({ assessmentRepository }) => ({
        execute: async ({ assessmentId, questionData }) => {
          const assessment = await assessmentRepository.findById(assessmentId);
          if (!assessment) {
            throw new Error('Assessment not found');
          }

          const Score = require('../../../domain/assessment/valueObjects/Score');
          assessment.addQuestion({
            ...questionData,
            points: Score.create(questionData.points || 10)
          });

          return await assessmentRepository.save(assessment);
        }
      })).scoped(),

      // DDD: Interview Session Use Cases
      createInterviewSessionUseCase: awilix.asFunction(({ interviewRepository }) => ({
        execute: async ({ candidateId, position, type, durationMinutes, scheduledAt }) => {
          const InterviewSession = require('../../../domain/interview/aggregates/InterviewSession');
          const InterviewSessionId = require('../../../domain/interview/valueObjects/InterviewSessionId');
          const Duration = require('../../../domain/assessment/valueObjects/Duration');

          const session = new InterviewSession({
            id: InterviewSessionId.generate(),
            candidateId,
            position: position || 'Software Engineer',
            type: type || 'technical',
            duration: Duration.fromMinutes(durationMinutes || 60),
            scheduledAt: scheduledAt || new Date(),
            status: 'scheduled'
          });

          return await interviewRepository.save(session);
        }
      })).scoped(),

      startInterviewSessionUseCase: awilix.asFunction(({ interviewRepository }) => ({
        execute: async ({ sessionId }) => {
          const session = await interviewRepository.findById(sessionId);
          if (!session) {
            throw new Error('Interview session not found');
          }

          session.start();
          return await interviewRepository.save(session);
        }
      })).scoped(),

      completeInterviewSessionUseCase: awilix.asFunction(({ interviewRepository }) => ({
        execute: async ({ sessionId }) => {
          const session = await interviewRepository.findById(sessionId);
          if (!session) {
            throw new Error('Interview session not found');
          }

          session.complete();
          return await interviewRepository.save(session);
        }
      })).scoped(),

      analyzeInterviewSessionUseCase: awilix.asFunction(({ interviewRepository }) => ({
        execute: async ({ sessionId, analysis }) => {
          const session = await interviewRepository.findById(sessionId);
          if (!session) {
            throw new Error('Interview session not found');
          }

          const Rating = require('../../../domain/interview/valueObjects/Rating');
          const Score = require('../../../domain/assessment/valueObjects/Score');

          const analysisData = {
            overallRating: Rating.create(analysis.overallRating),
            technicalScore: analysis.technicalScore ? Score.create(analysis.technicalScore) : null,
            communicationRating: analysis.communicationRating ? Rating.create(analysis.communicationRating) : null,
            problemSolvingRating: analysis.problemSolvingRating ? Rating.create(analysis.problemSolvingRating) : null,
            summary: analysis.summary,
            strengths: analysis.strengths || [],
            weaknesses: analysis.weaknesses || [],
            recommendation: analysis.recommendation
          };

          session.analyze(analysisData);
          return await interviewRepository.save(session);
        }
      })).scoped()
    });
  }

  registerMiddleware() {
    this.container.register({
      // Auth Middleware
      authMiddleware: awilix.asFunction(({ tokenService }) =>
        async (req, res, next) => {
          const token = req.header('x-auth-token') ||
                       req.header('Authorization')?.replace('Bearer ', '');

          if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
          }

          try {
            const result = tokenService.verifyToken(token);
            if (!result.valid) {
              return res.status(401).json({ msg: result.error || 'Token is not valid' });
            }
            req.user = result.payload;
            next();
          } catch (err) {
            res.status(401).json({ msg: 'Token is not valid' });
          }
        }
      ).singleton(),

      // Error Handler Middleware
      errorHandler: awilix.asFunction(() => 
        (err, req, res, next) => {
          console.error(err.stack);
          res.status(err.status || 500).json({
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
          });
        }
      ).singleton()
    });
  }

  getContainer() {
    return this.container;
  }

  middleware() {
    return (req, res, next) => {
      req.container = this.container.createScope();
      req.getService = (name) => req.container.resolve(name);
      next();
    };
  }
}

module.exports = ApplicationContainer;
