const mongoose = require('mongoose');

/**
 * Question Response Subdocument Schema
 * Represents a single question asked and the candidate's response
 */
const QuestionResponseSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    minlength: 10
  },
  response: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  answeredAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { _id: false });

/**
 * Interview Session MongoDB Schema
 *
 * Persistence model for InterviewSession aggregate.
 * Maps to domain aggregate: src/domain/interview/aggregates/InterviewSession.js
 */
const InterviewSessionSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    required: true,
    index: true
  },
  interviewerId: {
    type: String,
    default: null
  },
  position: {
    type: String,
    default: 'Software Engineer'
  },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'hr'],
    default: 'technical'
  },

  // Questions and responses
  questions: {
    type: [QuestionResponseSchema],
    default: []
  },

  // Duration
  durationMinutes: {
    type: Number,
    required: true,
    min: 1,
    default: 60
  },

  // Status and timestamps
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'analyzed'],
    default: 'scheduled'
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  analyzedAt: {
    type: Date,
    default: null
  },

  // Ratings and scores
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  technicalScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  communicationRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  problemSolvingRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },

  // Analysis
  analysis: {
    type: String,
    default: null
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  recommendation: {
    type: String,
    enum: ['hire', 'maybe', 'reject', null],
    default: null
  },

  // Notes
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'interviewsessions',
  toJSON: { virtuals: true },   // Include virtuals in JSON
  toObject: { virtuals: true }  // Include virtuals in objects
});

// Indexes for performance
InterviewSessionSchema.index({ candidateId: 1, status: 1 });
InterviewSessionSchema.index({ interviewerId: 1, status: 1 });
InterviewSessionSchema.index({ status: 1, scheduledAt: -1 });
InterviewSessionSchema.index({ createdAt: -1 });

// Virtual for question count
InterviewSessionSchema.virtual('questionCount').get(function() {
  return this.questions ? this.questions.length : 0;
});

const InterviewModel = mongoose.model('InterviewSession', InterviewSessionSchema);

module.exports = InterviewModel;
