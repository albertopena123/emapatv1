// src/app/api/water-consumptions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Obtener registro específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const consumptionId = parseInt(id)

    const consumption = await prisma.waterConsumption.findUnique({
      where: { id: consumptionId },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const consumptionId = parseInt(id)
    const body = await request.json()
    const { serial, amount, readingDate, source, notes } = body

    // Verificar que el registro existe
    const existingConsumption = await prisma.waterConsumption.findUnique({
      where: { id: consumptionId },
      select: { id: true, invoiced: true, readingDate: true }
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

    // Obtener la lectura anterior más reciente (antes de la fecha de lectura editada)
    const previousReading = await prisma.waterConsumption.findFirst({
      where: { 
        serial,
        readingDate: {
          lt: new Date(readingDate)
        }
      },
      orderBy: { readingDate: "desc" },
      select: { amount: true }
    })

    // Calcular consumo
    const previousAmount = previousReading?.amount || 0
    const consumption = parseFloat(amount) - previousAmount

    // Obtener tarifa activa para la categoría del sensor
    const activeTariff = await prisma.tariff.findFirst({
      where: {
        tariffCategoryId: sensor.tariffCategoryId,
        isActive: true
      },
      select: { id: true }
    })

    // Actualizar el registro
    const updatedConsumption = await prisma.waterConsumption.update({
      where: { id: consumptionId },
      data: {
        amount: parseFloat(amount),
        readingDate: new Date(readingDate),
        previousAmount,
        consumption: consumption > 0 ? consumption : 0,
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

    // Actualizar las lecturas posteriores que dependan de esta
    const subsequentReadings = await prisma.waterConsumption.findMany({
      where: {
        serial,
        readingDate: {
          gt: new Date(readingDate)
        }
      },
      orderBy: { readingDate: "asc" }
    })

    // Recalcular consumos de lecturas posteriores
    let lastAmount = parseFloat(amount)
    for (const reading of subsequentReadings) {
      const newConsumption = reading.amount - lastAmount
      await prisma.waterConsumption.update({
        where: { id: reading.id },
        data: {
          previousAmount: lastAmount,
          consumption: newConsumption > 0 ? newConsumption : 0
        }
      })
      lastAmount = reading.amount
    }

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const consumptionId = parseInt(id)

    // Verificar que el registro existe
    const existingConsumption = await prisma.waterConsumption.findUnique({
      where: { id: consumptionId },
      select: { 
        id: true, 
        invoiced: true,
        invoiceId: true,
        serial: true,
        readingDate: true,
        amount: true
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

    // Eliminar el registro
    await prisma.waterConsumption.delete({
      where: { id: consumptionId }
    })

    // Recalcular consumos de lecturas posteriores
    const subsequentReadings = await prisma.waterConsumption.findMany({
      where: {
        serial: existingConsumption.serial,
        readingDate: {
          gt: existingConsumption.readingDate
        }
      },
      orderBy: { readingDate: "asc" }
    })

    if (subsequentReadings.length > 0) {
      // Obtener la lectura anterior al registro eliminado
      const newPreviousReading = await prisma.waterConsumption.findFirst({
        where: {
          serial: existingConsumption.serial,
          readingDate: {
            lt: existingConsumption.readingDate
          }
        },
        orderBy: { readingDate: "desc" },
        select: { amount: true }
      })

      let lastAmount = newPreviousReading?.amount || 0

      // Actualizar consumos posteriores
      for (const reading of subsequentReadings) {
        const newConsumption = reading.amount - lastAmount
        await prisma.waterConsumption.update({
          where: { id: reading.id },
          data: {
            previousAmount: lastAmount,
            consumption: newConsumption > 0 ? newConsumption : 0
          }
        })
        lastAmount = reading.amount
      }
    }

    return NextResponse.json({ message: "Registro eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting consumption:", error)
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    )
  }
}