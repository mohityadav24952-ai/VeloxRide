import React from 'react'
import VehicleIcon from './VehicleIcon'
import { VEHICLES } from '../utils/format'

const VEHICLE_ORDER = [ 'car', 'moto', 'auto' ]

const VehiclePanel = (props) => {
    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setVehiclePanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Choose a Vehicle</h3>
            {VEHICLE_ORDER.map(type => {
                const vehicle = VEHICLES[ type ]
                return (
                    <div key={type} onClick={() => {
                        props.setConfirmRidePanel(true)
                        props.selectVehicle(type)
                    }} className='flex border-2 active:border-black mb-2 rounded-xl w-full p-3 items-center justify-between'>
                        <VehicleIcon type={type} />
                        <div className='ml-2 w-1/2'>
                            <h4 className='font-medium text-base'>{vehicle.label} <span><i className="ri-user-3-fill"></i>{vehicle.seats}</span></h4>
                            <p className='font-normal text-xs text-gray-600'>{vehicle.tagline}</p>
                        </div>
                        <h2 className='text-lg font-semibold'>₹{props.fare[ type ] ?? '--'}</h2>
                    </div>
                )
            })}
        </div>
    )
}

export default VehiclePanel
