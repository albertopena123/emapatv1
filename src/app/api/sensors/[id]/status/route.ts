// src/app/api/sensors/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "FAULTY"])
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const canUpdate = await hasPermission(user.userId, 'sensors', 'update', 'devices')
    if (!canUpdate) {
      return NextResponse.json({ error: 'Sin permisos para editar sensores' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = updateStatusSchema.parse(body)

    // Verificar que el sensor existe
    const existingSensor = await prisma.sensor.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingSensor) {
      return NextResponse.json(
        { error: "Sensor no encontrado" },
        { status: 404 }
      )
    }

    // Actualizar solo el estado
    const updatedSensor = await prisma.sensor.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            dni: true
          }
        },
        location: true,
        tariffCategory: true
      }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entity: 'Sensor',
        entityId: id,
        oldValues: { status: existingSensor.status },
        newValues: { status },
      }
    })

    return NextResponse.json(updatedSensor)
  } catch (error) {
    console.error("Error updating sensor status:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Estado inválido", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al actualizar estado del sensor" },
      { status: 500 }
    )
  }
}