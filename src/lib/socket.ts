import { io, Socket } from 'socket.io-client'
import { ServerToClientEvents, ClientToServerEvents } from '@/types'

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
  private static instance: SocketManager

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!this.socket) {
      this.socket = io(process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com' 
        : 'http://localhost:3000', {
        transports: ['websocket', 'polling']
      })
    }
    return this.socket
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export const socketManager = SocketManager.getInstance()
export const getSocket = () => socketManager.getSocket()
export const connectSocket = () => socketManager.connect()
export const disconnectSocket = () => socketManager.disconnect()