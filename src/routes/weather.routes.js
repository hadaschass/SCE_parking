'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { emailWeather } = require('../controllers/weather.controller');
const { emailWeatherValidators } = require('../validators/weather.validators');
const validate = require('../middleware/validate');

const router = express.Router();

// Each request sends a real email, so keep the volume low.
const weatherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/email', weatherLimiter, emailWeatherValidators, validate, emailWeather);

module.exports = router;
