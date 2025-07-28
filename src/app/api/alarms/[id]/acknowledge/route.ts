// src/app/api/alarms/[id]/acknowledge/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST - Reconocer alarma
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alarmId } = await params // Await params

    const alarm = await prisma.alarmHistory.findUnique({
      where: { id: alarmId },
      select: { id: true, acknowledged: true, resolved: true }
    })

    if (!alarm) {
      return NextResponse.json(
        { error: "Alarma no encontrada" },
        { status: 404 }
      )
    }

    if (alarm.acknowledged) {
      return NextResponse.json(
        { error: "La alarma ya está reconocida" },
        { status: 400 }
      )
    }

    const updatedAlarm = await prisma.alarmHistory.update({
      where: { id: alarmId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: "Sistema" // TODO: Obtener usuario actual
      },
      select: {
        id: true,
        acknowledged: true,
        acknowledgedAt: true
      }
    })

    return NextResponse.json(updatedAlarm)
  } catch (error) {
    console.error("Error acknowledging alarm:", error)
    return NextResponse.json(
      { error: "Error al reconocer alarma" },
      { status: 500 }
    )
  }
}