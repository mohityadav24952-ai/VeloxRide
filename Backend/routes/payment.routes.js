const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/auth.middleware');
const paymentController = require('../controllers/payment.controller');

router.get('/config', authMiddleware.authUser, paymentController.getConfig);

router.post('/create-order',
    authMiddleware.authUser,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    paymentController.createOrder
);

router.post('/verify',
    authMiddleware.authUser,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    body('razorpay_order_id').isString().notEmpty(),
    body('razorpay_payment_id').isString().notEmpty(),
    body('razorpay_signature').isString().notEmpty(),
    paymentController.verifyPayment
);

module.exports = router;
