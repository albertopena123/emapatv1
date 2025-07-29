// src/app/api/auth/permissions/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const permissions = await getUserPermissions(user.userId)

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