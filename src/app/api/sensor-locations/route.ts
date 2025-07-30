// src/app/api/sensor-locations/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const canRead = await hasPermission(user.userId, 'sensors', 'read', 'devices')
    if (!canRead) {
      return NextResponse.json({ error: 'Sin permisos para ver sensores' }, { status: 403 })
    }

    const sensors = await prisma.sensor.findMany({
      select: {
        id: true,
        name: true,
        numero_medidor: true,
        direccion: true,
        status: true,
        locationId: true,
        location: {
          select: {
            id: true,
            latitude: true,
            longitude: true,
            address: true,
            altitude: true,
            description: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            dni: true
          }
        },
        tariffCategory: {
          select: {
            id: true,
            displayName: true
          }
        }
      },
      orderBy: {
        numero_medidor: "asc"
      }
    })

    // Formatear los datos específicamente para el módulo de ubicaciones
    const formattedSensors = sensors.map(sensor => ({
      id: sensor.id,
      nombre: sensor.name,
      numero_medidor: sensor.numero_medidor,
      direccion: sensor.direccion,
      status: sensor.status,
      location: sensor.location,
      user: sensor.user,
      tariffCategory: sensor.tariffCategory
    }))

    return NextResponse.json(formattedSensors)
  } catch (error) {
    console.error("Error fetching sensor locations:", error)
    return NextResponse.json(
      { error: "Error al obtener ubicaciones de sensores" },
      { status: 500 }
    )
  }
}

// Endpoint para actualizar solo la ubicación de un sensor
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { sensorId, locationId } = body

    if (!sensorId || locationId === undefined) {
      return NextResponse.json(
        { error: "sensorId y locationId son requeridos" },
        { status: 400 }
      )
    }

    // Verificar que el sensor existe
    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId }
    })

    if (!sensor) {
      return NextResponse.json(
        { error: "Sensor no encontrado" },
        { status: 404 }
      )
    }

    // Si locationId no es null, verificar que existe
    if (locationId !== null) {
      const location = await prisma.location.findUnique({
        where: { id: locationId }
      })

      if (!location) {
        return NextResponse.json(
          { error: "Ubicación no encontrada" },
          { status: 404 }
        )
      }
    }

    // Actualizar el sensor
    const updatedSensor = await prisma.sensor.update({
      where: { id: sensorId },
      data: { 
        locationId: locationId 
      },
      select: {
        id: true,
        name: true,
        numero_medidor: true,
        direccion: true,
        status: true,
        location: {
          select: {
            id: true,
            latitude: true,
            longitude: true,
            address: true
          }
        }
      }
    })

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entity: 'Sensor',
        entityId: sensorId.toString(),
        oldValues: { locationId: sensor.locationId },
        newValues: { locationId },
      }
    })

    // Devolver en el formato esperado
    return NextResponse.json({
      id: updatedSensor.id,
      nombre: updatedSensor.name,
      numero_medidor: updatedSensor.numero_medidor,
      direccion: updatedSensor.direccion,
      status: updatedSensor.status,
      location: updatedSensor.location
    })
  } catch (error) {
    console.error("Error updating sensor location:", error)
    return NextResponse.json(
      { error: "Error al actualizar ubicación del sensor" },
      { status: 500 }
    )
  }
}