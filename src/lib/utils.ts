import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function generateUserId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

export function isVideoFile(filename: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi']
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

export function getFileType(filename: string): 'image' | 'video' | 'file' {
  if (isImageFile(filename)) return 'image'
  if (isVideoFile(filename)) return 'video'
  return 'file'
}