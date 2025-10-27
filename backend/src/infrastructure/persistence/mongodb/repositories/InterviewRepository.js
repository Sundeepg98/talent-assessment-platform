const IInterviewRepository = require('../../../../domain/interview/repositories/IInterviewRepository');
const InterviewModel = require('../models/InterviewModel');
const InterviewSession = require('../../../../domain/interview/aggregates/InterviewSession');
const InterviewSessionId = require('../../../../domain/interview/valueObjects/InterviewSessionId');
const Rating = require('../../../../domain/interview/valueObjects/Rating');
const Duration = require('../../../../domain/assessment/valueObjects/Duration');
const Score = require('../../../../domain/assessment/valueObjects/Score');

/**
 * InterviewRepository MongoDB Implementation
 * Infrastructure layer - Concrete implementation of IInterviewRepository
 * SOLID: Dependency Inversion - Implements domain interface
 * DDD: Infrastructure layer handling persistence details
 */
class InterviewRepository extends IInterviewRepository {
  /**
   * Save interview
   */
  async save(interview) {
    try {
      const interviewData = this._toPersistenceModel(interview);
      
      const saved = await InterviewModel.findByIdAndUpdate(
        interviewData._id || interviewData.id,
        interviewData,
        { 
          upsert: true, 
          new: true,
          runValidators: true 
        }
      ).lean();
      
      return this._toDomainEntity(saved);
    } catch (error) {
      throw new Error(`Failed to save interview: ${error.message}`);
    }
  }

  /**
   * Find interview by ID
   */
  async findById(interviewId) {
    try {
      const interview = await InterviewModel.findById(interviewId)
        .populate('candidateId', 'username email profile')
        .populate('interviewerId', 'username email profile')
        .lean();
      
      if (!interview) return null;
      
      return this._toDomainEntity(interview);
    } catch (error) {
      throw new Error(`Failed to find interview: ${error.message}`);
    }
  }

  /**
   * Find interviews by candidate
   */
  async findByCandidateId(candidateId, options = {}) {
    try {
      const query = InterviewModel.find({ candidateId });
      
      if (options.status) {
        query.where('status').equals(options.status);
      }
      
      if (options.from) {
        query.where('scheduledAt').gte(options.from);
      }
      
      if (options.to) {
        query.where('scheduledAt').lte(options.to);
      }
      
      query.populate('interviewerId', 'username email profile')
           .sort({ scheduledAt: -1 });
      
      const interviews = await query.lean();
      
      return interviews.map(i => this._toDomainEntity(i));
    } catch (error) {
      throw new Error(`Failed to find candidate interviews: ${error.message}`);
    }
  }

  /**
   * Find interviews by interviewer
   */
  async findByInterviewerId(interviewerId, options = {}) {
    try {
      const query = InterviewModel.find({ interviewerId });
      
      if (options.status) {
        query.where('status').equals(options.status);
      }
      
      if (options.date) {
        const startOfDay = new Date(options.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(options.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query.where('scheduledAt').gte(startOfDay).lte(endOfDay);
      }
      
      query.populate('candidateId', 'username email profile')
           .sort({ scheduledAt: 1 });
      
      const interviews = await query.lean();
      
      return interviews.map(i => this._toDomainEntity(i));
    } catch (error) {
      throw new Error(`Failed to find interviewer interviews: ${error.message}`);
    }
  }

  /**
   * Find upcoming interviews
   */
  async findUpcoming(limit = 10) {
    try {
      const now = new Date();
      
      const interviews = await InterviewModel.find({
        scheduledAt: { $gte: now },
        status: 'scheduled'
      })
      .populate('candidateId', 'username email')
      .populate('interviewerId', 'username email')
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .lean();
      
      return interviews.map(i => this._toDomainEntity(i));
    } catch (error) {
      throw new Error(`Failed to find upcoming interviews: ${error.message}`);
    }
  }

  /**
   * Check for scheduling conflicts
   */
  async hasSchedulingConflict(params) {
    try {
      const { interviewerId, startTime, endTime, excludeInterviewId } = params;
      
      const query = {
        interviewerId,
        status: { $in: ['scheduled', 'in_progress'] },
        $or: [
          {
            scheduledAt: { $gte: startTime, $lt: endTime }
          },
          {
            $and: [
              { scheduledAt: { $lte: startTime } },
              { endAt: { $gt: startTime } }
            ]
          }
        ]
      };
      
      if (excludeInterviewId) {
        query._id = { $ne: excludeInterviewId };
      }
      
      const conflictingInterview = await InterviewModel.findOne(query);
      
      return conflictingInterview !== null;
    } catch (error) {
      throw new Error(`Failed to check scheduling conflict: ${error.message}`);
    }
  }

  /**
   * Update interview status
   */
  async updateStatus(interviewId, status, feedback = null) {
    try {
      const updateData = {
        status,
        [`${status}At`]: new Date()
      };
      
      if (feedback) {
        updateData.feedback = feedback;
      }
      
      if (status === 'completed') {
        updateData.completedAt = new Date();
      } else if (status === 'cancelled') {
        updateData.cancelledAt = new Date();
      }
      
      const updated = await InterviewModel.findByIdAndUpdate(
        interviewId,
        updateData,
        { new: true }
      ).lean();
      
      return this._toDomainEntity(updated);
    } catch (error) {
      throw new Error(`Failed to update interview status: ${error.message}`);
    }
  }

  /**
   * Add feedback to interview
   */
  async addFeedback(interviewId, feedback) {
    try {
      const updated = await InterviewModel.findByIdAndUpdate(
        interviewId,
        {
          $set: {
            feedback,
            feedbackProvidedAt: new Date()
          }
        },
        { new: true }
      ).lean();
      
      return this._toDomainEntity(updated);
    } catch (error) {
      throw new Error(`Failed to add feedback: ${error.message}`);
    }
  }

  /**
   * Add recording to interview
   */
  async addRecording(interviewId, recordingUrl) {
    try {
      const updated = await InterviewModel.findByIdAndUpdate(
        interviewId,
        {
          $set: {
            recordingUrl,
            hasRecording: true
          }
        },
        { new: true }
      ).lean();
      
      return this._toDomainEntity(updated);
    } catch (error) {
      throw new Error(`Failed to add recording: ${error.message}`);
    }
  }

  /**
   * Get interview statistics
   */
  async getStatistics(filter = {}) {
    try {
      const stats = await InterviewModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            scheduled: {
              $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
            },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            noShow: {
              $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] }
            },
            averageDuration: { $avg: '$duration' },
            averageRating: { $avg: '$feedback.rating' }
          }
        }
      ]);
      
      return stats[0] || {
        total: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        averageDuration: 0,
        averageRating: 0
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Delete interview
   */
  async delete(interviewId) {
    try {
      const result = await InterviewModel.findByIdAndDelete(interviewId);
      return result !== null;
    } catch (error) {
      throw new Error(`Failed to delete interview: ${error.message}`);
    }
  }

  /**
   * Convert InterviewSession aggregate to persistence model
   * @private
   */
  _toPersistenceModel(interview) {
    return {
      _id: interview.id.value || interview.id,
      candidateId: interview.candidateId.value || interview.candidateId,
      interviewerId: interview.interviewerId ? (interview.interviewerId.value || interview.interviewerId) : null,
      position: interview.position,
      type: interview.type,

      // Questions and responses
      questions: interview.questions.map(q => ({
        question: q.question,
        response: q.response,
        rating: q.rating ? q.rating.value : null,
        answeredAt: q.answeredAt
      })),

      // Duration
      durationMinutes: interview.duration.minutes,

      // Status and timestamps
      status: interview.status,
      scheduledAt: interview.scheduledAt,
      startedAt: interview.startedAt,
      completedAt: interview.completedAt,
      analyzedAt: interview.analyzedAt,

      // Ratings and scores
      overallRating: interview.overallRating ? interview.overallRating.value : null,
      technicalScore: interview.technicalScore ? interview.technicalScore.value : null,
      communicationRating: interview.communicationRating ? interview.communicationRating.value : null,
      problemSolvingRating: interview.problemSolvingRating ? interview.problemSolvingRating.value : null,

      // Analysis
      analysis: interview.analysis,
      strengths: interview.strengths,
      weaknesses: interview.weaknesses,
      recommendation: interview.recommendation,

      // Notes
      notes: interview.notes,

      // Timestamps
      createdAt: interview.createdAt,
      updatedAt: new Date()
    };
  }

  /**
   * Convert persistence model to InterviewSession aggregate
   * @private
   */
  _toDomainEntity(persistenceModel) {
    if (!persistenceModel) return null;

    // Map questions with Rating value objects
    const questions = (persistenceModel.questions || []).map(q => ({
      question: q.question,
      response: q.response,
      rating: q.rating ? Rating.create(q.rating) : null,
      answeredAt: q.answeredAt
    }));

    return new InterviewSession({
      id: InterviewSessionId.fromObjectId(persistenceModel._id),
      candidateId: persistenceModel.candidateId,
      interviewerId: persistenceModel.interviewerId,
      position: persistenceModel.position,
      type: persistenceModel.type,

      // Questions
      questions,

      // Duration
      duration: Duration.fromMinutes(persistenceModel.durationMinutes || 60),

      // Status and timestamps
      status: persistenceModel.status,
      scheduledAt: persistenceModel.scheduledAt,
      startedAt: persistenceModel.startedAt,
      completedAt: persistenceModel.completedAt,
      analyzedAt: persistenceModel.analyzedAt,

      // Ratings and scores
      overallRating: persistenceModel.overallRating ? Rating.create(persistenceModel.overallRating) : null,
      technicalScore: persistenceModel.technicalScore ? Score.create(persistenceModel.technicalScore) : null,
      communicationRating: persistenceModel.communicationRating ? Rating.create(persistenceModel.communicationRating) : null,
      problemSolvingRating: persistenceModel.problemSolvingRating ? Rating.create(persistenceModel.problemSolvingRating) : null,

      // Analysis
      analysis: persistenceModel.analysis,
      strengths: persistenceModel.strengths || [],
      weaknesses: persistenceModel.weaknesses || [],
      recommendation: persistenceModel.recommendation,

      // Notes
      notes: persistenceModel.notes,

      // Timestamps
      createdAt: persistenceModel.createdAt,
      updatedAt: persistenceModel.updatedAt
    });
  }
}

module.exports = InterviewRepository;