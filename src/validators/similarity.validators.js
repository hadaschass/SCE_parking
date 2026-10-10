'use strict';

const { body } = require('express-validator');

function textList(field, count, label) {
  return [
    body(field)
      .isArray({ min: count, max: count })
      .withMessage(`Exactly ${count} ${label} are required.`)
      .custom((items) => new Set(items.map((s) => String(s).trim().toLowerCase())).size === items.length)
      .withMessage(`Each of the ${label} must be different.`),
    body(`${field}.*`)
      .isString()
      .withMessage(`Each of the ${label} must be text.`)
      .trim()
      .isLength({ min: 2, max: 60 })
      .withMessage(`Each of the ${label} must be between 2 and 60 characters.`),
  ];
}

const similarityValidators = [
  ...textList('traits', 5, 'personal characteristics'),
  ...textList('roles', 3, 'technology roles'),
];

module.exports = { similarityValidators };
