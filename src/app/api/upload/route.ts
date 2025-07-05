import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getFileType } from '@/lib/utils'

const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const roomId = formData.get('roomId') as string

    if (!file || !roomId) {
      return NextResponse.json(
        { success: false, error: 'File and room ID are required' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 8MB limit' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', roomId)
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/${roomId}/${filename}`
    const fileType = getFileType(file.name)

    // Clean up file after 24 hours
    setTimeout(async () => {
      try {
        const fs = await import('fs/promises')
        await fs.unlink(filepath)
      } catch (error) {
        console.error('Error cleaning up file:', error)
      }
    }, 24 * 60 * 60 * 1000)

    return NextResponse.json({
      success: true,
      file: {
        filename,
        originalName: file.name,
        size: file.size,
        mimetype: file.type,
        url: fileUrl,
        type: fileType
      }
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}