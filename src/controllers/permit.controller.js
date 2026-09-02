'use strict';

const { Vehicle, Permit, sequelize } = require('../models');
const generatePermitNumber = require('../utils/generatePermitNumber');

const PERMIT_VALIDITY_DAYS = parseInt(process.env.PERMIT_VALIDITY_DAYS, 10) || 365;

/**
 * Applies for a parking permit.
 *
 * Authorization is fully server-side:
 *  - requireAuth already re-verified the caller's email is on the active
 *    AuthorizedUser list (see src/middleware/auth.js).
 *  - Here we additionally verify that the college status the applicant
 *    *declared* on the form matches the status the college *actually has
 *    on file* for them (req.user.role, sourced from AuthorizedUser at
 *    registration). A client cannot grant themselves a staff permit by
 *    editing the request body.
 *
 * Every attempt is persisted (approved or rejected) so there is an audit
 * trail of who applied, with what details, and why a request failed.
 */
async function applyForPermit(req, res, next) {
  const { collegeStatus, vehicle } = req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      const createdVehicle = await Vehicle.create(
        {
          userId: req.user.id,
          plateNumber: vehicle.plateNumber,
          make: vehicle.make,
          model: vehicle.model,
          color: vehicle.color,
          year: vehicle.year,
        },
        { transaction: t }
      );

      const declaredStatusMatchesRecord = collegeStatus === req.user.role;

      if (!declaredStatusMatchesRecord) {
        return Permit.create(
          {
            userId: req.user.id,
            vehicleId: createdVehicle.id,
            collegeStatus,
            status: 'rejected',
            rejectionReason: `Declared status "${collegeStatus}" does not match the college's record for this account.`,
          },
          { transaction: t }
        );
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + PERMIT_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

      return Permit.create(
        {
          userId: req.user.id,
          vehicleId: createdVehicle.id,
          collegeStatus,
          status: 'approved',
          permitNumber: generatePermitNumber(collegeStatus),
          issuedAt: now,
          expiresAt,
        },
        { transaction: t }
      );
    });

    const permit = await Permit.findByPk(result.id, { include: [{ model: Vehicle }] });
    const httpStatus = permit.status === 'approved' ? 201 : 200;
    return res.status(httpStatus).json({ permit });
  } catch (err) {
    return next(err);
  }
}

async function listMyPermits(req, res, next) {
  try {
    const permits = await Permit.findAll({
      where: { userId: req.user.id },
      include: [{ model: Vehicle }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ permits });
  } catch (err) {
    return next(err);
  }
}

async function getPermitById(req, res, next) {
  try {
    const permit = await Permit.findByPk(req.params.id, { include: [{ model: Vehicle }] });
    if (!permit) {
      return res.status(404).json({ error: 'Permit not found.' });
    }
    // Server-side ownership check: a regular user may only view their own
    // permit, regardless of what id they request.
    if (permit.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'You do not have access to this permit.' });
    }
    return res.json({ permit });
  } catch (err) {
    return next(err);
  }
}

module.exports = { applyForPermit, listMyPermits, getPermitById };
