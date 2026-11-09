import React from 'react'
import { VEHICLES } from '../utils/format'

const VehicleIcon = ({ type, className = 'h-12 w-16 text-3xl' }) => {
    return (
        <div className={`${className} rounded-xl bg-yellow-100 text-gray-900 flex items-center justify-center shrink-0`}>
            <i className={VEHICLES[ type ]?.icon || 'ri-car-fill'}></i>
        </div>
    )
}

export default VehicleIcon
