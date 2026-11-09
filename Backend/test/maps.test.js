const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const maps = require('../services/maps.service');

const realPost = axios.post;
afterEach(() => { axios.post = realPost; });

test('getDistanceTime reads a Routes API matrix element', async () => {
    let sentHeaders;
    axios.post = async (url, body, config) => {
        sentHeaders = config.headers;
        return { data: [ { originIndex: 0, destinationIndex: 0, distanceMeters: 5000, duration: '900s', condition: 'ROUTE_EXISTS' } ] };
    };

    const result = await maps.getDistanceTime('Clock Tower, Dehradun', 'ISBT, Dehradun');

    assert.equal(result.distance.value, 5000);
    assert.equal(result.duration.value, 900);
    assert.ok(sentHeaders[ 'X-Goog-FieldMask' ].includes('distanceMeters'));
});

test('getDistanceTime rejects when there is no route', async () => {
    axios.post = async () => ({ data: [ { originIndex: 0, destinationIndex: 0, condition: 'ROUTE_NOT_FOUND' } ] });

    await assert.rejects(maps.getDistanceTime('A place', 'Another place'), { status: 400 });
});

test('getAutoCompleteSuggestions returns place texts from Places API (New)', async () => {
    axios.post = async () => ({
        data: {
            suggestions: [
                { placePrediction: { text: { text: 'Clock Tower, Dehradun, Uttarakhand, India' } } },
                { queryPrediction: { text: { text: 'clock tower near me' } } },
            ]
        }
    });

    assert.deepEqual(await maps.getAutoCompleteSuggestions('clock'), [ 'Clock Tower, Dehradun, Uttarakhand, India' ]);
});

test('Google errors become a 502 for the client', async () => {
    axios.post = async () => { throw Object.assign(new Error('403'), { response: { data: { error: { message: 'API not enabled' } } } }); };

    await assert.rejects(maps.getAutoCompleteSuggestions('clock'), { status: 502 });
});
