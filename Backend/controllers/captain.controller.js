const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const rideService = require('../services/ride.service');
const blackListTokenModel = require('../models/blacklistToken.model');
const { validationResult } = require('express-validator');
const { sendError } = require('../utils/httpError');


module.exports.registerCaptain = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, vehicle } = req.body;

    try {
        const isCaptainAlreadyExist = await captainModel.findOne({ email });
        if (isCaptainAlreadyExist) {
            return res.status(400).json({ message: 'Captain already exist' });
        }

        const hashedPassword = await captainModel.hashPassword(password);

        const captain = await captainService.createCaptain({
            firstname: fullname.firstname,
            lastname: fullname.lastname,
            email,
            password: hashedPassword,
            color: vehicle.color,
            plate: vehicle.plate,
            capacity: vehicle.capacity,
            vehicleType: vehicle.vehicleType
        });

        const token = captain.generateAuthToken();
        res.status(201).json({ token, captain });
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.loginCaptain = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const captain = await captainModel.findOne({ email }).select('+password');
        if (!captain || !(await captain.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = captain.generateAuthToken();
        res.cookie('token', token);
        res.status(200).json({ token, captain });
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.getCaptainProfile = async (req, res) => {
    res.status(200).json({ captain: req.captain });
}

module.exports.logoutCaptain = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[ 1 ] || req.cookies.token;
    res.clearCookie('token');

    try {
        await blackListTokenModel.updateOne({ token }, { $setOnInsert: { token } }, { upsert: true });
        res.status(200).json({ message: 'Logout successfully' });
    } catch (err) {
        return sendError(res, err);
    }
}

// Go online ('active') to receive ride requests, or offline ('inactive').
module.exports.updateStatus = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const captain = await captainModel.findByIdAndUpdate(
            req.captain._id,
            { status: req.body.status },
            { new: true }
        );
        res.status(200).json({ captain });
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.getStats = async (req, res) => {
    try {
        const stats = await rideService.getCaptainStats(req.captain._id);
        res.status(200).json(stats);
    } catch (err) {
        return sendError(res, err);
    }
}
