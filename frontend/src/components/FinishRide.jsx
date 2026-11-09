import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import RiderCard from './RiderCard'
import TripDetails from './TripDetails'
import { BASE_URL, authHeader, apiError } from '../utils/api'

const FinishRide = (props) => {
    const navigate = useNavigate()
    const [ error, setError ] = useState('')
    const paidOnline = props.ride?.paymentStatus === 'paid'

    async function endRide() {
        if (!props.ride) return
        setError('')

        try {
            await axios.post(`${BASE_URL}/rides/end-ride`, {
                rideId: props.ride._id
            }, {
                headers: authHeader('captain')
            })
            navigate('/captain-home')
        } catch (err) {
            setError(apiError(err, 'Could not finish the ride.'))
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setFinishRidePanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Finish this Ride</h3>
            <RiderCard ride={props.ride} />
            <div className='flex gap-2 justify-between flex-col items-center'>
                <TripDetails
                    pickup={props.ride?.pickup}
                    destination={props.ride?.destination}
                    fare={props.ride?.fare}
                    paymentLabel={paidOnline ? 'Paid online, no cash to collect' : 'Collect in cash'} />

                <div className='mt-10 w-full'>
                    {error && <p className='mb-2 text-sm text-red-600'>{error}</p>}
                    <button
                        onClick={endRide}
                        className='w-full mt-5 flex  text-lg justify-center bg-green-600 text-white font-semibold p-3 rounded-lg'>Finish Ride</button>
                </div>
            </div>
        </div>
    )
}

export default FinishRide
