// src/app/api/invoices/route.ts
// 
// API para gestión de facturas de consumo de agua
// 
// NOTAS IMPORTANTES:
// 1. Los consumos se guardan en LITROS en la base de datos
// 2. Las tarifas están en S/. por METRO CÚBICO (m³)
// 3. La conversión es: 1 m³ = 1000 litros
// 4. Las fechas se manejan en UTC pero se ajustan para Lima (UTC-5)
// 5. Los totales se redondean a múltiplos de 0.10 soles
//
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Función para redondear a múltiplos de 0.10
function roundToTenCents(amount: number): number {
  return Math.round(amount * 10) / 10
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

    // IMPORTANTE: Ajustar el rango de fechas
    // Si el usuario selecciona hasta el 20 de julio en Lima,
    // necesitamos incluir los consumos hasta el 21 de julio 04:59:59 UTC
    // (que es el 20 de julio 23:59:59 en Lima)
    
    const startDate = new Date(periodStart)
    const endDate = new Date(periodEnd)
    
    // Agregar 5 horas al endDate para compensar UTC-5 de Lima
    const adjustedEndDate = new Date(endDate.getTime() + (5 * 60 * 60 * 1000))

    // Obtener consumos del período
    const consumptions = await prisma.waterConsumption.findMany({
      where: {
        serial: sensor.numero_medidor,
        readingDate: {
          gte: startDate,
          lte: adjustedEndDate
        },
        invoiced: false
      },
      select: {
        id: true,
        amount: true,
        previousAmount: true,
        consumption: true,
        readingDate: true
      },
      orderBy: {
        readingDate: 'asc'
      }
    })

    // Obtener la lectura anterior al período si no existe en el primer consumo
    let lecturaAnterior = 0
    if (consumptions.length > 0) {
      const firstConsumption = consumptions[0]
      if (firstConsumption.previousAmount !== null) {
        lecturaAnterior = firstConsumption.previousAmount
      } else {
        // Buscar la última lectura antes del período
        const previousReading = await prisma.waterConsumption.findFirst({
          where: {
            serial: sensor.numero_medidor,
            readingDate: {
              lt: startDate
            }
          },
          select: {
            amount: true
          },
          orderBy: {
            readingDate: 'desc'
          }
        })
        if (previousReading) {
          lecturaAnterior = previousReading.amount
        }
      }
    }
    
    const lecturaActual = consumptions.length > 0 ? consumptions[consumptions.length - 1].amount : 0

    if (consumptions.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron consumos en el período seleccionado" },
        { status: 400 }
      )
    }

    // Sumar consumos (están en litros)
    const totalConsumptionLiters = consumptions.reduce((sum, c) => sum + (c.consumption || 0), 0)
    
    // IMPORTANTE: Convertir de litros a metros cúbicos
    // Los sensores IoT envían lecturas en litros, pero las tarifas están en S/. por m³
    // 1 m³ = 1000 litros
    const totalConsumptionM3 = totalConsumptionLiters / 1000

    // Validar que hay consumo para facturar
    if (totalConsumptionM3 === 0) {
      return NextResponse.json(
        { error: "No hay consumo para facturar en el período seleccionado" },
        { status: 400 }
      )
    }

    // Calcular importes (tarifas están en S/. por m³)
    const waterCharge = Math.round(totalConsumptionM3 * activeTariff.waterCharge * 100) / 100
    const sewerageCharge = Math.round(totalConsumptionM3 * activeTariff.sewerageCharge * 100) / 100
    const fixedCharge = activeTariff.fixedCharge
    const taxes = 0 // Configurar según necesidad
    
    // Calcular total sin redondear
    const totalBeforeRounding = waterCharge + sewerageCharge + fixedCharge + additionalCharges - discounts + taxes
    
    // Aplicar redondeo a múltiplos de 0.10
    const totalAmount = roundToTenCents(totalBeforeRounding)

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
        periodStart: startDate,
        periodEnd: endDate, // Guardar la fecha original, no la ajustada
        consumptionAmount: totalConsumptionM3, // Guardar en m³
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
        consumptions: {
          select: {
            id: true,
            amount: true,
            previousAmount: true,
            consumption: true,
            readingDate: true
          },
          orderBy: {
            readingDate: 'asc'
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