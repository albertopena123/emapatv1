// src/lib/auth.ts
import { headers } from 'next/headers'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this'
)

export interface UserPayload {
  userId: string
  email?: string
  dni?: string
  name?: string
  isSuperAdmin?: boolean
  roleId?: number
}

export async function getUser(): Promise<UserPayload | null> {
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie')
  
  if (!cookieHeader) return null
  
  const token = cookieHeader.split('; ')
    .find((row: string) => row.startsWith('auth-token='))
    ?.split('=')[1]
  
  if (!token) return null
  
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as UserPayload
  } catch {
    return null
  }
}