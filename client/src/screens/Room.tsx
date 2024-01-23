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
    <div  className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Welcome to the Room.</h1>
      <h4 className="text-2xl text-center mb-6">{remoteSocketId ? 'Connected' : 'No-one in the room.'}</h4>
      <div className='text-center mb-4'>
        {myStream && <button className="bg-blue-500 text-white px-4 py-2 mx-4 rounded" onClick={sendStreams}>Send Stream</button>}
        {remoteSocketId && <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleCallUser}>Call</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
        <div className="mb-4 md:mb-0">
        {myStream && 
          (<div className='flex flex-col items-center'>
            <h2 className="text-lg mb-2">My Video</h2>
            <ReactPlayer playing muted controls className="rounded-lg" height="100%" width="70%" url={myStream}/>
          </div>)}
        </div>

        <div>
        {remoteStream && 
          (<div className='flex flex-col items-center'>
            <h2 className="text-lg mb-2">Remote Video</h2>
            <ReactPlayer playing muted controls className="rounded-lg" height="100%" width="70%" url={remoteStream}/>
          </div>)}
        </div>
      </div>
    </div>
  )
}

export default Room
