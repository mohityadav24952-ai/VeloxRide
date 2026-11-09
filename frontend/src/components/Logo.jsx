import React from 'react'

const Logo = ({ className = '' }) => {
    return (
        <div className={`flex w-fit items-center gap-2 select-none ${className}`}>
            <span className='h-9 w-9 rounded-lg bg-yellow-400 text-black flex items-center justify-center'>
                <i className='ri-flashlight-fill text-xl'></i>
            </span>
            <span className='text-2xl font-bold tracking-tight text-black'>VeloxRide</span>
        </div>
    )
}

export default Logo
