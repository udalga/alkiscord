import { create } from 'zustand'
import { User, Room, Message, Avatar } from '@/types'

interface RoomState {
  // Current user
  currentUser: User | null
  
  // Current room
  currentRoom: Room | null
  
  // UI state
  isConnected: boolean
  isJoining: boolean
  error: string | null
  
  // Actions
  setCurrentUser: (user: User) => void
  setCurrentRoom: (room: Room) => void
  addMessage: (message: Message) => void
  addUser: (user: User) => void
  removeUser: (userId: string) => void
  updateUserVoice: (userId: string, isActive: boolean) => void
  updateUserScreenShare: (userId: string, isSharing: boolean) => void
  setConnected: (connected: boolean) => void
  setJoining: (joining: boolean) => void
  setError: (error: string | null) => void
  clearRoom: () => void
}

export const useRoomStore = create<RoomState>((set, get) => ({
  currentUser: null,
  currentRoom: null,
  isConnected: false,
  isJoining: false,
  error: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  
  setCurrentRoom: (room) => set({ currentRoom: room }),
  
  addMessage: (message) => set((state) => ({
    currentRoom: state.currentRoom ? {
      ...state.currentRoom,
      messages: [...state.currentRoom.messages, message]
    } : null
  })),
  
  addUser: (user) => set((state) => ({
    currentRoom: state.currentRoom ? {
      ...state.currentRoom,
      users: [...state.currentRoom.users, user]
    } : null
  })),
  
  removeUser: (userId) => set((state) => ({
    currentRoom: state.currentRoom ? {
      ...state.currentRoom,
      users: state.currentRoom.users.filter(u => u.id !== userId)
    } : null
  })),
  
  updateUserVoice: (userId, isActive) => set((state) => ({
    currentRoom: state.currentRoom ? {
      ...state.currentRoom,
      users: state.currentRoom.users.map(u => 
        u.id === userId ? { ...u, isVoiceActive: isActive } : u
      )
    } : null
  })),
  
  updateUserScreenShare: (userId, isSharing) => set((state) => ({
    currentRoom: state.currentRoom ? {
      ...state.currentRoom,
      users: state.currentRoom.users.map(u => 
        u.id === userId ? { ...u, isSharingScreen: isSharing } : u
      )
    } : null
  })),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setJoining: (joining) => set({ isJoining: joining }),
  
  setError: (error) => set({ error }),
  
  clearRoom: () => set({ 
    currentRoom: null, 
    currentUser: null, 
    isConnected: false,
    error: null 
  })
}))

// User preferences store
interface UserPreferencesState {
  nickname: string
  avatar: Avatar
  theme: 'light' | 'dark'
  setNickname: (nickname: string) => void
  setAvatar: (avatar: Avatar) => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUserPreferences = create<UserPreferencesState>((set) => ({
  nickname: '',
  avatar: '🐶',
  theme: 'dark',
  
  setNickname: (nickname) => set({ nickname }),
  setAvatar: (avatar) => set({ avatar }),
  setTheme: (theme) => set({ theme })
}))