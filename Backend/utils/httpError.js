// An error that carries the HTTP status to send back to the client.
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const sendError = (res, err) => {
    if (!err.status) {
        console.error(err);
    }
    return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
};

module.exports = { HttpError, sendError };
