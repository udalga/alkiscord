"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AVATAR_OPTIONS, Avatar as AvatarType } from '@/types'
import { useUserPreferences } from '@/stores/room-store'
import { Users, Plus, LogIn, MessageCircle, Share, Mic, Sparkles, Zap, Shield, Globe } from 'lucide-react'

export function LandingPage() {
  const router = useRouter()
  const { nickname, avatar, setNickname, setAvatar } = useUserPreferences()
  
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [joinRoomOpen, setJoinRoomOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [tempNickname, setTempNickname] = useState(nickname)
  const [tempAvatar, setTempAvatar] = useState<AvatarType>(avatar)

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !tempNickname.trim()) return

    setNickname(tempNickname)
    setAvatar(tempAvatar)

    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          isPrivate,
          maxUsers: 50,
          creatorNickname: tempNickname,
          creatorAvatar: tempAvatar
        })
      })

      const data = await response.json()
      if (data.success) {
        router.push(`/room/${data.roomId}`)
      }
    } catch (error) {
      console.error('Failed to create room:', error)
    }
  }

  const handleJoinRoom = () => {
    if (!roomCode.trim() || !tempNickname.trim()) return

    setNickname(tempNickname)
    setAvatar(tempAvatar)
    router.push(`/room/${roomCode.toUpperCase()}`)
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="float mb-8">
            <h1 className="text-8xl font-black text-gradient neon-text mb-6 tracking-tight">
              AlkisCord
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
              <p className="text-2xl text-white/90 font-medium">
                Create rooms and chat with friends instantly
              </p>
              <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              No registration required • Beautiful interface • Real-time communication
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="glass card-hover p-6 rounded-2xl shadow-discord">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-blue-500/20 rounded-xl glow">
                  <MessageCircle className="h-8 w-8 text-blue-400" />
                </div>
                <span className="text-white font-semibold">Text Chat</span>
                <span className="text-white/60 text-sm text-center">Instant messaging with emoji support</span>
              </div>
            </div>
            
            <div className="glass card-hover p-6 rounded-2xl shadow-discord">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-green-500/20 rounded-xl glow-green">
                  <Mic className="h-8 w-8 text-green-400" />
                </div>
                <span className="text-white font-semibold">Voice Chat</span>
                <span className="text-white/60 text-sm text-center">Crystal clear audio communication</span>
              </div>
            </div>
            
            <div className="glass card-hover p-6 rounded-2xl shadow-discord">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Share className="h-8 w-8 text-purple-400" />
                </div>
                <span className="text-white font-semibold">Screen Share</span>
                <span className="text-white/60 text-sm text-center">Share your screen seamlessly</span>
              </div>
            </div>
            
            <div className="glass card-hover p-6 rounded-2xl shadow-discord">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Users className="h-8 w-8 text-orange-400" />
                </div>
                <span className="text-white font-semibold">File Sharing</span>
                <span className="text-white/60 text-sm text-center">Share files up to 8MB instantly</span>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span className="text-white/80 text-sm">Secure & Private</span>
            </div>
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-white/80 text-sm">Lightning Fast</span>
            </div>
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" />
              <span className="text-white/80 text-sm">No Downloads</span>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Create Room Card */}
          <div className="glass-dark card-hover p-8 rounded-3xl shadow-discord-lg border border-white/10">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-blue-500/20 rounded-2xl mb-4 glow">
                <Plus className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Create Room</h3>
              <p className="text-white/70">Start a new room and invite your friends</p>
            </div>
            
            <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl btn-hover shadow-discord transition-all duration-300">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Room
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-dark border-white/20 text-white max-w-md shadow-discord-lg">
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl font-bold text-gradient">
                    Create a New Room
                  </DialogTitle>
                  <DialogDescription className="text-white/70 text-center">
                    Set up your room and choose your identity
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold mb-3 block text-white/90">Room Name</label>
                    <Input
                      placeholder="Enter room name..."
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="glass input-focus border-white/20 text-white placeholder-white/50 py-3 rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-3 block text-white/90">Your Nickname</label>
                    <Input
                      placeholder="Enter your nickname..."
                      value={tempNickname}
                      onChange={(e) => setTempNickname(e.target.value)}
                      className="glass input-focus border-white/20 text-white placeholder-white/50 py-3 rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-3 block text-white/90">Choose Avatar</label>
                    <div className="grid grid-cols-8 gap-3">
                      {AVATAR_OPTIONS.map((avatarOption) => (
                        <button
                          key={avatarOption}
                          onClick={() => setTempAvatar(avatarOption)}
                          className={`p-3 rounded-xl transition-all duration-300 avatar-hover ${
                            tempAvatar === avatarOption 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 glow scale-110' 
                              : 'glass hover:bg-white/10'
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-transparent text-lg">
                              {avatarOption}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="private"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-5 h-5 rounded focus-ring"
                    />
                    <label htmlFor="private" className="text-sm text-white/90">
                      Make room private (requires room code to join)
                    </label>
                  </div>
                </div>
                
                <DialogFooter className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCreateRoomOpen(false)}
                    className="border-white/20 text-white/70 hover:bg-white/10 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={!roomName.trim() || !tempNickname.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl btn-hover flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Join Room Card */}
          <div className="glass-dark card-hover p-8 rounded-3xl shadow-discord-lg border border-white/10">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-purple-500/20 rounded-2xl mb-4">
                <LogIn className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Join Room</h3>
              <p className="text-white/70">Enter a room code to join an existing room</p>
            </div>
            
            <Dialog open={joinRoomOpen} onOpenChange={setJoinRoomOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-xl btn-hover shadow-discord transition-all duration-300">
                  <LogIn className="h-5 w-5 mr-2" />
                  Join Existing Room
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-dark border-white/20 text-white max-w-md shadow-discord-lg">
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl font-bold text-gradient-blue">
                    Join a Room
                  </DialogTitle>
                  <DialogDescription className="text-white/70 text-center">
                    Enter the room code and set up your identity
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold mb-3 block text-white/90">Room Code</label>
                    <Input
                      placeholder="Enter room code..."
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="glass input-focus border-white/20 text-white placeholder-white/50 py-3 rounded-xl uppercase text-center text-lg font-mono tracking-wider"
                      maxLength={6}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-3 block text-white/90">Your Nickname</label>
                    <Input
                      placeholder="Enter your nickname..."
                      value={tempNickname}
                      onChange={(e) => setTempNickname(e.target.value)}
                      className="glass input-focus border-white/20 text-white placeholder-white/50 py-3 rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-3 block text-white/90">Choose Avatar</label>
                    <div className="grid grid-cols-8 gap-3">
                      {AVATAR_OPTIONS.map((avatarOption) => (
                        <button
                          key={avatarOption}
                          onClick={() => setTempAvatar(avatarOption)}
                          className={`p-3 rounded-xl transition-all duration-300 avatar-hover ${
                            tempAvatar === avatarOption 
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 glow scale-110' 
                              : 'glass hover:bg-white/10'
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-transparent text-lg">
                              {avatarOption}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <DialogFooter className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setJoinRoomOpen(false)}
                    className="border-white/20 text-white/70 hover:bg-white/10 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleJoinRoom}
                    disabled={!roomCode.trim() || !tempNickname.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl btn-hover flex-1"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Join Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="glass px-8 py-4 rounded-2xl inline-block shadow-discord">
            <p className="text-white/80 text-sm font-medium">
              ✨ No registration required • 🔒 Rooms are temporary • 📁 Files up to 8MB • 🚀 Lightning fast
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}