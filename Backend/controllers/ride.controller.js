const rideService = require('../services/ride.service');
const mapService = require('../services/maps.service');
const { validationResult } = require('express-validator');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');
const { sendError } = require('../utils/httpError');

const SEARCH_RADIUS_KM = 2;

// Sends a 400 with the validation errors and returns true if there are any.
function hasValidationErrors(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return true;
    }
    return false;
}

module.exports.createRide = async (req, res) => {
    if (hasValidationErrors(req, res)) return;

    const { pickup, destination, vehicleType } = req.body;

    let ride;
    try {
        ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType });
    } catch (err) {
        return sendError(res, err);
    }

    res.status(201).json(ride);

    // The response is already sent, so from here on failures are only logged.
    let captains = [];
    try {
        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        captains = await mapService.getCaptainsInTheRadius(
            pickupCoordinates.ltd, pickupCoordinates.lng, SEARCH_RADIUS_KM, vehicleType
        );

        // Skip captains who are already on a ride
        const busyIds = await rideModel.distinct('captain', { status: { $in: [ 'accepted', 'ongoing' ] } });
        const busy = new Set(busyIds.map(String));
        captains = captains.filter(captain => !busy.has(String(captain._id)));
    } catch (err) {
        console.log('Failed to find captains:', err.message);
    }

    try {
        if (captains.length === 0) {
            await rideService.cancelBySystem(ride._id);
            sendMessageToSocketId(req.user.socketId, { event: 'no-captains', data: { rideId: ride._id } });
            return;
        }

        // Fetched fresh so the OTP (select: false) is not sent to captains
        const rideWithUser = await rideModel.findById(ride._id).populate('user');
        captains.forEach(captain => {
            sendMessageToSocketId(captain.socketId, { event: 'new-ride', data: rideWithUser });
        });
    } catch (err) {
        console.log('Failed to notify about the ride:', err.message);
    }
};

module.exports.getFare = async (req, res) => {
    if (hasValidationErrors(req, res)) return;

    try {
        const fare = await rideService.getFare(req.query.pickup, req.query.destination);
        return res.status(200).json(fare);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.confirmRide = async (req, res) => {
    if (hasValidationErrors(req, res)) return;

    try {
        const ride = await rideService.confirmRide({ rideId: req.body.rideId, captain: req.captain });
        sendMessageToSocketId(ride.user.socketId, { event: 'ride-confirmed', data: ride });
        return res.status(200).json(ride);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.startRide = async (req, res) => {
    if (hasValidationErrors(req, res)) return;

    try {
        const ride = await rideService.startRide({ rideId: req.query.rideId, otp: req.query.otp, captain: req.captain });
        sendMessageToSocketId(ride.user.socketId, { event: 'ride-started', data: ride });
        return res.status(200).json(ride);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.endRide = async (req, res) => {
    if (hasValidationErrors(req, res)) return;

    try {
        const ride = await rideService.endRide({ rideId: req.body.rideId, captain: req.captain });
        sendMessageToSocketId(ride.user.socketId, { event: 'ride-ended', data: ride });
        return res.status(200).json(ride);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.cancelRide = async (req, res) => {
    if (hasValidationErrors(req, res)) return;

    try {
        const ride = await rideService.cancelRide({ rideId: req.body.rideId, cancelledBy: 'user', accountId: req.user._id });
        sendMessageToSocketId(ride.captain?.socketId, { event: 'ride-cancelled', data: { rideId: ride._id, cancelledBy: 'user' } });
        return res.status(200).json(ride);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.captainCancelRide = async (req, res) => {
    if (hasValidationErrors(req, res)) return;

    try {
        const ride = await rideService.cancelRide({ rideId: req.body.rideId, cancelledBy: 'captain', accountId: req.captain._id });
        sendMessageToSocketId(ride.user?.socketId, { event: 'ride-cancelled', data: { rideId: ride._id, cancelledBy: 'captain' } });
        return res.status(200).json(ride);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.getUserActiveRide = async (req, res) => {
    try {
        const ride = await rideService.getActiveRide({ role: 'user', accountId: req.user._id });
        return res.status(200).json(ride);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.getCaptainActiveRide = async (req, res) => {
    try {
        const ride = await rideService.getActiveRide({ role: 'captain', accountId: req.captain._id });
        return res.status(200).json(ride);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.getUserHistory = async (req, res) => {
    try {
        const rides = await rideService.getRideHistory({ role: 'user', accountId: req.user._id });
        return res.status(200).json(rides);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.getCaptainHistory = async (req, res) => {
    try {
        const rides = await rideService.getRideHistory({ role: 'captain', accountId: req.captain._id });
        return res.status(200).json(rides);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.rateRide = async (req, res) => {
    if (hasValidationErrors(req, res)) return;

    const { rideId, rating, feedback } = req.body;

    try {
        const ride = await rideService.rateRide({ rideId, userId: req.user._id, rating, feedback: feedback?.trim() });
        return res.status(200).json(ride);
    } catch (err) {
        return sendError(res, err);
    }
}
