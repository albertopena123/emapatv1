// src/app/api/alarm-settings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Obtener configuración de alarmas del usuario actual
export async function GET() {
  try {
    // TODO: Obtener userId del token/sesión
    const userId = "temp-user-id" // Placeholder

    const settings = await prisma.alarmSettings.findUnique({
      where: { userId },
      select: {
        dailyConsumptionLimit: true,
        weeklyConsumptionLimit: true,
        monthlyConsumptionLimit: true,
        batteryLowThreshold: true,
        dailyAlarmActive: true,
        weeklyAlarmActive: true,
        monthlyAlarmActive: true,
        technicalAlarmsActive: true,
        notifyBySMS: true,
        notifyByEmail: true,
        notifyByPush: true,
        notifyByWhatsApp: true,
        quietHoursStart: true,
        quietHoursEnd: true
      }
    })

    // Si no existe configuración, crear una por defecto
    if (!settings) {
      const defaultSettings = await prisma.alarmSettings.create({
        data: {
          userId,
          dailyConsumptionLimit: 3,
          weeklyConsumptionLimit: 8000,
          batteryLowThreshold: 2.5,
          dailyAlarmActive: true,
          weeklyAlarmActive: true,
          technicalAlarmsActive: true,
          notifyByEmail: true
        },
        select: {
          dailyConsumptionLimit: true,
          weeklyConsumptionLimit: true,
          monthlyConsumptionLimit: true,
          batteryLowThreshold: true,
          dailyAlarmActive: true,
          weeklyAlarmActive: true,
          monthlyAlarmActive: true,
          technicalAlarmsActive: true,
          notifyBySMS: true,
          notifyByEmail: true,
          notifyByPush: true,
          notifyByWhatsApp: true,
          quietHoursStart: true,
          quietHoursEnd: true
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

// PUT - Actualizar configuración de alarmas
export async function PUT(request: NextRequest) {
  try {
    // TODO: Obtener userId del token/sesión
    const userId = "temp-user-id" // Placeholder
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
      where: { userId },
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
        userId,
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