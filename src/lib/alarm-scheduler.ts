// src/lib/alarm-scheduler.ts
import * as schedule from 'node-schedule'
import { checkAlarms } from './alarm-checker'

export class AlarmScheduler {
  private job: schedule.Job | null = null

  async init() {
    console.log('Inicializando scheduler de alarmas...')
    
    // Ejecutar verificación cada minuto
    this.job = schedule.scheduleJob('* * * * *', async () => {
      console.log('Ejecutando verificación de alarmas programada')
      await checkAlarms()
    })
    
    // Ejecutar verificación inicial
    await checkAlarms()
    
    console.log('Scheduler de alarmas iniciado - Verificación cada minuto')
  }

  stop() {
    if (this.job) {
      this.job.cancel()
      this.job = null
      console.log('Scheduler de alarmas detenido')
    }
  }
}

let scheduler: AlarmScheduler | null = null

export async function initAlarmScheduler() {
  if (typeof window !== 'undefined') return
  if (scheduler) return
  
  scheduler = new AlarmScheduler()
  await scheduler.init()
}