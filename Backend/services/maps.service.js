const axios = require('axios');
const captainModel = require('../models/captain.model');
const { HttpError } = require('../utils/httpError');

// Google Maps Platform endpoints. Distance Matrix (Legacy) and Places (Legacy)
// can't be enabled on new Google Cloud projects, so this uses their
// replacements: Routes API and Places API (New). Geocoding API is unchanged.
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const ROUTE_MATRIX_URL = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';
const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';

const apiKey = () => process.env.GOOGLE_MAPS_API;

// Log Google's real error message (e.g. "API not enabled") to the server console.
const logGoogleError = (label, err) => {
    console.error(`${label} failed:`, err.response?.data?.error?.message || err.response?.data?.error_message || err.message);
};

module.exports.getAddressCoordinate = async (address) => {
    try {
        const response = await axios.get(GEOCODE_URL, { params: { address, key: apiKey() } });

        if (response.data.status !== 'OK') {
            console.error('Geocoding failed:', response.data.status, response.data.error_message || '');
            throw new HttpError(400, 'Unable to find that address');
        }

        const location = response.data.results[ 0 ].geometry.location;
        return {
            ltd: location.lat,
            lng: location.lng
        };
    } catch (err) {
        if (err.status) throw err;
        logGoogleError('Geocoding', err);
        throw new HttpError(502, 'Unable to fetch coordinates');
    }
}

// Returns { distance: { value: meters }, duration: { value: seconds } }
module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new HttpError(400, 'Origin and destination are required');
    }

    let element;
    try {
        const response = await axios.post(ROUTE_MATRIX_URL, {
            origins: [ { waypoint: { address: origin } } ],
            destinations: [ { waypoint: { address: destination } } ],
            travelMode: 'DRIVE',
        }, {
            headers: {
                'X-Goog-Api-Key': apiKey(),
                'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,duration,condition',
            }
        });
        element = Array.isArray(response.data) ? response.data[ 0 ] : undefined;
    } catch (err) {
        logGoogleError('Routes API', err);
        throw new HttpError(502, 'Unable to fetch distance and time');
    }

    if (!element || element.condition !== 'ROUTE_EXISTS') {
        throw new HttpError(400, 'No route found between these places');
    }

    // duration comes back as a string like "1234s"
    const seconds = parseInt(element.duration, 10) || 0;
    const meters = element.distanceMeters || 0;

    return {
        distance: { value: meters, text: `${(meters / 1000).toFixed(1)} km` },
        duration: { value: seconds, text: `${Math.round(seconds / 60)} mins` },
    };
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new HttpError(400, 'query is required');
    }

    try {
        const response = await axios.post(AUTOCOMPLETE_URL, { input }, {
            headers: {
                'X-Goog-Api-Key': apiKey(),
                'X-Goog-FieldMask': 'suggestions.placePrediction.text.text',
            }
        });

        return (response.data.suggestions || [])
            .map(suggestion => suggestion.placePrediction?.text?.text)
            .filter(Boolean);
    } catch (err) {
        logGoogleError('Places autocomplete', err);
        throw new HttpError(502, 'Unable to fetch suggestions');
    }
}

// Captains that are online (have a socket) within `radius` km of the point,
// optionally limited to one vehicle type.
module.exports.getCaptainsInTheRadius = async (ltd, lng, radius, vehicleType) => {
    const EARTH_RADIUS_KM = 6371;

    const filter = {
        location: {
            $geoWithin: {
                // GeoJSON order is [lng, lat]; the radius is converted to radians
                $centerSphere: [ [ lng, ltd ], radius / EARTH_RADIUS_KM ]
            }
        },
        socketId: { $exists: true, $ne: null },
        status: 'active'
    };

    if (vehicleType) {
        filter[ 'vehicle.vehicleType' ] = vehicleType;
    }

    return captainModel.find(filter);
}