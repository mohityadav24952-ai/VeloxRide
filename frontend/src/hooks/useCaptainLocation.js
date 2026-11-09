import { useEffect } from 'react'

const LOCATION_INTERVAL_MS = 10000

// Sends the captain's GPS position to the server every 10 seconds.
// The server uses it for nearby-ride search and live tracking for the rider.
export default function useCaptainLocation(socket, enabled = true) {
    useEffect(() => {
        if (!enabled || !navigator.geolocation) return

        const sendLocation = () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    socket.emit('update-location-captain', {
                        location: {
                            ltd: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    })
                },
                (err) => console.warn('Location unavailable:', err.message)
            )
        }

        sendLocation()
        const intervalId = setInterval(sendLocation, LOCATION_INTERVAL_MS)

        return () => clearInterval(intervalId)
    }, [ socket, enabled ])
}
