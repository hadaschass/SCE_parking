'use strict';

const jwt = require('jsonwebtoken');
const { User, AuthorizedUser } = require('../models');

/**
 * Verifies the JWT and loads the user fresh from the database on every
 * request. This is the server-side authorization gate: nothing about who
 * the caller is or what they're allowed to do is trusted from the client
 * beyond "which account does this valid, unexpired token belong to".
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const user = await User.findByPk(payload.sub, {
      include: [{ model: AuthorizedUser }],
    });

    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists.' });
    }

    // Re-check the authorized list on every request, not just at login,
    // so a revoked authorization takes effect immediately.
    if (!user.AuthorizedUser || !user.AuthorizedUser.isActive) {
      return res.status(403).json({ error: 'Your access has been revoked.' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Gate for admin-only routes. Must run after requireAuth. */
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
