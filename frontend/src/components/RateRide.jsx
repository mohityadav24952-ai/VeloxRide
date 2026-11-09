import React, { useState } from 'react'
import axios from 'axios'
import { BASE_URL, authHeader, apiError } from '../utils/api'
import { fullName } from '../utils/format'

const STARS = [ 1, 2, 3, 4, 5 ]

const RateRide = ({ ride, onDone }) => {
    const [ rating, setRating ] = useState(0)
    const [ feedback, setFeedback ] = useState('')
    const [ error, setError ] = useState('')
    const [ submitting, setSubmitting ] = useState(false)

    const submitHandler = async (e) => {
        e.preventDefault()
        if (!rating) {
            setError('Tap a star to rate your captain.')
            return
        }

        setSubmitting(true)
        setError('')
        try {
            await axios.post(`${BASE_URL}/rides/rate`, {
                rideId: ride._id,
                rating,
                feedback: feedback.trim() || undefined
            }, {
                headers: authHeader('user')
            })
            onDone()
        } catch (err) {
            setError(apiError(err, 'Could not save your rating.'))
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={submitHandler}>
            <h3 className='text-2xl font-semibold'>You have arrived</h3>
            <p className='text-gray-600'>
                ₹{ride?.fare} · {ride?.paymentMethod === 'online' ? 'Paid online' : 'Paid in cash'}
            </p>

            <p className='mt-5 font-medium capitalize'>How was your ride with {fullName(ride?.captain) || 'your captain'}?</p>
            <div className='flex gap-2 mt-2'>
                {STARS.map(star => (
                    <button type='button' key={star} onClick={() => setRating(star)} aria-label={`${star} star`}>
                        <i className={`text-4xl ${star <= rating ? 'ri-star-fill text-yellow-400' : 'ri-star-line text-gray-300'}`}></i>
                    </button>
                ))}
            </div>

            <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder='Anything to add? (optional)'
                className='bg-[#eee] w-full mt-4 rounded-lg px-4 py-2' />

            {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}

            <button type='submit' disabled={submitting} className='w-full mt-4 bg-black text-white font-semibold p-2 rounded-lg disabled:opacity-60'>
                Submit rating
            </button>
            <button type='button' onClick={onDone} className='w-full mt-2 bg-gray-200 text-gray-800 font-semibold p-2 rounded-lg'>
                Skip
            </button>
        </form>
    )
}

export default RateRide
