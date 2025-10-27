const mongoose = require('mongoose');

/**
 * Assessment Persistence Model - DDD Infrastructure Layer
 *
 * MongoDB schema for persisting Assessment aggregates.
 * This is NOT the domain model - it's just for database storage.
 * Maps to Assessment Aggregate in domain layer.
 */

// Question subdocument schema
const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'coding', 'essay', 'true-false']
  },
  options: {
    type: [String],
    default: []
  },
  correctAnswer: {
    type: {}, // Mixed type (can be string, boolean, etc.)
    default: null
  },
  points: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String,
    default: null
  },
  tags: {
    type: [String],
    default: []
  },
  starterCode: {
    type: String,
    default: null
  },
  testCases: {
    type: Array,
    default: []
  },
  rubric: {
    type: String,
    default: null
  },
  maxWords: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Assessment aggregate schema
const AssessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 200
  },
  description: {
    type: String,
    default: ''
  },
  questions: {
    type: [QuestionSchema],
    default: []
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String,
    default: 'general'
  },
  tags: {
    type: [String],
    default: []
  },
  createdBy: {
    type: String,
    required: true
  },
  organizationId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
    index: true
  },
  publishedAt: {
    type: Date,
    default: null
  },
  passingScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 60
  },
  shuffleQuestions: {
    type: Boolean,
    default: true
  },
  showCorrectAnswers: {
    type: Boolean,
    default: false
  },
  attemptCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: null
  }
}, {
  timestamps: true,
  collection: 'assessments'
});

// Indexes for performance
AssessmentSchema.index({ status: 1, createdAt: -1 });
AssessmentSchema.index({ createdBy: 1 });
AssessmentSchema.index({ category: 1, difficulty: 1 });
AssessmentSchema.index({ tags: 1 });
AssessmentSchema.index({ title: 'text', description: 'text' });

// Register model (mongoose.model() handles duplicate registration internally)
module.exports = mongoose.model('Assessment', AssessmentSchema);