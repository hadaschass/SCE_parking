'use strict';

const express = require('express');
const { listAllPermits, listAuthorizedUsers } = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/permits', listAllPermits);
router.get('/authorized-users', listAuthorizedUsers);

module.exports = router;
