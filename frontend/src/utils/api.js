export const BASE_URL = import.meta.env.VITE_BASE_URL

// Both riders and captains store their JWT under the same key.
export const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
})

// Pull a readable message out of an axios error from our API.
export const apiError = (err, fallback = 'Something went wrong. Please try again.') =>
    err?.response?.data?.message
    || err?.response?.data?.errors?.[ 0 ]?.msg
    || fallback
