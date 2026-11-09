const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator');
const blackListTokenModel = require('../models/blacklistToken.model');
const { sendError } = require('../utils/httpError');

module.exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password } = req.body;

    try {
        const isUserAlready = await userModel.findOne({ email });
        if (isUserAlready) {
            return res.status(400).json({ message: 'User already exist' });
        }

        const hashedPassword = await userModel.hashPassword(password);

        const user = await userService.createUser({
            firstname: fullname.firstname,
            lastname: fullname.lastname,
            email,
            password: hashedPassword
        });

        const token = user.generateAuthToken();
        res.status(201).json({ token, user });
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = user.generateAuthToken();
        res.cookie('token', token);
        res.status(200).json({ token, user });
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.getUserProfile = async (req, res) => {
    res.status(200).json(req.user);
}

module.exports.logoutUser = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[ 1 ] || req.cookies.token;
    res.clearCookie('token');

    try {
        // upsert so logging out twice with the same token doesn't fail
        await blackListTokenModel.updateOne({ token }, { $setOnInsert: { token } }, { upsert: true });
        res.status(200).json({ message: 'Logged out' });
    } catch (err) {
        return sendError(res, err);
    }
}
