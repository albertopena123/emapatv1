// src/app/api/alarms/[id]/resolve/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST - Resolver alarma
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alarmId } = await params

    const alarm = await prisma.alarmHistory.findUnique({
      where: { id: alarmId },
      select: { id: true, resolved: true }
    })

    if (!alarm) {
      return NextResponse.json(
        { error: "Alarma no encontrada" },
        { status: 404 }
      )
    }

    if (alarm.resolved) {
      return NextResponse.json(
        { error: "La alarma ya está resuelta" },
        { status: 400 }
      )
    }

    const updatedAlarm = await prisma.alarmHistory.update({
      where: { id: alarmId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: "Sistema", // TODO: Obtener usuario actual
        acknowledged: true,
        acknowledgedAt: new Date()
      },
      select: {
        id: true,
        resolved: true,
        resolvedAt: true
      }
    })

    return NextResponse.json(updatedAlarm)
  } catch (error) {
    console.error("Error resolving alarm:", error)
    return NextResponse.json(
      { error: "Error al resolver alarma" },
      { status: 500 }
    )
  }
}