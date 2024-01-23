import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/SocketProvider'
import { useNavigate } from 'react-router-dom'
import Room from './Room'

const Lobby: React.FC = () => {

    const [email, setEmail] = useState('')
    const [room, setRoom] = useState('')

    const navigate = useNavigate()

    const socket = useSocket()

    const handleSubmitForm: React.FormEventHandler<HTMLFormElement> = useCallback((e)=>{
        e.preventDefault();
        socket?.emit("room:join", {email, room})
    }, [email, room, socket])

    const handleJoinRoom = useCallback((data: { email: string; room: number })=> {
      const {email, room} = data
      navigate(`room/${room}`)
    }, [navigate])

    useEffect(()=>{
      socket?.on("room:join", handleJoinRoom)
      
      return() =>{
        socket?.off("room:join", handleJoinRoom)
      }
    },[socket, handleJoinRoom])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Lobby</h1>

      <form action="" onSubmit={handleSubmitForm}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-600 mb-2">Email Id</label>
          <input type="email" className="w-full border border-gray-300 p-2" name="" id="email" value={email} placeholder='Enter your email.' onChange={e=>setEmail(e.target.value)}/>
        </div>
        <div className="mb-4">
          <label htmlFor="room" className="block text-sm font-semibold text-gray-600 mb-2">Room Number</label>
          <input type="text" className="w-full border border-gray-300 p-2" name="" id="room" value={room} placeholder='Enter room number to join.' onChange={e=>setRoom(e.target.value)}/>
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">Join</button>
      </form>
    </div>
  )
}

export default Lobby
