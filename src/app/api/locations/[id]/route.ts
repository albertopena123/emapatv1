// src/app/api/locations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const location = await prisma.location.findUnique({
      where: { id: parseInt(context.params.id) },
      include: {
        map: true,
        sensors: true
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error fetching location:", error)
    return NextResponse.json(
      { error: "Error al obtener ubicación" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const location = await prisma.location.update({
      where: { id: parseInt(context.params.id) },
      data: {
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address,
        description: body.description,
        altitude: body.altitude
      },
      include: {
        map: true
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json(
      { error: "Error al actualizar ubicación" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const locationWithSensors = await prisma.location.findUnique({
      where: { id: parseInt(context.params.id) },
      include: { _count: { select: { sensors: true } } }
    })

    if (locationWithSensors?._count?.sensors && locationWithSensors._count.sensors > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una ubicación con sensores asociados" },
        { status: 400 }
      )
    }

    await prisma.location.delete({
      where: { id: parseInt(context.params.id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting location:", error)
    return NextResponse.json(
      { error: "Error al eliminar ubicación" },
      { status: 500 }
    )
  }
}