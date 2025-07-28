// src/app/api/locations/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: {
        map: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            sensors: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json(
      { error: "Error al obtener ubicaciones" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const location = await prisma.location.create({
      data: {
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address,
        description: body.description,
        mapId: body.mapId,
        altitude: body.altitude
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

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json(
      { error: "Error al crear ubicación" },
      { status: 500 }
    )
  }
}