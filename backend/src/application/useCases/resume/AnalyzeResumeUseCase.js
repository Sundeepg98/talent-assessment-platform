/**
 * AnalyzeResumeUseCase
 * DDD: Application service for resume analysis
 * SOLID: Single Responsibility - Resume analysis only
 */
class AnalyzeResumeUseCase {
  constructor(dependencies = {}) {
    // Handle null/undefined dependencies
    const deps = dependencies || {};

    // Support both generic and specific dependency names
    const resumeRepository = deps.resumeRepository || deps.repository;
    const fileValidator = deps.fileValidator || deps.service;
    const pdfProcessor = deps.pdfProcessor || deps.eventBus;
    const aiAnalyzer = deps.aiAnalyzer;

    // Store dependencies for DI verification
    this.repository = resumeRepository;
    this.service = fileValidator;
    this.eventBus = pdfProcessor;

    // Private references for internal use
    this._resumeRepository = resumeRepository;
    this._fileValidator = fileValidator;
    this._pdfProcessor = pdfProcessor;
    this._aiAnalyzer = aiAnalyzer;
  }

  async execute(dto) {
    try {
      // Validate input
      if (!dto.file || !dto.userId) {
        return {
          success: false,
          error: 'Missing required fields'
        };
      }

      // Validate file
      const fileValidation = await this._fileValidator.validateFile(dto.file, 'documents');
      if (!fileValidation.valid) {
        return {
          success: false,
          error: fileValidation.errors.join(', ')
        };
      }

      // Extract text from PDF
      const extractedText = await this._pdfProcessor.extractText(dto.file.buffer);
      
      if (!extractedText || extractedText.length < 100) {
        return {
          success: false,
          error: 'Unable to extract sufficient text from resume'
        };
      }

      // Perform AI analysis
      const analysis = await this._aiAnalyzer.analyzeResume({
        text: extractedText,
        jobDescription: dto.jobDescription,
        targetRole: dto.targetRole
      });

      // Create resume entity
      const resume = {
        userId: dto.userId,
        fileName: dto.file.originalname,
        fileSize: dto.file.size,
        fileHash: fileValidation.hash,
        extractedText,
        analysis: {
          score: analysis.score,
          matchPercentage: analysis.matchPercentage,
          skills: analysis.skills,
          experience: analysis.experience,
          education: analysis.education,
          keywords: analysis.keywords,
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          atsScore: analysis.atsScore
        },
        metadata: {
          pageCount: analysis.pageCount,
          wordCount: analysis.wordCount,
          hasContactInfo: analysis.hasContactInfo,
          hasSummary: analysis.hasSummary,
          sectionsFound: analysis.sectionsFound
        },
        analyzedAt: new Date()
      };

      // Save resume analysis
      const savedResume = await this._resumeRepository.save(resume);

      // Generate recommendations
      const recommendations = this._generateRecommendations(analysis);

      return {
        success: true,
        analysis: {
          id: savedResume.id,
          score: analysis.score,
          matchPercentage: analysis.matchPercentage,
          atsScore: analysis.atsScore,
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          recommendations,
          skills: {
            found: analysis.skills.found,
            missing: analysis.skills.missing,
            relevant: analysis.skills.relevant
          },
          experience: {
            totalYears: analysis.experience.totalYears,
            relevantYears: analysis.experience.relevantYears,
            companies: analysis.experience.companies,
            roles: analysis.experience.roles
          },
          education: {
            degrees: analysis.education.degrees,
            certifications: analysis.education.certifications,
            relevance: analysis.education.relevance
          },
          keywords: {
            matched: analysis.keywords.matched,
            missing: analysis.keywords.missing,
            frequency: analysis.keywords.frequency
          }
        }
      };

    } catch (error) {
      console.error('Analyze resume error:', error);
      return {
        success: false,
        error: error.message || 'Resume analysis failed'
      };
    }
  }

  _generateRecommendations(analysis) {
    const recommendations = [];

    // ATS score recommendations
    if (analysis.atsScore < 70) {
      recommendations.push({
        priority: 'high',
        category: 'ats',
        message: 'Improve ATS compatibility by using standard section headings and avoiding graphics'
      });
    }

    // Skills recommendations
    if (analysis.skills.missing.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'skills',
        message: `Add missing key skills: ${analysis.skills.missing.slice(0, 5).join(', ')}`
      });
    }

    // Experience recommendations
    if (analysis.experience.relevantYears < 2) {
      recommendations.push({
        priority: 'medium',
        category: 'experience',
        message: 'Highlight more relevant experience and quantify achievements'
      });
    }

    // Keywords recommendations
    const keywordMatch = (analysis.keywords.matched.length / (analysis.keywords.matched.length + analysis.keywords.missing.length)) * 100;
    if (keywordMatch < 60) {
      recommendations.push({
        priority: 'high',
        category: 'keywords',
        message: 'Include more relevant keywords from the job description'
      });
    }

    // Structure recommendations
    if (!analysis.hasSummary) {
      recommendations.push({
        priority: 'medium',
        category: 'structure',
        message: 'Add a professional summary at the beginning of your resume'
      });
    }

    if (!analysis.hasContactInfo) {
      recommendations.push({
        priority: 'critical',
        category: 'contact',
        message: 'Ensure your contact information is clearly visible'
      });
    }

    // Length recommendations
    if (analysis.pageCount > 2) {
      recommendations.push({
        priority: 'medium',
        category: 'length',
        message: 'Consider reducing resume length to 2 pages or less'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

module.exports = AnalyzeResumeUseCase;