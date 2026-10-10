'use strict';

const path = require('path');
const express = require('express');
const embedding = require('./embedding');
const { analyze } = require('./similarity');

const TRAIT_COUNT = 5;
const ROLE_COUNT = 3;

/** Returns an error message, or null if the list is valid. */
function checkList(items, count, label) {
  if (!Array.isArray(items) || items.length !== count) return `Exactly ${count} ${label} are required.`;
  if (items.some((s) => typeof s !== 'string')) return `Each of the ${label} must be text.`;
  const trimmed = items.map((s) => s.trim());
  if (trimmed.some((s) => s.length < 2 || s.length > 60)) return `Each of the ${label} must be between 2 and 60 characters.`;
  if (new Set(trimmed.map((s) => s.toLowerCase())).size !== count) return `Each of the ${label} must be different.`;
  return null;
}

function createApp({ embed = embedding.embed, model = embedding.MODEL } = {}) {
  const app = express();
  app.use(express.json({ limit: '20kb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.post('/api/similarity', async (req, res, next) => {
    try {
      const { traits, roles } = req.body || {};
      const problems = [
        checkList(traits, TRAIT_COUNT, 'personal characteristics'),
        checkList(roles, ROLE_COUNT, 'technology roles'),
      ].filter(Boolean);
      if (problems.length) return res.status(422).json({ error: problems.join(' ') });

      const t = traits.map((s) => s.trim());
      const r = roles.map((s) => s.trim());
      const vectors = await embed([...t, ...r]);
      return res.json({ model, ...analyze(t, r, vectors.slice(0, t.length), vectors.slice(t.length)) });
    } catch (err) {
      return next(err);
    }
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err.cause || err);
    res.status(status).json({ error: status >= 500 && !err.status ? 'Internal server error.' : err.message });
  });

  return app;
}

module.exports = { createApp };
