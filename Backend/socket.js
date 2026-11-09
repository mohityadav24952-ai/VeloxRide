const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');
const rideModel = require('./models/ride.model');
const blacklistTokenModel = require('./models/blacklistToken.model');

let io;

const modelFor = (userType) => (userType === 'captain' ? captainModel : userModel);

// Every connection must send { token, userType } in the handshake auth.
// The socket id is saved on the account, so it is refreshed automatically
// whenever the client reconnects.
async function authenticate(socket, next) {
    try {
        const { token, userType } = socket.handshake.auth || {};
        if (!token || ![ 'user', 'captain' ].includes(userType)) {
            return next(new Error('Unauthorized'));
        }

        if (await blacklistTokenModel.exists({ token })) {
            return next(new Error('Unauthorized'));
        }

        const { _id } = jwt.verify(token, process.env.JWT_SECRET);
        const account = await modelFor(userType).findByIdAndUpdate(_id, { socketId: socket.id });
        if (!account) {
            return next(new Error('Unauthorized'));
        }

        socket.data.userId = account._id;
        socket.data.userType = userType;
        next();
    } catch {
        next(new Error('Unauthorized'));
    }
}

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: [ 'GET', 'POST' ]
        }
    });

    io.use(authenticate);

    io.on('connection', (socket) => {
        const { userId, userType } = socket.data;
        console.log(`Client connected: ${socket.id} (${userType} ${userId})`);

        socket.on('update-location-captain', async (data) => {
            if (userType !== 'captain') return;

            const { location } = data || {};
            const isValid = location
                && Number.isFinite(location.ltd) && Math.abs(location.ltd) <= 90
                && Number.isFinite(location.lng) && Math.abs(location.lng) <= 180;

            if (!isValid) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            try {
                await captainModel.updateOne({ _id: userId }, {
                    location: {
                        type: 'Point',
                        coordinates: [ location.lng, location.ltd ] // GeoJSON order: [lng, lat]
                    }
                });

                // Share the position with the rider of the captain's current ride
                const activeRide = await rideModel.findOne({
                    captain: userId,
                    status: { $in: [ 'accepted', 'ongoing' ] }
                }).populate('user', 'socketId');

                if (activeRide?.user?.socketId) {
                    io.to(activeRide.user.socketId).emit('captain-location', {
                        rideId: activeRide._id,
                        location: { lat: location.ltd, lng: location.lng }
                    });
                }
            } catch (err) {
                console.error('location update failed:', err.message);
            }
        });

        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}`);
            try {
                // Only clear it if a newer connection hasn't replaced it already
                await modelFor(userType).updateOne({ _id: userId, socketId: socket.id }, { $unset: { socketId: 1 } });
            } catch (err) {
                console.error('disconnect cleanup failed:', err.message);
            }
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {
    if (!socketId) return;

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };
