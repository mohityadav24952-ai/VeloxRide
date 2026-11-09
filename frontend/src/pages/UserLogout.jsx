import React, { useContext, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
import { BASE_URL, authHeader, clearToken } from '../utils/api'

export const UserLogout = () => {
    const navigate = useNavigate()
    const { disconnectSocket } = useContext(SocketContext)

    useEffect(() => {
        axios.get(`${BASE_URL}/users/logout`, { headers: authHeader('user') })
            .catch(err => console.warn('Logout request failed:', err.message))
            .finally(() => {
                clearToken('user')
                disconnectSocket()
                navigate('/login')
            })
    }, [ navigate, disconnectSocket ])

    return (
        <div className='p-7'>Logging out...</div>
    )
}

export default UserLogout
