const express = require('express');

/**
 * Coding Routes with 100% Dependency Injection
 */
const router = express.Router();

// Middleware to inject auth for protected routes
const requireAuth = async (req, res, next) => {
  const authMiddleware = req.getService('authMiddleware');
  authMiddleware(req, res, next);
};

router.post('/submit', requireAuth, async (req, res, next) => {
  try {
    const submitCodeUseCase = req.getService('submitCodeUseCase');
    const { sourceCode, languageId, stdin } = req.body;
    
    const result = await submitCodeUseCase.execute({
      userId: req.user.uid,
      sourceCode,
      languageId,
      stdin
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/submission/:token', requireAuth, async (req, res, next) => {
  try {
    const getSubmissionStatusUseCase = req.getService('getSubmissionStatusUseCase');
    const result = await getSubmissionStatusUseCase.execute({
      token: req.params.token
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/languages', async (req, res, next) => {
  try {
    const judge0Service = req.getService('judge0Service');
    const languages = await judge0Service.getSupportedLanguages();
    res.json(languages);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
