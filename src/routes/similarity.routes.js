'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { compareSimilarity } = require('../controllers/similarity.controller');
const { similarityValidators } = require('../validators/similarity.validators');
const validate = require('../middleware/validate');

const router = express.Router();

// Running the language model is CPU-heavy, so cap the request rate.
const similarityLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', similarityLimiter, similarityValidators, validate, compareSimilarity);

module.exports = router;
