import { NextRequest, NextResponse } from 'next/server'
import { CreateRoomData, Room } from '@/types'
import { generateRoomId, generateUserId } from '@/lib/utils'

// Use global rooms from server.js
const rooms = (global as any).rooms || new Map<string, Room>()

export async function POST(request: NextRequest) {
  try {
    const data: CreateRoomData = await request.json()
    
    if (!data.name || !data.creatorNickname || !data.creatorAvatar) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const roomId = generateRoomId()
    const creatorId = generateUserId()
    
    const room: Room = {
      id: roomId,
      name: data.name,
      isPrivate: data.isPrivate,
      createdAt: new Date(),
      users: [],
      messages: [],
      maxUsers: data.maxUsers || 50,
      creatorId
    }

    rooms.set(roomId, room)

    // Clean up rooms after 24 hours
    setTimeout(() => {
      rooms.delete(roomId)
    }, 24 * 60 * 60 * 1000)

    return NextResponse.json({
      success: true,
      roomId,
      room: {
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate,
        userCount: room.users.length,
        maxUsers: room.maxUsers
      }
    })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export rooms for use in other API routes
export { rooms }