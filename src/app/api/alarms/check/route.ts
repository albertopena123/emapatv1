// src/app/api/alarms/check/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { checkAlarms } from '@/lib/alarm-checker'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const canManage = await hasPermission(user.userId, 'alarms', 'manage', 'system')
    if (!canManage && !user.isSuperAdmin) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Ejecutar verificación
    await checkAlarms()

    return NextResponse.json({ 
      success: true,
      message: "Verificación de alarmas ejecutada" 
    })
  } catch (error) {
    console.error("Error checking alarms:", error)
    return NextResponse.json(
      { error: "Error al verificar alarmas" },
      { status: 500 }
    )
  }
}