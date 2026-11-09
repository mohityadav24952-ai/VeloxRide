export const BASE_URL = import.meta.env.VITE_BASE_URL

// Riders and captains keep separate tokens, so one browser can hold both sessions.
export const TOKEN_KEYS = {
    user: 'token',
    captain: 'captain-token',
}

export const getToken = (role = 'user') => localStorage.getItem(TOKEN_KEYS[ role ])
export const setToken = (role, token) => localStorage.setItem(TOKEN_KEYS[ role ], token)
export const clearToken = (role) => localStorage.removeItem(TOKEN_KEYS[ role ])

export const authHeader = (role = 'user') => ({
    Authorization: `Bearer ${getToken(role)}`
})

// Pull a readable message out of an axios error from our API.
export const apiError = (err, fallback = 'Something went wrong. Please try again.') =>
    err?.response?.data?.message
    || err?.response?.data?.errors?.[ 0 ]?.msg
    || fallback
