import React, { useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { useSocket } from '../context/SocketProvider'
import peer from '../service/peer'

const Room = () => {
    const socket = useSocket()

    const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null)
    const [myStream, setMyStream] = useState<MediaStream | null>()
    const [remoteStream, setRemoteStream] = useState<MediaStream>()

    // If another user also joined in the room
    const handleUserJoined = useCallback(({ email, id }: { email: string; id: string }  )=>{
        setRemoteSocketId(id)
    }, [])

    const handleCallUser = useCallback(async()=>{
      // Getting user media (Video and Audio)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true, video: true
      })      
      // Creating an offer to send to other user
      const offer = await peer.getOffer();
      // Sending an offer
      socket?.emit("user:call", {to: remoteSocketId, offer})
      setMyStream(stream)
    }, [remoteSocketId, socket])

    const handleIncomingCall = useCallback(async ({from, offer}: {from: string, offer: RTCSessionDescriptionInit})=>{
      setRemoteSocketId(from)
      // console.log(from)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true, video: true
      })
      setMyStream(stream)
      console.log(from, offer)
      const ans = await peer.getAnswer(offer)
      socket?.emit("call:accepted", {to: from, ans})
    }, [socket])

    // Send tracks to other user
    const sendStreams = useCallback(()=>{
      if(myStream){
        // Tracks(audio and video)
        for (const track of myStream.getTracks()){
          peer.peer.addTrack(track, myStream);
        }
      }
    }, [myStream])

    const handleCallAccepted = useCallback(({from, ans}: {from: string, ans: RTCSessionDescriptionInit})=>{
      peer.setLocalDescription(ans)
      console.log("Call Accepted")
      sendStreams()
    },[])

    const handleNegotiationNeeded = useCallback(async ()=>{
      const offer = await peer.getOffer()
      socket?.emit('peer:nego:needed', {offer, to: remoteSocketId})
    }, [remoteSocketId, socket])

    const handleNegoNeededIncoming = useCallback(async ({from, offer}: {from:string, offer: RTCSessionDescriptionInit})=>{
      const ans = await peer.getAnswer(offer)
      socket?.emit('peer:nego:done', {to:from, ans})
    }, [])

    const handleNegoNeededFinal = useCallback(async ({from, ans}: {from:string, ans: any})=>{
      await peer.setLocalDescription(ans)
    },[])

    useEffect(()=>{
      peer.peer.addEventListener('negotiationneeded', handleNegotiationNeeded)
      return () => {
        peer.peer.removeEventListener('negotiationneeded', handleNegotiationNeeded)
      }
    }, [handleNegotiationNeeded])

    useEffect(()=>{
      peer.peer.addEventListener('track', async (ev) => {
        const remoteStream = ev.streams
        console.log("Got Tracks.")
        setRemoteStream(Array.from(remoteStream)[0])
      })
    }, [])

    useEffect(()=>{
        socket?.on('user:joined', handleUserJoined)
        socket?.on('incoming:call', handleIncomingCall)
        socket?.on('call:accepted', handleCallAccepted)
        socket?.on('peer:nego:needed', handleNegoNeededIncoming)
        socket?.on("peer:nego:final", handleNegoNeededFinal)
        
        return()=>{
          socket?.off('user:joined', handleUserJoined)
          socket?.off('incoming:call', handleIncomingCall)
          socket?.off('call:accepted', handleCallAccepted)
          socket?.off('peer:nego:needed', handleNegoNeededIncoming)
          socket?.off("peer:nego:final", handleNegoNeededFinal)
        }
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoNeededIncoming, handleNegoNeededFinal])

  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? 'Connected' : 'Noone in room'}</h4>
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
      {myStream && 
      (<>
        <h2>My Video</h2>
        <ReactPlayer playing muted height="100px" width="200px" url={myStream}/>
      </>)}
      {remoteStream && 
      (<>
        <h2>Remote Video</h2>
        <ReactPlayer playing muted height="100px" width="200px" url={remoteStream}/>
      </>)}
    </div>
  )
}

export default Room
