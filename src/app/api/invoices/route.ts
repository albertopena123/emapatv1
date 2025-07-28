// src/app/api/invoices/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Obtener todas las facturas
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        periodStart: true,
        periodEnd: true,
        consumptionAmount: true,
        waterCharge: true,
        sewerageCharge: true,
        fixedCharge: true,
        additionalCharges: true,
        discounts: true,
        taxes: true,
        totalAmount: true,
        amountDue: true,
        status: true,
        issuedAt: true,
        sentAt: true,
        dueDate: true,
        paidAt: true,
        notes: true,
        user: {
          select: {
            id: true,
            name: true,
            dni: true
          }
        },
        sensor: {
          select: {
            numero_medidor: true,
            name: true,
            direccion: true
          }
        },
        tarifa: {
          select: {
            name: true,
            tariffCategory: {
              select: {
                displayName: true
              }
            }
          }
        },
        _count: {
          select: {
            payments: true
          }
        }
      },
      orderBy: {
        issuedAt: "desc"
      }
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      { error: "Error al obtener facturas" },
      { status: 500 }
    )
  }
}

// POST - Crear nueva factura
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sensorId,
      periodStart,
      periodEnd,
      dueDate,
      additionalCharges,
      discounts,
      notes
    } = body

    // Verificar que el sensor existe
    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId },
      select: {
        id: true,
        userId: true,
        numero_medidor: true,
        tariffCategoryId: true
      }
    })

    if (!sensor) {
      return NextResponse.json(
        { error: "El sensor no existe" },
        { status: 400 }
      )
    }

    // Obtener tarifa activa para la categoría del sensor
    const activeTariff = await prisma.tariff.findFirst({
      where: {
        tariffCategoryId: sensor.tariffCategoryId,
        isActive: true
      },
      select: {
        id: true,
        waterCharge: true,
        sewerageCharge: true,
        fixedCharge: true
      }
    })

    if (!activeTariff) {
      return NextResponse.json(
        { error: "No hay tarifa activa para esta categoría" },
        { status: 400 }
      )
    }

    // Obtener consumos del período
    const consumptions = await prisma.waterConsumption.findMany({
      where: {
        serial: sensor.numero_medidor,
        readingDate: {
          gte: new Date(periodStart),
          lte: new Date(periodEnd)
        },
        invoiced: false
      },
      select: {
        id: true,
        consumption: true
      }
    })

    const totalConsumption = consumptions.reduce((sum, c) => sum + (c.consumption || 0), 0)

    // Calcular importes
    const waterCharge = totalConsumption * activeTariff.waterCharge
    const sewerageCharge = totalConsumption * activeTariff.sewerageCharge
    const fixedCharge = activeTariff.fixedCharge
    const taxes = 0 // Configurar según necesidad
    const totalAmount = waterCharge + sewerageCharge + fixedCharge + additionalCharges - discounts + taxes

    // Generar número de factura
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { id: "desc" },
      select: { invoiceNumber: true }
    })

    const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split("-")[1]) : 0
    const invoiceNumber = `FAC-${String(lastNumber + 1).padStart(6, "0")}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId: sensor.userId,
        sensorId: sensor.id,
        tarifaId: activeTariff.id,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        consumptionAmount: totalConsumption,
        waterCharge,
        sewerageCharge,
        fixedCharge,
        additionalCharges: additionalCharges || 0,
        discounts: discounts || 0,
        taxes,
        totalAmount,
        amountDue: totalAmount,
        dueDate: new Date(dueDate),
        notes
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true
      }
    })

    // Marcar consumos como facturados
    await prisma.waterConsumption.updateMany({
      where: {
        id: { in: consumptions.map(c => c.id) }
      },
      data: {
        invoiced: true,
        invoiceId: invoice.id
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      { error: "Error al crear factura" },
      { status: 500 }
    )
  }
}