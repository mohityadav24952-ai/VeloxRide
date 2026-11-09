import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'
import { SocketContext } from '../context/SocketContext'
import { BASE_URL, authHeader, getToken, clearToken } from '../utils/api'

const UserProtectWrapper = ({
    children
}) => {
    const navigate = useNavigate()
    const { setUser } = useContext(UserDataContext)
    const { connectAs } = useContext(SocketContext)
    const [ isLoading, setIsLoading ] = useState(true)

    useEffect(() => {
        if (!getToken('user')) {
            navigate('/login')
            return
        }

        axios.get(`${BASE_URL}/users/profile`, {
            headers: authHeader('user')
        }).then(response => {
            setUser(response.data)
            connectAs('user')
            setIsLoading(false)
        }).catch(() => {
            clearToken('user')
            navigate('/login')
        })
    }, [ navigate, setUser, connectAs ])

    if (isLoading) {
        return (
            <div className='p-7'>Loading...</div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}

export default UserProtectWrapper
