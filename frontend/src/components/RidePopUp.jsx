import React from 'react'
import RiderCard from './RiderCard'
import TripDetails from './TripDetails'

const RidePopUp = (props) => {
    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setRidePopupPanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>New Ride Available!</h3>
            <RiderCard ride={props.ride} highlight />
            <div className='flex gap-2 justify-between flex-col items-center'>
                <TripDetails pickup={props.ride?.pickup} destination={props.ride?.destination} fare={props.ride?.fare} />
                <div className='mt-5 w-full '>
                    <button onClick={props.confirmRide} className=' bg-green-600 w-full text-white font-semibold p-2 px-10 rounded-lg'>Accept</button>

                    <button onClick={() => {
                        props.setRidePopupPanel(false)
                    }} className='mt-2 w-full bg-gray-300 text-gray-700 font-semibold p-2 px-10 rounded-lg'>Ignore</button>
                </div>
            </div>
        </div>
    )
}

export default RidePopUp
