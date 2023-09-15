import React, { useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { useSocket } from '../context/SocketProvider'
import peer from '../service/peer'

const Room = () => {

    const socket = useSocket()
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream, setMyStream] = useState()
    const [remoteStream, setRemoteStream] = useState()

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

    const sendStreams = useCallback(() => {
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream)
        }
    }, [myStream]);

    const handleCallAccepted = useCallback((from, ans) => {
        peer.setLocalDescription(ans);
        console.log('call accepted');
        sendStreams();
    }, [sendStreams]);

    const handleNegoNedded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed', { offer, to: remoteSocketId })
    }, [remoteSocketId, socket])

    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', handleNegoNedded)
        return () => {
            peer.peer.removeEventListener('negotiationneeded', handleNegoNedded)
        }
    }, [handleNegoNedded])

    const handleNegoNeedIncomming = useCallback(async ({ from, offer }) => {
        const ans = await peer.getAnswer(offer);
        socket.emit('peer:nego:done', { to: from, ans })
    }, [socket])

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans)
    }, [])

    useEffect(() => {
        peer.peer.addEventListener('track', async (ev) => {
            const remoteStream = ev.streams
            setRemoteStream(remoteStream[0])
        })
    }, []);


    useEffect(() => {
        socket.on('user:joined', handleUserJoined);
        socket.on('incomming:call', handleIncommingCall);
        socket.on('call:accepted', handleCallAccepted);
        socket.on('peer:nego:needed', handleNegoNeedIncomming);
        socket.on('peer:nego:final', handleNegoNeedFinal);

        return () => {
            socket.off('user:joined', handleUserJoined);
            socket.off('incomming:call', handleIncommingCall);
            socket.off('call:accepted', handleCallAccepted);
            socket.off('peer:nego:needed', handleNegoNeedIncomming);
            socket.off('peer:nego:final', handleNegoNeedFinal);
        }
    }, [socket, handleUserJoined, handleIncommingCall, handleCallAccepted, handleNegoNeedIncomming, handleNegoNeedFinal])



    return (
        <div>
            <h1>Room</h1>
            <h4>{remoteSocketId ? 'connected' : 'No one in the room'}</h4>
            {myStream && <button onClick={sendStreams}>Send Stream</button>}
            {remoteSocketId && (
                <button onClick={handleCallUser}>CALL</button>
            )}
            {
                myStream && (
                    <ReactPlayer
                        playing
                        muted
                        height="300px"
                        width="500px"
                        url={myStream}
                    />
                )
            }
            {
                remoteStream && (
                    <ReactPlayer
                        playing
                        muted
                        height="300px"
                        width="500px"
                        url={remoteStream}
                    />
                )
            }
        </div>
    )
}

export default Room