import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { BASE_URL, authHeader, apiError } from '../utils/api'
import { fullName, placeTitle } from '../utils/format'

const STATUS_STYLES = {
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
}

const otherPartyText = (ride, role) => {
    const other = role === 'captain' ? ride.user : ride.captain
    if (other) return fullName(other)
    return ride.cancelledBy === 'system' ? 'No captain found' : 'No captain assigned'
}

// Past rides for a rider (role='user') or a captain (role='captain').
const RideHistory = ({ role }) => {
    const [ rides, setRides ] = useState(null)
    const [ error, setError ] = useState('')

    const endpoint = role === 'captain' ? '/rides/captain/history' : '/rides/history'
    const homePath = role === 'captain' ? '/captain-home' : '/home'

    useEffect(() => {
        axios.get(`${BASE_URL}${endpoint}`, { headers: authHeader(role) })
            .then(({ data }) => setRides(data))
            .catch(err => setError(apiError(err, 'Could not load your rides.')))
    }, [ endpoint, role ])

    return (
        <div className='min-h-screen p-6'>
            <div className='flex items-center justify-between mb-6'>
                <h2 className='text-2xl font-semibold'>Your rides</h2>
                <Link to={homePath} title='Back' className='h-10 w-10 bg-gray-100 flex items-center justify-center rounded-full'>
                    <i className='text-lg ri-close-line'></i>
                </Link>
            </div>

            {error && <p className='text-red-600'>{error}</p>}
            {!error && rides === null && <p className='text-gray-600'>Loading...</p>}
            {rides?.length === 0 && <p className='text-gray-600'>No rides yet.</p>}

            {rides?.map(ride => (
                <div key={ride._id} className='border-2 border-gray-100 rounded-xl p-3 mb-3'>
                    <div className='flex items-center justify-between'>
                        <p className='text-sm text-gray-600'>{new Date(ride.createdAt).toLocaleString()}</p>
                        <span className={`text-xs font-semibold capitalize px-2 py-1 rounded-full ${STATUS_STYLES[ ride.status ] || 'bg-gray-100'}`}>
                            {ride.status}
                        </span>
                    </div>
                    <p className='font-medium mt-1 truncate'>{placeTitle(ride.pickup)} → {placeTitle(ride.destination)}</p>
                    <div className='flex items-center justify-between text-sm mt-1'>
                        <span className='capitalize text-gray-700'>{otherPartyText(ride, role)}</span>
                        <span className='font-semibold'>₹{ride.fare}</span>
                    </div>
                    {ride.rating && (
                        <p className='text-sm text-yellow-500 mt-1'>
                            {'★'.repeat(ride.rating)}<span className='text-gray-300'>{'★'.repeat(5 - ride.rating)}</span>
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}

export default RideHistory
