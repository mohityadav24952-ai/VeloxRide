import React, { useContext } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'
import Avatar from './Avatar'
import { VEHICLES, fullName } from '../utils/format'

const CaptainDetails = () => {

    const { captain } = useContext(CaptainDataContext)
    const vehicle = captain?.vehicle || {}

    const stats = [
        { icon: 'ri-steering-2-line', value: VEHICLES[ vehicle.vehicleType ]?.label || vehicle.vehicleType, label: 'Vehicle' },
        { icon: 'ri-user-3-line', value: vehicle.capacity, label: 'Seats' },
        { icon: 'ri-palette-line', value: vehicle.color, label: 'Color' },
    ]

    return (
        <div>
            <div className='flex items-center justify-between'>
                <div className='flex items-center justify-start gap-3'>
                    <Avatar name={fullName(captain)} className='h-10 w-10' />
                    <h4 className='text-lg font-medium capitalize'>{fullName(captain)}</h4>
                </div>
                <div className='text-right'>
                    <h4 className='text-xl font-semibold uppercase'>{vehicle.plate}</h4>
                    <p className='text-sm text-gray-600'>Number plate</p>
                </div>
            </div>
            <div className='flex p-3 mt-8 bg-gray-100 rounded-xl justify-around gap-5 items-start'>
                {stats.map(stat => (
                    <div key={stat.label} className='text-center'>
                        <i className={`text-3xl mb-2 font-thin ${stat.icon}`}></i>
                        <h5 className='text-lg font-medium capitalize'>{stat.value ?? '--'}</h5>
                        <p className='text-sm text-gray-600'>{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CaptainDetails
