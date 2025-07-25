// src/app/api/sensors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSensorSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "FAULTY"]).optional(),
  userId: z.string().optional(),
  tariffCategoryId: z.number().optional(),
  
  // Información del cliente
  direccion: z.string().optional(),
  ruc: z.string().optional(),
  referencia: z.string().optional(),
  actividad: z.string().optional(),
  ciclo: z.string().optional(),
  urbanizacion: z.string().optional(),
  cod_catas: z.string().optional(),
  ruta: z.string().optional(),
  secu: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sensorId = parseInt(params.id)
    
    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId },
      include: {
        user: true,
        location: true,
        tariffCategory: true,
        waterConsumptions: {
          take: 10,
          orderBy: { timestamp: "desc" }
        },
        batteryHistory: {
          take: 1,
          orderBy: { timestamp: "desc" }
        }
      }
    })

    if (!sensor) {
      return NextResponse.json(
        { error: "Sensor no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(sensor)
  } catch (error) {
    console.error("Error fetching sensor:", error)
    return NextResponse.json(
      { error: "Error al obtener sensor" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateSensorSchema.parse(body)
    const sensorId = parseInt(params.id)

    // Verificar si el sensor existe
    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId }
    })

    if (!sensor) {
      return NextResponse.json(
        { error: "Sensor no encontrado" },
        { status: 404 }
      )
    }

    // Si se cambia el estado, actualizar lastCommunication
    const updateData: typeof data & { lastCommunication?: Date } = { ...data }
    if (data.status && data.status === "ACTIVE") {
      updateData.lastCommunication = new Date()
    }

    // Actualizar sensor
    const updatedSensor = await prisma.sensor.update({
      where: { id: sensorId },
      data: updateData,
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

    return NextResponse.json(updatedSensor)
  } catch (error) {
    console.error("Error updating sensor:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al actualizar sensor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sensorId = parseInt(params.id)

    // Verificar si el sensor existe
    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId },
      include: {
        _count: {
          select: {
            waterConsumptions: true,
            invoices: true
          }
        }
      }
    })

    if (!sensor) {
      return NextResponse.json(
        { error: "Sensor no encontrado" },
        { status: 404 }
      )
    }

    // No permitir eliminar si tiene consumos o facturas
    if (sensor._count.waterConsumptions > 0 || sensor._count.invoices > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un sensor con historial de consumo o facturas" },
        { status: 400 }
      )
    }

    // Eliminar sensor y su ubicación
    await prisma.$transaction([
      prisma.sensor.delete({
        where: { id: sensorId }
      }),
      prisma.location.delete({
        where: { id: sensor.locationId }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sensor:", error)
    return NextResponse.json(
      { error: "Error al eliminar sensor" },
      { status: 500 }
    )
  }
}