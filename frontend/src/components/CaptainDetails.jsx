import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'
import Avatar from './Avatar'
import { VEHICLES, fullName } from '../utils/format'
import { BASE_URL, authHeader, apiError } from '../utils/api'

const CaptainDetails = () => {

    const { captain, setCaptain } = useContext(CaptainDataContext)
    const [ stats, setStats ] = useState(null)
    const [ updating, setUpdating ] = useState(false)
    const [ error, setError ] = useState('')

    const vehicle = captain?.vehicle || {}
    const isOnline = captain?.status === 'active'

    useEffect(() => {
        axios.get(`${BASE_URL}/captains/stats`, { headers: authHeader('captain') })
            .then(({ data }) => setStats(data))
            .catch(() => setStats(null))
    }, [])

    const toggleOnline = async () => {
        setUpdating(true)
        setError('')
        try {
            const { data } = await axios.patch(`${BASE_URL}/captains/status`,
                { status: isOnline ? 'inactive' : 'active' },
                { headers: authHeader('captain') }
            )
            setCaptain(data.captain)
        } catch (err) {
            setError(apiError(err, 'Could not change your status.'))
        } finally {
            setUpdating(false)
        }
    }

    const tiles = [
        { icon: 'ri-wallet-3-line', value: stats ? `₹${stats.todayEarnings}` : '--', label: 'Earned today' },
        { icon: 'ri-route-line', value: stats?.todayRides ?? '--', label: 'Rides today' },
        { icon: 'ri-star-line', value: captain?.rating?.count ? captain.rating.average.toFixed(1) : 'New', label: 'Rating' },
    ]

    return (
        <div>
            <div className='flex items-center justify-between'>
                <div className='flex items-center justify-start gap-3'>
                    <Avatar name={fullName(captain)} className='h-10 w-10' />
                    <div>
                        <h4 className='text-lg font-medium capitalize'>{fullName(captain)}</h4>
                        <p className='text-sm text-gray-600 capitalize'>{vehicle.color} {VEHICLES[ vehicle.vehicleType ]?.label}</p>
                    </div>
                </div>
                <div className='text-right'>
                    <h4 className='text-xl font-semibold uppercase'>{vehicle.plate}</h4>
                    <p className='text-sm text-gray-600'>Number plate</p>
                </div>
            </div>

            <button
                onClick={toggleOnline}
                disabled={updating}
                className={`w-full mt-5 p-3 rounded-lg font-semibold text-white disabled:opacity-60 ${isOnline ? 'bg-green-600' : 'bg-black'}`}>
                {isOnline ? 'You are online. Tap to go offline' : 'Go online to get rides'}
            </button>
            {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}

            <div className='flex p-3 mt-5 bg-gray-100 rounded-xl justify-around gap-5 items-start'>
                {tiles.map(tile => (
                    <div key={tile.label} className='text-center'>
                        <i className={`text-3xl mb-2 font-thin ${tile.icon}`}></i>
                        <h5 className='text-lg font-medium'>{tile.value}</h5>
                        <p className='text-sm text-gray-600'>{tile.label}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CaptainDetails
