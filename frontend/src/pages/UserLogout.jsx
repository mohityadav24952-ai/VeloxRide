import React, { useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { BASE_URL, authHeader } from '../utils/api'

export const UserLogout = () => {
    const navigate = useNavigate()

    useEffect(() => {
        axios.get(`${BASE_URL}/users/logout`, { headers: authHeader() })
            .catch(err => console.warn('Logout request failed:', err.message))
            .finally(() => {
                localStorage.removeItem('token')
                navigate('/login')
            })
    }, [ navigate ])

    return (
        <div className='p-7'>Logging out...</div>
    )
}

export default UserLogout
