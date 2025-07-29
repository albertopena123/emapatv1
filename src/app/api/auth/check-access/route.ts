// src/app/api/auth/check-access/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { hasModuleAccess } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const { userId, moduleName } = await request.json()

    if (!userId || !moduleName) {
      return NextResponse.json(
        { error: 'userId y moduleName son requeridos' },
        { status: 400 }
      )
    }

    const hasAccess = await hasModuleAccess(userId, moduleName)
    
    return NextResponse.json({ hasAccess })
  } catch (error) {
    console.error('Error verificando acceso:', error)
    return NextResponse.json(
      { error: 'Error al verificar acceso' },
      { status: 500 }
    )
  }
}