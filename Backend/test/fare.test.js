const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateFare, generateOtp } = require('../services/ride.service');

const trip = (meters, seconds) => ({ distance: { value: meters }, duration: { value: seconds } });

test('fare for a 5 km, 15 minute trip', () => {
    // car: 50 + 5×15 + 15×3 = 170, auto: 30 + 50 + 30 = 110, moto: 20 + 40 + 22.5 = 82.5 -> 83
    assert.deepEqual(calculateFare(trip(5000, 900)), { auto: 110, car: 170, moto: 83 });
});

test('a zero-length trip costs only the base fare', () => {
    assert.deepEqual(calculateFare(trip(0, 0)), { auto: 30, car: 50, moto: 20 });
});

test('OTP is always exactly 6 digits', () => {
    for (let i = 0; i < 1000; i++) {
        assert.match(generateOtp(6), /^\d{6}$/);
    }
});
