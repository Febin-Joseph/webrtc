import React, { useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { useSocket } from '../context/SocketProvider'
import peer from '../service/peer'

const Room = () => {

    const socket = useSocket()
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream, setMyStream] = useState()

    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`email${email} joined room`);
        setRemoteSocketId(id);
    }, [])

    const handleIncommingCall = useCallback(async ({ from, offer }) => {
        setRemoteSocketId(from)
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        setMyStream(stream);

        console.log(`incoming call`, from, offer);
        const ans = await peer.getAnswer(offer)
        socket.emit('call:accepted', { to: from, ans })
    }, [socket]);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });

        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    const handleCallAccepted = useCallback((from, ans) => {
        peer.setLocalDescription(ans);
        console.log('call accepted');
    }, []);

    useEffect(() => {
        socket.on('user:joined', handleUserJoined);
        socket.on('incomming:call', handleIncommingCall);
        socket.on('call:accepted', handleCallAccepted);

        return () => {
            socket.off('user:joined', handleUserJoined);
            socket.off('incomming:call', handleIncommingCall);
            socket.off('call:accepted', handleCallAccepted);
        }
    }, [socket, handleUserJoined, handleIncommingCall, handleCallAccepted])



    return (
        <div>
            <h1>Room</h1>
            <h4>{remoteSocketId ? 'connected' : 'No one in the room'}</h4>
            {remoteSocketId && (
                <button onClick={handleCallUser}>CALL</button>
            )}
            {
                myStream && <ReactPlayer playing muted height="300px" width="500px" url={myStream} />
            }
        </div>
    )
}

export default Room