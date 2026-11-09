import axios from 'axios'
import { BASE_URL, authHeader } from './api'

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

const loadCheckout = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()

    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the payment window'))
    document.body.appendChild(script)
})

// { enabled, keyId } - enabled is false until Razorpay keys are set on the server
export const getPaymentConfig = async () => {
    const { data } = await axios.get(`${BASE_URL}/payments/config`, { headers: authHeader('user') })
    return data
}

// Opens Razorpay Checkout for the ride. Resolves after the server verifies the payment.
export const payOnline = async (ride, user) => {
    await loadCheckout()

    const { data: order } = await axios.post(`${BASE_URL}/payments/create-order`,
        { rideId: ride._id },
        { headers: authHeader('user') }
    )

    return new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            order_id: order.orderId,
            name: 'VeloxRide',
            description: `Ride to ${ride.destination}`,
            prefill: { email: user?.email },
            theme: { color: '#facc15' },
            handler: async (response) => {
                try {
                    const { data } = await axios.post(`${BASE_URL}/payments/verify`,
                        { rideId: ride._id, ...response },
                        { headers: authHeader('user') }
                    )
                    resolve(data)
                } catch (err) {
                    reject(err)
                }
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
        })
        checkout.open()
    })
}
