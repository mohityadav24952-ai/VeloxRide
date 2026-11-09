const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const rideIdInBody = body('rideId').isMongoId().withMessage('Invalid ride id');

// ---------------------------------------------------------------- rider
router.get('/get-fare',
    authMiddleware.authUser,
    query('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
    query('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
    rideController.getFare
)

router.post('/create',
    authMiddleware.authUser,
    body('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
    body('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
    body('vehicleType').isString().isIn([ 'auto', 'car', 'moto' ]).withMessage('Invalid vehicle type'),
    rideController.createRide
)

router.post('/cancel', authMiddleware.authUser, rideIdInBody, rideController.cancelRide)

router.post('/rate',
    authMiddleware.authUser,
    rideIdInBody,
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1 to 5').toInt(),
    body('feedback').optional().isString().isLength({ max: 500 }).withMessage('Feedback is too long'),
    rideController.rateRide
)

router.get('/active', authMiddleware.authUser, rideController.getUserActiveRide)
router.get('/history', authMiddleware.authUser, rideController.getUserHistory)

// ---------------------------------------------------------------- captain
router.post('/confirm', authMiddleware.authCaptain, rideIdInBody, rideController.confirmRide)

router.get('/start-ride',
    authMiddleware.authCaptain,
    query('rideId').isMongoId().withMessage('Invalid ride id'),
    query('otp').isString().isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
    rideController.startRide
)

router.post('/end-ride', authMiddleware.authCaptain, rideIdInBody, rideController.endRide)

router.post('/captain/cancel', authMiddleware.authCaptain, rideIdInBody, rideController.captainCancelRide)
router.get('/captain/active', authMiddleware.authCaptain, rideController.getCaptainActiveRide)
router.get('/captain/history', authMiddleware.authCaptain, rideController.getCaptainHistory)

module.exports = router;
