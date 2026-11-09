import React from 'react'
import VehicleIcon from './VehicleIcon'
import TripDetails from './TripDetails'
import { VEHICLES, fullName } from '../utils/format'

const WaitingForDriver = (props) => {
  const captain = props.ride?.captain
  const vehicleType = captain?.vehicle?.vehicleType

  return (
    <div>
      <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
        props.setWaitingForDriver(false)
      }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>

      <div className='flex items-center justify-between'>
        <VehicleIcon type={vehicleType} />
        <div className='text-right'>
          <h2 className='text-lg font-medium capitalize'>{fullName(captain)}</h2>
          <h4 className='text-xl font-semibold -mt-1 -mb-1 uppercase'>{captain?.vehicle?.plate}</h4>
          <p className='text-sm text-gray-600 capitalize'>{captain?.vehicle?.color} · {VEHICLES[ vehicleType ]?.label}</p>
        </div>
      </div>

      <div className='mt-4 flex items-center justify-between bg-yellow-100 rounded-lg p-3'>
        <p className='font-medium'>Share this OTP with your captain</p>
        <h1 className='text-2xl font-mono font-semibold tracking-widest'>{props.ride?.otp}</h1>
      </div>

      <TripDetails pickup={props.ride?.pickup} destination={props.ride?.destination} fare={props.ride?.fare} />
    </div>
  )
}

export default WaitingForDriver
