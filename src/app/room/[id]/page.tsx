"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoomStore, useUserPreferences } from '@/stores/room-store'
import { connectSocket, getSocket } from '@/lib/socket'
import { RoomInterface } from '@/components/room/room-interface'
import { JoinRoomDialog } from '@/components/room/join-room-dialog'
import { generateUserId } from '@/lib/utils'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  
  const { 
    currentRoom, 
    currentUser, 
    isConnected, 
    isJoining, 
    error,
    setCurrentRoom,
    setCurrentUser,
    addMessage,
    addUser,
    removeUser,
    updateUserVoice,
    updateUserScreenShare,
    setConnected,
    setJoining,
    setError,
    clearRoom
  } = useRoomStore()
  
  const { nickname, avatar } = useUserPreferences()
  const [showJoinDialog, setShowJoinDialog] = useState(true)

  useEffect(() => {
    // If user has preferences and is not in a room, try to join automatically
    if (nickname && avatar && !currentRoom && !isJoining) {
      handleJoinRoom(nickname, avatar)
    }
  }, [nickname, avatar, currentRoom, isJoining])

  useEffect(() => {
    const socket = connectSocket()
    
    socket.on('connect', () => {
      setConnected(true)
      setError(null)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('room:joined', (data) => {
      setCurrentRoom(data.room)
      setCurrentUser(data.user)
      setJoining(false)
      setShowJoinDialog(false)
      setError(null)
    })

    socket.on('room:user-joined', (user) => {
      addUser(user)
    })

    socket.on('room:user-left', (userId) => {
      removeUser(userId)
    })

    socket.on('room:message', (message) => {
      addMessage(message)
    })

    socket.on('room:voice-toggle', (data) => {
      updateUserVoice(data.userId, data.isActive)
    })

    socket.on('room:screen-share-toggle', (data) => {
      updateUserScreenShare(data.userId, data.isSharing)
    })

    socket.on('room:error', (error) => {
      setError(error)
      setJoining(false)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('room:joined')
      socket.off('room:user-joined')
      socket.off('room:user-left')
      socket.off('room:message')
      socket.off('room:voice-toggle')
      socket.off('room:screen-share-toggle')
      socket.off('room:error')
    }
  }, [])

  const handleJoinRoom = (nickname: string, avatar: string) => {
    const socket = getSocket()
    if (!socket) return

    setJoining(true)
    setError(null)
    
    socket.emit('room:join', {
      roomId,
      nickname,
      avatar
    })
  }

  const handleLeaveRoom = () => {
    const socket = getSocket()
    if (socket && currentRoom) {
      socket.emit('room:leave', currentRoom.id)
    }
    clearRoom()
    router.push('/')
  }

  if (showJoinDialog && !currentRoom) {
    return (
      <JoinRoomDialog
        roomId={roomId}
        onJoin={handleJoinRoom}
        isJoining={isJoining}
        error={error}
      />
    )
  }

  if (!currentRoom || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">
            {isJoining ? 'Joining room...' : 'Loading room...'}
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <RoomInterface
      room={currentRoom}
      currentUser={currentUser}
      onLeaveRoom={handleLeaveRoom}
      isConnected={isConnected}
    />
  )
}