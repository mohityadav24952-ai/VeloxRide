import React from 'react'
import { placeTitle, placeSubtitle } from '../utils/format'

const Row = ({ icon, title, subtitle, border = true }) => (
    <div className={`flex items-center gap-5 p-3 ${border ? 'border-b-2' : ''}`}>
        <i className={`text-lg ${icon}`}></i>
        <div className='min-w-0'>
            <h3 className='text-lg font-medium truncate'>{title}</h3>
            {subtitle && <p className='text-sm -mt-1 text-gray-600'>{subtitle}</p>}
        </div>
    </div>
)

// Pickup / destination / fare rows shared by the ride panels.
const TripDetails = ({ pickup, destination, fare }) => {
    return (
        <div className='w-full mt-5'>
            {pickup && <Row icon='ri-map-pin-user-fill' title={placeTitle(pickup)} subtitle={placeSubtitle(pickup)} />}
            {destination && <Row icon='ri-map-pin-2-fill' title={placeTitle(destination)} subtitle={placeSubtitle(destination)} />}
            <Row icon='ri-currency-line' title={`₹${fare ?? '--'}`} subtitle='Cash' border={false} />
        </div>
    )
}

export default TripDetails
