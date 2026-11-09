const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const crypto = require('crypto');

// Fare = base + (km × perKm) + (minutes × perMin), all in ₹
const RATES = {
    auto: { base: 30, perKm: 10, perMin: 2 },
    car: { base: 50, perKm: 15, perMin: 3 },
    moto: { base: 20, perKm: 8, perMin: 1.5 },
};

function calculateFare(distanceTime) {
    const km = distanceTime.distance.value / 1000;
    const minutes = distanceTime.duration.value / 60;

    const fare = {};
    for (const [ type, rate ] of Object.entries(RATES)) {
        fare[ type ] = Math.round(rate.base + km * rate.perKm + minutes * rate.perMin);
    }
    return fare;
}

async function getFare(pickup, destination) {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);
    return calculateFare(distanceTime);
}

module.exports.getFare = getFare;


function getOtp(num) {
    return crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
}


module.exports.createRide = async ({
    user, pickup, destination, vehicleType
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);
    const fare = calculateFare(distanceTime);

    return rideModel.create({
        user,
        pickup,
        destination,
        vehicleType,
        otp: getOtp(6),
        fare: fare[ vehicleType ],
        distance: distanceTime.distance.value, // meters
        duration: distanceTime.duration.value  // seconds
    });
}

module.exports.confirmRide = async ({
    rideId, captain
}) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    // Only a ride that is still pending can be accepted, so two captains
    // cannot accept the same ride.
    const accepted = await rideModel.findOneAndUpdate(
        { _id: rideId, status: 'pending' },
        { status: 'accepted', captain: captain._id }
    );

    if (!accepted) {
        throw new Error('Ride is no longer available');
    }

    return rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');
}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing'
    })

    ride.status = 'ongoing';
    return ride;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'
    })

    ride.status = 'completed';
    return ride;
}
