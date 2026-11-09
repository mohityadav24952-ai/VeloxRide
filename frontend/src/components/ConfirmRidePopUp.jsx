import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import RiderCard from './RiderCard'
import TripDetails from './TripDetails'
import { BASE_URL, authHeader, apiError } from '../utils/api'

const ConfirmRidePopUp = (props) => {
    const [ otp, setOtp ] = useState('')
    const [ error, setError ] = useState('')
    const navigate = useNavigate()

    const closePanels = () => {
        props.setConfirmRidePopupPanel(false)
        props.setRidePopupPanel(false)
    }

    const submitHandler = async (e) => {
        e.preventDefault()
        setError('')

        try {
            const response = await axios.get(`${BASE_URL}/rides/start-ride`, {
                params: {
                    rideId: props.ride._id,
                    otp: otp
                },
                headers: authHeader('captain')
            })

            closePanels()
            setOtp('')
            navigate('/captain-riding', { state: { ride: response.data } })
        } catch (err) {
            setError(apiError(err, 'Could not start the ride.'))
        }
    }

    const cancelRide = async () => {
        setError('')

        try {
            await axios.post(`${BASE_URL}/rides/captain/cancel`, {
                rideId: props.ride._id
            }, {
                headers: authHeader('captain')
            })

            closePanels()
            setOtp('')
            props.onCancelled?.()
        } catch (err) {
            setError(apiError(err, 'Could not cancel the ride.'))
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={closePanels}>
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>
            <h3 className='text-2xl font-semibold mb-5'>Confirm this ride to Start</h3>
            <RiderCard ride={props.ride} />
            <div className='flex gap-2 justify-between flex-col items-center'>
                <TripDetails pickup={props.ride?.pickup} destination={props.ride?.destination} fare={props.ride?.fare} />

                <div className='mt-6 w-full'>
                    <form onSubmit={submitHandler}>
                        <input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            type="text"
                            inputMode='numeric'
                            maxLength={6}
                            className='bg-[#eee] px-6 py-4 font-mono text-lg rounded-lg w-full mt-3'
                            placeholder='Enter OTP from rider' />

                        {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}

                        <button type='submit' className='w-full mt-5 text-lg flex justify-center bg-green-600 text-white font-semibold p-3 rounded-lg'>Confirm</button>
                        <button type='button' onClick={cancelRide} className='w-full mt-2 bg-red-600 text-lg text-white font-semibold p-3 rounded-lg'>Cancel ride</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ConfirmRidePopUp
