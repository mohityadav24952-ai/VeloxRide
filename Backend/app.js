const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const connectToDb = require('./db/db');
const clientOrigins = require('./utils/clientOrigins');
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

connectToDb();

// Behind a hosting proxy (Render, Railway, Heroku...) set TRUST_PROXY=1 so
// req.ip is the real visitor IP. Without it every user shares the proxy's IP
// and the rate limiter blocks everyone together.
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

app.use(cors({ origin: clientOrigins() }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const limiter = (limit) => rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
});

// Tighter limit on login/register (password guessing). Maps calls spend Google API quota.
app.use([ '/users/login', '/users/register', '/captains/login', '/captains/register' ], limiter(20));
app.use('/maps', limiter(300));

app.get('/', (req, res) => {
    res.json({ status: 'ok', app: 'VeloxRide API' });
});

app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);
app.use('/payments', paymentRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

module.exports = app;
