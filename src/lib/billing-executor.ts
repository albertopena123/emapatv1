// src/lib/billing-executor.ts
import { prisma } from '@/lib/prisma'

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
      startedAt: new Date(),
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
          periodStart = new Date(lastInvoice.periodEnd)
          periodStart.setDate(periodStart.getDate() + 1)
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

          periodStart = new Date(firstConsumption.readingDate)
        }

        periodEnd = new Date()
        switch (config.billingCycle) {
          case 'DAILY':
            periodEnd.setDate(periodEnd.getDate() - 1)
            break
          case 'WEEKLY':
            periodEnd.setDate(periodEnd.getDate() - 7)
            break
          case 'MONTHLY':
            periodEnd = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 0)
            break
          case 'QUARTERLY':
            periodEnd = new Date(periodEnd.getFullYear(), Math.floor(periodEnd.getMonth() / 3) * 3, 0)
            break
          case 'YEARLY':
            periodEnd = new Date(periodEnd.getFullYear() - 1, 11, 31)
            break
        }

        periodEnd.setHours(23, 59, 59, 999)

        const activeTariff = sensor.tariffCategory.tariffs[0]
        if (!activeTariff) {
          throw new Error(`Sin tarifa activa`)
        }

        const adjustedEndDate = new Date(periodEnd.getTime() + (5 * 60 * 60 * 1000))
        
        const consumptions = await prisma.waterConsumption.findMany({
          where: {
            serial: sensor.numero_medidor,
            readingDate: {
              gte: periodStart,
              lte: adjustedEndDate
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
              totalConsumptionLiters
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
  const now = new Date()
  const next = new Date()
  
  next.setHours(config.billingHour, config.billingMinute, 0, 0)
  
  switch (config.billingCycle) {
    case 'DAILY':
      next.setDate(next.getDate() + 1)
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      break
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1)
      next.setDate(config.billingDay)
      break
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3)
      next.setDate(config.billingDay)
      break
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1)
      next.setMonth(0)
      next.setDate(config.billingDay)
      break
  }
  
  if (!config.includeWeekends) {
    const dayOfWeek = next.getDay()
    if (dayOfWeek === 0) next.setDate(next.getDate() + 1)
    else if (dayOfWeek === 6) next.setDate(next.getDate() + 2)
  }
  
  return next
}