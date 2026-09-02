'use strict';

const { body } = require('express-validator');

const registerValidators = [
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Email must be valid.').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter.')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number.'),
  // Note: role/status is deliberately NOT accepted here. It is always
  // taken from the college's AuthorizedUser record server-side.
];

const loginValidators = [
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Email must be valid.').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required.'),
];

module.exports = { registerValidators, loginValidators };
