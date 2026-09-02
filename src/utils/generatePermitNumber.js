'use strict';

const crypto = require('crypto');

/** Generates a human-readable, reasonably-unique permit number. */
function generatePermitNumber(collegeStatus) {
  const prefix = collegeStatus === 'staff' ? 'STF' : 'STU';
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${year}-${random}`;
}

module.exports = generatePermitNumber;
