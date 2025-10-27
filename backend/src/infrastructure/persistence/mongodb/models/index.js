/**
 * Persistence Model Mapping
 * Maps domain entities to MongoDB models
 */

// DDD: Use infrastructure models
// Load models directly - they will register themselves with mongoose
const UserModel = require('./UserModel');
const AssessmentModel = require('./AssessmentModel');
const InterviewModel = require('./InterviewModel');

module.exports = {
  UserModel,
  AssessmentModel,
  InterviewModel
};
