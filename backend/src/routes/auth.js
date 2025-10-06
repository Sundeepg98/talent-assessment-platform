const express = require('express');

/**
 * Auth Routes with 100% Dependency Injection
 * No manual instantiation - everything from container
 */
const router = express.Router();

// All dependencies are injected via middleware
router.post('/register', async (req, res, next) => {
  try {
    const registerUserUseCase = req.getService('registerUserUseCase');
    const result = await registerUserUseCase.execute(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const loginUseCase = req.getService('loginUseCase');
    const result = await loginUseCase.execute(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const authMiddleware = req.getService('authMiddleware');
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => err ? reject(err) : resolve());
    });
    
    const userRepository = req.getService('userRepository');
    const user = await userRepository.findById(req.user.uid);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
