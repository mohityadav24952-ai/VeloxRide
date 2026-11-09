const rideModel = require('../models/ride.model');
const captainModel = require('../models/captain.model');
const mapService = require('./maps.service');
const crypto = require('crypto');
const { HttpError } = require('../utils/httpError');

// Fare = base + (km × perKm) + (minutes × perMin), all in ₹
const RATES = {
    auto: { base: 30, perKm: 10, perMin: 2 },
    car: { base: 50, perKm: 15, perMin: 3 },
    moto: { base: 20, perKm: 8, perMin: 1.5 },
};

const ACTIVE_STATUSES = [ 'pending', 'accepted', 'ongoing' ];

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
        throw new HttpError(400, 'Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);
    return calculateFare(distanceTime);
}

function generateOtp(digits) {
    return crypto.randomInt(Math.pow(10, digits - 1), Math.pow(10, digits)).toString();
}

async function createRide({ user, pickup, destination, vehicleType }) {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new HttpError(400, 'All fields are required');
    }

    const existing = await rideModel.exists({ user, status: { $in: ACTIVE_STATUSES } });
    if (existing) {
        throw new HttpError(409, 'You already have an active ride');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);
    const fare = calculateFare(distanceTime);

    return rideModel.create({
        user,
        pickup,
        destination,
        vehicleType,
        otp: generateOtp(6),
        fare: fare[ vehicleType ],
        distance: distanceTime.distance.value, // meters
        duration: distanceTime.duration.value  // seconds
    });
}

async function confirmRide({ rideId, captain }) {
    // Only a ride that is still pending can be accepted, so two captains
    // cannot accept the same ride.
    const accepted = await rideModel.findOneAndUpdate(
        { _id: rideId, status: 'pending' },
        { status: 'accepted', captain: captain._id }
    );

    if (!accepted) {
        throw new HttpError(409, 'Ride is no longer available');
    }

    return rideModel.findById(rideId).populate('user').populate('captain').select('+otp');
}

async function startRide({ rideId, otp, captain }) {
    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new HttpError(404, 'Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new HttpError(400, 'Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new HttpError(400, 'Invalid OTP');
    }

    await rideModel.updateOne({ _id: rideId }, { status: 'ongoing' });

    ride.status = 'ongoing';
    return ride;
}

async function endRide({ rideId, captain }) {
    const ride = await rideModel.findOneAndUpdate(
        { _id: rideId, captain: captain._id, status: 'ongoing' },
        { status: 'completed', completedAt: new Date() },
        { new: true }
    ).populate('user').populate('captain');

    if (!ride) {
        throw new HttpError(404, 'Ride not found or not ongoing');
    }

    // Not paid online by the end of the trip -> the captain collected cash.
    if (ride.paymentStatus !== 'paid') {
        await rideModel.updateOne({ _id: rideId }, { paymentStatus: 'paid', paymentMethod: 'cash' });
        ride.paymentStatus = 'paid';
        ride.paymentMethod = 'cash';
    }

    return ride;
}

async function cancelRide({ rideId, cancelledBy, accountId }) {
    // Riders can cancel until the trip starts; captains only after accepting.
    const filter = cancelledBy === 'user'
        ? { _id: rideId, user: accountId, status: { $in: [ 'pending', 'accepted' ] } }
        : { _id: rideId, captain: accountId, status: 'accepted' };

    const ride = await rideModel.findOneAndUpdate(
        filter,
        { status: 'cancelled', cancelledBy },
        { new: true }
    ).populate('user').populate('captain');

    if (!ride) {
        throw new HttpError(400, 'This ride can no longer be cancelled');
    }

    return ride;
}

// Used when nobody can be notified about a new ride.
async function cancelBySystem(rideId) {
    await rideModel.updateOne({ _id: rideId, status: 'pending' }, { status: 'cancelled', cancelledBy: 'system' });
}

// The latest ride that is still in progress, so the app can resume after a refresh.
function getActiveRide({ role, accountId }) {
    const statuses = role === 'user' ? ACTIVE_STATUSES : [ 'accepted', 'ongoing' ];
    const query = rideModel.findOne({ [ role ]: accountId, status: { $in: statuses } })
        .sort({ createdAt: -1 })
        .populate('user')
        .populate('captain');

    // Only the rider may see the OTP
    return role === 'user' ? query.select('+otp') : query;
}

function getRideHistory({ role, accountId, limit = 20 }) {
    const otherParty = role === 'user' ? 'captain' : 'user';

    return rideModel.find({ [ role ]: accountId, status: { $in: [ 'completed', 'cancelled' ] } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate(otherParty, 'fullname vehicle');
}

async function rateRide({ rideId, userId, rating, feedback }) {
    const update = { rating };
    if (feedback) {
        update.feedback = feedback;
    }

    const ride = await rideModel.findOneAndUpdate(
        { _id: rideId, user: userId, status: 'completed', rating: { $exists: false } },
        update,
        { new: true }
    );

    if (!ride) {
        throw new HttpError(400, 'Only a completed, unrated ride can be rated');
    }

    const captain = await captainModel.findById(ride.captain);
    if (captain) {
        const count = captain.rating?.count || 0;
        const average = captain.rating?.average || 0;
        const newAverage = (average * count + rating) / (count + 1);

        await captainModel.updateOne({ _id: captain._id }, {
            rating: { count: count + 1, average: Math.round(newAverage * 100) / 100 }
        });
    }

    return ride;
}

async function getCaptainStats(captainId) {
    // "Today" uses the server's timezone
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const isToday = { $gte: [ '$completedAt', startOfDay ] };

    const [ totals ] = await rideModel.aggregate([
        { $match: { captain: captainId, status: 'completed' } },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: '$fare' },
                totalRides: { $sum: 1 },
                todayEarnings: { $sum: { $cond: [ isToday, '$fare', 0 ] } },
                todayRides: { $sum: { $cond: [ isToday, 1, 0 ] } },
            }
        }
    ]);

    return {
        totalEarnings: totals?.totalEarnings || 0,
        totalRides: totals?.totalRides || 0,
        todayEarnings: totals?.todayEarnings || 0,
        todayRides: totals?.todayRides || 0,
    };
}

module.exports = {
    RATES,
    calculateFare,
    generateOtp,
    getFare,
    createRide,
    confirmRide,
    startRide,
    endRide,
    cancelRide,
    cancelBySystem,
    getActiveRide,
    getRideHistory,
    rateRide,
    getCaptainStats,
};
