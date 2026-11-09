import React, { useEffect, useState } from 'react'
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%',
};

// Shown until the browser reports the real position (Dehradun).
const DEFAULT_CENTER = {
    lat: 30.3165,
    lng: 78.0322
};

// Map centred on the viewer's own position.
// `markers` adds extra pins, e.g. [{ position: { lat, lng }, label: 'C', title: 'Your captain' }]
const LiveTracking = ({ markers = [] }) => {
    const [ currentPosition, setCurrentPosition ] = useState(DEFAULT_CENTER);

    useEffect(() => {
        if (!navigator.geolocation) return

        const updatePosition = (position) => {
            setCurrentPosition({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
        }

        // watchPosition fires on every movement, so no polling interval is needed
        const watchId = navigator.geolocation.watchPosition(
            updatePosition,
            (err) => console.warn('Location unavailable:', err.message),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentPosition}
                zoom={15}
            >
                <Marker position={currentPosition} title='You' />
                {markers.map((marker, index) => (
                    <Marker key={index} position={marker.position} label={marker.label} title={marker.title} />
                ))}
            </GoogleMap>
        </LoadScript>
    )
}

export default LiveTracking
