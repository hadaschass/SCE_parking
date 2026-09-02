'use strict';

const { Permit, Vehicle, User, AuthorizedUser } = require('../models');

/** Admin-only: list every permit request (approved and rejected) for review. */
async function listAllPermits(req, res, next) {
  try {
    const permits = await Permit.findAll({
      include: [
        { model: Vehicle },
        { model: User, attributes: ['id', 'email', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ permits });
  } catch (err) {
    return next(err);
  }
}

/** Admin-only: view the college's predefined authorized-user list. */
async function listAuthorizedUsers(req, res, next) {
  try {
    const authorizedUsers = await AuthorizedUser.findAll({
      attributes: ['id', 'email', 'fullName', 'role', 'department', 'isActive'],
      order: [['email', 'ASC']],
    });
    return res.json({ authorizedUsers });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listAllPermits, listAuthorizedUsers };
