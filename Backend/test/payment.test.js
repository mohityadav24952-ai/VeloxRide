const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { isValidSignature } = require('../services/payment.service');

const SECRET = 'test_secret';
const sign = (orderId, paymentId) =>
    crypto.createHmac('sha256', SECRET).update(`${orderId}|${paymentId}`).digest('hex');

test('accepts a correct Razorpay signature', () => {
    assert.equal(isValidSignature('order_1', 'pay_1', sign('order_1', 'pay_1'), SECRET), true);
});

test('rejects a signature for a different payment', () => {
    assert.equal(isValidSignature('order_1', 'pay_2', sign('order_1', 'pay_1'), SECRET), false);
});

test('rejects malformed or missing signatures', () => {
    assert.equal(isValidSignature('order_1', 'pay_1', 'abc', SECRET), false);
    assert.equal(isValidSignature('order_1', 'pay_1', undefined, SECRET), false);
});
