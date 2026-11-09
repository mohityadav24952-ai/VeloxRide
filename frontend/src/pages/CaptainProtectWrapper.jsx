import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'
import { SocketContext } from '../context/SocketContext'
import { BASE_URL, authHeader, getToken, clearToken } from '../utils/api'

const CaptainProtectWrapper = ({
    children
}) => {
    const navigate = useNavigate()
    const { setCaptain } = useContext(CaptainDataContext)
    const { connectAs } = useContext(SocketContext)
    const [ isLoading, setIsLoading ] = useState(true)

    useEffect(() => {
        if (!getToken('captain')) {
            navigate('/captain-login')
            return
        }

        axios.get(`${BASE_URL}/captains/profile`, {
            headers: authHeader('captain')
        }).then(response => {
            setCaptain(response.data.captain)
            connectAs('captain')
            setIsLoading(false)
        }).catch(() => {
            clearToken('captain')
            navigate('/captain-login')
        })
    }, [ navigate, setCaptain, connectAs ])

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

export default CaptainProtectWrapper
