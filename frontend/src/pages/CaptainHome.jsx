import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import useCaptainLocation from '../hooks/useCaptainLocation'
import { BASE_URL, authHeader, apiError } from '../utils/api'

const CaptainHome = () => {

    const [ ridePopupPanel, setRidePopupPanel ] = useState(false)
    const [ confirmRidePopupPanel, setConfirmRidePopupPanel ] = useState(false)
    const [ ride, setRide ] = useState(null)
    const [ notice, setNotice ] = useState('')

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)

    const navigate = useNavigate()
    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

    useCaptainLocation(socket, Boolean(captain?._id))

    // Resume an accepted or ongoing ride (e.g. after a page refresh).
    useEffect(() => {
        axios.get(`${BASE_URL}/rides/captain/active`, { headers: authHeader('captain') })
            .then(({ data: activeRide }) => {
                if (!activeRide) return

                if (activeRide.status === 'ongoing') {
                    navigate('/captain-riding', { state: { ride: activeRide } })
                    return
                }

                setRide(activeRide)
                setConfirmRidePopupPanel(true)
            })
            .catch(() => { /* nothing to resume */ })
    }, [ navigate ])

    useEffect(() => {
        const onNewRide = (data) => {
            setNotice('')
            setRide(data)
            setRidePopupPanel(true)
        }
        const onRideCancelled = () => {
            setRidePopupPanel(false)
            setConfirmRidePopupPanel(false)
            setRide(null)
            setNotice('The rider cancelled the ride.')
        }

        socket.on('new-ride', onNewRide)
        socket.on('ride-cancelled', onRideCancelled)

        return () => {
            socket.off('new-ride', onNewRide)
            socket.off('ride-cancelled', onRideCancelled)
        }
    }, [ socket ])

    async function confirmRide() {
        try {
            await axios.post(`${BASE_URL}/rides/confirm`, {
                rideId: ride._id
            }, {
                headers: authHeader('captain')
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
                <div className='flex gap-2'>
                    <Link to='/captain/history' title='Your rides' className='h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                        <i className='text-lg ri-history-line'></i>
                    </Link>
                    <Link to='/captain/logout' title='Log out' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                        <i className="text-lg font-medium ri-logout-box-r-line"></i>
                    </Link>
                </div>
            </div>
            <div className='h-1/2'>
                <LiveTracking />
            </div>
            <div className='h-1/2 p-6 overflow-y-auto'>
                {notice && <p className='mb-3 rounded-lg bg-yellow-100 text-yellow-900 p-3 text-sm'>{notice}</p>}
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
                    onCancelled={() => {
                        setRide(null)
                        setNotice('Ride cancelled.')
                    }}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel} setRidePopupPanel={setRidePopupPanel} />
            </div>
        </div>
    )
}

export default CaptainHome
