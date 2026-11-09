import React from 'react'
import Avatar from './Avatar'
import { formatDistance, fullName } from '../utils/format'

// Rider name + trip distance, shown to the captain.
const RiderCard = ({ ride, highlight = false }) => {
    const name = fullName(ride?.user)

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg mt-4 ${highlight ? 'bg-yellow-400' : 'border-2 border-yellow-400'}`}>
            <div className='flex items-center gap-3'>
                <Avatar name={name} />
                <h2 className='text-lg font-medium capitalize'>{name}</h2>
            </div>
            <h5 className='text-lg font-semibold'>{formatDistance(ride?.distance)}</h5>
        </div>
    )
}

export default RiderCard
