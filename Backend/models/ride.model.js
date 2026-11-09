const mongoose = require('mongoose');


const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captain',
    },
    pickup: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    fare: {
        type: Number,
        required: true,
    },

    vehicleType: {
        type: String,
        enum: [ 'auto', 'car', 'moto' ],
    },

    status: {
        type: String,
        enum: [ 'pending', 'accepted', 'ongoing', 'completed', 'cancelled' ],
        default: 'pending',
    },

    // Who cancelled: the rider, the captain, or the system (no captain found)
    cancelledBy: {
        type: String,
        enum: [ 'user', 'captain', 'system' ],
    },

    completedAt: {
        type: Date,
    },

    duration: {
        type: Number,
    }, // in seconds

    distance: {
        type: Number,
    }, // in meters

    paymentStatus: {
        type: String,
        enum: [ 'unpaid', 'paid' ],
        default: 'unpaid',
    },
    paymentMethod: {
        type: String,
        enum: [ 'cash', 'online' ],
        default: 'cash',
    },
    paymentID: {
        type: String,
    },
    orderId: {
        type: String,
    },
    signature: {
        type: String,
    },

    // Rider's rating of the captain, given after the ride
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    feedback: {
        type: String,
        maxlength: 500,
    },

    otp: {
        type: String,
        select: false,
        required: true,
    },
}, { timestamps: true })

module.exports = mongoose.model('ride', rideSchema);
