'use strict';

/* eslint-disable no-unused-vars */
function notFoundHandler(req, res, next) {
  res.status(404).json({ error: 'Not found.' });
}

function errorHandler(err, req, res, next) {
  // Avoid leaking internals (stack traces, SQL, etc.) to clients.
  const status = err.status || 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({
    error: status >= 500 ? 'Internal server error.' : err.message || 'Request failed.',
  });
}
/* eslint-enable no-unused-vars */

module.exports = { notFoundHandler, errorHandler };
