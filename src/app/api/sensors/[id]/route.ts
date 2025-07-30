// src/app/api/sensors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

const updateSensorSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  model: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "FAULTY"]),
  userId: z.string(),
  tariffCategoryId: z.number(),
  direccion: z.string(),
  ruc: z.string(),
  referencia: z.string(),
  actividad: z.string(),
  ciclo: z.string(),
  urbanizacion: z.string(),
  cod_catas: z.string(),
  ruta: z.string(),
  secu: z.string(),
  // Tipo de ubicación
  locationType: z.enum(["keep", "existing", "new"]).optional(),
  // Ubicación existente
  locationId: z.number().optional(),
  // Nueva ubicación
  newLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    altitude: z.number().optional().nullable(),
    address: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    mapId: z.number(),
  }).optional(),
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

// Tipo para los datos de actualización del sensor
type SensorUpdateData = {
  name: string
  type: string
  model: string | null
  manufacturer: string | null
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "FAULTY"
  userId: string
  tariffCategoryId: number
  direccion: string
  ruc: string
  referencia: string
  actividad: string
  ciclo: string
  urbanizacion: string
  cod_catas: string
  ruta: string
  secu: string
  locationId?: number
}

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
    const data = updateSensorSchema.parse(body)

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

    // Preparar datos para actualizar
    const updateData: SensorUpdateData = {
      name: data.name,
      type: data.type,
      model: data.model || null,
      manufacturer: data.manufacturer || null,
      status: data.status,
      userId: data.userId,
      tariffCategoryId: data.tariffCategoryId,
      direccion: data.direccion,
      ruc: data.ruc,
      referencia: data.referencia,
      actividad: data.actividad,
      ciclo: data.ciclo,
      urbanizacion: data.urbanizacion,
      cod_catas: data.cod_catas,
      ruta: data.ruta,
      secu: data.secu,
    }

    // Manejar la ubicación según el tipo
    if (data.locationType === "existing" && data.locationId !== undefined) {
      // Usar una ubicación existente
      updateData.locationId = data.locationId
    } else if (data.locationType === "new" && data.newLocation) {
      // Crear una nueva ubicación
      const newLocation = await prisma.location.create({
        data: {
          latitude: data.newLocation.latitude,
          longitude: data.newLocation.longitude,
          altitude: data.newLocation.altitude || null,
          address: data.newLocation.address || null,
          description: data.newLocation.description || null,
          mapId: data.newLocation.mapId,
        }
      })
      updateData.locationId = newLocation.id
    }
    // Si locationType es "keep" o no se especifica, no modificamos la ubicación

    // Actualizar el sensor
    const updatedSensor = await prisma.sensor.update({
      where: { id: parseInt(id) },
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

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entity: 'Sensor',
        entityId: id,
        oldValues: existingSensor,
        newValues: updateData,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const canDelete = await hasPermission(user.userId, 'sensors', 'delete', 'devices')
    if (!canDelete) {
      return NextResponse.json({ error: 'Sin permisos para eliminar sensores' }, { status: 403 })
    }

    const { id } = await params
    
    // Verificar que el sensor existe
    const sensor = await prisma.sensor.findUnique({
      where: { id: parseInt(id) }
    })

    if (!sensor) {
      return NextResponse.json(
        { error: "Sensor no encontrado" },
        { status: 404 }
      )
    }

    await prisma.sensor.delete({
      where: { id: parseInt(id) }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE',
        entity: 'Sensor',
        entityId: id,
        oldValues: sensor,
      }
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