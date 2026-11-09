import React from 'react'
import VehicleIcon from './VehicleIcon'
import TripDetails from './TripDetails'

const LookingForDriver = (props) => {
    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setVehicleFound(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Looking for a Driver</h3>

            <div className='flex gap-2 justify-between flex-col items-center'>
                <VehicleIcon type={props.vehicleType} className='h-20 w-28 text-5xl animate-pulse' />
                <TripDetails pickup={props.pickup} destination={props.destination} fare={props.fare[ props.vehicleType ]} />
            </div>
        </div>
    )
}

export default LookingForDriver
