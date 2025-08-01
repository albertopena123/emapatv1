// src/app/api/alarm-settings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const settings = await prisma.alarmSettings.findUnique({
      where: { userId: user.userId }
    })

    if (!settings) {
      // Crear configuración por defecto
      const defaultSettings = await prisma.alarmSettings.create({
        data: {
          userId: user.userId,
          dailyConsumptionLimit: 3,
          weeklyConsumptionLimit: 8000,
          monthlyConsumptionLimit: null,
          batteryLowThreshold: 2.5,
          dailyAlarmActive: true,
          weeklyAlarmActive: true,
          monthlyAlarmActive: false,
          technicalAlarmsActive: true,
          notifyBySMS: false,
          notifyByEmail: true,
          notifyByPush: false,
          notifyByWhatsApp: false,
          quietHoursStart: null,
          quietHoursEnd: null
        }
      })
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching alarm settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()

    const {
      dailyConsumptionLimit,
      weeklyConsumptionLimit,
      monthlyConsumptionLimit,
      batteryLowThreshold,
      dailyAlarmActive,
      weeklyAlarmActive,
      monthlyAlarmActive,
      technicalAlarmsActive,
      notifyBySMS,
      notifyByEmail,
      notifyByPush,
      notifyByWhatsApp,
      quietHoursStart,
      quietHoursEnd
    } = body

    const settings = await prisma.alarmSettings.upsert({
      where: { userId: user.userId },
      update: {
        dailyConsumptionLimit,
        weeklyConsumptionLimit,
        monthlyConsumptionLimit,
        batteryLowThreshold,
        dailyAlarmActive,
        weeklyAlarmActive,
        monthlyAlarmActive,
        technicalAlarmsActive,
        notifyBySMS,
        notifyByEmail,
        notifyByPush,
        notifyByWhatsApp,
        quietHoursStart,
        quietHoursEnd,
        updatedAt: new Date()
      },
      create: {
        userId: user.userId,
        dailyConsumptionLimit,
        weeklyConsumptionLimit,
        monthlyConsumptionLimit,
        batteryLowThreshold,
        dailyAlarmActive,
        weeklyAlarmActive,
        monthlyAlarmActive,
        technicalAlarmsActive,
        notifyBySMS,
        notifyByEmail,
        notifyByPush,
        notifyByWhatsApp,
        quietHoursStart,
        quietHoursEnd
      },
      select: {
        id: true,
        dailyConsumptionLimit: true,
        weeklyConsumptionLimit: true,
        updatedAt: true
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating alarm settings:", error)
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    )
  }
}