const AssessmentModel = require('../models/AssessmentModel');
const Assessment = require('../../../../domain/assessment/aggregates/Assessment');
const Question = require('../../../../domain/assessment/entities/Question');
const AssessmentId = require('../../../../domain/assessment/valueObjects/AssessmentId');
const QuestionId = require('../../../../domain/assessment/valueObjects/QuestionId');
const Duration = require('../../../../domain/assessment/valueObjects/Duration');
const Score = require('../../../../domain/assessment/valueObjects/Score');
const { EntityNotFoundError } = require('../../../../domain/errors/DomainError');

/**
 * Assessment Repository - DDD Pattern
 *
 * Infrastructure layer - Handles persistence for Assessment Aggregates.
 * Maps between domain entities (Assessment, Question) and MongoDB persistence models.
 */
class AssessmentRepository {
  /**
   * Save assessment aggregate
   */
  async save(assessment) {
    try {
      const persistenceModel = this._toPersistenceModel(assessment);

      // Check if exists
      const existing = await AssessmentModel.findById(persistenceModel._id);

      if (existing) {
        // Update existing
        Object.assign(existing, persistenceModel);
        const saved = await existing.save();
        return this._toDomainAggregate(saved.toObject());
      } else {
        // Create new
        const doc = new AssessmentModel(persistenceModel);
        const saved = await doc.save();
        return this._toDomainAggregate(saved.toObject());
      }
    } catch (error) {
      throw new Error(`Failed to save assessment: ${error.message}`);
    }
  }

  /**
   * Find assessment by ID
   */
  async findById(id) {
    try {
      const idValue = id instanceof AssessmentId ? id.value : id.toString();
      const doc = await AssessmentModel.findById(idValue).lean();

      if (!doc) return null;

      return this._toDomainAggregate(doc);
    } catch (error) {
      throw new Error(`Failed to find assessment: ${error.message}`);
    }
  }

  /**
   * Find all active assessments
   */
  async findActive() {
    try {
      const docs = await AssessmentModel.find({ status: 'active' })
        .sort({ createdAt: -1 })
        .lean();

      return docs.map(doc => this._toDomainAggregate(doc));
    } catch (error) {
      throw new Error(`Failed to find active assessments: ${error.message}`);
    }
  }

  /**
   * Find assessments by creator
   */
  async findByCreator(userId) {
    try {
      const userIdValue = userId.value || userId.toString();

      const docs = await AssessmentModel.find({ createdBy: userIdValue })
        .sort({ createdAt: -1 })
        .lean();

      return docs.map(doc => this._toDomainAggregate(doc));
    } catch (error) {
      throw new Error(`Failed to find assessments by creator: ${error.message}`);
    }
  }

  /**
   * Find assessments by category
   */
  async findByCategory(category) {
    try {
      const docs = await AssessmentModel.find({
        category,
        status: 'active'
      })
        .sort({ createdAt: -1 })
        .lean();

      return docs.map(doc => this._toDomainAggregate(doc));
    } catch (error) {
      throw new Error(`Failed to find assessments by category: ${error.message}`);
    }
  }

  /**
   * Find assessments by difficulty
   */
  async findByDifficulty(difficulty) {
    try {
      const docs = await AssessmentModel.find({
        difficulty,
        status: 'active'
      })
        .sort({ createdAt: -1 })
        .lean();

      return docs.map(doc => this._toDomainAggregate(doc));
    } catch (error) {
      throw new Error(`Failed to find assessments by difficulty: ${error.message}`);
    }
  }

  /**
   * Search assessments
   */
  async search(query, options = {}) {
    try {
      const searchQuery = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ],
        isActive: true
      };
      
      const dbQuery = AssessmentModel.find(searchQuery);
      
      if (options.limit) {
        dbQuery.limit(options.limit);
      }
      
      if (options.skip) {
        dbQuery.skip(options.skip);
      }
      
      const assessments = await dbQuery.lean();
      
      return assessments.map(a => this._toDomainEntity(a));
    } catch (error) {
      throw new Error(`Failed to search assessments: ${error.message}`);
    }
  }

  /**
   * Get user progress for assessment
   */
  async getUserProgress(userId, assessmentId) {
    try {
      const assessment = await AssessmentModel.findById(assessmentId)
        .select('userProgress')
        .lean();
      
      if (!assessment || !assessment.userProgress) {
        return null;
      }
      
      return assessment.userProgress[userId] || null;
    } catch (error) {
      throw new Error(`Failed to get user progress: ${error.message}`);
    }
  }

  /**
   * Update user progress
   */
  async updateUserProgress(userId, assessmentId, progress) {
    try {
      const updatePath = `userProgress.${userId}`;
      
      const updated = await AssessmentModel.findByIdAndUpdate(
        assessmentId,
        {
          $set: {
            [updatePath]: {
              ...progress,
              lastUpdated: new Date()
            }
          }
        },
        { new: true }
      ).lean();
      
      return updated ? updated.userProgress[userId] : null;
    } catch (error) {
      throw new Error(`Failed to update user progress: ${error.message}`);
    }
  }

  /**
   * Get popular assessments
   */
  async getPopular(limit = 10) {
    try {
      const assessments = await AssessmentModel.find({ isActive: true })
        .sort({ attemptCount: -1, averageScore: -1 })
        .limit(limit)
        .lean();
      
      return assessments.map(a => this._toDomainEntity(a));
    } catch (error) {
      throw new Error(`Failed to get popular assessments: ${error.message}`);
    }
  }

  /**
   * Update statistics
   */
  async updateStatistics(assessmentId, stats) {
    try {
      const updated = await AssessmentModel.findByIdAndUpdate(
        assessmentId,
        {
          $inc: {
            attemptCount: stats.attempts || 0,
            totalScore: stats.score || 0
          },
          $set: {
            averageScore: stats.averageScore,
            lastAttemptAt: new Date()
          }
        },
        { new: true }
      ).lean();
      
      return this._toDomainEntity(updated);
    } catch (error) {
      throw new Error(`Failed to update statistics: ${error.message}`);
    }
  }

  /**
   * Delete assessment
   */
  async delete(assessmentId) {
    try {
      // Soft delete
      const result = await AssessmentModel.findByIdAndUpdate(
        assessmentId,
        { 
          isActive: false,
          deletedAt: new Date()
        }
      );
      
      return result !== null;
    } catch (error) {
      throw new Error(`Failed to delete assessment: ${error.message}`);
    }
  }

  /**
   * Count assessments
   */
  async count(filter = {}) {
    try {
      return await AssessmentModel.countDocuments({
        ...filter,
        isActive: true
      });
    } catch (error) {
      throw new Error(`Failed to count assessments: ${error.message}`);
    }
  }

  // ============================================================================
  // Mapping: Domain → Persistence
  // ============================================================================

  /**
   * Convert Assessment Aggregate to persistence model
   */
  _toPersistenceModel(aggregate) {
    return {
      _id: aggregate.id.value || aggregate.id,
      title: aggregate.title,
      description: aggregate.description,
      questions: aggregate.questions.map(q => this._questionToPersistence(q)),
      durationMinutes: aggregate.duration.minutes,
      difficulty: aggregate.difficulty,
      category: aggregate.category,
      tags: aggregate.tags,
      createdBy: aggregate.createdBy.value || aggregate.createdBy,
      organizationId: aggregate._organizationId,
      status: aggregate.status,
      publishedAt: aggregate.publishedAt,
      passingScore: aggregate.passingScore.value,
      shuffleQuestions: aggregate.shuffleQuestions,
      showCorrectAnswers: aggregate.showCorrectAnswers,
      attemptCount: aggregate.attemptCount,
      averageScore: aggregate.averageScore ? aggregate.averageScore.value : null,
      createdAt: aggregate.createdAt,
      updatedAt: aggregate.updatedAt
    };
  }

  /**
   * Convert Question Entity to persistence subdocument
   */
  _questionToPersistence(question) {
    return {
      _id: question.id.value || question.id,
      text: question.text,
      type: question.type,
      options: question.options,
      correctAnswer: question.correctAnswer,
      points: question.points.value,
      difficulty: question.difficulty,
      category: question.category,
      tags: question.tags,
      starterCode: question.starterCode,
      testCases: question.testCases,
      rubric: question.rubric,
      maxWords: question.maxWords,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };
  }

  // ============================================================================
  // Mapping: Persistence → Domain
  // ============================================================================

  /**
   * Convert persistence model to Assessment Aggregate
   */
  _toDomainAggregate(persistenceModel) {
    if (!persistenceModel) return null;

    return new Assessment({
      id: AssessmentId.fromObjectId(persistenceModel._id),
      title: persistenceModel.title,
      description: persistenceModel.description,
      questions: (persistenceModel.questions || []).map(q => this._questionToDomain(q)),
      duration: Duration.fromMinutes(persistenceModel.durationMinutes),
      difficulty: persistenceModel.difficulty,
      category: persistenceModel.category,
      tags: persistenceModel.tags || [],
      createdBy: persistenceModel.createdBy,
      organizationId: persistenceModel.organizationId,
      status: persistenceModel.status,
      publishedAt: persistenceModel.publishedAt,
      passingScore: Score.create(persistenceModel.passingScore),
      shuffleQuestions: persistenceModel.shuffleQuestions,
      showCorrectAnswers: persistenceModel.showCorrectAnswers,
      attemptCount: persistenceModel.attemptCount || 0,
      averageScore: persistenceModel.averageScore,
      createdAt: persistenceModel.createdAt,
      updatedAt: persistenceModel.updatedAt
    });
  }

  /**
   * Convert persistence subdocument to Question Entity
   */
  _questionToDomain(persistenceQuestion) {
    return new Question({
      id: QuestionId.fromObjectId(persistenceQuestion._id),
      text: persistenceQuestion.text,
      type: persistenceQuestion.type,
      options: persistenceQuestion.options || [],
      correctAnswer: persistenceQuestion.correctAnswer,
      points: Score.create(persistenceQuestion.points),
      difficulty: persistenceQuestion.difficulty,
      category: persistenceQuestion.category,
      tags: persistenceQuestion.tags || [],
      starterCode: persistenceQuestion.starterCode,
      testCases: persistenceQuestion.testCases || [],
      rubric: persistenceQuestion.rubric,
      maxWords: persistenceQuestion.maxWords,
      createdAt: persistenceQuestion.createdAt,
      updatedAt: persistenceQuestion.updatedAt
    });
  }
}

module.exports = AssessmentRepository;