'use strict';

const { body } = require('express-validator');

const emailWeatherValidators = [
  body('location')
    .isString()
    .withMessage('Location is required.')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters.'),
];

module.exports = { emailWeatherValidators };
