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
  locationId: z.number().nullable().optional(),
})

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sensor = await prisma.sensor.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            dni: true,
            email: true
          }
        },
        location: true,
        tariffCategory: true,
        installer: {
          select: {
            id: true,
            name: true,
            dni: true
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateSensorSchema.parse(body)

    if (data.locationId !== undefined && data.locationId !== null) {
      const location = await prisma.location.findUnique({
        where: { id: data.locationId }
      })
      
      if (!location) {
        return NextResponse.json(
          { error: "Ubicación no encontrada" },
          { status: 400 }
        )
      }
    }

    const sensor = await prisma.sensor.update({
      where: { id: parseInt(id) },
      data,
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

    return NextResponse.json(sensor)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.sensor.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sensor:", error)
    return NextResponse.json(
      { error: "Error al eliminar sensor" },
      { status: 500 }
    )
  }
}