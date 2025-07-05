const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory storage for rooms
const rooms = new Map()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    },
    allowEIO3: true,
    transports: ['websocket', 'polling']
  })

  // Make rooms available globally for API routes
  global.rooms = rooms

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
        const existingUser = room.users.find(u => u.nickname === data.nickname)
        if (existingUser) {
          socket.emit('room:error', 'Nickname already taken in this room')
          return
        }

        const user = {
          id: Math.random().toString(36).substring(2, 15),
          nickname: data.nickname,
          avatar: data.avatar,
          isVoiceActive: false,
          isSharingScreen: false,
          joinedAt: new Date()
        }

        // Add user to room
        room.users.push(user)
        socket.join(data.roomId)
        socket.userId = user.id
        socket.roomId = data.roomId

        // Send room data to the joining user
        socket.emit('room:joined', { room, user })
  
        // Notify other users in the room
        socket.to(data.roomId).emit('room:user-joined', user)
        
        // Notify for WebRTC connections
        socket.to(data.roomId).emit('webrtc:user-joined', { userId: user.id })

        // Send system message
        const systemMessage = {
          id: Math.random().toString(36).substring(2, 15),
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

        const user = room.users.find(u => u.id === socket.userId)
        if (!user) return

        const message = {
          id: Math.random().toString(36).substring(2, 15),
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

        const user = room.users.find(u => u.id === socket.userId)
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

        const user = room.users.find(u => u.id === socket.userId)
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

    // WebRTC signaling events
    socket.on('webrtc:offer', (data) => {
      // Find the target user's socket and send the offer
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === data.targetUserId)
      
      if (targetSocket) {
        targetSocket.emit('webrtc:offer', {
          fromUserId: socket.userId,
          offer: data.offer
        })
        console.log(`Sent WebRTC offer from ${socket.userId} to ${data.targetUserId}`)
      }
    })

    socket.on('webrtc:answer', (data) => {
      // Find the target user's socket and send the answer
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === data.targetUserId)
      
      if (targetSocket) {
        targetSocket.emit('webrtc:answer', {
          fromUserId: socket.userId,
          answer: data.answer
        })
        console.log(`Sent WebRTC answer from ${socket.userId} to ${data.targetUserId}`)
      }
    })

    socket.on('webrtc:ice-candidate', (data) => {
      // Find the target user's socket and send the ICE candidate
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === data.targetUserId)
      
      if (targetSocket) {
        targetSocket.emit('webrtc:ice-candidate', {
          fromUserId: socket.userId,
          candidate: data.candidate
        })
        console.log(`Sent ICE candidate from ${socket.userId} to ${data.targetUserId}`)
      }
    })

    socket.on('webrtc:voice-started', (data) => {
      const room = rooms.get(data.roomId)
      if (room) {
        const user = room.users.find(u => u.id === data.userId)
        if (user) {
          user.isVoiceActive = true
        }
      }
      
      socket.to(data.roomId).emit('webrtc:user-voice-started', {
        userId: data.userId
      })
      console.log(`User ${data.userId} started voice chat in room ${data.roomId}`)
    })

    socket.on('webrtc:voice-stopped', (data) => {
      const room = rooms.get(data.roomId)
      if (room) {
        const user = room.users.find(u => u.id === data.userId)
        if (user) {
          user.isVoiceActive = false
        }
      }
      
      socket.to(data.roomId).emit('webrtc:user-voice-stopped', {
        userId: data.userId
      })
      console.log(`User ${data.userId} stopped voice chat in room ${data.roomId}`)
    })

    socket.on('webrtc:screen-started', (data) => {
      socket.to(data.roomId).emit('webrtc:user-screen-started', {
        userId: data.userId
      })
    })

    socket.on('webrtc:screen-stopped', (data) => {
      socket.to(data.roomId).emit('webrtc:user-screen-stopped', {
        userId: data.userId
      })
    })

    socket.on('webrtc:ready-for-connections', (data) => {
      // Notify other users in the room that this user is ready for WebRTC connections
      socket.to(data.roomId).emit('webrtc:user-ready', {
        userId: data.userId,
        type: data.type
      })
    })

    socket.on('webrtc:request-voice-users', (data) => {
      const room = rooms.get(data.roomId)
      if (room) {
        // Get list of users currently in voice chat
        const voiceUsers = room.users
          .filter(user => user.isVoiceActive && user.id !== data.userId)
          .map(user => user.id)
        
        socket.emit('webrtc:voice-users-list', {
          voiceUsers: voiceUsers
        })
        console.log(`Sent voice users list to ${data.userId}:`, voiceUsers)
      }
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      if (socket.roomId) {
        // Notify other users about WebRTC disconnection
        socket.to(socket.roomId).emit('webrtc:user-left', {
          userId: socket.userId
        })
        handleUserLeave(socket, socket.roomId)
      }
    })
  })

  function handleUserLeave(socket, roomId) {
    try {
      const room = rooms.get(roomId)
      if (!room || !socket.userId) return

      const userIndex = room.users.findIndex(u => u.id === socket.userId)
      if (userIndex === -1) return

      const user = room.users[userIndex]
      room.users.splice(userIndex, 1)

      socket.leave(roomId)
      socket.to(roomId).emit('room:user-left', socket.userId)

      // Send system message
      const systemMessage = {
        id: Math.random().toString(36).substring(2, 15),
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

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})