import { NextRequest } from 'next/server'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData,
  User,
  Message
} from '@/types'
import { generateUserId } from '@/lib/utils'

// Import rooms from the create route
import { Room } from '@/types'
let rooms: Map<string, Room>
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  rooms = require('../rooms/create/route').rooms
} catch {
  rooms = new Map()
}

export const dynamic = 'force-dynamic'

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export async function GET(req: NextRequest) {
  if (!io) {
    const httpServer: NetServer = (req as NextRequest & { socket: { server: NetServer } }).socket.server
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      socket.on('room:join', async (data) => {
        try {
          const room = rooms.get(data.roomId)
          if (!room) {
            socket.emit('room:error', 'Room not found')
            return
          }

          if (room.users.length >= room.maxUsers) {
            socket.emit('room:error', 'Room is full')
            return
          }

          // Check if user is already in room
          const existingUser = room.users.find((u: User) => u.nickname === data.nickname)
          if (existingUser) {
            socket.emit('room:error', 'Nickname already taken in this room')
            return
          }

          const user: User = {
            id: generateUserId(),
            nickname: data.nickname,
            avatar: data.avatar,
            isVoiceActive: false,
            isSharingScreen: false,
            joinedAt: new Date()
          }

          // Add user to room
          room.users.push(user)
          socket.join(data.roomId)
          socket.data.userId = user.id
          socket.data.roomId = data.roomId

          // Send room data to the joining user
          socket.emit('room:joined', { room, user })

          // Notify other users in the room
          socket.to(data.roomId).emit('room:user-joined', user)

          // Send system message
          const systemMessage: Message = {
            id: generateUserId(),
            userId: 'system',
            username: 'System',
            userAvatar: '🤖',
            content: `${user.nickname} joined the room`,
            timestamp: new Date(),
            type: 'system'
          }
          room.messages.push(systemMessage)
          io.to(data.roomId).emit('room:message', systemMessage)

        } catch (error) {
          console.error('Error joining room:', error)
          socket.emit('room:error', 'Failed to join room')
        }
      })

      socket.on('room:leave', (roomId) => {
        handleUserLeave(socket, roomId)
      })

      socket.on('room:send-message', (data) => {
        try {
          const room = rooms.get(data.roomId)
          if (!room) return

          const user = room.users.find((u: User) => u.id === socket.data.userId)
          if (!user) return

          const message: Message = {
            id: generateUserId(),
            userId: user.id,
            username: user.nickname,
            userAvatar: user.avatar,
            content: data.content,
            timestamp: new Date(),
            type: data.fileData ? 'file' : 'text',
            fileData: data.fileData
          }

          room.messages.push(message)
          io.to(data.roomId).emit('room:message', message)
        } catch (error) {
          console.error('Error sending message:', error)
        }
      })

      socket.on('room:toggle-voice', (data) => {
        try {
          const room = rooms.get(data.roomId)
          if (!room) return

          const user = room.users.find((u: User) => u.id === socket.data.userId)
          if (!user) return

          user.isVoiceActive = data.isActive
          socket.to(data.roomId).emit('room:voice-toggle', {
            userId: user.id,
            isActive: data.isActive
          })
        } catch (error) {
          console.error('Error toggling voice:', error)
        }
      })

      socket.on('room:toggle-screen-share', (data) => {
        try {
          const room = rooms.get(data.roomId)
          if (!room) return

          const user = room.users.find((u: User) => u.id === socket.data.userId)
          if (!user) return

          user.isSharingScreen = data.isSharing
          socket.to(data.roomId).emit('room:screen-share-toggle', {
            userId: user.id,
            isSharing: data.isSharing
          })
        } catch (error) {
          console.error('Error toggling screen share:', error)
        }
      })

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
        if (socket.data.roomId) {
          handleUserLeave(socket, socket.data.roomId)
        }
      })
    })

    function handleUserLeave(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, roomId: string) {
      try {
        const room = rooms.get(roomId)
        if (!room || !socket.data.userId) return

        const userIndex = room.users.findIndex((u: User) => u.id === socket.data.userId)
        if (userIndex === -1) return

        const user = room.users[userIndex]
        room.users.splice(userIndex, 1)

        socket.leave(roomId)
        socket.to(roomId).emit('room:user-left', socket.data.userId)

        // Send system message
        const systemMessage: Message = {
          id: generateUserId(),
          userId: 'system',
          username: 'System',
          userAvatar: '🤖',
          content: `${user.nickname} left the room`,
          timestamp: new Date(),
          type: 'system'
        }
        room.messages.push(systemMessage)
        socket.to(roomId).emit('room:message', systemMessage)

        // Clean up empty rooms
        if (room.users.length === 0) {
          setTimeout(() => {
            if (rooms.get(roomId)?.users.length === 0) {
              rooms.delete(roomId)
            }
          }, 5 * 60 * 1000) // 5 minutes
        }
      } catch (error) {
        console.error('Error handling user leave:', error)
      }
    }
  }

  return new Response('Socket.IO server initialized', { status: 200 })
}