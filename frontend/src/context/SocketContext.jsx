import React, { createContext, useCallback, useEffect, useMemo } from 'react'
import { io } from 'socket.io-client'
import { BASE_URL, getToken } from '../utils/api'

export const SocketContext = createContext()

// One shared connection. It connects only after login and sends the JWT,
// so the server knows who the socket belongs to. Socket.IO re-sends this
// auth on every reconnect, so the server always has the latest socket id.
const socket = io(BASE_URL, { autoConnect: false })

const SocketProvider = ({ children }) => {
    useEffect(() => {
        const onConnect = () => console.log('Connected to server')
        const onConnectError = (err) => console.warn('Socket connection failed:', err.message)

        socket.on('connect', onConnect)
        socket.on('connect_error', onConnectError)

        return () => {
            socket.off('connect', onConnect)
            socket.off('connect_error', onConnectError)
        }
    }, [])

    const connectAs = useCallback((userType) => {
        const token = getToken(userType)
        if (!token) return

        const sameSession = socket.auth?.token === token && socket.auth?.userType === userType
        if (sameSession && (socket.connected || socket.active)) return

        socket.auth = { token, userType }
        if (socket.connected) socket.disconnect()
        socket.connect()
    }, [])

    const disconnectSocket = useCallback(() => {
        socket.auth = {}
        socket.disconnect()
    }, [])

    const value = useMemo(() => ({ socket, connectAs, disconnectSocket }), [ connectAs, disconnectSocket ])

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    )
}

export default SocketProvider
