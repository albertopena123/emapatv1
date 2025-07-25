// src/app/api/sensors/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSensorSchema = z.object({
  name: z.string(),
  type: z.string(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  numero_medidor: z.string(),
  userId: z.string(),
  tariffCategoryId: z.number(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "FAULTY"]).default("ACTIVE"),
  installationDate: z.string(),
  
  // Información del cliente
  direccion: z.string(),
  ruc: z.string(),
  referencia: z.string(),
  actividad: z.string(),
  ciclo: z.string(),
  urbanizacion: z.string(),
  cod_catas: z.string(),
  ruta: z.string(),
  secu: z.string(),
})

export async function GET() {
  try {
    const sensors = await prisma.sensor.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            dni: true,
            email: true
          }
        },
        location: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true
          }
        },
        tariffCategory: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(sensors)
  } catch (error) {
    console.error("Error fetching sensors:", error)
    return NextResponse.json(
      { error: "Error al obtener sensores" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createSensorSchema.parse(body)

    // Verificar si el número de medidor ya existe
    const existingSensor = await prisma.sensor.findUnique({
      where: { numero_medidor: data.numero_medidor }
    })

    if (existingSensor) {
      return NextResponse.json(
        { error: "El número de medidor ya existe" },
        { status: 400 }
      )
    }

    // Crear ubicación por defecto
    const defaultMap = await prisma.map.findFirst({
      orderBy: { createdAt: "asc" }
    })

    let mapId = defaultMap?.id

    if (!mapId) {
      const newMap = await prisma.map.create({
        data: {
          name: "Mapa Principal",
          description: "Mapa por defecto del sistema"
        }
      })
      mapId = newMap.id
    }

    const location = await prisma.location.create({
      data: {
        latitude: -12.5864, // Coordenadas por defecto (Puerto Maldonado)
        longitude: -69.1891,
        address: data.direccion,
        mapId: mapId
      }
    })

    // Crear sensor
    const sensor = await prisma.sensor.create({
      data: {
        name: data.name,
        type: data.type,
        model: data.model,
        manufacturer: data.manufacturer,
        numero_medidor: data.numero_medidor,
        status: data.status,
        installationDate: new Date(data.installationDate),
        userId: data.userId,
        locationId: location.id,
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
      },
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

    return NextResponse.json(sensor, { status: 201 })
  } catch (error) {
    console.error("Error creating sensor:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error al crear sensor" },
      { status: 500 }
    )
  }
}