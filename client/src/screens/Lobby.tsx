import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/SocketProvider'
import { useNavigate } from 'react-router-dom'

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
    <div>
      <h1>Lobby</h1>

      <form action="" onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email Id</label>
        <input type="email" name="" id="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <br />
        <label htmlFor="room">Room Number</label>
        <input type="text" name="" id="room" value={room} onChange={e=>setRoom(e.target.value)}/>
        <br />
        <button>Join</button>
      </form>
    </div>
  )
}

export default Lobby
