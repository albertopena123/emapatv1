// src/app/api/water-consumptions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Obtener registro específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const consumption = await prisma.waterConsumption.findUnique({
      where: { id },
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

    if (!consumption) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(consumption)
  } catch (error) {
    console.error("Error fetching consumption:", error)
    return NextResponse.json(
      { error: "Error al obtener registro" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar registro
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { serial, amount, readingDate, source, notes } = body

    // Verificar que el registro existe
    const existingConsumption = await prisma.waterConsumption.findUnique({
      where: { id },
      select: { id: true, invoiced: true }
    })

    if (!existingConsumption) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    // No permitir editar registros ya facturados
    if (existingConsumption.invoiced) {
      return NextResponse.json(
        { error: "No se puede editar un registro ya facturado" },
        { status: 400 }
      )
    }

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

    // Obtener la lectura anterior (excluyendo el registro actual)
    const previousReading = await prisma.waterConsumption.findFirst({
      where: { 
        serial,
        id: { not: id }
      },
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

    const updatedConsumption = await prisma.waterConsumption.update({
      where: { id },
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

    return NextResponse.json(updatedConsumption)
  } catch (error) {
    console.error("Error updating consumption:", error)
    return NextResponse.json(
      { error: "Error al actualizar registro" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar registro
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    // Verificar que el registro existe
    const existingConsumption = await prisma.waterConsumption.findUnique({
      where: { id },
      select: { 
        id: true, 
        invoiced: true,
        invoiceId: true
      }
    })

    if (!existingConsumption) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    // No permitir eliminar registros ya facturados
    if (existingConsumption.invoiced || existingConsumption.invoiceId) {
      return NextResponse.json(
        { error: "No se puede eliminar un registro que ya está facturado" },
        { status: 400 }
      )
    }

    await prisma.waterConsumption.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Registro eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting consumption:", error)
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    )
  }
}