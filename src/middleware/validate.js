'use strict';

const { validationResult } = require('express-validator');

/** Runs after express-validator chains; rejects with a 422 if any failed. */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Invalid input.',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return next();
}

module.exports = validate;
