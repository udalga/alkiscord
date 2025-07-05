class WebRTCManager {
  private localStream: MediaStream | null = null
  private screenStream: MediaStream | null = null
  private peerConnections: Map<string, RTCPeerConnection> = new Map()
  private socket: any = null
  private roomId: string = ''
  private userId: string = ''
  private remoteStreams: Map<string, MediaStream> = new Map()

  // STUN servers for NAT traversal
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]

  constructor() {
    // Constructor will be called when imported
  }

  setSocket(socket: any, roomId: string, userId: string) {
    this.socket = socket
    this.roomId = roomId
    this.userId = userId
    this.setupSocketListeners()
  }

  private setupSocketListeners() {
    if (!this.socket) return

    // Remove existing listeners to prevent duplicates
    this.socket.off('webrtc:offer')
    this.socket.off('webrtc:answer')
    this.socket.off('webrtc:ice-candidate')
    this.socket.off('webrtc:user-joined')
    this.socket.off('webrtc:user-left')
    this.socket.off('webrtc:user-ready')
    this.socket.off('webrtc:voice-users-list')
    this.socket.off('webrtc:user-voice-started')

    this.socket.on('webrtc:offer', this.handleOffer.bind(this))
    this.socket.on('webrtc:answer', this.handleAnswer.bind(this))
    this.socket.on('webrtc:ice-candidate', this.handleIceCandidate.bind(this))
    this.socket.on('webrtc:user-joined', this.handleUserJoined.bind(this))
    this.socket.on('webrtc:user-left', this.handleUserLeft.bind(this))
    this.socket.on('webrtc:user-ready', this.handleUserReady.bind(this))
    this.socket.on('webrtc:voice-users-list', this.handleVoiceUsersList.bind(this))
    this.socket.on('webrtc:user-voice-started', this.handleUserVoiceStarted.bind(this))
  }

  async startVoiceChat(): Promise<boolean> {
    try {
      // Request microphone permission
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      })

      console.log('Voice chat started successfully')
      
      // Notify other users that we started voice chat
      this.socket?.emit('webrtc:voice-started', {
        roomId: this.roomId,
        userId: this.userId
      })

      // Create peer connections for existing users
      this.createPeerConnections()
      
      return true
    } catch (error) {
      console.error('Error starting voice chat:', error)
      return false
    }
  }

  stopVoiceChat() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close())
    this.peerConnections.clear()

    console.log('Voice chat stopped')
    
    this.socket?.emit('webrtc:voice-stopped', {
      roomId: this.roomId,
      userId: this.userId
    })
  }

  async startScreenShare(): Promise<boolean> {
    try {
      // Request screen sharing permission
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { max: 30 }
        },
        audio: true
      })

      console.log('Screen sharing started successfully')

      // Handle when user stops sharing via browser UI
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare()
      }

      // Notify other users about screen sharing
      this.socket?.emit('webrtc:screen-started', {
        roomId: this.roomId,
        userId: this.userId
      })

      // Create peer connections for screen sharing
      this.createScreenShareConnections()

      return true
    } catch (error) {
      console.error('Error starting screen share:', error)
      return false
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop())
      this.screenStream = null
    }

    console.log('Screen sharing stopped')
    
    this.socket?.emit('webrtc:screen-stopped', {
      roomId: this.roomId,
      userId: this.userId
    })
  }

  private async createPeerConnections() {
    console.log('Creating peer connections for voice chat')
    // Notify other users that we're ready for voice connections
    this.socket?.emit('webrtc:ready-for-connections', {
      roomId: this.roomId,
      userId: this.userId,
      type: 'voice'
    })
    
    // Request list of users already in voice chat
    this.socket?.emit('webrtc:request-voice-users', {
      roomId: this.roomId,
      userId: this.userId
    })
  }

  private async createScreenShareConnections() {
    this.socket?.emit('webrtc:ready-for-connections', {
      roomId: this.roomId,
      userId: this.userId,
      type: 'screen'
    })
  }

  private async createPeerConnection(remoteUserId: string, isInitiator: boolean = false): Promise<RTCPeerConnection> {
    console.log(`Creating peer connection with ${remoteUserId}, isInitiator: ${isInitiator}`)
    
    const pc = new RTCPeerConnection({ iceServers: this.iceServers })

    // Add connection state logging
    pc.onconnectionstatechange = () => {
      console.log(`Peer connection with ${remoteUserId} state:`, pc.connectionState)
    }

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection with ${remoteUserId} state:`, pc.iceConnectionState)
    }

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log(`Adding local track to peer connection with ${remoteUserId}:`, track.kind)
        pc.addTrack(track, this.localStream!)
      })
    } else {
      console.warn(`No local stream available when creating peer connection with ${remoteUserId}`)
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote stream from:', remoteUserId, 'Tracks:', event.streams[0].getTracks().length)
      const remoteStream = event.streams[0]
      this.playRemoteAudio(remoteStream, remoteUserId)
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${remoteUserId}`)
        this.socket?.emit('webrtc:ice-candidate', {
          roomId: this.roomId,
          targetUserId: remoteUserId,
          candidate: event.candidate
        })
      }
    }

    this.peerConnections.set(remoteUserId, pc)

    if (isInitiator) {
      // Create and send offer
      console.log(`Creating offer for ${remoteUserId}`)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      console.log(`Sending offer to ${remoteUserId}`)
      this.socket?.emit('webrtc:offer', {
        roomId: this.roomId,
        targetUserId: remoteUserId,
        offer: offer
      })
    }

    return pc
  }

  private async handleOffer(data: any) {
    const { fromUserId, offer } = data
    console.log(`Received offer from ${fromUserId}`)
    
    const pc = await this.createPeerConnection(fromUserId, false)
    
    console.log(`Setting remote description for ${fromUserId}`)
    await pc.setRemoteDescription(offer)
    
    console.log(`Creating answer for ${fromUserId}`)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    console.log(`Sending answer to ${fromUserId}`)
    this.socket?.emit('webrtc:answer', {
      roomId: this.roomId,
      targetUserId: fromUserId,
      answer: answer
    })
  }

  private async handleAnswer(data: any) {
    const { fromUserId, answer } = data
    console.log(`Received answer from ${fromUserId}`)
    
    const pc = this.peerConnections.get(fromUserId)
    
    if (pc) {
      console.log(`Setting remote description (answer) for ${fromUserId}`)
      await pc.setRemoteDescription(answer)
    } else {
      console.error(`No peer connection found for ${fromUserId} when handling answer`)
    }
  }

  private async handleIceCandidate(data: any) {
    const { fromUserId, candidate } = data
    console.log(`Received ICE candidate from ${fromUserId}`)
    
    const pc = this.peerConnections.get(fromUserId)
    
    if (pc) {
      try {
        await pc.addIceCandidate(candidate)
        console.log('Added ICE candidate from:', fromUserId)
      } catch (error) {
        console.error('Error adding ICE candidate:', error)
      }
    } else {
      console.error(`No peer connection found for ${fromUserId} when handling ICE candidate`)
    }
  }

  private async handleUserJoined(data: any) {
    const { userId } = data
    console.log('User joined, creating peer connection:', userId)
    
    if (userId !== this.userId && this.localStream) {
      // Create peer connection for new user and send offer
      await this.createPeerConnection(userId, true)
    }
  }

  private async handleUserReady(data: any) {
    const { userId, type } = data
    console.log('User ready for WebRTC:', userId, type)
    
    if (userId !== this.userId) {
      // Create peer connection for this user
      await this.createPeerConnection(userId, false)
    }
  }

  private handleUserLeft(data: any) {
    const { userId } = data
    console.log('User left, cleaning up connection:', userId)
    
    const pc = this.peerConnections.get(userId)
    if (pc) {
      pc.close()
      this.peerConnections.delete(userId)
    }

    // Remove remote stream
    this.remoteStreams.delete(userId)

    // Remove audio/video elements for this user
    const audioElement = document.getElementById(`remote-audio-${userId}`)
    if (audioElement) {
      audioElement.remove()
    }
    
    const videoElement = document.getElementById(`remote-video-${userId}`)
    if (videoElement) {
      videoElement.remove()
    }
  }

  private async handleVoiceUsersList(data: any) {
    const { voiceUsers } = data
    console.log('Received voice users list:', voiceUsers)
    
    // Create peer connections with all users currently in voice chat
    for (const userId of voiceUsers) {
      if (userId !== this.userId && !this.peerConnections.has(userId)) {
        console.log('Creating peer connection with existing voice user:', userId)
        await this.createPeerConnection(userId, true) // We initiate the connection
      }
    }
  }

  private async handleUserVoiceStarted(data: any) {
    const { userId } = data
    console.log('User started voice chat:', userId)
    
    // If we have voice active and don't have a connection with this user, create one
    if (this.localStream && userId !== this.userId && !this.peerConnections.has(userId)) {
      console.log('Creating peer connection with new voice user:', userId)
      // We initiate the connection since we already have voice active
      await this.createPeerConnection(userId, true)
    }
  }

  private playRemoteAudio(stream: MediaStream, userId: string) {
    // Remove existing audio element
    const existingAudio = document.getElementById(`remote-audio-${userId}`)
    if (existingAudio) {
      existingAudio.remove()
    }

    // Store the remote stream
    this.remoteStreams.set(userId, stream)

    // Create new audio element
    const audio = document.createElement('audio')
    audio.id = `remote-audio-${userId}`
    audio.srcObject = stream
    audio.autoplay = true
    audio.muted = false
    audio.volume = 1.0
    audio.style.display = 'none' // Hidden audio element
    
    // Add event listeners for debugging
    audio.onloadedmetadata = () => {
      console.log('Audio metadata loaded for user:', userId)
      audio.play().catch(e => console.error('Error playing audio:', e))
    }
    
    audio.onplay = () => {
      console.log('Audio started playing for user:', userId)
    }
    
    audio.onerror = (e) => {
      console.error('Audio error for user:', userId, e)
    }
    
    document.body.appendChild(audio)

    console.log('Playing remote audio from:', userId, 'Stream tracks:', stream.getTracks().length)
  }

  // Get current streams for UI updates
  getLocalStream() {
    return this.localStream
  }

  getScreenStream() {
    return this.screenStream
  }

  isVoiceActive() {
    return this.localStream !== null
  }

  isScreenSharing() {
    return this.screenStream !== null
  }

  // Cleanup
  cleanup() {
    this.stopVoiceChat()
    this.stopScreenShare()
    
    if (this.socket) {
      this.socket.off('webrtc:offer')
      this.socket.off('webrtc:answer')
      this.socket.off('webrtc:ice-candidate')
      this.socket.off('webrtc:user-left')
    }
  }
}

// Singleton instance
export const webRTCManager = new WebRTCManager()