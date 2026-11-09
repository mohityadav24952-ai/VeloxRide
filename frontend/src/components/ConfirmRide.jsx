import React from 'react'
import VehicleIcon from './VehicleIcon'
import TripDetails from './TripDetails'
import { VEHICLES } from '../utils/format'

const ConfirmRide = (props) => {
    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setConfirmRidePanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Confirm your Ride</h3>

            <div className='flex gap-2 justify-between flex-col items-center'>
                <VehicleIcon type={props.vehicleType} className='h-20 w-28 text-5xl' />
                <p className='font-medium'>{VEHICLES[ props.vehicleType ]?.label}</p>
                <TripDetails pickup={props.pickup} destination={props.destination} fare={props.fare[ props.vehicleType ]} />
                <button onClick={() => {
                    props.setVehicleFound(true)
                    props.setConfirmRidePanel(false)
                    props.createRide()
                }} className='w-full mt-5 bg-green-600 text-white font-semibold p-2 rounded-lg'>Confirm</button>
            </div>
        </div>
    )
}

export default ConfirmRide
