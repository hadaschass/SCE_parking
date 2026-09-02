'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const permitRoutes = require('./routes/permit.routes');
const adminRoutes = require('./routes/admin.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
    })
  );
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/permits', permitRoutes);
  app.use('/api/admin', adminRoutes);

  // Simple static frontend (plain HTML/CSS/JS) that talks to the API above.
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
