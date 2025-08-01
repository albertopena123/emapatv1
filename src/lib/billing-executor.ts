// src/lib/billing-executor.ts
import { prisma } from '@/lib/prisma'

// Constante para zona horaria de Perú
const PERU_OFFSET_HOURS = -5

// Convertir fecha UTC a hora de Perú
function toPeruTime(date: Date): Date {
  return new Date(date.getTime() + (PERU_OFFSET_HOURS * 60 * 60 * 1000))
}

// Convertir fecha de Perú a UTC para guardar en BD
function fromPeruTimeToUTC(date: Date): Date {
  return new Date(date.getTime() - (PERU_OFFSET_HOURS * 60 * 60 * 1000))
}

// Obtener inicio del día en hora de Perú
function getPeruDayStart(date: Date): Date {
  const peruDate = toPeruTime(date)
  peruDate.setHours(0, 0, 0, 0)
  return fromPeruTimeToUTC(peruDate)
}

// Obtener fin del día en hora de Perú
function getPeruDayEnd(date: Date): Date {
  const peruDate = toPeruTime(date)
  peruDate.setHours(23, 59, 59, 999)
  return fromPeruTimeToUTC(peruDate)
}

function roundToTenCents(amount: number): number {
  return Math.round(amount * 10) / 10
}

export async function executeBilling(configId: string) {
  const config = await prisma.billingConfig.findUnique({
    where: { id: configId }
  })

  if (!config || !config.isActive) {
    throw new Error('Configuración no válida')
  }

  const execution = await prisma.billingExecution.create({
    data: {
      configId,
      startedAt: new Date(), // Se guarda en UTC
      status: 'RUNNING',
      totalSensors: 0,
      processedCount: 0,
      successCount: 0,
      failedCount: 0
    }
  })

  try {
    const sensors = await prisma.sensor.findMany({
      where: {
        status: { in: config.sensorStatuses },
        tariffCategoryId: config.tariffCategories.length > 0 
          ? { in: config.tariffCategories }
          : undefined
      },
      include: {
        tariffCategory: {
          include: {
            tariffs: {
              where: { isActive: true },
              take: 1
            }
          }
        }
      }
    })

    await prisma.billingExecution.update({
      where: { id: execution.id },
      data: { totalSensors: sensors.length }
    })

    interface BillingError {
      sensorId: number
      numeroMedidor: string
      error: string
    }

    const errors: BillingError[] = []
    let successCount = 0
    let failedCount = 0

    for (const sensor of sensors) {
      try {
        const lastInvoice = await prisma.invoice.findFirst({
          where: { sensorId: sensor.id },
          orderBy: { periodEnd: 'desc' }
        })

        let periodStart: Date
        let periodEnd: Date

        if (lastInvoice) {
          // El período empieza un día después del último facturado
          periodStart = new Date(lastInvoice.periodEnd)
          periodStart.setDate(periodStart.getDate() + 1)
          periodStart = getPeruDayStart(periodStart)
        } else {
          const firstConsumption = await prisma.waterConsumption.findFirst({
            where: { 
              serial: sensor.numero_medidor,
              invoiced: false 
            },
            orderBy: { readingDate: 'asc' }
          })

          if (!firstConsumption) {
            throw new Error(`Sin consumos para facturar`)
          }

          periodStart = getPeruDayStart(firstConsumption.readingDate)
        }

        // Calcular fin del período basado en hora de Perú
        const nowPeru = toPeruTime(new Date())
        
        switch (config.billingCycle) {
          case 'DAILY':
            // Ayer en hora de Perú
            nowPeru.setDate(nowPeru.getDate() - 1)
            periodEnd = getPeruDayEnd(nowPeru)
            break
            
          case 'WEEKLY':
            // Hace 7 días
            nowPeru.setDate(nowPeru.getDate() - 7)
            periodEnd = getPeruDayEnd(nowPeru)
            break
            
          case 'MONTHLY':
            // Último día del mes anterior en hora de Perú
            nowPeru.setDate(1)
            nowPeru.setDate(0)
            periodEnd = getPeruDayEnd(nowPeru)
            break
            
          case 'QUARTERLY':
            // Último día del trimestre anterior
            const quarter = Math.floor(nowPeru.getMonth() / 3)
            nowPeru.setMonth(quarter * 3, 0)
            periodEnd = getPeruDayEnd(nowPeru)
            break
            
          case 'YEARLY':
            // 31 de diciembre del año anterior
            nowPeru.setFullYear(nowPeru.getFullYear() - 1, 11, 31)
            periodEnd = getPeruDayEnd(nowPeru)
            break
            
          default:
            periodEnd = getPeruDayEnd(new Date())
        }

        const activeTariff = sensor.tariffCategory.tariffs[0]
        if (!activeTariff) {
          throw new Error(`Sin tarifa activa`)
        }

        // Buscar consumos en el período (las fechas ya están en UTC en la BD)
        const consumptions = await prisma.waterConsumption.findMany({
          where: {
            serial: sensor.numero_medidor,
            readingDate: {
              gte: periodStart,
              lte: periodEnd
            },
            invoiced: false
          },
          orderBy: { readingDate: 'asc' }
        })

        if (consumptions.length === 0) {
          throw new Error(`Sin consumos en el período`)
        }

        // Calcular lectura anterior
        let lecturaAnterior = 0
        const firstConsumption = consumptions[0]
        if (firstConsumption.previousAmount !== null) {
          lecturaAnterior = firstConsumption.previousAmount
        } else {
          const previousReading = await prisma.waterConsumption.findFirst({
            where: {
              serial: sensor.numero_medidor,
              readingDate: {
                lt: periodStart
              }
            },
            select: { amount: true },
            orderBy: { readingDate: 'desc' }
          })
          if (previousReading) {
            lecturaAnterior = previousReading.amount
          }
        }
        
        const lecturaActual = consumptions[consumptions.length - 1].amount

        const totalConsumptionLiters = consumptions.reduce((sum, c) => sum + (c.consumption || 0), 0)
        const totalConsumptionM3 = totalConsumptionLiters / 1000

        if (totalConsumptionM3 === 0) {
          throw new Error(`Consumo cero`)
        }

        const waterCharge = Math.round(totalConsumptionM3 * activeTariff.waterCharge * 100) / 100
        const sewerageCharge = Math.round(totalConsumptionM3 * activeTariff.sewerageCharge * 100) / 100
        const fixedCharge = activeTariff.fixedCharge
        const taxes = 0
        
        const totalBeforeRounding = waterCharge + sewerageCharge + fixedCharge + taxes
        const totalAmount = roundToTenCents(totalBeforeRounding)

        const lastInvoiceNumber = await prisma.invoice.findFirst({
          orderBy: { id: "desc" },
          select: { invoiceNumber: true }
        })

        const lastNumber = lastInvoiceNumber ? parseInt(lastInvoiceNumber.invoiceNumber.split("-")[1]) : 0
        const invoiceNumber = `FAC-${String(lastNumber + 1).padStart(6, "0")}`

        // Fecha de vencimiento: 15 días desde hoy
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 15)

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            userId: sensor.userId,
            sensorId: sensor.id,
            tarifaId: activeTariff.id,
            periodStart,
            periodEnd,
            consumptionAmount: totalConsumptionM3,
            waterCharge,
            sewerageCharge,
            fixedCharge,
            additionalCharges: 0,
            discounts: 0,
            taxes,
            totalAmount,
            amountDue: totalAmount,
            dueDate,
            notes: `Facturación automática - ${config.name}`,
            metadata: JSON.parse(JSON.stringify({
              lecturaAnterior,
              lecturaActual,
              totalConsumptionLiters,
              // Agregar fechas en hora de Perú para referencia
              periodStartPeru: toPeruTime(periodStart).toISOString(),
              periodEndPeru: toPeruTime(periodEnd).toISOString()
            }))
          }
        })

        await prisma.waterConsumption.updateMany({
          where: {
            id: { in: consumptions.map(c => c.id) }
          },
          data: {
            invoiced: true,
            invoiceId: invoice.id
          }
        })

        successCount++
      } catch (error) {
        failedCount++
        errors.push({
          sensorId: sensor.id,
          numeroMedidor: sensor.numero_medidor,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }

      await prisma.billingExecution.update({
        where: { id: execution.id },
        data: {
          processedCount: successCount + failedCount,
          successCount,
          failedCount
        }
      })
    }

    const finalStatus = failedCount === 0 ? 'SUCCESS' : (successCount === 0 ? 'FAILED' : 'PARTIAL')
    
    await prisma.billingExecution.update({
      where: { id: execution.id },
      data: {
        completedAt: new Date(),
        status: finalStatus,
        errors: errors.length > 0 ? JSON.parse(JSON.stringify(errors)) : undefined,
        summary: JSON.parse(JSON.stringify({
          totalSensors: sensors.length,
          processed: successCount + failedCount,
          success: successCount,
          failed: failedCount,
          errors: errors.slice(0, 10)
        }))
      }
    })

    const nextRun = calculateNextRun(config)
    await prisma.billingConfig.update({
      where: { id: configId },
      data: {
        lastRun: new Date(),
        lastRunStatus: finalStatus,
        totalInvoices: { increment: successCount },
        nextRun
      }
    })

    if ((finalStatus === 'SUCCESS' && config.notifyOnSuccess) ||
        (finalStatus !== 'SUCCESS' && config.notifyOnError)) {
      console.log('Enviar notificaciones a:', config.notifyEmails)
    }

    return {
      executionId: execution.id,
      status: finalStatus,
      summary: {
        total: sensors.length,
        success: successCount,
        failed: failedCount
      }
    }

  } catch (error) {
    await prisma.billingExecution.update({
      where: { id: execution.id },
      data: {
        completedAt: new Date(),
        status: 'FAILED',
        errors: JSON.parse(JSON.stringify([{ general: (error as Error).message }]))
      }
    })

    throw error
  }
}

interface BillingConfigForCalculation {
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  billingDay: number
  billingHour: number
  billingMinute: number
  includeWeekends: boolean
}

function calculateNextRun(config: BillingConfigForCalculation): Date {
  // Trabajar con hora de Perú para el cálculo
  const nowPeru = toPeruTime(new Date())
  const nextPeru = new Date(nowPeru)
  
  nextPeru.setHours(config.billingHour, config.billingMinute, 0, 0)
  
  switch (config.billingCycle) {
    case 'DAILY':
      nextPeru.setDate(nextPeru.getDate() + 1)
      break
    case 'WEEKLY':
      nextPeru.setDate(nextPeru.getDate() + 7)
      break
    case 'MONTHLY':
      nextPeru.setMonth(nextPeru.getMonth() + 1)
      nextPeru.setDate(config.billingDay)
      break
    case 'QUARTERLY':
      nextPeru.setMonth(nextPeru.getMonth() + 3)
      nextPeru.setDate(config.billingDay)
      break
    case 'YEARLY':
      nextPeru.setFullYear(nextPeru.getFullYear() + 1)
      nextPeru.setMonth(0)
      nextPeru.setDate(config.billingDay)
      break
  }
  
  if (!config.includeWeekends) {
    const dayOfWeek = nextPeru.getDay()
    if (dayOfWeek === 0) nextPeru.setDate(nextPeru.getDate() + 1)
    else if (dayOfWeek === 6) nextPeru.setDate(nextPeru.getDate() + 2)
  }
  
  // Convertir de vuelta a UTC para guardar en BD
  return fromPeruTimeToUTC(nextPeru)
}