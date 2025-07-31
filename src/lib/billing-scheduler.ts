// src/lib/billing-scheduler.ts
// npm install node-schedule @types/node-schedule
import * as schedule from 'node-schedule'
import { prisma } from '@/lib/prisma'
import { executeBilling } from '@/lib/billing-executor'

interface BillingConfigSchedule {
  id: string
  name: string
  isActive: boolean
  billingDay: number
  billingHour: number
  billingMinute: number
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
}

export class BillingScheduler {
  private jobs: Map<string, schedule.Job> = new Map()

  async init() {
    console.log('Inicializando scheduler de facturación...')
    
    // Cargar configuraciones activas
    const configs = await prisma.billingConfig.findMany({
      where: { isActive: true }
    })

    for (const config of configs) {
      this.scheduleJob(config as BillingConfigSchedule)
    }
  }

  scheduleJob(config: BillingConfigSchedule) {
    // Cancelar job anterior si existe
    if (this.jobs.has(config.id)) {
      this.jobs.get(config.id)?.cancel()
    }

    // Crear regla según el ciclo
    let rule: schedule.RecurrenceRule | string

    switch (config.billingCycle) {
      case 'DAILY':
        rule = new schedule.RecurrenceRule()
        rule.hour = config.billingHour
        rule.minute = config.billingMinute
        break
      
      case 'WEEKLY':
        rule = new schedule.RecurrenceRule()
        rule.dayOfWeek = config.billingDay // 0-6
        rule.hour = config.billingHour
        rule.minute = config.billingMinute
        break
      
      case 'MONTHLY':
        rule = new schedule.RecurrenceRule()
        rule.date = config.billingDay
        rule.hour = config.billingHour
        rule.minute = config.billingMinute
        break
      
      default:
        // Para QUARTERLY y YEARLY usar cron
        rule = this.getCronExpression(config)
    }

    // Programar el job
    const job = schedule.scheduleJob(rule, async () => {
      console.log(`Ejecutando facturación: ${config.name}`)
      
      try {
        const result = await executeBilling(config.id)
        console.log(`Facturación completada: ${result.summary.success} exitosas`)
      } catch (error) {
        console.error(`Error en facturación ${config.name}:`, error)
      }
    })

    if (job) {
      this.jobs.set(config.id, job)
      console.log(`Job programado: ${config.name} - Próxima ejecución: ${job.nextInvocation()}`)
    }
  }

  private getCronExpression(config: BillingConfigSchedule): string {
    const { billingMinute, billingHour, billingDay } = config
    
    switch (config.billingCycle) {
      case 'QUARTERLY':
        // Ejecutar el día X de los meses 1,4,7,10
        return `${billingMinute} ${billingHour} ${billingDay} 1,4,7,10 *`
      
      case 'YEARLY':
        // Ejecutar el día X de enero
        return `${billingMinute} ${billingHour} ${billingDay} 1 *`
      
      default:
        return `${billingMinute} ${billingHour} * * *` // Diario por defecto
    }
  }

  // Recargar configuración cuando cambie
  async reload(configId?: string) {
    if (configId) {
      const config = await prisma.billingConfig.findUnique({
        where: { id: configId }
      })
      
      if (config) {
        this.scheduleJob(config as BillingConfigSchedule)
      }
    } else {
      // Recargar todas
      await this.init()
    }
  }

  // Detener todos los jobs
  stop() {
    this.jobs.forEach(job => job.cancel())
    this.jobs.clear()
    console.log('Scheduler detenido')
  }
}

// Instancia global
let scheduler: BillingScheduler | null = null

export async function initBillingScheduler() {
  if (typeof window !== 'undefined') return
  if (scheduler) return
  
  scheduler = new BillingScheduler()
  await scheduler.init()
  
  // Exportar para poder recargar cuando cambien configuraciones
  const globalWithScheduler = global as typeof globalThis & {
    billingScheduler: BillingScheduler
  }
  globalWithScheduler.billingScheduler = scheduler
}

export function getBillingScheduler(): BillingScheduler | null {
  return scheduler
}