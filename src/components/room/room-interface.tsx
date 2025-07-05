"use client"

import { useState, useRef, useEffect } from 'react'
import { Room, User, Message } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getSocket } from '@/lib/socket'
import { webRTCManager } from '@/lib/webrtc'
import { formatFileSize } from '@/lib/utils'
import { 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff, 
  Send, 
  Paperclip, 
  Users, 
  LogOut,
  Copy,
  Check,
  Download,
  Image,
  Video,
  File,
  Settings,
  Hash,
  Crown,
  Smile
} from 'lucide-react'

interface RoomInterfaceProps {
  room: Room
  currentUser: User
  onLeaveRoom: () => void
  isConnected: boolean
}

export function RoomInterface({ room, currentUser, onLeaveRoom, isConnected }: RoomInterfaceProps) {
  const [message, setMessage] = useState('')
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [copiedRoomId, setCopiedRoomId] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [room.messages])

  useEffect(() => {
    messageInputRef.current?.focus()
    
    // Initialize WebRTC manager
    const socket = getSocket()
    if (socket && room && currentUser) {
      webRTCManager.setSocket(socket, room.id, currentUser.id)
    }
    
    // Cleanup on unmount
    return () => {
      webRTCManager.cleanup()
    }
  }, [room, currentUser])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!message.trim() || !isConnected) return

    const socket = getSocket()
    if (socket) {
      socket.emit('room:send-message', {
        roomId: room.id,
        content: message.trim()
      })
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoice = async () => {
    const socket = getSocket()
    if (!socket) return

    try {
      if (!isVoiceActive) {
        // Start voice chat
        const success = await webRTCManager.startVoiceChat()
        if (success) {
          setIsVoiceActive(true)
          socket.emit('room:toggle-voice', {
            roomId: room.id,
            isActive: true
          })
          console.log('Voice chat started successfully')
        } else {
          console.error('Failed to start voice chat')
          alert('Failed to access microphone. Please check your permissions.')
        }
      } else {
        // Stop voice chat
        webRTCManager.stopVoiceChat()
        setIsVoiceActive(false)
        socket.emit('room:toggle-voice', {
          roomId: room.id,
          isActive: false
        })
        console.log('Voice chat stopped')
      }
    } catch (error) {
      console.error('Error toggling voice:', error)
      alert('Error with voice chat. Please try again.')
    }
  }

  const toggleScreenShare = async () => {
    const socket = getSocket()
    if (!socket) return

    try {
      if (!isSharingScreen) {
        // Start screen sharing
        const success = await webRTCManager.startScreenShare()
        if (success) {
          setIsSharingScreen(true)
          socket.emit('room:toggle-screen-share', {
            roomId: room.id,
            isSharing: true
          })
          console.log('Screen sharing started successfully')
        } else {
          console.error('Failed to start screen sharing')
          alert('Failed to start screen sharing. Please check your permissions.')
        }
      } else {
        // Stop screen sharing
        webRTCManager.stopScreenShare()
        setIsSharingScreen(false)
        socket.emit('room:toggle-screen-share', {
          roomId: room.id,
          isSharing: false
        })
        console.log('Screen sharing stopped')
      }
    } catch (error) {
      console.error('Error toggling screen share:', error)
      alert('Error with screen sharing. Please try again.')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      alert('File size must be less than 8MB')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('roomId', room.id)

    try {
      setUploadProgress(0)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        const socket = getSocket()
        if (socket) {
          socket.emit('room:send-message', {
            roomId: room.id,
            content: `📎 ${file.name}`,
            fileData: result.file
          })
        }
      } else {
        alert('Failed to upload file: ' + result.error)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setUploadProgress(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(room.id)
      setCopiedRoomId(true)
      setTimeout(() => setCopiedRoomId(false), 2000)
    } catch (error) {
      console.error('Failed to copy room ID:', error)
    }
  }

  const renderMessage = (msg: Message) => {
    const isOwn = msg.userId === currentUser.id
    const isSystem = msg.type === 'system'

    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center my-4">
          <div className="glass px-4 py-2 rounded-full">
            <span className="text-xs text-white/70 font-medium">
              {msg.content}
            </span>
          </div>
        </div>
      )
    }

    return (
      <div key={msg.id} className={`flex gap-4 mb-6 message-enter ${isOwn ? 'flex-row-reverse' : ''}`}>
        <div className="avatar-hover">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-lg">
              {msg.userAvatar}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-md`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-white/90">
              {isOwn ? 'You' : msg.username}
            </span>
            <span className="text-xs text-white/50">
              {new Date(msg.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          
          <div className={`message-bubble ${isOwn ? 'own' : 'other'} shadow-discord`}>
            {msg.fileData ? (
              <div className="space-y-3">
                {msg.fileData.type === 'image' && (
                  <div className="file-preview cursor-pointer" onClick={() => window.open(msg.fileData!.url, '_blank')}>
                    <img 
                      src={msg.fileData.url} 
                      alt={msg.fileData.originalName}
                      className="rounded-lg hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                {msg.fileData.type === 'video' && (
                  <div className="file-preview">
                    <video 
                      controls 
                      className="rounded-lg"
                      preload="metadata"
                    >
                      <source src={msg.fileData.url} type={msg.fileData.mimetype} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-3 glass rounded-lg">
                  {msg.fileData.type === 'image' && <Image className="h-5 w-5 text-blue-400" />}
                  {msg.fileData.type === 'video' && <Video className="h-5 w-5 text-purple-400" />}
                  {msg.fileData.type === 'file' && <File className="h-5 w-5 text-orange-400" />}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{msg.fileData.originalName}</p>
                    <p className="text-xs text-white/60">{formatFileSize(msg.fileData.size)}</p>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-white/10 rounded-lg"
                    onClick={() => window.open(msg.fileData!.url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="glass-dark border-b border-white/10 p-4 shadow-discord">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Hash className="h-6 w-6 text-white/70" />
              <h1 className="text-2xl font-bold text-white">{room.name}</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={copyRoomId}
                className="glass border-white/20 text-white/80 hover:bg-white/10 rounded-lg btn-hover"
              >
                {copiedRoomId ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2 font-mono text-sm">{room.id}</span>
              </Button>
              
              <div className="flex items-center gap-2 glass px-3 py-2 rounded-lg">
                <Users className="h-4 w-4 text-white/70" />
                <span className="text-sm font-medium text-white">{room.users.length}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'status-online' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-white/80">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onLeaveRoom}
              className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 rounded-lg btn-hover"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-1">
            <div className="max-w-4xl mx-auto">
              {room.messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-6 glass-dark border-t border-white/10">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant={isVoiceActive ? "default" : "outline"}
                  onClick={toggleVoice}
                  className={`rounded-xl btn-hover ${
                    isVoiceActive 
                      ? 'bg-green-600 hover:bg-green-700 glow-green' 
                      : 'glass border-white/20 hover:bg-white/10'
                  }`}
                >
                  {isVoiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                
                <Button
                  size="sm"
                  variant={isSharingScreen ? "default" : "outline"}
                  onClick={toggleScreenShare}
                  className={`rounded-xl btn-hover ${
                    isSharingScreen 
                      ? 'bg-blue-600 hover:bg-blue-700 glow' 
                      : 'glass border-white/20 hover:bg-white/10'
                  }`}
                >
                  {isSharingScreen ? <Monitor className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="glass border-white/20 hover:bg-white/10 rounded-xl btn-hover"
                  disabled={uploadProgress !== null}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    ref={messageInputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="glass border-white/20 text-white placeholder-white/50 pr-12 py-3 rounded-xl input-focus"
                    disabled={!isConnected}
                  />
                  {uploadProgress !== null && (
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  )}
                </div>
                
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !isConnected}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl btn-hover glow"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Sidebar */}
        <div className="w-80 glass-dark border-l border-white/10 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-white/70" />
            <h3 className="text-lg font-semibold text-white">
              Users ({room.users.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {room.users.map((user) => (
              <div key={user.id} className="glass p-4 rounded-xl card-hover">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-white/20">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-lg">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {user.id === room.creatorId && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.nickname}
                      </p>
                      {user.id === currentUser.id && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {user.isVoiceActive && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full voice-active" />
                          <span className="text-xs text-green-400">Speaking</span>
                        </div>
                      )}
                      {user.isSharingScreen && (
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3 text-blue-400" />
                          <span className="text-xs text-blue-400">Sharing</span>
                        </div>
                      )}
                      {!user.isVoiceActive && !user.isSharingScreen && (
                        <span className="text-xs text-white/50">Online</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
      />
    </div>
  )
}