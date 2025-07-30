// src/app/api/locations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { z } from "zod"

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional().nullable(),
  address: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  mapId: z.number().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) },
      include: {
        map: {
          select: {
            id: true,
            name: true
          }
        },
        sensors: {
          select: {
            id: true,
            name: true,
            numero_medidor: true
          }
        }
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const canUpdate = await hasPermission(user.userId, 'locations', 'update', 'devices')
    if (!canUpdate) {
      return NextResponse.json({ error: 'Sin permisos para editar ubicaciones' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateLocationSchema.parse(body)

    // Verificar que la ubicación existe
    const existingLocation = await prisma.location.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      )
    }

    // Si se proporciona mapId, verificar que existe
    if (data.mapId) {
      const map = await prisma.map.findUnique({
        where: { id: data.mapId }
      })
      if (!map) {
        return NextResponse.json(
          { error: "Mapa no encontrado" },
          { status: 404 }
        )
      }
    }

    // Actualizar ubicación
    const updatedLocation = await prisma.location.update({
      where: { id: parseInt(id) },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        address: data.address,
        description: data.description,
        mapId: data.mapId || existingLocation.mapId
      },
      include: {
        map: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entity: 'Location',
        entityId: id,
        oldValues: existingLocation,
        newValues: data,
      }
    })

    return NextResponse.json(updatedLocation)
  } catch (error) {
    console.error("Error updating location:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al actualizar ubicación" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const canDelete = await hasPermission(user.userId, 'locations', 'delete', 'devices')
    if (!canDelete) {
      return NextResponse.json({ error: 'Sin permisos para eliminar ubicaciones' }, { status: 403 })
    }

    const { id } = await params

    // Verificar si hay sensores usando esta ubicación
    const sensorsUsingLocation = await prisma.sensor.count({
      where: { locationId: parseInt(id) }
    })

    if (sensorsUsingLocation > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: ${sensorsUsingLocation} sensor(es) usan esta ubicación` },
        { status: 400 }
      )
    }

    // Eliminar ubicación
    await prisma.location.delete({
      where: { id: parseInt(id) }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE',
        entity: 'Location',
        entityId: id,
      }
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