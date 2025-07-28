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
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "FAULTY"]).default("INACTIVE"),
  installationDate: z.string(),
  installerId: z.string().optional(),
  
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeLocation = searchParams.get('includeLocation') === 'true'
    const simple = searchParams.get('simple') === 'true'

    // Formato simple para consumo
    // Formato simple para consumo
if (simple) {
  const sensors = await prisma.sensor.findMany({
    select: {
      id: true,
      name: true,
      numero_medidor: true,
      user: {
        select: {
          name: true,
          dni: true
        }
      }
    },
    where: {
      status: {
        in: ["ACTIVE", "INACTIVE"] // Incluir ambos estados
      }
    },
    orderBy: {
      numero_medidor: "asc"
    }
  })
  return NextResponse.json(sensors)
}

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
        location: includeLocation ? {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true
          }
        } : false,
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

    // Si se requiere el formato para el módulo de ubicaciones
    if (includeLocation) {
      const formattedSensors = sensors.map(sensor => ({
        id: sensor.id,
        nombre: sensor.name,
        numero_medidor: sensor.numero_medidor,
        direccion: sensor.direccion,
        status: sensor.status,
        location: sensor.location,
        // Incluir otros campos si son necesarios para el mapa
        user: sensor.user,
        tariffCategory: sensor.tariffCategory
      }))
      return NextResponse.json(formattedSensors)
    }

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

    // Crear sensor sin ubicación (se agregará durante la instalación)
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
        installerId: data.installerId,
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
        installer: {
          select: {
            id: true,
            name: true,
            dni: true
          }
        },
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