// CLIENT_URL can hold one origin or several, comma-separated, e.g.
// "http://localhost:5173,https://veloxride.vercel.app". Empty means allow all (development only).
module.exports = function clientOrigins() {
    const value = process.env.CLIENT_URL;
    if (!value) return '*';

    return value
        .split(',')
        .map(origin => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean);
};
