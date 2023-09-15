import React, { useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { useSocket } from '../context/SocketProvider'

const Room = () => {

    const socket = useSocket()
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream, setMyStream] = useState(null)

    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`email${email} joined room`);
        setRemoteSocketId(id);
    }, [])

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        })

        setMyStream(stream)
    }, [])

    useEffect(() => {
        socket.on('user:joined', handleUserJoined);

        return () => {
            socket.off('user:joined', handleUserJoined)
        }
    }, [socket, handleUserJoined])



    return (
        <div>
            <h1>Room</h1>
            <h4>{remoteSocketId ? 'connected' : 'No one in the room'}</h4>
            {remoteSocketId && (
                <button onClick={handleCallUser}>CALL</button>
            )}
            {
                myStream && <ReactPlayer url={myStream}/>
            }
        </div>
    )
}

export default Room