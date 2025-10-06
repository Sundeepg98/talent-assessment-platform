const awilix = require('awilix');
const path = require('path');
const mongoose = require('mongoose');

/**
 * 100% Dependency Injection Container
 * Every service, repository, and use case is registered here
 */
class CompleteDIContainer {
  constructor() {
    this.container = awilix.createContainer({
      injectionMode: awilix.InjectionMode.PROXY
    });
    
    console.log('💉 Initializing 100% DI Container...');
    this.registerAll();
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
    // Register Mongoose models
    this.container.register({
      UserModel: awilix.asValue(mongoose.models.User || require('../../models/User')),
      SubmissionModel: awilix.asValue(mongoose.models.Submission || require('../../models/Submission')),
      InterviewSessionModel: awilix.asValue(mongoose.models.InterviewSession || require('../../models/InterviewSession')),
      ResumeAnalysisModel: awilix.asValue(mongoose.models.ResumeAnalysis || require('../../models/ResumeAnalysis'))
    });
  }

  registerInfrastructure() {
    // External services
    this.container.register({
      // Judge0 Service
      judge0Service: awilix.asClass(require('../../services/assessment/judge0Service'))
        .singleton()
        .inject(() => ({
          apiKey: process.env.JUDGE0_API_KEY || 'test-judge0-key',
          baseUrl: process.env.JUDGE0_BASE_URL || 'https://judge0-ce.p.rapidapi.com',
          apiHost: 'judge0-ce.p.rapidapi.com'
        })),

      // Gemini AI Service
      geminiService: awilix.asClass(require('../../ai-services/llm/geminiService'))
        .singleton()
        .inject(() => ({
          apiKey: process.env.GEMINI_API_KEY || 'test-gemini-key'
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
      // User Repository
      userRepository: awilix.asFunction(({ UserModel }) => ({
        findByEmail: async (email) => {
          return await UserModel.findOne({ email });
        },
        findById: async (id) => {
          return await UserModel.findById(id);
        },
        create: async (userData) => {
          const user = new UserModel(userData);
          return await user.save();
        },
        update: async (id, updates) => {
          return await UserModel.findByIdAndUpdate(id, updates, { new: true });
        },
        delete: async (id) => {
          return await UserModel.findByIdAndDelete(id);
        }
      })).singleton(),

      // Submission Repository
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

      // Interview Repository
      interviewRepository: awilix.asFunction(({ InterviewSessionModel }) => ({
        create: async (interviewData) => {
          const interview = new InterviewSessionModel(interviewData);
          return await interview.save();
        },
        findById: async (id) => {
          return await InterviewSessionModel.findById(id);
        },
        findByUserId: async (userId) => {
          return await InterviewSessionModel.find({ candidateId: userId });
        },
        updateAnalysis: async (id, analysis) => {
          return await InterviewSessionModel.findByIdAndUpdate(
            id,
            { analysis, analyzedAt: new Date() },
            { new: true }
          );
        }
      })).singleton(),

      // Resume Repository
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
          
          const isValid = await passwordService.compare(password, user.password);
          if (!isValid) throw new Error('Invalid credentials');
          
          const token = tokenService.generateToken({ 
            uid: user._id, 
            email: user.email 
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

      // Resume Analyzer (Gemini + ML based analyzer)
      resumeAnalyzer: awilix.asClass(
        require('../../services/processing/resumeAnalyzer')
      ).singleton()
    });
  }

  registerUseCases() {
    this.container.register({
      // Authentication Use Cases
      registerUserUseCase: awilix.asFunction(({ userRepository, passwordService, tokenService, emailService }) => ({
        execute: async ({ email, password, name }) => {
          const existingUser = await userRepository.findByEmail(email);
          if (existingUser) throw new Error('User already exists');
          
          const hashedPassword = await passwordService.hash(password);
          const user = await userRepository.create({
            email,
            password: hashedPassword,
            name
          });
          
          const token = tokenService.generateToken({ uid: user._id, email });
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
            const decoded = tokenService.verifyToken(token);
            req.user = decoded;
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

module.exports = CompleteDIContainer;
