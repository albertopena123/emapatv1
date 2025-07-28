// src/app/api/alarms/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Obtener todas las alarmas
export async function GET() {
  try {
    const alarms = await prisma.alarmHistory.findMany({
      select: {
        id: true,
        alarmType: true,
        severity: true,
        title: true,
        description: true,
        timestamp: true,
        value: true,
        threshold: true,
        acknowledged: true,
        acknowledgedAt: true,
        acknowledgedBy: true,
        resolved: true,
        resolvedAt: true,
        resolvedBy: true,
        notified: true,
        user: {
          select: {
            id: true,
            name: true,
            dni: true
          }
        },
        sensor: {
          select: {
            numero_medidor: true,
            name: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      }
    })

    return NextResponse.json(alarms)
  } catch (error) {
    console.error("Error fetching alarms:", error)
    return NextResponse.json(
      { error: "Error al obtener alarmas" },
      { status: 500 }
    )
  }
}

// POST - Crear nueva alarma (para sistema interno)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      sensorId,
      alarmType,
      severity,
      title,
      description,
      value,
      threshold
    } = body

    const alarm = await prisma.alarmHistory.create({
      data: {
        userId,
        sensorId,
        alarmType,
        severity: severity || "WARNING",
        title,
        description,
        value: value || null,
        threshold: threshold || null,
        timestamp: new Date()
      },
      select: {
        id: true,
        title: true,
        severity: true,
        timestamp: true
      }
    })

    return NextResponse.json(alarm, { status: 201 })
  } catch (error) {
    console.error("Error creating alarm:", error)
    return NextResponse.json(
      { error: "Error al crear alarma" },
      { status: 500 }
    )
  }
}