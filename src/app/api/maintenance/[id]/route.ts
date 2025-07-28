// src/app/api/maintenance/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateMaintenanceSchema = z.object({
  sensorId: z.number().optional(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSTALLATION', 'UNINSTALLATION']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  scheduledDate: z.string().transform(str => new Date(str)).optional(),
  startDate: z.string().transform(str => new Date(str)).optional().nullable(),
  endDate: z.string().transform(str => new Date(str)).optional().nullable(),
  technician: z.string().optional().nullable(),
  description: z.string().min(10).optional(),
  findings: z.string().optional().nullable(),
  actionsTaken: z.string().optional().nullable(),
  partsReplaced: z.array(z.string()).optional(),
  cost: z.number().positive().optional().nullable(),
  nextMaintenance: z.string().transform(str => new Date(str)).optional().nullable(),
  attachments: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const maintenance = await prisma.maintenanceLog.findUnique({
      where: { id: params.id },
      include: {
        sensor: {
          select: {
            id: true,
            name: true,
            numero_medidor: true,
            direccion: true,
            user: {
              select: {
                name: true,
                dni: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!maintenance) {
      return NextResponse.json(
        { error: "Registro de mantenimiento no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(maintenance)
  } catch (error) {
    console.error("Error fetching maintenance log:", error)
    return NextResponse.json(
      { error: "Error al obtener registro de mantenimiento" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateMaintenanceSchema.parse(body)

    // Verificar que el registro existe
    const existingMaintenance = await prisma.maintenanceLog.findUnique({
      where: { id: params.id }
    })

    if (!existingMaintenance) {
      return NextResponse.json(
        { error: "Registro de mantenimiento no encontrado" },
        { status: 404 }
      )
    }

    // Si se cambia el sensor, verificar que existe
    if (data.sensorId) {
      const sensor = await prisma.sensor.findUnique({
        where: { id: data.sensorId }
      })

      if (!sensor) {
        return NextResponse.json(
          { error: "Sensor no encontrado" },
          { status: 404 }
        )
      }
    }

    // Actualizar registro
    const updatedMaintenance = await prisma.maintenanceLog.update({
      where: { id: params.id },
      data: {
        ...(data.sensorId && { sensorId: data.sensorId }),
        ...(data.type && { type: data.type }),
        ...(data.status && { status: data.status }),
        ...(data.scheduledDate && { scheduledDate: data.scheduledDate }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.technician !== undefined && { technician: data.technician }),
        ...(data.description && { description: data.description }),
        ...(data.findings !== undefined && { findings: data.findings }),
        ...(data.actionsTaken !== undefined && { actionsTaken: data.actionsTaken }),
        ...(data.partsReplaced && { partsReplaced: data.partsReplaced }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.nextMaintenance !== undefined && { nextMaintenance: data.nextMaintenance }),
        ...(data.attachments && { attachments: data.attachments }),
        ...(data.metadata && { metadata: data.metadata })
      },
      include: {
        sensor: {
          select: {
            id: true,
            name: true,
            numero_medidor: true
          }
        }
      }
    })

    return NextResponse.json(updatedMaintenance)
  } catch (error) {
    console.error("Error updating maintenance log:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al actualizar registro de mantenimiento" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el registro existe
    const existingMaintenance = await prisma.maintenanceLog.findUnique({
      where: { id: params.id }
    })

    if (!existingMaintenance) {
      return NextResponse.json(
        { error: "Registro de mantenimiento no encontrado" },
        { status: 404 }
      )
    }

    // Eliminar registro
    await prisma.maintenanceLog.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Registro eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting maintenance log:", error)
    return NextResponse.json(
      { error: "Error al eliminar registro de mantenimiento" },
      { status: 500 }
    )
  }
}