import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import axios from 'axios'
import FinishRide from '../components/FinishRide'
import LiveTracking from '../components/LiveTracking'
import Logo from '../components/Logo'
import { SocketContext } from '../context/SocketContext'
import useCaptainLocation from '../hooks/useCaptainLocation'
import { formatDistance } from '../utils/format'
import { BASE_URL, authHeader } from '../utils/api'

const CaptainRiding = () => {

    const [ finishRidePanel, setFinishRidePanel ] = useState(false)
    const finishRidePanelRef = useRef(null)
    const location = useLocation()
    const navigate = useNavigate()
    const { socket } = useContext(SocketContext)
    const [ ride, setRide ] = useState(location.state?.ride || null)

    // Keep sending location so the rider can track the trip
    useCaptainLocation(socket)

    // After a page refresh the router state is gone, so ask the server.
    useEffect(() => {
        if (ride) return

        axios.get(`${BASE_URL}/rides/captain/active`, { headers: authHeader('captain') })
            .then(({ data }) => {
                if (data?.status === 'ongoing') {
                    setRide(data)
                } else {
                    navigate('/captain-home')
                }
            })
            .catch(() => navigate('/captain-home'))
    }, [ ride, navigate ])

    useEffect(() => {
        const onPaymentReceived = ({ rideId }) => {
            setRide(current => (current && current._id === rideId)
                ? { ...current, paymentStatus: 'paid', paymentMethod: 'online' }
                : current)
        }

        socket.on('payment-received', onPaymentReceived)
        return () => socket.off('payment-received', onPaymentReceived)
    }, [ socket ])

    useGSAP(function () {
        gsap.to(finishRidePanelRef.current, {
            transform: finishRidePanel ? 'translateY(0)' : 'translateY(100%)'
        })
    }, [ finishRidePanel ])

    const paidOnline = ride?.paymentStatus === 'paid'

    return (
        <div className='h-screen relative flex flex-col justify-end'>

            <div className='fixed p-6 top-0 flex items-center justify-between w-screen'>
                <Logo className='bg-white rounded-xl px-3 py-2' />
                <Link to='/captain-home' title='Home' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                    <i className="text-lg font-medium ri-home-5-line"></i>
                </Link>
            </div>

            <div className='h-1/5 p-6 flex items-center justify-between relative bg-yellow-400 pt-10'
                onClick={() => {
                    if (ride) setFinishRidePanel(true)
                }}
            >
                <h5 className='p-1 text-center w-[90%] absolute top-0'><i className="text-3xl text-gray-800 ri-arrow-up-wide-line"></i></h5>
                <div>
                    <h4 className='text-xl font-semibold'>{ride ? `${formatDistance(ride.distance)} trip` : 'Loading ride...'}</h4>
                    {paidOnline && <p className='text-sm font-medium text-green-800'>Paid online</p>}
                </div>
                <button disabled={!ride} className=' bg-green-600 disabled:opacity-50 text-white font-semibold p-3 px-10 rounded-lg'>Complete Ride</button>
            </div>
            <div ref={finishRidePanelRef} className='fixed w-full z-[500] bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <FinishRide
                    ride={ride}
                    setFinishRidePanel={setFinishRidePanel} />
            </div>

            <div className='h-screen fixed w-screen top-0 z-[-1]'>
                <LiveTracking />
            </div>

        </div>
    )
}

export default CaptainRiding
