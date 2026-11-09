import React, { useContext, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
import LiveTracking from '../components/LiveTracking'
import VehicleIcon from '../components/VehicleIcon'
import TripDetails from '../components/TripDetails'
import { VEHICLES, fullName } from '../utils/format'

const Riding = () => {
    const location = useLocation()
    const { ride } = location.state || {}
    const { socket } = useContext(SocketContext)
    const navigate = useNavigate()

    useEffect(() => {
        const onRideEnded = () => navigate('/home')

        socket.on('ride-ended', onRideEnded)
        return () => socket.off('ride-ended', onRideEnded)
    }, [ socket, navigate ])

    const captain = ride?.captain
    const vehicleType = captain?.vehicle?.vehicleType

    return (
        <div className='h-screen'>
            <Link to='/home' title='Home' className='fixed right-2 top-2 z-10 h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                <i className="text-lg font-medium ri-home-5-line"></i>
            </Link>
            <div className='h-1/2'>
                <LiveTracking />
            </div>
            <div className='h-1/2 p-4'>
                {ride ? (
                    <>
                        <div className='flex items-center justify-between'>
                            <VehicleIcon type={vehicleType} />
                            <div className='text-right'>
                                <h2 className='text-lg font-medium capitalize'>{fullName(captain)}</h2>
                                <h4 className='text-xl font-semibold -mt-1 -mb-1 uppercase'>{captain?.vehicle?.plate}</h4>
                                <p className='text-sm text-gray-600 capitalize'>{captain?.vehicle?.color} · {VEHICLES[ vehicleType ]?.label}</p>
                            </div>
                        </div>

                        <TripDetails destination={ride.destination} fare={ride.fare} />

                        <p className='w-full mt-5 bg-green-600 text-white text-center font-semibold p-2 rounded-lg'>
                            Pay ₹{ride.fare} in cash at drop-off
                        </p>
                    </>
                ) : (
                    <p className='text-gray-600'>No active ride. <Link to='/home' className='text-blue-600'>Go home</Link></p>
                )}
            </div>
        </div>
    )
}

export default Riding
