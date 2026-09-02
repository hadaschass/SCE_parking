'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/auth.controller');
const { registerValidators, loginValidators } = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Slow down credential-guessing / registration-spam attempts against these
// endpoints specifically.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, registerValidators, validate, register);
router.post('/login', authLimiter, loginValidators, validate, login);
router.get('/me', requireAuth, me);

module.exports = router;
