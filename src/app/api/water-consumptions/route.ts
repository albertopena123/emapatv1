// src/app/api/water-consumptions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Obtener todos los registros de consumo
export async function GET() {
  try {
    const consumptions = await prisma.waterConsumption.findMany({
      select: {
        id: true,
        amount: true,
        readingDate: true,
        previousAmount: true,
        consumption: true,
        timestamp: true,
        serial: true,
        invoiced: true,
        source: true,
        notes: true,
        sensor: {
          select: {
            numero_medidor: true,
            name: true,
            user: {
              select: {
                name: true,
                dni: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            dni: true
          }
        },
        tarifa: {
          select: {
            id: true,
            name: true,
            waterCharge: true,
            sewerageCharge: true,
            fixedCharge: true,
            tariffCategory: {
              select: {
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        readingDate: "desc"
      }
    })

    return NextResponse.json(consumptions)
  } catch (error) {
    console.error("Error fetching water consumptions:", error)
    return NextResponse.json(
      { error: "Error al obtener registros de consumo" },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo registro de consumo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serial, amount, readingDate, source, notes } = body

    // Verificar que el sensor existe
    const sensor = await prisma.sensor.findUnique({
      where: { numero_medidor: serial },
      select: {
        id: true,
        userId: true,
        tariffCategoryId: true
      }
    })

    if (!sensor) {
      return NextResponse.json(
        { error: "El sensor no existe" },
        { status: 400 }
      )
    }

    // Obtener la lectura anterior más reciente
    const previousReading = await prisma.waterConsumption.findFirst({
      where: { serial },
      orderBy: { readingDate: "desc" },
      select: { amount: true }
    })

    // Calcular consumo
    const previousAmount = previousReading?.amount || 0
    const consumption = amount - previousAmount

    // Obtener tarifa activa para la categoría del sensor
    const activeTariff = await prisma.tariff.findFirst({
      where: {
        tariffCategoryId: sensor.tariffCategoryId,
        isActive: true
      },
      select: { id: true }
    })

    const waterConsumption = await prisma.waterConsumption.create({
      data: {
        amount: parseFloat(amount),
        readingDate: new Date(readingDate),
        previousAmount,
        consumption,
        serial,
        userId: sensor.userId,
        tarifaId: activeTariff?.id,
        source: source || "MANUAL",
        notes: notes || null
      },
      select: {
        id: true,
        amount: true,
        readingDate: true,
        previousAmount: true,
        consumption: true,
        timestamp: true,
        serial: true,
        invoiced: true,
        source: true,
        notes: true,
        sensor: {
          select: {
            numero_medidor: true,
            name: true,
            user: {
              select: {
                name: true,
                dni: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            dni: true
          }
        },
        tarifa: {
          select: {
            id: true,
            name: true,
            waterCharge: true,
            sewerageCharge: true,
            fixedCharge: true,
            tariffCategory: {
              select: {
                displayName: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(waterConsumption, { status: 201 })
  } catch (error) {
    console.error("Error creating water consumption:", error)
    return NextResponse.json(
      { error: "Error al crear registro de consumo" },
      { status: 500 }
    )
  }
}