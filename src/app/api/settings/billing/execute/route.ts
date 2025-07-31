// src/app/api/settings/billing/execute/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

function roundToTenCents(amount: number): number {
  return Math.round(amount * 10) / 10
}

// POST - Ejecutar facturación para una configuración específica
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const canExecute = await hasPermission(user.userId, 'billing', 'execute', 'invoice')
    if (!canExecute) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { configId } = await request.json()

    // Obtener configuración
    const config = await prisma.billingConfig.findUnique({
      where: { id: configId }
    })

    if (!config || !config.isActive) {
      return NextResponse.json({ error: 'Configuración no válida' }, { status: 400 })
    }

    // Crear registro de ejecución
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
      // Obtener sensores activos
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

      // Procesar cada sensor
      for (const sensor of sensors) {
        try {
          // Obtener última factura del sensor
          const lastInvoice = await prisma.invoice.findFirst({
            where: { sensorId: sensor.id },
            orderBy: { periodEnd: 'desc' }
          })

          // Calcular período
          let periodStart: Date
          let periodEnd: Date

          if (lastInvoice) {
            // Si hay factura previa, comenzar desde el día siguiente
            periodStart = new Date(lastInvoice.periodEnd)
            periodStart.setDate(periodStart.getDate() + 1)
          } else {
            // Si no hay factura previa, buscar el primer consumo
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

          // Calcular fin de período según configuración
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

          // Ajustar hora al final del día
          periodEnd.setHours(23, 59, 59, 999)

          // Obtener tarifa activa
          const activeTariff = sensor.tariffCategory.tariffs[0]
          if (!activeTariff) {
            throw new Error(`Sin tarifa activa`)
          }

          // Obtener consumos del período
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

          // Calcular consumo total
          const totalConsumptionLiters = consumptions.reduce((sum, c) => sum + (c.consumption || 0), 0)
          const totalConsumptionM3 = totalConsumptionLiters / 1000

          if (totalConsumptionM3 === 0) {
            throw new Error(`Consumo cero`)
          }

          // Calcular importes
          const waterCharge = Math.round(totalConsumptionM3 * activeTariff.waterCharge * 100) / 100
          const sewerageCharge = Math.round(totalConsumptionM3 * activeTariff.sewerageCharge * 100) / 100
          const fixedCharge = activeTariff.fixedCharge
          const taxes = 0
          
          const totalBeforeRounding = waterCharge + sewerageCharge + fixedCharge + taxes
          const totalAmount = roundToTenCents(totalBeforeRounding)

          // Generar número de factura
          const lastInvoiceNumber = await prisma.invoice.findFirst({
            orderBy: { id: "desc" },
            select: { invoiceNumber: true }
          })

          const lastNumber = lastInvoiceNumber ? parseInt(lastInvoiceNumber.invoiceNumber.split("-")[1]) : 0
          const invoiceNumber = `FAC-${String(lastNumber + 1).padStart(6, "0")}`

          // Calcular fecha de vencimiento (15 días)
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 15)

          // Crear factura
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
              notes: `Facturación automática - ${config.name}`
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

          successCount++
        } catch (error) {
          failedCount++
          errors.push({
            sensorId: sensor.id,
            numeroMedidor: sensor.numero_medidor,
            error: error instanceof Error ? error.message : 'Error desconocido'
          })
        }

        // Actualizar progreso
        await prisma.billingExecution.update({
          where: { id: execution.id },
          data: {
            processedCount: successCount + failedCount,
            successCount,
            failedCount
          }
        })
      }

      // Finalizar ejecución
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

      // Actualizar configuración
      await prisma.billingConfig.update({
        where: { id: configId },
        data: {
          lastRun: new Date(),
          lastRunStatus: finalStatus,
          totalInvoices: { increment: successCount },
          nextRun: calculateNextRun(config)
        }
      })

      // Enviar notificaciones si está configurado
      if ((finalStatus === 'SUCCESS' && config.notifyOnSuccess) ||
          (finalStatus !== 'SUCCESS' && config.notifyOnError)) {
        // Aquí implementar envío de emails
        console.log('Enviar notificaciones a:', config.notifyEmails)
      }

      return NextResponse.json({
        executionId: execution.id,
        status: finalStatus,
        summary: {
          total: sensors.length,
          success: successCount,
          failed: failedCount
        }
      })

    } catch (error) {
      // Error general en la ejecución
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

  } catch (error) {
    console.error("Error executing billing:", error)
    return NextResponse.json(
      { error: "Error al ejecutar facturación" },
      { status: 500 }
    )
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