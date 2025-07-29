// src/app/api/auth/check-permissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { jwtVerify } from 'jose'
import { hasAnyPermission, hasAllPermissions } from '@/lib/permissions'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this'
)

async function getUser() {
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie')
  
  if (!cookieHeader) return null
  
  const token = cookieHeader.split('; ')
    .find((row: string) => row.startsWith('auth-token='))
    ?.split('=')[1]
  
  if (!token) return null
  
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { permissions, requireAll = false } = await request.json()

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permisos inválidos' },
        { status: 400 }
      )
    }

    const hasPermission = requireAll
      ? await hasAllPermissions(user.userId as string, permissions)
      : await hasAnyPermission(user.userId as string, permissions)

    return NextResponse.json({ hasPermission })
  } catch (error) {
    console.error('Error verificando permisos:', error)
    return NextResponse.json(
      { error: 'Error al verificar permisos' },
      { status: 500 }
    )
  }
}

// src/app/api/auth/permissions/route.ts
export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { getUserPermissions } = await import('@/lib/permissions')
    const permissions = await getUserPermissions(user.userId as string)

    if (!permissions) {
      return NextResponse.json(
        { error: 'No se pudieron obtener los permisos' },
        { status: 500 }
      )
    }

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Error obteniendo permisos:', error)
    return NextResponse.json(
      { error: 'Error al obtener permisos' },
      { status: 500 }
    )
  }
}