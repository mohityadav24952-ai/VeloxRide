const axios = require('axios');
const crypto = require('crypto');
const rideModel = require('../models/ride.model');
const { HttpError } = require('../utils/httpError');

const RAZORPAY_API = 'https://api.razorpay.com/v1';

const isConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// Razorpay signs "<order_id>|<payment_id>" with the key secret (HMAC-SHA256).
function isValidSignature(orderId, paymentId, signature, secret) {
    if (!orderId || !paymentId || !signature || !secret) return false;

    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return expected.length === signature.length
        && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function createOrder({ rideId, userId }) {
    if (!isConfigured()) {
        throw new HttpError(503, 'Online payments are not configured');
    }

    const ride = await rideModel.findOne({ _id: rideId, user: userId });
    if (!ride) {
        throw new HttpError(404, 'Ride not found');
    }
    if (ride.status !== 'ongoing') {
        throw new HttpError(400, 'You can pay online only during the ride');
    }
    if (ride.paymentStatus === 'paid') {
        throw new HttpError(400, 'This ride is already paid');
    }

    let order;
    try {
        const response = await axios.post(`${RAZORPAY_API}/orders`, {
            amount: Math.round(ride.fare * 100), // paise
            currency: 'INR',
            receipt: ride._id.toString(),
        }, {
            auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_KEY_SECRET }
        });
        order = response.data;
    } catch (err) {
        console.error('Razorpay order failed:', err.response?.data || err.message);
        throw new HttpError(502, 'Could not create the payment order');
    }

    ride.orderId = order.id;
    await ride.save();

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
    };
}

async function verifyPayment({ rideId, userId, orderId, paymentId, signature }) {
    if (!isConfigured()) {
        throw new HttpError(503, 'Online payments are not configured');
    }

    const ride = await rideModel.findOne({ _id: rideId, user: userId }).populate('captain');
    if (!ride) {
        throw new HttpError(404, 'Ride not found');
    }
    if (ride.orderId !== orderId) {
        throw new HttpError(400, 'Order does not match this ride');
    }
    if (!isValidSignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET)) {
        throw new HttpError(400, 'Invalid payment signature');
    }

    ride.paymentID = paymentId;
    ride.signature = signature;
    ride.paymentStatus = 'paid';
    ride.paymentMethod = 'online';
    await ride.save();

    return ride;
}

module.exports = { isConfigured, isValidSignature, createOrder, verifyPayment };
