'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, AuthorizedUser } = require('../models');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
}

function toPublicUser(user, authorizedUser) {
  return {
    id: user.id,
    email: user.email,
    role: user.role, // authoritative role, set server-side at registration
    isAdmin: user.isAdmin,
    fullName: authorizedUser ? authorizedUser.fullName : undefined,
    department: authorizedUser ? authorizedUser.department : undefined,
  };
}

/**
 * Registration is where "the user's email must be checked against a
 * predefined list stored in the database" is enforced. The list is
 * AuthorizedUser; college status (role) is copied from that record, never
 * accepted from the request body, so a client cannot self-assign staff
 * access by tampering with the request.
 */
async function register(req, res, next) {
  try {
    const email = String(req.body.email).trim().toLowerCase();
    const { password } = req.body;

    const authorizedUser = await AuthorizedUser.findOne({ where: { email } });

    if (!authorizedUser || !authorizedUser.isActive) {
      // Same status/shape whether the email is unknown or was revoked, so a
      // client can't distinguish "never authorized" from "revoked".
      return res.status(403).json({
        error: 'This email is not on the college\'s authorized staff/student list.',
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account already exists for this email.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      authorizedUserId: authorizedUser.id,
      email,
      passwordHash,
      role: authorizedUser.role, // server-controlled, from the authorized list
      isAdmin: false,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user: toPublicUser(user, authorizedUser) });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = String(req.body.email).trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ where: { email }, include: [{ model: AuthorizedUser }] });

    // Generic message either way, to avoid confirming which emails have
    // accounts.
    const invalidCredentials = () => res.status(401).json({ error: 'Invalid email or password.' });

    if (!user) return invalidCredentials();

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) return invalidCredentials();

    if (!user.AuthorizedUser || !user.AuthorizedUser.isActive) {
      return res.status(403).json({ error: 'Your access has been revoked.' });
    }

    const token = signToken(user);
    return res.json({ token, user: toPublicUser(user, user.AuthorizedUser) });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  return res.json({ user: toPublicUser(req.user, req.user.AuthorizedUser) });
}

module.exports = { register, login, me };
