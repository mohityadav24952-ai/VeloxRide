const { validationResult } = require('express-validator');
const paymentService = require('../services/payment.service');
const { sendMessageToSocketId } = require('../socket');
const { sendError } = require('../utils/httpError');

module.exports.getConfig = (req, res) => {
    const enabled = paymentService.isConfigured();
    res.status(200).json({ enabled, keyId: enabled ? process.env.RAZORPAY_KEY_ID : null });
}

module.exports.createOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const order = await paymentService.createOrder({ rideId: req.body.rideId, userId: req.user._id });
        return res.status(201).json(order);
    } catch (err) {
        return sendError(res, err);
    }
}

module.exports.verifyPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    try {
        const ride = await paymentService.verifyPayment({
            rideId,
            userId: req.user._id,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
        });

        sendMessageToSocketId(ride.captain?.socketId, {
            event: 'payment-received',
            data: { rideId: ride._id, amount: ride.fare }
        });

        return res.status(200).json({ rideId: ride._id, paymentStatus: ride.paymentStatus, paymentMethod: ride.paymentMethod });
    } catch (err) {
        return sendError(res, err);
    }
}
