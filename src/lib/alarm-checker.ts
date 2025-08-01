// src/lib/alarm-checker.ts
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { AlarmType, AlarmSeverity } from '@prisma/client'

interface AlarmSettingsWithUser {
  userId: string
  dailyAlarmActive: boolean
  weeklyAlarmActive: boolean
  monthlyAlarmActive: boolean
  dailyConsumptionLimit: number
  weeklyConsumptionLimit: number
  monthlyConsumptionLimit: number | null
  user: {
    sensors: Array<{
      id: number
      numero_medidor: string
      status: string
    }>
  }
}

export async function checkAlarms() {
  console.log('Verificando alarmas de consumo...')
  
  try {
    // Obtener todas las configuraciones activas
    const activeSettings = await prisma.alarmSettings.findMany({
      where: {
        OR: [
          { dailyAlarmActive: true },
          { weeklyAlarmActive: true },
          { monthlyAlarmActive: true }
        ]
      },
      include: {
        user: {
          include: {
            sensors: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    })

    for (const settings of activeSettings) {
      await checkUserAlarms(settings as AlarmSettingsWithUser)
    }
    
    console.log('Verificación de alarmas completada')
  } catch (error) {
    console.error('Error verificando alarmas:', error)
  }
}

async function checkUserAlarms(settings: AlarmSettingsWithUser) {
  const now = new Date()
  
  for (const sensor of settings.user.sensors) {
    // Verificar alarma diaria
    if (settings.dailyAlarmActive) {
      const dailyConsumption = await getConsumption(
        sensor.numero_medidor,
        startOfDay(now),
        endOfDay(now)
      )
      
      if (dailyConsumption > settings.dailyConsumptionLimit) {
        await createAlarm({
          userId: settings.userId,
          sensorId: sensor.id,
          alarmType: AlarmType.DAILY_CONSUMPTION,
          severity: AlarmSeverity.WARNING,
          title: 'Límite diario excedido',
          description: `El consumo diario (${dailyConsumption.toFixed(2)}L) superó el límite configurado (${settings.dailyConsumptionLimit}L)`,
          value: dailyConsumption,
          threshold: settings.dailyConsumptionLimit
        })
      }
    }
    
    // Verificar alarma semanal
    if (settings.weeklyAlarmActive) {
      const weeklyConsumption = await getConsumption(
        sensor.numero_medidor,
        startOfWeek(now, { weekStartsOn: 1 }),
        endOfWeek(now, { weekStartsOn: 1 })
      )
      
      if (weeklyConsumption > settings.weeklyConsumptionLimit) {
        await createAlarm({
          userId: settings.userId,
          sensorId: sensor.id,
          alarmType: AlarmType.WEEKLY_CONSUMPTION,
          severity: AlarmSeverity.WARNING,
          title: 'Límite semanal excedido',
          description: `El consumo semanal (${weeklyConsumption.toFixed(2)}L) superó el límite configurado (${settings.weeklyConsumptionLimit}L)`,
          value: weeklyConsumption,
          threshold: settings.weeklyConsumptionLimit
        })
      }
    }
    
    // Verificar alarma mensual
    if (settings.monthlyAlarmActive && settings.monthlyConsumptionLimit) {
      const monthlyConsumption = await getConsumption(
        sensor.numero_medidor,
        startOfMonth(now),
        endOfMonth(now)
      )
      
      if (monthlyConsumption > settings.monthlyConsumptionLimit) {
        await createAlarm({
          userId: settings.userId,
          sensorId: sensor.id,
          alarmType: AlarmType.MONTHLY_CONSUMPTION,
          severity: AlarmSeverity.CRITICAL,
          title: 'Límite mensual excedido',
          description: `El consumo mensual (${monthlyConsumption.toFixed(2)}L) superó el límite configurado (${settings.monthlyConsumptionLimit}L)`,
          value: monthlyConsumption,
          threshold: settings.monthlyConsumptionLimit
        })
      }
    }
  }
}

async function getConsumption(serial: string, startDate: Date, endDate: Date): Promise<number> {
  const consumptions = await prisma.waterConsumption.findMany({
    where: {
      serial,
      readingDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      consumption: true
    }
  })
  
  return consumptions.reduce((sum, c) => sum + (c.consumption || 0), 0)
}

interface CreateAlarmData {
  userId: string
  sensorId: number
  alarmType: AlarmType
  severity: AlarmSeverity
  title: string
  description: string
  value: number
  threshold: number
}

async function createAlarm(data: CreateAlarmData) {
  // Verificar si ya existe una alarma similar no resuelta
  const existingAlarm = await prisma.alarmHistory.findFirst({
    where: {
      userId: data.userId,
      sensorId: data.sensorId,
      alarmType: data.alarmType,
      resolved: false,
      timestamp: {
        gte: subDays(new Date(), 1) // No duplicar alarmas del mismo día
      }
    }
  })
  
  if (existingAlarm) {
    console.log(`Alarma ya existe para ${data.title}`)
    return
  }
  
  // Crear nueva alarma
  const alarm = await prisma.alarmHistory.create({
    data: {
      userId: data.userId,
      sensorId: data.sensorId,
      alarmType: data.alarmType,
      severity: data.severity,
      title: data.title,
      description: data.description,
      value: data.value,
      threshold: data.threshold,
      timestamp: new Date()
    }
  })
  
  console.log(`Alarma creada: ${data.title}`)
  
  // TODO: Enviar notificaciones según configuración
  // if (settings.notifyByEmail) { ... }
}