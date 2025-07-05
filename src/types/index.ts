export interface User {
  id: string
  nickname: string
  avatar: string
  isVoiceActive: boolean
  isSharingScreen: boolean
  joinedAt: Date
}

export interface Message {
  id: string
  userId: string
  username: string
  userAvatar: string
  content: string
  timestamp: Date
  type: 'text' | 'file' | 'system'
  fileData?: FileData
}

export interface FileData {
  filename: string
  originalName: string
  size: number
  mimetype: string
  url: string
  type: 'image' | 'video' | 'file'
}

export interface Room {
  id: string
  name: string
  isPrivate: boolean
  createdAt: Date
  users: User[]
  messages: Message[]
  maxUsers: number
  creatorId: string
}

export interface RoomSettings {
  name: string
  isPrivate: boolean
  maxUsers: number
}

export interface JoinRoomData {
  roomId: string
  nickname: string
  avatar: string
}

export interface CreateRoomData {
  name: string
  isPrivate: boolean
  maxUsers: number
  creatorNickname: string
  creatorAvatar: string
}

// Socket Events
export interface ServerToClientEvents {
  'room:joined': (data: { room: Room; user: User }) => void
  'room:user-joined': (user: User) => void
  'room:user-left': (userId: string) => void
  'room:message': (message: Message) => void
  'room:voice-toggle': (data: { userId: string; isActive: boolean }) => void
  'room:screen-share-toggle': (data: { userId: string; isSharing: boolean }) => void
  'room:error': (error: string) => void
}

export interface ClientToServerEvents {
  'room:join': (data: JoinRoomData) => void
  'room:leave': (roomId: string) => void
  'room:send-message': (data: { roomId: string; content: string; fileData?: FileData }) => void
  'room:toggle-voice': (data: { roomId: string; isActive: boolean }) => void
  'room:toggle-screen-share': (data: { roomId: string; isSharing: boolean }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  roomId?: string
}

// Avatar options
export const AVATAR_OPTIONS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
  '🦄', '🐺', '🦉', '🦅', '🐧', '🐢', '🐙', '🦀'
] as const

export type Avatar = typeof AVATAR_OPTIONS[number]