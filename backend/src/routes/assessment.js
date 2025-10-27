const express = require('express');
const router = express.Router();
const container = require('../infrastructure/config/ApplicationContainer');
const auth = require('../middleware/auth');

/**
 * Assessment Routes - DDD Implementation
 *
 * Exposes DDD use cases for Assessment bounded context.
 * All routes use dependency injection and domain aggregates.
 */

// ============================================================================
// POST /api/assessments - Create new assessment
// ============================================================================
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, description, durationMinutes, category, difficulty } = req.body;

    const createAssessmentUseCase = container.resolve('createAssessmentUseCase');

    const assessment = await createAssessmentUseCase.execute({
      title,
      description,
      durationMinutes: parseInt(durationMinutes) || 60,
      createdBy: req.user.uid,
      category: category || 'general',
      difficulty: difficulty || 'medium'
    });

    res.status(201).json({
      success: true,
      data: assessment.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/assessments/:id/publish - Publish assessment
// ============================================================================
router.post('/:id/publish', auth, async (req, res, next) => {
  try {
    const publishAssessmentUseCase = container.resolve('publishAssessmentUseCase');

    const assessment = await publishAssessmentUseCase.execute({
      assessmentId: req.params.id
    });

    res.json({
      success: true,
      data: assessment.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/assessments/:id/questions - Add question to assessment
// ============================================================================
router.post('/:id/questions', auth, async (req, res, next) => {
  try {
    const addQuestionToAssessmentUseCase = container.resolve('addQuestionToAssessmentUseCase');

    const assessment = await addQuestionToAssessmentUseCase.execute({
      assessmentId: req.params.id,
      questionData: req.body
    });

    res.status(201).json({
      success: true,
      data: assessment.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/assessments - List assessments
// ============================================================================
router.get('/', auth, async (req, res, next) => {
  try {
    const assessmentRepository = container.resolve('assessmentRepository');

    let assessments;
    if (req.query.active === 'true') {
      assessments = await assessmentRepository.findActive();
    } else if (req.query.createdBy) {
      assessments = await assessmentRepository.findByCreator(req.query.createdBy);
    } else {
      assessments = await assessmentRepository.findActive();
    }

    res.json({
      success: true,
      data: assessments.map(a => a.toJSON())
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/assessments/:id - Get single assessment
// ============================================================================
router.get('/:id', auth, async (req, res, next) => {
  try {
    const assessmentRepository = container.resolve('assessmentRepository');

    const assessment = await assessmentRepository.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment.toJSONWithDetails()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/assessments/:id/details - Get assessment with full question details
// ============================================================================
router.get('/:id/details', auth, async (req, res, next) => {
  try {
    const assessmentRepository = container.resolve('assessmentRepository');

    const assessment = await assessmentRepository.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment.toJSONWithDetails()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE /api/assessments/:id - Archive assessment
// ============================================================================
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const assessmentRepository = container.resolve('assessmentRepository');

    const assessment = await assessmentRepository.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    // Domain logic - archive instead of delete
    assessment.archive();
    await assessmentRepository.save(assessment);

    res.json({
      success: true,
      message: 'Assessment archived successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
