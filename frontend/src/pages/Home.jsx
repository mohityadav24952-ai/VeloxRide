import React, { useContext, useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import LocationSearchPanel from '../components/LocationSearchPanel'
import VehiclePanel from '../components/VehiclePanel'
import ConfirmRide from '../components/ConfirmRide'
import LookingForDriver from '../components/LookingForDriver'
import WaitingForDriver from '../components/WaitingForDriver'
import LiveTracking from '../components/LiveTracking'
import Logo from '../components/Logo'
import { SocketContext } from '../context/SocketContext'
import { UserDataContext } from '../context/UserContext'
import { BASE_URL, authHeader, apiError } from '../utils/api'

// Slide a bottom panel in or out whenever `open` changes.
const useSlidePanel = (ref, open) => {
    useGSAP(() => {
        gsap.to(ref.current, { transform: open ? 'translateY(0)' : 'translateY(100%)' })
    }, [ open ])
}

const MIN_QUERY_LENGTH = 3 // the backend rejects shorter inputs

const Home = () => {
    const [ pickup, setPickup ] = useState('')
    const [ destination, setDestination ] = useState('')
    const [ panelOpen, setPanelOpen ] = useState(false)
    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)
    const [ vehiclePanel, setVehiclePanel ] = useState(false)
    const [ confirmRidePanel, setConfirmRidePanel ] = useState(false)
    const [ vehicleFound, setVehicleFound ] = useState(false)
    const [ waitingForDriver, setWaitingForDriver ] = useState(false)
    const [ pickupSuggestions, setPickupSuggestions ] = useState([])
    const [ destinationSuggestions, setDestinationSuggestions ] = useState([])
    const [ activeField, setActiveField ] = useState(null)
    const [ fare, setFare ] = useState({})
    const [ vehicleType, setVehicleType ] = useState(null)
    const [ ride, setRide ] = useState(null)
    const [ tripError, setTripError ] = useState('')

    const navigate = useNavigate()

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)

    useEffect(() => {
        if (user?._id) {
            socket.emit('join', { userType: 'user', userId: user._id })
        }
    }, [ user, socket ])

    useEffect(() => {
        const onRideConfirmed = (confirmedRide) => {
            setVehicleFound(false)
            setWaitingForDriver(true)
            setRide(confirmedRide)
        }
        const onRideStarted = (startedRide) => {
            setWaitingForDriver(false)
            navigate('/riding', { state: { ride: startedRide } })
        }

        socket.on('ride-confirmed', onRideConfirmed)
        socket.on('ride-started', onRideStarted)

        return () => {
            socket.off('ride-confirmed', onRideConfirmed)
            socket.off('ride-started', onRideStarted)
        }
    }, [ socket, navigate ])

    const fetchSuggestions = async (input, setSuggestions) => {
        if (input.trim().length < MIN_QUERY_LENGTH) {
            setSuggestions([])
            return
        }
        try {
            const response = await axios.get(`${BASE_URL}/maps/get-suggestions`, {
                params: { input },
                headers: authHeader()
            })
            setSuggestions(response.data)
        } catch {
            setSuggestions([])
        }
    }

    const handlePickupChange = (e) => {
        setPickup(e.target.value)
        fetchSuggestions(e.target.value, setPickupSuggestions)
    }

    const handleDestinationChange = (e) => {
        setDestination(e.target.value)
        fetchSuggestions(e.target.value, setDestinationSuggestions)
    }

    const submitHandler = (e) => {
        e.preventDefault()
    }

    useGSAP(function () {
        if (panelOpen) {
            gsap.to(panelRef.current, {
                height: '70%',
                padding: 24
            })
            gsap.to(panelCloseRef.current, {
                opacity: 1
            })
        } else {
            gsap.to(panelRef.current, {
                height: '0%',
                padding: 0
            })
            gsap.to(panelCloseRef.current, {
                opacity: 0
            })
        }
    }, [ panelOpen ])

    useSlidePanel(vehiclePanelRef, vehiclePanel)
    useSlidePanel(confirmRidePanelRef, confirmRidePanel)
    useSlidePanel(vehicleFoundRef, vehicleFound)
    useSlidePanel(waitingForDriverRef, waitingForDriver)

    async function findTrip() {
        setTripError('')

        if (pickup.trim().length < MIN_QUERY_LENGTH || destination.trim().length < MIN_QUERY_LENGTH) {
            setTripError('Enter both a pickup and a destination.')
            return
        }

        try {
            const response = await axios.get(`${BASE_URL}/rides/get-fare`, {
                params: { pickup, destination },
                headers: authHeader()
            })
            setFare(response.data)
            setPanelOpen(false)
            setVehiclePanel(true)
        } catch (err) {
            setTripError(apiError(err, 'Could not get a fare for this trip. Try another address.'))
        }
    }

    async function createRide() {
        try {
            await axios.post(`${BASE_URL}/rides/create`, {
                pickup,
                destination,
                vehicleType
            }, {
                headers: authHeader()
            })
        } catch (err) {
            setVehicleFound(false)
            setTripError(apiError(err, 'Could not book the ride. Please try again.'))
        }
    }

    return (
        <div className='h-screen relative overflow-hidden'>
            <Logo className='absolute left-5 top-5 z-10 bg-white rounded-xl px-3 py-2' />
            <div className='h-screen w-screen'>
                <LiveTracking />
            </div>
            <div className=' flex flex-col justify-end h-screen absolute top-0 w-full'>
                <div className='h-[30%] p-6 bg-white relative'>
                    <h5 ref={panelCloseRef} onClick={() => {
                        setPanelOpen(false)
                    }} className='absolute opacity-0 right-6 top-6 text-2xl'>
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>
                    <h4 className='text-2xl font-semibold'>Find a trip</h4>
                    <form className='relative py-3' onSubmit={submitHandler}>
                        <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full"></div>
                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('pickup')
                            }}
                            value={pickup}
                            onChange={handlePickupChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'
                            type="text"
                            placeholder='Add a pick-up location'
                        />
                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('destination')
                            }}
                            value={destination}
                            onChange={handleDestinationChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full  mt-3'
                            type="text"
                            placeholder='Enter your destination' />
                    </form>
                    <button
                        onClick={findTrip}
                        className='bg-black text-white px-4 py-2 rounded-lg mt-3 w-full'>
                        Find Trip
                    </button>
                    {tripError && <p className='mt-2 text-sm text-red-600'>{tripError}</p>}
                </div>
                <div ref={panelRef} className='bg-white h-0'>
                    <LocationSearchPanel
                        suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                        setPanelOpen={setPanelOpen}
                        setVehiclePanel={setVehiclePanel}
                        setPickup={setPickup}
                        setDestination={setDestination}
                        activeField={activeField}
                    />
                </div>
            </div>
            <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <VehiclePanel
                    selectVehicle={setVehicleType}
                    fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />
            </div>
            <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <ConfirmRide
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    setConfirmRidePanel={setConfirmRidePanel} setVehicleFound={setVehicleFound} />
            </div>
            <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <LookingForDriver
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    setVehicleFound={setVehicleFound} />
            </div>
            <div ref={waitingForDriverRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <WaitingForDriver
                    ride={ride}
                    setWaitingForDriver={setWaitingForDriver} />
            </div>
        </div>
    )
}

export default Home
