"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AVATAR_OPTIONS, Avatar as AvatarType } from '@/types'
import { useUserPreferences } from '@/stores/room-store'
import { ArrowLeft, Zap, Sparkles, AlertCircle } from 'lucide-react'

interface JoinRoomDialogProps {
  roomId: string
  onJoin: (nickname: string, avatar: AvatarType) => void
  isJoining: boolean
  error: string | null
}

export function JoinRoomDialog({ roomId, onJoin, isJoining, error }: JoinRoomDialogProps) {
  const { nickname: savedNickname, avatar: savedAvatar } = useUserPreferences()
  const [nickname, setNickname] = useState(savedNickname)
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>(savedAvatar)

  const handleJoin = () => {
    if (nickname.trim()) {
      onJoin(nickname.trim(), selectedAvatar)
    }
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <Dialog open={true}>
        <DialogContent className="glass-dark border-white/20 text-white max-w-lg shadow-discord-lg relative z-10">
          <DialogHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl glow">
                <Zap className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <DialogTitle className="text-3xl font-bold text-gradient-blue mb-2">
              Join Room
            </DialogTitle>
            <div className="glass px-4 py-2 rounded-xl inline-block mb-2">
              <span className="text-lg font-mono font-bold text-white">{roomId}</span>
            </div>
            <DialogDescription className="text-white/70 text-lg">
              Choose your nickname and avatar to join the conversation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-4">
            <div>
              <label className="text-sm font-semibold mb-4 block text-white/90 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                Your Nickname
              </label>
              <Input
                placeholder="Enter your nickname..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="glass input-focus border-white/20 text-white placeholder-white/50 py-4 text-lg rounded-xl"
                disabled={isJoining}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                autoFocus
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-4 block text-white/90 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Choose Avatar
              </label>
              <div className="grid grid-cols-8 gap-3">
                {AVATAR_OPTIONS.map((avatarOption) => (
                  <button
                    key={avatarOption}
                    onClick={() => setSelectedAvatar(avatarOption)}
                    disabled={isJoining}
                    className={`p-3 rounded-xl transition-all duration-300 avatar-hover ${
                      selectedAvatar === avatarOption 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 glow scale-110 shadow-discord' 
                        : 'glass hover:bg-white/10 hover:scale-105'
                    } ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-transparent text-xl">
                        {avatarOption}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="glass-dark border border-red-500/50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isJoining}
              className="glass border-white/20 text-white/70 hover:bg-white/10 rounded-xl btn-hover flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={handleJoin}
              disabled={!nickname.trim() || isJoining}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1 py-3 rounded-xl btn-hover glow font-semibold text-lg"
            >
              {isJoining ? (
                <div className="flex items-center gap-3">
                  <div className="loading-spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Joining...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span>Join Room</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}