import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import axios from 'axios'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import LiveTracking from '../components/LiveTracking'
import Logo from '../components/Logo'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import { BASE_URL, authHeader, apiError } from '../utils/api'

const LOCATION_INTERVAL_MS = 10000

const CaptainHome = () => {

    const [ ridePopupPanel, setRidePopupPanel ] = useState(false)
    const [ confirmRidePopupPanel, setConfirmRidePopupPanel ] = useState(false)
    const [ ride, setRide ] = useState(null)
    const [ notice, setNotice ] = useState('')

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

    // Register this socket and keep sending the captain's location.
    useEffect(() => {
        if (!captain?._id) return

        socket.emit('join', {
            userId: captain._id,
            userType: 'captain'
        })

        const updateLocation = () => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition(position => {
                socket.emit('update-location-captain', {
                    userId: captain._id,
                    location: {
                        ltd: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                })
            })
        }

        updateLocation()
        const locationInterval = setInterval(updateLocation, LOCATION_INTERVAL_MS)

        return () => clearInterval(locationInterval)
    }, [ captain?._id, socket ])

    useEffect(() => {
        const onNewRide = (data) => {
            setNotice('')
            setRide(data)
            setRidePopupPanel(true)
        }

        socket.on('new-ride', onNewRide)
        return () => socket.off('new-ride', onNewRide)
    }, [ socket ])

    async function confirmRide() {
        try {
            await axios.post(`${BASE_URL}/rides/confirm`, {
                rideId: ride._id
            }, {
                headers: authHeader()
            })

            setRidePopupPanel(false)
            setConfirmRidePopupPanel(true)
        } catch (err) {
            setRidePopupPanel(false)
            setConfirmRidePopupPanel(false)
            setNotice(apiError(err, 'Could not accept this ride.'))
        }
    }

    useGSAP(function () {
        gsap.to(ridePopupPanelRef.current, {
            transform: ridePopupPanel ? 'translateY(0)' : 'translateY(100%)'
        })
    }, [ ridePopupPanel ])

    useGSAP(function () {
        gsap.to(confirmRidePopupPanelRef.current, {
            transform: confirmRidePopupPanel ? 'translateY(0)' : 'translateY(100%)'
        })
    }, [ confirmRidePopupPanel ])

    return (
        <div className='h-screen'>
            <div className='fixed p-6 top-0 flex items-center justify-between w-screen z-10'>
                <Logo className='bg-white rounded-xl px-3 py-2' />
                <Link to='/captain/logout' title='Log out' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>
            </div>
            <div className='h-3/5'>
                <LiveTracking />
            </div>
            <div className='h-2/5 p-6'>
                {notice && <p className='mb-3 rounded-lg bg-red-100 text-red-700 p-3 text-sm'>{notice}</p>}
                <CaptainDetails />
            </div>
            <div ref={ridePopupPanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <RidePopUp
                    ride={ride}
                    setRidePopupPanel={setRidePopupPanel}
                    confirmRide={confirmRide}
                />
            </div>
            <div ref={confirmRidePopupPanelRef} className='fixed w-full h-screen z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <ConfirmRidePopUp
                    ride={ride}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel} setRidePopupPanel={setRidePopupPanel} />
            </div>
        </div>
    )
}

export default CaptainHome
