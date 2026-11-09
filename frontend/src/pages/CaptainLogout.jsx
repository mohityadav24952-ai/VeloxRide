import React, { useContext, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
import { BASE_URL, authHeader, clearToken } from '../utils/api'

export const CaptainLogout = () => {
    const navigate = useNavigate()
    const { disconnectSocket } = useContext(SocketContext)

    useEffect(() => {
        axios.get(`${BASE_URL}/captains/logout`, { headers: authHeader('captain') })
            .catch(err => console.warn('Logout request failed:', err.message))
            .finally(() => {
                clearToken('captain')
                disconnectSocket()
                navigate('/captain-login')
            })
    }, [ navigate, disconnectSocket ])

    return (
        <div className='p-7'>Logging out...</div>
    )
}

export default CaptainLogout
