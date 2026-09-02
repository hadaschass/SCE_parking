'use strict';

const express = require('express');
const { applyForPermit, listMyPermits, getPermitById } = require('../controllers/permit.controller');
const { applyForPermitValidators } = require('../validators/permit.validators');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', applyForPermitValidators, validate, applyForPermit);
router.get('/me', listMyPermits);
router.get('/:id', getPermitById);

module.exports = router;
