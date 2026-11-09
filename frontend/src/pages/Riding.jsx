import React, { useContext, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { SocketContext } from '../context/SocketContext'
import { UserDataContext } from '../context/UserContext'
import LiveTracking from '../components/LiveTracking'
import VehicleIcon from '../components/VehicleIcon'
import TripDetails from '../components/TripDetails'
import RateRide from '../components/RateRide'
import { VEHICLES, fullName } from '../utils/format'
import { BASE_URL, authHeader, apiError } from '../utils/api'
import { getPaymentConfig, payOnline } from '../utils/payment'

const Riding = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)

    const [ ride, setRide ] = useState(location.state?.ride || null)
    const [ captainPosition, setCaptainPosition ] = useState(null)
    const [ rideEnded, setRideEnded ] = useState(false)
    const [ paymentsEnabled, setPaymentsEnabled ] = useState(false)
    const [ paying, setPaying ] = useState(false)
    const [ paymentError, setPaymentError ] = useState('')

    // After a page refresh the router state is gone, so ask the server.
    useEffect(() => {
        if (ride) return

        axios.get(`${BASE_URL}/rides/active`, { headers: authHeader('user') })
            .then(({ data }) => {
                if (data?.status === 'ongoing') {
                    setRide(data)
                } else {
                    navigate('/home')
                }
            })
            .catch(() => navigate('/home'))
    }, [ ride, navigate ])

    useEffect(() => {
        getPaymentConfig()
            .then(config => setPaymentsEnabled(config.enabled))
            .catch(() => setPaymentsEnabled(false))
    }, [])

    useEffect(() => {
        const onRideEnded = (endedRide) => {
            setRide(current => ({ ...current, ...endedRide }))
            setRideEnded(true)
        }
        const onCaptainLocation = ({ location: position }) => setCaptainPosition(position)

        socket.on('ride-ended', onRideEnded)
        socket.on('captain-location', onCaptainLocation)

        return () => {
            socket.off('ride-ended', onRideEnded)
            socket.off('captain-location', onCaptainLocation)
        }
    }, [ socket ])

    async function handlePayOnline() {
        setPaying(true)
        setPaymentError('')
        try {
            await payOnline(ride, user)
            setRide(current => ({ ...current, paymentStatus: 'paid', paymentMethod: 'online' }))
        } catch (err) {
            setPaymentError(apiError(err, err.message))
        } finally {
            setPaying(false)
        }
    }

    const captain = ride?.captain
    const vehicleType = captain?.vehicle?.vehicleType
    const isPaid = ride?.paymentStatus === 'paid'
    const markers = captainPosition ? [ { position: captainPosition, label: 'C', title: 'Your captain' } ] : []

    return (
        <div className='h-screen'>
            <Link to='/home' title='Home' className='fixed right-2 top-2 z-10 h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                <i className="text-lg font-medium ri-home-5-line"></i>
            </Link>
            <div className='h-1/2'>
                <LiveTracking markers={markers} />
            </div>
            <div className='h-1/2 p-4 overflow-y-auto'>
                {!ride && <p className='text-gray-600'>Loading your ride...</p>}

                {ride && rideEnded && (
                    <RateRide ride={ride} onDone={() => navigate('/home')} />
                )}

                {ride && !rideEnded && (
                    <>
                        <div className='flex items-center justify-between'>
                            <VehicleIcon type={vehicleType} />
                            <div className='text-right'>
                                <h2 className='text-lg font-medium capitalize'>{fullName(captain)}</h2>
                                <h4 className='text-xl font-semibold -mt-1 -mb-1 uppercase'>{captain?.vehicle?.plate}</h4>
                                <p className='text-sm text-gray-600 capitalize'>{captain?.vehicle?.color} · {VEHICLES[ vehicleType ]?.label}</p>
                            </div>
                        </div>

                        <TripDetails
                            destination={ride.destination}
                            fare={ride.fare}
                            paymentLabel={isPaid ? 'Paid online' : 'Cash or online'} />

                        {isPaid && (
                            <p className='w-full mt-5 bg-green-100 text-green-800 text-center font-semibold p-2 rounded-lg'>
                                <i className='ri-checkbox-circle-fill'></i> Paid online
                            </p>
                        )}

                        {!isPaid && paymentsEnabled && (
                            <button
                                onClick={handlePayOnline}
                                disabled={paying}
                                className='w-full mt-5 bg-green-600 disabled:opacity-60 text-white font-semibold p-2 rounded-lg'>
                                {paying ? 'Opening payment...' : `Pay ₹${ride.fare} online`}
                            </button>
                        )}

                        {!isPaid && (
                            <p className='mt-2 text-center text-sm text-gray-600'>
                                {paymentsEnabled ? 'or pay in cash at drop-off' : `Pay ₹${ride.fare} in cash at drop-off`}
                            </p>
                        )}

                        {paymentError && <p className='mt-2 text-center text-sm text-red-600'>{paymentError}</p>}
                    </>
                )}
            </div>
        </div>
    )
}

export default Riding
