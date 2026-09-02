'use strict';

const { body } = require('express-validator');

const currentYear = new Date().getFullYear();

const applyForPermitValidators = [
  body('collegeStatus')
    .trim()
    .notEmpty()
    .withMessage('College status is required.')
    .isIn(['student', 'staff'])
    .withMessage('College status must be "student" or "staff".'),

  body('vehicle').isObject().withMessage('Vehicle details are required.'),
  body('vehicle.plateNumber')
    .trim()
    .notEmpty()
    .withMessage('License plate number is required.')
    .isLength({ min: 2, max: 12 })
    .withMessage('License plate number must be 2-12 characters.')
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('License plate number may only contain letters, numbers and hyphens.'),
  body('vehicle.make').trim().notEmpty().withMessage('Vehicle make is required.').isLength({ max: 50 }),
  body('vehicle.model').trim().notEmpty().withMessage('Vehicle model is required.').isLength({ max: 50 }),
  body('vehicle.color').trim().notEmpty().withMessage('Vehicle color is required.').isLength({ max: 30 }),
  body('vehicle.year')
    .notEmpty()
    .withMessage('Vehicle year is required.')
    .isInt({ min: 1980, max: currentYear + 1 })
    .withMessage(`Vehicle year must be between 1980 and ${currentYear + 1}.`)
    .toInt(),
];

module.exports = { applyForPermitValidators };
